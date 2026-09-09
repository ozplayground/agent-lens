# [기획서] 05. 수집 데이터 전체 초기화/재수집 기능 및 GitHub 스타일 UI/UX 전면 리팩토링

## 1. 기획 배경 및 요구사항

### 1.1 사용자 피드백
> 1. *"수집된 데이터는 다 삭제하고 다시 수집할 수 있게 해줘"*
> 2. *"그리고 ui 너무 촌스러워 약간 github 같은 ui로 가시성을 높이고 중요한 부분 아니면 컬러 강조는 피해"*

### 1.2 문제점 진단
1. **데이터 초기화 & 재수집 수단 부재**:
   - 현재 데이터베이스에 이미 저장된 기사들을 일괄 삭제하고 처음부터 클린하게 다시 수집하는 백엔드 API 및 프론트엔드 UI 기능이 없음.
   - 사용자가 새로운 크롤러 알고리즘이나 개선된 품질 필터링 결과를 테스트하려면 수동으로 DB 파일을 지우거나 복잡한 SQL을 실행해야 함.
2. **과도한 그라디언트와 무분별한 컬러 강조 (UI 노이즈)**:
   - 보라/인디고/핑크/에메랄드/로즈 등의 형광 그라디언트가 헤더, 히어로 배너, 카테고리 카드, 기사 카드 전반에 과다 적용되어 개발자 도구다운 전문성이 떨어지고 시각적 피로감을 유발함.
   - 중요한 정보(핵심 기술 이슈, Must-Read)와 부가 정보(소스 이름, 일반 태그)가 모두 채도 높은 뱃지로 표시되어 가시성과 가독성이 저하됨.

---

## 2. 세부 설계 및 개선 스펙

### G-01. 데이터 완전 초기화 & 원클릭 재수집 기능 (Clean Reset & Re-crawl)
1. **백엔드 API**:
   - `POST /api/schedule/reset-and-collect`:
     - 데이터베이스 내 모든 `NewsItem` 및 `CrawlLog` 레코드 삭제 (`DELETE FROM news_items`, `DELETE FROM crawl_logs`).
     - `collector_manager`의 수집 진행률 상태(누적 건수, 단계 메시지) 완전 초기화.
     - 백그라운드 태스크로 `collector_manager.collect_all()` 즉시 기동 (점진적 스트리밍 수집).
     - 삭제된 건수 및 시작 상태를 JSON으로 즉각 반환 (`{status: "started", deleted_count: N, message: "..."}`).
   - `DELETE /api/news/all`: 단순 삭제만 수행하는 엔드포인트도 함께 지원.
2. **프론트엔드 UI**:
   - 헤더 및 관리 메뉴에 GitHub 스타일 Danger 버튼 배치 (`초기화 & 재수집` / 휴지통 아이콘).
   - 실수 방지를 위한 GitHub 스타일 2차 확인 모달 (Confirmation Modal): *"모든 소식 데이터가 삭제되고 실시간 재수집이 시작됩니다. 계속하시겠습니까?"*
3. **CLI / Makefile 지원**:
   - `make reset`: CLI 환경에서도 즉시 DB를 초기화하고 재수집할 수 있는 타깃 추가.

---

### G-02. GitHub 다크 테마 기반 UI/UX 전면 리팩토링 (GitHub-Style Minimalist UI)

1. **컬러 시스템 정제 (Color Restraint & Contrast)**:
   - **기본 배경 & 캔버스**: GitHub Dark Dimmed / Dark 표준 색상 채택
     - 메인 캔버스: `#0d1117` (단색 다크)
     - 패널 / 카드 배경: `#161b22` (GitHub 서브 패널 다크)
     - 테두리(Border): `#30363d` (1px 정밀 헤어라인)
     - 텍스트 기본: `#f0f6fc` (고대비 선명한 화이트), 보조: `#8b949e` (뮤트 그레이)
   - **무분별한 무지개 그라디언트 전면 제거**:
     - 헤더 그라디언트 박스, 히어로 배너의 보라/핑크 그라디언트 제거.
     - 카드 호버 시 발생하는 과도한 컬러 글로우(Glow) 효과 제거.
   - **전략적 단일 강조색(Accent Color) 원칙**:
     - **Primary 액션 (수집)**: GitHub Green (`#238636` / `hover:#2ea043`)
     - **Danger 액션 (초기화)**: GitHub Red (`#f85149` 텍스트 + 서브 다크 보더)
     - **Active 탭/링크**: GitHub Blue (`#58a6ff`)
     - **Must-Read / Star**: GitHub Gold/Amber (`#d29922`)
     - **그 외 모든 태그/소스/카테고리**: 모노크롬 뉴트럴 뱃지 (`bg-[#21262d] border-[#30363d] text-[#8b949e] font-mono`)

