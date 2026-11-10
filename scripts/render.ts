// npm run render -- [slug] [--format main|shorts|graphics|all] [--fast] [--from 12 --to 58] [--no-master]
import { existsSync, renameSync, rmSync } from "node:fs";
import { readJson } from "./lib";
import { masterLoudness } from "./media";
import { flag, maxArgs, opt, resolveSlug, vpath } from "./paths";
import { props, remotion } from "./remotion";

maxArgs(1);
const slug = resolveSlug(process.argv[2]);
const format = opt("format") ?? "main";
const fast = flag("fast");
const project = readJson<{ fps: number; durationInFrames: number }>(vpath(slug, "project.json"));
if (!existsSync(vpath(slug, "timeline.json"))) console.warn(`⚠ timeline.json নেই — শুধু A-roll + ক্যাপশন রেন্ডার হবে (আগে: npm run plan -- ${slug})`);

// --from/--to (সেকেন্ড) → ফ্রেম রেঞ্জ (Shorts-এর জন্য ভিডিওর একটা অংশ)
const from = opt("from"), to = opt("to");
const range = from || to
  ? [`--frames=${Math.round(Number(from ?? 0) * project.fps)}-${Math.min(project.durationInFrames, Math.round(Number(to ?? project.durationInFrames / project.fps) * project.fps)) - 1}`]
  : [];
const suffix = from || to ? `-${from ?? 0}-${to ?? "end"}` : "";

const quality = fast
  ? ["--codec=h264", "--crf=26", "--x264-preset=veryfast", "--scale=0.5", "--pixel-format=yuv420p", "--color-space=bt709"]
  : ["--codec=h264", "--crf=16", "--x264-preset=slow", "--audio-bitrate=320k", "--pixel-format=yuv420p", "--color-space=bt709"];

const jobs: Record<string, { comp: string; out: string; args: string[]; master: boolean }> = {
  main: { comp: "Main", out: `final${suffix}${fast ? "-preview" : ""}.mp4`, args: quality, master: !fast },
  shorts: { comp: "Vertical", out: `shorts${suffix}${fast ? "-preview" : ""}.mp4`, args: quality, master: !fast },
  graphics: {
    comp: "Graphics",
    out: `graphics${suffix}.mov`,
    args: ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"],
    master: false,
  },
};
const list = format === "all" ? ["main", "shorts", "graphics"] : [format];
for (const f of list) {
  const job = jobs[f];
  if (!job) {
    console.error(`✗ --format হবে main | shorts | graphics | all`);
    process.exit(1);
  }
  const out = vpath(slug, "output", job.out);
  const tmp = vpath(slug, "work", `render-${job.out}`);
  console.log(`\n→ ${f} রেন্ডার হচ্ছে${fast ? " (দ্রুত প্রিভিউ)" : ""}...`);
  const t0 = Date.now();
  remotion(["render", job.comp, job.master ? tmp : out, props(slug), ...job.args, ...range]);
  if (job.master && !flag("no-master")) {
    console.log("→ অডিও মাস্টারিং (-14 LUFS)...");
    const r = masterLoudness(tmp, out);
    rmSync(tmp, { force: true });
    if (r.before !== null) console.log(`   লাউডনেস ${r.before.toFixed(1)} → ${r.after} LUFS`);
  } else if (job.master) renameSync(tmp, out);
  console.log(`✓ media/videos/${slug}/output/${job.out}  (${((Date.now() - t0) / 60000).toFixed(1)} মিনিট)`);
}
