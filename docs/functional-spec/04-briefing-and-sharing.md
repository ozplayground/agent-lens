# 기능명세: 일일 브리핑과 외부 공유

Updated: 2026-11-06

## 개요
AgentLens 는 DB 에 쌓인 뉴스 중 카테고리별 상위 항목을 골라 "오늘의 AI 브리핑"을 만든다. 브리핑은 요청할 때마다 새로 만들며 따로 저장하지 않는다. 메인 화면(`/`) 상단 배너를 누르면 브리핑 모달이 열리고, 모달에서 카테고리별 요약 보기, 마크다운 전문 보기, 복사, `.md` 다운로드, Notion 페이지 발행, 이메일 발송을 할 수 있다. Notion·SMTP·Slack/Discord 웹훅 연동값은 "공유 & 알림" 설정 모달에서 입력하고, 백엔드가 루트 `config.json` 에 평문으로 저장한다. 매일 00:15 UTC 에 스케줄러가 브리핑을 만들어, 켜져 있는 채널(Notion, 이메일, 웹훅)로 자동 발송한다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| BRF-01 | 브리핑 생성 | 4개 카테고리마다 최대 3건을 골라 헤드라인·개요·마크다운 보고서를 만든다 | `GET /api/briefing/today`, `POST /api/briefing/generate` |
| BRF-02 | 브리핑 배너 | 메인 화면 상단에 날짜·헤드라인을 보여 주고, 누르면 모달을 연다 | `/` 의 `DailyBriefingBanner` |
| BRF-03 | 브리핑 모달 | 카테고리별 요약과 마크다운 전문 탭, 복사, 다운로드, 설정 바로가기 | `DailyBriefingModal` |
| BRF-04 | Notion 발행 (수동) | 브리핑을 새로 만들어 Notion 부모 페이지(또는 DB) 아래에 페이지로 만든다 | 모달 "Notion 발행", `POST /api/briefing/export/notion` |
| BRF-05 | Notion 연결 테스트 | 토큰 인증과 부모 페이지 접근 권한을 확인한다 | 설정 모달 Notion 탭 "연결 테스트", `POST /api/briefing/test/notion` |
| BRF-06 | 이메일 발송 (수동) | 브리핑을 새로 만들어 SMTP 로 보낸다 | 모달 "이메일 전송", `POST /api/briefing/send/email` |
| BRF-07 | SMTP 연결 테스트 | 입력한 SMTP 값으로 테스트 메일을 보낸다 | 설정 모달 이메일 탭 "테스트 메일 발송", `POST /api/briefing/test/email` |
| BRF-08 | 이메일 템플릿 | 브리핑을 HTML 본문과 텍스트(마크다운) 본문으로 만든다 | `EmailService._build_html` |
| BRF-09 | 웹훅 테스트 전송 | Slack/Discord/일반 웹훅으로 연동 확인 메시지를 보낸다 | 설정 모달 웹훅 탭 "웹훅 테스트 전송", `POST /api/webhook/test` |
| BRF-10 | 웹훅 브리핑 발송 | 브리핑을 웹훅 제공자 형식(Slack Block Kit, Discord Embed, 일반 JSON)으로 보낸다 | `POST /api/webhook/send-briefing`, 자동 발송 |
| BRF-11 | 브리핑 연동 설정 조회·저장 | Notion·SMTP·웹훅 설정을 읽고 `config.json` 에 저장한다 | 헤더 "공유 & 알림" → `BriefingSettingsModal`, `GET/POST /api/briefing/settings` |
| BRF-12 | 웹훅 설정 모달 (미사용) | 브라우저 localStorage 에 웹훅 URL 을 두고 테스트·브리핑 전송을 하는 컴포넌트. 어느 화면에도 붙어 있지 않다 | `WebhookSettingsModal` |
| BRF-13 | 자동 발송 스케줄 | 매일 00:15 UTC 에 브리핑을 만들어 켜진 채널로 보낸다 | APScheduler job `daily_briefing_dispatch` |

## BRF-01 브리핑 생성
- 진입점: `GET /api/briefing/today`, `POST /api/briefing/generate`. 두 엔드포인트의 동작은 같다 (둘 다 `generate_daily_briefing` 을 호출한다). 프론트는 메인 화면을 열 때와 헤더 새로고침 때 `/today` 를 부른다 (`useNewsFeed.loadStatsAndBriefing`). `/generate` 를 부르는 프론트 코드는 없다. 수동 Notion·이메일·웹훅 발송과 자동 발송도 내부에서 같은 함수로 브리핑을 새로 만든다.
- 입력: 없음. 요청 본문·쿼리 파라미터를 받지 않는다.
- 처리 규칙:
  1. 날짜 문자열은 현재 UTC 시각을 `"%Y년 %m월 %d일"` 형식으로 만든다 (예: `2026년 11월 06일`).
  2. 대상 기간 제한이 없다. 발행일·수집일 필터 없이 `news_items` 전체에서 고른다. 품질 점수(`quality_score`)나 기준 통과 여부로도 거르지 않는다.
  3. 카테고리는 고정 4개를 이 순서로 처리한다: `harness`(🎯 하네스 & 벤치마크), `mcp_plugins_skills`(🔌 MCP & 도구·스킬 생태계), `agent_tech`(🤖 에이전트 아키텍처 & 런타임), `ai_news`(💡 최신 AI 소식 & 프론티어 모델). 카테고리마다 기본 요약 문장(`default_summary`)이 있다.
  4. 카테고리별 선정: `category == id` 인 항목을 `is_high_signal` 내림차순, `hotness_score` 내림차순, `id` 내림차순으로 정렬해 최대 3건 가져온다.
  5. 보충 규칙: 4번 결과가 2건 미만이면, 카테고리와 상관없이 같은 정렬로 상위 15건을 가져와 카테고리별 키워드가 `제목 + 요약 + 태그` 소문자 문자열에 들어 있는 항목을 3건이 될 때까지 덧붙인다. 키워드는 harness `bench, eval, test, harness, sandbox`, mcp_plugins_skills `mcp, protocol, tool, plugin, skill`, agent_tech `agent, graph, crew, memory, state`, ai_news `model, llm, reasoning, paper, deepseek, openai` 이다. 카테고리 사이 중복 제거는 하지 않아서 같은 기사가 두 카테고리에 나올 수 있다.
  6. 카테고리 요약: 항목이 없으면 기본 요약 문장을 쓴다. 첫 항목에 `why_it_matters` 가 있으면 `'{제목 앞 45자}...' 등이 주목받으며, {why_it_matters}`, 없고 `summary` 가 있으면 `'{제목 앞 45자}...' 관련 소식으로, {요약 앞 90자}...`, 둘 다 없으면 기본 요약 문장을 쓴다. 제목이 45자보다 짧아도 `...` 를 붙인다.
  7. 헤드라인: 카테고리 순서대로 항목을 이어 붙였을 때 첫 항목(대개 harness 1위)의 제목을 40자에서 자르고(넘으면 `...`) `" 및 분야별 핵심 에이전트 기술 동향"` 을 붙인다. 항목이 하나도 없으면 고정 문장 `SWE-bench 평가 하네스 및 Model Context Protocol 생태계 동향` 을 쓴다.
  8. 개요(overview): 카테고리마다 `• **{카테고리명}**: {카테고리 요약}` 한 줄씩, 줄바꿈으로 잇는다.
  9. Action Items: 고정 문장 3개다 (평가·샌드박스 테스트베드 도입 검토, FastMCP 규격 표준화, 상태 영속성 구조 리팩토링). 뉴스 내용과 상관없다.
  10. 마크다운 보고서: `# 🌅 오늘의 AI 브리핑`, 발행 일자와 핵심 토픽 줄, `## 📌 오늘의 핵심 테이크어웨이 (Overview)` + 개요, 카테고리마다 `## {아이콘} {이름}` + `> 💡 **동향 요약**: …` + 항목 목록(`- **[제목](url)** \`[source]\``, 다음 줄에 `↳ 💡 시사점` 또는 `↳ 📝 요약`), 항목이 없으면 "현재 해당 카테고리의 새로운 주요 소식을 수집 분석 중입니다.", 마지막에 `## ✅ 오늘의 추천 Action Items` 번호 목록이다.
  11. 항목 필드의 `tags` 는 DB 의 쉼표 구분 문자열을 잘라 목록으로 바꾼다.
  12. `title` 은 항상 `"오늘의 AI 브리핑"` 이다. `config.json` 의 `briefing.title`(`settings.BRIEFING_TITLE`)은 쓰지 않는다.
  13. LLM 을 부르지 않는다. DB 조회와 문자열 조합만 한다.
