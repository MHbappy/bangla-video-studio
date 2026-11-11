// npm run ui — ব্রাউজারে রিসোর্স ম্যানেজার: ব্র্যান্ড তথ্য, লোগো/QR, মিউজিক, B-roll, নতুন ভিডিও
// শুধু এই কম্পিউটারে চলে (127.0.0.1) — ফাইলগুলো ঠিক ফোল্ডারে সেভ করে, বাকি কাজ Claude/কমান্ডের
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { BrandFile } from "../src/timeline-types";
import { readJson, writeJson } from "./lib";
import { probeVideo } from "./media";
import { isSlug, LIBRARY, MEDIA, opt, setCurrent, VIDEOS, vpath } from "./paths";

const require = createRequire(import.meta.url);
const PORT = Number(opt("port") ?? process.env.PORT ?? 4321);
const BRAND_DIR = path.join(LIBRARY, "brand");
const BRAND_JSON = path.join(BRAND_DIR, "brand.json");
const FONT_DIR = path.join(path.dirname(require.resolve("@fontsource/hind-siliguri/package.json")), "files");
const UPLOADS = path.join(MEDIA, ".uploads");
const BIN = path.join(MEDIA, ".removed"); // সরানো মিউজিক/B-roll — মোছা হয় না, এখানে থাকে

const IMAGE = /\.(png|jpe?g|webp|svg)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i;
const AUDIO = /\.(mp3|m4a|wav|aac|ogg)$/i;
// B-roll: assets/plan যা চেনে শুধু তাই (SVG শুধু লোগো/QR-এ চলে — B-roll-এ দিলে Claude দেখতেই পেত না)
const BROLL = /\.(png|jpe?g|webp)$|\.(mp4|mov|m4v|webm|mkv)$/i;
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8", ".woff2": "font/woff2",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".aac": "audio/aac", ".ogg": "audio/ogg",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/mp4", ".webm": "video/webm", ".mkv": "video/x-matroska",
};

// ফাইলের নাম: অক্ষর/সংখ্যা/.-_ ছাড়া সব "-" (ফোল্ডার-পথ কখনো নয়)
const cleanName = (name: string) =>
  path.basename(name).normalize("NFC").trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{M}\p{N}._-]+/gu, "-").replace(/-+/g, "-").replace(/^[-.]+/, "");

const listFiles = (dir: string, re: RegExp) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => re.test(f) && !f.startsWith("."))
        .sort()
        .map((f) => ({ name: f, size: statSync(path.join(dir, f)).size, url: `/media/${path.relative(MEDIA, path.join(dir, f)).split(path.sep).join("/")}` }))
    : [];

const findBrandImage = (stem: string) => listFiles(BRAND_DIR, IMAGE).find((f) => path.parse(f.name).name === stem);

// ফাইল কখনো মোছা হয় না — bin ফোল্ডারে <নাম>-<সময়>.<ext> হয়ে সরে যায় (দরকার হলে ফেরত আনা যায়)
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
const retire = (file: string, bin: string) => {
  mkdirSync(bin, { recursive: true });
  const { name, ext } = path.parse(file);
  let dest = path.join(bin, `${name}-${stamp()}${ext}`);
  for (let i = 2; existsSync(dest); i++) dest = path.join(bin, `${name}-${stamp()}-${i}${ext}`);
  renameSync(file, dest);
};
// media/library/music → media/.removed/library/music (assets স্ক্যানের বাইরে)
const binFor = (dir: string) => path.join(BIN, path.relative(MEDIA, dir));

// logo.* / qr.* → brand/.removed/; কয়টা সরল তা ফেরত দেয়
const retireBrandImage = (stem: string) => {
  const files = listFiles(BRAND_DIR, IMAGE).filter((f) => path.parse(f.name).name === stem);
  for (const f of files) retire(path.join(BRAND_DIR, f.name), path.join(BRAND_DIR, ".removed"));
  return files.length;
};

