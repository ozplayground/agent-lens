# Rule: Fullstack Environment Configuration & Settings Best Practices

## 1. 개요
본 규칙은 백엔드(Python FastAPI)와 프론트엔드(Next.js React) 전반에서 환경변수와 설정값을 안전하고 엄격하게 관리하기 위한 언어별 모범사례(Best Practice)를 규정합니다.

---

## 2. 백엔드 환경변수 규칙 (Python FastAPI)

### 2.1 Pydantic-Settings 기반의 엄격한 타입 검증
- 모든 백엔드 환경변수는 `pydantic_settings.BaseSettings`를 상속받은 `Settings` 클래스를 통해 단일 진실 공급원(Single Source of Truth)으로 관리되어야 합니다.
- `os.environ.get()` 직접 호출을 금지하며, 타입 힌트와 기본값, 유효성 검증(`@field_validator`)을 필수로 적용합니다.

```python
# 올바른 예시
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    PROJECT_NAME: str = "Omnichat API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    PORT: int = 8000
    DATABASE_URL: str
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
```

### 2.2 Failsafe 즉시 실패 원칙 (Fail-Fast)
- 필수 환경변수(예: `DATABASE_URL`, `SECRET_KEY`)가 누락된 경우, 서버 기동 단계에서 Pydantic 검증 에러를 발생시켜 애플리케이션 실행을 즉각 중단(Fail-Fast)해야 합니다.

---

## 3. 프론트엔드 환경변수 규칙 (Next.js React)

### 3.1 클라이언트 vs 서버 환경변수 경계 분리
- 브라우저에 노출되어도 무방한 공개 변수에만 반드시 `NEXT_PUBLIC_` 접두사를 부여합니다.
- API 비밀키, 서비스 계정 인증 정보 등 민감한 값은 절대 `NEXT_PUBLIC_`을 붙이지 않으며 Server Components 또는 Server Actions에서만 접근합니다.

### 3.2 Zod 기반 런타임 스키마 검증 (`src/config/env.ts`)
- 프론트엔드 역시 `process.env`를 임의로 참조하지 않고, Zod 스키마를 통해 빌드 타임 및 앱 초기화 시점에 유효성을 검증하는 래퍼 모듈을 사용합니다.

```typescript
// 올바른 예시
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
});
```

---

## 4. 공통 보안 및 버전 관리 원칙
1. **`.env` 파일의 커밋 절대 금지**: 실제 환경변수 파일(`.env`, `.env.local`, `.env.production`)은 `.gitignore`에 반드시 포함되어 버전 관리에서 제외되어야 합니다.
2. **`.env.example` 최신화 의무**: 신규 환경변수가 추가될 때마다 더미 값과 주석 설명이 포함된 `.env.example`을 즉시 갱신해야 합니다.
3. **시크릿 복잡도**: 암호화 키, JWT 시크릿 등은 최소 32자 이상의 난수 문자열을 사용해야 합니다.
