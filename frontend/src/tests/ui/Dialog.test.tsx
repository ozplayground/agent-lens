import { describe, it, expect, vi, afterEach } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { overlayStack, useOverlayOpen } from '@/lib/overlay-stack';

afterEach(() => {
  document.getElementById('app-shell')?.remove();
  document.body.style.overflow = '';
});

function renderInAppShell(ui: React.ReactElement) {
  const shell = document.createElement('div');
  shell.id = 'app-shell';
  document.body.appendChild(shell);
  return { shell, ...render(ui, { container: shell }) };
}

function Harness({
  initialOpen = false,
  withInitialFocus = false,
  dismissOnScrim,
}: {
  initialOpen?: boolean;
  withInitialFocus?: boolean;
  dismissOnScrim?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="뉴스 상세"
        description="기사 요약"
        initialFocusRef={withInitialFocus ? nameRef : undefined}
        dismissOnScrim={dismissOnScrim}
        backdropTestId="dialog-backdrop"
        footer={<button type="button">저장</button>}
      >
        <button type="button">첫 버튼</button>
        <input aria-label="이름" ref={nameRef} />
      </Dialog>
    </>
  );
}

function Nested() {
  const [outer, setOuter] = useState(true);
  const [inner, setInner] = useState(false);
  return (
    <Dialog open={outer} onClose={() => setOuter(false)} title="바깥">
      <button type="button" onClick={() => setInner(true)}>
        확인 열기
      </button>
      <ConfirmDialog
        open={inner}
        title="정말 초기화할까요?"
        description="되돌릴 수 없습니다."
        confirmLabel="초기화"
        tone="danger"
        onConfirm={() => setInner(false)}
        onCancel={() => setInner(false)}
      />
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders role, aria-modal and links the title and description', () => {
    render(<Harness initialOpen />);
    const dialog = screen.getByRole('dialog', { name: '뉴스 상세' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const heading = within(dialog).getByRole('heading', { level: 2, name: '뉴스 상세' });
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
    expect(dialog).toHaveAccessibleDescription('기사 요약');
    // 포털: 대화상자는 body 바로 아래 컨테이너에 그린다.
    expect(dialog.closest('[id="app-shell"]')).toBeNull();
  });

  it('focuses the first focusable element of the body, or initialFocusRef', () => {
    const { unmount } = render(<Harness initialOpen />);
    expect(screen.getByRole('button', { name: '첫 버튼' })).toHaveFocus();
    unmount();

    render(<Harness initialOpen withInitialFocus />);
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveFocus();
  });

  it('cycles Tab and Shift+Tab inside the dialog', () => {
    render(<Harness initialOpen />);
    const dialog = screen.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: '닫기' });
    const save = within(dialog).getByRole('button', { name: '저장' });

    save.focus();
    fireEvent.keyDown(save, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();
  });

  it('returns focus to the opener when closed', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: '열기' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes on the close button and on the backdrop by default', () => {
    render(<Harness initialOpen />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close on the backdrop when dismissOnScrim is false', () => {
    render(<Harness initialOpen dismissOnScrim={false} />);
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets inert on #app-shell and locks body scroll while open, and releases both on close', () => {
    const { shell } = renderInAppShell(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(shell).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(shell).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
    expect(overlayStack.getLayers()).toHaveLength(0);
  });

  it('leaves the stack when unmounted while open', () => {
    function Probe() {
      return <span data-testid="probe">{useOverlayOpen() ? 'open' : 'closed'}</span>;
    }
    const { unmount } = render(<Harness initialOpen />);
    unmount();
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('closed');
    expect(overlayStack.getLayers()).toHaveLength(0);
  });

  it('closes only the top dialog with one Escape when two are stacked', () => {
    render(<Nested />);
    fireEvent.click(screen.getByRole('button', { name: '확인 열기' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    // 아래 대화상자는 맨 위가 아니므로 inert
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('inert');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    const outer = screen.getByRole('dialog', { name: '바깥' });
    expect(outer).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: '확인 열기' })).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports ariaLabel, header + labelledBy, closeLabel and panelProps', () => {
    const onTouchStart = vi.fn();
    const { unmount } = render(
      <Dialog open onClose={() => {}} ariaLabel="커맨드 팔레트" placement="top">
        <input aria-label="검색" />
      </Dialog>
    );
    const palette = screen.getByRole('dialog', { name: '커맨드 팔레트' });
    expect(within(palette).queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    unmount();

    render(
      <Dialog
        open
        onClose={() => {}}
        header={<h2 id="custom-title">대화 기록</h2>}
        labelledBy="custom-title"
        closeLabel="대화 기록 드로어 닫기"
        panelProps={{ onTouchStart }}
      >
        본문
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: '대화 기록' });
    expect(within(dialog).getAllByText('대화 기록')).toHaveLength(1);
    fireEvent.touchStart(dialog, { touches: [{ clientY: 10 }] });
    expect(onTouchStart).toHaveBeenCalledTimes(1);
  });

  it('closes a sheet on a 100px swipe down', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="필터" mobile="sheet" closeLabel="필터 닫기">
        본문
      </Dialog>
    );
    const sheet = screen.getByRole('dialog', { name: '필터' });
    expect(screen.getByRole('button', { name: '필터 닫기' })).toBeInTheDocument();

    fireEvent.touchStart(sheet, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 260 }] });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.touchStart(sheet, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 320 }] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Drawer', () => {
  it('is a modal dialog with the given close label and backdrop test id', () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="대화 기록" closeLabel="대화 기록 드로어 닫기" backdropTestId="drawer-backdrop">
        목록
      </Drawer>
    );
    expect(screen.getByRole('dialog', { name: '대화 기록' })).toHaveAttribute('aria-modal', 'true');
    fireEvent.click(screen.getByRole('button', { name: '대화 기록 드로어 닫기' }));
    fireEvent.click(screen.getByTestId('drawer-backdrop'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('ConfirmDialog', () => {
  const baseProps = {
    open: true,
    title: '소스를 삭제할까요?',
    description: '이 소스의 기사도 함께 지워집니다.',
    confirmLabel: '삭제',
    tone: 'danger' as const,
  };

  it('is an alertdialog that focuses cancel first', () => {
    render(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByRole('alertdialog', { name: '소스를 삭제할까요?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('이 소스의 기사도 함께 지워집니다.');
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('calls onConfirm / onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('ignores Escape and the backdrop while busy and disables both buttons', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} busy onConfirm={vi.fn()} onCancel={onCancel} />);
    const dialog = screen.getByRole('alertdialog');
    fireEvent.keyDown(window, { key: 'Escape' });
    const backdrop = dialog.previousElementSibling as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('button', { name: '취소' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: '삭제' })).toBeDisabled();
  });

  it('shows the error inside the dialog', () => {
    render(<ConfirmDialog {...baseProps} error="삭제에 실패했습니다." onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('삭제에 실패했습니다.');
  });
});
