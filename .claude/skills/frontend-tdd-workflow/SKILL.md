---
name: frontend-tdd-workflow
description: Next.js·React 컴포넌트와 훅을 Red-Green-Refactor 로 구현하는 절차. 실패하는 Vitest·RTL 테스트를 쓰고 run_frontend_tdd.py --phase red 로 실패를 증명한 뒤, 구현하고 --phase green 으로 통과를 증명한다. frontend 기능 구현·UI 버그 수정이나 frontend-tdd-engineer 작업에 쓴다.
---

# frontend TDD

스크립트: `python3 .claude/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase red|green|check [-- vitest 인자]`
(`frontend/` 에서 `pnpm exec vitest run` 을 돈다. 인자를 주지 않으면 전체. 예: `-- src/tests/feed/NewsCard.test.tsx`)

1. **RED**
   - `frontend/src/tests/<영역>/*.test.tsx` 에 테스트를 쓴다. 쿼리는 `getByRole`, `getByLabelText`, `getByText` 처럼 사용자가 보는 것 기준.
   - 네트워크는 MSW(`frontend/src/mocks/server.ts`, `handlers*.ts`)로 흉내 낸다. 필요한 핸들러는 테스트 안에서 `server.use(...)` 로 덮어쓴다.
   - UI 5대 상태(Idle, Loading, Error, Empty, Success)를 각각 테스트한다.
   - `--phase red -- src/tests/<새 파일>` 로 실패를 증명하고 실패 이유를 확인한다.
2. **GREEN**
   - `frontend/src/components/`, `hooks/`, `app/` 에 테스트를 통과시키는 가장 단순한 코드를 쓴다. 공통 부품(`components/ui/`)과 디자인 토큰을 쓴다.
   - `--phase green -- src/tests/<새 파일>` 로 통과를 증명한다.
3. **REFACTOR**
   - 컴포넌트 분리, 상태 배치, `useMemo`·`useCallback` 은 측정된 리렌더 문제가 있을 때만.
   - `make check` (vitest, eslint, `tsc --noEmit`)로 회귀가 없음을 확인한다.
4. **기록**: `docs/templates/10_FRONTEND_TDD_LOG_TEMPLATE.md` 구조대로 `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md` 에 사이클 기록을 쓴다.
