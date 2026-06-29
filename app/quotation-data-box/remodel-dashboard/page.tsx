'use client';

import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useEditListStore } from '@/lib/stores/editListStore';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import type { Asset } from '@/lib/types';

// API設計(リモデル管理 24-23 リモデルクローズ): RFQ=完了/申請を見送る, 廃棄=廃棄完了/申請を見送る,
// 移動=移動完了/申請を見送る を終端とする。
const TERMINAL_STATUSES = new Set<string>(['完了', '申請を見送る', '廃棄完了', '移動完了']);

type DecisionKey = 'new' | 'replace' | 'addition' | 'disposal' | 'transfer' | 'undecided';

const DECISION_LABEL: Record<DecisionKey, string> = {
  new: '新規購入',
  replace: '更新購入',
  addition: '増設購入',
  disposal: '廃棄',
  transfer: '移動',
  undecided: '方針未決',
};

const DECISION_COLOR: Record<DecisionKey, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  replace: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  addition: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  disposal: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  transfer: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  undecided: { bg: 'bg-stroke-card', text: 'text-content-sub', border: 'border-stroke-input' },
};

const purchaseCategoryToDecision = (cat: Asset['purchaseCategory']): DecisionKey => {
  switch (cat) {
    case '新規': return 'new';
    case '更新': return 'replace';
    case '増設': return 'addition';
    case '廃棄予定': return 'disposal';
    case '移設': return 'transfer';
    default: return 'undecided';
  }
};

