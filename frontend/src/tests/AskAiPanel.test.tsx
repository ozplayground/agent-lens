import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
    const promptButtons = screen.getAllByText('핵심 원리 및 구조');
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

    const promptBtn = screen.getAllByText('핵심 원리 및 구조')[0];
    fireEvent.click(promptBtn);

    expect(handleAsk).toHaveBeenCalledTimes(1);
    expect(handleAsk).toHaveBeenCalledWith(QUICK_PROMPTS[0].query);
  });

  it('draws a decorative icon before each quick prompt label instead of an emoji (R44)', () => {
    render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={[]}
        copiedIndex={null}
        onAsk={vi.fn()}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
      />
    );

    const group = screen.getByRole('group', { name: '빠른 질문' });
    for (const p of QUICK_PROMPTS) {
      const btn = within(group).getByRole('button', { name: p.label });
      expect(btn.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
      expect(p.label).not.toMatch(/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u);
    }
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

describe('AskAiPanel 2차 (R16·R28·R15)', () => {
  const answered = [
    {
      q: '첫 질문',
      a: '첫 답변',
      model: 'Gemini 3.5 Flash',
      time: '14:30',
      isStreaming: false,
    },
    {
      q: '둘째 질문',
      a: '둘째 답변',
      model: 'Gemini 3.5 Flash',
      time: '14:31',
      isStreaming: false,
    },
  ];

  function renderPanel(extra: Partial<React.ComponentProps<typeof AskAiPanel>> = {}) {
    return render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={answered}
        copiedIndex={null}
        onAsk={vi.fn()}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
        {...extra}
      />
    );
  }

  it('uses the short placeholder 이 기사에 대해 질문하세요', () => {
    renderPanel({ chatHistory: [] });
    expect(screen.getByRole('textbox', { name: '질문 입력' })).toHaveAttribute(
      'placeholder',
      '이 기사에 대해 질문하세요'
    );
  });

  it('shows 복사 실패 on the failed answer copy button with a polite live region (copyFailedIndex)', () => {
    renderPanel({ copyFailedIndex: 0 });
    const copyButtons = screen.getAllByTitle('답변 복사');
    expect(copyButtons).toHaveLength(2);
    expect(copyButtons[0]).toHaveTextContent('복사 실패');
    expect(copyButtons[1]).toHaveTextContent('복사');
    expect(copyButtons[1]).not.toHaveTextContent('복사 실패');

    const live = document.querySelectorAll('[aria-live="polite"]');
    const failedLive = Array.from(live).filter((el) => el.textContent === '복사 실패');
    expect(failedLive).toHaveLength(1);
    expect(failedLive[0]).toHaveClass('sr-only');
  });

  it('keeps the plain 복사 label when copyFailedIndex is null', () => {
    renderPanel({ copyFailedIndex: null });
    for (const btn of screen.getAllByTitle('답변 복사')) {
      expect(btn).not.toHaveTextContent('복사 실패');
    }
  });

  it('renders quick prompts in a single scroll row named 빠른 질문', () => {
    renderPanel({ chatHistory: [] });
    const group = screen.getByRole('group', { name: '빠른 질문' });
    expect(group).toHaveAttribute('data-scroll-row');
    expect(group).toHaveAttribute('data-overflow');
    for (const p of QUICK_PROMPTS) {
      expect(screen.getByRole('button', { name: p.label })).toBeInTheDocument();
    }
  });
});

describe('AskAiPanel 응답 엔진 표기 (리뷰 FE-25, QA D-25)', () => {
  function renderWith(chatHistory: React.ComponentProps<typeof AskAiPanel>['chatHistory']) {
    return render(
      <AskAiPanel
        item={mockItem}
        question=""
        setQuestion={vi.fn()}
        asking={false}
        chatHistory={chatHistory}
        copiedIndex={null}
        onAsk={vi.fn()}
        onCopy={vi.fn()}
        onClearChat={vi.fn()}
      />
    );
  }

  it('질문 전에는 특정 엔진 이름을 고정해 보이지 않는다', () => {
    renderWith([]);
    expect(screen.getByText('실시간 스트리밍')).toBeInTheDocument();
    expect(screen.queryByText(/Gemini/)).not.toBeInTheDocument();
  });

  it('머리줄에 마지막 답변의 실제 응답 엔진(meta)을 보인다', () => {
    renderWith([
      { q: '첫 질문', a: '첫 답변', model: 'AgentLens Heuristic Engine', time: '14:30' },
      { q: '둘째 질문', a: '둘째 답변', model: 'claude-sonnet-5-5', time: '14:31' },
    ]);
    expect(screen.getByText('응답 엔진: claude-sonnet-5-5')).toBeInTheDocument();
  });
});
