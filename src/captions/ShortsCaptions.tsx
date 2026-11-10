import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { CaptionLine, Word } from "../types";
import { isKeyword } from "./emphasis";

const MAX_WORDS = 3;
const MAX_CHARS = 16;


// লাইনগুলোকে ছোট শব্দ-গুচ্ছে ভাগ (একসাথে ২–৩টা শব্দ)
const toGroups = (lines: CaptionLine[]) => {
  const groups: Word[][] = [];
  for (const l of lines) {
    let cur: Word[] = [];
    for (const w of l.words) {
      const len = [...cur, w].map((x) => x.text).join(" ").length;
      if (cur.length && (cur.length >= MAX_WORDS || len > MAX_CHARS)) {
        groups.push(cur);
        cur = [];
      }
      cur.push(w);
    }
    if (cur.length) groups.push(cur);
  }
  return groups;
};

export const ShortsCaptions: React.FC<{ lines: CaptionLine[]; emphasis?: boolean }> = ({ lines, emphasis = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const groups = useMemo(() => toGroups(lines), [lines]);
  const ms = (frame / fps) * 1000;
  const group = groups.find((g) => ms >= g[0].startMs && ms < g[g.length - 1].endMs);
  if (!group) return null;

  const startFrame = Math.floor((group[0].startMs / 1000) * fps);
  const pop = spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 8 });
  const scale = interpolate(pop, [0, 1], [0.82, 1]);
  const fontSize = Math.round(width * 0.085);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.27 }}>
      <div
        style={{
          transform: `scale(${scale})`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `0 ${fontSize * 0.28}px`,
          maxWidth: "86%",
          fontFamily: theme.font,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.35,
          textAlign: "center",
        }}
      >
        {group.map((w, i) => {
          const active = ms >= w.startMs && ms < w.endMs;
          return (
            <span
              key={i}
              style={{
                color: active ? theme.color.accent : emphasis && isKeyword(w.text) ? theme.color.accent2 : "white",
                WebkitTextStroke: `${fontSize * 0.05}px black`,
                paintOrder: "stroke fill",
                textShadow: "0 6px 18px rgba(0,0,0,0.55)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
