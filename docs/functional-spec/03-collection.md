# 기능명세: 수집·분류·요약 파이프라인

Updated: 2026-11-06

## 개요
6종 외부 소스(RSS, HackerNews, GitHub, arXiv, Hugging Face Daily Papers, Reddit)에서 AI 에이전트·하네스·MCP 관련 글을 가져와, 관련성·품질 게이트(LLM 우선, 실패 시 휴리스틱)로 거르고, 키워드 규칙으로 4개 카테고리를 정하고, 중복을 합친 뒤 `news_items` 에 저장한다. 저장 시 인기도(hotness), 3줄 요약, 개발자 시사점, 기술 스택을 붙인다. 수집은 APScheduler 로 하루 4번(UTC 0·6·12·18시), 서버 시작 시 DB 가 비어 있으면 1번, 그리고 헤더 "즉시 수집"·"초기화 & 재수집" 버튼, MCP 도구로 실행된다. 진행 상황은 `/api/schedule/progress`, `/api/schedule/status` 로 본다. 기사 원문 본문 스크래퍼는 수집 파이프라인이 아니라 챗에서 필요할 때 호출된다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| COLL-01 | 수집 실행 오케스트레이션 | 6개 수집기를 동시에 실행하고 소스별 배치를 순차 저장, 시드·크롤 로그 처리 | `collector_manager.collect_all()` |
| COLL-02 | 소스 설정 로딩 | `sources.json` 을 찾아 읽고 소스별 설정·활성 여부를 수집기에 제공 | `sources_service` |
| COLL-03 | RSS 수집기 | 활성 RSS/Atom 피드에서 피드당 8건 | `fetch_rss()` |
| COLL-04 | HackerNews 수집기 | Algolia 검색 API, 쿼리당 12건 | `fetch_hackernews()` |
| COLL-05 | GitHub 수집기 | 저장소 검색 API 쿼리당 8건, 결과가 적으면 모니터링 저장소로 보충 | `fetch_github()` |
| COLL-06 | arXiv 수집기 | arXiv Atom API, 쿼리당 8건 | `fetch_arxiv()` |
| COLL-07 | Hugging Face 수집기 | Daily Papers 상위 12건 | `fetch_huggingface()` |
| COLL-08 | Reddit 수집기 | 서브레딧 hot 12건 중 제목 키워드 일치 글 | `fetch_reddit()` |
| COLL-09 | 관련성·품질 게이트 | 사전 필터 → LLM 평가 → 휴리스틱 폴백으로 저장 여부·품질 점수·하이시그널 결정 | `llm_processor.evaluate_content_with_llm()` |
| COLL-10 | 휴리스틱 품질 점수 | 키워드·소스 가중치로 1.0~10.0 점수 | `llm_processor.evaluate_quality_and_signal()` |
| COLL-11 | AI 도메인 판정·카테고리 분류·태그 | 정규식 AI 판정, 키워드 점수로 4개 카테고리와 태그 결정 | `categorizer.is_strictly_ai_related()`, `classify_and_tag()` |
| COLL-12 | 인기도(hotness) 점수 | 점수·댓글·경과 시간으로 0~100 | `categorizer.calculate_hotness()` |
| COLL-13 | 핵심 요약·시사점·기술 스택 합성 | 3줄 TL;DR, why_it_matters, tech_stack 생성 (규칙 기반) | `llm_processor.generate_synthesis()` |
| COLL-14 | 중복 제거·저장·갱신 | dedup 해시로 신규 저장 또는 기존 행 갱신 | `CollectorManager._process_and_save_batch()` |
| COLL-15 | 시드 데이터 | 전체 수집 결과가 0건이면 고정 2건 투입 | `SEED_ITEMS` |
| COLL-16 | 진행 상태·크롤 로그 | 메모리 진행 상태, 실행당 1행 크롤 로그, 스케줄 상태 조회 | `GET /api/schedule/progress`, `GET /api/schedule/status` |
| COLL-17 | 정기 스케줄 | UTC 0·6·12·18시 수집 (딥 리서치·브리핑 작업도 같은 스케줄러) | `start_scheduler()` |
| COLL-18 | 수동 트리거 | 백그라운드 수집 시작, 헤더 진행 폴링 | 헤더 "즉시 수집", 커맨드 팔레트 / `POST /api/schedule/trigger` |
| COLL-19 | 초기화 후 재수집 | 기사·크롤 로그 전체 삭제 후 백그라운드 수집 | 헤더 "초기화 & 재수집" / `POST /api/schedule/reset-and-collect` |
| COLL-20 | 시작 시 초기 수집 | 서버 시작 시 기사 0건이면 수집 | FastAPI lifespan |
| COLL-21 | MCP 수집 트리거 | MCP 도구로 동기 수집 | MCP `trigger_agentlens_crawl` |
| COLL-22 | LLM 프로바이더 선택·폴백 | Anthropic → OpenAI → Ollama 순, Gemini 는 명시 요청 시만 | `llm_processor.generate_live_answer()`, `stream_tokens()` |
| COLL-23 | 테스트 환경 판정 | TESTING/CI 환경변수, pytest 로드 여부 | `llm_processor.is_test_environment()` |
| COLL-24 | 기사 본문 스크래퍼 | URL 원문을 받아 본문 추출, 2단 캐시 (챗에서 사용) | `ArticleScraperService.get_article_content()` |

## COLL-01 수집 실행 오케스트레이션
- 진입점: `collect_all()` 을 정기 스케줄(COLL-17), 수동 트리거(COLL-18), 초기화(COLL-19), 시작 시(COLL-20), MCP(COLL-21), `make collect` 가 호출한다.
- 입력: 선택 인자 `session` 은 받지만 쓰지 않는다.
- 처리 규칙:
  1. 이미 실행 중(`is_running`)이면 `{"status": "already_running", "message": "Collector is currently running"}` 를 돌려주고 끝낸다.
  2. `is_running=True`, `current_source="시작 중"`, `step_message="전세계 소스 실시간 수집을 시작합니다..."`, 카운터(`items_collected`, `items_saved`, `items_filtered`, `completed_sources`)를 0 으로 초기화한다.
  3. 작업 목록(이름, 코루틴) 6개를 만든다: "국내 & 글로벌 RSS 피드"(`fetch_rss`), "HackerNews", "GitHub Releases", "arXiv Papers", "Hugging Face", "Reddit". `total_sources = 6`.
  4. `asyncio.gather(..., return_exceptions=True)` 로 6개 워커를 동시에 실행한다. 각 워커는 `current_source=이름`, `step_message="⚡️ {이름} 수집 중..."` 으로 바꾸고, 수집기 결과를 받아 `source_results[이름] = {"count": n}` 을 기록한 뒤 `_process_and_save_batch` 로 저장한다(COLL-14). 끝나면 `completed_sources += 1`, `step_message="✅ {이름} 완료 (+{saved}건 선별 저장)"`.
  5. 워커 예외는 로그를 남기고 `source_results[이름] = {"error": str(e), "count": 0}`, `completed_sources += 1` 로 처리한다. 다른 소스는 계속된다.
  6. 저장 배치는 `asyncio.Lock`(`_db_lock`) 안에서 실행되므로 소스별 배치는 한 번에 하나씩 처리된다. 락 안에서 기사별 LLM 평가 호출도 함께 일어난다.
  7. 모든 워커가 끝나고 `items_collected == 0` 이면 시드를 저장한다(COLL-15).
  8. `crawl_logs` 에 실행당 1행을 쓴다(COLL-16).
  9. `last_crawl_time`, `last_crawl_stats`(`total_collected`, `total_saved`, `total_filtered_low_quality`, `source_results`) 를 갱신하고 `step_message="🎉 수집 완료! 총 {items_saved}건 신규 선별 저장"`.
  10. `finally` 에서 `is_running=False`.
