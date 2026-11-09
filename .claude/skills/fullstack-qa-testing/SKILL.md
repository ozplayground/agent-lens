---
name: fullstack-qa-testing
description: QA 테스트 계획을 세우고, 실제로 띄운 앱에서 API E2E(qa_runner.py)와 UI 시나리오를 검증하고, 결과 보고서와 출시 판정(RELEASE_APPROVED/BLOCKED)을 쓰는 절차. "QA", "통합 테스트", "릴리스 전 검증", "E2E" 요청이나 qa-engineer 작업에 쓴다.
---

# 풀스택 QA

1. **계획**: `docs/templates/12_QA_TEST_PLAN_TEMPLATE.md` 구조대로 `docs/qa-engineer/01_QA_TEST_PLAN.md`. FSD 인수 기준과 `docs/test-cases.md` 로 시나리오 표를 만든다: 정상 경로, 경계·잘못된 입력, 외부 의존 실패(LLM 키 없음 → 503, 수집 소스 오류), 빈 데이터, 동시 실행(수집 중 재요청 → `already_running`).
2. **환경**
   - Docker: `make docker-up` → backend `http://localhost:8000`, frontend `http://localhost:3001`
   - 로컬: `make dev` → backend `:8000`, frontend `:3000`
   - 데이터를 지우는 시나리오는 DB 사본으로 띄운 backend 에서 한다: `sqlite3 backend/agentlens.db ".backup /tmp/qa.db"` 후 `DATABASE_URL=sqlite+aiosqlite:////tmp/qa.db make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`
3. **API E2E**: `python3 .claude/skills/fullstack-qa-testing/scripts/qa_runner.py --base-url http://localhost:8000 --frontend-url http://localhost:3001` (주요 GET 엔드포인트 상태 코드·지연, 없는 기사 404). 시나리오별 추가 확인은 `curl`.
4. **UI**: Playwright 또는 Chrome DevTools MCP 도구로 시나리오를 실행한다. 폭 360·390·768·1024·1440px, 라이트·다크, 키보드 조작과 포커스. 화면 규칙 측정은 프로덕션 빌드 앱에서 `cd frontend && node scripts/ui-audit.mjs` (결과 `docs/qa-engineer/ui-audit/`).
5. **결과**: `docs/templates/13_QA_TEST_REPORT_TEMPLATE.md` 구조대로 `docs/qa-engineer/02_QA_TEST_REPORT.md`. 케이스별 Pass/Fail, 응답 시간, 결함 심각도(Blocker, Critical, Minor)와 재현 절차.
6. **판정**: Blocker·Critical 0 이면 `RELEASE_APPROVED`.
7. **정리**: 띄운 서버·컨테이너를 내리고(`make docker-down`) `git status` 로 추적 파일 변화가 없는지 확인한다.