2. **컴포넌트별 GitHub 스타일 개편**:
   - **헤더 (Header)**:
     - GitHub 상단 네비게이션 바 스타일: 미니멀 아이콘 + AgentLens 로고 + 버전 태그.
     - GitHub 스타일 액션 버튼 그룹 (Secondary: `#21262d`, Danger: Reset, Primary: Green Collect).
   - **카테고리 네비게이션 (GitHub Repository Sub-nav)**:
     - 기존의 거대한 5개 컬러 카드를 폐기하고, GitHub 저장소 상단 탭(`Code`, `Issues`, `Pull Requests`) 형태의 미니멀 서브네비게이션으로 개편:
     - `전체 [306]`, `하네스 & 벤치마크 [64]`, `MCP & 생태계 [70]`, `에이전트 기술 [71]`, `AI 모델 [101]`.
     - 활성 탭은 하단 언더라인(`#58a6ff` 또는 `#f78166`)과 고대비 텍스트로 깔끔하게 표시.
   - **기사 카드 (NewsCard - GitHub Issues / Discussions Style)**:
     - GitHub 이슈/PR 리스트 아이템과 유사한 고밀도, 고가독성 레이아웃.
     - 제목: `#f0f6fc` 굵은 화이트 텍스트, 호버 시 `#58a6ff` 링크 컬러.
     - `why_it_matters`: 과한 인디고 박스 대신 GitHub Blockquote / README 콜아웃 스타일 (`bg-[#0d1117] border-l-2 border-[#58a6ff] text-[#c9d1d9] text-xs`).
     - 메타데이터: 소스, 시간, 별점, 댓글수, 기술스택을 간결한 모노스페이스 뉴트럴 태그로 한눈에 스캔 가능하게 정돈.
     - 오직 `Must Read(High Signal)`인 기사만 은은한 골드 스타 아이콘과 앰버 테두리로 시각적 하이라이트 부여.
   - **데일리 브리핑 & Tech Radar**:
     - GitHub Pinned Repository 및 Pulse/Insights 그래프 스타일의 차분한 모노톤 디자인 적용.

---

## 3. 단계별 개발 및 검증 계획

- [x] **1단계: 백엔드 초기화 & 재수집 API 구현**
  - `backend/app/api/schedule.py`: `POST /api/schedule/reset-and-collect` 및 `DELETE /api/news/all` 구현.
  - 트랜잭션 락 및 안전한 테이블 truncate 처리.
- [x] **2단계: 프론트엔드 API 클라이언트 연동**
  - `frontend/src/lib/api.ts`: `resetAndRecollect()`, `deleteAllNews()` 추가.
- [x] **3단계: GitHub 스타일 컬러 시스템 및 공통 디자인 토큰 적용**
  - 배경 `#0d1117`, 패널 `#161b22`, 보더 `#30363d`, 텍스트 `#f0f6fc`/`#8b949e` (`globals.css`).
- [x] **4단계: 헤더 & 초기화 확인 모달 개편 (`Header.tsx`)**
  - GitHub 스타일 버튼(Green 수집, Danger 초기화).
  - 2차 확인 모달 구현 (`showResetModal`).
- [x] **5단계: 카테고리 네비게이션 개편 (`CategoryFilter.tsx`)**
  - GitHub Sub-nav 탭 스타일로 전면 개편.
- [x] **6단계: 뉴스 카드 및 피드 리스트 개편 (`NewsCard.tsx`, `page.tsx`, `SourceFilter.tsx`)**
  - GitHub Issue/Discussion 고가독성 카드 레이아웃.
  - 무지개 컬러 뱃지 제거 및 뉴트럴 뱃지 통일, High Signal에만 골드 스타 강조.
- [x] **7단계: 데일리 브리핑 및 Tech Radar 미니멀 디자인 정돈**
  - GitHub Pinned / Insights 스타일로 정리 (`DailyBriefingBanner.tsx`, `TechRadar.tsx`).
- [x] **8단계: 단위 테스트 및 회귀 검증**
  - `./scripts/test.sh` 29개 테스트 및 Next.js Turbopack 빌드 100% 통과.
  - `make reset` CLI 타깃 동작 검증 완료.

---

## 4. 사람(사용자) 확인 사항 및 가이드
- 작업 완료 후 사용자가 브라우저([http://localhost:3001](http://localhost:3001))에서 새로운 GitHub 다크 스타일을 확인하고, `초기화 & 재수집` 버튼을 통해 기존 데이터를 깨끗이 비운 뒤 새로운 기준으로 소식을 처음부터 다시 수집하는 실습 가이드를 제공합니다.
