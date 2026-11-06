# 기능명세: 뉴스 피드

Updated: 2026-11-06

## 개요
수집·선별된 AI 에이전트·하네스·MCP 소식(`news_items`)을 메인 화면(`/`)에 카드 그리드로 보여준다. 사용자는 카테고리·소스·Must-Read 필터, 키워드 검색, 4가지 정렬, 페이지 이동으로 목록을 좁히고, 카드를 열어 3줄 요약·개발자 시사점·기술 스택을 보거나 기사 단위로 AI 에게 질문(SSE 스트리밍)한다. 북마크는 브라우저 localStorage 에만 저장한다. 같은 화면에 트렌드 레이더(기술 태그 집계), 통계 카운트, 일일 브리핑 배너가 붙고, 헤더에서 RSS 출력과 데이터 초기화·재수집을 실행한다. 백엔드 인터페이스는 `/api/news*`, `/api/stats`, `/api/trends/radar` 다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| NEWS-01 | 피드 목록 조회·페이지네이션 | 필터·검색·정렬 조건으로 기사 목록을 페이지 단위로 조회해 카드 그리드로 표시 | `/` 카드 그리드, 이전/다음 버튼 / `GET /api/news` |
| NEWS-02 | 카테고리 필터 | 4개 카테고리 + 전체 탭, 탭별 건수 표시 | `/` 카테고리 탭 / `GET /api/news?category=` |
| NEWS-03 | 소스 필터 | 수집 소스별 필터 pill (건수 0 인 소스는 숨김) | `/` 소스 pill / `GET /api/news?source=` |
| NEWS-04 | Must-Read 필터 | `is_high_signal` 기사만 표시 | `/` "Must-Read (High Signal)" 토글 / `GET /api/news?high_signal_only=true` |
| NEWS-05 | 키워드 검색 | 제목·요약·태그·기술 스택·시사점 부분 일치 검색 | `/` 검색창, `/` 단축키 / `GET /api/news?search=` |
| NEWS-06 | 정렬 | 인기순·품질순·최신순·추천순 | `/` 정렬 버튼 4개 / `GET /api/news?sort=` |
| NEWS-07 | 북마크 | 기사 스냅샷을 localStorage 에 보관, 북마크 전용 보기 | 카드·모달 북마크 아이콘, `b` 단축키, "북마크" pill |
| NEWS-08 | 기사 카드 | 카테고리·소스·Must-Read·Hot 배지, 제목, Insight, 기술 스택, 점수·댓글·상대 시간, 원문 링크 | `/` 카드 |
| NEWS-09 | 기사 상세 모달 | "AI 요약 & 시사점" 탭(시사점, 3줄 요약, 기술 스택, 본문 요약 마크다운) | 카드 클릭, `Enter`/`Space` 단축키 |
| NEWS-10 | 기사 단위 AI 질문 (스트리밍) | 상세 모달 "Ask AI 질의응답" 탭에서 질문, SSE 로 토큰 스트리밍 | 모달 Ask AI 탭 / `POST /api/news/{id}/ask/stream` |
| NEWS-11 | 기사 단위 AI 질문 (일괄 응답) | 같은 질문을 한 번에 응답하는 API (UI 미사용) | `POST /api/news/{id}/ask` |
| NEWS-12 | 기사 단건 조회 | ID 로 기사 1건 조회 (피드 UI 미사용) | `GET /api/news/{id}` |
| NEWS-13 | RSS 출력 | 최신 50건 RSS 2.0 XML | 헤더 "RSS" 링크 / `GET /api/news/feed/rss.xml` |
| NEWS-14 | 트렌드 레이더 | 최근 500건의 기술 스택 태그 집계, 급상승 태그·카테고리 분포·태그 클라우드, 태그 클릭 시 검색 | `/` "에이전트 Tech Radar" 패널 / `GET /api/trends/radar` |
| NEWS-15 | 통계 | 전체 건수, 카테고리별·소스별 건수 | 개요 영역 "전체 N건", 탭·pill 건수 / `GET /api/stats` |
| NEWS-16 | 피드 키보드 단축키 | j/k 이동, Enter/Space 열기, b 북마크, c 챗 이동, / 검색, t 테마, Esc 닫기 | 전역 keydown |
| NEWS-17 | 데이터 전체 삭제·초기화 | 기사 전체 삭제 API, 헤더의 "초기화 & 재수집" | 헤더 버튼 + 확인 모달 / `DELETE /api/news/all`, `POST /api/schedule/reset-and-collect` |
| NEWS-18 | 일일 브리핑 배너 | 오늘 브리핑의 날짜·헤드라인을 배너로 표시, 클릭 시 브리핑 모달 | `/` 상단 배너 / `GET /api/briefing/today` |
| NEWS-19 | 전용 챗 핸드오버 | 카드·모달에서 기사를 컨텍스트로 `/chat` 으로 이동 | 카드 "전용 챗에서 분석", 모달 배너, `c` 단축키 |

## NEWS-01 피드 목록 조회·페이지네이션
- 진입점: 메인 페이지 `/` 진입 시 자동 조회. 하단 "← 이전" / "다음 →" 버튼. API `GET /api/news`.
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
  6. 프론트 `useNewsFeed.loadNews` 는 `category, source, search, sort, highSignalOnly, page, bookmarkedItems` 중 하나라도 바뀌면 다시 호출된다 (`useCallback` 의존성 + `useEffect`).
  7. 요청은 `fetchWithTimeout` 으로 8000ms 뒤 abort 한다. `cache: 'no-store'`. 브라우저에서는 상대 경로 `/api/news` 를 쓰고 Next.js rewrites 가 백엔드로 넘긴다.
  8. 페이지 버튼: 이전은 `max(1, p-1)`, 다음은 `min(totalPages, p+1)`. `page === 1` 이면 이전, `page === totalPages` 면 다음이 비활성화된다. 페이지네이션 영역은 `!loading && totalPages > 1` 일 때만 보인다.
  9. 필터·정렬·카테고리·소스·Must-Read 를 바꾸는 모든 핸들러는 `page` 를 1 로 되돌린다.
