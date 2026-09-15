'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Star,
  MessageSquare,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { NewsItem } from '@/types/news';
import { askQuestionAboutNewsStream } from '@/lib/api';
import MarkdownViewer from './MarkdownViewer';
import AskAiPanel, { ChatMessage } from './news-detail/AskAiPanel';

interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem) => void;
}

export default function NewsDetailModal({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: NewsDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'ask_ai'>('summary');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveTab('summary');
    setChatHistory([]);
    setQuestion('');
    setAsking(false);
    setCopiedIndex(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('summary');
      setChatHistory([]);
      setQuestion('');
      setAsking(false);
      setCopiedIndex(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen, item?.id]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim();
    if (!q || asking) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setQuestion('');
    setAsking(true);
    setActiveTab('ask_ai');

    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    setChatHistory((prev) => [
      ...prev,
      {
        q,
        a: '',
        model: 'Gemini 실시간 스트리밍...',
        time: now,
        isStreaming: true,
      },
    ]);

    try {
      await askQuestionAboutNewsStream(
        item.id,
        q,
        {
          onMeta: (modelName) => {
            setChatHistory((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                model: modelName,
              };
              return updated;
            });
          },
          onToken: (token) => {
            setChatHistory((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                a: last.a + token,
              };
              return updated;
            });
          },
        },
        controller.signal
      );

      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (!last.a) {
          updated[updated.length - 1] = {
            ...last,
            a: `⚠️ AI 응답 생성 실패: ${err.message || '네트워크 상태를 확인해주세요.'}`,
            model: 'Error',
            isStreaming: false,
          };
        } else {
          updated[updated.length - 1] = {
            ...last,
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setAsking(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('AI 대화 내역을 모두 초기화하시겠습니까?')) {
      setChatHistory([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-800 z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-medium">
              {item.category}
            </span>
            {item.is_high_signal && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Must-Read
              </span>
            )}
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {item.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleBookmark(item)}
              className={`p-1.5 rounded-md hover:bg-slate-100 text-xs transition-colors cursor-pointer ${
                isBookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isBookmarked ? '보관됨' : '보관하기'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-slate-200 bg-slate-50 flex gap-4 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI 요약 & 시사점</span>
          </button>
          <button
            onClick={() => setActiveTab('ask_ai')}
            className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ask_ai'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ask AI 질의응답</span>
            {chatHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-blue-100 text-blue-700 font-semibold">
                {chatHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'summary' ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
            {/* Title & Insight */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-3">
                {item.title}
              </h2>
              {item.why_it_matters && (
                <div className="p-3 sm:p-3.5 rounded-lg bg-blue-50/70 border-l-4 border-blue-500 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
                  <div className="font-semibold text-blue-700 flex items-center gap-1 mb-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Why It Matters (개발자를 위한 시사점):</span>
                  </div>
                  {item.why_it_matters}
                </div>
              )}
            </div>

            {/* 3-Bullet TL;DR */}
            {item.tldr_bullets && item.tldr_bullets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                  3-Bullet Executive TL;DR
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {item.tldr_bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5 font-bold">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tech Stack */}
            {item.tech_stack && item.tech_stack.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                  추출된 기술 스택 / 모델
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.tech_stack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 text-blue-700 border border-slate-200 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Text */}
            {item.summary && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                  상세 본문 요약
                </h4>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <MarkdownViewer content={item.summary} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <AskAiPanel
            item={item}
            question={question}
            setQuestion={setQuestion}
            asking={asking}
            chatHistory={chatHistory}
            copiedIndex={copiedIndex}
            onAsk={handleAsk}
            onCopy={handleCopy}
            onClearChat={handleClearChat}
          />
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              출처: <strong className="text-slate-800">{item.source}</strong>
            </span>
            {item.author && <span className="hidden sm:inline">by {item.author}</span>}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 hover:text-blue-600 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <span>원문 링크 방문</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
