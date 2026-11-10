import React, { useMemo } from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { MusicSection, TimelineShot } from "../timeline-types";
import type { CaptionLine } from "../types";

const XFADE_MS = 1000; // দুই অংশের মাঝে ক্রসফেড (প্রতি পাশে)
// অধ্যায়/টাইটেল কার্ডে মিউজিক একটু উঠে আসে
const SWELL = ["ChapterCard", "TitleCard"];

// ব্যাকগ্রাউন্ড মিউজিক: কথার সময় নিচু (duck), বিরতিতে উঠে আসে, শুরু/শেষে ফেড; অংশ বদলে ক্রসফেড
export const Music: React.FC<{ music: MusicSection[]; lines: CaptionLine[]; shots: TimelineShot[] }> = ({ music, lines, shots }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const totalMs = (durationInFrames / fps) * 1000;
  const sorted = useMemo(() => [...lines].sort((a, b) => a.startMs - b.startMs), [lines]);
  const talkingAt = (ms: number) => sorted.some((l) => ms >= l.startMs - 200 && ms <= l.endMs + 200);
  const swellAt = (ms: number) => shots.some((s) => ms >= s.startMs && ms < s.endMs && s.layout.startsWith("motion") && SWELL.includes(String(s.gfx?.scene)));
  const f = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <>
      {music.map((m, i) => {
        const first = i === 0;
        const last = i === music.length - 1;
        const startMs = first ? 0 : m.startMs - XFADE_MS;
        const endMs = last ? totalMs : Math.min(totalMs, m.endMs + XFADE_MS);
        const fadeIn = first ? 1500 : 2 * XFADE_MS;
        const fadeOut = last ? 2500 : 2 * XFADE_MS;
        const from = f(startMs);
        const dur = Math.max(1, f(endMs) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`মিউজিক ${i + 1}`}>
            <Audio
              src={staticFile(m.path)}
              loop
              volume={(fr) => {
                const ms = ((fr + from) / fps) * 1000;
                let talk = 0;
                for (let k = -3; k <= 3; k++) talk += talkingAt(ms + k * 100) ? 1 : 0;
                const duck = swellAt(ms) ? Math.max(m.duck, 0.75) : m.duck;
                const level = 1 - (talk / 7) * (1 - duck);
                const fade = interpolate(ms - startMs, [0, fadeIn, endMs - startMs - fadeOut, endMs - startMs], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return m.volume * level * fade;
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
