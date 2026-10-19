'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bot, Globe, Cpu, Sun, Moon, RefreshCw, X, Laptop } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface CommandActionItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'navigation' | 'theme' | 'data' | 'system';
  icon: React.ReactNode;
  perform: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSources?: () => void;
  onOpenMcp?: () => void;
  onTriggerCollect?: () => void;
}

export default function CommandPalette({
  isOpen = false,
  onClose,
  onOpenSources,
  onOpenMcp,
  onTriggerCollect,
}: CommandPaletteProps) {
  const router = useRouter();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: CommandActionItem[] = useMemo(() => [
    {
      id: 'chat',
      title: 'AI 챗 워크스페이스 이동',
      subtitle: '기술 소식 기반 심층 질의응답 및 에이전틱 리서치',
      category: 'navigation',
      icon: <Bot className="w-4 h-4 text-blue-500" />,
      perform: () => {
        router.push('/chat');
        onClose?.();
      },
      shortcut: 'C',
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
      category: 'theme',
      icon:
        theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : theme === 'system' ? (
          <Laptop className="w-4 h-4 text-blue-500" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        ),
      perform: () => {
        toggleTheme();
        onClose?.();
      },
      shortcut: 'T',
    },
    {
      id: 'sources',
      title: '소스 관리 & AI 리서처 열기',
      subtitle: 'RSS 피드 및 GitHub 소스 등록, 자율 소스 탐색',
      category: 'data',
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      perform: () => {
        onOpenSources?.();
        onClose?.();
      },
    },
    {
      id: 'mcp',
      title: 'FastMCP 도구 설정 열기',
      subtitle: 'Claude Desktop 및 에이전트 연동 가이드',
      category: 'system',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
      perform: () => {
        onOpenMcp?.();
        onClose?.();
      },
    },
    {
      id: 'collect',
      title: '최신 소식 즉시 수집 트리거',
      subtitle: '등록된 모든 소스에서 즉시 신규 기술 소식 크롤링',
      category: 'data',
      icon: <RefreshCw className="w-4 h-4 text-emerald-500" />,
      perform: () => {
        onTriggerCollect?.();
        onClose?.();
      },
    },
  ], [router, theme, toggleTheme, onClose, onOpenSources, onOpenMcp, onTriggerCollect]);

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return actions;
    return actions.filter(
      (act) =>
        act.title.toLowerCase().includes(trimmed) ||
        act.subtitle.toLowerCase().includes(trimmed)
    );
  }, [actions, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
      }
    }
  }, [filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="커맨드 팔레트"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-[#30363d] gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="명령어 검색 또는 바로가기... (ESC로 닫기)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-[#f0f6fc] placeholder-slate-400 outline-none border-none p-0"
            autoFocus
          />
          <button
            onClick={onClose}
            type="button"
            aria-label="닫기"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Items Listbox */}
        <div
          role="listbox"
          aria-label="명령어 목록"
          className="max-h-80 overflow-y-auto p-2 space-y-1 overscroll-contain"
        >
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              검색된 명령어가 없습니다.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={item.perform}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-[#1f2937] border-l-2 border-blue-600 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-100 dark:hover:bg-[#21262d] text-slate-800 dark:text-[#f0f6fc]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-[#21262d]'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#8b949e] truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  {item.shortcut && (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d] text-[10px] font-mono text-slate-500 dark:text-[#8b949e]">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#0d1117] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-[#21262d] text-[10px] font-mono">
                ↑↓
              </kbd>
              <span>탐색</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-[#21262d] text-[10px] font-mono">
                ↵
              </kbd>
              <span>실행</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#21262d] text-[10px] font-mono">
              ESC
            </kbd>
            <span>닫기</span>
          </div>
        </div>
      </div>
    </div>
  );
}
