---
paths:
  - "backend/app/schemas/**"
  - "backend/app/api/**"
  - "frontend/src/types/**"
  - "frontend/src/mocks/**"
  - "frontend/src/lib/api.ts"
---

# 규칙: 계약 동기화 (Pydantic ↔ TS/zod ↔ MSW)

계약 파일 자동 생성이 없다. 세 곳을 손으로 맞춘다. 담당은 `contract-integrator` 이고, TDD 엔지니어도 이 파일을 고치면 같은 규칙을 따른다.

| 쪽 | 위치 |
|---|---|
| backend 스키마 (Pydantic) | `backend/app/schemas/chat.py`, `backend/app/schemas/news.py` |
| frontend 타입 (TS + zod) | `frontend/src/types/chat.ts`, `news.ts`, `trends.ts`, API 호출 `frontend/src/lib/api.ts` |
| 목 (MSW) | `frontend/src/mocks/handlers.ts`, `frontend/src/mocks/handlers/chat.ts`, `frontend/src/mocks/fixtures/chat.ts` |
| 계약 테스트 | `frontend/src/tests/chat/ContractAndMsw.test.ts` |

- 한쪽을 고치면 같은 작업에서 반대쪽 타입, MSW 핸들러·fixture, 계약 테스트를 함께 고친다. 필드 이름, 필수 여부, enum(`Literal`) 값, SSE 이벤트 payload 를 대조한다.
- 계약 변경은 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 에 변경 전/후로 적고, 구현이 끝나면 `docs/api.md` 와 `docs/tech-spec.md` '앱 사이 인터페이스' 를 고친다.
- `make check` 로 확인한다. 계약 테스트를 약하게 만들어 통과시키지 않는다.
