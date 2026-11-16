import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { FullBg, type SceneProps, useEnter, useExit, useIsVertical, useUnit } from "./common";

// align = বাঁ/ডান দিক; y = কার্ডের নিচের প্রান্ত, ফ্রেমের উপর থেকে % (না দিলে ক্যাপশনের উপরে: খাড়ায় 58, ১৬:৯-এ ~79) — পণ্য বা হাত ঢাকলে সরাতে
export const LowerThird: React.FC<SceneProps<{ name: string; role?: string; align?: "left" | "right"; y?: number }>> = ({ name, role, align = "left", y, mode }) => {
  const u = useUnit();
  const bar = useEnter();
  const txt = useEnter(6);
  const exit = useExit();
  const vertical = useIsVertical();
  const { height } = useVideoConfig();
  const right = align === "right";
  const card = (
    <div style={{ display: "flex", alignItems: "stretch", opacity: exit }}>
      <div style={{ width: 10 * u, background: theme.color.accent, borderRadius: 5 * u, transform: `scaleY(${bar})`, order: right ? 1 : 0 }} />
      <div
        style={{
          background: theme.color.panel,
          padding: `${16 * u}px ${30 * u}px`,
          borderRadius: right ? `${14 * u}px 0 0 ${14 * u}px` : `0 ${14 * u}px ${14 * u}px 0`,
          // দাগের দিক থেকে খোলে
          clipPath: right ? `inset(0 0 0 ${(1 - bar) * 100}%)` : `inset(0 ${(1 - bar) * 100}% 0 0)`,
          textAlign: right ? "right" : "left",
        }}
      >
        <div style={{ fontSize: 50 * u, fontWeight: 700, color: "#fff", opacity: txt }}>{name}</div>
        {role && <div style={{ fontSize: 30 * u, color: theme.color.accent, opacity: txt }}>{role}</div>}
      </div>
    </div>
  );
  if (mode === "full") return <FullBg><AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>{card}</AbsoluteFill></FullBg>;
  // ডিফল্ট: ক্যাপশনের উপরে, বাঁ দিকে
  const bottom = y !== undefined ? height * (1 - y / 100) : vertical ? height * 0.42 : 230 * u;
  const side = (vertical ? 60 : 90) * u;
  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-end", alignItems: right ? "flex-end" : "flex-start", padding: `0 ${right ? side : 0}px ${bottom}px ${right ? 0 : side}px`, fontFamily: theme.font }}
    >
      {card}
    </AbsoluteFill>
  );
};
