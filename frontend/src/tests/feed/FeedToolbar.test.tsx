import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { act, render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import FeedToolbar, { type FeedToolbarProps } from '@/components/feed/FeedToolbar';

function setup(overrides: Partial<FeedToolbarProps> = {}) {
  const props: FeedToolbarProps = {
    category: 'all',
    source: 'all',
    search: '',
    highSignalOnly: false,
    categoryCounts: { harness: 4, mcp_plugins_skills: 3, agent_tech: 2, ai_news: 1 },
    sourceCounts: { github: 5, arxiv: 2, reddit: 0 },
    bookmarkCount: 2,
    onCategoryChange: vi.fn(),
    onSourceChange: vi.fn(),
    onHighSignalChange: vi.fn(),
    onSearchChange: vi.fn(),
    onSearchSubmit: vi.fn(),
    onPageChange: vi.fn(),
    ...overrides,
  };
  render(<FeedToolbar {...props} />);
  return props;
}

describe('FeedToolbar', () => {
  it('renders category chips with aria-pressed and counts', () => {
    setup({ category: 'harness' });
    const group = screen.getByRole('group', { name: '카테고리' });
    const chips = within(group).getAllByRole('button');
    expect(chips).toHaveLength(5);
    expect(within(group).getByRole('button', { name: /전체 소식/ })).toHaveAttribute('aria-pressed', 'false');
    const harness = within(group).getByRole('button', { name: /하네스 & 벤치마크/ });
    expect(harness).toHaveAttribute('aria-pressed', 'true');
    expect(harness).toHaveTextContent('4');
    expect(within(group).getByRole('button', { name: /전체 소식/ })).toHaveTextContent('10');
  });

  it('selecting a category resets source to all and page to 1', () => {
    const props = setup({ source: 'github' });
    fireEvent.click(screen.getByRole('button', { name: /MCP & 생태계/ }));
    expect(props.onCategoryChange).toHaveBeenCalledWith('mcp_plugins_skills');
    expect(props.onSourceChange).toHaveBeenCalledWith('all');
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('shows the Must-Read toggle outside the source group at the end of the source row, and toggles it', () => {
    const props = setup();
    const group = screen.getByRole('group', { name: '소스' });
    const chips = within(group).getAllByRole('button');
    const mustRead = screen.getByRole('button', { name: 'Must-Read' });
    expect(mustRead).toHaveAttribute('aria-pressed', 'false');
    expect(within(group).queryByRole('button', { name: 'Must-Read' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: '정렬' })).toBeNull();
    const toolbarRow = group.closest('[data-toolbar-row]')!;
    expect(toolbarRow.lastElementChild).toBe(mustRead);
    expect(group.compareDocumentPosition(mustRead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 건수가 있는 소스만 (reddit 0건 제외) + 전체 + 북마크
    expect(chips.map((c) => c.textContent)).toEqual(['전체7', 'GitHub5', 'arXiv2', '북마크2']);

    fireEvent.click(mustRead);
    expect(props.onHighSignalChange).toHaveBeenCalledWith(true);
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('selecting a source calls back with page 1', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /GitHub/ }));
    expect(props.onSourceChange).toHaveBeenCalledWith('github');
    expect(props.onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /북마크/ }));
    expect(props.onSourceChange).toHaveBeenCalledWith('bookmarks');
  });

  it('submits and clears the keyword search', () => {
    const ref = createRef<HTMLInputElement>();
    const props = setup({ search: 'MCP', searchInputRef: ref });
    const input = screen.getByRole('searchbox', { name: '키워드 검색' });
    expect(ref.current).toBe(input);
    expect(screen.getByRole('search')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'MCP server' } });
    expect(props.onSearchChange).toHaveBeenCalledWith('MCP server');

    fireEvent.submit(input.closest('form')!);
    expect(props.onPageChange).toHaveBeenCalledWith(1);
    expect(props.onSearchSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(props.onSearchChange).toHaveBeenLastCalledWith('');
  });
});

