# 기능명세: 소스 관리와 딥 리서치

Updated: 2026-11-09

## 개요
수집기가 어디서 기사를 가져올지는 `sources.json` 한 파일이 정한다 (RSS/Atom 피드 목록, GitHub 검색어와 모니터링 저장소, Reddit·HackerNews·arXiv·Hugging Face 설정). 사용자는 헤더 더보기 메뉴의 "소스 & 리서처"(또는 ⌘K 커맨드 팔레트)로 소스 관리 대화상자를 열어 RSS 피드를 보고, 추가하고, 켜고 끄고, 지운다. 같은 대화상자의 "AI 딥 리서처" 탭에서 자율 딥 리서치를 바로 돌리고, 판정 감사 일지(`source_research_logs`)를 보며, URL 하나를 넣어 피드를 감지해 볼 수 있다. 딥 리서치는 매일 03:00, 15:00 UTC 에도 자동으로 돌며, 규칙 기반 점수가 8.2 이상인 피드를 `sources.json` 에 자동으로 넣는다. 이 영역에는 LLM 호출이 없다 (점수는 키워드 규칙으로 낸다).

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| SRC-01 | sources.json 구조와 저장 | 파일 위치 탐색, 구버전 형식 정규화, 원자적 저장과 사본 동기화, 수집기 반영 | `backend/app/services/sources_service.py` |
| SRC-02 | 소스 관리 대화상자 | 두 탭(AI 딥 리서처, 등록된 수집원) 과 공통 결과 안내 | 헤더 더보기 "소스 & 리서처", ⌘K "소스 관리 & AI 리서처 열기" → `SourcesModal` |
| SRC-03 | 소스 목록 조회 | 전체 소스와 활성 개수 통계를 돌려준다 | "등록된 수집원" 탭, `GET /api/sources` |
| SRC-04 | RSS 피드 추가 | 이름·URL·카테고리·국가·설명으로 피드를 등록한다. 같은 URL 이면 갱신한다 | "새 피드 직접 등록" 폼, `POST /api/sources/rss` |
| SRC-05 | GitHub 저장소 추가 | 모니터링 저장소를 등록한다 (화면 없음) | `POST /api/sources/github` |
| SRC-06 | 소스 켜기/끄기 | 피드·저장소·소스 유형 전체의 `enabled` 를 뒤집는다 | 목록의 수집 스위치, `PATCH /api/sources/{type}/{id}/toggle` |
| SRC-07 | 소스 삭제 | RSS 피드나 GitHub 저장소를 지운다 | 피드 삭제 버튼 → 확인 대화상자, `DELETE /api/sources/{type}/{id}` |
| SRC-08 | 단일 URL 검사 | URL 에서 RSS/Atom 피드를 찾아 최근 글과 점수를 보여 준다. 등록하지 않는다 | "단일 URL 수동 프로빙", `POST /api/research/inspect-url` |
| SRC-09 | 카탈로그 후보 탐색 | 내장 카탈로그 13개에서 키워드·카테고리로 후보를 고른다 (화면 없음) | `POST /api/research/discover` |
| SRC-10 | 후보 등록 | 후보를 RSS 피드로 등록한다 (화면 없음) | `POST /api/research/register-candidate` |
| SRC-11 | 자율 딥 리서치 실행 | 시드·인용 도메인을 후보로 피드를 실증·평가해 자동 채택하고 감사 로그를 남긴다 | "자율 딥 리서치 지금 실행", `POST /api/research/run-deep`, 스케줄 03:00·15:00 UTC |
| SRC-12 | 후보 평가·판정 규칙 | 점수와 판정(AUTO_ADOPTED / WATCHLIST / REJECTED / ALREADY_MONITORED) | `AutonomousDeepResearcher.evaluate_and_decide` |
| SRC-13 | 딥 리서치 상태 조회 | 실행 중 여부, 마지막 실행, 누적 채택 수 | 딥 리서치 탭 지표, `GET /api/research/status` |
| SRC-14 | 감사 일지 | `source_research_logs` 최근 기록과 판정 사유 | 딥 리서치 탭 "자율 리서치 판정 감사 일지", `GET /api/research/audit-logs` |

## SRC-01 sources.json 구조와 저장
- 진입점: `SourcesService` 싱글턴 `sources_service`. API·딥 리서치·수집기가 모두 이것을 거친다.
- 입력: 파일 `sources.json`.
- 처리 규칙:
  1. 파일 위치(`find_sources_file`): `cwd/sources.json`, `cwd 의 부모/sources.json`, 저장소 루트 `sources.json`, `backend/app/config/sources.json` 순으로 처음 존재하는 파일을 쓴다. 하나도 없으면 `backend/app/config/sources.json` 경로를 쓰고 그 폴더를 만든다. 위치는 서비스 생성 때 정하고, 그 파일이 사라졌을 때만 다시 찾는다.
  2. 현재 저장소에는 루트 `sources.json` 과 `backend/app/config/sources.json` 이 있고 내용이 같다. Docker 에서는 `./sources.json` 을 `/app/sources.json` 에 읽기·쓰기(`:rw`)로 마운트하고 cwd 가 `/app` 이라 그 파일을 쓴다.
  3. 최상위 구조:
     - `version`(문자열), `updated_at`(UTC ISO 8601, 저장할 때마다 갱신).
     - `rss_feeds[]`: `id`, `name`, `url`, `site_url`, `category_hint`(`harness` / `mcp_plugins_skills` / `agent_tech` / `ai_news`), `country`(`KR` / `GLOBAL`), `enabled`, `description`, API 로 추가한 항목은 `added_at`.
     - `github_sources`: `enabled`, `search_queries[]`, `monitored_repos[]`(`repo`, `category`, `enabled`, `description`, `stars_hint`, 추가 시 `added_at`).
     - `reddit_sources`: `enabled`, `subreddits[]`, `keywords[]`.
     - `hackernews_sources`: `enabled`, `queries[]`.
     - `arxiv_sources`: `enabled`, `queries[]`.
     - `huggingface_sources`: `enabled`.
  4. 현재 파일 내용: RSS 17개(모두 켜짐, KR 5개·GLOBAL 12개), GitHub 검색어 5개·모니터링 저장소 8개, Reddit 서브레딧 4개·키워드 7개, HackerNews 검색어 6개, arXiv 검색어 3개, Hugging Face 켜짐.
  5. 정규화(`_normalize_sources`, 읽을 때마다): `rss_feeds` 가 없으면 구버전 키 `korean_sources`, `harness_and_mcp_releases`, `global_research_and_blogs` 의 항목을 모아 `rss_feeds` 로 바꾼다 (`id` 는 이름 소문자에서 영숫자·밑줄이 아닌 글자를 `_` 로). 빠진 소스 유형 섹션은 기본값(예: Reddit `LocalLLaMA, MachineLearning` / `agent, harness, mcp`, HackerNews `AI agent, Model Context Protocol`, arXiv `all:"agent harness"`)으로 채운다. 정규화 결과는 파일에 쓰지 않는다.
  6. 읽기 실패(JSON 오류 등)나 파일 없음: 로그를 남기고 내장 기본값(GeekNews 피드 1개, GitHub `topic:mcp-server`, Reddit `LocalLLaMA`, HackerNews `AI agent`, arXiv, Hugging Face)을 돌려준다. 이것도 파일에 쓰지 않는다.
  7. 저장(`save_sources`): `updated_at` 을 갱신하고, 같은 폴더의 `.tmp` 파일에 쓴 뒤 `replace` 로 바꿔 끼운다. 교체가 `OSError` 면(Docker 의 단일 파일 bind mount 위 rename 은 `EBUSY`) 경고 로그를 남기고 대상 파일에 제자리로 쓴 뒤 `.tmp` 를 지운다. 그다음 쓴 파일이 `backend/app/config/sources.json` 이 아니면 그 경로에도 같은 내용을 덮어쓴다 (실패는 무시). 잠금은 없다.
  8. 수집기 반영: 수집할 때마다 파일을 다시 읽으므로 변경은 다음 수집부터 반영된다.
     - RSS: `enabled` 인 피드만 쓴다. 활성 피드가 하나도 없으면 코드에 내장된 5개 피드로 대신한다. `country == "KR"` 이면 source 라벨 `rss_kr`, 아니면 `rss`. `category_hint` 는 수집기가 읽지 않는다.
     - GitHub: 섹션이 꺼져 있으면 건너뛴다. 검색어로 먼저 찾고, 결과가 5건 미만일 때만 켜진 모니터링 저장소를 항목으로 덧붙인다.
     - Reddit·HackerNews·arXiv·Hugging Face: 섹션의 `enabled` 와 목록을 읽는다.
