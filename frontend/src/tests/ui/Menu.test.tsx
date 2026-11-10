import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MoreHorizontal } from 'lucide-react';
import { MenuButton, type MenuItem } from '@/components/ui/Menu';
import { Popover } from '@/components/ui/Popover';
import { ThemeMenu } from '@/components/ui/ThemeMenu';
import { ThemeProvider } from '@/context/ThemeContext';
import { Dialog } from '@/components/ui/Dialog';

function makeItems(handlers: { sources: () => void; mcp: () => void; reset: () => void }): MenuItem[] {
  return [
    { type: 'group', label: '설정' },
    { type: 'item', label: '소스 & 리서처', onSelect: handlers.sources },
    { type: 'item', label: 'MCP 연동', onSelect: handlers.mcp },
    { type: 'item', label: '비활성 항목', onSelect: vi.fn(), disabled: true },
    { type: 'separator' },
    { type: 'item', label: '초기화 & 재수집…', tone: 'danger', onSelect: handlers.reset },
  ];
}

function setup() {
  const handlers = { sources: vi.fn(), mcp: vi.fn(), reset: vi.fn() };
  render(<MenuButton label="더보기" icon={<MoreHorizontal />} items={makeItems(handlers)} align="end" />);
  const trigger = screen.getByRole('button', { name: '더보기' });
  return { handlers, trigger };
}

describe('MenuButton', () => {
  it('exposes aria-haspopup / aria-expanded / aria-controls on the trigger', () => {
    const { trigger } = setup();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: '더보기' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
  });

  it('focuses the first item when opened and moves with arrows, Home and End (skipping disabled)', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');
    const sources = within(menu).getByRole('menuitem', { name: '소스 & 리서처' });
    const mcp = within(menu).getByRole('menuitem', { name: 'MCP 연동' });
    const reset = within(menu).getByRole('menuitem', { name: '초기화 & 재수집…' });
    expect(sources).toHaveFocus();

    fireEvent.keyDown(sources, { key: 'ArrowDown' });
    expect(mcp).toHaveFocus();
    fireEvent.keyDown(mcp, { key: 'ArrowDown' });
    expect(reset).toHaveFocus();
    fireEvent.keyDown(reset, { key: 'ArrowDown' });
    expect(sources).toHaveFocus();
    fireEvent.keyDown(sources, { key: 'ArrowUp' });
    expect(reset).toHaveFocus();
    fireEvent.keyDown(reset, { key: 'Home' });
    expect(sources).toHaveFocus();
    fireEvent.keyDown(sources, { key: 'End' });
    expect(reset).toHaveFocus();
  });

  it('runs the item on Enter, closes and returns focus to the trigger', () => {
    const { trigger, handlers } = setup();
    fireEvent.click(trigger);
    const mcp = screen.getByRole('menuitem', { name: 'MCP 연동' });
    mcp.focus();
    fireEvent.keyDown(mcp, { key: 'Enter' });
    expect(handlers.mcp).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and focuses the trigger', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on an outside pointerdown and on Tab', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menuitem', { name: '소스 & 리서처' }), { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens with ArrowUp on the trigger focusing the last item', () => {
    const { trigger } = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: '초기화 & 재수집…' })).toHaveFocus();
  });

  it('Escape inside a dialog closes only the menu', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="설정">
        <MenuButton label="옵션" items={[{ type: 'item', label: '하나', onSelect: vi.fn() }]} />
      </Dialog>
    );
    fireEvent.click(screen.getByRole('button', { name: '옵션' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ThemeMenu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders three menuitemradio entries with aria-checked and switches theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeMenu />
      </ThemeProvider>
    );
    const trigger = screen.getByRole('button', { name: '테마 선택' });
    fireEvent.click(trigger);

    const radios = screen.getAllByRole('menuitemradio');
    expect(radios.map((r) => r.textContent)).toEqual(['라이트', '다크', '시스템']);
    expect(screen.getByRole('menuitemradio', { name: '라이트' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: '다크' })).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByRole('menuitemradio', { name: '다크' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitemradio', { name: '다크' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Popover', () => {
  function PopoverHarness({ onClose }: { onClose?: () => void }) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <div className="relative">
        <button ref={anchorRef} type="button" onClick={() => setOpen((v) => !v)}>
          모델
        </button>
        <Popover
          open={open}
          onClose={() => {
            onClose?.();
            setOpen(false);
          }}
          anchorRef={anchorRef}
          label="모델 선택"
          focusOnOpen
        >
          <button type="button">빠름</button>
        </Popover>
        <button type="button">바깥</button>
      </div>
    );
  }

  it('renders next to the anchor (no portal), focuses inside, closes on Escape back to the anchor', () => {
    const { container } = render(<PopoverHarness />);
    const anchor = screen.getByRole('button', { name: '모델' });
    fireEvent.click(anchor);
    const popover = screen.getByRole('dialog', { name: '모델 선택' });
    expect(container.contains(popover)).toBe(true);
    expect(popover).not.toHaveAttribute('aria-modal');
    expect(popover.className).toContain('top-full');
    expect(screen.getByRole('button', { name: '빠름' })).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(anchor).toHaveFocus();
  });

  it('closes on an outside pointerdown but not on the anchor or inside', () => {
    const onClose = vi.fn();
    render(<PopoverHarness onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '모델' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '빠름' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '모델' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByRole('button', { name: '바깥' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
