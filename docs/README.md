# Deliverables & Tracking Registry (산출물 레지스트리)

본 디렉토리는 AGENTS.md 규약에 따라 풀스택 개발팀 하네스의 각 서브에이전트가 생성하는 모든 공식 산출물을 격리하여 보관하는 통합 레지스트리입니다.

---

## 1. 파이프라인 단계별 공식 산출물 완료 현황 (Pipeline Deliverables Registry)

AGENTS.md 7-Stage 파이프라인 규약에 따라 작성 및 검증된 전체 산출물 인덱스입니다.

| 단계 | 트랙 | 전담 서브에이전트 | 공식 산출물 경로 | 적용 템플릿 (`docs/templates/`) | 상태 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **Stage 1a** | 기획 | `market-analyst` | [01_MARKET_BENCHMARK.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/market-analyst/01_MARKET_BENCHMARK.md) | `01_MARKET_BENCHMARK_TEMPLATE.md` | Approved |
| **Stage 1b** | 기획 | `spec-writer` | [01_PRD.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) | `02_PRD_TEMPLATE.md` | Approved |
| | | | [02_FUNCTIONAL_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/02_FUNCTIONAL_SPECIFICATION.md) | `03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` | Approved |
| | | | [fsd/01_NEWS_FEED_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/02_BRIEFING_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/02_BRIEFING_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/03_SOURCES_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/03_SOURCES_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/04_SETTINGS_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/04_SETTINGS_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/05_AI_CHAT_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/05_AI_CHAT_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md) | `fsd/DOMAIN_FSD_TEMPLATE.md` | Approved |
| | | | [03_POLICIES_AND_EDGES.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) | `04_POLICY_AND_EDGES_TEMPLATE.md` | Approved |
| **Stage 2a** | 설계 | `fullstack-architect` | [01_ARCHITECTURE_ADR.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/fullstack-architect/01_ARCHITECTURE_ADR.md) | `05_FULLSTACK_ADR_TEMPLATE.md` | Approved |
| **Stage 2b** | 설계 | `system-designer` | [01_SYSTEM_DESIGN.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) | `06_SYSTEM_DESIGN_TEMPLATE.md` | Approved |
| | | | [02_OPENAPI_SPEC.yaml](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml) | (OpenAPI 3.1.0 Schema) | Approved |
| **Stage 2c** | 설계 | `ui-system-designer` | [01_COMPONENT_SPEC.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/ui-system-designer/01_COMPONENT_SPEC.md) | `07_COMPONENT_SPEC_TEMPLATE.md` | Approved |
| **Stage 2d** | 계약 | `contract-integrator`| [01_CONTRACT_AND_MSW_SPEC.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) | `08_CONTRACT_AND_MSW_TEMPLATE.md` | Approved |
| **Stage 3a** | TDD | `backend-tdd-engineer`| [01_TDD_CYCLE_LOG.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md) | `09_BACKEND_TDD_LOG_TEMPLATE.md` | Approved |
| **Stage 3b** | TDD | `frontend-tdd-engineer`| [01_TDD_CYCLE_LOG.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md) | `10_FRONTEND_TDD_LOG_TEMPLATE.md` | Approved |
| **Stage 4a** | 리뷰 | `backend-code-reviewer`| [01_CODE_REVIEW_REPORT.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) | `11_CODE_REVIEW_REPORT_TEMPLATE.md` | Approved |
| **Stage 4b** | 리뷰 | `frontend-code-reviewer`| [01_CODE_REVIEW_REPORT.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) | `11_CODE_REVIEW_REPORT_TEMPLATE.md` | Approved |
| **Stage 5a** | QA | `qa-engineer` | [01_QA_TEST_PLAN.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/qa-engineer/01_QA_TEST_PLAN.md) | `12_QA_TEST_PLAN_TEMPLATE.md` | Approved |
| | | | [02_QA_TEST_REPORT.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/qa-engineer/02_QA_TEST_REPORT.md) | `13_QA_TEST_REPORT_TEMPLATE.md` | Approved |
| **Stage 5b** | 배포 | `devops-engineer` | [01_DEPLOYMENT_SPEC.md](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/devops-engineer/01_DEPLOYMENT_SPEC.md) | `14_DEPLOYMENT_SPEC_TEMPLATE.md` | Approved |

---

## 2. 표준 템플릿 디렉토리 (`docs/templates/`)

모든 산출물은 `docs/templates/` 하위의 표준 템플릿 규격을 엄격히 준수하여 작성됩니다.

