import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { ScrollRow } from '@/components/ui/ScrollRow';

/**
 * R15 (spec 14.3): 가로 스크롤 줄.
 * jsdom 은 배치를 계산하지 않으므로 스크롤 줄(`data-scroll-row` 또는 `role="group"`)의
 * `scrollWidth`·`clientWidth`·`scrollLeft` 를 아래 `layout` 값으로 흉내 낸다.
 */

const layout = { scrollWidth: 300, clientWidth: 300 };
const scrollLefts = new WeakMap<Element, number>();

function isScrollRow(el: Element): boolean {
  return el.hasAttribute('data-scroll-row') || el.getAttribute('role') === 'group';
}

function maxScroll(): number {
  return Math.max(0, layout.scrollWidth - layout.clientWidth);
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

function triggerResize() {
  act(() => {
    for (const observer of MockResizeObserver.instances) {
      observer.callback([], observer as unknown as ResizeObserver);
    }
  });
}

/** 테스트 화면 너비와 줄어든 움직임 설정으로 `matchMedia` 를 바꾼다. */
function mockMatchMedia(width: number, reduceMotion = false) {
  window.matchMedia = (query: string): MediaQueryList => {
    let matches = false;
    const min = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(query);
    const max = /\(\s*max-width\s*:\s*(\d+)px\s*\)/.exec(query);
    if (min) matches = Number(min[1]) <= width;
    else if (max) matches = Number(max[1]) >= width;
    else if (/prefers-reduced-motion:\s*reduce/.test(query)) matches = reduceMotion;
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

function setScrollLeft(el: Element, value: number) {
  act(() => {
    (el as HTMLElement).scrollLeft = value;
  });
  fireEvent.scroll(el);
}

function renderCategories(selected = '전체') {
  const names = ['전체', '하네스', 'MCP', '에이전트', '최신 AI 동향'];
  return render(
    <ChipGroup label="카테고리" scrollable>
      {names.map((name) => (
        <Chip key={name} selected={name === selected}>
          {name}
        </Chip>
      ))}
    </ChipGroup>
  );
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  layout.scrollWidth = 300;
  layout.clientWidth = 300;
  MockResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isScrollRow(this) ? layout.scrollWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isScrollRow(this) ? layout.clientWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
    configurable: true,
    get(this: HTMLElement) {
      return scrollLefts.get(this) ?? 0;
    },
    set(this: HTMLElement, value: number) {
      scrollLefts.set(this, Math.min(Math.max(0, value), maxScroll()));
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  delete proto.scrollWidth;
  delete proto.clientWidth;
  delete proto.scrollLeft;
  window.matchMedia = originalMatchMedia;
});

describe('ChipGroup scrollable — overflow state (data-overflow)', () => {
  it('marks a row that fits as data-overflow="none" with no mask', async () => {
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'none'));
    expect(group).toHaveAttribute('data-scroll-row');
    expect(group.className).not.toMatch(/mask/);
    expect(group.getAttribute('style') ?? '').not.toMatch(/mask/);
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
  });

  it('allows 1px of slack before calling it overflow', async () => {
    layout.scrollWidth = 301;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'none'));
  });

  it('reports end, both and start as the row scrolls, with a mask only while overflowing', async () => {
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    expect(group.className).toMatch(/mask-image/);

    setScrollLeft(group, 300);
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'both'));

    setScrollLeft(group, 600);
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'start'));
    expect(group.className).toMatch(/mask-image/);
  });

  it('re-measures when the ResizeObserver reports a size change', async () => {
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'none'));
    expect(MockResizeObserver.instances.length).toBeGreaterThan(0);

    layout.scrollWidth = 900;
    triggerResize();
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
  });
});

describe('ChipGroup scrollable — scroll buttons', () => {
  it('shows a next button outside the group only on the overflowing side at >=768px', async () => {
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    const next = await screen.findByRole('button', { name: '카테고리 다음 항목 보기' });
    expect(screen.queryByRole('button', { name: '카테고리 이전 항목 보기' })).not.toBeInTheDocument();
    expect(group).not.toContainElement(next);
    expect(within(group).getAllByRole('button')).toHaveLength(5);

    setScrollLeft(group, 300);
    const prev = await screen.findByRole('button', { name: '카테고리 이전 항목 보기' });
    expect(group).not.toContainElement(prev);
    expect(screen.getByRole('button', { name: '카테고리 다음 항목 보기' })).toBeInTheDocument();
    expect(within(group).getAllByRole('button')).toHaveLength(5);

    setScrollLeft(group, 600);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '카테고리 다음 항목 보기' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: '카테고리 이전 항목 보기' })).toBeInTheDocument();
  });

  it('has no scroll buttons below 768px even when overflowing', async () => {
    mockMatchMedia(390);
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
  });

  it('scrolls by 80% of the row width with scrollBy when a button is pressed', async () => {
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    const scrollBy = vi.fn();
    Object.defineProperty(group, 'scrollBy', { configurable: true, value: scrollBy });

    fireEvent.click(await screen.findByRole('button', { name: '카테고리 다음 항목 보기' }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });

    setScrollLeft(group, 300);
    fireEvent.click(await screen.findByRole('button', { name: '카테고리 이전 항목 보기' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -240, behavior: 'smooth' });
  });

  it('uses behavior "auto" when reduced motion is preferred', async () => {
    mockMatchMedia(1280, true);
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    const scrollBy = vi.fn();
    Object.defineProperty(group, 'scrollBy', { configurable: true, value: scrollBy });

    fireEvent.click(await screen.findByRole('button', { name: '카테고리 다음 항목 보기' }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'auto' });
  });

  it('falls back to adding to scrollLeft when scrollBy is missing', async () => {
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    fireEvent.click(await screen.findByRole('button', { name: '카테고리 다음 항목 보기' }));
    expect(group.scrollLeft).toBe(240);
  });
});

