---
name: remotion-kinetic-captions
description: Remotion 광고 영상에서 자막을 "영상 위에 얹힌 프레젠테이션 텍스트"가 아니라 장면에 통합된 키네틱 타이포그래피로 구현할 때 사용한다. 단어 단위 타임스탬프 동기화, spring 모션, 모션블러, 피사체 뒤 매트 합성(SAM3+MatAnyone), 블렌드 모드 광학 정합, AI 생성 영상(Higgsfield 등)의 카메라 무브와 텍스트 모션 매칭을 다룬다. 자막/캡션/subtitle/kinetic typography/텍스트 애니메이션/광고 영상 작업 시 반드시 로드할 것.
---

# Remotion Kinetic Captions — 광고 영상 자막 통합 가이드

> **이 문서의 목적**
> 자막이 "촌스러운" 이유는 폰트나 색상이 아니라 **자막이 영상과 다른 시간축·다른 광학계에 존재하기 때문**이다.
> 이 스킬은 그 간극을 5개 레이어로 나누어 좁힌다.

---

## 0. 사용 방법

| 용도 | 배치 위치 |
|---|---|
| Agent Skill로 사용 | `.claude/skills/remotion-kinetic-captions/SKILL.md` |
| 프로젝트 상시 규칙으로 사용 | `CLAUDE.md` 안에 `@.claude/rules/remotion-kinetic-captions.md` 로 참조 |

사전 설치 (프로젝트 루트에서 1회):

```bash
npx remotion skills add        # Remotion 공식 Agent Skills
npm i --save-exact @remotion/captions @remotion/motion-blur
# 주의: remotion 및 모든 @remotion/* 패키지 버전을 정확히 동일하게 맞출 것 (^ 제거)
```

---

## 1. 아키텍처 — 5 레이어 모델

작업은 **반드시 아래 순서대로** 진행한다. 하위 레이어를 건너뛰고 상위 레이어를 만들면 결과가 무너진다.

```
L1 시간 정합  →  단어 단위 타임스탬프          [필수·최우선]
L2 물리 모션  →  spring + stagger + 모션블러    [필수]
L3 광학 정합  →  블렌드 모드 + 그레인 + 팔레트   [권장]
L4 카메라 정합 →  씬 카메라 무브와 텍스트 동기화  [권장]
L5 공간 정합  →  피사체 뒤 매트 합성            [고비용·고효과]
```

**ROI 판단 기준**: L1~L3만 완료해도 "프레젠테이션 자막" 느낌은 대부분 사라진다.
L5는 별도 인프라(GPU 엔드포인트)가 준비된 경우에만 착수한다.

---

## 2. 절대 금지 규칙 (Hard Rules)

에이전트는 아래를 **어떤 경우에도 생성하지 않는다.**

| # | 금지 | 이유 | 대체 |
|---|---|---|---|
| R1 | 문장 전체가 통째로 fade-in | 시선 유도 실패, PPT 느낌의 주범 | 단어 단위 페이지 분할 |
| R2 | `interpolate`만으로 진입 애니메이션 | 등속 운동 = 기계적 인상 | `spring()` |
| R3 | 화면 하단 중앙 고정 + 검은 반투명 박스 | 영상과 완전 분리 | 씬별 앵커 + stroke/soft shadow |
| R4 | 순백색 `#FFFFFF` 자막 | 어떤 푸티지에도 존재하지 않는 색 | 프레임 팔레트에서 추출한 색 |
| R5 | 자막에 모션블러 미적용 | 순간이동처럼 보임 | `<CameraMotionBlur>` 또는 blur 보간 |
| R6 | 씬마다 다른 자막 스타일 | 통일감 붕괴 | `caption-theme.ts` 토큰 단일 소스 |
| R7 | 한 씬에 3종 이상의 텍스트 애니메이션 동시 사용 | 타이밍·레이아웃 붕괴 | 씬당 원칙 1개 |
| R8 | 텍스트를 하드코딩 | 재사용 불가 | `transcript.json` / `storyboard.json` 참조 |

---

## 3. 프로젝트 디렉토리 계약 (Contract)

에이전트는 이 구조를 유지하며, 데이터와 렌더 로직을 분리한다.

