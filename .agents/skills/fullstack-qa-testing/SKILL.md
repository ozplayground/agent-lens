---
name: fullstack-qa-testing
description: >-
  사전 QA 테스트 계획서 수립, 라이브 환경 E2E 및 API 테스트 실행(qa_runner.py),
  사후 QA 결과 보고서 작성 및 최종 출시 승인(Sign-off)을 평가하는 품질 보증 스킬입니다.
---

# Fullstack QA Testing Skill

## 실행 절차
1. **Pre-QA 테스트 계획서 수립**:
   - `docs/templates/12_QA_TEST_PLAN_TEMPLATE.md` 기반 `docs/qa-engineer/01_QA_TEST_PLAN.md` 작성
   - 핵심 사용자 시나리오, 엣지 케이스, 권한 검증 매트릭스 구성
2. **QA 실행 및 검증**:
   - `python3 .agents/skills/fullstack-qa-testing/scripts/qa_runner.py --base-url http://localhost:8000`
   - 브라우저 반응형 및 접근성 인터랙션 검증
3. **Post-QA 테스트 결과 보고서 작성**:
   - `docs/templates/13_QA_TEST_REPORT_TEMPLATE.md` 기반 `docs/qa-engineer/02_QA_TEST_REPORT.md` 작성
   - 결함 심각도 분류 및 최종 RELEASE_APPROVED 여부 판정
