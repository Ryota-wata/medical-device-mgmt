'use client';

// REQ-064: モバイル端末での検収準備完了分の遷移
// 業者検収専用権限ログインを想定したモバイル向け 発注グループ選択画面。
// status='納期確定' (=納品済で検収待ち) の発注グループを一覧表示し、
// タップで既存の納品検収登録画面に遷移する。

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';

export default function InspectionMobilePage() {
  const router = useRouter();
  const { rfqGroups } = useRfqGroupStore();

  // 検収準備完了 = 納期確定 ステータスを抽出
  const inspectionReadyGroups = useMemo(
    () => rfqGroups.filter((g) => g.status === '納期確定'),
    [rfqGroups],
  );

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="モバイル検収"
        hideMenu={true}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
      />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="mb-4 px-3 py-3 rounded-lg bg-surface-select border border-cta-primary text-xs text-cta-primary-dark text-pretty">
          検収準備が完了した発注グループを選択して納品検収登録に進みます。
        </div>

        {inspectionReadyGroups.length === 0 ? (
          <div className="bg-surface-card border border-stroke-card rounded-2xl p-8 text-center">
            <ClipboardCheck size={32} className="mx-auto mb-3 text-content-sub" aria-hidden />
            <p className="text-sm font-semibold text-content-primary mb-2 text-balance">
              検収準備完了の発注グループはありません
            </p>
            <p className="text-xs text-content-sub text-pretty">
              発注後、納期が確定した案件のみここに表示されます。
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="検収準備完了の発注グループ一覧">
            {inspectionReadyGroups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() =>
                    router.push(
                      `/quotation-data-box/inspection-registration?rfqGroupId=${group.id}`,
                    )
                  }
                  className="w-full min-h-[88px] bg-surface-card border border-stroke-card rounded-xl p-4 text-left cursor-pointer transition-colors hover:bg-surface-select focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-content-sub mb-1 tabular-nums">{group.rfqNo}</p>
                    <p className="text-sm font-semibold text-content-primary mb-1 truncate">
                      {group.groupName}
                    </p>
                    <p className="text-xs text-content-sub truncate">
                      {group.vendorName ?? '---'}
                      {group.deliveryDeadline ? (
                        <span className="ml-2 tabular-nums">
                          納入年月日: {group.deliveryDeadline}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight size={20} className="shrink-0 text-content-sub" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
