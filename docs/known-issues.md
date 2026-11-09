# 알려진 문제: AgentLens

Updated: 2026-11-09

코드를 읽고 찾은 문제 가운데 여러 영역에 걸치거나 영향이 큰 것을 모았다. 근거 줄 번호와 세부 내용은 '문서' 열의 '알려진 불일치·위험' 절에 있다. "의심" 은 코드로 추론했고 실행해 확인하지 않은 것이다.

## 보안
| 문제 | 영향 | 문서 |
|---|---|---|
| 인증이 없고 CORS 가 모든 origin 을 credentials 와 함께 허용한다 | :8000 에 닿는 누구나 `DELETE /api/news/all`, `POST /api/schedule/reset-and-collect`, 소스 삭제·토글, 설정 저장을 부를 수 있다 | api.md, tech-spec.md |
| 호출자가 준 URL·SMTP 호스트로 서버가 요청을 보낸다 (웹훅 테스트·발송, `inspect-url`, `test/email`) | SSRF | api.md, 04-briefing-and-sharing.md, 05-sources-and-research.md |
| Notion 토큰·SMTP 비밀번호·웹훅 URL 을 git 이 추적하는 `config.json` 에 평문 저장한다 | 비밀값 유출 | data-model.md, 04-briefing-and-sharing.md |
| `GET /api/briefing/settings` 가 웹훅 URL 을 가리지 않고, Notion 토큰 앞뒤 4자를 돌려준다 | 비밀값 노출 | api.md |
| 예외 문자열과 서버 절대 경로가 응답에 나간다 | 내부 정보 노출 | api.md |
| 이메일 HTML 을 이스케이프하지 않는다 | 수집한 제목에 HTML 이 있으면 메일 본문에 그대로 들어간다 | 04-briefing-and-sharing.md |

