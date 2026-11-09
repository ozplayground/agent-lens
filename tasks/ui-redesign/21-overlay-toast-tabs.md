# Task 21: 겹친 대화상자 순서·챗 알림 영역·탭 aria-controls

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 21
Status: done
Session: main
Agent: a3e35e97a3d352473 (implementer C)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트 (커밋 `05c5890`, `test(ui-redesign): 21 실패 테스트 …`). 커밋 전 실행에서 8건이 예상 이유로 실패했다:
  - `OverlayStack.test.tsx` 같은 렌더 부모·자식 `Dialog` (일반·StrictMode): `expected <div role="dialog" …(4)> to be <div role="dialog" …(5)>` — `overlayStack.getTop().element` 가 자식이 아니라 부모 (자식 effect 가 먼저 push).
  - `Toast.test.tsx` placement 3건: `expected null not to be null` — `[data-toast-region="composer"]`·`"global"` 영역 없음 (`ToastRegion` 은 `placement` 를 받기만 하는 빈 자리, 같은 커밋에 prop 타입만 넣어 tsc 통과).
  - `Tabs.test.tsx` 3건: 선택되지 않은 탭에 `aria-controls` 가 있음 (`Tabs.tsx:106`), 그 id 요소가 문서에 없음.
- 구현 (커밋 `d125622`):
  - `lib/overlay-stack.ts` (C-5, R25): 레이어 `order`. 모듈 카운터 `takeOverlayOrder()`. `useOverlayLayer` 가 `useState` 로 `{open, order}` 를 들고, `open` 이 false→true 로 바뀌는 렌더에서 새 번호를 받는다 (렌더 중 이전 값 비교, 첫 렌더는 lazy 초기값). effect 의 `push` 에 `order` 를 넘기고 deps 에 넣었다. `push` 는 `order` 오름차순 자리에 넣고(`order` 가 없으면 기존 값 또는 새 번호 → 맨 위, 직접 push 하는 기존 테스트·호출 동작 그대로), 맨 위·`inert`·Escape 는 그 정렬된 배열을 본다. `useModalOpen()`(모달 레이어 존재 구독) 추가. `useOverlayLayer` 인자·반환 불변, `eslint-disable` 없음.
  - `components/ui/Toast.tsx` (C-2, R23): `ToastRegion placement?: 'global' | 'composer'` (기본 `global`), `ToastRegionPlacement` 타입 export. 등록 목록에 placement 를 함께 둔다. 고르기: 모달이 없고 composer 가 있으면 가장 나중 composer, 아니면 처음 global, global 이 없으면 가장 나중 composer. `composer` 는 포털 없이 `absolute inset-x-0 bottom-full z-60 mb-2` + 안쪽 `mx-auto max-w-3xl px-4 md:px-6`. `data-toast-region` 값은 `global`/`composer`. 알림 `role`·`aria-live`·닫기 버튼·시간 불변.
  - `components/ui/Tabs.tsx` (C-1, R24): `aria-controls` 는 선택된 탭과 새 선택 prop `mountedPanels?: readonly T[]` 의 탭에만. `TabPanel` 불변 (`tabIndex={0}`, 속성 전달).
  - `Tabs.test.tsx` 에 `mountedPanels` 회귀 테스트 1건 추가 (구현 커밋에 포함 — 이전 코드에서도 통과하는 상위 호환 확인이라 실패 테스트 커밋에 넣지 않았다).
