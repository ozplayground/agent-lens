'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import {
  fetchSources,
  toggleSource,
  deleteSource,
  fetchDeepResearchStatus,
  fetchResearchAuditLogs,
  SourcesResponse,
  ResearchStatus,
  ResearchAuditLog,
} from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import DeepResearcherTab from './sources/DeepResearcherTab';
import SourcesListTab from './sources/SourcesListTab';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdated?: () => void;
}

type SourcesTab = 'deep_research' | 'sources';

const TAB_ID_PREFIX = 'sources-modal';
const DELETE_CONFIRM_TITLE = '이 소스를 목록에서 삭제하시겠습니까?';

interface PendingDelete {
  sourceType: string;
  id: string;
  name: string;
}

function findSourceName(data: SourcesResponse | null, sourceType: string, id: string): string {
  if (!data) return id;
  if (sourceType === 'rss') {
    const feed = data.data.rss_feeds.find((f) => (f.id || f.url) === id);
    return feed?.name ?? id;
  }
  return id;
}

export default function SourcesModal({ isOpen, onClose, onSourcesUpdated }: SourcesModalProps) {
  const [activeTab, setActiveTab] = useState<SourcesTab>('deep_research');
  const [sourcesData, setSourcesData] = useState<SourcesResponse | null>(null);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<ResearchAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 데이터를 받아 채운다. 로딩 표시 켜기는 호출하는 쪽이 한다.
  const fetchAll = useCallback(
    () =>
      Promise.all([
        fetchSources(),
        fetchDeepResearchStatus(),
        fetchResearchAuditLogs(30),
      ])
        .then(([srcRes, statRes, logsRes]) => {
          setSourcesData(srcRes);
          setResearchStatus(statRes);
          setAuditLogs(logsRes.logs);
        })
        .catch(() => {
          setMsg({ type: 'error', text: '데이터를 불러오지 못했습니다.' });
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  const loadData = () => {
    setLoading(true);
    void fetchAll();
  };

  // 열릴 때 로딩 표시를 켠다 (렌더 중 이전 값 비교).
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setLoading(true);
  }

  useEffect(() => {
    if (isOpen) {
      void fetchAll();
    }
  }, [isOpen, fetchAll]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleToggle = async (sourceType: string, id: string) => {
    try {
      await toggleSource(sourceType, id);
      showToast('success', '수집 상태가 변경되었습니다.');
      loadData();
      onSourcesUpdated?.();
    } catch {
      showToast('error', '상태 변경에 실패했습니다.');
    }
  };

  // 삭제는 확인 창을 연다 (브라우저 기본 대화상자 대신 ConfirmDialog).
  const handleDelete = async (sourceType: string, id: string) => {
    setDeleteError(null);
    setPendingDelete({ sourceType, id, name: findSourceName(sourcesData, sourceType, id) });
  };

  const cancelDelete = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSource(pendingDelete.sourceType, pendingDelete.id);
      setPendingDelete(null);
      showToast('success', '소스가 삭제되었습니다.');
      loadData();
      onSourcesUpdated?.();
    } catch {
      setDeleteError('소스 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    {
      id: 'deep_research' as const,
      label: (
        <>
          <Sparkles aria-hidden="true" className="size-4" />
          AI 딥 리서처
        </>
      ),
      badge: researchStatus?.auto_adopted_count ? `+${researchStatus.auto_adopted_count}` : undefined,
    },
    {
      id: 'sources' as const,
      label: (
        <>
          <Radio aria-hidden="true" className="size-4" />
          등록된 수집원
        </>
      ),
      badge: sourcesData?.stats.active_rss ?? 0,
    },
  ];

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        size="xl"
        dismissOnScrim={false}
        title="소스 & 리서처"
        bodyClassName="p-0"
        footer={
          <>
            <p className="mr-auto text-xs text-fg-muted">
              수집 대상의 기준 파일: <span className="font-mono text-fg">sources.json</span>
            </p>
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </>
        }
      >
        <div className="sticky top-0 z-10 bg-surface px-4 pt-1 md:px-5">
          <p className="pb-2 text-sm text-fg-muted">RSS 피드, GitHub 저장소, arXiv, Reddit 수집 대상을 관리합니다.</p>
          <Tabs
            label="소스 관리 화면"
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            idPrefix={TAB_ID_PREFIX}
          />
        </div>

        {/* 결과 안내: 대화상자 안의 live 영역 */}
        <div aria-live="polite" aria-atomic="true" className="px-4 md:px-5">
          {msg ? (
            <p
              className={cn(
                'mt-3 rounded-lg border border-border px-3 py-2 text-sm',
                msg.type === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              )}
            >
              {msg.text}
            </p>
          ) : null}
        </div>

        <TabPanel id={activeTab} idPrefix={TAB_ID_PREFIX}>
          {activeTab === 'deep_research' ? (
            <DeepResearcherTab
              researchStatus={researchStatus}
              auditLogs={auditLogs}
              loading={loading}
              onRefresh={loadData}
              showToast={showToast}
              onSourcesUpdated={onSourcesUpdated}
            />
          ) : (
            <SourcesListTab
              sourcesData={sourcesData}
              onRefresh={loadData}
              onToggle={handleToggle}
              onDelete={handleDelete}
              showToast={showToast}
              onSourcesUpdated={onSourcesUpdated}
            />
          )}
        </TabPanel>
      </Dialog>

      <ConfirmDialog
        open={isOpen && pendingDelete !== null}
        title={DELETE_CONFIRM_TITLE}
        description={pendingDelete ? `'${pendingDelete.name}' 을(를) 수집 목록에서 지웁니다.` : undefined}
        confirmLabel="삭제"
        tone="danger"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />
    </>
  );
}
