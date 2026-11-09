import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import TrendRadarPanel from '@/components/feed/TrendRadarPanel';
import type { TechRadarData } from '@/types/trends';

/**
 * R19 (3차 보정 결함 3): 트렌드 레이더 `카테고리 분포` 는 영문 원값 대신 `labels.ts` 의 한국어 라벨을 그린다.
 * 레이더 응답 이름은 backend `trend_service.py` 의 영문 이름 그대로 온다 (데이터 키, 바꾸지 않는다).
 */

const ENGLISH = ['Harness & Benchmark', 'Protocols & Tooling', 'Models & Reasoning', 'Infra & Runtime'];
const KOREAN = ['하네스 & 벤치마크', '프로토콜 & 도구', '모델 & 추론', '인프라 & 런타임'];

const radar: TechRadarData = {
  updated_at: '2026-11-06T00:00:00Z',
  total_analyzed: 42,
  surging_tags: [],
  categories: [
    { name: 'Harness & Benchmark', count: 10, percentage: 24 },
    { name: 'Protocols & Tooling', count: 20, percentage: 48 },
    { name: 'Models & Reasoning', count: 6, percentage: 14 },
    { name: 'Infra & Runtime', count: 4, percentage: 10 },
    { name: 'Other Stuff', count: 2, percentage: 4 },
  ],
  tags: [{ name: 'MCP', count: 9, category: 'Protocols & Tooling', recent_count: 5, velocity: '+80%' }],
};

const noop = () => {};

describe('TrendRadarPanel — 카테고리 분포 라벨 (R19)', () => {
  it('shows Korean radar category labels and no English names in text or title', () => {
    render(<TrendRadarPanel data={radar} activeTag={null} onSelectTag={noop} />);
    const region = screen.getByRole('region', { name: '트렌드 레이더' });
    const items = within(region).getAllByRole('listitem');
    expect(items).toHaveLength(radar.categories.length);

    KOREAN.forEach((label) => expect(within(region).queryByText(label)).toBeInTheDocument());
    ENGLISH.forEach((name) => {
      expect(within(region).queryByText(name)).not.toBeInTheDocument();
      expect(within(region).queryByTitle(name)).not.toBeInTheDocument();
    });
    KOREAN.forEach((label) => expect(within(region).getByTitle(label)).toHaveTextContent(label));
  });

  it('keeps an unknown radar category name as is', () => {
    render(<TrendRadarPanel data={radar} activeTag={null} onSelectTag={noop} />);
    const region = screen.getByRole('region', { name: '트렌드 레이더' });
    expect(within(region).getByText('Other Stuff')).toBeInTheDocument();
    expect(within(region).getByTitle('Other Stuff')).toBeInTheDocument();
  });
});
