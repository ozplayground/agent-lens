# Task 23: 피드 화면: 툴바·요약 바·다시 읽기

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 23
Status: done
Session: main
Agent: a2cd41bc978ebd13f (implementer E)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트를 쓰고 예상 이유로 실패하는지 확인한 뒤 커밋했다 (`285cd56`). `useNewsFeed` 에는 `reloadError` 빈 값(`null`)만 더해 실패가 타입이 아닌 단언에서 나게 했다.
- 구현 커밋 `89229a9`:
  - `FeedToolbar` (spec 14.2, R14·R16): 한 그리드를 없애고 줄마다 flex 컨테이너(`data-toolbar-row`), 바깥 `data-feed-toolbar`. 폭별 배치는 14.2 표 그대로 — ≥1280 [카테고리 `flex-1` + 검색 `w-72`] [소스 `flex-1` + 정렬 `w-32`], 768~1279 [카테고리 + 정렬 `w-28`] [검색 `w-56 lg:w-64` + 소스], <768 [검색 전체 폭] [카테고리 `bleed`] [소스 `flex-1` + 정렬 `w-28`]. 두 그룹 모두 `ChipGroup scrollable`. 카테고리 칩 `iconClassName="max-xl:hidden"`. 라벨은 `categoryLabel`(긴 라벨), `전체 소식` 만 FeedToolbar 의 상수. `FEED_CATEGORIES` 는 id·아이콘만. 자리표시 `키워드 검색`. `py-2` + `-my-2`. 칩 순서·이름·건수·`aria-pressed`, 그룹 이름, Must-Read 첫 칩, 정렬 옵션은 그대로.
  - `InsightsBar` (14.5, R20·R22): 감싸개 `flex flex-col gap-3` + `data-insights-bar`(스켈레톤 감싸개에도), 날짜 `max-md:hidden`, 급상승 칩 `hidden lg:flex` + `ScrollRow`(`role="group"`, 이름 `급상승 태그`), 768~1023 은 `트렌드` 버튼만. 스켈레톤은 `loadingRadar` 이고 브리핑·레이더 데이터가 없을 때만.
  - `FeedStatusBar`: `data-feed-status`.
  - `useNewsFeed` (C-4, F15): 목록 키 `[category, source, search, sort, highSignalOnly, page]` 와 다시 읽기 번호(`newsReload`) 분리. `loading` = 지금 키의 응답이 없고 오류도 없음. 같은 키 다시 읽는 동안 이전 `items`·`total`·`totalPages` 유지. 키가 바뀌면 옛 목록은 돌려주지 않는다(`news` 빈 배열 + `loading`). 실패는 지금 키의 목록이 있으면 `reloadError: { id, message }`(실패마다 단조 증가 `id`, 목록 유지), 없으면 `error`(ErrorState). 성공하면 실패 기록을 지운다. 통계·브리핑·레이더는 `Promise.allSettled`, `loadingRadar` 는 한 번도 읽지 못했을 때만 true. 반환 형태 유지, `reloadError` 만 더함. `lib/api.ts` 불변.
  - `page.tsx`: `useMemo(() => findRepeatedInsights(news), [news])` → `NewsCard preferSummary`, 그리드 `items-stretch`, `reloadError` 가 새 `id` 일 때 `useToast().show({ tone: 'danger' })` (이미 띄운 id 는 ref 로 걸러 중복 알림 방지). main `gap-3 md:gap-4` 는 이미 있었다. 모달 렌더 부분·props 불변.

