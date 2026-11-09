# Task 34: 툴바 한 트리, 소스 칩 data-source-chip

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 34 (리뷰 후속)
Status: done
Session: main
Agent: a2cd41bc978ebd13f (implementer E)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트를 `FeedToolbar.test.tsx` 에 새 `describe` 로 더하고(기존 블록·단언 불변, import 에 `act` 추가) 예상 이유로 실패하는지 확인한 뒤 커밋했다 (`8abeea7`).
  - 이 블록 전용 도우미: `mockViewport(width)`(`matchMedia` 교체, `min`/`max`/복합 질의), 스크롤 줄 `scrollWidth` 600·`clientWidth` 300·`scrollLeft` 저장 목, `getBoundingClientRect` 목(`ChipGroup.test.tsx` 방식). `afterEach` 에서 모두 복원.
  - ① `highSignalOnly: true, source: 'github'` + `GitHub` 칩이 줄 오른쪽 밖 → 처음 그린 뒤 소스 줄 `scrollLeft` > 0, `highSignalOnly` 만 false 로 `rerender` → `scrollLeft` 불변.
  - ② 360 → 1024 → 1440 `rerender`: 검색 입력·`카테고리`·`소스`·정렬 노드가 처음과 같고(`toBe`) 검색이 `document.activeElement`, 값 `MCP` 유지.
  - ③ 360·1024·1440: DOM 순서 `카테고리` → 검색 → `소스` → 정렬.
  - ④ 360·1024·1440: 검색은 `카테고리` 와, 정렬은 `소스` 와 같은 `[data-toolbar-row]`, 두 줄은 다름.
- 구현 (`1fde9c8`, `FeedToolbar.tsx`):
  - `useToolbarLayout`·`ToolbarLayout`·`useMediaQuery` import 와 폭별 트리 분기를 지우고 한 트리로 그린다: `[data-feed-toolbar]` 안 줄 A `ToolbarRow`(`max-md:flex-col max-md:items-stretch`) = 카테고리 그룹 → 검색, 줄 B `ToolbarRow` = 소스 그룹 → 정렬.
  - 크기는 클래스로만: 카테고리 `min-w-0 flex-1`(`bleed`·아이콘 `max-xl:hidden` 그대로), 검색 폼 `w-full md:w-48 md:shrink-0 xl:w-72`, 소스 `min-w-0 flex-1`(`bleed="start"` 그대로), 정렬 `w-28 shrink-0 xl:w-32`. `order-*`·`*-reverse`·grid 영역 없음.
  - 소스 줄: `전체`·소스·`북마크` 칩에 `data-source-chip=""`, `ChipGroup` 에 `selectedSelector='[data-source-chip][aria-pressed="true"]'`(31 B `f2bad54`). `Must-Read` 칩과 구분선은 그대로.
  - 파일 머리 JSDoc 표를 14.2 새 표로 고치고 R33 설명을 적었다. 주석에 `useMediaQuery`·`-reverse`·`order-` 글자 없음.
  - 그대로 둔 것: 칩 순서·이름·건수·`aria-pressed`, 그룹 이름, Must-Read 첫 칩, 정렬 옵션, 자리표시 `키워드 검색`, `-my-2`·sticky·배경 클래스, `searchInputRef`, props (`page.tsx` 불변).

## 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (추가만: 새 `describe` 1개, it 8개(each 포함), import 에 `act`)

## 검사 결과
### 먼저 실패하는 테스트 (커밋 `8abeea7`, 구현 전)
`pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx` — 6 실패 / 13 통과:
- ① `expected 0 to be greater than 0` — 기본 선택자가 줄 안의 `Must-Read` 를 골라 줄이 움직이지 않음.
- ② `expected <input id="field-_r_r_" …> to be <input id="field-_r_o_" …>` — 폭마다 다른 트리라 검색 입력이 다시 마운트됨.
- ③ 360px, 1024px: `expected false to be true` — 360 은 검색이 카테고리보다 앞(`sm` 트리), 1024 는 정렬이 검색보다 앞(`md` 트리).
- ④ 360px, 1024px: `expected <div data-toolbar-row …> to be <div data-toolbar-row …>` — 360 은 검색이 혼자 한 줄, 1024 는 카테고리와 정렬이 같은 줄.
- ③·④ 1440px 는 통과 — 옛 `xl` 트리도 같은 순서·줄이라 회귀 방지, 실패 예상 아님.