- 출력: 딕셔너리.
- 예외·엣지: 저장 실패 시 로그를 남기고 `False` 를 돌려주지만, 호출하는 쪽(`add_*`, `toggle_source`, `delete_source`)은 반환값을 확인하지 않는다.
- 관련 코드: `backend/app/services/sources_service.py:11-24`, `:36-45`, `:47-77`, `:79-100`, `:102-132`, `:137-167`, `backend/app/collectors/sources/rss.py:12-22`, `:65`, `backend/app/collectors/sources/github.py:10-15`, `:50-73`, `docker-compose.yml:39`, `sources.json`

## SRC-02 소스 관리 대화상자
- 진입점: 헤더 더보기 메뉴 "소스 & 리서처"(모든 폭), 커맨드 팔레트(⌘K) 항목 "소스 관리 & AI 리서처 열기". 대화상자 제목 "소스 & 리서처"(`Dialog size="xl"`: 768px 이상 너비 896px, 768px 미만 전체 화면). 닫기: 닫기 버튼, 바닥 "닫기", Escape (Escape 는 오버레이 스택의 맨 위 레이어만 닫는다). 입력을 잃지 않도록 배경막 클릭으로는 닫히지 않는다.
- 입력: 없음.
- 처리 규칙:
  1. 열릴 때 `GET /api/sources`, `GET /api/research/status`, `GET /api/research/audit-logs?limit=30` 을 동시에 부른다.
  2. 탭 두 개(`Tabs`, `aria-label="소스 관리 화면"`, 탭 줄은 본문 위에 붙어 있다). 탭의 `aria-controls` 는 그려진 패널(선택된 탭)에만 달고, 탭 줄은 넘치면 가로로 스크롤하는 공통 스크롤 줄이다. 기본 탭은 "AI 딥 리서처" 이고 누적 자동 채택 수가 0 보다 크면 `+N` 배지를 붙인다. 두 번째 탭 "등록된 수집원" 에는 활성 RSS 수 배지를 붙인다.
  3. 결과 안내: 성공·실패 메시지를 탭 아래 `aria-live="polite"` 영역에 3500ms 동안 보여 준다.
  4. 켜기/끄기·삭제·추가·딥 리서치 기동·URL 감지 성공 뒤 데이터를 다시 불러오고, 페이지의 `onSourcesUpdated`(뉴스 목록·통계·브리핑 재조회)를 부른다.
  5. 바닥 문구: "수집 대상의 기준 파일: sources.json".
- 출력: 대화상자 화면.
- 예외·엣지: 세 요청 중 하나라도 실패하면 "데이터를 불러오지 못했습니다." 를 보여 주고 이전 데이터를 유지한다 (이 메시지는 자동으로 사라지지 않는다).
- 관련 코드: `frontend/src/components/SourcesModal.tsx:49-249`, `frontend/src/components/Header.tsx:86`, `frontend/src/components/CommandPalette.tsx:98-104`, `frontend/src/app/page.tsx:293-300`

## SRC-03 소스 목록 조회
- 진입점: "등록된 수집원" 탭, `GET /api/sources`.
- 입력: 없음.
- 처리 규칙:
  1. 정규화된 전체 소스를 읽는다.
  2. 통계: `total_rss`, `active_rss`(`enabled` 가 없거나 참인 피드), `total_github_repos`, `active_github_repos`, 그리고 `github_search_enabled`, `reddit_enabled`, `hackernews_enabled`, `arxiv_enabled`, `huggingface_enabled`(각 섹션의 `enabled`, 기본 true).
  3. 화면 지표 카드(768px 미만 2열, 이상 4열): "활성 RSS 피드 N / 전체", "모니터링 GitHub N / 전체", "커뮤니티 수집 Reddit · HN · arXiv"(설정과 상관없이 고정 문구, 초록 점), "관리 파일 위치 sources.json"(마우스를 올리면 실제 경로).
  4. "등록된 RSS 피드 목록": 768px 이상은 표(열: 이름, URL, 카테고리, 상태, 작업), 768px 미만은 같은 행을 세로 카드로 그린다. 행마다 이름, 국가 배지(없으면 GLOBAL), 설명(있으면 한 줄), URL, 카테고리 라벨 배지(`lib/labels.ts`), 수집 스위치(SRC-06), 삭제 버튼(SRC-07). 파일에 적힌 순서대로 그린다.
  5. "지속 모니터링 GitHub 저장소" 카드(768px 이상 2열): 저장소명, 별 배지 `stars_hint`(없으면 0), 설명, 수집 스위치. 삭제 버튼은 없다.
  6. Reddit·HackerNews·arXiv·Hugging Face 섹션과 GitHub 검색어는 화면에 나오지 않고, 섹션 전체 켜기/끄기 버튼도 없다.
- 출력: `{"status": "success", "sources_file": "<절대 경로>", "updated_at", "stats": {...}, "data": <정규화된 sources.json>}`.
- 예외·엣지: 프론트 요청 실패는 SRC-02 의 오류 메시지로 처리한다.
- 관련 코드: `backend/app/api/sources.py:22-47`, `frontend/src/components/sources/SourcesListTab.tsx:84-110`, `:185-283`, `frontend/src/lib/api.ts:270-329`, `:360-365`

