'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Settings,
  FileText,
  Mail,
  ExternalLink,
  ArrowUpRight,
  MoreHorizontal,
  TriangleAlert,
  Lightbulb,
} from 'lucide-react';
import { DailyBriefing } from '@/types/news';
import { exportBriefingToNotion, sendBriefingByEmail } from '@/lib/api';
import { CATEGORY_LABELS, categoryLabel, sourceLabel } from '@/lib/labels';
import { FEED_CATEGORIES } from '@/components/feed/FeedToolbar';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button, buttonClasses } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { MenuButton, type MenuItem } from '@/components/ui/Menu';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';
import { Badge } from '@/components/ui/Badge';
import MarkdownViewer from './MarkdownViewer';

interface DailyBriefingModalProps {
  briefing: DailyBriefing | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

type BriefingView = 'categorized' | 'markdown';

const TAB_ID_PREFIX = 'daily-briefing';

/** 분야 id 가 긴 라벨 표(`CATEGORY_LABELS`)에 있으면 긴 라벨, 없으면 backend 이름. */
function categoryTitle(id: string, name: string): string {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, id) ? categoryLabel(id) : name;
}

/** 피드 카테고리 칩과 같은 lucide 아이콘. 표에 없는 id 는 null (backend 이모지 `icon` 은 쓰지 않는다). */
function categoryIcon(id: string): React.ReactNode {
  return FEED_CATEGORIES.find((cat) => cat.id === id)?.icon ?? null;
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export default function DailyBriefingModal({
  briefing,
  isOpen,
  onClose,
  onOpenSettings
}: DailyBriefingModalProps) {
  const [activeView, setActiveView] = useState<BriefingView>('categorized');
  const { status: copyStatus, copy } = useCopyToClipboard();

  // Notion export state
  const [isExportingNotion, setIsExportingNotion] = useState(false);
  const [notionResult, setNotionResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null);

  // Email send state
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message?: string } | null>(null);

  if (!briefing) return null;

  const handleCopy = () => {
    void copy(briefing.markdown_report);
  };

  const handleDownload = () => {
    const blob = new Blob([briefing.markdown_report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgentLens_Daily_Briefing_${briefing.date.replace(/[^0-9]/g, '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportNotion = async () => {
    setIsExportingNotion(true);
    setNotionResult(null);
    try {
      const res = await exportBriefingToNotion();
      setNotionResult({ success: true, url: res.url, message: 'Notion 페이지 생성 완료!' });
    } catch (e: unknown) {
      setNotionResult({ success: false, message: errorMessage(e, 'Notion 페이지 생성 실패') });
    } finally {
      setIsExportingNotion(false);
    }
  };

  const handleSendEmail = async (targetEmail?: string) => {
    setIsSendingEmail(true);
    setEmailResult(null);
    try {
      await sendBriefingByEmail(targetEmail || emailInput);
      setEmailResult({ success: true, message: '이메일이 성공적으로 발송되었습니다.' });
      setShowEmailPrompt(false);
      setTimeout(() => setEmailResult(null), 4000);
    } catch (e: unknown) {
      setEmailResult({ success: false, message: errorMessage(e, '이메일 발송 실패') });
    } finally {
      setIsSendingEmail(false);
    }
  };

  /** 개요 줄의 `**이름**` 이 어떤 분야의 backend 이름과 같으면 그 분야의 긴 라벨로 바꾼다. */
  const overviewName = (name: string): string => {
    const cat = briefing.categories?.find((c) => c.name === name.trim());
    return cat ? categoryTitle(cat.id, cat.name) : name;
  };

  const copyLabel = copyStatus === 'copied' ? '복사됨' : copyStatus === 'failed' ? '복사 실패' : '마크다운 복사';
  const copyIcon = copyStatus === 'copied' ? <Check /> : copyStatus === 'failed' ? <TriangleAlert /> : <Copy />;

  // 모바일(<768)에서 주 버튼 외 작업을 모은 메뉴.
  const mobileMenuItems: MenuItem[] = [
    { type: 'item', label: '이메일 발송', icon: <Mail />, onSelect: () => setShowEmailPrompt(true) },
    { type: 'item', label: copyLabel, icon: copyIcon, onSelect: handleCopy },
    { type: 'item', label: '.md 다운로드', icon: <Download />, onSelect: handleDownload },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {notionResult?.url ? (
        <a
          href={notionResult.url}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses('primary', 'md')}
        >
          <FileText aria-hidden="true" className="size-4" />
          <span>Notion에서 열기</span>
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      ) : (
        <Button
          variant="primary"
          onClick={handleExportNotion}
          loading={isExportingNotion}
          leadingIcon={<FileText />}
          title="Notion 페이지로 즉시 발행"
        >
          Notion 내보내기
        </Button>
      )}

      <Button
        variant="secondary"
        onClick={() => setShowEmailPrompt((v) => !v)}
        loading={isSendingEmail}
        leadingIcon={<Mail />}
        aria-expanded={showEmailPrompt}
        aria-controls={showEmailPrompt ? 'daily-briefing-email-form' : undefined}
        className="max-md:hidden"
      >
        이메일 발송
      </Button>
      <IconButton
        label={copyLabel}
        icon={copyIcon}
        variant="secondary"
        onClick={handleCopy}
        className="max-md:hidden"
      />
      <IconButton
        label=".md 다운로드"
        icon={<Download />}
        variant="secondary"
        onClick={handleDownload}
        className="max-md:hidden"
      />
      <div className="md:hidden">
        <MenuButton label="브리핑 작업" icon={<MoreHorizontal />} items={mobileMenuItems} variant="secondary" />
      </div>
    </div>
  );

  const footer = (
    <>
      <span className="mr-auto text-xs text-fg-subtle max-md:hidden">
        AgentLens · AI & Agent 기술 큐레이션 및 정기 브리핑
      </span>
      {/* 연동 설정 진입은 여기 한 곳 (실패 알림 안의 Notion·이메일 설정 열기는 그 실패의 바로가기) */}
      {onOpenSettings && (
        <Button variant="ghost" leadingIcon={<Settings />} onClick={onOpenSettings}>
          연동 설정
        </Button>
      )}
      <Button variant="secondary" onClick={onClose}>
        닫기
      </Button>
    </>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <>
          오늘의 AI 브리핑 <span className="ml-1 text-sm font-normal text-fg-muted">{briefing.date}</span>
        </>
      }
      description={briefing.headline}
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {toolbar}

        {showEmailPrompt && (
          <form
            id="daily-briefing-email-form"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendEmail();
            }}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted p-3 sm:flex-row sm:items-end"
          >
            <TextField
              label="수신자 이메일"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="비워 두면 기본 수신자로 보냅니다"
              autoComplete="email"
              containerClassName="flex-1"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" loading={isSendingEmail}>
                {emailInput ? '발송' : '기본 수신자로 발송'}
              </Button>
              <Button variant="ghost" onClick={() => setShowEmailPrompt(false)}>
                취소
              </Button>
            </div>
          </form>
        )}

        {notionResult && (
          <InlineAlert
            tone={notionResult.success ? 'success' : 'danger'}
            action={
              !notionResult.success && onOpenSettings ? (
                <Button variant="secondary" size="sm" onClick={onOpenSettings}>
                  Notion 설정 열기
                </Button>
              ) : undefined
            }
          >
            {notionResult.message}
          </InlineAlert>
        )}

        {emailResult && (
          <InlineAlert
            tone={emailResult.success ? 'success' : 'danger'}
            action={
              !emailResult.success && onOpenSettings ? (
                <Button variant="secondary" size="sm" onClick={onOpenSettings}>
                  이메일 설정 열기
                </Button>
              ) : undefined
            }
          >
            {emailResult.message}
          </InlineAlert>
        )}

        <Tabs
          label="브리핑 보기"
          idPrefix={TAB_ID_PREFIX}
          tabs={[
            { id: 'categorized', label: '카테고리별 요약' },
            { id: 'markdown', label: '마크다운 전문' },
          ]}
          value={activeView}
          onChange={setActiveView}
        />

        {activeView === 'categorized' ? (
          <TabPanel id="categorized" idPrefix={TAB_ID_PREFIX} className="flex flex-col gap-4 text-sm leading-relaxed text-fg">
            {/* 오늘의 핵심 요약 — 헤드라인은 대화상자 설명에만 두고 여기에는 개요만. 개요가 없으면 칸을 그리지 않는다. */}
            {briefing.overview ? (
              <section className="flex flex-col gap-2 rounded-xl border border-border bg-accent-soft p-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-accent-soft-fg">
                  <Sparkles aria-hidden="true" className="size-4" />
                  <span>오늘의 핵심 요약</span>
                </h3>
                <div className="flex flex-col gap-1.5 text-fg-muted">
                  {briefing.overview.split('\n').map((line, idx) => {
                    const match = line.match(/^•\s*\*\*(.*?)\*\*:\s*(.*)$/);
                    if (match) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span aria-hidden="true" className="shrink-0 text-accent">•</span>
                          <span>
                            <strong className="font-semibold text-fg">{overviewName(match[1])}:</strong> {match[2]}
                          </span>
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })}
                </div>
              </section>
            ) : null}

            {/* 카테고리별 */}
            {briefing.categories && briefing.categories.length > 0 ? (
              briefing.categories.map((cat) => (
                <section key={cat.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                    <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-fg">
                      {categoryIcon(cat.id) ? (
                        <span aria-hidden="true" className="inline-flex shrink-0 text-accent [&>svg]:size-4">
                          {categoryIcon(cat.id)}
                        </span>
                      ) : null}
                      <span className="min-w-0 break-keep [overflow-wrap:anywhere]">{categoryTitle(cat.id, cat.name)}</span>
                    </h3>
                    <Badge>{cat.items.length}건</Badge>
                  </div>

                  {cat.summary && (
                    <p className="rounded-lg bg-surface-muted p-3 text-fg-muted">
                      <span className="mr-1 font-semibold text-accent">동향:</span>
                      {cat.summary}
                    </p>
                  )}

                  <ul className="flex flex-col gap-2.5">
                    {cat.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col gap-1.5 rounded-lg border border-border p-3 transition-colors duration-150 ease-standard hover:border-border-strong"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex min-w-0 items-start gap-1 font-semibold text-fg hover:text-accent"
                          >
                            <span className="break-keep [overflow-wrap:anywhere]">{item.title}</span>
                            <ExternalLink aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-fg-subtle group-hover:text-accent" />
                          </a>
                          {item.source && <Badge className="shrink-0">{sourceLabel(item.source)}</Badge>}
                        </div>

                        {item.why_it_matters && (
                          <p className="rounded-md bg-success-soft p-2 text-success">
                            <span className="mr-1 inline-flex items-center gap-1 align-text-bottom font-semibold">
                              <Lightbulb aria-hidden="true" className="size-4" />
                              시사점:
                            </span>
                            {item.why_it_matters}
                          </p>
                        )}

                        {item.summary && !item.why_it_matters && (
                          <p className="m-0 line-clamp-2 text-fg-muted">{item.summary}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              /* categories 가 없으면 마크다운을 줄 단위로 */
              <div className="flex flex-col gap-2 text-fg-muted">
                {briefing.markdown_report.split('\n').map((line, idx) => (
                  <p key={idx} className="m-0">{line}</p>
                ))}
              </div>
            )}

            {/* 추천 Action Items */}
            {briefing.action_items && briefing.action_items.length > 0 && (
              <section className="flex flex-col gap-2 rounded-xl border border-border bg-success-soft p-4">
                <h3 className="flex items-center gap-1.5 text-base font-semibold text-success">
                  <Check aria-hidden="true" className="size-4" />
                  <span>오늘의 추천 Action Items</span>
                </h3>
                <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-fg marker:font-semibold marker:text-success">
                  {briefing.action_items.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ol>
              </section>
            )}
          </TabPanel>
        ) : (
          <TabPanel id="markdown" idPrefix={TAB_ID_PREFIX}>
            <MarkdownViewer content={briefing.markdown_report} />
          </TabPanel>
        )}
      </div>
    </Dialog>
  );
}