### 구현 뒤 (커밋 `1fde9c8`)
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx`:
  ```
   Test Files  8 passed (8)
        Tests  80 passed (80)
  ```
  기존 `FeedToolbar.test.tsx` 단언은 모두 그대로 통과했다 (기존 블록 수정 없음).
- R33 정적 확인 (저장소 루트) `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음, `rg exit 1`.
- `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/tests/feed/FeedToolbar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
- `pnpm test`: `Test Files  50 passed (50)` / `Tests  576 passed (576)`.

### 배치 증거 인용 (jsdom 은 하이드레이션·배치를 재지 않는다)
- 리뷰 Nit 1 의 코드 줄 (구현 전 `FeedToolbar.tsx`): `:67-81` `useToolbarLayout` 가 `useMediaQuery('(max-width: 767px)')`·`('(min-width: 768px) and (max-width: 1279px)')` 로 `sm`/`md`/`xl` 을 고름, `:154-158` 폭별 검색 폼 클래스 표, `:226` 폭별 정렬 클래스, `:236-268` 폭마다 다른 `ToolbarRow` 트리. 서버·하이드레이션 첫 렌더는 미디어 쿼리가 false 라 `xl` 트리였고, 768~1279 에서는 하이드레이션 뒤 `md` 트리로 바뀌어 정렬·검색이 줄을 바꿨다(배치 이동). 폭이 경계를 넘을 때마다 검색 입력·스크롤 줄이 다른 부모로 다시 마운트되어 포커스·가상 키보드·`scrollLeft` 를 잃었다 (② 실패가 jsdom 쪽 증거). 프로덕션 배치 확인은 36 의 5개 폭 측정과 verify 의 Chrome 확인.

## 결정
- 관문 G8 의 30 self-test 전에 메인 세션 판단으로 시작했다 (30 은 `frontend/scripts` 만 고친다).
- 줄 A 의 카테고리는 plan 대로 `min-w-0 flex-1`. 768 미만 세로 쌓기(`flex-col`)에서 `flex-1`(`flex-basis: 0%`)은 높이가 정해지지 않은 열이라 내용 높이로 잡히고, 너비는 `items-stretch` 로 전체 폭이 된다.
- 테스트 도우미는 기존 360 블록의 목을 고치지 않고 새 `describe` 안에 따로 두었다 (리뷰 후속 공통 규칙). `scrollLeft` 는 jsdom 이 저장하지 않아 `ChipGroup.test.tsx` 처럼 WeakMap 목으로 둔다.

## 막힌 점
- 없음.

## 다음
- 관문 G9 (메인 세션). 위험 1위 단계라 36 의 측정에서 1024 줄 A(여유 약 5px)의 `scrollRow`, 768 미만 세로 쌓기의 R3·`clip`, `vRhythm`·R5, `md:w-48` 검색 `placeholder` 를 본다.

## 후속 (보정 3)
spec 보정 3(`2034bcc`, 14.13)·plan 보정 3(`9ac4ae1`) '34 E 후속'. 31 B 후속 3(`d95c057`: 768 미만 양쪽 넘침 표시, `bleed="start"` 줄 클래스가 넘침 상태별로 달라짐, 모든 상태 `scroll-px-6`) 뒤.

### 한 일
- `FeedToolbar.test.tsx:142` 를 '증명' 표(spec 14.13)대로 `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` 로 바꿨다. `:143-144` 는 그대로.
- 3차 360 블록(`describe('FeedToolbar — 768 미만 소스 줄 넘침 표시 (spec 14.3, 3차: ScrollRow 공통 표시)')`)에 새 `it` 를 더했다: 360 + 넘침 목에서 소스 줄 `scrollLeft` 를 150 으로 옮겨 `data-overflow="both"` 일 때 같은 `[data-toolbar-row]` 안에 `data-overflow-hint="start"`·`"end"` 가 하나씩, 둘 다 `aria-hidden`·그룹 밖, 순서 `start` → `소스` 그룹 → `end` → 정렬, `start` 에 `max-md:-ml-4`, `end` 에 `max-md:-mr-4` 없음 (정렬 밑으로 늘이지 않음). `scrollLeft` 저장 목은 이 `it` 안에서만 두고 `finally` 에서 지운다 (기존 블록의 목·`afterEach` 불변).
- `FeedToolbar.tsx` 는 바꾸지 않았다: `bleed="start"`·`selectedSelector` 그대로에서 새 단언이 통과한다 (spec 14.13 예상대로).

### 바꾼 파일
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (`:142` 1곳 변경 + 새 `it` 1개)

### 검사 결과
- 단언을 바꾸기 전 (31 후속 3 의 클래스 변경 때문에 실패하는 증거) `pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx` — 1 실패 / 18 통과:
  ```
  × bleeds the source row to the left edge only, so it does not slide under the sort select
  Error: expect(element).toHaveClass("max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4")
  Expected the element to have class:
    max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4
  Received:
    flex min-w-0 flex-1 flex-nowrap items-center gap-2 snap-x scroll-px-6 overflow-x-auto overscroll-x-contain -my-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:-ml-4 max-md:pl-4
   ❯ src/tests/feed/FeedToolbar.test.tsx:142:23
  ```
- 새 단언(360 `both` 양쪽 표시)은 31 후속 3 구현에 기대는 회귀 방지라 쓰자마자 통과했다 (실패 예상 아님).
- 커밋 `9f30e2a` 뒤:
  - 끝 기준 `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx`: `Test Files  8 passed (8)` / `Tests  93 passed (93)` (예외 없음).
  - `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음, `rg exit 1`.
  - `pnpm exec eslint src/tests/feed/FeedToolbar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
  - `pnpm test`: `Test Files  50 passed (50)` / `Tests  589 passed (589)`.

### 결정
- 새 단언에 위치·`aria-hidden` 외에 `start` 의 `max-md:-ml-4`, `end` 에 `max-md:-mr-4` 없음을 더했다. 툴바 쪽에서 의미 있는 배치(왼쪽 화면 끝은 왼쪽 표시가 쓰고, 오른쪽 표시는 정렬 선택창과 겹치지 않음)라서다. `-mr-1`·`-ml-1`·`data-overflow-slot` 같은 `ScrollRow` 내부 세부는 `ChipGroup.test.tsx`(31 B) 몫이라 넣지 않았다.

### 다음
- 관문 G11 (메인 세션), 36 재측정 4.

## 후속 2 (주석 정리)
37 문서 작업에서 메인 세션이 찾은 것: `FeedToolbar.tsx` 소스 줄 주석이 "넘침 표시(768 미만 ›, …)" 로 오른쪽 표시만 말했다. 지금 동작은 31 후속 3(`d95c057`)대로 `ScrollRow` 가 768 미만에서 넘친 쪽마다 ‹·› 를 둔다.

### 한 일
- 파일 머리 JSDoc 에 넘침 표시 설명을 더했다: 두 칩 줄은 `ScrollRow`, 768 이상은 넘친 쪽 스크롤 버튼, 768 미만은 넘친 쪽마다 줄 밖 장식 표시(왼쪽 ‹, 오른쪽 ›), 화면 끝까지 늘인 쪽에 표시가 생기면 그 끝 여백은 표시가 쓴다. 폭별 표(줄 A·B)는 지금 배치와 같아 그대로 두었다.
- 소스 줄 주석: 왼쪽으로 넘치면(start·both) 왼쪽 끝 여백은 ‹ 표시가, 오른쪽으로 넘치면(end·both) › 표시가 정렬 앞에 온다. "넘침 표시(768 미만 양쪽 ‹·›, 768 이상 스크롤 버튼)는 ScrollRow 공통" 으로 고쳤다.
- 코드 동작 변경 없음 (주석만이라 실패 테스트 없음). 다른 주석(카테고리·라벨·자리표시·`-my-2`·줄 A 세로 쌓기·선택 칩)은 지금 동작과 같아 그대로다.

### 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx` (주석만)

