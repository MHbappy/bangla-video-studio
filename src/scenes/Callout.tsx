import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useUnit } from "./common";

// overlay: ফুটেজের নির্দিষ্ট জায়গায় বৃত্ত + তীর + লেখা ("এই পিনটা খেয়াল করুন")
// full: বড় উক্তি/মূল কথা
// x, y = লক্ষ্যের অবস্থান (% — ফ্রেমের বাঁ-উপর থেকে)
export const Callout: React.FC<SceneProps<{ text: string; x?: number; y?: number; sub?: string }>> = ({ text, sub, x = 50, y = 50, mode }) => {
  const u = useUnit();
  const { width: W, height: H } = useVideoConfig();
  const ring = useEnter(0, theme.pop);
  const label = useEnter(8);
  const exit = useExit();
  if (mode === "full")
    return (
      <FullBg>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 160 * u, opacity: exit, textAlign: "center" }}>
          <div style={{ fontSize: 160 * u, color: theme.color.accent, lineHeight: 0.6, opacity: ring }}>“</div>
          <div style={{ fontSize: 82 * u, fontWeight: 700, lineHeight: 1.35, opacity: label, transform: `translateY(${(1 - label) * 30 * u}px)` }}>{text}</div>
          {sub && <div style={{ fontSize: 40 * u, color: theme.color.muted, marginTop: 24 * u, opacity: label }}>{sub}</div>}
        </AbsoluteFill>
      </FullBg>
    );
  const cx = (x / 100) * W, cy = (y / 100) * H;
  const r = 70 * u;
  // লেখা লক্ষ্যের উল্টো দিকে
  const toLeft = x > 55;
  const lx = cx + (toLeft ? -1 : 1) * 260 * u;
  const ly = cy + (y > 50 ? -1 : 1) * 170 * u;
  const len = Math.hypot(lx - cx, ly - cy) - r;
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, opacity: exit }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={cx} cy={cy} r={r * (0.6 + 0.4 * ring)} fill="none" stroke={theme.color.accent} strokeWidth={7 * u} opacity={ring} />
        <line
          x1={cx + ((lx - cx) / (len + r)) * r}
          y1={cy + ((ly - cy) / (len + r)) * r}
          x2={lx}
          y2={ly}
          stroke={theme.color.accent}
          strokeWidth={6 * u}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - label)}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: toLeft ? undefined : lx,
          right: toLeft ? W - lx : undefined,
          top: ly - 40 * u,
          background: theme.color.accent,
          color: "#111",
          fontWeight: 700,
          fontSize: 44 * u,
          padding: `${10 * u}px ${26 * u}px`,
          borderRadius: 14 * u,
          opacity: label,
          maxWidth: W * 0.4,
        }}
      >
        {text}
        {sub && <div style={{ fontSize: 28 * u, fontWeight: 500 }}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};