- 출력: `DailyBriefingResponse` — `title`, `date`, `headline`, `overview`, `categories[]`(`id`, `name`, `icon`, `summary`, `items[]`: `id`, `title`, `url`, `source`, `why_it_matters`, `summary`, `tags[]`, `category`, `category_name`, `hotness_score`), `action_items[]`, `markdown_report`, `featured_items_count`(카테고리별 항목 수 합. 중복 항목도 센다), `generated_at`(UTC ISO 8601).
- 예외·엣지: DB 가 비어 있으면 4개 카테고리 모두 항목 0건, 기본 요약, 고정 헤드라인으로 응답한다. 저장·캐시가 없어 같은 날 여러 번 부르면 그 사이 수집 결과에 따라 내용이 바뀐다. 세션을 받지 않고 부르면(자동 발송) 자체 세션을 열고 끝에 닫는다.
- 관련 코드: `backend/app/api/briefing.py:25-53`, `backend/app/services/briefing_service.py:13-42`(카테고리 정의), `:45-77`(선정·보충), `:79-89`(요약), `:91-104`(헤드라인), `:106-208`(조립), `backend/app/schemas/news.py:48-85`, `frontend/src/hooks/useNewsFeed.ts:32-48`, `frontend/src/lib/api.ts:63-68`

## BRF-02 브리핑 배너
- 진입점: 메인 화면 `main` 영역 맨 위 (`frontend/src/app/page.tsx:136`).
- 입력: `useNewsFeed` 가 받아 온 브리핑 객체.
- 처리 규칙:
  1. 브리핑이 `null` 이면 아무것도 그리지 않는다.
  2. "오늘의 AI 브리핑" 라벨, `date`, `headline`(한 줄 말줄임), "브리핑 보기" 를 보여 준다.
  3. 배너 전체가 클릭 영역이며, 누르면 브리핑 모달을 연다.
- 출력: 배너 카드.
- 예외·엣지: `/api/briefing/today` 가 실패하거나 8000ms 안에 응답하지 않으면(`fetchWithTimeout` 기본값) 오류를 삼키고 `null` 로 둔다. 이때 배너가 보이지 않고 오류 표시도 없다. 이미 브리핑을 받은 뒤 재조회가 실패하면 이전 브리핑을 그대로 둔다.
- 관련 코드: `frontend/src/components/DailyBriefingBanner.tsx:12-47`, `frontend/src/hooks/useNewsFeed.ts:35-42`, `frontend/src/lib/api.ts:25-37`

## BRF-03 브리핑 모달
- 진입점: 배너 클릭. Esc 를 누르면 다른 오버레이와 함께 닫힌다 (`HotkeyListener` → `handleCloseOverlays`). 명령 팔레트(⌘K)에는 브리핑 항목이 없다.
- 입력: 페이지가 들고 있는 브리핑 객체. 모달을 열 때 다시 조회하지 않는다.
- 처리 규칙:
  1. 헤더: 제목 "오늘의 AI 브리핑", 날짜 배지, 헤드라인 한 줄.
  2. 툴바: Notion 발행(BRF-04), 이메일 전송(BRF-06), 복사, 다운로드, 설정(톱니), 닫기.
  3. 복사: `markdown_report` 를 클립보드에 쓰고 버튼을 2000ms 동안 "복사됨" 으로 바꾼다.
  4. 다운로드: `markdown_report` 를 `text/markdown` Blob 으로 만들어 `AgentLens_Daily_Briefing_{date 에서 숫자만}.md` 로 내려받는다 (예: `AgentLens_Daily_Briefing_20261106.md`).
  5. 탭 두 개: "카테고리별 요약"(기본)과 "마크다운 전문".
  6. 카테고리별 요약 탭: 개요 박스(헤드라인 + `overview` 각 줄. `• **이름**: 내용` 형식이면 이름을 굵게 나눠 그린다), 카테고리 카드(아이콘, 이름, `N건`, `동향:` 요약, 항목 카드), Action Items 박스. 항목 카드는 제목 링크(새 탭), source 배지, `why_it_matters` 가 있으면 "💡 시사점" 박스, 없으면 `summary` 두 줄 말줄임.
  7. `categories` 가 비었거나 없으면 `markdown_report` 를 줄 단위 `<p>` 로 그린다.
  8. 마크다운 전문 탭: `MarkdownViewer` 로 `markdown_report` 를 렌더링한다.
  9. 설정 바로가기: 톱니 버튼, 하단 "연동 설정 관리", Notion/이메일 실패 배너의 "Notion 설정 열기"/"이메일 설정 열기" 링크가 모두 같은 `BriefingSettingsModal` 을 연다. 페이지가 `initialTab` 을 넘기지 않아 항상 Notion 탭으로 열린다.
- 출력: 모달 화면.
- 예외·엣지: 브리핑이 `null` 이거나 `isOpen` 이 false 면 렌더링하지 않는다. Notion·이메일 결과 상태는 모달을 닫아도 초기화하지 않는다 (컴포넌트가 계속 마운트되어 있다). 그래서 Notion 발행에 한 번 성공하면 페이지를 새로고침할 때까지 버튼이 "Notion에서 열기" 링크로 남는다.
- 관련 코드: `frontend/src/components/DailyBriefingModal.tsx:31-471`, `frontend/src/app/page.tsx:409-414`, `frontend/src/components/HotkeyListener.tsx:82-85`

