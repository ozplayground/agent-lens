# Task 31: 스크롤 버튼 포커스 유지, ChipGroup selectedSelector

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 31 (리뷰 후속)
Status: done
Session: main
Agent: a49602194c070f0b6 (implementer B)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트: `tests/ui/ChipGroup.test.tsx` 에 새 도우미 `categoriesTree()` 와 describe 2개(①~④)를 더했다 (기존 단언·도우미 불변). `ChipGroup` 에 `selectedSelector?` 타입만 두는 빈 구현과 함께 커밋 (fb2a3a3).
- `ScrollRow.tsx`: 이전·다음 버튼 ref 두 개와 포커스를 가진 버튼 ref(`'prev' | 'next' | null`, 상태 아님). 버튼 `onFocus` 에서 설정, `onBlur` 는 `queueMicrotask` 뒤 그 버튼이 아직 문서에 있을 때만 지움. `useLayoutEffect`(의존 `showPrev`, `showNext`, `selectedSelector`)에서 기억한 버튼이 렌더되지 않으면 ref 를 지우고, `document.activeElement` 가 `body`·`null`·끊긴 요소일 때만 ① 반대쪽 버튼 ② 줄 안 `selectedSelector` 자식 ③ 줄의 첫 포커스 가능 요소(`button:not([disabled])`, `[href]`, `input`/`select`/`textarea:not([disabled])`, `[tabindex]:not([tabindex="-1"])`) 순으로 `focus({ preventScroll: true })`. 버튼은 지금처럼 넘친 쪽에만 렌더. 상태 갱신 추가 없음. 컴포넌트 JSDoc 에 포커스 유지 순서를 적었다. 넘침 표시·`bleed`·선택 자식 보이기 effect 는 그대로.
- `Chip.tsx`: `ChipGroup` 이 `selectedSelector?` 를 받아 `scrollable` 이면 `ScrollRow` 로 넘긴다 (주지 않으면 넘기지 않아 기본값). `Chip` 은 그대로.
- 구현 커밋 f2bad54.
## 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (추가만, fb2a3a3)
- `frontend/src/components/ui/Chip.tsx` (타입 fb2a3a3, 전달 f2bad54)
- `frontend/src/components/ui/ScrollRow.tsx` (f2bad54)
## 검사 결과
### 먼저 실패 (fb2a3a3)
`cd frontend && pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 3 failed | 21 passed (24)`
- ① `AssertionError: expected <body><div>…(1)</div></body> to be <button type="button" …(3)>…(1)</button>` (다음 버튼이 빠지며 포커스가 body)
- ② `AssertionError: expected <body><div>…(1)</div></body> to be <button type="button" …(2)></button>` (두 버튼이 빠지며 body, 기대는 선택 칩 `MCP`)
- ④ `AssertionError: expected 0 to be greater than 0` (기본 선택자가 줄 안 `Must-Read` 를 고름)
- ③ 회귀 방지는 실패 예상 아님, 통과.

### 구현 뒤
- 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` → `Test Files 31 passed (31)`, `Tests 326 passed (326)` (`ChipGroup.test.tsx:176,188`, `Tabs.test.tsx:249` 포함 기존 단언 그대로 통과)
- `pnpm test` → `Test Files 50 passed (50)`, `Tests 567 passed (567)`
- `pnpm exec eslint src/components/ui/ScrollRow.tsx src/components/ui/Chip.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
- `pnpm exec tsc --noEmit` → 종료 0
## 결정
- 포커스·블러 핸들러를 `(which) => ({ onFocus, onBlur })` 팩토리로 만들면 `react-hooks/refs` 가 '렌더 중 ref 접근' 오류를 낸다. 핸들러 안에서 `event.currentTarget === prevButtonRef.current` 로 어느 버튼인지 가린다.
- 기억한 버튼이 사라졌지만 사용자가 이미 다른 요소에 포커스를 둔 경우(blur 마이크로태스크 전에 effect 가 도는 경우 포함)에도 ref 는 지우고 포커스는 건드리지 않는다.
- `selectedSelector` 를 effect 의존에 넣었다 (값이 바뀌면 다음 대상 선택에 쓰임. 버튼 표시 여부가 같으면 기억한 버튼이 그대로라 아무것도 하지 않는다).
- 실제 Chrome 의 포커스 정리 시점은 jsdom 으로 시험할 수 없다 (spec 우려 21). verify 에서 1024 피드 `카테고리 다음 항목 보기` 를 키보드로 끝까지 눌러 확인해야 한다.
## 막힌 점
- 없음.
## 다음
- 관문 G8 (메인 세션). 34 E 는 소스 줄에 `selectedSelector='[data-source-chip][aria-pressed="true"]'` 와 소스 칩 `data-source-chip` 을 쓴다.
- verify: Chrome 에서 키보드 포커스 유지 확인 (우려 21).

## 후속 (36 육안 확인: 360 소스 줄 선택 칩 잘림)
메인 세션 요청. 36 측정의 `feed-light-360x780.png` 소스 줄에서 선택 칩 `전체 4734` 가 `전체 4` 까지만 보이고 `›` 가 붙음 (R15 '선택 칩 전체가 보이게' 위반).

### 원인
1. 선택 칩 보이기가 선택 요소가 바뀔 때만 돌았다. 건수가 늦게 들어와 칩이 커지거나, 넘침 표시(`›`)가 나타나 줄이 약 20px 좁아져도 다시 보이게 하지 않았다.
2. '보임' 판정에 넘친 쪽 흐림 24px 를 넣지 않았다 (줄 끝 흐림 안에 걸린 칩을 보인다고 봄).
3. Chrome 실측 (scratchpad `snap/check.mjs`·`check2.mjs`, puppeteer-core + Chrome): 줄의 `snap-x`(proximity)가 프로그램으로 둔 `scrollLeft` 를 가까운 칩 시작으로 다시 옮긴다 — 20 → 0, 67 → 129. 작은 이동은 0 으로 되돌아가 칩이 잘린 채 남는다. `style.scrollSnapType = 'none'` 으로 두고 값을 둔 뒤 바로 되돌리면 20·67 이 그대로이고 폭이 바뀐 뒤에도 유지된다.

