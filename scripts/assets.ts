// npm run assets -- [slug]  → ভিডিওর নিজের + লাইব্রেরির B-roll/মিউজিক তালিকা (assets.json)
// নাম মেলানো: আগে media/videos/<slug>/broll/, না পেলে media/library/broll/
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { writeJson } from "./lib";
import { type MediaInfo, probeMedia } from "./media";
import { isMain, LIBRARY, resolveSlug, vpath, webPath } from "./paths";

export type Asset = MediaInfo & { name: string; path: string; source: "video" | "library" };
export type Assets = { broll: Asset[]; music: Asset[] };

const MEDIA_RE = /\.(mp4|mov|m4v|webm|mkv|jpg|jpeg|png|webp|mp3|m4a|wav|aac|ogg)$/i;

const scan = (root: string, source: Asset["source"]): Asset[] => {
  if (!existsSync(root)) return [];
  const out: Asset[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d).sort()) {
      const full = path.join(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (MEDIA_RE.test(f)) {
        try {
          out.push({ name: path.relative(root, full).split(path.sep).join("/"), path: webPath(full), source, ...probeMedia(full) });
        } catch {
          console.warn(`⚠ পড়া যায়নি: ${full}`);
        }
      }
    }
  };
  walk(root);
  return out;
};

const merge = (local: Asset[], lib: Asset[]) => {
  const names = new Set(local.map((a) => a.name));
  return [...local, ...lib.filter((a) => !names.has(a.name))];
};

export const scanAssets = (slug: string): Assets => {
  const assets = {
    broll: merge(scan(vpath(slug, "broll"), "video"), scan(path.join(LIBRARY, "broll"), "library")),
    music: merge(scan(vpath(slug, "music"), "video"), scan(path.join(LIBRARY, "music"), "library")),
  };
  writeJson(vpath(slug, "assets.json"), assets);
  return assets;
};

if (isMain(import.meta.url)) {
  const slug = resolveSlug(process.argv[2]);
  const a = scanAssets(slug);
  const tag = (s: Asset["source"]) => (s === "video" ? "[এই ভিডিও]" : "[লাইব্রেরি]");
  console.log(`B-roll (${a.broll.length}):`);
  for (const b of a.broll)
    console.log(`  ${b.kind === "image" ? "🖼 " : "🎬"} ${b.name.padEnd(40)} ${tag(b.source)}${b.durationSec ? `  ${b.durationSec.toFixed(1)}s` : ""}${b.width ? `  ${b.width}×${b.height}` : ""}${b.fps ? `  ${b.fps}fps` : ""}${b.kind === "video" ? (b.hasAudio ? "  🔊" : "  🔇") : ""}${b.warn ? `\n       ⚠ ${b.warn}` : ""}`);
  console.log(`মিউজিক (${a.music.length}):`);
  for (const m of a.music) console.log(`  🎵 ${m.name.padEnd(40)} ${tag(m.source)}${m.durationSec ? `  ${m.durationSec.toFixed(0)}s` : ""}`);
  console.log(`✓ media/videos/${slug}/assets.json`);
}
