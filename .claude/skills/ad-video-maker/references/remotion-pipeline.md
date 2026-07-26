# 5단계 — Remotion 합성·렌더링 (무중단 구간)

> **자막이 있는 광고를 만들 때는 `remotion-kinetic-captions` 스킬을 먼저 로드한다**
> (`.claude/skills/remotion-kinetic-captions/SKILL.md`). 씬 통합 타이포의 절대 금지 규칙
> (문장 통째 페이드인·순백색 자막·하단 고정 박스·모션블러 미적용 등)과 5레이어 정합
> 방법론이 정의되어 있다. 템플릿에 @remotion/captions·@remotion/motion-blur 설치됨.

`templates/remotion-ad/` 는 **사전 구성된 데이터 주도(data-driven) 렌더링 엔진**이다.
React 코드를 수정하지 말 것 — `src/scenes.json` 작성과 에셋 배치만으로 영상이 조립된다.
이유: 실행 시마다 코드를 새로 짜면 렌더링 실패 확률이 크게 오르고 재현성이 사라진다.

## 렌더링 절차

1. **에셋 배치**: 템플릿의 `public/assets/` 를 비우고, `ad-videos/<slug>/assets/` 내용을 복사한다.

```powershell
$tpl = ".claude/skills/ad-video-maker/templates/remotion-ad"
Remove-Item "$tpl/public/assets/*" -Recurse -Force -Exclude ".gitkeep" -ErrorAction SilentlyContinue
Copy-Item "ad-videos/<slug>/assets/*" "$tpl/public/assets/" -Recurse
```

2. **scenes.json 작성**: `$tpl/src/scenes.json` 을 아래 스키마로 작성한다.
3. **렌더링**: 반드시 템플릿 디렉토리에서 실행한다 (브라우저 캐시가 템플릿에 있음).

```powershell
Set-Location $tpl
npx remotion render src/index.ts <CompositionID> "<저장소루트>/ad-videos/<slug>/final/<slug>_<비율>.mp4" --codec h264
```

- Composition ID: `Ad-16x9` (1920×1080) / `Ad-9x16` (1080×1920) / `Ad-1x1` (1080×1080)
  (주의: 언더스코어 불가 — Remotion은 Composition ID에 a-z, 0-9, 하이픈만 허용)
- 첫 렌더링 시 Chrome Headless Shell(113MB)을 자동 다운로드할 수 있다(1회성, 정상).

4. **사본 보관**: 사용한 scenes.json을 `ad-videos/<slug>/scenes.json` 으로 복사한다.
5. **검증**: 출력 mp4의 존재·파일 크기(>100KB)·재생 길이를 확인한다.
   길이 확인: 렌더 로그의 총 프레임/fps 또는 `ffprobe` (있는 경우).

## scenes.json 스키마