- 출력:
  - API: `NewsListResponse { items: NewsItemResponse[], total, page, size, total_pages }`. `NewsItemResponse` 필드: `id, title, url, source, category, summary, author, tags[], tldr_bullets[], why_it_matters, tech_stack[], quality_score, is_high_signal, raw_score, comments_count, hotness_score, published_at, created_at, dedup_hash`. `full_content`, `scraped_at` 은 응답에 없다.
  - 화면: 상태 바 "총 N건의 소식", "페이지 p / totalPages". 1열(모바일)/2열(md)/3열(lg) 그리드.
- 예외·엣지:
  - 로딩 중: 스피너와 "소식을 불러오는 중..." 을 표시하고 그리드·빈 상태·페이지네이션을 숨긴다.
  - 실패: `res.ok` 가 아니면 `API 오류 (status): statusText` 메시지를 던지고, 화면에 빨간 오류 박스, "백엔드 서버(포트 8000) 연결 상태를 확인해주세요.", "다시 시도" 버튼(오류 해제 후 재조회)을 보인다. 타임아웃(abort)도 같은 경로로 표시된다.
  - 빈 결과: "조건에 일치하는 소식이 없습니다" 와 "필터 전체 초기화" 버튼. 초기화는 category·source 를 `all`, search 를 `''`, highSignalOnly 를 false, page 를 1 로 되돌린다. `sort` 와 트렌드 레이더의 `selectedTag` 는 초기화하지 않는다.
  - 응답은 zod 스키마로 검증하지 않고 `res.json()` 을 그대로 쓴다.
- 관련 코드: `backend/app/api/news.py:17-45`, `backend/app/api/news.py:47-94`, `backend/app/schemas/news.py:5-37`, `frontend/src/hooks/useNewsFeed.ts:56-104`, `frontend/src/lib/api.ts:25-61`, `frontend/src/app/page.tsx:297-393`, `frontend/next.config.ts`

## NEWS-02 카테고리 필터
- 진입점: 개요 영역 아래 탭 내비게이션 (`CategoryFilter`).
- 입력: 탭 5개. `all` "전체 소식", `harness` "하네스 & 벤치마크", `mcp_plugins_skills` "MCP & 생태계", `agent_tech` "에이전트 아키텍처", `ai_news` "최신 AI 동향".
- 처리 규칙:
  1. 백엔드: `category` 가 있고 소문자 변환 값이 `"all"` 이 아니면 `NewsItem.category == category.lower()` 조건을 붙인다.
  2. 탭 선택 시 `setCategory(c)`, `setSource('all')`, `setPage(1)` 을 함께 실행한다. 즉 카테고리를 바꾸면 소스 필터(북마크 보기 포함)가 해제된다.
  3. 탭 옆 건수: 개별 탭은 `stats.category_counts[id] ?? 0`, `all` 은 `category_counts` 값 전체 합.
- 출력: 선택 탭은 파란 밑줄·강조. 건수 배지.
- 예외·엣지: 통계 로딩 실패 시 `counts` 기본값 `{}` 로 모든 건수가 0 으로 보인다.
- 관련 코드: `backend/app/api/news.py:59-60`, `frontend/src/components/CategoryFilter.tsx:13-55`, `frontend/src/app/page.tsx:176-186`

## NEWS-03 소스 필터
- 진입점: 툴바 상단 pill 목록 (`SourceFilter`).
- 입력: pill id 와 라벨. `all` 전체, `rss_kr` 국내 테크, `github` GitHub, `hackernews` HackerNews, `arxiv` arXiv, `huggingface` HuggingFace, `reddit` Reddit, `rss` Global Blogs, `bookmarks` 북마크.
- 처리 규칙:
  1. 백엔드: `source` 가 있고 소문자 값이 `"all"` 이 아니면 `NewsItem.source == source.lower()`.
  2. `all`, `bookmarks` 는 항상 보이고, 나머지는 `stats.source_counts[id] > 0` 일 때만 보인다.
  3. 건수: `all` 은 `source_counts` 합, `bookmarks` 는 북마크 개수, 나머지는 해당 소스 건수. 건수가 0 이면 괄호 표시를 생략한다.
  4. `bookmarks` 를 고르면 API 를 호출하지 않고 로컬 북마크 목록을 보여준다 (NEWS-07).
  5. 선택 시 `setSource(s)`, `setPage(1)`.
- 출력: 선택 pill 은 검은 배경.
- 예외·엣지: 위 목록에 없는 source 값(예: `web`)이 DB 에 있어도 pill 이 없다.
- 관련 코드: `backend/app/api/news.py:61-62`, `frontend/src/components/SourceFilter.tsx:15-70`, `frontend/src/app/page.tsx:190-203`

## NEWS-04 Must-Read 필터
- 진입점: 소스 pill 오른쪽 "Must-Read (High Signal)" 토글 버튼. 툴팁 "기술 깊이와 실무 가치가 입증된 고품질 소식만 필터링".
- 입력: `high_signal_only` bool.
- 처리 규칙:
  1. true 이면 `NewsItem.is_high_signal == True` 조건만 붙인다 (품질 점수 직접 비교 없음). `is_high_signal` 값은 수집 시 결정된다 (`03-collection.md` COLL-08).
  2. 토글 시 반전 후 page 1.
