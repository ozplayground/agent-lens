'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink, BookOpen, X, Globe, FileText } from 'lucide-react';
import { SourceReference } from '@/types/chat';

export interface CitationPopoverProps {
  source: SourceReference;
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  onOpenSourceDetail?: (sourceId: number) => void;
}

export default function CitationPopover({
  source,
  isOpen,
  onClose,
  onOpenSourceDetail,
}: CitationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSupplementary = source.type === 'supplementary' || String(source.index).startsWith('S');

  let domainName = source.domain;
  if (!domainName && source.url) {
    try {
      domainName = new URL(source.url).hostname;
    } catch {}
  }

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={isSupplementary ? '보충 검색 출처 상세 프리뷰' : '출처 기사 상세 프리뷰'}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-w-[90vw] p-3 rounded-lg bg-white border border-slate-200 shadow-xl text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top row: badge & close button */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isSupplementary ? (
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium inline-flex items-center gap-1">
              <Globe className="w-2.5 h-2.5 text-emerald-600" />
              <span>보충 검색 [{source.index}]</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-medium inline-flex items-center gap-1">
              <FileText className="w-2.5 h-2.5 text-blue-600" />
              <span>출처 [{source.index}]</span>
            </span>
          )}

          {isSupplementary && domainName && (
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
              {domainName}
            </span>
          )}

          {!isSupplementary && source.category && (
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
              {source.category}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="팝오버 닫기"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
        {source.title}
      </h4>

      {/* Snippet */}
      {source.snippet && (
        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-2 rounded border border-slate-200 mb-2">
          {source.snippet}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
        {!isSupplementary && onOpenSourceDetail && source.id ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSourceDetail(source.id!);
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium cursor-pointer transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            <span>기사 상세</span>
          </button>
        ) : (
          <span />
        )}

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors ml-auto"
        >
          <span>{isSupplementary ? '웹 문서 보기' : '원문 보기'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