## BRF-04 Notion 발행 (수동)
- 진입점: 모달 "Notion 발행" 버튼 → `exportBriefingToNotion()`(인자 없이 호출) → `POST /api/briefing/export/notion`. 프론트 타임아웃 20000ms.
- 입력: 본문 `NotionExportRequest` — `api_key`(선택), `page_id`(선택). 본문이 없어도 된다. 화면은 둘 다 보내지 않으므로 저장된 설정값을 쓴다.
- 처리 규칙:
  1. 브리핑을 새로 만든다 (BRF-01).
  2. 토큰은 요청 `api_key`, 없으면 `settings.NOTION_API_KEY`. 부모 ID 는 요청 `page_id`, 없으면 `settings.NOTION_PAGE_ID`.
  3. 부모 ID 정리(`clean_id`): 입력에서 32자리 hex 또는 8-4-4-4-12 UUID 를 모두 찾아 마지막 것을 하이픈 없는 32자로 만든 뒤 8-4-4-4-12 형식으로 바꾼다. 찾지 못하면 입력을 앞뒤 공백만 지워 그대로 쓴다. 그래서 Notion 페이지 전체 URL 도 받을 수 있다.
  4. 부모 판별: `GET https://api.notion.com/v1/databases/{id}` (타임아웃 10.0초)가 200 이면 부모를 DB 로 보고 `parent = {database_id}`, 속성을 `Name` 제목 속성으로 만든다. 그 밖의 경우(오류·예외 포함)는 페이지로 보고 `parent = {page_id}`, `title` 속성을 쓴다.
  5. 페이지 제목은 `오늘의 AI 브리핑 - {date}`, 아이콘 🌅. Notion-Version 헤더는 `2022-06-28`.
  6. 블록 구성: 헤드라인 callout(`📌 {headline}` + 빈 줄 + 개요, 1900자 자름, 파란 배경, 🌅) → divider → 카테고리마다 heading_2(`{아이콘} {이름}`), 요약 paragraph(굵은 "💡 동향: " + 요약 1900자, 회색), 항목마다 bulleted_list_item(굵은 제목 100자, URL 이 `http` 로 시작할 때만 링크, 회색 ` [source]`, `\n↳ 💡 시사점: ` + why 250자 또는 `\n↳ 📝 요약: ` + summary 250자), divider → Action Items 가 있으면 초록 heading_2 "✅ 오늘의 실무 Action Items" 와 to_do 블록(`{번호}. {문장}`, 1900자, 체크 안 됨) → 기울임 회색 footer paragraph `AgentLens AI Curation Platform • 발행 일시: {date}`.
  7. 처음 100블록을 `POST /v1/pages`(타임아웃 15.0초) 의 children 으로 보내고, 남은 블록은 100개씩 `PATCH /v1/blocks/{page_id}/children` 로 붙인다. 현재 구성은 최대 31블록이라 추가 요청은 실제로 일어나지 않는다.
  8. 응답 `url` 이 있으면 그것을, 없으면 `https://notion.so/{하이픈 뺀 id}` 를 돌려준다.
  9. 화면: 성공하면 초록 배너 "Notion 페이지 생성 완료!" 와 함께 버튼이 "Notion에서 열기"(새 탭) 링크로 바뀐다. 실패하면 빨간 배너에 서버 `detail` 과 "Notion 설정 열기" 링크를 보여 준다.
- 출력: 200 `{"success": true, "message": "Notion 페이지가 성공적으로 생성되었습니다!", "url": "..."}`.
- 예외·엣지 (모두 HTTP 400, `detail` 에 메시지):
  - 토큰 없음: "Notion API 토큰(Internal Integration Token)이 설정되지 않았습니다."
  - 부모 ID 없음: "Notion 부모 페이지(Parent Page ID)가 설정되지 않았습니다."
  - Notion 응답 `code == "object_not_found"`: 부모 페이지를 찾을 수 없으니 '...' > '연결' 에서 통합을 초대했는지 확인하라는 안내.
  - 그 밖의 비 200/201: `Notion 페이지 생성 실패 ({상태코드}): {message}`.
  - 네트워크 오류: `Notion API 통신 실패: …`, 그 밖의 예외: `Notion 페이지 생성 중 예외 발생: …`.
  - 남은 블록 PATCH 의 응답은 확인하지 않는다.
- 관련 코드: `backend/app/api/briefing.py:55-73`, `backend/app/services/notion_service.py:13-31`(ID 정리·헤더), `:72-206`(블록), `:208-294`(페이지 생성), `frontend/src/components/DailyBriefingModal.tsx:68-79`, `:121-146`, `:235-256`, `frontend/src/lib/api.ts:502-517`

## BRF-05 Notion 연결 테스트
- 진입점: 설정 모달 Notion 탭 "연결 테스트" → `POST /api/briefing/test/notion`. 프론트 타임아웃 12000ms. 입력란의 토큰이 비어 있고 저장된 토큰도 없으면 버튼이 비활성이다.
- 입력: `TestNotionRequest` — `api_key`(선택), `page_id`(선택). 화면은 토큰 입력란 값이 `***`(저장된 값 표시용)면 토큰을 보내지 않고, 페이지 ID 는 입력란 값을 보낸다.
- 처리 규칙:
  1. 토큰은 요청값, 없으면 `settings.NOTION_API_KEY`. 비면 실패.
  2. `GET /v1/users/me` (httpx 타임아웃 10.0초). 200 이 아니면 인증 실패. 성공하면 봇 이름(`name`, 없으면 "AgentLens Integration")을 얻는다.
  3. 페이지 ID(요청값, 없으면 `settings.NOTION_PAGE_ID`)를 `clean_id` 로 정리해 값이 있으면 `GET /v1/pages/{id}` 를 부른다. 404 면 `GET /v1/databases/{id}` 를 다시 시도하고, 그것도 200 이 아니면 봇이 페이지에 접근할 수 없다는 안내(연결 메뉴에서 통합 초대)를 돌려준다. 404 가 아닌 비 200 이면 "대상 페이지 접근 권한 오류".
- 출력: 200 `{"success": true, "message": "Notion 연동 성공! (연결된 통합: {봇 이름})"}`. 화면은 초록 피드백 박스에 메시지를 보여 준다.
- 예외·엣지: 실패는 모두 400 과 `detail`. 토큰 없음 "Notion API 토큰(Internal Integration Token)을 입력해주세요.", 인증 실패 `Notion 인증 실패: {message}`, 네트워크 오류 `Notion API 네트워크 오류: …`, 그 밖의 예외 `Notion 검증 중 오류: …`.
- 관련 코드: `backend/app/api/briefing.py:95-100`, `backend/app/services/notion_service.py:33-70`, `frontend/src/components/BriefingSettingsModal.tsx:147-159`, `frontend/src/lib/api.ts:536-551`

