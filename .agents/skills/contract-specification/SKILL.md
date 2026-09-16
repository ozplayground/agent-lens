---
name: contract-specification
description: >-
  백엔드 시스템 설계(OpenAPI)와 프론트엔드 컴포넌트 명세를 결합하여,
  TypeScript 인터페이스, Zod 유효성 검증 스키마, MSW 모의 핸들러를 완비하는 계약 통합 스킬입니다.
---

# Contract Specification Skill

## 절차 가이드라인
1. **OpenAPI 스키마 정렬**: 백엔드 REST 엔드포인트의 Request/Response 모델 확인
2. **TypeScript & Zod 동기화**: 모든 DTO 및 페이로드에 대한 Zod 검증 스키마 작성 및 타입 추론
3. **MSW (Mock Service Worker) 핸들러 작성**:
   - Happy path (200/201), 유효성 에러 (400), 인증 실패 (401), 서버 장애 (500), 응답 지연(delay) 모의
4. **산출물 작성**: `docs/templates/08_CONTRACT_AND_MSW_TEMPLATE.md` 구조에 맞춰 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 저장
