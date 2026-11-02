---
paths:
  - "backend/app/schemas/**"
  - "frontend/src/types/**"
  - "frontend/src/mocks/**"
---

# 계약 동기화 (Pydantic ↔ zod ↔ MSW)

정적 계약 파일과 자동 생성이 없다. 세 곳을 손으로 맞춘다.

| 쪽 | 위치 |
|---|---|
| backend 스키마 (Pydantic) | `backend/app/schemas/chat.py`, `backend/app/schemas/news.py` |
| frontend 타입 (TS + zod) | `frontend/src/types/chat.ts`, `news.ts`, `trends.ts` |
| 목 (MSW) | `frontend/src/mocks/handlers.ts`, `frontend/src/mocks/handlers/chat.ts`, `frontend/src/mocks/fixtures/chat.ts` |
| 계약 테스트 | `frontend/src/tests/chat/ContractAndMsw.test.ts` |

## 규칙
- 한쪽을 고치면 같은 작업에서 반대쪽 타입, MSW 핸들러·fixture, 계약 테스트를 함께 고친다. 필드 이름, 필수 여부, enum 값(`Literal`), SSE 이벤트 payload 를 대조한다.
- 계약 변경은 그 기능의 `docs/features/<id>/spec.md` '설계' 에 변경 전/후로 적는다. plan.md '변경 파일' 에 세 쪽 파일과 계약 테스트를 모두 넣는다.
- 구현이 끝나면 `docs/tech-spec.md` 의 '앱 사이 인터페이스' 를 고친다.
- `make check` 로 확인한다. 계약 테스트를 약하게 만들어 통과시키지 않는다.
