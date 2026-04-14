'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts';
import { useAssetStore, useMasterStore, useApplicationStore } from '@/lib/stores';
import { Asset, Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { TransferApplicationModal } from '@/components/ui/TransferApplicationModal';
import { DisposalApplicationModal } from '@/components/ui/DisposalApplicationModal';
import { PurchaseApplicationModal } from '@/components/ui/PurchaseApplicationModal';
import { UpdateApplicationModal } from '@/components/ui/UpdateApplicationModal';
import { AdditionApplicationModal } from '@/components/ui/AdditionApplicationModal';
import { InspectionRegistrationModal } from '@/app/quotation-data-box/components/InspectionRegistrationModal';
import { MaintenanceContractRegistrationModal } from '@/app/quotation-data-box/components/MaintenanceContractRegistrationModal';
import { LendingRegistrationModal } from '@/app/quotation-data-box/components/LendingRegistrationModal';
import { useMaintenanceContractStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { ASSET_COLUMNS, type ColumnDef } from '@/lib/constants/assetColumns';

// 原本リスト用の8グループのみ（契約・リース詳細・財務・耐用年数は編集リスト専用）
const ORIGINAL_LIST_GROUPS = ['basic', 'commonMaster', 'location', 'identity', 'classification', 'specification', 'acquisition', 'other'];
const ALL_COLUMNS = ASSET_COLUMNS.filter(col => ORIGINAL_LIST_GROUPS.includes(col.group || ''));

// グループ表示用の定義（ラベルと背景色）
const GROUP_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  basic: { label: '基本情報', bg: '#f8f9fa', color: '#495057' },
  commonMaster: { label: '共通マスタ', bg: '#e8f5e9', color: '#2e7d32' },
  location: { label: '設置情報', bg: '#e3f2fd', color: '#1565c0' },
  identity: { label: '識別情報', bg: '#fff3e0', color: '#e65100' },
  classification: { label: '資産分類', bg: '#f3e5f5', color: '#7b1fa2' },
  specification: { label: '機器仕様', bg: '#e0f7fa', color: '#00838f' },
  acquisition: { label: '取得情報', bg: '#fce4ec', color: '#c62828' },
  other: { label: 'その他', bg: '#f5f5f5', color: '#616161' },
  contract: { label: '契約情報', bg: '#ede7f6', color: '#4527a0' },
  leaseDetail: { label: 'リース詳細', bg: '#e8eaf6', color: '#283593' },
  financial: { label: '財務情報', bg: '#fff8e1', color: '#f57f17' },
  lifespan: { label: '耐用年数', bg: '#efebe9', color: '#4e342e' },
  // 編集リスト用（REMODEL_COLUMNS等で使われるグループ）
  application: { label: '申請内容', bg: '#e8f5e9', color: '#2e7d32' },
  applicationDetail: { label: '申請詳細', bg: '#e8f5e9', color: '#2e7d32' },
  connection: { label: '接続要望', bg: '#e8f5e9', color: '#2e7d32' },
  work: { label: '作業用', bg: '#fff3e0', color: '#e65100' },
};

export default function AssetSearchResultPage() {
  const router = useRouter();
  const { assets } = useAssetStore();
  const { addApplication } = useApplicationStore();
  const { addContract } = useMaintenanceContractStore();
  const { isMobile } = useResponsive();
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 移動申請モーダル関連の状態
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 廃棄申請モーダル関連の状態
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);

  // 購入申請モーダル関連の状態
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // 更新申請モーダル関連の状態
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // 増設申請モーダル関連の状態
  const [isAdditionModalOpen, setIsAdditionModalOpen] = useState(false);

  // 点検管理登録モーダル関連の状態
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  // 保守契約登録モーダル関連の状態
  const [isMaintenanceContractModalOpen, setIsMaintenanceContractModalOpen] = useState(false);

  // 貸出登録モーダル関連の状態
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);

  // 原本資産データ（useAssetStore から取得）
  const storeAssets = assets;

  // useAssetFilterフックを使用
  const {
    filters,
    setFilters,
    filteredAssets,
    facilityOptions,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
    itemOptions,
  } = useAssetFilter(storeAssets);

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
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'white' }}>
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

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 4px' }} />

          <button
            style={getButtonStyle(isAnySelected)}
            onClick={() => {
              if (selectedItems.size === 0) {
                alert('点検管理登録する資産を選択してください');
                return;
              }
              setIsInspectionModalOpen(true);
            }}
            title={isAnySelected ? '' : '資産を選択してください'}
          >
            点検管理登録
          </button>
          <button
            style={getButtonStyle(isAnySelected)}
            onClick={() => {
              if (selectedItems.size === 0) {
                alert('保守契約登録する資産を選択してください');
                return;
              }
              setIsMaintenanceContractModalOpen(true);
            }}
            title={isAnySelected ? '' : '資産を選択してください'}
          >
            保守契約登録
          </button>
          <button
            style={getButtonStyle(isAnySelected)}
            onClick={() => {
              if (selectedItems.size === 0) {
                alert('貸出登録する資産を選択してください');
                return;
              }
              setIsLendingModalOpen(true);
            }}
            title={isAnySelected ? '' : '資産を選択してください'}
          >
            貸出登録
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
              ✓ 新規申請が可能です
            </span>
          )}
          {selectedItems.size === 1 && (
            <span style={{ color: '#90EE90' }}>
              ✓ 更新・増設・移動・廃棄申請 / 点検管理・保守契約登録が可能です
            </span>
          )}
          {selectedItems.size > 1 && (
            <span style={{ color: '#90EE90' }}>
              ✓ 移動・廃棄申請 / 点検管理・保守契約登録が可能です
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
          {/* 施設 */}
          <div style={{ minWidth: '160px', position: 'relative', zIndex: 17 }}>
            <SearchableSelect
              value={filters.facility}
              onChange={(val) => setFilters({ facility: val })}
              options={facilityOptions}
              placeholder="施設"
              isMobile={isMobile}
            />
          </div>

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
        {currentView === 'list' && (
          <table style={{ borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa' }}>
              {/* グループヘッダー行 */}
              <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                <th
                  rowSpan={2}
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    width: `${columnWidths.checkbox}px`,
                    background: '#f8f9fa',
                    position: 'relative',
                    verticalAlign: 'middle',
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
                      background: resizingColumn === 'checkbox' ? '#27ae60' : 'transparent',
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
                {(() => {
                  const visibleCols = ALL_COLUMNS.filter((col) => visibleColumns[col.key]);
                  const groupSpans: { group: string; count: number }[] = [];
                  visibleCols.forEach((col) => {
                    const g = col.group || 'other';
                    if (groupSpans.length > 0 && groupSpans[groupSpans.length - 1].group === g) {
                      groupSpans[groupSpans.length - 1].count++;
                    } else {
                      groupSpans.push({ group: g, count: 1 });
                    }
                  });
                  return groupSpans.map((span, idx) => {
                    const style = GROUP_STYLES[span.group] || { label: span.group, bg: '#f8f9fa', color: '#495057' };
                    return (
                      <th
                        key={`${span.group}-${idx}`}
                        colSpan={span.count}
                        style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: style.color,
                          background: style.bg,
                          borderLeft: idx > 0 ? '2px solid #dee2e6' : undefined,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {style.label}
                      </th>
                    );
                  });
                })()}
              </tr>
              {/* カラム名行 */}
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => {
                  const groupStyle = GROUP_STYLES[col.group || 'other'] || { bg: '#f8f9fa' };
                  return (
                  <th
                    key={col.key}
                    style={{
                      padding: '8px 8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      width: `${columnWidths[col.key]}px`,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      background: groupStyle.bg,
                      fontSize: '12px',
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
                        background: resizingColumn === col.key ? '#27ae60' : 'transparent',
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
                  );
                })}
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
                    <td key={col.key} style={{ padding: '12px 8px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  <strong style={{ color: '#1f2937' }}>No. {asset.no}</strong>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#1f2937' }}>{asset.name}</h3>
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
          setSelectedItems(new Set());
        }}
      />

      {/* 廃棄申請モーダル */}
      <DisposalApplicationModal
        isOpen={isDisposalModalOpen}
        onClose={() => setIsDisposalModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
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

      {/* 保守契約登録モーダル */}
      <MaintenanceContractRegistrationModal
        isOpen={isMaintenanceContractModalOpen}
        onClose={() => {
          setIsMaintenanceContractModalOpen(false);
          setSelectedItems(new Set());
        }}
        onRegister={(data) => {
          addContract(data);
          alert(`保守契約「${data.contractGroupName}」を登録しました`);
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />

      {/* 点検管理登録モーダル */}
      <InspectionRegistrationModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedItems(new Set());
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />

      {/* 貸出登録モーダル */}
      <LendingRegistrationModal
        isOpen={isLendingModalOpen}
        onClose={() => {
          setIsLendingModalOpen(false);
          setSelectedItems(new Set());
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />
    </div>
  );
}
