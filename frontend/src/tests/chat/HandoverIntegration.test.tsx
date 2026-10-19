import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import NewsDetailModal from '@/components/NewsDetailModal';
import HandoverCtaButton from '@/components/chat/HandoverCtaButton';
import { NewsItem } from '@/types/news';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

const mockItem: NewsItem = {
  id: 101,
  title: 'FastMCP: High-performance Python MCP Framework',
  url: 'https://github.com/jlowin/fastmcp',
  source: 'github',
  category: 'mcp_plugins_skills',
  summary: 'FastMCP provides a decorator-based syntax for creating MCP servers.',
  author: 'Jeremiah Lowin',
  tags: ['mcp'],
  tldr_bullets: ['경량 MCP 서버 구축'],
  why_it_matters: 'Claude Desktop에 연동 가능합니다.',
  tech_stack: ['Python', 'FastMCP'],
  quality_score: 9.3,
  is_high_signal: true,
  raw_score: 120,
  comments_count: 10,
  hotness_score: 94.2,
  published_at: '2026-09-15T08:00:00Z',
  created_at: '2026-09-15T08:30:00Z',
  dedup_hash: 'hash101',
};

describe('Feed & Modal Context Handover Integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders AI 챗 link in Header navigation bar pointing to /chat', () => {
    render(
      <Header
        onRefresh={vi.fn()}
        onOpenSchedule={vi.fn()}
        onOpenMcp={vi.fn()}
      />
    );

    const chatLink = screen.getByRole('link', { name: /AI 챗/i });
    expect(chatLink).toBeInTheDocument();
    expect(chatLink).toHaveAttribute('href', '/chat');
  });

  it('HandoverCtaButton navigates to /chat?sourceId={id} and stops click propagation', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <HandoverCtaButton item={mockItem} variant="card-compact" />
      </div>
    );

    const btn = screen.getByRole('button', { name: /전용 챗에서 분석|Ask AI/i });
    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith('/chat?sourceId=101');
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('HandoverCtaButton encodes draftQuestion into q query parameter', () => {
    render(
      <HandoverCtaButton
        item={mockItem}
        variant="modal-banner"
        draftQuestion="FastMCP 설치 방법 알려줘"
      />
    );

    const btn = screen.getByRole('button', { name: /전용 AI 챗으로 이동|전용 챗에서 분석/i });
    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith(
      `/chat?sourceId=101&q=${encodeURIComponent('FastMCP 설치 방법 알려줘')}`
    );
  });

  it('NewsCard includes handover CTA button that does not trigger card selection', () => {
    const handleSelect = vi.fn();
    render(
      <NewsCard
        item={mockItem}
        onSelect={handleSelect}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    );

    const handoverBtn = screen.getByRole('button', { name: /전용 챗에서 분석|Ask AI/i });
    fireEvent.click(handoverBtn);

    expect(mockPush).toHaveBeenCalledWith('/chat?sourceId=101');
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('NewsDetailModal includes handover button to transfer current question to dedicated chat', () => {
    render(
      <NewsDetailModal
        item={mockItem}
        isOpen={true}
        onClose={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    );

    const handoverBtn = screen.getByRole('button', { name: /전용 AI 챗으로 이동|전용 챗에서 분석/i });
    fireEvent.click(handoverBtn);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/chat?sourceId=101'));
  });
});
