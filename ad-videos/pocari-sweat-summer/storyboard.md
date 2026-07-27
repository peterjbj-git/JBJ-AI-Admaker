# 스토리보드 — 포카리스웨트 "파란 여름" 20초 (16:9) [확정본]

- 방향: A안 푸른 하늘 달리는 청춘 (포카리 공식 문법 + 일본 CF풍 감성)
- 총 길이: 20초 = 컷 6개(17초) + 아웃트로 3초
- 자막: copy 스타일 (팔레트 컬러, 카메라 정합, 자막 컷 길이 공식 준수)
- 오디오 2레이어: 씬 = 효과음만 (`ambient sound effects only, no background music` 프롬프트 필수) / BGM = 전역 단일 트랙 (밝은 어쿠스틱, 로열티프리 CC-BY 기록)
- 공통 스타일 문구: `bright Korean summer youth film, vivid blue sky, natural sunlight, Pocari Sweat blue and white palette, energetic yet emotional, cinematic commercial`
- 서사: 하늘 → 달리는 청춘 → 땀 → 캔 → 마시는 순간 → 바다 점프 (청량감의 크레셴도)

## 컷 구성

| 컷 | 길이 | 자막 (글자수→최소길이) | 카메라 | 화면 |
|----|------|----------------------|--------|------|
| 1 (0–1.5s) | 1.5초 | 무자막 | dolly_in | 새파란 여름 하늘, 뭉게구름, 태양 플레어 |
| 2 (1.5–4.5s) | 3초 | "파랗게 달리는 *여름*." (8자→2.9s) · 좌상단 · 페이퍼화이트 | pan_right | 해안 들판 길을 달리는 한국인 소녀(10대 후반), 사이드 트래킹, 머리카락 날림, 웃음 |
| 3 (4.5–7s) | 2.5초 | "땀 흘린 *순간*." (6자→2.5s) · 우측 · 딥블루 | static | 역광 속 이마 땀방울·상기된 환한 얼굴 클로즈업 |
| 4 (7–8.5s) | 1.5초 | 무자막 | dolly_in | 포카리 캔 클로즈업 — 물방울 맺힌 캔, 스플래시 (제품 참조, 라벨 보존) |
| 5 (8.5–12s) | 3.5초 | "몸이 원하는 *수분*." (7자→2.7s) · 좌측 · 페이퍼화이트 | dolly_in | 푸른 하늘 향해 캔을 들이켜는 소녀, 로우앵글 (제품 참조) |
| 6 (12–17s) | 5초 | "온몸에 퍼지는 *파랑*." (8자→2.9s) · 상단 · 페이퍼화이트 | dolly_out | 청춘 서넛이 바다로 뛰어드는 슬로모션 와이드, 물보라 |
| 아웃트로 (17–20s) | 3초 | CF 엔딩 (좌측 에디토리얼) | — | **라이브 영상 배경** (신규 히어로 이미지 → i2v) + "몸이 원하는 파랑." + POCARI SWEAT |

- 무자막 컷(1·4)이 빠른 리듬 담당, 자막 컷은 전부 읽기 시간 공식 충족.
- 컷 2·3·5의 인물은 동일 묘사 문구("Korean girl in her late teens, short dark hair, white t-shirt")로
  일관성 유도. 컷 6은 군상(뒷모습·원경)이라 일관성 리스크 낮음.

## 컷별 프롬프트 (전부 끝에 `, ambient sound effects only, no background music` 부착)

1. `Vivid blue Korean summer sky with cumulus clouds, sun flare, camera slowly pushing upward-in, {공통}`
2. `Side tracking shot of a Korean girl in her late teens with short dark hair in a white t-shirt running joyfully along a coastal field road, hair flowing, genuine laugh, camera panning right, {공통}`
3. `Backlit close-up of the same Korean girl's face, tiny sweat drops on her forehead, flushed cheeks, bright smile, static camera, shallow depth, {공통}`
4. `Extreme close-up of the blue Pocari Sweat can from the reference image covered in cold water droplets, a splash of water bursting around it, camera pushing in, product label preserved exactly as reference, {공통}`
5. `Low angle shot of the same Korean girl drinking from the blue Pocari Sweat can from the reference image against the vivid blue sky, eyes closed in refreshment, camera slowly pushing in, product label preserved, {공통}`
6. `Slow motion wide shot of three Korean teenagers jumping into the sparkling summer sea, water spray, seen from behind, camera slowly pulling back, {공통}`
- **아웃트로 히어로 이미지**: `The blue Pocari Sweat can from the reference image as the hero, dynamic water splash wrapping around it, vivid blue sky with clouds behind, fresh summer energy, label preserved exactly, wide 16:9 with clear space on the left for typography` → 생성 후 start_image로 i2v (4초, generate_audio:false)

## 자막 컬러 (팔레트 추출, 순백 금지)
- 하늘/바다 배경 컷(2·5·6): 페이퍼 화이트 #F2F9FF + 액센트 #BFE4FF
- 밝은 얼굴 클로즈업 컷(3): 딥 포카리 블루 #0B4F8F + 액센트 #1F8FE5

## 오디오
- BGM: 밝은 어쿠스틱/휘파람 계열 (incompetech CC-BY, 라이선스 report 기록), 볼륨 0.5, 페이드아웃 2초
- 씬 SFX: 바람·발소리·캔 오프닝·물소리 (videoVolume 0.5)

## 크레딧 계획 (상한 300 / 예비비 30 / 운영 270 / 잔액 756)
| 항목 | 예상 |
|------|------|
| 컷 1~5 (4초 × 5, 36/개) | 180 |
| 컷 6 (5초) | ~45 |
| 아웃트로 이미지(~6) + i2v(36) | ~42 |
| **예상 합계** | **~267** (여유분 없음 — 재생성 필요 시 예비비 30 사용, 초과 시 컷6을 4초로 강등) |

## 확정 상태
- [x] 유저 확정 완료 (2026-07-27, v1 원안) — 이후 무중단 구간
