// YouTube থাম্বনেইল (1280×720): ফ্রেম + বাঁ দিকে বড় বাংলা শিরোনাম; *শব্দ* = ব্র্যান্ড রঙে
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { theme } from "./theme";

// side = লেখা কোন পাশে; ছবি উল্টো দিকে সরে, যাতে মাঝখানের মুখ লেখার নিচে না পড়ে
export type ThumbnailProps = { image?: string; title?: string; sub?: string; logo?: string; side?: "left" | "right" };

export const Thumbnail: React.FC<ThumbnailProps> = ({ image, title = "শিরোনাম", sub, logo, side = "left" }) => {
  const left = side === "left";
  const parts = title.split(/(\*[^*]+\*)/).filter(Boolean);
  const len = title.replace(/\*/g, "").length;
  // লম্বা শিরোনামে ছোট ফন্ট — তবু ৩ লাইনের বেশি নয়
  const size = len <= 14 ? 108 : len <= 24 ? 92 : len <= 36 ? 78 : 66;
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: theme.font }}>
      {image && <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(1.3) translateX(${left ? 11 : -11}%)`, filter: "contrast(1.08) saturate(1.15)" }} />}
      <AbsoluteFill style={{ background: `linear-gradient(${left ? 90 : 270}deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.65) 38%, rgba(0,0,0,0) 68%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: left ? "flex-start" : "flex-end", padding: "0 64px", textAlign: left ? "left" : "right" }}>
        <div style={{ maxWidth: 700 }}>
          {sub && (
            <div style={{ display: "inline-block", background: theme.color.accent, color: "#111", fontSize: 38, fontWeight: 700, padding: "4px 20px", borderRadius: 10, marginBottom: 18 }}>
              {sub}
            </div>
          )}
          <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.18, color: "#fff", textShadow: "0 6px 24px rgba(0,0,0,.6)" }}>
            {parts.map((p, i) =>
              p.startsWith("*") ? (
                <span key={i} style={{ color: theme.color.accent }}>{p.slice(1, -1)}</span>
              ) : (
                <span key={i}>{p}</span>
              ),
            )}
          </div>
        </div>
      </AbsoluteFill>
      {logo && <Img src={staticFile(logo)} style={{ position: "absolute", top: 36, [left ? "right" : "left"]: 40, height: 64, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.5))" }} />}
    </AbsoluteFill>
  );
};
