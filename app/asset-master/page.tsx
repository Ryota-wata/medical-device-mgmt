'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AssetMaster } from '@/lib/types/master';
import { useMasterStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function AssetMasterContent() {
  const searchParams = useSearchParams();
  const isSimpleMode = searchParams.get('mode') === 'simple';
  const { assets: assetMasters } = useMasterStore();
  const { isMobile } = useResponsive();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState({
    globalSearch: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    maker: '',
    model: ''
  });

  // マスタデータからフィルターoptionsを生成（資産マスタから）
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean);
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean);
  }, [assetMasters]);

  const itemOptions = useMemo(() => {
    const uniqueItems = Array.from(new Set(assetMasters.map(a => a.item)));
    return uniqueItems.filter(Boolean);
  }, [assetMasters]);

  const makerOptions = useMemo(() => {
    const uniqueMakers = Array.from(new Set(assetMasters.map(a => a.maker)));
    return uniqueMakers.filter(Boolean);
  }, [assetMasters]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(new Set(assetMasters.map(a => a.model)));
    return uniqueModels.filter(Boolean);
  }, [assetMasters]);

  // フィルタリングされた資産
  const filteredAssets = useMemo(() => {
    let filtered = assetMasters;

    // 全体検索（曖昧検索）
    if (filters.globalSearch) {
      const searchTerm = filters.globalSearch.toLowerCase();
      filtered = filtered.filter(a =>
        (a.category?.toLowerCase() || '').includes(searchTerm) ||
        (a.largeClass?.toLowerCase() || '').includes(searchTerm) ||
        (a.mediumClass?.toLowerCase() || '').includes(searchTerm) ||
        (a.item?.toLowerCase() || '').includes(searchTerm) ||
        (a.maker?.toLowerCase() || '').includes(searchTerm) ||
        (a.model?.toLowerCase() || '').includes(searchTerm) ||
        (a.id?.toLowerCase() || '').includes(searchTerm)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(a => a.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(a => a.mediumClass === filters.mediumClass);
    }
    if (filters.item) {
      filtered = filtered.filter(a => a.item === filters.item);
    }
    if (filters.maker) {
      filtered = filtered.filter(a => a.maker === filters.maker);
    }
    if (filters.model) {
      filtered = filtered.filter(a => a.model === filters.model);
    }

    return filtered;
  }, [assetMasters, filters]);

  // 選択した資産を取得
  const selectedAsset = useMemo(() => {
    return assetMasters.find(asset => asset.id === selectedAssetId) || null;
  }, [assetMasters, selectedAssetId]);

  // 選択した資産を親ウィンドウに渡す（全カラム送信）
  const handleConfirmSelection = () => {
    if (!selectedAsset) {
      alert('資産を選択してください');
      return;
    }

    const assetData = {
      id: selectedAsset.id,
      category: selectedAsset.category,
      largeClass: selectedAsset.largeClass,
      mediumClass: selectedAsset.mediumClass,
      item: selectedAsset.item,
      maker: selectedAsset.maker,
      model: selectedAsset.model
    };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        assets: [assetData],
        scope: 'all'
      }, window.location.origin);
      window.close();
    } else {
      alert('親ウィンドウが見つかりません');
    }
  };

  // シンプルモード用: 選択した資産をそのまま送信
  const handleSimpleSelection = () => {
    if (!selectedAsset) {
      alert('資産を選択してください');
      return;
    }

    const assetData = {
      id: selectedAsset.id,
      category: selectedAsset.category,
      largeClass: selectedAsset.largeClass,
      mediumClass: selectedAsset.mediumClass,
      item: selectedAsset.item,
      maker: selectedAsset.maker,
      model: selectedAsset.model
    };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        assets: [assetData]
      }, window.location.origin);
      window.close();
    } else {
      alert('親ウィンドウが見つかりません');
    }
  };

  return (
    <div className="min-h-dvh bg-[#f9fafb] flex flex-col">
      {/* ヘッダー */}
      <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-5 py-3 flex items-center gap-3 shadow-sm">
        <span className="text-[#6b7280] text-lg cursor-pointer select-none">&lt;</span>
        <h1 className="text-lg md:text-xl font-bold text-[#1f2937] m-0 text-balance">
          資産マスタ選択
        </h1>
      </div>

      {/* フィルターヘッダー */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-[#e5e7eb] p-4">
        {/* 全体検索 */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-[#1f2937] mb-1">
            全体検索
          </label>
          <input
            type="text"
            value={filters.globalSearch || ''}
            onChange={(e) => setFilters({...filters, globalSearch: e.target.value})}
            placeholder="キーワードを入力（全カラムから曖昧検索）"
            className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#27ae60]/30 focus:border-[#27ae60] box-border"
          />
        </div>
        {/* 個別フィルター */}
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={categoryOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={largeClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={mediumClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="個体管理品目"
              value={filters.item}
              onChange={(value) => setFilters({...filters, item: value})}
              options={itemOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="メーカー"
              value={filters.maker}
              onChange={(value) => setFilters({...filters, maker: value})}
              options={makerOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <SearchableSelect
              label="型式"
              value={filters.model}
              onChange={(value) => setFilters({...filters, model: value})}
              options={modelOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <button
            onClick={() => setFilters({
              globalSearch: '',
              category: '',
              largeClass: '',
              mediumClass: '',
              item: '',
              maker: '',
              model: ''
            })}
            className="px-4 py-2 bg-[#1f2937] text-white border-none rounded-lg text-[13px] cursor-pointer whitespace-nowrap hover:bg-[#374151] transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      {/* アクションバー */}
      <div className="bg-white mx-4 mt-3 rounded-lg border border-[#e5e7eb] px-4 py-3 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {isSimpleMode ? (
            // シンプルモード: 選択ボタンのみ
            <>
              <button
                onClick={handleSimpleSelection}
                disabled={!selectedAssetId}
                className={`px-3 py-2 md:px-5 md:py-2.5 text-white border-none rounded-lg text-xs md:text-sm font-bold transition-colors ${
                  !selectedAssetId
                    ? 'bg-[#bdc3c7] cursor-not-allowed'
                    : 'bg-[#27ae60] cursor-pointer'
                }`}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#229954';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#27ae60';
                  }
                }}
              >
                選択
              </button>
              <button
                onClick={() => window.close()}
                className="px-3 py-2 md:px-5 md:py-2.5 bg-[#95a5a6] text-white border-none rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#95a5a6';
                }}
              >
                キャンセル
              </button>
            </>
          ) : (
            // 通常モード: 確定 + キャンセル
            <>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedAssetId}
                className={`px-3 py-2 md:px-5 md:py-2.5 text-white border-none rounded-lg text-xs md:text-sm font-bold transition-colors ${
                  !selectedAssetId
                    ? 'bg-[#bdc3c7] cursor-not-allowed'
                    : 'bg-[#27ae60] cursor-pointer'
                }`}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#229954';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#27ae60';
                  }
                }}
              >
                確定
              </button>
              <button
                onClick={() => window.close()}
                className="px-3 py-2 md:px-5 md:py-2.5 bg-[#95a5a6] text-white border-none rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#95a5a6';
                }}
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>

      {/* 資産テーブル */}
      <div className="flex-1 bg-white mx-4 mt-3 mb-4 rounded-lg border border-[#e5e7eb] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse text-xs md:text-sm">
            <thead className="bg-[#f9fafb] sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-center font-semibold text-[#6b7280] text-xs w-[50px] border-b border-[#e5e7eb]">
                  選択
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[60px]">
                  No.
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[100px]">
                  Category
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[150px]">
                  大分類
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[150px]">
                  中分類
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[200px]">
                  個体管理品目
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[150px]">
                  メーカー
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#6b7280] text-xs border-b border-[#e5e7eb] min-w-[150px]">
                  型式
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className={`border-b border-[#e5e7eb] cursor-pointer transition-colors ${
                    selectedAssetId === asset.id
                      ? 'bg-[#d5f4e6]'
                      : index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'
                  }`}
                  onClick={() => setSelectedAssetId(asset.id)}
                  onMouseEnter={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = '#e8f4f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb';
                    }
                  }}
                >
                  <td
                    className="px-2 py-2.5 md:px-3 md:py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name="assetSelection"
                      checked={selectedAssetId === asset.id}
                      onChange={() => setSelectedAssetId(asset.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer w-4 h-4 accent-[#27ae60]"
                    />
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937] tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.category}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.largeClass}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.mediumClass}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.item}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.maker}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#1f2937]">
                    {asset.model}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="py-10 text-center text-[#6b7280] text-sm md:text-base">
            該当する資産がありません
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetMasterPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AssetMasterContent />
    </Suspense>
  );
}
