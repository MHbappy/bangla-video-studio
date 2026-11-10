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
import { isSlug, LIBRARY, MEDIA, opt, setCurrent, VIDEOS, vpath } from "./paths";

const require = createRequire(import.meta.url);
const PORT = Number(opt("port") ?? process.env.PORT ?? 4321);
const BRAND_DIR = path.join(LIBRARY, "brand");
const BRAND_JSON = path.join(BRAND_DIR, "brand.json");
const FONT_DIR = path.join(path.dirname(require.resolve("@fontsource/hind-siliguri/package.json")), "files");
const UPLOADS = path.join(MEDIA, ".uploads");

const IMAGE = /\.(png|jpe?g|webp|svg)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i;
const AUDIO = /\.(mp3|m4a|wav|aac|ogg)$/i;
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8", ".woff2": "font/woff2",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".aac": "audio/aac", ".ogg": "audio/ogg",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/mp4", ".webm": "video/webm",
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

// logo.* / qr.* → brand/.removed/<নাম>-<সময়>.<ext> (কখনো মোছে না); কয়টা সরল তা ফেরত দেয়
const retireBrandImage = (stem: string) => {
  const files = listFiles(BRAND_DIR, IMAGE).filter((f) => path.parse(f.name).name === stem);
  if (!files.length) return 0;
  const bin = path.join(BRAND_DIR, ".removed");
  mkdirSync(bin, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  for (const f of files) {
    const { name, ext } = path.parse(f.name);
    renameSync(path.join(BRAND_DIR, f.name), path.join(bin, `${name}-${stamp}${ext}`));
  }
  return files.length;
};

// ---- নতুন ভিডিওর কাজ (npm run new) — লগ মেমরিতে, পেজ প্রতি সেকেন্ডে দেখে ----
type Job = { slug: string; log: string; done: boolean; ok: boolean };
const jobs = new Map<string, Job>();
const runNew = (slug: string, file: string) => {
  const job: Job = { slug, log: "", done: false, ok: false };
  jobs.set(slug, job);
  const child = spawn(process.execPath, [require.resolve("tsx/cli"), "scripts/new.ts", slug, file], { env: process.env });
  const add = (b: Buffer) => (job.log = (job.log + b.toString()).slice(-20000));
  child.stdout.on("data", add);
  child.stderr.on("data", add);
  child.on("exit", (code) => {
    job.done = true;
    job.ok = code === 0;
    rmSync(file, { force: true }); // new কমান্ড নিজের কপি রেখেছে
  });
};

const videoState = (slug: string) => {
  const has = (...p: string[]) => existsSync(vpath(slug, ...p));
  const project = has("project.json") ? readJson<{ aroll: string; durationInFrames: number; fps: number; width: number; height: number }>(vpath(slug, "project.json")) : null;
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
    broll: listFiles(vpath(slug, "broll"), new RegExp(`${IMAGE.source}|${VIDEO.source}`, "i")),
    music: listFiles(vpath(slug, "music"), AUDIO),
    thumbs: [...listFiles(vpath(slug, "output", "thumbs"), IMAGE), ...listFiles(vpath(slug, "output"), /^thumbnail\.jpg$/)],
    job: jobs.get(slug) ?? null,
  };
};

