import React from "react";
import { Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { AROLL_FULL, type Grade, type TimelineShot } from "../timeline-types";
import { gradeFilter } from "./BRoll";
import { arollOnTop, arollRect, lerpRect } from "./geometry";

// A-roll পুরো ভিডিওতে একটাই — শুধু জায়গা/আকার/ক্রপ বদলায়, অডিও কখনো থামে না
export const ARollLayer: React.FC<{ src: string; shots: TimelineShot[]; focus: string; grade?: Grade }> = ({ src, shots, focus, grade }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  const i = Math.max(0, shots.findIndex((s) => frame >= f(s.startMs) && frame < f(s.endMs)));
  const cur = shots[i];
  const prev = shots[i - 1];
  const target = arollRect(cur.layout, W, H);
  const t = frame - f(cur.startMs);

  let rect = target;
  if (prev) {
    const from = arollRect(prev.layout, W, H);
    if (from.opacity === 0 && target.opacity > 0) rect = target;
    else if (target.opacity === 0 && from.opacity > 0) rect = t < theme.brollFadeFrames ? from : target;
    else {
      const p = interpolate(t, [0, theme.layoutTransitionFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
      rect = lerpRect(from, target, p);
    }
  }

  // punch = স্থির ক্রপ (কাটে হঠাৎ বদলায় — জাম্প-কাট ঢাকে); zoom = শট জুড়ে ধীরে পুশ-ইন
  const isFull = AROLL_FULL.includes(cur.layout);
  const push = isFull && cur.zoom ? interpolate(frame, [f(cur.startMs), f(cur.endMs)], [1, cur.zoom], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const scale = (isFull ? cur.punch : 1) * push;
  const framed = rect.radius > 0;

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: rect.radius,
        overflow: "hidden",
        opacity: rect.opacity,
        zIndex: arollOnTop(cur.layout) ? 30 : 10,
        boxShadow: framed ? "0 14px 44px rgba(0,0,0,.5)" : undefined,
        outline: framed ? `${Math.max(3, Math.min(W, H) / 270)}px solid rgba(255,255,255,.92)` : undefined,
        background: "#000",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, transform: `scale(${scale})`, transformOrigin: focus, filter: gradeFilter(grade) }}
      />
    </div>
  );
};
