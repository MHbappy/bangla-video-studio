import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useIsVertical, useUnit } from "./common";

export const LowerThird: React.FC<SceneProps<{ name: string; role?: string }>> = ({ name, role, mode }) => {
  const u = useUnit();
  const bar = useEnter();
  const txt = useEnter(6);
  const exit = useExit();
  const vertical = useIsVertical();
  const { height } = useVideoConfig();
  const card = (
    <div style={{ display: "flex", alignItems: "stretch", opacity: exit }}>
      <div style={{ width: 10 * u, background: theme.color.accent, borderRadius: 5 * u, transform: `scaleY(${bar})` }} />
      <div style={{ background: theme.color.panel, padding: `${16 * u}px ${30 * u}px`, borderRadius: `0 ${14 * u}px ${14 * u}px 0`, clipPath: `inset(0 ${(1 - bar) * 100}% 0 0)` }}>
        <div style={{ fontSize: 50 * u, fontWeight: 700, color: "#fff", opacity: txt }}>{name}</div>
        {role && <div style={{ fontSize: 30 * u, color: theme.color.accent, opacity: txt }}>{role}</div>}
      </div>
    </div>
  );
  if (mode === "full") return <FullBg><AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>{card}</AbsoluteFill></FullBg>;
  // ক্যাপশনের উপরে, বাঁ দিকে
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: vertical ? `0 0 ${height * 0.42}px ${60 * u}px` : `0 0 ${230 * u}px ${90 * u}px`, fontFamily: theme.font }}>
      {card}
    </AbsoluteFill>
  );
};