## BRF-06 이메일 발송 (수동)
- 진입점: 모달 "이메일 전송" 버튼 → 팝오버(수신자 입력란, "발송"/"기본 수신자로 발송", "취소") → `POST /api/briefing/send/email`. 프론트 타임아웃 20000ms.
- 입력: `EmailSendRequest` — `to_email`(선택, 쉼표·세미콜론 구분 여러 주소 가능), `subject`(선택). 화면은 입력란이 비어 있으면 본문을 비워 보내고(기본 수신자), `subject` 는 보내지 않는다. 입력란은 `type="email"` 이다.
- 처리 규칙:
  1. 브리핑을 새로 만든다 (BRF-01).
  2. SMTP 값(호스트, 포트, 계정, 비밀번호, TLS, 발신자)은 모두 `settings` 에서 읽는다. 요청으로 바꿀 수 없다.
  3. 수신자: 요청 `to_email`, 없으면 `settings.SMTP_TO`. `;` 를 `,` 로 바꿔 나눈 뒤 `@` 와 `.` 가 모두 들어 있는 항목만 남긴다.
  4. 발신자 주소: `SMTP_FROM`, 없으면 `SMTP_USER`, 없으면 `noreply@agentlens.local`. `From` 헤더는 `AgentLens <{발신자 주소}>`.
  5. 제목: 요청 `subject`, 없으면 `[AgentLens] 오늘의 AI 브리핑 - {date}`.
  6. 본문: `multipart/alternative` 로 텍스트(= `markdown_report`)와 HTML(BRF-08)을 UTF-8 로 붙인다.
  7. 전송은 `asyncio.to_thread` 로 동기 smtplib 를 돌린다. 포트가 465 면 `SMTP_SSL`, 아니면 `SMTP` 로 연결하고 `use_tls` 가 참이면 `starttls()` 한다. 소켓 타임아웃 12.0초. 계정과 비밀번호가 모두 있을 때만 `login` 한다.
  8. 화면: 성공하면 초록 배너 "이메일이 성공적으로 발송되었습니다." 를 보여 주고 팝오버를 닫으며 4000ms 뒤 배너를 지운다. 실패하면 빨간 배너에 `detail` 과 "이메일 설정 열기" 링크를 보여 준다.
- 출력: 200 `{"success": true, "message": "성공적으로 {N}명의 수신자에게 이메일을 발송했습니다."}`.
- 예외·엣지 (모두 400):
  - 호스트 없음: "SMTP 설정이 완료되지 않았습니다. 설정창에서 SMTP 서버를 등록해주세요."
  - 유효 수신자 없음: "수신자 이메일 주소가 비어있습니다. 수신자를 입력해주세요."
  - `SMTPAuthenticationError`: "SMTP 계정 인증 실패: 아이디 또는 비밀번호(앱 비밀번호)를 확인해주세요."
  - `SMTPConnectError`: `SMTP 서버({host}:{port})에 연결할 수 없습니다. …`
  - 그 밖의 예외(DNS 실패·타임아웃 같은 소켓 오류 포함): `이메일 전송 중 오류 발생: {예외}`.
- 관련 코드: `backend/app/api/briefing.py:75-93`, `backend/app/services/email_service.py:12-16`(수신자 파싱), `:146-178`(전송), `:226-264`(브리핑 메일), `frontend/src/components/DailyBriefingModal.tsx:81-94`, `:148-192`, `:258-279`, `frontend/src/lib/api.ts:519-534`

## BRF-07 SMTP 연결 테스트
- 진입점: 설정 모달 이메일 탭 "테스트 메일 발송" → `POST /api/briefing/test/email`. 프론트 타임아웃 15000ms. 호스트가 비었거나, 계정과 수신자가 모두 비었으면 버튼이 비활성이다.
- 입력: `TestEmailRequest` — `smtp_host`, `smtp_port`(기본 587), `smtp_user`, `smtp_password`, `use_tls`(기본 true), `to_email`. 화면은 입력란 값을 그대로 보내되, 비밀번호가 `***` 면 보내지 않는다.
- 처리 규칙:
  1. 각 값은 요청값, 비었으면 `settings` 값을 쓴다 (호스트·계정·비밀번호·수신자). 포트는 요청값이 있으면 그것을 쓰고, 스키마 기본값이 587 이라 요청에서 빠져도 587 이 된다. TLS 는 요청값이 `null` 일 때만 설정값을 쓴다.
  2. 호스트가 비면 실패.
  3. 수신자: `to_email`(없으면 `SMTP_TO`)을 BRF-06 규칙으로 파싱한다. 그것도 비면 계정에 `@` 가 있을 때 계정 주소로 보낸다.
  4. 발신자 주소는 요청값이 아니라 저장된 `SMTP_FROM`, 없으면 계정, 없으면 `noreply@agentlens.local`.
  5. 제목 `[AgentLens] SMTP 이메일 연동 테스트 성공`, 텍스트와 HTML("🎉 AgentLens 이메일 연동 성공!", `{host}:{port}` 표시) 본문을 보낸다. 전송 방식은 BRF-06 7번과 같다.
- 출력: 200 `{"success": true, "message": "성공적으로 {N}명의 수신자에게 이메일을 발송했습니다."}`.
- 예외·엣지: 400 과 `detail`. 호스트 없음 "SMTP 호스트 서버 주소를 입력해주세요.", 수신자 없음 "테스트를 받을 유효한 수신자 이메일 주소를 입력해주세요.", 전송 오류는 BRF-06 과 같은 메시지.
- 관련 코드: `backend/app/api/briefing.py:102-114`, `backend/app/services/email_service.py:180-224`, `backend/app/schemas/news.py:108-114`, `frontend/src/components/BriefingSettingsModal.tsx:161-180`, `frontend/src/lib/api.ts:553-571`

## BRF-08 이메일 템플릿
- 진입점: BRF-06 이 내부에서 호출한다.
- 입력: 브리핑 딕셔너리.
- 처리 규칙:
  1. 전체 폭 640px, 인라인 스타일 HTML. `<title>오늘의 AI 브리핑 - {date}</title>`.
  2. 머리말: "AgentLens Daily Briefing" 배지, "🌅 오늘의 AI 브리핑", "발행 일자: {date}".
  3. 헤드라인 콜아웃: `📌 {headline}` 과, 있으면 `overview` 원문. 개요의 줄바꿈과 `**` 마크다운은 변환하지 않는다.
  4. 카테고리 카드: `{아이콘} {이름}`, 있으면 "동향: {요약}", 항목마다 `• {제목}` 링크(`url` 없으면 `#`, 새 탭), `[source]`, `why_it_matters` 가 있으면 파란 "💡 시사점:" 박스, 없고 `summary` 가 있으면 회색 "📝 요약:" 박스.
  5. Action Items 가 있으면 초록 박스 "✅ 오늘의 추천 Action Items" 번호 목록.
  6. 꼬리말: "AgentLens • AI & Agent 기술 큐레이션 웹 애플리케이션" 과 `http://localhost:3001` 로 고정된 "대시보드 바로가기" 링크.
  7. 텍스트 본문은 HTML 이 아니라 `markdown_report` 를 그대로 쓴다.
