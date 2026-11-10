import React, { createContext, useContext } from "react";
import { Audio, Sequence, staticFile } from "remotion";

type Sfx = { whoosh: string; pop: string; volume: number } | null;
export const SfxContext = createContext<Sfx>(null);

// scene-এর ভেতর থেকে pop বাজানো (যেমন লিস্টের প্রতিটা আইটেম)
export const PopAt: React.FC<{ frame: number; gain?: number }> = ({ frame, gain = 0.6 }) => {
  const sfx = useContext(SfxContext);
  if (!sfx) return null;
  return (
    <Sequence from={Math.max(0, frame)} durationInFrames={10} layout="none" name="sfx pop">
      <Audio src={staticFile(sfx.pop)} volume={sfx.volume * gain} />
    </Sequence>
  );
};
