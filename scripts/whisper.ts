import { env, pipeline } from "@huggingface/transformers";
import path from "node:path";
import { DEVICE, DTYPE, MODELS_DIR, OFFLINE, WHISPER_MODEL } from "./config";

// ডাউনলোড ক্যাশ ও লোকাল মডেল — দুটোই প্রজেক্টের models/ ফোল্ডারে
env.cacheDir = path.resolve(MODELS_DIR);
env.localModelPath = path.resolve(MODELS_DIR);
if (OFFLINE) env.allowRemoteModels = false;

type Progress = { status: string; file?: string; loaded?: number; total?: number };

export const loadWhisper = async () => {
  const shown = new Map<string, number>();
  return pipeline("automatic-speech-recognition", WHISPER_MODEL, {
    device: DEVICE,
    dtype: DTYPE as never,
    // শুধু বড় ফাইলের ডাউনলোড প্রোগ্রেস দেখানো (প্রতি ১০%)
    progress_callback: (p: Progress) => {
      if (p.status !== "progress" || !p.file || !p.total || p.total < 20e6) return;
      const pct = Math.floor(((p.loaded ?? 0) / p.total) * 10) * 10;
      if ((shown.get(p.file) ?? -1) >= pct) return;
      shown.set(p.file, pct);
      console.log(`   ↓ ${path.basename(p.file)} ${pct}% (${Math.round(p.total / 1e6)}MB)`);
    },
  });
};