- 후속 (메인 세션 요청, 27 측정 결과): 360·390 폭의 `share-notify`·`daily-briefing+settings` 상태에서 `clip` 실패가 8건 나왔다. `연동 종류` tablist 의 `웹훅 (Slack/Discord)` 탭이 오른쪽 453.2px 까지 나가 tablist 오른쪽(360·390px)에서 잘렸고 넘침 표시도 없었다. 원인은 `Tabs.tsx` tablist 가 `overflow-x-auto [scrollbar-width:none]` 만 갖고 있던 것이다.
  - 실패 테스트 (커밋 `8ec5ba2`): `Tabs.test.tsx` 에 4건을 추가했다 (기존 단언 불변). 넘치지 않을 때 `data-scroll-row`·`data-overflow="none"`, 넘칠 때 `end`→`start`·흐림·tablist 밖 스크롤 버튼, 키보드로 옮긴 탭 `scrollIntoView`, 처음 선택 탭까지 줄 밀기를 본다. 커밋 전 실행에서 4건 모두 예상한 이유로 실패했다: `data-scroll-row` 속성 없음, `data-overflow` 없음, `scrollIntoView` 호출 없음(`expected [] to include <button>`), `scrollLeft` 0.
  - 구현 (커밋 `d55c715`): tablist 를 `ScrollRow`(20단계, `@/components/ui/ScrollRow`)로 그린다 (`label={label}`, `role="tablist"`, `aria-label`, `aria-orientation`, `onKeyDown`, `ref`). 아래 테두리(`border-b border-border`)와 호출자 `className` 은 바깥 감싸개로 옮겼다. 선택된 탭이 줄 밖에 있으면 처음 그릴 때와 선택이 바뀔 때 줄의 `scrollLeft` 만 민다. role·aria·키보드 동작과 `aria-controls` 규칙은 그대로다.