### 한 일
- `revealInRow`: 칩을 줄 상자 양 끝 24px 를 뺀 범위에 넣는다 (칩이 더 넓으면 왼쪽 맞춤). 목표값을 `[0, scrollWidth - clientWidth]` 로 자르고 같으면 쓰지 않는다. 값을 두는 동안만 `scroll-snap-type: none`.
- 매 렌더 effect: 선택 자식이 바뀌면 늘 보이게 하고 '사용자 스크롤' 기억을 지운다. `overflow`·`showButtons`(넘침 표시·버튼으로 줄 폭이 바뀜)가 바뀌면 사용자가 줄을 움직이지 않았을 때만 다시 보이게 한다.
- 마운트 effect: `scroll` 에서 이 부품이 마지막으로 둔 값과 1px 넘게 다르면 사용자 스크롤로 기억한다 (손가락·휠·스크롤 버튼·포커스 `scrollIntoView` 모두 포함). `ResizeObserver`(줄과 자식, `MutationObserver` 로 자식이 바뀌면 다시 관찰)가 알리면 사용자 스크롤이 없을 때 다시 보이게 한다. `ResizeObserver` 가 없으면(jsdom) 관찰 없이 동작. 상태 갱신 없음. `useScrollOverflow.ts` 는 바꾸지 않았다.

### 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (추가만: 도우미 `mockScrollingRects`·`expectChipInsideRow`, describe 2개 — 1cabd27, d90fc1c)
- `frontend/src/components/ui/ScrollRow.tsx` (32241d8)

### 검사 결과
- 먼저 실패 1 (1cabd27, 그때 HEAD 코드): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 2 failed | 25 passed (27)`
  - 넘침 표시 뒤: `AssertionError: expected 290 to be less than or equal to 256`
  - 칩이 커진 뒤: `AssertionError: expected 300 to be less than or equal to 276`
  - 사용자 스크롤 뒤 끌어오지 않음·새 선택은 보이게: 회귀 방지, 통과
- 먼저 실패 2 (d90fc1c, 스냅 끄기 없는 미커밋 구현): `Tests 1 failed | 27 passed (28)` — `AssertionError: expected [ '' ] to deeply equal [ 'none' ]`
- 구현 중 발견: jsdom 은 목 없는 줄에서 `scrollLeft` 를 음수로도 받아 둔다. 흐림 범위 판정이 0 위치 칩을 -24 로 밀어 `FeedToolbar.test.tsx` 360 블록이 `data-overflow="both"` 로 실패했다. 실제 브라우저처럼 목표값을 직접 자르게 고쳐 통과 (테스트 불변).
- 구현 뒤 (32241d8):
  - 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` → `Test Files 31 passed (31)`, `Tests 338 passed (338)`
  - `pnpm test` → `Test Files 50 passed (50)`, `Tests 580 passed (580)`
  - `pnpm exec eslint src/components/ui/ScrollRow.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
  - `pnpm exec tsc --noEmit` → 종료 0

### 결정
- 스냅(`snap-x`)은 spec 214행(1차 표)에 있어 지우지 않고, 이 부품이 값을 둘 때만 끈다.
- '사용자 스크롤' 은 입력 이벤트 대신 '이 부품이 둔 값과 다른 `scroll`' 로 판정한다 (휠·터치·트랙패드·스크롤 버튼·포커스를 모두 잡고, 스냅이 위치를 옮긴 경우에도 더 끌어오지 않아 서로 다투지 않는다).

### 다음
- 36 재측정에서 360·390 소스 줄의 선택 칩이 흐림 밖에 다 보이는지 확인. 실제 컴포넌트를 Chrome 으로 띄워 보지는 않았다 (scratchpad 실측은 스냅 동작만).

## 후속 2 (36 재측정 2: 선택 칩 잘림 그대로)
메인 세션 요청. 36 '재측정 2'(0ca3226)에서 HEAD 562327b 도 360·390 피드 소스 줄 선택 칩 `전체 4734` 잘림 8건이 그대로였다 (`scrollLeft` 0.3~4초 내내 0).

### 원인
- A 가 실제 페이지에서 확인: `revealInRow` 가 스냅을 끄고 `scrollLeft = 61` 을 둔 뒤 되돌리는 순간 Chrome 이 가장 가까운 스냅 위치(0, `전체` 칩 스냅 위치 약 138 보다 가까움)로 동기적으로 다시 맞춘다.
- 후속 1 의 실측이 틀렸다: scratchpad `check2.mjs` 는 `scroll-snap-type` 을 **인라인 스타일**로 줬기 때문에 `style.scrollSnapType = ''` 로 "되돌리면" 스냅 자체가 사라져 위치가 남은 것처럼 보였다. 앱은 스냅이 클래스(`snap-x`)라 되돌리면 스냅이 살아난다. 그 결과로 쓴 주석('Chrome 은 되돌린 뒤에도 위치를 유지한다')도 틀렸다 → 고쳤다.
- jsdom 은 스냅을 계산하지 않아 단위 테스트가 잡지 못했다.

### 한 일
- `revealInRow` 를 고쳤다. 줄의 계산된 `scroll-snap-type` 이 가로(`x`·`inline`·`both`)면 자식의 `scroll-snap-align`(가로 값: `start`·`end`·`center`)과 줄의 `scroll-padding-left/right` 로 스냅 위치를 구해 `[0, scrollWidth - clientWidth]` 로 자른다. 목표는 그 가운데 고른다: ① 흐림 24px 밖에 칩이 다 드는 위치 ② (지금 위치가 보이는 상자 안이면 그대로) 보이는 상자 안에 다 드는 위치 ③ 칩 자신의 스냅 위치. 여럿이면 지금 위치에 가장 가까운 것. 스냅 없는 줄은 이전 계산 그대로.
- 값을 둘 때 스냅을 잠시 끄는 코드는 남겼다 (d90fc1c 의 기존 단언 불변). 목표가 스냅 위치라 되돌려도 그대로 남는다. 주석을 사실대로 고쳤다.
- spec 214행 `snap-x` 규칙은 바꾸지 않았다.

### 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (추가만: 도우미 `mockSnapStyles`, describe 1개 — 380c035)
- `frontend/src/components/ui/ScrollRow.tsx` (ae1f53d)

### 검사 결과
- 먼저 실패 (380c035, 그때 HEAD 코드): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 2 failed | 28 passed (30)`
  - `AssertionError: expected 47 to be 102 // Object.is equality` (스냅 위치가 아닌 중간값)
  - `AssertionError: expected 97 to be 102 // Object.is equality`
