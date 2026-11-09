# Verify: backend LLM 호출 정상화와 실행 환경에 의존하지 않는 `make check`

Plan: ./plan.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-08)
Commit: fd08630

## 검사 명령
- `make check` → 종료 코드 0 (메인 세션 실행과 verifier 재실행 같은 결과. 로컬 Ollama 가 실행 중이고 `.env` 에 Anthropic 키가 있는 이 맥 그대로)
  - backend `174 passed in 7.22s`
  - frontend vitest `Test Files 52 passed (52)`, `Tests 649 passed (649)`
  - eslint `0 errors, 41 warnings` (기존 unused-vars)
  - `tsc --noEmit` 출력 없음
- 출력 마지막 20줄:
```
  7:8   warning  'DeleteConfirmPopover' is defined but never used  @typescript-eslint/no-unused-vars
  8:8   warning  'SessionList' is defined but never used           @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/ChatWorkspace.test.tsx
  440:85  warning  'init' is defined but never used  @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/ContractAndMsw.test.ts
   5:3  warning  'ChatQueryRequestSchema' is defined but never used  @typescript-eslint/no-unused-vars
  27:3  warning  'ChatMessage' is defined but never used             @typescript-eslint/no-unused-vars
  28:3  warning  'Message' is defined but never used                 @typescript-eslint/no-unused-vars
  29:3  warning  'MessageSchema' is defined but never used           @typescript-eslint/no-unused-vars
  30:3  warning  'SendMessageRequest' is defined but never used      @typescript-eslint/no-unused-vars
  41:3  warning  'ModelTier' is defined but never used               @typescript-eslint/no-unused-vars
  42:3  warning  'ChatModel' is defined but never used               @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/WorkflowStepTracker.test.tsx
  2:32  warning  'vi' is defined but never used  @typescript-eslint/no-unused-vars

✖ 41 problems (0 errors, 41 warnings)
```
- 고치기 전 (HEAD a6526b4, 같은 맥): `make check` 종료 2. backend 에서 `test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens` 가 `LLMUpstreamException` 으로 실패했다(`2 failed, 158 passed`). 실행 뒤 `sources.json`·`backend/app/config/sources.json` 이 바뀌었다.

## 증명 항목 (verifier 판정)
| 증명 항목 | 결과 | 근거 (명령, 출력) |
|---|---|---|
| 1. R7 환경 조건 C1~C6 | 통과 | `backend/` 에서 명령 줄 환경 변수로만 조건을 만들었다(Ollama 끄기·모델 설치·`.env` 수정 없음). C1 그대로 `174 passed in 7.21s`, C2 `OLLAMA_BASE_URL=http://127.0.0.1:9` `174 passed`, C3 `OLLAMA_MODEL=gpt-oss:20b` `174 passed`, C4 `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9` `174 passed`, C5 `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_MODEL=gpt-oss:20b` `174 passed`, C6 `ANTHROPIC_API_KEY= OPENAI_API_KEY=sk-test-dummy` `174 passed`. 모두 rc=0 |
| 1. C1 `make check` | 통과 | `make rc=0` (위 검사 명령) |
| 2. R9 설정 파일 불변 | 통과 | C1~C6, `make check`, 스모크, uvicorn 뒤 모두 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 출력 없음. 되돌린 파일 없음 |
| 3. R1 설정을 읽는 곳 | 통과 | grep 결과 15줄이 모두 `__init__`(113~127)과 해석 함수 4개(129~169) 안 |
| 4. R3 `qwen2.5` 0건 | 통과 | `grep -c qwen2.5 backend/app/services/llm_processor.py` → `0` |
| 5. R5 Claude 경로 불변 | 통과 | `anthropic_provider.py` diff 0줄 (main·a6526b4 기준), Anthropic 블록 비교 `True 4`, `test_anthropic_provider.py` 모두 통과 |
| 6. R8 기존 테스트 불변 | 통과 | `git diff --name-status main -- backend/tests/` 는 `M conftest.py`, `A llm_fakes.py`, `A test_llm_provider_isolation.py` 세 줄, 그 밖 diff 0줄. 단계 1 테스트 파일은 89dc2ad 뒤 diff 0줄. 실패하던 세 테스트는 C1~C6 각각 `3 passed` |
| 7. 회귀 테스트 | 통과 | `tests/test_llm_provider_isolation.py` `14 passed in 1.07s`. 89dc2ad 를 따로 풀어 돌리면 `6 failed, 8 passed` 이고, 실패 이유는 모두 코드 결함(판정·주소·모델 해석·덮어쓰기 순서)이다 |
| 8. R11 실제 Claude 스모크 | 통과 | `generate_live_answer` → `'OK' claude-haiku-5-5`, `stream_tokens` → `'OK' claude-haiku-5-5`, uvicorn :18765 `Application startup complete.`·`/health` 200, 확인 뒤 서버 종료 |
| 9. R12 탐침 1회·1.0초 | 통과 | `test_ollama_probe_is_single_request_with_1s_timeout` 통과, `_ollama_status` 가 `httpx.Client(timeout=1.0)` 로 `/api/tags` 한 번(`llm_processor.py:177-178`). Anthropic 키가 있으면 탐침 0회(T1·T2) |