- 출력: `{"status": "success", "total_collected", "total_saved", "total_filtered_low_quality", "source_results"}`.
- 예외·엣지: 크롤 로그 쓰기 등 바깥 단계에서 예외가 나면 `step_message="수집 오류: {e}"`, `{"status": "error", "error": ...}` 를 돌려주고 크롤 로그는 남지 않는다. 6개 워커가 동시에 시작하므로 `current_source`/`step_message` 는 마지막으로 쓴 워커 값으로 계속 덮어써진다.
- 관련 코드: `backend/app/collectors/manager.py:45-70`, `backend/app/collectors/manager.py:176-259`

## COLL-02 소스 설정 로딩
- 진입점: 각 수집기가 실행될 때마다 `sources_service` getter 를 호출해 파일을 새로 읽는다.
- 입력: `sources.json`. 탐색 순서는 cwd 의 `sources.json`, cwd 부모의 `sources.json`, 저장소 루트 `sources.json`, `backend/app/config/sources.json`. 없으면 `backend/app/config/sources.json` 경로를 기본으로 쓴다.
- 처리 규칙:
  1. 읽기 실패 시 오류 로그 후 내장 기본값(`_default_sources`: GeekNews RSS 1개, GitHub `topic:mcp-server`, Reddit `LocalLLaMA`/`agent`·`mcp`, HN `AI agent`, arXiv `all:"agent harness"`, HF 활성)을 쓴다.
  2. 정규화: `rss_feeds` 가 없으면 옛 키(`korean_sources`, `harness_and_mcp_releases`, `global_research_and_blogs`)에서 만든다. `github_sources`, `reddit_sources`, `hackernews_sources`, `arxiv_sources`, `huggingface_sources` 가 없으면 기본 블록을 넣는다.
  3. getter: RSS 는 `enabled` 가 true(기본)인 피드만. GitHub 은 비활성이면 `enabled: False` 와 빈 목록, 활성이면 `search_queries` 와 `enabled` 인 `monitored_repos` 만. Reddit/HN/arXiv 는 블록 그대로, HF 는 `enabled` 값(기본 true).
  4. 읽은 시점의 저장소 루트 파일(`sources.json`) 기준 활성 소스: RSS 17개(국내 `country: KR` 5개, 글로벌 12개), GitHub 검색 쿼리 5개·모니터링 저장소 8개, Reddit 서브레딧 4개(`LocalLLaMA`, `MachineLearning`, `OpenAI`, `ArtificialInteligence`)·키워드 7개(`agent`, `harness`, `mcp`, `eval`, `tool`, `benchmark`, `reasoning`), HN 쿼리 6개, arXiv 쿼리 3개, HF 활성. `backend/app/config/sources.json` 과 내용이 같았다.
- 출력: 소스별 설정 dict.
- 예외·엣지: 소스 관리(추가·토글·삭제) UI·API 는 소스 영역 문서에서 다룬다.
- 관련 코드: `backend/app/services/sources_service.py:11-157`, `sources.json`, `backend/app/config/sources.json`

## COLL-03 RSS 수집기
- 진입점: `fetch_rss()`.
- 입력: 활성 RSS 피드 목록. 비어 있으면 코드 내장 5개(GeekNews, AI타임스(KR), Simon Willison, OpenAI News, LangChain Blog)를 쓴다.
- 처리 규칙:
  1. 공용 `httpx.AsyncClient`(timeout 8.0, `follow_redirects=True`, User-Agent `Mozilla/5.0 (compatible; AgentLens/1.0; +https://github.com/agentlens)`)로 모든 피드를 동시에 요청하되 `Semaphore(6)` 으로 동시 6개까지. 피드별 요청 timeout 6.0초.
  2. HTTP 200 이 아니면 그 피드는 0건.
  3. `feedparser` 로 파싱해 앞 8개 entry 만 쓴다. `link` 없으면 건너뛴다.
  4. 요약: `summary` → `description` → `content[0].value` 순으로 고르고 HTML 태그 제거, 공백 정리 후 320자 초과 시 잘라 `...` 를 붙인다.
  5. 발행 시각: `published`, 없으면 `updated` 를 dateutil 로 파싱(naive 면 UTC). 실패하거나 둘 다 없으면 현재 시각.
  6. 필드: `title = "[{피드 이름}] {entry 제목}"`, `source = "rss_kr"`(피드 `country == "KR"`) 또는 `"rss"`, `author = entry.author 또는 피드 이름`, `raw_score = 180`(KR) / `150`, `comments_count = 0`.
- 출력: 원시 항목 dict 목록.
- 예외·엣지: 피드 단위 예외는 조용히 무시하고 0건 처리. 피드 설정의 `category_hint` 는 항목에 담지 않는다.
- 관련 코드: `backend/app/collectors/sources/rss.py:12-89`

## COLL-04 HackerNews 수집기
- 진입점: `fetch_hackernews()`.
- 입력: `hackernews_sources.queries` (블록에 없으면 코드 기본 `["AI agent", "Model Context Protocol", "agent harness"]`). `enabled` 가 false 면 빈 목록.
- 처리 규칙:
  1. 쿼리마다 `GET https://hn.algolia.com/api/v1/search_by_date` (`query`, `tags=story`, `hitsPerPage=12`), timeout 10.0.
  2. URL 은 `hit.url`, 없으면 `https://news.ycombinator.com/item?id={objectID}`. 한 실행 안에서 URL 로 중복 제거.
  3. `summary = story_text` 또는 `"Hacker News discussion ({points} pts, {num_comments} comments)"`, `author` 기본 `hn_user`, `raw_score = points`, `comments_count = num_comments`, 발행 시각 `created_at`(실패 시 현재).
- 예외·엣지: 200 이 아니거나 예외면 그 쿼리는 건너뛴다.
- 관련 코드: `backend/app/collectors/sources/hackernews.py:9-44`

## COLL-05 GitHub 수집기
- 진입점: `fetch_github()`.
- 입력: `search_queries`, 활성 `monitored_repos`. 비활성이면 빈 목록.
- 처리 규칙:
  1. 쿼리마다 `GET https://api.github.com/search/repositories` (`sort=updated`, `order=desc`, `per_page=8`), timeout 10.0, 헤더 `Accept: application/vnd.github.v3+json`, `User-Agent: AgentLens-Collector/1.0`. 인증 토큰은 쓰지 않는다.
  2. `html_url` 로 중복 제거. `title = "{full_name}: {description[:100]}"` (설명 없으면 `"Open-source agent repository"`), `summary = description`, `author = owner.login`, `raw_score = stargazers_count`, `comments_count = forks_count`, 발행 시각 `updated_at`.
  3. 검색 결과가 5건 미만이고 모니터링 저장소가 있으면, 아직 없는 저장소를 `https://github.com/{repo}` 로 추가한다: `title = "{repo}: {description[:110]}"`, 발행 시각 현재, `raw_score = stars_hint`(기본 5000), `comments_count = int(stars_hint * 0.12)`.
- 예외·엣지: 쿼리 단위 실패는 건너뛴다.
- 관련 코드: `backend/app/collectors/sources/github.py:9-73`

## COLL-06 arXiv 수집기
- 진입점: `fetch_arxiv()`.
- 입력: `arxiv_sources.queries` (블록에 없으면 `['all:"agent harness" OR all:"agent evaluation"']`).
- 처리 규칙:
  1. 쿼리마다 `GET http://export.arxiv.org/api/query` (`start=0`, `max_results=8`, `sortBy=submittedDate`, `sortOrder=descending`), timeout 12.0.
  2. Atom `entry` 를 파싱. URL 은 `id`, 실행 내 중복 제거. 제목은 공백 정규화 후 `"[arXiv] "` 접두사(없으면 "Untitled Paper"). 요약은 공백 정규화 후 350자 초과 시 잘라 `...`.
  3. `author = "arXiv Researcher"`, `raw_score = 120`, `comments_count = 0`, 발행 시각 `published`(실패 시 현재).
