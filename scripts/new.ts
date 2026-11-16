// npm run new -- <slug> <ভিডিও ফাইল> [লেখার ফাইল .srt/.vtt]   → নতুন ভিডিও ফোল্ডার + A-roll কপি (+ লেখা)
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { expandHome, runImport } from "./import";
import { writeJson } from "./lib";
import { probeVideo } from "./media";
import { flag, isSlug, maxArgs, setCurrent, vpath } from "./paths";
import { SUBTITLE } from "./subtitles";

maxArgs(3);
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const subs = expandHome(args.find((a) => SUBTITLE.test(a)));
const [slug, rawSrc] = args.filter((a) => !SUBTITLE.test(a));
const src = expandHome(rawSrc);
if (!slug || !src) {
  console.error(
    "ব্যবহার: npm run new -- <নাম> <ভিডিও ফাইল> [লেখার ফাইল .srt/.vtt]\nযেমন:   npm run new -- gas-detector ~/Desktop/gas-final-cut.mp4 ~/Desktop/gas.srt",
  );
  process.exit(1);
}
if (!isSlug(slug)) {
  console.error("✗ নাম শুধু ছোট ইংরেজি অক্ষর, সংখ্যা আর - দিয়ে (যেমন gas-detector-v2)");
  process.exit(1);
}
for (const f of [src, subs]) {
  if (f && !existsSync(f)) {
    console.error(`✗ ফাইল পাওয়া যায়নি: ${f}`);
    process.exit(1);
  }
}
if (existsSync(vpath(slug, "project.json")) && !flag("force")) {
  console.error(`✗ "${slug}" আগে থেকেই আছে। শুধু লেখা দিতে: npm run import -- ${slug} <ফাইল.srt>   বা নতুন করে: --force`);
  process.exit(1);
}

for (const d of ["broll", "music", "work", "output"]) mkdirSync(vpath(slug, d), { recursive: true });
const ext = path.extname(src).toLowerCase() || ".mp4";
const aroll = `aroll${ext}`;
console.log(`→ A-roll কপি হচ্ছে → media/videos/${slug}/${aroll}`);
copyFileSync(src, vpath(slug, aroll));

const info = probeVideo(vpath(slug, aroll));
if (Math.abs(info.fps - Math.round(info.fps)) > 0.01 && ![23.98, 29.97, 59.94].includes(info.fps))
  console.warn(`⚠ ফ্রেমরেট ${info.fps} — অস্বাভাবিক। Resolve থেকে স্থির (CFR) ফ্রেমরেটে এক্সপোর্ট করা ভালো।`);
if (info.warn) console.warn(`⚠ A-roll: ${info.warn}`);
writeJson(vpath(slug, "project.json"), {
  slug,
  source: path.basename(src),
  aroll,
  width: info.width,
  height: info.height,
  fps: info.fps,
  durationInFrames: Math.ceil(info.durationSec * info.fps),
  createdAt: new Date().toISOString(),
});
setCurrent(slug);
console.log(`✓ ${info.width}×${info.height}, ${info.fps}fps, ${(info.durationSec / 60).toFixed(1)} মিনিট`);

if (!subs) {
  console.log(`পরের ধাপ: লেখা (SRT/VTT, সময়সহ) দিন → npm run import -- ${slug} <ফাইল.srt>   (বা রিসোর্স ম্যানেজার থেকে)`);
  process.exit(0);
}
try {
  runImport(slug, subs);
} catch (e) {
  console.error(`✗ লেখা নেওয়া যায়নি: ${(e as Error).message}\n  ঠিক ফাইল দিয়ে আবার: npm run import -- ${slug} <ফাইল.srt>`);
  process.exit(1);
}
