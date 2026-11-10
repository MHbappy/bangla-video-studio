// npm run demo — নিজের ফুটেজ ছাড়াই পুরো সিস্টেম টেস্ট: media/videos/demo/ বানায়
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { readJson, writeJson } from "./lib";
import { ffmpeg } from "./media";
import { flag, setCurrent, vpath } from "./paths";
import { remotion } from "./remotion";
import { ensureSfx } from "./sfx";

const require = createRequire(import.meta.url);
const slug = "demo";
const need = (f: string) => flag("rerender") || !existsSync(f);
for (const d of ["broll", "music", "work", "output", "brand"]) mkdirSync(vpath(slug, d), { recursive: true });
ensureSfx();

console.log("→ ১/৪ নকল A-roll (৪০ সেকেন্ড)...");
if (need(vpath(slug, "aroll.mp4"))) {
  remotion(["render", "DemoAroll", vpath(slug, "work", "aroll-silent.mp4"), "--log=error"]);
  ffmpeg(["-y", "-v", "error", "-i", vpath(slug, "work", "aroll-silent.mp4"), "-f", "lavfi", "-i", "sine=frequency=180:duration=40", "-filter:a", "volume=0.25", "-c:v", "copy", "-c:a", "aac", "-shortest", vpath(slug, "aroll.mp4")]);
  rmSync(vpath(slug, "work", "aroll-silent.mp4"));
}
writeJson(vpath(slug, "project.json"), { slug, source: "demo", aroll: "aroll.mp4", width: 1920, height: 1080, fps: 30, durationInFrames: 1200 });

console.log("→ ২/৪ নকল B-roll...");
const brolls: [string, string, number, number][] = [
  ["esp32-closeup.mp4", "ESP32 ক্লোজআপ", 200, 240],
  ["soldering-sensor.mp4", "সোল্ডারিং", 20, 120],
  ["screen-code.mp4", "কোড স্ক্রিন", 270, 240],
];
for (const [file, label, hue, frames] of brolls)
  if (need(vpath(slug, "broll", file)))
    remotion(["render", "DemoBroll", vpath(slug, "broll", file), `--props=${JSON.stringify({ label, hue })}`, `--frames=0-${frames - 1}`, "--muted", "--log=error"]);
if (need(vpath(slug, "broll", "circuit-photo.png")))
  remotion(["still", "DemoBroll", vpath(slug, "broll", "circuit-photo.png"), `--props=${JSON.stringify({ label: "সার্কিটের ছবি", hue: 140 })}`, "--frame=60", "--log=error"]);

if (need(vpath(slug, "brand", "logo.png")))
  remotion(["still", "DemoLogo", vpath(slug, "brand", "logo.png"), "--image-format=png", "--log=error"]);
if (need(vpath(slug, "brand", "qr.png"))) remotion(["still", "DemoQr", vpath(slug, "brand", "qr.png"), "--log=error"]);

console.log("→ ৩/৪ নকল মিউজিক...");
if (need(vpath(slug, "music", "demo-music.wav")))
  ffmpeg(["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=330:duration=20", "-f", "lavfi", "-i", "sine=frequency=495:duration=20", "-filter_complex", "amix=inputs=2,volume=0.6", "-c:a", "pcm_s16le", vpath(slug, "music", "demo-music.wav")]);

