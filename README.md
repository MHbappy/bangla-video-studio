# Bangla Video Studio

আপনার কাটা ফুটেজ থেকে পেশাদার মানের বাংলা ভিডিও — ক্যাপশন, B-roll, মোশন গ্রাফিক্স, সাউন্ড, Shorts।
**পুনর্ব্যবহারযোগ্য টেমপ্লেট:** প্রতিটা ভিডিওতে শুধু রিসোর্স বদলান। **শুধু Node.js লাগে** — Mac, Windows, Linux।

## নতুন মেশিনে একবার
দরকার: [Node.js](https://nodejs.org) ২০ বা নতুন (LTS) আর Google Chrome/Edge। আর কিছু না — ffmpeg, ফন্ট, মডেল সব নিজে থেকে আসে।
```bash
git clone <আপনার-repo-লিংক> bangla-video-studio
cd bangla-video-studio
npm install
npm run setup      # Whisper মডেল (~১.১GB) + ডিফল্ট সাউন্ড ইফেক্ট + যাচাই (ffmpeg, ব্রাউজার)
npm run demo       # (ঐচ্ছিক) নিজের ফুটেজ ছাড়া পুরো সিস্টেম টেস্ট
```
তারপর এই ফোল্ডারে Claude Code খুলুন — নির্দেশনা (`CLAUDE.md`) আর Skills (`.claude/skills/`) সাথেই আছে।

## রিসোর্স দেওয়ার সহজ উপায়
```bash
npm run ui         # ব্রাউজারে: ব্র্যান্ড তথ্য, লোগো, মিউজিক, B-roll, নতুন ফুটেজ, Claude-এর জন্য নোট
```

## প্রতিটা ভিডিও
```bash
npm run new -- gas-detector ~/Desktop/gas-final.mp4   # ফোল্ডার + ট্রান্সক্রাইব
#   B-roll রাখুন: media/videos/gas-detector/broll/  (বা শেয়ার্ড media/library/broll/)
# Claude: "captions ঠিক করো"
npm run finalize
# Claude: "edit plan বানাও"
npm run plan
npm run studio                                         # দেখুন; বদল চাইলে Claude-কে বলুন
npm run render                                         # → output/final.mp4 (মাস্টার করা অডিও)
npm run render -- --format shorts --from 65 --to 120   # একই এডিট থেকে Shorts
```
নাম না দিলে শেষবার যে ভিডিওতে কাজ করেছেন সেটাই ধরা হয়। সব ভিডিও: `npm run list`।

## কী পাবেন
- ৭টা লেআউট: `aroll` · `aroll+gfx` · `broll` · `split` · `pip` · `motion` · `motion+aroll` — ১৬:৯ ও ৯:১৬ দুটোতেই
- B-roll আর স্ক্রিন রেকর্ডিংয়ের উপরেও গ্রাফিক্স: পণ্যের শটে দাম/ফিচার, স্ক্রিনে "এখানে চাপুন" তীর
- ১১টা মোশন scene: TitleCard · ChapterCard · BulletList · StatCard · LowerThird · CTA · Callout · Compare · Offer (অফারের দাম) · SpecTable (স্পেক টেবিল) · Review (কাস্টমারের কথা)
- ব্র্যান্ডিং: কোণায় লোগো, মাঝে মাঝে যোগাযোগ বার (ফোন, ঠিকানা, সোশ্যাল, QR) — `media/library/brand/brand.json` একবার সেট করলেই
- অটো পাঞ্চ-ইন (জাম্প-কাট ঢাকে), ধীর জুম, Ken Burns B-roll
- সাউন্ড: A-roll অডিও একটানা, মিউজিক কথার সময় নিচু, whoosh/pop SFX, -14 LUFS মাস্টারিং
- আউটপুট: final.mp4 · shorts.mp4 · graphics.mov (স্বচ্ছ, Resolve-এর জন্য) · captions.srt · chapters.txt
- Claude Skills (`.claude/skills/`): bangla-caption-fix · bangla-video-edit-plan · remotion-scene-builder

## GitHub ও একাধিক কম্পিউটার
| জিনিস | git-এ যায়? | অন্য কম্পিউটারে কীভাবে |
|---|---|---|
| কোড, Skills, গাইড, `glossary.txt` | ✓ | `git pull` |
| ব্র্যান্ড (`brand.json`, লোগো, QR), SFX, লাইব্রেরির মিউজিক/B-roll | ✓ | `git pull` — প্রতিটা ফাইল ১০০MB-র নিচে রাখুন (GitHub-এর সীমা); বড় ক্লিপ হাতে কপি করুন |
| প্রতিটা ভিডিও (`media/videos/<নাম>/` — ফুটেজ, প্ল্যান, আউটপুট) | ✗ | পুরো ফোল্ডারটা কপি করুন (পেনড্রাইভ/ড্রাইভ) — ওই কম্পিউটারে সরাসরি `npm run studio -- <নাম>` চলবে |
| Whisper মডেল (`models/`), `node_modules/` | ✗ | `npm install` + `npm run setup` (বা `models/` কপি → ইন্টারনেট লাগবে না) |
| এই কম্পিউটারের সেটিং (`.env`) | ✗ | `.env.example` কপি করে `.env` বানান (GPU, মান ইত্যাদি) |

লোগো/ফোন নম্বর সবার সামনে দিতে না চাইলে GitHub-এ repo **Private** রাখুন।
**Windows:** PowerShell, cmd, Git Bash — সবখানে একই কমান্ড। পথে ফাঁকা থাকলে উদ্ধৃতি দিন: `npm run new -- laser "D:\My Videos\laser cut.mp4"`।

## গাইড
- **HOW-TO-USE.md** — পুরো সিস্টেম ধাপে ধাপে (প্রথমে এটা পড়ুন)
- **WHERE-TO-PUT.md** — কোন ফাইল কোন ফোল্ডারে
- **docs/RESOURCES.md** — কী কী রিসোর্স, কোথায়, কোন মানে
- **docs/TESTING.md** — ধাপে ধাপে টেস্ট
- **docs/SETTINGS.md** — মান/গতি সেটিং, ব্র্যান্ড, রেন্ডার অপশন