## SRC-04 RSS 피드 추가
- 진입점: "등록된 수집원" 탭의 "새 피드 직접 등록" 버튼(`aria-expanded`. `aria-controls="sources-add-form"` 는 폼이 열려 있을 때만 단다) → 폼 "신규 RSS/Atom 피드 등록"(입력 "소스 이름"·"RSS/Atom URL" 필수, 선택 상자 "카테고리 분류"·"국가/지역", "소스 설명 (선택)") → "저장하기"("취소" 로 폼을 닫는다). `POST /api/sources/rss` (프론트 타임아웃 8000ms).
- 입력:
  - 화면: 소스 이름(필수), RSS/Atom URL(필수, `type=url`), 카테고리(값 harness / mcp_plugins_skills / agent_tech / ai_news, 기본 ai_news. 선택지 글자는 `lib/labels.ts` 의 긴 라벨 `하네스 & 벤치마크` / `MCP & 생태계` / `에이전트 아키텍처` / `최신 AI 동향` 으로 피드 필터 칩과 같다), 국가(GLOBAL / KR, 기본 GLOBAL), 설명(선택). 이름·URL 은 앞뒤 공백을 지워 보낸다. `site_url` 은 보내지 않는다.
  - API `AddRssRequest`: `name`(필수), `url`(필수), `site_url`(기본 ""), `category_hint`(기본 "ai_news"), `country`(기본 "GLOBAL"), `description`(기본 "").
- 처리 규칙:
  1. 이름이나 URL 이 빈 문자열이면 400 "Name and URL are required".
  2. 빈 값 보정: `site_url` 이 비면 `url`, `category_hint` 가 비면 `ai_news`, `country` 가 비면 `GLOBAL`.
  3. 중복 판정: 기존 피드 중 끝의 `/` 를 뗀 URL 이 같은 것이 있으면 새로 만들지 않고 그 피드를 `enabled = true` 로 켜고 `name`, `category_hint` 를 새 값으로 바꾼 뒤 저장한다. `country`, `description`, `site_url` 은 바꾸지 않는다.
  4. 새 피드 `id`: 이름 소문자에서 영숫자·밑줄이 아닌 글자를 모두 `_` 로 바꾼 값. 이름이 비면 `feed_{현재 epoch 초}`. `id` 중복은 검사하지 않는다.
  5. 새 피드는 `enabled: true`, `added_at` 을 붙여 목록 끝에 넣고 저장한다.
  6. URL 형식, 실제 피드 여부, 카테고리·국가 값의 허용 범위는 서버에서 검사하지 않는다.
  7. 화면: 성공하면 서버 메시지(`'{name}' 등록 완료`)로 결과 안내를 띄우고 이름·URL·설명 입력을 비우고(카테고리·국가는 유지) 폼을 닫은 뒤 목록을 다시 불러온다.
- 출력: `{"status": "success", "message": "'{name}' 등록 완료", "source": <생성 또는 갱신된 피드>}`. 기존 피드를 갱신한 경우에도 같은 메시지다.
- 예외·엣지: 실패하면 서버 `detail`(없으면 "피드 추가에 실패했습니다.")을 결과 안내로 보여 준다. 한글만으로 된 이름은 `id` 가 밑줄만 남는다 (예: 한글 4글자 → `____`).
- 관련 코드: `backend/app/api/sources.py:8-14`, `:49-62`, `backend/app/services/sources_service.py:195-220`, `frontend/src/components/sources/SourcesListTab.tsx:23-29`, `:56-82`, `:112-183`, `frontend/src/lib/labels.ts:8-13,44-46`, `frontend/src/lib/api.ts:376-395`

## SRC-05 GitHub 저장소 추가
- 진입점: `POST /api/sources/github`. 이 API 를 부르는 프론트 코드는 없다.
- 입력: `AddGitHubRepoRequest` — `repo`(필수, `owner/repo` 형식을 기대), `category`(기본 "agent_tech"), `description`(기본 ""), `stars_hint`(기본 0).
- 처리 규칙:
  1. `repo` 가 비면 400 "Repository is required".
  2. `github_sources` 섹션이 없으면 만든다.
  3. 대소문자를 무시하고 같은 `repo` 가 있으면 `enabled = true`, `category` 를 새 값으로 바꿔 저장하고 그 항목을 돌려준다.
  4. 없으면 `repo`, `category`, `enabled: true`, `description`, `stars_hint`, `added_at` 으로 추가한다.
  5. `owner/repo` 형식이나 저장소 존재 여부는 검사하지 않는다.
- 출력: `{"status": "success", "message": "'{repo}' 등록 완료", "repo": <항목>}`.
- 예외·엣지: 저장된 저장소는 수집기에서 검색 결과가 5건 미만일 때만 쓰인다 (SRC-01 8번).
- 관련 코드: `backend/app/api/sources.py:16-20`, `:64-75`, `backend/app/services/sources_service.py:222-243`

## SRC-06 소스 켜기/끄기
- 진입점: RSS 피드 행과 GitHub 카드의 수집 스위치(`Switch`, `role="switch"`, `aria-checked`, 접근 이름 "{이름} 수집 켜기", 768px 미만 44px) → `PATCH /api/sources/{source_type}/{item_id}/toggle`. 프론트는 `item_id` 를 `encodeURIComponent` 로 인코딩한다.
- 입력: 경로 `source_type`, `item_id`. 화면은 RSS 에 `rss` 와 `feed.id`(없으면 `feed.url`), GitHub 에 `github_repo` 와 `repo` 를 보낸다.
- 처리 규칙:
  1. `rss`: `id` 또는 `url` 이 `item_id` 와 같은 첫 피드의 `enabled` 를 뒤집는다 (값이 없으면 true 로 보고 false 로).
  2. `github_repo`: `repo` 가 정확히 같은(대소문자 구분) 첫 저장소의 `enabled` 를 뒤집는다.
  3. `github`, `reddit`, `hackernews`, `arxiv`, `huggingface`: `{type}_sources` 섹션 전체의 `enabled` 를 뒤집는다. `item_id` 값은 무엇이든 상관없지만 경로에는 있어야 한다. 화면에서 부르는 곳은 없다.
  4. 바뀐 것이 있으면 저장한다.
- 출력: `{"status": "success", "message": "소스 상태가 변경되었습니다 ({type} / {id})"}`. 화면은 "수집 상태가 변경되었습니다." 결과 안내를 띄우고 다시 불러온다. 스위치는 다시 불러온 값으로 바뀐다.
- 예외·엣지: 대상이 없거나 유형이 다르면 404 "Source not found or invalid type". 화면은 "상태 변경에 실패했습니다." 를 보여 준다.
- 관련 코드: `backend/app/api/sources.py:77-83`, `backend/app/services/sources_service.py:169-193`, `frontend/src/components/SourcesModal.tsx:105-114`, `frontend/src/components/sources/SourcesListTab.tsx:231-238`, `:274-279`, `frontend/src/components/ui/Switch.tsx`, `frontend/src/lib/api.ts:367-374`