describe('ChipGroup scrollable — keeping chips in view', () => {
  it('scrolls a focused chip into view with inline/block "nearest"', () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    renderCategories();
    const chip = screen.getByRole('button', { name: /최신 AI 동향/ });
    act(() => chip.focus());
    expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'nearest', block: 'nearest' });
    expect(scrollIntoView.mock.contexts).toContain(chip);
  });

  it('scrolls the row so the selected chip is visible on first render and when the selection changes', () => {
    layout.scrollWidth = 900;
    const rects: Record<string, [number, number]> = {
      전체: [-200, -140],
      '최신 AI 동향': [400, 480],
    };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [left, right] = isScrollRow(this) ? [0, 300] : (rects[this.textContent ?? ''] ?? [0, 0]);
      return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
    });

    const { rerender } = renderCategories('최신 AI 동향');
    const group = screen.getByRole('group', { name: '카테고리' });
    expect(group.scrollLeft).toBeGreaterThanOrEqual(180);
    const afterFirst = group.scrollLeft;

    rerender(
      <ChipGroup label="카테고리" scrollable>
        {['전체', '하네스', 'MCP', '에이전트', '최신 AI 동향'].map((name) => (
          <Chip key={name} selected={name === '전체'}>
            {name}
          </Chip>
        ))}
      </ChipGroup>
    );
    expect(group.scrollLeft).toBeLessThan(afterFirst);
  });
});

describe('ChipGroup options and Chip icon', () => {
  it('bleeds to the screen edges below 768px when bleed is set', () => {
    render(
      <ChipGroup label="카테고리" scrollable bleed>
        <Chip selected>전체</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '카테고리' });
    expect(group.className).toContain('max-md:-mx-4');
    expect(group.className).toContain('max-md:px-4');
    expect(group.className).toContain('scroll-px-6');
  });

  it('keeps a non-scrollable group as a wrapping group without a scroll row', () => {
    render(
      <ChipGroup label="수집 기간">
        <Chip selected>전체</Chip>
        <Chip selected={false}>최근 7일</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '수집 기간' });
    expect(group.className).toContain('flex-wrap');
    expect(group).not.toHaveAttribute('data-scroll-row');
    expect(group).not.toHaveAttribute('data-overflow');
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
  });

  it('wraps the chip icon in data-chip-icon and applies iconClassName to it', () => {
    render(
      <Chip selected={false} icon={<svg data-testid="icon" />} iconClassName="max-xl:hidden">
        하네스
      </Chip>
    );
    const icon = screen.getByTestId('icon');
    const wrapper = icon.closest('[data-chip-icon]');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass('max-xl:hidden');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ChipGroup one-sided bleed and row classes', () => {
  it('bleeds only to the left edge below 768px when bleed="start"', () => {
    render(
      <ChipGroup label="소스" scrollable bleed="start">
        <Chip selected>전체</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '소스' });
    expect(group.className).toContain('max-md:-ml-4');
    expect(group.className).toContain('max-md:pl-4');
    expect(group.className).toContain('scroll-px-6');
    expect(group.className).not.toContain('max-md:-mx-4');
    expect(group.className).not.toContain('max-md:px-4');
    expect(group.className).not.toMatch(/-mr-4|pr-4/);
  });

  it('passes rowClassName to the scroll row and className to the outer wrapper', () => {
    render(
      <ChipGroup label="소스" scrollable className="wrapper-extra" rowClassName="row-extra">
        <Chip selected>전체</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '소스' });
    expect(group).toHaveClass('row-extra');
    expect(group).not.toHaveClass('wrapper-extra');
    expect(group.parentElement).toHaveClass('wrapper-extra');
    expect(group.parentElement).not.toHaveClass('row-extra');
  });
});

