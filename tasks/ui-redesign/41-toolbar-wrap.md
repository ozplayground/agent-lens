# Task 41: FeedToolbar 768 미만 줄 B 줄바꿈

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 41 (보정 7)
Status: done
Session: main
Agent: a2cd41bc978ebd13f (implementer E)
Updated: 2026-11-07

## 한 일
- 먼저 실패하는 테스트 (`214fabe`, `FeedToolbar.test.tsx`): plan '보정 7 에서 바뀌는 기존 단언' 표의 줄만 표대로 바꿨다.
  - 표 `:145` 제목 (지금 파일 `:144`): `bleeds the source row to both edges below 768px and wraps Must-Read and sort onto the next line`.
  - 표 `:148` (지금 `:147`): `toHaveClass('max-md:-mx-4', 'max-md:px-4', 'scroll-px-6')`.
  - 표 `:149-150`: `not.toHaveClass('max-md:-mx-4')`·`not.toHaveClass('max-md:-mr-4')` 를 줄 B `max-md:flex-wrap`, 소스 그룹을 담은 줄 B 직접 자식 `max-md:basis-full`, Must-Read `max-md:ml-auto` 단언으로. `:152-156` 은 그대로.
  - 표 `:263-265`: 주석을 '오른쪽 표시도 화면 끝 여백을 쓴다 (소스 줄이 한 줄을 다 쓴다)' 로, `expect(end).toHaveClass('max-md:-mr-4')`. `:264`(`start` 의 `max-md:-ml-4`) 그대로.
  - 새 단언 (같은 `describe` 에 새 `it`): 줄 B·소스 감싸개·Must-Read 에 768 이상 클래스(`flex-wrap`/`md:flex-wrap`, `basis-full`/`md:basis-full`, `ml-auto`/`md:ml-auto`)가 없음.
- 구현 (`705a151`, `FeedToolbar.tsx`):
  - 줄 B `ToolbarRow` 에 `max-md:flex-wrap`, 소스 `ChipGroup`(바깥 감싸개 = 줄 B 직접 자식) `className` 에 `max-md:basis-full`, Must-Read 토글에 `max-md:ml-auto`.
  - 소스 `ChipGroup` 의 `bleed` 를 `'start'` 에서 `true` 로. 소스 줄 주석을 '768 미만: 한 줄을 다 쓰고 화면 좌우 끝까지, Must-Read·정렬은 다음 줄, 넘친 쪽 끝 여백은 ‹·› 표시' 로 고쳤다.
  - `ALL_CATEGORY_LABEL` 지역 상수와 그 주석을 지우고 `@/lib/labels` 에서 import (39 `cd2f1f3`). `feedCategoryLabel` 동작·내보내기 그대로.
  - 파일 머리 JSDoc 표의 <768 줄 B 를 '줄 B 안 두 줄: 소스(화면 좌우 끝까지, 한 줄 다) / 오른쪽 정렬로 Must-Read(별만, 44×44) + 정렬 `w-28`' 로. 줄 B 에 주석 한 줄.
  - 768 이상 클래스, DOM·`data-toolbar-row`·Tab 순서(카테고리 → 검색 → 소스 → Must-Read → 정렬) 그대로. `order`·`*-reverse` 없음.

## 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (표의 줄 변경 + 새 `it` 1개)

## 검사 결과
### 먼저 실패하는 테스트 (커밋 `214fabe`, 구현 전)
`pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx` — 2 실패 / 23 통과:
- `bleeds the source row to both edges below 768px and wraps Must-Read and sort onto the next line` — `expect(element).toHaveClass("max-md:-mx-4 max-md:px-4 scroll-px-6")` 실패 (소스 줄이 `max-md:-ml-4`·`max-md:pl-4`, 왼쪽만 bleed). 이어지는 줄 B `max-md:flex-wrap` 단언도 구현 전에는 없다.
- `shows hints on both sides of the source row when it overflows both ways …` — `expect(element).toHaveClass("max-md:-mr-4")` 실패 (오른쪽 표시에 `max-md:-mr-4` 없음).
- 새 `keeps the 768px+ row B unchanged …` 는 통과 — 회귀 방지, 실패 예상 아님.

