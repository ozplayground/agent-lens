import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { Tabs, TabPanel } from '@/components/ui/Tabs';

type TabId = 'summary' | 'ask' | 'sources';

const TABS = [
  { id: 'summary' as const, label: '요약' },
  { id: 'ask' as const, label: '질의응답', badge: 3 },
  { id: 'sources' as const, label: '출처' },
];

function Harness({ initial = 'summary' as TabId }: { initial?: TabId }) {
  const [value, setValue] = useState<TabId>(initial);
  return (
    <>
      <Tabs label="기사 보기" tabs={TABS} value={value} onChange={setValue} idPrefix="news" />
      {TABS.map((tab) => (
        <TabPanel key={tab.id} id={tab.id} idPrefix="news" active={tab.id === value}>
          {tab.label} 패널
        </TabPanel>
      ))}
    </>
  );
}

describe('Tabs', () => {
  it('renders tablist, tabs and the linked tabpanel', () => {
    render(<Harness />);

    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    const summary = screen.getByRole('tab', { name: '요약' });
    expect(summary).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /질의응답/ })).toHaveAttribute('aria-selected', 'false');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('요약 패널');
    expect(summary).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', summary.id);
  });

  it('uses roving tabIndex: only the selected tab is in the Tab order', () => {
    render(<Harness initial="ask" />);
    expect(screen.getByRole('tab', { name: /질의응답/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: '요약' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: '출처' })).toHaveAttribute('tabindex', '-1');
  });

  it('activates a tab on click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: '출처' }));
    expect(screen.getByRole('tab', { name: '출처' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('출처 패널');
  });

  it('moves with ArrowRight/ArrowLeft and wraps around, moving focus and selection', () => {
    render(<Harness />);
    const summary = screen.getByRole('tab', { name: '요약' });
    summary.focus();

    fireEvent.keyDown(summary, { key: 'ArrowRight' });
    const ask = screen.getByRole('tab', { name: /질의응답/ });
    expect(ask).toHaveAttribute('aria-selected', 'true');
    expect(ask).toHaveFocus();
    expect(ask).toHaveAttribute('tabindex', '0');
    expect(summary).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(ask, { key: 'ArrowRight' });
    const sources = screen.getByRole('tab', { name: '출처' });
    expect(sources).toHaveAttribute('aria-selected', 'true');

    // 마지막에서 → 는 처음으로
    fireEvent.keyDown(sources, { key: 'ArrowRight' });
    expect(summary).toHaveAttribute('aria-selected', 'true');
    expect(summary).toHaveFocus();

    // 처음에서 ← 는 마지막으로
    fireEvent.keyDown(summary, { key: 'ArrowLeft' });
    expect(sources).toHaveAttribute('aria-selected', 'true');
    expect(sources).toHaveFocus();
  });

  it('jumps to the first and last tab with Home and End', () => {
    render(<Harness initial="ask" />);
    const ask = screen.getByRole('tab', { name: /질의응답/ });
    ask.focus();

    fireEvent.keyDown(ask, { key: 'End' });
    const sources = screen.getByRole('tab', { name: '출처' });
    expect(sources).toHaveAttribute('aria-selected', 'true');
    expect(sources).toHaveFocus();

    fireEvent.keyDown(sources, { key: 'Home' });
    const summary = screen.getByRole('tab', { name: '요약' });
    expect(summary).toHaveAttribute('aria-selected', 'true');
    expect(summary).toHaveFocus();
  });

  it('renders a badge inside the tab', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: /질의응답/ })).toHaveTextContent('3');
  });

  it('hides inactive panels with the hidden attribute', () => {
    const { container } = render(<Harness />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(3);
    expect(Array.from(panels).filter((panel) => !panel.hasAttribute('hidden'))).toHaveLength(1);
  });
});

// aria-controls 는 그 순간 DOM 에 있는 패널만 가리킨다 (spec 14.7 C-1, R24).
function SelectedPanelOnlyHarness({ initial = 'summary' as TabId }: { initial?: TabId }) {
  const [value, setValue] = useState<TabId>(initial);
  return (
    <>
      <Tabs label="기사 보기" tabs={TABS} value={value} onChange={setValue} idPrefix="news" />
      <TabPanel id={value} idPrefix="news">
        {value} 패널
      </TabPanel>
    </>
  );
}

