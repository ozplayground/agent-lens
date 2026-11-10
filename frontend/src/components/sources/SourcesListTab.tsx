'use client';

import React, { useState } from 'react';
import { GitBranch, Plus, Radio, Star, Trash2 } from 'lucide-react';
import { SourcesResponse, addRssSource } from '@/lib/api';
import { CATEGORY_LABELS, categoryLabel } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { TextField } from '@/components/ui/TextField';

interface SourcesListTabProps {
  sourcesData: SourcesResponse | null;
  onRefresh: () => void;
  onToggle: (sourceType: string, id: string) => Promise<void>;
  onDelete: (sourceType: string, id: string) => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
}

/** 카테고리 선택지: 값은 카테고리 id, 라벨은 긴 라벨 (`lib/labels.ts`, 피드 필터 칩과 같은 문구). */
const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS).map((id) => ({ value: id, label: categoryLabel(id) }));

const COUNTRY_OPTIONS = [
  { value: 'GLOBAL', label: 'GLOBAL (해외 소식)' },
  { value: 'KR', label: 'KR (국내 소식)' },
] as const;

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-3 shadow-card">
      <p className="text-xs text-fg-muted">{label}</p>
      <div className="mt-1 min-w-0 text-sm font-semibold text-fg">{children}</div>
    </div>
  );
}

