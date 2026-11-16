// npm run import -- [slug] <লেখার ফাইল .srt/.vtt>   → media/videos/<slug>/work/raw.json
// লেখা আর সময় ব্যবহারকারীর ফাইল থেকেই — কোনো ট্রান্সক্রাইব নেই
import { homedir } from "node:os";
import { isMain, maxArgs, resolveSlug } from "./paths";
import { importSubtitles, SUBTITLE } from "./subtitles";

export const runImport = (slug: string, file: string) => {
  const { count, notes } = importSubtitles(slug, file);
  for (const n of notes) console.warn(`⚠ ${n}`);
  console.log(`✓ ${count}টা লাইন → media/videos/${slug}/work/raw.json`);
  console.log(`পরের ধাপ: Claude-কে বলুন "${slug} প্রসেস করো" (বানান দেখে → finalize → edit plan)`);
};

// "~/Desktop/x.srt" — Windows-এর টার্মিনাল ~ নিজে খোলে না
export const expandHome = (p?: string) => p?.replace(/^~(?=$|[\\/])/, () => homedir());

if (isMain(import.meta.url)) {
  maxArgs(2);
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const file = expandHome(args.find((a) => SUBTITLE.test(a)));
  const slugArg = args.find((a) => !SUBTITLE.test(a));
  if (!file) {
    console.error("ব্যবহার: npm run import -- <নাম> <লেখার ফাইল.srt>\nযেমন:   npm run import -- gas-detector ~/Desktop/gas.srt");
    process.exit(1);
  }
  try {
    runImport(resolveSlug(slugArg), file);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
