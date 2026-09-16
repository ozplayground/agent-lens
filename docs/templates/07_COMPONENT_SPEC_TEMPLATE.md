# [화면/모듈명] UI 컴포넌트 계층 및 디자인 명세서 (Component & Design Spec)

- **작성일자**: YYYY-MM-DD
- **작성자**: UI 시스템 디자이너 (`ui-system-designer`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved

---

## 1. 컴포넌트 계층 트리 구조도 (Component Hierarchy Tree)

```
[Page: src/app/dashboard/page.tsx] (RSC)
  ├── [Layout: DashboardLayout] (RSC)
  │     ├── [Navigation: SidebarNav] (RCC - 'use client')
  │     └── [Header: UserProfileHeader] (RCC)
  └── [Feature: ChatWorkspaceContainer] (RCC - 'use client')
        ├── [Header: ChatSessionHeader] (RCC)
        ├── [MessageList: VirtualizedMessageFeed] (RCC)
        │     └── [Item: MessageBubble] (RCC)
        └── [Input: MessageComposerBar] (RCC)
```

---

## 2. Server Component (RSC) vs Client Component (RCC) 분격 정의

| 컴포넌트명 | 구분 | 선정 사유 및 담당 책임 |
| :--- | :---: | :--- |
| `DashboardPage` | **RSC** | 초기 세션 목록 SSR 페칭 및 SEO 메타데이터 주입, 번들 제로 유지 |
| `ChatWorkspaceContainer` | **RCC** | WebSocket/SSE 실시간 이벤트 수신, 사용자 입력 상태 및 키보드 단축키 핸들링 |
| `MessageBubble` | **RCC** | 텍스트 복사, 리액션 팝업, 호버 액션 등 브라우저 인터랙션 필요 |

---

## 3. 핵심 컴포넌트 Props 인터페이스 명세 (Props Contracts)

### `MessageBubble`
```typescript
export interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  onRetry?: (id: string) => void;
  onCopy?: (content: string) => void;
}
```

---

## 4. UI 5대 상태 Variants (State Handling Specification)

| 상태 (State) | 시각적 표현 및 컴포넌트 동작 | 사용자 안내 문구 / 액션 |
| :--- | :--- | :--- |
| **Idle (기본)** | 일반 메시지 리스트 노출, 입력창 포커스 활성화 | - |
| **Loading / Pending** | 스켈레톤 UI 노출 및 전송 버튼 비활성화 (스피너 표시) | 로딩 인디케이터 |
| **Error (오류)** | 빨간색 경고 인라인 텍스트 및 재시도 아이콘 노출 | "전송에 실패했습니다. [재시도]" |
| **Empty (데이터 없음)**| 대화 내역 없음 일러스트 및 시작 유도 추천 질문 칩 노출 | "어떤 도움이 필요하신가요?" |
| **Success (완료)** | 완료 체크 애니메이션 및 토스트 알림 노출 | "성공적으로 저장되었습니다." |

---

## 5. 반응형 브레이크포인트 및 접근성 (Responsive & a11y)

### 반응형 레이아웃 규칙
- **모바일 (`< 640px`)**: 사이드바 숨김 (햄버거 메뉴 오버레이 드로어), 단일 컬럼 뷰
- **태블릿 (`640px ~ 1024px`)**: 아이콘 축소 사이드바 (Collapsible Sidebar)
- **데스크톱 (`> 1024px`)**: 고정 2컬럼 레이아웃 (280px 사이드바 + 유동 콘텐츠 영역)

### 접근성 (a11y - WCAG 2.1 AA)
- 모든 모달 및 다이얼로그에 Focus Trap 적용
- 스크린 리더용 `aria-live="polite"` 속성으로 동적 메시지 추가 안내
- 색상 대비율 4.5:1 이상 준수