- 출력: HTML 문자열.
- 예외·엣지: 제목·요약·URL 등 외부에서 수집한 문자열을 HTML 이스케이프 없이 f-string 으로 끼워 넣는다.
- 관련 코드: `backend/app/services/email_service.py:18-144`, `:256-260`

## BRF-09 웹훅 테스트 전송
- 진입점: 설정 모달 웹훅 탭 "웹훅 테스트 전송" → `testWebhook(url)` → `POST /api/webhook/test`. 프론트 타임아웃 8000ms. 화면은 웹훅 입력란, 저장된 Slack URL, 저장된 Discord URL 순으로 첫 번째 비어 있지 않은 값을 대상으로 하며, `http` 로 시작하지 않으면 요청 없이 "올바른 웹훅 URL을 입력해주세요." 를 보여 준다.
- 입력: `webhook_url`(필수), `provider`(선택, 기본 `"auto"`. 화면은 보내지 않는다).
- 처리 규칙:
  1. URL 이 `http` 로 시작하지 않으면 400.
  2. 제공자: `provider == "auto"` 면 URL 소문자에 `slack.com` 이 있으면 slack, `discord.com`/`discordapp.com` 이 있으면 discord, 그 밖은 generic. `auto` 가 아니면 받은 값을 그대로 쓴다.
  3. 테스트 페이로드 (확인 시각은 `%Y-%m-%d %H:%M UTC`):
     - slack: `text` "🔔 AgentLens 웹훅 연동 테스트 성공!" + header 블록 + mrkdwn section(연결 완료 안내, 확인 시각).
     - discord: `content` "🔔 **AgentLens 웹훅 연동 테스트 성공!**" + embed(제목 "AgentLens AI 알림 연동 완료", 확인 시각, 색 3900150).
     - generic: `{"event": "agentlens.test", "message": "AgentLens Webhook Test Successful", "timestamp": …}`.
  4. httpx 로 JSON POST (타임아웃 8.0초). 응답 200 또는 204 만 성공으로 본다.
- 출력: 200 `{"success": true, "message": "테스트 웹훅 메시지가 성공적으로 전송되었습니다."}`.
- 예외·엣지: 400 과 `detail`. URL 형식 오류 "유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.", 비 200/204 `서버 응답 오류 (HTTP {코드}): {본문 앞 100자}`, 요청 오류 `웹훅 요청 실패: …`, 그 밖 `예기치 못한 오류: …`.
- 관련 코드: `backend/app/api/webhook.py:11-26`, `backend/app/services/webhook_service.py:9-69`, `:154-157`, `frontend/src/components/BriefingSettingsModal.tsx:182-198`, `frontend/src/lib/api.ts:218-230`

## BRF-10 웹훅 브리핑 발송
- 진입점: `POST /api/webhook/send-briefing`(수동 API)와 자동 발송(BRF-13). 화면에서 이 API 를 부르는 곳은 어디에도 붙지 않은 `WebhookSettingsModal`(BRF-12)뿐이다.
- 입력: `webhook_url`(필수), `provider`(선택. 받기만 하고 쓰지 않는다. 제공자는 항상 URL 로 판별한다).
- 처리 규칙:
  1. URL 이 `http` 로 시작하지 않으면 400.
  2. 브리핑을 새로 만든다 (BRF-01).
  3. 웹훅용 요약 데이터를 만든다. 수동 API 와 자동 발송이 서로 다르다.
     - 수동 API: `title` = `🌅 AgentLens 일일 AI 브리핑 ({date})`, `executive_summary` = 헤드라인 + 빈 줄 + `markdown_report` 앞 600자 + `...`, `top_highlights` = 빈 목록.
     - 자동 발송: `title` = `🌅 오늘의 AI 브리핑 ({date})`, `executive_summary` = 헤드라인 + 빈 줄 + `overview`, `top_highlights` = 카테고리마다 첫 항목 1건(최대 4건).
  4. 제공자별 페이로드:
     - slack: header 블록(`title`), mrkdwn section `*📌 오늘의 총평*\n{요약}`, divider, 하이라이트가 있으면 section "*🎯 핵심 하이라이트*" 에 최대 5건(`*{n}. <url|제목>* \`[category]\``, why 가 있으면 `↳ 💡 _{why}_`), context(`AgentLens AI Curation Platform • {date}`). 최상위 `text` = `{title}\n{요약}`.
     - discord: `content` = `**{title}**`, embed 하나(제목 "📌 Executive Summary", 설명 = 요약 1500자, 색 3900150, 하이라이트 최대 4건을 field 로: 이름 = 제목 100자, 값 = `[기사 원문 바로가기](url)` + `💡 {why_it_matters 또는 summary}` 200자, footer `AgentLens • {date}`).
     - generic: `{"event": "agentlens.daily_briefing", "title", "summary", "top_highlights", "date"}`.
  5. 전송은 BRF-09 4번과 같다 (8.0초, 200/204 성공).
- 출력: 200 `{"success": true, "message": "오늘의 일일 브리핑이 웹훅으로 성공적으로 발송되었습니다."}`.
- 예외·엣지: 실패는 400 과 BRF-09 와 같은 메시지. 자동 발송에서는 결과를 확인하지 않는다 (BRF-13).
- 관련 코드: `backend/app/api/webhook.py:15-43`, `backend/app/services/webhook_service.py:71-152`, `:159-162`, `backend/app/services/briefing_service.py:239-257`, `frontend/src/lib/api.ts:232-244`

## BRF-11 브리핑 연동 설정 조회·저장
- 진입점: 헤더 "공유 & 알림" 버튼(`title`: "Notion / 이메일 / 웹훅 브리핑 연동 설정"), 브리핑 모달의 설정 바로가기(BRF-03 9번) → `BriefingSettingsModal`. 모달을 열 때마다 `GET /api/briefing/settings` 를 부르고(타임아웃 8000ms), "설정 저장" 은 `POST /api/briefing/settings`(타임아웃 10000ms). Esc 로 닫힌다.
- 입력 (화면 필드와 기본값):
  - Notion 탭: 시크릿 토큰(`type=password`, 저장된 토큰이 있으면 값 `***`), 부모 페이지 ID 또는 URL, "정기 브리핑 발행 시 자동으로 Notion 페이지 생성" 체크박스. 연동 가이드 3단계 안내문과 `https://www.notion.so/my-integrations` 링크가 있다.
  - 이메일 탭: SMTP 호스트, 포트(기본 587), 계정, 비밀번호(`type=password`, 저장된 값이 있으면 `***`), 발신자 주소(From), 기본 수신자 목록(쉼표 구분), "STARTTLS 암호화 사용"(기본 켜짐), "정기 브리핑 시 수신자 목록으로 자동 발송".
  - 웹훅 탭: "Slack / Discord 웹훅 URL" 입력란 하나. 불러올 때 저장된 Slack URL, 없으면 Discord URL 로 채운다.
  - 탭마다 "설정 저장" 버튼이 있고 세 탭의 값을 한 번에 저장한다.
