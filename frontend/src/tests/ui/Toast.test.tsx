import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook, within } from '@testing-library/react';
import { ToastRegion, useToast, showToast, clearToasts } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';

afterEach(() => {
  act(() => clearToasts());
  vi.useRealTimers();
});

describe('Toast', () => {
  it('shows a status toast and an alert toast for errors', () => {
    render(<ToastRegion />);
    act(() => {
      showToast({ message: '저장했습니다.', tone: 'success' });
      showToast({ message: '세션을 찾을 수 없습니다.', tone: 'danger' });
    });
    expect(screen.getByRole('status')).toHaveTextContent('저장했습니다.');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('alert')).toHaveTextContent('세션을 찾을 수 없습니다.');
  });

  it('renders only once when ToastRegion is mounted twice', () => {
    render(
      <>
        <ToastRegion />
        <ToastRegion />
      </>
    );
    act(() => {
      showToast({ message: '한 번만 보여야 합니다.' });
    });
    expect(screen.getAllByText('한 번만 보여야 합니다.')).toHaveLength(1);
  });

  it('keeps rendering through the second region when the first unmounts', () => {
    const first = render(<ToastRegion />);
    render(<ToastRegion />);
    first.unmount();
    act(() => {
      showToast({ message: '남은 영역' });
    });
    expect(screen.getAllByText('남은 영역')).toHaveLength(1);
  });

  it('dismisses with the close button and after the duration', () => {
    vi.useFakeTimers();
    render(<ToastRegion />);
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.show({ message: '첫 알림' });
    });
    fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(screen.queryByText('첫 알림')).not.toBeInTheDocument();

    act(() => {
      result.current.show({ message: '자동으로 닫힘', duration: 3500 });
    });
    expect(screen.getByText('자동으로 닫힘')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.queryByText('자동으로 닫힘')).not.toBeInTheDocument();
  });
});

// 챗 입력 영역 위 알림 영역 (spec 14.7 C-2, R23).
describe('ToastRegion placement', () => {
  it('모달이 없으면 composer 영역에 그린다', () => {
    const { container } = render(
      <>
        <ToastRegion />
        <div className="relative">
          <ToastRegion placement="composer" />
        </div>
      </>
    );
    act(() => {
      showToast({ message: '입력창 위 경고', tone: 'warning' });
    });
    const composer = container.querySelector('[data-toast-region="composer"]');
    expect(composer).not.toBeNull();
    expect(composer).toHaveTextContent('입력창 위 경고');
    expect(screen.getAllByText('입력창 위 경고')).toHaveLength(1);
    expect(document.querySelector('[data-toast-region="global"]')).toBeNull();
    // 알림 접근성 속성은 그대로다.
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: '알림 닫기' })).toBeInTheDocument();
  });

  it('모달 대화상자가 열려 있으면 global 영역에 그린다', () => {
    render(
      <>
        <ToastRegion />
        <div className="relative">
          <ToastRegion placement="composer" />
        </div>
        <Dialog open onClose={() => {}} title="설정">
          <p>본문</p>
        </Dialog>
      </>
    );
    act(() => {
      showToast({ message: '모달 위 알림' });
    });
    const global = document.querySelector('[data-toast-region="global"]');
    expect(global).not.toBeNull();
    expect(global).toHaveTextContent('모달 위 알림');
    expect(document.querySelector('[data-toast-region="composer"]')).toBeNull();
    expect(screen.getAllByText('모달 위 알림')).toHaveLength(1);
  });

  it('composer 영역이 사라지면 global 영역으로 돌아간다', () => {
    const view = render(<ToastRegion />);
    const composer = render(<ToastRegion placement="composer" />);
    act(() => {
      showToast({ message: '영역 이동' });
    });
    expect(document.querySelector('[data-toast-region="composer"]')).toHaveTextContent('영역 이동');
    composer.unmount();
    expect(document.querySelector('[data-toast-region="global"]')).toHaveTextContent('영역 이동');
    view.unmount();
  });
});