### 구현 뒤 (커밋 `705a151`)
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx`:
  ```
   Test Files  8 passed (8)
        Tests  104 passed (104)
  ```
  표 밖 단언(`:152-156`, 360 블록 `:209-223`, ③·④·⑤ 순서·묶음, R34 토글 단언)은 모두 그대로 통과했다.
- `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음(`rg exit 1`). `grep -n "const ALL_CATEGORY_LABEL" frontend/src/components/feed/FeedToolbar.tsx`: 출력 없음(`grep exit 1`).
- `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/tests/feed/FeedToolbar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`. `pnpm lint`: `✖ 41 problems (0 errors, 41 warnings)`, 종료 0.
- 전체 `pnpm test`: `Test Files  5 failed | 45 passed (50)` / `Tests  10 failed | 612 passed (622)`. 실패 10건은 모두 `tests/chat/` 의 `ChatHeader`·`ChatSidebar`·`ChatWorkspace`·`FocusBottomSheet`·`FocusCapsule` 테스트다. 그때 작업 트리에서 42 F 가 커밋하지 않은 채 고치던 테스트 파일이고(`git status` 에 `M frontend/src/tests/chat/*.test.tsx`), 41 파일과 무관하다 (병렬 단계 끝 검사 규칙대로 적기만 한다). `tests/feed` 는 실패 0.

### 배치 증거 인용 (jsdom 은 배치를 재지 않는다)
- spec 14.15 F1 행: "툴바 줄 B 의 소스 칩 줄이 칩 1.5개 폭이다 (`feed-light-360x780.png`: `전체 4734` 와 `국내…` 일부만 보임, `feed-dark-390x844.png` 같음) | `FeedToolbar.tsx:247-251` 줄 B 가 768 미만에서도 한 줄이라 소스 줄이 Must-Read 토글(44px)·정렬(`w-28` 112px)과 폭을 나눈다. 14.2 폭 계산으로 360 소스 상자 156px(+ 왼쪽 `bleed` 16)". 34 후속 3 의 Chrome 확인도 같다 (360 소스 줄 오른쪽 156px, 390 186px).
- 38 사전 측정의 360·390 `toolbarLayout` 실패는 이 단계를 끝낼 때 `tasks/ui-redesign/38-audit-r35-r40.md` 에 아직 없었다 (38 진행 중). 고친 뒤 확인은 43 의 `toolbarLayout`·R5·R3·`vRhythm`·`mustReadVisible` 과 육안 확인.

## 결정
- G17 통과(39 `cd2f1f3`) 뒤 메인 세션 지시로 시작했다. 40·42 와 병렬, 그 파일은 건드리지 않았다.
- 표의 줄 번호는 plan 작성 때 기준이라 지금 파일과 1줄 어긋난다 (`:145` → `:144`, `:148` → `:147`). 내용으로 맞춰 바꿨다.
- 소스 그룹 감싸개는 `ChipGroup` 이 `className` 을 붙이는 `ScrollRow` 바깥 감싸개(줄 B 직접 자식)다. 테스트는 '줄 B 직접 자식 중 소스 그룹을 담은 것' 으로 찾는다.
- 줄 B 의 두 줄 사이 간격은 `ToolbarRow` 의 `gap-2`(행 간격 8px)를 그대로 쓴다.

## 막힌 점
- 없음 (표 밖 단언 깨짐 없음).

## 다음
- 관문 G18 (메인 세션), 43 측정에서 360·390 `toolbarLayout`·R5(390×844 첫 화면 카드 제목)·`vRhythm`·R3·`mustReadVisible`(줄 B 둘째 줄의 토글) 확인.