describe('ScrollRow — overflow hint below 768px (3차)', () => {
  it('(a) draws a decorative hint after the group when overflowing to the end below 768px', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));

    const hints = document.querySelectorAll('[data-overflow-hint]');
    expect(hints).toHaveLength(1);
    const hint = hints[0];
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(group).not.toContainElement(hint as HTMLElement);
    expect(hint.parentElement).toBe(group.parentElement);
    expect(group.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(group).getAllByRole('button')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();

    setScrollLeft(group, 300);
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'both'));
    const bothHints = document.querySelectorAll('[data-overflow-hint]');
    expect(bothHints).toHaveLength(2);
    const startHint = document.querySelector('[data-overflow-hint="start"]') as HTMLElement;
    const endHint = document.querySelector('[data-overflow-hint="end"]') as HTMLElement;
    for (const h of [startHint, endHint]) {
      expect(h).toHaveAttribute('aria-hidden', 'true');
      expect(group).not.toContainElement(h);
      expect(h.parentElement).toBe(group.parentElement);
    }
    expect(group.compareDocumentPosition(startHint) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(group.compareDocumentPosition(endHint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('(b) gives the right bleed to the hint on a bleed row while the hint shows', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    render(
      <ChipGroup label="카테고리" scrollable bleed>
        <Chip selected>전체</Chip>
        <Chip selected={false}>하네스</Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    await waitFor(() => expect(document.querySelector('[data-overflow-hint]')).not.toBeNull());
    expect(group.className).toContain('max-md:-ml-4');
    expect(group.className).not.toContain('max-md:-mr-4');
    expect(group.className).not.toContain('max-md:-mx-4');
  });

  it('draws only the start hint at start, none when it fits, and buttons instead at >=768px', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    const { unmount } = renderCategories();
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    setScrollLeft(group, 600);
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'start'));
    const startOnly = document.querySelectorAll('[data-overflow-hint]');
    expect(startOnly).toHaveLength(1);
    expect(startOnly[0]).toHaveAttribute('data-overflow-hint', 'start');
    expect(startOnly[0]).toHaveAttribute('aria-hidden', 'true');
    expect(group).not.toContainElement(startOnly[0] as HTMLElement);
    expect(group.compareDocumentPosition(startOnly[0]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    unmount();

    layout.scrollWidth = 300;
    const second = renderCategories();
    const fitting = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(fitting).toHaveAttribute('data-overflow', 'none'));
    expect(document.querySelector('[data-overflow-hint]')).toBeNull();
    second.unmount();

    mockMatchMedia(1280);
    layout.scrollWidth = 900;
    renderCategories();
    expect(await screen.findByRole('button', { name: '카테고리 다음 항목 보기' })).toBeInTheDocument();
    expect(document.querySelector('[data-overflow-hint]')).toBeNull();
  });
});

describe('ScrollRow — selectedSelector (3차)', () => {
  it('(c) reveals the child matched by selectedSelector on first render', () => {
    layout.scrollWidth = 900;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [left, right] = isScrollRow(this) ? [0, 300] : this.textContent === '연동 설정' ? [400, 480] : [0, 0];
      return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
    });

    render(
      <ScrollRow label="탭" selectedSelector='[aria-selected="true"]'>
        {['소스 목록', '딥 리서처', '연동 설정'].map((name) => (
          <button key={name} type="button" role="tab" aria-selected={name === '연동 설정'}>
            {name}
          </button>
        ))}
      </ScrollRow>
    );
    const row = document.querySelector('[data-scroll-row]') as HTMLElement;
    expect(row.scrollLeft).toBeGreaterThan(0);
  });
});

/** 카테고리 줄 트리. `rerender` 에 같은 트리를 다시 넘길 때 쓴다. */
function categoriesTree(selected = '전체') {
  return (
    <ChipGroup label="카테고리" scrollable>
      {['전체', '하네스', 'MCP', '에이전트', '최신 AI 동향'].map((name) => (
        <Chip key={name} selected={name === selected}>
          {name}
        </Chip>
      ))}
    </ChipGroup>
  );
}