- 출력: 활성 시 호박색 강조, 상태 바에 "(Must-Read 필터링)".
- 예외·엣지: 북마크 보기에서는 이 필터가 적용되지 않지만 상태 바 문구는 그대로 붙는다.
- 관련 코드: `backend/app/api/news.py:63-64`, `frontend/src/components/SourceFilter.tsx:72-86`, `frontend/src/app/page.tsx:198-202,302`

## NEWS-05 키워드 검색
- 진입점: 툴바 검색창 (placeholder "키워드 검색 (SWE-bench, MCP, LangGraph, Claude 5.5 등)..."), "검색" 버튼, `/` 단축키(검색창 포커스), 트렌드 레이더 태그 클릭.
- 입력: `search` 문자열.
- 처리 규칙:
  1. 백엔드: `search.strip()` 이 비어 있지 않으면 `%{trim 값}%` 로 `title`, `summary`, `tags`, `tech_stack`, `why_it_matters` 중 하나라도 `ILIKE` 일치하는 행을 고른다 (OR).
  2. 프론트: 입력 `onChange` 가 `search` 상태를 바로 바꾸고, `search` 가 `loadNews` 의존성이므로 키 입력마다 조회가 다시 일어난다. 폼 제출(`검색` 버튼/Enter)은 `setPage(1)` 후 `loadNews()` 를 한 번 더 호출한다.
  3. 키 입력 자체로는 page 를 1 로 되돌리지 않는다. 폼 제출이나 태그 선택 때만 1 로 돌린다.
  4. 프론트는 `search` 를 trim 하지 않고 그대로 쿼리에 넣는다 (빈 문자열만 생략).
- 출력: 일치 목록.
- 예외·엣지: 공백만 입력하면 백엔드에서 필터를 무시한다. 북마크 보기에서는 제목·요약만 대상으로 소문자 부분 일치(NEWS-07).
- 관련 코드: `backend/app/api/news.py:65-75`, `frontend/src/app/page.tsx:207-233`, `frontend/src/hooks/useNewsFeed.ts:50-54,96`

## NEWS-06 정렬
- 진입점: 툴바 오른쪽 버튼 4개.
- 입력: `sort` 값과 버튼 라벨: `hot` 인기순(기본), `quality` 품질순, `latest` 최신순, `top` 추천순.
- 처리 규칙 (백엔드):
  1. `latest`: `published_at` 내림차순.
  2. `top`: `raw_score` 내림차순.
  3. `quality`: `quality_score` 내림차순, 동률이면 `hotness_score` 내림차순.
  4. 그 밖의 모든 값(`hot` 포함): `hotness_score` 내림차순, 동률이면 `published_at` 내림차순.
  5. 버튼 클릭 시 `setSort` 후 page 1.
- 출력: 선택 버튼 흰 배경 강조.
- 예외·엣지: `hotness_score` 는 수집·재수집 시점에만 계산·저장되고 시간이 지나도 다시 계산하지 않는다 (`03-collection.md` COLL-12). 북마크 보기에서는 정렬이 적용되지 않고 북마크한 순서(최근 추가가 앞)로 보인다.
- 관련 코드: `backend/app/api/news.py:80-87`, `frontend/src/app/page.tsx:236-293`

## NEWS-07 북마크
- 진입점: 카드 우상단 북마크 아이콘(툴팁 "보관하기"/"보관됨"), 상세 모달 헤더 북마크 아이콘, 포커스 카드에서 `b`, 소스 필터 "북마크" pill.
- 입력: `NewsItem` 전체 객체.
- 처리 규칙:
  1. localStorage 키 `agentlens_bookmarks` 에 `NewsItem[]` JSON 을 저장한다. 서버에는 저장하지 않는다.
  2. 마운트 시 한 번 읽어 `bookmarkedItems` 와 `bookmarkedIds` 를 채운다.
  3. 토글: 이미 있으면 해당 id 를 제거, 없으면 배열 맨 앞에 추가하고 즉시 localStorage 에 쓴다. 이벤트가 넘어오면 `stopPropagation` 한다.
  4. 북마크 보기(`source === 'bookmarks'`): API 호출 없이 `bookmarkedItems` 를 복사해 `category !== 'all'` 이면 카테고리로, `search.trim()` 이 있으면 `title`/`summary` 소문자 부분 일치로 거른다. `total = 길이`, `totalPages = 1`.
- 출력: 북마크된 카드는 아이콘이 호박색으로 채워진다. 상태 바에 "(북마크)". "북마크" pill 에 개수.
- 예외·엣지:
  - localStorage 읽기·쓰기 실패나 JSON 파싱 실패는 `console.error` 만 하고 넘어간다.
  - 저장된 것은 추가 시점의 스냅샷이므로 DB 가 초기화되거나 기사 내용이 바뀌어도 그대로 남는다.
  - 북마크 보기에서는 정렬·Must-Read·페이지가 적용되지 않는다.
  - 북마크 보기 중 카테고리 탭을 누르면 source 가 `all` 로 바뀌어 북마크 보기가 해제된다 (NEWS-02).
- 관련 코드: `frontend/src/hooks/useBookmarks.ts:6-47`, `frontend/src/hooks/useNewsFeed.ts:57-74`, `frontend/src/app/page.tsx:97-101,301,345-346,406-407`

