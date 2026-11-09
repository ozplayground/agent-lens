# Task 26: 폼 aria-controls·소스 등록 라벨·수집 상태 복원

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 26
Status: done
Session: main
Agent: a3946f65cec43927e (implementer H)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트를 썼다: 새 `tests/hooks/useCollector.test.ts` (a)~(c), `Header.test.tsx` 에 `is_running` 복원 블록 추가, `SourcesModal.test.tsx` 에 `aria-controls`·카테고리 선택지 블록 추가, 새 `tests/modals/DailyBriefingModal.test.tsx`. 커밋 e777bb0.
- `useCollector` (C-7): `loadStatus` 가 `is_running: true` 를 받고 진행 폴링이 없으면 `startProgressPolling('실시간 소식 수집 중...')`. `collectNow` 는 응답 `status === 'already_running'` 이면 응답 `message` 로 폴링을 시작 (다시 요청하지 않음 — 이후 `isCollecting` 이라 `collectNow` 가 바로 끝난다). `resetAndCollect` 는 `already_running` 이면 응답 `message` 로 `Error` 를 던진다 → `ResetConfirmDialog` 의 기존 catch 가 `InlineAlert` 에 보인다. 회차 구분·팔레트 비활성 규칙은 그대로.
- `DailyBriefingModal`: `이메일 발송` 의 `aria-controls` 는 `showEmailPrompt` 일 때만, `aria-expanded` 는 늘.
- `SourcesListTab`: `새 피드 직접 등록` 의 `aria-controls` 는 `showAddForm` 일 때만. 카테고리 선택지 = `Object.keys(CATEGORY_LABELS)` 순서, 라벨 `categoryLabel(id)`, 값은 id 그대로 (기본값 `ai_news` 유지).
- 구현 커밋 f1c58dc.

## 바꾼 파일
- frontend/src/tests/hooks/useCollector.test.ts (새)
- frontend/src/tests/Header.test.tsx (추가만)
- frontend/src/tests/modals/SourcesModal.test.tsx (추가만)
- frontend/src/tests/modals/DailyBriefingModal.test.tsx (새)
- frontend/src/hooks/useCollector.ts
- frontend/src/components/DailyBriefingModal.tsx
- frontend/src/components/sources/SourcesListTab.tsx
- (`Header.tsx`·`ScheduleModal.tsx`·`ResetConfirmDialog.tsx` 는 고칠 필요가 없었다)

## 검사 결과
### 실패 테스트 (구현 전)
`pnpm exec vitest run src/tests/hooks/useCollector.test.ts` → 3 failed | 1 passed
- (a) `restores collecting and progress polling when the schedule status says is_running`: `expected false to be true` (`isCollecting`, useCollector.test.ts:95)
- (b) `joins the running collection with the response message when the trigger says already_running`: `Expected: "이미 수집이 진행 중입니다." Received: "실시간 소식 수집 중..."`
- (c) `rejects with the response message when the reset says already_running`: `expected null to be an instance of Error` (성공으로 끝나 `기존 0건 삭제 완료` 흐름)
- (a') idle 상태면 진행 폴링을 시작하지 않음 — 지키는 단언이라 구현 전에도 통과

`pnpm exec vitest run src/tests/Header.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/modals/DailyBriefingModal.test.tsx` → 4 failed | 18 passed
- Header `shows 수집 중 and the progress line on mount when a collection is already running`: `Unable to find role="button" and name "수집 중"` (진행 표시 없음, `즉시 수집` 활성)
- DailyBriefingModal `points 이메일 발송 at the email form only while the form is open`: `Expected the element not to have attribute: aria-controls` (닫혀도 단다)
- SourcesModal `points 새 피드 직접 등록 at the form only while the form is open`: 같은 이유
- SourcesModal `labels the category options with the long category labels`: `- "하네스 & 벤치마크" + "Harness (에이전트 벤치마크/테스트)"`

### 구현 뒤
`cd frontend && pnpm exec vitest run src/tests/hooks/useCollector.test.ts src/tests/Header.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/modals/DailyBriefingModal.test.tsx src/tests/modals/ScheduleModal.test.tsx`
```
 Test Files  6 passed (6)
      Tests  40 passed (40)
```
`pnpm exec eslint <바꾼 소스 3개 + 테스트 4개>` → 출력 없음, 종료 0. `pnpm exec tsc --noEmit` → 출력 없음, 종료 0.
R19 정적 확인 `grep -rnE "'(Harness|Agent Tech|AI Frontier|MCP & Skills|에이전트 기술|AI 뉴스)'" frontend/src/components/sources frontend/src/components/DailyBriefingModal.tsx` → 출력 없음.
전체 `pnpm test` (참고): `Test Files 2 failed | 46 passed (48)`, `Tests 6 failed | 524 passed (530)` — 실패는 모두 23단계의 진행 중 실패 테스트(`feed/FeedToolbar.test.tsx` 3, `feed/InsightsBar.test.tsx` 3)이고 26 범위 밖.
`make check` 는 돌리지 않았다 (병렬 단계 진행 중, 관문 G4 에서 메인 세션이 돌린다).

## 결정
- 관문 G3 의 19단계 self-test 가 끝나지 않은 상태에서 메인 세션 판단으로 먼저 시작했다.
- (b) 의 plan 예상 실패 이유는 '폴링이 시작되지 않는다' 였지만, 지금 코드는 응답 status 를 보지 않고 늘 폴링을 시작한다. spec 14.7 C-7 ② 의 '그 `message` 로 폴링 시작' 을 단언해, 실제 실패는 진행 줄 문구(`실시간 소식 수집 중...` ≠ 응답 `message`)에서 난다. 트리거 POST 1회·진행 조회 시작·다시 눌러도 요청 없음도 함께 단언한다.
- 가짜 타이머는 `setInterval`/`clearInterval` 만 바꾼다 (`fetchWithTimeout` 의 `setTimeout` 과 `vi.waitFor` 는 실제 타이머). 모듈 저장소는 `vi.resetModules()` + 동적 import 로 격리, 테스트 전용 내보내기 없음.
- 카테고리 선택지 라벨 단언을 SourcesModal 에 더했다 (plan 의 '할 일' 에 있는 동작, R19).

## 막힌 점
- 테스트의 `vi.waitFor` 가 act 밖에서 저장소 갱신을 기다려 React 'not wrapped in act' 경고가 stderr 에 찍힌다. 판정에는 영향 없다.

## 다음
- 관문 G4 (메인 세션): 문서 반영은 28단계 (`04-briefing-and-sharing.md` BRF-06, `05-sources-and-research.md` SRC-04, `07-ui-common.md` UI-02·UI-14, known-issues '수집 중 이탈 후 복귀' 행 삭제).
