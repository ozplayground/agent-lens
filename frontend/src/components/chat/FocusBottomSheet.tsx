'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Target, X, Check, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import {
  FocusFilters,
  ChatFocusCategory,
  ChatFocusTimeRange,
  ChatFocusSort,
  DEFAULT_FOCUS_FILTERS,
} from '@/types/chat';

export interface FocusBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FocusFilters;
  onApplyFilters: (nextFilters: FocusFilters) => void;
  onResetFilters: () => void;
  targetCount?: number;
  totalCount?: number;
}

const CATEGORIES: { id: ChatFocusCategory; label: string }[] = [
  { id: 'all', label: '전체 소식' },
  { id: 'harness', label: '하네스·평가' },
  { id: 'mcp_plugins_skills', label: 'MCP·도구' },
  { id: 'agent_tech', label: '에이전트 기술' },
  { id: 'ai_news', label: 'AI 뉴스' },
];

const TIME_RANGES: { id: ChatFocusTimeRange; label: string }[] = [
  { id: 'all', label: '전체 기간' },
  { id: '24h', label: '24시간' },
  { id: '7d', label: '최근 7일' },
  { id: '30d', label: '최근 30일' },
];

const SORTS: { id: ChatFocusSort; label: string }[] = [
  { id: 'hot', label: '화제순' },
  { id: 'latest', label: '최신순' },
  { id: 'quality', label: '품질순' },
];

export default function FocusBottomSheet({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  targetCount,
  totalCount,
}: FocusBottomSheetProps) {
  const [draftFilters, setDraftFilters] = useState<FocusFilters>(filters);
  const [prevFilters, setPrevFilters] = useState<FocusFilters>(filters);
  const touchStartY = useRef<number>(0);

  // Sync draft filters when props change during render
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setDraftFilters(filters);
  }

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY >= 100) {
      onClose();
    }
  };

  const handleReset = () => {
    setDraftFilters(DEFAULT_FOCUS_FILTERS);
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        data-testid="bottom-sheet-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="수집 소식 타깃팅 포커스 필터"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-50 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 p-4 sm:p-6 max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-200"
      >
        {/* Mobile Swipe-Down Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 cursor-grab shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">수집 소식 포커스 필터</h2>
              <p className="text-[11px] text-slate-500">RAG 지식 검색 대상 소식을 타깃팅합니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="필터 닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 py-3 text-xs">
          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              도메인 카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = draftFilters.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({ ...prev, category: cat.id }))
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              수집 기간
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_RANGES.map((tr) => {
                const isSelected = draftFilters.timeRange === tr.id;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({ ...prev, timeRange: tr.id }))
                    }
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort & High-Signal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                정렬 기준
              </label>
              <div className="grid grid-cols-3 gap-1">
                {SORTS.map((s) => {
                  const isSelected = draftFilters.sort === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({ ...prev, sort: s.id }))
                      }
                      className={`py-1 px-2 rounded-md text-xs font-medium text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* High Signal Switch */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                신호 품질 필터
              </label>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">
                  Must-Read 고신호만 (품질 7.8+)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftFilters.highSignalOnly}
                  aria-label="Must-Read 고신호 전용 토글"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      highSignalOnly: !prev.highSignalOnly,
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    draftFilters.highSignalOnly ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      draftFilters.highSignalOnly ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Matching Count Badge or 0-count Alert (Only rendered when targetCount is provided) */}
          {targetCount !== undefined && (
            <div className="pt-2">
              {targetCount === 0 ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    선택 조건의 소식이 없습니다. 기간을 [최근 30일] 또는 [전체 기간]으로 넓혀보세요.
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>약 {targetCount}건 매칭 소식</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>적용하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
