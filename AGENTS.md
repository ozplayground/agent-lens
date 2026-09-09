# AgentLens 개발 가이드 및 하네스 규약

## 1. 프로젝트 개요
- **프로젝트명**: AgentLens
- **목적**: 전세계 AI 뉴스, Agent 기술 뉴스, 최신 하네스(Harness) 방법론, MCP/Skill/Plugin 생태계 소식을 수집하여 큐레이션 및 시각화 제공
- **수집 주기**: 매일 00:00, 06:00, 12:00, 18:00 (UTC 기준) 정기 크론 수집 및 즉시 수집 지원

## 2. 기술 스택
- **프론트엔드**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **백엔드**: Python 3.11+, FastAPI, SQLAlchemy (Async), aiosqlite, APScheduler, HTTPX
- **통합 도구**: Makefile, Bash scripts

## 3. 핵심 디렉토리 구조
```
agentlens/
├── AGENTS.md                 # 에이전트 개발 하네스 가이드
├── docs/                     # 기획 및 설계 하네스 문서
│   ├── prd.md               # 요구사항 정의서 (PRD)
│   └── architecture.md      # 시스템 및 데이터 아키텍처
├── Makefile                  # 프로젝트 실행/테스트 하네스
├── backend/                  # Python FastAPI 백엔드 및 수집기
└── frontend/                 # Next.js 프론트엔드
```

## 4. 에이전트 작업 원칙
1. 코드는 문서(`docs/prd.md`, `docs/architecture.md`)에 정의된 스펙을 반드시 준수한다.
2. 단위 테스트 및 정적 분석 통과 후 커밋/빌드한다.
3. 작업 영역은 오직 `agentlens/` 내부로 한정한다.

## 5. 브랜치 전략 및 릴리즈 하네스 규약 (Git & Versioning Workflow)
### 5.1 작업 브랜치 전략
1. **작업 브랜치 기반 개발**: 향후 모든 기능 구현, 버그 수정 및 개선 작업 시 반드시 작업 브랜치(`feat/*`, `fix/*`, `refactor/*` 등)를 생성하여 작업한다.
2. **`main` 브랜치 머지 원칙**:
   - 에이전트 임의로 `main` 브랜치에 직접 머지하거나 푸시하지 않는다.
   - 작업 브랜치에서 자체 검증(테스트 하네스 통과)을 완료한 후, **사용자(USER)가 직접 테스트하고 명시적으로 머지를 지시할 때만** `main` 브랜치로 머지한다.

### 5.2 버전 관리 체계 (Semantic Versioning: `1.11.111` 형식)
버전 번호는 `Major.Minor.Patch` 형식을 따르며 아래 규칙에 따라 단계적으로 업데이트한다:
- **Patch 버전 (+0.0.1)**: 단일 작업/태스크 완료, 버그 수정, 핫픽스 등 1회의 작업이 완료될 때마다 1씩 증가.
- **Minor 버전 (+0.1.0)**: 하나의 완결된 새로운 기능(Feature) 개발이 완료되었을 때 증가 (Patch는 0으로 리셋).
- **Major 버전 (+1.0.0)**: 아키텍처 대개편, 핵심 엔진 교체 등 큰 틀의 대규모 업데이트가 이루어졌을 때 증가 (Minor, Patch는 0으로 리셋).

### 5.3 릴리즈 및 태그 생성
- `main` 브랜치 머지 및 정식 릴리즈 시점마다 GitHub에 해당 버전 태그(예: `v1.0.0`) 및 GitHub Release를 생성하여 배포 이력을 투명하게 관리한다.