// ---- পেছনের কাজ (npm run new / transcribe) — লগ মেমরিতে, পেজ প্রতি ২ সেকেন্ডে দেখে ----
// একটার পর একটা চলে: একসাথে দুটো Whisper চললে মেমরি আর গতি দুটোই যায়
type Job = { slug: string; log: string; done: boolean; ok: boolean; waiting: boolean };
const jobs = new Map<string, Job>();
const busy = (slug: string) => Boolean(jobs.get(slug) && !jobs.get(slug)!.done);
let lane: Promise<void> = Promise.resolve();
const startJob = (slug: string, script: string, args: string[], after?: () => void) => {
  const job: Job = { slug, log: "", done: false, ok: false, waiting: true };
  jobs.set(slug, job);
  lane = lane.then(
    () =>
      new Promise<void>((next) => {
        job.waiting = false;
        const child = spawn(process.execPath, [require.resolve("tsx/cli"), path.join("scripts", script), slug, ...args], { env: process.env });
        const add = (b: Buffer | string) => (job.log = (job.log + b.toString()).slice(-20000));
        child.stdout.on("data", add);
        child.stderr.on("data", add);
        const end = (ok: boolean) => {
          if (job.done) return;
          job.done = true;
          job.ok = ok;
          after?.();
          next();
        };
        child.on("error", (e) => {
          add(`✗ ${e.message}\n`);
          end(false);
        });
        child.on("close", (code) => end(code === 0));
      }),
  );
};

type Project = { aroll: string; durationInFrames: number; fps: number; width: number; height: number };
const readProject = (slug: string): Project | null => {
  try {
    return readJson<Project>(vpath(slug, "project.json"));
  } catch {
    return null; // নেই বা ভাঙা — পুরো পেজ যেন না আটকায়
  }
};
const videoState = (slug: string) => {
  const has = (...p: string[]) => existsSync(vpath(slug, ...p));
  const project = readProject(slug);
  const steps = {
    aroll: Boolean(project && has(project.aroll)),
    transcribed: has("work", "raw.json"),
    transcript: has("transcript.json"),
    captions: has("captions.json"),
    edit: has("edit.json"),
    timeline: has("timeline.json"),
    rendered: has("output", "final.mp4"),
  };
  return {
    slug,
    durationSec: project ? project.durationInFrames / project.fps : null,
    size: project ? `${project.width}×${project.height}` : null,
    steps,
    notes: has("notes.md") ? readFileSync(vpath(slug, "notes.md"), "utf8") : "",
    broll: listFiles(vpath(slug, "broll"), BROLL),
    music: listFiles(vpath(slug, "music"), AUDIO),
    thumbs: [...listFiles(vpath(slug, "output", "thumbs"), IMAGE), ...listFiles(vpath(slug, "output"), /^thumbnail\.jpg$/)],
    job: jobs.get(slug) ?? null,
  };
};

const state = () => ({
  brand: existsSync(BRAND_JSON) ? readJson<BrandFile>(BRAND_JSON) : {},
  logo: findBrandImage("logo") ?? null,
  qr: findBrandImage("qr") ?? null,
  library: { music: listFiles(path.join(LIBRARY, "music"), AUDIO), broll: listFiles(path.join(LIBRARY, "broll"), BROLL) },
  // তৈরি হওয়া ভিডিও + যেগুলো এখন প্রসেস হচ্ছে (বা ব্যর্থ হয়েছে)
  videos: [...new Set([...(existsSync(VIDEOS) ? readdirSync(VIDEOS).filter((d) => existsSync(vpath(d, "project.json"))) : []), ...jobs.keys()])]
    .sort()
    .map(videoState),
  current: existsSync(path.join(MEDIA, ".current")) ? readFileSync(path.join(MEDIA, ".current"), "utf8").trim() : "",
});

