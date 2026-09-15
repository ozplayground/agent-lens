---
name: fullstack-code-review
description: >-
  백엔드 및 프론트엔드 구현 코드를 5대 핵심 품질 필라(아키텍처, 클린코드, 보안, 성능, 테스트품질)
  기준으로 독립 감사하고, APPROVED 또는 REQUEST_CHANGES 판정을 내리는 코드 리뷰 스킬입니다.
---

# Fullstack Code Review Skill

## 5-Pillar 감사 기준
1. **Pillar 1: 아키텍처 정합성**: 계층 분리 원칙, RSC/RCC 경계, 설계서 일치도
2. **Pillar 2: 클린코드 & SOLID**: 단일 책임, 중복 배제, 가독성, 명확한 변수/함수명
3. **Pillar 3: 보안 & 데이터 무결성**: SQL Injection 방어, 입력값 검증(Pydantic/Zod), 환경변수 유출 방지
4. **Pillar 4: 성능 & 리소스 최적화**: N+1 쿼리 부재, 불필요한 리렌더링 방지, 비동기 논블로킹
5. **Pillar 5: 테스트 품질 & 커버리지**: TDD Red-Green 원칙 준수, 엣지/에러 케이스 커버리지

## 산출물 작성
- `docs/templates/11_CODE_REVIEW_REPORT_TEMPLATE.md` 구조에 맞춰 각 리뷰어 폴더에 저장:
  - 백엔드: `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`
  - 프론트엔드: `docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`
