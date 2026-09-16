'use client';

import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  Copy,
  Check,
  RotateCcw,
  User,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { NewsItem } from '@/types/news';
import MarkdownViewer from '../MarkdownViewer';

export interface ChatMessage {
  q: string;
  a: string;
  model?: string;
  time: string;
  isStreaming?: boolean;
}

interface AskAiPanelProps {
  item: NewsItem;
  question: string;
  setQuestion: (q: string) => void;
  asking: boolean;
  chatHistory: ChatMessage[];
  copiedIndex: number | null;
  onAsk: (queryToAsk?: string) => void;
  onCopy: (text: string, index: number) => void;
  onClearChat: () => void;
}

export const QUICK_PROMPTS = [
  {
    label: '💡 핵심 원리 및 구조',
    icon: Cpu,
    query: '이 기술의 핵심 동작 원리와 아키텍처 구조를 구체적으로 설명해줘',
  },
  {
    label: '🛠️ 실무 프로젝트 도입',
    icon: Layers,
    query: '우리 개발 프로젝트와 워크플로우에 이 기술을 어떻게 도입/적용할 수 있어?',
  },
  {
    label: '⚖️ 차별점 및 한계',
    icon: Sparkles,
    query: '기존의 유사 기술이나 방식과 비교했을 때 차별점, 장점, 한계점은 뭐야?',
  },
  {
    label: '🔒 보안 및 샌드박스',
    icon: ShieldCheck,
    query: '자율 에이전트 도입 시 보안 격리나 샌드박스 관점에서 검토해야 할 점은?',
  },
];

export default function AskAiPanel({
  item,
  question,
  setQuestion,
  asking,
  chatHistory,
  copiedIndex,
  onAsk,
  onCopy,
  onClearChat,
}: AskAiPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chatHistory, asking]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Ask AI Sub-Header */}
      <div className="p-3 sm:px-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-slate-900">
            Deep-Dive AI 대화형 질의응답
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            Gemini 실시간 스트리밍 가동
          </span>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>대화 초기화</span>
          </button>
        )}
      </div>

      {/* Quick suggestion pills */}
      <div className="px-3 sm:px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
        {QUICK_PROMPTS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onAsk(p.query)}
              disabled={asking}
              className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-600 flex items-center gap-1 shrink-0 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-blue-600" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Conversation Stream */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-semibold text-slate-900">
                이 소식에 대해 무엇이든 질문해보세요
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                단순 요약이 아닌, 실무 아키텍처 연동 방법, 다른 프레임워크와의 차이점, 하네스 격리 및 보안 주의사항까지 기사 맥락을 바탕으로 전문 분석을 제공합니다.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onAsk(p.query)}
                  disabled={asking}
                  className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 text-left hover:border-blue-400 transition-colors shadow-xs cursor-pointer"
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
                  <div className="max-w-[85%] bg-blue-600 border border-blue-700 rounded-lg rounded-tr-xs p-3 text-xs sm:text-sm text-white shadow-xs">
                    <p className="m-0 font-medium">{c.q}</p>
                    <div className="text-[10px] text-blue-100 text-right mt-1 font-mono">
                      {c.time}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 text-slate-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* AI Response Bubble */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 max-w-[90%] bg-white border border-slate-200 rounded-lg rounded-tl-xs p-3.5 space-y-2 shadow-xs text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-600 font-semibold">
                          {c.model || 'AgentLens AI'}
                        </span>
                        <span>• {c.time}</span>
                      </div>
                      <button
                        onClick={() => onCopy(c.a, i)}
                        disabled={c.isStreaming || !c.a}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 disabled:opacity-40 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="답변 복사"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">복사됨</span>
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
                      <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>AI가 실시간 스트리밍 답변을 생성하는 중입니다...</span>
                      </div>
                    ) : (
                      <div className="relative text-slate-800">
                        <MarkdownViewer content={c.a} />
                        {c.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
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
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAsk();
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
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
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
  );
}