// ---- ব্র্যান্ড সেভ: পেজের ঘরগুলো যাচাই করে brand.json-এ (অজানা কী থাকলে রেখে দেয়) ----
const saveBrand = (body: Record<string, unknown>) => {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown, lo: number, hi: number, d: number) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : d);
  const old = existsSync(BRAND_JSON) ? readJson<BrandFile>(BRAND_JSON) : {};
  const bar = body.contactBar as Record<string, unknown> | false;
  const next: BrandFile = {
    ...old,
    name: str(body.name),
    address: str(body.address),
    phone: str(body.phone),
    phoneLabel: str(body.phoneLabel),
    social: (["facebook", "whatsapp", "youtube", "web"] as const).map((type) => ({
      type,
      text: str((body.social as Record<string, unknown> | undefined)?.[type]),
    })),
    logoPosition: (["top-left", "top-right", "bottom-left", "bottom-right"] as const).find((c) => c === body.logoPosition) ?? "top-right",
    logoSize: num(body.logoSize, 30, 240, 80),
    logoOpacity: num(body.logoOpacity, 0.1, 1, 0.9),
    contactBar:
      bar === false
        ? false
        : { start: num(bar?.start, 0, 3600, 4), every: num(bar?.every, 4, 3600, 30), duration: num(bar?.duration, 2, 60, 7), atEnd: bar?.atEnd !== false },
  };
  if (next.contactBar && (next.contactBar.every ?? 30) < (next.contactBar.duration ?? 7) + 2) throw new Error(`"কতক্ষণ পরপর" কমপক্ষে "কতক্ষণ থাকবে" + ২ সেকেন্ড হতে হবে`);
  writeJson(BRAND_JSON, next);
};

// ---- আপলোড/সরানো: কোন জিনিস কোন ফোল্ডারে ----
const FOLDERS = new Map<string, { re: RegExp; what: string; perVideo: boolean; dir: (slug: string) => string }>([
  ["library-music", { re: AUDIO, what: "অডিও", perVideo: false, dir: () => path.join(LIBRARY, "music") }],
  ["library-broll", { re: BROLL, what: "ভিডিও বা ছবি", perVideo: false, dir: () => path.join(LIBRARY, "broll") }],
  ["video-broll", { re: BROLL, what: "ভিডিও বা ছবি", perVideo: true, dir: (slug) => vpath(slug, "broll") }],
  ["video-music", { re: AUDIO, what: "অডিও", perVideo: true, dir: (slug) => vpath(slug, "music") }],
]);
const extList = (re: RegExp) => re.source.replace(/\\\.|\\|\(|\)|\$|\?/g, "").replace(/\|/g, ", ");
const needVideo = (slug: string) => {
  if (!isSlug(slug) || !existsSync(vpath(slug, "project.json"))) throw new Error(`ভিডিও "${slug}" নেই`);
};
const folder = (kind: string, slug: string) => {
  const f = FOLDERS.get(kind);
  if (!f) throw new Error(`অজানা ধরন: ${kind}`);
  if (f.perVideo) needVideo(slug);
  return { ...f, dir: f.dir(slug) };
};
const target = (kind: string, slug: string, name: string): { dir: string; file: string; stem?: string } => {
  if (kind === "logo" || kind === "qr") {
    if (!IMAGE.test(name)) throw new Error(`ছবি হতে হবে (${extList(IMAGE)})`);
    return { dir: BRAND_DIR, file: `${kind}${path.extname(name).toLowerCase()}`, stem: kind };
  }
  const f = folder(kind, slug);
  if (!f.re.test(name)) throw new Error(`${f.what} হতে হবে (${extList(f.re)})`);
  return { dir: f.dir, file: name };
};

// আপলোডের বডি → ডিস্কে; আধা-আপলোড বা খালি ফাইল রেখে দেয় না
const receive = async (req: IncomingMessage, file: string) => {
  try {
    await pipeline(req, createWriteStream(file));
    if (!statSync(file).size) throw new Error("ফাইলটা খালি");
  } catch (e) {
    rmSync(file, { force: true });
    throw e;
  }
};

