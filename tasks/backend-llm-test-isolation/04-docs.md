# Task 04: 통합 문서 반영

Feature: backend-llm-test-isolation · Plan: docs/features/backend-llm-test-isolation/plan.md 작업 순서 04
Status: done
Session: main
Agent: aa1bf34d8feb5e21c (implementer)
Updated: 2026-11-08

## 한 일
plan '변경 파일' 의 문서 8개를 지금 코드(단계 3 커밋 `fefa8db`)대로 고쳤다. 해석 함수 이름은 바뀐 이름(`_resolve_openai_chat_model`, `_resolve_ollama_generate_model`)을 썼다.

- `docs/tech-spec.md`
  - '공통 규칙' 의 '외부 연동': 가용 판정(Ollama 는 `/api/tags` 200 이고 설정 모델이 설치돼 있어야 함, 태그를 생략하면 `:latest`), 해석 함수 4개, 503 판정 이유는 로그에만 남음
  - '변경 이력' 에 한 줄 추가
  - '설정' 문장은 그대로 뒀다.
- `docs/operations.md`
  - 'make 타깃' 아래 `make check` 설명: LLM 은 흉내가 답하고, 설정 파일은 세션 사본을 쓰며, 남은 외부 호출을 적었다.
  - '설정 우선순위': 호출 때마다 `config.json` 을 다시 읽는 문장의 근거를 해석 함수 `llm_processor.py:129-169` 로 바꾸고, 원천 순서와 덮어쓰기 규칙을 적었다.
  - Settings 필드 표: `OPENAI_API_KEY`·`OPENAI_MODEL`·`OLLAMA_BASE_URL`·`OLLAMA_MODEL` 의 사용 위치를 해석 함수와 그 함수를 쓰는 곳으로 바꿨다.
  - 외부 의존 표: OpenAI 행, Ollama 행 (`/api/tags` 와 설정 모델, `_ollama_status`)
  - 문제 해결 표의 503 행: 설정 모델 미설치, WARNING 로그, `curl $OLLAMA_BASE_URL/api/tags` 로 `models[].name` 을 확인
  - '알려진 불일치·위험'
    - '테스트가 운영 설정 파일을 쓴다' 항목을 지웠다 (이제 사실이 아님).
    - '동기 네트워크 호출' 의 근거 줄을 고쳤다.
  - 나머지 `llm_processor.py`·`sources_service.py` 근거 줄 번호를 다시 쟀다.
- `docs/functional-spec/02-ai-chat.md`
  - CHAT-22 처리 규칙 1 (사전 가용성): 해석 함수, 설정 모델 설치 확인, 판정 이유 로그
  - CHAT-22 처리 규칙 4: Ollama 모델
  - 상수 표의 Ollama 행: `qwen2.5:latest` 를 지우고 가용 기준을 넣었다.
  - 위험 7 의 근거 줄, 그 밖의 근거 줄 번호
- `docs/functional-spec/03-collection.md`
  - COLL-09 처리 규칙 4 (평가 가용성): '`/api/tags` 1초 내 200' 에 설정 모델 설치 조건을 더했다.
  - COLL-22 처리 규칙 1·6·7·9: OpenAI 키·모델, Ollama 주소·모델 해석, 판정 이유
  - COLL-23 예외·엣지: 테스트에서 실제 LLM 호출을 막는 것은 하네스다.
  - 상수 표의 Ollama 두 행
  - '알려진 불일치·위험'
    - '테스트 격리 부재' 를 지웠다 (known-issues 에서 지운 행과 같은 문제).
    - '이벤트 루프 블로킹' 의 근거 줄을 고쳤다.
  - 그 밖의 근거 줄 번호
- `docs/api.md`
  - 503 설명 두 곳에 Ollama 설정 모델 미설치를 넣었다: `/api/chat/query` 오류 표, `/api/chat/stream` 사전 검사 표.
  - 근거 줄 번호를 다시 쟀다.
- `docs/test-strategy.md`
  - 테스트 수를 `파일 17개, 테스트 174개` 로 고쳤다.
  - 'DB 격리' 옆에 넷을 더했다: LLM 격리, LLM 흉내, 프로바이더 조건 조절, 설정 파일 격리.
  - '외부 호출과 파일 부작용' 절을 다시 썼다: LLM 은 흉내가 답하거나 가드가 막고, 남은 외부 호출은 스크래퍼·Notion·SMTP 이며, 설정 파일은 세션 사본이다. '격리 방식은 정하지 않았다 … 되돌린다' 문장은 지웠다.
