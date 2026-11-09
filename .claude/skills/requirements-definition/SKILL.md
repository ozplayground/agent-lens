---
name: requirements-definition
description: 문제 정의, 페르소나, 사용자 여정, MoSCoW 우선순위, 성공 지표(KPI)로 PRD 를 쓰는 절차. "요구사항 정리", "PRD 작성", "기능 아이디어 정리" 요청이나 spec-writer 작업에 쓴다.
---

# 요구사항 정의 (PRD)

1. **문제 정의**: 대상 사용자가 겪는 핵심 문제와 제품 비전. 사용자 요청 원문을 인용한다.
2. **지금 상태 확인**: `docs/product.md`, `docs/functional-spec/*.md`, `docs/known-issues.md` 에서 관련 동작과 알려진 문제를 찾는다.
3. **페르소나와 사용자 여정**: Mermaid `journey` 로 처음부터 끝까지 여정을 그린다.
4. **MoSCoW 우선순위**
   - Must: 출시에 꼭 필요한 최소 기능
   - Should: 가치가 크지만 우회할 수 있는 기능
   - Could: 여유가 있으면 넣을 개선
   - Won't: 이번에 빼는 기능
5. **KPI**: 측정 방법이 있는 성공 지표. 측정 방법이 없으면 '측정 방법 미정' 으로 둔다.
6. **열린 질문**: 사용자 결정이 필요한 것만 적는다.
7. **산출물**: `docs/templates/02_PRD_TEMPLATE.md` 구조대로 `docs/spec-writer/01_PRD.md` 에 쓴다.
