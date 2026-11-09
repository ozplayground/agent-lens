# 기능명세: 뉴스 피드

Updated: 2026-11-08

## 개요
수집·선별된 AI 에이전트·하네스·MCP 소식(`news_items`)을 메인 화면(`/`)에 카드 그리드로 보여준다. 사용자는 카테고리·소스·Must-Read 필터, 키워드 검색, 4가지 정렬, 페이지 이동으로 목록을 좁히고, 카드를 열어 3줄 요약·개발자 시사점·기술 스택을 보거나 기사 단위로 AI 에게 질문(SSE 스트리밍)한다. 북마크는 브라우저 localStorage 에만 저장한다. 같은 화면의 요약 바에 일일 브리핑과 트렌드 레이더(기술 태그 집계)가 붙고, 목록 머리줄 상태와 필터 칩에 통계 건수가 보이며, 헤더 더보기 메뉴와 커맨드 팔레트에서 RSS 출력과 데이터 초기화·재수집을 실행한다. 백엔드 인터페이스는 `/api/news*`, `/api/stats`, `/api/trends/radar` 다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| NEWS-01 | 피드 목록 조회·페이지네이션 | 필터·검색·정렬 조건으로 기사 목록을 페이지 단위로 조회해 카드 그리드로 표시 | `/` 카드 그리드, `이전`/`다음` 버튼 / `GET /api/news` |
| NEWS-02 | 카테고리 필터 | 4개 카테고리 + 전체 칩, 칩별 건수 표시 | `/` 필터 영역 카테고리 칩 / `GET /api/news?category=` |
| NEWS-03 | 소스 필터 | 수집 소스별 필터 칩 (건수 0 인 소스는 숨김) | `/` 필터 영역 소스 칩 / `GET /api/news?source=` |
| NEWS-04 | Must-Read 필터 | `is_high_signal` 기사만 표시 | `/` 필터 영역 소스 줄 오른쪽 끝의 "Must-Read" 토글 / `GET /api/news?high_signal_only=true` |
| NEWS-05 | 키워드 검색 | 제목·요약·태그·기술 스택·시사점 부분 일치 검색 | `/` 검색 영역 검색창, `/` 단축키 / `GET /api/news?search=` |
| NEWS-06 | 정렬 | 인기순·품질순·최신순·추천순 | `/` 목록 머리줄 정렬 선택 상자 / `GET /api/news?sort=` |
| NEWS-07 | 북마크 | 기사 스냅샷을 localStorage 에 보관, 북마크 전용 보기 | 카드·상세 대화상자 북마크 버튼, `b` 단축키, "북마크" 칩 |
| NEWS-08 | 기사 카드 | 고정 틀(머리줄 카테고리·소스·상대 시간 + 북마크, 제목 2줄, 시사점 또는 요약 2줄, Must-Read·기술 스택 배지 줄, 원천 지표·인기 점수(지표 소스만)·포크 또는 댓글 + `AI 챗에서 분석`·원문 바닥) | `/` 카드 |
| NEWS-09 | 기사 상세 대화상자 | "AI 요약 & 시사점" 탭(시사점, 3줄 요약, 기술 스택, 본문 요약 마크다운) | 카드 클릭, 카드 제목 버튼, `Enter`/`Space` 단축키 |
| NEWS-10 | 기사 단위 AI 질문 (스트리밍) | 상세 대화상자 "AI 질의응답" 탭에서 질문, SSE 로 토큰 스트리밍 | 상세 "AI 질의응답" 탭 / `POST /api/news/{id}/ask/stream` |
| NEWS-11 | 기사 단위 AI 질문 (일괄 응답) | 같은 질문을 한 번에 응답하는 API (UI 미사용) | `POST /api/news/{id}/ask` |
| NEWS-12 | 기사 단건 조회 | ID 로 기사 1건 조회 (피드 UI 미사용) | `GET /api/news/{id}` |
| NEWS-13 | RSS 출력 | 최신 50건 RSS 2.0 XML | 헤더 더보기 "RSS 피드", 커맨드 팔레트 / `GET /api/news/feed/rss.xml` |
| NEWS-14 | 트렌드 레이더 | 최근 500건의 기술 스택 태그 집계, 급상승 태그·카테고리 분포·태그 클라우드, 태그 클릭 시 검색 | `/` 요약 바 "트렌드" 펼침·급상승 칩 / `GET /api/trends/radar` |
| NEWS-15 | 통계 | 전체 건수, 카테고리별·소스별 건수 | 목록 머리줄 상태 "(전체 N건)", 칩 건수 / `GET /api/stats` |
| NEWS-16 | 피드 키보드 단축키 | j/k 이동, Enter/Space 열기, b 북마크, c 챗 이동, / 검색, t 테마 (Esc·⌘K 는 공통 처리) | 전역 keydown |
| NEWS-17 | 데이터 전체 삭제·초기화 | 기사 전체 삭제 API, "초기화 & 재수집" | 헤더 더보기·스케줄 대화상자·커맨드 팔레트 + 확인 대화상자 / `DELETE /api/news/all`, `POST /api/schedule/reset-and-collect` |
| NEWS-18 | 일일 브리핑 바로가기 | 오늘 브리핑의 날짜·헤드라인을 요약 바에 표시, 누르면 브리핑 대화상자 | `/` 요약 바 브리핑 버튼 / `GET /api/briefing/today` |
| NEWS-19 | AI 챗 핸드오버 | 카드·상세 대화상자에서 기사를 단일 기사 범위로 `/chat` 에 열기 | 카드 "AI 챗에서 분석", 상세 배너 "AI 챗에서 분석", `c` 단축키 |

## NEWS-01 피드 목록 조회·페이지네이션
- 진입점: 메인 페이지 `/` 진입 시 자동 조회. 목록 아래 페이지 이동 줄(`nav aria-label="페이지 이동"`)의 `이전` / `다음` 버튼. API `GET /api/news`.
- 입력 (API 쿼리):
  - `category` (선택, 문자열), `source` (선택), `search` (선택), `high_signal_only` (bool, 기본 false), `sort` (기본 `"hot"`), `page` (정수, 기본 1, ≥1), `size` (정수, 기본 20, 1~100).
  - 범위를 벗어난 `page`/`size` 는 FastAPI 검증으로 422 가 된다.
  - 프론트는 항상 `size=18` 로 요청한다. `category`/`source` 가 `'all'` 이면 파라미터를 빼고, `search` 가 빈 문자열이면 빼고, `high_signal_only` 는 true 일 때만 붙인다.
- 처리 규칙:
  1. `select(NewsItem)` 에 필터(NEWS-02~05)를 AND 로 붙인다.
  2. 필터가 적용된 쿼리를 서브쿼리로 감싸 `count()` 로 `total` 을 구한다 (정렬·페이지 적용 전).
  3. 정렬(NEWS-06)을 적용한 뒤 `offset((page-1)*size).limit(size)` 로 자른다.
  4. `total_pages = ceil(total/size)`, `total == 0` 이면 1.
  5. 각 행을 `format_news_item` 으로 변환한다: `tags`·`tech_stack` 은 콤마 문자열을 split·trim 해 배열로, `tldr_bullets` 는 JSON 파싱(실패 시 `[]`), `summary`·`why_it_matters` 는 null 이면 `""`, `quality_score` 는 falsy(0 포함)면 `6.0`, `is_high_signal` 은 null 이면 false.
  6. 프론트 `useNewsFeed` 는 목록 키(`category, source, search, sort, highSignalOnly, page`)와 다시 읽기 번호(`newsReload`)를 따로 둔다. 둘 중 하나가 바뀌면 `useEffect` 로 다시 조회하고, `loadNews()` 는 번호만 올린다 (헤더 새로고침, 검색 제출, 소스 대화상자의 변경 알림). 바뀐 뒤 도착한 앞 요청의 응답은 버린다. 응답은 받은 목록 키와 함께 저장한다. `loading` 은 지금 목록 키의 응답이 아직 없을 때만 true 다. 같은 목록 키를 다시 읽는 동안에는 이전 `items`·`total`·`totalPages` 를 그대로 그리고, 목록 키가 바뀐 뒤에는 이전 목록을 보이지 않는다. 북마크 보기(`source === 'bookmarks'`)는 요청하지 않는다 (`hooks/useNewsFeed.ts:21-34`, `:71-133`).
  7. 요청은 `fetchWithTimeout` 으로 8000ms 뒤 abort 한다. `cache: 'no-store'`. 브라우저에서는 상대 경로 `/api/news` 를 쓰고 Next.js rewrites 가 백엔드로 넘긴다.
  8. 페이지 버튼(`FeedPagination`): 이전은 `p-1`, 다음은 `p+1` 을 `1~totalPages` 로 자른다. `page <= 1` 이면 이전, `page >= totalPages` 면 다음이 비활성화된다. 페이지 이동 줄은 `!loading && totalPages > 1` 일 때만 보인다. 페이지를 바꾸면 목록 머리줄의 상태로 스크롤(`scrollIntoView({ block: 'start' })`)하고 포커스를 상태로 옮긴다.
  9. 필터·정렬·카테고리·소스·Must-Read 를 바꾸는 모든 핸들러는 `page` 를 1 로 되돌린다.
- 출력:
  - API: `NewsListResponse { items: NewsItemResponse[], total, page, size, total_pages }`. `NewsItemResponse` 필드: `id, title, url, source, category, summary, author, tags[], tldr_bullets[], why_it_matters, tech_stack[], quality_score, is_high_signal, raw_score, comments_count, hotness_score, published_at, created_at, dedup_hash`. `full_content`, `scraped_at` 은 응답에 없다.
  - 화면: 목록 머리줄(`FeedStatusBar`, `data-feed-list-header`)은 왼쪽 상태(`role="status" aria-live="polite"`, 남는 폭 전부)와 오른쪽 정렬 선택 상자(NEWS-06)다. 상태는 "총 N건", 필터가 걸려 있고 통계가 있으면 " (전체 M건)", 북마크 보기면 `북마크 보기` 배지, Must-Read 면 `Must-Read` 배지, 상태 오른쪽 끝 "페이지 p / totalPages". 정렬은 상태 live 영역 밖의 뒤 형제라 상태 알림과 페이지 이동 뒤 포커스가 정렬 글자를 읽지 않는다. 머리줄은 위쪽 맞춤이고 상태의 최소 높이가 정렬 높이(768px 미만 44px, 이상 36px)와 같아, 한 줄일 때 상태 글자와 정렬의 세로 가운데가 같고 필터 배지가 붙어 상태가 여러 줄이 되어도 정렬은 첫 줄 오른쪽에 남는다. 가로로 넘치지 않는다. 카드 그리드는 1열(<768px) / 2열(768~1023px) / 3열(≥1024px). 페이지 이동 줄은 `이전` · `p / T` · `다음` 이고 768px 미만에서 두 버튼이 반씩 차지한다.
