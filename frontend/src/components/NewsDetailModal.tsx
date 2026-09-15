'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  Star,
  ArrowUpRight,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  User,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { NewsItem } from '@/types/news';
import { askQuestionAboutNews, askQuestionAboutNewsStream } from '@/lib/api';
import MarkdownViewer from './MarkdownViewer';

interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem) => void;
}

interface ChatMessage {
  q: string;
  a: string;
  model?: string;
  time: string;
  isStreaming?: boolean;
}

const QUICK_PROMPTS = [
  {
    label: '💡 핵심 원리 및 구조',
    icon: Cpu,
    query: '이 기술의 핵심 동작 원리와 아키텍처 구조를 구체적으로 설명해줘'
  },
  {
    label: '🛠️ 실무 프로젝트 도입',
    icon: Layers,
    query: '우리 개발 프로젝트와 워크플로우에 이 기술을 어떻게 도입/적용할 수 있어?'
  },
  {
    label: '⚖️ 차별점 및 한계',
    icon: Sparkles,
    query: '기존의 유사 기술이나 방식과 비교했을 때 차별점, 장점, 한계점은 뭐야?'
  },
  {
    label: '🔒 보안 및 샌드박스',
    icon: ShieldCheck,
    query: '자율 에이전트 도입 시 보안 격리나 샌드박스 관점에서 검토해야 할 점은?'
  }
];