## SRC-07 소스 삭제
- 진입점: RSS 피드 행의 삭제 버튼(휴지통 아이콘, 접근 이름 "{이름} 삭제") → 확인 대화상자(`ConfirmDialog` 위험 톤, `role="alertdialog"`, 제목 "이 소스를 목록에서 삭제하시겠습니까?", 설명 "'{이름}' 을(를) 수집 목록에서 지웁니다.", 버튼 "취소"(처음 포커스) / "삭제", 768px 미만 바텀시트, 소스 대화상자 위에 쌓인다) → `DELETE /api/sources/{source_type}/{item_id}`.
- 입력: 경로 `source_type`(`rss` 또는 `github_repo`), `item_id`(RSS 는 `id` 또는 `url`, GitHub 는 `repo`).
- 처리 규칙:
  1. `rss`: `id` 가 같거나 `url` 이 같은 피드를 모두 지운다 (같은 `id` 가 여러 개면 모두 지워진다).
  2. `github_repo`: `repo` 가 정확히 같은 저장소를 모두 지운다. 화면에는 GitHub 삭제 버튼이 없다.
  3. 하나라도 지웠으면 저장한다.
- 출력: `{"status": "success", "message": "소스가 삭제되었습니다 ({type} / {id})"}`. 화면은 확인 창을 닫고 "소스가 삭제되었습니다." 결과 안내를 띄운다.
- 예외·엣지: 지운 것이 없거나 유형이 다르면 404 "Source not found or failed to delete". 화면은 확인 창 안 오류 알림 "소스 삭제에 실패했습니다." 를 보이고 창을 연 채 둔다. 요청 중에는 Escape·배경막·취소가 무시된다. 확인 창에서 취소하면 요청하지 않는다. 소스 유형 섹션 자체는 지울 수 없다.
- 관련 코드: `backend/app/api/sources.py:85-91`, `backend/app/services/sources_service.py:245-262`, `frontend/src/components/SourcesModal.tsx:116-143`, `:236-246`, `frontend/src/components/sources/SourcesListTab.tsx:239-246`, `frontend/src/lib/api.ts:397-404`

## SRC-08 단일 URL 검사
- 진입점: 딥 리서치 탭 하단 "단일 URL 수동 프로빙 (테스트용)" 의 입력란(라벨 "검증할 사이트 URL") + "검증" 버튼(입력이 비면 비활성, 요청 중 "분석 중...") → `POST /api/research/inspect-url`. 프론트 타임아웃 12000ms.
- 입력: `url`(필수). 화면은 앞뒤 공백을 지워 보낸다.
- 처리 규칙:
  1. URL 이 `http://` 나 `https://` 로 시작하지 않으면 앞에 `https://` 를 붙인다.
  2. GitHub: 호스트에 `github.com` 이 있고 경로 조각이 2개 이상이면 `https://github.com/{owner}/{repo}/releases.atom` 을 먼저 시험한다. 피드를 찾으면(`status == "found"`) `type: "atom"`, `source_kind: "github_releases"` 를 붙여 돌려주고, 못 찾으면 3번으로 넘어간다.
  3. URL 을 GET 한다 (타임아웃 10.0초, 리다이렉트 따라감, User-Agent `Mozilla/5.0 (compatible; AgentLens-Researcher/2.0; …)`). 200 이 아니면 오류.
  4. 응답 `content-type` 에 `xml`/`rss`/`atom` 이 있거나 본문 앞 300자에 `<rss` 또는 `<feed` 가 있으면 그 URL 자체를 피드로 본다.
  5. HTML 이면 `<link>` 중 `rel` 에 `alternate` 또는 `feed` 가 있고 `type` 에 `rss`/`atom`/`xml` 이 있는 것의 `href` 를 절대 URL 로 모은다.
  6. 그런 링크가 없으면 `/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/feed.xml`, `/index.xml` 을 순서대로 HEAD 요청(각 4.0초)해 처음 200 인 것을 쓴다.
  7. 찾은 첫 피드를 받아(타임아웃 8.0초) feedparser 로 파싱한다. 항목이 없으면 `empty`.
  8. 피드 제목(없으면 HTML `<title>` 또는 호스트명, 그것도 없으면 "발굴된 소스"), 설명(`description` 또는 `subtitle`), 링크를 읽고, 최근 4개 글의 `title`, `link`, `published`(없으면 `updated`), `snippet`(HTML 태그 제거 200자)을 만든다.
  9. 피드 제목과 `제목 + 설명 + 글 제목·스니펫` 으로 `classify_and_tag` 를 돌려 카테고리를 정하고, `llm_processor.evaluate_quality_and_signal(..., "rss")` 로 점수를 낸다 (SRC-12 의 기본 점수 규칙. 딥 리서치의 기술 깊이 가산은 하지 않는다).
  10. 끝의 `/` 를 뗀 피드 URL 이 `rss_feeds` 에 있으면 `already_registered: true`.
  11. 결과를 등록하지 않는다. 화면은 성공 시 결과 안내 "RSS 피드를 성공적으로 감지했습니다: {feed_url}" 와 성공 알림 "발견: {이름} ({feed_url}) · 점수: {점수}점" 을 보여 주고, 실패 시 결과 안내와 오류 알림에 `message`(없으면 "RSS 피드를 찾을 수 없습니다.")를 보여 준다. 성공 후 대화상자 데이터와 페이지 데이터를 다시 불러온다.
- 출력:
  - 성공: `{"status": "found", "name", "feed_url", "site_url", "description"(250자, 없으면 "실시간 최신 기술 피드"), "category_hint", "relevance_score", "is_high_signal", "recent_posts"[], "already_registered", "why_recommended": "최신 {CAT} 관련 {N}건의 활성 글 발행 확인 (신호 강도 {점수}점)"}` (+ GitHub 이면 `type`, `source_kind`).
  - 실패: `status` 가 `error`(접속 실패 "URL 접속 실패: …", "HTTP 응답 코드 오류 ({코드})", "피드 다운로드 실패: …", "피드 응답 오류 ({코드})"), `not_found`("해당 페이지에서 RSS 또는 Atom 피드를 자동으로 발견하지 못했습니다."), `empty`("피드는 유효하나 발행된 최신 기사가 없습니다."). 모두 HTTP 200 으로 돌려준다.
- 예외·엣지: 빈 `url` 은 400 "URL is required". 화면은 요청 자체가 실패하면 "URL 분석에 실패했습니다." 를 보여 준다.
- 관련 코드: `backend/app/api/research.py:8-9`, `:24-33`, `backend/app/services/source_researcher.py:179-268`, `:270-329`, `frontend/src/components/sources/DeepResearcherTab.tsx:76-95`, `:201-235`, `frontend/src/lib/api.ts:345-358`, `:406-415`

