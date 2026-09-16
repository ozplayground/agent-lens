# Rule: Fullstack Team Workflow & Parallel Processing Governance

## 1. 목적
본 규칙은 기획부터 배포까지 12인의 전문 서브에이전트가 단절 없이 협업하고, 특히 백엔드와 프론트엔드가 컨트랙트를 기반으로 완벽한 병렬 TDD 개발을 수행할 수 있도록 파이프라인 전이 조건과 행동 규약을 정의합니다.

---

## 2. 7단계 파이프라인 및 단계별 전이 규칙 (Stage Transitions)

### Stage 1: 기획 트랙 (Planning)
1. `market-analyst`는 시장 조사 및 유사 서비스 벤치마킹을 수행하여 `docs/market-analyst/01_MARKET_BENCHMARK.md`를 제출합니다.
2. `spec-writer`는 위 벤치마킹 보고서를 바탕으로 PRD(`docs/spec-writer/01_PRD.md`)와 상세기능정의서 인덱스(`02_FUNCTIONAL_SPECIFICATION.md`), 도메인별 모듈러 FSD(`docs/spec-writer/fsd/*.md`), 정책 명세서(`03_POLICIES_AND_EDGES.md`)를 작성합니다.
3. **Planning Gate (기획 승인 게이트)**:
   - PRD의 기능 우선순위(MoSCoW) 확정
   - 도메인별 FSD에 단위기능 7대 상세 명세 및 UI 8대 표준 컬럼이 전수 완비되어야 통과됩니다.

### Stage 2: 설계 및 컨트랙트 트랙 (Architecture & Contract - 병렬화의 허브)
1. `fullstack-architect`는 기술 스택과 아키텍처 ADR(`docs/fullstack-architect/01_ARCHITECTURE_ADR.md`)을 확정합니다.
2. `system-designer`는 백엔드 계층도, Mermaid ERD, OpenAPI 스펙(`docs/system-designer/`)을 작성합니다.
3. `ui-system-designer`는 컴포넌트 계층 트리, RSC vs RCC 경계, 반응형 규격(`docs/ui-system-designer/01_COMPONENT_SPEC.md`)을 작성합니다.
4. **`contract-integrator`의 필수 역할**:
   - 백엔드의 OpenAPI 명세와 프론트엔드의 TypeScript 인터페이스, Zod 스키마, MSW 네트워크 모의 핸들러를 100% 동기화하여 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`를 발행합니다.
5. **Contract Lock Gate (계약 체결 게이트)**:
   - 계약 문서가 발행 및 승인되는 즉시, 프론트엔드와 백엔드는 **동시에 독립적인 병렬 TDD 구현에 착수**합니다.

### Stage 3: 병렬 TDD 구현 단계 (Parallel TDD Track)
- 백엔드(`backend-tdd-engineer`)와 프론트엔드(`frontend-tdd-engineer`)는 동시에 착수합니다.
- 프론트엔드는 백엔드 서버 완성을 기다리지 않고 `contract-integrator`가 정의한 MSW mock을 바탕으로 TDD를 완수합니다.
- 백엔드는 OpenAPI 스펙을 기준으로 FastAPI 라우터와 서비스를 TDD로 구현합니다.
- **TDD 철칙**: 테스트 코드(Red) $\rightarrow$ 최소 구현(Green) $\rightarrow$ 리팩토링(Refactor) 순서를 위반한 직접 코드 작성은 금지됩니다.
- **간결성 원칙 (Simplicity & KISS)**: 복잡한 추상화나 오버엔지니어링을 배제하고, 요구사항 기능에 충실한 직관적이고 간결한 코드로 작성합니다.

### Stage 4: 병렬 코드 리뷰 트랙 (Parallel Review)
- `backend-code-reviewer`와 `frontend-code-reviewer`는 각각 독립적으로 5-Pillar 코드 품질 감사를 수행합니다.
- **5대 감사 필라**: (1) 아키텍처 정합성, (2) 클린코드 & SOLID, (3) 보안 및 데이터 무결성, (4) 성능 및 리소스 최적화, (5) 테스트 품질
- 두 리뷰어의 판정이 모두 `APPROVED`여야 다음 단계로 진행됩니다.

### Stage 5: 통합 QA 및 배포 트랙 (QA & DevOps)
- `qa-engineer`가 통합 테스트 계획서(`docs/qa-engineer/01_QA_TEST_PLAN.md`)에 따라 API E2E 및 UI 시나리오를 전수 검증하고 `02_QA_TEST_REPORT.md`를 작성합니다.
- `devops-engineer`가 컨테이너 빌드, 환경변수 유효성, 헬스체크를 검증하고 `docs/devops-engineer/01_DEPLOYMENT_SPEC.md`를 작성하여 릴리즈를 완료합니다.
