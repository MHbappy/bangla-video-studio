// ব্র্যান্ড লেয়ার: কোণায় লোগো + মাঝে মাঝে যোগাযোগ বার (ফোন, নাম/ঠিকানা, সোশ্যাল, QR)
import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TopClearContext, useIsVertical, useUnit } from "../scenes/common";
import { theme } from "../theme";
import type { Social, TimelineBrand, TimelineShot } from "../timeline-types";

// ১৬:৯-এ বারের মাপ (1080p একক) — ক্যাপশন এর উপরে সরে যায়
const BAR_H = 120;
const BAR_MARGIN = 36;
const FADE_MS = 300;
// খাড়া (Shorts): বার উপরে — ফ্রেমের উচ্চতার এই ভগ্নাংশে শুরু, এই উচ্চতার (1080p একক)
const V_BAR_TOP = 0.085;
const V_BAR_H = 104;

// এই মুহূর্তে বার কতটা দৃশ্যমান (০–১) — ক্যাপশন সরানোর জন্য
export const barProgress = (brand: TimelineBrand | undefined, ms: number) => {
  const b = brand?.bars.find((x) => ms >= x.startMs && ms < x.endMs);
  if (!b) return 0;
  return Math.min(1, (ms - b.startMs) / FADE_MS, (b.endMs - ms) / FADE_MS);
};
export const barTop = (u: number) => (BAR_MARGIN + BAR_H + 22) * u;

const ICON_PATHS: Record<Social["type"], string> = {
  phone:
    "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  facebook: "M14 8h3V4h-3a5 5 0 0 0-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9a1 1 0 0 1 1-1z",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.3c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z",
  youtube: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z",
  web: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-3.6C8.9 5.5 8.4 6.7 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8 8 0 0 1 0 4z",
};
const ICON_COLOR: Record<Social["type"], string> = { phone: "#111", facebook: "#1877F2", whatsapp: "#25D366", youtube: "#FF0033", web: "#111" };