export default function NewsDetailModal({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark
}: NewsDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'ask_ai'>('summary');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Reset modal state when closed or when news item changes
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

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcut: close on Escape
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ask_ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, asking, activeTab]);

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

    // Append streaming entry immediately
    setChatHistory((prev) => [
      ...prev,
      {
        q,
        a: '',
        model: 'Gemini 실시간 스트리밍...',
        time: now,
        isStreaming: true
      }
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
                model: modelName
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
                a: last.a + token
              };
              return updated;
            });
          }
        },
        controller.signal
      );

      // Mark finished
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false
        };
        return updated;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (!last.a) {
          updated[updated.length - 1] = {
            ...last,
            a: `⚠️ AI 응답을 생성하지 못했습니다: ${err.message || '네트워크 상태를 확인해주세요.'}\n\n잠시 후 다시 시도하시거나 상단의 추천 질문을 클릭해보세요.`,
            model: 'Error',
            isStreaming: false
          };
        } else {
          updated[updated.length - 1] = {
            ...last,
            isStreaming: false
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

  const bullets = item.tldr_bullets && item.tldr_bullets.length > 0 ? item.tldr_bullets : [item.summary];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-[#30363d] bg-[#161b22] shrink-0 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] text-[#c9d1d9] border border-[#30363d] uppercase font-medium">
                  {item.category.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8b949e] bg-[#0d1117] border border-[#30363d]">
                  {item.source}
                </span>
                {item.is_high_signal && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Must-Read ({item.quality_score}점)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] leading-snug">
                {item.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onToggleBookmark(item)}
                className={`p-1.5 rounded-md border border-[#30363d] transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
                title={isBookmarked ? '보관함에서 제거' : '보관함에 저장'}
              >
                <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors cursor-pointer"
                title="닫기 (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-2 border-t border-[#30363d]/60 pt-2.5">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'summary'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#58a6ff]/40 shadow-xs'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]/50'
              }`}
            >
              <span>기사 분석 요약</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ask_ai');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors relative ${
                activeTab === 'ask_ai'
                  ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#58a6ff]/50 shadow-xs'
                  : 'text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d]/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI 엔지니어링 Q&A</span>
              {chatHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#58a6ff] text-black text-[10px] font-bold font-mono">
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: 기사 요약 본문 */}
        {activeTab === 'summary' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed flex-1">
            {/* 1. 3-Bullet Executive TL;DR */}
            <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
              <div className="flex items-center gap-1.5 text-[#58a6ff] font-semibold text-xs uppercase tracking-wide font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive TL;DR (3줄 핵심 요약)</span>
              </div>
              <div className="space-y-1.5">
                {bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[#c9d1d9]">
                    <span className="text-[11px] font-mono text-[#58a6ff] font-semibold shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <p className="m-0 leading-relaxed text-xs sm:text-sm">{b}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Why It Matters for Developers */}
            {item.why_it_matters && (
              <div className="p-3.5 rounded-lg bg-[#0d1117] border-l-2 border-[#58a6ff] text-xs leading-relaxed">
                <div className="text-xs font-semibold text-[#58a6ff] font-mono mb-1 flex items-center gap-1.5">
                  <span>Insight (개발자 시사점):</span>
                </div>
                <p className="text-[#c9d1d9] m-0">
                  {item.why_it_matters}
                </p>
              </div>
            )}

            {/* 3. Tech Stack Entities Extracted */}
            {item.tech_stack && item.tech_stack.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-[#8b949e]">언급된 주요 기술 스택:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.tech_stack.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] text-[#c9d1d9] border border-[#30363d]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Full Summary */}
            {item.summary && (
              <div className="space-y-1 pt-2 border-t border-[#30363d]">
                <span className="text-xs font-medium text-[#8b949e]">원문 요약:</span>
                <p className="text-[#8b949e] text-xs leading-relaxed whitespace-pre-line bg-[#0d1117] p-3.5 rounded-lg border border-[#30363d]">
                  {item.summary}
                </p>
              </div>
            )}

            {/* 5. Prominent CTA to ask AI */}
            <div className="pt-2">
              <div className="p-4 rounded-lg bg-linear-to-r from-[#1f6feb]/15 via-[#238636]/10 to-transparent border border-[#30363d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f6fc]">
                    <Bot className="w-4 h-4 text-[#58a6ff]" />
                    <span>이 기술의 실무 적용 방안이나 차별점이 궁금하신가요?</span>
                  </div>
                  <p className="text-[11px] text-[#8b949e]">
                    AI 아키텍트가 기사 전문과 기술 스택 맥락을 분석하여 명확하고 구체적인 해답을 제공합니다.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('ask_ai');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI에게 질문하기</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI 기술 질의응답 (Ask AI) */}
        {activeTab === 'ask_ai' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Ask AI Sub-header & Quick Prompts */}
            <div className="p-3 bg-[#0d1117] border-b border-[#30363d] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                  <Bot className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span className="font-semibold text-[#f0f6fc]">AI 어시스턴트</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[#30363d] bg-[#21262d] text-[#58a6ff]">
                    Gemini 3.5 Flash 실시간 가동
                  </span>
                </div>
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="text-[11px] text-[#8b949e] hover:text-[#f85149] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>대화 초기화</span>
                  </button>
                )}
              </div>

              {/* Quick suggestion pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_PROMPTS.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAsk(p.query)}
                      disabled={asking}
                      className="px-2.5 py-1 rounded-full bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/50 text-[11px] text-[#c9d1d9] hover:text-[#58a6ff] flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Icon className="w-3 h-3 text-[#58a6ff]" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Conversation Stream */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#8b949e]">
                  <div className="w-12 h-12 rounded-full bg-[#1f6feb]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-sm font-semibold text-[#f0f6fc]">
                      이 소식에 대해 무엇이든 질문해보세요
                    </h4>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
                      단순 요약이 아닌, 실무 아키텍처 연동 방법, 다른 프레임워크와의 차이점, 하네스 격리 및 보안 주의사항까지 기사 맥락을 바탕으로 전문 분석을 제공합니다.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg">
                    {QUICK_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAsk(p.query)}
                        disabled={asking}
                        className="px-3 py-1.5 rounded-md bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-xs text-[#c9d1d9] text-left hover:border-[#58a6ff]/50 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((c, i) => (
                    <div key={i} className="space-y-3">
                      {/* User Message Bubble */}
                      <div className="flex items-start justify-end gap-2">
                        <div className="max-w-[85%] bg-[#1f6feb]/20 border border-[#58a6ff]/30 rounded-lg rounded-tr-xs p-3 text-xs sm:text-sm text-[#f0f6fc] shadow-xs">
                          <p className="m-0 font-medium">{c.q}</p>
                          <div className="text-[10px] text-[#58a6ff]/70 text-right mt-1 font-mono">
                            {c.time}
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0 text-[#c9d1d9]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* AI Response Bubble */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#238636]/20 border border-[#2ea043]/40 flex items-center justify-center shrink-0 text-[#3fb950] mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex-1 max-w-[90%] bg-[#0d1117] border border-[#30363d] rounded-lg rounded-tl-xs p-3.5 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5 text-[11px] text-[#8b949e]">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Sparkles className="w-3 h-3 text-[#58a6ff]" />
                              <span className="text-[#58a6ff] font-semibold">{c.model || 'AgentLens AI'}</span>
                              <span>• {c.time}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(c.a, i)}
                              disabled={c.isStreaming || !c.a}
                              className="flex items-center gap-1 text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-40 px-1.5 py-0.5 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
                              title="답변 복사"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">복사됨</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>복사</span>
                                </>
                              )}
                            </button>
                          </div>
                          {c.isStreaming && !c.a ? (
                            <div className="py-2 text-xs text-[#8b949e] flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                              <span>AI가 실시간 스트리밍 답변을 생성하는 중입니다...</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <MarkdownViewer content={c.a} />
                              {c.isStreaming && (
                                <span className="inline-block w-2 h-4 ml-1 bg-[#58a6ff] animate-pulse align-middle" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-[#161b22] border-t border-[#30363d] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="이 기술에 대해 자유롭게 질문해보세요 (예: 실제 서비스에 도입할 때 장단점은?)"
                  disabled={asking}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3.5 py-2 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  {asking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>전송</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-3.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 text-[#8b949e]">
            <span>출처: <strong className="text-[#c9d1d9]">{item.source}</strong></span>
            {item.author && <span className="hidden sm:inline">by {item.author}</span>}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#f0f6fc] hover:text-[#58a6ff] rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>원문 링크 방문</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