## NEWS-08 기사 카드
- 진입점: 피드 그리드의 각 카드 (`NewsCard`). 카드 전체 클릭 시 상세 모달.
- 입력: `item`, `isBookmarked`, `isFocused`.
- 처리 규칙:
  1. 카테고리 라벨: `harness`→"Harness", `mcp_plugins_skills`→"MCP & Skills", `agent_tech`→"Agent Tech", `ai_news`→"AI Frontier", 그 외 원값.
  2. 소스 라벨: `rss_kr`→"국내 테크", `github`→"GitHub", `hackernews`→"HackerNews", `arxiv`→"arXiv", `huggingface`→"HuggingFace", `reddit`→"Reddit", `rss`→"Blog", 그 외 원값.
  3. `is_high_signal` 이면 "Must-Read" 배지.
  4. `hotness_score > 25` 이면 "Hot {반올림 값}".
  5. 제목 2줄 말줄임. `why_it_matters` 가 있으면 "Insight:" 콜아웃(2줄), 없고 `summary` 가 있으면 요약 2줄.
  6. `tech_stack` 앞 4개를 칩으로 표시.
  7. `raw_score > 0` 이면 별 아이콘과 천 단위 구분 숫자, `comments_count > 0` 이면 댓글 수.
  8. 상대 시간(`published_at` 기준): 3600초 미만 "N분 전"(최소 1), 86400초 미만 "N시간 전", 그 외 "N일 전".
  9. "전용 챗에서 분석" 버튼(NEWS-19)과 "원문" 링크(새 탭, 클릭 전파 차단).
  10. `isFocused` 면 파란 링과 `data-focused="true"`.
- 출력: 카드 UI. `quality_score` 숫자는 카드에 표시하지 않는다.
- 예외·엣지: 날짜 파싱 예외 시 빈 문자열.
- 관련 코드: `frontend/src/components/NewsCard.tsx:17-191`, `frontend/src/tests/NewsCard.test.tsx`

## NEWS-09 기사 상세 모달
- 진입점: 카드 클릭, 포커스 카드에서 `Enter`/`Space`.
- 입력: 선택된 `NewsItem` (피드 목록의 객체를 그대로 쓴다. 상세 API 를 다시 호출하지 않는다).
- 처리 규칙:
  1. 모달은 `key = news-modal-{id}` 로 렌더링되어 기사마다 새로 마운트된다.
  2. 헤더: 카테고리 원값(id 그대로), Must-Read 배지, 제목(한 줄 말줄임), 북마크 토글, 닫기(X).
  3. 탭 2개: "AI 요약 & 시사점"(기본), "Ask AI 질의응답"(대화가 있으면 건수 배지).
  4. 요약 탭 내용 순서: 제목, `why_it_matters` 박스("Why It Matters (개발자를 위한 시사점):"), 전용 챗 이동 배너(NEWS-19), "3-Bullet Executive TL;DR"(`tldr_bullets` 가 있을 때), "추출된 기술 스택 / 모델"(전체 `tech_stack`), "상세 본문 요약"(`summary` 를 `MarkdownViewer` 로 렌더링).
  5. `MarkdownViewer`: react-markdown + remark-gfm. 코드 블록은 언어 라벨·복사 버튼, 표는 가로 스크롤 래퍼, 링크는 새 탭(`noopener noreferrer`). `content` 가 비면 렌더링하지 않는다.
  6. 푸터: "출처: {source 원값}", `author` 가 있으면 "by {author}"(sm 이상), "원문 링크 방문"(새 탭).
  7. 닫기: X 버튼, 배경 클릭, `Escape`(모달 자체 keydown 리스너). 닫을 때 진행 중 스트림을 abort 하고 탭·대화·입력·복사 상태를 초기화한다. `isOpen` 이 false 가 될 때도 같은 초기화를 한다.
- 출력: 오버레이 모달 (최대 너비 4xl, 높이 88~92vh).
- 예외·엣지: `isOpen` 이 false 거나 `item` 이 null 이면 렌더링하지 않는다. 대화 내역은 메모리에만 있고 모달을 닫으면 사라진다.
- 관련 코드: `frontend/src/components/NewsDetailModal.tsx:28-388`, `frontend/src/components/MarkdownViewer.tsx:19-188`, `frontend/src/app/page.tsx:70-73,401-408`

## NEWS-10 기사 단위 AI 질문 (스트리밍)
- 진입점: 상세 모달 "Ask AI 질의응답" 탭(`AskAiPanel`). 하단 입력창 + "전송", 빠른 질문 pill 4개(상단 가로 목록, 대화가 없을 때 가운데에도 표시). API `POST /api/news/{news_id}/ask/stream`.
- 입력:
  - 요청 본문 `{ "question": string }` (`AskQuestionRequest`). 백엔드는 길이·공백 검증을 하지 않는다.
  - 프론트는 `(queryToAsk || question).trim()` 이 비거나 이미 질문 중(`asking`)이면 보내지 않는다. 전송 버튼은 `asking || !question.trim()` 일 때 비활성화.
  - 빠른 질문: "💡 핵심 원리 및 구조", "🛠️ 실무 프로젝트 도입", "⚖️ 차별점 및 한계", "🔒 보안 및 샌드박스" (각각 고정 한국어 질문문을 보낸다).
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
  1. 이전 요청의 AbortController 가 있으면 abort 하고 새로 만든다. 입력을 비우고 `asking=true`, 탭을 Ask AI 로 바꾼다.
  2. 대화 내역에 `{ q, a: '', model: 'Gemini 실시간 스트리밍...', time: ko-KR HH:MM, isStreaming: true }` 를 추가한다.
  3. `askQuestionAboutNewsStream`: Next.js 프록시 버퍼링을 피하려고 `getDirectApiBase()`(환경변수 `NEXT_PUBLIC_API_URL`, 없으면 `{현재 protocol}//{hostname}:8000`)로 직접 POST 한다. 네트워크 예외(AbortError 제외) 시 상대 경로로 한 번 더 시도한다. 타임아웃은 없다.
  4. 응답 바디를 `\n\n` 단위로 나눠 `data: ` 줄을 JSON 파싱한다. `meta` → 마지막 메시지 `model` 교체, `token` → 마지막 메시지 `a` 에 이어붙임, `done` → 반환값만 `total_text` 로 교체(화면 텍스트는 토큰 누적분을 유지). 파싱 실패 줄은 무시.
  5. 끝나면 `isStreaming=false`, `asking=false`.
  6. 답변 영역: 스트리밍 중 내용이 없으면 "AI가 실시간 스트리밍 답변을 생성하는 중입니다...", 내용이 생기면 `MarkdownViewer` + 깜빡이는 커서. 모델명(`c.model || 'AgentLens AI'`), 시간, "복사" 버튼(스트리밍 중이거나 빈 답이면 비활성, 클립보드 복사 후 2초간 "복사됨").
  7. "대화 초기화"는 `window.confirm('AI 대화 내역을 모두 초기화하시겠습니까?')` 확인 후 내역을 비운다.
  8. 새 메시지·asking 변화마다 끝으로 부드럽게 스크롤한다.
