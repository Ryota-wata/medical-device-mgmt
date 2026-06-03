'use client';

// SHIP代理見積依頼 一覧画面 (2026-06-03 新規要求)
// 病院から SHIP に「見積書をアップロード→OCR〜見積DB登録までを代行依頼」された案件を一覧表示。
// SHIP代理見積ユーザーが行クリックで OCR 確認画面に遷移して代行作業を進める。

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, FileText } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useShipProxyQuotationStore } from '@/lib/stores/shipProxyQuotationStore';
import { ShipProxyQuotationStatus } from '@/lib/types/shipProxyQuotation';

const STATUS_STYLES: Record<ShipProxyQuotationStatus, { bg: string; color: string; border: string }> = {
  '依頼中':      { bg: '#FFF4E5', color: '#B45309', border: '#FCD9A1' },
  'SHIP作業中':  { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  '完了':        { bg: '#EBF5EE', color: '#146E2E', border: '#A7D8B2' },
  '差戻':        { bg: '#FDF1E5', color: '#DA0000', border: '#FDA3A3' },
};

export default function ShipProxyQuotationListPage() {
  const router = useRouter();
  const { requests, updateStatus } = useShipProxyQuotationStore();

  const [filterStatus, setFilterStatus] = useState<ShipProxyQuotationStatus | 'all'>('依頼中');
  const [filterHospital, setFilterHospital] = useState<string>('');

  const hospitalOptions = useMemo(
    () => Array.from(new Set(requests.map((r) => r.hospitalName))).sort(),
    [requests],
  );

  const filtered = useMemo(() => {
    return requests
      .filter((r) => filterStatus === 'all' || r.status === filterStatus)
      .filter((r) => !filterHospital || r.hospitalName === filterHospital)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [requests, filterStatus, filterHospital]);

  const counts = useMemo(() => ({
    '依頼中': requests.filter((r) => r.status === '依頼中').length,
    'SHIP作業中': requests.filter((r) => r.status === 'SHIP作業中').length,
    '完了': requests.filter((r) => r.status === '完了').length,
    '差戻': requests.filter((r) => r.status === '差戻').length,
  }), [requests]);

  const handleStartWork = (id: string) => {
    updateStatus(id, 'SHIP作業中', { shipUserName: 'SHIP代理 (自分)' });
    router.push(`/quotation-data-box/ocr-confirm?spqId=${id}`);
  };

  const handleResumeWork = (id: string) => {
    router.push(`/quotation-data-box/ocr-confirm?spqId=${id}`);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="見積代行依頼一覧"
        hideMenu={true}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
      />

      <main className="flex-1 px-6 py-4 overflow-y-auto">
        {/* 説明バナー */}
        <div className="mb-4 px-4 py-3 rounded-lg bg-surface-select border border-cta-primary text-sm text-cta-primary-dark text-pretty">
          <strong>SHIP代理見積ユーザー向け画面</strong> — 各施設から代行依頼された見積書を一覧。行をクリックして OCR 確認画面で代行作業を進めます。
        </div>

        {/* ステータスフィルター (件数バッジ統合) */}
        <div className="flex flex-wrap gap-2 mb-4 tabular-nums">
          {(['依頼中', 'SHIP作業中', '完了', '差戻'] as const).map((st) => {
            const sty = STATUS_STYLES[st];
            const active = filterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                aria-pressed={active}
                style={{
                  background: sty.bg,
                  color: sty.color,
                  border: `1px solid ${sty.border}`,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: active ? `0 0 0 2px ${sty.color}` : 'none',
                }}
              >
                {st} <span style={{ marginLeft: '6px', fontWeight: 700 }}>{counts[st]}</span> 件
              </button>
            );
          })}
        </div>

        {/* 施設フィルター */}
        <div className="mb-4 flex items-center gap-3 text-sm">
          <label className="text-content-sub">施設:</label>
          <select
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            className="h-9 px-3 rounded-md border border-stroke-input bg-surface-card text-content-primary"
          >
            <option value="">全施設</option>
            {hospitalOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* リスト */}
        {filtered.length === 0 ? (
          <div className="bg-surface-card border border-stroke-card rounded-2xl p-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-content-sub" aria-hidden />
            <p className="text-sm font-semibold text-content-primary mb-1 text-balance">該当する依頼はありません</p>
            <p className="text-xs text-content-sub">フィルター条件を変更してください。</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-stroke-card rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-stroke-card border-b border-stroke-input text-left">
                  <th className="px-3 py-2 font-semibold text-content-primary w-[160px]">依頼No.</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[160px]">施設名</th>
                  <th className="px-3 py-2 font-semibold text-content-primary">見積G名称</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[200px]">添付ファイル</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[120px]">申請者</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[110px]">見積フェーズ</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[110px] tabular-nums">登録期限</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[110px]">ステータス</th>
                  <th className="px-3 py-2 font-semibold text-content-primary w-[110px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const sty = STATUS_STYLES[r.status];
                  return (
                    <tr key={r.id} className="border-b border-stroke-input last:border-b-0 hover:bg-surface-select">
                      <td className="px-3 py-2 text-content-primary tabular-nums">{r.requestNo}</td>
                      <td className="px-3 py-2 text-content-primary">{r.hospitalName}</td>
                      <td className="px-3 py-2 text-content-primary">{r.rfqGroupName}</td>
                      <td className="px-3 py-2 text-content-primary">
                        <span className="inline-flex items-center gap-1">
                          <FileText size={14} aria-hidden />
                          <span className="truncate max-w-[180px]" title={r.attachedFileName}>{r.attachedFileName}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-content-primary">{r.applicantName}</td>
                      <td className="px-3 py-2 text-content-primary text-xs">{r.quotationPhase}</td>
                      <td className="px-3 py-2 text-content-primary tabular-nums">{r.registrationDeadline ?? '-'}</td>
                      <td className="px-3 py-2">
                        <span
                          style={{
                            background: sty.bg,
                            color: sty.color,
                            border: `1px solid ${sty.border}`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.status === '依頼中' && (
                          <button
                            onClick={() => handleStartWork(r.id)}
                            className="px-3 py-1 rounded bg-cta-primary text-white text-xs font-semibold cursor-pointer hover:bg-cta-primary-dark"
                          >
                            作業開始
                          </button>
                        )}
                        {r.status === 'SHIP作業中' && (
                          <button
                            onClick={() => handleResumeWork(r.id)}
                            className="px-3 py-1 rounded bg-[#087CB6] text-white text-xs font-semibold cursor-pointer hover:opacity-90"
                          >
                            OCR画面へ
                          </button>
                        )}
                        {r.status === '完了' && (
                          <span className="text-xs text-content-sub">{r.completedAt?.split('T')[0]} 完了</span>
                        )}
                        {r.status === '差戻' && (
                          <span className="text-xs text-content-alert" title={r.rejectReason}>差戻済</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
