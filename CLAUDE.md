# Bangla Video Studio — Claude-এর নির্দেশনা

পুনর্ব্যবহারযোগ্য টেমপ্লেট: প্রতিটা ভিডিও `media/videos/<slug>/`-এ, শেয়ার্ড রিসোর্স `media/library/`-এ।
ব্যবহারকারী A-roll আগেই কেটে আনেন — **Claude কাটবে না।** Claude-এর কাজ: বানান ঠিক, শট প্ল্যান, scene, রেন্ডার চালানো।
সব কিছু শুধু Node-এ চলে (Mac/Windows/Linux) — সিস্টেম ffmpeg ধরে নেবে না (`scripts/media.ts` Remotion-এর ffmpeg ব্যবহার করে), কমান্ড npm script দিয়ে চালাবে।

## ফ্লো (slug না দিলে `media/.current`-এর ভিডিও)
| ধাপ | কে | কমান্ড / Skill |
|---|---|---|
| ১ নতুন ভিডিও + ট্রান্সক্রাইব | কমান্ড | `npm run new -- <slug> <file>` |
| ২ বানান ঠিক → `transcript.json` | Claude | Skill **bangla-caption-fix** |
| ৩ ক্যাপশন লাইন | কমান্ড | `npm run finalize -- <slug>` |
| ৪ শট প্ল্যান → `edit.json` | Claude | Skill **bangla-video-edit-plan** (আগে `npm run assets`) |
| ৫ যাচাই → `timeline.json` | কমান্ড | `npm run plan -- <slug>` (error নিজে ঠিক করবে) |
| ৬ রিভিউ | ব্যবহারকারী | `npm run studio -- <slug>` (Claude এক শটের ছবি দেখে: `npm run frame -- <slug> --shot N [--format shorts]`) |
| ৭ রেন্ডার | কমান্ড | `npm run render -- <slug> [--format main\|shorts\|graphics\|all] [--from s --to s] [--fast]` |
| ৮ থাম্বনেইল | Claude | `npm run thumbs -- <slug>` → ফ্রেম বেছে `--pick N --title "…"` (Skill **bangla-video-edit-plan**) |

"নতুন ভিডিও প্রসেস করো" → ১–৫ নিজে চালাবে, তারপর রিভিউয়ের জন্য থামবে। রেন্ডার দীর্ঘ — চালানোর আগে জানাবে।
নতুন মোশন scene → Skill **remotion-scene-builder**।

**রিসোর্স ম্যানেজার** (`npm run ui`, `scripts/ui.ts` + `ui/index.html`): ব্যবহারকারী ব্রাউজার থেকে ব্র্যান্ড তথ্য, লোগো/QR, মিউজিক, B-roll আর নতুন ফুটেজ দেন — সব ঠিক ফোল্ডারেই যায়। প্রতি ভিডিওর `notes.md` = ব্যবহারকারীর নির্দেশনা (বিষয়, নাম, দাম, কোথায় কী) — ধাপ ২ আর ৪-এ পড়বে। "<slug> প্রসেস করো" বললে ট্রান্সক্রাইব আগেই হয়ে থাকলে ধাপ ২ থেকে শুরু।

## ফাইল (প্রতি ভিডিও)
`aroll.*` · `project.json` · `work/raw.json` (Whisper) · `transcript.json` (Claude) · `captions.json` + `captions-index.txt` (finalize) ·
`edit.json` (Claude/ব্যবহারকারী) · `notes.md` (ব্যবহারকারীর নির্দেশনা) · `timeline.json` + `assets.json` (plan) · `broll/`, `music/` (এই ভিডিওর) · `output/` (final.mp4, shorts.mp4, graphics.mov, captions.srt, chapters.txt, thumbs/, thumbnail.jpg)

B-roll/মিউজিকের নাম আগে ভিডিওর ফোল্ডারে, না পেলে `media/library/`-এ খোঁজা হয়। SFX: `media/library/sfx/whoosh.wav`, `pop.wav`।
ব্র্যান্ড (লোগো, যোগাযোগ বার, QR): `media/library/brand/brand.json` + ছবি; এক ভিডিওতে বদল → `edit.json`-এ `brand`। কোড: `src/main/Brand.tsx`।

## কোড মানচিত্র
- `src/main/Edit.tsx` — Main/Vertical/Graphics তিনটার রেন্ডারার; `geometry.ts` — লেআউটের জায়গা (১৬:৯ ও ৯:১৬)
- `src/scenes/` — TitleCard, ChapterCard, BulletList, StatCard, LowerThird, CTA, Callout, Compare, Offer (আগের দাম কেটে নতুন দাম), SpecTable, Review
- `src/theme.ts` — ব্র্যান্ড; `src/timeline-types.ts` — edit/timeline স্কিমা
- `scripts/` — পাইপলাইন; `docs/` — ব্যবহারকারীর গাইড

## একাধিক কম্পিউটার (GitHub)
git-এ: কোড, Skills, গাইড, `media/library/`। git-এ **নয়**: `media/videos/*` (ব্যবহারকারী ফোল্ডার কপি করে আনেন), `models/`, `node_modules/`, `.env`।
নতুন কম্পিউটারে `node_modules/` বা `models/` না থাকলে আগে `npm install` → `npm run setup`।
মেশিন-ভেদে সেটিং `.env`-এ (`QUALITY`, `DEVICE`, `OFFLINE`, `PORT`, `BROWSER_EXECUTABLE`) বা কমান্ডে `--quality accurate` / `--device dml` / `--offline` — `VAR=x npm run …` লিখবে না (Windows-এ চলে না)।
`new`/`assets`/`plan` ফুটেজের ফরম্যাট নিয়ে ⚠ দিলে (HDR, ProRes, H.265) ব্যবহারকারীকে জানাবে।

## নিয়ম
- ব্যবহারকারীর `edit.json`/`transcript.json` টেস্টের জন্য বদলালে আগের অবস্থায় ফেরত দেবে।
- কোডে পথ সবসময় `path.join` / `scripts/paths.ts` দিয়ে; shell-নির্ভর কিছু (`&&`, `rm`, `cp`, env প্রিফিক্স) npm script-এ নয়।
- কোড বদলালে `npm run typecheck` এবং দরকারে demo-তে still রেন্ডার করে দেখে নেবে।
- উত্তর বাংলায়, সংক্ষেপে।
