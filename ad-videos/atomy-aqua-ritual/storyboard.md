# 스토리보드 — 애터미 아쿠아 크림 "리추얼" 20초 (16:9) [확정본]

- 방향: A안 클린 럭셔리 리추얼 (벤치마킹: 설화수 로제형 — 밝은 미니멀 + 오브제 매크로 + 소프트 라이트)
- 총 길이: 20초 = 컷 5개(17초) + 아웃트로 3초
- 자막: **없음** (컷 자막 0 — 무자막 구성이라 컷 길이 자유) · 텍스트는 아웃트로 브랜드 타이포만
- 오디오: BGM만 (프리미엄 앰비언트 피아노 계열, 로열티프리 + 라이선스 기록) + 씬 원음 앰비언스 낮게
- 공통 스타일 문구: `premium clean luxury skincare commercial, soft diffused morning light, ivory-white minimal space with subtle sky-blue accents, slow cinematic camera, Korean beauty editorial look`
- 서사: 아침 리추얼 → 수분 오브제 → 제형 → 지속되는 글로우 → 제품 (메시지 "하루 종일 가는 수분"을 시간의 흐름으로)

## 컷 구성

| 컷 | 길이 | 화면 | 인물 | 생성 |
|----|------|------|------|------|
| 1 (0–3s) | 3초 | **모델 리추얼 오프닝** — 아침 빛이 드는 미니멀 화장대, 한국인 여성 모델이 크림 용기에서 크림을 손끝으로 떠내는 손 클로즈업 (제품 외형 참조 보존) | ○ | image-to-video (제품 참조) |
| 2 (3–5s) | 2초 | **수분 오브제 매크로** — 투명한 물 구슬들이 아이보리 공간에 떠 있는 매크로, 빛 굴절 (리듬 컷) | — | text-to-video |
| 3 (5–9s) | 4초 | **제형 슬로우 클로즈업** — 아쿠아 젤크림 스와이프, 물기 머금은 광택, 슬로우 모션 | — | text-to-video |
| 4 (9–12s) | 3초 | **피부 글로우 컷** — 같은 모델이 뺨에 손을 얹고 눈을 감은 세레머니 컷, 촉촉한 피부 글로우, 소프트 백라이트 | ○ | text-to-video |
| 5 (12–17s) | 5초 | **제품 히어로** — 잔잔한 물결 위 제품, 카메라 서서히 푸시인, 소프트 라이트 (제품 외형 참조 보존) | — | image-to-video (제품 참조) |
| 아웃트로 (17–20s) | 3초 | **싱그러운 제품 히어로 스틸 풀블리드** (신규 생성 이미지 — 제품 중심, 상큼한 과즙·물방울 프레시 무드, 제품 참조 보존) 위에 홍보 카피 "하루 종일 가는 수분" + 브랜드 타이포 "애터미 아쿠아 크림" 오버레이, 슬로우 줌 | — | generate_image (제품 참조) + Remotion |

- 인물 일관성: 컷 1(손 중심)·컷 4(얼굴)로 신체 부위를 분리해 동일 인물로 보이게 설계
  (동일 묘사 문구 사용: "Korean woman in her late 20s, natural glowing dewy skin").
- 무자막이므로 컷 길이는 시각 리듬 기준: 리듬 컷(컷2) 2초, 무드 컷 3~5초.

## 컷별 힉스필드 프롬프트

- **컷 1**: `Close-up of a Korean woman's hands in her late 20s scooping cream from the white Atomy Aqua Cream jar from the reference image, on a minimal ivory vanity in soft morning light, natural glowing dewy skin, product label preserved exactly as reference, {공통 스타일}`
- **컷 2**: `Macro shot of transparent water spheres floating in a bright ivory-white space, light refracting through them, subtle sky-blue tint, {공통 스타일}`
- **컷 3**: `Extreme close-up of lightweight aqua gel-cream texture being slowly swiped, glossy hydrated surface with fine water beads, slow motion, {공통 스타일}`
- **컷 4**: `Korean woman in her late 20s with eyes closed touching her cheek gently, natural glowing dewy skin with soft backlight, serene ritual mood, {공통 스타일}`
- **컷 5**: `The white Atomy Aqua Cream jar from the reference image standing on a calm rippling water surface, camera slowly pushing in, soft studio light, product label preserved exactly as reference, {공통 스타일}`
- **아웃트로 배경 (이미지)**: `The white Atomy Aqua Cream jar from the reference image as the hero at center, surrounded by fresh water splashes and dewy droplets, crisp sky-blue and white palette, juicy fresh vibrant mood, bright natural light, product label preserved exactly as reference, wide 16:9 composition with clear space at the bottom for typography, premium cosmetic advertisement photography`

## 오디오 계획
| 트랙 | 내용 | 설정 |
|------|------|------|
| BGM | 프리미엄 앰비언트 피아노 (로열티프리, 예: incompetech 명상·릴랙스 계열 — 라이선스 report에 기록) | 볼륨 0.55, 페이드인 0.6s, 페이드아웃 2.5s |
| 씬 원음 | 물·공간 앰비언스 은은하게 | videoVolume 0.3 |
| 내레이션·SFX | 없음 | — |

## 크레딧 계획 (상한 300 / 예비비 30 / 운영 270)
| 항목 | 예상 |
|------|------|
| 컷 1~4 (4초 클립 × 4, 36/개) | 144 |
| 컷 5 (5초 클립) | ~45 |
| 아웃트로 배경 이미지 1장 | ~6 |
| 재생성 여유 (인물 컷 리스크 대비) | ~66 |
| **예상 합계** | **195~261** |

## 확정 상태
- [x] 유저 확정 완료 (2026-07-27) — 아웃트로 풀블리드 히어로 이미지 수정 반영 후 확정. 이후 무중단 구간.