- 구현 뒤 (ae1f53d):
  - 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` → `Test Files 31 passed (31)`, `Tests 340 passed (340)`
  - `pnpm test` → `Test Files 50 passed (50)`, `Tests 582 passed (582)`
  - `pnpm exec eslint src/components/ui/ScrollRow.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
  - `pnpm exec tsc --noEmit` → 종료 0

### Chrome 확인 (실제 프로덕션 빌드)
- 환경: `git worktree add --detach <scratchpad>/al-31 HEAD`(380c035) 에 미커밋 `ScrollRow.tsx` 를 복사 → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8112 INTERNAL_API_URL=http://127.0.0.1:8112 pnpm build`(성공) → standalone `PORT=3111`. backend 는 `backend/agentlens.db` 의 scratchpad 복사본(`DATABASE_URL=sqlite+aiosqlite:///…`)으로 127.0.0.1:8112. 측정 뒤 서버 둘을 끄고 worktree·DB 복사본을 지웠다. 루트 `config.json`·`sources.json` 변경 없음.
- 스크립트: scratchpad `snap/real.mjs` (puppeteer-core, `networkidle0` 뒤 선택 칩이 있을 때 t=0, 이후 1·2·4초. `box` 는 줄의 패딩 상자, `clearOfFades` 는 넘친 쪽 24px 를 뺀 범위)
```
360 t=0s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,204],"inside":true,"clearOfFades":false}
360 t=1s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,204],"inside":true,"clearOfFades":false}
360 t=2s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,204],"inside":true,"clearOfFades":false}
360 t=4s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,204],"inside":true,"clearOfFades":false}
390 t=0s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,234],"inside":true,"clearOfFades":false}
390 t=1s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,234],"inside":true,"clearOfFades":false}
390 t=2s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,234],"inside":true,"clearOfFades":false}
390 t=4s {"label":"소스","overflow":"both","scrollLeft":138,"chip":"전체4734","chipRect":[15.6,102.7],"box":[0,234],"inside":true,"clearOfFades":false}
360/390 카테고리: scrollLeft 0, "전체 소식4734" [16,131], box [0,340]/[0,370], inside true, clearOfFades true (0·1·2·4초 같음)
768  소스 scrollLeft 0, 전체 [161.6,248.7] box [24,580] inside true / 카테고리 inside true (0·2초)
1024 소스 scrollLeft 0, 전체 [169.6,256.7] box [32,828] inside true / 카테고리 inside true (0·2초)
1440 소스 scrollLeft 0, 전체 [249.6,336.7] box [112,1184] inside true / 카테고리 inside true (0·2초)
```
- 상호작용 (`snap/interact.mjs`, 360):
```
user scrolled to 0, +2s {"scrollLeft":0,"chip":"전체4734","chipRect":[154,241],"box":[0,204],"inside":false}   ← 사용자가 민 뒤에는 끌어오지 않음 (설계대로)
select last chip, +1s {"scrollLeft":798,"chip":"북마크0","chipRect":[126,224],"box":[0,224],"inside":true}
select last chip, +4s {"scrollLeft":798,"chip":"북마크0","chipRect":[126,224],"box":[0,224],"inside":true}
```
- 스크린샷 (`captureBeyondViewport: false`): scratchpad `snap/feed-360-t0.png`, `feed-360-t4.png`, `feed-390-t0.png`, `feed-390-t4.png`, `feed-360-bookmark.png`. 360 에서 `전체 4734` 가 다 보이고 그 뒤 `국내 테크 45…` 가 흐림 속에 잘려 `›` 와 함께 넘침을 알린다.

### 결정
- 360·390 소스 줄은 `clearOfFades: false` 다. 칩 왼쪽 약 8px 가 왼쪽 흐림(24px)과 겹친다. 스냅 위치에서 흐림 밖에 다 드는 곳이 없어서다. 스냅 위치는 `scroll-pl-4`(16px)로 정해지고 흐림은 24px 라서, 어느 칩을 맨 앞 스냅 위치에 두어도 앞 8px 가 흐림에 든다. 30 의 `scrollRow` 판정(패딩 상자 안)은 통과하는 범위다. 흐림 밖까지 맞추려면 줄의 `scroll-padding` 을 24px 이상으로 바꿔야 하는데, 기존 단언(`max-md:scroll-px-4`, `max-md:scroll-pl-4`)과 spec 14.3 의 `scroll-px-4` 를 바꾸는 일이라 하지 않았다 (필요하면 spec·plan 보정).

### 다음
- 36 재측정 3 에서 360·390 `scrollRow` 선택 칩 판정이 0 건인지 본다.

## 후속 3 (보정 3, spec 14.3 '(보정 3)'·14.13, plan '31 B 후속 3')
메인 세션 요청. 36 재측정 3 육안 확인: 360·390 소스 줄이 처음부터 스크롤돼 `Must-Read` 가 왼쪽에 숨는데 768 미만 표시가 오른쪽에만 있었다. 후속 2 의 스냅 여백 16px 와 흐림 24px 가 달라 선택 칩 왼쪽 약 8px 가 흐림에 겹쳤다.

