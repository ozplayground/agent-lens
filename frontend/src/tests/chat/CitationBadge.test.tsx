import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CitationBadge from '@/components/chat/CitationBadge';
import { mockArticles } from '@/mocks/fixtures/chat';
import { SourceReference } from '@/types/chat';

describe('CitationBadge and CitationPopover Component', () => {
  const mockSource: SourceReference = {
    index: 1,
    type: 'primary',
    id: 101,
    title: mockArticles[101].title,
    url: mockArticles[101].url,
    source: mockArticles[101].source,
    category: mockArticles[101].category,
    quality_score: mockArticles[101].quality_score,
    snippet: 'FastMCP provides decorator-based syntax for Python MCP servers.',
    published_at: mockArticles[101].published_at,
  };

  it('renders inline interactive badge with accessible ARIA attributes when source is provided', () => {
    render(<CitationBadge index={1} source={mockSource} />);

    const badge = screen.getByRole('button', { name: /출처 1번/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-haspopup', 'dialog');
    expect(badge).toHaveAttribute('aria-expanded', 'false');
    expect(badge).toHaveTextContent('[1]');
  });

  it('renders non-interactive fallback span for phantom citation when source is undefined', () => {
    render(<CitationBadge index={99} source={undefined} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const fallbackText = screen.getByText('[99]');
    expect(fallbackText).toBeInTheDocument();
    expect(fallbackText.tagName).toBe('SPAN');
  });

  it('opens CitationPopover dialog on click or hover and displays source details', () => {
    const handleOpenDetail = vi.fn();
    render(
      <CitationBadge
        index={1}
        source={mockSource}
        onOpenSourceDetail={handleOpenDetail}
      />
    );

    const badge = screen.getByRole('button', { name: /출처 1번/i });
    fireEvent.click(badge);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(mockSource.title)).toBeInTheDocument();
    expect(screen.getByText(/FastMCP provides decorator-based/i)).toBeInTheDocument();

    // External link
    const externalLink = screen.getByRole('link', { name: /원문/i });
    expect(externalLink).toHaveAttribute('href', mockSource.url);
    expect(externalLink).toHaveAttribute('target', '_blank');

    // Detail button
    const detailBtn = screen.getByRole('button', { name: /기사 상세|상세 보기/i });
    fireEvent.click(detailBtn);
    expect(handleOpenDetail).toHaveBeenCalledWith(101);
  });

  it('closes CitationPopover when Escape key is pressed', () => {
    render(<CitationBadge index={1} source={mockSource} />);

    const badge = screen.getByRole('button', { name: /출처 1번/i });
    fireEvent.click(badge);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('visually differentiates supplementary citation [S1] with emerald styling and web search label', () => {
    const mockSupplementarySource: SourceReference = {
      index: 'S1',
      type: 'supplementary',
      title: 'Model Context Protocol Specification & Architecture',
      url: 'https://modelcontextprotocol.io/specification',
      source: 'web_search',
      domain: 'modelcontextprotocol.io',
      snippet: 'Official architecture guide for Model Context Protocol primitives.',
    };

    render(<CitationBadge index="S1" source={mockSupplementarySource} />);

    const badge = screen.getByRole('button', { name: /보충.*출처.*S1/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('[S1]');
    // Check emerald / green class presence
    expect(badge.className).toContain('emerald');
  });

  it('renders supplementary web metadata (domain, query, snippet) in CitationPopover for [S1]', () => {
    const mockSupplementarySource: SourceReference = {
      index: 'S1',
      type: 'supplementary',
      title: 'Model Context Protocol Specification',
      url: 'https://modelcontextprotocol.io/specification',
      source: 'web_search',
      domain: 'modelcontextprotocol.io',
      snippet: 'Official architecture guide for Model Context Protocol.',
    };

    render(<CitationBadge index="S1" source={mockSupplementarySource} />);

    const badge = screen.getByRole('button', { name: /보충.*출처.*S1/i });
    fireEvent.click(badge);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Model Context Protocol Specification')).toBeInTheDocument();
    expect(screen.getByText(/modelcontextprotocol\.io/i)).toBeInTheDocument();
    expect(screen.getByText(/Official architecture guide/i)).toBeInTheDocument();
  });
});
