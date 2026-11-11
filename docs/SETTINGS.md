# সেটিং ও অপশন

## ট্রান্সক্রিপশন
সময় আসে অডিও থেকে: আগে কথা আর বিরতি আলাদা করা হয়, তারপর প্রতিটা বাক্যাংশ (≤১২s) আলাদা করে Whisper-এ — তাই ক্যাপশনের সময় নির্ভুল, চুপ থাকার জায়গায় বানানো লেখা আসে না। ফল কাজের না হলে (কথা নেই / বেশিরভাগ একই লেখার পুনরাবৃত্তি) কমান্ড থেমে কারণ জানায়।

| সেটিং | মান | প্রভাব |
|---|---|---|
| `QUALITY` | `fast` (ডিফল্ট) / `accurate` | accurate: fp32 মডেল (~৩.২GB), একটু বেশি নির্ভুল, ধীর |
| `DEVICE` | `cpu` / `dml` / `cuda` | GPU: Windows-এ `dml`, Linux+NVIDIA-তে `cuda` (Mac-এ শুধু cpu) |
| `WHISPER_MODEL` | `onnx-community/whisper-large-v3-turbo` (ডিফল্ট) | সবচেয়ে নির্ভুল: `onnx-community/whisper-large-v3-ONNX` |
| `OFFLINE` | `1` | ইন্টারনেট ছাড়া, শুধু `models/` থেকে |

দেওয়ার দুই উপায় (Mac, Windows, Linux — সবখানে একই):
- **এই কম্পিউটারে স্থায়ী:** `.env.example` কপি করে `.env` নাম দিন, লাইনের সামনের `#` মুছুন (যেমন `DEVICE=dml`)। `.env` git-এ যায় না — প্রতিটা কম্পিউটারে আলাদা থাকতে পারে।
- **একবারের জন্য:** কমান্ডের শেষে — `npm run transcribe -- laser-machine --quality accurate` · `--device dml` · `--offline`

`accurate`-এ প্রথমবার বড় মডেল (~৩.২GB) নিজে নামবে। `PORT` (রিসোর্স ম্যানেজার, বা `npm run ui -- --port 4322`) আর `BROWSER_EXECUTABLE`-ও `.env`-এ দেওয়া যায়।

## edit.json — ভিডিও-স্তরের অপশন
| অপশন | ডিফল্ট | কাজ |
|---|---|---|
| `arollFocus` | `"50% 35%"` | split/PiP/বৃত্ত/Shorts-এ মুখের অবস্থান |
| `captionStyle` | `"box"` | `box` (বক্সে সাদা লেখা) · `highlight` (বলা শব্দ রঙিন) · `none` |
| `autoPunch` | `true` | পরপর A-roll শটে পালা করে 1.0/1.1 ক্রপ |
| `sfx` | `true` | `false` বা `{ "volume": 0.25 }` |
| `music` | — | `{ "file": "নাম", "volume": 0.12, "duck": 0.35 }` (duck = কথার সময় কতটা থাকবে)। অংশভেদে আলাদা: `[{ "file": "calm.mp3", "until": "c40" }, { "file": "upbeat.mp3" }]` — মাঝে ক্রসফেড; অধ্যায় কার্ডে মিউজিক নিজে একটু ওঠে |
| `captionEmphasis` | `true` | দাম, সংখ্যা, ইংরেজি নাম (৳১২,৫০০ · 6000W · ESP32) ক্যাপশনে ব্র্যান্ড রঙে |
| `endScreen` | — | `12` বা `{ "seconds": 12, "text": "দেখার জন্য ধন্যবাদ" }` — শেষের ৫–২০s A-roll বাঁয়ে ছোট, ডান দিক YouTube end screen-এর জন্য ফাঁকা (Shorts-এ পুরো A-roll) |
| `arollGrade` · `brollGrade` | — | `{ "brightness": 1, "contrast": 1.05, "saturation": 0.95 }` (০.৫–১.৫) — ফোনের B-roll ক্যামেরার সাথে মেলাতে |

