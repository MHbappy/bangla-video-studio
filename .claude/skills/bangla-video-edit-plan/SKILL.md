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

Shot options: `broll: "name"` or `{ "file", "from": sec, "move": "slowZoomIn|slowZoomOut|panLeft|panRight|none", "sound": 0–1, "rate": 0.25–4, "grade": { "brightness", "contrast", "saturation" } }`; `punch: 1.0–1.3` (static crop); `zoom: 1.05–1.15` (slow push across the shot); `captions: false`; `sfx: false`; `note` (for humans only).

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

## Editing craft (follow these)
**Structure**
- The first shot is `aroll` — the hook needs the face. Add a `TitleCard` motion shot only if the speaker announces the topic after the hook.
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
- Numbers, prices or percentages → `StatCard`. 2–4 parallel items → overlay `BulletList`; 4+ items → `motion`. Comparisons → `Compare`. "এই/এখানে/খেয়াল করুন" pointing at the footage → `Callout` (estimate x,y from the framing; say it's an estimate).
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

**Ending:** for YouTube uploads add `"endScreen": 12` (5–20 s, or `{ "seconds": 12, "text": "দেখার জন্য ধন্যবাদ" }`): the last seconds become the end-screen layout, which leaves room for YouTube's end-screen elements, and the contact bar shows there. Put the CTA shot just before it. Skip it when the user says the video isn't for YouTube.

**Captions:** `captionEmphasis` (default on) colours numbers, prices and Latin-script names (6000W, ৳১২,৫০০, ESP32) in the brand colour — write them that way in the transcript. `captionStyle` is `"box"` for tutorials (most readable) or `"highlight"` for energetic videos. Use `captions: false` only where on-screen text would clash.

## Missing B-roll
Where a shot clearly needs B-roll and nothing matches, fall back to `aroll+gfx` or a punch, and list it at the end:
`c14–c16 (00:52–01:01): দরকার — MQ-2 সেন্সরের ক্লোজআপ, হাতে ধরে`. The user can shoot it, drop it into `media/videos/<slug>/broll/`, and ask you to update the plan.

## Revisions
Requests like "শট ৭ split করো", "১:২০-এ মুখ দেখাও", "দামের জায়গায় StatCard": change only the affected shots. Keep the other `until` values intact. Re-run `npm run plan`, and summarise the change in one line.

## Report (short, Bangla)
- A shot-count summary by layout and the total runtime.
- The missing-B-roll list, and the warnings you kept.
- Next step: `npm run studio -- <slug>` to review, then `npm run render -- <slug>` (Shorts: `--format shorts --from <s> --to <s>`), and `npm run thumbs -- <slug>` for thumbnail frames.

## Thumbnail
When asked ("থাম্বনেইল বানাও"): run `npm run thumbs -- <slug>` if `output/thumbs/` is empty, look at the candidate frames (Read the jpgs), pick the one with a clear face and expression unless the user named one, then `npm run thumbs -- <slug> --pick N --title "…" [--sub "…"] [--side left|right]`. Title: 2–5 words, the promise or the number, not the video title; wrap the 1–2 key words in `*…*` for the brand colour. `--side` = the side for text, opposite the face. Read `output/thumbnail.jpg` and check the face isn't covered before reporting.