- 출력: SSE 이벤트 스트림 / 말풍선 대화 UI.
- 예외·엣지:
  - HTTP 오류나 바디 없음: `detail` 이 있으면 그 문구, 없으면 `AI 스트리밍 연결 실패 (status)` 로 예외. 답이 비어 있던 메시지는 `⚠️ AI 응답 생성 실패: {메시지}`, 모델 `Error` 로 바뀐다. 이미 일부 답이 있으면 스트리밍 표시만 끈다.
  - 사용자가 모달을 닫거나 새 질문을 보내 abort 하면 `AbortError` 는 조용히 무시한다.
  - LLM 키가 하나도 없어도 휴리스틱 답이 나오므로 HTTP 오류가 나지 않는다.
- 관련 코드: `backend/app/api/news.py:137-167`, `backend/app/services/llm_processor.py:755-814`, `backend/app/services/llm_processor.py:816-939`, `frontend/src/lib/api.ts:12-23,88-169`, `frontend/src/components/NewsDetailModal.tsx:93-197`, `frontend/src/components/news-detail/AskAiPanel.tsx:40-259`, `frontend/src/tests/AskAiPanel.test.tsx`

## NEWS-11 기사 단위 AI 질문 (일괄 응답)
- 진입점: API `POST /api/news/{news_id}/ask`. 프론트 `askQuestionAboutNews`(30000ms 타임아웃)가 정의되어 있으나 화면에서 호출하는 곳은 없다.
- 입력: `{ "question": string }`.
- 처리 규칙:
  1. 기사가 없으면 404.
  2. `answer_question_with_meta`: NEWS-10 과 같은 캐시 키로 캐시 조회. 캐시가 없으면 같은 프롬프트로 `_generate_live_answer` 를 호출한다. 이 함수는 `generate_live_answer` 의 모든 예외를 삼키고 `(None, None)` 을 돌려준다. 프로바이더 순서는 Anthropic → OpenAI → Ollama (`03-collection.md` COLL-20).
  3. 답이 있으면 캐시에 저장하고 반환, 없으면 휴리스틱 템플릿 답과 모델명 `"AgentLens Heuristic Engine"`.
- 출력: `AskQuestionResponse { news_id, question, answer, model_used }`.
- 예외·엣지: 휴리스틱 답은 캐시에 저장하지 않는다 (스트리밍 경로는 휴리스틱 답도 저장한다).
- 관련 코드: `backend/app/api/news.py:111-135`, `backend/app/services/llm_processor.py:717-753`, `frontend/src/lib/api.ts:70-86`

## NEWS-12 기사 단건 조회
- 진입점: API `GET /api/news/{news_id}` (정수). 메인 피드 UI 는 호출하지 않는다.
- 처리 규칙: id 로 조회 후 `format_news_item` 변환.
- 출력: `NewsItemResponse`.
- 예외·엣지: 없으면 404 `{"detail": "News item not found"}`. 정수가 아니면 422.
- 관련 코드: `backend/app/api/news.py:104-109`

## NEWS-13 RSS 출력
- 진입점: 헤더 "RSS" 링크(새 탭, `/api/news/feed/rss.xml`), API `GET /api/news/feed/rss.xml`.
- 입력: `category` (선택). `"all"` 이 아니면 그대로(소문자 변환 없이) 일치 비교.
- 처리 규칙:
  1. `published_at` 내림차순 상위 50건.
  2. 각 `<item>`: `title`, `link`, `description`(`summary`), `guid`(`url`) 은 `xml.sax.saxutils.escape` 로 이스케이프, `category` 는 이스케이프하지 않는다. `pubDate` 는 `"%a, %d %b %Y %H:%M:%S GMT"` 형식.
  3. 채널: 제목 "AgentLens RSS", 링크 `http://localhost:3000`(고정), 설명 "Global AI, Agent, Harness &amp; MCP News".
- 출력: `application/xml`, RSS 2.0.
- 예외·엣지: 결과가 없으면 item 없는 채널. `summary` 가 null 인 행은 `escape(None)` 에서 예외가 나 500 이 될 수 있다 (모델 기본값은 `""`).
- 관련 코드: `backend/app/api/news.py:169-197`, `frontend/src/components/Header.tsx:166-174`

