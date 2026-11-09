import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FeedStatusBar, { type FeedStatusBarProps } from '@/components/feed/FeedStatusBar';

/**
 * 목록 머리줄 (spec 14.17 G1, R42): 왼쪽 상태(`role="status"`) + 오른쪽 정렬.
 * 정렬은 live 영역 밖, 상태 뒤 형제다. 정렬 단언은 `FeedToolbar.test.tsx` 에서 옮겨 왔다 (spec 14.17 표).
 */

const originalMatchMedia = window.matchMedia;

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

function baseProps(overrides: Partial<FeedStatusBarProps> = {}): FeedStatusBarProps {
  return {
    total: 42,
    totalNews: 100,
    filtered: false,
    isBookmarks: false,
    highSignalOnly: false,
    page: 2,
    totalPages: 5,
    sort: 'hot',
    onSortChange: vi.fn(),
    onPageChange: vi.fn(),
    ...overrides,
  };
}

function parts() {
  const header = document.querySelector('[data-feed-list-header]') as HTMLElement | null;
  const status = screen.getByRole('status');
  const select = screen.queryByRole('combobox', { name: '정렬' });
  return { header, status, select };
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('FeedStatusBar — 목록 머리줄 정렬 (R42)', () => {
  it('offers four sort options in a labelled select and calls back on change', () => {
    const props = baseProps();
    render(<FeedStatusBar {...props} />);
    const found = screen.queryByRole('combobox', { name: '정렬' });
    expect(found).not.toBeNull();
    const select = found!;
    const options = within(select)
      .getAllByRole('option')
      .map((o) => [o.getAttribute('value'), o.textContent]);
    expect(options).toEqual([
      ['hot', '인기순'],
      ['quality', '품질순'],
      ['latest', '최신순'],
      ['top', '추천순'],
    ]);
    fireEvent.change(select, { target: { value: 'latest' } });
    expect(props.onSortChange).toHaveBeenCalledWith('latest');
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('places sort inside [data-feed-list-header], outside the status live region and after it', () => {
    render(<FeedStatusBar {...baseProps()} />);
    const { header, status, select } = parts();
    expect(header).not.toBeNull();
    expect(select).not.toBeNull();
    expect(header).toContainElement(select);
    expect(header).toContainElement(status);
    expect(status).not.toContainElement(select);
    expect(status.compareDocumentPosition(select!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the status as a polite live region with the page text', () => {
    render(<FeedStatusBar {...baseProps()} />);
    const { status } = parts();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('data-feed-status');
    expect(status).toHaveTextContent('페이지 2 / 5');
  });

  it('lays out the header as one non-wrapping row: status min-w-0 flex-1, sort w-28 shrink-0 xl:w-32', () => {
    render(<FeedStatusBar {...baseProps()} />);
    const { header, status, select } = parts();
    expect(header).toHaveClass('flex', 'items-start');
    expect(header!.classList.contains('flex-wrap')).toBe(false);
    expect(status).toHaveClass('min-w-0', 'flex-1');
    expect(select).not.toBeNull();
    const sortContainer = Array.from(header!.children).find((child) => child.contains(select));
    expect(sortContainer).toHaveClass('w-28', 'shrink-0', 'xl:w-32');
  });

  it('keeps sort on the first line when the status wraps: header items-start, status min-h matches the select (44 / md 36)', () => {
    render(<FeedStatusBar {...baseProps({ filtered: true, highSignalOnly: true })} />);
    const { header, status } = parts();
    // 상태가 여러 줄이 되어도 정렬은 머리줄 위쪽(첫 줄 오른쪽)에 남는다 — 세로 가운데로 내려가지 않는다.
    expect(header).toHaveClass('items-start');
    expect(header).not.toHaveClass('items-center');
    // 상태가 한 줄일 때는 select 높이(h-11 = 44px, md:h-9 = 36px)만큼의 최소 높이 안에서 세로 가운데라
    // 상태 글자와 정렬의 세로 중심이 같다.
    expect(status).toHaveClass('min-h-11', 'md:min-h-9', 'items-center');
    const select = screen.getByRole('combobox', { name: '정렬' });
    expect(select).toHaveClass('h-11', 'md:h-9');
  });

  it('keeps the same sort node across widths (360 → 1440)', () => {
    mockViewport(360);
    const props = baseProps();
    const { rerender } = render(<FeedStatusBar {...props} />);
    const first = screen.queryByRole('combobox', { name: '정렬' });
    expect(first).not.toBeNull();

    mockViewport(1440);
    rerender(<FeedStatusBar {...props} />);
    expect(screen.getByRole('combobox', { name: '정렬' })).toBe(first);
  });
});
