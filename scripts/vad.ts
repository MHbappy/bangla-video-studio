// কথা কোথায় — অডিওর শক্তি (RMS) দেখে বাক্যাংশ বের করা (VAD)
// Whisper-এর নিজের টাইমস্ট্যাম্প বাংলায় অনির্ভরযোগ্য, তাই সময় আসে অডিও থেকে, লেখা আসে Whisper থেকে
export type Region = { start: number; end: number }; // স্যাম্পল

const SR = 16000;
const HOP = SR * 0.02; // ২০ms ফ্রেম

const frameDb = (audio: Float32Array) => {
  const n = Math.floor(audio.length / HOP);
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * HOP; j < (i + 1) * HOP; j++) sum += audio[j] * audio[j];
    db[i] = 10 * Math.log10(sum / HOP + 1e-10);
  }
  return db;
};

const percentile = (a: Float32Array, p: number) => {
  const s = Float32Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};

// লম্বা অংশ ভাঙা: maxSec-এর ভেতরে, minSec-এর পরে সবচেয়ে নিচু শক্তির জায়গায়
const splitLong = (r: Region, db: Float32Array, minSec: number, maxSec: number): Region[] => {
  const max = maxSec * SR;
  if (r.end - r.start <= max) return [r];
  const a = Math.floor((r.start + minSec * SR) / HOP);
  const b = Math.floor((r.start + max) / HOP);
  let cut = a;
  for (let i = a; i < b; i++) if (db[i] < db[cut]) cut = i;
  const at = cut * HOP;
  return [{ start: r.start, end: at }, ...splitLong({ start: at, end: r.end }, db, minSec, maxSec)];
};

export const speechRegions = (audio: Float32Array, { maxSec = 12, joinSec = 9 } = {}) => {
  const db = frameDb(audio);
  if (!db.length) return { regions: [] as Region[], continuous: false };
  const floor = percentile(db, 0.1);
  const loud = percentile(db, 0.95);
  // শব্দ আর নীরবতার পার্থক্য কম = পুরো সময় কিছু বাজছে (মিউজিক/মেশিন) — বিরতি খোঁজা অর্থহীন
  const continuous = loud - floor < 15;
  const on = Math.max(floor + 0.45 * (loud - floor), -50);
  const off = on - 4;

  // হিস্টেরেসিস: on-এর উপরে উঠলে শুরু, off-এর নিচে ৩০০ms থাকলে শেষ
  const raw: Region[] = [];
  let start = -1;
  let quiet = 0;
  for (let i = 0; i < db.length; i++) {
    if (start < 0) {
      if (db[i] > on) (start = i), (quiet = 0);
    } else if (db[i] < off) {
      if (++quiet * 20 >= 300) {
        raw.push({ start: start * HOP, end: (i - quiet + 1) * HOP });
        start = -1;
      }
    } else quiet = 0;
  }
  if (start >= 0) raw.push({ start: start * HOP, end: db.length * HOP });

  // ছোট টুকরো (<২৫০ms) বাদ, দুপাশে ১৫০ms জায়গা
  const pad = 0.15 * SR;
  const padded = (continuous ? [{ start: 0, end: audio.length }] : raw)
    .filter((r) => r.end - r.start >= 0.25 * SR)
    .map((r) => ({ start: Math.max(0, r.start - pad), end: Math.min(audio.length, r.end + pad) }));

  // কাছাকাছি টুকরো জোড়া (Whisper বেশি প্রসঙ্গ পেলে ভালো বোঝে), joinSec পর্যন্ত
  const joined: Region[] = [];
  for (const r of padded) {
    const last = joined[joined.length - 1];
    if (last && r.start - last.end < 0.8 * SR && r.end - last.start <= joinSec * SR) last.end = Math.max(last.end, r.end);
    else if (last && r.start < last.end) last.end = Math.max(last.end, r.end);
    else joined.push({ ...r });
  }
  return { regions: joined.flatMap((r) => splitLong(r, db, 4, maxSec)), continuous };
};

// Whisper-এর বানানো লেখা: একই টুকরো বারবার ("লালালা", "এমিল এমিল এমিল...")
export const looksHallucinated = (text: string) => {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return false;
  if (/(.{1,12}?)\1{5,}/u.test(t.replace(/\s/g, ""))) return true;
  const words = t.split(" ");
  if (words.length >= 8) {
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    if (Math.max(...counts.values()) / words.length > 0.35) return true;
  }
  return false;
};

// ভাঙা অক্ষর (�) — Whisper একটা অক্ষর ঠিকমতো বের করতে পারেনি; Claude ঠিক করবে
export const hasBrokenChars = (text: string) => /�/.test(text);
