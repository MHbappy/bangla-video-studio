// ব্যবহারকারীর দেওয়া লেখা (SRT / VTT, সময়সহ) → media/videos/<slug>/work/raw.json
// সময় ফাইল থেকেই আসে — এখানে শুধু পড়া, পরিষ্কার করা আর যাচাই
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { readJson, type Segment, writeJson } from "./lib";
import { binFor, retire, vpath } from "./paths";

export const SUBTITLE = /\.(srt|vtt)$/i;

// 00:01:02,345 · 00:01:02.345 · 01:02.345 (VTT-তে ঘণ্টা ঐচ্ছিক)
const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;
const toMs = (m: RegExpExecArray) => ((Number(m[1] ?? 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + Number(m[4].padEnd(3, "0"));

// <i>, <b>, <font>, VTT-এর <c>/<00:00:01.000> ট্যাগ, {\an8} ইত্যাদি বাদ
const cleanText = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export const parseSubtitles = (raw: string, vtt: boolean) => {
  const notes: string[] = [];
  const blocks = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  const cues: Segment[] = [];
  let prevLines: string[] = [];
  let repeats = 0;
  for (const block of blocks) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) continue; // WEBVTT হেডার, NOTE, STYLE, শুধু নম্বর…
    const [a, b] = lines[at].split("-->");
    const s = TIME.exec(a);
    const e = TIME.exec(b ?? "");
    if (!s || !e) continue;
    let textLines = lines.slice(at + 1).map(cleanText).filter(Boolean);
    // YouTube-এর অটো VTT: প্রতিটা cue-তে আগের লাইনটা আবার থাকে — একই লেখা দুবার যেন না আসে
    if (vtt) {
      const before = textLines.length;
      textLines = textLines.filter((l) => !prevLines.includes(l));
      repeats += before - textLines.length;
    }
    prevLines = lines.slice(at + 1).map(cleanText).filter(Boolean);
    const text = textLines.join(" ");
    if (!text) continue;
    cues.push({ id: 0, startMs: toMs(s), endMs: toMs(e), text });
  }
  if (repeats) notes.push(`${repeats}টা পুনরাবৃত্ত লাইন বাদ (YouTube-স্টাইল VTT)`);

  // ক্রম ঠিক, ওভারল্যাপ থাকলে আগেরটার শেষ পরেরটার শুরুতে; একই সময়ে শুরু হলে দুটো জোড়া
  cues.sort((x, y) => x.startMs - y.startMs);
  const out: Segment[] = [];
  let trimmed = 0;
  let bad = 0;
  for (const c of cues) {
    if (!(c.endMs > c.startMs)) {
      bad++;
      continue;
    }
    const prev = out[out.length - 1];
    if (prev && c.startMs < prev.endMs) {
      if (c.startMs > prev.startMs) {
        prev.endMs = c.startMs;
        trimmed++;
      } else {
        prev.text += " " + c.text;
        prev.endMs = Math.max(prev.endMs, c.endMs);
        trimmed++;
        continue;
      }
    }
    out.push({ ...c });
  }
  if (trimmed) notes.push(`${trimmed}টা লাইনের সময় একটার ওপর আরেকটা পড়ছিল — আগেরটার শেষ সময় ছোট করা হয়েছে`);
  if (bad) notes.push(`${bad}টা লাইনে শেষ সময় শুরুর আগে/সমান — বাদ`);
  out.forEach((c, i) => (c.id = i + 1));
  return { segments: out, notes };
};

// ফাইল → work/source.<ext> (মূল কপি) + work/raw.json; আগের লেখা থাকলে media/.removed/-এ সরে যায়
// ভুল হলে Error ছোড়ে (process.exit নয় — রিসোর্স ম্যানেজারও এটাই ডাকে)
export const importSubtitles = (slug: string, file: string, name = path.basename(file)) => {
  if (!SUBTITLE.test(file)) throw new Error("SRT বা VTT ফাইল দিন (.srt / .vtt)");
  if (!existsSync(file)) throw new Error(`ফাইল পাওয়া যায়নি: ${file}`);
  const project = readJson<{ durationInFrames: number; fps: number }>(vpath(slug, "project.json"));
  const durMs = (project.durationInFrames / project.fps) * 1000;
  const ext = path.extname(file).toLowerCase();

  const { segments: all, notes } = parseSubtitles(readFileSync(file, "utf8"), ext === ".vtt");
  if (!all.length) throw new Error("ফাইলে সময়সহ কোনো লেখা পাওয়া যায়নি — ঠিক SRT/VTT তো?");
  const segments = all.filter((s) => s.startMs < durMs);
  const past = all.length - segments.length;
  if (past > all.length / 2)
    throw new Error(`বেশিরভাগ লাইনের সময় ভিডিওর দৈর্ঘ্যের (${(durMs / 1000).toFixed(1)}s) পরে — এই ভিডিওর লেখা তো? কাটার আগের ভিডিওর লেখা হলে সময় মিলবে না।`);
  if (past) notes.push(`${past}টা লাইন ভিডিও শেষ হওয়ার পরে — বাদ`);
  segments.forEach((s, i) => (s.id = i + 1));
  const lastMs = segments[segments.length - 1].endMs;
  if (durMs > 30000 && lastMs < durMs * 0.6)
    notes.push(`লেখা ${(lastMs / 1000).toFixed(0)}s-এ শেষ, ভিডিও ${(durMs / 1000).toFixed(0)}s — পুরো ভিডিওর লেখা তো?`);

  // আগের লেখা আর তার থেকে বানানো বানান-ঠিক করা কপি সরিয়ে রাখি (মোছা হয় না)
  const work = vpath(slug, "work");
  for (const old of ["source.srt", "source.vtt", "raw.json"]) {
    const f = path.join(work, old);
    if (existsSync(f) && path.resolve(f) !== path.resolve(file)) retire(f, binFor(work));
  }
  const hadTranscript = existsSync(vpath(slug, "transcript.json"));
  if (hadTranscript) retire(vpath(slug, "transcript.json"), binFor(vpath(slug)));
  if (hadTranscript || existsSync(vpath(slug, "captions.json")))
    notes.push("আগের ক্যাপশন/বানান-ঠিক বাদ — আবার finalize আর plan চালাতে হবে (edit.json-এর c-নম্বর বদলাতে পারে)");

  mkdirSync(work, { recursive: true });
  const source = path.join(work, `source${ext}`);
  if (path.resolve(source) !== path.resolve(file)) copyFileSync(file, source);
  writeJson(path.join(work, "raw.json"), { source: name, segments });
  return { count: segments.length, notes };
};