## NEWS-14 트렌드 레이더
- 진입점: 개요 영역 아래 "에이전트 Tech Radar" 패널(`TechRadar`). 기본은 접힌 상태이고 "자세히"/"접기" 버튼으로 펼친다. API `GET /api/trends/radar`.
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
  1. `loadStatsAndBriefing` 에서 통계·브리핑과 함께 `Promise.all` 로 가져온다. 레이더 요청 실패는 `null` 로 삼킨다.
  2. 로딩 중 회색 스켈레톤. `data` 가 없거나 `tags` 가 비면 패널을 렌더링하지 않는다.
  3. 헤더에 "{total_analyzed}개 아티클 분석". 접힌 상태에서 md 이상 화면이면 "급상승:" 뒤에 상위 3개 태그 버튼.
  4. 펼친 상태: "최근 24시간 급상승 (Surging) 기술 스택:"(태그명·velocity·건수), 4개 그룹 백분율 카드, "전체 기술 태그 (클릭 시 검색):" 태그 클라우드, 선택 태그가 있으면 "✕ 필터 초기화".
  5. 태그 클릭: 이미 선택된 태그면 `''`, 아니면 태그명으로 `handleSelectTag` → `selectedTag` 설정, `search` 를 태그명으로, page 1. 즉 태그 선택은 NEWS-05 검색으로 동작한다.
- 출력: `{ updated_at, total_analyzed, surging_tags: TrendingTag[], categories: [{name, count, percentage}], tags: TrendingTag[] }`. `TrendingTag = { name, count, category, recent_count, velocity, sample_news_id }`. 기사가 0건이면 `total_analyzed: 0` 과 빈 배열들.
- 예외·엣지: 응답 스키마(Pydantic response_model)가 없다. `sample_news_id` 는 프론트에서 쓰지 않는다. 검색창을 직접 고쳐도 `selectedTag` 는 그대로 남는다.
- 관련 코드: `backend/app/api/trends.py:6-9`, `backend/app/services/trend_service.py:9-139`, `frontend/src/components/TechRadar.tsx:14-179`, `frontend/src/hooks/useNewsFeed.ts:32-54`, `frontend/src/types/trends.ts`

## NEWS-15 통계
- 진입점: API `GET /api/stats`. 화면 개요 영역의 "전체 N건"(`stats.total_news || total`), 카테고리 탭 건수, 소스 pill 건수.
- 처리 규칙:
  1. `count(id)` 전체, `category` 별 group by 건수, `source` 별 group by 건수.
  2. `last_updated` 는 응답 시점의 현재 UTC 시각(ISO)이다. 마지막 수집 시각이 아니다.
  3. 프론트는 첫 마운트와 헤더 새로고침·수집 진행 중 신규 저장 시(`onRefresh`) 다시 가져온다.
- 출력: `StatsResponse { total_news, category_counts: {str: int}, source_counts: {str: int}, last_updated }`.
- 예외·엣지: `loadStatsAndBriefing` 에서 `fetchStats` 에는 catch 가 없어, 통계 요청이 실패하면 `Promise.all` 전체가 실패해 브리핑·레이더 결과도 반영되지 않는다(콘솔 오류만 남음). 통계가 없으면 개요 건수는 목록 `total` 로 대체된다.
- 관련 코드: `backend/app/api/stats.py:11-21`, `backend/app/schemas/news.py:142-146`, `frontend/src/hooks/useNewsFeed.ts:32-48`, `frontend/src/app/page.tsx:156`

## NEWS-16 피드 키보드 단축키
- 진입점: 메인 페이지의 `HotkeyListener` (window keydown).
- 처리 규칙:
  1. IME 조합 중(`isComposing`)이면 무시.
  2. `Cmd/Ctrl+K`: 커맨드 팔레트 토글 콜백(메인 페이지는 이 콜백을 넘기지 않고, 헤더가 자체 리스너로 팔레트를 연다).
  3. `Escape`: 입력창 안에서도 동작. 상세·브리핑·스케줄·MCP·공유 설정·소스 모달을 모두 닫는다.
  4. 입력 요소(INPUT/TEXTAREA/SELECT/contentEditable) 안에서는 아래 단일 키를 무시한다. Meta/Ctrl/Alt 조합도 무시.
  5. `j`/`J`: 포커스 다음 카드(마지막에서 멈춤), `k`/`K`: 이전 카드(0 에서 멈춤). 초기 포커스는 -1 이며 `j` 첫 입력 시 0.
  6. `Enter`/`Space`: 포커스 카드 상세 모달 열기 (포커스 없으면 아무것도 안 함).
  7. `b`: 포커스 카드 북마크 토글. `c`: `/chat?sourceId={id}` 로 이동. `/`: 검색창 포커스. `t`: 테마 토글.
- 출력: 포커스 카드 링 표시 등.
- 예외·엣지: 목록이 비면 이동하지 않는다. 목록이 바뀌어도 `focusedIndex` 는 초기화하지 않는다.
- 관련 코드: `frontend/src/components/HotkeyListener.tsx:45-165`, `frontend/src/app/page.tsx:75-122`