describe('ScrollRow — keeps focus when a focused scroll button disappears (리뷰 후속)', () => {
  it('① moves focus to the opposite button when the focused next button disappears at the end', async () => {
    layout.scrollWidth = 900;
    render(categoriesTree());
    const group = screen.getByRole('group', { name: '카테고리' });
    const next = await screen.findByRole('button', { name: '카테고리 다음 항목 보기' });
    act(() => next.focus());
    expect(document.activeElement).toBe(next);

    setScrollLeft(group, 600);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '카테고리 다음 항목 보기' })).not.toBeInTheDocument()
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '카테고리 이전 항목 보기' }));
  });

  it('② moves focus to the selected chip when both buttons disappear below 768px', async () => {
    layout.scrollWidth = 900;
    const { rerender } = render(categoriesTree('MCP'));
    const group = screen.getByRole('group', { name: '카테고리' });
    setScrollLeft(group, 300);
    const next = await screen.findByRole('button', { name: '카테고리 다음 항목 보기' });
    await screen.findByRole('button', { name: '카테고리 이전 항목 보기' });
    act(() => next.focus());

    mockMatchMedia(360);
    rerender(categoriesTree('MCP'));
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(within(group).getByRole('button', { name: 'MCP' }));
  });

  it('③ leaves focus alone when the user already moved it to a chip before the button disappears', async () => {
    layout.scrollWidth = 900;
    render(categoriesTree());
    const group = screen.getByRole('group', { name: '카테고리' });
    const next = await screen.findByRole('button', { name: '카테고리 다음 항목 보기' });
    act(() => next.focus());
    const chip = within(group).getByRole('button', { name: '하네스' });
    await act(async () => {
      chip.focus();
    });

    setScrollLeft(group, 600);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '카테고리 다음 항목 보기' })).not.toBeInTheDocument()
    );
    expect(document.activeElement).toBe(chip);
  });
});

describe('ChipGroup — selectedSelector (리뷰 후속)', () => {
  it('④ reveals the chip matched by selectedSelector and ignores the default aria-pressed chip', () => {
    layout.scrollWidth = 900;
    const rects: Record<string, [number, number]> = {
      'Must-Read': [0, 80],
      GitHub: [400, 480],
    };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [left, right] = isScrollRow(this) ? [0, 300] : (rects[this.textContent ?? ''] ?? [0, 0]);
      return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
    });

    render(
      <ChipGroup label="소스" scrollable selectedSelector='[data-source-chip][aria-pressed="true"]'>
        <Chip selected tone="warning">
          Must-Read
        </Chip>
        <Chip selected={false} data-source-chip="">
          전체
        </Chip>
        <Chip selected data-source-chip="">
          GitHub
        </Chip>
      </ChipGroup>
    );
    const group = screen.getByRole('group', { name: '소스' });
    expect(group.scrollLeft).toBeGreaterThan(0);
  });
});

/**
 * 줄 상자와 칩 위치를 흉내 낸다. 칩 위치는 줄 내용 좌표이고 줄의 `scrollLeft` 만큼 왼쪽으로 옮겨 돌려준다.
 * `rowBox()` 는 그 순간의 줄 상자 [left, right] 다.
 */
function mockScrollingRects(rowBox: () => [number, number], chips: () => Record<string, [number, number]>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    let left = 0;
    let right = 0;
    if (isScrollRow(this)) {
      [left, right] = rowBox();
    } else {
      const content = chips()[this.textContent ?? ''];
      const row = this.closest('[data-scroll-row]') as HTMLElement | null;
      if (content && row) {
        left = content[0] - row.scrollLeft;
        right = content[1] - row.scrollLeft;
      }
    }
    return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
  });
}

/** 선택 칩이 줄 상자 안, 넘친 쪽 흐림 24px 를 뺀 범위에 들어 있는지. */
function expectChipInsideRow(chip: HTMLElement, group: HTMLElement) {
  const row = group.getBoundingClientRect();
  const rect = chip.getBoundingClientRect();
  expect(rect.left).toBeGreaterThanOrEqual(row.left);
  expect(rect.right).toBeLessThanOrEqual(row.right - 24);
}

describe('ScrollRow — keeps the selected chip visible when the row or chip resizes (31 후속)', () => {
  it('re-reveals the selected chip after the overflow hint appears and narrows the row below 768px', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    mockScrollingRects(
      () => (document.querySelector('[data-overflow-hint]') ? [0, 280] : [0, 300]),
      () => ({ 에이전트: [210, 290] })
    );
    renderCategories('에이전트');
    const group = screen.getByRole('group', { name: '카테고리' });
    const chip = within(group).getByRole('button', { name: '에이전트' });

    await waitFor(() => expect(document.querySelector('[data-overflow-hint]')).not.toBeNull());
    await waitFor(() => expectChipInsideRow(chip, group));
  });

  it('re-reveals the selected chip when it grows (e.g. counts arrive) and the ResizeObserver fires', async () => {
    layout.scrollWidth = 900;
    let chipWidth = 60;
    mockScrollingRects(
      () => [0, 300],
      () => ({ 에이전트: [200, 200 + chipWidth] })
    );
    renderCategories('에이전트');
    const group = screen.getByRole('group', { name: '카테고리' });
    const chip = within(group).getByRole('button', { name: '에이전트' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    expect(group.scrollLeft).toBe(0);

    chipWidth = 100;
    triggerResize();
    await waitFor(() => expectChipInsideRow(chip, group));
  });

  it('does not pull the row back after the user scrolled, but still reveals a newly selected chip', async () => {
    layout.scrollWidth = 900;
    let chipWidth = 60;
    mockScrollingRects(
      () => [0, 300],
      () => ({ 에이전트: [200, 200 + chipWidth], '최신 AI 동향': [500, 580] })
    );
    const { rerender } = render(categoriesTree('에이전트'));
    const group = screen.getByRole('group', { name: '카테고리' });
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));

    fireEvent.wheel(group, { deltaX: 40 });
    setScrollLeft(group, 10);
    chipWidth = 100;
    triggerResize();
    expect(group.scrollLeft).toBe(10);

    rerender(categoriesTree('최신 AI 동향'));
    expectChipInsideRow(within(group).getByRole('button', { name: '최신 AI 동향' }), group);
  });
});

