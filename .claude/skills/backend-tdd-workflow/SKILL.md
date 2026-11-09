---
name: backend-tdd-workflow
description: FastAPI backend 를 Red-Green-Refactor 로 구현하는 절차. 실패하는 pytest 를 쓰고 run_backend_tdd.py --phase red 로 실패를 증명한 뒤, 구현하고 --phase green 으로 통과를 증명한다. backend 기능 구현·버그 수정이나 backend-tdd-engineer 작업에 쓴다.
---

# backend TDD

스크립트: `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase red|green|check [-- pytest 인자]`
(`backend/` 에서 `../.venv/bin/pytest -v` 를 돈다. 인자를 주지 않으면 `tests/` 전체. 예: `-- tests/test_news.py -k missing`)

1. **RED**
   - `backend/tests/test_*.py` 에 정상·경계·오류 케이스 테스트를 쓴다. 공용 fixture 는 `backend/tests/conftest.py` (LLM 흉내, 설정 파일 임시 사본, 테스트 DB).
   - `--phase red -- tests/<새 파일>` 로 실패를 증명한다. 실패 이유가 예상(기능 없음, 잘못된 값)과 같은지 출력으로 확인한다. import 오류 같은 엉뚱한 실패는 Red 가 아니다.
   - 버그 수정이면 버그를 재현하는 테스트를 먼저 커밋한다.
2. **GREEN**
   - `backend/app/` 에 테스트를 통과시키는 가장 단순한 코드를 쓴다 (`api/` 라우터 → `services/` → `models/`).
   - `--phase green -- tests/<새 파일>` 로 통과를 증명한다.
3. **REFACTOR**
   - 중복 제거, async 안의 동기 블로킹 정리, 타입 힌트 보강.
   - `--phase green` (전체) 와 `make check` 로 회귀가 없음을 확인한다.
4. **기록**: `docs/templates/09_BACKEND_TDD_LOG_TEMPLATE.md` 구조대로 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 에 사이클마다 테스트, Red 출력, Green 출력, 리팩터 내용을 쓴다.
