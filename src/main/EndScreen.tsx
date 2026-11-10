// End screen-এর পটভূমি (১৬:৯): A-roll বাঁয়ে ছোট বাক্সে, ডান দিক ফাঁকা — YouTube Studio-তে সেখানে
// "পরের ভিডিও" আর "সাবস্ক্রাইব" বসান। Shorts-এ কিছু আঁকে না (পুরো A-roll)।
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FullBg, useIsVertical, useUnit } from "../scenes/common";
import { theme } from "../theme";

export const EndScreenBg: React.FC<{ text?: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const vertical = useIsVertical();
  if (vertical) return null;
  const fade = interpolate(frame, [0, theme.layoutTransitionFrames], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fade, zIndex: 5 }}>
      <FullBg>
        {/* A-roll বাক্সের উপরে ছোট লেখা — ডান দিকে কিছু নয় */}
        <AbsoluteFill style={{ padding: `${150 * u}px 0 0 ${96 * u}px` }}>
          <div style={{ width: 70 * u, height: 8 * u, borderRadius: 4 * u, background: theme.color.accent, marginBottom: 18 * u }} />
          <div style={{ fontSize: 54 * u, fontWeight: 700, lineHeight: 1.3 }}>{text ?? "দেখার জন্য ধন্যবাদ"}</div>
        </AbsoluteFill>
      </FullBg>
    </AbsoluteFill>
  );
};