```
project/
├── data/
│   ├── transcript.json      # word-level timestamps (Whisper) — 단일 진실 공급원
│   └── storyboard.json      # 씬 정의: 카메라 무브 / 자막 이벤트 / 앵커
├── assets/
│   ├── footage/             # Higgsfield 등에서 생성한 원본 클립
│   └── matte/               # (L5) MatAnyone 알파 시퀀스
├── src/
│   ├── caption-theme.ts     # ★ 모든 스타일 토큰의 단일 소스
│   ├── Caption/
│   │   ├── CaptionPage.tsx  # 페이지 단위 렌더러
│   │   ├── Token.tsx        # 단어 1개 애니메이션
│   │   └── themes/          # kinetic / karaoke / minimal
│   └── Scene/
└── scripts/
    └── review-frames.sh     # ★ 자기검수 루프
```

### `storyboard.json` 스키마

```jsonc
{
  "fps": 30,
  "scenes": [
    {
      "id": 3,
      "startFrame": 90,
      "durationInFrames": 120,
      "footage": "assets/footage/scene03.mp4",
      "camera": "dolly_in",        // dolly_in | orbit | pan_left | crash_zoom | static
      "cameraIntensity": 0.18,     // 0.0 ~ 1.0
      "captionAnchor": "lower-left", // 씬마다 다르게 → 화면이 살아난다
      "captionTheme": "kinetic",
      "blendMode": "screen"
    }
  ]
}
```

---

## 4. L1 — 시간 정합 (단어 단위 타임스탬프)

### 파이프라인

```
음성 → Whisper(word-level) → Caption[] → createTikTokStyleCaptions() → TikTokPage[]
```

### 구현 규칙

```ts
// src/Caption/useCaptionPages.ts
import { useMemo } from "react";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";

// ===== CONFIG ===============================================
// 값이 크면 한 페이지에 여러 단어, 작으면 단어 하나씩 표시된다.
const SWITCH_MS = {
  ad:       550,   // 광고·제품 데모 (빠른 템포)
  lecture: 1200,   // 교육·설명형
  hook:     350,   // 훅 구간(0~3초) 단어 하나씩
} as const;
// ============================================================

export const useCaptionPages = (
  captions: Caption[],
  mode: keyof typeof SWITCH_MS = "ad",
) =>
  useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: SWITCH_MS[mode],
      }),
    [captions, mode],
  );
```

### ⚠️ 필수 주의사항

- **각 단어의 `text` 앞에 공백이 포함되어야 한다.** 공백을 빼면 전체가 한 줄·한 페이지로 뭉쳐 서식이 완전히 망가진다.
  ```ts
  // ❌ { text: "Remotion" }
  // ✅ { text: " Remotion" }
  ```
- 페이지 렌더는 반드시 `<Sequence>`로 감싸고, `startMs`/`durationMs`를 `fps`로 프레임 변환한다.
- `transcript.json`은 절대 손으로 수정하지 않는다. 재생성이 원칙.

### 페이지 → Sequence 매핑

```ts
const framesFromMs = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

{pages.map((page, i) => (
  <Sequence
    key={i}
    from={framesFromMs(page.startMs, fps)}
    durationInFrames={framesFromMs(page.durationMs, fps)}
    layout="none"
  >
    <CaptionPage page={page} />
  </Sequence>
))}
```

---

## 5. L2 — 물리 모션 (spring + stagger + 모션블러)

### 5.1 spring 프리셋

Remotion `spring()`은 감쇠 조화 진동자 모델이다.
`damping`(c)과 `stiffness`(k)의 비율이 탄력감을 결정한다.

```ts
// src/caption-theme.ts
export const MOTION = {
  // 광고 훅: 탄력 있게 튀어오름
  punch:  { damping: 11, stiffness: 200, mass: 0.5 },
  // 본문: 절제된 진입
  smooth: { damping: 22, stiffness: 140, mass: 0.8 },
  // 강조 단어: 오버슈트 허용
  pop:    { damping:  8, stiffness: 260, mass: 0.4 },
} as const;

export const STAGGER_FRAMES = 1.5;  // 단어 간 지연 → 파도 효과
```

### 5.2 단어 1개 애니메이션 (표준 패턴)

