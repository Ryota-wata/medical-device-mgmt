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
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col">
      {/* ヘッダー */}
      <div className="bg-[#FAFAFA] border-b border-[#E1E1E1] px-5 py-3 flex items-center gap-3 shadow-sm">
        <span className="text-[#8A8A8A] text-lg cursor-pointer select-none">&lt;</span>
        <h1 className="text-lg md:text-xl font-bold text-[#4A4A4A] m-0 text-balance">
          資産マスタ選択
        </h1>
      </div>

      {/* フィルターヘッダー */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-[#E1E1E1] p-4">
        {/* 全体検索 */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
            全体検索
          </label>
          <input
            type="text"
            value={filters.globalSearch || ''}
            onChange={(e) => setFilters({...filters, globalSearch: e.target.value})}
            placeholder="キーワードを入力（全カラムから曖昧検索）"
            className="w-full px-3 py-2.5 border border-[#E1E1E1] rounded-lg text-sm text-[#4A4A4A] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#008C1D]/30 focus:border-[#008C1D] box-border"
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
            className="px-4 py-2 bg-[#4A4A4A] text-white border-none rounded-lg text-[13px] cursor-pointer whitespace-nowrap hover:bg-[#4A4A4A] transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      {/* アクションバー */}
      <div className="bg-white mx-4 mt-3 rounded-lg border border-[#E1E1E1] px-4 py-3 flex justify-between items-center flex-wrap gap-3">
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
                    : 'bg-[#008C1D] cursor-pointer'
                }`}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#0A6B17';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#008C1D';
                  }
                }}
              >
                選択
              </button>
              <button
                onClick={() => window.close()}
                className="px-3 py-2 md:px-5 md:py-2.5 bg-[#8A8A8A] text-white border-none rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#8A8A8A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#8A8A8A';
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
                    : 'bg-[#008C1D] cursor-pointer'
                }`}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#0A6B17';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#008C1D';
                  }
                }}
              >
                確定
              </button>
              <button
                onClick={() => window.close()}
                className="px-3 py-2 md:px-5 md:py-2.5 bg-[#8A8A8A] text-white border-none rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#8A8A8A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#8A8A8A';
                }}
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>

      {/* 資産テーブル */}
      <div className="flex-1 bg-white mx-4 mt-3 mb-4 rounded-lg border border-[#E1E1E1] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse text-xs md:text-sm">
            <thead className="bg-[#FAFAFA] sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-center font-semibold text-[#8A8A8A] text-xs w-[50px] border-b border-[#E1E1E1]">
                  選択
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[60px]">
                  No.
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[100px]">
                  Category
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[150px]">
                  大分類
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[150px]">
                  中分類
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[200px]">
                  個体管理品目
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[150px]">
                  メーカー
                </th>
                <th className="px-2 py-2.5 md:px-3 md:py-3 text-left font-semibold text-[#8A8A8A] text-xs border-b border-[#E1E1E1] min-w-[150px]">
                  型式
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className={`border-b border-[#E1E1E1] cursor-pointer transition-colors ${
                    selectedAssetId === asset.id
                      ? 'bg-[#d5f4e6]'
                      : index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                  }`}
                  onClick={() => setSelectedAssetId(asset.id)}
                  onMouseEnter={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = '#e8f4f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#FAFAFA';
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
                      className="cursor-pointer w-4 h-4 accent-[#008C1D]"
                    />
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A] tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.category}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.largeClass}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.mediumClass}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.item}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.maker}
                  </td>
                  <td className="px-2 py-2.5 md:px-3 md:py-3 text-[#4A4A4A]">
                    {asset.model}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="py-10 text-center text-[#8A8A8A] text-sm md:text-base">
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