verifier 종합: 통과 (실패·미검증 없음).

편차 (판정은 바꾸지 않음):
- OpenAI·Ollama 모델 해석 함수 이름이 plan 과 다르다: `_resolve_openai_chat_model`(`llm_processor.py:141`), `_resolve_ollama_generate_model`(`:162`). plan 이름은 증명 3 grep 패턴에 걸려 글자 그대로 통과할 수 없어 바꿨다. 동작·원천 순서는 plan 과 같다.
- 단계 1 의 API stream 테스트는 plan 예상(502)과 달리 200 으로 실패했다. 사전 판정이 True 여서 스트림이 열린 뒤 오류가 났다. 결함은 같고 단언(503)은 바뀌지 않았다.
- openai SDK 가 `httpx2` 전송을 써서 흉내 전송 계층이 `httpx2` 도 감싼다. `httpx2` 는 openai 가 원래 의존하는 패키지다.

## plan 범위 밖 변경
- 없음. `a6526b4..HEAD` 의 변경은 모두 plan '변경 파일' 목록 안이거나 SDLC 산출물(plan.md, tasks/*)이다.
- plan 4단계가 메인 세션 몫으로 정한 루트 `CLAUDE.md` '명령' 절 문장("`make check` 는 `.env` 의 LLM 키로 외부 호출을 하고 … 격리는 미정 … 돌린 뒤 `git status` 로 확인하고 되돌린다")은 고치지 않았다. 사용자가 이전에 CLAUDE.md 를 지시 없이 고치지 말라고 했기 때문이다. 이 문장은 지금 동작과 맞지 않는다.

## 남은 위험
- 스크래퍼(github.com 등)·Notion·SMTP 는 테스트에서 여전히 실제 외부 호출을 한다. 네트워크가 끊긴 환경에서는 `make check` 결과가 달라질 수 있다 (spec 우려 4, 이번 검증은 네트워크가 되는 상태).
- `make check` 는 실제 Claude API 를 부르지 않으므로 API 형식 변경·키 만료는 R11 스모크를 손으로 돌릴 때만 잡힌다 (spec 우려 1).
- 두 anti-gemini 테스트는 하네스(환경 변수 제거, `config.json` 사본) 덕분에 통과한다. 하네스 밖에서 설정 원천을 새로 읽는 테스트가 생기면 가드가 테스트 실패로 드러낸다 (spec 우려 2).
- 잘못된 OpenAI 키만 있는 환경은 여전히 502 다 (spec 우려 6, 범위 밖).
- 테스트 DB 는 실행 사이에 지우지 않는다 (범위 밖).