describe('ScrollRow — selected chip reveal is not undone by scroll snapping (31 후속)', () => {
  it('turns scroll snapping off while it sets scrollLeft and restores it right after', () => {
    layout.scrollWidth = 900;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [left, right] = isScrollRow(this)
        ? [0, 300]
        : this.textContent === '최신 AI 동향'
          ? [400, 480]
          : [0, 0];
      return { left, right, top: 0, bottom: 32, width: right - left, height: 32, x: left, y: 0, toJSON: () => ({}) };
    });
    const { rerender } = render(categoriesTree('전체'));
    const group = screen.getByRole('group', { name: '카테고리' });

    const snapTypesAtSet: string[] = [];
    Object.defineProperty(group, 'scrollLeft', {
      configurable: true,
      get() {
        return scrollLefts.get(group) ?? 0;
      },
      set(value: number) {
        snapTypesAtSet.push(group.style.scrollSnapType);
        scrollLefts.set(group, Math.min(Math.max(0, value), maxScroll()));
      },
    });

    rerender(categoriesTree('최신 AI 동향'));
    expect(group.scrollLeft).toBeGreaterThan(0);
    expect(snapTypesAtSet).toEqual(['none']);
    expect(group.style.scrollSnapType).toBe('');
  });
});

/**
 * 실제 CSS 대신 계산된 스타일을 흉내 낸다: 스크롤 줄은 `scroll-snap-type: x proximity` 와 `scroll-padding-left`,
 * 줄 안 칩은 `scroll-snap-align: start` (Tailwind `snap-x`·`snap-start`·`scroll-pl-4`).
 */
