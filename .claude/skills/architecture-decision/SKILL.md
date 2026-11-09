---
name: architecture-decision
description: 기술 스택, Next.js App Router 와 FastAPI 계층 구조, 데이터 저장·토폴로지를 결정하고 아키텍처 결정 기록(ADR)을 쓰는 절차. "기술 선택", "아키텍처 결정", "라이브러리 비교", "ADR" 요청이나 fullstack-architect 작업에 쓴다.
---

# 아키텍처 결정 (ADR)

1. **요구 분석**: 기능·비기능 요구(지연, Core Web Vitals, 동시성, 확장성, 보안). 지금 구성은 `docs/fullstack-architect/01_ARCHITECTURE_ADR.md` 를 기준으로 한다.
2. **대안 평가**: 결정이 갈리는 계층마다 후보 2~3개를 같은 기준으로 비교한다 (성숙도, 라이선스, 호환성, 성능, 운영 부담). 외부 사실은 출처 URL 로, 성능은 측정했을 때만 숫자로 쓴다. 필요하면 `bench/<주제>/` 에 측정 스크립트를 두고 돌린다.
3. **결정과 다이어그램**: 선택, 버린 대안, 근거, 결과(트레이드오프). 계층 간 통신과 토폴로지는 Mermaid 로 그린다.
4. **산출물**: `docs/templates/05_FULLSTACK_ADR_TEMPLATE.md` 구조대로 `docs/fullstack-architect/01_ARCHITECTURE_ADR.md`.
5. 구현이 끝나면 ADR 의 '기술 선택과 근거' 와 '변경 이력' 표에 행을 추가한다.
