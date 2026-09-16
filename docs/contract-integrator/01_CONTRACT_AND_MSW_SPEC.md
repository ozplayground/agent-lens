# AgentLens 데이터 계약 및 MSW 모의 명세서 (Contract & MSW Spec)

- **작성일자**: 2026-09-15
- **작성자**: 컨트랙트 통합가 (`contract-integrator`)
- **문서 버전**: v2.0
- **상태**: Approved (병렬 구현 착수 기준점)

---

## 1. 개요 및 목적 (Executive Summary)
본 문서는 백엔드 OpenAPI 스키마(`02_OPENAPI_SPEC.yaml`)와 프론트엔드 간의 데이터 계약(Contract)을 확정하고, 프론트엔드와 백엔드가 서로의 구현 완료를 기다리지 않고 완벽하게 독립적으로 TDD(Test Driven Development)에 착수할 수 있도록 TypeScript 인터페이스, Zod 스키마, MSW(Mock Service Worker) 핸들러를 정의합니다.

---

## 2. TypeScript 인터페이스 & Zod 검증 스키마

```typescript
import { z } from 'zod';

// 1. 뉴스 아이템 스키마
export const NewsItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.enum(['harness', 'mcp_plugins_skills', 'agent_tech', 'ai_news']),
  summary: z.string().default(''),
  author: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  tldr_bullets: z.array(z.string()).default([]),
  why_it_matters: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
  quality_score: z.number().min(1.0).max(10.0),
  is_high_signal: z.boolean().default(false),
  raw_score: z.number().int().default(0),
  comments_count: z.number().int().default(0),
  hotness_score: z.number().default(0.0),
  published_at: z.string().datetime(),
  created_at: z.string().datetime(),
  dedup_hash: z.string().length(64)
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

// 2. 피드 목록 응답 스키마
export const NewsListResponseSchema = z.object({
  items: z.array(NewsItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative()
});

export type NewsListResponse = z.infer<typeof NewsListResponseSchema>;

// 3. Ask AI 요청 및 응답 스키마
export const AskQuestionRequestSchema = z.object({
  question: z.string().min(2, '질문은 최소 2글자 이상이어야 합니다.').max(500)
});

export const AskQuestionResponseSchema = z.object({
  news_id: z.number().int(),
  question: z.string(),
  answer: z.string().min(1),
  model_used: z.string().nullable().optional()
});

export type AskQuestionResponse = z.infer<typeof AskQuestionResponseSchema>;
```

---

## 3. MSW (Mock Service Worker) 핸들러 정의

프론트엔드 컴포넌트 TDD 및 격리 개발을 위한 모의 핸들러 명세입니다.

```typescript
import { http, HttpResponse, delay } from 'msw';

export const mockNewsItems: NewsItem[] = [
  {
    id: 101,
    title: 'SWE-bench Multimodal: Autonomous Software Engineering Benchmark',
    url: 'https://github.com/swe-bench/SWE-bench',
    source: 'github',
    category: 'harness',
    summary: 'SWE-bench에 멀티모달 기능이 추가되어 GUI 버그 해결 벤치마크 지원.',
    author: 'princeton-nlp',
    tags: ['benchmark', 'harness', 'agent'],
    tldr_bullets: [
      '멀티모달 이미지 기반 버그 리포트 벤치마킹 지원',
      '기존 텍스트 전용 대비 실세계 GUI 이슈 해결 능력 평가',
      '상위 프론티어 에이전트들의 평균 해결률 18.5% 기록'
    ],
    why_it_matters: '단순 코드 작성을 넘어 UI/UX 피드백 루프를 수용하는 차세대 하네스 평가 표준으로 부상하고 있습니다.',
    tech_stack: ['SWE-bench', 'Docker', 'Python'],
    quality_score: 9.2,
    is_high_signal: true,
    raw_score: 4500,
    comments_count: 82,
    hotness_score: 95.5,
    published_at: '2026-09-15T08:00:00Z',
    created_at: '2026-09-15T08:30:00Z',
    dedup_hash: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef'
  }
];

export const handlers = [
  // 1. 피드 목록 조회 (200 OK)
  http.get('/api/news', async ({ request }) => {
    await delay(50);
    return HttpResponse.json({
      items: mockNewsItems,
      total: 1,
      page: 1,
      size: 18,
      total_pages: 1
    });
  }),

  // 2. Ask AI 질의 (200 OK)
  http.post('/api/news/:id/ask', async ({ request, params }) => {
    const body = (await request.json()) as { question: string };
    if (!body.question || body.question.trim().length < 2) {
      return HttpResponse.json({ detail: 'Question too short' }, { status: 400 });
    }
    await delay(100);
    return HttpResponse.json({
      news_id: Number(params.id),
      question: body.question,
      answer: 'SWE-bench Multimodal은 웹 브라우저 렌더링 결과와 콘솔 로그를 에이전트가 복합 분석하여 결함을 교정하는 벤치마크입니다.',
      model_used: 'mock-llm-engine'
    });
  }),

  // 3. 서버 장애 시뮬레이션 핸들러
  http.get('/api/news/error-trigger', () => {
    return HttpResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  })
];
```