- 처리 규칙 (조회 `GET`):
  1. 메모리의 `config.json` 원본(`settings.raw_json_config`)에서 읽는다.
  2. 응답: `title`(기본 "오늘의 AI 브리핑"), `auto_dispatch_hour`(기본 0), `notion`{`enabled`, `has_api_key`, `masked_api_key`(8자 초과면 앞 4자 + `...` + 뒤 4자, 아니면 `***`), `page_id`, `auto_export`}, `email`{`enabled`, `smtp_host`, `smtp_port`(기본 587), `smtp_user`, `has_password`, `smtp_from`, `smtp_to`, `use_tls`(기본 true), `auto_send`}, `webhooks`{`slack_webhook_url`, `discord_webhook_url`(둘 다 원문), `auto_dispatch_daily_briefing`(기본 true), `auto_alert_high_signal`(기본 true)}.
  3. SMTP 비밀번호는 내려보내지 않는다. Notion 토큰은 앞뒤 4자를 드러낸 값을 내려보낸다 (화면은 이 값을 쓰지 않고 `***` 만 넣는다).
- 처리 규칙 (저장, 화면):
  4. 페이로드에 Notion 페이지 ID, 자동 발행, SMTP 호스트·포트·계정·From·To·TLS·자동 발송을 항상 넣는다.
  5. 토큰과 비밀번호는 비어 있지 않고 `***` 가 아닐 때만 넣는다.
  6. 웹훅: `slack_webhook_url` = 불러온 Slack URL, 그것이 비면 입력란 값에 `slack.com` 이 있을 때 입력란 값, 아니면 빈 문자열. `discord_webhook_url` = 불러온 Discord URL, 그것이 비면 입력란 값에 `discord` 가 있을 때 입력란 값, 아니면 빈 문자열.
  7. 성공하면 초록 피드백(서버 메시지)을 보여 주고 설정을 다시 불러온다.
