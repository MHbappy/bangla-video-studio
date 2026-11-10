// npm run list — সব ভিডিও আর প্রতিটা কোন ধাপে আছে
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { VIDEOS, vpath } from "./paths";

const cur = existsSync("media/.current") ? readFileSync("media/.current", "utf8").trim() : "";
const slugs = existsSync(VIDEOS) ? readdirSync(VIDEOS).filter((d) => existsSync(vpath(d, "project.json"))) : [];
if (!slugs.length) console.log("কোনো ভিডিও নেই। শুরু: npm run new -- <নাম> <ভিডিও ফাইল>   বা টেস্ট: npm run demo");
const step = (s: string) =>
  existsSync(vpath(s, "output", "final.mp4")) ? "✓ রেন্ডার হয়েছে"
  : existsSync(vpath(s, "timeline.json")) ? "প্ল্যান ঠিক আছে → npm run render"
  : existsSync(vpath(s, "edit.json")) ? "প্ল্যান আছে → npm run plan"
  : existsSync(vpath(s, "captions.json")) ? 'ক্যাপশন আছে → Claude: "edit plan বানাও"'
  : existsSync(vpath(s, "transcript.json")) ? "→ npm run finalize"
  : existsSync(vpath(s, "work", "raw.json")) ? 'ট্রান্সক্রাইব হয়েছে → Claude: "captions ঠিক করো"'
  : "→ npm run transcribe";
for (const s of slugs) {
  const p = JSON.parse(readFileSync(vpath(s, "project.json"), "utf8"));
  console.log(`${s === cur ? "▶" : " "} ${s.padEnd(28)} ${((p.durationInFrames / p.fps) / 60).toFixed(1).padStart(5)} মি.  ${step(s)}`);
}
if (cur) console.log(`\n▶ = এখনকার ভিডিও (কমান্ডে নাম না দিলে এটাই ধরা হয়) · ফোল্ডার: ${path.join(VIDEOS, cur)}`);