// 영역이 바뀌어도 이미 알린 알림은 다시 알리지 않는다 (spec 14.7 C-2 리뷰 후속, R23).
describe('ToastRegion 한 번만 알리기', () => {
  function Regions({ modalOpen }: { modalOpen: boolean }) {
    return (
      <>
        <ToastRegion />
        <div className="relative">
          <ToastRegion placement="composer" />
        </div>
        <Dialog open={modalOpen} onClose={() => {}} title="설정">
          <p>본문</p>
        </Dialog>
      </>
    );
  }

  it('composer 에서 알린 알림은 global 로 옮겨져도 live 속성이 없고, 새 알림은 global 에서 알린다', () => {
    const view = render(<Regions modalOpen={false} />);
    act(() => {
      showToast({ message: '세션을 찾을 수 없습니다.', tone: 'danger', duration: 0 });
    });
    const composer = document.querySelector('[data-toast-region="composer"]') as HTMLElement;
    expect(composer).not.toBeNull();
    expect(within(composer).getByRole('alert')).toHaveTextContent('세션을 찾을 수 없습니다.');

    // 모달을 열면 알림이 global 영역으로 옮겨진다.
    view.rerender(<Regions modalOpen />);
    const global = document.querySelector('[data-toast-region="global"]') as HTMLElement;
    expect(global).not.toBeNull();
    expect(document.querySelector('[data-toast-region="composer"]')).toBeNull();
    const moved = within(global).getByText('세션을 찾을 수 없습니다.').parentElement as HTMLElement;
    expect(moved).not.toHaveAttribute('role');
    expect(moved).not.toHaveAttribute('aria-live');
    expect(within(global).queryAllByRole('alert')).toHaveLength(0);
    // 글자·닫기 버튼은 그대로다.
    expect(within(moved).getByRole('button', { name: '알림 닫기' })).toBeInTheDocument();

    // 그 상태에서 새로 뜬 알림은 global 영역에서 알린다.
    act(() => {
      showToast({ message: '모달 위 새 알림', duration: 0 });
    });
    const fresh = within(global).getByRole('status');
    expect(fresh).toHaveTextContent('모달 위 새 알림');
    expect(fresh).toHaveAttribute('aria-live', 'polite');
  });

  it('영역이 하나일 때는 지금처럼 role·aria-live 를 갖는다 (회귀 방지)', () => {
    render(<ToastRegion />);
    act(() => {
      showToast({ message: '저장했습니다.', tone: 'success' });
      showToast({ message: '실패했습니다.', tone: 'danger' });
    });
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('저장했습니다.');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByRole('alert')).toHaveTextContent('실패했습니다.');
  });
});

// 보정 2: 다른 영역으로 한 번 넘어간 알림은 처음 영역으로 돌아와도 다시 알리지 않는다 (spec 14.7 C-2, R23).
describe('ToastRegion 한 번만 알리기 — 왕복', () => {
  function RoundTripRegions({ modalOpen }: { modalOpen: boolean }) {
    return (
      <>
        <ToastRegion />
        <div className="relative">
          <ToastRegion placement="composer" />
        </div>
        <Dialog open={modalOpen} onClose={() => {}} title="설정">
          <p>본문</p>
        </Dialog>
      </>
    );
  }

  it('composer → global → composer 왕복 뒤 같은 알림에 role·aria-live 가 없다', () => {
    const view = render(<RoundTripRegions modalOpen={false} />);
    act(() => {
      showToast({ message: '응답이 늦습니다.', tone: 'danger', duration: 0 });
    });
    const first = document.querySelector('[data-toast-region="composer"]') as HTMLElement;
    expect(within(first).getByRole('alert')).toHaveTextContent('응답이 늦습니다.');

    // 모달을 열어 global 로 넘어간다.
    view.rerender(<RoundTripRegions modalOpen />);
    const global = document.querySelector('[data-toast-region="global"]') as HTMLElement;
    expect(global).toHaveTextContent('응답이 늦습니다.');

    // 모달을 닫아 composer 로 돌아온다.
    view.rerender(<RoundTripRegions modalOpen={false} />);
    const back = document.querySelector('[data-toast-region="composer"]') as HTMLElement;
    expect(back).not.toBeNull();
    expect(document.querySelector('[data-toast-region="global"]')).toBeNull();
    const returned = within(back).getByText('응답이 늦습니다.').parentElement as HTMLElement;
    expect(returned).not.toHaveAttribute('role');
    expect(returned).not.toHaveAttribute('aria-live');
    expect(within(back).queryAllByRole('alert')).toHaveLength(0);
    expect(within(returned).getByRole('button', { name: '알림 닫기' })).toBeInTheDocument();

    // 돌아온 뒤 새로 뜬 알림은 composer 에서 알린다.
    act(() => {
      showToast({ message: '다시 연결했습니다.', duration: 0 });
    });
    const fresh = within(back).getByRole('status');
    expect(fresh).toHaveTextContent('다시 연결했습니다.');
    expect(fresh).toHaveAttribute('aria-live', 'polite');
  });
});

