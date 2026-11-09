import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import InsightsBar from '@/components/feed/InsightsBar';
import type { DailyBriefing } from '@/types/news';
import type { TechRadarData } from '@/types/trends';

const briefing = {
  date: '2026-11-06',
  headline: 'MCP 서버 생태계 확장',
} as unknown as DailyBriefing;

const radar: TechRadarData = {
  updated_at: '2026-11-06T00:00:00Z',
  total_analyzed: 42,
  surging_tags: [
    { name: 'MCP', count: 9, category: 'Protocols & Tooling', recent_count: 5, velocity: '+80%' },
    { name: 'LangGraph', count: 6, category: 'Harness & Benchmark', recent_count: 3, velocity: '+40%' },
  ],
  categories: [{ name: 'Protocols & Tooling', count: 20, percentage: 48 }],
  tags: [
    { name: 'MCP', count: 9, category: 'Protocols & Tooling', recent_count: 5, velocity: '+80%' },
    { name: 'Claude', count: 4, category: 'Models & Reasoning', recent_count: 1, velocity: '+10%' },
  ],
};

const noop = () => {};

describe('InsightsBar', () => {
  it('renders nothing when there is neither a briefing nor radar data', () => {
    const { container } = render(
      <InsightsBar briefing={null} onOpenBriefing={noop} radar={null} activeTag={null} onSelectTag={noop} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a skeleton while the radar is loading', () => {
    const { container } = render(
      <InsightsBar briefing={null} onOpenBriefing={noop} radar={null} loadingRadar activeTag={null} onSelectTag={noop} />
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no briefing button when there is no briefing', () => {
    render(<InsightsBar briefing={null} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={noop} />);
    expect(screen.queryByRole('button', { name: /오늘의 브리핑/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '트렌드' })).toBeInTheDocument();
  });

  it('opens the briefing from the briefing button', () => {
    const onOpenBriefing = vi.fn();
    render(<InsightsBar briefing={briefing} onOpenBriefing={onOpenBriefing} radar={null} activeTag={null} onSelectTag={noop} />);
    const button = screen.getByRole('button', { name: /오늘의 브리핑 · 2026-11-06 · MCP 서버 생태계 확장/ });
    fireEvent.click(button);
    expect(onOpenBriefing).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '트렌드' })).not.toBeInTheDocument();
  });

  it('toggles the trend radar panel with aria-expanded / aria-controls', () => {
    render(<InsightsBar briefing={briefing} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={noop} />);
    const toggle = screen.getByRole('button', { name: '트렌드' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const panelId = toggle.getAttribute('aria-controls')!;
    expect(document.getElementById(panelId)).not.toBeVisible();
    expect(screen.queryByRole('region', { name: '트렌드 레이더' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(panelId)).toBeVisible();
    expect(screen.getByRole('region', { name: '트렌드 레이더' })).toBeInTheDocument();
    expect(screen.getByText('42개 아티클 분석')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('selects a tag from the radar panel and clears it', () => {
    const onSelectTag = vi.fn();
    const { rerender } = render(
      <InsightsBar briefing={null} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={onSelectTag} />
    );
    fireEvent.click(screen.getByRole('button', { name: '트렌드' }));
    fireEvent.click(screen.getByRole('button', { name: /^Claude/ }));
    expect(onSelectTag).toHaveBeenCalledWith('Claude');

    rerender(<InsightsBar briefing={null} onOpenBriefing={noop} radar={radar} activeTag="Claude" onSelectTag={onSelectTag} />);
    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(onSelectTag).toHaveBeenLastCalledWith('');
  });
});

describe('InsightsBar — 폭별 표시·다시 읽기 (spec 14.5, R20·R22)', () => {
  it('marks the outer element and hides the briefing date below md', () => {
    const { container } = render(
      <InsightsBar briefing={briefing} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={noop} />
    );
    expect(screen.getByText('2026-11-06', { exact: false })).toHaveClass('max-md:hidden');
    expect(container.querySelector('[data-insights-bar]')).not.toBeNull();
  });

  it('shows surging chips only from lg (hidden lg:flex)', () => {
    render(<InsightsBar briefing={briefing} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={noop} />);
    const wrapper = screen.getByText('급상승').parentElement!;
    expect(wrapper).toHaveClass('hidden', 'lg:flex');
    expect(wrapper).not.toHaveClass('md:flex');
  });

  it('keeps showing the buttons without a skeleton while re-reading when data exists', () => {
    const { container } = render(
      <InsightsBar briefing={briefing} onOpenBriefing={noop} radar={radar} loadingRadar activeTag={null} onSelectTag={noop} />
    );
    expect(screen.queryByRole('button', { name: '트렌드' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /오늘의 브리핑/ })).toBeInTheDocument();
    expect(container.querySelector('[data-insights-bar]')).not.toBeNull();
  });
});

describe('InsightsBar — 레이더 카테고리 분포 잘림 (후속 2)', () => {
  it('lays out category shares in one column on narrow screens and keeps the full name accessible', () => {
    render(<InsightsBar briefing={null} onOpenBriefing={noop} radar={radar} activeTag={null} onSelectTag={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '트렌드' }));
    const region = screen.getByRole('region', { name: '트렌드 레이더' });
    const items = within(region).getAllByRole('listitem');
    expect(items.length).toBe(radar.categories.length);
    const list = items[0].closest('ul')!;
    expect(list).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    expect(list).not.toHaveClass('grid-cols-2');
    expect(list).not.toHaveClass('md:grid-cols-4');
    items.forEach((item) => {
      const label = item.querySelector('[title]');
      expect(label).not.toBeNull();
      expect(label).toHaveAttribute('title', label!.textContent ?? '');
    });
  });
});
