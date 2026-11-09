# Release: make 대상 12개가 오류 없이 동작

Verify: ./verify.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-09)
Version: 0.4.0
PR: main (`94fdf8e`, `4935dd9`, `b439370` 와 릴리스 커밋)

## 리뷰 (REVIEW.md)
- `Important: 1, Nit: 2` (v0.4.0 릴리스 전 리뷰 `316965b..4935dd9` 중 이 기능 몫) · 처리:
  - Important 1 (hook 의 사본 판정을 frontend 프록시 포트·DB 를 바꾸지 않은 다른 포트로 우회해 원본 데이터를 지울 수 있음): `b439370` 에서 포트 기반 사본 판정을 없애고, 사용자가 이번 턴에 지시했는지로만 판정하게 고쳤다.
  - Nit (`make -n` 예외가 주석·따옴표 안 `-n` 에도 걸림): `b439370` 과 릴리스 커밋에서 shlex 토큰 기준으로 좁혔다 (인자를 받는 옵션 뒤 `-n`, `&` 뒤 명령, 주석 불인정).
  - Nit (`make collect` API 모드가 첫 폴링 전에 끝난 실패를 놓치면 `COLLECT_TIMEOUT` 까지 대기): 수용. verify '남은 위험' 에 있다. 후속 작업 후보.

## 통합·회귀 검증
- `make check` → 종료 0. `217 passed in 12.50s`, `Test Files  52 passed (52)`, `Tests  649 passed (649)`, eslint `0 errors, 41 warnings`. 실행 앞뒤 `git status --porcelain` 같음.
- `make docker-build` → 종료 0. `make docker-up` → 종료 0, `agentlens-backend Up 2 minutes (healthy)`, `agentlens-frontend Up 2 minutes (healthy)`.
- `curl -fsS http://127.0.0.1:8000/health` → `{"status":"healthy","version":"0.4.0","running":false}`
- `curl -fsS http://127.0.0.1:3001/api/health` → `{"status":"healthy","service":"agentlens-frontend","version":"0.4.0",…}`
- `make docker-down` → 종료 0. 뒤 `git status --porcelain` 같음.

## 버전 bump
- 바꾼 파일: `docs/releases.md` '버전 문자열 위치' 표 10곳 (`frontend/package.json`, `frontend/src/app/api/health/route.ts`, `config.json`, `.env.example`, `backend/.env.example`, `docker-compose.yml`, `backend/app/config.py`, `backend/tests/test_config_and_live_llm.py`, `backend/tests/test_dynamic_rag_retrieval.py`, `backend/tests/test_scoped_chat_grounding.py`). 뒤 두 테스트 파일은 표에 없어서 추가했다. `git grep -n '0\.3\.1'` (lockfile·기능 산출물·이력 제외) 은 허용 버전 목록 한 줄만 남는다.
- 상세 문서의 현재 버전 표기(operations, data-model, ui-spec, functional-spec/07, test-cases)도 0.4.0 으로 맞췄다.
- 로컬 `.env`·`backend/.env`(git 밖)의 `VERSION` 도 0.4.0 으로 바꿨다. 0.3.1 이 남아 있으면 `settings.VERSION` 을 덮어써 버전 테스트 2개가 실패한다.
- 로컬 태그: `git tag -a v0.4.0 -m "Release v0.4.0: …"` → 릴리스 커밋에 만든다.

## 배포
- 원격 태그 push: `git push origin v0.4.0` (사용자가 지시하면 실행)
- 되돌리기: `git tag -d v0.4.0` · push 뒤라면 `git push origin :refs/tags/v0.4.0`

## 통합 문서 반영
- tech-spec.md: 반영됨 ('변경 이력' 2026-11-09 make-targets 행, '기술 선택과 근거' 3행)
- test-strategy.md: 반영됨 (Makefile·스크립트 회귀 테스트 종류, 릴리스 전 통합 검증의 `make docker-up` 대기)
