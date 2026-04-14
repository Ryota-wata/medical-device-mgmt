'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useLendingStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function LendingAvailablePage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { devices } = useLendingStore();

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  // 貸出グループ名の一覧（重複排除）
  const groupNames = useMemo(() => {
    return [...new Set(devices.map(d => d.lendingGroupName).filter(Boolean))];
  }, [devices]);

  // 選択グループ内の機種名一覧（重複排除）
  const deviceNames = useMemo(() => {
    if (!selectedGroup) return [];
    return [...new Set(
      devices
        .filter(d => d.lendingGroupName === selectedGroup)
        .map(d => d.itemName)
        .filter(Boolean)
    )];
  }, [devices, selectedGroup]);

  // 選択グループ内の機種別台数集計
  const deviceCounts = useMemo(() => {
    if (!selectedGroup) return [];
    const grouped = devices
      .filter(d => d.lendingGroupName === selectedGroup)
      .reduce<Record<string, { total: number; available: number }>>((acc, d) => {
        if (!acc[d.itemName]) {
          acc[d.itemName] = { total: 0, available: 0 };
        }
        acc[d.itemName].total += 1;
        if (d.status === '貸出可' || d.status === '待機中') {
          acc[d.itemName].available += 1;
        }
        return acc;
      }, {});
    return Object.entries(grouped).map(([name, counts]) => ({
      name,
      ...counts,
    }));
  }, [devices, selectedGroup]);

  // 選択機種の台数
  const selectedDeviceCounts = useMemo(() => {
    return deviceCounts.find(d => d.name === selectedDevice);
  }, [deviceCounts, selectedDevice]);

  // グループ全体の貸出可能合計
  const groupAvailableTotal = useMemo(() => {
    return deviceCounts.reduce((sum, d) => sum + d.available, 0);
  }, [deviceCounts]);

  // グループ変更時：機種選択をクリア
  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    setSelectedDevice('');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9fafb]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#e5e7eb] px-4 py-3">
        <div className="flex items-center gap-2.5 max-w-[800px] mx-auto">
          <div className="size-10 bg-[#27ae60] rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0">
            logo
          </div>
          <div className="text-base font-bold text-[#1f2937] text-balance">
            貸出可能機器閲覧
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
          {/* 貸出グループ */}
          <div className="pb-6 border-b border-[#e5e7eb]">
            <div style={{ maxWidth: '320px' }}>
              <SearchableSelect
                label="貸出グループ"
                value={selectedGroup}
                onChange={handleGroupChange}
                options={groupNames}
                placeholder="グループを選択"
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* 貸出可能対象機種 */}
          <div className="py-6 border-b border-[#e5e7eb]">
            <div style={{ maxWidth: '320px' }}>
              <SearchableSelect
                label="貸出可能対象機種"
                value={selectedDevice}
                onChange={setSelectedDevice}
                options={deviceNames}
                placeholder={selectedGroup ? '機種を選択' : 'グループを先に選択してください'}
                disabled={!selectedGroup}
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* 貸出可能合計 */}
          <div className="pt-6 pb-6">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">貸出可能状況</h2>
            {selectedGroup && deviceCounts.length > 0 ? (
              <div>
                {selectedDevice && selectedDeviceCounts ? (
                  <p className="text-sm font-bold text-[#27ae60] mb-3">
                    {selectedDevice}：貸出可能 {selectedDeviceCounts.available} 台 / 全 {selectedDeviceCounts.total} 台
                  </p>
                ) : null}
                <div className="flex flex-col mb-4">
                  {deviceCounts.map(device => (
                    <div
                      key={device.name}
                      className={`flex items-baseline justify-between gap-2 py-2 border-b border-[#e5e7eb] min-w-[140px] ${
                        selectedDevice === device.name ? 'bg-[#f0fdf4]' : ''
                      }`}
                    >
                      <span className="text-sm text-[#4b5563]">{device.name}</span>
                      <span className="text-sm font-semibold text-[#1f2937] tabular-nums">
                        {device.available} / {device.total} 台
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#1f2937]">貸出可能合計</span>
                  <span className="text-2xl font-bold text-[#27ae60] tabular-nums">{groupAvailableTotal}</span>
                  <span className="text-sm text-[#4b5563]">台</span>
                </div>
              </div>
            ) : selectedGroup ? (
              <p className="text-sm text-[#9ca3af]">このグループに登録された機器はありません</p>
            ) : (
              <p className="text-sm text-[#9ca3af]">貸出グループを選択すると、機器の貸出可能状況が表示されます</p>
            )}
          </div>

          {/* 戻るボタン */}
          <div>
            <button
              onClick={() => router.push('/main')}
              className="px-8 py-2.5 bg-[#e5e7eb] text-sm font-medium text-[#4b5563] rounded-md border-0 cursor-pointer hover:bg-[#d1d5db] transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-[#9ca3af]">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>
    </div>
  );
}
