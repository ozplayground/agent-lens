---
name: functional-specification
description: 기능 트리(1Depth 도메인 > 2Depth 화면·모듈 > 3Depth 단위 기능)를 세우고 단위 기능마다 7대 명세와 UI 8대 컬럼 표를 채워 도메인별 모듈러 FSD 와 전역 정책 문서를 쓰는 절차. "기능 명세", "FSD", "화면 정의" 요청이나 spec-writer 작업에 쓴다.
---

# 상세 기능 정의 (FSD)

1. **기능 트리**: 1Depth(도메인) > 2Depth(화면·모듈) > 3Depth(단위 기능). 도메인 코드는 지금 기능명세와 맞춘다: NEWS, CHAT, COLL, BRF, SRC, MCP, UI (`docs/functional-spec/README.md`).
2. **기능 인덱스**: `docs/templates/03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` 구조대로 `docs/spec-writer/02_FUNCTIONAL_SPECIFICATION.md`.
3. **도메인 FSD**: `docs/templates/fsd/DOMAIN_FSD_TEMPLATE.md` 구조대로 `docs/spec-writer/fsd/{DOMAIN}_SPECIFICATION.md`. 단위 기능 ID `FUNC-<도메인>-001` 마다 7대 명세:
   1. 기본 정보 (ID, 화면 코드 `SCR-xxx`, 우선순위, 액터)
   2. 사전 조건
   3. 인터랙션 흐름과 Mermaid `flowchart TD` (성공·실패·예외 분기)
   4. UI 데이터 항목 표 8대 컬럼: `항목명 | 화면 표시/입력 | UI 컴포넌트 | 필수 여부 | 데이터 타입/제약 | 기본값 | 유효성 검증 규칙 | 노출/수정 조건`
   5. 비즈니스 규칙 (수식, 한도, 중복 방지)
   6. 예외·엣지 케이스 (네트워크 장애, 연타, 빈 화면, LLM 미가용)
   7. 비즈니스 에러 코드 매핑 (API 상태 코드·`detail` ↔ 화면 메시지)
4. **전역 정책**: `docs/templates/04_POLICY_AND_EDGES_TEMPLATE.md` 구조대로 `docs/spec-writer/03_POLICIES_AND_EDGES.md`. 엔티티 상태 전이는 Mermaid `stateDiagram-v2`.
5. **지금 동작과의 관계**: 기존 기능을 바꾸면 해당 `docs/functional-spec/*.md` 의 항목을 인용하고 바뀌는 점만 적는다.

Planning Gate: 모든 단위 기능에 7대 명세와 8대 컬럼 표가 있어야 한다.
