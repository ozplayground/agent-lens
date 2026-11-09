# Task 50: 피드 세 영역 분리 (검색·필터·목록 머리줄 정렬)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 50 (보정 9)
Status: done
Session: main
Agent: a2cd41bc978ebd13f (implementer E)
Updated: 2026-11-07

## 한 일
- 먼저 실패하는 테스트 (`ab2d673`):
  - `FeedToolbar.test.tsx`: spec 14.17 '바뀌는 단언' 표의 `FeedToolbar.test.tsx` 행만 표대로 바꿨다.
    - fixture 키 `sort`·`onSortChange` 삭제 (`:11,18`, `:325,332`).
    - `:50` 제목을 `shows the Must-Read toggle outside the source group at the end of the source row, and toggles it` 로. `:57-61` 은 `queryByRole('combobox', { name: '정렬' })` null, 토글이 소스 줄 `lastElementChild`, 소스 그룹 뒤. `:62-67` 그대로.
    - `:80-93` 정렬 4옵션·콜백 테스트는 `FeedStatusBar.test.tsx` 로 옮겼다.
    - `:145` 제목 `bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9)`, `:148` `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` + `not.toHaveClass('max-md:-mx-4')`·`not.toHaveClass('max-md:-mr-4')`, `:150-152` 는 `max-md:flex-wrap`·`max-md:basis-full`·`max-md:ml-auto` 가 없음, `:154-158` 은 `[data-feed-toolbar]` 안 `combobox` 없음.
    - `:225` 제목 `… before the Must-Read toggle`, `:230-231`·`:237` 은 정렬 대신 토글.
    - `:241` 제목 `… end before the Must-Read toggle)`, `:264`·`:278` 토글, `:279-281` 주석 '오른쪽 표시는 토글 앞이라 화면 끝 여백을 쓰지 않는다 (보정 6 과 같음)' + `expect(end).not.toHaveClass('max-md:-mr-4')`. `:280` 그대로.
    - `controls()`(`:341-347`)에서 `sort` 삭제, `:422` 삭제(정렬 노드 유지는 `FeedStatusBar.test.tsx` 로).
    - ③(`:426-433`) 제목 `③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx`, `precedes(search, category)`·`precedes(category, source)`·`precedes(source, toggle)`.
    - ⑤(`:435-454`) `precedes(toggle, sort)` 를 '토글이 소스 줄의 `lastElementChild`' 로 (구조 분해에서 `sort` 도 뺌). 나머지 그대로.
    - ④(`:468-479`) 제목 `④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx`, 검색의 `closest('[data-toolbar-row]')` null, `closest('[data-feed-search]')` 있음, 그 영역이 `[data-feed-toolbar]` 밖·앞, 토글이 줄 B. `:474-476` 그대로.
    - 새 단언 (새 `describe`): `[data-feed-search]` 가 `scroll-mt-20`, 검색 폼 `w-full` 이고 `md:w-48`·`xl:w-72` 없음 / `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 없음.
  - 새 `FeedStatusBar.test.tsx`: 옮긴 정렬 단언(옵션 4개 값·글자, `latest` → `onSortChange('latest')`·`onPageChange(1)`), 정렬이 `[data-feed-list-header]` 안·`role="status"` 밖·상태 뒤, 상태 `aria-live="polite"`·`data-feed-status`·`페이지 2 / 5`, 머리줄 `flex items-center` 이고 `flex-wrap` 아님, 상태 `min-w-0 flex-1`, 정렬 감싸개 `w-28 shrink-0 xl:w-32`, 폭 목 360 → 1440 다시 그려도 같은 정렬 노드.
  - 빈 구현: `FeedStatusBarProps` 에 `sort?`·`onSortChange?`·`onPageChange?` 를 받기만 하게 둠.
- 구현 (`4bb0648`):
  - `FeedToolbar.tsx`: Fragment 로 ① `<div data-feed-search="" className="scroll-mt-20">` 안 검색(`formClassName="w-full"`) ② `div[data-feed-toolbar]`(클래스 그대로). 줄 1 카테고리만, 줄 2 `[소스][Must-Read]` — `max-md:flex-col max-md:items-stretch`·`max-md:flex-wrap`·`max-md:basis-full`·`max-md:ml-auto` 삭제, 소스 `bleed="start"`. 정렬 `Select`·`SORT_OPTIONS`·`sort`·`onSortChange`·`Select` import 삭제. `FEED_CATEGORIES`(이름·`{ id, icon }`·순서)·`feedCategoryLabel`·`FEED_SOURCES`·`data-toolbar-row`·`data-must-read-toggle`·`data-source-chip`·`selectedSelector` 그대로. 머리 JSDoc 표·주석을 세 영역 구조로 고쳤다.
  - `FeedStatusBar.tsx`: `<div data-feed-list-header="" className="flex items-center gap-3">` 안에 상태 `div`(`ref`·`data-feed-status`·`tabIndex={-1}`·`role="status"`·`aria-live="polite"`·`scroll-mt-44 md:scroll-mt-48` 그대로 + `min-w-0 flex-1`, 안쪽 그대로)와 뒤 형제 `Select label="정렬" hideLabel options={SORT_OPTIONS} containerClassName="w-28 shrink-0 xl:w-32"`(`onSortChange(value)` 뒤 `onPageChange(1)`). `SORT_OPTIONS` 를 이 파일에서 내보냄. `sort`·`onSortChange`·`onPageChange` 필수 prop.
  - `page.tsx`: `FeedToolbar` 에서 `sort`·`onSortChange` 를 빼고 `FeedStatusBar` 에 `sort={sort} onSortChange={setSort} onPageChange={setPage}`. `/` 단축키는 `input.focus({ preventScroll: true })` 뒤 `input.closest('[data-feed-search]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' })`. 모달 부분 불변.

## 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/components/feed/FeedStatusBar.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (표의 줄 변경·삭제·이동 + 새 `describe` 1개, it 2개)
- `frontend/src/tests/feed/FeedStatusBar.test.tsx` (새 파일, it 5개)

## 검사 결과
### 먼저 실패하는 테스트 (커밋 `ab2d673`, 구현 전)
`pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx src/tests/feed/FeedStatusBar.test.tsx` — 18 실패 / 13 통과 (`FeedStatusBar` 의 첫 테스트는 `getByRole` 오류를 `queryByRole` + `not.toBeNull()` 단언으로 바꿔 단언에서 실패하게 한 뒤 커밋):
- `FeedStatusBar`: 옵션·콜백, 머리줄 안·상태 밖, 줄 배치, 노드 유지 4건 — `expected null not to be null` / `expect(received).toHaveClass()` (정렬·`[data-feed-list-header]` 없음). `keeps the status as a polite live region` 은 통과 (실패 예상 아님).
- `FeedToolbar`:
  - `:50` 행 — `expected <select …> to be null` (툴바 안에 정렬).
  - `:145` 행 — `expect(element).toHaveClass("max-md:-ml-4 max-md:pl-4 scroll-px-6")` (소스 줄 양쪽 bleed).
  - `:241` 행 — `expect(element).not.toHaveClass("max-md:-mr-4")`.
  - ③ 360·1024·1440 — `expected false to be true` (DOM 순서 `카테고리 → 검색`).
  - ⑤ 360·1024·1440 — `expected <div …> to be <button …>` (줄 B 마지막 자식이 정렬).
  - ④ 360·1024·1440 — `expected <div data-toolbar-row …> to be null` (검색이 줄 A 안).
  - 새 단언 2건 — `expected null not to be null` (`[data-feed-search]` 없음), `expected <input …> to be null` (툴바 안 `searchbox`).
  - `:225` 행(표시가 토글 앞)은 통과 — 구현 전에도 표시가 토글 앞, 실패 예상 아님.
- 이 커밋 시점 tsc 는 fixture 키 삭제로 `FeedToolbar.test.tsx(7,9)`·`(303,5)` `TS2322`(`sort` 필수) 2건 — plan 이 이 커밋에서만 허용. 구현 뒤 0.

### 구현 뒤 (커밋 `4bb0648`)
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/feed src/tests/HotkeyListener.test.tsx src/tests/HotkeyGating.test.tsx src/tests/ResponsiveLayout.test.tsx src/tests/ui/FormControls.test.tsx src/tests/ui/ChipGroup.test.tsx src/tests/design`:
  ```
   Test Files  12 passed (12)
        Tests  205 passed (205)
  ```
  표 밖 단언(`FeedToolbar.test.tsx` 의 검색 제출·지우기, 자리표시, 필터 줄 2개·카테고리·소스 다른 줄, 아이콘, 접두 없는 `flex-wrap`·`basis-full`·`ml-auto` 없음, ①, ⑤ 노드 유지 등)은 모두 그대로 통과.