- `docs/test-cases.md`
  - 머리 표: backend 17개 파일·174개
  - 표기 '키 있으면' 을 '흉내 Claude' 로 바꿨다.
  - conftest 절에 fixture 4개 추가: `settings_file_copies`, `llm_isolation`, `fake_llm`, `llm_sources`
  - 새 절 `test_llm_provider_isolation.py (14)` 에 14행
  - anti-gemini 두 행에서 '로컬 Ollama 탐침 가능' 을 지웠다.
  - 테스트 목록에서 LLM·설정 파일 행들: 3-tier 2개, ask 2개, strict_gate, fallback_and_answer, answer_question, fails_fast, chat_stream e2e, briefing settings, sources 3개
  - 외부 호출 판정 표에서 LLM 판정이 바뀐 행들
  - '알려진 불일치·위험'
    - '테스트가 저장소 파일을 고친다' 절을 '테스트가 쓰는 설정 파일' 로 바꿨다.
    - '실행 환경에 따라 실패' 의 LLM 항목과 '효과가 없는 patch' 의 `ollama_url` 항목을 고쳤다.
- `docs/known-issues.md`: '테스트·운영' 에서 plan 이 정한 세 행을 지웠다.
  - 설정 파일 수정
  - pytest 중 실제 LLM 호출
  - backend 테스트 8개가 실행 환경에 따라 바뀜
- 근거 줄 재매핑
  - `llm_processor.py`: `git show main:backend/app/services/llm_processor.py` 와 지금 파일을 `difflib` 로 맞춰 옛 줄 번호를 새 줄 번호로 바꿨다. 바뀐 영역에 걸린 번호는 손으로 정했다.
  - `sources_service.py`: 29줄 이후 번호를 +1 했다.
  - 대상은 이 8개 문서 안의 `llm_processor.py:`·`sources_service.py:` 참조뿐이다.

## 바꾼 파일
- `docs/tech-spec.md`
- `docs/operations.md`
- `docs/functional-spec/02-ai-chat.md`
- `docs/functional-spec/03-collection.md`
- `docs/api.md`
- `docs/test-strategy.md`
- `docs/test-cases.md`
- `docs/known-issues.md`

## 검사 결과
```
$ grep -c '로컬 Ollama 탐침 가능' docs/test-cases.md
0
$ grep -c '테스트가 git 이 추적하는 루트' docs/known-issues.md
0
$ grep -c '수집 게이트와 Ask AI 는 테스트 환경 판정을 보지 않아' docs/known-issues.md
0
$ grep -c 'backend 테스트 8개의 결과가' docs/known-issues.md
0
$ grep -rn 'qwen2.5' docs/operations.md docs/functional-spec/02-ai-chat.md docs/functional-spec/03-collection.md docs/api.md docs/test-cases.md docs/test-strategy.md docs/tech-spec.md
(출력 없음)
$ cd backend && ../.venv/bin/pytest --collect-only -q tests/ | tail -1
174 tests collected in 0.17s
```
- 이 단계 커밋은 문서 8개와 이 task 파일만 바꾼다.

## 결정
- plan 이 '근거 줄 번호는 단계 3 뒤 코드로 다시 잰다' 고 해서, 이 8개 문서 안에서 줄 번호가 밀린 근거 참조는 모두 다시 쟀다. plan 이 짚은 절 밖이어도 같은 문서 안이면 고쳤다.
- 아래 두 항목은 지웠다. known-issues 에서 지운 행과 같은 문제를 상세 문서에 적은 것이고, 지금 코드에서는 사실이 아니다.
  - operations.md '테스트가 운영 설정 파일을 쓴다'
  - 03-collection.md '테스트 격리 부재'

## 막힌 점
- 없음. plan 밖이라 손대지 않은 것은 아래 '다음' 에 적었다.

## 후속 (2026-11-08 plan 보충 52d8267)
### 한 일
- `docs/known-issues.md`: 36줄 부근 'Ollama 가용성 판정(`has_live_provider`)이 `/api/tags` 200 만 보고 …' 행을 지웠다 (원인 2 를 고침).
- `docs/data-model.md`
  - 294줄 부근 '테스트 DB' 문단, 436·437줄 부근 '알려진 불일치' 두 항목을 지금 동작으로 고쳤다.
  - 고친 내용
    - 하네스가 LLM 환경 변수를 지우고 `settings` LLM 필드를 고정한다.
    - `env_file` 을 끄므로 `settings.reload()` 가 `.env` 를 다시 읽지 않는다.
    - `config.json`·`sources.json` 은 세션 임시 사본을 쓰고, 원본은 읽기만 한다.
    - 테스트의 설정 저장은 사본으로 간다.
  - 테스트 DB 를 실행 사이에 지우지 않는다는 서술은 그대로 뒀다.
  - 근거는 지금 `conftest.py` 줄로 적었다.