- 예외·엣지:
  - 로딩 중(지금 목록 키의 응답이 없을 때): 카드 스켈레톤 6개(카드와 같은 틀·높이)와 화면 읽기용 "소식을 불러오는 중..." 을 표시하고 그리드·오류·빈 상태·페이지 이동 줄을 숨긴다. 수집 중 새 소식이 저장될 때처럼 같은 목록 키를 다시 읽을 때는 스켈레톤으로 바뀌지 않는다.
  - 실패: `res.ok` 가 아니면 `API 오류 (status): statusText` 메시지를 던진다. 지금 목록 키의 목록이 아직 없을 때(첫 조회, 목록 키 변경, 오류 상태의 "다시 시도") 실패하면 화면에 오류 상태(`ErrorState`: 제목 = 오류 메시지(없으면 "데이터를 불러오지 못했습니다."), "백엔드 서버(포트 8000) 연결 상태를 확인해주세요.", "다시 시도" 버튼(오류 해제 후 재조회))를 보인다. 같은 목록 키 다시 읽기가 실패하면 목록을 지우지 않고 오류 메시지를 `danger` 알림으로 띄운다 (실패마다 한 번, `app/page.tsx:74-81`). 타임아웃(abort)도 같은 경로로 표시된다.
  - 빈 결과: 빈 상태(`EmptyState`) "조건에 일치하는 소식이 없습니다", "다른 카테고리를 선택하거나 검색어 및 필터를 초기화해 보세요." 와 "필터 전체 초기화" 버튼. 초기화는 category·source 를 `all`, search 를 `''`, highSignalOnly 를 false, page 를 1 로 되돌린다. `sort` 와 트렌드 레이더의 `selectedTag` 는 초기화하지 않는다.
  - 응답은 zod 스키마로 검증하지 않고 `res.json()` 을 그대로 쓴다.
- 관련 코드: `backend/app/api/news.py:17-45`, `backend/app/api/news.py:47-94`, `backend/app/schemas/news.py:5-37`, `frontend/src/hooks/useNewsFeed.ts:21-157`, `frontend/src/lib/api.ts:25-61`, `frontend/src/app/page.tsx:74-81`, `:200-268`, `frontend/src/components/feed/FeedStatusBar.tsx:38-88`, `frontend/src/components/feed/FeedPagination.tsx:16-55`, `frontend/next.config.ts`, 동작 확인 테스트 `frontend/src/tests/hooks/useNewsFeed.test.tsx`

## NEWS-02 카테고리 필터
- 진입점: 필터 영역(`FeedToolbar` 의 `data-feed-toolbar`)의 카테고리 칩 묶음(`role="group" aria-label="카테고리"`, 한 줄 가로 스크롤). 피드 위쪽은 본문(`main`)의 형제 세 영역이고, 모든 폭에서 같은 DOM 트리를 그리며 폭별 배치는 CSS 클래스로만 바꾼다:
  | 폭 | 검색 영역 (`data-feed-search`) | 필터 영역 줄 1 | 필터 영역 줄 2 | 목록 머리줄 (`data-feed-list-header`) |
  |---|---|---|---|---|
  | 1280px 이상 | 검색 입력, 콘텐츠 전체 폭, 36px | 카테고리(줄 전체, 칩 아이콘 있음) | 소스(남는 폭 전부) + Must-Read 토글(별 + 글자) | 상태 + 정렬(`w-32`, 36px) |
  | 768~1279px | 검색 입력, 콘텐츠 전체 폭, 36px | 카테고리(줄 전체, 칩 아이콘 숨김) | 소스(남는 폭 전부) + Must-Read 토글(별 + 글자) | 상태 + 정렬(`w-28`, 36px) |
  | 768px 미만 | 검색 입력, 콘텐츠 전체 폭, 44px | 카테고리(칩 아이콘 숨김, 페이지 좌우 여백 너머 화면 끝까지) | 소스(왼쪽만 페이지 여백 너머 화면 끝까지) + Must-Read 토글(별 아이콘만, 44×44) | 상태 + 정렬(`w-28`, 44px) |
  - 필터 영역은 두 줄(각각 독립된 가로 배치 `data-toolbar-row`, 줄 사이 8px)이고 안에 입력·선택 상자가 없다. 검색 입력, 카테고리 줄, 소스 줄 + 토글, 목록 머리줄의 왼쪽·오른쪽 끝은 모든 폭에서 콘텐츠 상자 끝과 같다. Must-Read 토글은 소스 줄의 마지막 자식이라 오른쪽 끝이 콘텐츠 오른쪽 끝이고, 정렬의 오른쪽 끝도 같다. 768px 미만에서도 토글은 소스 줄과 같은 줄에 있다 (360px 폭에서 소스 줄의 보이는 폭은 약 276px 이고 흐림 밖에 다 보이는 소스 칩은 2개다).
  - DOM 순서 = 화면 순서 = Tab 순서는 모든 폭에서 `검색 → 카테고리(768px 이상 스크롤 버튼 포함) → 소스 → Must-Read → 상태 → 정렬 → 카드` 다. `order`·`flex-*-reverse`·grid 영역으로 순서를 바꾸지 않는다.
  - 트리가 하나라 폭이 바뀌어도(창 크기 조절, 기기 회전) 검색 입력, 칩 줄, 정렬이 다시 마운트되지 않는다. 검색창 포커스·입력값·가상 키보드가 그대로 남는다. 칩 줄의 스크롤 위치는 사용자가 직접 민 줄만 남고, 그렇지 않은 줄은 줄 폭이 바뀌면 선택 칩이 보이게 다시 맞춘다 (아래 가로 스크롤). 서버 렌더와 하이드레이션 첫 렌더도 같은 트리라 하이드레이션 뒤 배치가 바뀌지 않는다. `FeedToolbar` 는 `useMediaQuery` 를 쓰지 않는다 (칩 줄 안 스크롤 버튼·넘침 표시 판정은 `ScrollRow` 가 한다).
  - 768px 이상에서 필터 영역만 헤더 아래에 붙는다(`sticky top-14 z-10`). 검색 영역과 목록 머리줄은 붙지 않고, 768px 미만은 어느 영역도 붙지 않는다. 필터 영역의 sticky 배경용 위아래 여백은 음수 마진으로 상쇄해, 요약 바 → 검색 영역 → 필터 영역 → 목록 머리줄 → 카드 사이 간격은 모두 본문 간격(12px, 768px 이상 16px) 하나로 정해진다.
- 입력: 칩 5개. `all` "전체 소식", `harness` "하네스 & 벤치마크", `mcp_plugins_skills` "MCP & 생태계", `agent_tech` "에이전트 아키텍처", `ai_news` "최신 AI 동향". `전체 소식` 밖의 라벨은 `lib/labels.ts` 의 긴 라벨(`CATEGORY_LABELS`)이고 상세 대화상자 배지·소스 등록 선택지와 같은 문구다. 칩 아이콘은 1280px 이상에서만 보인다.
- 처리 규칙:
  1. 백엔드: `category` 가 있고 소문자 변환 값이 `"all"` 이 아니면 `NewsItem.category == category.lower()` 조건을 붙인다.
  2. 칩 선택 시 `onCategoryChange(c)`, `onSourceChange('all')`, `onPageChange(1)` 을 함께 실행한다. 즉 카테고리를 바꾸면 소스 필터(북마크 보기 포함)가 해제된다.
  3. 칩 건수: 개별 칩은 `stats.category_counts[id] ?? 0`, `all` 은 `category_counts` 값 전체 합.
- 출력: 선택 칩은 `aria-pressed="true"` 와 강조 배경. 칩 글자 뒤에 건수.
- 가로 스크롤 (카테고리·소스 줄 공통): 줄이 넘치면 넘친 쪽만 24px 흐린다. 768px 이상은 넘친 쪽에 스크롤 버튼(`카테고리 이전 항목 보기`/`카테고리 다음 항목 보기`, 소스 줄은 `소스 …`)이 줄 밖에 붙고, 누르면 줄 폭의 80% 만큼 민다. 키보드로 누르던 버튼이 끝에 닿아 사라지면 포커스는 반대쪽 버튼으로, 두 버튼이 다 사라지면(폭이 768px 미만이 됨) 선택 칩으로 옮겨진다. 768px 미만은 버튼 없이 손가락으로 밀고, 넘친 쪽마다 장식 표시가 붙는다: 왼쪽에 칩이 더 있으면 줄 앞에 `‹`, 오른쪽에 더 있으면 줄 뒤에 `›`, 양쪽이면 둘 다. 표시는 칩을 덮지 않고, 표시가 나타나고 사라져도 칩이 옆으로 움직이지 않는다. 처음 그릴 때와 선택 칩이 바뀔 때 선택 칩이 흐림 밖에 다 보이게 줄을 민다 (흐림 폭과 스냅 여백이 모두 24px). 칩 건수가 늦게 들어와 칩이 커지거나 넘침 표시·화면 폭 변화로 줄 폭이 달라져도, 사용자가 줄을 밀지 않았으면 다시 보이게 한다. '사용자가 밀었다' 는 줄에 대한 입력(누르기·휠·터치·키·스크롤 버튼·줄 안으로의 포커스 이동) 뒤에 온 스크롤만이고, 입력 없이 브라우저가 줄 범위를 자르거나 스냅 위치로 다시 맞춘 것은 밀지 않은 것으로 본다 (07-ui-common.md UI-09). 1440px 폭에서는 카테고리·소스 줄이 넘치지 않는다 (건수가 있는 소스가 늘면 소스 줄은 넘칠 수 있고, 그때도 위 규칙을 따른다). 768~1279px 은 카테고리·소스 줄 모두 넘칠 수 있다 (768px 에서는 둘 다 넘쳐 스크롤 버튼이 붙는다).
- 예외·엣지: 통계 로딩 실패 시 건수가 모두 0 으로 보인다.
- 관련 코드: `backend/app/api/news.py:59-60`, `frontend/src/components/feed/FeedToolbar.tsx:12-23`, `:55-86`, `:107-133`, `:211-229`, `frontend/src/components/feed/FeedStatusBar.tsx:29-37`, `frontend/src/app/page.tsx:170`, `frontend/src/lib/labels.ts:15-20`, `frontend/src/components/ui/Chip.tsx`, `frontend/src/components/ui/ScrollRow.tsx`, 동작 확인 테스트 `frontend/src/tests/feed/FeedToolbar.test.tsx`, `frontend/src/tests/ui/ChipGroup.test.tsx`

