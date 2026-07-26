# 4단계 — 힉스필드 에셋 생성 (무중단 구간)

이 단계부터 유저에게 질문하지 않는다. 모든 판단은 brief.md / benchmark.md /
storyboard.md 에 근거해 스스로 내리고, 판단 내역을 report.md에 기록한다.

## 도구 준비

힉스필드 도구는 지연 로딩(deferred)이므로 ToolSearch **1회 호출**로 일괄 로드한다:

```
ToolSearch "select:mcp__claude_ai__balance,mcp__claude_ai__models_explore,mcp__claude_ai__generate_image,mcp__claude_ai__generate_video,mcp__claude_ai__generate_audio,mcp__claude_ai__job_status,mcp__claude_ai__show_generations,mcp__claude_ai__get_workflow_instructions,mcp__claude_ai__media_upload"
```

(`media_upload` 은 유저 제공 제품 이미지가 있을 때만 필요하다.)

## 생성 순서

1. **`balance`** — 잔여 크레딧 확인. 잔액 또는 상한 중 작은 값이 실예산.
   실예산 < 스토리보드 예상치면 씬 수·재생성 횟수를 즉시 축소 조정(질문 금지, 기록).
2. **`get_workflow_instructions`** — 카탈로그를 조회해 광고(ad/commercial) 워크플로우가
   있으면 해당 지침을 로드해 참고한다. 단, 최종 합성은 Remotion에서 하므로
   힉스필드 워크플로우는 **에셋 생성 전략 참고용**으로만 쓴다.
3. **`models_explore(action:'recommend')`** — 컨셉·입력 조건(텍스트만/참조 이미지)을
   query에 담아 모델을 추천받는다. 씬 특성별로 다른 모델을 써도 된다.
4. **키 비주얼 확보** — 두 경로 중 하나:
   - **유저 제공 제품 이미지가 있는 경우 (우선)**: `media_upload` 로
     `assets/input/` 의 이미지를 힉스필드에 업로드하고, 반환된 미디어 참조를
     이후 생성의 입력으로 사용한다. 실물 제품의 외형·라벨·색상이 보존되어야
     광고로서 성립하므로, 이 경우 제품을 텍스트 프롬프트로 다시 그리게 하지 않는다.
     모델 선정 시에도 `models_explore(input:'image')` 로 참조 이미지를 받는
     모델만 후보로 한다. 필요시 `generate_image` 로 제품 이미지를 다른 배경·연출과
     합성한 파생 키 비주얼을 만든다 (원본 참조 유지).
   - **제공 이미지가 없는 경우**: `generate_image` 로 제품/인물 기준 이미지를 1~2장 만든다.
     이유: 씬별 비디오를 전부 텍스트로 생성하면 씬마다 인물·제품 외형이 달라진다.
     키 비주얼을 image-to-video 입력으로 재사용해 일관성을 확보한다.
5. **씬별 비디오 생성** (`generate_video`) — 스토리보드 순서대로. 비율은 brief의 비율과 일치시킨다.
6. **오디오 생성** (`generate_audio`) — BGM 1트랙(전체 길이 이상), 필요시 내레이션(타깃 언어).
7. **다운로드** — 아래 참조.

## 프롬프트 작성 원칙

- **문화 적합성**: brief의 타깃 인종·문화권을 인물 외형, 복장, 배경(도시·간판 언어),
  소품, 음식 등에 명시적으로 반영한다.
  예: 북미 타깃 → "diverse American cast, suburban U.S. setting";
  일본 타깃 → "Japanese office workers, Tokyo street backdrop".
- **벤치마킹 반영**: benchmark.md에서 선택된 룩(컬러·조명·템포)을 모든 씬 프롬프트에
  공통 스타일 문구로 넣는다. 씬마다 스타일 문구가 다르면 톤이 깨진다.
- **비율 명시**: 세로(9:16) 영상은 프롬프트에도 세로 구도임을 반영한다
  (인물 상반신 중심, 상하 여백 활용).
- **씬당 길이**: 생성 모델의 클립 길이 제한을 확인하고(모델 정보 참조),
  스토리보드 씬 길이에 가장 가까운 옵션으로 생성한다. 클립이 씬보다 길면
  Remotion에서 앞부분만 사용되므로 문제없다.

## 작업 관리

- 생성은 비동기 작업이다. `job_status` 로 완료를 확인하고, 완료된 생성물의
  **다운로드 URL을 확보**한다 (`show_generations` / job 결과에서 추출).
- 재생성 규칙: 씬당 최대 2회. 판단 기준은 스토리보드와의 부합 여부
  (인물 일관성 붕괴, 심한 아티팩트, 비율 오류). 2회 실패 시 키 비주얼 이미지를
  scenes.json `type: "image"` 씬(켄번즈 효과)으로 대체한다.
- 크레딧 예비비 10%를 남기고 운영한다. 소진 임박 시 남은 씬은 이미지/색상 씬으로 대체.

## 에셋 다운로드

매니페스트 JSON을 만들어 스크립트로 일괄 다운로드한다:

```json
// manifest.json — [{ "url": "<생성물 URL>", "path": "ad-videos/<slug>/assets/scene-1.mp4" }, ...]
```

```powershell
powershell -File .claude/skills/ad-video-maker/scripts/download-assets.ps1 -ManifestPath <manifest.json 경로>
```

스크립트는 3회 재시도·로그 출력·실패 목록 반환을 포함한다. 최종 실패 에셋은
재생성 1회 → 그래도 실패하면 해당 씬 대체 처리.

## 산출물

- `ad-videos/<slug>/assets/` — scene-1.mp4, scene-2.mp4, …, key-visual.png, bgm.mp3, narration.mp3
- `ad-videos/<slug>/assets/input/` — 유저 제공 원본 (제품 이미지·로고). 제품 이미지는
  Remotion에서 `type: "image"` 씬(켄번즈)으로 직접 쓸 수도 있고, 로고는 scenes.json의
  `branding.logo` 로 아웃트로에 넣는다.
- 파일명 규칙: `scene-<번호>.<확장자>`, `key-visual-<번호>.png`, `bgm.mp3`, `narration.mp3`
- 각 생성 호출의 모델·크레딧 소모를 기록해 두었다가 report.md 정산에 사용한다.