## SRC-09 카탈로그 후보 탐색
- 진입점: `POST /api/research/discover`. 프론트에 `discoverSources()` 함수는 있지만 부르는 화면이 없다.
- 입력: `DiscoverRequest` — `query`(기본 ""), `category`(기본 "", `harness` / `mcp_plugins_skills` / `agent_tech` / `ai_news`), `limit`(기본 8. 0 이나 `null` 이면 8).
- 처리 규칙:
  1. 대상은 코드에 내장된 `CURATED_ECOSYSTEM_CATALOG` 13개다 (Lilian Weng, Eugene Yan, Chip Huyen, Ahead of AI, Google DeepMind Blog, Microsoft Research AI, OpenHands·Aider·Cline·FastMCP 릴리즈, 당근마켓 테크 블로그, 우아한형제들 기술블로그, LINE Engineering Korea). 각 항목에 `feed_url`, `category_hint`, `country`, `description`, `tags`, `base_score`(8.7~9.6)가 고정되어 있다.
  2. `query` 가 있으면 소문자로 바꿔 이름·설명·카테고리·태그 중 하나에 부분 문자열로 들어 있는 항목만 남긴다.
  3. `category` 가 있으면 `category_hint` 가 정확히 같은 항목만 남긴다.
  4. 끝의 `/` 를 뗀 `feed_url` 이 `rss_feeds` 에 있으면 `already_registered: true`.
  5. 정렬: 미등록 항목 먼저, 그 안에서 `base_score` 내림차순. 앞에서 `limit` 개를 자른다.
  6. 네트워크 요청과 실시간 피드 확인은 하지 않는다.
- 출력: `{"query", "category", "total_found": <필터 후 전체 수>, "candidates": [{"id", "name", "site_url", "feed_url", "category_hint", "country", "description", "relevance_score": base_score, "tags", "already_registered", "why_recommended": "{CAT} 생태계 핵심 레퍼런스 소스 (기본 신호 점수 {점수}점)"}]}`.
- 예외·엣지: 맞는 항목이 없으면 `total_found: 0`, 빈 목록.
- 관련 코드: `backend/app/api/research.py:11-14`, `:35-46`, `backend/app/services/source_researcher.py:18-162`, `:331-383`, `frontend/src/lib/api.ts:331-343`, `:417-431`

## SRC-10 후보 등록
- 진입점: `POST /api/research/register-candidate`. 프론트에 `registerCandidate()` 함수는 있지만 부르는 화면이 없다.
- 입력: `RegisterCandidateRequest` — `name`(필수), `feed_url`(필수), `site_url`(기본 ""), `category_hint`(기본 "ai_news"), `country`(기본 "GLOBAL"), `description`(기본 "").
- 처리 규칙:
  1. `name` 이나 `feed_url` 이 비면 오류.
  2. SRC-04 의 `add_rss_source` 로 등록한다 (URL 중복이면 기존 피드를 켜고 이름·카테고리 갱신). `site_url` 이 빈 문자열이면 그대로 빈 값으로 넘긴다 (서비스 안에서 `url` 로 대체된다).
- 출력: `{"status": "success", "message": "'{name}' 소스가 성공적으로 스크래핑 대상에 등록되었습니다.", "source": <피드>}`.
- 예외·엣지: 필수값 누락은 400, `detail` "name과 feed_url은 필수입니다."
- 관련 코드: `backend/app/api/research.py:16-22`, `:48-57`, `backend/app/services/source_researcher.py:385-409`, `frontend/src/lib/api.ts:433-452`

## SRC-11 자율 딥 리서치 실행
- 진입점:
  - 화면: 딥 리서치 탭 "자율 딥 리서치 지금 실행" 버튼 → `triggerDeepResearch()` → `POST /api/research/run-deep?max_candidates=6`. 실행 중(`is_running`)이거나 요청 중이면 버튼이 진행 표시(비활성)와 "자율 탐색 가동 중..." 으로 바뀐다.
  - API: `POST /api/research/run-deep`, 쿼리 `max_candidates`(기본 6).
  - 스케줄: APScheduler job `deep_research`, `CronTrigger(hour="3,15", minute="0", timezone="UTC")`, `run_deep_research()` 를 기본값 `max_candidates=8` 로 부른다.
- 입력: `max_candidates`(정수, 범위 검사 없음).
- 처리 규칙:
  1. API: 이미 실행 중이면 `{"status": "already_running", "message": "Deep Research is already executing"}` 를 돌려준다. 아니면 `asyncio.create_task` 로 백그라운드 실행을 걸고 바로 `{"status": "started", "message": "자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.", "max_candidates": N}` 를 돌려준다.
  2. 화면: `already_running` 이면 실패 안내, `started` 면 성공 안내(서버 메시지)를 띄우고 3000ms 뒤 한 번만 대화상자 데이터와 페이지 데이터를 다시 불러온다. 요청이 실패하면 "자율 딥 리서치 트리거에 실패했습니다.".
  3. 실행 시작 시 `is_running = True`.
  4. 후보 풀 만들기 (1단계): 먼저 시드 `SEED_EXPLORATION_TARGETS` 14개를 정의 순서대로 넣는다 (Lilian Weng Tech Blog, Eugene Yan, Chip Huyen, Ahead of AI, Google DeepMind Research Blog, Microsoft Research AI, OpenHands·Aider·Cline·FastMCP GitHub, 당근 테크 블로그(medium 피드), 우아한형제들 기술블로그, vLLM Project Blog, Cursor Forum Announcements). 그 뒤에 인용 도메인 마이닝 결과를 붙인다.
  5. 인용 도메인 마이닝: `news_items` 를 `id` 내림차순으로 80건 읽어 `summary` 와 기사 `url` 에서 `https?://` URL 을 정규식으로 뽑는다. 호스트에 `DISALLOWED_DOMAINS`(twitter.com, x.com, facebook.com, instagram.com, youtube.com, linkedin.com, reddit.com, google.com, news.ycombinator.com, github.com/login, amazon.com) 중 하나가 부분 문자열로 들어 있으면 버리고, 점이 없는 호스트도 버린다. `scheme://host` 로 줄여 중복을 없애고 앞 15개를 쓴다. 마이닝 후보의 이름은 호스트명, 카테고리 힌트는 빈 값이다.
  6. 평가 대상: 풀의 앞에서 `max_candidates` 개만 자른다. 섞거나 우선순위를 다시 매기지 않는다.
  7. 후보마다 (2단계) 피드 실증 `probe_and_discover_feed`:
     - 호스트에 `github.com` 이 있고 경로 조각이 2개 이상이면 `releases.atom` 을 바로 받는다 (다른 경로로 대체하지 않는다).
     - 아니면 GET(타임아웃 8.0초, 리다이렉트 따라감, User-Agent `Mozilla/5.0 (compatible; AgentLens-DeepResearcher/2.0; …)`) → 200 이 아니면 오류 → 응답이 피드면 그대로 → HTML 이면 `<link rel=alternate|feed type=rss|atom|xml>` → 없으면 `/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/feed.xml`, `/index.xml` HEAD(각 3.0초) → 찾은 첫 피드를 받아(8.0초) 파싱. 피드를 못 찾으면 `no_feed`.
     - 파싱 결과: 피드 제목(없으면 HTML 제목·호스트, 그것도 없으면 "Unknown Source"), 설명 250자, 링크, 최근 4개 글(`title`, `link`, HTML 태그 제거한 요약 350자, `published`).
  8. 실증 실패(`status != "success"`): 판정 `REJECTED`, 점수 2.0, 사유 `기술 실증 실패: {메시지}`, 카테고리는 힌트(없으면 `ai_news`), `feed_url` 은 원래 URL.
  9. 실증 성공: SRC-12 로 평가·판정한다. 이름은 피드 제목으로 바꾼다.
  10. 자동 채택 (4단계): 판정 결과 `should_add` 가 참(=AUTO_ADOPTED)이면 `add_rss_source` 로 등록한다. `site_url` 은 피드 링크(없으면 원래 URL), 카테고리는 판정 카테고리, 국가는 원래 URL 에 `kr`, `daangn`, `woowahan` 중 하나라도 부분 문자열로 들어 있으면 `KR`, 아니면 `GLOBAL`, 설명은 피드 설명(없으면 "자율 딥 리서처에 의해 자동 발굴 및 채택된 소스"). 이번 실행 채택 수와 프로세스 누적 채택 수(`auto_adopted_count`)를 1씩 올린다.
  11. 감사 로그 (5단계): 후보마다 `SourceResearchLog` 를 세션에 추가한다 (`source_name`, `site_url` = 원래 후보 URL, `feed_url`, `category`, `relevance_score`, `verdict`, `verdict_reason`, `analyzed_articles_count` = 실증 성공 시 글 수 아니면 0, `created_at` UTC). 모든 후보를 처리한 뒤 한 번에 commit 한다.
  12. 끝나면 `last_run_time`, `last_run_summary`(`evaluated_total`, `auto_adopted`, `completed_at`, `results[]`: `source_name`, `site_url`, `feed_url`, `category`, `score`, `verdict`, `reason`)를 메모리에 두고 `is_running = False`.
