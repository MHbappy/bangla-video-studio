import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BoxCaptions } from "../captions/BoxCaptions";
import { ShortsCaptions } from "../captions/ShortsCaptions";
import type { VideoProps } from "../data";
import { Scene } from "../scenes";
import { ShotLayoutContext } from "../scenes/common";
import { SfxContext } from "../sfx";
import { GFX_OVERLAY, type Timeline, type TimelineShot } from "../timeline-types";
import type { CaptionLine } from "../types";
import { ARollLayer } from "./ARollLayer";
import { BarClear, barProgress, barTop, BrandLayer } from "./Brand";
import { BRoll } from "./BRoll";
import { EndScreenBg } from "./EndScreen";
import { mapPoint } from "./geometry";
import { Music } from "./Music";

const BIG_CHANGE = ["motion", "motion+aroll", "split", "pip", "endscreen"];

// লেআউট বদলের whoosh, overlay গ্রাফিক্সের pop
const AutoSfx: React.FC<{ shots: TimelineShot[]; sfx: NonNullable<Timeline["sfx"]> }> = ({ shots, sfx }) => {
  const { fps } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  return (
    <>
      {shots.map((s, i) => {
        if (!s.sfx) return null;
        const prev = shots[i - 1];
        const at = f(s.startMs);
        if (BIG_CHANGE.includes(s.layout) && prev && prev.layout !== s.layout)
          return (
            <Sequence key={i} from={Math.max(0, at - Math.round(fps * 0.2))} durationInFrames={Math.round(fps * 0.7)} layout="none" name={`#${s.index} whoosh`}>
              <Audio src={staticFile(sfx.whoosh)} volume={sfx.volume * 0.8} />
            </Sequence>
          );
        if (GFX_OVERLAY.includes(s.layout) && s.gfx && s.gfx.scene !== "BulletList")
          return (
            <Sequence key={i} from={at + 3} durationInFrames={Math.round(fps * 0.3)} layout="none" name={`#${s.index} pop`}>
              <Audio src={staticFile(sfx.pop)} volume={sfx.volume * 0.7} />
            </Sequence>
          );
        return null;
      })}
    </>
  );
};

const Captions: React.FC<{ lines: CaptionLine[]; timeline: Timeline }> = ({ lines, timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const shot = timeline.shots.find((s) => ms >= s.startMs && ms < s.endMs);
  if (!shot || !shot.captions || timeline.captionStyle === "none" || shot.layout === "motion" || shot.layout === "motion+aroll") return null;
  // Shorts-এ end screen নেই (পুরো A-roll) — সেখানে ক্যাপশন থাকে
  if (shot.layout === "endscreen" && width > height) return null;
  const emphasis = timeline.captionEmphasis ?? true;
  if (height > width) return <ShortsCaptions lines={lines} emphasis={emphasis} />;
  // যোগাযোগ বার দেখালে ক্যাপশন তার উপরে সরে যায়
  const lift = barProgress(timeline.brand, ms) * Math.max(0, barTop(Math.min(width / 1920, height / 1080)) - height * 0.065);
  return (
    <BoxCaptions lines={lines} style={timeline.captionStyle === "highlight" ? "highlight" : "box"} rightInset={shot.layout === "pip" ? width * 0.3 : 0} bottomInset={lift} emphasis={emphasis} />
  );
};

// Main (১৬:৯), Vertical (৯:১৬) আর Graphics (স্বচ্ছ) — তিনটাই এই একই এডিট থেকে
export const Edit: React.FC<VideoProps & { transparent?: boolean }> = ({ project, lines = [], timeline, transparent }) => {
  const { fps, width: W, height: H } = useVideoConfig();
  if (!project || !timeline) return null;
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  const sfxEnabled = timeline.sfx;
  // Callout-এর x,y মূল ফ্রেমের জন্য লেখা — Shorts-এ ফুটেজ অন্যভাবে বসে, তাই একই জিনিসের উপর সরিয়ে নিই
  // (জিনিসটা কাটা পড়ে গেলে তীর বাদ — ভুল জায়গা দেখানোর চেয়ে ভালো)
  const placed = (s: TimelineShot) => {
    if (!s.gfx || s.gfx.scene !== "Callout" || !GFX_OVERLAY.includes(s.layout)) return s.gfx;
    const at = mapPoint(Number(s.gfx.x ?? 50), Number(s.gfx.y ?? 50), s, project, W, H, timeline.arollFocus);
    return at ? { ...s.gfx, ...at } : undefined;
  };

  return (
    <AbsoluteFill style={{ background: transparent ? undefined : "#000" }}>
      {!transparent && <ARollLayer src={`videos/${project.slug}/${project.aroll}`} shots={timeline.shots} focus={timeline.arollFocus} grade={timeline.arollGrade} />}

      {timeline.shots.map((s) => {
        const from = f(s.startMs);
        const dur = Math.max(1, f(s.endMs) - from);
        const gfx = placed(s);
        return (
          <React.Fragment key={s.index}>
            {s.layout === "endscreen" && (
              <Sequence from={from} durationInFrames={dur} name={`#${s.index} end screen`}>
                <EndScreenBg text={timeline.endScreenText} />
              </Sequence>
            )}
            {s.broll && (
              <Sequence from={from} durationInFrames={dur} premountFor={fps} name={`#${s.index} B-roll ${s.broll.file}`}>
                <BRoll broll={s.broll} layout={s.layout} />
              </Sequence>
            )}
            {gfx && (
              <Sequence from={from} durationInFrames={dur} premountFor={fps} name={`#${s.index} ${gfx.scene}`}>
                <SfxContext.Provider value={sfxEnabled && s.sfx ? sfxEnabled : null}>
                  <ShotLayoutContext.Provider value={s.layout}>
                    {/* overlay: A-roll, B-roll আর PiP বক্স — সবার উপরে; full (motion): B-roll-এর স্তরে */}
                    <AbsoluteFill style={{ zIndex: GFX_OVERLAY.includes(s.layout) ? 40 : 20 }}>
                      <BarClear brand={timeline.brand} shot={s}>
                        <Scene gfx={gfx} mode={GFX_OVERLAY.includes(s.layout) ? "overlay" : "full"} />
                      </BarClear>
                    </AbsoluteFill>
                  </ShotLayoutContext.Provider>
                </SfxContext.Provider>
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      {timeline.brand && (
        <AbsoluteFill style={{ zIndex: 45 }}>
          <BrandLayer brand={timeline.brand} shots={timeline.shots} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ zIndex: 50 }}>
        <Captions lines={lines} timeline={timeline} />
      </AbsoluteFill>
      {timeline.music && (
        // পুরনো timeline.json-এ music একটা অবজেক্ট ছিল
        <Music music={Array.isArray(timeline.music) ? timeline.music : [{ ...(timeline.music as object), startMs: 0, endMs: Infinity } as never]} lines={lines} shots={timeline.shots} />
      )}
      {sfxEnabled && <AutoSfx shots={timeline.shots} sfx={sfxEnabled} />}
    </AbsoluteFill>
  );
};