const Icon: React.FC<{ type: Social["type"]; size: number; color?: string }> = ({ type, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d={ICON_PATHS[type]} fill={color ?? ICON_COLOR[type]} />
  </svg>
);

const Logo: React.FC<{ logo: NonNullable<TimelineBrand["logo"]> }> = ({ logo }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const vertical = useIsVertical();
  const m = (vertical ? 60 : 40) * u;
  const [v, h] = logo.position.split("-");
  const fade = interpolate(frame, [0, 15], [0, logo.opacity], { extrapolateRight: "clamp" });
  return (
    <Img
      src={staticFile(logo.path)}
      style={{ position: "absolute", [v]: m, [h]: m, height: logo.size * u, opacity: fade, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.45))" }}
    />
  );
};

// একটা বার-উপস্থিতি: নিচ থেকে ওঠে; সোশ্যাল থাকলে অর্ধেক সময় পরে ফোন → সোশ্যাল বদলায়
const ContactBar: React.FC<{ brand: TimelineBrand; hidden: boolean }> = ({ brand, hidden }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();
  const u = useUnit();
  const vertical = useIsVertical();
  const enter = spring({ frame, fps, config: theme.spring });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const show = enter * exit * (hidden ? 0 : 1);

  const hasPhone = Boolean(brand.phone);
  const hasSocial = brand.social.length > 0;
  const half = Math.round(durationInFrames / 2);
  // ০ = ফোন পাতা, ১ = সোশ্যাল পাতা
  const page = hasPhone && hasSocial ? interpolate(frame, [half - 4, half + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : hasSocial ? 1 : 0;

  // Shorts: উপরে, ছোট — নিচের ~২০% YouTube-এর লেখা/বোতামে ঢাকা পড়ে
  const h = (vertical ? V_BAR_H : BAR_H) * u;
  const nameBlock = (brand.name || brand.address) && (
    <div style={{ background: theme.color.accent, color: "#111", padding: `${12 * u}px ${28 * u}px`, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: h }}>
      {brand.name && <div style={{ fontSize: (vertical ? 34 : 40) * u, fontWeight: 700, lineHeight: 1.25, whiteSpace: "nowrap" }}>{brand.name}</div>}
      {brand.address && !vertical && <div style={{ fontSize: 24 * u, fontWeight: 500, lineHeight: 1.3, opacity: 0.85, whiteSpace: "nowrap" }}>{brand.address}</div>}
    </div>
  );
  const phonePage = hasPhone && (
    <div style={{ display: "flex", alignItems: "center", gap: 18 * u, opacity: 1 - page }}>
      <div style={{ width: 64 * u, height: 64 * u, borderRadius: "50%", background: theme.color.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon type="phone" size={36 * u} />
      </div>
      <div>
        {brand.phoneLabel && <div style={{ fontSize: 24 * u, color: theme.color.muted, lineHeight: 1.3, whiteSpace: "nowrap" }}>{brand.phoneLabel}</div>}
        <div style={{ fontSize: 48 * u, fontWeight: 700, color: "#fff", lineHeight: 1.2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{brand.phone}</div>
      </div>
    </div>
  );
  const socialPage = hasSocial && (
    <div style={{ display: "flex", flexWrap: vertical ? "wrap" : "nowrap", alignItems: "center", gap: `${10 * u}px ${34 * u}px`, opacity: page }}>
      {brand.social.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 * u }}>
          <div style={{ width: 52 * u, height: 52 * u, borderRadius: 12 * u, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon type={s.type} size={36 * u} />
          </div>
          <div style={{ fontSize: 34 * u, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{s.text}</div>
        </div>
      ))}
    </div>
  );
  const panel = (phonePage || socialPage) && (
    // দুই পাতা একই ঘরে — চওড়া বড়টার সমান, তাই বদলের সময় বার নড়ে না
    <div style={{ background: theme.color.panel, padding: `${12 * u}px ${30 * u}px`, display: "grid", alignItems: "center", flex: vertical ? 1 : undefined, minHeight: h }}>
      {phonePage && <div style={{ gridArea: "1 / 1" }}>{phonePage}</div>}
      {socialPage && <div style={{ gridArea: "1 / 1" }}>{socialPage}</div>}
    </div>
  );
  // Shorts ফোনেই দেখা হয় — নিজের স্ক্রিনের QR স্ক্যান করা যায় না
  const qr = brand.qr && !vertical && (
    <div style={{ background: "#fff", padding: 8 * u, height: h, width: h, boxSizing: "border-box", flexShrink: 0 }}>
      <Img src={staticFile(brand.qr)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );

  const card = (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        borderRadius: 16 * u,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,.35)",
        fontFamily: theme.font,
        opacity: show,
        transform: `translateY(${(1 - enter) * (vertical ? -40 : 60) * u}px)`,
        maxWidth: "100%",
      }}
    >
      {nameBlock}
      <div style={{ display: "flex", alignItems: "stretch", flex: vertical ? 1 : undefined, minWidth: 0 }}>
        {panel}
        {qr}
      </div>
    </div>
  );
  return (
    <AbsoluteFill
      style={
        vertical
          ? { justifyContent: "flex-start", alignItems: "center", padding: `${height * V_BAR_TOP}px ${40 * u}px 0` }
          : { justifyContent: "flex-end", alignItems: "flex-start", padding: `0 0 ${BAR_MARGIN * u}px ${BAR_MARGIN * u}px` }
      }
    >
      {card}
    </AbsoluteFill>
  );
};

// Shorts-এ এই লেআউটগুলোতে উপরের অংশে মুখ/গ্রাফিক্স থাকে — বার লুকানো
const VERTICAL_BUSY = ["split", "pip", "motion", "motion+aroll"];

// খাড়া ফ্রেমে বার দেখানোর সময় এই শটের উপরের overlay গ্রাফিক্স বারের নিচে নামে (শটের Sequence-এর ভেতরে বসে)
export const BarClear: React.FC<{ brand?: TimelineBrand; shot: TimelineShot; children: React.ReactNode }> = ({ brand, shot, children }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const u = useUnit();
  const vertical = useIsVertical();
  const ms = shot.startMs + (frame / fps) * 1000;
  const clear = vertical && !VERTICAL_BUSY.includes(shot.layout) ? barProgress(brand, ms) * (height * V_BAR_TOP + (V_BAR_H + 24) * u) : 0;
  return <TopClearContext.Provider value={clear}>{children}</TopClearContext.Provider>;
};

export const BrandLayer: React.FC<{ brand: TimelineBrand; shots: TimelineShot[] }> = ({ brand, shots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vertical = useIsVertical();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  const ms = (frame / fps) * 1000;
  const shot = shots.find((s) => ms >= s.startMs && ms < s.endMs);
  const hidden = vertical && Boolean(shot && VERTICAL_BUSY.includes(shot.layout));
  return (
    <AbsoluteFill>
      {brand.logo && <Logo logo={brand.logo} />}
      {brand.bars.map((b, i) => (
        <Sequence key={i} from={f(b.startMs)} durationInFrames={Math.max(1, f(b.endMs) - f(b.startMs))} premountFor={fps} name={`যোগাযোগ বার ${i + 1}`}>
          <ContactBar brand={brand} hidden={hidden} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
