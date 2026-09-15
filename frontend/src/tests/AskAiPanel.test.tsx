import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AskAiPanel, { QUICK_PROMPTS } from '@/components/news-detail/AskAiPanel';
import { NewsItem } from '@/types/news';

const mockItem: NewsItem = {
  id: 1,
  title: 'SWE-bench Multimodal: Autonomous Benchmark',
  url: 'https://example.com/swe-bench',
  source: 'github',
  category: 'harness',
  summary: 'Multimodal benchmark for AI agents.',
  author: 'princeton-nlp',
  tags: ['benchmark'],
  tldr_bullets: [],
  why_it_matters: 'Insight here',
  tech_stack: ['Python'],
  quality_score: 9.0,
  is_high_signal: true,
  raw_score: 100,
  comments_count: 5,
  hotness_score: 70.0,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  dedup_hash: 'hash123',
};

describe('AskAiPanel Component', () => {
  it('renders quick prompts and placeholder when chat history is empty', () => {
    const handleAsk = vi.fn();
    render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={[]}
        copiedIndex={null}
        onAsk={handleAsk}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
      />
    );

    expect(screen.getByText('이 소식에 대해 무엇이든 질문해보세요')).toBeInTheDocument();
    const promptButtons = screen.getAllByText('💡 핵심 원리 및 구조');
    expect(promptButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onAsk with prompt text when quick prompt pill is clicked', () => {
    const handleAsk = vi.fn();
    render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={[]}
        copiedIndex={null}
        onAsk={handleAsk}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
      />
    );

    const promptBtn = screen.getAllByText('💡 핵심 원리 및 구조')[0];
    fireEvent.click(promptBtn);

    expect(handleAsk).toHaveBeenCalledTimes(1);
    expect(handleAsk).toHaveBeenCalledWith(QUICK_PROMPTS[0].query);
  });

  it('renders chat messages correctly when chat history exists', () => {
    const history = [
      {
        q: 'SWE-bench 도입 방법은?',
        a: '도커 환경을 구축하고 벤치마크 하네스를 실행합니다.',
        model: 'Gemini 3.5 Flash',
        time: '14:30',
        isStreaming: false,
      },
    ];

    render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={history}
        copiedIndex={null}
        onAsk={vi.fn()}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
      />
    );

    expect(screen.getByText('SWE-bench 도입 방법은?')).toBeInTheDocument();
    expect(screen.getByText('도커 환경을 구축하고 벤치마크 하네스를 실행합니다.')).toBeInTheDocument();
    expect(screen.getByText('Gemini 3.5 Flash')).toBeInTheDocument();
  });
});
