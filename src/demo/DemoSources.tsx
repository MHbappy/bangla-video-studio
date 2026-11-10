// শুধু টেস্টের জন্য: নকল A-roll ও B-roll ফুটেজ বানায় (npm run demo)
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_FAMILY } from "../fonts";

export const DemoAroll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = (frame / fps).toFixed(1);
  const bob = Math.sin(frame / 9) * 6;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#3a4a5e,#1d2633)", fontFamily: FONT_FAMILY, color: "#fff" }}>
      {/* উপস্থাপকের সিলুয়েট — মুখ 50% 35% এ, যাতে arollFocus টেস্ট হয় */}
      <div style={{ position: "absolute", left: "50%", top: `calc(35% + ${bob}px)`, width: 260, height: 260, marginLeft: -130, marginTop: -130, borderRadius: "50%", background: "#d9a87c" }} />
      <div style={{ position: "absolute", left: "50%", top: "52%", width: 620, height: 600, marginLeft: -310, borderRadius: "300px 300px 0 0", background: "#2f6f8f" }} />
      <div style={{ position: "absolute", left: 60, top: 50, fontSize: 64, fontWeight: 700 }}>A-ROLL (আপনার মুখ)</div>
      <div style={{ position: "absolute", right: 60, top: 50, fontSize: 64, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{sec}s</div>
    </AbsoluteFill>
  );
};

export const DemoBroll: React.FC<{ label: string; hue: number }> = ({ label, hue }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 300], [0, 400]);
  return (
    <AbsoluteFill style={{ background: `hsl(${hue},55%,30%)`, fontFamily: FONT_FAMILY, color: "#fff", overflow: "hidden" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 380 + x) % 2300) - 200, top: 150 + (i % 3) * 280, width: 220, height: 220, borderRadius: 30, background: `hsl(${hue + i * 25},70%,55%)`, transform: `rotate(${frame + i * 30}deg)` }} />
      ))}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 110, fontWeight: 700, background: "rgba(0,0,0,.45)", padding: "10px 50px", borderRadius: 24 }}>B-ROLL: {label}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// নকল লোগো (স্বচ্ছ PNG) আর নকল QR — ব্র্যান্ড লেয়ার টেস্টের জন্য
export const DemoLogo: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_FAMILY }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 120, height: 120, borderRadius: 28, background: "#FFB020", color: "#111", fontSize: 84, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>K</div>
      <div style={{ fontSize: 76, fontWeight: 700, color: "#fff" }}>KarigorLab</div>
    </div>
  </AbsoluteFill>
);

export const DemoQr: React.FC = () => {
  const n = 25;
  const finder = (r: number, c: number) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([y, x]) => r >= y && r < y + 7 && c >= x && c < x + 7);
  const dark = (r: number, c: number) => {
    for (const [y, x] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      if (r >= y && r < y + 7 && c >= x && c < x + 7) {
        const d = Math.max(Math.abs(r - y - 3), Math.abs(c - x - 3));
        return d !== 2;
      }
    }
    return !finder(r, c) && ((r * 31 + c * 17 + r * c) % 7) < 3;
  };
  return (
    <AbsoluteFill style={{ background: "#fff", padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, width: "100%", height: "100%" }}>
        {Array.from({ length: n * n }, (_, i) => (
          <div key={i} style={{ background: dark(Math.floor(i / n), i % n) ? "#000" : "#fff" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
