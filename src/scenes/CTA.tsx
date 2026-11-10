import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useUnit } from "./common";

export const CTA: React.FC<SceneProps<{ text: string; sub?: string }>> = ({ text, sub, mode }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const e = useEnter(0, theme.pop);
  const exit = useExit();
  const pulse = 1 + 0.03 * Math.sin(frame / 6) * interpolate(frame, [15, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pill = (size: number) => (
    <div style={{ textAlign: "center", opacity: exit }}>
      <div style={{ display: "inline-block", background: theme.color.accent, color: "#111", fontWeight: 700, fontSize: size, padding: `${size * 0.3}px ${size * 0.8}px`, borderRadius: size, transform: `scale(${e * pulse})` }}>{text}</div>
      {sub && <div style={{ fontSize: size * 0.55, color: mode === "full" ? theme.color.muted : "#fff", marginTop: size * 0.35, opacity: e, textShadow: "0 2px 10px rgba(0,0,0,.6)" }}>{sub}</div>}
    </div>
  );
  if (mode === "full") return <FullBg><AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>{pill(80 * u)}</AbsoluteFill></FullBg>;
  return <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 80 * u, fontFamily: theme.font }}>{pill(48 * u)}</AbsoluteFill>;
};
