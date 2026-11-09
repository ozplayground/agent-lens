# Task 20: 스크롤 줄·입력 말줄임·한국어 줄바꿈

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 20
Status: done
Session: main
Agent: a49602194c070f0b6 (implementer B)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트 `tests/ui/ChipGroup.test.tsx` 14개(넘침 상태 4, 스크롤 버튼 5, 칩 보이기 2, `bleed`·비스크롤 그룹·`data-chip-icon` 3)와 `Chip.tsx` 빈 시그니처(`bleed?`, `iconClassName?`)를 커밋했다 (e86707c). 13개가 예상 이유로 실패, 회귀 가드 1개 통과.
- 새 `hooks/useScrollOverflow.ts`: `measureScrollOverflow(el)` + `useScrollOverflow(ref)` → `'none'|'start'|'end'|'both'` (1px 허용). `ResizeObserver`(줄과 자식), `MutationObserver`(자식 추가·삭제 시 다시 관찰), `scroll`, 창 `resize`. 첫 측정과 관찰자 콜백은 `requestAnimationFrame` 안에서 `setState`. `ResizeObserver` 가 없으면 관찰자 없이 동작 (`setup.ts` 그대로).
- 새 `components/ui/ScrollRow.tsx`: 바깥 감싸개 `relative flex min-w-0 items-center gap-1` 안에 [이전 버튼] [줄] [다음 버튼]. 줄에 `data-scroll-row`, `data-overflow`, 호출자 속성. 버튼은 `useMediaQuery('(min-width: 768px)')` 이고 넘친 쪽일 때만 (`IconButton size="sm" variant="ghost"`, `{label} 이전/다음 항목 보기`, `ChevronLeft/Right`), 누르면 `scrollBy({ left: ±clientWidth×0.8, behavior: reduceMotion ? 'auto' : 'smooth' })`, `scrollBy` 가 없으면 `scrollLeft +=`. 흐림은 `data-overflow` 별 24px `mask-image` 클래스(`none` 은 없음). `bleed` 면 `max-md:-mx-4 max-md:px-4 max-md:scroll-px-4`. 줄 안 포커스 → `scrollIntoView({ inline: 'nearest', block: 'nearest' })`. 매 렌더 뒤 `[aria-pressed="true"]` 자식이 바뀌었으면(처음 포함) 줄의 `scrollLeft` 만 움직여 보이게 한다.
- `Chip.tsx`: `ChipGroup scrollable` → `ScrollRow`(`role="group" aria-label={label}` 은 줄에), 상시 12px 마스크 삭제, `bleed` prop. 비스크롤 그룹은 그대로. `Chip` 아이콘 감싸개에 `data-chip-icon` 과 `iconClassName`.
- `TextField.tsx`: `<input>` 기본 클래스에 `text-ellipsis`. `SearchField.tsx` 는 `TextField` 를 쓰므로 고치지 않았다.
- `globals.css` `@layer base` `body` 에 `word-break: keep-all; overflow-wrap: break-word;`. 색 토큰·다른 규칙 그대로.- 후속 (메인 세션 요청, 23단계 보고): 768 미만 소스 줄을 왼쪽 끝까지만 늘이려면 한쪽 bleed 가 필요했다 (좌우 bleed 는 옆 정렬 선택창과 8px 겹침). `ChipGroup`·`ScrollRow` 의 `bleed?: boolean | 'start'` — `'start'` 는 `max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4`, `true` 는 그대로 좌우. `ChipGroup` 이 새 `rowClassName?` 을 `ScrollRow` 의 줄로 넘긴다 (`className` 은 계속 바깥 감싸개). 실패 테스트 2개 먼저 커밋 (5c2717f), 표시 클래스 수정 (fa3959a), 구현 (bf2e1ab).