```jsonc
{
  "meta": { "title": "프로젝트명", "fps": 30 },
  "audio": {
    "bgm": "assets/bgm.mp3",        // public/ 기준 상대경로. 없으면 생략
    "bgmVolume": 0.35,               // 내레이션 있으면 0.2~0.35, 없으면 0.5~0.7
    "bgmFadeInSeconds": 0.5,         // 생략 시 0.5
    "bgmFadeOutSeconds": 1.5,        // 생략 시 1.5 — 끝이 뚝 끊기지 않게 항상 확보됨
    "narration": "assets/narration.mp3",  // 없으면 생략
    "narrationVolume": 1.0,          // 생략 시 1.0
    "narrationStartSeconds": 0       // 비주얼 훅 먼저면 1~2초로. 생략 시 0
  },
  "branding": {
    "logo": "assets/logo.png",       // 아웃트로에 표시. 없으면 생략
    "brandColor": "#0F172A",         // 아웃트로 배경
    "accentColor": "#38BDF8"         // 자막 강조·CTA 색
  },
  "scenes": [
    {
      "id": "scene-1",
      "type": "video",               // "video" | "image" | "color"
      "src": "assets/scene-1.mp4",   // video/image일 때. color면 생략
      "color": "#1E3A5F",            // type: "color"일 때 배경색
      "durationInSeconds": 5,
      "subtitle": "속부터 차오르는 *수분*.",  // 없으면 생략. *단어* 강조, 끝 마침표는 액센트 컬러
      "subtitleStyle": "copy",         // "copy"(기본, 광고 카피 타이포) | "kinetic"(단어별 팝인) | "bar"(하단 바)
      "camera": "dolly_in",            // 이 컷의 카메라 무브 (생성 프롬프트와 동일하게) — 자막 진입
                                       //   벡터가 카메라와 정합됨. static|dolly_in|dolly_out|pan_left|pan_right
      "lead": "리드 문구",              // copy 전용: 메인 위 작은 라인 (계층). 없으면 생략
      "position": "left",              // copy 전용: "bottom"(기본)|"center"|"left"|"right"|"top" — 네거티브 스페이스에 배치
      "font": "batang",                // copy 전용 서체 팔레트: "sans"(기본 고딕) | "serif"(노토 명조)
                                       //   | "batang"(고운바탕 — 부드러운 감성 훅) | "myung"(송명 — 클래식 디스플레이, K-뷰티 세로쓰기 단골)
                                       //   | "impact"(블랙한산스 — 강한 헤드라인·프로모션)
      "orientation": "vertical",       // copy 전용: "horizontal"(기본) | "vertical"(세로쓰기 — position left/right와 조합, 잡지 룩)
      "reveal": "letters",             // copy 전용: "fade"(기본) | "letters"(글자 단위 리빌 — 감성 훅 카피에)
      "copyColor": "#0D4F79",          // copy 전용: 본문 컬러. ★순백 #FFFFFF 금지 — 푸티지 팔레트에서
                                       //   추출한 색을 지정 (밝은 배경=브랜드 네이비, 어두운 배경=쿨톤 페이퍼).
                                       //   미지정 시 caption-theme의 페이퍼 화이트(#F2F9FF) 폴백
      "copyAccent": "#1F8FE5",         // copy 전용: 강조·마침표 컬러. 생략 시 branding.accentColor
      "scrim": true                    // copy 전용: 텍스트 존 소프트 그라데이션 명암 (기본 true — 가독성 확보)
      "sfx": "assets/sfx-1.mp3",       // 씬 시작에 맞춰 재생되는 효과음. 없으면 생략
      "sfxVolume": 0.8,                // 생략 시 0.8
      "muted": false,                  // true면 클립 원음(대사·환경음) 제거. 생략 시 false
      "videoVolume": 1.0               // 클립 원음 볼륨 (대사 씬은 1.0 유지). 생략 시 1.0
    }
  ],
  "outro": {
    "enabled": true,
    "durationInSeconds": 3,
    "headline": "CTA 헤드라인",
    "sub": "부가 문구 (URL, 해시태그 등)",
    "background": "assets/outro-bg.mp4",  // ★권장: 제품 히어로 '영상' 풀블리드 (.mp4/.webm/.mov 지원).
                                          //   정지 이미지는 정적으로 보이므로, 히어로 이미지를 만들었으면
                                          //   그 이미지를 start_image로 image-to-video 한 번 더 돌려
                                          //   미세하게 움직이는 배경 클립(4초, generate_audio:false)을 쓴다
    "headlineColor": "#FFFFFF",           // background 위 헤드라인 컬러 (배경 밝기에 맞춰)
    "image": "assets/outro-product.jpg"   // background 미지정 시 폴백: 그라디언트 + 제품 카드
  }
  // 아웃트로 2가지 모드:
  // ① background 지정(권장) — **CF 엔딩**: 히어로 이미지 풀블리드 + 좌측 비대칭 에디토리얼 타이포.
  //    headline = 감성 카피 한 줄(모던 고딕 Regular + 와이드 자간 — 궁서체류 캘리그래피 서체 금지,
  //    글자 시간차 리빌), sub = 작은 영문 브랜드 라인
  //    (와이드 트래킹, 지연 등장 + 트래킹 조임 애니메이션), 사이에 가는 액센트 라인.
  //    좌측 대각 스크림 자동 적용. 슬로우 줌.
  //    ★ 카피 원칙: PPT식 "제품명 큰 제목 + 기능 부제" 금지. 제품이 화면에 있으면 한글 제품명을
  //      반복하지 않는다 — headline은 감각·효익 카피("수분이 머무는 시간"), sub는 영문 브랜드만.
  //      headline은 배경의 깨끗한 여백(피사체 없는 존)에 앉힌다.
  // ② background 미지정 — 그라디언트 + 라디얼 글로우 + 제품 이미지 카드 (폴백).
}
```

### 구성 규칙

- **총 길이 = 씬 길이 합 + 아웃트로** 가 brief의 목표 길이와 일치하도록 씬 길이를 배분한다.
- **scenes 배열의 항목 = 컷**이다. 스토리보드의 컷 단위를 그대로 옮긴다
  (15초 기준 4~6컷 — 4초 이상 끌리는 단일 컷은 지루함의 주범이지만,
  자막이 있는 컷을 너무 짧게 자르면 싱크가 깨진다. 아래 최소 길이 공식 준수).
- **자막 컷 최소 길이 공식** (자막이 다 읽히기 전 컷 전환 금지):
  `durationInSeconds ≥ 리빌 시간 + 읽기 시간 + 0.4초(여유)`
  - 읽기 시간(한국어): 공백 제외 글자 수 ÷ 5 (최소 1초)
  - 리빌 시간: `fade` ≈ 0.6초 / `letters` ≈ 0.4초 + 글자당 0.07초 / kinetic ≈ 0.5초 + 단어당 0.13초
  - 예: "메마른 하루의 끝"(7자, letters) → 0.9 + 1.4 + 0.4 ≈ **2.7초 → 3초 컷**
  - lead가 있으면 lead 글자 수의 절반을 읽기 시간에 가산한다.
- **최소 길이 공식은 자막 컷에만 적용된다.** 자막 없는 컷은 자유롭게 짧게 친다
  (0.8~2초 — 0.8초 미만은 씬 페이드인 0.4초에 잠식되므로 지양). 빠른 편집 리듬은
  무자막 비주얼 컷으로 만들고, 자막 컷은 충분히 머문다 (자막 : 무자막 ≈ 3:1~2:1 혼합).