describe('Tabs aria-controls (R24)', () => {
  it('선택된 패널만 그리면 선택되지 않은 탭에는 aria-controls 가 없다', () => {
    render(<SelectedPanelOnlyHarness />);
    const summary = screen.getByRole('tab', { name: '요약' });
    const controls = summary.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).toBe(screen.getByRole('tabpanel'));

    expect(screen.getByRole('tab', { name: /질의응답/ })).not.toHaveAttribute('aria-controls');
    expect(screen.getByRole('tab', { name: '출처' })).not.toHaveAttribute('aria-controls');
  });

  it('탭을 바꾸면 aria-controls 도 새로 선택된 탭으로 옮긴다', () => {
    render(<SelectedPanelOnlyHarness />);
    fireEvent.click(screen.getByRole('tab', { name: '출처' }));
    const sources = screen.getByRole('tab', { name: '출처' });
    expect(document.getElementById(sources.getAttribute('aria-controls') ?? '')).toBe(screen.getByRole('tabpanel'));
    expect(screen.getByRole('tab', { name: '요약' })).not.toHaveAttribute('aria-controls');
  });

  it('모든 aria-controls 가 문서에 있는 요소를 가리킨다', () => {
    render(<SelectedPanelOnlyHarness initial="ask" />);
    for (const tab of screen.getAllByRole('tab')) {
      const controls = tab.getAttribute('aria-controls');
      if (controls) expect(document.getElementById(controls)).not.toBeNull();
    }
  });

  it('mountedPanels 로 숨겨 둔 패널이 있는 탭에도 aria-controls 를 단다', () => {
    function AllMountedHarness() {
      const [value, setValue] = useState<TabId>('summary');
      return (
        <>
          <Tabs
            label="기사 보기"
            tabs={TABS}
            value={value}
            onChange={setValue}
            idPrefix="news"
            mountedPanels={TABS.map((tab) => tab.id)}
          />
          {TABS.map((tab) => (
            <TabPanel key={tab.id} id={tab.id} idPrefix="news" active={tab.id === value}>
              {tab.label} 패널
            </TabPanel>
          ))}
        </>
      );
    }
    render(<AllMountedHarness />);
    for (const tab of screen.getAllByRole('tab')) {
      const controls = tab.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls as string)).toHaveAttribute('role', 'tabpanel');
    }
  });
});

// 탭 줄이 넘치면 스크롤 줄 규칙(spec 14.3, R15·R16)을 따른다 — 27 측정의 `연동 종류` 탭 clip 실패.
describe('Tabs 가로 넘침 (스크롤 줄)', () => {
  const tabLayout = { scrollWidth: 300, clientWidth: 300 };
  const tabScrollLefts = new WeakMap<Element, number>();
  const isTablist = (el: Element) => el.getAttribute('role') === 'tablist';

  function mockTablistLayout(scrollWidth: number, clientWidth = 300) {
    tabLayout.scrollWidth = scrollWidth;
    tabLayout.clientWidth = clientWidth;
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isTablist(this) ? tabLayout.scrollWidth : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isTablist(this) ? tabLayout.clientWidth : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return tabScrollLefts.get(this) ?? 0;
      },
      set(this: HTMLElement, value: number) {
        const max = Math.max(0, tabLayout.scrollWidth - tabLayout.clientWidth);
        tabScrollLefts.set(this, Math.min(Math.max(0, value), max));
      },
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    delete proto.scrollWidth;
    delete proto.clientWidth;
    delete proto.scrollLeft;
  });

  it('넘치지 않으면 tablist 가 data-scroll-row 이고 data-overflow="none", 마스크·스크롤 버튼 없음', async () => {
    mockTablistLayout(300);
    render(<Harness />);
    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    expect(tablist).toHaveAttribute('data-scroll-row');
    await waitFor(() => expect(tablist).toHaveAttribute('data-overflow', 'none'));
    expect(tablist.className).not.toMatch(/mask/);
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
  });

  it('넘치면 넘친 쪽을 data-overflow 로 알리고 흐림을 주며, 768 이상에서 tablist 밖에 스크롤 버튼을 둔다', async () => {
    mockTablistLayout(600);
    render(<Harness />);
    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    await waitFor(() => expect(tablist).toHaveAttribute('data-overflow', 'end'));
    expect(tablist.className).toMatch(/mask-image/);

    const next = screen.getByRole('button', { name: '기사 보기 다음 항목 보기' });
    expect(tablist).not.toContainElement(next);
    expect(screen.queryByRole('button', { name: '기사 보기 이전 항목 보기' })).not.toBeInTheDocument();
    // tablist 안에는 탭만 있다.
    expect(within(tablist).getAllByRole('tab')).toHaveLength(3);
    expect(within(tablist).queryAllByRole('button')).toHaveLength(0);

    act(() => {
      tablist.scrollLeft = 300;
    });
    fireEvent.scroll(tablist);
    await waitFor(() => expect(tablist).toHaveAttribute('data-overflow', 'start'));
    expect(screen.getByRole('button', { name: '기사 보기 이전 항목 보기' })).toBeInTheDocument();
  });

  it('키보드로 옮긴 탭이 보이도록 스크롤한다', () => {
    mockTablistLayout(600);
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    render(<Harness />);
    const summary = screen.getByRole('tab', { name: '요약' });
    summary.focus();
    scrollIntoView.mockClear();
    fireEvent.keyDown(summary, { key: 'End' });
    const sources = screen.getByRole('tab', { name: '출처' });
    expect(sources).toHaveFocus();
    expect(scrollIntoView.mock.instances).toContain(sources);
  });

  it('선택된 탭이 줄 밖에 있으면 처음 그릴 때 줄을 그 탭까지 민다', async () => {
    mockTablistLayout(600);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (isTablist(this)) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 40 });
      if (this.getAttribute('role') === 'tab' && this.textContent === '출처') {
        return DOMRect.fromRect({ x: 420, y: 0, width: 120, height: 40 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    });
    render(<Harness initial="sources" />);
    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    await waitFor(() => expect(tablist.scrollLeft).toBeGreaterThan(0));
  });
});

