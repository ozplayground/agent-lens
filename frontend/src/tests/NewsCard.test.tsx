import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import NewsCard from '@/components/NewsCard';
import { NewsItem } from '@/types/news';
import { categoryLabel } from '@/lib/labels';

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
    expect(screen.getByText('하네스')).toBeInTheDocument();

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

  it('applies focus ring and data-focused attribute when isFocused is true', () => {
    render(
      <NewsCard
        item={mockItem}
        onSelect={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
        isFocused={true}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('data-focused', 'true');
    expect(card.className).toContain('ring-2');
  });

  describe('fixed frame (R17)', () => {
    function renderCard(overrides: Partial<NewsItem> = {}, props: { preferSummary?: boolean } = {}) {
      return render(
        <NewsCard
          item={{ ...mockItem, ...overrides }}
          onSelect={vi.fn()}
          isBookmarked={false}
          onToggleBookmark={vi.fn()}
          {...props}
        />
      );
    }

    it('renders a single meta row with the short category label, source, time and the bookmark button', () => {
      const { container } = renderCard();
      const meta = container.querySelector('[data-card-meta]');
      expect(meta).not.toBeNull();
      const row = meta as HTMLElement;
      expect(row.className).toContain('flex');
      expect(row.className).toContain('items-center');
      expect(row.className).not.toContain('flex-wrap');
      const category = within(row).getByText('하네스');
      expect(category.tagName).toBe('SPAN');
      expect(within(row).getByText('GitHub')).toBeInTheDocument();
      expect(row.querySelector('time')).not.toBeNull();
      const bookmark = within(row).getByTitle('보관하기');
      expect(bookmark.className).not.toMatch(/(^|\s)-m[trbl]?-/);
    });

    it('keeps Must-Read, tech stack and hotness badges out of the meta row', () => {
      const { container } = renderCard();
      const meta = container.querySelector('[data-card-meta]');
      expect(meta).not.toBeNull();
      const row = meta as HTMLElement;
      expect(within(row).queryByText('Must-Read')).toBeNull();
      expect(within(row).queryByText('SWE-bench')).toBeNull();
      expect(within(row).queryByText('Docker')).toBeNull();
      expect(row.textContent).not.toMatch(/Hot|인기/);
      // 배지는 머리줄 밖 한 줄에 남는다
      expect(screen.getByText('Must-Read')).toBeInTheDocument();
      expect(screen.getByText('SWE-bench')).toBeInTheDocument();
    });

    it('shows at most three tech stack badges', () => {
      renderCard({ tech_stack: ['A1', 'B2', 'C3', 'D4', 'E5'] });
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('B2')).toBeInTheDocument();
      expect(screen.getByText('C3')).toBeInTheDocument();
      expect(screen.queryByText('D4')).toBeNull();
      expect(screen.queryByText('E5')).toBeNull();
    });

    it('moves the hotness score to the footer stats with an sr-only "인기 점수" label', () => {
      const { container } = renderCard({ hotness_score: 84.6 });
      const label = screen.getByText('인기 점수');
      expect(label.className).toContain('sr-only');
      const meta = container.querySelector('[data-card-meta]');
      expect(meta).not.toBeNull();
      expect((meta as HTMLElement).contains(label)).toBe(false);
      const stat = label.parentElement as HTMLElement;
      expect(stat.textContent).toContain('85');
      expect(stat.closest('.mt-auto')).not.toBeNull();
      expect(screen.queryByText(/Hot\s*85/)).toBeNull();
    });

    it('hides the hotness stat when the score is 25 or below', () => {
      renderCard({ hotness_score: 25 });
      expect(screen.queryByText('인기 점수')).toBeNull();
    });

    it('labels the insight body with "시사점" and keeps the sentence in its own element', () => {
      renderCard();
      expect(screen.getByText('시사점')).toBeInTheDocument();
      expect(screen.queryByText('Insight')).toBeNull();
      const sentence = screen.getByText('에이전트 평가 하네스의 새로운 표준으로 부상하고 있습니다.');
      const body = sentence.closest('p') as HTMLElement;
      expect(body).not.toBeNull();
      expect(body.className).toContain('border-l-2');
      expect(body.className).toContain('line-clamp-2');
      expect(body.className).toContain('min-h-12');
    });

    it('shows the summary instead of the insight when preferSummary is set and a summary exists (R18)', () => {
      renderCard({}, { preferSummary: true });
      expect(screen.getByText('A multimodal software engineering benchmark for autonomous agents.')).toBeInTheDocument();
      expect(screen.queryByText('에이전트 평가 하네스의 새로운 표준으로 부상하고 있습니다.')).toBeNull();
      expect(screen.queryByText('시사점')).toBeNull();
    });

    it('keeps the insight when preferSummary is set but the summary is empty', () => {
      renderCard({ summary: '' }, { preferSummary: true });
      expect(screen.getByText('에이전트 평가 하네스의 새로운 표준으로 부상하고 있습니다.')).toBeInTheDocument();
      expect(screen.getByText('시사점')).toBeInTheDocument();
    });

    it('fixes the title and body to two lines and keeps an empty two-line slot without text', () => {
      const { container } = renderCard({ why_it_matters: '', summary: '' });
      const card = screen.getByRole('article');
      expect(card.className).toContain('h-full');
      const title = container.querySelector('h3') as HTMLElement;
      expect(title.className).toContain('line-clamp-2');
      expect(title.className).toContain('min-h-12');
      const slot = container.querySelector('p') as HTMLElement;
      expect(slot).not.toBeNull();
      expect(slot.className).toContain('min-h-12');
      expect(slot.textContent).toBe('');
    });

    it('keeps the handover label visible at every width (R48)', () => {
      renderCard();
      const handover = screen.getByRole('button', { name: 'AI 챗에서 분석' });
      const text = within(handover).getByText('AI 챗에서 분석');
      expect(text.className).not.toContain('sr-only');
      const actions = handover.parentElement as HTMLElement;
      expect(actions).toHaveClass('ml-auto');
      const footer = actions.parentElement as HTMLElement;
      expect(footer).toHaveClass('flex-wrap');
    });

    it('puts the long category label in the meta row category title (R47)', () => {
      const { container } = renderCard();
      const meta = container.querySelector('[data-card-meta]') as HTMLElement;
      const category = within(meta).getByText('하네스');
      expect(category).toHaveAttribute('title', categoryLabel(mockItem.category));
      expect(category).toHaveAttribute('title', '하네스 & 벤치마크');
    });
  });

  describe('badge row shrinking (R16·R17, 리뷰 후속)', () => {
    const LONG_TECH = [
      'LangGraph Multi-Agent Orchestrator',
      'Model Context Protocol Server SDK',
      'Retrieval Augmented Generation Pipeline',
    ];

    function renderBadges() {
      return render(
        <NewsCard
          item={{ ...mockItem, is_high_signal: true, tech_stack: LONG_TECH }}
          onSelect={vi.fn()}
          isBookmarked={false}
          onToggleBookmark={vi.fn()}
        />
      );
    }

    it('marks the badge row and keeps it on one clipped line', () => {
      const { container } = renderBadges();
      const row = container.querySelector('[data-card-badges]');
      expect(row).not.toBeNull();
      const el = row as HTMLElement;
      expect(el.classList.contains('flex')).toBe(true);
      expect(el.classList.contains('flex-nowrap')).toBe(true);
      expect(el.classList.contains('overflow-hidden')).toBe(true);
    });

    it('lets each tech badge shrink between min-w-12 and max-w-32 with a truncating text wrapper and full-name title', () => {
      renderBadges();
      for (const tech of LONG_TECH) {
        const text = screen.getByText(tech);
        expect(text.classList.contains('min-w-0')).toBe(true);
        expect(text.classList.contains('truncate')).toBe(true);
        const badge = text.parentElement as HTMLElement;
        expect(badge.classList.contains('shrink')).toBe(true);
        expect(badge.classList.contains('min-w-12')).toBe(true);
        expect(badge.classList.contains('max-w-32')).toBe(true);
        expect(badge.classList.contains('shrink-0')).toBe(false);
        expect(badge.classList.contains('max-w-full')).toBe(false);
        expect(badge).toHaveAttribute('title', tech);
      }
    });

    it('keeps the Must-Read badge from shrinking', () => {
      const { container } = renderBadges();
      const row = container.querySelector('[data-card-badges]');
      expect(row).not.toBeNull();
      const mustRead = within(row as HTMLElement).getByText('Must-Read');
      expect(mustRead.classList.contains('shrink-0')).toBe(true);
      expect(mustRead.classList.contains('shrink')).toBe(false);
    });
  });

  describe('footer stats show only native source metrics (R36)', () => {
    function renderSource(overrides: Partial<NewsItem>) {
      return render(
        <NewsCard
          item={{ ...mockItem, ...overrides }}
          onSelect={vi.fn()}
          isBookmarked={false}
          onToggleBookmark={vi.fn()}
        />
      );
    }

    function stat(container: HTMLElement, kind: 'score' | 'count' | 'hotness') {
      return container.querySelector<HTMLElement>(`[data-card-stat="${kind}"]`);
    }

    function iconClass(el: HTMLElement) {
      return el.querySelector('svg')?.getAttribute('class') ?? '';
    }

    it.each(['rss_kr', 'rss', 'arxiv', 'huggingface', 'mystery'])(
      'hides the synthetic raw_score for %s',
      (source) => {
        const { container } = renderSource({ source, raw_score: 120 });
        expect(stat(container, 'score')).toBeNull();
        expect(screen.queryByText('점수')).toBeNull();
        expect(screen.queryByText('스타')).toBeNull();
        expect(screen.queryByText('포인트')).toBeNull();
        expect(screen.queryByText('추천')).toBeNull();
        expect(screen.queryByText('120')).toBeNull();
        // 인기 점수도 합성 값이라 숨긴다 (R41)
        expect(stat(container, 'hotness')).toBeNull();
        expect(screen.queryByText('인기 점수')).toBeNull();
      }
    );

    it('shows GitHub raw_score as stars with a Star icon', () => {
      const { container } = renderSource({ source: 'github', raw_score: 1200 });
      const score = stat(container, 'score');
      expect(score).not.toBeNull();
      const el = score as HTMLElement;
      expect(el).toHaveAttribute('data-metric', 'stars');
      expect(el).toHaveAttribute('title', 'GitHub 스타');
      const label = within(el).getByText('스타');
      expect(label).toHaveClass('sr-only');
      expect(el.textContent).toContain((1200).toLocaleString());
      expect(iconClass(el)).toContain('lucide-star');
    });

    it('shows HackerNews raw_score as points with an ArrowBigUp icon', () => {
      const { container } = renderSource({ source: 'hackernews', raw_score: 321 });
      const el = stat(container, 'score') as HTMLElement;
      expect(el).not.toBeNull();
      expect(el).toHaveAttribute('data-metric', 'points');
      expect(el).toHaveAttribute('title', 'HackerNews 포인트');
      expect(within(el).getByText('포인트')).toHaveClass('sr-only');
      expect(el.textContent).toContain('321');
      expect(iconClass(el)).toContain('lucide-arrow-big-up');
      expect(iconClass(el)).not.toContain('lucide-star');
    });

    it('shows Reddit raw_score as upvotes with an ArrowBigUp icon', () => {
      const { container } = renderSource({ source: 'reddit', raw_score: 77 });
      const el = stat(container, 'score') as HTMLElement;
      expect(el).not.toBeNull();
      expect(el).toHaveAttribute('data-metric', 'upvotes');
      expect(el).toHaveAttribute('title', 'Reddit 추천');
      expect(within(el).getByText('추천')).toHaveClass('sr-only');
      expect(el.textContent).toContain('77');
      expect(iconClass(el)).toContain('lucide-arrow-big-up');
    });

    it('hides the score stat when a native metric source has raw_score 0', () => {
      const { container } = renderSource({ source: 'github', raw_score: 0 });
      expect(stat(container, 'score')).toBeNull();
      expect(screen.queryByText('스타')).toBeNull();
    });

    it('labels the GitHub count as forks with a GitFork icon', () => {
      const { container } = renderSource({ source: 'github', comments_count: 15 });
      const el = stat(container, 'count') as HTMLElement;
      expect(el).not.toBeNull();
      expect(el).toHaveAttribute('data-metric', 'forks');
      expect(el).toHaveAttribute('title', 'GitHub 포크');
      expect(within(el).getByText('포크')).toHaveClass('sr-only');
      expect(el.textContent).toContain('15');
      expect(iconClass(el)).toContain('lucide-git-fork');
      expect(screen.queryByText('댓글')).toBeNull();
    });

    it('labels the HackerNews count as comments with a MessageSquare icon', () => {
      const { container } = renderSource({ source: 'hackernews', comments_count: 15 });
      const el = stat(container, 'count') as HTMLElement;
      expect(el).not.toBeNull();
      expect(el).toHaveAttribute('data-metric', 'comments');
      expect(el).toHaveAttribute('title', '댓글');
      expect(within(el).getByText('댓글')).toHaveClass('sr-only');
      expect(el.textContent).toContain('15');
      expect(iconClass(el)).toContain('lucide-message-square');
      expect(screen.queryByText('포크')).toBeNull();
    });

    it('hides the count stat when comments_count is 0', () => {
      const { container } = renderSource({ source: 'hackernews', comments_count: 0 });
      expect(stat(container, 'count')).toBeNull();
    });

    it('marks the hotness stat without a metric attribute', () => {
      const { container } = renderSource({ source: 'github', hotness_score: 84.6 });
      const el = stat(container, 'hotness') as HTMLElement;
      expect(el).not.toBeNull();
      expect(el).not.toHaveAttribute('data-metric');
      expect(within(el).getByText('인기 점수')).toHaveClass('sr-only');
      expect(el.textContent).toContain('85');
    });

    it.each(['rss_kr', 'rss', 'arxiv', 'huggingface', 'mystery'])(
      'hides the hotness stat for %s whose hotness is derived from a synthetic raw_score (R41)',
      (source) => {
        const { container } = renderSource({ source, hotness_score: 84.6 });
        expect(stat(container, 'hotness')).toBeNull();
        expect(screen.queryByText('인기 점수')).toBeNull();
        expect(screen.queryByText('85')).toBeNull();
      }
    );

    it.each(['github', 'hackernews', 'reddit'])(
      'keeps the hotness stat for %s which has a native score metric (R41)',
      (source) => {
        const { container } = renderSource({ source, hotness_score: 84.6 });
        const el = stat(container, 'hotness');
        expect(el).not.toBeNull();
        expect(within(el as HTMLElement).getByText('인기 점수')).toHaveClass('sr-only');
        expect((el as HTMLElement).textContent).toContain('85');
      }
    );

    it('never renders a bare "점수" label for any source', () => {
      for (const source of ['github', 'hackernews', 'reddit', 'rss_kr', 'huggingface']) {
        const { unmount } = renderSource({ source, raw_score: 120, comments_count: 3 });
        expect(screen.queryByText('점수')).toBeNull();
        unmount();
      }
    });

    it('exposes the item source on the card as data-source', () => {
      const { container, unmount } = renderSource({ source: 'rss_kr' });
      expect(container.querySelector('[data-feed-card]')).toHaveAttribute('data-source', 'rss_kr');
      unmount();
      const second = renderSource({ source: 'github' });
      expect(second.container.querySelector('[data-feed-card]')).toHaveAttribute('data-source', 'github');
    });
  });
});
