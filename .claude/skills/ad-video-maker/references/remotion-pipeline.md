# 5단계 — Remotion 합성·렌더링 (무중단 구간)

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
      "lead": "리드 문구",              // copy 전용: 메인 위 작은 라인 (계층). 없으면 생략
      "position": "left",              // copy 전용: "bottom"(기본)|"center"|"left"|"right"|"top" — 네거티브 스페이스에 배치
      "copyColor": "#0D4F79",          // copy 전용: 본문 컬러. 밝은 배경=브랜드 네이비, 어두운 배경=흰색(기본)
      "copyAccent": "#1F8FE5",         // copy 전용: 강조·마침표 컬러. 생략 시 branding.accentColor
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
    "image": "assets/outro-product.jpg"  // 제품 이미지 카드 (권장). 없으면 branding.logo 폴백
  }
  // 아웃트로는 그라디언트 배경 + 라디얼 글로우 + 애니메이션 언더라인이 자동 적용된다.
  // image에는 유저 제공 제품컷(assets/input/)을 복사해 쓰는 것이 기본 — 흰 배경 정면컷이 카드에 가장 잘 맞는다.
}
```

### 구성 규칙

- **총 길이 = 씬 길이 합 + 아웃트로** 가 brief의 목표 길이와 일치하도록 씬 길이를 배분한다.
- **scenes 배열의 항목 = 컷**이다. 스토리보드의 컷 단위를 그대로 옮긴다
  (15초 기준 6~8컷, 컷당 1.5~2.5초 — 4초 이상 끌리는 단일 컷은 지루함의 주범).
  같은 씬(메시지)의 컷들은 자막을 공유하거나 이어지는 문구로 나눈다.
- 씬 `durationInSeconds` ≤ 실제 클립 길이여야 한다 (짧으면 앞부분만 사용되므로 안전,
  길면 마지막 프레임에서 멈춘 화면이 노출된다). **모델 최소 길이보다 짧은 컷은
  긴 클립을 생성해 앞부분만 쓰는 방식으로 만든다** (예: 4초 클립 → durationInSeconds 2).
- **자막은 "copy"(광고 카피 타이포)가 기본**이다. 벤치마킹에서 확인된 광고 문법 5원칙:
  ① 하단 고정이 아니라 컷의 네거티브 스페이스에 배치 (`position` — 컷마다 다르게),
  ② 흰색+그림자 박스 대신 배경 밝기에 맞춘 솔리드 브랜드 컬러 (`copyColor`),
  ③ 리드(작게)+메인(크게) 계층 (`lead`), ④ 카피 끝 마침표는 액센트 컬러 (문장에 "." 포함),
  ⑤ 바운스 없는 조용한 페이드+슬라이드. 핵심 단어 1개에만 `*강조*` 마크업.
  "kinetic"(단어별 팝인)은 쇼츠/릴스 캡션 무드에만, "bar"는 UGC·인터뷰 씬에만 쓴다.
- `type: "image"` 씬은 자동으로 켄번즈(느린 확대) 효과가 적용된다 — 생성 실패 씬의 대체재.
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
