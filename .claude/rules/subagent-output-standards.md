# 규칙: 서브에이전트 산출물 폴더와 템플릿

모든 서브에이전트는 정해진 폴더(`docs/<서브에이전트>/`)에 정해진 파일 이름으로 쓰고, `docs/templates/` 의 템플릿 구조를 따른다. 임의 폴더나 규격 밖 문서를 만들지 않는다.

| 서브에이전트 | 폴더 | 템플릿 | 파일 |
|---|---|---|---|
| `market-analyst` | `docs/market-analyst/` | `01_MARKET_BENCHMARK_TEMPLATE.md` | `01_MARKET_BENCHMARK.md` |
| `spec-writer` | `docs/spec-writer/` | `02_PRD_TEMPLATE.md` | `01_PRD.md` |
| | | `03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` | `02_FUNCTIONAL_SPECIFICATION.md` |
| | `docs/spec-writer/fsd/` | `fsd/DOMAIN_FSD_TEMPLATE.md` | `{DOMAIN}_SPECIFICATION.md` |
| | `docs/spec-writer/` | `04_POLICY_AND_EDGES_TEMPLATE.md` | `03_POLICIES_AND_EDGES.md` |
| `fullstack-architect` | `docs/fullstack-architect/` | `05_FULLSTACK_ADR_TEMPLATE.md` | `01_ARCHITECTURE_ADR.md` |
| `system-designer` | `docs/system-designer/` | `06_SYSTEM_DESIGN_TEMPLATE.md` | `01_SYSTEM_DESIGN.md` |
| | | (OpenAPI 3.1) | `02_OPENAPI_SPEC.yaml` |
| `ui-system-designer` | `docs/ui-system-designer/` | `07_COMPONENT_SPEC_TEMPLATE.md` | `01_COMPONENT_SPEC.md` |
| `contract-integrator` | `docs/contract-integrator/` | `08_CONTRACT_AND_MSW_TEMPLATE.md` | `01_CONTRACT_AND_MSW_SPEC.md` |
| `backend-tdd-engineer` | `docs/backend-tdd-engineer/` | `09_BACKEND_TDD_LOG_TEMPLATE.md` | `01_TDD_CYCLE_LOG.md` |
| `frontend-tdd-engineer` | `docs/frontend-tdd-engineer/` | `10_FRONTEND_TDD_LOG_TEMPLATE.md` | `01_TDD_CYCLE_LOG.md` |
| `backend-code-reviewer` | `docs/backend-code-reviewer/` | `11_CODE_REVIEW_REPORT_TEMPLATE.md` | `01_CODE_REVIEW_REPORT.md` |
| `frontend-code-reviewer` | `docs/frontend-code-reviewer/` | `11_CODE_REVIEW_REPORT_TEMPLATE.md` | `01_CODE_REVIEW_REPORT.md` |
| `qa-engineer` | `docs/qa-engineer/` | `12_QA_TEST_PLAN_TEMPLATE.md` | `01_QA_TEST_PLAN.md` |
| | | `13_QA_TEST_REPORT_TEMPLATE.md` | `02_QA_TEST_REPORT.md` |
| `devops-engineer` | `docs/devops-engineer/` | `14_DEPLOYMENT_SPEC_TEMPLATE.md` | `01_DEPLOYMENT_SPEC.md` |

## 작성 원칙
1. **템플릿 구조 복제**: 템플릿의 절 구조, 표 머리, 체크리스트를 그대로 가져와 채운다. 해당 없는 절은 지우지 말고 "해당 없음" 과 이유를 쓴다.
2. **자기 폴더에만 쓴다**: 다른 서브에이전트 폴더는 고치지 않는다.
3. **선행 산출물은 읽기 전용**: 불일치나 변경이 필요하면 보고에 적어 오케스트레이터가 선행 에이전트에게 고치게 한다.
4. **Mermaid**: 아키텍처, ERD, 사용자 흐름, 상태 전이는 유효한 Mermaid 로 그린다.
5. **근거**: 코드 사실은 `path:line` 으로, 외부 사실은 출처 URL 로 단다. 측정하지 않은 숫자는 쓰지 않는다.
6. **한국어**: 산출물은 한국어로 쓴다. 코드, 명령, 경로, 식별자는 그대로 둔다.
7. 기능 작업마다 같은 파일을 고쳐 쓴다. 이전 내용은 git 이력에 남는다.
