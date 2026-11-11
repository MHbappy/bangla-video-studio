import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PopAt } from "../sfx";
import { theme } from "../theme";
import { fitFont, FullBg, type SceneProps, SidePanel, useEnter, useExit, useIsVertical, useUnit } from "./common";

// অফারের দাম: আগের দাম কেটে নতুন দাম — "৳১৪,০০,০০০ → ৳১২,৫০,০০০", সাথে ব্যাজ ("২০% ছাড়") আর শর্ত
export const Offer: React.FC<SceneProps<{ price: string; was?: string; label?: string; badge?: string; sub?: string }>> = ({ price, was, label, badge, sub, mode }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const vertical = useIsVertical();
  const top = useEnter(0);
  const old = useEnter(5);
  const reveal = was ? 20 : 6; // আগের দাম থাকলে সেটা কাটার পরে নতুন দাম আসে
  const pop = useEnter(reveal, theme.pop);
  const rest = useEnter(reveal + 8);
  const exit = useExit();
  const strike = interpolate(frame, [12, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const full = mode === "full";
  const priceText = String(price ?? "");
  // দাম এক লাইনে ধরাতে অক্ষর গুনে মাপ কমে
  const big = fitFont(priceText, full ? 230 : vertical ? 140 : 104, full ? (vertical ? 1000 : 1500) : vertical ? 880 : 520) * u;
  const k = full ? 1 : vertical ? 0.75 : 0.62; // overlay কার্ডে বাকি লেখা ছোট (খাড়া ফ্রেমে কার্ড চওড়া — একটু বড়)

  const body = (
    <>
      {badge && (
        <div style={{ alignSelf: full ? "center" : "flex-start", background: theme.color.accent2, color: "#111", fontWeight: 700, fontSize: 44 * k * u, lineHeight: 1.3, padding: `${8 * k * u}px ${30 * k * u}px`, borderRadius: 40 * u, marginBottom: 22 * k * u, opacity: top, transform: `scale(${0.8 + 0.2 * top})` }}>
          {badge}
        </div>
      )}
      {label && <div style={{ fontSize: 60 * k * u, fontWeight: 600, lineHeight: 1.3, opacity: top }}>{label}</div>}
      {was && (
        <div style={{ alignSelf: full ? "center" : "flex-start", position: "relative", fontSize: 76 * k * u, fontWeight: 600, lineHeight: 1.3, color: theme.color.muted, marginTop: 14 * k * u, opacity: old, whiteSpace: "nowrap" }}>
          {was}
          <div style={{ position: "absolute", left: "-4%", top: "52%", width: `${108 * strike}%`, height: Math.max(2, 7 * k * u), borderRadius: 4 * u, background: theme.color.text }} />
        </div>
      )}
      <div style={{ fontSize: big, fontWeight: 700, lineHeight: 1.15, color: theme.color.accent, whiteSpace: "nowrap", opacity: Math.min(1, pop * 2), transform: `scale(${0.7 + 0.3 * pop})`, transformOrigin: full ? "50% 60%" : "0% 60%" }}>{priceText}</div>
      {sub && <div style={{ fontSize: 46 * k * u, lineHeight: 1.35, color: full ? theme.color.muted : theme.color.text, marginTop: 14 * k * u, opacity: rest }}>{sub}</div>}
    </>
  );

  if (!full)
    return (
      <SidePanel>
        <PopAt frame={reveal} />
        <div style={{ display: "flex", flexDirection: "column" }}>{body}</div>
      </SidePanel>
    );
  return (
    <FullBg>
      <PopAt frame={reveal} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: `0 ${(vertical ? 60 : 160) * u}px`, opacity: exit }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>{body}</div>
      </AbsoluteFill>
    </FullBg>
  );
};
