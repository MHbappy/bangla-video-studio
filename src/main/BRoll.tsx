import React from "react";
import { Img, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Grade, Layout, TimelineShot } from "../timeline-types";
import { brollFits, brollRect, fitBox } from "./geometry";

const moveTransform = (move: string, p: number) => {
  const e = p * p * (3 - 2 * p); // smoothstep — শুরু/শেষে নরম
  switch (move) {
    case "slowZoomIn": return `scale(${1.02 + 0.1 * e})`;
    case "slowZoomOut": return `scale(${1.12 - 0.1 * e})`;
    case "panLeft": return `scale(1.12) translateX(${4 - 8 * e}%)`;
    case "panRight": return `scale(1.12) translateX(${-4 + 8 * e}%)`;
    default: return "none";
  }
};

export const gradeFilter = (g?: Grade) =>
  g ? `brightness(${g.brightness ?? 1}) contrast(${g.contrast ?? 1}) saturate(${g.saturation ?? 1})` : undefined;

export const BRoll: React.FC<{ broll: NonNullable<TimelineShot["broll"]>; layout: Layout }> = ({ broll, layout }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width: W, height: H } = useVideoConfig();
  const r = brollRect(layout, W, H);
  const move = broll.move ?? (broll.kind === "image" ? "slowZoomIn" : "none");
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, theme.brollFadeFrames], [0, 1], { extrapolateRight: "clamp" });
  const src = staticFile(broll.path);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: broll.focus ?? "50% 50%", transform: moveTransform(move, p), filter: gradeFilter(broll.grade) };
  // fit: ফুটেজ আর ফ্রেমের আকার না মিললে পুরো ছবিটা নিজের মাপে, পেছনে তারই ঝাপসা কপি (কিছু কাটা পড়ে না)
  const inner = broll.aspect && brollFits(broll, layout, W, H) ? fitBox(layout, W, H, broll.aspect) : null;
  const backStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", filter: `blur(${Math.round(Math.min(W, H) / 27)}px) brightness(0.45)` };

  const clip = (st: React.CSSProperties, withSound: boolean) => {
    if (broll.kind === "image") return <Img src={src} style={st} />;
    const rate = broll.rate ?? 1;
    const startFrom = Math.round((broll.from ?? 0) * fps);
    // লুপের দৈর্ঘ্য: গতি কমালে ক্লিপ বেশিক্ষণ চলে
    const clipFrames = broll.durationSec ? Math.floor((broll.durationSec * fps - startFrom) / rate) : Infinity;
    const sound = withSound ? broll.sound ?? 0 : 0;
    // নিজের শব্দ: শুরু/শেষে ছোট ফেড (ক্লিক এড়াতে)
    const volume = (f: number) =>
      sound * interpolate(f, [0, 6, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const video = <OffthreadVideo src={src} muted={sound <= 0} volume={sound > 0 ? volume : undefined} playbackRate={rate} startFrom={startFrom} style={st} />;
    return clipFrames > 0 && clipFrames < durationInFrames ? <Loop durationInFrames={clipFrames}>{video}</Loop> : video;
  };
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", opacity: fade, zIndex: 20, background: "#000" }}>
      {inner ? (
        <>
          {clip(backStyle, false)}
          <div style={{ position: "absolute", left: inner.x - r.x, top: inner.y - r.y, width: inner.w, height: inner.h, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.45)" }}>{clip(style, true)}</div>
        </>
      ) : (
        clip(style, true)
      )}
    </div>
  );
};
