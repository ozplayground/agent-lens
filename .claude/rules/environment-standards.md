---
paths:
  - "backend/app/config.py"
  - "frontend/src/lib/env.ts"
  - "frontend/next.config.ts"
  - "**/.env.example"
  - "docker-compose.yml"
---

# 규칙: 환경변수와 설정값

## backend (FastAPI)
- 설정은 `backend/app/config.py` 의 `Settings(BaseSettings)` (pydantic-settings) 하나로 모은다. 새 설정은 여기에 타입·기본값과 함께 추가하고 `os.environ.get()` 을 코드 곳곳에서 직접 부르지 않는다.
- 우선순위는 `docs/operations.md` '설정 우선순위' 를 따른다 (`.env`·환경 변수, 루트 `config.json`).
- 필수 값이 빠졌을 때 기동을 멈춰야 하는 설정이면 pydantic 검증으로 기동 단계에서 실패시킨다 (fail-fast). 선택 기능(LLM 키, 웹훅)은 없으면 기능만 끄고 기동은 계속한다.

## frontend (Next.js)
- 브라우저에 노출돼도 되는 값만 `NEXT_PUBLIC_` 접두사를 붙인다. API 키 같은 비밀은 붙이지 않고 서버 쪽에서만 읽는다.
- 환경변수는 `frontend/src/lib/env.ts` 의 zod 스키마(`clientEnvSchema`, `serverEnvSchema`)로 검증한다. 새 변수는 이 스키마에 함께 추가한다.

## 공통
1. 실제 `.env`·`.env.local`·`backend/.env` 는 커밋하지 않는다 (`.gitignore`).
2. 새 환경변수를 추가하면 같은 작업에서 `.env.example`, `backend/.env.example` 에 더미 값과 설명을 넣고, `docs/operations.md` '설정과 환경 변수' 를 고친다.
3. 암호화 키·서명 키는 32자 이상 난수 문자열을 쓴다.
4. 버전 문자열은 `docs/releases.md` '버전 문자열 위치' 의 파일을 모두 같은 값으로 바꾼다.
