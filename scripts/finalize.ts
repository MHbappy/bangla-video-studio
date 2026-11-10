// npm run finalize -- [slug]
// transcript.json (Claude-এর ঠিক করা) → যাচাই → captions.json + captions-index.txt + output/captions.srt
import { existsSync, writeFileSync } from "node:fs";
import { MAX_CAPTION_CHARS } from "./config";
import { type CaptionLine, readJson, type Segment, splitSegment, toSrt, writeJson } from "./lib";
import { resolveSlug, vpath } from "./paths";

const slug = resolveSlug(process.argv[2]);
const corrected = vpath(slug, "transcript.json");
const raw = vpath(slug, "work", "raw.json");
const src = existsSync(corrected) ? corrected : raw;
if (!existsSync(src)) {
  console.error(`✗ আগে npm run transcribe -- ${slug}`);
  process.exit(1);
}
if (src === raw) console.warn("⚠ transcript.json নেই — বানান-ঠিক ছাড়াই raw ট্রান্সক্রিপ্ট ব্যবহার হচ্ছে");

const project = readJson<{ durationInFrames: number; fps: number }>(vpath(slug, "project.json"));
const maxMs = (project.durationInFrames / project.fps) * 1000;
const { segments } = readJson<{ segments: Segment[] }>(src);

const errors: string[] = [];
const clean = [...segments]
  .sort((a, b) => a.startMs - b.startMs)
  .filter((s) => s.text?.trim())
  .map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ").trim(), endMs: Math.min(s.endMs, maxMs) }));
clean.forEach((s, i) => {
  if (!(s.endMs > s.startMs)) errors.push(`id ${s.id}: endMs অবশ্যই startMs-এর বড়`);
  const prev = clean[i - 1];
  if (prev && s.startMs < prev.endMs) {
    if (prev.endMs - s.startMs < 300) prev.endMs = s.startMs;
    else errors.push(`id ${prev.id} ও ${s.id}: সময় ওভারল্যাপ`);
  }
});
if (errors.length) {
  console.error("✗ transcript.json-এ সমস্যা:\n  " + errors.join("\n  "));
  process.exit(1);
}

const lines: CaptionLine[] = clean.flatMap((s) => splitSegment(s, MAX_CAPTION_CHARS));
writeJson(vpath(slug, "captions.json"), { lines });
writeFileSync(vpath(slug, "output", "captions.srt"), toSrt(lines), "utf8");
const mmss = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${((ms % 60000) / 1000).toFixed(1).padStart(4, "0")}`;
writeFileSync(
  vpath(slug, "captions-index.txt"),
  lines.map((l, i) => `c${i + 1}\t${mmss(l.startMs)}–${mmss(l.endMs)}\t${l.text}`).join("\n") + "\n",
  "utf8",
);
console.log(`✓ ${clean.length} সেগমেন্ট → ${lines.length} ক্যাপশন লাইন`);
console.log(`  captions-index.txt (c1, c2… শট প্ল্যানের জন্য) · output/captions.srt (YouTube-এ আপলোড)`);
console.log(`পরের ধাপ: Claude-কে বলুন "${slug}-এর edit plan বানাও" → npm run plan`);