- 출력: API 는 위 1번 응답. 실행 결과는 SRC-13·SRC-14 로 확인한다.
- 예외·엣지:
  - 후보를 직렬로 처리한다. 후보마다 네트워크 요청이 최대 수 회(GET, HEAD 최대 6회, 피드 GET) 일어난다.
  - `run_deep_research` 안에 try/finally 가 없어, 도중 예외(DB commit 실패, 평가 중 예외 등)가 나면 `is_running` 이 True 로 남아 이후 수동·자동 실행이 모두 `already_running` 으로 막힌다. 백그라운드 task 의 예외는 아무도 받지 않는다.
  - 상태(`is_running`, 누적 채택 수, 마지막 실행)는 프로세스 메모리에만 있어 재시작하면 사라진다.
  - 화면은 3000ms 뒤 한 번만 다시 불러오므로, 실행이 그보다 길면 결과를 보려면 "새로고침" 을 눌러야 한다.
- 관련 코드: `backend/app/api/research.py:77-92`, `backend/app/services/deep_researcher.py:21-126`(시드·차단 도메인), `:183-207`(마이닝), `:209-302`(실증), `:376-489`(루프), `backend/app/scheduler.py:15-18`, `:47-54`, `frontend/src/components/sources/DeepResearcherTab.tsx:56-74`, `:114-122`, `frontend/src/lib/api.ts:489-497`

## SRC-12 후보 평가·판정 규칙
- 진입점: SRC-11 9번에서 호출한다.
- 입력: 실증 결과(이름, 피드 URL, 사이트 URL, 설명, 최근 글 4개), 카테고리 힌트.
- 처리 규칙:
  1. 끝의 `/` 를 뗀 피드 URL 이 이미 `rss_feeds` 에 있으면 판정 `ALREADY_MONITORED`, 점수 9.0, 카테고리는 힌트(없으면 `ai_news`), 사유 `'{name}' 소스는 이미 sources.json에 등록되어 실시간 모니터링 중입니다.`, 채택 안 함. 여기서 끝난다.
  2. 평가 문서: `{이름} {설명}` 과 글마다 `- {제목}: {요약}` 줄.
  3. 카테고리: `classify_and_tag(이름, 평가 문서)` 결과. 카테고리 힌트가 있으면 힌트로 덮어쓴다.
  4. 기본 점수: `llm_processor.evaluate_quality_and_signal(이름, 평가 문서, "rss")`. 이름은 LLM 처럼 보이지만 키워드 규칙 함수다.
     - `rss` 는 혼합 소스로 취급한다. `is_strictly_ai_related` 정규식이 맞지 않으면 점수 1.0 으로 바로 끝난다.
     - 맞으면 5.0 에서 시작해, 고신호 키워드 목록(benchmark, swe-bench, protocol, architecture, evaluation, sandbox, multi-agent, reasoning, open-source, 하네스, 벤치마크, mcp, langgraph, fastmcp, agent, 에이전트, claude, anthropic, openai, deepseek, gemini 등 34개) 하나당 0.5, 최대 2.5 를 더한다.
     - AI 관련 `rss` 이므로 0.5 를 더한다.
     - 저신호 키워드(sale, discount, crypto price, airdrop, coupon, 광고, 특가, 할인, 해고 통보, 취업, 연봉, 부동산 등 16개) 하나당 3.5 를 뺀다.
     - 이름(제목 인자)이 10자 미만이면 2.0 을 뺀다.
     - 1.0~10.0 으로 자르고 소수 한 자리로 반올림한다. 이 규칙의 최댓값은 8.0 이다.
  5. 기술 깊이 가산: `harness, benchmark, swe-bench, eval, mcp, protocol, agent, reasoning, sandbox, docker` 10개 중 평가 문서(소문자)에 들어 있는 개수 × 0.3, 최대 1.8 을 더한다.
  6. 최종 점수를 1.0~9.9 로 자르고 소수 한 자리로 반올림한다.
  7. 판정:
     - 8.2 이상: `AUTO_ADOPTED`, 채택. 사유 "최신 기술 분석 글 {N}편 검증 결과, {CAT} 영역의 실전 엔지니어링 및 벤치마크 관련 고밀도 신호가 확인되어 수집 대상에 자율 채택했습니다. (품질 종합 점수: {점수}점)".
     - 6.5 이상 8.2 미만: `WATCHLIST`, 채택 안 함. 별도 워치리스트 저장소나 재평가 절차는 없고 감사 로그에만 남는다.
     - 6.5 미만: `REJECTED`.
- 출력: `{"verdict", "score", "category", "reason", "should_add"}`.
- 예외·엣지: 시드의 `tags`, `expected_depth` 값은 평가에 쓰지 않는다. 같은 피드라도 SRC-08 의 점수(4번만 적용)와 이 점수(4+5번)는 다르다.
- 관련 코드: `backend/app/services/deep_researcher.py:304-374`, `backend/app/services/llm_processor.py:516-580`, `backend/app/collectors/categorizer.py:78-81`, `:89`

