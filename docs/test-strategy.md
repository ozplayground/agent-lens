# 테스트 전략: AgentLens

Updated: 2026-11-02

## 검사 명령
- 전체: `make check` (아래 둘을 차례로 돈다. 하나라도 실패하면 0 이 아닌 값으로 끝난다)
- backend: `cd backend && ../.venv/bin/pytest -v tests/` (`backend/pytest.ini`: `asyncio_mode = auto`, `pythonpath = .`)
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` (vitest run, eslint, 타입 검사)
- backend 용 lint·typecheck 명령은 없다 (미정).
- `make test`, `make dev` 는 지워진 `scripts/` 를 가리켜 동작하지 않는다.

## 테스트 종류
| 종류 | 대상 | 위치 | 언제 돈다 |
|---|---|---|---|
| 단위 | backend API·서비스·수집기 | `backend/tests/test_*.py` (16개, `conftest.py` 별도) | 매 변경 |
| 단위 | frontend 컴포넌트·훅 (vitest, jsdom, MSW) | `frontend/src/tests/**/*.test.ts(x)` (24개, 설정 `frontend/src/tests/setup.ts`) | 매 변경 |
| 계약 | zod 스키마 ↔ MSW 핸들러 | `frontend/src/tests/chat/ContractAndMsw.test.ts` | 계약 변경 시 (`make check` 에 포함) |
| 통합·회귀 | 두 앱을 함께 | 없음 | 릴리스 전 (아래 미정) |

- DB 격리: `backend/tests/conftest.py` 가 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고 테스트마다 스키마를 만든다. 개발 DB `agentlens.db` 는 쓰지 않는다.
- frontend 는 `frontend/src/mocks/server.ts` 의 MSW 로 backend 를 대신한다.
- E2E 테스트는 없다.

## 외부 호출 가능성 (미확정)
`make check` 를 돌리면 아래 테스트가 실제 외부 호출을 할 수 있다. 확인하지 않았다.
- `backend/app/config.py` 가 `.env`, `backend/.env` 를 자동으로 읽어 LLM 키가 설정될 수 있다.
- `llm_processor.is_test_environment()` 는 `TESTING`, `CI`, `pytest` 로드 여부로 테스트 환경을 판정한다. 이것이 모든 라이브 호출을 막는지는 확인하지 않았다.
- `backend/tests/test_config_and_live_llm.py` 는 mock 없이 `llm_processor.answer_question` 을 부른다.
- `backend/tests/test_deep_researcher.py`, `backend/tests/test_sources_and_research.py` 는 mock 없이 피드 탐색·URL 검사를 한다.
- `test_sources_toggle_and_crud` 가 `sources.json` 을 고칠 수 있다.
- 격리 방식(`TESTING=1` 강제, pytest 마커 분리)은 정하지 않았다.

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
