import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, SidePanel, useEnter, useExit, useUnit } from "./common";

const toBn = (s: string) => s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

// "৳১,২৫০" / "1250" / "৯৮%" — সংখ্যা থাকলে গুনে গুনে বাড়বে
const useCountUp = (value: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ascii = value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const m = /(\d[\d,]*\.?\d*)/.exec(ascii);
  if (!m) return value;
  const target = Number(m[1].replace(/,/g, ""));
  const p = interpolate(frame, [6, 6 + fps * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) });
  const decimals = (m[1].split(".")[1] ?? "").length;
  let cur = (target * p).toFixed(decimals);
  if (m[1].includes(",")) cur = Number(cur).toLocaleString("en-IN");
  const out = ascii.replace(m[1], cur);
  return /[০-৯]/.test(value) ? toBn(out) : out;
};

export const StatCard: React.FC<SceneProps<{ value: string; label: string; sub?: string }>> = ({ value, label, sub, mode }) => {
  const u = useUnit();
  const shown = useCountUp(String(value));
  const e = useEnter(0, theme.pop);
  const l = useEnter(10);
  const exit = useExit();
  if (mode === "overlay")
    return (
      <SidePanel>
        <div style={{ fontSize: 110 * u, fontWeight: 700, color: theme.color.accent, lineHeight: 1.1 }}>{shown}</div>
        <div style={{ fontSize: 40 * u, fontWeight: 600, marginTop: 10 * u, opacity: l }}>{label}</div>
        {sub && <div style={{ fontSize: 28 * u, color: theme.color.muted, marginTop: 8 * u, opacity: l }}>{sub}</div>}
      </SidePanel>
    );
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: exit }}>
        <div style={{ fontSize: 240 * u, fontWeight: 700, color: theme.color.accent, lineHeight: 1.1, transform: `scale(${0.85 + 0.15 * e})` }}>{shown}</div>
        <div style={{ fontSize: 64 * u, fontWeight: 600, marginTop: 10 * u, opacity: l }}>{label}</div>
        {sub && <div style={{ fontSize: 40 * u, color: theme.color.muted, marginTop: 14 * u, opacity: l }}>{sub}</div>}
      </AbsoluteFill>
    </FullBg>
  );
};
