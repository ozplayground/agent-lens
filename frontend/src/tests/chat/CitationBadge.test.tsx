import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    render(<CitationBadge index={1} source={mockSource} />);

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

  });

  it('FE-13: 답변 문단 안의 배지가 연 팝오버는 문단(<p>) 밖 body 에 그려져 HTML 중첩 규칙을 지킨다', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <div data-testid="scroller" style={{ overflow: 'hidden' }}>
        <p>
          본문 <CitationBadge index={1} source={mockSource} />
        </p>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /출처 1번/i }));

    const dialog = screen.getByRole('dialog', { name: /출처 기사 상세 프리뷰/ });
    expect(dialog.closest('p')).toBeNull();
    expect(screen.getByTestId('scroller').contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
    expect(errorSpy.mock.calls.flat().join(' ')).not.toMatch(/cannot be a descendant of <p>|validateDOMNesting/);
    errorSpy.mockRestore();
  });

  it('FE-13: body 로 옮긴 팝오버도 바깥을 누르면 닫히고, Escape 로 닫으면 배지로 포커스를 돌려준다', () => {
    render(
      <p>
        본문 <CitationBadge index={1} source={mockSource} />
      </p>
    );
    const badge = screen.getByRole('button', { name: /출처 1번/i });

    fireEvent.click(badge);
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(badge);
    screen.getByRole('button', { name: '팝오버 닫기' }).focus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(badge).toHaveFocus();
  });

  it('FE-16: 팝오버 닫기 버튼은 공통 IconButton 이다 (접근 이름·title·아이콘 장식)', () => {
    render(<CitationBadge index={1} source={mockSource} />);
    fireEvent.click(screen.getByRole('button', { name: /출처 1번/i }));

    const close = screen.getByRole('button', { name: '팝오버 닫기' });
    expect(close).toHaveAttribute('title', '팝오버 닫기');
    // IconButton 은 아이콘을 aria-hidden 감싸개(span) 안에 둔다
    expect(close.querySelector(':scope > span[aria-hidden="true"] > svg')).not.toBeNull();
    fireEvent.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-37: 키보드로 연 인용 팝오버는 포커스를 안으로 옮기고 Tab 이 팝오버 안을 돌며, Escape 로 닫으면 배지로 돌려준다', async () => {
    const user = userEvent.setup();
    render(
      <p>
        <CitationBadge index={1} source={mockSource} /> 그리고 <CitationBadge index={2} source={{ ...mockSource, index: 2 }} />
      </p>
    );
    const badge = screen.getByRole('button', { name: /출처 1번/i });
    badge.focus();

    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: /출처 기사 상세 프리뷰/ });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole('button', { name: /출처 2번/i })).not.toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(badge).toHaveFocus();
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
    // Check supplementary tone marker and success (green) token class
    expect(badge).toHaveAttribute('data-tone', 'supplementary'); expect(badge.className).toContain('text-success');
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