- 후속 (메인 세션 요청, 20 B 의 `bf2e1ab` 가 `ChipGroup`/`ScrollRow` 에 `bleed: boolean | 'start'`·`rowClassName` 을 더한 뒤): 소스 그룹을 `<ChipGroup label="소스" scrollable bleed="start" className="min-w-0 flex-1">` 로 바꿔 768 미만에서 소스 줄이 왼쪽만 화면 끝까지 닿게 했다 (spec 14.2 표 <768 줄 3). 오른쪽은 늘이지 않아 정렬 선택창과 겹치지 않는다. 실패 테스트 `d483d45`(`bleeds the source row to the left edge only …` — 구현 전 `toHaveClass("max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4")` 실패), 구현 `3dae9eb`.
- 후속 2 (메인 세션 요청, 27 프로덕션 측정 뒤 눈으로 본 결함):
  1. 390 `소스` 줄에서 다음 칩 `국내 테크` 가 5px 만 걸쳐 24px 흐림 안에 묻혀 넘침이 안 보였다 (줄 끝 254px, 칩 시작 249px, spec 14.3 위반). 칩 경계는 폭·데이터마다 달라 칩 크기 조정으로는 늘 보장할 수 없어서, 줄 밖(정렬 선택창 앞)에 장식용 `›` 표시(`data-overflow-hint`, `aria-hidden`)를 두었다. 감싸개 `group/source`, 표시 `hidden max-md:group-has-[[data-overflow=end]]/source:flex max-md:group-has-[[data-overflow=both]]/source:flex` — 768 미만에서 끝 쪽으로 넘칠 때만 보이고, 768 이상은 `ScrollRow` 스크롤 버튼이 대신한다. Tailwind 4.3.3 `compile` 로 두 변형의 CSS(`@media (width < 48rem)` + `:has([data-overflow=end])`)가 나오는 것을 확인했다. 표시가 보이면 줄이 20px 좁아져도 넘침 상태는 그대로라 깜빡이지 않는다.
  2. 레이더 펼침 360 `카테고리 분포` 라벨 잘림 (`Harne…`, `Protoc…`): 목록을 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 로 바꿨다 (360~767 두 열이면 칸이 약 144px). 라벨 span 에 `title`(전체 이름)을 둔다. **영문 라벨은 남았다**: 레이더 응답 `categories[].name` 은 카테고리 id 가 아니라 backend `trend_service.py` `CATEGORY_MAP` 의 영문 이름 4개(`Harness & Benchmark`, `Protocols & Tooling`, `Models & Reasoning`, `Infra & Runtime`)다. `categoryShortLabel()` 로는 바꿀 수 없고, 한국어 매핑 표는 R19(라벨 표는 `labels.ts` 한 곳)에 따라 `labels.ts`(22 D 소유)에 있어야 해서 넘겼다 ('막힌 점').
  - 실패 테스트 `b20ff3a`: `shows a decorative overflow hint next to the source row …` (구현 전 `expected null not to be null` — 표시 없음), `lays out category shares in one column … full name accessible` (구현 전 `toHaveClass("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")` 실패). 구현 `a00fee4`.
## 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/components/feed/InsightsBar.tsx`
- `frontend/src/components/feed/FeedStatusBar.tsx`
- `frontend/src/components/feed/TrendRadarPanel.tsx` (후속 2)
- `frontend/src/hooks/useNewsFeed.ts`
- `frontend/src/app/page.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (추가만: describe 3개, it 5개 — 후속·후속 2 포함)
- `frontend/src/tests/feed/InsightsBar.test.tsx` (추가만: describe 2개, it 4개 — 후속 2 포함, import 에 `within` 추가)
- `frontend/src/tests/hooks/useNewsFeed.test.tsx` (새 파일, it 6개)
- `FeedPagination.tsx` 는 필요 없어 고치지 않았다.

## 검사 결과
### 먼저 실패하는 테스트 (커밋 `285cd56`, 구현 전)
`pnpm exec vitest run src/tests/hooks/useNewsFeed.test.tsx` — 4 실패 / 2 통과:
- (a) `keeps the previous items without loading while the same list key is re-read` — `expected true to be false` (`loading`, `newsReload` 가 요청 키에 있음)
- (b) `applies briefing and radar even when the stats request fails` — `expected null not to be null` (briefing, `Promise.all` 하나 실패로 전부 미반영)
- (c) `keeps loadingRadar false and the previous briefing while stats are re-read` — `expected true to be false` (`statsLoadedFor !== statsReload`)
- (e) `a failed re-read keeps the list and returns a reload failure signal instead of an error` — `expected null not to be null` (`reloadError` 신호 없음)
- (d) `shows loading again when the list key changes`, (e) `a failed request for a changed list key is still an error` 는 통과 — 회귀 방지 단언, 실패 예상 아님.

`pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx src/tests/feed/InsightsBar.test.tsx` — 6 실패 / 12 통과:
- `uses the short placeholder 키워드 검색` — `toHaveAttribute("placeholder", "키워드 검색")` 실패 (긴 예시 자리표시)
- `lays out rows as separate flex rows …` — `expected null not to be null` (`[data-feed-toolbar]` 없음, 한 그리드)
- `hides category chip icons below xl` — `toHaveClass("max-xl:hidden")` 실패
- `marks the outer element and hides the briefing date below md` — `toHaveClass("max-md:hidden")` 실패
- `shows surging chips only from lg (hidden lg:flex)` — `toHaveClass("hidden lg:flex")` 실패 (`hidden md:flex`)
- `keeps showing the buttons without a skeleton while re-reading when data exists` — `toBeInTheDocument()` 실패 (로딩이면 늘 스켈레톤)

### 구현 뒤 (커밋 `89229a9`)
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/feed src/tests/hooks/useNewsFeed.test.tsx src/tests/NewsCard.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx`:
  ```
   Test Files  7 passed (7)
        Tests  58 passed (58)
  ```
