import React from "react";
import { Composition } from "remotion";
import { AdVideo, calcTotalFrames } from "./AdVideo";
import type { AdData } from "./AdVideo";
import scenesJson from "./scenes.json";

const data = scenesJson as unknown as AdData;
const fps = data.meta?.fps ?? 30;
const durationInFrames = calcTotalFrames(data, fps);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ad-16x9"
        component={AdVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{ data }}
      />
      <Composition
        id="Ad-9x16"
        component={AdVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ data }}
      />
      <Composition
        id="Ad-1x1"
        component={AdVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1080}
        defaultProps={{ data }}
      />
    </>
  );
};
