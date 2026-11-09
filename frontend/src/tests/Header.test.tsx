import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import Header, { CollectorStatusLine } from '@/components/Header';
import { collectNow, resetAndCollect } from '@/hooks/useCollector';
import { ThemeProvider } from '@/context/ThemeContext';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    fetchScheduleStatus: vi.fn(),
    triggerManualCollect: vi.fn(),
    fetchCrawlProgress: vi.fn(),
    resetAndRecollect: vi.fn(),
  };
});

const scheduleStatus = {
  current_time: '2026-11-06T00:00:00Z',
  schedule_hours: [0, 6, 12, 18],
  timezone: 'UTC',
  next_run: '2026-11-06T03:12:00Z',
  minutes_until_next_run: 192,
  is_running: false,
  last_crawl_time: null,
  last_crawl_status: 'idle',
};

function renderHeader(overrides: Partial<React.ComponentProps<typeof Header>> = {}) {
  const props = {
    onRefresh: vi.fn(),
    onOpenSchedule: vi.fn(),
    onOpenMcp: vi.fn(),
    onOpenWebhook: vi.fn(),
    onOpenSources: vi.fn(),
    ...overrides,
  };
  render(
    <ThemeProvider defaultTheme="light">
      <Header {...props} />
    </ThemeProvider>
  );
  return props;
}

function openMoreMenu() {
  fireEvent.click(screen.getByRole('button', { name: '더보기' }));
  return screen.getByRole('menu', { name: '더보기' });
}

describe('Header', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue(scheduleStatus as never);
    vi.mocked(api.triggerManualCollect).mockResolvedValue({ status: 'ok', message: '', total_collected: 0, total_saved: 0 });
    vi.mocked(api.fetchCrawlProgress).mockResolvedValue({ is_running: true, items_saved: 0, step_message: '' } as never);
    vi.mocked(api.resetAndRecollect).mockResolvedValue({ status: 'ok', message: '', deleted_count: 3 });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  describe('version badge (NEXT_PUBLIC_APP_VERSION)', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows v{version} when the build provides a version', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '9.8.7');
      renderHeader();
      expect(screen.getByText('v9.8.7')).toBeInTheDocument();
    });

    it('renders no version badge when the version is missing', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '');
      renderHeader();
      expect(screen.queryByText(/^v\d/)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'AgentLens' })).toBeInTheDocument();
    });
  });

  it('renders exactly one AI 챗 link pointing to /chat inside the main nav', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', { name: '주 메뉴' });
    const links = screen.getAllByRole('link', { name: /AI 챗/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/chat');
    expect(nav).toContainElement(links[0]);
  });

  it('shows the next collection time on the schedule button and opens the schedule', async () => {
    const props = renderHeader();
    const button = await screen.findByRole('button', { name: '수집 스케줄 · 다음 수집 3h 12m 후' });
    fireEvent.click(button);
    expect(props.onOpenSchedule).toHaveBeenCalledTimes(1);
  });

  it('lists the desktop more-menu items and calls each callback', () => {
    const props = renderHeader();

    let menu = openMoreMenu();
    const labels = within(menu)
      .getAllByRole('menuitem')
      .map((el) => el.textContent);
    expect(labels).toEqual(['소스 & 리서처', '공유 & 알림', 'MCP 연동', 'RSS 피드', '초기화 & 재수집…']);
    expect(within(menu).queryByRole('menuitemradio')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: /수집 스케줄/ })).not.toBeInTheDocument();

    const rss = within(menu).getByRole('menuitem', { name: 'RSS 피드' });
    expect(rss).toHaveAttribute('href', '/api/news/feed/rss.xml');
    expect(rss).toHaveAttribute('target', '_blank');

    fireEvent.click(within(menu).getByRole('menuitem', { name: '소스 & 리서처' }));
    expect(props.onOpenSources).toHaveBeenCalledTimes(1);

    menu = openMoreMenu();
    fireEvent.click(within(menu).getByRole('menuitem', { name: '공유 & 알림' }));
    expect(props.onOpenWebhook).toHaveBeenCalledTimes(1);

    menu = openMoreMenu();
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'MCP 연동' }));
    expect(props.onOpenMcp).toHaveBeenCalledTimes(1);
  });

  it('opens the reset confirmation dialog from the more menu', async () => {
    renderHeader();
    const menu = openMoreMenu();
    fireEvent.click(within(menu).getByRole('menuitem', { name: '초기화 & 재수집…' }));

    const dialog = screen.getByRole('alertdialog', { name: '수집 데이터 전체 삭제 및 재수집' });
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();

    fireEvent.click(within(dialog).getByRole('button', { name: '전체 삭제 후 다시 수집' }));
    await waitFor(() => expect(api.resetAndRecollect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('shows the reset error inside the dialog instead of alert()', async () => {
    vi.mocked(api.resetAndRecollect).mockRejectedValueOnce(new Error('서버 오류'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderHeader();
    fireEvent.click(within(openMoreMenu()).getByRole('menuitem', { name: '초기화 & 재수집…' }));
    fireEvent.click(screen.getByRole('button', { name: '전체 삭제 후 다시 수집' }));

    const dialog = screen.getByRole('alertdialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('서버 오류');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('adds schedule, collect and theme items to the more menu on mobile', async () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: /max-width:\s*767px/.test(query),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia;

    const props = renderHeader();
    await screen.findByRole('button', { name: /다음 수집 3h 12m 후/ });

    let menu = openMoreMenu();
    expect(within(menu).getByRole('menuitem', { name: '수집 스케줄 (다음 3h 12m 후)' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: '즉시 수집' })).toBeInTheDocument();
    const radios = within(menu).getAllByRole('menuitemradio');
    expect(radios.map((r) => r.textContent)).toEqual(['라이트', '다크', '시스템']);
    expect(within(menu).getByRole('menuitemradio', { name: '라이트' })).toHaveAttribute('aria-checked', 'true');
    // 위험 항목은 여전히 맨 끝
    const items = within(menu).getAllByRole('menuitem');
    expect(items[items.length - 1]).toHaveTextContent('초기화 & 재수집…');

    fireEvent.click(within(menu).getByRole('menuitem', { name: '수집 스케줄 (다음 3h 12m 후)' }));
    expect(props.onOpenSchedule).toHaveBeenCalledTimes(1);

    menu = openMoreMenu();
    fireEvent.click(within(menu).getByRole('menuitem', { name: '즉시 수집' }));
    await waitFor(() => expect(api.triggerManualCollect).toHaveBeenCalledTimes(1));
  });

  it('toggles the command palette with Cmd+K / Ctrl+K', () => {
    renderHeader();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog', { name: '커맨드 팔레트' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.queryByRole('dialog', { name: '커맨드 팔레트' })).not.toBeInTheDocument();
  });

  it('adds schedule, settings, RSS and reset commands to the palette', () => {
    const props = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: '커맨드 팔레트 열기' }));
    const palette = screen.getByRole('dialog', { name: '커맨드 팔레트' });
    expect(within(palette).getAllByRole('option')).toHaveLength(9);
    expect(within(palette).queryByText('C')).not.toBeInTheDocument();

    fireEvent.click(within(palette).getByText('수집 스케줄 보기'));
    expect(props.onOpenSchedule).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: '커맨드 팔레트' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '커맨드 팔레트 열기' }));
    fireEvent.click(screen.getByText('수집 데이터 초기화 & 재수집'));
    expect(screen.getByRole('alertdialog', { name: '수집 데이터 전체 삭제 및 재수집' })).toBeInTheDocument();
  });

  it('disables the palette reset command while collecting', async () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: '즉시 수집' }));
    await waitFor(() => expect(api.triggerManualCollect).toHaveBeenCalledTimes(1));
    await screen.findByRole('button', { name: '수집 중' });

    fireEvent.click(screen.getByRole('button', { name: '커맨드 팔레트 열기' }));
    const palette = screen.getByRole('dialog', { name: '커맨드 팔레트' });
    const reset = within(palette).getByText('수집 데이터 초기화 & 재수집').closest('[role="option"]')!;
    expect(reset).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(reset);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '커맨드 팔레트' })).toBeInTheDocument();
  });
});