- 예외·엣지: 200 아님·파싱 예외 시 그 쿼리를 건너뛴다.
- 관련 코드: `backend/app/collectors/sources/arxiv.py:8-53`

## COLL-07 Hugging Face 수집기
- 진입점: `fetch_huggingface()`.
- 입력: `huggingface_sources.enabled`.
- 처리 규칙:
  1. `GET https://huggingface.co/api/daily_papers`, timeout 10.0. 응답 배열 앞 12개.
  2. `paper.id` 없으면 건너뛴다. `title = "[HF Daily] {title}"`, `url = https://huggingface.co/papers/{id}`, 요약 앞 300자, `author = "Hugging Face Daily Papers"`, `raw_score = numComments + 40`, `comments_count = numComments`, 발행 시각 `publishedAt`.
- 예외·엣지: 예외 시 빈 목록.
- 관련 코드: `backend/app/collectors/sources/huggingface.py:7-38`

## COLL-08 Reddit 수집기
- 진입점: `fetch_reddit()`.
- 입력: `subreddits`, `keywords` (블록에 키가 없으면 코드 기본 `["LocalLLaMA", "MachineLearning"]`, `["agent", "harness", "mcp", "eval", "tool", "llm"]`).
- 처리 규칙:
  1. 서브레딧마다 `GET https://www.reddit.com/r/{sub}/hot.json?limit=12`, timeout 10.0, `User-Agent: AgentLens-Collector/1.0`.
  2. 제목 소문자에 키워드 중 하나가 부분 문자열로 들어 있는 글만 남긴다.
  3. `title = "[r/{sub}] {title}"`, `url = https://www.reddit.com{permalink}`, `summary = selftext[:300]` 또는 `"Reddit discussion on r/{sub}"`, `author = "u/{author}"`, `raw_score = score`, `comments_count = num_comments`, 발행 시각 `created_utc`.
- 예외·엣지: 서브레딧 사이 URL 중복 제거는 하지 않는다(저장 단계 dedup 해시로 합쳐진다).
- 관련 코드: `backend/app/collectors/sources/reddit.py:7-41`

## COLL-09 관련성·품질 게이트
- 진입점: `_process_and_save_batch` 가 제목·URL 이 있는 항목마다 `evaluate_content_with_llm(title, summary, source, category_hint)` 를 호출한다.
- 입력: `title`, `summary`, `source`, `category_hint`(받지만 쓰지 않는다. 수집기들이 값을 넣지 않아 항상 None).
- 처리 규칙:
  1. 캐시: 키 `"{title.strip().lower()}::{source}"` 가 프로세스 메모리 캐시(`_eval_cache`, 크기 제한·만료 없음)에 있으면 그 결과를 그대로 쓴다. 거부 결과도 캐시된다.
  2. 혼합 소스 판정: `source` 가 `rss_kr`, `rss`, `hackernews`, `web` 중 하나면 혼합 소스다.
  3. 사전 필터: 혼합 소스이고 `is_strictly_ai_related(title, summary)` 가 false 면 LLM 호출 없이 거부한다 (`quality_score 1.0`, `relevance_score 0.0`, `category "unrelated"`, `rejection_reason "Pre-filter: No AI/Agent/MCP domain relevance found in mixed feed"`, `evaluated_by "pre_filter_gate"`).
  4. LLM 평가: `has_live_provider()` 가 true(Anthropic 키, OpenAI 키, 또는 Ollama `/api/tags` 1초 내 200 중 하나)면 큐레이터 프롬프트로 `_generate_live_answer` 를 호출한다. 프롬프트는 4개 주제(하네스·벤치마크·평가·샌드박스 / MCP·도구·스킬·플러그인 / 에이전트 프레임워크·멀티에이전트·코딩 에이전트 / 프런티어 모델·LLM·추론)만 색인하고 일반 프로그래밍·비즈니스·커리어·비 AI 소프트웨어는 거부하라고 지시하며, JSON(`is_relevant_to_ai_agent`, `category`, `relevance_score`, `quality_score`, `is_worthwhile`, `is_high_signal`, `rejection_reason`, `why_it_matters`(한국어 1~2문장))만 요구한다.
  5. 응답 처리: 앞뒤 코드펜스 제거 후 첫 `{`~마지막 `}` 를 JSON 파싱. `is_worthwhile = LLM is_worthwhile AND is_relevant_to_ai_agent AND category != "irrelevant" AND relevance_score >= 5.0 AND quality_score >= QUALITY_CUTOFF_SCORE`. `is_high_signal = is_worthwhile AND (quality_score >= HIGH_SIGNAL_THRESHOLD OR LLM is_high_signal)`. `category` 는 저장 가치가 있고 4개 카테고리 중 하나일 때만 그 값, 아니면 `"unrelated"`. 점수는 소수 1자리 반올림(범위 보정 없음). `why_it_matters` 는 LLM 값, `evaluated_by` 는 모델 id.
  6. 휴리스틱 폴백: LLM 프로바이더가 없거나, 호출이 실패해 답이 없거나(모든 예외는 `_generate_live_answer` 가 삼킨다), JSON 을 찾지 못하거나, 파싱 예외가 나면 `evaluate_quality_and_signal`(COLL-10)과 `classify_and_tag`(COLL-11)를 쓴다. 저장 가치 없음이거나 카테고리가 `unrelated` 면 거부(`relevance_score 0.0`, 사유는 휴리스틱 사유 또는 `"Strict heuristic rejection: Low signal or unrelated"`). 아니면 통과(`relevance_score 7.0`, 휴리스틱 `is_high_signal`, 휴리스틱 카테고리, `why_it_matters None`). `evaluated_by "heuristic_fallback"`.
  7. 결과를 캐시에 넣고 돌려준다.
- 출력: `{quality_score, relevance_score, is_worthwhile, is_high_signal, category, rejection_reason, why_it_matters, evaluated_by}`.
- 예외·엣지: 게이트 거부 시 매니저는 `items_filtered += 1` 후 다음 항목으로 넘어간다. LLM 평가 모델은 지정하지 않으므로 Anthropic 이면 기본 챗 모델(`ANTHROPIC_DEFAULT_CHAT_MODEL`)을 쓴다(COLL-22).
- 관련 코드: `backend/app/services/llm_processor.py:543-670`, `backend/app/collectors/manager.py:91-102`, `backend/tests/test_collectors.py:52-72`

## COLL-10 휴리스틱 품질 점수
- 진입점: `evaluate_quality_and_signal(title, summary, source)`. COLL-09 폴백, 소스 리서처·딥 리서처에서도 호출한다.
- 입력: 제목, 요약, 소스.
- 처리 규칙 (텍스트는 `"{title} {summary}"` 소문자, 키워드는 부분 문자열 일치):
  1. 혼합 소스(`rss_kr`, `rss`, `hackernews`, `web`)이고 AI 도메인이 아니면 즉시 `quality_score 1.0`, 저장 가치 없음, 사유 `"Non-AI domain topic in mixed feed"`.
  2. 기본 점수: 혼합 소스 5.0, 그 외 6.0.
  3. 고신호 키워드(benchmark, swe-bench, protocol, architecture, evaluation, sandbox, multi-agent, reasoning, open-source, 하네스, 벤치마크, 평가 프레임워크, 아키텍처, 프로토콜, mcp, langgraph, fastmcp, agent, 에이전트, 모델, 도구 호출, 스킬, framework, coding agent, 추론 모델, claude, anthropic, openai, gpt-4, deepseek, gemini, sonnet, r1, 코딩 에이전트) 일치 개수 × 0.5, 최대 +2.5.
  4. 소스 신뢰도: `github`, `arxiv`, `huggingface` +1.0, `rss`/`rss_kr` 이면서 AI 도메인 +0.5.
  5. 스팸 키워드(sale, discount, crypto price, airdrop, coupon, 광고, 특가, 할인, 해고 통보, 취업, 연봉, 부동산, 사고방식, 파푸아뉴기니, 전자책, 줄무늬) 하나마다 −3.5.
  6. trim 한 제목이 10자 미만이면 −2.0.
  7. 소수 1자리 반올림 후 1.0~10.0 으로 자른다.
  8. `is_worthwhile = score >= QUALITY_CUTOFF_SCORE`(혼합·비 AI 면 false), `is_high_signal = score >= HIGH_SIGNAL_THRESHOLD AND is_worthwhile`.
