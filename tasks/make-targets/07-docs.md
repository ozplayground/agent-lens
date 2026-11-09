# Task 07: 통합 문서 반영

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 7
Status: done
Session: main (implementer A + main)
Agent: a590bd40f0795003d
Updated: 2026-11-09

## 한 일
- implementer A 몫: plan '변경 파일' 의 `docs/` 9개를 구현 결과(HEAD `f9394fd` 의 Makefile·scripts·main.py·sources_service.py·compose)대로 고쳤다. 근거 줄 번호는 지금 코드로 다시 쟀다 (main.py 는 lifespan 변경으로 21줄, sources_service.py 는 110행 뒤로 9줄 밀렸다).
- 메인 세션 판정 1(레시피 실패 때 make 종료 2)과 docker-logs 의 130 처리(커밋 `f9394fd`)를 `docs/operations.md` 에 넣었다.
- 루트 `CLAUDE.md` 는 메인 세션이 이미 고쳤다(`d0f9ee7`). 손대지 않았다.
## 바꾼 파일
- `docs/operations.md` — 'Makefile 타깃' 표 12행(모두 동작, 근거 줄 새로), 변수 표, make 종료 2·Ctrl-C 서술, 새 절 '로컬 동시 실행 (`make dev`)', backend 시작 순서(첫 수집 백그라운드), compose 볼륨 `:rw`, 스케줄 '시작 시 동작', 새 절 '수집 실행 (`make collect`)', '파괴적 작업' 의 reset·clean·`down -v` 행, 로그(`docker-logs` 기본 인자), '자주 생길 문제' (빈 DB 첫 수집, `docker-up` 실패, `make dev` 포트 사용 중, 설정 저장 500, 소스 저장 EBUSY 경고, 토글 200 인데 파일 안 바뀜), '알려진 불일치·위험' (깨진 make·로컬 실행 경로 미정의·Docker 설정 저장 불가·시작 차단 삭제, Docker 저장이 추적 파일을 바꿈·첫 수집 취소 추가), main.py·next.config.ts 줄 참조
- `docs/test-strategy.md` — '검사 명령' 의 깨짐 줄 삭제, `make test` = `make check`. '테스트 종류' 단위 행 21개 파일·217개, 새 행 'Makefile·스크립트 회귀'. '릴리스 전 통합' 의 `make docker-up` (healthy 까지 기다림)·`make dev`
- `docs/known-issues.md` — spec 8절 5행 삭제 (`:ro` 마운트, `make dev`·`make test` 깨짐, `make setup` 재실행 오류, `make clean` 캐시, 루트 CLAUDE.md `make check` 서술). DB 경로 cwd·수집 중복 플래그·`NEXT_PUBLIC_API_URL`·보안 행은 남김
- `docs/data-model.md` — DB 경로 표의 `make collect` 직접·API 모드 행과 `make dev` 행, 파괴 표의 reset 대상 행(`AGENTLENS_API_URL`), sources.json 저장 서술(EBUSY 대체 경로), 생명주기의 시작 시 수집(백그라운드), main.py·sources_service.py 줄 참조
- `docs/api.md` — 기타 절 lifespan 서술, 설정 저장 오류의 `:rw` 서술(2026-11-09 200 확인), Sources 절 저장 서술, '알려진 불일치' 의 시작 차단 줄 삭제, main.py·sources_service.py 줄 참조
- `docs/functional-spec/03-collection.md` — COLL-20 표 행과 절(백그라운드 태스크, 종료 때 취소, 오류 로그), COLL-01 의 `make collect` 진입점 설명, COLL-19 진입점의 reset 대상 URL·실패, '시작 지연' 을 '빈 DB 첫 수집 중 종료' 로, 줄 참조
- `docs/functional-spec/04-briefing-and-sharing.md` — BRF 설정 저장의 `:ro` 서술을 `:rw`·제자리 쓰기로
- `docs/test-cases.md` — 새 절 `test_collect_script.py` (5), `test_make_targets.py` (34), `test_sources_write_fallback.py` (2), `test_startup_seed.py` (2). 표기 'ASGI' 의 lifespan 서술, '설정·DB' 커버리지의 lifespan '없음' 행을 '있음' 3행 + 남은 '없음' 1행으로, 개수(21개 파일, 217개)와 실행 중 skip 서술
- `docs/tech-spec.md` — '시스템 구성' (Makefile 대상 12개, `scripts/dev.sh`·`scripts/collect.py`, `docker-up --wait`), '데이터' (소스 저장 제자리 쓰기, Docker `:rw` 마운트), '공통 규칙' 스케줄(빈 DB 첫 수집 백그라운드), '기술 선택과 근거' 3행, '변경 이력' `make-targets` 행
- `tasks/make-targets/07-docs.md` (이 기록)
## 검사 결과
- 증명 4: `git grep -nE 'scripts/test\.sh|지워진 .scripts/.|make[ ]reset-and-collect|config\.json:ro|격리는 미정|\*\*깨짐\*\*' -- CLAUDE.md docs ':!docs/features'` → 출력 없음, 종료 1 (0건).
- 표 깨짐 확인: 9개 문서에서 표 줄 안의 이스케이프 안 된 `||` 0건 (`grep -n '^|.*[^\\]||'`).
- `make check` (문서 고친 뒤, scratchpad `step7/check.log`) → 종료 0, 앞뒤 `git status --porcelain` diff 없음, O 규칙 0건:
```
============================= 217 passed in 14.55s =============================
 Test Files  52 passed (52)
      Tests  649 passed (649)
✖ 41 problems (0 errors, 41 warnings)
```
## 결정
- 범위 밖 문서는 고치지 않았다 (plan '변경 파일' 에 없음). 아래 '다음' 에 남은 낡은 줄 참조를 적는다.
- `operations.md` '자주 생길 문제' 에 "소스 토글이 200 인데 파일이 안 바뀐다" (`toggle_source` 가 `save_sources` 반환값을 버림, `sources_service.py:191-193`) 를 운영 사실로 적었다. known-issues 새 행으로는 넣지 않았다 (plan 7: `/triage-signal` 몫).
- 수집 소요 시간은 단계 6 실측(두 모드 동시 실행, 각 250건, 약 13분)을 그대로 적고 "네트워크·LLM 상태에 따라 다름" 을 붙였다.
- Ctrl-C 때 make 의 종료 상태(SIGINT, 셸에서 130)는 Makefile 로 바꿀 수 없는 make 3.81 동작이라 운영 문서에 사실로만 적었다.
## 막힌 점
- 없음.
## 다음
- 메인 세션 (루트 `CLAUDE.md`): `d0f9ee7` 의 '명령' 절이 지금 동작과 맞는다. 고칠 문장은 없다. 원하면 '명령' 절 `make docker-logs` 괄호를 "(따라가기, 마지막 200줄부터. Ctrl-C 로 끝내면 정상 종료)" 로 바꿀 수 있다 (선택).
- 메인 세션 (범위 밖, plan 고침이 필요하면 다음 기능으로): 이 기능의 코드 변경으로 밀린 줄 참조가 plan 밖 문서에 남아 있다.
  - `docs/functional-spec/05-sources-and-research.md:50, 94, 107, 119, 130, 256, 289, 294, 295` — `sources_service.py` 110행 뒤 참조가 +9 (예: `:186-211` → `:195-220`, `:111-119` → `:120-128`, `:102-123` → `:102-132`).
  - `docs/functional-spec/06-mcp-server.md:137` — `main.py:15` → `:25`. `docs/functional-spec/02-ai-chat.md:564` — `main.py:37-46` → `:58-67`.
  - `docs/ui-spec.md:314, 367, 375, 403`, `docs/functional-spec/07-ui-common.md:439` — `next.config.ts` 줄 참조(지금 rewrites `:23-31`, `INTERNAL_API_URL` `:24`, env `:13-15`)와 `:375` 의 설정 목록에 `agentRules: false` 없음.
- verify: V6 (사람), V8 (맨 마지막), 우려 1·3·6·7·9 기록.