describe('FeedToolbar — 줄 배치·자리표시·아이콘 (spec 14.2, R14·R16)', () => {
  it('uses the short placeholder 키워드 검색', () => {
    setup();
    expect(screen.getByRole('searchbox', { name: '키워드 검색' })).toHaveAttribute('placeholder', '키워드 검색');
  });

  it('lays out rows as separate flex rows with the category and source groups on different rows', () => {
    setup();
    const toolbar = document.querySelector('[data-feed-toolbar]');
    expect(toolbar).not.toBeNull();
    const rows = toolbar!.querySelectorAll('[data-toolbar-row]');
    expect(rows.length).toBeGreaterThanOrEqual(2);

    const categoryRow = screen.getByRole('group', { name: '카테고리' }).closest('[data-toolbar-row]');
    const sourceRow = screen.getByRole('group', { name: '소스' }).closest('[data-toolbar-row]');
    expect(categoryRow).not.toBeNull();
    expect(sourceRow).not.toBeNull();
    expect(categoryRow).not.toBe(sourceRow);
    expect(toolbar).not.toHaveClass('grid');
  });

  it('hides category chip icons below xl', () => {
    setup();
    const group = screen.getByRole('group', { name: '카테고리' });
    const icons = group.querySelectorAll('[data-chip-icon]');
    expect(icons).toHaveLength(5);
    icons.forEach((icon) => expect(icon).toHaveClass('max-xl:hidden'));
  });
});

describe('FeedToolbar — 768 미만 소스 줄 왼쪽 끝까지 (spec 14.2)', () => {
  it('bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9)', () => {
    setup();
    const sourceRow = screen.getByRole('group', { name: '소스' });
    expect(sourceRow).toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6');
    expect(sourceRow).not.toHaveClass('max-md:-mx-4');
    expect(sourceRow).not.toHaveClass('max-md:-mr-4');
    const rowB = sourceRow.closest('[data-toolbar-row]')!;
    expect(rowB).not.toHaveClass('max-md:flex-wrap');
    expect(Array.from(rowB.children).find((child) => child.contains(sourceRow))).not.toHaveClass('max-md:basis-full');
    expect(screen.getByRole('button', { name: 'Must-Read' })).not.toHaveClass('max-md:ml-auto');

    // 정렬은 필터 영역에 없다 (목록 머리줄로 옮김).
    const toolbar = document.querySelector('[data-feed-toolbar]')!;
    expect(within(toolbar as HTMLElement).queryByRole('combobox')).toBeNull();
  });

  it('keeps the 768px+ row B unchanged: no unprefixed flex-wrap, basis-full or ml-auto (R35)', () => {
    setup();
    const sourceRow = screen.getByRole('group', { name: '소스' });
    const rowB = sourceRow.closest('[data-toolbar-row]')!;
    const wrapper = Array.from(rowB.children).find((child) => child.contains(sourceRow))!;
    const toggle = screen.getByRole('button', { name: 'Must-Read' });
    expect(rowB.classList.contains('flex-wrap')).toBe(false);
    expect(rowB.classList.contains('md:flex-wrap')).toBe(false);
    expect(wrapper.classList.contains('basis-full')).toBe(false);
    expect(wrapper.classList.contains('md:basis-full')).toBe(false);
    expect(toggle.classList.contains('ml-auto')).toBe(false);
    expect(toggle.classList.contains('md:ml-auto')).toBe(false);
  });
});