// 3차 후속: 선택 탭 보이기와 768 미만 넘침 표시는 ScrollRow 가 한다 (회귀 방지, 리팩터라 실패 예상 아님).
describe('Tabs 스크롤 줄 — ScrollRow 위임 (3차)', () => {
  const rowLayout = { scrollWidth: 600, clientWidth: 300 };
  const rowScrollLefts = new WeakMap<Element, number>();
  const isRow = (el: Element) => el.getAttribute('role') === 'tablist';
  const originalMatchMedia = window.matchMedia;

  function mockLayout() {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isRow(this) ? rowLayout.scrollWidth : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isRow(this) ? rowLayout.clientWidth : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return rowScrollLefts.get(this) ?? 0;
      },
      set(this: HTMLElement, value: number) {
        const max = Math.max(0, rowLayout.scrollWidth - rowLayout.clientWidth);
        rowScrollLefts.set(this, Math.min(Math.max(0, value), max));
      },
    });
  }

  function mockViewportWidth(width: number) {
    window.matchMedia = (query: string): MediaQueryList => {
      const min = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(query);
      const max = /\(\s*max-width\s*:\s*(\d+)px\s*\)/.exec(query);
      const matches = min ? Number(min[1]) <= width : max ? Number(max[1]) >= width : false;
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

  afterEach(() => {
    vi.restoreAllMocks();
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    delete proto.scrollWidth;
    delete proto.clientWidth;
    delete proto.scrollLeft;
    window.matchMedia = originalMatchMedia;
  });

  it('선택을 줄 밖 탭으로 바꾸면 줄을 그 탭 쪽으로 민다', async () => {
    mockLayout();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (isRow(this)) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 40 });
      if (this.getAttribute('role') === 'tab' && this.textContent === '출처') {
        return DOMRect.fromRect({ x: 420, y: 0, width: 120, height: 40 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 80, height: 40 });
    });
    render(<Harness />);
    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    expect(tablist.scrollLeft).toBe(0);

    fireEvent.click(screen.getByRole('tab', { name: '출처' }));
    await waitFor(() => expect(tablist.scrollLeft).toBeGreaterThan(0));
  });

  it('768 미만에서 탭 줄이 넘치면 tablist 밖에 장식 넘침 표시를 둔다', async () => {
    mockLayout();
    mockViewportWidth(360);
    render(<Harness />);
    const tablist = screen.getByRole('tablist', { name: '기사 보기' });
    await waitFor(() => expect(tablist).toHaveAttribute('data-overflow', 'end'));

    const hints = document.querySelectorAll('[data-overflow-hint]');
    expect(hints).toHaveLength(1);
    expect(hints[0]).toHaveAttribute('aria-hidden', 'true');
    expect(tablist).not.toContainElement(hints[0] as HTMLElement);
    expect(tablist.parentElement).toContainElement(hints[0] as HTMLElement);
    // 768 미만에서는 스크롤 버튼 대신 표시만 둔다.
    expect(screen.queryByRole('button', { name: /항목 보기/ })).not.toBeInTheDocument();
  });
});

