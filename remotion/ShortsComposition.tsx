import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

export interface Caption {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface ShortsCompositionProps {
  avatarVideoUrl: string;
  captions: Caption[];
  creatorName: string;
  showName: string;
}

export const ShortsComposition: React.FC<ShortsCompositionProps> = ({
  avatarVideoUrl,
  captions,
  creatorName,
  showName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active caption word
  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  // Previous 3 words (already finished)
  const previousCaptions = captions
    .filter((c) => c.endFrame < frame)
    .slice(-3);

  // Lower-third entrance spring
  const lowerThirdProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 200 },
  });

  // EP logo fade-in
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Avatar video */}
      {avatarVideoUrl && (
        <AbsoluteFill>
          <OffthreadVideo
            src={avatarVideoUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {/* Layer 2: Captions */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: "22%",
        }}
      >
        {/* Previous words */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {previousCaptions.map((c, i) => (
            <span
              key={`prev-${c.startFrame}-${i}`}
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: "rgba(255, 255, 255, 0.6)",
                textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                textAlign: "center",
              }}
            >
              {c.word}
            </span>
          ))}
        </div>

        {/* Active word */}
        {activeCaption && (
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 44,
              color: "#FFFFFF",
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              textAlign: "center",
              transform: `scale(${spring({
                frame: frame - activeCaption.startFrame,
                fps,
                config: { damping: 200 },
              })})`,
            }}
          >
            {activeCaption.word}
          </span>
        )}
      </AbsoluteFill>

      {/* Layer 3: Lower third */}
      <Sequence from={15}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "flex-start",
            paddingBottom: "8%",
            paddingLeft: "5%",
          }}
        >
          <div
            style={{
              transform: `translateY(${interpolate(
                lowerThirdProgress,
                [0, 1],
                [20, 0]
              )}px)`,
              opacity: lowerThirdProgress,
            }}
          >
            <div
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: "#FFFFFF",
                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              }}
            >
              {creatorName}
            </div>
            <div
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontWeight: 400,
                fontSize: 16,
                color: "#7AB3D0",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                marginTop: 2,
              }}
            >
              {showName}
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Layer 4: EP logomark */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            backgroundColor: "#C0272D",
            borderRadius: 8,
            padding: "8px 14px",
            opacity: logoOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: "#FFFFFF",
              letterSpacing: 1,
            }}
          >
            EP
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
