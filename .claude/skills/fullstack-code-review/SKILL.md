---
name: fullstack-code-review
description: backend·frontend 변경을 5-Pillar(아키텍처, 클린코드, 보안·무결성, 성능, 테스트 품질)로 독립 감사하고 APPROVED 또는 REQUEST_CHANGES 를 판정하는 리뷰 기준. "코드 리뷰", "PR 리뷰", "머지 전에 봐줘" 요청이나 backend-code-reviewer·frontend-code-reviewer 작업에 쓴다.
---

# 풀스택 코드 리뷰

## 범위
- 오케스트레이터가 준 커밋 범위. 없으면 `git diff main...HEAD`, 브랜치가 main 이면 작업 트리 변경.
- 보지 않는 것: lockfile(`frontend/pnpm-lock.yaml`), `make check` 가 이미 잡는 린트·타입 오류.

## 5-Pillar
1. **아키텍처 정합성**: 계층 분리(backend Router → Service → Model, frontend RSC/RCC), 설계 산출물(`docs/system-designer/`, `docs/ui-system-designer/`)과의 일치.
2. **클린코드·SOLID**: 단일 책임, 중복, 이름, 과한 추상화(KISS/YAGNI 위반).
3. **보안·데이터 무결성**: SQL injection, 입력 검증(Pydantic·zod), 트랜잭션 롤백, 데이터 손상. 인증 없음·CORS 전체 허용·SSRF·비밀값 평문 저장·설정 조회 비밀값 노출·설정 재적용 누락은 검사 범위 밖이다 (`CLAUDE.md` 최우선 규칙 6).
4. **성능·리소스**: N+1, async 안의 동기 블로킹, 불필요한 리렌더·번들 증가.
5. **테스트 품질**: Red→Green 순서, 경계·오류 케이스, 테스트를 약하게 만든 흔적, UI 5대 상태.

## 준수 확인
- 계약: `backend/app/schemas/` 를 바꿨으면 TS 타입·zod, MSW 핸들러·fixture, 계약 테스트도 바꿨는가 (`.claude/rules/contract-sync.md`).
- 설정: 새 backend 설정은 `config.py` 와 `.env.example`·`backend/.env.example` 에, 새 frontend 변수는 `frontend/src/lib/env.ts` 에 있는가 (`.claude/rules/environment-standards.md`).
- 문서: 동작이 바뀌었으면 `CLAUDE.md` '지금 시스템 문서' 의 해당 문서를 같은 변경에서 고쳤는가.
- 버전: 버전을 바꿨으면 `docs/releases.md` '버전 문자열 위치' 를 모두 같은 값으로 바꿨는가.

## 산출물
`docs/templates/11_CODE_REVIEW_REPORT_TEMPLATE.md` 구조대로
- backend: `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`
- frontend: `docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`

지적마다 `path:line`, 근거(직접 확인한 출력이나 코드), 수정 제안(diff), 심각도(머지 전 필수 / 권장)를 단다. 머지 전 필수가 하나라도 있으면 `REQUEST_CHANGES`.