### 검사 결과 (커밋 `4b0c2a9`)
- `pnpm test`: `Test Files  50 passed (50)` / `Tests  589 passed (589)`.
- `pnpm exec eslint src/components/feed/FeedToolbar.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
- `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음, `rg exit 1`.

## 후속 3 (보정 5, R34 Must-Read 고정 토글)
제품 오너 결정(2026-11-07)에 따른 spec 보정 5(`e274563`, R34, 14.2 '(보정 5, R34) Must-Read 토글', 14.14)와 plan 보정 5(`8579b59`) '34 E 후속 3'.

### 한 일
- 테스트 (`2d3f760`, 먼저 실패): '증명' 표 보정 5 의 4곳만 표대로 바꿨다 — `:50` 제목을 `shows the Must-Read toggle outside the source group, between the source row and sort, and toggles it` 로, `:52-55` 를 `getByRole('button', { name: 'Must-Read' })` 의 `aria-pressed="false"`·소스 그룹 안에 없음·소스 그룹과 같은 `[data-toolbar-row]` 에서 그룹 뒤·정렬 앞으로, `:57` 소스 칩 글자를 `['전체7', 'GitHub5', 'arXiv2', '북마크2']` 로, `:59` 클릭 대상을 토글로. `:60-61` 콜백 단언은 그대로. 34 블록에 새 `it` 두 개(⑤): 360·1024·1440 에서 DOM 순서 소스 그룹 → Must-Read → 정렬, 그룹 밖, `data-must-read-toggle`, `shrink-0`·`max-md:w-11`, 글자 감싸개 `max-md:sr-only`, 소스 그룹 안 `aria-hidden` `w-px` 구분선 없음 / 360→1440 같은 노드·접근 이름 `Must-Read`·`highSignalOnly: true` 면 `aria-pressed="true"`. 기존 `:404-411`(③) 등 표 밖 단언은 손대지 않았고 모두 통과한다.
- 구현 (`f0315fd`, `FeedToolbar.tsx`): Must-Read `Chip`(`tone="warning"`, 별 아이콘, `title` 그대로, `onClick` 그대로)을 소스 `ChipGroup` 밖, 줄 B 의 소스 그룹과 정렬 사이 형제(`mustReadToggle`)로 옮겼다. `data-must-read-toggle`, `className="shrink-0 max-md:w-11 max-md:justify-center max-md:px-0"`, 글자 `<span className="max-md:sr-only">Must-Read</span>`. 소스 그룹의 구분선을 지웠다 (그룹에는 `전체`·소스·`북마크` `data-source-chip` 만). `selectedSelector`·`bleed="start"` 그대로. 머리 JSDoc 표·DOM 순서 설명·소스 줄 주석을 보정 5 대로 고쳤다 (› 표시는 Must-Read 앞). `Chip.tsx`·`page.tsx`·props 불변.