## NEWS-03 소스 필터
- 진입점: 필터 영역 줄 2 의 소스 칩 묶음(`role="group" aria-label="소스"`, 한 줄 가로 스크롤). 순서는 `전체`, 건수가 있는 소스, `북마크` 이고 구분선은 없다. 모든 폭에서 `Must-Read` 토글(NEWS-04) 왼쪽이고 같은 줄이다. 768px 미만은 왼쪽만 페이지 여백 너머 화면 끝까지 늘어난다 (왼쪽으로 넘치면 `‹` 표시가 화면 끝 여백 자리에 오고, 오른쪽으로 넘치면 `›` 표시가 토글 앞에 온다). 넘침 표시·스크롤 버튼은 NEWS-02 의 가로 스크롤 규칙과 같다.
- 선택 칩 보이기: 소스 줄의 선택 칩은 선택된 소스 칩(`전체`·소스·`북마크` 가운데 `aria-pressed="true"` 인 것, 모두 `data-source-chip`)이다. 줄 밖 `Must-Read` 토글은 선택 칩과 상관이 없다 (`selectedSelector='[data-source-chip][aria-pressed="true"]'`). 그래서 `Must-Read` 와 줄 뒤쪽 소스(예: `GitHub`)를 함께 고르면 줄은 `GitHub` 칩이 보이게 밀리고, `Must-Read` 만 켜고 끄는 것으로는 줄이 움직이지 않는다. 첫 화면(360·390px 포함)에서 소스 줄은 밀리지 않고 첫 칩 `전체` 부터 보인다 (스크롤 0).
- 입력: 칩 id 와 라벨(`lib/labels.ts` `SOURCE_LABELS`). `all` 전체, `rss_kr` 국내 테크, `github` GitHub, `hackernews` HackerNews, `arxiv` arXiv, `huggingface` HuggingFace, `reddit` Reddit, `rss` Global Blogs, `bookmarks` 북마크.
- 처리 규칙:
  1. 백엔드: `source` 가 있고 소문자 값이 `"all"` 이 아니면 `NewsItem.source == source.lower()`.
  2. `all`, `bookmarks` 는 항상 보이고, 나머지는 `stats.source_counts[id] > 0` 일 때만 보인다.
  3. 건수: `all` 은 `source_counts` 합, `bookmarks` 는 북마크 개수, 나머지는 해당 소스 건수. 0 이어도 숫자를 표시한다.
  4. `bookmarks` 를 고르면 API 를 호출하지 않고 로컬 북마크 목록을 보여준다 (NEWS-07).
  5. 선택 시 `onSourceChange(s)`, `onPageChange(1)`.
- 출력: 선택 칩은 `aria-pressed="true"` 와 강조 배경.
- 예외·엣지: 위 목록에 없는 source 값(예: `web`)이 DB 에 있어도 칩이 없다.
- 관련 코드: `backend/app/api/news.py:61-62`, `frontend/src/components/feed/FeedToolbar.tsx:25-26`, `:113-116`, `:155-191`, `frontend/src/lib/labels.ts:36-44`, `:66-68`

## NEWS-04 Must-Read 필터
- 진입점: 필터 영역 줄 2 의 "Must-Read" 토글(`button`, `aria-pressed`, `data-must-read-toggle`, 별 아이콘). 소스 칩 줄 밖, 소스 줄 오른쪽 끝(모든 폭에서 같은 줄, 줄의 마지막 자식)에 고정되어 소스 줄을 밀어도 움직이지 않고, 모든 폭의 첫 화면에서 전체가 보인다. 768px 이상은 별 + `Must-Read` 글자, 768px 미만은 별 아이콘만 보이는 44×44px 버튼이고 글자는 화면 읽기용으로 남아 접근 이름은 모든 폭에서 `Must-Read` 다. 폭이 바뀌어도 같은 요소라 다시 마운트되지 않는다. Tab 순서는 소스 줄 다음, 목록 머리줄 앞. 높이는 같은 줄 소스 칩과 같다 (768px 미만 44px, 이상 32px). 툴팁 "기술 깊이와 실무 가치가 입증된 고품질 소식만 보기".
- 입력: `high_signal_only` bool.
- 처리 규칙:
  1. true 이면 `NewsItem.is_high_signal == True` 조건만 붙인다 (품질 점수 직접 비교 없음). `is_high_signal` 값은 수집 시 결정된다 (`03-collection.md` COLL-08).
  2. 누르면 반전 후 page 1.
- 출력: 선택 시 경고 톤(호박색 테두리·배경, 별 채움), 목록 머리줄 상태에 `Must-Read` 배지.
- 예외·엣지:
  - 북마크 보기에서는 이 필터가 적용되지 않지만 상태 배지는 그대로 붙는다.
- 관련 코드: `backend/app/api/news.py:63-64`, `frontend/src/components/feed/FeedToolbar.tsx:193-209`, `:223-226`, `frontend/src/components/feed/FeedStatusBar.tsx:68-69`, 동작 확인 테스트 `frontend/src/tests/feed/FeedToolbar.test.tsx`

## NEWS-05 키워드 검색
- 진입점: 검색 영역(`data-feed-search`)의 검색창(`SearchField`: `<form role="search">` 안 `type="search"` 입력, 숨긴 라벨 "키워드 검색", placeholder "키워드 검색", Enter 로 제출, 값이 있으면 "검색어 지우기" 버튼), `/` 단축키(검색창 포커스), 트렌드 레이더 태그·요약 바 급상승 칩(NEWS-14). 검색 영역은 요약 바 아래, 필터 영역 위의 독립 영역이고 모든 폭에서 입력이 콘텐츠 전체 폭이다 (높이 768px 미만 44px, 이상 36px, 입력 모양은 공통 입력 토큰 그대로). 고정(sticky)되지 않는다. 폭이 바뀌어도 같은 입력 요소라 포커스와 입력값이 남는다. 자리표시는 예시 없이 짧게 두어 360px 화면 입력 안에 들어간다.
- `/` 단축키: 입력에 스크롤 없이 포커스를 준 뒤(`focus({ preventScroll: true })`) 검색 영역을 `scrollIntoView({ block: 'nearest' })` 로 보이게 한다. 검색 영역의 `scroll-mt-20`(80px)이 적용돼, 아래로 스크롤한 화면에서 눌러도 입력이 sticky 헤더(56px) 아래에 다 보인다.
- 입력: `search` 문자열.
- 처리 규칙:
  1. 백엔드: `search.strip()` 이 비어 있지 않으면 `%{trim 값}%` 로 `title`, `summary`, `tags`, `tech_stack`, `why_it_matters` 중 하나라도 `ILIKE` 일치하는 행을 고른다 (OR).
  2. 프론트: 입력 `onChange` 가 `search` 상태를 바로 바꾸고, `search` 가 요청 키에 들어 있어 키 입력마다 조회가 다시 일어난다. 폼 제출(Enter)은 `onPageChange(1)` 후 `loadNews()` 로 한 번 더 조회한다. "검색어 지우기" 는 `search` 를 `''`, page 를 1 로 바꾸고 검색창에 포커스를 둔다.
  3. 키 입력 자체로는 page 를 1 로 되돌리지 않는다. 제출·지우기·태그 선택 때만 1 로 돌린다.
  4. 프론트는 `search` 를 trim 하지 않고 그대로 쿼리에 넣는다 (빈 문자열만 생략).
- 출력: 일치 목록.
- 예외·엣지: 공백만 입력하면 백엔드에서 필터를 무시한다. 북마크 보기에서는 제목·요약만 대상으로 소문자 부분 일치(NEWS-07).
- 관련 코드: `backend/app/api/news.py:65-75`, `frontend/src/components/feed/FeedToolbar.tsx:28-29`, `:135-153`, `:213-216`, `frontend/src/components/ui/SearchField.tsx:17-57`, `frontend/src/hooks/useNewsFeed.ts:26`, `:65-69`, `:147-149`, `frontend/src/app/page.tsx:145-151`

## NEWS-06 정렬
- 진입점: 목록 머리줄(`FeedStatusBar`)의 정렬 선택 상자(`Select`, 네이티브 `<select>`, 숨긴 라벨 "정렬"). 모든 폭에서 목록 머리줄 오른쪽 끝, 상태 뒤이고 카드 바로 위다 (`w-28`, 1280px 이상 `w-32`. 높이 768px 미만 44px, 이상 36px). 필터 영역 안에는 없다. 상태 live 영역 밖의 형제라 정렬을 바꿔도 상태 알림으로 읽히지 않는다.
- 입력: `sort` 값과 옵션 라벨: `hot` 인기순(기본), `quality` 품질순, `latest` 최신순, `top` 추천순.
- 처리 규칙 (백엔드):
  1. `latest`: `published_at` 내림차순.
  2. `top`: `raw_score` 내림차순.
  3. `quality`: `quality_score` 내림차순, 동률이면 `hotness_score` 내림차순.
  4. 그 밖의 모든 값(`hot` 포함): `hotness_score` 내림차순, 동률이면 `published_at` 내림차순.
  5. 값을 바꾸면 `onSortChange` 후 page 1 (`FeedStatusBar` 가 둘 다 부른다).
- 출력: 선택 상자에 지금 정렬 라벨이 보인다.
- 예외·엣지: `hotness_score` 는 수집·재수집 시점에만 계산·저장되고 시간이 지나도 다시 계산하지 않는다 (`03-collection.md` COLL-12). 북마크 보기에서는 정렬이 적용되지 않고 북마크한 순서(최근 추가가 앞)로 보인다.
- 관련 코드: `backend/app/api/news.py:80-87`, `frontend/src/components/feed/FeedStatusBar.tsx:5-10`, `:75-85`, `frontend/src/app/page.tsx:209-211`, `frontend/src/components/ui/Select.tsx`, 동작 확인 테스트 `frontend/src/tests/feed/FeedStatusBar.test.tsx`

## NEWS-07 북마크
- 진입점: 카드 머리줄 오른쪽 북마크 버튼(접근 이름 "보관하기", 툴팁 "보관하기"/"보관됨", `aria-pressed`), 상세 대화상자 머리줄 북마크 버튼(접근 이름 "보관하기"/"보관됨"), 포커스 카드에서 `b`, 소스 칩 "북마크".
- 입력: `NewsItem` 전체 객체.
- 처리 규칙:
  1. localStorage 키 `agentlens_bookmarks` 에 `NewsItem[]` JSON 을 저장한다. 서버에는 저장하지 않는다.
  2. 저장값을 외부 저장소로 두고 `useSyncExternalStore` 로 읽어 `bookmarkedItems` 와 `bookmarkedIds` 를 만든다. 서버 렌더·하이드레이션 중에는 빈 목록이고, 다른 탭의 변경은 `storage` 이벤트로 반영한다.
  3. 토글: 이미 있으면 해당 id 를 제거, 없으면 배열 맨 앞에 추가하고 즉시 localStorage 에 쓴다. 이벤트가 넘어오면 `stopPropagation` 한다.
  4. 북마크 보기(`source === 'bookmarks'`): API 호출 없이 `bookmarkedItems` 를 복사해 `category !== 'all'` 이면 카테고리로, `search.trim()` 이 있으면 `title`/`summary` 소문자 부분 일치로 거른다. `total = 길이`, `totalPages = 1`.
