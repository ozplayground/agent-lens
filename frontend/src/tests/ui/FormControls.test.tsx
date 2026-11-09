import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TextField } from '@/components/ui/TextField';
import { SearchField } from '@/components/ui/SearchField';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CodeBlock } from '@/components/ui/CodeBlock';
import {
  ALL_CATEGORY_LABEL,
  COUNT_METRIC_LABELS,
  SCOPE_LABELS,
  SCORE_METRIC_LABELS,
  categoryLabel,
  categoryShortLabel,
  countMetric,
  radarCategoryLabel,
  scopeLabel,
  scoreMetric,
  sourceLabel,
} from '@/lib/labels';

describe('TextField', () => {
  it('links the label to the input', () => {
    render(<TextField label="이메일" />);
    const input = screen.getByLabelText('이메일');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('keeps a hidden label as sr-only text', () => {
    render(<TextField label="키워드 검색" hideLabel />);
    expect(screen.getByLabelText('키워드 검색')).toBeInTheDocument();
    expect(screen.getByText('키워드 검색')).toHaveClass('sr-only');
  });

  it('points aria-describedby at the description and the error', () => {
    render(<TextField label="SMTP 포트" description="보통 587" error="숫자를 입력하세요" />);
    const input = screen.getByLabelText('SMTP 포트');
    const describedBy = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(describedBy).toHaveLength(2);
    expect(document.getElementById(describedBy[0])).toHaveTextContent('보통 587');
    expect(document.getElementById(describedBy[1])).toHaveTextContent('숫자를 입력하세요');
    expect(input).toHaveAccessibleDescription('보통 587 숫자를 입력하세요');
  });

  it('sets aria-invalid only when there is an error', () => {
    const { rerender } = render(<TextField label="URL" />);
    expect(screen.getByLabelText('URL')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('URL')).not.toHaveAttribute('aria-describedby');

    rerender(<TextField label="URL" error="올바른 URL 이 아닙니다" />);
    expect(screen.getByLabelText('URL')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('올바른 URL 이 아닙니다')).toHaveClass('text-danger');
  });

  it('uses 16px text on mobile to avoid iOS auto-zoom', () => {
    render(<TextField label="이름" />);
    const input = screen.getByLabelText('이름');
    expect(input.className).toContain('text-base');
    expect(input.className).toContain('md:text-sm');
  });

  it('forwards ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<TextField label="이름" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('이름'));
  });
});

describe('SearchField', () => {
  function Harness({ onSubmit }: { onSubmit: (value: string) => void }) {
    const [value, setValue] = useState('agent');
    return (
      <SearchField
        label="키워드 검색"
        hideLabel
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSubmit={onSubmit}
        onClear={() => setValue('')}
      />
    );
  }

  it('renders a search landmark with a searchbox', () => {
    render(<Harness onSubmit={vi.fn()} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    const box = screen.getByRole('searchbox', { name: '키워드 검색' });
    expect(box).toHaveAttribute('type', 'search');
  });

  it('submits the current value on Enter', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByRole('search'));
    expect(onSubmit).toHaveBeenCalledWith('agent');
  });

  it('clears with the 검색어 지우기 button and returns focus to the input', () => {
    render(<Harness onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));
    const box = screen.getByRole('searchbox', { name: '키워드 검색' });
    expect(box).toHaveValue('');
    expect(box).toHaveFocus();
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
  });
});

describe('Textarea', () => {
  it('links the label and error like TextField', () => {
    render(<Textarea label="메모" error="필수 항목" />);
    const textarea = screen.getByLabelText('메모');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('필수 항목');
  });
});