- 출력: `{quality_score, is_worthwhile, is_high_signal}` (+1 단계 거부 시 `rejection_reason`).
- 예외·엣지: `reddit` 은 혼합 소스가 아니라서 AI 사전 판정 없이 기본 6.0 에서 시작하고 신뢰도 가산이 없다.
- 관련 코드: `backend/app/services/llm_processor.py:477-541`, `backend/tests/test_llm_processor.py:14-23`

## COLL-11 AI 도메인 판정·카테고리 분류·태그
- 진입점: `is_strictly_ai_related(title, summary)`, `classify_and_tag(title, summary)`. 매니저 저장 단계와 COLL-09 폴백에서 호출.
- 입력: 제목, 요약.
- 처리 규칙:
  1. AI 도메인 판정: `AI_CORE_PATTERNS`(영문 단어경계 정규식 예: `\bai\b`, `\bllm\b`, `\bagents?\b`, `\bmcp\b`, `\bevals?\b`, `\bgpt-[0-9a-z.-]+\b`, `\brag\b`, `\binference\b`, `\bweights?\b`, `\battention\b`, `\bollama\b` 등과 한국어 패턴 인공지능, 에이전트, 거대언어모델, 하네스, 벤치마크, 언어 모델, 멀티모달, 강화학습, 양자화 등)를 OR 로 묶은 대소문자 무시 정규식이 `"{title} {summary}"` 에서 한 번이라도 일치하면 true.
  2. 카테고리 4개: `harness`(Agent Harness & Evaluation), `mcp_plugins_skills`(Skills, Plugins & MCP), `agent_tech`(Agent Technology & Workflows), `ai_news`(General AI & Foundation Models). 분류 불가 시 `unrelated`.
  3. 키워드 점수: 카테고리별 `KEYWORDS` 목록(영문·한국어)의 각 키워드가 소문자 본문에 들어 있으면, 5자 이하 영숫자 키워드는 단어경계 정규식으로 다시 확인한다. 제목에도 있으면 3.5, 본문에만 있으면 1.5 를 더하고 그 키워드를 태그로 모은다.
  4. 우선순위 가중치: `harness ×1.3`, `mcp_plugins_skills ×1.2`, `agent_tech ×1.1`, `ai_news ×1.0`. 가장 높은 점수의 카테고리를 고른다(동점이면 먼저 나온 카테고리, 순서는 harness → mcp → agent_tech → ai_news).
  5. 제목 강제 규칙 (위에서부터 첫 일치):
     - 제목에 harness, swe-bench, benchmark, 하네스, 벤치마크 중 하나 또는 `\bevals?\b` → `harness` (점수 0 이었으면 3.0).
     - 아니고 제목에 mcp, model context protocol, fastmcp, 도구 호출, 함수 호출, tool calling → `mcp_plugins_skills` (점수 0 이면 3.0).
     - 아니고 제목에 multi-agent, crewai, langgraph, 에이전트, 자율 에이전트 또는 `\bagents?\b` → 현재 최고가 harness/mcp 가 아니면 `agent_tech` (점수 0 이면 3.0).
  6. 최종 점수가 0 이면 `("unrelated", [], 0.0)`.
- 출력: `(category, sorted(tags), score)`. 태그는 일치한 키워드 원문.
- 매니저에서의 최종 카테고리 결정:
  1. 게이트 통과 후 `classify_and_tag` 결과를 1차 카테고리로 쓴다.
  2. 게이트 결과 카테고리가 4개 중 하나이고 1차가 `unrelated` 또는 `ai_news` 면 게이트(LLM 또는 휴리스틱) 카테고리로 바꾼다. 즉 키워드 규칙이 harness/mcp/agent_tech 를 냈으면 LLM 판단보다 우선한다.
  3. 최종이 `unrelated` 면 `items_filtered += 1` 하고 버린다.
- 예외·엣지: 서브스트링 기반이라 "mcp" 는 5자 이하 규칙으로 단어경계 검사를 받지만, "agent" 처럼 6자 이상 영문 키워드나 한국어 키워드는 단어 안에 포함돼도 일치한다.
- 관련 코드: `backend/app/collectors/categorizer.py:6-137`, `backend/app/collectors/manager.py:104-115`, `backend/tests/test_collectors.py:5-50`

## COLL-12 인기도(hotness) 점수
- 진입점: 매니저 저장 단계 `calculate_hotness(raw_score, comments_count, published_at)`.
- 처리 규칙:
  1. `published_at` 이 naive 면 UTC 로 간주.
  2. `hours_ago = max(0.1, (now - published_at) 시간)`.
  3. `engagement = raw_score + comments × 2.5 + 5.0` (None 은 0).
  4. `hotness = engagement / (hours_ago + 2.0)^1.3`.
  5. 결과 `round(min(100.0, hotness × 8.0), 2)`.
- 출력: 0~100 실수. 피드 `hot` 정렬과 카드 Hot 배지에 쓰인다.
- 예외·엣지: 저장·갱신 시점에만 계산한다. 이후 시간 경과로 다시 계산하는 작업은 없다. 같은 기사가 다시 수집되면 그때 값으로 덮어쓴다.
- 관련 코드: `backend/app/collectors/categorizer.py:139-147`, `backend/app/collectors/manager.py:117-120,138`, `backend/tests/test_collectors.py:31-35`

## COLL-13 핵심 요약·시사점·기술 스택 합성
- 진입점: 매니저 저장 단계 `generate_synthesis(title, summary, category, why_it_matters_override)`. LLM 을 호출하지 않는 규칙 기반 함수다.
- 입력: 제목, 원시 요약, 최종 카테고리, 게이트 결과의 `why_it_matters`.
- 처리 규칙:
  1. 기술 스택: `KNOWN_TECH_STACK` 사전의 키(예: `claude 5.5`, `claude-sonnet-5-5`, `gpt-4o`, `o1`, `o3`, `deepseek-r1`, `swe-bench`, `gaia`, `sandbox`, `evals`, `mcp`, `fastmcp`, `langgraph`, `crewai`, `vllm`, `ollama`, `docker`, `fastapi`, `python`, `typescript` 등 40개)를 소문자 본문에서 단어경계 정규식으로 찾아 표시명(예: `mcp` → "Model Context Protocol", `sandbox` → "Docker Sandbox", `evals` → "Eval Harness")으로 바꾸고 정렬한다.
  2. TL;DR 3줄: ① `"핵심 주제: {title}"` ② 기술 스택이 있으면 `"관련 기술/모델: {앞 4개} 적용 및 생태계 연계"`, 없으면 `"AI 에이전트 및 하네스 최신 개발 워크플로우 분석"` ③ 요약이 있으면 `[.!?]` + 공백으로 나눈 문장 중 15자 초과 첫 문장으로 `"주요 내용: {문장}"`, 그런 문장이 없으면 `"주요 내용: {요약 앞 120자}..."`, 요약이 없으면 `"공식 레포지토리 및 기술 문서 릴리즈"`.
  3. 시사점: override 가 trim 후 10자 초과면 그 값. 아니면 카테고리별 고정 문구(`CATEGORY_INSIGHTS`, 없는 카테고리는 `ai_news` 문구)를 쓰되, 기술 스택이 있으면 `"{첫 기술} 기반 구현에서 {문구}"`.