## SRC-13 딥 리서치 상태 조회
- 진입점: 대화상자를 열 때와 새로고침 때 `GET /api/research/status`.
- 입력: 없음.
- 처리 규칙:
  1. 메모리 값을 그대로 돌려준다. `cadence` 는 고정 문자열 "Every 12 hours (03:00, 15:00 UTC) + On-demand".
  2. 화면 지표 4칸(768px 미만 2열, 이상 4열): "자동 채택된 소스 {auto_adopted_count}개 소스", "자동 채택 기준 품질 점수 ≥ 8.2점"(고정 문구), "최근 리서치 일시"(`last_run_time` 을 브라우저 로캘 시각만, 없으면 "최근 가동됨"), "정기 스케줄 매일 03:00, 15:00 UTC"(고정 문구). 지표 값은 말줄임 없이 어절 단위로 줄을 바꾼다 (좁은 폭에서 `매일 03:00,` / `15:00 UTC` 처럼 두 줄). 같은 줄 지표 카드의 높이는 같다.
- 출력: `{"is_running", "last_run_time"(ISO 또는 null), "auto_adopted_count", "last_run_summary", "cadence"}`.
- 예외·엣지: 재시작 직후에는 `auto_adopted_count` 0, `last_run_time` null 이며 화면은 "최근 가동됨" 이라고 표시한다.
- 관련 코드: `backend/app/api/research.py:62-65`, `backend/app/services/deep_researcher.py:147-154`, `frontend/src/components/sources/DeepResearcherTab.tsx:34-41`, `:125-141`, `frontend/src/lib/api.ts:454-480`

## SRC-14 감사 일지
- 진입점: 대화상자를 열 때 `GET /api/research/audit-logs?limit=30`, 딥 리서치 탭 "자율 리서치 판정 감사 일지" 의 "새로고침" 버튼.
- 입력: 쿼리 `limit`(기본 30, 범위 검사 없음).
- 처리 규칙:
  1. 테이블 `source_research_logs` 를 `created_at` 내림차순으로 `limit` 개 읽는다.
  2. 열: `id`(정수 PK), `source_name`(200), `site_url`(500), `feed_url`(500), `category`(50, 기본 `ai_news`), `relevance_score`(실수, 기본 0.0), `verdict`(30), `verdict_reason`(텍스트), `analyzed_articles_count`(정수, 기본 0), `created_at`(인덱스). 이 테이블에 쓰는 곳은 SRC-11 뿐이다.
  3. 화면: 기록이 없으면 "아직 기록된 딥 리서치 이력이 없습니다. …" 안내. 있으면 카드마다 이름, 판정 배지(AUTO_ADOPTED "자동 채택됨"(성공 톤), WATCHLIST "워치리스트 관찰"(경고 톤), REJECTED "기준 미달 기각"(위험 톤), ALREADY_MONITORED "기등록 모니터링"(강조 톤), 그 밖은 원문), 카테고리 라벨 배지(`lib/labels.ts`), `feed_url`, 점수(0 보다 크면 `{점수}점`, 아니면 `-`), 날짜(로캘 날짜만), "AI 판정 사유:" + 사유.
- 출력: `{"status": "success", "total": <돌려준 개수>, "logs": [...]}`. `created_at` 은 ISO 문자열 또는 null.
- 예외·엣지: 조회 예외는 로그를 남기고 빈 목록을 돌려준다 (HTTP 200).
- 관련 코드: `backend/app/api/research.py:67-75`, `backend/app/services/deep_researcher.py:156-181`, `backend/app/models/news.py:53-65`, `frontend/src/components/sources/DeepResearcherTab.tsx:27-32`, `:144-199`, `frontend/src/lib/api.ts:462-487`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| sources.json 탐색 순서 | cwd → cwd 부모 → 저장소 루트 → `backend/app/config/` | `backend/app/services/sources_service.py:11-24` | 사용할 파일 |
| 사본 동기화 경로 | `backend/app/config/sources.json` (`SourcesService._mirror_path` 기본값) | `sources_service.py:29, 120-128` | 저장 시 항상 함께 쓰는 사본 |
| 카테고리 값 | harness, mcp_plugins_skills, agent_tech, ai_news (화면 선택지 글자는 긴 라벨) | `backend/app/api/sources.py:12`, `SourcesListTab.tsx:24`, `frontend/src/lib/labels.ts:8-13` | `category_hint` 허용값(서버는 검사 안 함) |
| 국가 값 | KR, GLOBAL | `backend/app/api/sources.py:13`, `SourcesListTab.tsx:26-29` | `country` 허용값(서버는 검사 안 함) |
| `SEED_EXPLORATION_TARGETS` | 14개 | `backend/app/services/deep_researcher.py:21-120` | 딥 리서치 시드 |
| `DISALLOWED_DOMAINS` | 11개 | `deep_researcher.py:122-126` | 마이닝 제외 호스트(부분 문자열) |
| 마이닝 대상 기사 수 | 최근 80건 | `deep_researcher.py:189` | `id` 내림차순 |
| 마이닝 후보 상한 | 15 | `deep_researcher.py:207` | 인용 도메인 최대 수 |
| `max_candidates` | API 6, 스케줄 8 | `backend/app/api/research.py:78`, `deep_researcher.py:376`, `frontend/src/lib/api.ts:489` | 한 번에 평가할 후보 수 |
| 자동 채택 임계값 | 8.2 | `deep_researcher.py:347` | 이상이면 AUTO_ADOPTED |
| 워치리스트 임계값 | 6.5 | `deep_researcher.py:354` | 이상이면 WATCHLIST |
| 실증 실패 점수 | 2.0 | `deep_researcher.py:427` | REJECTED 기록 점수 |
| 기등록 점수 | 9.0 | `deep_researcher.py:320` | ALREADY_MONITORED 기록 점수 |
| 깊이 가산 | 키워드당 0.3, 최대 1.8 | `deep_researcher.py:339-341` | 딥 리서치 전용 |
| 최종 점수 범위 | 1.0~9.9 | `deep_researcher.py:344` | 반올림 소수 한 자리 |
| 기본 품질 점수 | 혼합 소스 5.0, 키워드당 +0.5(최대 2.5), AI rss +0.5, 저신호 −3.5, 짧은 제목 −2.0 | `backend/app/services/llm_processor.py:530-566` | `evaluate_quality_and_signal` |
| 피드 탐색 경로 | `/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/feed.xml`, `/index.xml` | `deep_researcher.py:251`, `source_researcher.py:247` | HEAD 탐색 순서 |
| HTTP 타임아웃 (딥 리서치) | GET 8.0초, HEAD 3.0초 | `deep_researcher.py:223`, `:254`, `:269` | httpx |
| HTTP 타임아웃 (URL 검사) | 페이지 10.0초, HEAD 4.0초, 피드 8.0초 | `source_researcher.py:205`, `:251`, `:272` | httpx |
| 최근 글 수 | 4 | `deep_researcher.py:287`, `source_researcher.py:295` | 피드에서 읽는 글 |
| 요약 길이 | 딥 리서치 350자, URL 검사 200자, 설명 250자 | `deep_researcher.py:291`, `:300`, `source_researcher.py:300`, `:322` | 자르기 |
| `CURATED_ECOSYSTEM_CATALOG` | 13개, base_score 8.7~9.6 | `backend/app/services/source_researcher.py:18-162` | 카탈로그 탐색 대상 |
| discover 기본 limit | 8 | `backend/app/api/research.py:14`, `:44` | 후보 수 |
| audit-logs 기본 limit | 30 | `backend/app/api/research.py:68`, `SourcesModal.tsx:66` | 감사 일지 수 |
| 딥 리서치 스케줄 | 매일 03:00, 15:00 UTC | `backend/app/scheduler.py:47` | `deep_research` job |
| 결과 안내 표시 시간 | 3500ms | `frontend/src/components/SourcesModal.tsx:102` | 자동 숨김 |
| 기동 후 재조회 지연 | 3000ms | `frontend/src/components/sources/DeepResearcherTab.tsx:64-67` | 1회 |
| URL 검사·탐색 프론트 타임아웃 | 12000ms | `frontend/src/lib/api.ts:412`, `:428` | `fetchWithTimeout` |