### 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (표의 4곳 + 새 `it` 2개(each 포함 4케이스))

### 검사 결과
- 구현 전 `pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx` — 4 실패 / 20 통과:
  - `shows the Must-Read toggle outside the source group, …` — `AssertionError: expected <button type="button" …> to be null` (Must-Read 가 소스 그룹 안에서 찾힘).
  - `⑤ places the fixed Must-Read toggle after the source group and before sort at 360px / 1024px / 1440px (R34)` — `expect(element).not.toContainElement(element)` (토글이 그룹 안).
  - `⑤ keeps the same Must-Read node and name across widths and reflects highSignalOnly` 는 통과 — 한 트리(34)라 이미 같은 노드, 회귀 방지(실패 예상 아님).
- 구현 `f0315fd` 뒤:
  - 끝 기준 `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx`: `Test Files  8 passed (8)` / `Tests  97 passed (97)`.
  - `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음(`rg exit 1`). `grep -n "w-px" frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음(`grep exit 1`).
  - `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/tests/feed/FeedToolbar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
  - `pnpm test`: `Test Files  50 passed (50)` / `Tests  593 passed (593)` (그때 작업 트리의 31 미커밋 `ScrollRow.tsx` 포함).

### Chrome 프로덕션 확인 (구현 커밋 `f0315fd`)
- 환경: `git worktree add --detach <scratchpad>/al34 f0315fd` → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8121 INTERNAL_API_URL=http://127.0.0.1:8121 pnpm build`(성공) → standalone `PORT=3121`. backend 는 `backend/agentlens.db` 의 `sqlite3 .backup` 복사본을 `DATABASE_URL` 로 주어 127.0.0.1:8121 (기사 4734건, 소스 5종 건수 있음). Chrome(puppeteer-core, headless, 라이트), `/` `networkidle0` + 카드 대기 뒤 처음 상태를 재고, 검색 입력에서 Tab 을 눌러 정렬 선택창까지 순서를 적었다. 끝난 뒤 3121·8121 을 끄고 worktree·DB 복사본을 지웠다. 루트 `config.json`·`sources.json` 변경 없음 (`git status` 확인).
- 처음 상태 Must-Read 토글 (`[data-must-read-toggle]` 1개, 모두 소스 그룹 밖):

  | 폭 | rect (크기) | 화면 안 | 툴바 안 | 가운데 점이 토글 | 글자 | 소스 줄 오른쪽 / 정렬 왼쪽 | 소스 줄 scrollLeft · 첫 칩 · 넘침 | 문서 scrollWidth |
  |---|---|---|---|---|---|---|---|---|
  | 360×780 | L180 R224 T232 B276 (44×44) | 예 | 예 | 예 | 별만 (글자 sr-only) | 156 / 232 (사이에 `›` 156~172) | 0 · 전체4734 · end | 360 |
  | 390×844 | L210 R254 T232 B276 (44×44) | 예 | 예 | 예 | 별만 | 186 / 262 (`›` 186~202) | 0 · 전체4734 · end | 390 |
  | 768×1024 | L495.4 R616 T190 B222 (121×32) | 예 | 예 | 예 | 별 + 글자 | 443 / 632 | 0 · 전체4734 · end | 768 |
  | 1024×768 | L743.4 R864 T190 B222 (121×32) | 예 | 예 | 예 | 별 + 글자 | 691 / 880 | 0 · 전체4734 · end | 1024 |
  | 1440×900 | L1063.4 R1184 T190 B222 (121×32) | 예 | 예 | 예 | 별 + 글자 | 1047 / 1200 | 0 · 전체4734 · none | 1440 |
