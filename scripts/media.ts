// Remotion-এর সাথে আসা ffmpeg/ffprobe ব্যবহার — আলাদা ইনস্টল লাগে না (Mac/Windows/Linux)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");

const run = (tool: "ffmpeg" | "ffprobe", args: string[]) =>
  execFileSync(process.execPath, [cli, tool, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

export type VideoInfo = { width: number; height: number; fps: number; durationSec: number; codec?: string; warn?: string };

// ফুটেজের ফরম্যাট নিয়ে সতর্কতা: রেন্ডার (Remotion-এর নিজের ডিকোডার) আর Studio প্রিভিউ (ব্রাউজার) আলাদা জিনিস সমর্থন করে
type Stream = { codec_name?: string; pix_fmt?: string; color_transfer?: string };
const PREVIEW_OK = ["h264", "vp8", "vp9", "av1"];
const RENDER_OK = [...PREVIEW_OK, "hevc", "prores"];
export const formatWarning = (v: Stream): string | undefined => {
  const codec = v.codec_name ?? "";
  const notes: string[] = [];
  if (["smpte2084", "arib-std-b67"].includes(v.color_transfer ?? ""))
    notes.push("HDR ফুটেজ — রং ফ্যাকাশে/অন্যরকম আসতে পারে; SDR (Rec.709)-এ এক্সপোর্ট বা ফোনে HDR বন্ধ করে শুট করুন");
  if (codec && !RENDER_OK.includes(codec)) notes.push(`কোডেক ${codec} সমর্থিত নাও হতে পারে — H.264 (mp4)-এ এক্সপোর্ট করুন`);
  else if (codec === "prores") notes.push("ProRes — রেন্ডার ঠিক হবে, কিন্তু Studio প্রিভিউতে দেখা যাবে না (কালো); প্রিভিউ চাইলে H.264");
  else if (codec === "hevc") notes.push("H.265/HEVC — রেন্ডার ঠিক হবে; কিছু কম্পিউটারে Studio প্রিভিউতে কালো দেখাতে পারে (তখন H.264 দিন)");
  else if (codec === "h264" && v.pix_fmt && !["yuv420p", "yuvj420p"].includes(v.pix_fmt))
    notes.push(`H.264 ${v.pix_fmt} (১০-বিট/৪:২:২) — রেন্ডার ঠিক হবে, Studio প্রিভিউতে কালো দেখাতে পারে`);
  return notes.length ? notes.join(" · ") : undefined;
};

export const probeVideo = (file: string): VideoInfo => {
  const out = run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  const p = JSON.parse(out.slice(out.indexOf("{")));
  const v = p.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  if (!v) throw new Error("ভিডিও স্ট্রিম পাওয়া যায়নি");
  const [n, d] = String(v.avg_frame_rate || v.r_frame_rate).split("/").map(Number);
  const fps = Math.round((n / (d || 1)) * 100) / 100 || 30;
  const rot = Math.abs(Number(v.tags?.rotate ?? v.side_data_list?.find((x: { rotation?: number }) => x.rotation !== undefined)?.rotation ?? 0));
  const [width, height] = rot === 90 ? [v.height, v.width] : [v.width, v.height];
  return { width, height, fps, durationSec: Number(p.format.duration), codec: v.codec_name, warn: formatWarning(v) };
};

// 16kHz মোনো WAV বানিয়ে Float32Array হিসেবে ফেরত (Whisper-এর ইনপুট)
export const extractAudio = (file: string, wavOut: string): Float32Array => {
  run("ffmpeg", ["-y", "-v", "error", "-i", file, "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavOut]);
  const buf = readFileSync(wavOut);
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") {
      const end = Math.min(buf.length, off + 8 + size);
      const samples = new Float32Array((end - off - 8) >> 1);
      for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(off + 8 + i * 2) / 32768;
      return samples;
    }
    off += 8 + size + (size & 1);
  }
  throw new Error("WAV-এ অডিও ডেটা পাওয়া যায়নি");
};

export const ffmpegVersion = () => run("ffmpeg", ["-version"]).split("\n")[0];

// যেকোনো মিডিয়া ফাইলের তথ্য (ভিডিও/ছবি/অডিও)
export type MediaInfo = { kind: "video" | "image" | "audio"; durationSec: number | null; width?: number; height?: number; fps?: number; hasAudio?: boolean; codec?: string; warn?: string };
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
export const probeMedia = (file: string): MediaInfo => {
  const ext = path.extname(file).toLowerCase();
  const out = run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  const p = JSON.parse(out.slice(out.indexOf("{")));
  const v = p.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  const dur = Number(p.format?.duration);
  if (IMAGE_EXT.includes(ext)) return { kind: "image", durationSec: null, width: v?.width, height: v?.height };
  if (v) {
    const [n, d] = String(v.avg_frame_rate || v.r_frame_rate).split("/").map(Number);
    const hasAudio = p.streams.some((s: { codec_type: string }) => s.codec_type === "audio");
    return { kind: "video", durationSec: isFinite(dur) ? dur : null, width: v.width, height: v.height, fps: Math.round((n / (d || 1)) * 100) / 100 || undefined, hasAudio, codec: v.codec_name, warn: formatWarning(v) };
  }
  return { kind: "audio", durationSec: isFinite(dur) ? dur : null };
};

export const ffmpeg = (args: string[]) => run("ffmpeg", args);

// একটা ফ্রেমের ধূসর পিক্সেল (w×h বাইট) — থাম্বনেইল বাছাইয়ে শার্পনেস মাপার জন্য
export const grayFrame = (file: string, atSec: number, w = 160, h = 90): Buffer =>
  execFileSync(process.execPath, [cli, "ffmpeg", "-v", "error", "-ss", String(atSec), "-i", file, "-frames:v", "1", "-s", `${w}x${h}`, "-pix_fmt", "gray", "-c:v", "rawvideo", "-f", "image2pipe", "-"], {
    maxBuffer: 16 * 1024 * 1024,
  });

// লাউডনেস মাস্টারিং (YouTube/Facebook স্ট্যান্ডার্ড ~ -14 LUFS), দুই-পাস — ভিডিও অপরিবর্তিত কপি হয়
import { spawnSync } from "node:child_process";
export const masterLoudness = (input: string, output: string, target = -14) => {
  const filter = `loudnorm=I=${target}:TP=-1.0:LRA=11`;
  const p1 = spawnSync(process.execPath, [cli, "ffmpeg", "-hide_banner", "-i", input, "-vn", "-af", `${filter}:print_format=json`, "-c:a", "pcm_s16le", "-f", "null", "-"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = (p1.stderr ?? "") + (p1.stdout ?? "");
  const m = text.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error("লাউডনেস মাপা যায়নি:\n" + text.slice(-800));
  const j = JSON.parse(m[0]);
  if (!isFinite(Number(j.input_i))) {
    // নীরব অডিও — মাস্টারিং ছাড়াই কপি
    run("ffmpeg", ["-y", "-v", "error", "-i", input, "-c", "copy", output]);
    return { before: null, after: null };
  }
  const second = `${filter}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  run("ffmpeg", ["-y", "-v", "error", "-i", input, "-c:v", "copy", "-af", `${second},aresample=48000`, "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", output]);
  return { before: Number(j.input_i), after: target };
};