- 출력: 북마크된 카드는 아이콘이 호박색으로 채워진다 (상세 대화상자는 강조색). 목록 머리줄 상태에 `북마크 보기` 배지. "북마크" 칩에 개수.
- 예외·엣지:
  - localStorage 읽기 실패는 빈 목록, JSON 파싱 실패는 `console.error` 후 빈 목록. 쓰기 실패는 `console.error` 하고 이 탭 메모리에만 값을 둔다.
  - 저장된 것은 추가 시점의 스냅샷이므로 DB 가 초기화되거나 기사 내용이 바뀌어도 그대로 남는다.
  - 북마크 보기에서는 정렬·Must-Read·페이지가 적용되지 않는다.
  - 북마크 보기 중 카테고리 칩을 누르면 source 가 `all` 로 바뀌어 북마크 보기가 해제된다 (NEWS-02).
- 관련 코드: `frontend/src/hooks/useBookmarks.ts:6-88`, `frontend/src/hooks/useNewsFeed.ts:100-133`, `frontend/src/components/NewsCard.tsx:128-138`, `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/components/feed/FeedToolbar.tsx:181-189`

## NEWS-08 기사 카드
- 진입점: 피드 그리드의 각 카드 (`NewsCard`, `article`, `data-feed-card`). 카드 전체 클릭 또는 제목 버튼(`h3` 안 `<button>`, Tab 으로 닿고 Enter·Space 로 누른다)으로 상세 대화상자를 연다.
- 입력: `item`, `isBookmarked`, `isFocused`, `preferSummary`(기본 false, 아래 규칙 5).
- 처리 규칙: 카드는 위에서 아래로 다섯 칸의 고정 틀이다 (`Card` 는 `h-full flex flex-col gap-3`). 그리드는 `items-stretch` 라 같은 줄의 카드는 가장 높은 카드에 맞춰 같은 높이가 되고, 칸 높이가 고정이라 같은 줄 카드의 제목·본문 위치가 맞는다.
  1. 머리줄(`data-card-meta`, 한 줄, 높이 768px 미만 44px·이상 32px): 왼쪽에 `카테고리 짧은 라벨`(굵게, `title` 에 긴 라벨 `categoryLabel`, 예: "에이전트" → "에이전트 아키텍처") · 소스 · 상대 시간을 한 줄로 쓰고 넘치면 말줄임한다. 오른쪽에 북마크 버튼(세로 가운데). 머리줄에는 배지를 두지 않는다.
  2. 카테고리 짧은 라벨(`lib/labels.ts` `categoryShortLabel`): `harness`→"하네스", `mcp_plugins_skills`→"MCP", `agent_tech`→"에이전트", `ai_news`→"AI 동향", 그 외 원값. 짧은 라벨은 모두 긴 라벨의 일부다. 챗 기사 칩·인용 팝오버·포커스 캡슐도 같은 짧은 라벨을 쓴다.
  3. 소스 라벨(`sourceLabel`): `rss_kr`→"국내 테크", `github`→"GitHub", `hackernews`→"HackerNews", `arxiv`→"arXiv", `huggingface`→"HuggingFace", `reddit`→"Reddit", `rss`→"Global Blogs", 그 외 원값. 필터 칩·상세 대화상자도 같은 라벨을 쓴다.
  4. 제목(`h3 > button`): 2줄 말줄임, 높이 2줄(48px) 고정. 한 줄짜리 제목도 2줄 자리를 차지한다.
  5. 본문(2줄 말줄임, 높이 2줄 고정): `why_it_matters` 가 있으면 왼쪽 강조선과 앞머리 "시사점"(굵게)이 붙은 시사점, 없고 `summary` 가 있으면 요약, 둘 다 없으면 빈 2줄 자리. 반복 시사점: 피드 화면은 지금 목록(`news`)에서 같은 시사점이 반복되는 기사를 찾아(`lib/feed-insights.ts` `findRepeatedInsights`) 그 카드에 `preferSummary` 를 넘긴다. `why_it_matters` 를 공백 정리(연속 공백을 하나로, 앞뒤 제거)한 문자열의 끝 40자를 키로 세어, 정리한 길이가 20자 이상이고 같은 키가 2번 이상 나온 기사가 대상이다 (끝을 보는 이유: backend 가 기술 이름 접두를 붙인 같은 고정 문장도 함께 잡으려고). `preferSummary` 이고 `summary` 가 있으면 시사점 대신 요약을 보인다. 요약이 없으면 시사점을 그대로 보인다.
  6. 배지 줄(`data-card-badges`, Must-Read 이거나 기술 스택이 있을 때만, 한 줄): `is_high_signal` 이면 "Must-Read" 배지(별) 1개, 그 뒤 `tech_stack` 앞 3개 배지. 카드당 배지는 최대 4개다. 자리가 모자라면 기술 배지끼리 줄어든다: 각 기술 배지는 48px(`min-w-12`)~128px(`max-w-32`) 사이에서 줄고(`Badge shrink`), 글자는 말줄임표로 끝나며(`min-w-0 truncate` 감싸개), `title` 에 기술 이름 전체가 있다. 짧은 이름은 글자 폭 그대로다. "Must-Read" 배지는 줄지 않는다. 그래서 가장 좁은 카드(1024~1279px 3열, 안쪽 약 266px)에서도 Must-Read 와 긴 기술 3개가 글자 중간에서 잘리지 않고 한 줄에 든다. 줄의 `overflow-hidden` 은 계산이 어긋날 때 카드 밖으로 밀리지 않게 하는 안전장치다. 3개 넘는 기술과 잘린 이름 전체는 기사 상세 대화상자의 기술 목록에서 본다 (카드에 '+N'·펼침 없음).
  7. 바닥(구분선 위, 카드 맨 아래): 왼쪽 통계 묶음 — 원천 지표, 개수, 인기 점수 순 — 과 오른쪽 버튼 묶음이다. 바닥 줄은 줄바꿈(`flex-wrap`)하고 버튼 묶음은 `ml-auto` 라, 한 줄에 다 들지 않으면(예: 통계가 긴 GitHub 카드) 버튼 묶음이 다음 줄 오른쪽 끝으로 내려간다. 같은 줄 카드는 높이가 같고 바닥이 카드 아래에 붙으므로, 한 줄 바닥 카드와 두 줄 바닥 카드가 같은 줄에 섞일 수 있다.
     - 원천 지표: 소스가 실제 지표를 주는 `github`(스타)·`hackernews`(포인트)·`reddit`(추천)이고 `raw_score > 0` 일 때만 천 단위 구분 숫자로 그린다. 아이콘은 스타 `Star`, 포인트·추천 `ArrowBigUp`. 화면 읽기는 "스타"·"포인트"·"추천", 툴팁은 "GitHub 스타"·"HackerNews 포인트"·"Reddit 추천". 그 밖 소스(`rss_kr`·`rss`·`arxiv`·`huggingface`, 모르는 소스)는 `raw_score` 가 0 보다 커도 그리지 않는다 (수집기가 넣는 고정·합성 값이라 정보가 아니다, `03-collection.md` COLL-03~07).
     - 개수: `comments_count > 0` 이면 숫자를 그린다. `github` 은 포크 수라 `GitFork` 아이콘·화면 읽기 "포크"·툴팁 "GitHub 포크", 그 밖은 `MessageSquare` 아이콘·화면 읽기와 툴팁 "댓글".
     - 인기 점수: 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`, `scoreMetric(source) !== null`)이고 `hotness_score > 25` 이면 불꽃 아이콘과 반올림한 인기 점수(화면 읽기 "인기 점수"). 인기 점수는 `raw_score` 에서 계산되므로(`03-collection.md` COLL-12) 그 밖 소스에서는 합성 값이라 그리지 않는다. 그래서 지표 없는 소스의 카드 바닥 통계는 비거나 댓글 수만 남는다.
     - 지표 종류와 라벨은 `lib/labels.ts` 의 `scoreMetric(source)`(표에 없으면 `null`, 원천 지표와 인기 점수 둘 다의 표시 조건)·`countMetric(source)`·`SCORE_METRIC_LABELS`·`COUNT_METRIC_LABELS` 에서 나온다. 카드에 `data-source`, 통계마다 `data-card-stat`(`score`·`count`·`hotness`)과 `data-metric`(`stars`·`points`·`upvotes`·`forks`·`comments`, 인기 제외)을 둔다. 별 아이콘은 GitHub 스타와 Must-Read 배지(채운 별)에만 쓴다.
     - 버튼 묶음: "AI 챗에서 분석" 버튼(접근 이름 = 보이는 글자 "AI 챗에서 분석", 툴팁 "AI 챗에서 이 기사를 단일 기사 모드로 분석", NEWS-19)과 "원문" 링크(새 탭, 클릭 전파 차단). 버튼 글자는 모든 폭에서 보인다. 768px 미만에서 두 조작은 높이 44px.
  8. 상대 시간(`published_at` 기준): 3600초 미만 "N분 전"(최소 1), 86400초 미만 "N시간 전", 그 외 "N일 전". 현재 시각은 60초마다 갱신되는 공유 시계에서 읽는다.
  9. `isFocused` 면 강조색 링과 `data-focused="true"`.
  10. 로딩 중 스켈레톤(`NewsCardSkeleton`)은 같은 틀(머리줄, 제목 2줄, 본문 2줄, 바닥)과 같은 높이 클래스를 써서 카드로 바뀔 때 높이가 흔들리지 않는다.
- 출력: 카드 UI. `quality_score` 숫자는 카드에 표시하지 않는다.
- 예외·엣지: 날짜 파싱 예외 시 빈 문자열. 북마크 보기에서도 반복 시사점 판정은 지금 보이는 목록으로 한다.
- 관련 코드: `frontend/src/components/NewsCard.tsx:80-238`, `:89-93`, `:115-125`, `:164-178`, `:180-235`, `frontend/src/components/ui/Badge.tsx`, `frontend/src/components/feed/NewsCardSkeleton.tsx`, `frontend/src/lib/feed-insights.ts`, `frontend/src/app/page.tsx:71-72`, `:235-250`, `frontend/src/components/chat/HandoverCtaButton.tsx:67-79`, `frontend/src/lib/labels.ts:15-20`, `:51-70`, `:84-119`, 동작 확인 테스트 `frontend/src/tests/NewsCard.test.tsx`, `frontend/src/tests/feed/FeedInsights.test.ts`

## NEWS-09 기사 상세 대화상자
- 진입점: 카드 클릭, 카드 제목 버튼, 포커스 카드에서 `Enter`/`Space`(포커스가 `document.body` 에 있을 때, NEWS-16).
- 입력: 선택된 `NewsItem` (피드 목록의 객체를 그대로 쓴다. 상세 API 를 다시 호출하지 않는다).
- 처리 규칙:
  1. 대화상자는 `key = news-modal-{id}` 로 렌더링되어 기사마다 새로 마운트된다.
  2. 머리줄: 카테고리 긴 라벨 배지(`categoryLabel`, 예: "하네스 & 벤치마크", 필터 칩과 같은 문구), Must-Read 배지, 제목(`h2`, 2줄 말줄임, 대화상자의 `aria-labelledby`), 북마크 버튼, 닫기 버튼("닫기").
  3. 탭 2개(`Tabs`, `aria-label="기사 보기"`): "AI 요약 & 시사점"(기본), "AI 질의응답"(대화가 있으면 건수 배지).
  4. 요약 탭 내용 순서: "개발자 시사점"(`why_it_matters` 가 있을 때), "AI 챗에서 분석" 배너(NEWS-19), "핵심 요약 3줄"(`tldr_bullets` 가 있을 때), "기술 스택"(전체 `tech_stack`), "상세 본문 요약"(`summary` 를 `MarkdownViewer` 로 렌더링).
  5. `MarkdownViewer`: react-markdown + remark-gfm. 언어 표시가 있거나 여러 줄인 코드는 `CodeBlock`(언어 라벨·복사 버튼·가로 스크롤), 표는 가로 스크롤 래퍼, 링크는 새 탭(`noopener noreferrer`). `content` 가 비면 렌더링하지 않는다.
  6. 바닥: "출처: {소스 라벨}"(`sourceLabel`), `author` 가 있으면 "by {author}"(768px 이상), "원문 링크 방문"(새 탭, 주 버튼 모양 링크).
  7. 닫기: 닫기 버튼, 배경막 클릭, `Escape`(오버레이 스택이 맨 위 레이어만 닫는다. 질의응답 탭 질문 입력창 안의 Escape 는 닫지 않는다, NEWS-10). 닫을 때 진행 중 스트림을 abort 하고 탭·대화·입력·복사 표시(타이머 포함)·확인 창 상태를 초기화한다. `isOpen` 이 false 가 될 때도 같은 초기화를 한다.
- 출력: 대화상자(`Dialog size="xl"`: 768px 이상 너비 896px·높이 최대 85dvh, 768px 미만 전체 화면). `role="dialog"`, `aria-modal="true"`, 포커스 트랩, 닫으면 연 요소로 포커스 복귀.
- 예외·엣지: `isOpen` 이 false 거나 `item` 이 null 이면 렌더링하지 않는다. 대화 내역은 메모리에만 있고 대화상자를 닫으면 사라진다.
- 관련 코드: `frontend/src/components/NewsDetailModal.tsx:35-413`, `frontend/src/components/MarkdownViewer.tsx:27-134`, `frontend/src/components/ui/Dialog.tsx`, `frontend/src/app/page.tsx:102-105`, `:276-282`

## NEWS-10 기사 단위 AI 질문 (스트리밍)
- 진입점: 상세 대화상자 "AI 질의응답" 탭(`AskAiPanel`). 바닥 고정 입력창(숨긴 라벨 "질문 입력", 자리표시 "이 기사에 대해 질문하세요") + "전송", 빠른 질문 칩 4개(`aria-label="빠른 질문"`, 한 줄 가로 스크롤, 768px 미만은 좌우 화면 끝까지. 넘침 표시는 NEWS-02 의 가로 스크롤 규칙과 같다). API `POST /api/news/{news_id}/ask/stream`.
- 입력:
  - 요청 본문 `{ "question": string }` (`AskQuestionRequest`). 백엔드는 길이·공백 검증을 하지 않는다.
  - 프론트는 `(queryToAsk || question).trim()` 이 비거나 이미 질문 중(`asking`)이면 보내지 않는다. 전송 버튼은 `!question.trim()` 이면 비활성, 질문 중에는 진행 표시로 바뀐다. 질문 중에는 입력창과 빠른 질문 칩도 비활성.
  - 빠른 질문: "핵심 원리 및 구조"(`Cpu`), "실무 프로젝트 도입"(`Layers`), "차별점 및 한계"(`Sparkles`), "보안 및 샌드박스"(`ShieldCheck`). 버튼마다 글자 앞에 괄호 안 lucide 아이콘(`aria-hidden`)을 그리고, 누르면 각각 고정 한국어 질문문을 보낸다.
- 처리 규칙 (백엔드):
  1. `news_id` 로 기사를 찾고 없으면 404 `"News item not found"`.
  2. 기사 `title`, `summary`, `category`, `tech_stack`(콤마 split) 과 질문으로 `llm_processor.stream_question_answer` 를 호출한다.
  3. 캐시 키 `"{title.strip()}:{question.strip().lower()}"` 가 메모리 캐시(`_qa_cache`, 프로세스 수명 동안 유지, 크기 제한 없음)에 있으면 `meta`(모델명 + " (캐시됨)") 후 답을 공백 기준 4단어씩 `token` 으로 0.01초 간격 전송, 마지막에 `done`.
  4. 캐시가 없으면 "수석 아키텍트" 역할의 한국어 마크다운 프롬프트를 만든다 (기사 제목·내용·분류·기술 스택·질문, 작성 가이드 4개 항목).
  5. 1순위 Anthropic: API 키가 있으면 `stream_chat` 으로 스트리밍. 첫 청크에서 `meta`(모델 id), 이후 `token`. 누적 텍스트가 비어 있지 않으면 성공.
  6. 2순위 OpenAI: 1순위가 성공하지 않았고 OpenAI 키가 있으면 공식 SDK 스트리밍(`OPENAI_MODEL`, 기본 `gpt-4o-mini`, temperature 0.3, max_tokens 2048). 스트림 시작 전에 `meta` 를 보낸다.
  7. 3순위 휴리스틱: 둘 다 실패하거나 텍스트가 비면 `_generate_heuristic_answer` 의 고정 템플릿 답을 `meta`("AgentLens Heuristic Engine") 후 4단어씩 0.015초 간격 전송. 템플릿은 질문 키워드로 고른다: 적용/도입/사용/구현/어떻게/how/apply/build → 도입 가이드, 차이/비교/장점/단점/한계/vs/difference/compare → 비교, 원리/구조/아키텍처/동작/왜/why/architecture → 원리, 보안/격리/안전/안정/security/sandbox/safety → 보안, 그 외 → 일반 분석.
  8. 이 경로에는 Ollama·Gemini 가 없다.
  9. 최종 텍스트가 있으면 캐시에 저장하고 `done`(`total_text`)을 보낸다.
  10. 응답: `text/event-stream`, 헤더 `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`. 각 이벤트는 `data: {json}\n\n` 한 줄이며 이벤트 종류는 SSE `event:` 필드가 아니라 JSON 의 `event` 키(`meta`/`token`/`done`)로 구분한다. `error` 이벤트는 없다.
- 처리 규칙 (프론트):
  1. 이전 요청의 AbortController 가 있으면 abort 하고 새로 만든다. 입력을 비우고 `asking=true`, 탭을 "AI 질의응답" 으로 바꾼다.
  2. 대화 내역에 `{ q, a: '', model: 'Gemini 실시간 스트리밍...', time: ko-KR HH:MM, isStreaming: true }` 를 추가한다.
  3. `askQuestionAboutNewsStream`: Next.js 프록시 버퍼링을 피하려고 `getDirectApiBase()`(환경변수 `NEXT_PUBLIC_API_URL`, 없으면 `{현재 protocol}//{hostname}:8000`)로 직접 POST 한다. 네트워크 예외(AbortError 제외) 시 상대 경로로 한 번 더 시도한다. 타임아웃은 없다.
  4. 응답 바디를 `\n\n` 단위로 나눠 `data: ` 줄을 JSON 파싱한다. `meta` → 마지막 메시지 `model` 교체, `token` → 마지막 메시지 `a` 에 이어붙임, `done` → 반환값만 `total_text` 로 교체(화면 텍스트는 토큰 누적분을 유지). 파싱 실패 줄은 무시.
  5. 끝나면 `isStreaming=false`, `asking=false`.
  6. 답변 영역: 스트리밍 중 내용이 없으면 "AI가 실시간 스트리밍 답변을 생성하는 중입니다...", 내용이 생기면 `MarkdownViewer` + 깜빡이는 커서. 모델명(`c.model || 'AgentLens AI'`), 시간, "복사" 버튼(스트리밍 중이거나 빈 답이면 비활성). 복사에 성공하면 2초간 "복사됨", 실패하면 2초간 경고 아이콘 + "복사 실패" 를 보이고 실패 문구를 `aria-live="polite"` 영역에도 넣는다 (`07-ui-common.md` UI-13).
  7. "대화 초기화"(대화가 있을 때만 보인다)는 확인 대화상자(`ConfirmDialog` 위험 톤, 제목 "대화 초기화", 설명 "AI 대화 내역을 모두 초기화하시겠습니까?", 버튼 "취소"/"초기화")를 거친 뒤 내역을 비운다.
  8. 새 메시지·asking 변화마다 끝으로 스크롤한다 (`prefers-reduced-motion: reduce` 면 즉시, 아니면 부드럽게).
  9. 질문 입력창에서 누른 Escape 는 대화상자를 닫지 않는다. IME 조합 중이 아니면 기본 동작을 막고 포커스를 질의응답 탭 패널로 옮긴다. 입력한 글자와 대화는 그대로이고, 패널에서 다시 누른 Escape 는 대화상자를 닫는다 (`07-ui-common.md` UI-08).