## 알려진 불일치·위험
- 마이닝 후보가 평가되지 않는다. 후보 풀은 시드 14개 뒤에 마이닝 결과를 붙이고 앞에서 `max_candidates`(6 또는 8)개만 자르므로, `max_candidates` 가 15 이상이 아니면 마이닝 후보는 평가 대상에 들지 못한다. 매 실행이 같은 시드 앞부분만 다시 평가한다. 근거: `backend/app/services/deep_researcher.py:394-412`.
- "LLM 평가" 표기와 실제 동작이 다르다. API 설명("LLM 4축 평가"), 화면 문구("LLM 기술 적합도 분석", "AI 판정 사유"), 클래스 docstring 은 LLM 평가를 말하지만, 점수는 `evaluate_quality_and_signal` 키워드 규칙과 깊이 가산뿐이고 LLM 을 부르지 않는다. 판정 사유 문장도 템플릿이다. 근거: `backend/app/api/research.py:79-82`, `frontend/src/components/sources/DeepResearcherTab.tsx:109-112`, `:192`, `deep_researcher.py:335-366`, `llm_processor.py:516-580`.
- `is_running` 고착: 실행 중 예외에 대한 try/finally 가 없어 플래그가 True 로 남으면 재시작 전까지 딥 리서치가 다시 돌지 않는다. 근거: `deep_researcher.py:385-486`.
- 테스트가 실제 파일과 외부 네트워크를 쓴다. `test_deep_researcher.py` 는 실제 GitHub 피드를 받고 `run_deep_research` 를 돌려 자동 채택 시 실제 `sources.json` 에 피드를 넣을 수 있고, `test_sources_and_research.py` 는 실제 `sources.json` 에 임시 피드를 넣었다가 지운다. 근거: `backend/tests/test_deep_researcher.py:10-72`, `backend/tests/test_sources_and_research.py:20-90`.
- `id` 충돌: 이름에서 영숫자가 아닌 글자를 `_` 로 바꿔 `id` 를 만들고 중복 검사를 하지 않는다. 한글 이름 피드끼리 `id` 가 같아질 수 있고, 그러면 켜기/끄기는 첫 항목만 바뀌고 삭제는 같은 `id` 를 모두 지운다. 근거: `sources_service.py:175`, `:206`, `:250`.
- 국가 판정 오탐: 자동 채택 시 원래 URL 에 `kr` 이 부분 문자열로만 들어 있어도 `KR` 로 등록한다. 근거: `deep_researcher.py:447`.
- `category_hint` 미사용: RSS 수집기는 피드의 `category_hint` 를 읽지 않는다. 화면 폼과 자동 채택이 정하는 카테고리는 수집 분류에 영향이 없다. 근거: `backend/app/collectors/sources/rss.py`(해당 키 참조 없음).
- 화면에서 할 수 없는 일: GitHub 저장소 추가·삭제, 소스 유형 섹션(GitHub 검색·Reddit·HN·arXiv·Hugging Face) 켜기/끄기와 검색어 편집, 카탈로그 탐색(`/discover`)과 후보 등록(`/register-candidate`), URL 검사 결과 등록. 요약 카드의 "Reddit · HN · arXiv" 는 설정과 상관없이 항상 켜진 것처럼 보인다. 근거: `frontend/src/components/sources/SourcesListTab.tsx:99-104`, `:258-287`, `DeepResearcherTab.tsx:201-235`, `frontend/src/lib/api.ts:417-452`(호출처 없음).
- 서버 측 요청 위조(SSRF) 가능성: 인증 없는 `/api/research/inspect-url` 이 임의 URL 을 서버에서 GET 하고 리다이렉트를 따라간다. 딥 리서치도 수집 기사 본문의 URL 로 요청한다. 근거: `backend/app/services/source_researcher.py:205-207`, `deep_researcher.py:186-207`, `:223-225`.
- 동시 쓰기: `sources.json` 은 잠금 없이 읽고-고치고-쓴다. 딥 리서치 자동 채택과 화면 편집이 겹치면 한쪽 변경이 사라질 수 있다. 근거: `sources_service.py:102-132`, `:169-262`.
- 두 사본: 저장 때마다 `backend/app/config/sources.json` 에도 쓴다. 어느 파일이 정본인지 코드에 정의가 없고, 루트 파일이 없으면 사본을 읽게 된다. 근거: `sources_service.py:11-24`, `:120-128`.
- 오류 표현: `/inspect-url` 은 실패도 HTTP 200 과 `status` 필드로 돌려준다. 저장 실패(`save_sources` 의 `False`)는 API 응답에 반영되지 않아 실패해도 `success` 를 돌려준다. 근거: `source_researcher.py:209-268`, `backend/app/api/sources.py:54-62`, `:80-83`.
- 화면 지표 고정값: "자동 채택 기준 8.2점", "매일 03:00, 15:00 UTC" 는 코드 상수와 연결되지 않은 문자열이다. "최근 리서치 일시" 는 기록이 없을 때 "최근 가동됨" 이라고 표시해 실제와 다를 수 있다. 근거: `DeepResearcherTab.tsx:126-141`.
- 계약 위치: `SourcesResponse`, `ResearchStatus`, `ResearchAuditLog`, `InspectUrlResponse` 등 이 영역의 타입은 `frontend/src/types/` 가 아니라 `frontend/src/lib/api.ts` 에 있고, 백엔드에는 대응 Pydantic 응답 스키마가 없다 (딕셔너리를 그대로 돌려준다). MSW 목은 `GET /api/sources` 만 있다. 근거: `frontend/src/lib/api.ts:270-487`, `frontend/src/mocks/handlers.ts:450-456`.