### 한 일
- `ScrollRow.tsx`
  - 768 미만 넘친 쪽마다 표시: `start` → 줄 앞 형제 `<span aria-hidden data-overflow-hint="start">`(`ChevronLeft`), `end` → 줄 뒤 형제 `data-overflow-hint="end"`(`ChevronRight`), `both` → 둘 다. 클래스 `pointer-events-none flex w-4 shrink-0 items-center justify-center text-fg-subtle [&>svg]:size-4` + 간격 상쇄(왼쪽 `-mr-1`, 오른쪽 `-ml-1`). `absolute` 아님. 768 이상은 표시 없이 버튼 (그대로).
  - `bleed` 쪽별: 표시가 보이는 쪽에 `bleed` 가 있으면 줄은 그쪽을 늘이지 않고 표시가 `max-md:-ml-4`/`max-md:-mr-4` 로 그쪽 페이지 여백을 쓴다. 768 미만 줄 클래스: `none` → `bleed` 그대로(`true` = `max-md:-mx-4 max-md:px-4`, `'start'` = `max-md:-ml-4 max-md:pl-4`), `end` → 왼쪽만, `start` → `true` 면 오른쪽만(`max-md:-mr-4 max-md:pr-4`)·`'start'` 면 없음, `both` → 없음.
  - `bleed` 없는 쪽: 768 미만에서 줄이 넘치는 동안 그쪽이 넘치지 않으면 `<span aria-hidden data-overflow-slot="start|end" class="invisible pointer-events-none w-4 shrink-0 -mr-1|-ml-1">` 자리.
  - 모든 스크롤 줄에 `scroll-px-6`, `bleed` 의 `scroll-px-4`·`scroll-pl-4` 삭제. 후속 2 의 스냅 위치 고르기는 그대로 (계산된 `scroll-padding` 24px 를 받는다).
  - 스크롤 줄에 `data-selected-selector={selectedSelector}`.
  - JSDoc·`bleed` prop 주석을 새 규칙으로 고쳤다. `Chip.tsx` 는 바꾸지 않았다.
- `ChipGroup.test.tsx`: '증명' 표의 4곳(:287, :328, :368, :388-396)을 표대로 바꾸고 도우미 `bleedTree`·`sideMarks`·`scrollTo` 와 새 describe(①~⑥)를 더했다.

### 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (3b0cab5)
- `frontend/src/components/ui/ScrollRow.tsx` (d95c057)

### 검사 결과
- 바뀐 기존 줄 (`git diff -U0 -- frontend/src/tests/ui/ChipGroup.test.tsx | grep -E '^-[^-]'`, 3b0cab5 커밋 전): 표의 다섯 줄뿐
```
-    expect(group.className).toContain('max-md:scroll-px-4');
-    expect(group.className).toContain('max-md:scroll-pl-4');
-    expect(document.querySelectorAll('[data-overflow-hint]')).toHaveLength(1);
-  it('(d) draws no hint at start, none, or at >=768px where the next button shows instead', async () => {
-    expect(document.querySelector('[data-overflow-hint]')).toBeNull();
```
- 먼저 실패 (3b0cab5, 그때 HEAD 코드): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 9 failed | 27 passed (36)`
  - `:287`·`:328`: `expected 'flex min-w-0 flex-1 flex-nowrap items…' to contain 'scroll-px-6'`
  - `:368` (a): `expected …(1) to have a length of 2 but got 1`
  - (d) `start`: `expected  to have a length of 1 but got +0`
  - ①: `expected [ '' ] to deeply equal [ 'end' ]` (표시 값 없음)
  - ②: `expect(element).toHaveClass("max-md:-mr-4 max-md:pr-4")` 실패
  - ③: `expected [] to have a length of 1 but got +0` (자리 없음)
  - ④: `expect(received).toHaveClass()` 실패 (표시 없음)
  - ⑤: `expect(element).toHaveClass("scroll-px-6")` 실패
  - ⑥ (768 이상 버튼만): 회귀 방지, 통과
- 구현 뒤 (d95c057):
  - 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals src/tests/feed` → `Test Files 1 failed | 30 passed (31)`, `Tests 1 failed | 345 passed (346)`. 실패 1건은 예외인 `feed/FeedToolbar.test.tsx:142` (34 E 후속 몫):