- 출력: `{tldr_bullets: [3개], why_it_matters, tech_stack}`.
- 예외·엣지: LLM 게이트가 쓰이지 않은 경우(휴리스틱 폴백) 시사점은 항상 고정 문구 기반이다.
- 관련 코드: `backend/app/services/llm_processor.py:40-89`, `backend/app/services/llm_processor.py:469-475`, `backend/app/services/llm_processor.py:672-715`, `backend/tests/test_llm_processor.py:5-31`

## COLL-14 중복 제거·저장·갱신
- 진입점: `_process_and_save_batch(raw_items, source_name)`.
- 입력: 수집기 원시 항목 목록.
- 처리 규칙:
  1. 빈 목록이면 0 을 돌려준다.
  2. `_db_lock` 을 잡고 새 세션 하나로 배치 전체를 처리한다.
  3. 항목마다 `title`, `url` 을 trim, `summary` 는 None 이면 `""`, `source` 기본 `"web"`. 제목이나 URL 이 비면 건너뛴다(카운트 안 함). 아니면 `items_collected += 1`.
  4. 게이트(COLL-09) → 카테고리 결정(COLL-11) → hotness(COLL-12) → 합성(COLL-13). `published_at` 없으면 현재 시각, `raw_score`·`comments_count` 기본 0.
  5. dedup 해시: URL 은 trim·끝 `/` 제거 후 `?utm_...(&utm_...)*` 패턴 제거, 제목은 소문자·trim 후 영숫자·한글 외 문자 제거, `sha256("{제목}::{URL}")`.
  6. 같은 해시 행이 있으면 갱신: `raw_score`·`comments_count` 는 기존과 새 값 중 큰 값, `hotness_score`·`quality_score`·`is_high_signal` 은 새 값으로 덮어쓴다. 기존 `why_it_matters` 가 비어 있을 때만 `why_it_matters`, `tldr_bullets`, `tech_stack` 을 채운다. 제목·요약·카테고리·태그·발행 시각은 바꾸지 않는다. 갱신은 저장 건수에 들어가지 않는다.
  7. 없으면 신규 `NewsItem` 을 추가한다: `tags` 콤마 문자열, `tldr_bullets` JSON(ensure_ascii=False), `tech_stack` 콤마 문자열 등. `saved_count += 1`.
  8. 배치 끝에 한 번 커밋하고 `items_saved += saved_count`.
- 출력: 신규 저장 건수.
- 예외·엣지: 배치 중 어떤 예외든 전체 롤백 후 오류 로그, 0 을 돌려준다. 이미 증가한 `items_collected`·`items_filtered` 는 되돌리지 않는다. 같은 배치 안 중복은 세션 autoflush(기본값) 덕에 두 번째 조회에서 앞 항목이 보여 갱신으로 처리된다. 수집기가 붙인 접두사(`[arXiv]`, `[r/sub]`, `[피드명]`)가 제목에 포함되므로 같은 글이라도 소스가 다르면 해시가 다르다.
- 관련 코드: `backend/app/collectors/manager.py:72-174`, `backend/app/collectors/categorizer.py:83-87`, `backend/app/models/news.py:5-39`

## COLL-15 시드 데이터
- 진입점: `collect_all` 에서 모든 워커 종료 후 `items_collected == 0` 일 때.
- 처리 규칙: `SEED_ITEMS` 2건("SWE-bench 2.0: Next-Gen Evaluation Harness for Autonomous Coding Agents" / github / raw 2400 / 댓글 310, "Anthropic Model Context Protocol (MCP) Server Specifications" / rss / raw 3950 / 댓글 820)을 `"Seeds"` 이름으로 일반 배치와 같은 경로(게이트·분류·dedup)로 저장한다.
- 예외·엣지: 시드의 `published_at` 은 모듈 import 시각으로 고정된다. 게이트에서 거부되면 저장되지 않는다. 이미 같은 해시가 있으면 갱신된다.
- 관련 코드: `backend/app/collectors/manager.py:22-43,219-221`

## COLL-16 진행 상태·크롤 로그
- 진입점: `GET /api/schedule/progress`, `GET /api/schedule/status`. 헤더(30초마다 status, 수집 중 1200ms 마다 progress), 스케줄 모달.
- 처리 규칙:
  1. progress: 메모리 값 `{is_running, current_source, step_message, items_collected, items_saved, items_filtered, total_sources, completed_sources, last_crawl_time}` 를 그대로 돌려준다. `last_crawl_stats`(소스별 결과)는 노출하지 않는다.
  2. 크롤 로그: 실행당 1행, `source="all_sources_stream_ingestion"`, `items_crawled = items_collected`, `items_saved`, `status="success"`(고정), `started_at`, `completed_at`. `error_message` 는 쓰지 않는다. 소스별 행은 없다.
  3. status: 현재 UTC, `schedule_hours = SCHEDULED_HOURS`(설정 `scheduler.crawl_hours`, 기본 `[0,6,12,18]`), `timezone = CRAWL_TIMEZONE`(기본 UTC), `next_run`(APScheduler `daily_crawl` 작업의 다음 실행 시각, 없으면 `SCHEDULED_HOURS` 중 오늘 남은 첫 시각, 없으면 내일 첫 시각, 모두 UTC), `minutes_until_next_run`(0 이상, 소수 1자리), `is_running`, `last_crawl_time`(최근 로그의 `completed_at`), `last_crawl_status`(`"running"`/`"idle"`, 메모리 기준), `recent_logs`(id 내림차순 5개).
  4. 헤더: 다음 수집까지 `"다음 수집 {h}h {m}m 후"`. 스케줄 모달은 `"{반올림 분}분 후"` 와 `next_run` 의 ko-KR 표기를 보여주고, 수집 주기는 "00:00 · 06:00 · 12:00 · 18:00"(KST 09·15·21·03) 고정 문구다.
- 출력: `ScheduleStatusResponse`, progress dict.
- 예외·엣지: 진행 상태는 프로세스 메모리라 재시작하면 초기화된다. 단계 메시지에 이모지가 들어 있다.
- 관련 코드: `backend/app/api/schedule.py:14-46`, `backend/app/collectors/manager.py:59-70,223-234`, `backend/app/scheduler.py:25-35`, `backend/app/schemas/news.py:131-140`, `frontend/src/components/Header.tsx:38-81,109-111`, `frontend/src/components/ScheduleModal.tsx:8-63`

## COLL-17 정기 스케줄
- 진입점: FastAPI 시작 시 `start_scheduler()`.
- 처리 규칙:
  1. `AsyncIOScheduler` 에 작업 3개를 `replace_existing=True` 로 등록한다:
     - `daily_crawl`: `CronTrigger(hour="0,6,12,18", minute="0", timezone="UTC")` → `collect_all()`.
     - `deep_research`: `hour="3,15"`, UTC → `deep_researcher.run_deep_research()`.
     - `daily_briefing_dispatch`: `hour="0", minute="15"`, UTC → `briefing_service.auto_dispatch_all()`.
  2. 이미 실행 중이면 다시 등록하지 않는다. 종료 시 `stop_scheduler()` 가 shutdown 한다.
  3. 실행 중 수집이 있으면 `collect_all` 이 `already_running` 으로 바로 끝난다.
- 출력: 없음 (표준 출력 로그).
- 예외·엣지: 크론 시각·타임존은 코드에 고정되어 있다. `config.json` 의 `scheduler.crawl_hours`, `scheduler.timezone` 은 상태 표시(`SCHEDULED_HOURS`, `timezone`)에만 쓰이고, `scheduler.enabled`, `scheduler.auto_briefing_hour` 는 읽는 코드가 없다.
- 관련 코드: `backend/app/scheduler.py:1-68`, `backend/app/main.py:16,25`, `backend/tests/test_scheduler.py`

