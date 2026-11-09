# 규칙: 풀스택 팀 워크플로와 병렬 처리

기획부터 배포까지 서브에이전트 12개가 끊김 없이 협업하고, backend 와 frontend 가 계약을 기준으로 병렬 TDD 를 하도록 단계 전이 조건을 정한다. 사용자의 직접 지시는 이 규칙보다 우선한다 (`CLAUDE.md` 최우선 규칙).

## 오케스트레이션 (메인 세션)
- 단계마다 Agent 도구로 해당 서브에이전트를 부른다 (`subagent_type: <이름>`). 넘길 것: 작업 목표, 읽을 선행 산출물 경로, 쓸 산출물 경로, 지킬 게이트.
- 같은 단계의 독립 작업은 한 메시지에서 동시에 띄운다 (Stage 2 의 architect·system·ui 설계, Stage 3 의 backend·frontend TDD, Stage 4 의 두 리뷰).
- 단계를 건너뛸 때는 이유를 보고에 적는다. 예: 버그 수정은 Stage 1·2 를 건너뛰고 TDD 부터, 문서만 고치는 작업은 리뷰·QA 생략.
- 서브에이전트가 멈추면 새로 띄우지 않고 SendMessage 로 같은 에이전트에게 이어서 시킨다.

## Stage 1: 기획
1. `market-analyst` 가 `docs/market-analyst/01_MARKET_BENCHMARK.md` 를 쓴다 (외부 사실이 필요할 때만).
2. `spec-writer` 가 PRD(`docs/spec-writer/01_PRD.md`), 기능 인덱스(`02_FUNCTIONAL_SPECIFICATION.md`), 도메인 FSD(`docs/spec-writer/fsd/*.md`), 정책(`03_POLICIES_AND_EDGES.md`)을 쓴다.
3. **Planning Gate**: MoSCoW 우선순위 확정, 단위 기능마다 7대 명세와 UI 8대 컬럼 표 완비.

## Stage 2: 설계와 계약 (병렬화 허브)
1. `fullstack-architect` 가 ADR(`docs/fullstack-architect/01_ARCHITECTURE_ADR.md`)을 확정한다.
2. `system-designer` 가 backend 계층, Mermaid ERD, OpenAPI(`docs/system-designer/`)를 쓴다.
3. `ui-system-designer` 가 컴포넌트 트리, RSC/RCC 경계, 반응형 규격(`docs/ui-system-designer/01_COMPONENT_SPEC.md`)을 쓴다.
4. `contract-integrator` 가 Pydantic 스키마 ↔ TS 타입·zod ↔ MSW 핸들러를 맞추고 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 를 발행한다.
5. **Contract Lock Gate**: 계약 문서가 발행되면 backend·frontend TDD 를 동시에 시작한다.

## Stage 3: 병렬 TDD
- `backend-tdd-engineer` 와 `frontend-tdd-engineer` 를 동시에 띄운다. 서로 다른 앱만 고친다 (`backend/**` / `frontend/**`).
- frontend 는 backend 완성을 기다리지 않고 계약의 MSW 목으로 TDD 를 끝낸다.
- **TDD 철칙**: 실패하는 테스트(Red) → 최소 구현(Green) → 리팩터(Refactor). 테스트 없이 구현부터 쓰지 않는다.
- 끝나면 `make check` 가 통과해야 한다.

## Stage 4: 병렬 리뷰
- `backend-code-reviewer` 와 `frontend-code-reviewer` 가 각자 5-Pillar 감사를 한다: (1) 아키텍처 정합성 (2) 클린코드·SOLID (3) 보안·데이터 무결성 (4) 성능·리소스 (5) 테스트 품질.
- 두 판정이 모두 `APPROVED` 여야 다음 단계로 간다. `REQUEST_CHANGES` 면 지적 사항을 해당 TDD 엔지니어에게 SendMessage 로 넘겨 고치게 하고 다시 리뷰한다.

## Stage 5: QA 와 배포
- `qa-engineer` 가 테스트 계획(`docs/qa-engineer/01_QA_TEST_PLAN.md`)대로 API E2E·UI 시나리오를 검증하고 `02_QA_TEST_REPORT.md` 를 쓴다. Blocker·Critical 0 이면 `RELEASE_APPROVED`.
- `devops-engineer` 가 컨테이너 빌드, 환경변수, 헬스체크를 검증하고 `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` 를 쓴다.
- 구현으로 바뀐 동작은 같은 작업에서 `CLAUDE.md` '지금 시스템 문서' 의 해당 문서에 반영한다.