## 바꾼 파일
- `frontend/src/tests/ui/ChipGroup.test.tsx` (새, 커밋 e86707c)
- `frontend/src/components/ui/Chip.tsx` (시그니처는 e86707c, 구현은 미커밋)
- `frontend/src/components/ui/ScrollRow.tsx` (새, 미커밋)
- `frontend/src/hooks/useScrollOverflow.ts` (새, 미커밋)
- `frontend/src/components/ui/TextField.tsx` (미커밋)
- `frontend/src/app/globals.css` (미커밋)
- 구현 커밋은 plan 대로 관문 G3 에서 메인 세션이 한다.
## 검사 결과
### 먼저 실패한 테스트 (커밋 e86707c)
`cd frontend && pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 13 failed | 1 passed (14)`. 모두 단언에서 실패 (import·타입 오류 없음):
- 넘침 상태 4개 (`none`/1px 허용/`end→both→start`/ResizeObserver 재측정): `Expected the element to have attribute: data-overflow … Received: (없음)`
- 스크롤 버튼 4개: `Unable to find role="button" and name "카테고리 다음 항목 보기"` (390 목 1개는 `data-overflow` 없음)
- 포커스: `expected "Mock" to be called with arguments: [ { inline: 'nearest', block: 'nearest' } ]`
- 선택 칩 보이기: `expected 0 to be greater than or equal to 180`
- `bleed`: `expected 'flex min-w-0 items-center gap-2 flex-nowrap … [mask-image:linear-gradient(to_right,transparent,black_12px,…)]' to contain 'max-md:-mx-4'` (상시 12px 마스크도 보인다)
- `data-chip-icon`: `expected null not to be null`
- 통과 1개는 회귀 가드(비스크롤 그룹은 그대로).
### 구현 뒤 (끝 기준)
- `cd frontend && pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests  14 passed (14)`
- `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/FormControls.test.tsx src/tests/feed src/tests/chat/FocusBottomSheet.test.tsx src/tests/design` → `Test Files  2 failed | 6 passed (8)`, `Tests  6 failed | 124 passed (130)`. 실패 6개는 모두 22단계 진행 중 테스트(`feed/FeedInsights.test.ts` 4개 `expected [] to deeply equal [ 1, 3 ]` 등, `FormControls.test.tsx` `labels` 블록 2개). 20단계 담당 테스트(`ChipGroup`, `FormControls` 의 `Chip and ChipGroup`, `FeedToolbar`, `InsightsBar`, `FocusBottomSheet`, `TokenGuard`·`TokenContrast`)는 모두 통과.
- `pnpm exec eslint src/components/ui/Chip.tsx src/components/ui/ScrollRow.tsx src/hooks/useScrollOverflow.ts src/components/ui/TextField.tsx src/tests/ui/ChipGroup.test.tsx` → 출력 없음, 종료 0
- `pnpm exec tsc --noEmit` → 출력 없음, 종료 0
- 참고 `pnpm test` 전체: `Test Files  3 failed | 42 passed (45)`, `Tests  16 failed | 484 passed (500)` — 실패는 모두 22단계(`NewsCard.test.tsx` 10, `FeedInsights.test.ts` 4, `FormControls` `labels` 2).
- 수정 전 증거 (F1·F2·F3·`keepAll`): 19 의 `audit/baseline-1ec8a9b/report.json` 이 아직 없다 (19 진행 중). 지금은 spec 14.1 의 관측을 인용한다 — F1 `Chip.tsx:82` `[scrollbar-width:none]` 로 1440 소스 줄 `북마크` 칩이 숨음, F2 상시 양 끝 12px 마스크·넘침 표시 없음, F3 검색 자리표시 말줄임 없이 끊김, F13 한국어 단어 중간 끊김(`keep-all` 없음).

### 후속 (한쪽 bleed·rowClassName)
- 먼저 실패 (5c2717f, 빈 타입 시그니처): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 2 failed | 14 passed (16)`
  - `bleeds only to the left edge below 768px when bleed="start"`: `expected 'flex min-w-0 flex-1 … max-md:-mx-4 max-md:px-4 max-md:scroll-px-4' to contain 'max-md:-ml-4'`
  - `passes rowClassName to the scroll row …`: `Expected the element to have class: row-extra`
- 처음 쓴 두 번째 테스트는 표시 클래스로 `flex-1` 을 썼는데, 줄 기본 클래스에 원래 `flex-1` 이 있어 코드와 상관없이 성립할 수 없는 단언이었다. 의도는 그대로 두고 `wrapper-extra` 로 바꿨다 (fa3959a). 5c2717f 의 빈 시그니처로 잠시 되돌려 다시 돌렸을 때 `Tests 2 failed | 14 skipped`, `row-extra` 없음으로 여전히 실패하는 것을 확인했다.
- 구현 뒤: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/FormControls.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/design` → `Test Files 26 passed (26)`, `Tests 349 passed (349)`. `pnpm test` 전체 → `Test Files 48 passed (48)`, `Tests 532 passed (532)`. eslint(`Chip.tsx`, `ScrollRow.tsx`, `ChipGroup.test.tsx`) 종료 0, `pnpm exec tsc --noEmit` 종료 0.