describe('Select', () => {
  it('links the label to a native select with the given options', () => {
    const onChange = vi.fn();
    render(
      <Select
        label="정렬"
        value="latest"
        onChange={onChange}
        options={[
          { value: 'latest', label: '최신순' },
          { value: 'score', label: '중요도순' },
        ]}
      />
    );
    const select = screen.getByLabelText('정렬');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('combobox', { name: '정렬' })).toBe(select);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    fireEvent.change(select, { target: { value: 'score' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps a hidden label accessible', () => {
    render(<Select label="정렬" hideLabel options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByRole('combobox', { name: '정렬' })).toBeInTheDocument();
  });
});

describe('Switch', () => {
  it('is a role="switch" button with aria-checked and toggles through onChange', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="자동 내보내기" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const sw = screen.getByRole('switch', { name: '자동 내보내기' });
    expect(sw.tagName).toBe('BUTTON');
    expect(sw).toHaveAttribute('type', 'button');
    expect(sw).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('uses aria-label when the label is hidden', () => {
    render(<Switch label="TLS 사용" hideLabel checked onChange={vi.fn()} />);
    const sw = screen.getByRole('switch', { name: 'TLS 사용' });
    expect(sw).toHaveAttribute('aria-label', 'TLS 사용');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Switch label="알림" checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch', { name: '알림' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Chip and ChipGroup', () => {
  it('renders chips as buttons with aria-pressed inside a labelled group', () => {
    const onClick = vi.fn();
    render(
      <ChipGroup label="카테고리">
        <Chip selected onClick={onClick}>
          전체
        </Chip>
        <Chip selected={false} count={12} onClick={onClick}>
          Harness
        </Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '카테고리' });
    expect(group).toBeInTheDocument();

    const all = screen.getByRole('button', { name: '전체' });
    const harness = screen.getByRole('button', { name: /Harness/ });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(harness).toHaveAttribute('aria-pressed', 'false');
    expect(harness).toHaveAttribute('type', 'button');
    expect(harness).toHaveTextContent('12');
    expect(group).toContainElement(harness);

    fireEvent.click(harness);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses accent tone by default and warning tokens when tone="warning" is selected', () => {
    const { rerender } = render(
      <Chip selected count={3}>
        전체
      </Chip>
    );
    const accent = screen.getByRole('button', { name: /전체/ });
    expect(accent).toHaveAttribute('aria-pressed', 'true');
    expect(accent.className).toContain('bg-accent-soft');
    expect(accent.className).toContain('text-accent-soft-fg');
    expect(accent.className).not.toContain('warning');

    rerender(
      <Chip selected tone="warning" count={3}>
        Must-Read
      </Chip>
    );
    const warning = screen.getByRole('button', { name: /Must-Read/ });
    expect(warning).toHaveAttribute('aria-pressed', 'true');
    expect(warning.className).toContain('bg-warning-soft');
    expect(warning.className).toContain('border-warning');
    expect(warning.className).toContain('text-warning');
    expect(warning.className).not.toContain('accent');
    expect(within(warning).getByText('3').className).toContain('text-warning');

    rerender(
      <Chip selected={false} tone="warning">
        Must-Read
      </Chip>
    );
    const idle = screen.getByRole('button', { name: /Must-Read/ });
    expect(idle).toHaveAttribute('aria-pressed', 'false');
    expect(idle.className).not.toContain('warning');
    expect(idle.className).toContain('bg-surface');
  });

  it('scrolls horizontally on one line when scrollable', () => {
    render(
      <ChipGroup label="소스" scrollable>
        <Chip selected={false}>GitHub</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '소스' });
    expect(group.className).toContain('overflow-x-auto');
    expect(group.className).toContain('flex-nowrap');
    expect(group.className).not.toContain('flex-wrap ');
  });
});

describe('SegmentedControl', () => {
  it('is a labelled group of aria-pressed buttons', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="질문 범위"
        value="global"
        onChange={onChange}
        options={[
          { value: 'global', label: '전체 뉴스 (Global)' },
          { value: 'scoped', label: '단일 기사 (Scoped)' },
        ]}
      />
    );
    expect(screen.getByRole('group', { name: '질문 범위' })).toBeInTheDocument();
    const scoped = screen.getByRole('button', { name: /단일 기사|Scoped/ });
    expect(scoped).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Global/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(scoped);
    expect(onChange).toHaveBeenCalledWith('scoped');
  });
});

describe('display parts', () => {
  it('Card renders the requested element', () => {
    render(
      <Card as="article" interactive aria-label="카드">
        내용
      </Card>
    );
    const card = screen.getByRole('article', { name: '카드' });
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('focus-within:ring-2');
  });

  it('Skeleton is hidden from assistive tech and pulses', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('bg-surface-muted');
  });

  it('EmptyState shows title, description and action', () => {
    render(<EmptyState title="결과가 없습니다" description="필터를 바꿔 보세요" action={<button>필터 초기화</button>} />);
    expect(screen.getByText('결과가 없습니다')).toBeInTheDocument();
    expect(screen.getByText('필터를 바꿔 보세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();
  });

  it('ErrorState is an alert with a retry button', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="불러오지 못했습니다" message="네트워크를 확인하세요" onRetry={onRetry} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('불러오지 못했습니다');
    expect(alert).toHaveTextContent('네트워크를 확인하세요');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('CodeBlock shows the language, a copy button and a scrollable pre, and accepts className', () => {
    const { container } = render(<CodeBlock code={'pnpm test\n'} language="bash" className="code-block-wrapper" />);
    expect(screen.getByText('bash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '복사' })).toBeInTheDocument();
    const wrapper = container.querySelector('.code-block-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.className).toContain('min-w-0');
    expect(wrapper?.className).toContain('max-w-full');
    expect(wrapper?.className).toContain('overflow-hidden');
    const pre = container.querySelector('pre');
    expect(pre?.className).toContain('overflow-x-auto');
    expect(pre?.className).toContain('overscroll-x-contain');
    expect(pre).toHaveTextContent('pnpm test');
  });
});

describe('labels', () => {
  it('maps category and source ids to the NewsCard labels and falls back to the id', () => {
    expect(categoryLabel('harness')).toBe('하네스 & 벤치마크');
    expect(categoryLabel('mcp_plugins_skills')).toBe('MCP & 생태계');
    expect(categoryLabel('agent_tech')).toBe('에이전트 아키텍처');
    expect(categoryLabel('ai_news')).toBe('최신 AI 동향');
    expect(categoryLabel('unknown_cat')).toBe('unknown_cat');
    expect(categoryLabel('constructor')).toBe('constructor');
    expect(sourceLabel('rss_kr')).toBe('국내 테크');
    expect(sourceLabel('hackernews')).toBe('HackerNews');
    expect(sourceLabel('rss')).toBe('Global Blogs');
    expect(sourceLabel('mystery')).toBe('mystery');
  });

  it('maps category ids to the short labels used on cards and chips', () => {
    expect(categoryShortLabel('harness')).toBe('하네스');
    expect(categoryShortLabel('mcp_plugins_skills')).toBe('MCP');
    expect(categoryShortLabel('agent_tech')).toBe('에이전트');
    expect(categoryShortLabel('ai_news')).toBe('AI 동향');
  });

  it('falls back to the raw id for unknown categories in the short labels', () => {
    expect(categoryShortLabel('unknown_cat')).toBe('unknown_cat');
    expect(categoryShortLabel('constructor')).toBe('constructor');
    expect(categoryShortLabel('toString')).toBe('toString');
  });

  it('maps trend radar category names to Korean labels', () => {
    expect(radarCategoryLabel('Harness & Benchmark')).toBe('하네스 & 벤치마크');
    expect(radarCategoryLabel('Protocols & Tooling')).toBe('프로토콜 & 도구');
    expect(radarCategoryLabel('Models & Reasoning')).toBe('모델 & 추론');
    expect(radarCategoryLabel('Infra & Runtime')).toBe('인프라 & 런타임');
  });

  it('falls back to the raw name for unknown radar categories and prototype keys', () => {
    expect(radarCategoryLabel('Unknown Cat')).toBe('Unknown Cat');
    expect(radarCategoryLabel('constructor')).toBe('constructor');
  });

  it('maps sources to their native score metric and hides synthetic scores (R36)', () => {
    expect(scoreMetric('github')).toBe('stars');
    expect(scoreMetric('hackernews')).toBe('points');
    expect(scoreMetric('reddit')).toBe('upvotes');
    expect(scoreMetric('rss_kr')).toBeNull();
    expect(scoreMetric('rss')).toBeNull();
    expect(scoreMetric('huggingface')).toBeNull();
    expect(scoreMetric('arxiv')).toBeNull();
    expect(scoreMetric('mystery')).toBeNull();
    expect(scoreMetric('constructor')).toBeNull();
    expect(scoreMetric('toString')).toBeNull();
    expect(SCORE_METRIC_LABELS).toEqual({ stars: '스타', points: '포인트', upvotes: '추천' });
  });

  it('labels the GitHub count as forks and every other count as comments (R36)', () => {
    expect(countMetric('github')).toBe('forks');
    expect(countMetric('hackernews')).toBe('comments');
    expect(countMetric('reddit')).toBe('comments');
    expect(countMetric('rss_kr')).toBe('comments');
    expect(countMetric('constructor')).toBe('comments');
    expect(COUNT_METRIC_LABELS).toEqual({ comments: '댓글', forks: '포크' });
  });

  it('names the search scopes in Korean with the shared all-category label (R38)', () => {
    expect(ALL_CATEGORY_LABEL).toBe('전체 소식');
    expect(scopeLabel('scoped')).toBe('단일 기사');
    expect(scopeLabel('global')).toBe('전체 소식');
    expect(scopeLabel('global')).toBe(ALL_CATEGORY_LABEL);
    expect(SCOPE_LABELS).toEqual({ scoped: '단일 기사', global: '전체 소식' });
  });
});