## 데이터·동작 오류
| 문제 | 영향 | 문서 |
|---|---|---|
| 챗 한 턴을 서버(`persist_turn`)와 프론트(`POST /api/chat/sessions`)가 둘 다 저장한다 (의심) | 첫 턴 중복 저장, 이후 PK 충돌 500 (프론트가 무시) | 02-ai-chat.md, api.md |
| 브리핑 설정 저장 뒤 `settings.reload()` 가 Notion·SMTP 값을 다시 읽지 않는다 | 화면에는 새 값이 보이지만 재시작 전까지 옛 값으로 발송한다 | 04-briefing-and-sharing.md, data-model.md |
| 딥 리서치가 예외 뒤 `is_running` 을 되돌리지 않는다 | 재시작 전까지 모든 실행이 거부된다 | 05-sources-and-research.md |
| 딥 리서치 후보 컷이 6~8개인데 시드 14개가 앞에 있다 | 발굴한 후보는 평가되지 않는다 | 05-sources-and-research.md |
| 모델을 바꾼 직후 보내면 이전 티어로 요청이 갈 수 있다 (`handleSendMessage` 의존성에 `selectedTier` 없음, 의심) | 모델 선택 무시 | 02-ai-chat.md |
| 스트림이 `done` 없이 끊겨도 완료로 표시하고, 백엔드는 `stop_reason` 을 보지 않는다 | 잘린 답이 완료처럼 보인다 | 02-ai-chat.md |
| 스트림 중 Anthropic 실패 시 부분 답 뒤에 대체 답을 이어 붙인다 (기사 Ask AI) | 답이 섞여 보인다 | 01-news-feed.md |
| 검색어 한 글자마다 피드를 다시 부르고 페이지를 1로 돌리지 않는다 | 2페이지 이상에서 검색하면 빈 결과 | 01-news-feed.md |
| GitHub 저장소 id(`owner/repo`)를 경로 한 구간으로 받는다 (의심) | 저장소 토글·삭제가 404 | api.md |
| `llm_processor.last_usage` 를 요청끼리 공유한다 | 동시 요청의 토큰 사용량이 섞인다 | 02-ai-chat.md |
| 평가 캐시가 만료되지 않고 초기화해도 남는다 | 한 번 거부된 제목은 재시작 전까지 계속 거부 | 03-collection.md |
| 크롤 로그가 항상 `success` 이고 `error_message` 를 채우지 않는다 | 소스별 실패를 볼 수 없다 | 03-collection.md, data-model.md |
| LLM 평가가 시사점(`why_it_matters`)을 주지 않으면 backend 가 카테고리별 고정 문장(`CATEGORY_INSIGHTS`, 기술 이름이 있으면 `{기술} 기반 구현에서 ` 를 앞에 붙임)을 저장한다 (`backend/app/services/llm_processor.py:84-89,703-709`) | 같은 문장이 여러 기사의 카드·상세·챗 출처에 반복된다. 피드 카드는 목록에서 반복되는 시사점이면 요약을 대신 보여 완화하지만 상세·챗·브리핑에는 그대로 나온다 | 03-collection.md, 01-news-feed.md |
| 수집기가 `raw_score` 에 원천 지표가 아닌 값을 넣는다: RSS 는 국내 180·그 밖 150 고정(`backend/app/collectors/sources/rss.py:75`), arXiv 는 120 고정(`arxiv.py:48`), HuggingFace 는 `numComments + 40`(`huggingface.py:33`), GitHub 저장소 목록 폴백은 `stars_hint`(기본 5000, `github.py:61-69`)와 포크 수 `int(stars × 0.12)`(`github.py:70`). 인기 점수(`calculate_hotness`)는 `min(100, hotness × 8)` 로 포화한다(`backend/app/collectors/categorizer.py:147`, 2026-11-07 DB 4734건 중 1034건이 100, `rss_kr` 459건 중 373건이 100). 첫 화면 카드의 상대 시간이 모두 같은 값으로 보이는 것은 원인을 확인하지 않았다 (의심) | 카드는 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`)만 `raw_score` 와 인기 점수를 그려 합성 값을 숨긴다. 지표 소스에서도 인기 점수가 포화하면 100 으로 같게 보이고, `추천순`(`raw_score`)·`인기순`(`hotness_score`) 정렬이 합성 값에 좌우된다. 폴백 `stars_hint` 와 합성 포크 수는 실제 값과 구별되지 않아 `스타`·`포크` 로 보인다 | 01-news-feed.md, 03-collection.md |
| 브리핑 헤드라인과 분야 요약을 글자 수로 잘라 단어 중간에서 끊는다: 헤드라인은 첫 항목 제목을 40자(`backend/app/services/briefing_service.py:101-102`), 분야 요약은 제목 45자·요약 90자(`:86`, `:88`)에서 자르고 `...` 를 붙인다 (예: `…persistent p...`). 원인은 backend 가 만드는 문자열이고, 프론트는 받은 글자를 자르지 않고 그린다 | 요약 바·브리핑 대화상자 설명·분야 요약·마크다운 전문·Notion·이메일 본문에 단어가 잘린 문장이 보인다. 프론트 범위 밖이라 backend 에서 단어 경계로 자르거나 자르지 않게 따로 고친다 | 04-briefing-and-sharing.md |

## 설정과 코드 불일치
| 문제 | 문서 |
|---|---|
| 스케줄 시각이 코드에 고정돼 `crawl_hours`·`timezone`·`auto_dispatch_hour`·`auto_briefing_hour` 가 동작에 쓰이지 않는다 | 03-collection.md, operations.md |
| 읽는 코드가 없는 설정: `scheduler.enabled`, `LLM_PROVIDER`, `crawler.*`, `CHAT_*` 5개, `CORS_ORIGINS`, `SCRAPER_TIMEOUT_SECONDS`, `auto_alert_high_signal`, `auto_dispatch_daily_briefing`, `ANTHROPIC_COLLECTION_MODEL`, `category_hint` | data-model.md, operations.md |
| 하이시그널 임계값 기본값이 7.8(`config.py`)과 7.0(`config.json`, `llm_processor`)으로 다르다 | 03-collection.md, data-model.md |
| 화면 문구와 실제 동작이 다르다: Ask AI 의 "Gemini" 표기, 딥 리서치 "LLM 평가"(실제는 키워드 규칙), 3줄 요약(실제는 규칙 기반), 챗 Notion 동기화(모의 동작) | 01-news-feed.md, 05-sources-and-research.md, 02-ai-chat.md |
| RSS 채널 링크가 3000 포트 고정, 프론트는 3001 | api.md |

## 계약 (backend ↔ zod ↔ MSW)
| 문제 | 문서 |
|---|---|
| 오류 형식이 4가지(`detail`, 422, `error_code`, 전역 500)로 섞여 있고, MSW 는 모두 `error_code` 로 흉내 낸다 | api.md |
| MSW 에만 있는 경로 `GET /api/chat/stream`, MSW 에만 있는 단계 `evaluating_sufficiency`·`agentic_searching`·보충 출처 `[S1]` | api.md, 02-ai-chat.md |
| global 모드에서 백엔드는 `sources` 를 토큰 뒤에 보내고 MSW 는 앞에 보낸다 | api.md |
| zod 에 없는 필드(`ChatSourceDetailResponse.full_content`·`scraped_at`), 백엔드가 안 보내는 필드(`NewsItemSchema` 의 같은 두 필드) | api.md, data-model.md |
| 백엔드가 쓰는 오류 코드 `ERR_INVALID_PAYLOAD`·`ERR_RETRIEVER_INDEX_ERROR` 가 zod 에 없다. `ERR_CLAUDE_API_KEY_MISSING` 은 실제 401 | api.md |
| 잘못된 `model_tier` 가 백엔드에서 500 이 된다 (MSW 는 400) | api.md, 02-ai-chat.md |
| 프론트는 테스트 밖에서 zod `parse` 를 하지 않아 위 불일치가 런타임에 드러나지 않는다 | api.md |

## UI·접근성
| 문제 | 영향 | 문서 |
|---|---|---|
| backend 브리핑 분야 이름과 이모지 아이콘(`CATEGORY_DEFS`, `backend/app/services/briefing_service.py:16-38`: `MCP & 도구·스킬 생태계`, `에이전트 아키텍처 & 런타임`, `최신 AI 소식 & 프론티어 모델` 등)이 프론트 긴 라벨(`frontend/src/lib/labels.ts`, 피드 카테고리 칩과 같은 문구)과 다르다. 원인은 backend 문자열이다 | 브리핑 대화상자의 카테고리별 요약 탭은 긴 라벨과 lucide 아이콘으로 바꿔 그리지만, 마크다운 전문 탭·Notion 페이지·이메일 본문에는 backend 이름과 이모지(`notion_service.py:79`, `email_service.py:120` 의 `📌` 포함)가 남는다. 프론트 범위 밖이라 backend 에서 이름을 긴 라벨과 맞추고 이모지를 빼는 일은 따로 한다 | 04-briefing-and-sharing.md |
| 챗 진행 단계 라벨(SSE `status` 이벤트의 `label`)에 그림 이모지가 들어 있다 (`backend/app/services/chat_service.py:614`, `:635`, `:678`, `:693`, `:715`, `:734`). 원인은 backend 문자열이다 | 프론트가 정한 UI 글자에는 그림 이모지를 쓰지 않지만(아이콘은 lucide), 답변 생성 중 진행 표시(`WorkflowStepTracker`)에는 backend 라벨의 이모지가 그대로 보인다. 프론트 범위 밖이라 backend 에서 따로 고친다 | 02-ai-chat.md |

## 테스트·운영
| 문제 | 문서 |
|---|---|
| 챗 헤더에서 모델 선택을 뺀 뒤에도 `ChatModelSelector` 의 `header-chip`·`header-compact` 변형(`frontend/src/components/chat/ChatModelSelector.tsx:13-14,93`)과 `ChatHeaderProps` 의 `selectedTier`·`onSelectTier`(`frontend/src/types/chat.ts:942-944`)가 남아 있다. `ContractAndMsw.test.ts:1017` 의 prop 호환 테스트는 컴포넌트가 받지 않는 필드를 단언해, 통과해도 실제 호환을 보장하지 않는다 | 02-ai-chat.md, test-cases.md |
| 마이그레이션 도구가 없고 `ALTER TABLE` 실패를 조용히 삼킨다 | data-model.md |
| DB 경로가 cwd 기준이라 루트와 `backend/` 에 `agentlens.db` 가 둘 있다. MCP 서버는 스키마를 만들지 않는다 | data-model.md, 06-mcp-server.md |
| 수집 중복 실행 방지 플래그가 프로세스 메모리에만 있어 MCP 서버와 공유되지 않는다 | 03-collection.md, 06-mcp-server.md |
| `NEXT_PUBLIC_API_URL` 을 Docker 빌드 단계에서 넘기지 않는다 (의심: 브라우저가 `{host}:8000` 으로 붙는다) | operations.md, ui-spec.md |

## 쓰이지 않는 코드
- 프론트: `WebhookSettingsModal`, `ThemeToggle`(테스트만 쓴다), `src/lib/env.ts`, api 함수 `askQuestionAboutNews`·`deleteAllNews`·`discoverSources`·`registerCandidate`·`sendBriefingToWebhook`, 타입 `DailyBriefingSchema`, localStorage 키 `agentlens_webhook_url`, 넘기는 화면이 없는 prop `HotkeyListener` 의 `onCloseOverlays`·`onToggleCommandPalette`·`customHotkeys` 와 `NewsCard`·`NewsDetailModal` 의 `onHandoverToChat`
- 백엔드: `AgenticSearchService`(만들기만 하고 부르지 않음), `generate_structured_summary`, UI 가 부르지 않는 API `/api/chat/query`, `/api/chat/search`, `/api/research/discover`, `/api/research/register-candidate`, `POST /api/sources/github`, `/api/mcp/info`, `/api/webhook/send-briefing`, `/api/briefing/generate`, `GET /api/news/{id}`, `POST /api/news/{id}/ask`, `DELETE /api/news/all`
