import React from "react";
import { Composition, registerRoot } from "remotion";
import { ShortsComposition } from "./ShortsComposition";
import type { ShortsCompositionProps } from "./ShortsComposition";

const defaultProps: ShortsCompositionProps = {
  avatarVideoUrl: "",
  captions: [],
  creatorName: "Creator Name",
  showName: "Show Name",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={ShortsComposition as unknown as React.FC<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const p = props as unknown as ShortsCompositionProps;
        const lastCaption = p.captions[p.captions.length - 1];
        const durationInFrames = lastCaption
          ? lastCaption.endFrame + 30
          : 300;
        return { durationInFrames };
      }}
    />
  );
};

registerRoot(RemotionRoot);