## NEWS-17 데이터 전체 삭제·초기화
- 진입점: 헤더 빨간 "초기화 & 재수집" 버튼(수집 중이면 비활성) → 확인 모달("수집 데이터 전체 삭제 및 재수집", "전체 삭제 후 다시 수집"/"취소"). API `POST /api/schedule/reset-and-collect`, `DELETE /api/news/all`.
- 처리 규칙:
  1. `DELETE /api/news/all`: `news_items` 전체 삭제 후 커밋, `{"status": "success", "deleted_count": n}` (rowcount 가 없거나 0 이하이면 0). `crawl_logs` 는 지우지 않는다. 프론트 `deleteAllNews` 는 정의만 있고 화면에서 호출하지 않는다.
  2. `POST /api/schedule/reset-and-collect`: 수집 중이면 삭제 없이 `already_running` 과 안내 문구, `deleted_count: 0`. 아니면 `news_items`·`crawl_logs` 전체 삭제, 수집기 메모리 카운터 초기화(`step_message` "🧹 기존 데이터 삭제 완료. 실시간 재수집을 시작합니다.") 후 백그라운드로 전체 수집을 시작하고 `started` 와 `"기존 데이터 {n}건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다."` 를 돌려준다. 상세는 `03-collection.md` COLL-18.
  3. 프론트: 성공 시 모달을 닫고 피드·통계를 새로고침한 뒤 `"기존 {deleted_count}건 삭제 완료. 신규 수집 중..."` 으로 진행 폴링(1200ms)을 시작한다.
- 출력: JSON 상태 / 헤더 진행 메시지 바.
- 예외·엣지: 인증·확인 토큰이 없어 누구나 호출할 수 있다. 프론트는 실패 시 `alert(메시지 || '초기화 실패')`. localStorage 북마크는 지워지지 않는다.
- 관련 코드: `backend/app/api/news.py:96-102`, `backend/app/api/schedule.py:69-99`, `frontend/src/lib/api.ts:246-268`, `frontend/src/components/Header.tsx:95-107,196-204,257-287`, `backend/tests/test_reset_and_delete.py`

## NEWS-18 일일 브리핑 배너
- 진입점: 메인 상단 배너 (`DailyBriefingBanner`). API `GET /api/briefing/today`.
- 처리 규칙:
  1. `loadStatsAndBriefing` 에서 가져오며 실패는 `null` 로 삼킨다. 성공한 값이 있을 때만 상태를 갱신한다.
  2. `briefing` 이 null 이면 배너를 그리지 않는다.
  3. 표시: "오늘의 AI 브리핑"(고정 문구), `briefing.date`, `briefing.headline`(1줄), "브리핑 보기 →". 배너 전체 클릭 시 브리핑 모달을 연다.
- 출력: 배너 UI. 브리핑 생성 규칙과 모달은 브리핑 영역 문서에서 다룬다.
- 관련 코드: `frontend/src/components/DailyBriefingBanner.tsx:12-47`, `frontend/src/hooks/useNewsFeed.ts:35-42`, `frontend/src/app/page.tsx:136`

## NEWS-19 전용 챗 핸드오버
- 진입점: 카드 "전용 챗에서 분석" 버튼, 상세 모달 요약 탭의 "전용 AI 챗으로 이동" 배너, 포커스 카드에서 `c`.
- 처리 규칙:
  1. `/chat?sourceId={item.id}` 로 `router.push`. 모달 배너는 `draftQuestion` 이 trim 후 비어 있지 않으면 `&q={encodeURIComponent}` 를 붙인다 (요약 탭에는 입력창이 없어 보통 비어 있다).
  2. 클릭 이벤트 전파를 막아 카드 클릭(모달 열기)이 일어나지 않는다. 모달 배너는 이동 전에 모달을 닫는다.
- 출력: 챗 화면 이동. 이후 동작은 챗 영역 문서에서 다룬다.
- 관련 코드: `frontend/src/components/chat/HandoverCtaButton.tsx:16-68`, `frontend/src/components/NewsCard.tsx:171-175`, `frontend/src/components/NewsDetailModal.tsx:295-303`, `frontend/src/app/page.tsx:91-95`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| `size` 기본/범위 | 20 / 1~100 | `backend/app/api/news.py:55` | 페이지 크기 |
| 프론트 페이지 크기 | 18 | `frontend/src/hooks/useNewsFeed.ts:86` | 피드 요청 size |
| `sort` 기본 | `"hot"` | `backend/app/api/news.py:53`, `frontend/src/hooks/useNewsFeed.ts:16` | 인기순 |
| `quality_score` 대체값 | 6.0 | `backend/app/api/news.py:37`, `backend/app/schemas/news.py:18` | 값이 falsy 일 때 응답값 |
| fetch 타임아웃 | 8000ms | `frontend/src/lib/api.ts:25` | 일반 API 호출 |
| Ask 일괄 응답 타임아웃 | 30000ms |  `frontend/src/lib/api.ts:76` | `askQuestionAboutNews` |
| SSE 직접 연결 포트 | 8000 | `frontend/src/lib/api.ts:20` | `NEXT_PUBLIC_API_URL` 없을 때 |
| 북마크 키 | `agentlens_bookmarks` | `frontend/src/hooks/useBookmarks.ts:6` | localStorage 키 |
| Hot 배지 임계값 | `hotness_score > 25` | `frontend/src/components/NewsCard.tsx:90` | 카드 Hot 표시 |
| 카드 기술 스택 표시 수 | 4 | `frontend/src/components/NewsCard.tsx:136` | 칩 개수 |
| 휴리스틱 스트림 청크 | 4단어, 0.015초 (캐시 재생 0.01초) | `backend/app/services/llm_processor.py:829-836,928-935` | 가짜 스트리밍 속도 |
| Ask 스트림 OpenAI max_tokens | 2048 | `backend/app/services/llm_processor.py:899` | 2순위 프로바이더 |
| RSS 항목 수 | 50 | `backend/app/api/news.py:171` | 최신순 |
| RSS 채널 링크 | `http://localhost:3000` | `backend/app/api/news.py:192` | 고정 문자열 |
| 레이더 분석 대상 | 최근 500건 | `backend/app/services/trend_service.py:42` | `published_at` 내림차순 |
| 레이더 태그 수 / 급상승 수 | 25 / 6 | `backend/app/services/trend_service.py:87,114` | 상위 N |
| 급상승 판정 | 24시간, `recent_count>0` 또는 `count>=5` | `backend/app/services/trend_service.py:56,111` | |
| velocity 규칙 | ≥3: `+{n*20}%`, >0: `+25%`, count≥8: `HOT`, 그 외 `STEADY` | `backend/app/services/trend_service.py:91-98` | |
| 헤더 스케줄 폴링 | 30000ms | `frontend/src/components/Header.tsx:47` | `/api/schedule/status` |
| 수집 진행 폴링 | 1200ms | `frontend/src/components/Header.tsx:80` | `/api/schedule/progress` |

