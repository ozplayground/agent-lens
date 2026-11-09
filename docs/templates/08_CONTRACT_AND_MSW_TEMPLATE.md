# [도메인명] 데이터 계약 및 MSW 모의 명세서 (Contract & Mock Spec)

- **작성일자**: YYYY-MM-DD
- **작성자**: 계약 통합 엔지니어 (`contract-integrator`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved
- **목적**: 백엔드와 프론트엔드의 병렬 TDD 개발을 위한 완전한 타입 계약 및 네트워크 모킹 핸들러 확정

---

## 1. 공통 응답 엔벨로프 및 에러 계약 (Response Envelope)

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}
```

---

## 2. 도메인 TypeScript 인터페이스 & Zod 검증 스키마 (Contracts)

```typescript
import { z } from 'zod';

// 1. Chat Message Schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, '메시지는 1자 이상이어야 합니다.'),
  timestamp: z.string().datetime(),
});

export type Message = z.infer<typeof MessageSchema>;

// 2. Chat Session Schema
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  messages: z.array(MessageSchema),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

// 3. Message Send Request Schema
export const SendMessageRequestSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력해주세요.'),
  role: z.enum(['user']).default('user'),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
```

---

## 3. MSW (Mock Service Worker) 핸들러 구현 명세

프론트엔드 개발자가 백엔드 서버 없이도 컴포넌트 TDD를 완벽히 수행할 수 있도록 정의된 네트워크 레벨 모킹 코드입니다.

```typescript
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // 1. 대화 세션 목록 조회 (GET /api/v1/chats)
  http.get('/api/v1/chats', async () => {
    await delay(100);
    return HttpResponse.json([
      {
        id: '11111111-1111-1111-1111-111111111111',
        title: '신규 기능 기획 토론 세션',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: []
      }
    ]);
  }),

  // 2. 메시지 전송 (POST /api/v1/chats/:id/messages)
  http.post('/api/v1/chats/:id/messages', async ({ request, params }) => {
    const body = (await request.json()) as any;
    
    // 유효성 검증 실패 시뮬레이션
    if (!body.content || body.content.trim() === '') {
      return HttpResponse.json(
        { success: false, error: { code: 'ERR_INVALID_PAYLOAD', message: '내용이 비어있습니다.' } },
        { status: 400 }
      );
    }

    await delay(150);
    return HttpResponse.json({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `[AI 응답]: "${body.content}"에 대한 처리 결과입니다.`,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  }),
];
```

---

## 4. 캐싱, Revalidation 및 낙관적 업데이트 계약
- **Next.js Cache Tag**: `chats`, `chat-messages-[id]`
- **낙관적 업데이트 (Optimistic Updates)**:
  - 메시지 전송 즉시 UI 상에 `status: 'sending'`인 가상 메시지 노출
  - MSW/서버 성공 응답 시 서버 ID로 교체 후 `status: 'sent'` 확정
  - 실패 시 롤백 및 에러 토스트와 `[재시도]` 액션 바인딩
