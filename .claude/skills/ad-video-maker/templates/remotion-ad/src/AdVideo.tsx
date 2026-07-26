import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── scenes.json 스키마 타입 ──────────────────────────────────
export type Scene = {
  id: string;
  type: "video" | "image" | "color";
  src?: string;
  color?: string;
  durationInSeconds: number;
  subtitle?: string;
};

export type AdData = {
  meta: { title?: string; fps?: number };
  audio?: { bgm?: string; bgmVolume?: number; narration?: string };
  branding?: { logo?: string; brandColor?: string; accentColor?: string };
  scenes: Scene[];
  outro?: {
    enabled: boolean;
    durationInSeconds: number;
    headline?: string;
    sub?: string;
  };
};

export const calcTotalFrames = (data: AdData, fps: number): number => {
  const sceneSeconds = data.scenes.reduce(
    (sum, s) => sum + s.durationInSeconds,
    0
  );
  const outroSeconds = data.outro?.enabled ? data.outro.durationInSeconds : 0;
  return Math.max(1, Math.round((sceneSeconds + outroSeconds) * fps));
};

const FONT =
  'Pretendard, "Noto Sans KR", "Malgun Gothic", "Hiragino Sans", "Segoe UI", Roboto, sans-serif';
const FADE_FRAMES = 12;

// ── 씬 미디어 (video / image+켄번즈 / color) ────────────────
const SceneMedia: React.FC<{ scene: Scene; durationInFrames: number }> = ({
  scene,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  // 이미지 씬은 느린 확대(켄번즈)로 정지 화면의 어색함을 줄인다
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  if (scene.type === "video" && scene.src) {
    return (
      <OffthreadVideo
        src={staticFile(scene.src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  if (scene.type === "image" && scene.src) {
    return (
      <Img
        src={staticFile(scene.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
    );
  }
  return <AbsoluteFill style={{ backgroundColor: scene.color ?? "#111827" }} />;
};

// ── 하단 자막 ────────────────────────────────────────────────
const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const minDim = Math.min(width, height);
  const opacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: height * 0.08,
          maxWidth: "85%",
          padding: `${minDim * 0.018}px ${minDim * 0.035}px`,
          borderRadius: minDim * 0.02,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          color: "#FFFFFF",
          fontSize: minDim * 0.05,
          fontWeight: 700,
          fontFamily: FONT,
          textAlign: "center",
          lineHeight: 1.35,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ── 개별 씬 (페이드인 + 미디어 + 자막) ──────────────────────
const SceneView: React.FC<{ scene: Scene; durationInFrames: number }> = ({
  scene,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneMedia scene={scene} durationInFrames={durationInFrames} />
      {scene.subtitle ? <Subtitle text={scene.subtitle} /> : null}
    </AbsoluteFill>
  );
};

// ── 아웃트로 (브랜드 컬러 + 로고 + CTA) ─────────────────────
const Outro: React.FC<{ data: AdData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const minDim = Math.min(width, height);
  const scale = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  const brandColor = data.branding?.brandColor ?? "#0F172A";
  const accentColor = data.branding?.accentColor ?? "#38BDF8";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brandColor,
        justifyContent: "center",
        alignItems: "center",
        gap: minDim * 0.035,
        opacity,
      }}
    >
      {data.branding?.logo ? (
        <Img
          src={staticFile(data.branding.logo)}
          style={{ width: minDim * 0.25, objectFit: "contain" }}
        />
      ) : null}
      {data.outro?.headline ? (
        <div
          style={{
            color: "#FFFFFF",
            fontSize: minDim * 0.075,
            fontWeight: 800,
            fontFamily: FONT,
            textAlign: "center",
            maxWidth: "85%",
            transform: `scale(${scale})`,
          }}
        >
          {data.outro.headline}
        </div>
      ) : null}
      {data.outro?.sub ? (
        <div
          style={{
            color: accentColor,
            fontSize: minDim * 0.035,
            fontWeight: 600,
            fontFamily: FONT,
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          {data.outro.sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 메인 컴포지션 ────────────────────────────────────────────
export const AdVideo: React.FC<{ data: AdData }> = ({ data }) => {
  const { fps } = useVideoConfig();

  let cursor = 0;
  const sceneSequences = data.scenes.map((scene) => {
    const dur = Math.max(1, Math.round(scene.durationInSeconds * fps));
    const seq = (
      <Sequence key={scene.id} from={cursor} durationInFrames={dur}>
        <SceneView scene={scene} durationInFrames={dur} />
      </Sequence>
    );
    cursor += dur;
    return seq;
  });

  const outroFrames = data.outro?.enabled
    ? Math.max(1, Math.round(data.outro.durationInSeconds * fps))
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {sceneSequences}
      {data.outro?.enabled ? (
        <Sequence from={cursor} durationInFrames={outroFrames}>
          <Outro data={data} />
        </Sequence>
      ) : null}
      {data.audio?.bgm ? (
        <Audio
          src={staticFile(data.audio.bgm)}
          volume={data.audio.bgmVolume ?? 0.5}
          loop
        />
      ) : null}
      {data.audio?.narration ? (
        <Audio src={staticFile(data.audio.narration)} />
      ) : null}
    </AbsoluteFill>
  );
};
