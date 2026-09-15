import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsCard from '@/components/NewsCard';
import { NewsItem } from '@/types/news';

const mockItem: NewsItem = {
  id: 1,
  title: 'SWE-bench Multimodal: Software Engineering Benchmark',
  url: 'https://example.com/swe-bench',
  source: 'github',
  category: 'harness',
  summary: 'A multimodal software engineering benchmark for autonomous agents.',
  author: 'princeton-nlp',
  tags: ['harness', 'benchmark'],
  tldr_bullets: [
    '멀티모달 이미지 기반 버그 해결 평가',
    '기존 텍스트 전용 대비 실세계 GUI 이슈 해결 능력 측정',
    '상위 프론티어 에이전트들의 해결률 기록'
  ],
  why_it_matters: '에이전트 평가 하네스의 새로운 표준으로 부상하고 있습니다.',
  tech_stack: ['SWE-bench', 'Docker', 'Python'],
  quality_score: 9.0,
  is_high_signal: true,
  raw_score: 120,
  comments_count: 15,
  hotness_score: 85.0,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  dedup_hash: 'mockhash123'
};

describe('NewsCard Component', () => {
  it('renders title, category, insight, and tech stack correctly', () => {
    const handleSelect = vi.fn();
    const handleToggleBookmark = vi.fn();

    render(
      <NewsCard
        item={mockItem}
        onSelect={handleSelect}
        isBookmarked={false}
        onToggleBookmark={handleToggleBookmark}
      />
    );

    // Title is rendered
    expect(screen.getByText('SWE-bench Multimodal: Software Engineering Benchmark')).toBeInTheDocument();

    // Category label is rendered
    expect(screen.getByText('Harness')).toBeInTheDocument();

    // Developer Insight is rendered
    expect(screen.getByText('에이전트 평가 하네스의 새로운 표준으로 부상하고 있습니다.')).toBeInTheDocument();

    // Tech stack is rendered
    expect(screen.getByText('SWE-bench')).toBeInTheDocument();
  });

  it('renders Must-Read high signal badge when is_high_signal is true', () => {
    render(
      <NewsCard
        item={mockItem}
        onSelect={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    );

    expect(screen.getByText('Must-Read')).toBeInTheDocument();
  });

  it('calls onToggleBookmark with stopPropagation when bookmark button is clicked', () => {
    const handleSelect = vi.fn();
    const handleToggleBookmark = vi.fn();

    render(
      <NewsCard
        item={mockItem}
        onSelect={handleSelect}
        isBookmarked={false}
        onToggleBookmark={handleToggleBookmark}
      />
    );

    const bookmarkBtn = screen.getByTitle('보관하기');
    fireEvent.click(bookmarkBtn);

    expect(handleToggleBookmark).toHaveBeenCalledTimes(1);
    // Card select shouldn't be called because stopPropagation is called
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('triggers onSelect when card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <NewsCard
        item={mockItem}
        onSelect={handleSelect}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockItem);
  });
});
