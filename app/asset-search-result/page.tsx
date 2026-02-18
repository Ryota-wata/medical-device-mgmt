'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts';
import { useAssetStore, useMasterStore, useApplicationStore } from '@/lib/stores';
import { Asset, Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { TransferApplicationModal } from '@/components/ui/TransferApplicationModal';
import { DisposalApplicationModal } from '@/components/ui/DisposalApplicationModal';
import { BorrowingApplicationModal } from '@/components/ui/BorrowingApplicationModal';
import { PurchaseApplicationModal } from '@/components/ui/PurchaseApplicationModal';
import { UpdateApplicationModal } from '@/components/ui/UpdateApplicationModal';
import { AdditionApplicationModal } from '@/components/ui/AdditionApplicationModal';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { ASSET_COLUMNS, type ColumnDef } from '@/lib/constants/assetColumns';

const ALL_COLUMNS = ASSET_COLUMNS;

export default function AssetSearchResultPage() {
  const router = useRouter();
  const { assets } = useAssetStore();
  const { addApplication } = useApplicationStore();
  const { isMobile } = useResponsive();
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 移動申請モーダル関連の状態
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 廃棄申請モーダル関連の状態
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);

  // 借用申請モーダル関連の状態
  const [isBorrowingModalOpen, setIsBorrowingModalOpen] = useState(false);

  // 購入申請モーダル関連の状態
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // 更新申請モーダル関連の状態
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // 増設申請モーダル関連の状態
  const [isAdditionModalOpen, setIsAdditionModalOpen] = useState(false);

  // モックデータ（実際のデータは useAssetStore から取得）
  const [mockAssets] = useState<Asset[]>([
    {
      qrCode: 'QR-2025-0001',
      no: 1,
      facility: '〇〇〇〇〇〇病院',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: '電気メス 双極',
      item: '手術台',
      name: '電気手術用電源装置2システム',
      maker: '医療',
      model: 'EW11 超音波吸引器',
      quantity: 1,
      width: 520,
      depth: 480,
      height: 1400,
      assetNo: '10605379-000',
      managementNo: '1338',
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: '手術室A',
      installationLocation: '手術室A-中央',
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: 'SN-2024-001',
      contractName: '医療機器購入契約2024-01',
      contractNo: 'C-2024-0001',
      quotationNo: 'Q-2024-0001',
      contractDate: '2024-01-10',
      deliveryDate: '2024-01-20',
      inspectionDate: '2024-01-25',
      lease: 'なし',
      rental: 'なし',
      leaseStartDate: '',
      leaseEndDate: '',
      acquisitionCost: 15000000,
      legalServiceLife: '6年',
      recommendedServiceLife: '8年',
      endOfService: '2032-12-31',
      endOfSupport: '2035-12-31',
    },
    ...Array.from({length: 19}, (_, i) => ({
      qrCode: `QR-2025-${String(i + 2).padStart(4, '0')}`,
      no: i + 2,
      facility: '〇〇〇〇〇〇病院',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: 'CT関連',
      item: `品目${i + 2}`,
      name: `サンプル製品${i + 2}`,
      maker: '医療機器',
      model: `MODEL-${i + 2}`,
      quantity: 1,
      width: 500 + i * 10,
      depth: 600 + i * 10,
      height: 700 + i * 10,
      assetNo: `10605379-${String(i + 1).padStart(3, '0')}`,
      managementNo: `${1338 + i + 1}`,
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: `手術室${String.fromCharCode(66 + i)}`,
      installationLocation: `手術室${String.fromCharCode(66 + i)}-中央`,
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: `SN-2024-${String(i + 2).padStart(3, '0')}`,
      contractName: `医療機器購入契約2024-${String(i + 2).padStart(2, '0')}`,
      contractNo: `C-2024-${String(i + 2).padStart(4, '0')}`,
      quotationNo: `Q-2024-${String(i + 2).padStart(4, '0')}`,
      contractDate: '2024-01-10',
      deliveryDate: '2024-01-20',
      inspectionDate: '2024-01-25',
      lease: i % 3 === 0 ? 'あり' : 'なし',
      rental: i % 5 === 0 ? 'あり' : 'なし',
      leaseStartDate: i % 3 === 0 ? '2024-01-01' : '',
      leaseEndDate: i % 3 === 0 ? '2029-12-31' : '',
      acquisitionCost: 1000000 * (i + 2),
      legalServiceLife: '6年',
      recommendedServiceLife: '8年',
      endOfService: '2032-12-31',
      endOfSupport: '2035-12-31',
    }))
  ]);

  // useAssetFilterフックを使用
  const {
    filters,
    setFilters,
    filteredAssets,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
    itemOptions,
  } = useAssetFilter(mockAssets);

  // useAssetTableフックを使用
  const {
    visibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  } = useAssetTable(ALL_COLUMNS);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map(a => a.no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (no: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(no)) {
      newSelected.delete(no);
    } else {
      newSelected.add(no);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}&from=asset-search`);
  };

  // 新規申請ボタンのクリックハンドラー
  const handleNewApplication = () => {
    setIsPurchaseModalOpen(true);
  };

  // 更新申請ボタンのクリックハンドラー
  const handleUpdateApplication = () => {
    if (selectedItems.size === 0) {
      alert('更新申請する資産を選択してください');
      return;
    }
    if (selectedItems.size > 1) {
      alert('更新申請は1台ずつ行ってください。\n資産を1件だけ選択してください。');
      return;
    }
    setIsUpdateModalOpen(true);
  };

  // 増設申請ボタンのクリックハンドラー
  const handleExpandApplication = () => {
    if (selectedItems.size === 0) {
      alert('増設申請する資産を選択してください');
      return;
    }
    if (selectedItems.size > 1) {
      alert('増設申請は1台ずつ行ってください。\n資産を1件だけ選択してください。');
      return;
    }
    setIsAdditionModalOpen(true);
  };

  // ボタンの状態判定
  const isSingleSelected = selectedItems.size === 1;
  const isAnySelected = selectedItems.size > 0;

  // ボタンスタイル
  const getButtonStyle = (isEnabled: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    background: isEnabled ? '#fff' : 'rgba(255,255,255,0.5)',
    color: isEnabled ? '#333' : 'rgba(0,0,0,0.4)',
    border: isEnabled ? '2px solid #fff' : '1px solid rgba(255,255,255,0.5)',
    borderRadius: '4px',
    cursor: isEnabled ? 'pointer' : 'default',
    fontSize: '13px',
    fontWeight: isEnabled ? 600 : 'normal',
    opacity: isEnabled ? 1 : 0.6,
    transition: 'all 0.2s',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title="資産リスト"
        resultCount={filteredAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* 申請エリア */}
      <div style={{ background: '#4a6741', padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 左側ボタン群（購入系） */}
          <button
            style={getButtonStyle(isSingleSelected)}
            onClick={handleUpdateApplication}
            title={isSingleSelected ? '' : '資産を1件選択してください'}
          >
            更新申請
          </button>
          <button
            style={getButtonStyle(isSingleSelected)}
            onClick={handleExpandApplication}
            title={isSingleSelected ? '' : '資産を1件選択してください'}
          >
            増設申請
          </button>
          <button
            style={getButtonStyle(!isAnySelected)}
            onClick={() => {
              if (isAnySelected) {
                alert('新規申請は資産を選択せずに行ってください');
                return;
              }
              handleNewApplication();
            }}
            title={!isAnySelected ? '' : '資産の選択を解除してください'}
          >
            新規申請
          </button>

          {/* 中央ボタン */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button
              style={getButtonStyle(!isAnySelected)}
              onClick={() => {
                if (isAnySelected) {
                  alert('借用申請は資産を選択せずに行ってください');
                  return;
                }
                setIsBorrowingModalOpen(true);
              }}
              title={!isAnySelected ? '' : '資産の選択を解除してください'}
            >
              借用申請
            </button>
          </div>

          {/* 右側ボタン群 */}
          <button
            style={getButtonStyle(isAnySelected)}
            onClick={() => {
              if (selectedItems.size === 0) {
                alert('移動申請する資産を選択してください');
                return;
              }
              setIsTransferModalOpen(true);
            }}
            title={isAnySelected ? '' : '資産を選択してください'}
          >
            移動申請
          </button>
          <button
            style={getButtonStyle(isAnySelected)}
            onClick={() => {
              if (selectedItems.size === 0) {
                alert('廃棄申請する資産を選択してください');
                return;
              }
              setIsDisposalModalOpen(true);
            }}
            title={isAnySelected ? '' : '資産を選択してください'}
          >
            廃棄申請
          </button>
        </div>
        {/* 選択状態表示 */}
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: 500
          }}>
            選択中: {selectedItems.size}件
          </span>
          {selectedItems.size === 0 && (
            <span style={{ color: '#90EE90' }}>
              ✓ 新規・借用申請が可能です
            </span>
          )}
          {selectedItems.size === 1 && (
            <span style={{ color: '#90EE90' }}>
              ✓ 更新・増設・移動・廃棄申請が可能です
            </span>
          )}
          {selectedItems.size > 1 && (
            <span style={{ color: '#90EE90' }}>
              ✓ 移動・廃棄申請が可能です
            </span>
          )}
        </div>
      </div>

      {/* フィルターエリア */}
      <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ fontSize: '13px', color: '#333', marginBottom: '10px', fontWeight: 'bold' }}>
          資産を絞り込む
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          {/* 管理部署 */}
          <div style={{ minWidth: '140px', position: 'relative', zIndex: 16 }}>
            <SearchableSelect
              value={filters.department}
              onChange={(val) => setFilters({ department: val })}
              options={departmentOptions}
              placeholder="管理部署"
              isMobile={isMobile}
            />
          </div>

          {/* 設置部門 */}
          <div style={{ minWidth: '140px', position: 'relative', zIndex: 15 }}>
            <SearchableSelect
              value={filters.section}
              onChange={(val) => setFilters({ section: val })}
              options={sectionOptions}
              placeholder="設置部門"
              isMobile={isMobile}
            />
          </div>

          {/* category */}
          <div style={{ minWidth: '140px', position: 'relative', zIndex: 14 }}>
            <SearchableSelect
              value={filters.category}
              onChange={(val) => setFilters({ category: val })}
              options={categoryOptions}
              placeholder="category"
              isMobile={isMobile}
            />
          </div>

          {/* 大分類 */}
          <div style={{ minWidth: '120px', position: 'relative', zIndex: 13 }}>
            <SearchableSelect
              value={filters.largeClass}
              onChange={(val) => setFilters({ largeClass: val })}
              options={largeClassOptions}
              placeholder="大分類"
              isMobile={isMobile}
            />
          </div>

          {/* 中分類 */}
          <div style={{ minWidth: '120px', position: 'relative', zIndex: 12 }}>
            <SearchableSelect
              value={filters.mediumClass}
              onChange={(val) => setFilters({ mediumClass: val })}
              options={mediumClassOptions}
              placeholder="中分類"
              isMobile={isMobile}
            />
          </div>

          {/* 品目 */}
          <div style={{ minWidth: '120px', position: 'relative', zIndex: 11 }}>
            <SearchableSelect
              value={filters.item}
              onChange={(val) => setFilters({ item: val })}
              options={itemOptions}
              placeholder="品目"
              isMobile={isMobile}
            />
          </div>

          {/* スペーサー */}
          <div style={{ flex: 1 }} />

          {/* 全体検索 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="キーワード検索"
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                width: '180px',
              }}
            />
          </div>
        </div>
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {currentView === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    width: `${columnWidths.checkbox}px`,
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'checkbox')}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      background: resizingColumn === 'checkbox' ? '#3498db' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                    }}
                  />
                </th>
                {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      width: `${columnWidths[col.key]}px`,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {col.label}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        background: resizingColumn === col.key ? '#3498db' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                  style={{
                    borderBottom: '1px solid #dee2e6',
                    cursor: 'pointer',
                    background: selectedItems.has(asset.no) ? '#e3f2fd' : 'white'
                  }}
                  onDoubleClick={() => router.push(`/asset-detail?no=${asset.no}&from=asset-search`)}
                  onMouseEnter={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                    />
                  </td>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                    <td key={col.key} style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getCellValue(asset, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredAssets.map((asset) => (
              <div
                key={asset.no}
                style={{
                  background: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onDoubleClick={() => router.push(`/asset-karte/${asset.no}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(asset.no)}
                    onChange={() => handleSelectItem(asset.no)}
                  />
                  <strong style={{ color: '#2c3e50' }}>No. {asset.no}</strong>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2c3e50' }}>{asset.name}</h3>
                <div style={{ fontSize: '13px', color: '#5a6c7d', lineHeight: '1.6' }}>
                  <div>施設: {asset.facility}</div>
                  <div>場所: {asset.building} {asset.floor}</div>
                  <div>部門: {asset.department}</div>
                  <div>メーカー: {asset.maker}</div>
                  <div>型式: {asset.model}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* カラム設定モーダル */}
      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        onClose={() => setIsColumnSettingsOpen(false)}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onVisibilityChange={toggleColumnVisibility}
        onSelectAll={handleSelectAllColumns}
        onDeselectAll={handleDeselectAllColumns}
      />

      {/* 購入申請モーダル */}
      <PurchaseApplicationModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 移動申請モーダル */}
      <TransferApplicationModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
          router.push('/application-list');
        }}
      />

      {/* 廃棄申請モーダル */}
      <DisposalApplicationModal
        isOpen={isDisposalModalOpen}
        onClose={() => setIsDisposalModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
          router.push('/application-list');
        }}
      />

      {/* 借用申請モーダル */}
      <BorrowingApplicationModal
        isOpen={isBorrowingModalOpen}
        onClose={() => setIsBorrowingModalOpen(false)}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 更新申請モーダル */}
      <UpdateApplicationModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 増設申請モーダル */}
      <AdditionApplicationModal
        isOpen={isAdditionModalOpen}
        onClose={() => setIsAdditionModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />
    </div>
  );
}
