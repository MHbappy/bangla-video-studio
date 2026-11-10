// npm run transcribe -- [slug]   → media/videos/<slug>/work/raw.json
// সময় আসে অডিও থেকে (VAD), লেখা আসে Whisper থেকে — প্রতিটা বাক্যাংশ আলাদা করে
import { writeFileSync } from "node:fs";
import { WHISPER_MODEL } from "./config";
import { readJson, type Segment, toSrt, writeJson } from "./lib";
import { extractAudio } from "./media";
import { isMain, resolveSlug, vpath } from "./paths";
import { hasBrokenChars, looksHallucinated, speechRegions } from "./vad";
import { loadWhisper } from "./whisper";

const SR = 16000;

export const runTranscription = async (slug: string) => {
  const project = readJson<{ aroll: string; durationInFrames: number; fps: number }>(vpath(slug, "project.json"));
  const durationSec = project.durationInFrames / project.fps;

  console.log("→ অডিও বের করা হচ্ছে...");
  const audio = extractAudio(vpath(slug, project.aroll), vpath(slug, "work", "audio.wav"));
  const { regions, continuous } = speechRegions(audio);
  if (continuous) console.warn("⚠ অডিওতে কোথাও বিরতি নেই — পেছনে মিউজিক/শব্দ চলছে? সময় কম নির্ভুল হবে, ভুল লেখা আসতে পারে।");
  console.log(`   ${regions.length}টা কথার অংশ পাওয়া গেছে`);

  console.log(`→ মডেল লোড হচ্ছে: ${WHISPER_MODEL}`);
  const asr = await loadWhisper();
  console.log(`→ ট্রান্সক্রাইব হচ্ছে (${(durationSec / 60).toFixed(1)} মিনিট অডিও, বাংলা)...`);
  const t0 = Date.now();
  const segments: Segment[] = [];
  const suspect: number[] = [];
  const broken: number[] = [];
  for (const [i, r] of regions.entries()) {
    const out = (await asr(audio.subarray(r.start, r.end), { language: "bengali", task: "transcribe" })) as { text: string };
    const text = out.text.trim();
    // [Music], (হাসি) ইত্যাদি অ-কথা ট্যাগ বাদ
    if (!text || /^[[(].*[\])]$/.test(text)) continue;
    const seg = { id: segments.length + 1, startMs: Math.round((r.start / SR) * 1000), endMs: Math.round((r.end / SR) * 1000), text };
    if (looksHallucinated(text)) suspect.push(seg.id);
    else if (hasBrokenChars(text)) broken.push(seg.id);
    segments.push(seg);
    if ((i + 1) % 10 === 0) console.log(`   ${i + 1}/${regions.length}`);
  }

  writeJson(vpath(slug, "work", "raw.json"), { model: WHISPER_MODEL, segments, suspect, broken });
  writeFileSync(vpath(slug, "work", "raw.srt"), toSrt(segments), "utf8");
  console.log(`   ${segments.length}টা সেগমেন্ট → media/videos/${slug}/work/raw.json  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  // ফলাফল কাজের কিনা: বেশিরভাগ বানানো লেখা, বা কথাই প্রায় নেই
  const spokenSec = segments.reduce((a, s) => a + (s.endMs - s.startMs), 0) / 1000;
  const badSec = segments.filter((s) => suspect.includes(s.id)).reduce((a, s) => a + (s.endMs - s.startMs), 0) / 1000;
  if (durationSec > 20 && (spokenSec < durationSec * 0.1 || badSec > spokenSec * 0.4)) {
    console.error(
      `\n✗ ট্রান্সক্রিপশন কাজের নয়: ${spokenSec < durationSec * 0.1 ? "প্রায় কোনো কথা পাওয়া যায়নি" : `${Math.round((badSec / spokenSec) * 100)}% লেখা একই জিনিসের পুনরাবৃত্তি (Whisper বানিয়েছে)`}।\n` +
        "  সম্ভাব্য কারণ: ফুটেজে কথা নেই, বা পেছনে জোরে মিউজিক/মেশিনের শব্দ, বা আগে থেকে এডিট করা ভিডিও।\n" +
        "  করণীয়: শুধু কথার (মিউজিক ছাড়া) A-roll দিন। কথা পরিষ্কার হলে বেশি নির্ভুল মডেলে আবার: npm run transcribe -- " + slug + " --quality accurate",
    );
    // process.exit নয় — মডেলের থ্রেড চলা অবস্থায় বের হলে onnxruntime ক্র্যাশ করে
    process.exitCode = 1;
    return;
  }
  if (suspect.length) console.warn(`⚠ সন্দেহজনক (একই লেখার পুনরাবৃত্তি) সেগমেন্ট: ${suspect.join(", ")} — captions ঠিক করার সময় Claude দেখবে`);
  if (broken.length) console.warn(`⚠ ভাঙা অক্ষর (�) আছে: ${broken.join(", ")} — Claude ঠিক করবে`);
  console.log(`✓ ট্রান্সক্রিপশন শেষ`);
  console.log(`পরের ধাপ: Claude-কে বলুন "${slug}-এর captions ঠিক করো" → npm run finalize`);
};

if (isMain(import.meta.url)) {
  await runTranscription(resolveSlug(process.argv[2]));
}
