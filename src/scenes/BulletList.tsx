import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { PopAt } from "../sfx";
import { FullBg, type SceneProps, SidePanel, useEnter, useExit, useIsVertical, useUnit } from "./common";

const Item: React.FC<{ text: string; i: number; size: number; delayEach: number }> = ({ text, i, size, delayEach }) => {
  const e = useEnter(10 + i * delayEach);
  const u = useUnit();
  return (
    <>
    <PopAt frame={10 + i * delayEach} />
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.45, opacity: e, transform: `translateX(${(1 - e) * 50 * u}px)`, marginTop: size * 0.45 }}>
      <div style={{ minWidth: size * 0.95, height: size * 0.95, borderRadius: "50%", background: theme.color.accent, color: "#111", fontWeight: 700, fontSize: size * 0.55, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {"০১২৩৪৫৬৭৮৯"[(i + 1) % 10]}
      </div>
      <div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.3 }}>{text}</div>
    </div>
    </>
  );
};

export const BulletList: React.FC<SceneProps<{ title?: string; items: string[] }>> = ({ title, items = [], mode }) => {
  const u = useUnit();
  const { fps, durationInFrames } = useVideoConfig();
  // সব আইটেম শটের প্রথম ~৬০% সময়ের মধ্যে চলে আসবে
  const delayEach = Math.max(4, Math.min(fps * 0.9, (durationInFrames * 0.6 - 10) / Math.max(1, items.length)));
  const t = useEnter();
  const exit = useExit();
  const vertical = useIsVertical();
  if (mode === "overlay")
    return (
      <SidePanel>
        {title && <div style={{ fontSize: 40 * u, fontWeight: 700, color: theme.color.accent }}>{title}</div>}
        {items.map((it, i) => <Item key={i} text={it} i={i} size={40 * u} delayEach={delayEach} />)}
      </SidePanel>
    );
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: (vertical ? 90 : 220) * u, paddingRight: (vertical ? 70 : 160) * u, opacity: exit }}>
        {title && <div style={{ fontSize: 76 * u, fontWeight: 700, marginBottom: 20 * u, opacity: t }}>{title}</div>}
        {items.map((it, i) => <Item key={i} text={it} i={i} size={64 * u} delayEach={delayEach} />)}
      </AbsoluteFill>
    </FullBg>
  );
};