console.log("→ ৪/৪ নমুনা ট্রান্সক্রিপ্ট ও edit plan...");
const segs = [
  [300, 3000, "আসসালামু আলাইকুম। আজকে আমরা একটা গ্যাস ডিটেক্টর বানাব।"],
  [3200, 5800, "আমি মেহেদী হাসান, KarigorLab থেকে।"],
  [6000, 9200, "এটা হলো ESP32, পুরো প্রজেক্টের মস্তিষ্ক।"],
  [9400, 12000, "এই জায়গাটা খেয়াল করুন, এখানে সেন্সর বসবে।"],
  [12200, 15000, "প্রথমে সেন্সরটা সোল্ডার করে নিতে হবে।"],
  [15200, 18800, "আমাদের লাগবে তিনটা জিনিস: MQ-2 সেন্সর, বাজার আর ESP32।"],
  [19000, 22000, "পুরো খরচ পড়বে মাত্র ১২৫০ টাকা।"],
  [22200, 25600, "Arduino-র চেয়ে ESP32-এ WiFi আছে, দামও প্রায় এক।"],
  [25800, 29600, "এবার কোডটা দেখি, এখানে সেন্সরের মান পড়া হচ্ছে।"],
  [29800, 33000, "গ্যাস পেলেই বাজার বেজে উঠবে।"],
  [33200, 36000, "পুরো সার্কিটটা দেখতে এরকম হবে।"],
  [36200, 39600, "ভিডিওটা ভালো লাগলে সাবস্ক্রাইব করবেন।"],
] as const;
writeJson(vpath(slug, "transcript.json"), { segments: segs.map(([s, e, t], i) => ({ id: i + 1, startMs: s, endMs: e, text: t })) });
execFileSync(process.execPath, [require.resolve("tsx/cli"), "scripts/finalize.ts", slug], { stdio: "ignore" });
// লম্বা বাক্য একাধিক লাইনে ভাঙে — তাই প্রতিটা বাক্যের শেষ লাইনের নম্বর
const lines = readJson<{ lines: { endMs: number }[] }>(vpath(slug, "captions.json")).lines;
const c = (seg: number) => `c${lines.findIndex((l) => l.endMs === segs[seg - 1][1]) + 1}`;

if (!existsSync(vpath(slug, "edit.json")) || flag("force"))
  writeJson(vpath(slug, "edit.json"), {
    arollFocus: "50% 35%",
    captionStyle: "box",
    music: { file: "demo-music.wav", volume: 0.12, duck: 0.35 },
    endScreen: 6,
    // সাধারণত media/library/brand/brand.json-এ থাকে — ডেমোতে এখানেই
    brand: {
      name: "KarigorLab",
      address: "মিরপুর, ঢাকা",
      phone: "01700-000000",
      phoneLabel: "অর্ডার করতে কল করুন",
      logo: "logo.png",
      qr: "qr.png",
      social: [
        { type: "facebook", text: "fb.com/karigorlab" },
        { type: "whatsapp", text: "01700-000000" },
      ],
      contactBar: { start: 3, every: 20, duration: 7 },
    },
    shots: [
      { until: c(1), layout: "aroll", note: "হুক — মুখ" },
      { until: c(2), layout: "aroll+gfx", gfx: { scene: "LowerThird", name: "মেহেদী হাসান বাপ্পী", role: "KarigorLab" } },
      { until: c(3), layout: "split", broll: "esp32-closeup.mp4" },
      { until: c(4), layout: "aroll+gfx", gfx: { scene: "Callout", text: "সেন্সর এখানে", x: 50, y: 30 } },
      { until: c(5), layout: "broll", broll: { file: "soldering-sensor.mp4", move: "slowZoomIn" } },
      { until: c(6), layout: "motion", gfx: { scene: "BulletList", title: "যা যা লাগবে", items: ["MQ-2 সেন্সর", "বাজার", "ESP32"] } },
      { until: c(7), layout: "aroll+gfx", gfx: { scene: "StatCard", value: "৳১,২৫০", label: "মোট খরচ" } },
      { until: c(8), layout: "motion", gfx: { scene: "Compare", left: { title: "Arduino Uno", items: ["WiFi নেই", "৳৮০০"] }, right: { title: "ESP32", items: ["WiFi + Bluetooth", "৳৫৫০"] } } },
      { until: c(9), layout: "pip", broll: "screen-code.mp4" },
      { until: c(10), layout: "motion+aroll", gfx: { scene: "ChapterCard", number: 2, title: "অ্যালার্ম কীভাবে কাজ করে" } },
      { until: c(11), layout: "broll", broll: "circuit-photo.png" },
      { until: "end", layout: "aroll+gfx", zoom: 1.08, gfx: { scene: "CTA", text: "সাবস্ক্রাইব করুন", sub: "নতুন প্রজেক্ট প্রতি সপ্তাহে" } },
    ],
  });
setCurrent(slug);
console.log("✓ ডেমো তৈরি: media/videos/demo/   এখন: npm run plan → npm run studio  (বা npm run render)");