```
Expected the element to have class:
  max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4
Received:
  flex min-w-0 flex-1 flex-nowrap items-center gap-2 snap-x scroll-px-6 overflow-x-auto overscroll-x-contain -my-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:-ml-4 max-md:pl-4
 ❯ src/tests/feed/FeedToolbar.test.tsx:142:23
```
  - `pnpm test` → `Test Files 1 failed | 49 passed (50)`, `Tests 1 failed | 587 passed (588)` (같은 1건)
  - `pnpm exec eslint src/components/ui/ScrollRow.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
  - `pnpm exec tsc --noEmit` → 종료 0
  - `grep -nE "scroll-p[lx]-4" frontend/src/components/ui/ScrollRow.tsx` → 출력 없음

### Chrome 확인 (실제 프로덕션 빌드)
- 환경: scratchpad worktree(3b0cab5)에 미커밋 `ScrollRow.tsx` 복사 → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8112 INTERNAL_API_URL=http://127.0.0.1:8112 pnpm build`(성공) → standalone 3111. backend 는 `backend/agentlens.db` scratchpad 복사본으로 8112. 측정 뒤 서버 둘을 끄고 worktree·DB 복사본을 지웠다.
- 스크립트: scratchpad `snap/real3.mjs` (puppeteer-core, `networkidle0` 뒤 선택 칩이 있을 때 t=0, 1·2·4초. `box` = 줄 패딩 상자, `clearOfFades` = 넘친 쪽 24px 를 뺀 범위 안. 스크롤 확인의 `jump` = 첫 소스 칩 화면 x 변화 + `scrollLeft` 변화, 0 이면 칩이 튀지 않음)
```
360 t=0s 소스 {"overflow":"both","scrollLeft":114,"scrollPadding":"24px/24px","selector":"[data-source-chip][aria-pressed=\"true\"]","selected":"전체4734","selRect":[39.6,126.7],"box":[16,208],"insideBox":true,"clearOfFades":true,"hints":["start[0,16]visible","end[208,224]visible"],"slots":[],"mustReadHidden":false,"mustReadRect":[-98,22.6]}
360 t=1s·2s·4s 소스 — 위와 같음
360 카테고리 {"overflow":"end","scrollLeft":0,"scrollPadding":"24px/24px","selected":"전체 소식4734","selRect":[16,131],"box":[0,344],"insideBox":true,"clearOfFades":true,"hints":["end[344,360]visible"],"slots":[]}
360 scroll {"target":0,"from":114,"to":0,"overflow":"end","hints":"end","jump":0,"rowLeftShift":-16,"contentWidth":192}
360 scroll {"target":60,"from":0,"to":60,"overflow":"both","hints":"start,end","jump":0,"rowLeftShift":16,"contentWidth":192}
360 scroll {"target":99999,"from":60,"to":814,"overflow":"start","hints":"start","jump":0,"rowLeftShift":0,"contentWidth":192}
360 scroll {"target":138,"from":814,"to":114,"overflow":"both","hints":"start,end","jump":0,"rowLeftShift":0,"contentWidth":192}
390 t=0s 소스 {"overflow":"both","scrollLeft":114,"scrollPadding":"24px/24px","selected":"전체4734","selRect":[39.6,126.7],"box":[16,238],"insideBox":true,"clearOfFades":true,"hints":["start[0,16]visible","end[238,254]visible"],"slots":[],"mustReadHidden":false,"mustReadRect":[-98,22.6]}
390 t=1s·2s·4s 소스 — 위와 같음
390 카테고리 {"overflow":"end","scrollLeft":0,"selRect":[16,131],"box":[0,374],"insideBox":true,"clearOfFades":true,"hints":["end[374,390]visible"]}
390 scroll {"target":0,"from":114,"to":0,"overflow":"end","hints":"end","jump":0,"rowLeftShift":-16,"contentWidth":222}
390 scroll {"target":60,"from":0,"to":0,"overflow":"end","hints":"end","jump":0,"rowLeftShift":0,"contentWidth":222}
390 scroll {"target":99999,"from":0,"to":784,"overflow":"start","hints":"start","jump":0,"rowLeftShift":16,"contentWidth":222}
390 scroll {"target":138,"from":784,"to":114,"overflow":"both","hints":"start,end","jump":0,"rowLeftShift":0,"contentWidth":222}
```
- 읽는 법: 처음 상태에서 왼쪽 `‹` 표시가 페이지 여백 [0,16]에 보이고 선택 칩 `전체 4734` 가 흐림 24px 밖에 다 보인다 (4초 유지). 스크롤로 넘침 상태가 바뀌어 줄 상자가 16px 옮겨져도(`rowLeftShift` ±16, 표시가 bleed 여백을 넘겨받음) 칩 화면 위치는 스크롤만큼만 움직인다 (`jump` 0). 줄 내용 폭은 192/222 로 그대로다. 390 의 `target 60` 은 proximity 스냅이 0 으로 맞췄다 (사용자 스크롤로 보고 끌어오지 않음).
- `mustReadHidden: false` — `Must-Read` 는 [-98, 22.6] 로 줄 상자(16~)에 약 6.6px 남고 흐림 속이다. `Must-Read` 를 처음 화면에 늘 보이게 하는 배치는 범위 밖(우려 23)이고 왼쪽 `‹` 가 단서다.
- 스크린샷 (`captureBeyondViewport: false`): scratchpad `snap/b3-feed-360-t0.png`(소스 줄 `‹ 전체 4734 국내 테크… ›`), `b3-feed-390-t0.png`, `b3-feed-360-after.png`, `b3-feed-390-after.png`.

### 34 E 에 넘길 것
- `FeedToolbar.test.tsx:142` → `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` (넘치지 않는 상태의 `bleed="start"` 줄). 넘침 상태별 줄 클래스는 위 '한 일' 의 규칙.
- 360 `both` 새 단언에서 찾을 것: 감싸개 안 `[data-overflow-hint="start"]`(그룹 앞, `max-md:-ml-4 -mr-1`)와 `[data-overflow-hint="end"]`(그룹 뒤, `-ml-1`, `bleed="start"` 라 `max-md:-mr-4` 없음), 둘 다 `aria-hidden="true"`. `both` 에서는 `data-overflow-slot` 없음, `start` 에서는 오른쪽에 `data-overflow-slot="end"`.

### 다음
- 34 E 후속(`:142` 와 360 `both` 단언), 관문 G11, 36 재측정 4.

## 후속 4 (reviewer 재리뷰 Nit 2: 사용자 스크롤 판별) — blocked
메인 세션 요청: `ScrollRow.tsx:239-242` 가 `programmaticLeftRef` 와 다른 `scroll` 을 모두 사용자 스크롤로 기록한다. 그래서 브라우저가 `scrollLeft` 를 clamp 하거나 레이아웃 변화 뒤 스냅 위치로 다시 맞춰도 선택 칩 다시 보이기가 멈춘다. 요청 설계는 입력 신호(`pointerdown`·`wheel`·`touchstart`·`keydown`, 스크롤 버튼 클릭, 줄 안 포커스 이동) 뒤에 온 `scroll` 만 사용자 스크롤로 보는 것이다.

### 막힌 점
- **기존 단언과 충돌:** `frontend/src/tests/ui/ChipGroup.test.tsx:608-626` `does not pull the row back after the user scrolled, but still reveals a newly selected chip` 은 `:619` `setScrollLeft(group, 10)`(입력 이벤트 없이 `scrollLeft` 변경 + `fireEvent.scroll`)을 사용자 스크롤로 보고, 크기 변화(`:620-621`) 뒤 `:622` `expect(group.scrollLeft).toBe(10)` 을 단언한다.
  - 요청 설계에서는 이 `scroll` 이 입력 신호 없이 왔으므로 사용자 스크롤이 아니다.
  - 그러면 `triggerResize()` 에서 다시 보이기가 돌아 칩 `에이전트`(내용 [200,300], 화면 [190,290])를 흐림 안 범위(≤276)로 옮기므로 `scrollLeft` 가 10 이 아니게 되어(약 34) `:622` 가 실패한다.
  - 통과시키려면 `:619` 앞에 입력 신호(예: `fireEvent.wheel(group)`)를 더해야 한다. 이는 기존 테스트 변경이라 지시대로 고치지 않았다.
- **spec 문구와의 차이 (보고만):** spec 14.3 (보정 4) 은 "사용자가 직접 스크롤했으면(이 부품이 둔 값과 1px 넘게 다른 `scroll`) 그 위치를 유지" 라고 판별 기준을 지금 구현대로 적고 있다. 요청 설계(입력 신호 뒤의 `scroll` 만)는 이 괄호 정의와 다르다.
- 코드·테스트는 바꾸지 않았다 (이 후속에서 커밋한 코드·테스트 없음).