- 바꾼 파일 eslint `pnpm exec eslint <바꾼 소스·테스트 8개>`: 출력 없음, `eslint exit 0`.
- `pnpm exec tsc --noEmit`: 출력 없음, `tsc exit 0`.
- 참고로 전체 `pnpm test`: `Tests  530 passed (530)`. 전체 `pnpm lint`: `✖ 41 problems (0 errors, 41 warnings)` (2차 기준선과 같은 경고 수).
- `make check` 는 돌리지 않았다 (backend 테스트가 루트 `config.json`·`sources.json` 을 고치고 다른 단계가 같은 작업 트리에서 진행 중이라). 관문 G4 에서 메인 세션이 돌린다.

### 후속 뒤 (커밋 `3dae9eb`)
- `cd frontend && pnpm test`:
  ```
   Test Files  48 passed (48)
        Tests  533 passed (533)
  ```
- `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/tests/feed/FeedToolbar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.

### 후속 2 뒤 (커밋 `a00fee4`)
- 끝 기준 테스트 묶음: `Test Files  7 passed (7)` / `Tests  61 passed (61)`.
- `pnpm test`: `Test Files  48 passed (48)` / `Tests  539 passed (539)`.
- `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/components/feed/TrendRadarPanel.tsx src/tests/feed/FeedToolbar.test.tsx src/tests/feed/InsightsBar.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
- 프로덕션 빌드에서 눈으로 다시 보는 것은 하지 않았다 (빌드·서버는 27 몫). 27 재측정에서 390 소스 줄 `›` 와 360 레이더 분포를 본다.

### 수정 전 증거 인용 (F1·F2·F3·F9~F12)
- 19 의 `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` 이 이 단계를 시작할 때와 끝낼 때 모두 아직 없었다 (19 self-test·기준선 미완). 그래서 `scrollRow`/`clip`/`placeholder`/`vRhythm` 실패 항목을 인용하지 못했다. 같은 결함의 구조는 위 단위 테스트(`[data-toolbar-row]`·자리표시·아이콘 클래스·날짜·급상승 `lg`)로 단언했다. 27 의 전체 측정에서 확인한다.


### 수정 전 증거 (기준선 인용, 메인 세션이 verifier 편차 B 에 따라 추가)
출처: `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` (1ec8a9b 프로덕션 빌드, 19단계 측정, verifier 재실행으로 같은 328건 확인).
- scrollRow·clip 1440 (F1):
  - `feed-light-1440x900` `clip` 건수 3, 예: Global Blogs285 — 부모 상자 밖으로 가로 잘림
  - `feed-light-1440x900` `scrollRow` 건수 4, 예: 카테고리 — 넘치지 않는데 mask-image 가 있음
  - `feed-dark-1440x900` `clip` 건수 3, 예: Global Blogs285 — 부모 상자 밖으로 가로 잘림
  - `feed-dark-1440x900` `scrollRow` 건수 4, 예: 카테고리 — 넘치지 않는데 mask-image 가 있음