export default function SourcesListTab({
  sourcesData,
  onRefresh,
  onToggle,
  onDelete,
  showToast,
  onSourcesUpdated,
}: SourcesListTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCat, setNewCat] = useState('ai_news');
  const [newCountry, setNewCountry] = useState('GLOBAL');
  const [newDesc, setNewDesc] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const handleAddManualRss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    try {
      setAddingSource(true);
      const res = await addRssSource({
        name: newName.trim(),
        url: newUrl.trim(),
        category_hint: newCat,
        country: newCountry,
        description: newDesc.trim(),
      });

      showToast('success', res.message || `'${newName}' 피드가 성공적으로 추가되었습니다.`);
      setNewName('');
      setNewUrl('');
      setNewDesc('');
      setShowAddForm(false);
      onRefresh();
      onSourcesUpdated?.();
    } catch (err: unknown) {
      showToast('error', err instanceof Error && err.message ? err.message : '피드 추가에 실패했습니다.');
    } finally {
      setAddingSource(false);
    }
  };

  const feeds = sourcesData?.data.rss_feeds ?? [];
  const repos = sourcesData?.data.github_sources.monitored_repos ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-5">
      {/* 지표: 모바일 2열, md 이상 4열 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="활성 RSS 피드">
          <span className="tabular-nums">{sourcesData?.stats.active_rss ?? 0}</span>{' '}
          <span className="text-xs font-normal text-fg-muted">/ {sourcesData?.stats.total_rss ?? 0}</span>
        </StatCard>
        <StatCard label="모니터링 GitHub">
          <span className="tabular-nums">{sourcesData?.stats.active_github_repos ?? 0}</span>{' '}
          <span className="text-xs font-normal text-fg-muted">/ {sourcesData?.stats.total_github_repos ?? 0}</span>
        </StatCard>
        <StatCard label="커뮤니티 수집">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
            Reddit · HN · arXiv
          </span>
        </StatCard>
        <StatCard label="관리 파일 위치">
          <span className="block truncate font-mono text-sm" title={sourcesData?.sources_file}>
            sources.json
          </span>
        </StatCard>
      </div>

      {/* RSS 피드 */}
      <section aria-labelledby="sources-rss-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="sources-rss-heading" className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <Radio aria-hidden="true" className="size-4 text-accent" /> 등록된 RSS 피드 목록
          </h3>
          <Button
            variant="primary"
            leadingIcon={<Plus />}
            aria-expanded={showAddForm}
            aria-controls={showAddForm ? 'sources-add-form' : undefined}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            새 피드 직접 등록
          </Button>
        </div>

        {showAddForm && (
          <form
            id="sources-add-form"
            onSubmit={handleAddManualRss}
            aria-labelledby="sources-add-form-title"
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted p-4"
          >
            <h4 id="sources-add-form-title" className="text-sm font-semibold text-fg">
              신규 RSS/Atom 피드 등록
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="소스 이름"
                placeholder="예: Anthropic Research Blog"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <TextField
                label="RSS/Atom URL"
                type="url"
                placeholder="예: https://www.anthropic.com/news/rss.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
              <Select
                label="카테고리 분류"
                options={CATEGORY_OPTIONS}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <Select
                label="국가/지역"
                options={COUNTRY_OPTIONS}
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
              />
            </div>
            <TextField
              label="소스 설명 (선택)"
              placeholder="예: Anthropic 공식 연구 및 안전성 보고서"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button type="submit" variant="primary" loading={addingSource}>
                저장하기
              </Button>
            </div>
          </form>
        )}

        {/* md 이상 표, 모바일은 행을 세로 카드로 (같은 요소를 CSS 로 바꾼다). 없으면 빈 표 대신 안내 (FE-30). */}
        {feeds.length === 0 ? (
          <EmptyNote loading={!sourcesData}>등록된 RSS 피드가 없습니다.</EmptyNote>
        ) : (
        <table className="w-full border-separate border-spacing-0 text-sm max-md:block">
          <thead className="max-md:sr-only">
            <tr>
              <th scope="col" className="border-b border-border px-3 py-2 text-left text-xs font-medium text-fg-muted">
                이름
              </th>
              <th scope="col" className="border-b border-border px-3 py-2 text-left text-xs font-medium text-fg-muted">
                URL
              </th>
              <th scope="col" className="border-b border-border px-3 py-2 text-left text-xs font-medium text-fg-muted">
                카테고리
              </th>
              <th scope="col" className="border-b border-border px-3 py-2 text-left text-xs font-medium text-fg-muted">
                상태
              </th>
              <th scope="col" className="border-b border-border px-3 py-2 text-right text-xs font-medium text-fg-muted">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="max-md:flex max-md:flex-col max-md:gap-2">
            {feeds.map((feed) => {
              const id = feed.id || feed.url;
              return (
                <tr
                  key={id}
                  className="max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-x-3 max-md:gap-y-1 max-md:rounded-xl max-md:border max-md:border-border max-md:bg-surface max-md:p-3"
                >
                  <td className="min-w-0 align-middle md:border-b md:border-border md:px-3 md:py-2.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="truncate font-medium text-fg">{feed.name}</span>
                      <Badge>{feed.country || 'GLOBAL'}</Badge>
                    </div>
                    {feed.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{feed.description}</p>
                    ) : null}
                  </td>
                  <td className="min-w-0 align-middle max-md:col-span-2 max-md:row-start-2 md:max-w-64 md:border-b md:border-border md:px-3 md:py-2.5">
                    <p className="truncate font-mono text-xs text-fg-muted" title={feed.url}>
                      {feed.url}
                    </p>
                  </td>
                  <td className="align-middle max-md:col-start-1 max-md:row-start-3 max-md:self-center md:border-b md:border-border md:px-3 md:py-2.5">
                    <Badge tone="accent">{categoryLabel(feed.category_hint)}</Badge>
                  </td>
                  <td className="align-middle max-md:col-start-2 max-md:row-start-1 md:border-b md:border-border md:px-3 md:py-2.5">
                    <Switch
                      label={`${feed.name} 수집 켜기`}
                      hideLabel
                      checked={feed.enabled}
                      onChange={() => void onToggle('rss', id)}
                    />
                  </td>
                  <td className="text-right align-middle max-md:col-start-2 max-md:row-start-3 md:border-b md:border-border md:px-3 md:py-2.5">
                    <IconButton
                      label={`${feed.name} 삭제`}
                      icon={<Trash2 />}
                      onClick={() => void onDelete('rss', id)}
                      className="hover:text-danger"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </section>

      {/* GitHub 저장소 */}
      <section aria-labelledby="sources-github-heading" className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 id="sources-github-heading" className="flex items-center gap-1.5 text-sm font-semibold text-fg">
          <GitBranch aria-hidden="true" className="size-4 text-fg-muted" /> 지속 모니터링 GitHub 저장소
        </h3>
        {repos.length === 0 ? (
          <EmptyNote loading={!sourcesData}>모니터링 중인 GitHub 저장소가 없습니다.</EmptyNote>
        ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {repos.map((r) => (
            <li
              key={r.repo}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 shadow-card"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-fg">{r.repo}</span>
                  <Badge tone="warning" icon={<Star />}>
                    {r.stars_hint ?? 0}
                  </Badge>
                </div>
                {r.description ? <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{r.description}</p> : null}
              </div>
              <Switch
                label={`${r.repo} 수집 켜기`}
                hideLabel
                checked={r.enabled}
                onChange={() => void onToggle('github_repo', r.repo)}
              />
            </li>
          ))}
        </ul>
        )}
      </section>
    </div>
  );
}

/** 목록이 비었을 때의 안내. 아직 받지 못했으면(불러오는 중) '없음' 이라고 하지 않는다. */
function EmptyNote({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-surface-muted p-6 text-center text-sm text-fg-muted">
      {loading ? '불러오는 중...' : children}
    </p>
  );
}
