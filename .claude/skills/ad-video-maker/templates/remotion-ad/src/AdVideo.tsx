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
import { loadFont as loadSansKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadSerifKR } from "@remotion/google-fonts/NotoSerifKR";
import { loadFont as loadGowunBatang } from "@remotion/google-fonts/GowunBatang";
import { loadFont as loadSongMyung } from "@remotion/google-fonts/SongMyung";
import { loadFont as loadBlackHanSans } from "@remotion/google-fonts/BlackHanSans";

// 시스템 폰트(맑은 고딕) 의존 금지 — PPT 느낌의 주범. 렌더 환경 무관하게 번들 폰트 사용.
const { fontFamily: SANS_KR } = loadSansKR("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["korean", "latin"],
});
const { fontFamily: SERIF_KR } = loadSerifKR("normal", {
  weights: ["400", "500", "600"],
  subsets: ["korean", "latin"],
});
const { fontFamily: GOWUN_BATANG } = loadGowunBatang("normal", {
  weights: ["400", "700"],
  subsets: ["korean", "latin"],
});
const { fontFamily: SONG_MYUNG } = loadSongMyung("normal", {
  weights: ["400"],
  subsets: ["korean"],
});
const { fontFamily: BLACK_HAN } = loadBlackHanSans("normal", {
  weights: ["400"],
  subsets: ["korean"],
});

// ── scenes.json 스키마 타입 ──────────────────────────────────
export type Scene = {
  id: string;
  type: "video" | "image" | "color";
  src?: string;
  color?: string;
  durationInSeconds: number;
  subtitle?: string;
  subtitleStyle?: "copy" | "kinetic" | "bar";
  lead?: string;
  position?: "bottom" | "center" | "left" | "right" | "top";
  font?: "sans" | "serif" | "batang" | "myung" | "impact";
  orientation?: "horizontal" | "vertical";
  reveal?: "fade" | "letters";
  copyColor?: string;
  copyAccent?: string;
  scrim?: boolean;
  sfx?: string;
  sfxVolume?: number;
  muted?: boolean;
  videoVolume?: number;
};