শট-স্তরের: `punch`, `zoom`, `captions: false`, `sfx: false`, `broll.from`, `broll.move`, আর B-roll-এ:
- `"gfx": { "scene": "StatCard", … }` — `broll` / `split` / `pip` শটে ঐচ্ছিক: গ্রাফিক্স ফুটেজের উপর বসে (পণ্যের শটে দাম, ফিচারের নাম; স্ক্রিন রেকর্ডিংয়ে "এখানে চাপুন" তীর)। এক শটের ছবি দেখে নিতে: `npm run frame -- laser-machine --shot 7` (খাড়া: `--format shorts`) → `work/frames/`
- `"sound": 0.15` — ক্লিপের নিজের শব্দ (মেশিন, কাটা, স্পার্ক) কথার নিচে; ডিফল্ট ০ = বন্ধ
- `"rate": 0.5` — স্লো-মোশন (৫০/৬০fps ফুটেজে মসৃণ; ৩০fps-এ `plan` সতর্ক করে)
- `"grade": {…}` — শুধু এই ক্লিপের রং
- `"fit": "fill"` বা `"fit"` — ক্লিপ আর ফ্রেমের আকার না মিললে (চওড়া ক্লিপ খাড়া Shorts-এ, বা ফোনের খাড়া ক্লিপ ১৬:৯-এ): `fit` = পুরো ছবি দেখায়, পেছনে তারই ঝাপসা কপি · `fill` = ফ্রেম ভরে, পাশ কাটা পড়ে। না দিলে নিজে ঠিক করে: কাটলে অর্ধেকের বেশি হারালে `fit`
- `"focus": "70% 50%"` — `fill`-এ (আর split-এ) ক্লিপের কোন অংশ থাকবে; ডিফল্ট মাঝখান

বিস্তারিত `.claude/skills/bangla-video-edit-plan/SKILL.md`। `npm run assets` তালিকায় প্রতিটা ক্লিপের fps আর শব্দ আছে কিনা (🔊/🔇) দেখায়।

## থাম্বনেইল
```bash
npm run thumbs -- laser-machine                     # সবচেয়ে পরিষ্কার ৮টা ফ্রেম → output/thumbs/cand-01…08.jpg
npm run thumbs -- laser-machine --pick 3 --title "৬০০০W *লেজার* কাটার" --sub "দাম জানুন" --side left
```
`*…*` = ব্র্যান্ড রঙে। `--side` = লেখা কোন পাশে (মুখ উল্টো পাশে সরে যায়)। ফল: `output/thumbnail.jpg` (1280×720)। রিসোর্স ম্যানেজারের ভিডিও কার্ডে ফ্রেমগুলো দেখা যায়।

## রেন্ডার
```bash
npm run render                                  # ১৬:৯ ফাইনাল (CRF 16, slow preset, 320k অডিও, -14 LUFS)
npm run render -- --fast                        # অর্ধেক রেজোলিউশন প্রিভিউ (দ্রুত)
npm run render -- --format shorts --from 65 --to 120   # ৯:১৬ Shorts, ভিডিওর একটা অংশ
npm run render -- --format graphics             # স্বচ্ছ ProRes 4444 — Resolve-এ A-roll-এর উপরে
npm run render -- --format all                  # তিনটাই
npm run render -- --no-master                   # লাউডনেস মাস্টারিং বাদ
```
Shorts: ৬০ সেকেন্ডের কম রাখুন; হুক দিয়ে শুরু হয় এমন অংশ বাছুন। একই এডিট থেকে আসে — লেআউট নিজে থেকেই খাড়া হয়ে যায়। চওড়া B-roll আর স্ক্রিন রেকর্ডিং খাড়া ফ্রেমে পুরোটা দেখায় (পেছনে ঝাপসা কপি), কিছু কাটা পড়ে না; পুরো স্ক্রিন ভরাতে চাইলে সেই ক্লিপে `"fit": "fill"`। তীর (Callout) নিজে থেকে একই জিনিসের উপর সরে বসে। রেন্ডারের আগে এক শট দেখে নিতে: `npm run frame -- laser-machine --shot 7 --format shorts`।