describe('FeedToolbar — 768 미만 소스 줄 넘침 표시 (spec 14.3, 3차: ScrollRow 공통 표시)', () => {
  // ChipGroup.test.tsx 와 같은 방식: 360px 화면 + 스크롤 줄이 끝 쪽으로 넘침(`end`).
  const originalMatchMedia = window.matchMedia;

  function isScrollRow(el: Element): boolean {
    return el.hasAttribute('data-scroll-row') || el.getAttribute('role') === 'group';
  }

  beforeEach(() => {
    window.matchMedia = (query: string): MediaQueryList => {
      const width = 360;
      let matches = false;
      const min = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(query);
      const max = /\(\s*max-width\s*:\s*(\d+)px\s*\)/.exec(query);
      if (min && max) matches = Number(min[1]) <= width && Number(max[1]) >= width;
      else if (min) matches = Number(min[1]) <= width;
      else if (max) matches = Number(max[1]) >= width;
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    };
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isScrollRow(this) ? 600 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isScrollRow(this) ? 300 : 0;
      },
    });
  });

  afterEach(() => {
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    delete proto.scrollWidth;
    delete proto.clientWidth;
    window.matchMedia = originalMatchMedia;
  });

  it('has exactly one decorative hint in the source row, outside the group and before the Must-Read toggle', async () => {
    setup();
    const sourceRow = screen.getByRole('group', { name: '소스' });
    await waitFor(() => expect(sourceRow).toHaveAttribute('data-overflow', 'end'));
    const toolbarRow = sourceRow.closest('[data-toolbar-row]')!;
    const toggle = screen.getByRole('button', { name: 'Must-Read' });
    expect(toolbarRow).toContainElement(toggle);

    await waitFor(() => expect(toolbarRow.querySelectorAll('[data-overflow-hint]')).toHaveLength(1));
    const hint = toolbarRow.querySelector('[data-overflow-hint]')!;
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(sourceRow).not.toContainElement(hint as HTMLElement);
    expect(hint.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('.group\\/source')).toBeNull();
  });

  it('shows hints on both sides of the source row when it overflows both ways (start before the group, end before the Must-Read toggle)', async () => {
    // 이 it 에서만 scrollLeft 를 저장한다 (jsdom 은 저장하지 않는다).
    const scrollLefts = new WeakMap<Element, number>();
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return scrollLefts.get(this) ?? 0;
      },
      set(this: HTMLElement, value: number) {
        scrollLefts.set(this, Math.min(Math.max(0, value), 300));
      },
    });
    try {
      setup();
      const sourceRow = screen.getByRole('group', { name: '소스' });
      await waitFor(() => expect(sourceRow).toHaveAttribute('data-overflow', 'end'));
      act(() => {
        sourceRow.scrollLeft = 150;
      });
      fireEvent.scroll(sourceRow);
      await waitFor(() => expect(sourceRow).toHaveAttribute('data-overflow', 'both'));

      const toolbarRow = sourceRow.closest('[data-toolbar-row]')!;
      const toggle = screen.getByRole('button', { name: 'Must-Read' });
      await waitFor(() => {
        expect(toolbarRow.querySelectorAll('[data-overflow-hint="start"]')).toHaveLength(1);
        expect(toolbarRow.querySelectorAll('[data-overflow-hint="end"]')).toHaveLength(1);
      });
      const start = toolbarRow.querySelector('[data-overflow-hint="start"]')!;
      const end = toolbarRow.querySelector('[data-overflow-hint="end"]')!;

      expect(start).toHaveAttribute('aria-hidden', 'true');
      expect(end).toHaveAttribute('aria-hidden', 'true');
      expect(sourceRow).not.toContainElement(start as HTMLElement);
      expect(sourceRow).not.toContainElement(end as HTMLElement);
      expect(start.compareDocumentPosition(sourceRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(sourceRow.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(end.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // 오른쪽 표시는 토글 앞이라 화면 끝 여백을 쓰지 않는다 (보정 6 과 같음).
      expect(start).toHaveClass('max-md:-ml-4');
      expect(end).not.toHaveClass('max-md:-mr-4');
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollLeft;
    }
  });
});

