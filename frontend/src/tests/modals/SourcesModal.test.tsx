import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import SourcesModal from '@/components/SourcesModal';
import { mockSourcesResponse } from '@/mocks/handlers';

const deleteCalls: string[] = [];
let confirmSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  deleteCalls.length = 0;
  server.use(
    http.get('*/api/research/status', () =>
      HttpResponse.json({ is_running: false, auto_adopted_count: 2, last_run_summary: {}, cadence: 'daily' })
    ),
    http.get('*/api/research/audit-logs', () => HttpResponse.json({ status: 'success', total: 0, logs: [] })),
    http.delete('*/api/sources/:type/:id', ({ params }) => {
      deleteCalls.push(`${params.type}/${params.id}`);
      return HttpResponse.json({ status: 'success', message: 'deleted' });
    })
  );
  confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
});

afterEach(() => {
  confirmSpy.mockRestore();
});

async function openSourcesTab(onClose = vi.fn()) {
  render(<SourcesModal isOpen onClose={onClose} />);
  const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });
  const sourcesTab = within(dialog).getByRole('tab', { name: /등록된 수집원/ });
  fireEvent.click(sourcesTab);
  await within(dialog).findByText('GeekNews (긱뉴스)');
  return { dialog, onClose };
}

describe('SourcesModal', () => {
  it('is a modal dialog whose first tab is selected by default', () => {
    render(<SourcesModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const tabs = within(dialog).getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent('AI 딥 리서처');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('lists sources from MSW with a switch and a delete button per source', async () => {
    const { dialog } = await openSourcesTab();
    expect(within(dialog).getByText('AI타임스')).toBeInTheDocument();
    expect(within(dialog).getByRole('switch', { name: 'GeekNews (긱뉴스) 수집 켜기' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(within(dialog).getByRole('button', { name: 'GeekNews (긱뉴스) 삭제' })).toBeInTheDocument();
  });

  it('opens a ConfirmDialog on delete and sends no request when cancelled', async () => {
    const { dialog } = await openSourcesTab();
    fireEvent.click(within(dialog).getByRole('button', { name: 'GeekNews (긱뉴스) 삭제' }));

    const confirm = screen.getByRole('alertdialog', { name: '이 소스를 목록에서 삭제하시겠습니까?' });
    expect(within(confirm).getByRole('button', { name: '취소' })).toHaveFocus();
    fireEvent.click(within(confirm).getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '소스 & 리서처' })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 30));
    expect(deleteCalls).toEqual([]);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('Escape closes only the confirm dialog', async () => {
    const onClose = vi.fn();
    const { dialog } = await openSourcesTab(onClose);
    fireEvent.click(within(dialog).getByRole('button', { name: 'AI타임스 삭제' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(deleteCalls).toEqual([]);
  });

  it('deletes after confirming and shows the result in the live region', async () => {
    const { dialog } = await openSourcesTab();
    fireEvent.click(within(dialog).getByRole('button', { name: 'GeekNews (긱뉴스) 삭제' }));
    const confirm = screen.getByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deleteCalls).toEqual(['rss/geeknews']));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    const live = within(dialog).getByText('소스가 삭제되었습니다.').closest('[aria-live]');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('does not close on a backdrop click but closes on Escape and the footer button', async () => {
    const onClose = vi.fn();
    render(<SourcesModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });
    fireEvent.click(dialog.previousElementSibling as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeButtons = within(dialog).getAllByRole('button', { name: '닫기' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('SourcesModal add-feed form (R19, R24)', () => {
  it('points 새 피드 직접 등록 at the form only while the form is open', async () => {
    const { dialog } = await openSourcesTab();
    const addButton = within(dialog).getByRole('button', { name: '새 피드 직접 등록' });
    expect(addButton).toHaveAttribute('aria-expanded', 'false');
    expect(addButton).not.toHaveAttribute('aria-controls');

    fireEvent.click(addButton);
    expect(addButton).toHaveAttribute('aria-expanded', 'true');
    const controls = addButton.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(addButton).not.toHaveAttribute('aria-controls');
  });

  it('labels the category options with the long category labels and keeps the values', async () => {
    const { dialog } = await openSourcesTab();
    fireEvent.click(within(dialog).getByRole('button', { name: '새 피드 직접 등록' }));
    const select = within(dialog).getByRole('combobox', { name: '카테고리 분류' });
    const options = within(select).getAllByRole('option');
    expect(options.map((o) => [(o as HTMLOptionElement).value, o.textContent])).toEqual([
      ['harness', '하네스 & 벤치마크'],
      ['mcp_plugins_skills', 'MCP & 생태계'],
      ['agent_tech', '에이전트 아키텍처'],
      ['ai_news', '최신 AI 동향'],
    ]);
    expect(select).toHaveValue('ai_news');
  });
});

/** UI 5대 상태 공백 (리뷰 FE-30 남은 부분): 소스·딥 리서치 대화상자의 Error·Empty. */
describe('SourcesModal — Error·Empty (FE-30)', () => {
  it('Error: 불러오기가 실패하면 0건처럼 보이지 않고 오류와 다시 시도를 보이며, 다시 시도하면 목록을 그린다', async () => {
    let fail = true;
    server.use(
      http.get('*/api/sources', () =>
        fail
          ? HttpResponse.json({ error_code: 'INTERNAL_ERROR', message: '서버 오류', details: null }, { status: 500 })
          : HttpResponse.json(mockSourcesResponse)
      )
    );
    render(<SourcesModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('소스 정보를 불러오지 못했습니다');
    // 딥 리서치 탭이 빈 기록 안내를 보이지 않는다 (실패를 '없음' 으로 보이지 않는다).
    expect(within(dialog).queryByText(/아직 기록된 딥 리서치 이력이 없습니다/)).not.toBeInTheDocument();

    fail = false;
    fireEvent.click(within(alert).getByRole('button', { name: '다시 시도' }));
    fireEvent.click(within(dialog).getByRole('tab', { name: /등록된 수집원/ }));
    expect(await within(dialog).findByText('GeekNews (긱뉴스)')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Empty: 등록된 RSS 피드·GitHub 저장소가 없으면 빈 표 대신 안내를 보인다', async () => {
    server.use(
      http.get('*/api/sources', () =>
        HttpResponse.json({
          ...mockSourcesResponse,
          data: {
            ...mockSourcesResponse.data,
            rss_feeds: [],
            github_sources: { ...mockSourcesResponse.data.github_sources, monitored_repos: [] },
          },
        })
      )
    );
    render(<SourcesModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });
    fireEvent.click(within(dialog).getByRole('tab', { name: /등록된 수집원/ }));

    expect(await within(dialog).findByText('등록된 RSS 피드가 없습니다.')).toBeInTheDocument();
    expect(within(dialog).getByText('모니터링 중인 GitHub 저장소가 없습니다.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('table')).not.toBeInTheDocument();
  });

  it('Empty: 딥 리서치 이력이 없으면 빈 기록 안내를 보이고, 실행 시각이 없으면 가동됐다고 하지 않는다', async () => {
    render(<SourcesModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '소스 & 리서처' });

    expect(await within(dialog).findByText(/아직 기록된 딥 리서치 이력이 없습니다/)).toBeInTheDocument();
    expect(within(dialog).getByText('실행 기록 없음')).toBeInTheDocument();
    expect(within(dialog).queryByText('최근 가동됨')).not.toBeInTheDocument();
  });
});