### 수정 전 증거 (기준선 인용, 메인 세션이 verifier 편차 B 에 따라 추가)
출처: `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` (1ec8a9b 프로덕션 빌드, 19단계 측정, verifier 재실행으로 같은 328건 확인).
- scrollRow:
  - `feed-light-390x844` `scrollRow` 건수 2, 예: 카테고리 — 넘치는데 data-overflow 가 없음
  - `feed-light-390x844-news-detail-ask-ai` `scrollRow` 건수 1, 예: 빠른 질문 — 넘치는데 data-overflow 가 없음
  - `feed-light-390x844-radar` `scrollRow` 건수 2, 예: 카테고리 — 넘치는데 data-overflow 가 없음
  - `feed-dark-390x844` `scrollRow` 건수 2, 예: 카테고리 — 넘치는데 data-overflow 가 없음
  - `feed-dark-390x844-news-detail-ask-ai` `scrollRow` 건수 1, 예: 빠른 질문 — 넘치는데 data-overflow 가 없음
  - `feed-dark-390x844-radar` `scrollRow` 건수 2, 예: 카테고리 — 넘치는데 data-overflow 가 없음
- placeholder:
  - `feed-light-360x780` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-390x844` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-1024x768` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-1440x900` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-dark-360x780` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-dark-390x844` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - … 외 2건
- keepAll:
  - `feed-light-360x780` `keepAll` 건수 19, 예: InsightUCSB와 MS 연구진의 '스칼라이볼브'는 에이전트가 실패  — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `feed-light-360x780-news-detail` `keepAll` 건수 3, 예: UCSB와 MS 연구진의 '스칼라이볼브'는 에이전트가 실패 로그와 시행착 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `feed-light-360x780-news-detail-ask-ai` `keepAll` 건수 1, 예: 단순 요약이 아닌, 실무 아키텍처 연동 방법, 다른 프레임워크와의 차이점 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `feed-light-360x780-daily-briefing` `keepAll` 건수 25, 예: moltis-org/moltis: A secure persistent p — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `feed-light-360x780-daily-briefing+settings` `keepAll` 건수 5, 예: Notion 페이지 발행, 이메일(SMTP), Slack/Discord  — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `feed-light-360x780-share-notify` `keepAll` 건수 5, 예: Notion 페이지 발행, 이메일(SMTP), Slack/Discord  — 두 줄 이상 한국어 글자의 word-break 가 normal
  - … 외 122건

## 결정
- 스크롤바는 계속 숨긴다 (`[scrollbar-width:none]`, `[&::-webkit-scrollbar]:hidden`). F1 의 '숨은 칩에 닿을 수 없음' 은 768 이상 스크롤 버튼과 넘친 쪽 흐림으로 푼다. 스크롤바를 보이면 줄 높이가 바뀌어 `vRhythm` 이 흔들린다.
- 줄에 `-my-1 py-1` 을 둔다: `overflow-x-auto` 가 세로도 잘라 칩 포커스 링(2px+2px)이 잘리는 것을 막고, 음수 마진으로 배치 높이는 그대로다. 가로 여백은 버튼과 겹칠 수 있어 두지 않았다.
- 선택 칩 보이기는 `scrollIntoView` 대신 줄의 `scrollLeft` 만 바꾼다 (처음 그릴 때 페이지가 세로로 움직이지 않게). 흐림 폭 24px 만큼 더 민다. 포커스 때만 plan 대로 `scrollIntoView`.
- 스크롤 버튼은 CSS 로 숨기지 않고 `useMediaQuery` 로 그리지 않는다 (768 미만에서 DOM·접근성 트리에 없음). 서버 렌더는 버튼 없음.
- `ChipGroup` 의 `className` 은 `scrollable` 이면 바깥 감싸개(레이아웃 항목, 예: `[grid-area:cat]`)에 붙는다. 줄 자체 클래스는 `ScrollRow` 의 `rowClassName` 으로만 준다.
- `text-ellipsis` 는 `FIELD_CONTROL_CLASSES`(Textarea·Select 공유) 가 아니라 `TextField` 의 `<input>` 클래스에만 넣었다.
## 막힌 점
- 없음. 같은 웨이브의 22단계 미완 변경으로 `NewsCard.test.tsx`·`feed/FeedInsights.test.ts`·`FormControls.test.tsx` `labels` 블록이 실패한다 (22 몫, 기록만).
## 다음
- 관문 G3: 메인 세션이 구현 파일 5개를 커밋한다.
- 19 의 기준선이 나오면 F1(1440 `소스` `scrollRow`/`clip`), F2(390 `카테고리` `scrollRow`), F3(`placeholder`), `keepAll` failures 를 이 파일 '검사 결과' 에 인용한다.
- 23~26 은 `ScrollRow`·`ChipGroup bleed`·`Chip iconClassName` 을 쓴다 (사용법은 design-system 5.1 반영 때 28 에서 문서화).

## 후속 (3차)
plan 3차 보정 (11be12e) '20 B 후속 (3차)', 결함 4 의 공통 부분, R15. 파일: `ScrollRow.tsx`, `tests/ui/ChipGroup.test.tsx`.

### 한 일
- `ScrollRow`: 768 미만(`!showButtons`)이고 `overflow` 가 `end`·`both` 이면 줄 뒤 형제로 `<span aria-hidden="true" data-overflow-hint className="flex shrink-0 items-center text-fg-subtle [&>svg]:size-4"><ChevronRight /></span>`. `start`·`none`·768 이상에서는 그리지 않는다. 서버 렌더와 첫 그림에는 없다.
- `bleed === true` 이고 표시가 보이면 줄은 `max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4`(왼쪽만), 표시에 `max-md:-mr-4` 를 줘서 줄 + 표시가 화면 오른쪽 끝까지 닿는다. 표시가 없으면 `max-md:-mx-4 max-md:px-4 max-md:scroll-px-4` 그대로. `'start'`·`false` 는 오른쪽을 바꾸지 않는다.
- 새 prop `selectedSelector?: string` (기본 `'[aria-pressed="true"]'`). 선택 자식 보이기 effect 가 이 선택자를 쓴다. JSDoc 갱신.
- `Chip.tsx` 는 바꾸지 않았다.

### 바꾼 파일
- `frontend/src/components/ui/ScrollRow.tsx` (시그니처 a377370, 구현 8fb3e3a)
- `frontend/src/tests/ui/ChipGroup.test.tsx` (추가만 — import `ScrollRow`, describe 2개 a377370. 8fb3e3a 에서 (c) 버튼에 `role="tab"` 추가로 jsx-a11y 경고 제거, 단언 불변)

### 검사 결과
- 먼저 실패 (a377370, `selectedSelector` 를 받기만 하는 빈 구현): `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx` → `Tests 3 failed | 17 passed (20)`
  - (a) `AssertionError: expected [] to have a length of 1 but got +0` (표시 없음)
  - (b) `AssertionError: expected null not to be null` (표시 없음)
  - (c) `AssertionError: expected 0 to be greater than 0` (`aria-pressed` 만 찾음)
  - (d) 회귀 방지는 실패 예상 아님, 통과.
- 구현 뒤 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` → `Test Files 30 passed (30)`, `Tests 318 passed (318)`
- `pnpm test` → `Test Files 49 passed (49)`, `Tests 551 passed (551)`
- `pnpm exec eslint src/components/ui/ScrollRow.tsx src/tests/ui/ChipGroup.test.tsx` → 종료 0, 출력 없음. `pnpm lint` → `0 errors, 41 warnings` (기준선과 같은 경고 수)
- `pnpm exec tsc --noEmit` → 종료 0

### 결정
- 표시는 줄 위에 겹치지 않고 줄 밖 형제로 둔다 (`occluded`). 넘칠 때만 줄이 좁아지는 단방향 변화라 판정이 오가지 않는다.

### 다음
- 관문 G6 (메인 세션). 7b: 21 C 는 `Tabs` 에 `selectedSelector='[role="tab"][aria-selected="true"]'`, 23 E 는 `FeedToolbar` 자체 표시 삭제.
- 27 재측정에서 390 소스 줄·360/390 카테고리 줄 `›`, Ask AI 빠른 질문 표시가 칩을 덮지 않는지 확인.
