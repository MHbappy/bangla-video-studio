import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Segment = { id: number; startMs: number; endMs: number; text: string };
export type Word = { text: string; startMs: number; endMs: number };
export type CaptionLine = { startMs: number; endMs: number; text: string; words: Word[] };

export const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
export const writeJson = (p: string, data: unknown) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
};

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const srtTime = (ms: number) => {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(t % 1000, 3)}`;
};

export const toSrt = (items: { startMs: number; endMs: number; text: string }[]) =>
  items
    .map((c, i) => `${i + 1}\n${srtTime(c.startMs)} --> ${srtTime(c.endMs)}\n${c.text}\n`)
    .join("\n");

// বাংলা অক্ষরের "ওজন": স্পেস বাদে দৈর্ঘ্য (কার/হসন্তসহ গোনা হয়, বলার সময়ের মোটামুটি অনুপাত)
const weight = (s: string) => Math.max(1, s.replace(/\s+/g, "").length);

// একটা সময়-পরিসর শব্দের দৈর্ঘ্য অনুপাতে ভাগ
export const distributeWords = (text: string, startMs: number, endMs: number): Word[] => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const total = tokens.reduce((a, t) => a + weight(t), 0);
  const span = endMs - startMs;
  let acc = 0;
  return tokens.map((t) => {
    const s = startMs + (acc / total) * span;
    acc += weight(t);
    const e = startMs + (acc / total) * span;
    return { text: t, startMs: Math.round(s), endMs: Math.round(e) };
  });
};

// লম্বা সেগমেন্টকে শব্দ-সীমায় সমান মাপের ক্যাপশন লাইনে ভাঙা
export const splitSegment = (seg: Segment, maxChars: number): CaptionLine[] => {
  const words = distributeWords(seg.text, seg.startMs, seg.endMs);
  const join = (ws: Word[]) => ws.map((w) => w.text).join(" ");
  const toLine = (ws: Word[]): CaptionLine => ({
    startMs: ws[0].startMs,
    endMs: ws[ws.length - 1].endMs,
    text: join(ws),
    words: ws,
  });

  // ১) বাক্য অনুযায়ী ভাগ (। ? !)
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[।?!]$/.test(w.text)) {
      sentences.push(cur);
      cur = [];
    }
  }
  if (cur.length) sentences.push(cur);

  // ২) ছোট বাক্য পাশাপাশি জোড়া, লম্বা বাক্য সমান ভাগ
  const lines: CaptionLine[] = [];
  for (const sent of sentences) {
    const len = join(sent).length;
    if (len <= maxChars) {
      lines.push(toLine(sent));
      continue;
    }
    const n = Math.ceil(len / maxChars);
    const target = len / n;
    let part: Word[] = [];
    for (const w of sent) {
      const next = join([...part, w]).length;
      if (part.length && (next > maxChars || next > target * 1.1)) {
        lines.push(toLine(part));
        part = [];
      }
      part.push(w);
    }
    if (part.length) lines.push(toLine(part));
  }
  return lines;
};
