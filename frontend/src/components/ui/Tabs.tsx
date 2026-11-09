'use client';

import { useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScrollRow } from './ScrollRow';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  /** 탭 글자 뒤의 작은 표시 (건수 등). */
  badge?: ReactNode;
  disabled?: boolean;
}

/** 탭·패널 요소 id. `Tabs` 와 `TabPanel` 에 같은 `idPrefix` 를 준다. */
export function tabElementId(idPrefix: string, id: string): string {
  return `${idPrefix}-tab-${id}`;
}

export function tabPanelElementId(idPrefix: string, id: string): string {
  return `${idPrefix}-panel-${id}`;
}

/** `ScrollRow` 가 처음 그릴 때와 선택이 바뀔 때 보이게 미는 선택된 탭. */
const SELECTED_TAB_SELECTOR = '[role="tab"][aria-selected="true"]';

export interface TabsProps<T extends string> {
  /** 탭 목록의 접근 이름. */
  label: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** 한 화면에 탭 묶음이 여럿이면 서로 다르게 준다 (기본 `tabs`). */
  idPrefix?: string;
  /**
   * 선택되지 않았어도 패널이 DOM 에 있는 탭 id (`TabPanel active={false}` 로 숨겨 두는 경우).
   * `aria-controls` 는 선택된 탭과 이 목록의 탭에만 단다 (기본: 선택된 탭만).
   */
  mountedPanels?: readonly T[];
  /** 탭 줄 바깥 감싸개(아래 테두리를 그리는 요소)에 붙는다. */
  className?: string;
}

/**
 * WAI-ARIA 탭 (자동 활성화). ←/→ 순환, Home·End, 로빙 `tabIndex`.
 * 패널은 `TabPanel` 로 그리고 같은 `idPrefix` 를 준다.
 * `aria-controls` 는 패널이 그 순간 DOM 에 있는 탭에만 단다 (선택된 탭 + `mountedPanels`).
 * 탭 줄은 `ScrollRow` 다: 넘치면 `data-overflow`·넘친 쪽 흐림, 768 이상은 스크롤 버튼, 768 미만은
 * 넘침 표시(`data-overflow-hint`)를 tablist 밖에 둔다. 포커스 받은 탭과 선택된 탭(처음 그릴 때·바뀔 때)을
 * 보이게 줄을 미는 것도 `ScrollRow` 가 한다 (`selectedSelector`).
 */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  idPrefix = 'tabs',
  mountedPanels,
  className,
}: TabsProps<T>) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  const activate = (id: T) => {
    onChange(id);
    tabRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (enabledTabs.length === 0) return;
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === value);
    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % enabledTabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex < 0 ? enabledTabs.length - 1 : (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    activate(enabledTabs[nextIndex].id);
  };

  // 선택된 탭이 목록에 없거나 비활성이면 첫 활성 탭이 Tab 순서를 받는다.
  const focusableId = enabledTabs.some((tab) => tab.id === value) ? value : enabledTabs[0]?.id;

  return (
    <ScrollRow
      label={label}
      selectedSelector={SELECTED_TAB_SELECTOR}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn('border-b border-border', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        const panelMounted = selected || (mountedPanels?.includes(tab.id) ?? false);
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node);
              else tabRefs.current.delete(tab.id);
            }}
            id={tabElementId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelMounted ? tabPanelElementId(idPrefix, tab.id) : undefined}
            tabIndex={tab.id === focusableId ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50 md:h-10',
              selected ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null ? (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums',
                  selected ? 'bg-accent-soft text-accent-soft-fg' : 'bg-surface-muted text-fg-muted'
                )}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </ScrollRow>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 이 패널을 여는 탭의 id. */
  id: string;
  idPrefix?: string;
  /** false 면 `hidden` 으로 숨긴다 (기본 true — 선택된 패널만 그리는 경우). */
  active?: boolean;
}

/** 탭 패널. `role="tabpanel"`, `aria-labelledby` 로 탭과 연결한다. */
export function TabPanel({ id, idPrefix = 'tabs', active = true, className, children, ...rest }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={tabPanelElementId(idPrefix, id)}
      aria-labelledby={tabElementId(idPrefix, id)}
      hidden={!active}
      tabIndex={0}
      className={cn('min-w-0 focus-visible:outline-offset-[-2px]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Tabs;
