# Task 25: 기사 상세 Ask AI: 입력 Escape·복사 실패·자리표시·빠른 질문 줄

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 25
Status: done
Session: main
Agent: a4298b1aa5033196d (implementer G)
Updated: 2026-11-06

## 한 일
- 실패 테스트 먼저 (커밋 `54d381b`):
  - `NewsDetailModal.test.tsx` 에 새 describe `NewsDetailModal 2차 (R26·R28)` 추가: ① Ask AI 입력에 글자 → 입력에서 Escape → 대화상자 남음·입력 값 남음·`document.activeElement` 가 Ask AI 탭 패널 → 다음 Escape 로 닫힘 (R26). ② IME 조합 중 Escape 는 아무것도 하지 않음. ③ `navigator.clipboard.writeText` 거부 + `execCommand` false 일 때 복사 버튼 `복사 실패` 와 `aria-live="polite"` 영역, 2초 뒤 사라짐 (R28). 전역 속성은 `onTestFinished` 로 되돌린다.
  - `AskAiPanel.test.tsx` 에 새 describe `AskAiPanel 2차 (R16·R28·R15)` 추가: 자리표시 정확히 `이 기사에 대해 질문하세요`, `copyFailedIndex={0}` → 첫 답변만 `복사 실패` + `sr-only` `aria-live="polite"`, `null` 이면 실패 문구 없음, 빠른 질문 그룹이 `data-scroll-row`·`data-overflow` 를 가진 스크롤 줄.
  - 수정 전 실행: 4개 실패, 13개 통과. 실패 이유가 예상과 같다 — 자리표시는 긴 예시 문구(`이 기술에 대해 자유롭게 질문해보세요 (예: …)`, 기준선 Ask AI 탭 `placeholder` 실패 F3 와 같은 원인), `copyFailedIndex` 는 선언만 한 빈 구현이라 `복사` 그대로, 입력 Escape 는 `onClose` 가 1회 불려 대화상자가 닫힘, 모달 복사 실패는 아무 표시 없음. 처음부터 통과한 새 테스트: IME 조합 Escape(스택이 이미 `isComposing` 을 무시), 빠른 질문 스크롤 줄(20 이후 이미 `ChipGroup scrollable`), `copyFailedIndex=null`.
- 구현 (커밋 `0a3d236`):
  - `AskAiPanel`: 질문 입력 `onKeyDown` — `Escape`/`Esc` 이고 IME 조합 중(`nativeEvent.isComposing`, `keyCode 229`)이 아니면 `preventDefault()` 하고 `closest('[role="tabpanel"]')` 에 포커스. 자리표시 `이 기사에 대해 질문하세요`. 빠른 질문 `ChipGroup scrollable bleed` (768 미만 화면 끝까지, 이름 `빠른 질문`, `QUICK_PROMPTS` 그대로). 새 선택 prop `copyFailedIndex?: number | null` — 그 답변 복사 버튼이 `TriangleAlert` + `복사 실패`(`text-danger`), 버튼 옆 `sr-only` `aria-live="polite"` 영역에 같은 문구. 문구는 `COPY_STATUS_LABELS` (UI-13 과 같음).
  - `NewsDetailModal`: `copyFailedIndex` 상태. `copyText` 결과가 true 면 `복사됨`, false 면 `복사 실패` 를 2,000ms(`COPY_FEEDBACK_MS`) 동안 보이고, 타이머는 ref 하나로 두어 새 복사·닫힘(`handleClose`, `isOpen` false effect)·언마운트 때 정리. 닫을 때 기록 지움(NEWS-10)·상세 배지 `categoryLabel` 은 그대로.

## 바꾼 파일
- `frontend/src/components/news-detail/AskAiPanel.tsx`
- `frontend/src/components/NewsDetailModal.tsx`
- `frontend/src/tests/AskAiPanel.test.tsx` (추가만)
- `frontend/src/tests/modals/NewsDetailModal.test.tsx` (추가만. 새 describe 와 vitest import 에 `onTestFinished` 추가, 기존 단언 변경 없음)

## 검사 결과
- 끝 기준: `cd frontend && pnpm exec vitest run src/tests/modals/NewsDetailModal.test.tsx src/tests/AskAiPanel.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/ui/Tabs.test.tsx src/tests/ui/OverlayStack.test.tsx`
  ```
   Test Files  5 passed (5)
        Tests  44 passed (44)
  ```
- `pnpm exec eslint src/components/news-detail/AskAiPanel.tsx src/components/NewsDetailModal.tsx src/tests/AskAiPanel.test.tsx src/tests/modals/NewsDetailModal.test.tsx` → 출력 없음, exit 0
- `pnpm exec tsc --noEmit` → 출력 없음, exit 0 (작업 트리 전체)
- 전체 `pnpm test` (작업 트리, 23·26 진행 중): `Test Files  7 failed | 41 passed (48)`, `Tests  17 failed | 513 passed (530)`. 실패 파일은 모두 다른 단계 소유의 미구현 실패 테스트다 — 23: `feed/FeedToolbar`, `feed/InsightsBar`, `hooks/useNewsFeed` / 26: `Header`, `hooks/useCollector`, `modals/DailyBriefingModal`, `modals/SourcesModal`. 25 의 파일은 실패 없음.
- `make check` 는 돌리지 않았다 (병렬 단계가 미완이고 backend 가 루트 설정 파일을 고친다. plan 대로 27 에서 한 번 돈다).

## 결정
- 관문 G3 의 19단계 self-test 가 끝나기 전에 메인 세션 판단으로 시작했다.
- E22(React 위임 리스너가 `window` 리스너보다 먼저 돈다) 가정은 `NewsDetailModal` 테스트로 확인됐다: 입력의 `preventDefault` 를 `overlay-stack` 의 `window` 리스너가 `defaultPrevented` 로 보고 무시한다. `stopPropagation`·스택 규칙 변경은 쓰지 않았다. 21 소유 파일(`overlay-stack.ts`, `Tabs.tsx`)·20 소유 파일(`ScrollRow`, `Chip`)은 고치지 않았다.
- 포커스 대상: spec C-6 은 패널 `tabIndex={-1}` 이라 했으나 `TabPanel` 이 이미 `tabIndex={0}` 이라 그대로 쓴다 (plan 25 문구와 같음).
- 실패 테스트 커밋에 `AskAiPanel` 의 `copyFailedIndex` 선택 prop **선언만** 넣었다 (plan 의 '받기만 하는 빈 구현'). 그 커밋에서도 테스트 파일이 tsc 를 통과하게 하기 위함.
- 빠른 질문 줄에 `bleed` 를 더했다: 감싸개가 `px-4 md:px-5` 라 768 미만 `-mx-4 px-4` 와 맞고, R15 '768 미만 화면 좌우 끝까지' 를 만족한다.
- 복사 성공 타이머도 같은 ref 로 관리해 성공·실패 표시가 겹치지 않게 했다 (이전에는 성공 타이머를 정리하지 않았다).
- 부품(20·21) 버그·빠진 기능: 발견 없음.

## 막힌 점
- 없음.

## 다음
- 없음 (25 완료). 문서 반영(design-system 7.1 Escape 예외, functional-spec 07 UI-08·UI-13, known-issues 행 삭제, ui-spec 자리표시)은 28단계 몫. ui-audit Ask AI 탭 `placeholder`·`scrollRow` 측정은 27.
