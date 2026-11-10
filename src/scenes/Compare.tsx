import React from "react";
import { AbsoluteFill } from "remotion";
import { PopAt } from "../sfx";
import { theme } from "../theme";
import { FullBg, type SceneProps, SidePanel, useEnter, useExit, useIsVertical, useUnit } from "./common";

type Side = { title: string; items: string[] };

// দুই পাশে তুলনা: "Arduino vs ESP32", "আগে / পরে"
export const Compare: React.FC<SceneProps<{ left: Side; right: Side; title?: string }>> = ({ left, right, title, mode }) => {
  const u = useUnit();
  const vertical = useIsVertical();
  const a = useEnter(4);
  const b = useEnter(14);
  const exit = useExit();
  const col = (s: Side, e: number, color: string, size: number) => (
    <div style={{ flex: 1, opacity: e, transform: `translateY(${(1 - e) * 40 * u}px)`, background: "rgba(255,255,255,.05)", borderTop: `${8 * u}px solid ${color}`, borderRadius: theme.radius * u, padding: `${30 * u}px ${34 * u}px` }}>
      <div style={{ fontSize: size * 1.15, fontWeight: 700, color, marginBottom: 14 * u }}>{s.title}</div>
      {s.items?.map((it, i) => (
        <div key={i} style={{ fontSize: size, fontWeight: 500, lineHeight: 1.5 }}>• {it}</div>
      ))}
    </div>
  );
  if (mode === "overlay")
    return (
      <SidePanel>
        {title && <div style={{ fontSize: 36 * u, fontWeight: 700, marginBottom: 16 * u }}>{title}</div>}
        <div style={{ display: "flex", gap: 18 * u }}>
          {col(left, a, theme.color.accent2, 30 * u)}
          {col(right, b, theme.color.accent, 30 * u)}
        </div>
      </SidePanel>
    );
  return (
    <FullBg>
      <PopAt frame={4} />
      <PopAt frame={14} />
      <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${(vertical ? 60 : 160) * u}px`, opacity: exit }}>
        {title && <div style={{ fontSize: 72 * u, fontWeight: 700, textAlign: "center", marginBottom: 40 * u, opacity: a }}>{title}</div>}
        <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: 40 * u, alignItems: "stretch" }}>
          {col(left, a, theme.color.accent2, 52 * u)}
          {!vertical && <div style={{ alignSelf: "center", fontSize: 60 * u, fontWeight: 700, color: theme.color.muted, opacity: b }}>vs</div>}
          {col(right, b, theme.color.accent, 52 * u)}
        </div>
      </AbsoluteFill>
    </FullBg>
  );
};
