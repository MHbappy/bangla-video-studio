// পাইপলাইনের সব সেটিংস এক জায়গায়
// প্রতিটা সেটিং তিনভাবে দেওয়া যায় (উপরেরটা আগে): কমান্ডে --quality accurate · টার্মিনালের env · .env ফাইল (এই কম্পিউটারে স্থায়ী)
import { flag, opt } from "./paths";

const pick = <T extends string>(name: string, cli: string, allowed: readonly T[], fallback: T): T => {
  const v = opt(cli) ?? process.env[name] ?? fallback;
  if (!allowed.includes(v as T)) {
    console.error(`✗ ${name} হবে ${allowed.join(" | ")} (এখন "${v}")`);
    process.exit(1);
  }
  return v as T;
};

// Whisper মডেল (ONNX, transformers.js দিয়ে চলে — কোনো কম্পাইল লাগে না)
// বেশি নির্ভুল কিন্তু ধীর চাইলে: WHISPER_MODEL=onnx-community/whisper-large-v3-ONNX
export const WHISPER_MODEL = process.env.WHISPER_MODEL || "onnx-community/whisper-large-v3-turbo";

// "fast"  = quantized (~1.1GB, CPU-তে দ্রুত)   "accurate" = fp32 (~3.2GB, ধীর কিন্তু একটু বেশি নির্ভুল)
export const QUALITY = pick("QUALITY", "quality", ["fast", "accurate"] as const, "fast");
export const DTYPE =
  QUALITY === "accurate"
    ? { encoder_model: "fp32", decoder_model_merged: "fp32" }
    : { encoder_model: "q8", decoder_model_merged: "q8" };

// cpu (সব OS) | dml (Windows GPU) | cuda (Linux + NVIDIA)
export const DEVICE = pick("DEVICE", "device", ["cpu", "dml", "cuda"] as const, "cpu");

// ইন্টারনেট ছাড়া: শুধু models/ ফোল্ডার থেকে
export const OFFLINE = process.env.OFFLINE === "1" || flag("offline");

// মডেল প্রজেক্টের ভেতরেই থাকে → পুরো ফোল্ডার অন্য মেশিনে নিলে অফলাইনেও চলবে
export const MODELS_DIR = "models";

// প্রতিটা ক্যাপশন লাইনের সর্বোচ্চ অক্ষর (YouTube স্টাইল)
export const MAX_CAPTION_CHARS = 42;