## 알려진 불일치·위험
- 키 입력마다 피드 재조회: 검색창 `onChange` 가 `search` 상태를 바꾸고 `loadNews` 가 `search` 에 의존해 입력 한 글자마다 `GET /api/news` 가 나간다. "검색" 제출은 같은 조회를 한 번 더 한다 (`frontend/src/app/page.tsx:207-221`, `frontend/src/hooks/useNewsFeed.ts:96-104`). 키 입력만으로는 page 가 1 로 돌아가지 않아 2페이지 이상에서 검색하면 빈 결과가 날 수 있다.
- Gemini 표기 잔존: 스트리밍 경로는 Anthropic → OpenAI → 휴리스틱만 쓰는데, UI 는 "Gemini 실시간 스트리밍 가동" 배지, 초기 모델명 "Gemini 실시간 스트리밍...", 기본 `modelUsed = 'Gemini 3.5 Flash'` 를 표시한다 (`frontend/src/components/news-detail/AskAiPanel.tsx:93`, `frontend/src/components/NewsDetailModal.tsx:114`, `frontend/src/lib/api.ts:132`).
- 스트림 중간 실패 시 답 중복: Anthropic 이 일부 토큰을 보낸 뒤 예외가 나면 `full_text` 가 남은 채 OpenAI/휴리스틱 분기로 넘어가 두 번째 `meta` 와 토큰이 이어서 전송된다. 프론트는 토큰을 계속 이어붙이므로 부분 답 + 대체 답이 붙어 보이고, 캐시에는 휴리스틱 경로에서 덮어쓴 텍스트만 저장된다 (`backend/app/services/llm_processor.py:862-939`, `frontend/src/components/NewsDetailModal.tsx:136-147`). 오류 이벤트가 없어 프론트는 실패를 구분하지 못한다.
- 스트림 요청 타임아웃 없음: `askQuestionAboutNewsStream` 은 `fetchWithTimeout` 을 쓰지 않는다 (`frontend/src/lib/api.ts:100-115`).
- Must-Read 판정 불일치: 백엔드 필터는 `is_high_signal` 만 보지만 MSW 목은 `quality_score >= 7.8 || is_high_signal` 로 거른다 (`backend/app/api/news.py:63-64`, `frontend/src/mocks/handlers.ts` 의 `GET */api/news`). 목의 오류 응답 형식(`error_code`, `message`)도 백엔드(`detail`)와 다르다.
- 프론트 타입과 응답 차이: `NewsItemSchema` 에 `full_content`, `scraped_at` 이 있지만 `NewsItemResponse` 에는 없다. `url` 은 zod 에서 `.url()` 이지만 응답을 zod 로 검증하지 않는다 (`frontend/src/types/news.ts:20-45`, `backend/app/schemas/news.py:5-30`).
- 통계 실패가 브리핑·레이더를 막음: `fetchStats` 실패 시 `Promise.all` 이 거부되어 브리핑·레이더 상태도 갱신되지 않는다 (`frontend/src/hooks/useNewsFeed.ts:35-47`).
- `StatsResponse.last_updated` 는 현재 시각이라 "마지막 갱신" 의미가 없다 (`backend/app/api/stats.py:20`).
- 북마크 보기에서 정렬·Must-Read 가 무시되지만 상태 바는 "(Must-Read 필터링)" 을 그대로 표시한다. 북마크는 스냅샷이라 초기화 후에도 남고 서버 데이터와 어긋날 수 있다 (`frontend/src/hooks/useNewsFeed.ts:58-74`).
- RSS: 채널 링크가 `http://localhost:3000` 고정인데 프론트 포트 설정은 3001 이다 (`backend/app/api/news.py:192`, 루트 `config.json` `app.frontend_port`). `category` 를 이스케이프·소문자 변환하지 않는다 (`backend/app/api/news.py:172-173,183`).
- 파괴적 API 무인증: `DELETE /api/news/all`, `POST /api/schedule/reset-and-collect` 는 인증 없이 호출된다. `DELETE /api/news/all` 은 UI 진입점이 없다 (`frontend/src/lib/api.ts:258` 미사용).
- 정렬 `hot` 의 점수 노후화: `hotness_score` 는 수집 시점 값이라 시간이 지나도 순위가 바뀌지 않는다 (`backend/app/collectors/manager.py:120,138`).
- 상세 모달 헤더와 푸터는 카테고리·소스 원값(`mcp_plugins_skills`, `rss_kr` 등)을 그대로 보여 카드 라벨과 다르다 (`frontend/src/components/NewsDetailModal.tsx:212,371`).
- `NEWS-11` 일괄 응답 API 와 `NEWS-12` 단건 조회 API 는 메인 UI 에서 쓰지 않는다.
- 헤더 버전 표기 `v0.1.0` 이 고정 문자열이며 설정 버전(`0.3.1`)과 다르다 (`frontend/src/components/Header.tsx:124`, `config.json` `app.version`).
