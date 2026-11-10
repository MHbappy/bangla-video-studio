// ডিফল্ট সাউন্ড ইফেক্ট বানায় (না থাকলে): media/library/sfx/whoosh.wav, pop.wav
// নিজের ভালো SFX থাকলে একই নামে বদলে দিন — কোড বদলাতে হবে না।
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LIBRARY } from "./paths";

const RATE = 48000;

const wav = (samples: Float32Array) => {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, 44 + i * 2));
  return buf;
};

// নির্দিষ্ট seed-এর নয়েজ, যাতে প্রতিবার একই শব্দ হয়
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

// whoosh: নয়েজ → ফ্রিকোয়েন্সি উপরে-নিচে সরে যাওয়া band-pass, নরম ওঠা-নামা
const whoosh = () => {
  const dur = 0.55;
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  const rand = rng(7);
  let y1 = 0, y2 = 0, x1 = 0, x2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = 350 + 2600 * Math.sin(Math.PI * Math.pow(t, 0.8)); // 350 → ~2950 → 350 Hz
    const q = 1.6;
    const w = (2 * Math.PI * f) / RATE;
    const alpha = Math.sin(w) / (2 * q);
    const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * Math.cos(w), a2 = 1 - alpha;
    const x = rand();
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
    out[i] = y * env * 1.6;
  }
  return out;
};

// pop: দ্রুত নামতে থাকা টোন + হালকা ক্লিক
const pop = () => {
  const dur = 0.12;
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 280 + 900 * Math.exp(-t * 45);
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, t * 2000) * Math.exp(-t * 38);
    out[i] = Math.sin(phase) * env * 0.85;
  }
  return out;
};

export const ensureSfx = () => {
  const dir = path.join(LIBRARY, "sfx");
  mkdirSync(dir, { recursive: true });
  const made: string[] = [];
  for (const [name, gen] of [["whoosh.wav", whoosh], ["pop.wav", pop]] as const) {
    const f = path.join(dir, name);
    if (!existsSync(f)) {
      writeFileSync(f, wav(gen()));
      made.push(name);
    }
  }
  return made;
};
