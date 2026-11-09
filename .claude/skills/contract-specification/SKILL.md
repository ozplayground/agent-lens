---
name: contract-specification
description: backend API 설계(Pydantic·OpenAPI)와 frontend 컴포넌트 명세를 합쳐 TS 타입·zod 스키마·MSW 핸들러·fixture·계약 테스트를 맞추고 계약 문서를 쓰는 절차. "API 계약", "타입 맞추기", "목 만들기", "MSW" 요청이나 contract-integrator 작업에 쓴다.
---

# 계약 명세

파일 대응은 `.claude/rules/contract-sync.md` 다.

1. **API 정렬**: `docs/system-designer/` 의 엔드포인트와 `backend/app/schemas/*.py` 의 요청·응답 모델을 확인한다. 지금 계약은 `docs/api.md` 에 있다.
2. **TS·zod**: `frontend/src/types/*.ts` 에 zod 스키마를 쓰고 `z.infer` 로 타입을 뽑는다. 필드 이름, 필수 여부, enum, null 허용을 Pydantic 과 1:1 로 맞춘다. 호출 함수는 `frontend/src/lib/api.ts`.
3. **MSW**: `frontend/src/mocks/handlers*.ts` 와 `fixtures/` 에 정상(200/201), 검증 오류(400·422), 없음(404), 서버 오류(500), LLM 미가용(503), 지연(`delay`) 핸들러를 둔다. SSE 는 이벤트 순서와 payload 를 실제와 같게 만든다.
4. **계약 테스트**: `frontend/src/tests/chat/ContractAndMsw.test.ts` 에 fixture 가 zod 스키마를 통과하는지와 핸들러 응답 모양을 단언한다. 새 도메인이면 같은 폴더 규칙으로 파일을 추가한다.
5. **확인**: `cd frontend && pnpm test`.
6. **산출물**: `docs/templates/08_CONTRACT_AND_MSW_TEMPLATE.md` 구조대로 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`. 바뀌는 계약은 변경 전/후를 적는다.