- 같은 메시지를 더 오래 보여주려면 컷을 쪼개 자막을 반복하지 말고(리빌이 다시 시작되어 어색함),
  **한 씬으로 합쳐 durationInSeconds를 늘린다** (클립 길이 한도 내). 연속 컷이 같은 메시지면
  첫 컷에만 자막을 넣고 두 번째 컷은 무자막으로 둔다.
- 씬 `durationInSeconds` ≤ 실제 클립 길이여야 한다 (짧으면 앞부분만 사용되므로 안전,
  길면 마지막 프레임에서 멈춘 화면이 노출된다). **모델 최소 길이보다 짧은 컷은
  긴 클립을 생성해 앞부분만 쓰는 방식으로 만든다** (예: 4초 클립 → durationInSeconds 2).
- **자막은 "copy"(광고 카피 타이포)가 기본**이다. 벤치마킹에서 확인된 광고 문법 5원칙:
  ① 하단 고정이 아니라 컷의 네거티브 스페이스에 배치 (`position` — 컷마다 다르게),
  ② 흰색+그림자 박스 대신 배경 밝기에 맞춘 솔리드 브랜드 컬러 (`copyColor`),
  ③ 리드(작게)+메인(크게) 계층 (`lead`), ④ 카피 끝 마침표는 액센트 컬러 (문장에 "." 포함),
  ⑤ 바운스 없는 조용한 페이드+슬라이드. 핵심 단어 1개에만 `*강조*` 마크업 (여러 단어 강조 가능, 별표는 렌더링 안 됨).
  "kinetic"(단어별 팝인)은 쇼츠/릴스 캡션 무드에만, "bar"는 UGC·인터뷰 씬에만 쓴다.
- **수평 일변도 금지**: 15초 광고 기준 세로쓰기(`orientation: "vertical"`) 컷 1개,
  서체 2~3종 혼용(감성=batang/myung, 기능=sans, 프로모션=impact)으로 타이포에 리듬을 만든다.
  단, 같은 서체 계열은 같은 메시지 층위에만 쓴다 (컷마다 무작위 교체 금지).
- 프로젝트별 전용 폰트가 필요하면 `@remotion/google-fonts/<FontName>` import를 추가한다
  (한국어 지원 서체는 subsets: ["korean"] — 상세는 `.agents/skills/remotion-best-practices` 참조).
- **스틸컷 금지**: 텍스트(자막·타이포)가 올라가는 화면은 **항상 영상**이어야 한다 —
  정지 이미지 위 텍스트는 발표자료 느낌의 주범. 히어로 이미지를 만들었으면 반드시
  image-to-video(start_image, 4초, generate_audio:false)로 라이브화해서 쓴다.
- `type: "image"` 씬(켄번즈)은 **생성 실패 시 최후 폴백 전용**이며, 그 경우에도 자막을 얹지 않는다.
- 텍스트 스타일·모션의 단일 소스는 `src/caption-theme.ts` 다 (kinetic-captions R6) —
  서체·크기·자간·컬러·스프링·모션블러 토큰을 여기서만 수정하고, 컴포넌트에 하드코딩하지 않는다.
- `type: "color"` 씬은 단색 배경 + 자막 — 텍스트 강조 씬이나 최후의 대체재.
- 자막 언어는 brief의 언어 항목을 따른다. 자막은 씬당 1~2문장, 12단어 이내로 짧게.
- 오디오 볼륨·페이드·SFX 배치 기준값은 `references/audio-guide.md` 5절의 믹싱 표를 따른다.
  렌더 후 음성(내레이션·대사)이 BGM에 묻히면 bgmVolume을 0.1 내리고 재렌더한다.
- 대사 씬은 클립 원음이 그대로 재생된다. 대사 없는 씬은 `muted: true` 로 환경음을 제거해
  씬 간 오디오 단차를 줄인다.

## 트러블슈팅

| 증상 | 원인·대응 |
|------|-----------|
| `Composition not found` | Composition ID 오타. Ad-16x9 / Ad-9x16 / Ad-1x1 중 하나인지 확인 |
| `staticFile ... not found` | public/assets/ 에 파일 미복사 또는 scenes.json 경로 오타 |
| scenes.json 파싱 에러 | 주석(//) 제거 여부 확인 — 실제 파일은 순수 JSON이어야 함 |
| 특정 씬에서 렌더 중단 | 해당 mp4 손상 가능성 → 재다운로드 → 그래도 실패 시 image/color 씬으로 대체 후 재렌더 |
| 렌더가 매우 느림 | 정상(고해상도 h264). 60초 영상 기준 수 분 소요. timeout을 600000ms로 설정 |

## 마무리

렌더 완료 후 report.md를 작성하고 유저에게 최종 보고한다
(SKILL.md의 "최종 보고 형식" 준수). 선택 제안 두 가지를 보고에 포함할 수 있다:
`upscale_video`(2K/4K 업스케일), `virality_predictor`(성과 예측 분석) — 단, 제안만 하고 실행은 유저 요청 시.
