'use client';

import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

function OfflinePrepContent() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  // ダウンロードセクション
  const [downloadStatus, setDownloadStatus] = useState<'none' | 'downloading' | 'completed'>('completed');
  const [lastDownloadTime, setLastDownloadTime] = useState<string | null>('2025/06/02 10:30');
  const [facilityCount, setFacilityCount] = useState('125件');
  const [assetCount, setAssetCount] = useState('1,234件');

  // 送信セクション
  const [connectionStatus] = useState('オンライン');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>('2025/06/01 18:45');
  const [unsyncedCount, setUnsyncedCount] = useState(25);
  const [isOnline] = useState(true);

  const handleDownloadMaster = () => {
    setDownloadStatus('downloading');
    setTimeout(() => {
      setDownloadStatus('completed');
      setLastDownloadTime(new Date().toLocaleString('ja-JP'));
      setFacilityCount('125件');
      setAssetCount('1,234件');
    }, 2000);
  };

  const handleSyncData = () => {
    if (!isOnline) {
      alert('オフライン状態のため送信できません。オンラインに接続してください。');
      return;
    }
    alert('調査データを送信しました');
    setUnsyncedCount(0);
    setLastSyncTime(new Date().toLocaleString('ja-JP'));
  };

  const handleStartSurvey = () => {
    if (downloadStatus !== 'completed' && !isOnline) {
      alert('オフライン状態でデータがダウンロードされていません。先にデータをダウンロードしてください。');
      return;
    }
    router.push('/survey-location');
  };

  const handleClose = () => {
    router.push('/main');
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'none': return 'ー';
      case 'downloading': return 'ダウンロード中...';
      case 'completed': return '最新';
    }
  };

  // ダウンロードセクションのテーブルデータ
  const downloadTableData = [
    { label: '状態', value: getStatusText() },
    { label: '最終更新', value: lastDownloadTime || 'ー', tabular: true },
    { label: '施設', value: downloadStatus === 'completed' ? facilityCount : 'ー', tabular: true },
    { label: '資産', value: downloadStatus === 'completed' ? assetCount : 'ー', tabular: true },
  ];

  // 送信セクションのテーブルデータ
  const syncTableData = [
    { label: '接続状態', value: connectionStatus, color: isOnline ? 'text-[#27ae60]' : 'text-red-500' },
    { label: '最終送信', value: lastSyncTime || 'ー', tabular: true },
    { label: '未送信データ', value: `${unsyncedCount}件`, tabular: true, color: unsyncedCount > 0 ? 'text-red-500' : undefined },
  ];

  // テーブルコンポーネント（ヘッダー行+データ行、縦横罫線）
  const StatusTable = ({ data }: { data: { label: string; value: string; tabular?: boolean; color?: string }[] }) => (
    <div className="border border-[#e5e7eb] rounded-md overflow-hidden mb-4">
      {/* ヘッダー行 */}
      <div className="flex border-b border-[#e5e7eb]">
        {data.map((item, i) => (
          <div key={i} className={`flex-1 px-3 py-2 text-xs text-[#6b7280] ${i > 0 ? 'border-l border-[#e5e7eb]' : ''}`}>
            {item.label}
          </div>
        ))}
      </div>
      {/* データ行 */}
      <div className="flex">
        {data.map((item, i) => (
          <div key={i} className={`flex-1 px-3 py-2.5 text-sm font-semibold ${item.tabular ? 'tabular-nums' : ''} ${item.color || 'text-[#1f2937]'} ${i > 0 ? 'border-l border-[#e5e7eb]' : ''}`}>
            {item.value}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#f9fafb]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#e5e7eb] px-4 py-3">
        <div className="flex items-center justify-between max-w-[800px] mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="size-10 bg-[#27ae60] rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0">
              logo
            </div>
            <div className="text-sm font-bold text-[#1f2937] text-balance">
              HEALTHCARE 医療機器管理システム
            </div>
          </div>
          {isMobile && (
            <button
              onClick={handleClose}
              className="size-10 flex items-center justify-center text-[#6b7280] bg-transparent border-0 cursor-pointer"
              aria-label="閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <h1 className="text-lg font-bold text-[#1f2937] mb-4 text-balance">
          現有品調査：オフライン準備
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
          {/* マスタデータダウンロード */}
          <div className="pb-6 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">マスタデータダウンロード（オフライン用）</h2>
            <p className="text-xs text-[#6b7280] leading-relaxed mb-4 text-pretty">
              オフライン環境で調査を実施する場合は、事前にマスタデータをダウンロードしてください。ダウンロード後、タブレット/スマートフォンがオフラインでも調査画面の選択肢が表示されます。
            </p>

            <StatusTable data={downloadTableData} />

            <button
              onClick={handleDownloadMaster}
              disabled={downloadStatus === 'downloading'}
              className={`w-full py-2.5 text-sm font-bold rounded-md transition-colors ${
                downloadStatus === 'downloading'
                  ? 'text-[#9ca3af] bg-[#f3f4f6] border border-[#d1d5db] cursor-not-allowed'
                  : 'text-[#27ae60] bg-white border border-[#27ae60] cursor-pointer hover:bg-[#f0fdf4]'
              }`}
            >
              {downloadStatus === 'downloading' ? 'ダウンロード中...' : 'マスタデータをダウンロード'}
            </button>
          </div>

          {/* オフライン調査データ送信 */}
          <div className="pt-6">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">オフライン調査データ送信</h2>
            <p className="text-xs text-[#6b7280] leading-relaxed mb-4 text-pretty">
              オフライン環境で登録した調査データをシステムに送信します。送信前にオンライン環境に接続していることを確認してください。
            </p>

            <StatusTable data={syncTableData} />

            <button
              onClick={handleSyncData}
              className="w-full py-2.5 text-sm font-bold text-[#27ae60] bg-white border border-[#27ae60] rounded-md cursor-pointer hover:bg-[#f0fdf4] transition-colors"
            >
              調査データを送信
            </button>
          </div>
        </div>

        {/* 下部ボタン */}
        <div className={`mt-4 ${isMobile ? 'flex flex-col gap-3' : 'flex gap-3'}`}>
          <button
            onClick={handleClose}
            className={`${isMobile ? 'w-full order-2' : 'flex-1'} py-3 text-sm font-medium text-[#4b5563] bg-[#e5e7eb] border-0 rounded-md cursor-pointer hover:bg-[#d1d5db] transition-colors`}
          >
            閉じる
          </button>
          <button
            onClick={handleStartSurvey}
            className={`${isMobile ? 'w-full order-1' : 'flex-1'} py-3 text-sm font-bold text-[#27ae60] bg-white border border-[#27ae60] rounded-md cursor-pointer hover:bg-[#f0fdf4] transition-colors`}
          >
            調査を開始する
          </button>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-[#9ca3af]">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>
    </div>
  );
}

export default function OfflinePrepPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-[#9ca3af]">読み込み中...</div>}>
      <OfflinePrepContent />
    </Suspense>
  );
}