| 번호 | 템플릿 파일 | 대상 산출물 | 전담 서브에이전트 |
| :---: | :--- | :--- | :--- |
| **01** | `templates/01_MARKET_BENCHMARK_TEMPLATE.md` | 시장 벤치마킹 분석서 | `market-analyst` |
| **02** | `templates/02_PRD_TEMPLATE.md` | 제품 요구사항 정의서 (PRD) | `spec-writer` |
| **03** | `templates/03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` | 전체 기능정의서 인덱스 | `spec-writer` |
| **FSD**| `templates/fsd/DOMAIN_FSD_TEMPLATE.md` | 단위기능 7대 상세명세 + UI 8대 표준 표 | `spec-writer` |
| **04** | `templates/04_POLICY_AND_EDGES_TEMPLATE.md` | 전역 정책 및 엣지 케이스 명세서 | `spec-writer` |
| **05** | `templates/05_FULLSTACK_ADR_TEMPLATE.md` | 풀스택 아키텍처 결정 레코드 (ADR) | `fullstack-architect` |
| **06** | `templates/06_SYSTEM_DESIGN_TEMPLATE.md` | 백엔드 시스템 설계서 및 ERD | `system-designer` |
| **07** | `templates/07_COMPONENT_SPEC_TEMPLATE.md` | UI 컴포넌트 계층 및 디자인 명세서 | `ui-system-designer` |
| **08** | `templates/08_CONTRACT_AND_MSW_TEMPLATE.md` | 데이터 계약 및 MSW 모의 명세서 | `contract-integrator` |
| **09** | `templates/09_BACKEND_TDD_LOG_TEMPLATE.md` | 백엔드 TDD 사이클 실행 기록서 | `backend-tdd-engineer` |
| **10** | `templates/10_FRONTEND_TDD_LOG_TEMPLATE.md` | 프론트엔드 TDD 사이클 실행 기록서 | `frontend-tdd-engineer` |
| **11** | `templates/11_CODE_REVIEW_REPORT_TEMPLATE.md` | 5-Pillar 코드 품질 감사 보고서 | `backend-code-reviewer`, `frontend-code-reviewer` |
| **12** | `templates/12_QA_TEST_PLAN_TEMPLATE.md` | 통합 QA 테스트 계획서 | `qa-engineer` |
| **13** | `templates/13_QA_TEST_REPORT_TEMPLATE.md` | 통합 QA 테스트 결과 보고서 | `qa-engineer` |
| **14** | `templates/14_DEPLOYMENT_SPEC_TEMPLATE.md` | 배포 명세 및 환경 검증서 | `devops-engineer` |

---

## 3. 서브에이전트별 산출물 디렉토리 맵

```
docs/
├── templates/                           # 표준 산출물 템플릿 저장소
│   └── fsd/                             # 모듈러 FSD 템플릿
├── market-analyst/                      # 01_MARKET_BENCHMARK.md
├── spec-writer/                         # 01_PRD.md, 02_FUNCTIONAL_SPECIFICATION.md, 03_POLICIES_AND_EDGES.md
│   └── fsd/                             # {DOMAIN}_SPECIFICATION.md (도메인별 전수 분할 명세서)
│       ├── 01_NEWS_FEED_SPECIFICATION.md
│       ├── 02_BRIEFING_SPECIFICATION.md
│       ├── 03_SOURCES_SPECIFICATION.md
│       ├── 04_SETTINGS_SPECIFICATION.md
│       ├── 05_AI_CHAT_SPECIFICATION.md
│       ├── 06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md
│       └── 07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md
├── fullstack-architect/                 # 01_ARCHITECTURE_ADR.md
├── system-designer/                     # 01_SYSTEM_DESIGN.md, 02_OPENAPI_SPEC.yaml
├── ui-system-designer/                  # 01_COMPONENT_SPEC.md
├── contract-integrator/                 # 01_CONTRACT_AND_MSW_SPEC.md (병렬화 기준점)
├── backend-tdd-engineer/                # 01_TDD_CYCLE_LOG.md
├── frontend-tdd-engineer/               # 01_TDD_CYCLE_LOG.md
├── backend-code-reviewer/               # 01_CODE_REVIEW_REPORT.md
├── frontend-code-reviewer/              # 01_CODE_REVIEW_REPORT.md
├── qa-engineer/                         # 01_QA_TEST_PLAN.md, 02_QA_TEST_REPORT.md
└── devops-engineer/                     # 01_DEPLOYMENT_SPEC.md
```