- 출력: SSE 이벤트 스트림 / 말풍선 대화 UI. 대화가 없으면 가운데에 "이 소식에 대해 무엇이든 질문해보세요" 안내.
- 예외·엣지:
  - HTTP 오류나 바디 없음: `detail` 이 있으면 그 문구, 없으면 `AI 스트리밍 연결 실패 (status)` 로 예외. 답이 비어 있던 메시지는 `AI 응답 생성 실패: {메시지}`, 모델 `Error` 로 바뀐다. 이미 일부 답이 있으면 스트리밍 표시만 끈다.
  - 사용자가 대화상자를 닫거나 새 질문을 보내 abort 하면 `AbortError` 는 조용히 무시한다.
  - LLM 키가 하나도 없어도 휴리스틱 답이 나오므로 HTTP 오류가 나지 않는다.
- 관련 코드: `backend/app/api/news.py:137-167`, `backend/app/services/llm_processor.py:794-853`, `backend/app/services/llm_processor.py:855-972`, `frontend/src/lib/api.ts:12-23,88-169`, `frontend/src/components/NewsDetailModal.tsx:122-237`, `:402-410`, `frontend/src/components/news-detail/AskAiPanel.tsx:45-271`, 동작 확인 테스트 `frontend/src/tests/AskAiPanel.test.tsx`, `frontend/src/tests/modals/NewsDetailModal.test.tsx`