- 처리 규칙 (저장, 서버 `POST`):
  8. 본문 `BriefingSettingsUpdate` 의 모든 필드는 선택이다: `notion_api_key`, `notion_page_id`, `notion_auto_export`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password`, `smtp_from`, `smtp_to`, `smtp_use_tls`, `email_auto_send`, `slack_webhook_url`, `discord_webhook_url`. `null` 인 필드는 건드리지 않는다. 문자열은 앞뒤 공백을 지운다.
  9. `notion_api_key`, `smtp_password` 는 값이 `***` 면 무시한다.
  10. `notion_auto_export` 가 오면 `notion.enabled = auto_export 또는 토큰 존재`, `email_auto_send` 가 오면 `email.enabled = auto_send 또는 호스트 존재` 로 함께 바꾼다. `enabled` 값을 읽는 다른 코드는 없다.
  11. `briefing.title`, `briefing.auto_dispatch_hour`, `webhooks.auto_dispatch_daily_briefing`, `webhooks.auto_alert_high_signal` 은 이 API 로 바꿀 수 없다.
  12. 저장 위치: `find_config_json()` 이 찾은 파일(cwd, cwd 의 부모, 저장소 루트, `backend/app/config/config.json` 순). 없으면 `cwd/config.json` 에 새로 쓴다. `indent=2`, `ensure_ascii=False` JSON 으로 덮어쓰고 `settings.reload()` 를 부른다.
- 출력: 200 `{"success": true, "message": "설정이 성공적으로 저장되었습니다."}`.
- 예외·엣지:
  - 파일 쓰기 실패: 500 "설정 파일(config.json) 저장에 실패했습니다." `docker-compose.yml` 은 `./config.json` 을 읽기 전용(`:ro`)으로 마운트하므로 Docker 에서는 저장이 항상 이 오류로 끝난다.
  - 저장 전 `dict(settings.raw_json_config)` 는 얕은 복사라서, 저장에 실패해도 메모리의 원본 설정(중첩 딕셔너리)은 이미 바뀐 상태로 남는다.
  - 저장 후 반영 범위는 '알려진 불일치·위험' 의 설정 재적재 항목을 본다.
  - 화면에서 토큰·비밀번호를 지울 방법이 없다 (빈 값은 보내지 않는다). 웹훅 URL 도 입력란을 비워 지울 수 없다 (6번 규칙).
  - 불러오기 실패: 빨간 피드백 "설정을 불러오지 못했습니다." 또는 서버 메시지.
  - 모달 하단 문구: "모든 토큰과 비밀번호는 config.json에 로컬 저장됩니다."
- 관련 코드: `backend/app/api/briefing.py:116-211`, `backend/app/schemas/news.py:116-129`, `backend/app/config.py:14-35`, `:144-173`, `frontend/src/components/BriefingSettingsModal.tsx:32-552`, `frontend/src/components/Header.tsx:176-185`, `frontend/src/app/page.tsx:417`, `frontend/src/lib/api.ts:573-593`, `docker-compose.yml:37-39`

## BRF-12 웹훅 설정 모달 (미사용)
- 진입점: 없음. `WebhookSettingsModal` 을 import 하는 화면이 없다. 페이지의 `webhookModalOpen` 상태는 `BriefingSettingsModal` 을 연다.
- 입력: 웹훅 URL 하나.
- 처리 규칙:
  1. 열릴 때 `localStorage['agentlens_webhook_url']` 를 읽어 채우고, 입력할 때마다 같은 키에 쓴다.
  2. URL 로 Slack / Discord / Generic Webhook 을 화면에 표시한다.
  3. "테스트 발송" 은 `POST /api/webhook/test`, "오늘의 브리핑 즉시 전송" 은 `POST /api/webhook/send-briefing` 을 부른다. URL 이 `http` 로 시작하지 않으면 요청하지 않는다.
  4. 안내문은 URL 을 브라우저에 저장하며, 정기 발송에는 백엔드 환경변수 `SLACK_WEBHOOK_URL` 로 등록할 수 있다고 적혀 있다.
- 출력: 피드백 박스.
- 예외·엣지: 서버 설정(`config.json`)과 연결되지 않는다.
- 관련 코드: `frontend/src/components/WebhookSettingsModal.tsx:12-193`

## BRF-13 자동 발송 스케줄
- 진입점: 앱 시작 시 `start_scheduler()` 가 APScheduler job `daily_briefing_dispatch` 를 `CronTrigger(hour="0", minute="15", timezone="UTC")` 로 등록한다 (매일 00:15 UTC = 09:15 KST). 화면에서 이 스케줄을 보여 주는 곳은 없다 (`ScheduleModal` 은 수집 스케줄만 보여 준다).
- 입력: `settings` 의 `NOTION_AUTO_EXPORT`, `NOTION_API_KEY`, `NOTION_PAGE_ID`, `EMAIL_AUTO_SEND`, `SMTP_HOST`, `SMTP_TO` 등, `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`.
- 처리 규칙:
  1. `briefing_service.auto_dispatch_all()` 이 브리핑을 한 번 만들고(자체 DB 세션) 세 채널에 차례로 보낸다. 채널마다 예외를 잡아 로그만 남기고 다음 채널로 넘어간다.
  2. Notion: `NOTION_AUTO_EXPORT` 가 참이고 `NOTION_API_KEY` 가 있으면 BRF-04 와 같은 방식으로 저장된 부모 페이지 아래에 페이지를 만든다. 성공·실패를 로그로 남긴다.
  3. 이메일: `EMAIL_AUTO_SEND` 가 참이고 `SMTP_HOST`, `SMTP_TO` 가 모두 있으면 BRF-06 과 같은 방식으로 기본 수신자에게 보낸다.
  4. 웹훅: 켜기·끄기 조건 없이 `SLACK_WEBHOOK_URL` 이 있으면 그 URL 로, `DISCORD_WEBHOOK_URL` 이 있으면 그 URL 로 BRF-10 자동 발송 형식으로 보낸다. 제공자는 URL 로 판별하므로 Slack 칸에 Discord URL 을 넣어도 Discord 형식으로 나간다. 반환된 성공·실패 값은 확인하지도 로그로 남기지도 않는다.
  5. 재시도는 없다.
- 출력: 없음 (로거 `agentlens.briefing` 에 info/warning/error, job 시작 시 표준 출력 `[Scheduler] Daily Briefing auto-dispatch triggered at …`).
- 예외·엣지:
  - `config.json` 의 `briefing.auto_dispatch_hour`(`settings.BRIEFING_AUTO_DISPATCH_HOUR`)와 `scheduler.auto_briefing_hour` 는 읽기만 하고 스케줄에 쓰지 않는다. 실행 시각은 코드에 고정되어 있다.
  - `webhooks.auto_dispatch_daily_briefing` 을 false 로 두어도 웹훅 자동 발송은 멈추지 않는다.
  - `webhooks.auto_alert_high_signal` 에 해당하는 고신호 기사 알림 기능은 코드에 없다.
  - 환경변수 `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL` 은 pydantic-settings 필드라 환경변수 값이 `config.json` 값보다 우선한다 (`docker-compose.yml` 이 둘을 넘긴다).
- 관련 코드: `backend/app/scheduler.py:20-23`, `:55-62`, `backend/app/services/briefing_service.py:210-257`, `backend/app/config.py:75-100`, `frontend/src/components/ScheduleModal.tsx:29-40`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| `CATEGORY_DEFS` | harness, mcp_plugins_skills, agent_tech, ai_news (순서 고정) | `backend/app/services/briefing_service.py:13-42` | 브리핑 카테고리와 아이콘·기본 요약 |
| 카테고리별 항목 수 | 3 | `briefing_service.py:45`, `:119` | 카테고리당 최대 항목 |
| 보충 기준 | 2건 미만 | `briefing_service.py:57` | 이보다 적으면 전체 상위에서 키워드로 보충 |
| 보충 후보 수 | 15 | `briefing_service.py:61` | 보충 때 보는 전체 상위 항목 수 |
| 요약용 제목 길이 | 45자 / 요약 90자 | `briefing_service.py:86-88` | 카테고리 요약 문장 자르기 |
| 헤드라인 제목 길이 | 40자 | `briefing_service.py:101-102` | 헤드라인 자르기 |
| 브리핑 제목 | "오늘의 AI 브리핑" | `briefing_service.py:194` | 고정값 |
| 날짜 형식 | `%Y년 %m월 %d일` (UTC) | `briefing_service.py:114` | 브리핑 `date` |
| Notion API | `https://api.notion.com/v1`, 버전 `2022-06-28` | `backend/app/services/notion_service.py:10-11` | Notion 호출 |
| Notion 타임아웃 | 10.0초(조회·테스트), 15.0초(페이지 생성) | `notion_service.py:41`, `:239`, `:263` | httpx 타임아웃 |
| Notion 블록 제한 | 요청당 100블록, 텍스트 1900자, 제목 100자, 시사점·요약 250자 | `notion_service.py:87`, `:121`, `:139`, `:154-159`, `:252` | Notion 페이로드 자르기 |
| SMTP 기본 포트 | 587 | `backend/app/config.py:86`, `backend/app/schemas/news.py:110` | 설정·테스트 기본값 |
| SMTP SSL 포트 | 465 | `backend/app/services/email_service.py:159` | 이 포트면 `SMTP_SSL` |
| SMTP 타임아웃 | 12.0초 | `email_service.py:160-162` | 소켓 타임아웃 |
| 기본 발신자 | `noreply@agentlens.local` | `email_service.py:204`, `:238` | From 이 비었을 때 |
| 대시보드 링크 | `http://localhost:3001` | `email_service.py:137` | 메일 꼬리말 링크 (고정) |
| 웹훅 타임아웃 | 8.0초 | `backend/app/services/webhook_service.py:22` | httpx 타임아웃 |
| 웹훅 성공 코드 | 200, 204 | `webhook_service.py:24` | 이 외는 실패 |
| Slack 하이라이트 수 | 5 | `webhook_service.py:95` | Slack 메시지 최대 항목 |
| Discord 하이라이트 수 / 설명 길이 | 4 / 1500자 | `webhook_service.py:126`, `:138` | Discord embed |
| 수동 웹훅 요약 길이 | 마크다운 앞 600자 | `backend/app/api/webhook.py:36` | `/send-briefing` 요약 |
| 자동 발송 시각 | 매일 00:15 UTC | `backend/app/scheduler.py:55` | `daily_briefing_dispatch` |
| `briefing.title` | "오늘의 AI 브리핑" | `config.json`, `config.py:76` | 읽지만 쓰이지 않음 |
| `briefing.auto_dispatch_hour` | 0 | `config.json`, `config.py:77` | 읽지만 쓰이지 않음 |
| 프론트 타임아웃 | 기본 8000ms, Notion 발행·이메일 20000ms, Notion 테스트 12000ms, SMTP 테스트 15000ms, 설정 저장 10000ms | `frontend/src/lib/api.ts:25`, `:508-512`, `:525-529`, `:542-546`, `:562-566`, `:582-586` | `fetchWithTimeout` |
| 복사 표시 시간 | 2000ms | `frontend/src/components/DailyBriefingModal.tsx:55` | "복사됨" 유지 |
| 이메일 성공 배너 | 4000ms | `DailyBriefingModal.tsx:88` | 자동 숨김 |
| localStorage 키 | `agentlens_webhook_url` | `frontend/src/components/WebhookSettingsModal.tsx:23`, `:33` | 미사용 모달의 저장 키 |