## 바꾼 파일
- `frontend/src/lib/overlay-stack.ts`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/ui/Tabs.tsx`
- `frontend/src/tests/ui/OverlayStack.test.tsx` (추가만)
- `frontend/src/tests/ui/Toast.test.tsx` (추가만)
- `frontend/src/tests/ui/Tabs.test.tsx` (추가만)
- 후속: `frontend/src/components/ui/Tabs.tsx`, `frontend/src/tests/ui/Tabs.test.tsx` (추가만). `ScrollRow.tsx`·`Chip.tsx`·소비 파일은 고치지 않았다.
- `Dialog.tsx`·`Drawer.tsx`·`Menu.tsx`·`Popover.tsx`·`ConfirmDialog.tsx` 는 호출부를 바꿀 필요가 없어 고치지 않았다.

## 검사 결과
- 끝 기준 묶음: `cd frontend && pnpm exec vitest run src/tests/ui/OverlayStack.test.tsx src/tests/ui/Toast.test.tsx src/tests/ui/Tabs.test.tsx src/tests/ui/Dialog.test.tsx src/tests/ui/ConfirmDialog.test.tsx src/tests/ui/Menu.test.tsx src/tests/modals src/tests/CommandPalette.test.tsx src/tests/chat/ChatWorkspace.test.tsx src/tests/chat/ChatHistoryDrawer.test.tsx src/tests/chat/ChatSidebar.test.tsx src/tests/chat/FocusBottomSheet.test.tsx src/tests/chat/CitationBadge.test.tsx src/tests/chat/ChatModelSelector.test.tsx src/tests/HotkeyGating.test.tsx`
  ```
   Test Files  18 passed (18)
        Tests  169 passed (169)
  ```
- `pnpm exec eslint src/lib/overlay-stack.ts src/components/ui/Toast.tsx src/components/ui/Tabs.tsx src/tests/ui/OverlayStack.test.tsx src/tests/ui/Toast.test.tsx src/tests/ui/Tabs.test.tsx` → 종료 0, 출력 없음.
- `pnpm exec tsc --noEmit` → 종료 0.
- 전체 `pnpm test` (같은 작업 트리에서 20·22 진행 중): `Test Files 4 failed | 41 passed (45)`, `Tests 29 failed | 471 passed (500)`. 실패는 모두 다른 단계 파일이다 — `tests/ui/ChipGroup.test.tsx` 13 (20), `tests/ui/FormControls.test.tsx` 2 (22 `labels`), `tests/NewsCard.test.tsx` 10·`tests/feed/FeedInsights.test.ts` 4 (22). 21 파일의 실패는 없다.
- 후속 검사:
  - `pnpm exec vitest run src/tests/ui/Tabs.test.tsx` → `Tests  15 passed (15)`
  - `pnpm exec eslint src/components/ui/Tabs.tsx src/tests/ui/Tabs.test.tsx` → 종료 0
  - `pnpm exec tsc --noEmit` → 종료 0
  - 전체 `pnpm test`: `Test Files  2 failed | 46 passed (48)`, `Tests  2 failed | 537 passed (539)`. 실패 2건은 23단계가 고치는 중인 테스트다: `tests/feed/FeedToolbar.test.tsx` '768 미만 소스 줄 넘침 표시', `tests/feed/InsightsBar.test.tsx` '레이더 카테고리 분포 잘림'. 둘 다 작업 트리에서 아직 커밋되지 않은 변경이고, `Tabs` 를 쓰지 않는다.

## 결정
- 렌더 순서 번호는 `useState` 의 렌더 중 이전 값 비교로 받는다. StrictMode 이중 렌더에서 카운터가 두 번 오르지만 부모 렌더(이중 호출 포함)가 자식 렌더보다 먼저 끝나므로 부모 < 자식이 유지된다 — E23 가정을 `StrictMode` 테스트로 확인했다.
- `push` 에 `order` 가 없으면 같은 id 의 기존 번호를 유지하고, 새 레이어면 새 번호로 맨 위에 놓는다. 직접 `overlayStack.push` 하는 기존 테스트(`['a','b']` 순서)는 그대로 통과한다.
- composer 영역만 있고 모달이 열린 경우(global 없음)에는 알림을 잃지 않도록 composer 로 되돌린다 (spec 은 global 이 있다는 전제. 앱에서는 `layout.tsx` 에 global 이 늘 있다).
- `Tabs` 는 DOM 을 재지 않고 `mountedPanels` prop 으로 받는다 (plan 지시). 지금 소비자 4곳(`NewsDetailModal`, `DailyBriefingModal`, `SourcesModal`, `BriefingSettingsModal`)은 모두 선택된 패널만 그리므로 기본값이 맞고 고치지 않았다.
- 후속: `ScrollRow` 를 고치지 않고 그대로 썼다. 그래서 바뀐 점이 둘 있다. ① 탭 사이 간격이 `gap-1` 에서 `ScrollRow` 줄의 `gap-2` 로 넓어졌다 (`cn` 은 Tailwind 충돌을 풀지 않으므로 `rowClassName` 으로 덮지 않았다). ② 테두리가 줄 대신 바깥 감싸개에 있어 768 이상 스크롤 버튼 아래까지 이어진다.
- 후속: `ScrollRow` 의 선택 항목 자동 보이기는 `[aria-pressed="true"]` 만 본다. 탭은 `aria-selected` 라서 같은 동작을 `Tabs` 안의 effect(DOM 만 읽고 `scrollLeft` 만 바꿈)로 넣었다. `ScrollRow` 가 선택 표시 선택자를 받게 되면 이 effect 를 지울 수 있다 (메인 세션에 보고).

## 막힌 점
- 없음.

## 다음
- 24 (챗 화면): `ChatWorkspace` 의 `<ToastRegion />`(`:765`)를 `<ToastRegion placement="composer" />` 로 바꾸고, 입력 영역(`overflow-x-hidden` 상자) 밖의 `relative` 감싸개 안에 둔다. 영역은 부모 위로 `bottom-full mb-2` 에 붙고 안쪽 폭이 `max-w-3xl px-4 md:px-6` 이다. 모달이 열리면 자동으로 `layout.tsx` 의 global 영역이 그린다.
- 25: `TabPanel` 은 `tabIndex={0}` 그대로, 스택은 `defaultPrevented` Escape 를 무시한다 (`handleWindowKeyDown`, 그대로).
- 28: `docs/design-system.md` 6.1 '부모가 열린 뒤 사용자 동작으로 연다' 제약 삭제·`order` 규칙, `Toast`·`Tabs` 행, 10.2 행 삭제 (메인 세션).

## 후속 (3차)
plan 3차 보정(`11be12e`) '21 C 후속'. 20 B 후속 `8fb3e3a` 가 `ScrollRow` 에 `selectedSelector` 와 768 미만 넘침 표시를 넣은 뒤에 했다.

### 한 일
- `Tabs.tsx` 에서 선택 탭 보이기 `useEffect`, `revealTabInRow`, `REVEAL_PADDING_PX`, `rowRef`(와 `ScrollRow` 의 `ref` 전달), `useEffect` import 를 지웠다. 대신 `ScrollRow` 에 `selectedSelector={SELECTED_TAB_SELECTOR}`(`'[role="tab"][aria-selected="true"]'`)를 넘긴다. 파일 머리 JSDoc 도 고쳤다: 선택 탭 보이기와 768 미만 넘침 표시는 `ScrollRow` 가 한다. `tabRefs`(키보드 포커스), `aria-controls` 규칙, 로빙 `tabIndex` 는 그대로다.
- `Tabs.test.tsx` 에 새 `describe('Tabs 스크롤 줄 — ScrollRow 위임 (3차)')` 로 회귀 테스트 2건을 더했다. 기존 단언은 바꾸지 않았다.
  - 선택을 줄 밖 탭(`출처`, 클릭)으로 바꾸면 줄 `scrollLeft` 가 0 보다 커진다.
  - 360 `matchMedia` 목에서 탭 줄이 넘치면(`end`) `[data-overflow-hint]` 가 1개 생긴다. `aria-hidden="true"` 이고, tablist 밖이며 같은 바깥 감싸개 안에 있다. 스크롤 버튼은 없다.
- 리팩터라 plan 3차 공통 규칙대로 실패 예상이 없다. 고치기 전 코드에서 `pnpm exec vitest run src/tests/ui/Tabs.test.tsx` 가 `Tests 17 passed (17)` 로 통과하는 것을 확인했고, 실패 테스트를 따로 커밋하지 않고 구현과 함께 커밋했다.
- 커밋: `9be90ec` (`refactor(ui-redesign): 21 후속 (3차) — Tabs 선택 탭 보이기를 ScrollRow selectedSelector 로`).

### 바꾼 파일
- `frontend/src/components/ui/Tabs.tsx`
- `frontend/src/tests/ui/Tabs.test.tsx` (추가만)

### 검사 결과
- `grep -nE "useEffect|revealTabInRow" frontend/src/components/ui/Tabs.tsx` → 출력 없음 (종료 1)
- 끝 기준 `pnpm exec vitest run src/tests/ui/Tabs.test.tsx src/tests/ui/ChipGroup.test.tsx src/tests/modals src/tests/AskAiPanel.test.tsx` → `Test Files  9 passed (9)`, `Tests  80 passed (80)`. 기존 `키보드로 옮긴 탭이 보이도록 스크롤한다`·`선택된 탭이 줄 밖에 있으면 처음 그릴 때 줄을 그 탭까지 민다` 도 단언을 바꾸지 않고 통과했다.
- `pnpm exec eslint src/components/ui/Tabs.tsx src/tests/ui/Tabs.test.tsx` → 종료 0
- `pnpm exec tsc --noEmit` → 종료 0
- 전체 `pnpm test`: `Test Files  2 failed | 48 passed (50)`, `Tests  2 failed | 553 passed (555)`. 실패 2건은 23 E 후속의 실패 테스트 커밋(`75fe34b`)이 구현 전이라 생긴 것이다: `feed/FeedToolbar.test.tsx` '768 미만 소스 줄 넘침 표시 (… 3차: ScrollRow 공통 표시)', `feed/TrendRadarPanel.test.tsx` '카테고리 분포 라벨 (R19)'. 21 파일과는 상관없다.

### 결정
- 위 2차 후속 '결정' 에 적은 'ScrollRow 가 선택자를 받게 되면 effect 를 지울 수 있다' 를 이번에 처리했다.

### 막힌 점
- 없음.

### 다음
- G7 (메인 세션) 뒤 27 재측정에서 360 연동 설정 탭 줄의 넘침 표시를 눈으로 확인한다.
