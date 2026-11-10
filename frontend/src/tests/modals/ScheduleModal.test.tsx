import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import ScheduleModal from '@/components/ScheduleModal';
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

const OK_STATUS = {
  current_time: '2026-11-06T00:00:00Z',
  schedule_hours: [0, 6, 12, 18],
  timezone: 'UTC',
  next_run: '2026-11-06T06:00:00Z',
  minutes_until_next_run: 95,
  is_running: false,
  last_crawl_time: null,
  last_crawl_status: 'idle',
};

describe('ScheduleModal', () => {
  beforeEach(() => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue(OK_STATUS as never);
    vi.mocked(api.triggerManualCollect).mockResolvedValue({ status: 'ok', message: '', total_collected: 0, total_saved: 0, source_results: {} });
    vi.mocked(api.fetchCrawlProgress).mockResolvedValue({ is_running: true, items_saved: 0, step_message: '' } as never);
    vi.mocked(api.resetAndRecollect).mockResolvedValue({ status: 'ok', message: '', deleted_count: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<ScheduleModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a labelled modal dialog with the schedule and next run', async () => {
    render(<ScheduleModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '자동 수집 스케줄' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(await within(dialog).findByText('00:00 · 06:00 · 12:00 · 18:00')).toBeInTheDocument();
    expect(await within(dialog).findByText('95분 후')).toBeInTheDocument();
  });

  it('수집 시각은 고정 문구가 아니라 스케줄 응답(schedule_hours·timezone)으로 그린다 (FE-25)', async () => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue({
      current_time: '2026-11-06T00:00:00Z',
      schedule_hours: [3, 15],
      timezone: 'UTC',
      next_run: '2026-11-06T03:00:00Z',
      minutes_until_next_run: 30,
      is_running: false,
      last_crawl_time: null,
      last_crawl_status: 'idle',
    } as never);
    render(<ScheduleModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '자동 수집 스케줄' });

    expect(await within(dialog).findByText('03:00 · 15:00')).toBeInTheDocument();
    expect(within(dialog).getByText('(KST: 12:00, 00:00)')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /수집 주기 \(UTC\)/ })).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent('매일 4회');
    expect(dialog).not.toHaveTextContent('00:00 · 06:00');
  });

  it('closes with the header close button and Escape', () => {
    const onClose = vi.fn();
    render(<ScheduleModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('triggers a manual collection from the footer button', async () => {
    render(<ScheduleModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '즉시 수집' }));
    await waitFor(() => expect(api.triggerManualCollect).toHaveBeenCalledTimes(1));
  });

  it('opens the reset confirmation from the danger zone and Escape closes only the confirmation', () => {
    const onClose = vi.fn();
    render(<ScheduleModal isOpen onClose={onClose} />);

    expect(screen.getByRole('heading', { name: '위험 영역' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '초기화 & 재수집…' }));

    expect(screen.getByRole('alertdialog', { name: '수집 데이터 전체 삭제 및 재수집' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '자동 수집 스케줄' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Error: 스케줄 응답이 실패하면 불러오는 중에 머물지 않고 오류와 다시 시도를 보이며, 다시 시도하면 시각을 그린다 (FE-39)', async () => {
    vi.mocked(api.fetchScheduleStatus).mockRejectedValueOnce(new Error('스케줄 정보를 불러오지 못했습니다.'));
    render(<ScheduleModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '자동 수집 스케줄' });

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('스케줄 정보를 불러오지 못했습니다.');
    expect(within(dialog).queryByText('불러오는 중...')).not.toBeInTheDocument();

    fireEvent.click(within(alert).getByRole('button', { name: '다시 시도' }));
    expect(await within(dialog).findByText('00:00 · 06:00 · 12:00 · 18:00')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Empty: 정해진 수집 시각이 없으면 빈 칸 대신 안내를 보인다', async () => {
    vi.mocked(api.fetchScheduleStatus).mockResolvedValue({
      current_time: '2026-11-06T00:00:00Z',
      schedule_hours: [],
      timezone: 'UTC',
      next_run: '2026-11-06T06:00:00Z',
      minutes_until_next_run: 95,
      is_running: false,
      last_crawl_time: null,
      last_crawl_status: 'idle',
    } as never);
    render(<ScheduleModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('정해진 수집 시각이 없습니다')).toBeInTheDocument();
  });
});
