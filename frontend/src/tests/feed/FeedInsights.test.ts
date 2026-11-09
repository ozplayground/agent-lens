import { describe, it, expect } from 'vitest';
import { findRepeatedInsights } from '@/lib/feed-insights';
import type { NewsItem } from '@/types/news';

const AGENT_INSIGHT =
  '단일 프롬프트를 넘어 복합 멀티에이전트 협업, 상태 영속성, 자율 브라우징 워크플로우를 구축하는 실전 아키텍처를 제시합니다.';
const FRONTIER_INSIGHT =
  '프론티어 추론 모델과 오픈소스 LLM의 성능 혁신을 통해 자율 에이전트의 기반 추론 능력(Reasoning)이 한 단계 도약함을 시사합니다.';

function makeItem(id: number, whyItMatters: unknown): NewsItem {
  return {
    id,
    title: `기사 ${id}`,
    url: `https://example.com/${id}`,
    source: 'github',
    category: 'agent_tech',
    summary: `요약 ${id}`,
    author: null,
    tags: [],
    tldr_bullets: [],
    why_it_matters: whyItMatters as string,
    tech_stack: [],
    quality_score: 6,
    is_high_signal: false,
    raw_score: 0,
    comments_count: 0,
    hotness_score: 0,
    published_at: '2026-11-01T00:00:00Z',
    created_at: '2026-11-01T00:00:00Z',
    dedup_hash: `hash-${id}`,
  };
}

describe('findRepeatedInsights', () => {
  it('returns the ids of articles whose insight sentence appears twice', () => {
    const result = findRepeatedInsights([
      makeItem(1, AGENT_INSIGHT),
      makeItem(2, '이 기사만의 고유한 시사점 문장으로 다른 기사와 겹치지 않는 설명입니다.'),
      makeItem(3, AGENT_INSIGHT),
    ]);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it('groups the backend "<tech> 기반 구현에서 " prefixed variant with the plain sentence', () => {
    const result = findRepeatedInsights([
      makeItem(10, `LangGraph 기반 구현에서 ${AGENT_INSIGHT}`),
      makeItem(11, AGENT_INSIGHT),
      makeItem(12, FRONTIER_INSIGHT),
    ]);
    expect([...result].sort((a, b) => a - b)).toEqual([10, 11]);
  });

  it('normalizes whitespace before comparing (runs of spaces, leading and trailing spaces)', () => {
    const spaced = `  ${FRONTIER_INSIGHT.replace(/ /g, '   ')}\n`;
    const result = findRepeatedInsights([makeItem(20, FRONTIER_INSIGHT), makeItem(21, spaced)]);
    expect([...result].sort((a, b) => a - b)).toEqual([20, 21]);
  });

  it('ignores sentences shorter than 20 characters after normalizing', () => {
    const short = '짧은 시사점 문장입니다'; // 12자
    const result = findRepeatedInsights([makeItem(30, short), makeItem(31, short), makeItem(32, `  ${short}  `)]);
    expect(result.size).toBe(0);
  });

  it('excludes sentences that appear only once', () => {
    const result = findRepeatedInsights([
      makeItem(40, AGENT_INSIGHT),
      makeItem(41, FRONTIER_INSIGHT),
    ]);
    expect(result.size).toBe(0);
  });

  it('excludes empty and null insights', () => {
    const result = findRepeatedInsights([
      makeItem(50, ''),
      makeItem(51, ''),
      makeItem(52, null),
      makeItem(53, null),
      makeItem(54, '   '),
      makeItem(55, '   '),
      makeItem(56, AGENT_INSIGHT),
      makeItem(57, AGENT_INSIGHT),
    ]);
    expect([...result].sort((a, b) => a - b)).toEqual([56, 57]);
  });

  it('returns an empty set for an empty list', () => {
    expect(findRepeatedInsights([]).size).toBe(0);
  });
});
