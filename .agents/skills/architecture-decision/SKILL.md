---
name: architecture-decision
description: >-
  풀스택 기술 스택 및 Next.js App Router, FastAPI 계층형 아키텍처,
  데이터베이스 모델링과 토폴로지를 결정하고 아키텍처 결정 레코드(ADR)를 작성하는 스킬입니다.
---

# Architecture Decision Skill

## 절차 가이드라인
1. **기술 요구사항 분석**: 기능/비기능 요구사항, 지연 시간, Core Web Vitals, 동시성 요구치 분석
2. **대안 평가**: 계층별 2~3개 후보군 비교 (Next.js vs Vite, FastAPI vs Express, PostgreSQL vs NoSQL)
3. **결정 및 다이어그램화**: 계층 간 통신 및 토폴로지 Mermaid 다이어그램 작성
4. **산출물 작성**: `docs/templates/05_FULLSTACK_ADR_TEMPLATE.md` 구조에 맞춰 `docs/fullstack-architect/01_ARCHITECTURE_ADR.md` 저장