### 풀 방법 (메인 세션·planner 결정)
1. **요청 설계 그대로:** plan '증명' 의 '리뷰 후속에서 바꾸는 기존 단언' 표에 `ChipGroup.test.tsx:619` 행을 더한다 (전: 입력 없이 `setScrollLeft(group, 10)`, 후: `fireEvent.wheel(group)`(또는 `pointerDown`) 뒤 `setScrollLeft(group, 10)`, `:622` 단언은 그대로). spec 14.3 괄호를 '입력 신호(포인터·휠·터치·키·스크롤 버튼·줄 안 포커스) 뒤에 온 `scroll`' 로 고친다. 재승인 뒤 이어서 한다.
2. **기존 단언을 지키는 대안:** '부품이 둔 값과 다른 `scroll` = 사용자' 는 두되 브라우저 보정으로 설명되는 `scroll` 만 뺀다. 입력 신호가 없고 다음 중 하나면 사용자 스크롤로 보지 않는다.
   - 줄 크기 변화(`ResizeObserver`·넘침 상태 변화) 직후에 온 `scroll`
   - `scrollLeft` 가 새 최댓값으로 clamp 된 `scroll`

   `:619` 는 레이아웃 변화 없이 온 `scroll` 이라 계속 사용자 스크롤이다. spec 괄호 문구와도 조금 다르다 (브라우저 보정 예외를 적어야 한다). 휴리스틱('직후' 의 기준 시간)이 들어간다.
- 어느 쪽이든 결정되면 같은 agent 로 이어서: 실패 테스트(입력 없이 브라우저가 `scrollLeft` 를 바꾼 뒤에도 폭 변화에 선택 칩을 다시 보이게 함) → 커밋 → 구현 → 커밋 → Chrome 확인(360·390 처음 상태 유지, 휠로 민 뒤 끌어오지 않음, 창 폭 변경 시 다시 보임).

### 다음 (blocked 당시)
- 메인 세션이 위 1·2 중 하나를 정한다 (1 이면 plan 표·spec 14.3 보정과 재승인).

### 재개 (2026-11-07, blocked 해소)
- 메인 세션이 1 을 골랐다. spec 보정 5(e274563, 14.3 '(보정 5) 사용자 스크롤 정의' 1~5, R33, 14.14)와 plan 보정 5(8579b59, '31 B 후속 4', '증명' 표의 `ChipGroup.test.tsx:619` 행)가 승인됐다.

### 한 일 (재개)
- `ChipGroup.test.tsx`:
  - 표의 1곳: `:619` 앞에 `fireEvent.wheel(group);` 을 넣었다 (`setScrollLeft(group, 10)`, `:622`·`:624-625` 그대로).
  - import 에 `cleanup` 을 더했다.
  - 새 describe `ScrollRow — user scroll means a scroll after an input signal (보정 5)` ①~④ 를 더했다.
- `ScrollRow.tsx`:
  - 바깥 감싸개 `ref` 에 `pointerdown`·`wheel`·`touchstart`·`keydown` 리스너, 스크롤 버튼 클릭(`scrollPage`), 줄의 `focusin` 이 '사용자 조작 중'(`interactingRef`)을 시작한다. 포커스 유지가 옮긴 포커스는 `programmaticFocusRef` 로 가려 입력이 아니다.
  - '사용자 조작 중' 에 온 `scroll` 중 부품이 둔 값과 1px 넘게 다른 것만 사용자 스크롤(`userScrolledRef = true`, 다음 새 선택 칩까지)이다.
  - '사용자 조작 중' 은 `scrollend` 에서 끝난다. `scrollend` 가 없으면 마지막 `scroll` 뒤 `USER_SCROLL_IDLE_MS`(150), 입력 뒤 `USER_INPUT_TIMEOUT_MS`(1,000) 안에 `scroll` 이 없으면 끝난다. 시간 값은 파일 상단 상수(근거 없는 가정, spec E34·우려 26).
  - 입력 없이 온 `scroll` 은 무시한다. 상태 갱신 없음, 리스너·타이머는 언마운트 때 정리, JSDoc 갱신. 포커스 유지·표시·버튼·스냅 위치 고르기·`data-selected-selector` 는 그대로.

### 바꾼 파일 (재개)
- `frontend/src/tests/ui/ChipGroup.test.tsx` (0a9ea61)
- `frontend/src/components/ui/ScrollRow.tsx` (df1f953)

### 검사 결과 (재개)
- 바뀐 기존 줄: `git diff -U0` 의 `-` 줄은 import 한 줄(`cleanup` 추가)뿐이고 `+    fireEvent.wheel(group);` 이 `:619` 에 들어갔다.
- 먼저 실패 (0a9ea61, 그때 HEAD 코드): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 3 failed | 37 passed (40)`
  - ① `AssertionError: expected 290 to be less than or equal to 276` (입력 없는 `scroll` 을 사용자 스크롤로 보아 다시 보이기가 멈춤)
  - ③ 같은 메시지 (입력 뒤 1,000ms 지난 뒤의 입력 없는 `scroll` 도 사용자 스크롤로 봄)
  - ④ 같은 메시지 — 구현 전에도 실패한다. 포커스 유지 `focusin` 과 상관없이 입력 없는 `scroll` 을 사용자로 보기 때문이다. `focusin` 제외가 없는 새 구현이라면 이 테스트가 그 차이를 잡는다.
  - ② 와 표의 `:619` 변경은 지금 구현에서도 통과 (실패 예상 아님).
- 구현 뒤 (df1f953):
  - 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals src/tests/feed` → `Test Files 31 passed (31)`, `Tests 355 passed (355)`. 표 밖 `setScrollLeft` 12곳을 포함한 기존 단언이 모두 그대로 통과 (우려 26 해당 없음).
  - `pnpm test` → `Test Files 50 passed (50)`, `Tests 597 passed (597)`
  - `pnpm exec eslint src/components/ui/ScrollRow.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
  - `pnpm exec tsc --noEmit` → 종료 0

### Chrome 확인 (재개, 실제 프로덕션 빌드)
- 환경: scratchpad worktree(HEAD 510cfde, 34 후속 3 의 Must-Read 토글 포함)에 미커밋 `ScrollRow.tsx` 를 복사했다. `NEXT_PUBLIC_API_URL=http://localhost:8112 INTERNAL_API_URL=http://127.0.0.1:8112 pnpm build`(성공) → standalone 3111. backend 는 DB 복사본으로 8112. 측정 뒤 서버 둘을 끄고 worktree·DB 복사본을 지웠다.
- 스크립트: scratchpad `snap/real4.mjs`
  - (A) 처음 상태 0·1·2·4초
  - (B) `page.mouse.wheel({ deltaX: 220 })` 뒤 폭 +14px
  - (C) CDP `Input.dispatchTouchEvent` 로 왼쪽 스와이프(touchStart → touchMove 10번 → touchEnd, `hasTouch`) 뒤 폭 +14px
  - (D) 입력 없이 `row.scrollLeft = 200` 뒤 폭 +14px
