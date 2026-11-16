---
name: bangla-caption-fix
description: Correct a Bangla transcript or SRT/VTT for subtitles without changing any timing — spelling, misheard words, punctuation, glossary terms. Use for "captions ঠিক করো", "fix the transcript/SRT", or bangla-video-studio's transcript step.
---

# Bangla caption fix

Turn a Bangla subtitle text (the user's own SRT/VTT, often exported from an auto-caption tool) into publish-ready subtitles. **Timing is sacred; only text changes.**

## Inputs — find them in this order
1. **bangla-video-studio project** (has `media/videos/<slug>/`): read `media/videos/<slug>/work/raw.json`
   (`{ source, segments: [{ id, startMs, endMs, text }] }` — imported by `npm run import` from the user's SRT/VTT; the original is `work/source.srt|vtt`). If it is missing, ask the user for the SRT/VTT of this exact cut — there is no transcription step., plus `glossary.txt` at the project root. Also read `media/videos/<slug>/notes.md` if it exists: the user's notes on the topic, product names and prices — treat the names in it like glossary entries.
   Slug: the one the user names, else the contents of `media/.current`.
2. **An SRT / VTT / JSON the user attached or pasted:** keep the same format and the same cue numbers.
3. If the user gave a topic, product names or a word list, treat it as glossary.

## Output
- Project: write `media/videos/<slug>/transcript.json` — **same structure, same ids, same startMs/endMs, same order, same count** — then run `npm run finalize -- <slug>` and report its result.
- Standalone: return the corrected file in the original format.

## Rules
**Never change:** startMs/endMs or SRT timestamps, segment ids or cue numbers, order, or the number of segments. Don't merge, split or add segments.

**Do fix:**
- Bangla spelling: standard modern Bangla Academy spelling (কী/কি by meaning; ী/ি, ূ/ু, ন/ণ, স/শ/ষ, য়/য, ৎ). Fix broken conjuncts and stray halant.
- Misheard words: use the sentence's meaning, the video topic and neighbouring segments. Auto-caption tools often confuse similar-sounding words and splits or merges words wrongly (আমরা/আমারা, করবো/করব — prefer the modern form unless the speaker is clearly dialectal).
- Punctuation: । at sentence ends, ? for questions, ! sparingly, commas where the speaker pauses. No full stop on a segment that clearly continues into the next.
- Technical and English terms: follow `glossary.txt` exactly (for example "ইএসপি থার্টি টু" → "ESP32", "আরডুইনো" → "Arduino"). Product and brand names, code identifiers and units go in Latin script as normally written (ESP32, MQ-2, WiFi, 5V, mAh). Common English words that are usually written in Bangla script stay in Bangla (সেন্সর, বোর্ড, ভিডিও).
- Numbers: keep what was said. Prices in Bangla digits with ৳ if the speaker said taka (৳১,২৫০). Model numbers stay Latin (MQ-2).

**Keep the speaker's voice:** conversational register and their word choice, only spelled correctly. Do not rephrase, formalise, summarise, translate or "improve" sentences. Filler words (মানে, তো, আচ্ছা) stay unless they are a clear stutter repetition ("আমি আমি আমি" → "আমি").

**The user's text is the source of truth.** If it already reads as clean, correct Bangla (typed or reviewed by the user), change only clear typos and glossary terms — don't second-guess wording.

**Auto-caption junk:** some tools invent text in silence or music — "সাবস্ক্রাইব করুন", "ধন্যবাদ", one line repeated 3+ times, text unrelated to the topic, other languages. If a segment is clearly invented, set its `text` to `""` (finalize drops it). Never delete real speech.

**Uncertain:** if you can't tell what was said, keep the original text and list the id.

**Script:** some tools write Bangla speech in English letters (e.g. "Salamualaikum") — rewrite it in Bangla script. `[Music]`, `(হাসি)` style tags: set the segment to `""`.

## Long transcripts
Work in batches of about 80 segments and keep the topic and terms consistent across batches. Write one complete file at the end and check that the segment count matches the input.

## Report (short, in Bangla)
1. How many segments were changed, plus 3–5 example corrections (before → after).
2. Uncertain ids with timestamps, so the user can listen to them.
3. **New technical terms** not yet in `glossary.txt`, in the format `সঠিক রূপ  ←  লেখায় যা এসেছিল`. Offer to add them. Add them only if the user agrees.
4. Ids of segments emptied as hallucinations.
5. Next step: `npm run finalize -- <slug>`, then "edit plan বানাও".