const hasNewLocation = (a: Asset): boolean => {
  return Boolean(a.newRoom || a.newDepartment || a.newDivision || a.newRoomName || a.newSection);
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editListIdParam = searchParams.get('editListId') || '';

  const { editLists } = useEditListStore();
  const { rfqGroups } = useRfqGroupStore();

  // リモデルモードの編集リストのみ対象
  const remodelLists = useMemo(
    () => editLists.filter(l => l.mode === 'remodel'),
    [editLists],
  );

  const targetList = useMemo(() => {
    if (editListIdParam) return remodelLists.find(l => l.id === editListIdParam);
    return remodelLists[0];
  }, [remodelLists, editListIdParam]);

  // 方針別カウント
  const decisionCounts = useMemo(() => {
    const init: Record<DecisionKey, number> = {
      new: 0, replace: 0, addition: 0, disposal: 0, transfer: 0, undecided: 0,
    };
    if (!targetList) return init;
    for (const a of targetList.baseAssets) {
      const key = purchaseCategoryToDecision(a.purchaseCategory);
      init[key]++;
    }
    return init;
  }, [targetList]);

  // 設置場所入力済み件数（disposal以外が対象）
  const locationStats = useMemo(() => {
    if (!targetList) return { needsLocation: 0, filled: 0, missing: 0 };
    const targets = targetList.baseAssets.filter(a => purchaseCategoryToDecision(a.purchaseCategory) !== 'disposal');
    const filled = targets.filter(hasNewLocation).length;
    return { needsLocation: targets.length, filled, missing: targets.length - filled };
  }, [targetList]);

  const totalAssets = targetList?.baseAssets.length || 0;
  const decidedAssets = totalAssets - decisionCounts.undecided;
  const decisionRate = totalAssets > 0 ? Math.round((decidedAssets / totalAssets) * 100) : 0;
  const locationRate = locationStats.needsLocation > 0
    ? Math.round((locationStats.filled / locationStats.needsLocation) * 100)
    : 100;

  // ワークフロー終端状況（API 24-04 workflowStatus）: 当該編集リストに紐づくRFQ/廃棄/移動が全て終端か
  const workflowStats = useMemo(() => {
    if (!targetList) return { total: 0, terminal: 0, open: 0 };
    const linked = rfqGroups.filter(g => g.editListId === targetList.id);
    const terminal = linked.filter(g => TERMINAL_STATUSES.has(g.status)).length;
    return { total: linked.length, terminal, open: linked.length - terminal };
  }, [rfqGroups, targetList]);

  // 原本登録状況（API 24-04 originalRegistrationStatus）: RFQ系ワークフローが原本登録(=RFQ完了)済みか。
  // 廃棄・移動ワークフローは原本登録対象外。
  const originalRegStats = useMemo(() => {
    if (!targetList) return { total: 0, registered: 0, pending: 0 };
    const rfqType = rfqGroups.filter(
      g => g.editListId === targetList.id && g.workflowType !== 'disposal' && g.workflowType !== 'transfer',
    );
    const registered = rfqType.filter(g => g.status === '完了').length;
    return { total: rfqType.length, registered, pending: rfqType.length - registered };
  }, [rfqGroups, targetList]);

  // 作業ロック残存（API 24-04/24-23: edit_list_work_locks）。本mockは作業ロック状態を保持しないため常に解消とみなす。
  const workLockActive = 0;

  const workflowRate = workflowStats.total > 0
    ? Math.round((workflowStats.terminal / workflowStats.total) * 100)
    : 100;
  const originalRate = originalRegStats.total > 0
    ? Math.round((originalRegStats.registered / originalRegStats.total) * 100)
    : 100;

  // クローズ不可理由（API 24-23 closeBlockers の5区分）
  const closeBlockers = useMemo(() => ([
    { key: 'undecided', label: '方針未決の資産', count: decisionCounts.undecided, toEditList: true },
    { key: 'location', label: '新設置場所未入力', count: locationStats.missing, toEditList: true },
    { key: 'workflow', label: '未終端のワークフロー（RFQ・廃棄・移動）', count: workflowStats.open, toEditList: false },
    { key: 'original', label: '原本登録未完了', count: originalRegStats.pending, toEditList: false },
    { key: 'lock', label: '編集リスト作業ロック残存', count: workLockActive, toEditList: false },
  ]), [decisionCounts.undecided, locationStats.missing, workflowStats.open, originalRegStats.pending]);

  const blockingItems = closeBlockers.filter(b => b.count > 0);

  // クローズ判定（API 24-23: 全closeBlockerが解消され、かつ対象資産が存在する場合のみ可）
  const canClose = totalAssets > 0 && blockingItems.length === 0;

  const handleClose = () => {
    if (!canClose) return;
    alert('リモデルクローズを実行します（モック）。\n個別部署マスタの旧→新切替が行われます。');
  };

  if (!targetList) {
    return (
      <div className="min-h-dvh flex flex-col bg-surface-screen">
        <Header title="リモデルダッシュボード" showBackButton backHref="/main" hideMenu />
        <div className="max-w-[1200px] mx-auto w-full p-5">
          <div className="bg-surface-card rounded-lg shadow-lg p-8 text-center">
            <p className="text-base text-content-primary mb-2 font-medium">リモデル編集リストが見つかりません</p>
            <p className="text-sm text-content-sub">
              リモデルモードの編集リストが存在しないか、URLパラメータの editListId が無効です。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      <Header
        title="リモデルダッシュボード"
        stepBadge="リモデル管理"
        showBackButton
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu
      />

      <div className="max-w-[1400px] mx-auto w-full p-5 flex flex-col gap-4">
        {/* プロジェクト概要 */}
        <div data-element-id="rd-project-overview" className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                  リモデル
                </span>
                <span className="text-sm text-content-sub">
                  {targetList.facilities.join(' / ')}
                </span>
              </div>
              <h2 data-element-id="rd-project-name" className="text-lg font-bold text-content-primary text-balance">{targetList.name}</h2>
              <p className="text-sm text-content-sub mt-1 text-pretty">
                対象資産すべてに方針決定・新設置場所入力・ワークフロー終端・原本登録が完了するとリモデルクローズ可能になります。
              </p>
            </div>
            <button
              data-element-id="rd-open-editlist-btn"
              onClick={() => router.push(`/remodel-application?listId=${targetList.id}`)}
              className="px-4 py-2 bg-content-primary hover:bg-content-primary text-white rounded-md font-medium text-sm transition-colors border-0 cursor-pointer whitespace-nowrap"
            >
              編集リストを開く
            </button>
          </div>

          {/* 全体進捗（API 24-04 dashboard 集計） */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div data-element-id="rd-stat-total" className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">対象資産</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{totalAssets}</div>
              <div className="text-xs text-content-sub mt-1">件</div>
            </div>
            <div data-element-id="rd-stat-decision" className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">方針決定</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{decidedAssets} <span className="text-sm text-content-sub">/ {totalAssets}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${decisionRate}%` }} />
              </div>
            </div>
            <div data-element-id="rd-stat-location" className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">新設置場所入力</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{locationStats.filled} <span className="text-sm text-content-sub">/ {locationStats.needsLocation}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${locationRate}%` }} />
              </div>
            </div>
            <div data-element-id="rd-stat-workflow" className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">ワークフロー終端</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{workflowStats.terminal} <span className="text-sm text-content-sub">/ {workflowStats.total}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${workflowRate}%` }} />
              </div>
            </div>
            <div data-element-id="rd-stat-original" className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">原本登録</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{originalRegStats.registered} <span className="text-sm text-content-sub">/ {originalRegStats.total}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${originalRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 方針別 */}
        <div data-element-id="rd-decision-breakdown" className="bg-surface-card rounded-lg shadow-sm border border-stroke-input overflow-hidden">
          <div className="px-5 py-3 border-b border-stroke-input">
            <h3 className="text-sm font-semibold text-content-primary">方針別 内訳</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-4">
            {(Object.keys(DECISION_LABEL) as DecisionKey[]).map(k => {
              const c = DECISION_COLOR[k];
              const count = decisionCounts[k];
              return (
                <div key={k} className={`${c.bg} border ${c.border} rounded-md p-3`}>
                  <div className={`text-xs font-medium ${c.text}`}>{DECISION_LABEL[k]}</div>
                  <div className={`text-xl font-bold ${c.text} tabular-nums`}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* クローズ不可理由（API 24-23 closeBlockers の5区分） */}
        <div data-element-id="rd-close-blockers" className="bg-surface-card rounded-lg shadow-sm border border-stroke-input overflow-hidden">
          <div className={`px-5 py-3 border-b border-stroke-input ${blockingItems.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <h3 className={`text-sm font-semibold ${blockingItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {blockingItems.length > 0
                ? `クローズ不可理由（${blockingItems.length}件）`
                : 'クローズ条件はすべて解消済み'}
            </h3>
          </div>
          <ul className="divide-y divide-[#E1E1E1]">
            {closeBlockers.map(b => {
              const blocking = b.count > 0;
              return (
                <li
                  key={b.key}
                  data-element-id={`rd-blocker-${b.key}`}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-content-primary flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${blocking ? 'bg-amber-500' : 'bg-emerald-500'}`} aria-hidden />
                    {b.label}:{' '}
                    <span className="tabular-nums font-bold">
                      {blocking ? `${b.count}件` : '解消'}
                    </span>
                  </span>
                  {blocking && b.toEditList && (
                    <button
                      onClick={() => router.push(`/remodel-application?listId=${targetList.id}`)}
                      className="px-3 py-1 bg-content-primary hover:bg-content-primary text-white rounded text-xs font-medium transition-colors border-0 cursor-pointer whitespace-nowrap"
                    >
                      編集リストで処理
                    </button>
                  )}
                  {blocking && !b.toEditList && b.key !== 'lock' && (
                    <button
                      onClick={() => router.push('/quotation-data-box/remodel-management')}
                      className="px-3 py-1 bg-content-primary hover:bg-content-primary text-white rounded text-xs font-medium transition-colors border-0 cursor-pointer whitespace-nowrap"
                    >
                      リモデル管理で処理
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* クローズ */}
        <div data-element-id="rd-close-section" className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-content-primary">リモデルクローズ</h3>
              <p className="text-xs text-content-sub mt-1 text-pretty">
                全資産の方針決定・新設置場所入力・ワークフロー終端・原本登録が完了するとクローズ可能になります。クローズすると個別部署マスタの旧→新切替が実行されます。
              </p>
            </div>
            <button
              data-element-id="rd-close-btn"
              onClick={handleClose}
              disabled={!canClose}
              title={canClose ? undefined : '上記のクローズ不可理由を解消してください'}
              className="px-5 py-2.5 bg-cta-primary hover:bg-cta-primary-dark disabled:bg-content-sub disabled:cursor-not-allowed text-white rounded-md font-semibold text-sm transition-colors border-0 cursor-pointer whitespace-nowrap"
            >
              {canClose ? 'リモデルをクローズ' : 'クローズ条件未達'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RemodelDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-surface-screen"><p className="text-sm text-content-sub">読み込み中...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}
