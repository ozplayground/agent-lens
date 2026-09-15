---
name: frontend-tdd-workflow
description: >-
  Next.js 및 React 컴포넌트 개발 시 Red-Green-Refactor TDD 사이클을 강제하고 검증하는 스킬입니다.
  실패하는 Vitest/RTL 테스트 작성 후 run_frontend_tdd.py --phase red, 컴포넌트 구현 후 --phase green으로 검증합니다.
---

# Frontend TDD Workflow Skill

## 실행 절차
1. **RED Phase**:
   - `src/**/__tests__/*.test.tsx`에 실패하는 RTL 테스트 작성
   - MSW 핸들러를 통한 네트워크 모킹 연결
   - 검증: `python3 .agents/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase red`
2. **GREEN Phase**:
   - 테스트를 통과시키는 최소한의 React 컴포넌트 및 Next.js 라우트 구현
   - 검증: `python3 .agents/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase green`
3. **REFACTOR Phase**:
   - 컴포넌트 분리, 상태 배치 최적화, TypeScript 엄격성 점검
   - 검증: 회귀 테스트 100% 통과 확인
4. **산출물 작성**: `docs/templates/10_FRONTEND_TDD_LOG_TEMPLATE.md` 기반 `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md` 저장
