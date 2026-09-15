---
name: backend-tdd-workflow
description: >-
  FastAPI 백엔드 개발 시 Red-Green-Refactor TDD 사이클을 강제하고 검증하는 스킬입니다.
  실패하는 pytest 테스트 작성 후 run_backend_tdd.py --phase red, 구현 후 --phase green으로 검증합니다.
---

# Backend TDD Workflow Skill

## 실행 절차
1. **RED Phase**:
   - `backend/tests/`에 실패하는 pytest 테스트 케이스 작성
   - 검증: `python3 .agents/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase red`
2. **GREEN Phase**:
   - 테스트를 만족하는 최소한의 FastAPI 라우터 및 서비스 구현
   - 검증: `python3 .agents/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase green`
3. **REFACTOR Phase**:
   - 중복 코드 제거, 비동기 I/O 최적화, 타입 힌트 보강
   - 검증: 회귀 테스트 100% 통과 확인
4. **산출물 작성**: `docs/templates/09_BACKEND_TDD_LOG_TEMPLATE.md` 기반 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 저장
