'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Clock, Cpu, Globe, Laptop, Moon, RefreshCw, Rss, Search, Send, Sun, Trash2, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { cn } from '@/lib/cn';

/** 팔레트 명령 하나. `perform` 뒤에 팔레트가 스스로 닫힌다 (`onClose`). */
export interface PaletteCommand {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  perform: () => void;
  /** 오른쪽에 보이는 단축키 표시 */
  shortcut?: string;
  /** true 면 보이지만 실행되지 않는다 (`aria-disabled`). */
  disabled?: boolean;
}

/** 이전 이름. */
export interface CommandActionItem extends PaletteCommand {
  category?: 'navigation' | 'theme' | 'data' | 'system';
}

export interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSources?: () => void;
  onOpenMcp?: () => void;
  onTriggerCollect?: () => void;
  /** 있으면 `수집 스케줄 보기` 명령을 더한다. */
  onOpenSchedule?: () => void;
  /** 있으면 `공유 & 알림 설정 열기` 명령을 더한다. */
  onOpenSettings?: () => void;
  /** 있으면 `RSS 피드 열기` 명령을 더한다 (새 탭). */
  rssUrl?: string;
  /** 있으면 `수집 데이터 초기화 & 재수집` 명령을 더한다 (확인 창을 연다). */
  onRequestReset?: () => void;
  /** true 면 초기화 명령을 비활성으로 둔다 (수집 중). */
  resetDisabled?: boolean;
  /** 주면 명령 목록을 통째로 바꾼다 (챗 화면). */
  commands?: PaletteCommand[];
}

/**
 * 커맨드 팔레트. `Dialog placement="top"` + combobox/listbox 패턴.
 * Escape 는 오버레이 스택이, ⌘K 는 화면의 헤더가 처리한다 (자체 window 리스너 없음).
 * 닫히면 내용이 언마운트되어 검색어·선택이 초기화된다.
 */
export default function CommandPalette(props: CommandPaletteProps) {
  if (!props.isOpen) return null;
  return <PaletteDialog {...props} />;
}

