// npm run thumbs -- [slug]                          → output/thumbs/: সবচেয়ে পরিষ্কার ৮টা ফ্রেম (cand-01.jpg…)
// npm run thumbs -- [slug] --pick 3 --title "৬০০০W *লেজার* কাটার" [--sub "দাম জানুন"] [--side right]  → output/thumbnail.jpg
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readJson } from "./lib";
import { ffmpeg, grayFrame } from "./media";
import { LIBRARY, maxArgs, opt, resolveSlug, vpath, webPath } from "./paths";
import { props, remotion } from "./remotion";

maxArgs(1);
const slug = resolveSlug(process.argv[2]);
const project = readJson<{ aroll: string; durationInFrames: number; fps: number }>(vpath(slug, "project.json"));
const dur = project.durationInFrames / project.fps;
const aroll = vpath(slug, project.aroll);
const dir = vpath(slug, "output", "thumbs");
const title = opt("title");

if (!title) {
  // ১) ৪০টা ফ্রেম মেপে দেখা: শার্পনেস (ল্যাপ্লাসিয়ান ভ্যারিয়েন্স), আলো আর কনট্রাস্ট
  const W = 160, H = 90, N = 40;
  console.log(`→ ${N}টা ফ্রেম মাপা হচ্ছে...`);
  const scored: { t: number; score: number }[] = [];
  for (let i = 0; i < N; i++) {
    const t = dur * (0.04 + (0.92 * i) / (N - 1));
    const px = grayFrame(aroll, t, W, H);
    if (px.length < W * H) continue;
    let mean = 0;
    for (const v of px) mean += v;
    mean /= px.length;
    let sd = 0;
    for (const v of px) sd += (v - mean) ** 2;
    sd = Math.sqrt(sd / px.length);
    let lap = 0, lap2 = 0, n = 0;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const k = y * W + x;
        const l = 4 * px[k] - px[k - 1] - px[k + 1] - px[k - W] - px[k + W];
        lap += l;
        lap2 += l * l;
        n++;
      }
    const sharp = lap2 / n - (lap / n) ** 2;
    // খুব অন্ধকার/উজ্জ্বল বা ম্যাড়মেড়ে ফ্রেমে শাস্তি
    const exposure = mean < 45 || mean > 215 ? 0.3 : 1;
    const contrast = Math.min(1, sd / 40);
    scored.push({ t, score: sharp * exposure * contrast });
  }
  // ২) সেরা ৮টা, একটা আরেকটা থেকে দূরে (একই মুহূর্তের কাছাকাছি ফ্রেম নয়)
  const gap = dur / 14;
  const pick: typeof scored = [];
  for (const c of [...scored].sort((a, b) => b.score - a.score)) {
    if (pick.every((p) => Math.abs(p.t - c.t) >= gap)) pick.push(c);
    if (pick.length === 8) break;
  }
  pick.sort((a, b) => a.t - b.t);
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (/^cand-\d+\.jpg$/.test(f)) rmSync(path.join(dir, f));
  mkdirSync(dir, { recursive: true });
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  pick.forEach((p, i) => ffmpeg(["-y", "-v", "error", "-ss", p.t.toFixed(2), "-i", aroll, "-frames:v", "1", "-q:v", "2", path.join(dir, `cand-${String(i + 1).padStart(2, "0")}.jpg`)]));
  writeFileSync(path.join(dir, "index.txt"), pick.map((p, i) => `cand-${String(i + 1).padStart(2, "0")}.jpg\t${mmss(p.t)}`).join("\n") + "\n", "utf8");
  console.log(`✓ ${pick.length}টা ফ্রেম → media/videos/${slug}/output/thumbs/  (${pick.map((p, i) => `${i + 1}=${mmss(p.t)}`).join(", ")})`);
  console.log(`পরের ধাপ: পছন্দেরটা বেছে — npm run thumbs -- ${slug} --pick 3 --title "৬০০০W *লেজার* কাটার"   (*…* = ব্র্যান্ড রঙে)`);
} else {
  const n = String(Number(opt("pick") ?? 1)).padStart(2, "0");
  const img = path.join(dir, `cand-${n}.jpg`);
  if (!existsSync(img)) {
    console.error(`✗ ${path.relative(".", img)} নেই — আগে: npm run thumbs -- ${slug}`);
    process.exit(1);
  }
  // লোগো: এই ভিডিওর brand/, না পেলে লাইব্রেরি
  const logo = [vpath(slug, "brand"), path.join(LIBRARY, "brand")]
    .flatMap((d) => ["png", "webp", "svg", "jpg"].map((e) => path.join(d, `logo.${e}`)))
    .find((p) => existsSync(p));
  const out = vpath(slug, "output", "thumbnail.jpg");
  const p = JSON.parse(props(slug).slice("--props=".length));
  remotion([
    "still", "Thumbnail", out,
    `--props=${JSON.stringify({ ...p, image: webPath(img), title, sub: opt("sub"), side: opt("side") === "right" ? "right" : "left", logo: logo ? webPath(logo) : undefined })}`,
    "--image-format=jpeg", "--jpeg-quality=92", "--log=error",
  ]);
  console.log(`✓ media/videos/${slug}/output/thumbnail.jpg  (1280×720 — YouTube-এ সরাসরি আপলোড)`);
}
