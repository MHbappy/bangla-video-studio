// npm run new -- <slug> <ভিডিও ফাইল>   → নতুন ভিডিও ফোল্ডার + A-roll কপি + ট্রান্সক্রিপশন
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { writeJson } from "./lib";
import { probeVideo } from "./media";
import { flag, isSlug, maxArgs, setCurrent, vpath } from "./paths";
import { runTranscription } from "./transcribe";

maxArgs(2);
const [slug, rawSrc] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
// "~/Desktop/x.mp4" — Windows-এর টার্মিনাল ~ নিজে খোলে না, তাই এখানে
const src = rawSrc?.replace(/^~(?=$|[\\/])/, () => homedir());
if (!slug || !src) {
  console.error("ব্যবহার: npm run new -- <নাম> <ভিডিও ফাইল>\nযেমন:   npm run new -- gas-detector ~/Desktop/gas-final-cut.mp4");
  process.exit(1);
}
if (!isSlug(slug)) {
  console.error("✗ নাম শুধু ছোট ইংরেজি অক্ষর, সংখ্যা আর - দিয়ে (যেমন gas-detector-v2)");
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`✗ ফাইল পাওয়া যায়নি: ${src}`);
  process.exit(1);
}
if (existsSync(vpath(slug, "project.json")) && !flag("force")) {
  console.error(`✗ "${slug}" আগে থেকেই আছে। আবার ট্রান্সক্রাইব: npm run transcribe -- ${slug}   বা নতুন করে: --force`);
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

if (flag("no-transcribe")) process.exit(0);
await runTranscription(slug);
