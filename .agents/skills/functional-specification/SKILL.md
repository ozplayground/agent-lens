---
name: functional-specification
description: >-
  기능 계층 트리(1Depth > 2Depth > 3Depth)를 체계화하고, 단위 기능별 7대 상세 명세와
  화면 표시/입력 데이터 항목 명세 표(8대 표준 컬럼)를 완비하여 도메인별 모듈러 FSD를 작성하는 스킬입니다.
---

# Functional Specification Skill (상세기능정의서 작성 스킬)

## 절차 가이드라인
1. **기능 트리 구조화**: 1Depth(도메인) > 2Depth(화면/모듈) > 3Depth(단위기능) 체계화
2. **전체 기능 인덱스 작성**: `docs/templates/03_FUNCTIONAL_SPECIFICATION_INDEX_TEMPLATE.md` 기반 `docs/spec-writer/02_FUNCTIONAL_SPECIFICATION.md` 작성
3. **도메인별 모듈러 FSD 작성 (`docs/spec-writer/fsd/{DOMAIN}_SPECIFICATION.md`)**:
   - `docs/templates/fsd/DOMAIN_FSD_TEMPLATE.md` 기반 작성
   - 단위기능 고유 ID(`FUNC-도메인-001`) 부여 및 7대 상세 명세 완비:
     1. 기본 정보 (ID, 화면코드, 우선순위, 액터)
     2. 사전 조건 (Pre-conditions)
     3. 인터랙션 흐름 및 Mermaid 플로우차트 (`flowchart TD`)
     4. **화면 표시 및 입력 데이터 항목 명세 표 (UI 8대 표준 컬럼)**:
        `[항목명 | 화면 표시/입력 구분 | UI 컴포넌트 | 필수 여부 | 데이터 타입/제약 | 기본값 | 유효성 검증 규칙 | 노출/수정 조건]`
     5. 비즈니스 규칙 (Business Rules)
     6. 예외 처리 및 엣지 케이스 (Edge Cases)
     7. 비즈니스 에러 코드 매핑
4. **전역 비즈니스 정책 명세**: `docs/templates/04_POLICY_AND_EDGES_TEMPLATE.md` 기반 `docs/spec-writer/03_POLICIES_AND_EDGES.md` 작성
