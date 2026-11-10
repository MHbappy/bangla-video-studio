export type Word = { text: string; startMs: number; endMs: number };
export type CaptionLine = { startMs: number; endMs: number; text: string; words: Word[] };
export type Project = {
  slug: string;
  aroll: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};
export type { Timeline, TimelineShot } from "./timeline-types";
