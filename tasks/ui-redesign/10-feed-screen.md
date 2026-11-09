# Task 10: 피드 화면

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 10
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

## 한 일
- `components/feed/InsightsBar.tsx` (새): 48px `Card` 한 줄.
  - 왼쪽: 브리핑 버튼 `오늘의 브리핑 · {date} · {headline}` (한 줄 말줄임). 브리핑이 없으면 그리지 않는다.
  - 오른쪽: 트렌드 펼침 버튼 `트렌드` (`aria-expanded`, `aria-controls`). md 이상은 `급상승` + 상위 3개 태그 칩 (누르면 검색, 다시 누르면 해제).
  - 레이더를 불러오는 중이면 48px 스켈레톤. 브리핑·레이더(태그 있음) 둘 다 없으면 렌더 없음.
  - 펼치면 바로 아래 `hidden` 이 풀린 영역에 `TrendRadarPanel` 을 그린다.
- `components/feed/TrendRadarPanel.tsx` (새): 옛 `TechRadar` 펼친 내용 (분석 건수, 급상승 6개 + velocity, 카테고리 분포 2/4열, 전체 태그 구름, 선택 태그 `필터 초기화`). 태그는 `Chip`, 같은 태그를 다시 누르면 `''` (NEWS-14 동작 그대로). `section aria-label="트렌드 레이더"`, 토큰 색.
- `components/feed/FeedToolbar.tsx` (새):
  - 카테고리 `ChipGroup label="카테고리" scrollable` (5칩 + 건수, 옛 CategoryFilter 문구). 고르면 `onCategoryChange` → `onSourceChange('all')` → `onPageChange(1)`.
  - `SearchField label="키워드 검색" hideLabel` + `ref` 전달 (`/` 포커스), 자리표시 문구 유지. 제출하면 1페이지 + `onSearchSubmit`, 지우기는 `''` + 1페이지.
  - 소스 `ChipGroup label="소스" scrollable`: 첫 칩 `Must-Read`(별 아이콘 `text-warning`, `aria-pressed`), 구분선, `전체`, 건수 있는 소스(`lib/labels.ts` `sourceLabel`), `북마크 n`.
  - `Select label="정렬" hideLabel` (인기순·품질순·최신순·추천순). 필터를 바꾸면 모두 1페이지.
  - 폭별 배치는 CSS grid-template-areas (모바일: 검색 / 카테고리 / 소스+정렬, 태블릿: 카테고리 / 검색+정렬 / 소스, lg: 카테고리+검색(`w-64 xl:w-80`) / 소스+정렬). md 이상 `sticky top-14 z-10 bg-canvas/95 backdrop-blur`.
- `components/feed/FeedStatusBar.tsx` (새): `총 {total}건` + 필터가 걸려 있고 `stats.total_news` 가 있으면 `(전체 N건)`, `북마크 보기`·`Must-Read` 배지, 오른쪽 `페이지 p / T`. `role="status" aria-live="polite"`, `tabIndex={-1}`, `scroll-mt` 로 sticky 툴바 아래에 멈춘다.
- `components/feed/FeedPagination.tsx` (새): `nav aria-label="페이지 이동"`, `이전`·`다음` `Button secondary` + `p / T`. 모바일은 두 버튼이 반씩 차지한다 (`flex-1`, 44px). 페이지를 바꾸면 상태 줄로 스크롤하고 포커스를 옮긴다. 두 쪽 이상일 때만 그린다.
- `components/feed/NewsCardSkeleton.tsx` (새): 카드 모양 자리 표시 (`aria-hidden`).
- `NewsCard.tsx` 다시 쓰기 (spec 4.3):
  - `Card as="article" interactive`, `data-feed-card`, 클릭하면 `onSelect`.
  - 포커스 시 `ring-2 ring-accent ring-offset-2 ring-offset-canvas` + `data-focused="true"`.
  - 머리줄: 카테고리 `Badge`(`categoryLabel`) · 소스(`sourceLabel`) · `<time>` 상대 시간, `Must-Read`·`Hot n` `Badge warning`. 북마크는 `IconButton label="보관하기"` + `title` `보관하기`/`보관됨` + `aria-pressed`, 선택 시 아이콘 `fill-current text-warning`.
  - 제목은 `h3` 안 `<button>` (2줄, `break-keep [overflow-wrap:anywhere]`). Insight(왼쪽 accent 2px 선) 또는 요약 2줄, 기술 스택 `Badge` 최대 4개.
  - 바닥: 점수·댓글, `챗에서 분석`, `원문` 링크 (모바일 44px).
