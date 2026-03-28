'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

// 貸出種別と対象機種の型
interface LendingCategory {
  id: string;
  name: string;
  devices: LendingDevice[];
}

interface LendingDevice {
  id: string;
  name: string;
  availableCount: number;
}

// モックデータ
const MOCK_CATEGORIES: LendingCategory[] = [
  {
    id: 'pump',
    name: 'ポンプ関連',
    devices: [
      { id: 'infusion-pump', name: '輸液ポンプ', availableCount: 5 },
      { id: 'syringe-pump', name: 'シリンジポンプ', availableCount: 3 },
      { id: 'pca-pump', name: 'PCAポンプ', availableCount: 4 },
    ],
  },
  {
    id: 'transport',
    name: '搬入搬出',
    devices: [
      { id: 'stretcher', name: 'ストレッチャー', availableCount: 6 },
      { id: 'wheelchair', name: '車椅子', availableCount: 8 },
    ],
  },
  {
    id: 'monitor',
    name: 'モニター関連',
    devices: [
      { id: 'bedside-monitor', name: 'ベッドサイドモニター', availableCount: 4 },
      { id: 'ecg', name: '心電計', availableCount: 6 },
      { id: 'spo2', name: 'パルスオキシメーター', availableCount: 15 },
    ],
  },
  {
    id: 'life-support',
    name: '生命維持関連装置',
    devices: [
      { id: 'ventilator', name: '人工呼吸器', availableCount: 2 },
      { id: 'defibrillator', name: '除細動器', availableCount: 3 },
    ],
  },
];

export default function LendingAvailablePage() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('pump');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('infusion-pump');

  // 選択されたカテゴリ
  const selectedCategory = useMemo(() => {
    return MOCK_CATEGORIES.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  // 選択された機器
  const selectedDevice = useMemo(() => {
    return selectedCategory?.devices.find(d => d.id === selectedDeviceId);
  }, [selectedCategory, selectedDeviceId]);

  // カテゴリの貸出可能合計
  const categoryTotal = useMemo(() => {
    if (!selectedCategory) return 0;
    return selectedCategory.devices.reduce((sum, d) => sum + d.availableCount, 0);
  }, [selectedCategory]);

  // カテゴリ変更時
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = MOCK_CATEGORIES.find(c => c.id === categoryId);
    if (cat && cat.devices.length > 0) {
      setSelectedDeviceId(cat.devices[0].id);
    } else {
      setSelectedDeviceId('');
    }
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
          {/* 貸出種別名 */}
          <div className="pb-6 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">貸出種別名</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {MOCK_CATEGORIES.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <input
                    type="radio"
                    name="lending-category"
                    value={category.id}
                    checked={selectedCategoryId === category.id}
                    onChange={() => handleCategoryChange(category.id)}
                    className="size-4 accent-[#27ae60] cursor-pointer"
                  />
                  <span className={`text-sm ${selectedCategoryId === category.id ? 'font-semibold text-[#1f2937]' : 'text-[#4b5563]'}`}>
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 貸出可能対象機種 */}
          <div className="py-6 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">貸出可能対象機種</h2>
            {selectedCategory ? (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {selectedCategory.devices.map(device => (
                  <label
                    key={device.id}
                    className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <input
                      type="radio"
                      name="lending-device"
                      value={device.id}
                      checked={selectedDeviceId === device.id}
                      onChange={() => setSelectedDeviceId(device.id)}
                      className="size-4 accent-[#27ae60] cursor-pointer"
                    />
                    <span className={`text-sm ${selectedDeviceId === device.id ? 'font-semibold text-[#1f2937]' : 'text-[#4b5563]'}`}>
                      {device.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9ca3af]">貸出種別名を選択してください</p>
            )}
          </div>

          {/* 貸出可能合計 */}
          <div className="pt-6 pb-6">
            <h2 className="text-sm font-bold text-[#1f2937] mb-3">貸出可能合計</h2>
            {selectedDevice ? (
              <div>
                <p className="text-sm font-bold text-[#27ae60] mb-3">{selectedDevice.name}</p>
                <div className="flex flex-col mb-4">
                  {selectedCategory?.devices.map(device => (
                    <div key={device.id} className="flex items-baseline justify-between gap-2 py-2 border-b border-[#e5e7eb] min-w-[140px]">
                      <span className="text-sm text-[#4b5563]">{device.name}</span>
                      <span className="text-sm font-semibold text-[#1f2937] tabular-nums">{device.availableCount} 台</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#1f2937]">合計</span>
                  <span className="text-2xl font-bold text-[#27ae60] tabular-nums">{categoryTotal}</span>
                  <span className="text-sm text-[#4b5563]">台</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500">選択した条件に在庫がありません</p>
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
