---
name: write-spec
description: 승인된 intent.md 를 요구사항과 설계를 담은 기능별 spec.md 로 만든다. Design 단계. "스펙 써줘", "설계 문서 만들어", "intent 승인됐어, 다음 단계". intent 가 승인되지 않았으면 쓰지 않는다.
argument-hint: "[기능-id]"
---

# write-spec — 지금 시스템(tech-spec) 위에서 이 기능이 바꾸는 것만 설계한다

1. `docs/features/<id>/intent.md` 를 읽는다. Status 가 accepted 가 아니면 멈추고 알린다.
2. intent 가 제품의 범위, 사용자, 원칙을 바꾸거나 새 기능이면 `docs/product.md` 에 반영한다. '기능 목록' 에 행을 추가하고 (`| <id> | <한 줄 설명> |`) Updated 를 고친다. 제품 내용만 쓰고 스킬 이름, 승인, 산출물 경로는 쓰지 않는다.
3. `docs/tech-spec.md` 를 읽고 지금 시스템을 기준으로 설계한다. 같은 폴더의 research.md 와 `docs/research/tech.md` 가 있으면 읽는다.
4. 프로젝트 정책 스킬(보안, 컴플라이언스, UX, 브랜드 등)을 불러와 적용한다.
5. [템플릿](template.md) 대로 같은 폴더에 `spec.md` 를 쓴다.
   - 설계 선택마다 근거 번호를 '근거' 절에 적는다.
   - 기술 선택이 갈리는데 근거가 없으면 `/research-tech <id> <질문 또는 후보들>` 을 실행한 뒤 결정한다.
6. 만족할 수 없거나 서로 충돌하는 정책은 '우려 사항' 표에 정책 소유자와 함께 적는다. 숨기지 않는다.
7. 앱 간 인터페이스(계약)가 바뀌면 '설계' 에 변경 전/후를 적고, `.claude/rules/contracts.md` 대로 함께 바꿀 파일(Pydantic 스키마, zod 타입, MSW 핸들러·fixture, 계약 테스트)을 적는다.
8. `Status: draft` 로 둔다. 끝나면 검토자에게 승인 명령을 한 줄로 알린다:
   `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/<id>/spec.md`

## 판정 기준
- spec 이 intent 의 문제를 푸는가
- intent 의 열린 질문마다 답했거나 넘긴 이유가 있는가
- tech-spec.md 의 어느 절이 바뀌는지 '설계' 에 적었는가

## 하지 않는 것
- tech-spec.md 수정. 구현이 끝난 뒤 `/implement-plan` 이 반영한다