## NEWS-11 기사 단위 AI 질문 (일괄 응답)
- 진입점: API `POST /api/news/{news_id}/ask`. 프론트 `askQuestionAboutNews`(30000ms 타임아웃)가 정의되어 있으나 화면에서 호출하는 곳은 없다.
- 입력: `{ "question": string }`.
- 처리 규칙:
  1. 기사가 없으면 404.
  2. `answer_question_with_meta`: NEWS-10 과 같은 캐시 키로 캐시 조회. 캐시가 없으면 같은 프롬프트로 `_generate_live_answer` 를 호출한다. 이 함수는 `generate_live_answer` 의 모든 예외를 삼키고 `(None, None)` 을 돌려준다. 프로바이더 순서는 Anthropic → OpenAI → Ollama (`03-collection.md` COLL-20).
  3. 답이 있으면 캐시에 저장하고 반환, 없으면 휴리스틱 템플릿 답과 모델명 `"AgentLens Heuristic Engine"`.
- 출력: `AskQuestionResponse { news_id, question, answer, model_used }`.
- 예외·엣지: 휴리스틱 답은 캐시에 저장하지 않는다 (스트리밍 경로는 휴리스틱 답도 저장한다).
- 관련 코드: `backend/app/api/news.py:111-135`, `backend/app/services/llm_processor.py:756-792`, `frontend/src/lib/api.ts:70-86`

## NEWS-12 기사 단건 조회
- 진입점: API `GET /api/news/{news_id}` (정수). 메인 피드 UI 는 호출하지 않는다.
- 처리 규칙: id 로 조회 후 `format_news_item` 변환.
- 출력: `NewsItemResponse`.
- 예외·엣지: 없으면 404 `{"detail": "News item not found"}`. 정수가 아니면 422.
- 관련 코드: `backend/app/api/news.py:104-109`

## NEWS-13 RSS 출력
- 진입점: 헤더 더보기 메뉴 "RSS 피드"(새 탭, `/api/news/feed/rss.xml`), 커맨드 팔레트 "RSS 피드 열기"(새 탭), API `GET /api/news/feed/rss.xml`. 모든 폭에서 같다.
- 입력: `category` (선택). `"all"` 이 아니면 그대로(소문자 변환 없이) 일치 비교.
- 처리 규칙:
  1. `published_at` 내림차순 상위 50건.
  2. 각 `<item>`: `title`, `link`, `description`(`summary`), `guid`(`url`) 은 `xml.sax.saxutils.escape` 로 이스케이프, `category` 는 이스케이프하지 않는다. `pubDate` 는 `"%a, %d %b %Y %H:%M:%S GMT"` 형식.
  3. 채널: 제목 "AgentLens RSS", 링크 `http://localhost:3000`(고정), 설명 "Global AI, Agent, Harness &amp; MCP News".
- 출력: `application/xml`, RSS 2.0.
- 예외·엣지: 결과가 없으면 item 없는 채널. `summary` 가 null 인 행은 `escape(None)` 에서 예외가 나 500 이 될 수 있다 (모델 기본값은 `""`).
- 관련 코드: `backend/app/api/news.py:169-197`, `frontend/src/components/Header.tsx:37,89,215`, `frontend/src/components/CommandPalette.tsx:139-149`

## NEWS-14 트렌드 레이더
- 진입점: 요약 바(`InsightsBar`, 48px 한 줄) 오른쪽 "트렌드" 펼침 버튼(`aria-expanded`, `aria-controls`). 1024px 이상은 버튼 왼쪽에 "급상승" + 상위 3개 태그 칩(`role="group" aria-label="급상승 태그"`, 가로 스크롤 줄, 누르면 검색)을 함께 보인다. 768~1023px 은 "트렌드" 버튼만 보인다 (브리핑 헤드라인 자리를 남기려고). 기본은 접힌 상태이고, 펼치면 요약 바 아래 12px 에 레이더 패널(`TrendRadarPanel`, `section aria-label="트렌드 레이더"`)을 그린다. 접힌 패널 자리는 `hidden` 이라 여백을 만들지 않는다. API `GET /api/trends/radar`.
- 입력: 없음.
- 처리 규칙 (백엔드 `TrendService.get_tech_radar`):
  1. `published_at` 내림차순 최근 500건을 읽는다.
  2. 기사마다 `tech_stack` 을 콤마로 나눠 trim 하고 길이가 1 이하인 값은 버린 뒤 기사 내 중복을 제거한다.
  3. 태그별 전체 건수(`count`)와 최근 24시간(`published_at >= now-24h`, naive 는 UTC 로 간주) 건수(`recent_count`)를 센다. `sample_news_id` 는 그 태그가 처음 나온(가장 최신) 기사 id.
  4. 전체 건수 상위 25개 태그를 만든다. 태그 분류(`classify_tag_category`)는 `CATEGORY_MAP` 4개 그룹("Harness & Benchmark", "Protocols & Tooling", "Models & Reasoning", "Infra & Runtime")의 키워드와 대소문자 무시 정확 일치 또는 부분 포함으로, 그룹 순서대로 첫 일치를 쓴다. 일치 없으면 "Protocols & Tooling".
  5. velocity: `recent_count >= 3` 이면 `"+{recent_count*20}%"`, `recent_count > 0` 이면 `"+25%"`, `count >= 8` 이면 `"HOT"`, 그 외 `"STEADY"`.
  6. 급상승(`surging_tags`): 상위 25개 중 `recent_count > 0` 또는 `count >= 5` 인 것을 `(recent_count, count)` 내림차순 정렬해 6개.
  7. 카테고리 분포: 상위 25개 태그의 `count` 를 그룹별로 합하고 전체 합(0 이면 1) 대비 백분율(소수 1자리). 4개 그룹을 항상 `CATEGORY_MAP` 순서로 돌려준다.
  8. 요청마다 DB 를 읽어 계산한다. 캐시는 없다.
- 처리 규칙 (프론트):
  1. 통계·브리핑과 함께 `Promise.allSettled` 로 가져온다. 셋 중 하나가 실패해도 나머지는 반영한다. 레이더 요청이 실패하면 이전 레이더 값(처음이면 없음)을 그대로 둔다.
  2. 요약 바 스켈레톤: 통계·브리핑·레이더 첫 읽기가 끝나기 전이고 보여 줄 브리핑·레이더가 없을 때만 요약 바 자리에 48px 스켈레톤을 그린다. 다시 읽는 동안(수집 중 새 소식 저장, 수집 끝, 소스 변경)에는 이전 브리핑·레이더를 그대로 그린다. 레이더 `tags` 가 비면 "트렌드" 버튼과 패널을 그리지 않고, 브리핑도 없으면 요약 바 전체를 그리지 않는다.
  3. 펼친 패널 맨 위에 "{total_analyzed}개 아티클 분석".
  4. 펼친 패널: "최근 24시간 급상승 기술 스택"(칩: 태그명·velocity·건수, 6개), "카테고리 분포"(4개 그룹 백분율. 640px 미만 1열, 640px 이상 2열, 1024px 이상 4열. 이름이 넘치면 말줄임하고 `title` 에 전체 이름), "전체 기술 태그 (누르면 검색)" 칩 구름, 선택 태그가 있으면 "필터 초기화" 버튼.
  5. 카테고리 분포 라벨은 응답의 영문 그룹 이름을 한국어로 바꿔 보인다 (`lib/labels.ts` `radarCategoryLabel`): "Harness & Benchmark"→"하네스 & 벤치마크", "Protocols & Tooling"→"프로토콜 & 도구", "Models & Reasoning"→"모델 & 추론", "Infra & Runtime"→"인프라 & 런타임", 그 외 이름은 그대로. 그룹 아이콘과 목록 키는 영문 원값으로 고른다.
  6. 태그 칩 클릭: 이미 선택된 태그면 `''`, 아니면 태그명으로 `handleSelectTag` → `selectedTag` 설정, `search` 를 태그명으로, page 1. 즉 태그 선택은 NEWS-05 검색으로 동작한다. 선택된 태그 칩은 `aria-pressed="true"`.
- 출력: `{ updated_at, total_analyzed, surging_tags: TrendingTag[], categories: [{name, count, percentage}], tags: TrendingTag[] }`. `TrendingTag = { name, count, category, recent_count, velocity, sample_news_id }`. 기사가 0건이면 `total_analyzed: 0` 과 빈 배열들.
- 예외·엣지: 응답 스키마(Pydantic response_model)가 없다. `sample_news_id` 는 프론트에서 쓰지 않는다. 검색창을 직접 고쳐도 `selectedTag` 는 그대로 남는다. 세 요청이 모두 실패해도 첫 읽기는 끝난 것으로 보아 스켈레톤을 거두고, 보여 줄 것이 없으면 요약 바를 그리지 않는다.
- 관련 코드: `backend/app/api/trends.py:6-9`, `backend/app/services/trend_service.py:9-139`, `frontend/src/components/feed/InsightsBar.tsx:23-120`, `frontend/src/components/feed/TrendRadarPanel.tsx:35-103`, `frontend/src/lib/labels.ts:22-27`, `:53-56`, `frontend/src/hooks/useNewsFeed.ts:37-69`, `frontend/src/types/trends.ts`, 동작 확인 테스트 `frontend/src/tests/feed/InsightsBar.test.tsx`, `frontend/src/tests/feed/TrendRadarPanel.test.tsx`, `frontend/src/tests/hooks/useNewsFeed.test.tsx`

## NEWS-15 통계
- 진입점: API `GET /api/stats`. 화면 목록 머리줄 상태의 " (전체 N건)"(필터가 걸려 있을 때 `stats.total_news`), 카테고리 칩 건수, 소스 칩 건수.
- 처리 규칙:
  1. `count(id)` 전체, `category` 별 group by 건수, `source` 별 group by 건수.
  2. `last_updated` 는 응답 시점의 현재 UTC 시각(ISO)이다. 마지막 수집 시각이 아니다.
  3. 프론트는 첫 마운트, 헤더 `onRefresh`(수집 중 새 소식 저장, 수집 끝, 초기화), 소스 대화상자의 변경 알림 때 다시 가져온다.
