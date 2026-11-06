# 테스트 전략: AgentLens

Updated: 2026-11-06

## 검사 명령
- 전체: `make check` (아래 둘을 차례로 돈다. 하나라도 실패하면 0 이 아닌 값으로 끝난다)
- backend: `cd backend && ../.venv/bin/pytest -v tests/` (`backend/pytest.ini`: `asyncio_mode = auto`, `pythonpath = .`)
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` (vitest run, eslint, 타입 검사)
- backend 용 lint·typecheck 명령은 없다 (미정).
- `make test`, `make dev` 는 지워진 `scripts/` 를 가리켜 동작하지 않는다.

## 테스트 종류
| 종류 | 대상 | 위치 | 언제 돈다 |
|---|---|---|---|
| 단위 | backend API·서비스·수집기 | `backend/tests/test_*.py` (파일 16개, 테스트 160개, `conftest.py` 별도) | 매 변경 |
| 단위 | frontend 컴포넌트·훅 (vitest, jsdom, MSW) | `frontend/src/tests/**/*.test.ts(x)` (파일 24개, 테스트 241개, 설정 `frontend/src/tests/setup.ts`) | 매 변경 |
| 계약 | zod 스키마 ↔ MSW 핸들러 | `frontend/src/tests/chat/ContractAndMsw.test.ts` | 계약 변경 시 (`make check` 에 포함) |
| 통합·회귀 | 두 앱을 함께 | 없음 | 릴리스 전 (아래 미정) |

- DB 격리: `backend/tests/conftest.py` 가 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고 스키마를 만든다. 데이터는 지우지 않아 실행할 때마다 쌓인다. 개발 DB `agentlens.db` 는 쓰지 않는다.
- 테스트 목록과 영역별 커버리지는 `test-cases.md`.
- frontend 는 `frontend/src/mocks/server.ts` 의 MSW 로 backend 를 대신한다.
- E2E 테스트는 없다.

## 외부 호출과 파일 부작용
`make check` 의 backend 테스트는 아래 외부 호출과 파일 수정을 한다 (2026-11-06 코드로 판정, 근거는 `test-cases.md` 의 '외부 호출 판정').
- `backend/app/config.py` 가 `.env`, `backend/.env` 를 읽는다. 키가 있으면 LLM 호출이 실제로 나간다.
- `llm_processor.is_test_environment()` 는 pytest 중 True 지만, 막는 호출은 챗 ReAct 플래너 하나뿐이다. 답변 생성·스트리밍·수집 평가는 이 값을 보지 않는다.
- `conftest.py` 는 `DATABASE_URL` 만 바꾸고 `TESTING`·`CI` 설정이나 키 제거를 하지 않는다.
- 외부 호출하는 테스트: 3-tier 챗 2개와 `/ask`·`/ask/stream`(키가 있으면 Anthropic), scoped 챗 4개(스크래퍼가 github.com·example.com GET), `test_probe_and_discover_feed_github`·`test_source_researcher_inspect_url`·`test_deep_research_run_and_audit`(github.com 등), `test_notion_export_page_mock`(api.notion.com), `test_email_api_endpoints`(`config.json` 의 SMTP 호스트 연결 시도).
- git 이 추적하는 파일을 고치는 테스트: `test_briefing_settings_get_and_post` 가 루트 `config.json` 을, `test_sources_toggle_and_crud`·`test_deep_research_run_and_audit` 가 루트 `sources.json` 을 고친다.
- 격리 방식(`TESTING=1` 강제, 키 제거, pytest 마커 분리, 설정 파일 임시 경로)은 정하지 않았다. 그때까지 테스트를 돌린 뒤 `git status` 로 `config.json`·`sources.json` 변경을 확인하고 되돌린다.

## 통과 기준
- `make check` 종료 코드 0
- 버그 수정은 먼저 실패하던 테스트가 통과한다
- 계약을 바꿨으면 `ContractAndMsw.test.ts` 가 바뀐 계약으로 통과한다

## 고위험 영역의 추가 검사
- 지정한 고위험 영역이 없다.

## 릴리스 전 통합·회귀 검증
- `make check` 가 통과한다.
- 버전 문자열이 모두 새 버전인지 확인한다: `git grep -n '<새 버전>'` 로 `docs/releases.md` 의 '버전 문자열 위치' 를 대조한다.
- 두 앱을 함께 띄우는 통합 검사는 정하지 않았다. 하려면 `make docker-up` 후 `curl -f http://127.0.0.1:8000/health` 와 `wget -qO- http://127.0.0.1:3001/api/health` (compose healthcheck 와 같은 명령) 를 쓸 수 있다.