describe('Header collector state restore (R27)', () => {
  beforeEach(() => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue({
      ...scheduleStatus,
      is_running: true,
      last_crawl_status: 'running',
    } as never);
    vi.mocked(api.triggerManualCollect).mockResolvedValue({ status: 'ok', message: '', total_collected: 0, total_saved: 0 });
    vi.mocked(api.fetchCrawlProgress).mockResolvedValue({ is_running: true, items_saved: 0, step_message: '' } as never);
    vi.mocked(api.resetAndRecollect).mockResolvedValue({ status: 'ok', message: '', deleted_count: 3 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows 수집 중 and the progress line on mount when a collection is already running', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Header onRefresh={vi.fn()} onOpenSchedule={vi.fn()} onOpenMcp={vi.fn()} onOpenWebhook={vi.fn()} onOpenSources={vi.fn()} />
        <CollectorStatusLine />
      </ThemeProvider>
    );

    const collect = await screen.findByRole('button', { name: '수집 중' });
    expect(collect).toBeDisabled();
    expect(await screen.findByText('실시간 소식 수집 중...')).toBeInTheDocument();

    fireEvent.click(collect);
    expect(api.triggerManualCollect).not.toHaveBeenCalled();
  });
});

describe('useCollector polling runs', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ignores a progress response from a previous run after a new run starts', async () => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue(scheduleStatus as never);
    vi.mocked(api.triggerManualCollect).mockResolvedValue({ status: 'ok', message: '', total_collected: 0, total_saved: 0 });
    vi.mocked(api.resetAndRecollect).mockResolvedValue({ status: 'ok', message: '', deleted_count: 3 });

    // 첫 회차의 진행 요청은 늦게 돌아온다 (이전 회차 응답).
    let resolveStale: (value: unknown) => void = () => {};
    const stale = new Promise((resolve) => {
      resolveStale = resolve;
    });
    vi.mocked(api.fetchCrawlProgress)
      .mockImplementationOnce(() => stale as never)
      .mockImplementation(() => new Promise(() => {}) as never);

    render(<CollectorStatusLine />);

    await act(async () => {
      await collectNow();
    });
    expect(screen.getByRole('status')).toHaveTextContent('실시간 소식 수집 중...');
    // 첫 회차 폴링이 진행 요청을 보낼 때까지 기다린다 (1.2초 간격).
    await waitFor(() => expect(api.fetchCrawlProgress).toHaveBeenCalledTimes(1), { timeout: 3000 });

    // 새 회차 시작 (초기화 성공 → 새 폴링)
    await act(async () => {
      await resetAndCollect();
    });
    expect(screen.getByRole('status')).toHaveTextContent('기존 3건 삭제 완료. 신규 수집 중...');

    // 이전 회차 응답이 이제야 도착: 끝났다고 알리지만 반영되면 안 된다.
    await act(async () => {
      resolveStale({ is_running: false, items_saved: 99, step_message: '이전 회차 완료' });
      await stale;
    });
    expect(screen.getByRole('status')).toHaveTextContent('기존 3건 삭제 완료. 신규 수집 중...');
    expect(screen.getByRole('status')).not.toHaveTextContent('수집 완료');
  });
});
