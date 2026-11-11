import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, SidePanel, useEnter, useExit, useIsVertical, useUnit } from "./common";

type Row = { label: string; value: string } | [string, string];
const cells = (r: Row): [string, string] => (Array.isArray(r) ? [String(r[0] ?? ""), String(r[1] ?? "")] : [String(r?.label ?? ""), String(r?.value ?? "")]);

const Line: React.FC<{ row: Row; i: number; size: number; delayEach: number; last: boolean }> = ({ row, i, size, delayEach, last }) => {
  const e = useEnter(8 + i * delayEach);
  const [label, value] = cells(row);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: size * 0.8, padding: `${size * 0.32}px 0`, borderBottom: last ? undefined : `${Math.max(1, size * 0.04)}px solid rgba(255,255,255,.14)`, opacity: e, transform: `translateY(${(1 - e) * size * 0.5}px)` }}>
      <div style={{ fontSize: size * 0.86, fontWeight: 500, lineHeight: 1.35, color: theme.color.muted, flexShrink: 0, maxWidth: "50%" }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.35, color: theme.color.text, textAlign: "right" }}>{value}</div>
    </div>
  );
};

// স্পেসিফিকেশন টেবিল: "পাওয়ার — 6000W", "কাটার মাপ — ৩ × ১.৫ মিটার"
export const SpecTable: React.FC<SceneProps<{ rows: Row[]; title?: string }>> = ({ rows = [], title, mode }) => {
  const u = useUnit();
  const { fps, durationInFrames } = useVideoConfig();
  const vertical = useIsVertical();
  const t = useEnter();
  const exit = useExit();
  // সব সারি শটের প্রথম ~৬০%-এর মধ্যে চলে আসে
  const delayEach = Math.max(3, Math.min(fps * 0.5, (durationInFrames * 0.6 - 8) / Math.max(1, rows.length)));
  const list = (size: number) => rows.map((r, i) => <Line key={i} row={r} i={i} size={size} delayEach={delayEach} last={i === rows.length - 1} />);
  if (mode === "overlay")
    return (
      <SidePanel>
        {title && <div style={{ fontSize: (vertical ? 46 : 40) * u, fontWeight: 700, lineHeight: 1.3, color: theme.color.accent, marginBottom: 8 * u }}>{title}</div>}
        {list((vertical ? 42 : 36) * u)}
      </SidePanel>
    );
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exit }}>
        <div style={{ width: vertical ? "86%" : 1150 * u }}>
          {title && (
            <div style={{ fontSize: 76 * u, fontWeight: 700, lineHeight: 1.3, marginBottom: 22 * u, opacity: t, transform: `translateY(${(1 - t) * 30 * u}px)` }}>
              <span style={{ borderBottom: `${8 * u}px solid ${theme.color.accent}`, paddingBottom: 6 * u }}>{title}</span>
            </div>
          )}
          {list((vertical ? 48 : 52) * u)}
        </div>
      </AbsoluteFill>
    </FullBg>
  );
};