```
360 A t=0s {"vw":360,"overflow":"end","scrollLeft":0,"selected":"전체4734","selRect":[16,103.1],"box":[0,156],"clearOfFades":true}
360 A t=1s·2s·4s — 같음
360 B after wheel {"vw":360,"overflow":"both","scrollLeft":204,"selRect":[-188,-100.9],"box":[16,156],"clearOfFades":false}
360 B after resize {"vw":374,"overflow":"both","scrollLeft":190,"selRect":[-174,-86.9],"box":[16,170],"clearOfFades":false}
360 C after touch swipe {"vw":360,"overflow":"both","scrollLeft":204,"selRect":[-188,-100.9],"box":[16,156],"clearOfFades":false}
360 C after resize {"vw":374,"overflow":"both","scrollLeft":190,"selRect":[-174,-86.9],"box":[16,170],"clearOfFades":false}
360 D after programmatic scrollLeft=200 (no input) {"vw":360,"overflow":"end","scrollLeft":0,"selRect":[16,103.1],"box":[0,156],"clearOfFades":true}
360 D after resize {"vw":374,"overflow":"end","scrollLeft":0,"selRect":[16,103.1],"box":[0,170],"clearOfFades":true}
390 A t=0s {"vw":390,"overflow":"end","scrollLeft":0,"selected":"전체4734","selRect":[16,103.1],"box":[0,186],"clearOfFades":true}
390 A t=1s·2s·4s — 같음
390 B after wheel {"vw":390,"overflow":"both","scrollLeft":186,"selRect":[-170,-82.9],"box":[16,186],"clearOfFades":false}
390 B after resize {"vw":404,"overflow":"both","scrollLeft":186,"selRect":[-170,-82.9],"box":[16,200],"clearOfFades":false}
390 C after touch swipe {"vw":390,"overflow":"both","scrollLeft":186,"selRect":[-170,-82.9],"box":[16,186],"clearOfFades":false}
390 C after resize {"vw":404,"overflow":"both","scrollLeft":186,"selRect":[-170,-82.9],"box":[16,200],"clearOfFades":false}
390 D after programmatic scrollLeft=200 (no input) {"vw":390,"overflow":"end","scrollLeft":0,"selRect":[16,103.1],"box":[0,186],"clearOfFades":true}
390 D after resize {"vw":404,"overflow":"end","scrollLeft":0,"selRect":[16,103.1],"box":[0,200],"clearOfFades":true}
```
- 읽는 법:
  - (A) 34 후속 3 뒤라 소스 줄 첫 칩이 `전체` 이고 처음 `scrollLeft` 0. 선택 칩이 흐림 밖이고 4초 유지.
  - (B)(C) 휠·터치로 민 위치는 폭을 바꿔도 선택 칩 쪽(0)으로 끌어오지 않는다. 360 의 204 → 190 은 줄이 14px 넓어지며 브라우저가 맞춘 값이다 (입력 없는 `scroll` 이라 사용자 스크롤 기록은 그대로 남고 다시 보이기는 돌지 않는다).
  - (D) 입력 없이 `scrollLeft` 를 바꾸면 사용자 스크롤이 아니다. 넘침 상태가 바뀌는 순간(`end` → `both`, 줄 폭 변화) 선택 칩이 다시 보이게 돌아오고(0), 폭을 바꾼 뒤에도 그대로다.
- 스크린샷 (`captureBeyondViewport: false`): scratchpad `snap/b4-feed-360-t0.png`, `b4-feed-390-t0.png`, `b4-feed-360-D.png`, `b4-feed-390-D.png`.

### 결정 (재개)
- 스크롤 버튼 클릭은 `scrollPage` 안에서 '사용자 조작 중' 을 시작한다 (jsdom·키보드 클릭은 `pointerdown` 이 없을 수 있다). 마우스 클릭은 감싸개 `pointerdown` 으로도 잡힌다.
- `scrollend` 를 지원하는 브라우저(`'onscrollend' in window`)에서는 150ms 타이머를 쓰지 않는다.

### 다음 (재개)
- 관문 G13 (34 후속 3·30 후속 4 와 함께), 36 재측정 5.

## 후속 5 (보정 6, reviewer 최종 확인 Nit 2: 가로 의도 휠만 입력 신호)
메인 세션 요청. spec 보정 6(db97826, 14.3 보정 5-1 '(보정 6)', 14.14 ⑤⑥)과 plan 보정 6(3ddda27, '31 B 후속 5') 그대로.

### 한 일
- `ScrollRow.tsx`:
  - `USER_INPUT_EVENTS` 에서 `wheel` 을 뺐다 (`pointerdown`·`touchstart`·`keydown`).
  - 감싸개에 `wheel` 리스너를 따로 두어 `isHorizontalWheel(event)` = `Math.abs(deltaX) > Math.abs(deltaY) || shiftKey` 일 때만 '사용자 조작 중' 을 시작한다. passive, 언마운트 때 정리.
  - JSDoc 의 입력 신호 줄을 고쳤다. 시간 값·`scrollend`·ref 판정·다른 신호는 그대로.
- `ChipGroup.test.tsx`:
  - 표의 2곳 `:619`·`:950` 의 `fireEvent.wheel(group)` → `fireEvent.wheel(group, { deltaX: 40 })` (단언 값 그대로).
  - 새 describe `ScrollRow — only a horizontal-intent wheel is an input signal (보정 6)` 에 도우미 `setupGrowingRow` 와 ⑤⑥ 을 더했다.

