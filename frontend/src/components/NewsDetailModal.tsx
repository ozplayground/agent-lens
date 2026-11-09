'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { X, Star, Bookmark, ExternalLink } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { askQuestionAboutNewsStream } from '@/lib/api';
import { categoryLabel, sourceLabel } from '@/lib/labels';
import { copyText } from '@/hooks/useCopyToClipboard';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { buttonClasses } from '@/components/ui/Button';
import MarkdownViewer from './MarkdownViewer';
import AskAiPanel, { ChatMessage } from './news-detail/AskAiPanel';
import HandoverCtaButton from './chat/HandoverCtaButton';

type DetailTab = 'summary' | 'ask_ai';

const TAB_ID_PREFIX = 'news-detail';

/** 복사 결과 표시 시간 (`useCopyToClipboard` 기본값과 같다). */
const COPY_FEEDBACK_MS = 2000;

interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem) => void;
  onHandoverToChat?: (item: NewsItem, draftQuestion?: string) => void;
}

export default function NewsDetailModal({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onHandoverToChat,
}: NewsDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailedIndex, setCopyFailedIndex] = useState<number | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const titleId = useId();

  const abortControllerRef = useRef<AbortController | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyTimer = () => {
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveTab('summary');
    setChatHistory([]);
    setQuestion('');
    setAsking(false);
    clearCopyTimer();
    setCopiedIndex(null);
    setCopyFailedIndex(null);
    setConfirmClearOpen(false);
    onClose();
  };

  // 닫혀 있는 동안 isOpen 이나 기사 id 가 바뀌면 상태를 초기화한다 (렌더 중 이전 값 비교).
  const itemId = item?.id;
  const [prevView, setPrevView] = useState({ isOpen, itemId });
  if (prevView.isOpen !== isOpen || prevView.itemId !== itemId) {
    setPrevView({ isOpen, itemId });
    if (!isOpen) {
      setActiveTab('summary');
      setChatHistory([]);
      setQuestion('');
      setAsking(false);
      setCopiedIndex(null);
      setCopyFailedIndex(null);
      setConfirmClearOpen(false);
    }
  }

  // 닫히면 진행 중인 스트림을 끊고 복사 표시 타이머를 정리한다.
  useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (!isOpen && copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, [isOpen, itemId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  // Escape·배경막·닫기 버튼은 Dialog(오버레이 스택)가 처리한다.
  if (!item) return null;

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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errMessage = err instanceof Error ? err.message : '';
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (!last.a) {
          updated[updated.length - 1] = {
            ...last,
            a: `AI 응답 생성 실패: ${errMessage || '네트워크 상태를 확인해주세요.'}`,
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

  // 복사 결과(복사됨·복사 실패)를 그 답변에 2,000ms 동안 보인다. 타이머는 닫힘·언마운트 때 정리한다.
  const handleCopy = (text: string, index: number) => {
    void copyText(text).then((ok) => {
      clearCopyTimer();
      if (ok) {
        setCopyFailedIndex(null);
        setCopiedIndex(index);
        copyTimerRef.current = setTimeout(() => {
          copyTimerRef.current = null;
          setCopiedIndex(null);
        }, COPY_FEEDBACK_MS);
      } else {
        setCopiedIndex(null);
        setCopyFailedIndex(index);
        copyTimerRef.current = setTimeout(() => {
          copyTimerRef.current = null;
          setCopyFailedIndex(null);
        }, COPY_FEEDBACK_MS);
      }
    });
  };

  const handleClearChat = () => {
    setConfirmClearOpen(true);
  };

  const confirmClearChat = () => {
    setChatHistory([]);
    setConfirmClearOpen(false);
  };

  const header = (
    <div className="shrink-0 border-b border-border">
      <div className="flex items-start gap-2 px-4 pt-3 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge>{categoryLabel(item.category)}</Badge>
            {item.is_high_signal && (
              <Badge tone="warning" icon={<Star className="fill-current" />}>
                Must-Read
              </Badge>
            )}
          </div>
          <h2
            id={titleId}
            className="line-clamp-2 text-base font-semibold text-fg break-keep [overflow-wrap:anywhere] md:text-lg"
          >
            {item.title}
          </h2>
        </div>
        <div className="-mr-2 flex shrink-0 items-center gap-1">
          <IconButton
            label={isBookmarked ? '보관됨' : '보관하기'}
            icon={<Bookmark className={isBookmarked ? 'fill-current text-accent' : undefined} />}
            onClick={() => onToggleBookmark(item)}
          />
          <IconButton label="닫기" icon={<X />} onClick={handleClose} />
        </div>
      </div>
      <Tabs
        label="기사 보기"
        idPrefix={TAB_ID_PREFIX}
        tabs={[
          { id: 'summary', label: 'AI 요약 & 시사점' },
          {
            id: 'ask_ai',
            label: 'AI 질의응답',
            badge: chatHistory.length > 0 ? chatHistory.length : undefined,
          },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        className="mt-2 border-b-0 px-2 md:px-3"
      />
    </div>
  );

  const footer = (
    <>
      <div className="mr-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
        <span>
          출처: <strong className="font-semibold text-fg">{sourceLabel(item.source)}</strong>
        </span>
        {item.author && <span className="max-md:hidden">by {item.author}</span>}
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses('primary', 'md')}
      >
        <span>원문 링크 방문</span>
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </>
  );

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        size="xl"
        header={header}
        labelledBy={titleId}
        footer={footer}
        bodyClassName="flex flex-col p-0"
      >
        {activeTab === 'summary' ? (
          <TabPanel id="summary" idPrefix={TAB_ID_PREFIX} className="flex flex-col gap-6 px-4 py-4 md:px-5 md:py-5">
            {item.why_it_matters && (
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-fg">개발자 시사점</h3>
                <p className="rounded-lg border-l-4 border-accent bg-surface-muted p-3 text-sm leading-relaxed text-fg">
                  {item.why_it_matters}
                </p>
              </section>
            )}

            <HandoverCtaButton
              item={item}
              variant="modal-banner"
              draftQuestion={question}
              onHandoverComplete={() => {
                if (onHandoverToChat) onHandoverToChat(item, question);
                handleClose();
              }}
            />

            {item.tldr_bullets && item.tldr_bullets.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-fg">핵심 요약 3줄</h3>
                <ul className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted p-3 text-sm leading-relaxed text-fg">
                  {item.tldr_bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="font-semibold text-accent">
                        •
                      </span>
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {item.tech_stack && item.tech_stack.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-fg">기술 스택</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {item.tech_stack.map((tech, idx) => (
                    <li key={idx}>
                      <Badge tone="accent">{tech}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {item.summary && (
              <section className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-fg">상세 본문 요약</h3>
                <div className="rounded-lg border border-border p-3">
                  <MarkdownViewer content={item.summary} />
                </div>
              </section>
            )}
          </TabPanel>
        ) : (
          <TabPanel id="ask_ai" idPrefix={TAB_ID_PREFIX} className="flex min-h-0 flex-1 flex-col">
            <AskAiPanel
              item={item}
              question={question}
              setQuestion={setQuestion}
              asking={asking}
              chatHistory={chatHistory}
              copiedIndex={copiedIndex}
              copyFailedIndex={copyFailedIndex}
              onAsk={handleAsk}
              onCopy={handleCopy}
              onClearChat={handleClearChat}
            />
          </TabPanel>
        )}
      </Dialog>

      <ConfirmDialog
        open={isOpen && confirmClearOpen}
        title="대화 초기화"
        description="AI 대화 내역을 모두 초기화하시겠습니까?"
        confirmLabel="초기화"
        tone="danger"
        onConfirm={confirmClearChat}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </>
  );
}
