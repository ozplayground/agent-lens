# Task 17: 통합·상세 문서 반영

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 17
Status: done
Session: main
Agent: adfcee4aacdfbf474 (design-system), a84c8ca3234e4ac34 (ui-spec·07), adc669855198542a8 (기능명세·known-issues·test·tech-spec)
Updated: 2026-11-06

## 한 일
- 문서 작성 서브에이전트 3개를 병렬로 맡기고 메인이 검토·통합했다: (a) 새 docs/design-system.md, (b) docs/ui-spec.md·functional-spec/07-ui-common.md, (c) functional-spec 01·02·04·05·06·README, known-issues, test-cases, test-strategy, tech-spec.
- 메인: product.md 의 지워진 TechRadar.tsx 참조를 feed/InsightsBar·TrendRadarPanel 로 고침. known-issues 'UI·접근성' 에 (b) 가 찾은 새 문제 4행 추가.

## 바꾼 파일
- docs/design-system.md (새), docs/ui-spec.md, docs/functional-spec/01·02·04·05·06·07·README, docs/known-issues.md, docs/test-cases.md, docs/test-strategy.md, docs/tech-spec.md, docs/product.md

## 검사 결과
- 통합·상세 문서에 스킬 이름·산출물 경로·tasks 경로가 섞이지 않았다 (grep 으로 확인, 출력 없음).

## 결정
- (메인, 16단계 보고) design-system.md 에 적는다: 부품 className 에 `hidden` 을 주지 말고 감싸는 요소에 준다 (부품 기본 `inline-flex` 가 이긴다).
- (메인) make check: backend 2 실패(test_anthropic_provider anti_gemini 2개, 외부 LLM 업스트림 실패)는 main 에서도 똑같이 실패한다. backend 는 이번 기능에서 바뀌지 않았다. known-issues '테스트·운영' 에 적는다.
- (메인, 13단계 보고) G2 확인: ChatWorkspace 'dual citations' 테스트 재실행, 챗 토스트가 입력창 위가 아닌 레이아웃 ToastRegion 위치에 뜬다(spec 6 과 다름 → 16단계 또는 known-issues). 모바일 맥락 줄은 `min-h-11`.
- (메인, 12단계 보고) 공유 & 알림 설정의 탭별 테스트·저장 버튼이 바닥 `연결 테스트`·`저장` 두 개로 합쳐졌다 (예: '테스트 메일 발송' 이름 사라짐). `functional-spec/04-briefing-and-sharing.md` BRF-05·07·09·11 진입점을 고친다.
- (메인, 11단계 보고) G2 에서 브리핑 대화상자 → 연동 설정 열기가 눌리는지 확인한다.
- (메인, 7단계 보고) design-system.md 에 적는다: 부모·자식 대화상자가 같은 렌더에서 함께 열리면 자식이 오버레이 스택 아래에 깔린다. 겹치는 대화상자는 부모가 열린 뒤에 연다.
- (메인, 6단계 보고) design-system.md 에 적는다: `Tabs` 와 `TabPanel` 은 같은 `idPrefix`(기본 `tabs`)로 연결된다. 한 화면에 탭 묶음이 둘 이상이면 서로 다른 값을 준다.
- (메인, 8단계 보고) ui-audit 의 R4 '한 줄' 판정은 자식들의 세로 구간 겹침으로 한다. 잴 수 없는 항목은 skipped.
## 막힌 점
## 다음
- verify-change (verifier): plan '증명' 항목별 판정. 11단계 메모의 '브리핑 대화상자 → 연동 설정 열기' 겹친 대화상자 동작을 브라우저에서 확인할 것.
- 그 뒤 review-change (reviewer).