- 출력: `StatsResponse { total_news, category_counts: {str: int}, source_counts: {str: int}, last_updated }`.
- 예외·엣지: 통계 요청이 실패하면 콘솔 오류만 남기고 이전 통계(처음이면 없음)를 그대로 둔다. 브리핑·레이더는 따로 반영된다 (`Promise.allSettled`). 통계가 없으면 목록 머리줄 상태는 목록 `total` 만 보이고 "(전체 N건)" 을 붙이지 않으며, 칩 건수는 0 으로 보인다.
- 관련 코드: `backend/app/api/stats.py:11-21`, `backend/app/schemas/news.py:142-146`, `frontend/src/hooks/useNewsFeed.ts:37-63`, `frontend/src/components/feed/FeedStatusBar.tsx:62-67`, `frontend/src/app/page.tsx:91`, `:155-164`, `:188-212`, `:293-300`

## NEWS-16 피드 키보드 단축키
- 진입점: 메인 페이지의 `HotkeyListener` (window keydown). ⌘K 는 `Header`, Escape 는 오버레이 스택이 처리한다.
- 처리 규칙:
  1. IME 조합 중(`isComposing` 또는 `keyCode 229`)이면 무시.
  2. `Cmd/Ctrl+K`: 메인 페이지는 `HotkeyListener` 에 팔레트 콜백을 넘기지 않는다. `Header` 의 `useHotkey('mod+k')` 가 팔레트가 맨 위 레이어면 닫고, 다른 레이어가 열려 있으면 무시하고, 아니면 연다. 입력창 안에서도 동작.
  3. `Escape`: 메인 페이지는 닫기 콜백을 넘기지 않는다. 오버레이 스택이 맨 위 레이어(대화상자·메뉴·팝오버) 하나만 닫는다.
  4. 대화상자·메뉴·팝오버가 하나라도 열려 있으면(`useOverlayOpen()` → `blockSingleKeys`) 아래 단일 키를 모두 무시한다.
  5. 입력 요소(INPUT/TEXTAREA/SELECT/contentEditable/`role="combobox"`) 안에서는 단일 키를 무시한다. Meta/Ctrl/Alt 조합도 무시.
  6. 글자 키는 `e.key` 소문자로, 아니면 `e.code`(`KeyJ`, `KeyK`, `KeyB`, `KeyC`, `KeyT`, `Slash`)로 판정한다 (한글 입력 상태에서도 동작).
  7. `j`: 포커스 다음 카드(마지막에서 멈춤), `k`: 이전 카드(0 에서 멈춤). 초기 포커스는 -1 이며 `j` 첫 입력 시 0. 그 카드의 제목 버튼으로 DOM 포커스를 옮기고 `scrollIntoView({ block: 'nearest' })` 한다.
  8. `Enter`/`Space`: 이벤트 대상이 `document.body` 일 때만 포커스 카드 상세 대화상자를 연다 (포커스 없으면 아무것도 안 함). 버튼·링크 등에서는 브라우저 기본 동작을 가로채지 않는다 (카드 제목 버튼은 기본 동작으로 상세를 연다).
  9. `b`: 포커스 카드 북마크 토글. `c`: `/chat?sourceId={id}` 로 이동. `/`: 검색창 포커스(스크롤한 화면이면 검색 영역을 헤더 아래로 보이게 함, NEWS-05). `t`: 테마 순환(UI-03).
- 출력: 포커스 카드 링 표시와 DOM 포커스 이동.
- 예외·엣지: 목록이 비면 이동하지 않는다. 목록(페이지·카테고리·소스·검색어·정렬·Must-Read)이 바뀌면 `focusedIndex` 를 -1 로 되돌린다. 화면 폭과 관계없이 하드웨어 키보드가 있으면 같다.
- 관련 코드: `frontend/src/components/HotkeyListener.tsx:47-191`, `frontend/src/app/page.tsx:83-154`, `frontend/src/components/Header.tsx:68-81`, `frontend/src/lib/overlay-stack.ts`

## NEWS-17 데이터 전체 삭제·초기화
- 진입점: 헤더 더보기 메뉴 마지막 "초기화 & 재수집…"(구분선 뒤 위험 톤, 수집 중이면 비활성), 스케줄 대화상자 '위험 영역' 의 "초기화 & 재수집…" 버튼(수집 중이면 비활성), 커맨드 팔레트 "수집 데이터 초기화 & 재수집". 셋 모두 확인 대화상자(`ResetConfirmDialog`: `role="alertdialog"`, 제목 "수집 데이터 전체 삭제 및 재수집", 버튼 "취소"(처음 포커스) / "전체 삭제 후 다시 수집", 768px 미만 바텀시트)를 거친다. API `POST /api/schedule/reset-and-collect`, `DELETE /api/news/all`.
- 처리 규칙:
  1. `DELETE /api/news/all`: `news_items` 전체 삭제 후 커밋, `{"status": "success", "deleted_count": n}` (rowcount 가 없거나 0 이하이면 0). `crawl_logs` 는 지우지 않는다. 프론트 `deleteAllNews` 는 정의만 있고 화면에서 호출하지 않는다.
  2. `POST /api/schedule/reset-and-collect`: 수집 중이면 삭제 없이 `already_running` 과 안내 문구, `deleted_count: 0`. 아니면 `news_items`·`crawl_logs` 전체 삭제, 수집기 메모리 카운터 초기화(`step_message` "🧹 기존 데이터 삭제 완료. 실시간 재수집을 시작합니다.") 후 백그라운드로 전체 수집을 시작하고 `started` 와 `"기존 데이터 {n}건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다."` 를 돌려준다. 상세는 `03-collection.md` COLL-18.
  3. 프론트: 확인을 누르면 버튼이 "초기화 중..." 진행 표시로 바뀐다. 성공 시 확인 창을 닫고 피드·통계를 새로고침(`onRefresh`)한 뒤 수집 진행 줄에 `"기존 {deleted_count}건 삭제 완료. 신규 수집 중..."` 을 띄우고 진행 폴링(1200ms)을 시작한다. 요청 중 플래그로 두 번 요청을 막는다. 응답이 `already_running` 이면 실패로 다뤄 응답 문구를 확인 창 안 오류로 보이고, 새로고침·진행 폴링을 하지 않는다 (`07-ui-common.md` UI-02).
- 출력: JSON 상태 / 헤더 아래 수집 진행 줄.
- 예외·엣지: 인증·확인 토큰이 없어 누구나 호출할 수 있다. 프론트는 실패 시 확인 창 안에 오류 알림(오류 메시지, 없으면 "초기화 실패")을 보이고 창을 연 채 둔다. 진행 중에는 Escape·배경막·취소가 무시된다. 화면이 수집 중으로 알고 있으면(`isCollecting`) 더보기 항목·스케줄 대화상자 버튼은 비활성, 커맨드 팔레트 명령은 `aria-disabled` 라 실행되지 않는다. 화면이 모르는 수집(다른 탭 등)은 백엔드가 `already_running` 으로 막고 확인 창이 그 문구를 보인다. localStorage 북마크는 지워지지 않는다.
- 관련 코드: `backend/app/api/news.py:96-102`, `backend/app/api/schedule.py:69-99`, `frontend/src/lib/api.ts:246-268`, `frontend/src/components/ResetConfirmDialog.tsx:18-62`, `frontend/src/hooks/useCollector.ts:201-220`, `frontend/src/components/Header.tsx:111-119,216-218`, `frontend/src/components/ScheduleModal.tsx:63-81`, `frontend/src/components/CommandPalette.tsx:150-158`, `backend/tests/test_reset_and_delete.py`

## NEWS-18 일일 브리핑 바로가기
- 진입점: 요약 바(`InsightsBar`) 왼쪽 브리핑 버튼. API `GET /api/briefing/today`.
- 처리 규칙:
  1. 통계·레이더와 함께 `Promise.allSettled` 로 가져온다. 성공하고 값이 있을 때만 상태를 갱신하고, 실패하면 이전 값(처음이면 없음)을 그대로 둔다. 다시 읽는 동안에도 이전 브리핑을 그린다 (NEWS-14 규칙 2).
  2. `briefing` 이 null 이면 브리핑 버튼을 그리지 않는다 (레이더도 없으면 요약 바 전체를 그리지 않는다).
  3. 표시: 768px 이상 "오늘의 브리핑 · {briefing.date} · {briefing.headline}", 768px 미만은 날짜를 숨긴 "오늘의 브리핑 · {briefing.headline}". 한 줄 말줄임이고, 버튼은 요약 바의 남는 폭을 모두 쓴다 (급상승 칩은 1024px 이상에서만 같은 줄에 온다, NEWS-14). 누르면 일일 브리핑 대화상자를 연다.
- 출력: 요약 바 버튼. 브리핑 생성 규칙과 대화상자는 브리핑 영역 문서에서 다룬다.
- 관련 코드: `frontend/src/components/feed/InsightsBar.tsx:54-76`, `frontend/src/hooks/useNewsFeed.ts:45-59`, `frontend/src/app/page.tsx:174-181`, `:284-289`, 동작 확인 테스트 `frontend/src/tests/feed/InsightsBar.test.tsx`

## NEWS-19 AI 챗 핸드오버
- 진입점: 카드 "AI 챗에서 분석" 버튼(접근 이름 = 보이는 글자, 툴팁 "AI 챗에서 이 기사를 단일 기사 모드로 분석"), 상세 대화상자 요약 탭의 "AI 챗에서 분석" 배너(보조 문구 "이 기사를 단일 기사 모드로 열어 질의응답"), 포커스 카드에서 `c`. 카드·배너·헤더 내비·챗 제목이 같은 이름 "AI 챗" 을 쓴다.
- 처리 규칙:
  1. `/chat?sourceId={item.id}` 로 `router.push`. 상세 배너는 `draftQuestion` 이 trim 후 비어 있지 않으면 `&q={encodeURIComponent}` 를 붙인다 (요약 탭에는 입력창이 없어 보통 비어 있다).
  2. 클릭 이벤트 전파를 막아 카드 클릭(상세 열기)이 일어나지 않는다. 상세 배너는 이동 전에 대화상자를 닫는다.
