import React from "react";
import type { Gfx } from "../timeline-types";
import { BulletList } from "./BulletList";
import { Callout } from "./Callout";
import { Compare } from "./Compare";
import { ChapterCard } from "./ChapterCard";
import { CTA } from "./CTA";
import type { SceneMode } from "./common";
import { LowerThird } from "./LowerThird";
import { StatCard } from "./StatCard";
import { TitleCard } from "./TitleCard";

// নতুন scene বানালে এখানে আর src/timeline-types.ts-এর SCENES-এ নাম যোগ করুন
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, React.FC<any>> = { TitleCard, ChapterCard, BulletList, StatCard, LowerThird, CTA, Callout, Compare };

export const Scene: React.FC<{ gfx: Gfx; mode: SceneMode }> = ({ gfx, mode }) => {
  const C = REGISTRY[gfx.scene];
  if (!C) return null;
  const { scene: _s, ...props } = gfx;
  return <C {...props} mode={mode} />;
};