function mockSnapStyles(scrollPaddingLeft: string) {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
    const style = original(el, pseudo);
    const overrides: Record<string, string> = el.hasAttribute('data-scroll-row')
      ? { scrollSnapType: 'x proximity', scrollPaddingLeft, scrollPaddingRight: '0px' }
      : el.parentElement?.hasAttribute('data-scroll-row')
        ? { scrollSnapAlign: 'start' }
        : {};
    return new Proxy(style, {
      get(target, prop) {
        if (typeof prop === 'string' && prop in overrides) return overrides[prop];
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  });
}

describe('ScrollRow — picks a scroll snap position when revealing the selected chip (31 후속 2)', () => {
  // 360 소스 줄과 같은 모양: 보이는 폭 207px, scroll-padding-left 16px, 칩 시작이 스냅 위치.
  const chips: Record<string, [number, number]> = {
    전체: [16, 110],
    하네스: [118, 230],
    MCP: [238, 280],
    에이전트: [308, 400],
    '최신 AI 동향': [408, 520],
  };

  it('moves to the snap position that shows the whole chip instead of an in-between offset snapping would undo', () => {
    layout.scrollWidth = 536;
    layout.clientWidth = 207;
    mockSnapStyles('16px');
    mockScrollingRects(() => [0, 207], () => chips);
    renderCategories('하네스');
    const group = screen.getByRole('group', { name: '카테고리' });
    // 스냅 위치 = 칩 왼쪽 - 16 → 0, 102, 222, 292, 329(끝으로 자름). 흐림 밖에 다 드는 위치가 없어
    // 패딩 상자 안에 다 드는 위치 중 지금(0)과 가장 가까운 102 를 고른다.
    expect(group.scrollLeft).toBe(102);
    const rect = within(group).getByRole('button', { name: '하네스' }).getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(207);
  });

  it('prefers a snap position that keeps the chip clear of the 24px fades', () => {
    layout.scrollWidth = 536;
    layout.clientWidth = 207;
    mockSnapStyles('16px');
    mockScrollingRects(() => [0, 207], () => chips);
    renderCategories('MCP');
    const group = screen.getByRole('group', { name: '카테고리' });
    // 102 에서 MCP 는 보이는 상자 [102+24, 102+207-24] = [126, 285] 안 (238~280).
    expect(group.scrollLeft).toBe(102);
  });
});

/** `bleed` 를 고를 수 있는 카테고리 줄. */
function bleedTree(bleed: boolean | 'start', selectedSelector?: string) {
  return (
    <ChipGroup label="카테고리" scrollable bleed={bleed} selectedSelector={selectedSelector}>
      {['전체', '하네스', 'MCP', '에이전트', '최신 AI 동향'].map((name) => (
        <Chip key={name} selected={name === '전체'}>
          {name}
        </Chip>
      ))}
    </ChipGroup>
  );
}

/** 줄과 같은 감싸개 안에서 줄 앞(`before`)·뒤(`after`)에 있는 표시·자리를 돌려준다. */
function sideMarks(group: HTMLElement, attribute: 'data-overflow-hint' | 'data-overflow-slot') {
  const marks = Array.from(group.parentElement?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? []);
  return {
    before: marks.filter((m) => group.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_PRECEDING),
    after: marks.filter((m) => group.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING),
  };
}

/**
 * 사용자가 줄을 밀어 넘침 상태를 바꾼다. 입력 신호(pointerdown) 뒤의 스크롤이라 ScrollRow 는 사용자 스크롤로 본다.
 * 입력 신호가 없으면 ScrollRow 는 넘침 상태가 바뀔 때 선택 칩을 다시 보이게 `scrollLeft` 를 옮기는데(보정 5 ①),
 * jsdom 은 그 이동에 `scroll` 을 보내지 않아 상태가 첫 측정 프레임이 언제 오느냐에 따라 뒤늦게 바뀌었다 (간헐 실패).
 */
/** 측정 프레임(`requestAnimationFrame`)을 직접 돌린다. 프레임이 언제 오느냐에 따라 결과가 달라지지 않게 한다. */
const pendingFrames: FrameRequestCallback[] = [];
function flushFrames() {
  act(() => {
    for (const callback of pendingFrames.splice(0)) callback(0);
  });
}

async function scrollTo(group: HTMLElement, state: 'start' | 'end' | 'both') {
  const left = state === 'end' ? 0 : state === 'both' ? 300 : 600;
  fireEvent.pointerDown(group);
  setScrollLeft(group, left);
  await waitFor(() => expect(group).toHaveAttribute('data-overflow', state));
  // 사용자가 둔 위치가 그대로이고, 남은 측정 프레임(처음 그릴 때 예약한 것 등)을 돌려도 상태가 같다.
  flushFrames();
  expect(group.scrollLeft).toBe(left);
  expect(group).toHaveAttribute('data-overflow', state);
}

describe('ScrollRow — overflow hints on each overflowing side below 768px (보정 3)', () => {
  const realRequestAnimationFrame = window.requestAnimationFrame;
  beforeEach(() => {
    pendingFrames.length = 0;
    window.requestAnimationFrame = (callback: FrameRequestCallback) => pendingFrames.push(callback);
  });
  afterEach(() => {
    window.requestAnimationFrame = realRequestAnimationFrame;
  });

  it('① shows a start hint before and an end hint after the group for each overflowing side', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    render(bleedTree(false));
    const group = screen.getByRole('group', { name: '카테고리' });

    const expected = { end: [[], ['end']], both: [['start'], ['end']], start: [['start'], []] } as const;
    for (const state of ['end', 'both', 'start'] as const) {
      await scrollTo(group, state);
      const { before, after } = sideMarks(group, 'data-overflow-hint');
      expect(before.map((h) => h.getAttribute('data-overflow-hint'))).toEqual(expected[state][0]);
      expect(after.map((h) => h.getAttribute('data-overflow-hint'))).toEqual(expected[state][1]);
      for (const h of [...before, ...after]) {
        expect(h).toHaveAttribute('aria-hidden', 'true');
        expect(group).not.toContainElement(h);
      }
    }
  });

  it('② drops the bleed on the side whose hint shows (bleed row: end → left only, start → right only, both → none, none → both)', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    render(bleedTree(true));
    const group = screen.getByRole('group', { name: '카테고리' });

    await scrollTo(group, 'end');
    expect(group).toHaveClass('max-md:-ml-4', 'max-md:pl-4');
    expect(group.className).not.toMatch(/max-md:-mr-4|max-md:pr-4|max-md:-mx-4|max-md:px-4/);

    await scrollTo(group, 'start');
    expect(group).toHaveClass('max-md:-mr-4', 'max-md:pr-4');
    expect(group.className).not.toMatch(/max-md:-ml-4|max-md:pl-4|max-md:-mx-4|max-md:px-4/);

    await scrollTo(group, 'both');
    expect(group.className).not.toMatch(/max-md:-m[lrx]-4|max-md:p[lrx]-4/);

    layout.scrollWidth = 300;
    setScrollLeft(group, 0);
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'none'));
    expect(group).toHaveClass('max-md:-mx-4', 'max-md:px-4');
  });

  it('③ keeps an invisible slot on a side without bleed while the row overflows and that side does not', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    const { unmount } = render(bleedTree(false));
    const group = screen.getByRole('group', { name: '카테고리' });

    await scrollTo(group, 'end');
    let slots = sideMarks(group, 'data-overflow-slot');
    expect(slots.before).toHaveLength(1);
    expect(slots.before[0]).toHaveAttribute('data-overflow-slot', 'start');
    expect(slots.before[0]).toHaveClass('invisible');
    expect(slots.before[0]).toHaveAttribute('aria-hidden', 'true');
    expect(slots.after).toHaveLength(0);

    await scrollTo(group, 'start');
    slots = sideMarks(group, 'data-overflow-slot');
    expect(slots.before).toHaveLength(0);
    expect(slots.after).toHaveLength(1);
    expect(slots.after[0]).toHaveAttribute('data-overflow-slot', 'end');
    expect(slots.after[0]).toHaveClass('invisible');

    await scrollTo(group, 'both');
    expect(document.querySelectorAll('[data-overflow-slot]')).toHaveLength(0);
    unmount();

    // bleed="start" 줄: 왼쪽은 bleed 쪽이라 자리 없음, 오른쪽은 bleed 가 없어 자리가 있다.
    render(bleedTree('start'));
    const sourceLike = screen.getByRole('group', { name: '카테고리' });
    await scrollTo(sourceLike, 'end');
    expect(document.querySelectorAll('[data-overflow-slot]')).toHaveLength(0);
    await scrollTo(sourceLike, 'start');
    slots = sideMarks(sourceLike, 'data-overflow-slot');
    expect(slots.before).toHaveLength(0);
    expect(slots.after).toHaveLength(1);
    expect(slots.after[0]).toHaveAttribute('data-overflow-slot', 'end');
    expect(slots.after[0]).toHaveClass('invisible');

    layout.scrollWidth = 300;
    setScrollLeft(sourceLike, 0);
    await waitFor(() => expect(sourceLike).toHaveAttribute('data-overflow', 'none'));
    expect(document.querySelectorAll('[data-overflow-slot]')).toHaveLength(0);
  });

  it('④ cancels the wrapper gap on hints and gives the bleed side page margin to the hint', async () => {
    mockMatchMedia(360);
    layout.scrollWidth = 900;
    const { unmount } = render(bleedTree(true));
    let group = screen.getByRole('group', { name: '카테고리' });
    await scrollTo(group, 'both');
    let start = document.querySelector('[data-overflow-hint="start"]') as HTMLElement;
    let end = document.querySelector('[data-overflow-hint="end"]') as HTMLElement;
    expect(start).toHaveClass('-mr-1', 'max-md:-ml-4', 'pointer-events-none', 'w-4');
    expect(end).toHaveClass('-ml-1', 'max-md:-mr-4', 'pointer-events-none', 'w-4');
    for (const h of [start, end]) expect(h.className).not.toMatch(/\babsolute\b/);
    unmount();

    render(bleedTree(false));
    group = screen.getByRole('group', { name: '카테고리' });
    await scrollTo(group, 'both');
    start = document.querySelector('[data-overflow-hint="start"]') as HTMLElement;
    end = document.querySelector('[data-overflow-hint="end"]') as HTMLElement;
    expect(start).toHaveClass('-mr-1');
    expect(end).toHaveClass('-ml-1');
    expect(start.className).not.toContain('max-md:-ml-4');
    expect(end.className).not.toContain('max-md:-mr-4');
  });

  it('⑤ puts scroll-px-6 and data-selected-selector on every scroll row', () => {
    const { unmount } = render(bleedTree(false));
    const plain = screen.getByRole('group', { name: '카테고리' });
    expect(plain).toHaveClass('scroll-px-6');
    expect(plain).toHaveAttribute('data-selected-selector', '[aria-pressed="true"]');
    unmount();

    const custom = '[data-source-chip][aria-pressed="true"]';
    const second = render(bleedTree('start', custom));
    const source = screen.getByRole('group', { name: '카테고리' });
    expect(source).toHaveClass('scroll-px-6');
    expect(source.className).not.toMatch(/scroll-p[lx]-4/);
    expect(source).toHaveAttribute('data-selected-selector', custom);
    second.unmount();

    render(bleedTree(true));
    const both = screen.getByRole('group', { name: '카테고리' });
    expect(both).toHaveClass('scroll-px-6');
    expect(both.className).not.toMatch(/scroll-p[lx]-4/);
  });

  it('⑥ shows buttons and no hints or slots at >=768px', async () => {
    layout.scrollWidth = 900;
    render(bleedTree(true));
    const group = screen.getByRole('group', { name: '카테고리' });
    await scrollTo(group, 'both');
    expect(screen.getByRole('button', { name: '카테고리 이전 항목 보기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '카테고리 다음 항목 보기' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-overflow-hint], [data-overflow-slot]')).toHaveLength(0);
  });
});

