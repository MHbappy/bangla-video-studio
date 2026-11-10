import React from "react";
import { Composition, Folder } from "remotion";
import "./fonts";
import { sameSizeMetadata, verticalMetadata, type VideoProps } from "./data";
import { DemoAroll, DemoBroll, DemoLogo, DemoQr } from "./demo/DemoSources";
import { Edit } from "./main/Edit";
import { Thumbnail, type ThumbnailProps } from "./Thumbnail";

const Graphics: React.FC<VideoProps> = (p) => <Edit {...p} transparent />;

// slug আসে --props থেকে (npm run studio / render নিজে দেয়)
const base = { defaultProps: { slug: "demo" } as VideoProps, width: 1920, height: 1080, fps: 30, durationInFrames: 300 };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Edit} calculateMetadata={sameSizeMetadata} {...base} />
    <Composition id="Vertical" component={Edit} calculateMetadata={verticalMetadata} {...base} />
    <Composition id="Graphics" component={Graphics} calculateMetadata={sameSizeMetadata} {...base} />
    <Composition id="Thumbnail" component={Thumbnail} width={1280} height={720} fps={30} durationInFrames={1} defaultProps={{ title: "৬০০০W *লেজার* কাটার" } as ThumbnailProps} />
    <Folder name="demo-tools">
      <Composition id="DemoAroll" component={DemoAroll} width={1920} height={1080} fps={30} durationInFrames={1200} />
      <Composition id="DemoBroll" component={DemoBroll} width={1920} height={1080} fps={30} durationInFrames={240} defaultProps={{ label: "demo", hue: 200 }} />
      <Composition id="DemoLogo" component={DemoLogo} width={560} height={160} fps={30} durationInFrames={1} />
      <Composition id="DemoQr" component={DemoQr} width={400} height={400} fps={30} durationInFrames={1} />
    </Folder>
  </>
);
