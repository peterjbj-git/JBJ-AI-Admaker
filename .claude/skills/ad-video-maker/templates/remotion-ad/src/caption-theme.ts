// caption-theme.ts — 모든 텍스트 스타일·모션 토큰의 단일 소스 (kinetic-captions R6)
// 씬별로 스타일이 어긋나는 것을 구조적으로 차단한다. AdVideo.tsx는 이 파일만 참조할 것.
import { loadFont as loadSansKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadSerifKR } from "@remotion/google-fonts/NotoSerifKR";
import { loadFont as loadGowunBatang } from "@remotion/google-fonts/GowunBatang";
import { loadFont as loadSongMyung } from "@remotion/google-fonts/SongMyung";
import { loadFont as loadBlackHanSans } from "@remotion/google-fonts/BlackHanSans";
import { loadFont as loadNanumPen } from "@remotion/google-fonts/NanumPenScript";

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
const { fontFamily: NANUM_PEN } = loadNanumPen("normal", {
  weights: ["400"],
  subsets: ["korean"],
});

export const FONT = `${SANS_KR}, Pretendard, "Malgun Gothic", "Segoe UI", Roboto, sans-serif`;
export const FONT_SERIF = `${SERIF_KR}, "Nanum Myeongjo", "Batang", serif`;

export type CopyFontKey =
  | "sans"
  | "serif"
  | "batang"
  | "myung"
  | "impact"
  | "hand";

// 카피용 서체 팔레트 — 컷 성격에 맞춰 선택. size는 minDim 배수.
export const COPY_FONTS: Record<
  CopyFontKey,
  {
    family: string;
    baseWeight: number;
    accentWeight: number;
    tracking: string;
    size: number;
  }
> = {
  sans: { family: FONT, baseWeight: 500, accentWeight: 700, tracking: "0.03em", size: 0.052 },
  serif: { family: FONT_SERIF, baseWeight: 500, accentWeight: 600, tracking: "0.06em", size: 0.058 },
  batang: {
    family: `${GOWUN_BATANG}, ${SERIF_KR}, serif`,
    baseWeight: 400,
    accentWeight: 700,
    tracking: "0.1em",
    size: 0.06,
  },
  myung: {
    family: `${SONG_MYUNG}, ${SERIF_KR}, serif`,
    baseWeight: 400,
    accentWeight: 400,
    tracking: "0.12em",
    size: 0.06,
  },
  impact: {
    family: `${BLACK_HAN}, ${SANS_KR}, sans-serif`,
    baseWeight: 400,
    accentWeight: 400,
    tracking: "0.02em",
    size: 0.072,
  },
  // 필기체 — 청춘·다이어리·스크랩북 무드 (포카리 2026 캠페인형). 살짝 기울여 렌더됨.
  hand: {
    family: `${NANUM_PEN}, ${SANS_KR}, cursive`,
    baseWeight: 400,
    accentWeight: 400,
    tracking: "0.015em",
    size: 0.075,
  },
};

// 컬러 토큰 — 순백 #FFFFFF 금지 (kinetic-captions R4: 푸티지에 존재하지 않는 색).
// copyColor 미지정 시 폴백은 쿨톤 페이퍼 화이트. 실제 프로젝트에서는 씬 팔레트에서 추출해 지정할 것.
export const COLORS = {
  paper: "#F2F9FF",
  outroSub: "#EAF6FF",
};

// 모션 토큰 — 진입은 항상 스프링 (kinetic-captions R2: 등속 interpolate 진입 금지)
export const MOTION = {
  // 무바운스 감쇠 스프링 (카피·아웃트로 공용). 바운스가 필요한 곳은 kinetic 스타일만.
  enterSpring: { damping: 200 },
  enterDelayFrames: 4,
  // 진입 순간 블러 → 0 (kinetic-captions R5: 모션블러 미적용 금지)
  enterBlurPx: 6,
  letterStaggerFrames: 2,
};

// 카메라 정합 (kinetic-captions L4) — 텍스트 진입 벡터를 씬 카메라 무브와 일치시킨다.
// 값은 진입 스프링 progress(0→1)에 곱해지는 최대 오프셋 (minDim 배수 / scale 델타).
export type CameraMove = "static" | "dolly_in" | "dolly_out" | "pan_left" | "pan_right";
export const CAMERA_TEXT: Record<
  CameraMove,
  { scaleFrom: number; xFrom: number }
> = {
  static: { scaleFrom: 1.0, xFrom: 0 },
  dolly_in: { scaleFrom: 0.97, xFrom: 0 },
  dolly_out: { scaleFrom: 1.03, xFrom: 0 },
  pan_left: { scaleFrom: 1.0, xFrom: 0.025 },
  pan_right: { scaleFrom: 1.0, xFrom: -0.025 },
};