```tsx
// src/Caption/Token.tsx
import { spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION, STAGGER_FRAMES } from "../caption-theme";

export const Token: React.FC<{
  text: string;
  index: number;
  active: boolean;   // 현재 발화 중인 단어인가
  preset?: keyof typeof MOTION;
}> = ({ text, index, active, preset = "smooth" }) => {
  const frame = useCurrentFrame();          // ★ 모션블러 컴포넌트 "안쪽"에서 호출
  const { fps } = useVideoConfig();

  const t = spring({
    frame: frame - index * STAGGER_FRAMES,  // stagger: 체감 품질의 절반
    fps,
    config: MOTION[preset],
  });

  const scale = interpolate(t, [0, 1], [0.72, 1]);
  const y     = interpolate(t, [0, 1], [26, 0]);
  const blur  = interpolate(t, [0, 1], [8, 0]);   // 초점이 맞아 들어오는 느낌
  const opacity = interpolate(t, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${y}px) scale(${active ? scale * 1.08 : scale})`,
        filter: `blur(${blur}px)`,
        opacity,
        willChange: "transform, filter, opacity",
      }}
    >
      {text}
    </span>
  );
};
```

### 5.3 모션블러 — 생동감의 정체

```tsx
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill } from "remotion";

<CameraMotionBlur shutterAngle={180} samples={6}>
  <AbsoluteFill>          {/* ★ 자식은 반드시 absolute 포지셔닝 */}
    <CaptionPage page={page} />
  </AbsoluteFill>