- 근거 줄 번호를 지금 코드에 맞췄다.
  - 대상: `docs/data-model.md`, `docs/functional-spec/01-news-feed.md`, `docs/functional-spec/05-sources-and-research.md`
  - 서술도 고친 곳
    - data-model `llm.openai_*`·`llm.ollama_*` 네 행: 해석 함수를 가리키게 바꾸고, `qwen2.5:latest` 스트리밍 폴백 서술을 지웠다.
    - data-model 저장 서술, 05 '사본 동기화 경로' 행: 거울 경로 `SourcesService._mirror_path`(`sources_service.py:29`)를 넣었다.
- 세 문서의 Updated 를 2026-11-08 로 바꿨다.

### 확인한 곳 수
- `grep -cE "(llm_processor|sources_service)\.py:[0-9]"` 줄 수: `docs/data-model.md` 22, `docs/functional-spec/01-news-feed.md` 6, `docs/functional-spec/05-sources-and-research.md` 13. 모두 41줄.
- 그 41줄 안의 참조는 코드 스팬 52개, 줄 번호·범위 61개다. 코드 스팬 수에는 같은 파일을 잇는 `` `:NN` `` 표기를 넣었다.
- 61개 모두 지금 `llm_processor.py`·`sources_service.py` 의 해당 줄을 열어, 범위의 첫 줄·끝 줄이 서술과 맞는지 하나씩 확인했다.
  - 옛 줄 번호는 `git show main:<파일>` 과 지금 파일을 `difflib` 로 맞춰 옮겼다.
  - 바뀐 영역에 걸린 6곳은 해석 함수로 손으로 바꿨다: data-model 의 `llm.openai_api_key`, `llm.openai_model`, `llm.ollama_base_url`, `llm.ollama_model` 행.
- 새로 넣은 `tests/conftest.py` 참조 6개도 확인했다: `13-44`, `162-180`, `196-198`, `200-209`, `201`, `204-205`.
- data-model 의 기존 `tests/conftest.py` 참조(`:6-7`, `:15`, `:17-43`)는 줄이 밀리지 않아 그대로다.

### 검사 결과
```
$ grep -n '/api/tags` 200 만 보고' docs/known-issues.md
(출력 없음)
$ grep -nE "루트 config\.json·\`\.env\` 를 그대로 읽는다|테스트가 루트 config\.json 을 덮어쓴다|테스트는 실제 루트 \`config\.json\` 과 \`\.env\` 를 읽는다" docs/data-model.md
(출력 없음)
$ grep -cE "(llm_processor|sources_service)\.py:[0-9]" docs/data-model.md docs/functional-spec/01-news-feed.md docs/functional-spec/05-sources-and-research.md
docs/data-model.md:22
docs/functional-spec/05-sources-and-research.md:13
docs/functional-spec/01-news-feed.md:6
$ grep -n "qwen" docs/data-model.md
(출력 없음)
```

## 다음
- 후속으로 아래 '메인 세션이 판단할 것' 세 항목은 처리됐다 (위 '후속').
- 메인 세션이 판단할 것 (plan 밖이라 고치지 않음, 후속 전 기록)
  - `docs/known-issues.md` 36줄 'Ollama 가용성 판정이 `/api/tags` 200 만 보고 설정 모델을 보지 않는다' 행
    - 이 기능이 고친 문제다 (원인 2).
    - plan 의 삭제 목록에 없어 지시대로 남겼다.
  - `docs/data-model.md` 294·436·437줄은 이제 사실과 다르다.
    - 내용: '테스트가 루트 config.json·.env 를 읽는다', '테스트가 루트 config.json 을 덮어쓴다'
    - 지운 known-issues 의 설정 파일 행도 이 문서를 가리켰다.
  - 8개 문서 밖에서 근거 줄이 밀린 곳이 있다. 이 문서들의 기능 동작은 바뀌지 않았다.
    - `docs/data-model.md`: `llm_processor.py`·`sources_service.py` 참조 22곳
    - `docs/functional-spec/01-news-feed.md`: 6곳
    - `docs/functional-spec/05-sources-and-research.md`: 13곳
- 루트 `CLAUDE.md` '명령' 절 (메인 세션)
  - 바꿀 문장: "`make check` 는 `.env` 의 LLM 키로 외부 호출을 하고, backend 테스트가 git 이 추적하는 루트 `config.json`·`sources.json` 을 고친다 (격리는 미정, `docs/test-strategy.md`). 돌린 뒤 `git status` 로 확인하고 되돌린다."
  - 바꿀 사실
    - LLM 호출은 `backend/tests/conftest.py` 의 흉내가 답한다.
    - 설정 파일은 세션 임시 사본을 쓴다.
    - 남은 외부 호출은 스크래퍼(github.com 등)·api.notion.com·SMTP 다.
- 그 뒤 `/verify-change backend-llm-test-isolation` (R11 실제 Claude 스모크 포함).
