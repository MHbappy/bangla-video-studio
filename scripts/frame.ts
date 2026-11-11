// npm run frame -- [slug] --shot 7 [--format shorts]   → work/frames/shot-07.jpg (শটের মাঝামাঝি একটা ফ্রেম, পুরো এডিটসহ)
// npm run frame -- [slug] --at 42.5                    → work/frames/at-42.5.jpg
// কেন: Callout-এর x,y বা কার্ড ফুটেজের কী ঢাকছে — রেন্ডার না করেই এক ছবিতে দেখে নেওয়া (Claude ছবিটা পড়ে ঠিক করে)
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Timeline } from "../src/timeline-types";
import { readJson } from "./lib";
import { maxArgs, opt, resolveSlug, vpath } from "./paths";
import { props, remotion } from "./remotion";

maxArgs(1);
const slug = resolveSlug(process.argv[2]);
const project = readJson<{ fps: number; durationInFrames: number; width: number }>(vpath(slug, "project.json"));
const shotArg = opt("shot");
const atArg = opt("at");
const vertical = opt("format") === "shorts";
if ((shotArg === undefined) === (atArg === undefined)) {
  console.error(`ব্যবহার: npm run frame -- ${slug} --shot 7        (বা --at 42.5 সেকেন্ড; খাড়া দেখতে --format shorts)`);
  process.exit(1);
}

let sec: number;
let name: string;
if (shotArg !== undefined) {
  if (!existsSync(vpath(slug, "timeline.json"))) {
    console.error(`✗ timeline.json নেই — আগে: npm run plan -- ${slug}`);
    process.exit(1);
  }
  const shots = readJson<Timeline>(vpath(slug, "timeline.json")).shots;
  const shot = shots.find((s) => s.index === Number(shotArg));
  if (!shot) {
    console.error(`✗ শট ${shotArg} নেই (মোট ${shots.length}টা — npm run plan-এর টেবিল দেখুন)`);
    process.exit(1);
  }
  // ৬০%-এ: গ্রাফিক্স পুরো ঢুকে গেছে, বের হওয়া শুরু হয়নি
  sec = (shot.startMs + (shot.endMs - shot.startMs) * 0.6) / 1000;
  name = `shot-${String(shot.index).padStart(2, "0")}`;
} else {
  sec = Number(atArg);
  if (!Number.isFinite(sec) || sec < 0) {
    console.error(`✗ --at হবে সেকেন্ড (যেমন 42.5)`);
    process.exit(1);
  }
  name = `at-${sec}`;
}

const frame = Math.min(project.durationInFrames - 1, Math.max(0, Math.round(sec * project.fps)));
const dir = vpath(slug, "work", "frames");
mkdirSync(dir, { recursive: true });
const out = path.join(dir, `${name}${vertical ? "-shorts" : ""}.jpg`);
// দেখার জন্য ~১২৮০px চওড়াই যথেষ্ট (4K-তেও দ্রুত); খাড়া ১০৮০px চওড়া → অর্ধেক
const scale = vertical ? 0.5 : Math.min(1, 1280 / project.width);
remotion(["still", vertical ? "Vertical" : "Main", out, props(slug), `--frame=${frame}`, `--scale=${scale}`, "--image-format=jpeg", "--jpeg-quality=85", "--log=error"]);
console.log(`✓ ${out.split(path.sep).join("/")}  (${sec.toFixed(1)}s, ফ্রেম ${frame})`);