## COLL-18 수동 트리거
- 진입점: 헤더 "즉시 수집" 버튼(수집 중 비활성, 라벨 "수집 중..."), 커맨드 팔레트의 수집 명령(`onTriggerCollect`), API `POST /api/schedule/trigger`.
- 처리 규칙:
  1. 수집 중이면 `{"status": "already_running", "message": "이미 수집이 진행 중입니다.", "total_collected", "total_saved", "source_results": {}}`.
  2. 아니면 `BackgroundTasks` 에 `collect_all` 을 넣고 즉시 `{"status": "started", "message": "실시간 점진적 수집이 시작되었습니다. 소식이 화면에 순차적으로 반영됩니다.", 0, 0, {}}`.
  3. 프론트: 요청 성공 후 메시지 "실시간 소식 수집 중..." 으로 1200ms 폴링을 시작한다. 매번 `step_message` 를 표시하고, `items_saved` 가 이전보다 늘면 피드·통계를 다시 불러온다. `is_running` 이 false 가 되면 폴링을 멈추고 `"수집 완료 (+{items_saved}건 신규 반영)"` 을 4초간 보여준 뒤 피드·통계·스케줄 상태를 갱신한다.
- 예외·엣지: 프론트는 응답 `status` 를 보지 않고 항상 폴링을 시작한다. 트리거 요청 실패 시 "수집 요청 실패" 3초. 폴링 중 요청이 실패하면 폴링을 멈추고 메시지를 지운다. 응답 스키마 `ManualCollectResponse` 는 정의만 있고 response_model 로 쓰지 않는다.
- 관련 코드: `backend/app/api/schedule.py:48-67`, `frontend/src/components/Header.tsx:51-93,207-218,290-296`, `frontend/src/lib/api.ts:190-202`

## COLL-19 초기화 후 재수집
- 진입점: 헤더 "초기화 & 재수집" → 확인 모달, API `POST /api/schedule/reset-and-collect`, `make reset`.
- 처리 규칙:
  1. 수집 중이면 삭제 없이 `{"status": "already_running", "message": "현재 수집이 진행 중이므로 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.", "deleted_count": 0}`.
  2. 아니면 `news_items`, `crawl_logs` 를 전부 삭제·커밋한다.
  3. 메모리 상태 초기화: `items_collected`, `items_saved`, `items_filtered` 0, `current_source ""`, `step_message "🧹 기존 데이터 삭제 완료. 실시간 재수집을 시작합니다."`.
  4. 백그라운드로 `collect_all` 을 시작하고 `{"status": "started", "message": "기존 데이터 {n}건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다.", "deleted_count": n}` (rowcount 없거나 0 이하이면 0).
  5. 프론트 후속 동작은 `01-news-feed.md` NEWS-17.
- 예외·엣지: `llm_processor._eval_cache`, `_qa_cache` 는 비우지 않으므로 재수집 시 같은 제목·소스는 이전 평가 결과(거부 포함)를 그대로 쓴다. `is_running` 은 백그라운드 작업이 실제로 시작될 때 true 가 되므로, 응답 직후 들어온 두 번째 요청도 삭제를 수행할 수 있다(이때 두 번째 `collect_all` 은 `already_running` 으로 끝난다). 인증이 없다.
- 관련 코드: `backend/app/api/schedule.py:69-99`, `backend/tests/test_reset_and_delete.py`

## COLL-20 시작 시 초기 수집
- 진입점: FastAPI `lifespan`.
- 처리 규칙: `ensure_db_schema()` → `start_scheduler()` → 기사 수가 0 이면 "[AgentLens] Initial database seed collection..." 출력 후 `collect_all()` 을 await 한다. 그 뒤에 요청을 받기 시작한다.
- 예외·엣지: 초기 수집이 끝날 때까지 서버가 요청을 받지 않는다(외부 요청·LLM 호출 시간만큼 기동이 늦어진다).
- 관련 코드: `backend/app/main.py:13-26`

## COLL-21 MCP 수집 트리거
- 진입점: MCP 서버(`python -m app.mcp.server`, stdio) 도구 `trigger_agentlens_crawl`.
- 처리 규칙: `collector_manager.collect_all()` 을 await 하고 결과 dict 를 JSON 문자열(들여쓰기 2)로 돌려준다.
- 예외·엣지: MCP 서버는 별도 프로세스라 API 서버의 `collector_manager`(실행 중 여부, 진행 상태)와 상태를 공유하지 않는다. 두 프로세스가 동시에 수집할 수 있다.
- 관련 코드: `backend/app/mcp/server.py:43-47`

## COLL-22 LLM 프로바이더 선택·폴백
- 진입점: `generate_live_answer(prompt, model, model_tier)`(일괄), `stream_tokens(...)`(스트리밍, 챗에서 사용), `_generate_live_answer(prompt)`(예외를 삼키는 래퍼, 수집 게이트·기사 Ask AI 가 사용).
- 입력: 프롬프트, 선택적 모델명 또는 티어.
- 처리 규칙:
  1. 키 해석: Anthropic 은 생성자 인자 → `settings.ANTHROPIC_API_KEY` → 환경변수 `ANTHROPIC_API_KEY` → `config.json` `llm.anthropic_api_key`. OpenAI·Gemini 는 settings → `config.json` → 환경변수 → 인스턴스 생성 시 값.
  2. 요청 모델 문자열에 `gemini` 가 있으면 Gemini 키 확인 후 `_call_gemini`(REST `generateContent`, temperature 0.3, maxOutputTokens 2048, timeout 20초, thought 파트 제외). 실패 시 `LLMUpstreamException`. 다른 프로바이더로 넘어가지 않는다. 스트리밍도 Gemini 는 한 번에 전체 텍스트를 1청크로 낸다.
  3. (일괄만) 모델 문자열에 `gpt` 또는 `openai` 가 있으면 OpenAI 만 시도, 실패 시 `LLMUpstreamException`.
  4. 그 외: `check_provider_available()` 이 `has_live_provider()` 를 확인하고 없으면 `LLMProviderUnavailableException("가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록)")`.
  5. 1순위 Anthropic(키 있을 때): `resolve_model_and_tier` 로 모델 결정. 빈 값이면 기본 모델(`ANTHROPIC_DEFAULT_CHAT_MODEL` → `ANTHROPIC_MODEL` → `claude-sonnet-5-5`), `haiku`/`sonnet`/`opus` 티어명은 설정 모델로, `gemini`/`google` 이 들어간 값은 기본 모델로 바꾼다. REST `/v1/messages`, `anthropic-version 2023-06-01`, `anthropic-beta prompt-caching-2024-07-31`, max_tokens 4096, timeout 45초(스트리밍 120초). `claude-` 로 시작하는 모델에는 temperature 를 보내지 않는다. 오류 매핑: 401 → `AnthropicKeyMissingException`, 429 → `AnthropicQuotaExceededException`(상위에서 `LLMQuotaExceededException` 으로 바꿔 즉시 전파), 503/529 → `AnthropicOverloadedException`(즉시 전파), 그 외 비 200 → `RuntimeError`(다음 순위로 폴백).
  6. 2순위 OpenAI(키 있을 때): Chat Completions, 모델 `OPENAI_MODEL`(기본 `gpt-4o-mini`), temperature 0.3, max_tokens 4096, timeout 60초(일괄은 httpx REST, 스트리밍은 공식 SDK). 오류 문자열에 429/quota/rate 가 있으면 `LLMQuotaExceededException`.
  7. 3순위 Ollama: `{OLLAMA_BASE_URL}/api/generate`, 모델 `OLLAMA_MODEL`(기본 `llama3.2:latest`), `num_predict 4096`, timeout 90초(스트리밍 120초).
  8. 모두 실패하면 `LLMUpstreamException("외부 LLM 업스트림 통신 실패 / API 장애")`. 스트리밍에서 이미 토큰을 낸 뒤 실패하면 `LLMStreamFailedException`.
  9. `has_live_provider()`: Anthropic 키 → OpenAI 키 → Ollama 주소가 있으면 동기 `httpx.Client` 로 `{url}/api/tags` 를 1초 timeout 으로 호출해 200 이면 true. `target_provider="gemini"` 면 Gemini 키 유무만 본다.
  10. 반환 모델 식별자는 `sanitize_model_identifier` 로 trim 하고, 비어 있으면 기본 챗 모델명을 쓴다.