- `chat/HandoverCtaButton.tsx`: 토큰. `card-compact` 는 `Button ghost sm` 에 `aria-label="전용 챗에서 분석"` + 보이는 글자 `챗에서 분석`. `modal-banner` 는 `bg-accent-soft` 배너, 이름 `전용 AI 챗으로 이동` 유지. props·동작(`stopPropagation`, `q` 인코딩) 그대로.
- `app/page.tsx`:
  - spec 4.1 순서: `<main id="main" tabIndex={-1}>`, sr-only `h1 AI 에이전트 소식`, `InsightsBar`, `FeedToolbar`, `FeedStatusBar`, 로딩 스켈레톤 6개(+ sr-only `소식을 불러오는 중...`), `ErrorState`(오류 문구 + `백엔드 서버(포트 8000)…`, `다시 시도`), 카드 그리드 1/2/3열(간격 16, lg 20), `EmptyState` + `필터 전체 초기화`, `FeedPagination`, 한 줄 푸터.
  - 개요 카드를 지우고 바깥 색을 토큰으로 바꿨다. 모달 렌더 부분과 그 props 는 그대로다.
- 지움: `components/CategoryFilter.tsx`, `SourceFilter.tsx`, `TechRadar.tsx`, `DailyBriefingBanner.tsx` (`grep -rn` 으로 다른 import 가 없음을 확인. 작업 트리에서만 지웠고 git index 는 건드리지 않았다).
- `hooks/useNewsFeed.ts`: 바꿀 필요 없음 (반환 형태 그대로).
- 테스트 (새): `tests/feed/FeedToolbar.test.tsx`(6), `tests/feed/InsightsBar.test.tsx`(6).

## 바꾼 파일
- frontend/src/components/feed/InsightsBar.tsx (새)
- frontend/src/components/feed/TrendRadarPanel.tsx (새)
- frontend/src/components/feed/FeedToolbar.tsx (새)
- frontend/src/components/feed/FeedStatusBar.tsx (새)
- frontend/src/components/feed/FeedPagination.tsx (새)
- frontend/src/components/feed/NewsCardSkeleton.tsx (새)
- frontend/src/components/NewsCard.tsx
- frontend/src/components/chat/HandoverCtaButton.tsx
- frontend/src/app/page.tsx
- frontend/src/components/CategoryFilter.tsx (지움)
- frontend/src/components/SourceFilter.tsx (지움)
- frontend/src/components/TechRadar.tsx (지움)
- frontend/src/components/DailyBriefingBanner.tsx (지움)
- frontend/src/tests/feed/FeedToolbar.test.tsx (새)
- frontend/src/tests/feed/InsightsBar.test.tsx (새)

## 검사 결과
- `pnpm exec vitest run src/tests/feed src/tests/NewsCard.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/HotkeyGating.test.tsx`
  ```
   Test Files  5 passed (5)
        Tests  29 passed (29)
  ```
- `pnpm exec eslint src/app/page.tsx src/components/feed src/components/NewsCard.tsx src/components/chat/HandoverCtaButton.tsx src/tests/feed` → 종료 코드 0 (오류 0)
- `pnpm exec tsc --noEmit` → 출력 없음, 종료 코드 0 (측정 시점 전체 통과)
- 참고 (측정 시점, 다른 implementer 작업 포함): `pnpm test` → `Test Files 40 passed (40)`, `Tests 387 passed (387)`
- 참고: 임시 스모크 테스트(남기지 않음)로 `HomePage` 를 렌더해 h1, 카드 목록, `j` 로 첫 카드 제목 버튼에 실제 포커스 + `data-focused`, `/` 로 검색창 포커스를 확인했다.

## 결정
- 카테고리 칩 글자는 옛 `CategoryFilter` 의 필터 이름(`전체 소식`, `하네스 & 벤치마크` …)을 유지한다. `lib/labels.ts` 의 카테고리 라벨(`Harness` 등)은 카드·상세 배지용이라 필터 이름과 다르다. 소스 칩은 `sourceLabel` 을 써서 카드와 같게 했다 (`rss` 는 옛 필터의 `Global Blogs` 에서 `Blog` 로 바뀜).
- `Must-Read` 칩의 'warning 톤': `Chip` 에 tone prop 이 없어(06 부품 API) 칩 색은 덮어쓰지 않고 별 아이콘만 `text-warning` 으로 칠했다. 선택 시 배경은 다른 칩과 같은 `accent-soft` 다. 칩 자체 warning 톤이 꼭 필요하면 06 담당에게 `Chip tone` 을 요청해야 한다 (막지 않음).
- 북마크 `IconButton` 은 접근 이름을 `보관하기` 로 고정하고 상태는 `aria-pressed` 로 알린다. `title` 만 `보관하기`/`보관됨` 으로 바꾼다 (테스트 `getByTitle` 유지).
- 카드 제목 버튼에는 따로 onClick 을 두지 않는다. 클릭·Enter·Space 의 click 이 `article` 로 올라가 `onSelect` 를 한 번 부른다.
- 요약 바의 급상승 칩은 spec 대로 md 이상에서 보인다.
- 정렬 `Select` 는 `hideLabel` (툴바 높이 예산 4.2). 접근 이름 `정렬` 은 남는다.
- 트렌드 패널 영역(`aria-controls` 대상)은 접혀 있어도 DOM 에 `hidden` 으로 남기고, 내용은 펼칠 때만 그린다.

## 막힌 점
- 없음.

## 다음
- 없음. 관문 G2 에서 메인이 전체 검사와 `make build` 를 돈다.
