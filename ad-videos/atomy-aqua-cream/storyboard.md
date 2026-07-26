# 스토리보드 v2 — 애터미 아쿠아 크림 15초 멀티컷 리메이크 (16:9) [확정본]

- 변경 사유: 스킬 보강(멀티컷 6~8컷 + 키네틱 자막) 적용 리메이크. v1 요약은 하단에 보존.
- 총 길이: 15초 = 6컷 × 2초 + 아웃트로 3초
- 자막: 키네틱 스타일 (단어별 팝인, `*단어*` = 스카이블루 강조)
- 내레이션: v1 트랙 재사용 (Hana, 10.85초 — "메마른 하루의 끝. 속부터 차오르는 깊은 수분. 산뜻하게, 촉촉하게. 애터미 아쿠아 크림.")

## 컷 구성 (컷당 2초)

| 컷 | 소스 | 화면 | 키네틱 자막 |
|----|------|------|------------|
| 1 (0-2s) | **기존** scene-1.mp4 | 물방울 매크로 낙하 + 왕관 스플래시 | 메마른 하루의 *끝* |
| 2 (2-4s) | **신규** cut-2 | 수면 와이드 부감(탑뷰) — 동심원 파장, 슬로 틸트 | 피부가 목마른 순간 |
| 3 (4-6s) | **기존** scene-2.mp4 | 젤크림 제형 스와이프 클로즈업 | 속부터 차오르는 *수분* |
| 4 (6-8s) | **신규** cut-4 | 열린 용기 탑뷰 — 반짝이는 젤 텍스처, 느린 회전 | 물기를 머금은 텍스처 |
| 5 (8-10s) | **신규** cut-5 | 제품 측면 다이나믹 — 용기 주변 물 스플래시 (제품컷 참조, 외형 보존) | *아쿠아* 부스팅 |
| 6 (10-12s) | **기존** scene-3.mp4 | 제품 히어로 푸시인 + 물 파동 | 애터미 *아쿠아 크림* |
| 아웃트로 (12-15s) | Remotion (v2 리디자인) | 딥블루 그라디언트 + 라디얼 글로우 배경, **제품 이미지 화이트 카드**(스프링 팝인), 헤드라인 "애터미 아쿠아 크림" + 스카이블루 언더라인 애니메이션 + 서브 "속부터 차오르는 수분" | — |

- 컷 다양성: 매크로 → 와이드 부감 → 클로즈업 → 탑뷰 회전 → 측면 다이나믹 → 정면 푸시인
- 신규 컷은 Seedance 2.0, 4초 1080p로 생성 후 앞 2초 사용. 기존 컷도 앞 2초만 사용.
- 컷 5는 제품 정면컷(media_id 92cd5a1a) 참조 image-to-video.

## 신규 컷 프롬프트

- **cut-2**: `Top-down wide shot of a calm light sky-blue water surface, concentric ripples expanding slowly, soft diffused studio lighting, camera slowly tilting, fresh clean beauty commercial look, serene minimal composition, gentle water ambience`
- **cut-4**: `Top view of an open white cosmetic jar filled with glossy aqua gel cream, tiny water droplets on the glistening surface, jar slowly rotating, white and sky-blue palette, soft studio light, macro detail, premium skincare commercial, soft subtle ambience`
- **cut-5**: `The white Atomy Aqua Cream jar from the reference image on a wet reflective surface, dynamic water splash rising around the jar in slow motion, side angle, light sky-blue background, product label and shape preserved exactly as reference, crisp commercial lighting, water splash sound`

## 오디오
- 내레이션: narration.wav 재사용 (1.0초 시작, 볼륨 1.0)
- BGM 대체: 씬 앰비언스 (videoVolume 0.35) — v1과 동일 원칙
- 아웃트로 3초는 무음 여백 (내레이션이 12초 내 종료)

## 크레딧 계획 (v2 추가분, 잔액 1091.6)
| 항목 | 예상 |
|------|------|
| 신규 컷 3개 (36/개) | 108 |
| 재생성 여유 (컷당 최대 2회 규칙) | ~72 |
| **예상 합계** | **108~180** |

## 확정 상태
- [x] 유저 확정 완료 (2026-07-27) — 참고 스타일: 라네즈 물 비주얼, 아웃트로 v2 리디자인 포함. 이후 무중단 구간.

---

# [참고] 스토리보드 v1 요약 (제작 완료본, 2026-07-26)
- 3씬 × 4초 + 아웃트로 3초, 바 자막. 씬1 물방울 매크로 / 씬2 제형 클로즈업 / 씬3 제품 히어로컷(참조).
- 산출물 v1 mp4는 폴더 유실로 삭제됨 — v2 렌더로 대체 예정. 에셋은 CDN에서 복구 완료.