## 알려진 불일치·위험
- 설정 저장 후 서비스에 반영되지 않는다. `Settings` 의 필드 기본값은 클래스를 정의할 때 한 번 계산된 `config.json` 값이고, `settings.reload()` 는 모듈 전역 `_json_data` 만 바꾼 뒤 `__init__()` 을 다시 부른다. 그래서 `NOTION_API_KEY`, `NOTION_PAGE_ID`, `NOTION_AUTO_EXPORT`, `SMTP_*`, `EMAIL_AUTO_SEND` 는 프로세스를 다시 시작할 때까지 이전 값으로 남는다. `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL` 은 이전 값이 빈 문자열이고 새 값이 있을 때만 `merge_json_and_env` 에서 바뀐다. 반면 `GET /api/briefing/settings` 는 `raw_json_config`(새 값)를 읽으므로, 화면에는 저장된 값이 보이지만 발송은 이전 값으로 나간다. 근거: `backend/app/config.py:39-100`, `:108-142`, `:153-157`, `notion_service.py:35`, `:218-219`, `email_service.py:233-240`, `briefing_service.py:216`, `:228`. pydantic-settings 의 이 동작은 작은 재현 코드로 확인했다.
- 테스트가 실제 `config.json` 을 고친다. `test_briefing_settings_get_and_post` 가 `POST /api/briefing/settings` 로 `notion_page_id: "test_notion_parent_page"`, `smtp_host: "smtp.gmail.com"`, `smtp_to: "team@example.com"` 을 저장하며, 현재 루트 `config.json` 에 이 값들이 들어 있다. 근거: `backend/tests/test_briefing_notion_email.py:134-152`, `config.json:45`, `:50`, `:55`.
- 비밀값 저장·노출: Notion 토큰, SMTP 비밀번호, 웹훅 URL 을 `config.json` 에 평문으로 저장한다. 인증 없는 `GET /api/briefing/settings` 가 웹훅 URL 원문과 Notion 토큰 앞뒤 4자를 돌려준다. CORS 는 모든 origin 을 허용한다. 근거: `backend/app/api/briefing.py:116-159`, `:207`, `backend/app/main.py:29-35`. 현재 `config.json` 의 토큰·비밀번호·웹훅 칸은 비어 있다.
- 서버 측 요청 위조(SSRF) 가능성: 인증 없는 `/api/webhook/test`, `/api/webhook/send-briefing` 가 `http` 로 시작하는 임의 URL 로 서버가 POST 하게 하고, 실패 시 응답 본문 앞 100자를 돌려준다. 근거: `backend/app/api/webhook.py:19-43`, `webhook_service.py:17-32`.
- 이메일 HTML 이스케이프 없음: 수집한 제목·요약·URL·source 를 그대로 HTML 에 넣는다. 근거: `email_service.py:35-65`, `:122`.
- From 헤더 중복: 화면 placeholder 는 `AgentLens <noreply@mydomain.com>` 형식을 권하지만, 서버는 값을 다시 `AgentLens <{값}>` 으로 감싸고 같은 값을 SMTP envelope 발신자로도 쓴다. placeholder 대로 입력하면 `AgentLens <AgentLens <…>>` 가 된다. 근거: `frontend/src/components/BriefingSettingsModal.tsx:435`, `email_service.py:204-208`, `:238`, `:253`, `:169`.
- 웹훅 URL 저장 로직: 웹훅 탭에는 입력란이 하나뿐인데, 저장 시 불러온 Slack/Discord URL 이 입력란보다 우선한다. 이미 Slack URL 이 저장되어 있으면 새 Slack URL 로 바꿀 수 없고, 입력란을 비워도 지워지지 않으며, Slack·Discord 가 아닌 일반 웹훅 URL 은 저장되지 않는다. 근거: `BriefingSettingsModal.tsx:98-101`, `:126-127`.
- 설정 모달 탭: 이메일 실패 배너의 "이메일 설정 열기" 도 Notion 탭으로 연다 (`initialTab` 을 넘기지 않는다). 근거: `frontend/src/app/page.tsx:417`, `DailyBriefingModal.tsx:270-277`.
- Discord 필드 폴백 무효: `it.get('why_it_matters', it.get('summary', ''))` 는 키가 있으면 빈 문자열이라도 쓰는데, 브리핑 항목에는 `why_it_matters` 키가 항상 있어 요약으로 넘어가지 않는다. 근거: `webhook_service.py:129`, `briefing_service.py:130`.
- 보충 규칙의 태그 처리: `tags` 는 DB 문자열인데 `' '.join(it.tags)` 로 이어 붙여 글자 사이에 공백이 들어간다. 태그로는 키워드가 거의 맞지 않고 제목·요약으로만 맞는다. 근거: `briefing_service.py:68`, `backend/app/models/news.py:15`.
- "오늘의" 브리핑이지만 기간 필터가 없어 오래된 고신호 기사가 계속 상위에 남을 수 있다. Action Items 는 고정 문장이다. 근거: `briefing_service.py:47-51`, `:155-159`.
- 수동 웹훅과 자동 웹훅의 내용이 다르다 (제목 문구, 요약 원천, 하이라이트 유무). `/send-briefing` 은 하이라이트를 보내지 않는다. 근거: `backend/app/api/webhook.py:34-39`, `briefing_service.py:242-251`.
- 쓰이지 않는 설정·코드: `briefing.title`, `briefing.auto_dispatch_hour`, `scheduler.auto_briefing_hour`, `notion.enabled`, `email.enabled`, `webhooks.auto_dispatch_daily_briefing`, `webhooks.auto_alert_high_signal` 은 동작에 영향이 없다. `WebhookSettingsModal` 과 `POST /api/briefing/generate` 는 화면에서 쓰지 않는다. `WebhookBriefingRequest.provider` 는 무시된다. 근거: 위 각 항목의 관련 코드.
- 계약 정합: 프론트 `types/news.ts` 의 `BriefingSettings`, `NotionExportResponse`, `EmailSendResponse`, `DailyBriefingSchema` 는 정의만 있고 `api.ts` 는 설정 API 를 `any` 로 다룬다. MSW 목은 `/api/briefing/today`, `/api/briefing/generate` 만 있고 Notion·이메일·설정·웹훅 엔드포인트 목은 없다. 근거: `frontend/src/types/news.ts:134-212`, `frontend/src/lib/api.ts:573-593`, `frontend/src/mocks/handlers.ts:431-448`.
- 자동 발송 실패 가시성: 웹훅 결과는 버리고, Notion·이메일 실패는 로그로만 남는다. 재시도·알림은 없다. 근거: `briefing_service.py:215-257`.
