import { staticFile } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { Timeline } from "./timeline-types";
import type { CaptionLine, Project } from "./types";

export type VideoProps = {
  slug: string;
  project?: Project;
  lines?: CaptionLine[];
  timeline?: Timeline;
};

const get = async <T,>(p: string): Promise<T | null> => {
  const r = await fetch(staticFile(p));
  return r.ok ? ((await r.json()) as T) : null;
};

export const loadVideo = async (slug: string) => {
  const base = `videos/${slug}`;
  const project = await get<Project>(`${base}/project.json`);
  if (!project) throw new Error(`media/videos/${slug}/project.json নেই — npm run new -- ${slug} <ভিডিও>`);
  const lines = (await get<{ lines: CaptionLine[] }>(`${base}/captions.json`))?.lines ?? [];
  const totalMs = (project.durationInFrames / project.fps) * 1000;
  const timeline: Timeline = (await get<Timeline>(`${base}/timeline.json`)) ?? {
    arollFocus: "50% 35%",
    captionStyle: "box",
    sfx: null,
    shots: [{ index: 1, startMs: 0, endMs: totalMs, layout: "aroll", punch: 1, captions: true, sfx: false }],
  };
  return { project, lines, timeline };
};

export const sameSizeMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const data = await loadVideo(props.slug);
  return { props: { ...props, ...data }, width: data.project.width, height: data.project.height, fps: data.project.fps, durationInFrames: data.project.durationInFrames };
};

export const verticalMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const data = await loadVideo(props.slug);
  return { props: { ...props, ...data }, width: 1080, height: 1920, fps: data.project.fps, durationInFrames: data.project.durationInFrames };
};
