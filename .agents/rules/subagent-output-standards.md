# Rule: Subagent Output Directory and Template Standards

## 1. 목적
본 규칙은 모든 서브에이전트가 산출물을 작성할 때 정해진 디렉토리(`docs/{sub-agent}/`)를 엄격히 준수하고, `docs/templates/`에 준비된 표준 템플릿 형식을 반드시 따르도록 강제합니다. 임의의 디렉토리 생성이나 규격 외 문서 작성은 품질 게이트 즉각 탈락 사유가 됩니다.

---

## 2. 서브에이전트별 산출물 및 템플릿 매핑 규약

| 서브에이전트 | 산출물 저장 디렉토리 | 적용 필수 템플릿 | 산출물 파일명 |
| :--- | :--- | :--- | :--- |
| `market-analyst` | `docs/market-analyst/` | `docs/templates/01_MARKET_BENCHMARK_TEMPLATE.md` | `01_MARKET_BENCHMARK.md` |
| `spec-writer` | `docs/spec-writer/` | `docs/templates/02_PRD_TEMPLATE.md` | `01_PRD.md` |
| | | `docs/templates/03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` | `02_FUNCTIONAL_SPECIFICATION.md` |
| | `docs/spec-writer/fsd/` | `docs/templates/fsd/DOMAIN_FSD_TEMPLATE.md` | `{DOMAIN}_SPECIFICATION.md` |
| | `docs/spec-writer/` | `docs/templates/04_POLICY_AND_EDGES_TEMPLATE.md` | `03_POLICIES_AND_EDGES.md` |
| `fullstack-architect` | `docs/fullstack-architect/` | `docs/templates/05_FULLSTACK_ADR_TEMPLATE.md` | `01_ARCHITECTURE_ADR.md` |
| `system-designer` | `docs/system-designer/` | `docs/templates/06_SYSTEM_DESIGN_TEMPLATE.md` | `01_SYSTEM_DESIGN.md` |
| | | (OpenAPI 3.1 규격) | `02_OPENAPI_SPEC.yaml` |
| `ui-system-designer` | `docs/ui-system-designer/` | `docs/templates/07_COMPONENT_SPEC_TEMPLATE.md` | `01_COMPONENT_SPEC.md` |
| `contract-integrator` | `docs/contract-integrator/` | `docs/templates/08_CONTRACT_AND_MSW_TEMPLATE.md` | `01_CONTRACT_AND_MSW_SPEC.md` |
| `backend-tdd-engineer` | `docs/backend-tdd-engineer/` | `docs/templates/09_BACKEND_TDD_LOG_TEMPLATE.md` | `01_TDD_CYCLE_LOG.md` |
| `frontend-tdd-engineer`| `docs/frontend-tdd-engineer/` | `docs/templates/10_FRONTEND_TDD_LOG_TEMPLATE.md` | `01_TDD_CYCLE_LOG.md` |
| `backend-code-reviewer`| `docs/backend-code-reviewer/` | `docs/templates/11_CODE_REVIEW_REPORT_TEMPLATE.md` | `01_CODE_REVIEW_REPORT.md` |
| `frontend-code-reviewer`| `docs/frontend-code-reviewer/` | `docs/templates/11_CODE_REVIEW_REPORT_TEMPLATE.md` | `01_CODE_REVIEW_REPORT.md` |
| `qa-engineer` | `docs/qa-engineer/` | `docs/templates/12_QA_TEST_PLAN_TEMPLATE.md` | `01_QA_TEST_PLAN.md` |
| | | `docs/templates/13_QA_TEST_REPORT_TEMPLATE.md` | `02_QA_TEST_REPORT.md` |
| `devops-engineer` | `docs/devops-engineer/` | `docs/templates/14_DEPLOYMENT_SPEC_TEMPLATE.md` | `01_DEPLOYMENT_SPEC.md` |

---

## 3. 작성 및 거버넌스 원칙
1. **템플릿 복사 후 작성**: 에이전트는 산출물 작성 시 반드시 지정된 템플릿의 섹션 구조, 표 헤더, 체크리스트를 그대로 복제하여 작성해야 합니다.
2. **독립성 및 격리**: 각 에이전트는 본인의 전담 디렉토리에만 쓰기 권한을 가지며 타 에이전트의 디렉토리를 직접 수정할 수 없습니다.
3. **읽기 전용 참조**: 선행 에이전트의 산출물은 읽기 전용으로 참조하며, 불일치나 변경 필요 시 피드백 루프를 통해 선행 에이전트에게 수정을 요청합니다.
4. **Mermaid 시각화 의무**: 아키텍처, ERD, 사용자 플로우차트, 상태 전이도는 반드시 유효한 Mermaid 구문으로 작성합니다.