// শুধু এই কম্পিউটারের এই পেজ থেকে: অন্য ওয়েবসাইট ব্রাউজার দিয়ে localhost-এ ফাইল পাঠাতে বা পড়তে পারবে না
const trusted = (req: IncomingMessage) => {
  const host = req.headers.host ?? "";
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host.replace(/:\d+$/, ""))) return false;
  const origin = req.headers.origin;
  return req.method === "GET" || !origin || origin === `http://${host}`;
};

const send = (res: ServerResponse, code: number, data: unknown) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};
const readBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
};
// Range সহ — অডিও/ভিডিওতে টেনে সামনে-পেছনে যাওয়া যায় (Safari Range ছাড়া বাজায়ই না)
const serveFile = (req: IncomingMessage, res: ServerResponse, file: string) => {
  if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: "পাওয়া যায়নি" });
  const { size } = statSync(file);
  const head = { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store", "accept-ranges": "bytes" };
  const pipe = (code: number, extra: Record<string, string | number>, range?: { start: number; end: number }) => {
    res.writeHead(code, { ...head, ...extra });
    createReadStream(file, range).on("error", () => res.destroy()).pipe(res);
  };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (!m || (!m[1] && !m[2])) return pipe(200, { "content-length": size });
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start > end) {
    res.writeHead(416, { "content-range": `bytes */${size}` });
    return res.end();
  }
  pipe(206, { "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 }, { start, end });
};
// /media/... শুধু media/ ফোল্ডারের ভেতরে
const inside = (root: string, rel: string) => {
  const full = path.resolve(root, rel);
  return full.startsWith(path.resolve(root) + path.sep) ? full : null;
};

const server = createServer(async (req, res) => {
  if (!trusted(req)) {
    req.resume();
    return send(res, 403, { error: "শুধু এই কম্পিউটারের রিসোর্স ম্যানেজার পেজ থেকে" });
  }
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const q = (k: string) => url.searchParams.get(k) ?? "";
  try {
    if (req.method === "GET" && url.pathname === "/") return serveFile(req, res, path.resolve("ui", "index.html"));
    if (req.method === "GET" && url.pathname.startsWith("/font/")) {
      const f = inside(FONT_DIR, decodeURIComponent(url.pathname.slice(6)));
      return f ? serveFile(req, res, f) : send(res, 404, {});
    }
    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      const f = inside(MEDIA, decodeURIComponent(url.pathname.slice(7)));
      return f ? serveFile(req, res, f) : send(res, 404, {});
    }
    if (req.method === "GET" && url.pathname === "/api/state") return send(res, 200, state());

    if (req.method === "POST" && url.pathname === "/api/brand") {
      saveBrand(JSON.parse(await readBody(req)));
      return send(res, 200, state());
    }

    if (req.method === "POST" && url.pathname === "/api/notes") {
      const slug = q("slug");
      needVideo(slug);
      const text = (await readBody(req)).trim();
      if (text) writeFileSync(vpath(slug, "notes.md"), text + "\n", "utf8");
      else rmSync(vpath(slug, "notes.md"), { force: true });
      return send(res, 200, state());
    }

    // ফাইল আপলোড: বডি = ফাইল নিজেই (বড় ভিডিওও সরাসরি ডিস্কে)
    if (req.method === "POST" && url.pathname === "/api/upload") {
      const name = cleanName(q("name"));
      if (!name || !path.extname(name)) throw new Error("ফাইলের নাম ঠিক নেই");
      const t = target(q("kind"), q("slug"), name);
      const dest = path.join(t.dir, t.file);
      if (!t.stem && existsSync(dest) && q("overwrite") !== "1") return send(res, 409, { error: `"${t.file}" নামে আগে থেকেই আছে`, exists: true });
      mkdirSync(t.dir, { recursive: true });
      const tmp = path.join(t.dir, `.${t.file}.part`);
      await receive(req, tmp);
      // বদলালে পুরনোটা মুছে যায় না: লোগো/QR (অন্য ফরম্যাটে থাকলেও) → brand/.removed/, বাকিগুলো → media/.removed/
      if (t.stem) retireBrandImage(t.stem);
      else if (existsSync(dest)) retire(dest, binFor(t.dir));
      renameSync(tmp, dest);
      // brand.json-এ অন্য নামের লোগো/QR লেখা থাকলে সেটা মুছে দিই — এখন logo.* / qr.* নিজে থেকে ধরা হবে
      if (t.stem && existsSync(BRAND_JSON)) {
        const b = readJson<BrandFile>(BRAND_JSON);
        if (typeof b[t.stem as "logo" | "qr"] === "string") {
          delete b[t.stem as "logo" | "qr"];
          writeJson(BRAND_JSON, b);
        }
      }
      return send(res, 200, { saved: path.relative(".", dest), state: state() });
    }

    // নতুন ভিডিও: ফুটেজ আপলোড → npm run new (ট্রান্সক্রিপশনসহ, পেছনে চলে)
    if (req.method === "POST" && url.pathname === "/api/new") {
      const slug = q("slug");
      const name = cleanName(q("name"));
      if (!isSlug(slug)) throw new Error("নাম শুধু ছোট ইংরেজি অক্ষর, সংখ্যা আর - দিয়ে (যেমন laser-machine)");
      if (existsSync(vpath(slug, "project.json"))) throw new Error(`"${slug}" আগে থেকেই আছে — অন্য নাম দিন`);
      if (busy(slug)) throw new Error(`"${slug}" এখনো প্রসেস হচ্ছে`);
      if (!VIDEO.test(name)) throw new Error(`ভিডিও ফাইল দিন (${extList(VIDEO)})`);
      mkdirSync(UPLOADS, { recursive: true });
      const file = path.join(UPLOADS, `${slug}${path.extname(name).toLowerCase()}`);
      await receive(req, file);
      startJob(slug, "new.ts", [file], () => rmSync(file, { force: true })); // new কমান্ড নিজের কপি রেখেছে
      return send(res, 200, state());
    }

    // হারানো ফুটেজ আবার দেওয়া: ভিডিওর ফোল্ডার আছে কিন্তু aroll নেই (যেমন অন্য কম্পিউটার থেকে বড় ফাইল ছাড়া কপি)
    // ট্রান্সক্রিপ্ট আগে থেকে থাকলে শুধু একই দৈর্ঘ্যের ফুটেজ নেয়; না থাকলে ট্রান্সক্রাইব শুরু করে
    if (req.method === "POST" && url.pathname === "/api/aroll") {
      const slug = q("slug");
      const name = cleanName(q("name"));
      needVideo(slug);
      if (busy(slug)) throw new Error(`"${slug}" এখনো প্রসেস হচ্ছে`);
      if (!VIDEO.test(name)) throw new Error(`ভিডিও ফাইল দিন (${extList(VIDEO)})`);
      const project = readProject(slug);
      if (!project) throw new Error(`"${slug}"-এর project.json পড়া যায়নি`);
      if (existsSync(vpath(slug, project.aroll))) throw new Error("এই ভিডিওর ফুটেজ আগে থেকেই আছে");
      const file = `aroll${path.extname(name).toLowerCase()}`;
      const tmp = vpath(slug, `.upload-${file}`);
      await receive(req, tmp);
      let info: ReturnType<typeof probeVideo>;
      try {
        info = probeVideo(tmp);
      } catch {
        rmSync(tmp, { force: true });
        throw new Error("ভিডিওটা পড়া যায়নি — ফাইল ঠিক আছে তো?");
      }
      const hasText = existsSync(vpath(slug, "work", "raw.json")) || existsSync(vpath(slug, "transcript.json"));
      const was = project.durationInFrames / project.fps;
      if (hasText && Math.abs(info.durationSec - was) > 0.5) {
        rmSync(tmp, { force: true });
        throw new Error(`এই ফুটেজ ${info.durationSec.toFixed(1)} সেকেন্ডের, আগেরটা ছিল ${was.toFixed(1)} — ক্যাপশনের সময় মিলবে না। অন্য কাট হলে নতুন নামে নতুন ভিডিও হিসেবে দিন।`);
      }
      renameSync(tmp, vpath(slug, file));
      writeJson(vpath(slug, "project.json"), { ...project, aroll: file, width: info.width, height: info.height, fps: info.fps, durationInFrames: Math.ceil(info.durationSec * info.fps) });
      const warn = [info.warn, hasText && existsSync(vpath(slug, "timeline.json")) && info.fps !== project.fps && `ফ্রেমরেট বদলেছে (${project.fps} → ${info.fps}) — npm run plan -- ${slug} আবার চালান`].filter(Boolean).join(" · ");
      if (!hasText) startJob(slug, "transcribe.ts", []);
      return send(res, 200, { saved: path.relative(".", vpath(slug, file)), warn, state: state() });
    }

    // সরানো: মুছে ফেলা নয় — লোগো/QR → brand/.removed/, মিউজিক/B-roll → media/.removed/ (দরকার হলে ফেরত আনা যায়)
    if (req.method === "POST" && url.pathname === "/api/remove") {
      const kind = q("kind");
      if (kind === "logo" || kind === "qr") {
        if (!retireBrandImage(kind)) throw new Error(`${kind === "logo" ? "লোগো" : "QR"} নেই`);
        if (existsSync(BRAND_JSON)) {
          const b = readJson<BrandFile>(BRAND_JSON);
          if (typeof b[kind] === "string") {
            delete b[kind];
            writeJson(BRAND_JSON, b);
          }
        }
      } else {
        const f = folder(kind, q("slug"));
        // নাম তালিকা থেকেই মেলানো হয় — ফোল্ডারের বাইরের কিছু ধরা যায় না
        const hit = listFiles(f.dir, f.re).find((x) => x.name === q("name"));
        if (!hit) throw new Error(`"${q("name")}" নেই`);
        retire(path.join(f.dir, hit.name), binFor(f.dir));
      }
      return send(res, 200, state());
    }

    if (req.method === "POST" && url.pathname === "/api/current") {
      const slug = q("slug");
      needVideo(slug);
      setCurrent(slug);
      return send(res, 200, state());
    }

    send(res, 404, { error: "পাওয়া যায়নি" });
  } catch (e) {
    if (!req.complete) req.resume(); // না-পড়া আপলোড ফেলে দিই, যাতে ব্রাউজার উত্তরটা পায়
    send(res, 400, { error: (e as Error).message });
  }
});

// আগেরবার মাঝপথে বন্ধ হলে পড়ে থাকা আধা-আপলোড (new কমান্ডে যাওয়ার আগের অস্থায়ী কপি) পরিষ্কার
rmSync(UPLOADS, { recursive: true, force: true });
server.requestTimeout = 0; // ডিফল্ট ৫ মিনিট — ধীর ডিস্কে অনেক বড় ফুটেজ এর বেশি নিতে পারে
server.listen(PORT, "127.0.0.1", () => {
  const link = `http://localhost:${PORT}`;
  console.log(`✓ রিসোর্স ম্যানেজার চালু: ${link}   (বন্ধ করতে Ctrl+C)`);
  if (process.env.NO_OPEN === "1") return;
  const [cmd, args] = process.platform === "darwin" ? ["open", [link]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", link]] : ["xdg-open", [link]];
  spawn(cmd, args as string[], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
});
server.on("error", (e: NodeJS.ErrnoException) => {
  console.error(e.code === "EADDRINUSE" ? `✗ ${PORT} পোর্ট ব্যস্ত — হয়তো আগে থেকেই চালু আছে (${`http://localhost:${PORT}`}), নইলে: npm run ui -- --port 4322` : e.message);
  process.exit(1);
});
