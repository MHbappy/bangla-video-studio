import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Layout } from "../timeline-types";

export type SceneMode = "full" | "overlay";
export type SceneProps<T> = T & { mode: SceneMode };

// overlay গ্রাফিক্স কোন লেআউটের উপর বসছে — PiP-এর ছোট A-roll বক্স এড়াতে লাগে
export const ShotLayoutContext = createContext<Layout>("aroll+gfx");

// খাড়া ফ্রেমে যোগাযোগ বার উপরে বসে — উপরের overlay গ্রাফিক্স (CTA, TitleCard, ডান পাশের কার্ড) এত px-এর নিচে নামে (০ = বার নেই)
export const TopClearContext = createContext(0);
export const useTopClear = () => useContext(TopClearContext);

// স্কেল: 1080p-কে ভিত্তি ধরে সব মাপ (4K-তেও ঠিক থাকে)
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return height > width ? (width / 1080) * 0.9 : Math.min(width / 1920, height / 1080);
};

// এক লাইনের বড় লেখা (দাম) জায়গায় ধরাতে: অক্ষর গুনে ফন্টের মাপ (1080p একক) — কখনো max-এর বেশি নয়
export const fitFont = (text: string, max: number, width: number) => Math.min(max, width / (Math.max(1, [...text].length) * 0.6));

export const useIsVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

export const useEnter = (delay = 0, cfg: object = theme.spring) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: cfg });
};

// শেষের দিকে ফেড-আউট
export const useExit = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - theme.exitFrames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const FullBg: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${30 + drift}% 20%, ${theme.color.bg2} 0%, ${theme.color.bg} 60%)`,
        fontFamily: theme.font,
        color: theme.color.text,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ফুটেজের উপর ডান পাশের কার্ড (BulletList, StatCard overlay মোডে)
export const SidePanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const u = useUnit();
  const vertical = useIsVertical();
  const { width, height } = useVideoConfig();
  const enter = useEnter();
  const exit = useExit();
  // PiP: ছোট A-roll বক্স ১৬:৯-এ নিচে-ডানে, খাড়ায় উপরে-বাঁয়ে (geometry.ts) — কার্ড তার বাইরে বসে
  const pip = useContext(ShotLayoutContext) === "pip";
  const clear = useTopClear();
  return (
    <AbsoluteFill
      style={
        vertical
          ? { justifyContent: "flex-start", alignItems: "center", paddingTop: Math.max(pip ? height * 0.11 + width * 0.42 + 40 * u : height * 0.12, clear), fontFamily: theme.font }
          : { justifyContent: pip ? "flex-start" : "center", alignItems: "flex-end", padding: 70 * u, paddingTop: (pip ? 150 : 70) * u, fontFamily: theme.font }
      }
    >
      <div
        style={{
          width: vertical ? "86%" : 640 * u,
          background: theme.color.panel,
          borderRadius: theme.radius * u,
          borderLeft: `${8 * u}px solid ${theme.color.accent}`,
          padding: `${44 * u}px ${48 * u}px`,
          color: theme.color.text,
          opacity: enter * exit,
          transform: vertical ? `translateY(${(1 - enter) * -80 * u}px)` : `translateX(${(1 - enter) * 120 * u}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