- 출력: 챗 화면 이동. 챗은 그 기사의 단일 기사 범위로 시작한다. 이후 동작은 챗 영역 문서에서 다룬다.
- 관련 코드: `frontend/src/components/chat/HandoverCtaButton.tsx:18-80`, `frontend/src/components/NewsCard.tsx:218-222`, `frontend/src/components/NewsDetailModal.tsx:336-344`, `frontend/src/app/page.tsx:126-130`, 동작 확인 테스트 `frontend/src/tests/chat/HandoverIntegration.test.tsx`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| `size` 기본/범위 | 20 / 1~100 | `backend/app/api/news.py:55` | 페이지 크기 |
| 프론트 페이지 크기 | 18 | `frontend/src/hooks/useNewsFeed.ts:81` | 피드 요청 size |
| `sort` 기본 | `"hot"` | `backend/app/api/news.py:53`, `frontend/src/hooks/useNewsFeed.ts:16` | 인기순 |
| `quality_score` 대체값 | 6.0 | `backend/app/api/news.py:37`, `backend/app/schemas/news.py:18` | 값이 falsy 일 때 응답값 |
| fetch 타임아웃 | 8000ms | `frontend/src/lib/api.ts:25` | 일반 API 호출 |
| Ask 일괄 응답 타임아웃 | 30000ms |  `frontend/src/lib/api.ts:76` | `askQuestionAboutNews` |
| SSE 직접 연결 포트 | 8000 | `frontend/src/lib/api.ts:20` | `NEXT_PUBLIC_API_URL` 없을 때 |
| 북마크 키 | `agentlens_bookmarks` | `frontend/src/hooks/useBookmarks.ts:6` | localStorage 키 |
| 상대 시각 갱신 주기 | 60000ms | `frontend/src/components/NewsCard.tsx:34` | 카드 공유 시계 |
| 인기 점수 표시 조건 | 원천 지표 소스(`scoreMetric(source) !== null`)이고 `hotness_score > 25` | `frontend/src/components/NewsCard.tsx:93` | 카드 바닥 인기 점수 표시 |
| 카드 원천 지표 소스 | `github` 스타, `hackernews` 포인트, `reddit` 추천 | `frontend/src/lib/labels.ts:88-92` | 이 밖의 소스는 `raw_score` 를 그리지 않음 |
| 카드 개수 지표 | `github` 포크, 그 밖 댓글 | `frontend/src/lib/labels.ts:116-118` | `comments_count` 의 화면 라벨 |
| 카드 기술 스택 표시 수 | 3 | `frontend/src/components/NewsCard.tsx:99` | 배지 개수 (Must-Read 포함 최대 4) |
| 반복 시사점 판정 | 끝 40자 키, 20자 이상, 2번 이상 | `frontend/src/lib/feed-insights.ts:4`, `:6` | 카드가 요약을 대신 보이는 기준 |
| 검색 자리표시 | `키워드 검색` | `frontend/src/components/feed/FeedToolbar.tsx:29` | 검색 영역 검색창 |
| 카드 기술 배지 폭 | 48~128px (`min-w-12 max-w-32`) | `frontend/src/components/NewsCard.tsx:173` | 자리가 모자라면 이 사이에서 줄고 말줄임 |
| 소스 줄 선택 칩 선택자 | `[data-source-chip][aria-pressed="true"]` | `frontend/src/components/feed/FeedToolbar.tsx:165` | 선택된 소스 칩 (`전체`·소스·`북마크`) |
| 휴리스틱 스트림 청크 | 4단어, 0.015초 (캐시 재생 0.01초) | `backend/app/services/llm_processor.py:868-875,961-968` | 가짜 스트리밍 속도 |
| Ask 스트림 OpenAI max_tokens | 2048 | `backend/app/services/llm_processor.py:932` | 2순위 프로바이더 |
| RSS 항목 수 | 50 | `backend/app/api/news.py:171` | 최신순 |
| RSS 채널 링크 | `http://localhost:3000` | `backend/app/api/news.py:192` | 고정 문자열 |
| 레이더 분석 대상 | 최근 500건 | `backend/app/services/trend_service.py:42` | `published_at` 내림차순 |
| 레이더 태그 수 / 급상승 수 | 25 / 6 | `backend/app/services/trend_service.py:87,114` | 상위 N |
| 급상승 판정 | 24시간, `recent_count>0` 또는 `count>=5` | `backend/app/services/trend_service.py:56,111` | |
| velocity 규칙 | ≥3: `+{n*20}%`, >0: `+25%`, count≥8: `HOT`, 그 외 `STEADY` | `backend/app/services/trend_service.py:91-98` | |
| 헤더 스케줄 폴링 | 30000ms | `frontend/src/hooks/useCollector.ts:23` | `/api/schedule/status` |
| 수집 진행 폴링 | 1200ms | `frontend/src/hooks/useCollector.ts:24` | `/api/schedule/progress` |

## 알려진 불일치·위험
- 키 입력마다 피드 재조회: 검색창 `onChange` 가 `search` 상태를 바꾸고 `search` 가 요청 키에 들어 있어 입력 한 글자마다 `GET /api/news` 가 나간다. Enter 제출은 같은 조회를 한 번 더 한다 (`frontend/src/components/feed/FeedToolbar.tsx:142-146`, `frontend/src/hooks/useNewsFeed.ts:26`, `:71-98`). 입력마다 목록 키가 바뀌므로 응답이 올 때까지 카드 자리가 스켈레톤이 된다. 키 입력만으로는 page 가 1 로 돌아가지 않아 2페이지 이상에서 검색하면 빈 결과가 날 수 있다.
- Gemini 표기 잔존: 스트리밍 경로는 Anthropic → OpenAI → 휴리스틱만 쓰는데, UI 는 "Gemini 실시간 스트리밍 가동" 배지, 초기 모델명 "Gemini 실시간 스트리밍...", 기본 `modelUsed = 'Gemini 3.5 Flash'` 를 표시한다 (`frontend/src/components/news-detail/AskAiPanel.tsx:107`, `frontend/src/components/NewsDetailModal.tsx:143`, `frontend/src/lib/api.ts:132`).
- 스트림 중간 실패 시 답 중복: Anthropic 이 일부 토큰을 보낸 뒤 예외가 나면 `full_text` 가 남은 채 OpenAI/휴리스틱 분기로 넘어가 두 번째 `meta` 와 토큰이 이어서 전송된다. 프론트는 토큰을 계속 이어붙이므로 부분 답 + 대체 답이 붙어 보이고, 캐시에는 휴리스틱 경로에서 덮어쓴 텍스트만 저장된다 (`backend/app/services/llm_processor.py:900-972`, `frontend/src/components/NewsDetailModal.tsx:153-176`). 오류 이벤트가 없어 프론트는 실패를 구분하지 못한다.
- 스트림 요청 타임아웃 없음: `askQuestionAboutNewsStream` 은 `fetchWithTimeout` 을 쓰지 않는다 (`frontend/src/lib/api.ts:100-115`).
- Must-Read 판정 불일치: 백엔드 필터는 `is_high_signal` 만 보지만 MSW 목은 `quality_score >= 7.8 || is_high_signal` 로 거른다 (`backend/app/api/news.py:63-64`, `frontend/src/mocks/handlers.ts` 의 `GET */api/news`). 목의 오류 응답 형식(`error_code`, `message`)도 백엔드(`detail`)와 다르다.
- 프론트 타입과 응답 차이: `NewsItemSchema` 에 `full_content`, `scraped_at` 이 있지만 `NewsItemResponse` 에는 없다. `url` 은 zod 에서 `.url()` 이지만 응답을 zod 로 검증하지 않는다 (`frontend/src/types/news.ts:20-45`, `backend/app/schemas/news.py:5-30`).
- 고정 시사점 반복: LLM 평가가 시사점을 주지 않으면 backend 가 카테고리별 고정 문장(기술 이름이 잡히면 `{기술} 기반 구현에서 ` + 고정 문장)을 `why_it_matters` 에 저장한다. 그래서 여러 기사의 시사점이 같다 (`backend/app/services/llm_processor.py:84-89,742-748`). 카드는 반복을 찾아 요약을 대신 보여 완화하지만(NEWS-08 규칙 5), 상세 대화상자의 "개발자 시사점" 과 챗 출처는 같은 문장을 그대로 보인다.
- `StatsResponse.last_updated` 는 현재 시각이라 "마지막 갱신" 의미가 없다 (`backend/app/api/stats.py:20`).
- 북마크 보기에서 정렬·Must-Read 가 무시되지만 목록 머리줄 상태는 `Must-Read` 배지를 그대로 표시한다. 북마크는 스냅샷이라 초기화 후에도 남고 서버 데이터와 어긋날 수 있다 (`frontend/src/hooks/useNewsFeed.ts:102-115`, `frontend/src/components/feed/FeedStatusBar.tsx:69`).
- RSS: 채널 링크가 `http://localhost:3000` 고정인데 프론트 포트 설정은 3001 이다 (`backend/app/api/news.py:192`, 루트 `config.json` `app.frontend_port`). `category` 를 이스케이프·소문자 변환하지 않는다 (`backend/app/api/news.py:172-173,183`).
- 파괴적 API 무인증: `DELETE /api/news/all`, `POST /api/schedule/reset-and-collect` 는 인증 없이 호출된다. `DELETE /api/news/all` 은 UI 진입점이 없다 (`frontend/src/lib/api.ts:258` 미사용).
- 합성 점수에 좌우되는 정렬: 수집기가 원천 지표가 없는 소스의 `raw_score` 에 고정·합성 값(RSS 국내 180·그 밖 150, arXiv 120, HuggingFace `numComments + 40`, GitHub 폴백 `stars_hint` 기본 5000)을 넣고, `calculate_hotness` 는 `min(100, hotness × 8)` 로 포화한다 (`backend/app/collectors/sources/rss.py:75`, `arxiv.py:48`, `huggingface.py:33`, `github.py:61-69`, `backend/app/collectors/categorizer.py:147`. 2026-11-07 DB 4734건 중 1034건이 100). 카드는 지표 없는 소스의 `raw_score` 와 인기 점수를 숨기지만(NEWS-08 규칙 7), 지표 소스에서도 인기 점수가 포화하면 `100` 으로 같게 보이고, `top`(추천순, `raw_score`)·`hot`(인기순, `hotness_score`) 정렬은 합성 값에 좌우된다. GitHub 폴백 `stars_hint` 는 실제 스타와 구별되지 않아 카드에 스타로 보인다.
- 정렬 `hot` 의 점수 노후화: `hotness_score` 는 수집 시점 값이라 시간이 지나도 순위가 바뀌지 않는다 (`backend/app/collectors/manager.py:120,138`).
- `NEWS-11` 일괄 응답 API 와 `NEWS-12` 단건 조회 API 는 메인 UI 에서 쓰지 않는다.