- placeholder 검색 (F3):
  - `feed-light-360x780` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-390x844` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-1024x768` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-light-1440x900` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-dark-360x780` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - `feed-dark-390x844` `placeholder` 건수 1, 예: 키워드 검색 (SWE-bench, MCP, LangGraph, Claud — 자리표시가 입력 내용 폭보다 김
  - … 외 2건
- vRhythm:
  - `feed-light-360x780` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - `feed-light-390x844` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - `feed-light-768x1024` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - `feed-light-1024x768` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - `feed-light-1440x900` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - `feed-dark-360x780` `vRhythm` 건수 1, 예:  — 대상 없음: [data-insights-bar], [data-feed-toolbar], [data-feed-
  - … 외 4건

## 결정
- 관문 G3 의 19단계 self-test 가 끝나지 않은 상태에서 메인 세션 판단으로 먼저 시작했다 (19 는 `frontend/scripts` 만 고친다).
- 14.2 표는 768~1279 에서 정렬과 검색이 다른 줄로 옮겨 가므로 CSS 만으로는 독립 flex 줄을 지킬 수 없다 (같은 요소를 두 부모에 둘 수 없고, 복제하면 `searchbox`·`combobox` 가 둘이 된다). 그래서 `useMediaQuery` 로 배치(`xl`/`md`/`sm`)를 고른다. 서버 렌더와 하이드레이션 첫 렌더는 `xl` 배치이고, 이 배치는 768 미만에서 CSS(`max-md:flex-col-reverse`)만으로 `sm` 과 같은 모양(검색 → 카테고리 → 소스+정렬)이 되어 1440·390 은 하이드레이션 뒤 눈에 보이는 이동이 없다. 하이드레이션 뒤 `sm` 배치로 바꿔 DOM 순서(=Tab 순서)를 화면 순서와 맞춘다. 768~1279 는 하이드레이션 직후 한 번 줄이 바뀐다. 폭이 경계를 넘으면 검색 입력이 다시 마운트된다(값은 제어 상태라 유지, ref 는 다시 연결).
- 줄 안 컨트롤 간격 `gap-2 md:gap-4` (14.2 폭 계산의 16px), 줄 사이 `gap-2`.
- 급상승 칩 줄은 `max-w-md` 안에서 `ScrollRow` 로 스크롤한다 (브리핑 버튼 `flex-1 min-w-0` 과 나눠 쓰기).
- 접근 이름 계산(dom-accessibility-api)이 span 안 앞뒤 공백을 버려 `오늘의 브리핑· 2026-…` 이 되므로, 날짜 span 은 `· {날짜}` 만 담고 공백은 span 밖에 둔다 (기존 단언 `오늘의 브리핑 · 2026-11-06 · …` 유지).
- `reloadError.id` 는 다시 읽기 번호가 아니라 실패마다 늘어나는 ref 카운터다 (같은 번호로 다시 실패해도 새 신호).
- 테스트 (e) 2개(다시 읽기 실패 신호, 키가 바뀐 요청 실패는 ErrorState)를 plan 의 (a)~(d) 에 더했다.

## 막힌 점
- (해결) 소스 줄 왼쪽 bleed 에 필요한 `ChipGroup` 한쪽 bleed 는 20 B 가 `bf2e1ab` 로 더했고, 후속 `3dae9eb` 에서 적용했다.
- 19 기준선 `report.json` 부재로 수정 전 증거 인용을 못 했다 (위 '검사 결과').
- (해결, 3차) 22 D `07a08a8` 이 `radarCategoryLabel` 을 더했고 `3660bf4` 에서 적용했다. 원래 메모: 레이더 카테고리 한국어 라벨: `labels.ts` 에 예) `RADAR_CATEGORY_LABELS` = `{ 'Harness & Benchmark': '하네스·벤치마크', 'Protocols & Tooling': '프로토콜·도구', 'Models & Reasoning': '모델·추론', 'Infra & Runtime': '인프라·런타임' }` 와 `radarCategoryLabel(name)`(모르는 값은 그대로)을 더하면, 23 이 `TrendRadarPanel` 에서 `{radarCategoryLabel(cat.name)}`·`title` 에 쓰고 테스트를 더한다. 아이콘 고르기(`CategoryIcon`)는 영문 원값으로 계속 비교한다.

## 다음
- 관문 G4: frontend 세 명령, `make build`, 실패 테스트 커밋 순서 확인. 27 의 전체 측정에서 `scrollRow`(1440 `카테고리`·`소스`)·`clip`·`placeholder`·`vRhythm`·`rowAlign` 확인.

## 후속 (3차)
plan 3차 보정(`11be12e`) '23 E 후속 (3차)'. 웨이브 7b (G6 뒤, 21 C 후속과 병렬). 20 B `8fb3e3a`(모든 `ScrollRow` 에 768 미만 넘침 표시)와 22 D `07a08a8`(`radarCategoryLabel`)에 기댄다.

### 한 일
- `FeedToolbar.tsx` `sourceGroup`: 후속 2(`a00fee4`)의 `group/source` 감싸개 `div` 와 자체 `data-overflow-hint` `span` 을 지우고 `<ChipGroup label="소스" scrollable bleed="start" className="min-w-0 flex-1">` 만 둔다. 주석은 '넘침 표시는 ScrollRow 공통'. 쓰지 않게 된 `ChevronRight` import 삭제. 칩·순서·이름·정렬 위치·`bleed="start"` 는 그대로. 7a 뒤 소스 줄에 표시가 둘이던 중간 상태가 하나가 됐다.
- `TrendRadarPanel.tsx` 카테고리 분포: 보이는 글자와 `title` 을 `radarCategoryLabel(cat.name)` 로. `key`·`CategoryIcon name` 은 원값(데이터 키). 한 열 배치·말줄임은 그대로.
- 테스트: `FeedToolbar.test.tsx` 의 후속 2 블록(`describe('FeedToolbar — 768 미만 소스 줄 넘침 표시 (spec 14.3, 후속 2)')`)을 '증명' 3차 표대로 교체 — 360 `matchMedia` 목 + 스크롤 줄 `scrollWidth` 600 / `clientWidth` 300 목(`describe` 안 `beforeEach`/`afterEach` 로 설치·복원)에서 소스 줄 `[data-toolbar-row]` 안 `[data-overflow-hint]` 정확히 1개, `aria-hidden="true"`, 그룹 밖, 정렬 선택창보다 앞, `.group/source` 없음. import 에 `beforeEach`·`afterEach`·`waitFor` 추가. 새 `tests/feed/TrendRadarPanel.test.tsx` (it 2개).

### 바꾼 파일
- `frontend/src/components/feed/FeedToolbar.tsx`
- `frontend/src/components/feed/TrendRadarPanel.tsx`
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (후속 2 블록 교체, import 이름 추가)
- `frontend/src/tests/feed/TrendRadarPanel.test.tsx` (새 파일)

### 검사 결과
- 실패 테스트 `75fe34b` (구현 전):
  - `has exactly one decorative hint in the source row, outside the group and before the sort select` — `AssertionError: expected …(2) to have a length of 1 but got 2` (FeedToolbar 자체 표시 + ScrollRow 표시).
  - `shows Korean radar category labels and no English names in text or title` — `expect(received).toBeInTheDocument()` 실패 (`하네스 & 벤치마크` 없음, 영문 원값을 그림).
  - `keeps an unknown radar category name as is` 는 통과 — 회귀 방지, 실패 예상 아님.
- 구현 `3660bf4` 뒤:
  - 끝 기준 `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx`: `Test Files  7 passed (7)` / `Tests  63 passed (63)`.
  - `pnpm test`: `Test Files  50 passed (50)` / `Tests  555 passed (555)`.
  - `pnpm exec eslint src/components/feed/FeedToolbar.tsx src/components/feed/TrendRadarPanel.tsx src/tests/feed/FeedToolbar.test.tsx src/tests/feed/TrendRadarPanel.test.tsx`: `eslint exit 0`. `pnpm exec tsc --noEmit`: `tsc exit 0`.
  - 정적: `grep -nE "data-overflow-hint|group/source" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음(exit 1). `grep -n "radarCategoryLabel" …/TrendRadarPanel.tsx` 8·75·76행. `grep -nE "^\s*\{cat\.name\}\s*$|title=\{cat\.name\}" …/TrendRadarPanel.tsx` 출력 없음. `grep -rlE "프로토콜 & 도구|인프라 & 런타임" frontend/src/components` 출력 없음.
- 배치 증거 인용 (`tasks/ui-redesign/27-prod-audit.md` '눈으로 본 것'):
  - 피드 390: "`소스` 줄에 `Must-Read`·`전체 4734` 만 보이고 … 줄 오른쪽 끝 254px, 다음 칩 `국내 테크` 가 249px 에서 시작 → 5px 만 걸치고 24px 흐림 안에 들어가 사실상 안 보인다."
  - `/` 레이더 펼침 360: "`카테고리 분포` 라벨이 `Harne…`, `Protoc…`, `Models & …`, `Infra & …` 로 말줄임되어 읽을 수 없다. 라벨이 영문이다."
  - 고친 뒤 확인은 27 재측정 (390 소스 줄 `›` 하나, 360 레이더 분포 한국어).

### 결정
- 교체 블록의 목은 plan 대로 이 파일 안에 두되, 기존 테스트에 영향이 없도록 그 `describe` 의 `beforeEach`/`afterEach` 로 한정했다. `matchMedia` 목은 툴바 배치용 `(min-width) and (max-width)` 복합 질의도 판정한다.
- 영문 이름이 `queryByText` 로 안 보이는 것과 함께 `title` 에도 없는지 본다 (말줄임 시 전체 이름 접근은 한국어로).

### 다음
- 관문 G7 (메인 세션), 그 뒤 27 재측정.