function PaletteDialog({
  onClose,
  onOpenSources,
  onOpenMcp,
  onTriggerCollect,
  onOpenSchedule,
  onOpenSettings,
  rssUrl,
  onRequestReset,
  resetDisabled = false,
  commands,
}: CommandPaletteProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const defaultCommands = useMemo<PaletteCommand[]>(() => {
    const list: PaletteCommand[] = [
      {
        id: 'chat',
        title: 'AI 챗 워크스페이스 이동',
        subtitle: '기술 소식 기반 심층 질의응답 및 에이전틱 리서치',
        icon: <Bot />,
        perform: () => router.push('/chat'),
      },
      {
        id: 'theme',
        title:
          theme === 'system'
            ? '라이트 모드로 전환 (현재 시스템)'
            : theme === 'dark'
              ? '시스템 모드로 전환'
              : '다크 모드로 전환',
        subtitle: '시스템 및 개인 선호 테마 순환 토글 (Light -> Dark -> System)',
        icon: theme === 'dark' ? <Moon /> : theme === 'system' ? <Laptop /> : <Sun />,
        perform: () => toggleTheme(),
        shortcut: 'T',
      },
      {
        id: 'sources',
        title: '소스 관리 & AI 리서처 열기',
        subtitle: 'RSS 피드 및 GitHub 소스 등록, 자율 소스 탐색',
        icon: <Globe />,
        perform: () => onOpenSources?.(),
      },
      {
        id: 'mcp',
        title: 'FastMCP 도구 설정 열기',
        subtitle: 'Claude Desktop 및 에이전트 연동 가이드',
        icon: <Cpu />,
        perform: () => onOpenMcp?.(),
      },
      {
        id: 'collect',
        title: '최신 소식 즉시 수집 트리거',
        subtitle: '등록된 모든 소스에서 즉시 신규 기술 소식 크롤링',
        icon: <RefreshCw />,
        perform: () => onTriggerCollect?.(),
      },
    ];
    if (onOpenSchedule) {
      list.push({
        id: 'schedule',
        title: '수집 스케줄 보기',
        subtitle: '자동 수집 주기와 다음 예정 시각',
        icon: <Clock />,
        perform: onOpenSchedule,
      });
    }
    if (onOpenSettings) {
      list.push({
        id: 'settings',
        title: '공유 & 알림 설정 열기',
        subtitle: 'Notion · 이메일 · 웹훅 브리핑 연동',
        icon: <Send />,
        perform: onOpenSettings,
      });
    }
    if (rssUrl) {
      list.push({
        id: 'rss',
        title: 'RSS 피드 열기',
        subtitle: '새 탭에서 RSS 피드 주소를 엽니다',
        icon: <Rss />,
        perform: () => {
          window.open(rssUrl, '_blank', 'noopener,noreferrer');
        },
      });
    }
    if (onRequestReset) {
      list.push({
        id: 'reset',
        title: '수집 데이터 초기화 & 재수집',
        subtitle: resetDisabled
          ? '수집 중에는 초기화할 수 없습니다'
          : '저장된 소식을 모두 지우고 처음부터 다시 수집 (확인 후 실행)',
        icon: <Trash2 />,
        perform: onRequestReset,
        disabled: resetDisabled,
      });
    }
    return list;
  }, [router, theme, toggleTheme, onOpenSources, onOpenMcp, onTriggerCollect, onOpenSchedule, onOpenSettings, rssUrl, onRequestReset, resetDisabled]);

  const allCommands = commands ?? defaultCommands;

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return allCommands;
    return allCommands.filter(
      (cmd) => cmd.title.toLowerCase().includes(trimmed) || (cmd.subtitle ?? '').toLowerCase().includes(trimmed)
    );
  }, [allCommands, search]);

  const activeIndex = filtered.length === 0 ? -1 : Math.min(selectedIndex, filtered.length - 1);

  // 선택 항목이 목록 밖이면 보이게 스크롤한다 (DOM 동기화만).
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`${baseId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, baseId]);

  const close = () => onClose?.();

  const run = (cmd: PaletteCommand) => {
    if (cmd.disabled) return;
    cmd.perform();
    close();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(filtered.length > 0 ? (activeIndex + 1) % filtered.length : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(filtered.length > 0 ? (activeIndex - 1 + filtered.length) % filtered.length : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) run(filtered[activeIndex]);
    }
  };

  const header = (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border pr-2 pl-4">
      <Search aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="명령어 검색"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedIndex(0);
        }}
        onKeyDown={handleInputKeyDown}
        placeholder="명령어 검색 또는 바로가기"
        autoComplete="off"
        className="h-11 min-w-0 flex-1 border-none bg-transparent p-0 text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none md:text-sm"
      />
      <IconButton label="닫기" icon={<X />} onClick={close} />
    </div>
  );

  return (
    <Dialog
      open
      onClose={close}
      size="md"
      placement="top"
      ariaLabel="커맨드 팔레트"
      header={header}
      initialFocusRef={inputRef}
      bodyClassName="p-2"
      footer={
        <div className="hidden w-full items-center justify-between text-xs text-fg-subtle sm:flex">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑↓</Kbd>
              <span>탐색</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span>실행</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd>
            <span>닫기</span>
          </span>
        </div>
      }
    >
      <ul id={listId} role="listbox" aria-label="명령어 목록" className="space-y-1">
        {filtered.length === 0 ? (
          <li role="presentation" className="py-8 text-center text-sm text-fg-muted">
            검색된 명령어가 없습니다.
          </li>
        ) : (
          filtered.map((cmd, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <li
                key={cmd.id}
                id={optionId(idx)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={cmd.disabled ? true : undefined}
                onClick={() => run(cmd)}
                onMouseMove={() => {
                  if (!isSelected) setSelectedIndex(idx);
                }}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ease-standard',
                  cmd.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  isSelected ? 'bg-accent-soft text-accent-soft-fg' : 'text-fg hover:bg-surface-muted'
                )}
              >
                {cmd.icon ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4',
                      isSelected ? 'bg-surface text-accent' : 'bg-surface-muted text-fg-muted'
                    )}
                  >
                    {cmd.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{cmd.title}</span>
                  {cmd.subtitle ? (
                    <span className={cn('block truncate text-xs', isSelected ? 'text-accent-soft-fg' : 'text-fg-muted')}>
                      {cmd.subtitle}
                    </span>
                  ) : null}
                </span>
                {cmd.shortcut ? <Kbd>{cmd.shortcut}</Kbd> : null}
              </li>
            );
          })
        )}
      </ul>
    </Dialog>
  );
}