describe('ScrollRow — user scroll means a scroll after an input signal (보정 5)', () => {
  /** 카테고리 줄: 보이는 폭 300px, `에이전트` 칩 폭을 바꿀 수 있다. */
  function setupGrowingChip() {
    layout.scrollWidth = 900;
    const size = { chipWidth: 60 };
    mockScrollingRects(
      () => [0, 300],
      () => ({ 에이전트: [200, 200 + size.chipWidth] })
    );
    render(categoriesTree('에이전트'));
    const group = screen.getByRole('group', { name: '카테고리' });
    const chip = within(group).getByRole('button', { name: '에이전트' });
    return { group, chip, size };
  }

  it('① re-reveals the selected chip on resize after a scroll that came without any input (browser clamp/snap)', async () => {
    const { group, chip, size } = setupGrowingChip();
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));

    setScrollLeft(group, 10);
    size.chipWidth = 100;
    triggerResize();
    expectChipInsideRow(chip, group);
  });

  it('② keeps the user position on resize after pointerdown, touchstart, keydown or a scroll button click', async () => {
    const inputs: Array<[string, (group: HTMLElement) => void]> = [
      ['pointerdown', (g) => fireEvent.pointerDown(g)],
      ['touchstart', (g) => fireEvent.touchStart(g)],
      ['keydown', (g) => fireEvent.keyDown(g, { key: 'ArrowRight' })],
    ];
    for (const [, input] of inputs) {
      const { group, size } = setupGrowingChip();
      await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
      input(group);
      setScrollLeft(group, 10);
      size.chipWidth = 100;
      triggerResize();
      expect(group.scrollLeft).toBe(10);
      cleanup();
    }

    const { group, size } = setupGrowingChip();
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
    fireEvent.click(await screen.findByRole('button', { name: '카테고리 다음 항목 보기' }));
    fireEvent.scroll(group);
    expect(group.scrollLeft).toBe(240);
    size.chipWidth = 100;
    triggerResize();
    expect(group.scrollLeft).toBe(240);
  });

  it('③ ends the interaction when no scroll follows the input within 1,000ms', async () => {
    const { group, chip, size } = setupGrowingChip();
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      fireEvent.wheel(group, { deltaX: 40 });
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      setScrollLeft(group, 10);
      size.chipWidth = 100;
      triggerResize();
      expectChipInsideRow(chip, group);
    } finally {
      vi.useRealTimers();
    }
  });

  it('④ does not treat the focus moved by "keep focus" as an input signal', async () => {
    layout.scrollWidth = 900;
    const size = { chipWidth: 60 };
    mockScrollingRects(
      () => [0, 300],
      () => ({ MCP: [200, 200 + size.chipWidth] })
    );
    const { rerender } = render(categoriesTree('MCP'));
    const group = screen.getByRole('group', { name: '카테고리' });
    const next = await screen.findByRole('button', { name: '카테고리 다음 항목 보기' });
    act(() => next.focus());

    // 폭이 768 미만이 되어 버튼이 사라지면 포커스 유지가 선택 칩으로 포커스를 옮긴다 (줄 안 focusin).
    mockMatchMedia(360);
    rerender(categoriesTree('MCP'));
    const chip = within(group).getByRole('button', { name: 'MCP' });
    expect(document.activeElement).toBe(chip);

    // 입력 없이 브라우저가 scrollLeft 를 바꾼 뒤 칩이 커지면 다시 보이게 한다.
    setScrollLeft(group, 10);
    size.chipWidth = 100;
    triggerResize();
    expectChipInsideRow(chip, group);
  });
});