- 출력: `(텍스트, 모델 식별자)` 또는 `(토큰, 모델)` 스트림.
- 예외·엣지: `config.json` `llm.provider`(`"auto"`)를 읽는 `LLM_PROVIDER` 설정은 어디서도 쓰지 않는다. `ANTHROPIC_COLLECTION_MODEL` 은 `generate_structured_summary`(수집용 구조화 요약, 캐시된 시스템 프롬프트, max_tokens 1500, 본문 4000자 포함)에서만 쓰이는데 이 함수는 파이프라인에서 호출되지 않고 테스트에서만 호출된다. 키가 없을 때 Ollama 연결 확인은 기본 주소 `http://localhost:11434` 로 매번 시도한다.
- 관련 코드: `backend/app/services/llm_processor.py:91-467`, `backend/app/services/llm_providers/anthropic_provider.py:29-123`, `backend/app/services/llm_providers/anthropic_provider.py:152-319`, `backend/app/services/llm_providers/anthropic_provider.py:321-369`, `backend/app/services/llm_providers/base.py`, `backend/app/config.py:48-65,108-132`

## COLL-23 테스트 환경 판정
- 진입점: `llm_processor.is_test_environment()`.
- 처리 규칙: 다음 중 하나면 true. ① `settings.TESTING` true(환경변수 `TESTING` 이 있으면 `true`/`1`/`yes` 여부로 덮어씀) ② 환경변수 `TESTING` 이 `true`/`1`/`yes` ③ 환경변수 `CI` 가 `true`/`1`/`yes` ④ `sys.modules` 에 `pytest` 가 있음.
- 출력: bool.
- 예외·엣지: 이 판정을 쓰는 곳은 챗 서비스의 ReAct 플래너 분기 한 곳뿐이다. 수집 게이트(COLL-09)와 기사 Ask AI 는 판정을 보지 않고 `has_live_provider()` 만 보므로, 테스트 중에도 키가 설정돼 있으면 실제 LLM 을 호출한다. 테스트는 `conftest.py` 에서 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고 id 1 샘플 기사를 넣지만 `TESTING` 은 설정하지 않는다.
- 관련 코드: `backend/app/services/llm_processor.py:229-240`, `backend/app/services/chat_service.py:381`, `backend/app/config.py:63,131-132`, `backend/tests/conftest.py`

## COLL-24 기사 본문 스크래퍼
- 진입점: `ArticleScraperService(session).get_article_content(article)`. 챗 서비스가 기사 원문이 필요할 때 호출한다. 수집 파이프라인에서는 호출하지 않는다.
- 입력: `NewsItem`.
- 처리 규칙:
  1. L1: 클래스 공용 `OrderedDict` LRU(용량 500). 적중 시 반환.
  2. L2: 기사 `full_content` 가 trim 후 100자 이상이면 L1 에 넣고 반환.
  3. URL 별 `asyncio.Lock` 으로 같은 URL 동시 스크랩을 하나로 묶는다(락 획득 후 L1 재확인).
  4. `fetch_and_parse`: User-Agent `AgentLens/2.4 (+https://agentlens.dev; AI Research Bot)`, `Accept-Language: ko,en-US,en;q=0.9`, timeout 5.0초, 리다이렉트 허용. 타임아웃 → `ScrapeTimeoutException`, 그 밖의 네트워크 오류 → `ScrapeBlockedException`. 401/403/429/503 → `ScrapeBlockedException`("Access denied"), 그 외 비 200 → `ScrapeBlockedException`("Unexpected HTTP").
  5. 추출: trafilatura(`include_links`, `include_formatting`, `favor_precision`) → 결과가 500자 미만이면 readability-lxml + BeautifulSoup(script/style/nav/footer/iframe 제거, 줄바꿈 텍스트) → 그래도 500자 미만이면 `ScrapeEmptyContentException`.
  6. 성공 시 세션이 있으면 `full_content`, `scraped_at` 을 DB 에 갱신·커밋(실패는 debug 로그만), 객체에도 반영, L1 저장.
- 출력: 본문 텍스트.
- 예외·엣지: 예외는 호출자(챗)로 전파된다. URL 락 dict 는 지우지 않는다. 설정 `SCRAPER_TIMEOUT_SECONDS`(`scraper.timeout_seconds`, 기본 5.0)는 읽지 않고 5.0 이 코드에 고정되어 있다.
- 관련 코드: `backend/app/services/scraper.py:13-174`, `backend/app/services/chat_service.py:82,499,626`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| `QUALITY_CUTOFF_SCORE` | `config.json` 5.0 (키 없으면 5.0) | `config.json` `llm.quality_cutoff_score`, `backend/app/config.py:64` | 저장 최소 품질 점수 |
| `HIGH_SIGNAL_THRESHOLD` | `config.json` 7.0 (키 없으면 7.8, getattr 폴백 7.0) | `config.json` `llm.high_signal_threshold`, `backend/app/config.py:65`, `backend/app/services/llm_processor.py:529,622` | 하이시그널(Must-Read) 기준 |
| LLM 관련성 하한 | `relevance_score >= 5.0` | `backend/app/services/llm_processor.py:624` | LLM 경로 저장 조건 |
| 휴리스틱 폴백 관련성 | 7.0 | `backend/app/services/llm_processor.py:660` | 통과 시 기록값 |
| 혼합 소스 | `rss_kr`, `rss`, `hackernews`, `web` | `backend/app/services/llm_processor.py:481,560` | AI 사전 필터 대상 |
| 휴리스틱 기본 점수 | 혼합 5.0 / 그 외 6.0 | `backend/app/services/llm_processor.py:492` | |
| 고신호 가산 | 키워드당 0.5, 최대 2.5 | `backend/app/services/llm_processor.py:507` | |
| 소스 가산 | github/arxiv/huggingface +1.0, rss(_kr)+AI +0.5 | `backend/app/services/llm_processor.py:510-513` | |
| 스팸 감점 / 짧은 제목 감점 | −3.5 / 제목 10자 미만 −2.0 | `backend/app/services/llm_processor.py:520-525` | |
| 카테고리 가중치 | harness 1.3, mcp 1.2, agent_tech 1.1 | `backend/app/collectors/categorizer.py:109-111` | |
| 키워드 가중치 | 제목 3.5 / 본문 1.5 | `backend/app/collectors/categorizer.py:100,104` | |
| hotness 식 | `min(100, (raw + c×2.5 + 5)/(h+2)^1.3 × 8)` | `backend/app/collectors/categorizer.py:144-147` | |
| 크론: 수집 | UTC 0,6,12,18시 0분 | `backend/app/scheduler.py:39` | 코드 고정 |
| 크론: 딥 리서치 | UTC 3,15시 | `backend/app/scheduler.py:47` | |
| 크론: 브리핑 발송 | UTC 0시 15분 | `backend/app/scheduler.py:55` | |
| 수집기 timeout | RSS 클라이언트 8.0 / 피드 6.0, HN·GitHub·HF·Reddit 10.0, arXiv 12.0 | 각 수집기 | 초 |
| 수집기 건수 | RSS 피드당 8, HN 쿼리당 12, GitHub 쿼리당 8, arXiv 쿼리당 8, HF 12, Reddit 서브레딧당 12 | 각 수집기 | 1회 실행 상한 |
| RSS 동시 요청 | 6 | `backend/app/collectors/sources/rss.py:29` | Semaphore |
| 소스별 기본 raw_score | RSS KR 180 / 글로벌 150, arXiv 120, HF 댓글+40, GitHub 보충 stars_hint 기본 5000 | 각 수집기 | 인기도 입력 |
| 요약 자르기 | RSS 320, arXiv 350, HF 300, Reddit 300 | 각 수집기 | 문자 수 |
| GitHub 보충 조건 | 검색 결과 < 5 | `backend/app/collectors/sources/github.py:51` | |
| 크롤 로그 source | `all_sources_stream_ingestion` | `backend/app/collectors/manager.py:226` | |
| 진행 폴링 / 상태 폴링 | 1200ms / 30000ms | `frontend/src/components/Header.tsx:47,80` | |
| Anthropic 기본 모델 | `claude-sonnet-5-5` | `config.json`, `backend/app/services/llm_providers/anthropic_provider.py:29-48` | 기본 챗 모델 = 게이트 모델 |
| Anthropic timeout / max_tokens | 45초(스트림 120초) / 4096 | `backend/app/services/llm_providers/anthropic_provider.py:212-233,250-279` | |
| OpenAI 모델 / timeout | `gpt-4o-mini` / 60초 | `backend/app/services/llm_processor.py:189-203` | |
| Ollama 주소 / 모델 / timeout | `http://localhost:11434` / `llama3.2:latest` / 90초 | `backend/app/config.py:61-62`, `backend/app/services/llm_processor.py:212-227` | |
| Gemini 모델 / timeout | `gemini-3.5-flash-lite` / 20초 | `backend/app/config.py:58`, `backend/app/services/llm_processor.py:141-154` | 명시 요청 시만 |
| Ollama 가용성 확인 | 동기 1초 | `backend/app/services/llm_processor.py:270` | |
| 스크래퍼 | timeout 5.0초, 최소 본문 500자, L2 재사용 100자, L1 500개 | `backend/app/services/scraper.py:36,74,106,121,141` | |