</CameraMotionBlur>
```

**두 가지 치명적 함정:**

1. `<Trail>`과 `<CameraMotionBlur>`는 현재 시간을 담은 React 컨텍스트를 조작한다.
   → **`useCurrentFrame()`을 모션블러 컴포넌트 바깥에서 호출하면 효과가 적용되지 않는다.**
2. 이 기법은 **색상에 파괴적**이다.
   → `samples`는 가능한 낮게(4~8) 유지하고, 렌더 후 반드시 육안 검수한다.

`<Trail>`은 잔상(속도감)이 필요한 훅 구간에만 제한적으로 사용한다:
```tsx
<Trail layers={12} lagInFrames={0.25} trailOpacity={0.6}>...</Trail>
```

### 5.4 기존 라이브러리 활용 판단

바닥부터 만들기 전에 검토할 것:

| 옵션 | 성격 | 판단 기준 |
|---|---|---|
| `remotion-captions-themes` | OSS, 단어 단위 캡션 JSON → 테마(`kinetic-01` 등) 렌더 | 빠른 프로토타이핑 |
| Remotion Pro *Animated Captions* | 유료, spring으로 단어 사이 점프하는 배경 등 / 의존성 없음 | 상업 광고 납품 |
| 직접 구현 | 브랜드 고유 모션 언어 필요 시 | 장기 자산화 |

---

## 6. L3 — 광학 정합 (텍스트를 "빛"으로 취급)

### 6.1 블렌드 모드

가독성은 드롭섀도가, **이음매 없는 통합은 블렌드 모드**가 담당한다.

```ts
// 씬 특성별 권장 블렌드 모드
export const BLEND_BY_SCENE = {
  darkFootage:   "screen",      // 어두운 배경 위 발광 텍스트
  productCloseup:"soft-light",  // 얼굴·음식·의류·제품 → 색 정확도 보존
  brightSky:     "multiply",
  neutral:       "normal",      // 최종 CTA 등 가독성 최우선 구간
} as const;
```

```css
.caption { mix-blend-mode: screen; }
```

> **판단 규칙**: 제품·인물의 색이 브랜드에 중요하면 `soft-light`, 분위기 연출이 목적이면 `screen`.
> CTA(행동 유도) 문구는 예외 없이 `normal` + 최대 대비.

### 6.2 순백색 금지 — 팔레트 추출

```ts
// scripts/extract-palette.ts (렌더 전 1회 실행 → theme에 주입)
// 각 씬의 대표 프레임에서 지배색/보색을 추출해 자막 색을 결정한다.
// 결과: data/palette.json  { "scene03": { base: "#F2E6D0", accent: "#FF5A3C" } }
```

자막 색은 **씬 팔레트의 accent 또는 base를 밝기 보정한 값**을 사용한다.

### 6.3 통합 마감 체크리스트

- [ ] 자막 레이어에도 **영상과 동일한 필름 그레인** 오버레이 적용
- [ ] 배경 밝기에 따라 halo/stroke 강도를 조절하는 **적응형 대비**
- [ ] 검은 반투명 박스 제거 → `-webkit-text-stroke` + 소프트 섀도
- [ ] 고급 기법: **푸티지 자체를 텍스트의 루마 매트로 사용**
      (CSS `mask-image` 또는 canvas 합성 → 텍스트가 장면 명암을 따라 감)

```css
.caption-text {
  -webkit-text-stroke: 1.5px rgba(0,0,0,.35);
  text-shadow: 0 2px 18px rgba(0,0,0,.45);
  /* ❌ background: rgba(0,0,0,.6); ← 절대 금지 */
}
```

---

## 7. L4 — 카메라 정합 (AI 생성 영상 대응)

> 자막이 "얹혀 있다"는 결정적 신호는 **카메라는 움직이는데 자막은 화면에 못 박혀 있는 것**이다.

`storyboard.json`의 `camera` 필드를 읽어 자막 모션을 동반시킨다.

```ts
// src/Caption/cameraSync.ts
export const cameraSync = (
  camera: string,
  intensity: number,
  t: number,          // 0~1 진행도
) => {
  switch (camera) {
    case "dolly_in":
      return { scale: 1 + 0.06 * intensity * t, rotateY: 0, x: 0 };
    case "orbit":
      return { scale: 1, rotateY: 6 * intensity * t, x: 0 };   // deg
    case "pan_left":
      return { scale: 1, rotateY: 3 * intensity, x: -40 * intensity * t };
    case "crash_zoom":
      return { scale: 1 + 0.14 * intensity * t, rotateY: 0, x: 0 };
    default:
      return { scale: 1, rotateY: 0, x: 0 };
  }
};
```

적용 시 부모에 `perspective`를 반드시 지정한다:
```tsx
<AbsoluteFill style={{ perspective: 1200 }}>
  <div style={{ transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)` }}>
```

**타이밍 규칙**: `crash_zoom` 구간에서는 자막 진입 프레임을 카메라 임팩트 프레임에 **정확히 정렬**한다.

---

## 8. L5 — 공간 정합 (피사체 뒤 자막) *고비용*

텍스트가 인물 뒤에 배치되면 타이포그래피가 장면 위에 떠 있지 않고 **장면 안에 박혀 있는** 느낌이 된다.

### 검증된 툴체인

| 단계 | 도구 | 입력 → 출력 |
|---|---|---|
| 1 | **SAM3** | 프롬프트(`"person"`) + 원본 영상 → 정적 세그멘테이션 마스크(보통 1프레임) |
| 2 | **MatAnyone** | 원본 영상 + SAM3 마스크 → 전체 영상 추적 전경 매트(오클루전 가능케 함) |
| 3 | **Remotion** | 배경 영상 + 전경 알파 + 텍스트 → 3레이어 합성 |

### Remotion 합성 순서 (불변)

```tsx
<AbsoluteFill>
  <OffthreadVideo src={footage} />                    {/* 1. 배경 */}
  <AbsoluteFill><CaptionPage /></AbsoluteFill>        {/* 2. 자막 */}
  <AbsoluteFill>
    <OffthreadVideo src={foregroundAlpha} />          {/* 3. 전경 매트 */}
  </AbsoluteFill>
</AbsoluteFill>
```

### 착수 전 필수 확인

- SAM3/MatAnyone은 로컬 CPU로는 비현실적 → **Modal 등 GPU 엔드포인트에 배포하고 클라이언트만 작성**한다.
- 실제 사례 기준 **초기 구축 8~9시간**, 대부분 MatAnyone 안정화에 소요. 출력이 완전히 틀어지는 케이스도 발생.
- **AI 생성 영상 주의**(검증되지 않은 추론): Higgsfield 등 생성 영상은 프레임 간 일관성이 실사보다 낮아 매팅 품질이 흔들릴 수 있다.
  → 생성 단계에서 **피사체/배경 대비가 뚜렷한 구도**를 프롬프트로 유도해 성공률을 높인다.

---

## 9. 자기검수 루프 (에이전트 필수 절차)

에이전트는 자막을 수정할 때마다 **전체 렌더 대신 핵심 프레임만 스틸로 뽑아 스스로 검토**한다.

```bash
#!/usr/bin/env bash
# scripts/review-frames.sh — 자막 진입/피크/이탈 프레임만 검수
set -euo pipefail

COMP="${1:-Ad}"
FRAMES="${2:-90,96,104,120}"     # 쉼표 구분
OUT="out/review"

mkdir -p "$OUT"
IFS=',' read -ra ARR <<< "$FRAMES"
for f in "${ARR[@]}"; do
  echo "[review] rendering frame $f ..."
  npx remotion still src/index.ts "$COMP" "$OUT/f${f}.png" --frame="$f" \
    || { echo "[error] frame $f 렌더 실패"; exit 1; }
done
echo "[done] $OUT 확인"
```

### 검수 시 확인 항목 (에이전트가 이미지를 직접 볼 것)

1. 자막이 피사체의 얼굴/제품 로고를 가리는가?
2. 배경이 밝은 구간에서 가독성이 무너지는가?
3. 진입 프레임에서 모션블러가 실제로 보이는가?
4. 색이 순백색으로 회귀했는가?
5. 씬 간 폰트 크기·자간이 드리프트했는가?

> **원칙**: 문제가 발견되면 사용자에게 묻기 전에 **최대 2회까지 자체 수정 후 재검수**한다.

---

## 10. 작업 착수 순서 (에이전트 기본 플랜)

| 순서 | 작업 | 산출물 |
|---|---|---|
| 1 | `transcript.json` 생성/검증 (word-level) | `data/transcript.json` |
| 2 | `storyboard.json` 씬 정의 확정 | `data/storyboard.json` |
| 3 | `caption-theme.ts` 토큰 정의 | 스타일 단일 소스 |
| 4 | L1 페이지 분할 + Sequence 매핑 | 타이밍 확인 |
| 5 | L2 spring + stagger + 모션블러 | `review-frames.sh` 검수 |
| 6 | L3 블렌드/팔레트/그레인 | `review-frames.sh` 검수 |
| 7 | L4 카메라 동기화 | `review-frames.sh` 검수 |
| 8 | (선택) L5 매트 합성 | 별도 브랜치 |

**병렬화**: 씬이 5개 이상이면 씬 단위로 에이전트 인스턴스를 분리하되,
`caption-theme.ts`는 **단 하나의 에이전트만 수정**한다 (스타일 드리프트 방지).

---

## 11. 흔한 실패 → 진단표

| 증상 | 원인 | 조치 |
|---|---|---|
| 모션블러가 안 보임 | `useCurrentFrame()`을 블러 컴포넌트 바깥에서 호출 | 훅 호출 위치를 자식 컴포넌트 내부로 이동 |
| 자막이 한 줄로 다 뭉침 | 단어 `text` 앞 공백 누락 | 트랜스크립트 파서 수정 |
| 색이 탁하고 뭉개짐 | `samples` 과다 | `samples` 4~8로 감소 |
| 레이아웃이 밀림 | 모션블러 자식이 absolute가 아님 | `<AbsoluteFill>`로 감싸기 |
| 씬마다 폰트 크기 다름 | 에이전트가 인라인 스타일 하드코딩 | `caption-theme.ts` 토큰 강제 |
| 자막이 화면 밖으로 나감 | 페이지당 단어 수 과다 | `SWITCH_MS` 하향 + `maxWidth` 지정 |
| 전체적으로 어수선함 | 한 씬에 애니메이션 3종 이상 | **씬당 원칙 1개**로 축소 (R7) |

> **최종 경고**: 움직이는 요소와 겹치는 애니메이션, 화려한 전환을 여러 개 섞으면
> 위치가 틀어지고 타이밍이 이상해지면서 디자인 전체가 무너진다.
> **단순하게 유지하고, 한 번에 하나씩 더한다.**

---

## 12. 참고

- Remotion Agent Skills — https://www.remotion.dev/docs/ai/skills
- `@remotion/captions` — https://www.remotion.dev/docs/captions/api
- `createTikTokStyleCaptions()` — https://www.remotion.dev/docs/captions/create-tiktok-style-captions
- `@remotion/motion-blur` — https://www.remotion.dev/docs/motion-blur/
- 모션블러 흔한 실수 — https://www.remotion.dev/docs/motion-blur/common-mistake
- SAM3 — https://github.com/facebookresearch/sam3
- MatAnyone — https://pq-yang.github.io/projects/MatAnyone/
- 텍스트-비하인드 워크플로우 사례 — https://adithyan.io/blog/codex-text-effects-toolchain
- `remotion-captions-themes` — https://github.com/vshukla7/remotion-captions-themes
