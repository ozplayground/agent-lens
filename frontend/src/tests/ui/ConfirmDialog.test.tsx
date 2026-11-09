import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';

const baseProps: ConfirmDialogProps = {
  open: true,
  title: '수집 데이터 전체 삭제 및 재수집',
  description: '모든 소식이 지워집니다.',
  confirmLabel: '전체 삭제 후 다시 수집',
  tone: 'danger',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

/** 확인 버튼을 누른 상태(포커스)에서 busy 로 바뀌는 흐름. */
function startBusy() {
  const view = render(<ConfirmDialog {...baseProps} />);
  const dialog = screen.getByRole('alertdialog');
  const confirm = within(dialog).getByRole('button', { name: '전체 삭제 후 다시 수집' });
  confirm.focus();
  expect(confirm).toHaveFocus();
  view.rerender(<ConfirmDialog {...baseProps} busy />);
  return { ...view, dialog };
}

describe('ConfirmDialog focus while busy', () => {
  it('keeps focus on the dialog container while busy (buttons are disabled)', () => {
    const { dialog } = startBusy();
    expect(within(dialog).getByRole('button', { name: '전체 삭제 후 다시 수집' })).toBeDisabled();
    expect(document.activeElement).toBe(dialog);
  });

  it('moves focus to the error message when busy ends with an error', () => {
    const { dialog, rerender } = startBusy();
    rerender(<ConfirmDialog {...baseProps} busy={false} error="초기화 실패" />);
    const alert = within(dialog).getByRole('alert');
    expect(alert).toHaveTextContent('초기화 실패');
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(alert.closest('[tabindex="-1"]:not([role="alertdialog"])'));
    expect(document.activeElement).toContainElement(alert);
  });

  it('moves focus to the confirm button when busy ends without an error', () => {
    const { dialog, rerender } = startBusy();
    rerender(<ConfirmDialog {...baseProps} busy={false} />);
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: '전체 삭제 후 다시 수집' }));
  });

  it('still focuses cancel first when opened (not busy)', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' })).toHaveFocus();
  });
});

describe('focus trap fallback', () => {
  it('returns focus to the dialog when the focused element loses focus to the body', async () => {
    render(
      <Dialog open onClose={vi.fn()} title="스케줄">
        <button type="button">즉시 수집</button>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: '스케줄' });
    const button = within(dialog).getByRole('button', { name: '즉시 수집' });
    button.focus();
    expect(button).toHaveFocus();

    // 진행 중 비활성 등으로 포커스가 사라진 상황 (다른 요소로 옮겨 가지 않음)
    button.blur();
    expect(document.activeElement).toBe(document.body);
    await waitFor(() => expect(document.activeElement).toBe(dialog));
  });
});