**ব্রাউজার:** Remotion নিজের Chrome নামাতে না পারলে (নেটওয়ার্ক আটকালে) কম্পিউটারে ইনস্টল করা Chrome/Edge নিজে থেকে ব্যবহার হয়। অন্যটা চাইলে `.env`-এ `BROWSER_EXECUTABLE=<chrome-এর পথ>`। কোনটা ব্যবহার হবে `npm run setup` দেখায়।

**রেন্ডারের সময়** মেশিনের CPU-র উপর নির্ভর করে। ডেমো (৪০s) দিয়ে মেপে নিন, পুরো ভিডিও মোটামুটি সমানুপাতিক। লম্বা ভিডিওতে আগে `--fast` দিয়ে পুরোটা দেখে নিন।

## লোগো, ফোন নম্বর, সোশ্যাল, QR — media/library/brand/
একবার সেট করুন, সব ভিডিওতে নিজে থেকে বসবে (Main, Shorts, Graphics তিনটাতেই)। `npm run plan` চালালে কার্যকর হয়।

১. `media/library/brand/`-এ রাখুন: `logo.png` (স্বচ্ছ ব্যাকগ্রাউন্ড ভালো), ইচ্ছা হলে `qr.png` — এই নামে রাখলে নিজে থেকে ধরে
২. একই ফোল্ডারের `brand.json` খুলে `""`-এর ভেতরে নিজের তথ্য লিখুন। ফাঁকা রাখা ঘর ভিডিওতে দেখায় না।

| অপশন | ডিফল্ট | কাজ |
|---|---|---|
| `name`, `address` | — | যোগাযোগ বারের বাঁ পাশে (ব্র্যান্ড রঙে) |
| `phone`, `phoneLabel` | — | বড় করে ফোন নম্বর, উপরে ছোট লেখা ("অর্ডার করতে কল করুন") |
| `logo` | `logo.png` (থাকলে) | অন্য নামের ছবি হলে নাম লিখুন; `false` = লোগো নেই |
| `logoPosition` | `"top-right"` | `top-left` · `top-right` · `bottom-left` · `bottom-right` (নিচে দিলে ক্যাপশন/বারের সাথে মিশতে পারে) |
| `logoSize` · `logoOpacity` | `80` · `0.9` | উচ্চতা (1080p-তে px) · স্বচ্ছতা |
| `qr` | `qr.png` (থাকলে) | QR ছবি — বারের ডান পাশে; `false` = নেই |
| `social` | — | `[{ "type": "facebook", "text": "fb.com/…" }]` — type: `facebook` · `whatsapp` · `youtube` · `web` · `phone` |
| `contactBar` | `{ "start": 4, "every": 30, "duration": 7, "atEnd": true }` | কখন বার আসবে (সেকেন্ড); `atEnd` = শেষে একবার; `false` = বার বন্ধ |

বার নিয়ম: ফোন আর সোশ্যাল দুটো থাকলে প্রথম অর্ধেক ফোন, পরের অর্ধেক সোশ্যাল। মোশন/PiP শটে বার আসে না (পরের সুযোগে সরে যায়)। ১৬:৯-এ বার এলে ক্যাপশন উপরে সরে।

**শুধু একটা ভিডিওতে আলাদা:** সেই ভিডিওর `edit.json`-এ `"brand": false` (সব বন্ধ) বা `"brand": { "contactBar": false }` / `{ "phone": "…" }` (কয়েকটা বদল)। ছবি আগে `media/videos/<slug>/brand/`-এ খোঁজা হয়, না পেলে লাইব্রেরিতে।

## ব্র্যান্ড — src/theme.ts
`color.accent` (মূল হাইলাইট), `color.accent2` (তুলনার দ্বিতীয় রং), `color.bg/bg2` (মোশনের ব্যাকগ্রাউন্ড), `color.panel` (ফুটেজের উপর কার্ড), `radius`, `spring` (মসৃণতা), `layoutTransitionFrames`, `brollFadeFrames`, `exitFrames`।

## ক্যাপশন লাইনের দৈর্ঘ্য
`scripts/config.ts` → `MAX_CAPTION_CHARS` (ডিফল্ট ৪২)। বদলালে `npm run finalize` আবার — তারপর লাইন নম্বর বদলাতে পারে, তাই plan-ও আবার।