## 알려진 불일치·위험
- 스케줄 설정 무시: 크론이 `"0,6,12,18"`·UTC 로 고정되어 `config.json` `scheduler.crawl_hours`/`timezone` 을 바꿔도 실제 실행 시각은 그대로이고, 상태 API 의 `schedule_hours`·`timezone`·폴백 `next_run` 만 바뀐다. `scheduler.enabled`, `auto_briefing_hour`, `briefing.auto_dispatch_hour` 를 읽는 코드가 없다 (`backend/app/scheduler.py:9,39,55`, `backend/app/config.py:43-44`).
- 쓰이지 않는 설정: `LLM_PROVIDER`(`llm.provider`), `USER_AGENT`(`crawler.user_agent`), `crawler.request_timeout_seconds`, `crawler.max_concurrent_requests`, `crawler.items_per_source_limit`, `SCRAPER_TIMEOUT_SECONDS` 는 읽는 곳이 없다. 수집기 timeout·건수·User-Agent 는 코드에 고정되어 있다.
- 하이시그널 임계값 4곳 불일치: `config.json` 7.0, `config.py` 키 없을 때 기본 7.8, `llm_processor` getattr 폴백 7.0, Anthropic 시스템 프롬프트 문구 7.8, 프론트 목 7.8 (`backend/app/config.py:65`, `backend/app/services/llm_processor.py:529`, `backend/app/services/llm_providers/anthropic_provider.py:372-`, `frontend/src/mocks/handlers.ts`).
- 수집용 모델 미사용: `ANTHROPIC_COLLECTION_MODEL` 과 `generate_structured_summary`(LLM 기반 TL;DR·기술 스택 생성)는 파이프라인에서 호출되지 않는다. 게이트는 기본 챗 모델을 쓰고, TL;DR·기술 스택은 규칙 기반이다 (`backend/app/services/llm_providers/anthropic_provider.py:321-369`, `backend/app/services/llm_processor.py:610,672-715`). 화면 문구("LLM으로 선별하고 3줄 핵심 요약과 개발자 시사점을 추출")와 달리 3줄 요약은 LLM 이 만들지 않는다 (`frontend/src/app/page.tsx:150`).
- `category_hint` 미사용: 소스 설정마다 `category_hint` 가 있지만 RSS 수집기가 항목에 넣지 않고, `evaluate_content_with_llm` 도 인자를 쓰지 않는다 (`backend/app/collectors/sources/rss.py:68-77`, `backend/app/services/llm_processor.py:543-549`).
- 평가 캐시 무기한: `_eval_cache` 는 크기·만료가 없고 초기화 API 도 비우지 않는다. 한 번 거부된 제목+소스는 프로세스 재시작 전까지 다시 평가되지 않는다 (`backend/app/services/llm_processor.py:118,556-558`).
- 이벤트 루프 블로킹: `has_live_provider()` 가 키가 없을 때 동기 `httpx.Client` 로 Ollama 를 1초 timeout 호출한다. 수집 게이트는 기사마다(캐시 미스 시) 이를 호출한다 (`backend/app/services/llm_processor.py:267-275,580`).
- 락 안 LLM 호출: 배치 저장 락 안에서 기사별 LLM 평가가 순차로 일어나 6개 소스를 동시에 가져와도 평가·저장은 직렬이다 (`backend/app/collectors/manager.py:77-99`).
- 진행 상태 부정확: 6개 워커가 동시에 시작해 `current_source`/`step_message` 를 덮어쓴다 (`backend/app/collectors/manager.py:203-209`). 크롤 로그는 항상 `status="success"` 이고 소스별 오류는 메모리 `last_crawl_stats` 에만 남아 API 로 볼 수 없다 (`backend/app/collectors/manager.py:224-242`).
- 배치 전체 롤백: 한 항목에서 예외(예: 수집기 항목의 `title` 값이 None 이면 `.strip()` 에서 AttributeError)가 나면 그 소스 배치 전체가 롤백되어 0건이 된다 (`backend/app/collectors/manager.py:81,171-174`).
- LLM 점수 범위 미보정: LLM 경로의 `quality_score` 는 1~10 으로 자르지 않는다 (`backend/app/services/llm_processor.py:620,628`). 휴리스틱 경로만 1.0~10.0 으로 자른다.
- 시작 지연: DB 가 비어 있으면 lifespan 에서 수집을 await 하므로 수집이 끝날 때까지 API 가 뜨지 않는다 (`backend/app/main.py:18-22`).
- MCP 프로세스 상태 분리: MCP `trigger_agentlens_crawl` 은 별도 프로세스의 `collector_manager` 로 실행되어 API 서버의 중복 실행 방지가 통하지 않는다 (`backend/app/mcp/server.py:43-47`).
- 테스트 격리 부재: 수집 게이트·Ask AI 는 `is_test_environment()` 를 보지 않아 pytest 중에도 키가 있으면 실제 LLM 을 호출한다. `conftest.py` 는 `TESTING` 을 설정하지 않는다 (`backend/app/services/llm_processor.py:229-240,580`, `backend/tests/conftest.py`).
- Gemini 정책 흔적: 코드 주석은 Gemini 스트리밍이 폐기됐다고 하지만 `generate_live_answer`/`stream_tokens` 는 모델명에 `gemini` 가 있으면 여전히 Gemini 를 호출한다. 반면 `resolve_model_and_tier` 는 Anthropic 경로에서 gemini 이름을 기본 모델로 바꾼다 (`backend/app/services/llm_processor.py:295-301,365-372,399`, `backend/app/services/llm_providers/anthropic_provider.py:98-103`).
- 시드 시각 고정: `SEED_ITEMS` 의 `published_at` 이 모듈 import 시각이라 서버가 오래 떠 있으면 시드의 hotness 가 낮게 계산된다 (`backend/app/collectors/manager.py:29,39`).
- 인증 없음: `POST /api/schedule/trigger`, `POST /api/schedule/reset-and-collect` 는 누구나 호출할 수 있다.
- `sources.json` 2벌: 저장소 루트와 `backend/app/config/sources.json` 이 함께 있고, 탐색 순서상 cwd 에 따라 다른 파일을 읽을 수 있다. 저장 시에는 두 번째 위치에도 복사한다 (`backend/app/services/sources_service.py:11-24,101-122`).