export type AdData = {
  meta: { title?: string; fps?: number };
  audio?: {
    bgm?: string;
    bgmVolume?: number;
    bgmFadeInSeconds?: number;
    bgmFadeOutSeconds?: number;
    narration?: string;
    narrationVolume?: number;
    narrationStartSeconds?: number;
  };
  branding?: { logo?: string; brandColor?: string; accentColor?: string };
  scenes: Scene[];
  outro?: {
    enabled: boolean;
    durationInSeconds: number;
    headline?: string;
    sub?: string;
    image?: string;
    background?: string;
    headlineColor?: string;
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

const FONT = `${SANS_KR}, Pretendard, "Malgun Gothic", "Segoe UI", Roboto, sans-serif`;
const FONT_SERIF = `${SERIF_KR}, "Nanum Myeongjo", "Batang", serif`;
const FADE_FRAMES = 12;

// 카피용 서체 팔레트 — 컷 성격에 맞춰 선택 (전부 렌더 시 자동 다운로드되는 번들 폰트)
const COPY_FONTS: Record<
  NonNullable<Scene["font"]>,
  { family: string; baseWeight: number; accentWeight: number; tracking: string }
> = {
  sans: { family: FONT, baseWeight: 500, accentWeight: 700, tracking: "0.03em" },
  serif: { family: FONT_SERIF, baseWeight: 500, accentWeight: 600, tracking: "0.06em" },
  batang: {
    family: `${GOWUN_BATANG}, ${SERIF_KR}, serif`,
    baseWeight: 400,
    accentWeight: 700,
    tracking: "0.1em",
  },
  myung: {
    family: `${SONG_MYUNG}, ${SERIF_KR}, serif`,
    baseWeight: 400,
    accentWeight: 400,
    tracking: "0.12em",
  },
  impact: {
    family: `${BLACK_HAN}, ${SANS_KR}, sans-serif`,
    baseWeight: 400,
    accentWeight: 400,
    tracking: "0.02em",
  },
};

// *구간* 마크업 파싱 — 별표는 화면에 절대 렌더링하지 않는다 (여러 단어 강조 지원)
type CopySegment = { text: string; accent: boolean };
const parseAccents = (text: string): CopySegment[] =>
  text
    .split("*")
    .map((seg, i) => ({ text: seg, accent: i % 2 === 1 }))
    .filter((s) => s.text.length > 0);

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
        muted={scene.muted ?? false}
        volume={scene.videoVolume ?? 1}
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

// ── 카피 자막 (기본) — 광고 카피 타이포그래피 ────────────────
// 벤치마킹(라네즈형): 네거티브 스페이스 배치, 브랜드 컬러 솔리드 텍스트,
// 리드+메인 계층, 마침표 액센트, 조용한 페이드+슬라이드 (바운스 금지)
const CopySubtitle: React.FC<{ scene: Scene; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const minDim = Math.min(width, height);
  const opacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(frame, [4, 18], [minDim * 0.018, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const base = scene.copyColor ?? "#FFFFFF";
  const acc = scene.copyAccent ?? accent;
  const pos = scene.position ?? "bottom";
  // 굵기 남발 금지 — 볼드 일변도가 PPT 느낌의 주범. 서체별 굵기·자간은 팔레트에서.
  const fontKey = scene.font ?? "sans";
  const { family, baseWeight, accentWeight, tracking } = COPY_FONTS[fontKey];
  const mainSize =
    fontKey === "impact" ? 0.072 : fontKey === "sans" ? 0.052 : 0.06;
  const vertical = scene.orientation === "vertical";
  const isLight = base.toUpperCase() === "#FFFFFF";
  const shadow = isLight ? "0 2px 14px rgba(0, 0, 0, 0.22)" : "none";

  // 소프트 스크림 — 텍스트 존의 배경 명암을 정돈해 가독성 확보 (박스 아님, 광고식 그라데이션)
  const scrimOn = scene.scrim ?? true;
  const scrimColor = isLight
    ? "rgba(0, 0, 0, 0.30)"
    : "rgba(255, 255, 255, 0.60)";
  const scrimBg =
    pos === "center"
      ? `radial-gradient(ellipse 60% 45% at center, ${scrimColor} 0%, transparent 70%)`
      : `linear-gradient(${
          pos === "bottom"
            ? "to top"
            : pos === "top"
            ? "to bottom"
            : pos === "left"
            ? "to right"
            : "to left"
        }, ${scrimColor} 0%, transparent 48%)`;

  const container: React.CSSProperties = {
    justifyContent:
      pos === "top" ? "flex-start" : pos === "bottom" ? "flex-end" : "center",
    alignItems:
      pos === "left" ? "flex-start" : pos === "right" ? "flex-end" : "center",
    paddingLeft: pos === "left" ? width * 0.08 : 0,
    paddingRight: pos === "right" ? width * 0.08 : 0,
    paddingTop: pos === "top" ? height * 0.1 : 0,
    paddingBottom: pos === "bottom" ? height * 0.1 : 0,
  };
  const textAlign: React.CSSProperties["textAlign"] =
    pos === "left" ? "left" : pos === "right" ? "right" : "center";

  // *구간* 강조(별표는 렌더링 안 됨) + 문장 끝 마침표 액센트
  const text = scene.subtitle ?? "";
  const endsWithDot = text.endsWith(".");
  const bodyText = endsWithDot ? text.slice(0, -1) : text;
  const segments = parseAccents(bodyText);

  return (
    <AbsoluteFill style={container}>
      {scrimOn ? (
        <AbsoluteFill style={{ background: scrimBg, opacity }} />
      ) : null}
      <div
        style={{
          maxWidth: "80%",
          textAlign: vertical ? undefined : textAlign,
          display: vertical ? "flex" : undefined,
          flexDirection: vertical ? "row-reverse" : undefined,
          alignItems: vertical ? "flex-start" : undefined,
          opacity,
          transform: `translateY(${rise}px)`,
          zIndex: 1,
        }}
      >
        {scene.lead ? (
          <div
            style={{
              color: base,
              opacity: 0.85,
              fontSize: minDim * 0.026,
              fontWeight: 400,
              fontFamily: family,
              letterSpacing: "0.22em",
              writingMode: vertical ? "vertical-rl" : undefined,
              marginBottom: vertical ? 0 : minDim * 0.014,
              marginLeft: vertical ? minDim * 0.014 : 0,
              textShadow: shadow,
            }}
          >
            {scene.lead}
          </div>
        ) : null}
        <div
          style={{
            fontSize: minDim * mainSize,
            fontWeight: baseWeight,
            fontFamily: family,
            letterSpacing: tracking,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            writingMode: vertical ? "vertical-rl" : undefined,
            maxHeight: vertical ? height * 0.7 : undefined,
            textShadow: shadow,
          }}
        >
          {scene.reveal === "letters"
            ? // 글자 단위 리빌 — 감성 훅 카피용 (한 글자씩 조용히 떠오름)
              segments
                .flatMap((seg) =>
                  Array.from(seg.text).map((ch) => ({ ch, accent: seg.accent }))
                )
                .map(({ ch, accent: isAcc }, i) => (
                  <span
                    key={i}
                    style={{
                      color: isAcc ? acc : base,
                      fontWeight: isAcc ? accentWeight : baseWeight,
                      opacity: interpolate(
                        frame,
                        [4 + i * 2, 12 + i * 2],
                        [0, 1],
                        {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }
                      ),
                    }}
                  >
                    {ch}
                  </span>
                ))
            : segments.map((seg, i) => (
                <span
                  key={i}
                  style={{
                    color: seg.accent ? acc : base,
                    fontWeight: seg.accent ? accentWeight : baseWeight,
                  }}
                >
                  {seg.text}
                </span>
              ))}
          {endsWithDot ? (
            <span style={{ color: acc, fontWeight: accentWeight }}>.</span>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 키네틱 자막 (subtitleStyle: "kinetic") — 단어별 팝인 ─────
const KineticSubtitle: React.FC<{ text: string; accent: string }> = ({
  text,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const minDim = Math.min(width, height);
  const words = parseAccents(text).flatMap((seg) =>
    seg.text
      .split(" ")
      .filter(Boolean)
      .map((w) => ({ w, accent: seg.accent }))
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: height * 0.1,
          maxWidth: "88%",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {words.map(({ w: clean, accent: isAccent }, i) => {
          const local = Math.max(0, frame - (3 + i * 4));
          const pop = spring({
            frame: local,
            fps,
            config: { damping: 12, stiffness: 200 },
          });
          const opacity = interpolate(local, [0, 6], [0, 1], {
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `scale(${0.6 + 0.4 * pop}) translateY(${
                  (1 - pop) * minDim * 0.02
                }px)`,
                opacity,
                color: isAccent ? accent : "#FFFFFF",
                fontSize: minDim * (isAccent ? 0.062 : 0.055),
                fontWeight: 800,
                fontFamily: FONT,
                textShadow: "0 2px 18px rgba(0, 0, 0, 0.45)",
                marginRight: minDim * 0.014,
              }}
            >
              {clean}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 하단 바 자막 (클래식, subtitleStyle: "bar") ──────────────
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
const SceneView: React.FC<{
  scene: Scene;
  durationInFrames: number;
  accent: string;
}> = ({ scene, durationInFrames, accent }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneMedia scene={scene} durationInFrames={durationInFrames} />
      {scene.subtitle ? (
        scene.subtitleStyle === "bar" ? (
          <Subtitle text={scene.subtitle} />
        ) : scene.subtitleStyle === "kinetic" ? (
          <KineticSubtitle text={scene.subtitle} accent={accent} />
        ) : (
          <CopySubtitle scene={scene} accent={accent} />
        )
      ) : null}
      {scene.sfx ? (
        <Audio src={staticFile(scene.sfx)} volume={scene.sfxVolume ?? 0.8} />
      ) : null}
    </AbsoluteFill>
  );
};

// ── 아웃트로 (그라디언트 + 글로우 + 제품 카드 + CTA) ────────
const Outro: React.FC<{ data: AdData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const minDim = Math.min(width, height);
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  const underlineW = interpolate(frame, [10, 24], [0, minDim * 0.24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subShift = interpolate(frame, [14, 28], [minDim * 0.02, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOp = interpolate(frame, [14, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brandColor = data.branding?.brandColor ?? "#0F172A";
  const accentColor = data.branding?.accentColor ?? "#38BDF8";
  // background 지정 시: 제품 히어로 이미지 풀블리드 + 타이포 오버레이 (카드 없음)
  const hasBg = Boolean(data.outro?.background);
  const headlineColor = data.outro?.headlineColor ?? "#FFFFFF";
  const bgZoom = interpolate(frame, [0, fps * 4], [1.04, 1], {
    extrapolateRight: "clamp",
  });

  // ── background 모드: CF 엔딩 (에디토리얼 좌측 비대칭 + 시간차 노출) ──
  // PPT식 중앙 제목+부제 금지. headline = 감성 카피(명조), sub = 작은 영문 브랜드 라인.
  if (hasBg) {
    const chars = Array.from(data.outro?.headline ?? "");
    const ruleW = interpolate(frame, [20, 36], [0, minDim * 0.14], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const subOp = interpolate(frame, [32, 46], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const subTracking = interpolate(frame, [32, 56], [0.55, 0.35], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const bgIsVideo = /\.(mp4|webm|mov)$/i.test(data.outro!.background!);
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill>
          {bgIsVideo ? (
            <OffthreadVideo
              src={staticFile(data.outro!.background!)}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Img
              src={staticFile(data.outro!.background!)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${bgZoom})`,
              }}
            />
          )}
        </AbsoluteFill>
        {/* 좌측 대각 스크림 — 타이포 존만 은은하게 정돈 */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(105deg, rgba(7, 36, 58, 0.5) 0%, rgba(7, 36, 58, 0.18) 32%, transparent 54%)",
          }}
        />
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
            paddingLeft: width * 0.08,
            paddingTop: height * 0.18,
          }}
        >
          <div
            style={{
              color: headlineColor,
              fontSize: minDim * 0.048,
              fontWeight: 400,
              fontFamily: FONT,
              letterSpacing: "0.14em",
              lineHeight: 1.5,
              textShadow: "0 2px 18px rgba(0, 0, 0, 0.3)",
            }}
          >
            {chars.map((ch, i) => (
              <span
                key={i}
                style={{
                  opacity: interpolate(frame, [6 + i * 2, 14 + i * 2], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div
            style={{
              height: Math.max(1, minDim * 0.0022),
              width: ruleW,
              backgroundColor: accentColor,
              marginTop: minDim * 0.028,
              marginBottom: minDim * 0.024,
            }}
          />
          {data.outro?.sub ? (
            <div
              style={{
                color: "#EAF6FF",
                fontSize: minDim * 0.023,
                fontWeight: 500,
                fontFamily: FONT,
                letterSpacing: `${subTracking}em`,
                opacity: subOp,
                textShadow: "0 1px 10px rgba(0, 0, 0, 0.25)",
              }}
            >
              {data.outro.sub}
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${brandColor} 0%, #04121F 100%)`,
        justifyContent: "center",
        alignItems: "center",
        gap: minDim * 0.028,
        opacity,
      }}
    >
      {/* 중앙 라디얼 글로우 — 단색 배경의 밋밋함을 줄인다 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${accentColor}40 0%, transparent 55%)`,
        }}
      />
      {data.outro?.image ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: minDim * 0.028,
            padding: minDim * 0.016,
            boxShadow: "0 24px 70px rgba(0, 0, 0, 0.45)",
            transform: `scale(${0.75 + 0.25 * pop})`,
          }}
        >
          <Img
            src={staticFile(data.outro.image)}
            style={{
              width: minDim * 0.3,
              height: minDim * 0.3,
              objectFit: "cover",
              borderRadius: minDim * 0.018,
              display: "block",
            }}
          />
        </div>
      ) : data.branding?.logo ? (
        <Img
          src={staticFile(data.branding.logo)}
          style={{
            width: minDim * 0.25,
            objectFit: "contain",
            transform: `scale(${0.75 + 0.25 * pop})`,
          }}
        />
      ) : null}
      {data.outro?.headline ? (
        <div
          style={{
            color: headlineColor,
            fontSize: minDim * 0.07,
            fontWeight: 800,
            fontFamily: FONT,
            textAlign: "center",
            maxWidth: "85%",
            letterSpacing: "0.02em",
            textShadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
            transform: `scale(${0.85 + 0.15 * pop})`,
          }}
        >
          {data.outro.headline}
        </div>
      ) : null}
      <div
        style={{
          height: Math.max(2, minDim * 0.005),
          width: underlineW,
          backgroundColor: accentColor,
          borderRadius: minDim * 0.003,
        }}
      />
      {data.outro?.sub ? (
        <div
          style={{
            color: accentColor,
            fontSize: minDim * 0.034,
            fontWeight: 600,
            fontFamily: FONT,
            textAlign: "center",
            maxWidth: "80%",
            letterSpacing: "0.06em",
            opacity: subOp,
            transform: `translateY(${subShift}px)`,
          }}
        >
          {data.outro.sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── BGM 트랙 (페이드인/아웃 — 컴포지션 프레임 기준이라 loop에도 안전) ──
const BgmTrack: React.FC<{ audio: NonNullable<AdData["audio"]> }> = ({
  audio,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const base = audio.bgmVolume ?? 0.5;
  const fadeIn = Math.max(1, Math.round((audio.bgmFadeInSeconds ?? 0.5) * fps));
  const fadeOut = Math.max(
    0,
    Math.round((audio.bgmFadeOutSeconds ?? 1.5) * fps)
  );
  const fadeOutStart = Math.max(fadeIn + 1, durationInFrames - fadeOut);
  const fadeEnd = Math.max(fadeOutStart + 1, durationInFrames);

  const volume = interpolate(
    frame,
    [0, fadeIn, fadeOutStart, fadeEnd],
    [0, base, base, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <Audio src={staticFile(audio.bgm!)} volume={volume} loop />;
};

// ── 메인 컴포지션 ────────────────────────────────────────────
export const AdVideo: React.FC<{ data: AdData }> = ({ data }) => {
  const { fps } = useVideoConfig();

  const narrationFrom = Math.max(
    0,
    Math.round((data.audio?.narrationStartSeconds ?? 0) * fps)
  );

  const accentColor = data.branding?.accentColor ?? "#38BDF8";

  let cursor = 0;
  const sceneSequences = data.scenes.map((scene) => {
    const dur = Math.max(1, Math.round(scene.durationInSeconds * fps));
    const seq = (
      <Sequence key={scene.id} from={cursor} durationInFrames={dur}>
        <SceneView scene={scene} durationInFrames={dur} accent={accentColor} />
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
      {data.audio?.bgm ? <BgmTrack audio={data.audio} /> : null}
      {data.audio?.narration ? (
        <Sequence layout="none" from={narrationFrom}>
          <Audio
            src={staticFile(data.audio.narration)}
            volume={data.audio.narrationVolume ?? 1}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