describe('ScrollRow — only a horizontal-intent wheel is an input signal (보정 6)', () => {
  /** 카테고리 줄: 보이는 폭 300px, `에이전트` 칩 폭을 바꿀 수 있다. */
  function setupGrowingRow() {
    layout.scrollWidth = 900;
    const size = { chipWidth: 60 };
    mockScrollingRects(
      () => [0, 300],
      () => ({ 에이전트: [200, 200 + size.chipWidth] })
    );
    render(categoriesTree('에이전트'));
    const group = screen.getByRole('group', { name: '카테고리' });
    const chip = within(group).getByRole('button', { name: '에이전트' });
    return { group, chip, size };
  }

  it('⑤ does not count a vertical wheel (page scroll over the row) as an input signal', async () => {
    const { group, chip, size } = setupGrowingRow();
    await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));

    fireEvent.wheel(group, { deltaY: 100 });
    setScrollLeft(group, 10);
    size.chipWidth = 100;
    triggerResize();
    expectChipInsideRow(chip, group);
  });

  it('⑥ counts a wheel with deltaX > deltaY and a Shift + vertical wheel as input signals', async () => {
    const wheels = [{ deltaX: 40, deltaY: 10 }, { deltaY: 100, shiftKey: true }];
    for (const init of wheels) {
      const { group, size } = setupGrowingRow();
      await waitFor(() => expect(group).toHaveAttribute('data-overflow', 'end'));
      fireEvent.wheel(group, init);
      setScrollLeft(group, 10);
      size.chipWidth = 100;
      triggerResize();
      expect(group.scrollLeft).toBe(10);
      cleanup();
    }
  });
});
