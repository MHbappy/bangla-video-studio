import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useUnit } from "./common";

export const TitleCard: React.FC<SceneProps<{ title: string; subtitle?: string }>> = ({ title, subtitle, mode }) => {
  const u = useUnit();
  const t = useEnter();
  const s = useEnter(8);
  const exit = useExit();
  if (mode === "overlay")
    return (
      <AbsoluteFill style={{ padding: 70 * u, fontFamily: theme.font, opacity: exit }}>
        <div style={{ alignSelf: "flex-start", background: theme.color.panel, borderRadius: theme.radius * u, padding: `${22 * u}px ${36 * u}px`, transform: `translateY(${(1 - t) * -40 * u}px)`, opacity: t }}>
          <div style={{ fontSize: 58 * u, fontWeight: 700, color: theme.color.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 32 * u, color: theme.color.accent }}>{subtitle}</div>}
        </div>
      </AbsoluteFill>
    );
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exit, textAlign: "center", padding: 120 * u }}>
        <div style={{ width: 120 * u * t, height: 8 * u, background: theme.color.accent, borderRadius: 4 * u, marginBottom: 36 * u }} />
        <div style={{ fontSize: 112 * u, fontWeight: 700, lineHeight: 1.3, transform: `translateY(${(1 - t) * 40 * u}px)`, opacity: t }}>{title}</div>
        {subtitle && <div style={{ fontSize: 48 * u, color: theme.color.muted, marginTop: 20 * u, opacity: s }}>{subtitle}</div>}
      </AbsoluteFill>
    </FullBg>
  );
};