### 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (36991b5)
- `frontend/src/components/ui/ScrollRow.tsx` (766a899)

### 검사 결과
- 바뀐 기존 줄 (`git diff -U0` 의 `-` 줄): `-    fireEvent.wheel(group);`, `-      fireEvent.wheel(group);` 두 줄뿐.
- 먼저 실패 (36991b5, 그때 HEAD 코드): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 1 failed | 41 passed (42)`
  - ⑤ `AssertionError: expected 290 to be less than or equal to 276` (세로 휠도 신호로 세어 그 `scroll` 을 사용자 스크롤로 기록, 다시 보이기 멈춤)
  - ⑥ 과 표의 2곳은 통과 (실패 예상 아님)
- 구현 뒤 (766a899):
  - 끝 기준 `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` → `Test Files 31 passed (31)`, `Tests 357 passed (357)` (표 밖 실패 없음)
  - `pnpm test` → `Test Files 50 passed (50)`, `Tests 599 passed (599)`
  - `pnpm exec eslint src/components/ui/ScrollRow.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0. `pnpm lint` → `0 errors, 41 warnings`
  - `pnpm exec tsc --noEmit` → 종료 0
  - `grep -rn "fireEvent.wheel(group)" frontend/src/tests` → 출력 없음

### Chrome 확인 (실제 프로덕션 빌드)
- 환경:
  - 새 코드: scratchpad worktree(36991b5)에 미커밋 `ScrollRow.tsx` 를 넣고 빌드(성공) → standalone 3111.
  - 비교용 후속 4 코드: 같은 HEAD 그대로 worktree 를 빌드(성공) → 3112.
  - backend 는 `backend/agentlens.db` 복사본으로 8112. 측정 뒤 서버 셋을 끄고 worktree 둘·DB 복사본을 지웠다.
- 스크립트: scratchpad `snap/real5.mjs` (비교는 `real5-old.mjs`)
- ① 가로로 민 소스 줄 위치가 폭 변화에도 남는지 (1024):
```
① 1024 deltaX after wheel {"vw":1024,"overflow":"both","scrollLeft":186,"max":245,"selected":"전체4734","selRect":[-118,-30.9],"box":[68,691],"clearOfFades":false}
① 1024 deltaX after resize -40 {"vw":984,"scrollLeft":186,"max":269,"selRect":[-126,-38.9]}
① 1024 deltaX after resize +40 {"vw":1064,"scrollLeft":186,"max":205,"selRect":[-118,-30.9]}
① 1024 Shift+wheel(puppeteer keyboard Shift + deltaY 200) → pageY 200, 줄 scrollLeft 0 (페이지가 내려감)
① 1024 cdp-shift (dispatchMouseEvent mouseWheel deltaY 150, modifiers 8) → pageY 150, 줄 scrollLeft 0
```
  - 가로 의도 휠(`deltaX`)로 민 위치는 폭을 바꿔도 남는다 (186, 선택 칩 쪽으로 끌어오지 않음).
  - **Shift+세로 휠은 미확인:** 이 환경(macOS headless Chrome)에서는 Shift+세로 휠이 줄을 가로로 밀지 않고 페이지를 내려 확인할 수 없었다. Shift 를 가로 스크롤로 바꾸는 일은 macOS 에서 OS 가 한다. jsdom 의 ⑥(`{ deltaY: 100, shiftKey: true }` 뒤 위치 유지)이 판정 쪽을 증명한다. Windows/Linux Chrome 에서 확인하면 좋다.
- ② 1024, 끝쪽 선택 칩(`Global Blogs`), sticky 툴바 위에 포인터를 두고 세로 휠로 페이지를 내린 직후 폭 변경:
```
새 코드 (3111)
② select, page scrolled to 400 {"vw":1024,"pageY":400,"overflow":"both","scrollLeft":186,"max":245,"selected":"Global Blogs285","selRect":[506.4,644.4],"box":[68,691],"clearOfFades":true}
② after vertical wheel over toolbar {"pageY":800,"scrollLeft":186, ...}
② resize 1100 (clamp) {"vw":1100,"overflow":"start","scrollLeft":133,"max":133,"selRect":[559.4,697.4],"box":[68,803],"clearOfFades":true}
② resize 960 {"vw":960,"overflow":"start","scrollLeft":257,"max":257,"selRect":[427.4,565.4],"box":[60,671],"clearOfFades":true}
후속 4 코드 (3112, 비교)
② resize 1100 (clamp) {"vw":1100,"overflow":"start","scrollLeft":133,"max":133,...}
② resize 960 {"vw":960,"overflow":"both","scrollLeft":186,"max":293,"selRect":[498.4,636.4],"box":[60,635],"clearOfFades":false}
```
  - 새 코드는 세로 휠이 신호가 아니라서 1100 의 범위 자르기 `scroll`(186 → 133)을 사용자 스크롤로 기록하지 않는다. 그래서 960 에서 선택 칩이 다시 흐림 밖에 보인다.
  - 후속 4 코드는 세로 휠을 신호로 세어 자르기 `scroll` 을 사용자 스크롤로 기록하고, 960 에서 칩이 줄 상자 밖으로 잘린 채 남는다 (Nit 2 재현).
  - 스크린샷: scratchpad `snap/b5-feed-1024-vwheel-960.png`(새), `b5-old-feed-1024-vwheel-960.png`(후속 4)
- ③ 보정 5 의 터치 확인 (그대로):
```
③ 360 after touch swipe {"vw":360,"overflow":"both","scrollLeft":204,"selRect":[-188,-100.9],"box":[16,156],"clearOfFades":false}
③ 360 after resize +14 {"vw":374,"scrollLeft":190,"selRect":[-174,-86.9]}
③ 390 after touch swipe {"vw":390,"overflow":"both","scrollLeft":186,"selRect":[-170,-82.9],"box":[16,186]}
③ 390 after resize +14 {"vw":404,"scrollLeft":186,"selRect":[-170,-82.9]}
```
  - 터치로 민 위치를 끌어오지 않는다 (후속 4 와 같은 값).

### 다음
- 관문 G15, 36 재측정 6(권장). Shift+세로 휠 실기기 확인은 Windows/Linux Chrome 에서 하면 좋다 (선택).
