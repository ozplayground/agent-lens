# Task 28: 통합·상세 문서 반영

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 28
Status: done
Session: main
Agent: aef351e927ed19111 (design-system), aa68dc6c9c7f73e15 (ui-spec·07·01), a5b30d0520d51f327 (02·04·05·known-issues·test·tech-spec)
Updated: 2026-11-06

## 한 일
- 문서 작성 서브에이전트 3개를 겹치지 않게 병렬로 맡기고 메인이 검토·통합했다: (a) design-system.md, (b) ui-spec.md·functional-spec 07·01, (c) functional-spec 02·04·05, known-issues, test-cases, test-strategy, tech-spec.
- 메인: known-issues 의 고정 시사점 근거 줄을 코드 기준 703-709 로 맞췄다 (01 과 통일).
## 바꾼 파일
- docs/design-system.md, docs/ui-spec.md, docs/functional-spec/01·02·04·05·07, docs/known-issues.md, docs/test-cases.md, docs/test-strategy.md, docs/tech-spec.md
## 검사 결과
- `grep -n "aria-controls=\"chat-history-sidebar\"\|Ask AI 입력 중 Escape\|Ask AI 답변 복사가 실패해도" docs/known-issues.md` → 출력 없음
- `grep -n "ESC로 닫기" docs/functional-spec/07-ui-common.md` → 출력 없음
- 추가한 줄에 산출물 경로·스킬 이름·승인·요구 번호 없음 (grep). 예외: test-cases 에 원문 그대로 옮긴 테스트 이름 `… (R18)` 1건.
- test-cases 의 파일·테스트 수가 `pnpm test` 실제 값(50 파일, 555 테스트)과 같음 ((c) 서브에이전트가 스크립트로 대조).
## 결정
- plan 문서 목록보다 넓게 고친 곳 (코드와 어긋난 서술을 지금 코드 기준으로 맞춤, verifier 확인 대상):
  - design-system 10.2 의 이미 해결된 행 4개 삭제·수정 (챗 토스트, 줄인 모션 스크롤, 라벨 두 벌 → 포커스 시트 라벨, code 배경 예).
  - 07 옛 위험 5(사이드바 aria-controls) 삭제, 옛 위험 3 은 Ask AI 부분만 삭제 (execCommand·LAN IP 는 사실이라 유지).
  - 01 NEWS-17 팔레트 초기화가 수집 중 비활성이라는 점 (기존 문서가 틀림), NEWS-10 Ask AI 변경, 01 알려진 위험에 고정 시사점 반복.
  - 04·05 탭 줄 스크롤과 aria-controls 서술 (같은 Tabs 를 쓰는 브리핑·소스 대화상자).
  - test-cases 에 1차(18단계) 때 빠진 테스트(Header 버전 배지 2, 팔레트 초기화 비활성, 이전 회차 무시, ui/ConfirmDialog) 반영.
## 막힌 점
## 다음
- (21단계 보고) design-system.md: 6.1 에 스택 `order` 규칙(렌더 순서 번호, 같은 렌더에서 부모→자식)을 적고 '부모가 열린 뒤 연다' 제약 삭제. `Toast` 행에 `placement`(global/composer, 선택 규칙), `Tabs` 행에 `aria-controls`(선택 탭·`mountedPanels` 만) 규칙. 10.2 '부모·자식 대화상자' 행 삭제.
- (25단계 보고) design-system 7.1 Escape 예외(Ask AI 입력창은 닫지 않고 탭 패널로 포커스), functional-spec 07 UI-08·UI-13, ui-spec Ask AI 자리표시 `이 기사에 대해 질문하세요`, 복사 실패 `복사 실패` 2초·aria-live. known-issues 'Ask AI Escape'·'복사 실패' 행 삭제.
- (26단계 보고) 04 BRF-06(이메일 발송 aria-controls), 05 SRC-04(카테고리 선택지 긴 라벨), 07 UI-02·UI-14(수집 상태 복원, already_running 처리, 초기화 already_running 은 확인 창 오류). known-issues '수집 중 이탈 후 복귀' 행 삭제.
- (24단계 보고) 02-ai-chat: 기록 버튼 aria-controls(열렸을 때만), 추천 질문 왼쪽 정렬, 맥락 줄 ScrollRow, 사이드바 머리 두 줄(56+44), composer 알림 위치, 짧은 카테고리 라벨. known-issues 'aria-controls'·'챗 토스트'·'챗 기사 칩 원값' 행 삭제.
