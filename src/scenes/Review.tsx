import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, SidePanel, useEnter, useExit, useIsVertical, useUnit } from "./common";

const STAR = "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z";
const QUOTE = "M4 20v-6.5C4 8.6 6.7 5.3 11 4l1 2.2C9.6 7.1 8.3 8.8 8.1 11H12v9zm13 0v-6.5c0-4.9 2.7-8.2 7-9.5l1 2.2c-2.4.9-3.7 2.6-3.9 4.8H25v9z";

const Stars: React.FC<{ rating: number; size: number; origin: string }> = ({ rating, size, origin }) => {
  const e = useEnter(6, theme.pop);
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div style={{ display: "flex", gap: size * 0.14, opacity: Math.min(1, e * 2), transform: `scale(${0.8 + 0.2 * e})`, transformOrigin: origin }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path d={STAR} fill={i < n ? theme.color.accent : "rgba(255,255,255,.22)"} />
        </svg>
      ))}
    </div>
  );
};

// কাস্টমারের কথা: উক্তি + নাম (+ কে/কোথাকার, তারা) — শুধু সত্যিকারের রিভিউ
export const Review: React.FC<SceneProps<{ quote: string; name?: string; role?: string; rating?: number }>> = ({ quote, name, role, rating, mode }) => {
  const u = useUnit();
  const vertical = useIsVertical();
  const mark = useEnter(0);
  const text = useEnter(8);
  const who = useEnter(18);
  const exit = useExit();
  const full = mode === "full";
  const k = full ? 1 : vertical ? 0.72 : 0.6; // overlay কার্ডে ছোট (খাড়া ফ্রেমে কার্ড চওড়া — একটু বড়)
  const body = (
    <>
      <svg width={110 * k * u} height={88 * k * u} viewBox="0 0 30 24" style={{ opacity: mark, transform: `translateY(${(1 - mark) * -20 * u}px)` }}>
        <path d={QUOTE} fill={theme.color.accent} />
      </svg>
      <div style={{ fontSize: (vertical && full ? 62 : 66) * k * u, fontWeight: 600, lineHeight: 1.45, marginTop: 18 * k * u, opacity: text, transform: `translateY(${(1 - text) * 30 * k * u}px)` }}>{String(quote ?? "")}</div>
      {rating !== undefined && (
        <div style={{ marginTop: 26 * k * u }}>
          <Stars rating={Number(rating)} size={56 * k * u} origin={full ? "50% 50%" : "0% 50%"} />
        </div>
      )}
      {(name || role) && (
        <div style={{ marginTop: 22 * k * u, opacity: who }}>
          {name && <span style={{ fontSize: 50 * k * u, fontWeight: 700, lineHeight: 1.3, color: theme.color.accent }}>{name}</span>}
          {role && <span style={{ fontSize: 40 * k * u, lineHeight: 1.3, color: theme.color.muted }}>{name ? " · " : ""}{role}</span>}
        </div>
      )}
    </>
  );
  if (!full) return <SidePanel>{body}</SidePanel>;
  return (
    <FullBg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: exit }}>
        <div style={{ width: vertical ? "86%" : 1350 * u, display: "flex", flexDirection: "column", alignItems: "center" }}>{body}</div>
      </AbsoluteFill>
    </FullBg>
  );
};
