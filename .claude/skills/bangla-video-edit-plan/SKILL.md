---
name: bangla-video-edit-plan
description: Write or revise the shot-by-shot edit plan (edit.json) for a bangla-video-studio video — choosing A-roll, B-roll, split, PiP and motion graphics per line of the transcript like a senior editor. Use for "edit plan বানাও", "শট বদলাও", "add B-roll / motion here".
---

# Bangla video edit plan

You are the editor. The user has already cut the A-roll, so you don't cut. You decide **what is on screen at every moment** while their voice runs continuously underneath.

## Read first
Slug: the one the user names, else the contents of `media/.current`. Under `media/videos/<slug>/`:
- `captions-index.txt` — one line per caption: `c12  00:41.2–00:44.0  text`. **Plan against this.** If it's missing, run `npm run finalize -- <slug>` first.
- `assets.json` — run `npm run assets -- <slug>` first. Lists B-roll and music, each with `name`, `kind` (video/image), `durationSec`, size, and source (this video or the shared library).
- `edit.json` if it already exists — for a revision, change only what was asked.
- `notes.md` if it exists — the user's brief for this video (topic, product names, prices, what to show where), written in the resource manager (`npm run ui`). Follow it; it outranks your own defaults. If a note can't be done (e.g. B-roll it mentions doesn't exist), say so.
- `src/timeline-types.ts` — the `EditFile` schema and the valid `SCENES`.
- Scene props: the components in `src/scenes/` (see the table below).

## Video type — decide first
Read `notes.md` and skim the whole transcript, then pick one and name it in the report:
- **Tutorial / explainer** — teaches how to make, do or understand something. The craft rules below apply as written.
- **Product marketing** — sells a product, machine or service (features, price, offer, "অর্ডার করুন"). The craft rules apply **with the changes in "Product marketing videos"**.
- **Mixed** (a tutorial that ends in a pitch, a product demo that teaches) — tutorial rules for the teaching part, marketing rules from the line where the pitch starts.

`notes.md` decides when it names the type or the platform (YouTube / Facebook / Reels). If the platform isn't stated, plan so both work (no `endScreen`), and say so in the report.

## Output: `media/videos/<slug>/edit.json`
```json
{
  "arollFocus": "50% 35%",
  "captionStyle": "box",
  "autoPunch": true,
  "sfx": true,
  "music": { "file": "calm-01.mp3", "volume": 0.12, "duck": 0.35 },
  "shots": [
    { "until": "c3", "layout": "aroll" },
    { "until": "c5", "layout": "aroll+gfx", "gfx": { "scene": "LowerThird", "name": "…", "role": "…" } }
  ]
}
```
- Shots follow each other with no gaps. `until: "cN"` means the cut lands in the pause after caption line N. The last shot is `"end"`. Use seconds (`42.5`) only when the user gives a time.
- Then run `npm run plan -- <slug>`. Fix every ✗ error yourself and re-run until it passes. Report the ⚠ warnings you chose to keep, and say why.

## Layouts
| layout | screen | use when |
|---|---|---|
| `aroll` | the speaker | hook, personal or emotional point, opinion, the turn into the CTA |
| `aroll+gfx` | speaker + overlay graphic | stating a fact while presence matters: name, number, short list, "look here" |
| `broll` | B-roll fills the screen | talking about a thing or action that the B-roll shows |
| `split` | speaker left, B-roll right (top/bottom in Shorts) | explaining an object they're holding or showing; comparison |
| `pip` | B-roll big, speaker small in a corner | screen recording, code, software, step-by-step demo |
| `motion` | full-screen motion graphic, captions hidden | chapter change, title, 4+ item list, big number, comparison |
| `motion+aroll` | motion + speaker in a circle | explaining with a graphic while keeping presence |
| `endscreen` | speaker small on the left, right side empty for YouTube end-screen elements | never write it yourself — set `"endScreen"` (below) |

**Graphics over footage:** `broll`, `split` and `pip` shots may also carry a `gfx` (optional). It is drawn in overlay mode on top of the B-roll or screen recording, e.g. `{ "until": "c9", "layout": "broll", "broll": "laser-cutting-wide.mp4", "gfx": { "scene": "StatCard", "value": "৳১২,৫০,০০০", "label": "6000W লেজার" } }`. Use it when the footage itself should carry the fact: the price or model over the product shot, a feature name as a `LowerThird` (`name` = feature or product, `role` = one-line benefit), a `Callout` on a part of the machine, or on a button / line of code in a screen recording (`pip`). On `split` use only `Callout`, `LowerThird`, `TitleCard`, `ChapterCard` or `CTA` — the right-hand cards (`BulletList`, `StatCard`, `Compare`, `Offer`, `SpecTable`, `Review`) cover the B-roll half (`plan` warns). One graphic per shot; keep the shot ≥ 2.5 s.

Shot options: `broll: "name"` or `{ "file", "from": sec, "move": "slowZoomIn|slowZoomOut|panLeft|panRight|none", "sound": 0–1, "rate": 0.25–4, "grade": { "brightness", "contrast", "saturation" }, "fit": "fill|fit", "focus": "x% y%" }`; `punch: 1.0–1.3` (static crop); `zoom: 1.05–1.15` (slow push across the shot); `captions: false`; `sfx: false`; `note` (for humans only).

## Scenes (gfx)
| scene | props | overlay (aroll+gfx) | full (motion) |
|---|---|---|---|
| `TitleCard` | title, subtitle? | top-left banner | opening title |
| `ChapterCard` | title, number? | top-left tag | chapter divider → **also builds YouTube chapters** |
| `BulletList` | items[], title? | right panel, ≤4 items | list, items appear one by one with a pop |
| `StatCard` | value, label, sub? | right panel | big counting number ("৳১,২৫০", "৯৮%") |
| `LowerThird` | name, role? | name bar | — |
| `CTA` | text, sub? | top pill | end card |
| `Callout` | text, x, y (target %), sub? | ring + arrow on a point in the footage | big quote / key takeaway |
| `Compare` | left{title,items[]}, right{title,items[]}, title? | small panel | A vs B, before / after |
| `Offer` | price, was?, label?, badge?, sub? | right panel: old price struck through, new price pops | the offer, big: badge → product → ~~old~~ → new price → condition |
| `SpecTable` | rows[{label,value}], title? | right panel, ≤ 5 rows | specification sheet, ≤ 7 rows |
| `Review` | quote, name?, role?, rating? (1–5) | right panel: quote, stars, name | customer quote, centred |

## Editing craft (follow these)
**Structure**
- The first shot is `aroll` — the hook needs the face (marketing videos may open on the product: see below). Add a `TitleCard` motion shot only if the speaker announces the topic after the hook.
- The first time the speaker introduces themselves → `LowerThird` (once per video).
- Each topic change → a `ChapterCard`: `motion` (or `motion+aroll` if they keep talking over it). Aim for 3+ chapters at least 10 s apart, so YouTube chapters work.
- End: `aroll+gfx` with `CTA` over the closing line, and `zoom: 1.06–1.1` for energy.

**Rhythm**
- Talking-head sections: change what's on screen every 6–12 s (B-roll, split, gfx, or a punch change). Never more than about 15 s of plain `aroll` without `zoom`.
- `autoPunch` (on by default) alternates the crop 1.0/1.1 on back-to-back A-roll shots, which hides jump cuts. Split a long aroll stretch into 2–3 aroll shots at sentence ends to use it.
- B-roll or split shots: 2.5–6 s. Motion: at least 3 s, and at least the reading time (about 0.3 s per word + 1 s).
- Don't repeat the same layout 3 times in a row (aroll excepted). Don't reuse one B-roll file within about 60 s.
- Leave a shot or two of breathing room after a dense motion graphic.

**Matching**
- Choose B-roll only when its **name** clearly matches what is being said at that moment. If a name is vague (IMG_1234), don't use it — ask.
- Numbers, prices or percentages → `StatCard`. 2–4 parallel items → overlay `BulletList`; 4+ items → `motion`. Comparisons → `Compare`. "এই/এখানে/খেয়াল করুন" pointing at the footage → `Callout`, on the speaker's shot (`aroll+gfx`) or on the B-roll / screen recording that shows the thing.
- **Place every `Callout` by looking, not guessing:** after `npm run plan`, run `npm run frame -- <slug> --shot N`, Read the jpg it prints (`work/frames/shot-NN.jpg` — the composed frame with the graphic on it), correct `x`,`y` (% from the frame's top-left) until the ring sits on the target, then re-run `plan` and `frame` once to confirm. On B-roll, `x`,`y` refer to what is visible in that shot, so set `from` first. A Callout on B-roll pins the clip still (`plan` sets `"move": "none"`); avoid it on handheld or panning footage where the target drifts. Write `x`,`y` for the 16:9 frame only: in Shorts (9:16) the Callout is moved onto the same spot of the footage automatically, and is dropped for that shot if the spot is cropped out of the vertical frame (then set the clip's `focus`, or leave it on auto `fit`).
- Product videos: put the price, model and key spec **on the product footage** (`broll` + `StatCard` / `LowerThird`) rather than cutting back to the face for every fact.
- Screen work → `pip`. Holding an object → `split`.
- Keep gfx text short: list items ≤ 5 words, a title ≤ 7 words. Use the speaker's own terms, in Bangla script except for technical names.

**Sound**
- Music: if a track exists, add `music` (volume 0.10–0.14, duck 0.3–0.4). Pick it by its name or mood. For a long video with a clear mood change (calm explanation → energetic demo), use sections: `"music": [{ "file": "calm.mp3", "until": "c40" }, { "file": "upbeat.mp3" }]` — they crossfade; each section ≥ 8 s. Music lifts by itself under ChapterCard/TitleCard motion shots.
- B-roll natural sound: machines, tools, cutting, sparks, engines, crowds → `"sound": 0.1–0.2` so the action is heard under the voice. Silent or noisy-irrelevant clips (wind, chatter) stay at 0. `npm run assets` marks clips 🔊 (has audio) / 🔇.
- Keep `sfx` on (whoosh on big layout changes, pops on graphics). Set `sfx: false` on emotional or serious shots.

**Branding:** the logo and contact bar come from `media/library/brand/brand.json` automatically — don't copy them into `edit.json`. Add `"brand"` only when the user asks for this video to differ: `false` turns branding off, or an object overrides single keys (`{ "contactBar": false }`, `{ "phone": "…" }`, `{ "contactBar": { "every": 45 } }`). The contact bar skips `motion`, `motion+aroll` and `pip` shots and lifts the 16:9 captions while it shows, so don't move shots to make room for it. Don't add a phone/contact `CTA` that repeats the bar.

**Picture**
- Slow motion: `"rate": 0.5` on action B-roll (cutting, pouring, sparks) only when `assets` shows 50/60 fps; on 24/30 fps it stutters (`plan` warns).
- Colour: if the B-roll comes from a phone and looks different from the A-roll (and the user mentions it, or notes.md does), set `"brollGrade": { "brightness": 0.95, "contrast": 1.05, "saturation": 0.9 }` (values 0.5–1.5, 1 = unchanged); per-clip `grade` overrides. Don't grade by default — the user grades A-roll in Resolve.

**Footage shape (Shorts and phone clips):** the same edit renders 16:9 and 9:16. When a clip's shape doesn't match the frame — a wide clip or screen recording in Shorts, or a vertical phone clip in 16:9 — it is shown **whole, over a blurred copy of itself**, whenever cropping would lose more than half of it (`assets` lists each clip's size). So nothing is cut off by default, and screen recordings stay readable in Shorts. Override per clip only with a reason:
- `"fit": "fill"` — fill the frame and crop the sides: for close-ups where the subject sits in the middle and a full-screen look matters (product hero shots in a Reel). Add `"focus": "70% 50%"` (x% y%, like `arollFocus`) when the subject is off-centre; `focus` also steers the crop in `split`.
- `"fit": "fit"` — force the whole picture even where the crop would be small (wide machines, text or diagrams that must stay complete).
- If the user says the video is mainly for Reels/Shorts/Facebook vertical, check the vertical look of B-roll shots with `npm run frame -- <slug> --shot N --format shorts` and choose `fill` + `focus` for the hero shots.

**Ending:** for YouTube uploads add `"endScreen": 12` (5–20 s, or `{ "seconds": 12, "text": "দেখার জন্য ধন্যবাদ" }`): the last seconds become the end-screen layout, which leaves room for YouTube's end-screen elements, and the contact bar shows there. Put the CTA shot just before it. Skip it when the user says the video isn't for YouTube.

**Captions:** `captionEmphasis` (default on) colours numbers, prices and Latin-script names (6000W, ৳১২,৫০০, ESP32) in the brand colour — write them that way in the transcript. `captionStyle` is `"box"` for tutorials (most readable) or `"highlight"` for energetic videos. Use `captions: false` only where on-screen text would clash.

## Product marketing videos
The viewer should want the product and know how to get it. The speaker's words stay as they are; you choose the pictures that prove them.

**Beats.** Find these in the transcript (they come in the speaker's order, and not every video has all of them) and give each its treatment:
| beat | on screen |
|---|---|
| hook (first 3–5 s) | the strongest picture available. If the first line is about the product or its result and a clear product-in-action clip exists: `broll` with `"sound": 0.15` (see Sound). Otherwise the face with `zoom`. Either way add the promise as an overlay `TitleCard` (≤ 5 words, the speaker's own claim) |
| problem / need | the face, or B-roll of the problem if it exists; no graphic |
| product reveal | hero wide shot: `broll` + `LowerThird` (`name` = product / model, `role` = what it is in one line) |
| features | **one feature per shot**: B-roll that shows that feature + `LowerThird` (`name` = feature, `role` = what the buyer gains), or a `Callout` on the part. 3–5 s each |
| specs | when the speaker runs through specifications (power, size, capacity, warranty): `SpecTable` over a wide product shot (≤ 5 rows), or `motion` for a longer sheet (≤ 7 rows). `label` ≤ 3 words, `value` short ("6000W", "৩ × ১.৫ মিটার") |
| proof | the product working, the finished result, customers, the workshop, delivery: `broll` with its own sound. A proof number ("৫০০+ কাস্টমার", "২ বছর ওয়ারেন্টি") → `StatCard`. A customer's words → `Review` (rule below) |
| price / offer | one price → `StatCard` on product footage: `value` = price, `label` = product / model, `sub` = what is included or the condition ("ফ্রি ডেলিভারি"). A discount or an old price → `Offer`: `{ "scene": "Offer", "price": "৳১২,৫০,০০০", "was": "৳১৪,০০,০০০", "label": "ATI Laser 6000W", "badge": "১১% ছাড়", "sub": "অফার ৩০ নভেম্বর পর্যন্ত" }` — on product footage, or as the one full-screen `motion` of the video |
| CTA | the face + `CTA`, `zoom: 1.06–1.1` |

**What changes from the tutorial rules**
- **Product on screen:** the product is visible (`broll`, `split`, `pip`) for at least 60% of the runtime. The face is for the hook, trust lines ("আমরা নিজেরা বানাই", warranty, the promise) and the CTA.
- **Pace:** change the picture every 3–6 s; B-roll shots 2–4 s; no plain `aroll` longer than about 8 s. Graphics over footage still need ≥ 2.5 s. Back-to-back `broll` shots are normal here (the "not 3 in a row" rule doesn't apply) as long as the clip changes each time; still don't reuse one clip within about 60 s unless `from` shows a different part.
- **Facts only from the speaker or `notes.md`:** never put a price, discount, warranty, stock claim, spec or superlative ("সেরা", "১ নম্বর") on screen that isn't in the transcript or the notes. No price given → no price graphic; list it as a question in the report. If a number in the transcript and in `notes.md` differ, use the notes (Whisper mishears numbers) and say so.
- **Quick feature list without matching footage:** a wide product shot `broll` + overlay `BulletList` (≤ 4 items, ≤ 4 words each), rather than a full-screen `motion`.
- **Reviews are quoted, never written:** `Review` only for words a real customer said — the customer speaking in the footage, the speaker quoting them, or a review pasted into `notes.md`. Shorten it to ≤ 18 words without changing the meaning. `name`, `role` (work / place) and `rating` only if given; never invent a name, a place or stars. On a clip of the customer talking, use `broll` + `Review` with `"sound"` off unless the notes ask for their voice.
- **`badge` on `Offer`:** only a discount, deadline or stock claim the speaker or the notes state ("১১% ছাড়", "সীমিত সময়"). Work out a percentage only when both prices are given, and round down.
- **Vertical-first videos:** the right-hand cards sit at the top in 9:16 and a tall one covers the top of the footage. Keep an overlay `SpecTable` to ≤ 3 rows there (or use `motion`), and check `Offer` / `Review` shots with `--format shorts`.
- **Comparison:** `Compare` only when the speaker compares (old way vs this product, model A vs B). Use the speaker's names for the two sides; don't name a competitor they didn't name.
- **Full-screen `motion`: at most once or twice**, for the price / offer or the final CTA. A marketing video shows the product, not slides.
- **Chapters:** under about 2 minutes, no `ChapterCard` (it slows the pitch, and chapters don't help an ad). Long walkthroughs (3 min+) keep them.
- **`LowerThird` for the speaker:** only if they introduce themselves; the feature `LowerThird`s matter more. Don't put two `LowerThird` shots back to back.
- **CTA text:** the action plus the reason to act now, from the speaker's words: `{ "scene": "CTA", "text": "আজই অর্ডার করুন", "sub": "ঢাকায় ফ্রি ডেলিভারি" }`. The phone number, page and QR come from the contact bar, so don't repeat them in the CTA. If the speaker asks for the order mid-video too (videos over ~60 s), put an overlay `CTA` on that line as well.
- **Contact must be on screen:** after `npm run plan`, look for the line `ব্র্যান্ড: … যোগাযোগ বার Nবার`. If the line is missing or N is 0, the video has no phone / page on screen — tell the user to fill in the brand details in `npm run ui` (or give the number in `notes.md`, then add it as `"brand": { "phone": "…" }`). The bar skips `pip` and `motion` shots, so keep the last 7 s out of those layouts.
- **Ending:** end on the CTA shot with the contact bar. Add `endScreen` only when the notes say YouTube.
- **Look:** `"captionStyle": "highlight"`; music from the energetic end of what exists, volume 0.12–0.14; machine / tool / product sound on action B-roll.
- **Vertical first:** most marketing videos also go to Reels / Facebook. Check the hook, hero and price shots with `npm run frame -- <slug> --shot N --format shorts` and set `fill` + `focus` where the product should fill the screen (see "Footage shape").
- **Shorts cut:** find the best continuous 20–60 s (ideally hook or a strong feature → price → CTA) and give its range in the report as a ready `--format shorts --from <s> --to <s>` command. You can't reorder, so pick a stretch that makes sense alone.

## Missing B-roll
For a marketing video, check the footage against this list first, and name what's absent: hero wide shot, a close-up for each feature that is mentioned, the product in use, the result / output, packaging or delivery, a customer or the workshop.

Where a shot clearly needs B-roll and nothing matches, fall back to `aroll+gfx` or a punch, and list it at the end:
`c14–c16 (00:52–01:01): দরকার — MQ-2 সেন্সরের ক্লোজআপ, হাতে ধরে`. The user can shoot it, drop it into `media/videos/<slug>/broll/`, and ask you to update the plan.

## Revisions
Requests like "শট ৭ split করো", "১:২০-এ মুখ দেখাও", "দামের জায়গায় StatCard": change only the affected shots. Keep the other `until` values intact. Re-run `npm run plan`, and summarise the change in one line.

## Report (short, Bangla)
- The video type you planned for (tutorial / marketing / mixed), a shot-count summary by layout, and the total runtime.
- Marketing: the share of runtime with the product on screen, whether the contact bar shows, any fact you left off screen because it wasn't in the transcript or notes, and the suggested Shorts range.
- The missing-B-roll list, and the warnings you kept.
- Next step: `npm run studio -- <slug>` to review (`npm run frame -- <slug> --shot N` for a quick still of one shot), then `npm run render -- <slug>` (Shorts: `--format shorts --from <s> --to <s>`), and `npm run thumbs -- <slug>` for thumbnail frames.

## Thumbnail
When asked ("থাম্বনেইল বানাও"): run `npm run thumbs -- <slug>` if `output/thumbs/` is empty, look at the candidate frames (Read the jpgs), pick the one with a clear face and expression unless the user named one, then `npm run thumbs -- <slug> --pick N --title "…" [--sub "…"] [--side left|right]`. Title: 2–5 words, the promise or the number, not the video title; wrap the 1–2 key words in `*…*` for the brand colour. `--side` = the side for text, opposite the face. Read `output/thumbnail.jpg` and check the face isn't covered before reporting.