describe('FeedToolbar — 한 트리·DOM 순서·소스 줄 선택 칩 (spec 14.2·14.3, R33·R15, 리뷰 후속 34)', () => {
  // 폭 목: 이 블록 전용 도우미. 360 블록의 목은 고치지 않고 새로 둔다.
  const originalMatchMedia = window.matchMedia;
  const scrollLefts = new WeakMap<Element, number>();
  const ROW_SCROLL_WIDTH = 600;
  const ROW_CLIENT_WIDTH = 300;

  function isRow(el: Element): boolean {
    return el.hasAttribute('data-scroll-row') || el.getAttribute('role') === 'group';
  }

  function mockViewport(width: number) {
    window.matchMedia = (query: string): MediaQueryList => {
      const min = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(query);
      const max = /\(\s*max-width\s*:\s*(\d+)px\s*\)/.exec(query);
      let matches = false;
      if (min || max) {
        matches = (!min || Number(min[1]) <= width) && (!max || Number(max[1]) >= width);
      }
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    };
  }

  function baseProps(overrides: Partial<FeedToolbarProps> = {}): FeedToolbarProps {
    return {
      category: 'all',
      source: 'all',
      search: '',
      highSignalOnly: false,
      categoryCounts: { harness: 4, mcp_plugins_skills: 3, agent_tech: 2, ai_news: 1 },
      sourceCounts: { github: 5, arxiv: 2, reddit: 0 },
      bookmarkCount: 2,
      onCategoryChange: vi.fn(),
      onSourceChange: vi.fn(),
      onHighSignalChange: vi.fn(),
      onSearchChange: vi.fn(),
      onSearchSubmit: vi.fn(),
      onPageChange: vi.fn(),
      ...overrides,
    };
  }

  function controls() {
    return {
      category: screen.getByRole('group', { name: '카테고리' }),
      search: screen.getByRole('searchbox', { name: '키워드 검색' }),
      source: screen.getByRole('group', { name: '소스' }),
    };
  }

  function precedes(a: Node, b: Node): boolean {
    return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isRow(this) ? ROW_SCROLL_WIDTH : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isRow(this) ? ROW_CLIENT_WIDTH : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return scrollLefts.get(this) ?? 0;
      },
      set(this: HTMLElement, value: number) {
        scrollLefts.set(this, Math.min(Math.max(0, value), ROW_SCROLL_WIDTH - ROW_CLIENT_WIDTH));
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    delete proto.scrollWidth;
    delete proto.clientWidth;
    delete proto.scrollLeft;
    window.matchMedia = originalMatchMedia;
  });

  it('① reveals the selected source chip, not Must-Read, and does not move when only Must-Read toggles', () => {
    mockViewport(1440);
    // 소스 줄 [0, 300]. Must-Read 는 줄 안, 선택된 GitHub 칩은 줄 오른쪽 밖.
    const rects: Record<string, [number, number]> = { 'Must-Read': [0, 90], GitHub5: [400, 480] };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [left, right] = isRow(this) ? [0, 300] : (rects[this.textContent ?? ''] ?? [0, 0]);
      return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
    });

    const { rerender } = render(<FeedToolbar {...baseProps({ highSignalOnly: true, source: 'github' })} />);
    const sourceRow = screen.getByRole('group', { name: '소스' });
    expect(sourceRow.scrollLeft).toBeGreaterThan(0);
    const afterFirst = sourceRow.scrollLeft;

    rerender(<FeedToolbar {...baseProps({ highSignalOnly: false, source: 'github' })} />);
    expect(screen.getByRole('group', { name: '소스' }).scrollLeft).toBe(afterFirst);
  });

  it('② keeps the same search input, focus, value and chip rows across widths (360 → 1024 → 1440)', () => {
    mockViewport(360);
    const props = baseProps({ search: 'MCP' });
    const { rerender } = render(<FeedToolbar {...props} />);
    const first = controls();
    act(() => first.search.focus());
    expect(document.activeElement).toBe(first.search);

    for (const width of [1024, 1440]) {
      mockViewport(width);
      rerender(<FeedToolbar {...props} />);
      const now = controls();
      expect(now.search).toBe(first.search);
      expect(document.activeElement).toBe(first.search);
      expect(now.search).toHaveValue('MCP');
      expect(now.category).toBe(first.category);
      expect(now.source).toBe(first.source);
    }
  });

  it.each([360, 1024, 1440])('③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx', (width) => {
    mockViewport(width);
    render(<FeedToolbar {...baseProps()} />);
    const { category, search, source } = controls();
    const toggle = screen.getByRole('button', { name: 'Must-Read' });
    expect(precedes(search, category)).toBe(true);
    expect(precedes(category, source)).toBe(true);
    expect(precedes(source, toggle)).toBe(true);
  });

  it.each([360, 1024, 1440])(
    '⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34)',
    (width) => {
      mockViewport(width);
      render(<FeedToolbar {...baseProps()} />);
      const { source } = controls();
      const toggle = screen.getByRole('button', { name: 'Must-Read' });
      expect(precedes(source, toggle)).toBe(true);
      expect(source.closest('[data-toolbar-row]')!.lastElementChild).toBe(toggle);
      expect(source).not.toContainElement(toggle);
      expect(toggle).toHaveAttribute('data-must-read-toggle');
      expect(toggle).toHaveClass('shrink-0', 'max-md:w-11');
      expect(within(toggle).getByText('Must-Read')).toHaveClass('max-md:sr-only');
      // 소스 그룹 안에 구분선(aria-hidden 인 w-px)이 없다.
      const dividers = Array.from(source.querySelectorAll('[aria-hidden="true"]')).filter((el) =>
        el.classList.contains('w-px')
      );
      expect(dividers).toHaveLength(0);
    }
  );

  it('⑤ keeps the same Must-Read node and name across widths and reflects highSignalOnly (R34·R33)', () => {
    mockViewport(360);
    const { rerender } = render(<FeedToolbar {...baseProps({ highSignalOnly: true })} />);
    const first = screen.getByRole('button', { name: 'Must-Read' });
    expect(first).toHaveAttribute('aria-pressed', 'true');

    mockViewport(1440);
    rerender(<FeedToolbar {...baseProps({ highSignalOnly: true })} />);
    expect(screen.getByRole('button', { name: 'Must-Read' })).toBe(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([360, 1024, 1440])(
    '④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx',
    (width) => {
      mockViewport(width);
      render(<FeedToolbar {...baseProps()} />);
      const { category, search, source } = controls();
      const rowA = category.closest('[data-toolbar-row]');
      const rowB = source.closest('[data-toolbar-row]');
      expect(rowA).not.toBeNull();
      expect(rowB).not.toBeNull();
      expect(rowA).not.toBe(rowB);
      expect(search.closest('[data-toolbar-row]')).toBeNull();
      const searchArea = search.closest('[data-feed-search]');
      expect(searchArea).not.toBeNull();
      const toolbar = document.querySelector('[data-feed-toolbar]')!;
      expect(toolbar).not.toContainElement(searchArea as HTMLElement);
      expect(precedes(searchArea!, toolbar)).toBe(true);
      expect(screen.getByRole('button', { name: 'Must-Read' }).closest('[data-toolbar-row]')).toBe(rowB);
    }
  );
});

describe('FeedToolbar — 검색 영역과 필터 영역 (spec 14.17 G1, R42)', () => {
  it('puts the search field in its own [data-feed-search] area with full width', () => {
    setup();
    const area = document.querySelector('[data-feed-search]');
    expect(area).not.toBeNull();
    expect(area).toHaveClass('scroll-mt-20');
    const form = within(area as HTMLElement).getByRole('search');
    expect(form).toHaveClass('w-full');
    expect(form).not.toHaveClass('md:w-48');
    expect(form).not.toHaveClass('xl:w-72');
  });

  it('has no searchbox or combobox inside the filter area [data-feed-toolbar]', () => {
    setup();
    const toolbar = document.querySelector('[data-feed-toolbar]') as HTMLElement;
    expect(toolbar).not.toBeNull();
    expect(within(toolbar).queryByRole('searchbox')).toBeNull();
    expect(within(toolbar).queryByRole('combobox')).toBeNull();
  });
});