const state = () => ({
  brand: existsSync(BRAND_JSON) ? readJson<BrandFile>(BRAND_JSON) : {},
  logo: findBrandImage("logo") ?? null,
  qr: findBrandImage("qr") ?? null,
  library: { music: listFiles(path.join(LIBRARY, "music"), AUDIO), broll: listFiles(path.join(LIBRARY, "broll"), new RegExp(`${IMAGE.source}|${VIDEO.source}`, "i")) },
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

// ---- আপলোড: কোন জিনিস কোন ফোল্ডারে ----
const target = (kind: string, slug: string, name: string): { dir: string; file: string; stem?: string } => {
  const ext = path.extname(name).toLowerCase();
  const need = (re: RegExp, what: string) => {
    if (!re.test(name)) throw new Error(`${what} হতে হবে (${re.source.replace(/\\\.|\\|\(|\)|\$|\?/g, "").replace(/\|/g, ", ")})`);
  };
  const video = () => {
    if (!isSlug(slug) || !existsSync(vpath(slug, "project.json"))) throw new Error(`ভিডিও "${slug}" নেই`);
  };
  switch (kind) {
    case "logo":
    case "qr":
      need(IMAGE, "ছবি");
      return { dir: BRAND_DIR, file: `${kind}${ext}`, stem: kind };
    case "library-music":
      need(AUDIO, "অডিও");
      return { dir: path.join(LIBRARY, "music"), file: name };
    case "library-broll":
      need(new RegExp(`${IMAGE.source}|${VIDEO.source}`, "i"), "ভিডিও বা ছবি");
      return { dir: path.join(LIBRARY, "broll"), file: name };
    case "video-broll":
      video();
      need(new RegExp(`${IMAGE.source}|${VIDEO.source}`, "i"), "ভিডিও বা ছবি");
      return { dir: vpath(slug, "broll"), file: name };
    case "video-music":
      video();
      need(AUDIO, "অডিও");
      return { dir: vpath(slug, "music"), file: name };
    default:
      throw new Error(`অজানা ধরন: ${kind}`);
  }
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
const serveFile = (res: ServerResponse, file: string) => {
  if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: "পাওয়া যায়নি" });
  res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(res);
};
// /media/... শুধু media/ ফোল্ডারের ভেতরে
const inside = (root: string, rel: string) => {
  const full = path.resolve(root, rel);
  return full.startsWith(path.resolve(root) + path.sep) ? full : null;
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const q = (k: string) => url.searchParams.get(k) ?? "";
  try {
    if (req.method === "GET" && url.pathname === "/") return serveFile(res, path.resolve("ui", "index.html"));
    if (req.method === "GET" && url.pathname.startsWith("/font/")) {
      const f = inside(FONT_DIR, decodeURIComponent(url.pathname.slice(6)));
      return f ? serveFile(res, f) : send(res, 404, {});
    }
    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      const f = inside(MEDIA, decodeURIComponent(url.pathname.slice(7)));
      return f ? serveFile(res, f) : send(res, 404, {});
    }
    if (req.method === "GET" && url.pathname === "/api/state") return send(res, 200, state());

    if (req.method === "POST" && url.pathname === "/api/brand") {
      saveBrand(JSON.parse(await readBody(req)));
      return send(res, 200, state());
    }

    if (req.method === "POST" && url.pathname === "/api/notes") {
      const slug = q("slug");
      if (!isSlug(slug) || !existsSync(vpath(slug, "project.json"))) throw new Error(`ভিডিও "${slug}" নেই`);
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
      try {
        await pipeline(req, createWriteStream(tmp));
      } catch (e) {
        rmSync(tmp, { force: true });
        throw e;
      }
      // লোগো/QR বদলালে পুরনোটা (অন্য ফরম্যাটে থাকলেও) brand/.removed/-এ সরে যায় — মুছে যায় না, নতুনটাই ধরা হয়
      if (t.stem) retireBrandImage(t.stem);
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
      if (jobs.get(slug) && !jobs.get(slug)!.done) throw new Error(`"${slug}" এখনো প্রসেস হচ্ছে`);
      if (!VIDEO.test(name)) throw new Error("ভিডিও ফাইল দিন (mp4, mov...)");
      mkdirSync(UPLOADS, { recursive: true });
      const file = path.join(UPLOADS, `${slug}${path.extname(name).toLowerCase()}`);
      try {
        await pipeline(req, createWriteStream(file));
      } catch (e) {
        rmSync(file, { force: true });
        throw e;
      }
      runNew(slug, file);
      return send(res, 200, state());
    }

    // লোগো/QR সরানো: মুছে ফেলা নয় — brand/.removed/-এ সরে যায় (দরকার হলে ফেরত আনা যায়)
    if (req.method === "POST" && url.pathname === "/api/remove") {
      const kind = q("kind");
      if (kind !== "logo" && kind !== "qr") throw new Error("শুধু লোগো বা QR সরানো যায়");
      if (!retireBrandImage(kind)) throw new Error(`${kind === "logo" ? "লোগো" : "QR"} নেই`);
      if (existsSync(BRAND_JSON)) {
        const b = readJson<BrandFile>(BRAND_JSON);
        if (typeof b[kind] === "string") {
          delete b[kind];
          writeJson(BRAND_JSON, b);
        }
      }
      return send(res, 200, state());
    }

    if (req.method === "POST" && url.pathname === "/api/current") {
      const slug = q("slug");
      if (!isSlug(slug) || !existsSync(vpath(slug, "project.json"))) throw new Error(`ভিডিও "${slug}" নেই`);
      setCurrent(slug);
      return send(res, 200, state());
    }

    send(res, 404, { error: "পাওয়া যায়নি" });
  } catch (e) {
    if (!req.complete) req.resume(); // না-পড়া আপলোড ফেলে দিই, যাতে ব্রাউজার উত্তরটা পায়
    send(res, 400, { error: (e as Error).message });
  }
});

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