- 정적 확인:
  - `rg -n "SORT_OPTIONS|onSortChange|<Select|max-md:flex-wrap|max-md:basis-full|max-md:ml-auto|useMediaQuery|-reverse" frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음(`rg exit 1`).
  - `grep -n "data-feed-search" frontend/src/components/feed/FeedToolbar.tsx`: `67`(주석)·`214`.
  - `grep -n "data-feed-list-header\|SORT_OPTIONS" frontend/src/components/feed/FeedStatusBar.tsx`: `5`·`48`·`74`.
  - `grep -n "preventScroll\|data-feed-search" frontend/src/app/page.tsx`: `115`(기존 j/k)·`149`·`150`.
  - `grep -n "export const FEED_CATEGORIES" frontend/src/components/feed/FeedToolbar.tsx`: `12`.
- `pnpm exec eslint <바꾼 5개 파일>`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`. `pnpm lint`: `✖ 41 problems (0 errors, 41 warnings)`.
- 전체 `pnpm test`: `Test Files  52 passed (52)` / `Tests  648 passed (648)` (그때 작업 트리 기준).

### 배치 증거 인용
- jsdom 은 높이·끝 맞춤을 재지 못한다. 49 의 사전 측정(`feedAreas`·`toolbarLayout`·`vRhythm`)은 이 단계를 끝낼 때 `tasks/ui-redesign/49-audit-areas.md` 에 아직 없었다 (49 진행 중). spec 14.17 G1 행: 검색 입력이 분야 칩 줄 안(768 이상 오른쪽, 768 미만 칩 두 줄 사이), 정렬이 소스 칩 줄 안이고, 같은 줄의 입력·정렬(36px, 반경 8px)이 칩(32px, 알약)과 높이·모양이 다르며 오른쪽 열 왼쪽 끝이 23px 어긋난다. 고친 뒤 확인은 55.