- Tab 순서 (검색 입력 다음부터): 360·390·1440 = `전체` → `국내 테크` → `GitHub` → `HackerNews` → `HuggingFace` → `Global Blogs` → `북마크` → **Must-Read** → 정렬. 768·1024 = 같은 소스 칩 → `소스 다음 항목 보기`(스크롤 버튼) → **Must-Read** → 정렬. 화면 순서(소스 줄 → 토글 → 정렬)와 같다.
- 스크린샷 (처음 상태 / Tab 뒤): `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad/check34/shots/feed-light-{360x780,390x844,768x1024,1024x768,1440x900}-{initial,after-tab}.png`. 360·390 처음 상태에서 별 토글이 소스 줄(`전체 4734`, `국내 테…` + `›`)과 `인기순` 사이에 보이고, 1024 에서 `Glo…` `›` 버튼 뒤 `☆ Must-Read` 가 보인다. 측정 스크립트: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad/check34/check.mjs`, 원시 결과: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad/check34/result.json`.

### 결정
- 새 ⑤ 단언의 구분선 판정은 '소스 그룹 안 `aria-hidden="true"` 이면서 `w-px` 클래스' 로 했다 (`ScrollRow` 의 넘침 표시도 `aria-hidden` 이라 클래스로 구분).
- 360·390 의 소스 줄은 이제 약 156·186px 로 좁다 (토글 44 + 간격). 처음 상태 `scrollLeft` 0, 첫 칩 `전체` 로 spec 14.2 폭 계산과 같다.

### 다음
- 관문 G13 (메인 세션), 36 재측정 5 (`checks.scrollRow.toolbar.mustReadVisible`).
