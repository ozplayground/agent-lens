# 알려진 문제: AgentLens

Updated: 2026-11-06

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
| Docker 가 `config.json` 을 읽기 전용(`:ro`)으로 마운트한다 | Docker 에서 설정 저장이 500 | operations.md, api.md |
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

## 설정과 코드 불일치
| 문제 | 문서 |
|---|---|
| 스케줄 시각이 코드에 고정돼 `crawl_hours`·`timezone`·`auto_dispatch_hour`·`auto_briefing_hour` 가 동작에 쓰이지 않는다 | 03-collection.md, operations.md |
| 읽는 코드가 없는 설정: `scheduler.enabled`, `LLM_PROVIDER`, `crawler.*`, `CHAT_*` 5개, `CORS_ORIGINS`, `SCRAPER_TIMEOUT_SECONDS`, `auto_alert_high_signal`, `auto_dispatch_daily_briefing`, `ANTHROPIC_COLLECTION_MODEL`, `category_hint` | data-model.md, operations.md |
| 하이시그널 임계값 기본값이 7.8(`config.py`)과 7.0(`config.json`, `llm_processor`)으로 다르다 | 03-collection.md, data-model.md |
| 화면 문구와 실제 동작이 다르다: Ask AI 의 "Gemini" 표기, 딥 리서치 "LLM 평가"(실제는 키워드 규칙), 3줄 요약(실제는 규칙 기반), 챗 Notion 동기화(모의 동작) | 01-news-feed.md, 05-sources-and-research.md, 02-ai-chat.md |
| 헤더 버전이 `v0.1.0` 고정, 실제는 0.3.1 | 07-ui-common.md |
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
| 문제 | 문서 |
|---|---|
| 테마를 하드코딩 색 클래스와 `!important` 덮어쓰기로 바꾼다. `@custom-variant dark` 가 없어 `dark:` 는 OS 설정을 따른다 | 07-ui-common.md, ui-spec.md |
| `/` 에서 Enter·Space 를 항상 `preventDefault()` 해 버튼·링크 키보드 조작과 스페이스 스크롤을 막는다 | 07-ui-common.md |
| 모달이 열려 있어도 j/k/b/c/t 가 뒤의 피드에 먹고, Escape 가 모든 모달을 한꺼번에 닫는다 | 07-ui-common.md |
| 대부분의 모달에 `role="dialog"`·aria 라벨·포커스 트랩이 없다 | 07-ui-common.md |
| `animate-in` 류 클래스를 쓰지만 정의한 CSS·플러그인이 없다 | 07-ui-common.md |
| 뷰포트 확대를 막았다. 640px 미만에서 스케줄 버튼, 1024px 미만에서 챗 헤더 새 대화 버튼이 숨는다 | 07-ui-common.md |
| 헤더 버튼 9개가 두 줄로 넘치고, 모바일 첫 화면에 기사가 하나도 보이지 않는다 | ui-spec.md |

## 테스트·운영
| 문제 | 문서 |
|---|---|
| 테스트가 git 이 추적하는 루트 `config.json` 과 `sources.json` 을 고친다 (`config.json` 의 `test_notion_parent_page`, `team@example.com` 이 그 흔적) | data-model.md, test-cases.md |
| 수집 게이트와 Ask AI 는 테스트 환경 판정을 보지 않아, 키가 있으면 pytest 중에도 실제 LLM 을 부른다 | 03-collection.md, test-cases.md |
| 마이그레이션 도구가 없고 `ALTER TABLE` 실패를 조용히 삼킨다 | data-model.md |
| DB 경로가 cwd 기준이라 루트와 `backend/` 에 `agentlens.db` 가 둘 있다. MCP 서버는 스키마를 만들지 않는다 | data-model.md, 06-mcp-server.md |
| 수집 중복 실행 방지 플래그가 프로세스 메모리에만 있어 MCP 서버와 공유되지 않는다 | 03-collection.md, 06-mcp-server.md |
| `make dev`, `make test` 가 지워진 `scripts/` 를 가리킨다 | operations.md |
| `NEXT_PUBLIC_API_URL` 을 Docker 빌드 단계에서 넘기지 않는다 (의심: 브라우저가 `{host}:8000` 으로 붙는다) | operations.md, ui-spec.md |

## 쓰이지 않는 코드
- 프론트: `WebhookSettingsModal`, `src/lib/env.ts`, api 함수 `askQuestionAboutNews`·`deleteAllNews`·`discoverSources`·`registerCandidate`·`sendBriefingToWebhook`, 타입 `BriefingSettings`·`DailyBriefingSchema`, localStorage 키 `agentlens_webhook_url`
- 백엔드: `AgenticSearchService`(만들기만 하고 부르지 않음), `generate_structured_summary`, UI 가 부르지 않는 API `/api/chat/query`, `/api/chat/search`, `/api/research/discover`, `/api/research/register-candidate`, `POST /api/sources/github`, `/api/mcp/info`, `/api/webhook/send-briefing`, `/api/briefing/generate`, `GET /api/news/{id}`, `POST /api/news/{id}/ask`, `DELETE /api/news/all`