## 결정
- `FeedStatusBar` 의 `sort`·`onSortChange`·`onPageChange` 는 구현에서 필수 prop 으로 했다 (spec 14.17 '새 prop'). 쓰는 곳은 `page.tsx` 하나다.
- `FeedStatusBar.test.tsx` 의 폭 목은 이 파일 안에 새로 두고 `afterEach` 에서 복원한다 (`FeedStatusBar` 는 미디어 쿼리를 쓰지 않으므로 노드 유지는 회귀 방지).
- ⑤ 의 `const { source, sort } = controls()` 는 `controls()` 에서 `sort` 가 빠져 `const { source } = controls()` 로 고쳤다 — ⑤ 행(`:435-454`) 범위 안의 변경이다.
- 49·51~54 의 파일은 건드리지 않았다. IconGuard 실패(`ca1ae9f`)는 51~53 몫이라 그대로 두었다 (이번 전체 실행에서는 통과로 나왔다).

## 막힌 점
- 없음 (표 밖 단언 깨짐 없음).

## 다음
- 관문 G22 (메인 세션), 55 측정에서 `feedAreas`·`toolbarLayout`·`vRhythm`·R5·`placeholder`(360 전체 폭 검색)·`/` 단축키 스크롤 확인.

## 연장 (메인 결정: 목록 머리줄 위쪽 맞춤)
결함 (55 측정, 360×780): 카테고리 칩과 Must-Read 를 켜면 목록 머리줄이 44 → 72px 로 높아지고 상태 글자가 세 줄이 되는데, 머리줄이 `flex items-center` 라 정렬 select 가 세로 가운데로 내려갔다 (정렬 top − 머리줄 top = 14). spec 14.17 '정렬은 첫 줄 오른쪽에 남는다' 위반. 증거: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad/chrome55-360-filtered-header.png`.

### 한 일
- 실패 테스트 (`5de1774`, `FeedStatusBar.test.tsx`):
  - 50 이 `ab2d673` 에서 더한 머리줄 단언 `toHaveClass('flex', 'items-center')` 를 메인 결정대로 `toHaveClass('flex', 'items-start')` 로 바꿨다 (spec 14.17 표 밖이지만 50 자신이 더한 단언이고 메인이 요구를 바꿈).
  - 새 `it` (`filtered`·`highSignalOnly` 켠 상태): 머리줄 `items-start` 이고 `items-center` 아님, 상태 `min-h-11`·`md:min-h-9`·`items-center`, 정렬 select `h-11`·`md:h-9`.
- 구현 (`FeedStatusBar.tsx`): 머리줄 `flex items-start gap-3`. 상태 `div` 에 `min-h-11 md:min-h-9` (안쪽 `flex flex-wrap items-center` 그대로). JSDoc 에 세로 맞춤 설명.
- 숫자: select 높이 44px(`h-11`, 768 미만)·36px(`md:h-9`). 상태 최소 높이도 44·36px. 상태 글자는 `text-sm` 14px·줄 높이 20px 이므로 한 줄일 때 위 여백 (44 − 20) / 2 = 12px, md 이상 (36 − 20) / 2 = 8px 로 세로 가운데 → 상태 글자 중심과 select 중심이 모두 머리줄 top + 22px(md 이상 18px). 상태가 여러 줄이면 머리줄이 늘어도 정렬은 top 0 (첫 줄 오른쪽)에 남는다.

### 바꾼 파일
- `frontend/src/components/feed/FeedStatusBar.tsx`
- `frontend/src/tests/feed/FeedStatusBar.test.tsx`

### 검사 결과
- 구현 전 `pnpm exec vitest run src/tests/feed/FeedStatusBar.test.tsx` — 2 실패 / 4 통과: `expect(element).toHaveClass("flex items-start")`, `expect(element).toHaveClass("items-start")`.
- 구현 뒤:
  - `pnpm exec vitest run src/tests/feed`: `Test Files  5 passed (5)` / `Tests  51 passed (51)`.
  - `pnpm exec eslint src/components/feed/FeedStatusBar.tsx src/tests/feed/FeedStatusBar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`. `pnpm lint`: `✖ 41 problems (0 errors, 41 warnings)`.
  - `pnpm test`: `Test Files  52 passed (52)` / `Tests  649 passed (649)`.
- 프로덕션 배치 확인(360 필터 켬 상태의 정렬 top = 머리줄 top, 한 줄 상태의 중심 일치)은 55 재측정 몫.
