import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useIsVertical, useUnit } from "./common";

const bn = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

export const ChapterCard: React.FC<SceneProps<{ number?: number; title: string }>> = ({ number, title, mode }) => {
  const u = useUnit();
  const a = useEnter();
  const b = useEnter(6);
  const exit = useExit();
  const vertical = useIsVertical();
  const label = number !== undefined ? `অধ্যায় ${bn(number)}` : "পরের অংশ";
  if (mode === "overlay")
    return (
      <AbsoluteFill style={{ padding: 70 * u, fontFamily: theme.font, opacity: exit }}>
        <div style={{ alignSelf: "flex-start", display: "flex", gap: 16 * u, alignItems: "center", opacity: a, transform: `translateX(${(1 - a) * -60 * u}px)` }}>
          <span style={{ background: theme.color.accent, color: "#111", fontWeight: 700, fontSize: 30 * u, padding: `${6 * u}px ${18 * u}px`, borderRadius: 10 * u }}>{label}</span>
          <span style={{ background: theme.color.panel, color: "#fff", fontWeight: 600, fontSize: 38 * u, padding: `${6 * u}px ${22 * u}px`, borderRadius: 10 * u }}>{title}</span>
        </div>
      </AbsoluteFill>
    );
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: (vertical ? 80 : 180) * u, paddingRight: (vertical ? 60 : 0) * u, opacity: exit }}>
        <div style={{ fontSize: 44 * u, fontWeight: 600, color: theme.color.accent, opacity: a, transform: `translateX(${(1 - a) * -60 * u}px)` }}>{label}</div>
        <div style={{ fontSize: 120 * u, fontWeight: 700, lineHeight: 1.25, maxWidth: 1400 * u, opacity: b, transform: `translateX(${(1 - b) * -60 * u}px)` }}>{title}</div>
      </AbsoluteFill>
    </FullBg>
  );
};
