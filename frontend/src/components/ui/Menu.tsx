'use client';

import { useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useOverlayLayer } from '@/lib/overlay-stack';
import { useOutsidePointerDown } from './Popover';
import { buttonClasses, type ButtonVariant } from './Button';
import { IconButton } from './IconButton';

export type MenuItem =
  | {
      type: 'item';
      label: string;
      icon?: ReactNode;
      onSelect?: () => void;
      tone?: 'danger';
      href?: string;
      external?: boolean;
      disabled?: boolean;
    }
  | { type: 'radio'; label: string; checked: boolean; onSelect: () => void; disabled?: boolean }
  | { type: 'separator' }
  | { type: 'group'; label: string };

export interface MenuButtonProps {
  /** 트리거 접근 이름. `icon` 이 있으면 아이콘 버튼(`aria-label`), 없으면 보이는 글자. */
  label: string;
  icon?: ReactNode;
  items: MenuItem[];
  /** 메뉴를 트리거 오른쪽 끝에 맞춘다. */
  align?: 'start' | 'end';
  /** 트리거 모양. 기본 `ghost`(아이콘) / `secondary`(글자). */
  variant?: ButtonVariant;
  /** 트리거에 덧붙일 클래스. */
  className?: string;
  /** 메뉴 목록에 덧붙일 클래스. */
  menuClassName?: string;
}

const ITEM_CLASSES =
  'flex w-full items-center gap-2 rounded-lg px-3 h-11 md:h-9 text-left text-sm text-fg outline-none transition-colors duration-150 ease-standard hover:bg-surface-muted focus-visible:bg-surface-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

function getMenuItems(menu: HTMLElement | null): HTMLElement[] {
  if (!menu) return [];
  return Array.from(
    menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')
  ).filter((el) => el.getAttribute('aria-disabled') !== 'true');
}

/**
 * WAI-ARIA 메뉴 버튼.
 * - 트리거: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`. 클릭으로 열고 닫는다. ↓/↑ 로 열면 첫/끝 항목.
 * - 열면 첫 항목에 포커스, ↑↓ 순환, Home·End, Enter·Space 실행, Escape 닫고 트리거로 포커스, Tab 은 닫기,
 *   바깥 pointerdown 닫기. 오버레이 스택에 `popover` 로 올린다.
 */
export function MenuButton({
  label,
  icon,
  items,
  align = 'start',
  variant,
  className,
  menuClassName,
}: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const focusItem = (which: 'first' | 'last') => {
    const list = getMenuItems(menuRef.current);
    const target = which === 'first' ? list[0] : list[list.length - 1];
    target?.focus();
  };

  // 열린 직후 포커스: 메뉴 요소가 붙을 때 ref 콜백에서 한 번만 한다 (다시 렌더돼도 포커스를 옮기지 않는다).
  const pendingFocus = useRef<'first' | 'last' | null>(null);
  const setMenuRef = (el: HTMLDivElement | null) => {
    menuRef.current = el;
    if (el && pendingFocus.current) {
      const list = getMenuItems(el);
      const target = pendingFocus.current === 'first' ? list[0] : list[list.length - 1];
      pendingFocus.current = null;
      (target ?? el).focus();
    }
  };

  const openMenu = (which: 'first' | 'last' = 'first') => {
    pendingFocus.current = which;
    setOpen(true);
  };

  const closeMenu = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useOverlayLayer({ open, kind: 'popover', onEscape: () => closeMenu(true) });
  useOutsidePointerDown([menuRef, triggerRef], open, () => closeMenu(false));

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (open) focusItem('first');
      else openMenu('first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) focusItem('last');
      else openMenu('last');
    }
  };

  const handleMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = getMenuItems(menuRef.current);
    if (list.length === 0) return;
    const index = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        list[(index + 1 + list.length) % list.length].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        list[(index - 1 + list.length) % list.length].focus();
        break;
      case 'Home':
        e.preventDefault();
        list[0].focus();
        break;
      case 'End':
        e.preventDefault();
        list[list.length - 1].focus();
        break;
      case 'Tab':
        closeMenu(false);
        break;
      case 'Enter':
      case ' ':
        if (index >= 0) {
          e.preventDefault();
          list[index].click();
        }
        break;
      default:
        break;
    }
  };

  const select = (onSelect?: () => void) => {
    closeMenu(true);
    onSelect?.();
  };

  const triggerProps = {
    ref: triggerRef,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: () => (open ? closeMenu(false) : openMenu('first')),
    onKeyDown: handleTriggerKeyDown,
  };

  return (
    <div className="relative inline-flex">
      {icon ? (
        <IconButton {...triggerProps} label={label} icon={icon} variant={variant ?? 'ghost'} className={className} />
      ) : (
        <button type="button" {...triggerProps} className={buttonClasses(variant ?? 'secondary', 'md', className)}>
          {label}
        </button>
      )}
      {open ? (
        <div
          ref={setMenuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute top-full z-40 mt-2 w-[min(280px,calc(100vw-32px))] max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-1 shadow-overlay outline-none motion-safe:animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {items.map((item, i) => {
            if (item.type === 'separator') {
              return <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-border" />;
            }
            if (item.type === 'group') {
              return (
                <div key={`group-${i}`} role="presentation" className="px-3 pt-2 pb-1 text-xs font-medium text-fg-subtle">
                  {item.label}
                </div>
              );
            }
            if (item.type === 'radio') {
              return (
                <button
                  key={`radio-${i}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={item.checked}
                  aria-disabled={item.disabled ? true : undefined}
                  tabIndex={-1}
                  onClick={item.disabled ? undefined : () => select(item.onSelect)}
                  className={ITEM_CLASSES}
                >
                  <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center text-accent">
                    {item.checked ? <Check className="size-4" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>
              );
            }
            const content = (
              <>
                {item.icon ? (
                  <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                    {item.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </>
            );
            const classes = cn(ITEM_CLASSES, item.tone === 'danger' ? 'text-danger' : null);
            if (item.href && !item.disabled) {
              return (
                <a
                  key={`item-${i}`}
                  role="menuitem"
                  tabIndex={-1}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  onClick={() => select(item.onSelect)}
                  className={classes}
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={`item-${i}`}
                type="button"
                role="menuitem"
                aria-disabled={item.disabled ? true : undefined}
                tabIndex={-1}
                onClick={item.disabled ? undefined : () => select(item.onSelect)}
                className={classes}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** `MenuButton` 의 다른 이름. */
export const Menu = MenuButton;

export default MenuButton;
