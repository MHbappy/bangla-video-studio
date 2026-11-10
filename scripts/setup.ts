// npm run setup — একবার: Whisper মডেল (models/), ডিফল্ট SFX, ffmpeg যাচাই
import { QUALITY, WHISPER_MODEL } from "./config";
import { ffmpegVersion } from "./media";
import { browserStatus } from "./remotion";
import { ensureSfx } from "./sfx";
import { loadWhisper } from "./whisper";

if (Number(process.versions.node.split(".")[0]) < 20) {
  console.error(`✗ Node ২০ বা নতুন দরকার (এখন ${process.version})`);
  process.exit(1);
}
console.log(`✓ ffmpeg (Remotion-এর সাথে আসা): ${ffmpegVersion()}`);
const b = browserStatus();
console.log(
  b.kind === "download"
    ? "⚠ রেন্ডারের ব্রাউজার: এই কম্পিউটারে Chrome/Edge পাওয়া যায়নি — প্রথম রেন্ডারে Remotion নিজে নামাবে (~১০০MB, ইন্টারনেট লাগবে)। নামাতে না পারলে Chrome ইনস্টল করুন।"
    : `✓ রেন্ডারের ব্রাউজার: ${b.kind === "remotion" ? "Remotion-এর নিজের Chrome" : b.path}`,
);
const made = ensureSfx();
console.log(`✓ সাউন্ড ইফেক্ট: media/library/sfx/${made.length ? ` (নতুন: ${made.join(", ")})` : ""}`);
console.log(`→ মডেল: ${WHISPER_MODEL} (${QUALITY}) — প্রথমবার নামতে কিছুক্ষণ লাগবে...`);
await loadWhisper();
console.log("✓ সেটআপ শেষ। নতুন ভিডিও: npm run new -- <নাম> <ভিডিও ফাইল>   টেস্ট: npm run demo");
