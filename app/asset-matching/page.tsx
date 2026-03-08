'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MatchingData, LinkedMasterData, emptyLinkedMasterData } from '@/lib/types/asset-matching';
import { assetMatchingSampleData } from '@/lib/data/asset-matching-sample';
import { useAssetMatchingFilters } from '@/lib/hooks/useAssetMatchingFilters';
import { updateFieldWithParents } from '@/lib/utils/asset-hierarchy';
import { exportAssetMatchingToExcel } from '@/lib/utils/excel-asset-matching';

export default function AssetMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { assets: assetMasters } = useMasterStore();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingLinked, setEditingLinked] = useState<LinkedMasterData | null>(null);
  const [data, setData] = useState(assetMatchingSampleData);

  const {
    filters,
    setFilters,
    filteredData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    majorCategoryOptions,
    middleCategoryOptions,
    itemOptions,
    resetFilters
  } = useAssetMatchingFilters({ data, assetMasters });

  const handleBack = () => {
    router.back();
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      setSelectedRows(new Set(filteredData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleEditMode = (id: number) => {
    if (editingRow === id) {
      setEditingRow(null);
      setEditingLinked(null);
    } else {
      const row = data.find(r => r.id === id);
      if (row) {
        setEditingRow(id);
        setEditingLinked({ ...row.linked });
      }
    }
  };

  // 編集時のフィールド変更ハンドラ（親子関係の自動選択）
  const handleEditFieldChange = (field: 'majorCategory' | 'middleCategory' | 'item' | 'manufacturer' | 'model', value: string) => {
    if (!editingLinked) return;
    const updates = updateFieldWithParents(field, value, editingLinked, assetMasters);
    setEditingLinked({ ...editingLinked, ...updates });
  };

  // AI判定を採用 → linked にコピー
  const handleApplyAIRecommendation = (rowId: number) => {
    const row = data.find(r => r.id === rowId);
    if (!row) return;

    if (editingRow === rowId && editingLinked) {
      if (row.aiApplied) {
        // 解除
        setEditingLinked({ ...emptyLinkedMasterData });
        setData(data.map(r => r.id === rowId ? { ...r, aiApplied: false } : r));
      } else {
        // 採用 → editingLinked に反映
        const newLinked: LinkedMasterData = {
          category: row.aiRecommendation.category,
          majorCategory: row.aiRecommendation.major,
          middleCategory: row.aiRecommendation.middle,
          item: row.aiRecommendation.item,
          manufacturer: row.aiRecommendation.manufacturer,
          model: row.aiRecommendation.model,
        };
        setEditingLinked(newLinked);
        setData(data.map(r => r.id === rowId ? { ...r, aiApplied: true } : r));
      }
    } else {
      // 編集中でない場合は直接 data を更新
      setData(data.map(r => {
        if (r.id !== rowId) return r;
        if (r.aiApplied) {
          return { ...r, linked: { ...emptyLinkedMasterData }, aiApplied: false };
        }
        return {
          ...r,
          linked: {
            category: r.aiRecommendation.category,
            majorCategory: r.aiRecommendation.major,
            middleCategory: r.aiRecommendation.middle,
            item: r.aiRecommendation.item,
            manufacturer: r.aiRecommendation.manufacturer,
            model: r.aiRecommendation.model,
          },
          aiApplied: true
        };
      }));
    }
  };

  const handleOpenAssetMaster = () => {
    const width = 1400;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(
      `${basePath}/ship-asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const saveEdit = () => {
    if (!editingLinked || editingRow === null) return;
    setData(data.map(row =>
      row.id === editingRow ? { ...row, linked: { ...editingLinked } } : row
    ));
    setEditingRow(null);
    setEditingLinked(null);
  };

  const confirmRow = (id: number) => {
    if (confirm(`No.${id} のレコードを確定しますか？\n確定後、このレコードは画面から削除されます。`)) {
      setData(data.filter(r => r.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const bulkConfirmSelected = () => {
    if (selectedRows.size === 0) {
      alert('確定する項目を選択してください');
      return;
    }
    if (confirm(`選択した${selectedRows.size}件のレコードを一括確定しますか？\n確定後、これらのレコードは画面から削除されます。`)) {
      setData(data.filter(row => !selectedRows.has(row.id)));
      setSelectedRows(new Set());
      setSelectedAll(false);
    }
  };

  const completeMatching = () => {
    if (data.length > 0) {
      if (confirm(`未確定の項目が${data.length}件あります。このまま完了しますか？`)) {
        router.push('/main');
      }
    } else {
      alert('突き合わせが完了しました');
      router.push('/main');
    }
  };

  const totalCount = assetMatchingSampleData.length;
  const remainingCount = data.length;

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          資産台帳とマスタの突き合わせ
        </div>
        <div style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  const thBase: React.CSSProperties = {
    padding: '8px 6px',
    borderBottom: '2px solid #e0e0e0',
    whiteSpace: 'nowrap',
    fontSize: '11px'
  };

  const tdBase: React.CSSProperties = {
    padding: '8px',
    borderBottom: '1px solid #e0e0e0',
    whiteSpace: 'nowrap'
  };

  const linkedBg = '#e8f5e9';
  const aiBg = '#fff8e1';

  // 固定列の累積left位置（px）: チェックボックス(36) + No.(40) + 台帳データ6列
  const stickyLeft = {
    checkbox: 0,
    no: 36,
    department: 76,
    section: 166,
    itemName: 276,
    maker: 426,
    model: 556,
    qty: 676,
  };
  const stickyBorder = '2px solid #bdbdbd';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1800px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            資産台帳とマスタの突き合わせ
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>全体:</span>
            <span style={{ fontSize: '14px', color: '#2c3e50' }}>{totalCount}件</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>残り:</span>
            <span style={{ fontSize: '14px', color: '#ff9800', fontWeight: '600' }}>{remainingCount}件</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>完了:</span>
            <span style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600' }}>{totalCount - remainingCount}件</span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            flex: 1,
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '0 0 130px' }}>
              <SearchableSelect
                label="共通部門"
                value={filters.department}
                onChange={(value) => setFilters({...filters, department: value, section: ''})}
                options={departmentOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="200px"
              />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <SearchableSelect
                label="共通部署"
                value={filters.section}
                onChange={(value) => setFilters({...filters, section: value})}
                options={sectionOptions}
                placeholder="全て"
                isMobile={isMobile}
                disabled={!filters.department}
                dropdownMinWidth="250px"
              />
            </div>
            <div style={{ flex: '0 0 120px' }}>
              <SearchableSelect
                label="Category"
                value={filters.category}
                onChange={(value) => setFilters({...filters, category: value})}
                options={categoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="200px"
              />
            </div>
            <div style={{ flex: '0 0 150px' }}>
              <SearchableSelect
                label="大分類"
                value={filters.majorCategory}
                onChange={(value) => setFilters({...filters, majorCategory: value})}
                options={majorCategoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="300px"
              />
            </div>
            <div style={{ flex: '0 0 150px' }}>
              <SearchableSelect
                label="中分類"
                value={filters.middleCategory}
                onChange={(value) => setFilters({...filters, middleCategory: value})}
                options={middleCategoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="300px"
              />
            </div>
            <div style={{ flex: '0 0 150px' }}>
              <SearchableSelect
                label="品目"
                value={filters.item}
                onChange={(value) => setFilters({...filters, item: value})}
                options={itemOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="400px"
              />
            </div>
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                height: '38px'
              }}
            >
              リセット
            </button>
            <button
              onClick={() => exportAssetMatchingToExcel(filteredData)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                height: '38px'
              }}
            >
              Excel出力
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px' }}>
        <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={bulkConfirmSelected}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>✓</span> 選択項目を一括確定
            </button>
            <button
              onClick={handleOpenAssetMaster}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              資産マスタを別ウィンドウで開く
            </button>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                {/* 1段目: グループヘッダー */}
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th rowSpan={2} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: stickyLeft.checkbox, backgroundColor: '#f5f5f5', zIndex: 4 }}>
                    <input
                      type="checkbox"
                      checked={selectedAll}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th rowSpan={2} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', position: 'sticky', left: stickyLeft.no, backgroundColor: '#f5f5f5', zIndex: 4 }}>No.</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', fontWeight: '600', position: 'sticky', left: stickyLeft.department, zIndex: 4 }}>台帳データ</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', position: 'sticky', left: stickyLeft.section, zIndex: 4 }}></th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', position: 'sticky', left: stickyLeft.itemName, zIndex: 4 }}></th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', position: 'sticky', left: stickyLeft.maker, zIndex: 4 }}></th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', position: 'sticky', left: stickyLeft.model, zIndex: 4 }}></th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', position: 'sticky', left: stickyLeft.qty, zIndex: 4, borderRight: stickyBorder }}></th>
                  <th colSpan={7} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff3e0', fontWeight: '600' }}>AI判定（推薦）</th>
                  <th colSpan={6} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e8f5e9', fontWeight: '600' }}>SHIP資産マスタ紐づけ</th>
                  <th colSpan={2} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 4 }}>操作</th>
                </tr>
                {/* 2段目: 個別カラムヘッダー */}
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {/* 台帳データ（sticky） */}
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.department, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '90px' }}>共通部門</th>
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.section, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '110px' }}>共通部署</th>
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.itemName, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '150px' }}>品目名(原)</th>
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.maker, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '130px' }}>メーカー名(原)</th>
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.model, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '120px' }}>型式(原)</th>
                  <th style={{ ...thBase, position: 'sticky', left: stickyLeft.qty, backgroundColor: '#e3f2fd', zIndex: 3, minWidth: '50px', borderRight: stickyBorder }}>数量</th>
                  {/* AI判定（推薦） */}
                  <th style={{ ...thBase, textAlign: 'center' }}>採用</th>
                  <th style={thBase}>category</th>
                  <th style={{ ...thBase, minWidth: '120px' }}>大分類</th>
                  <th style={{ ...thBase, minWidth: '120px' }}>中分類</th>
                  <th style={{ ...thBase, minWidth: '150px' }}>品目</th>
                  <th style={thBase}>メーカー名</th>
                  <th style={thBase}>型式</th>
                  {/* SHIP資産マスタ紐づけ */}
                  <th style={thBase}>category</th>
                  <th style={{ ...thBase, minWidth: '120px' }}>大分類</th>
                  <th style={{ ...thBase, minWidth: '120px' }}>中分類</th>
                  <th style={{ ...thBase, minWidth: '150px' }}>品目</th>
                  <th style={thBase}>メーカー名</th>
                  <th style={thBase}>型式</th>
                  {/* 操作 */}
                  <th style={{ ...thBase, position: 'sticky', right: 60, backgroundColor: '#f5f5f5', zIndex: 2, minWidth: '60px', textAlign: 'center' }}>編集</th>
                  <th style={{ ...thBase, position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 2, minWidth: '60px', textAlign: 'center' }}>確定</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  const isEditing = editingRow === row.id;
                  const displayLinked = isEditing && editingLinked ? editingLinked : row.linked;

                  return (
                    <React.Fragment key={row.id}>
                      <tr style={{ backgroundColor: 'white' }}>
                        {/* チェックボックス（sticky） */}
                        <td style={{ ...tdBase, textAlign: 'center', position: 'sticky', left: stickyLeft.checkbox, backgroundColor: 'white', zIndex: 2 }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                          />
                        </td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.no, backgroundColor: 'white', zIndex: 2 }}>{index + 1}</td>

                        {/* 台帳データ（読み取り専用・sticky） */}
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.department, backgroundColor: '#f0f7ff', zIndex: 2 }}>{row.department}</td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.section, backgroundColor: '#f0f7ff', zIndex: 2 }}>{row.section}</td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.itemName, backgroundColor: '#f0f7ff', zIndex: 2, minWidth: '150px' }}>{row.originalItemName}</td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.maker, backgroundColor: '#f0f7ff', zIndex: 2 }}>{row.manufacturer}</td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.model, backgroundColor: '#f0f7ff', zIndex: 2 }}>{row.model}</td>
                        <td style={{ ...tdBase, position: 'sticky', left: stickyLeft.qty, backgroundColor: '#f0f7ff', zIndex: 2, borderRight: stickyBorder }}>{row.quantityUnit}</td>

                        {/* AI判定（推薦）（読み取り専用 + 採用ボタン） */}
                        <td style={{ ...tdBase, backgroundColor: aiBg, textAlign: 'center' }}>
                          <button
                            onClick={() => handleApplyAIRecommendation(row.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: row.aiApplied ? '#f44336' : '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {row.aiApplied ? '解除' : '採用'}
                          </button>
                        </td>
                        <td style={{ ...tdBase, backgroundColor: aiBg }}>{row.aiRecommendation.category}</td>
                        <td style={{ ...tdBase, backgroundColor: aiBg, minWidth: '120px' }}>{row.aiRecommendation.major}</td>
                        <td style={{ ...tdBase, backgroundColor: aiBg, minWidth: '120px' }}>{row.aiRecommendation.middle}</td>
                        <td style={{ ...tdBase, backgroundColor: aiBg, minWidth: '150px' }}>{row.aiRecommendation.item}</td>
                        <td style={{ ...tdBase, backgroundColor: aiBg }}>{row.aiRecommendation.manufacturer}</td>
                        <td style={{ ...tdBase, backgroundColor: aiBg }}>{row.aiRecommendation.model}</td>

                        {/* SHIP資産マスタ紐づけ（編集対象） */}
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.category}
                              onChange={(value) => setEditingLinked({ ...editingLinked, category: value })}
                              options={categoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="200px"
                            />
                          ) : (
                            displayLinked.category
                          )}
                        </td>
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg, minWidth: '120px' }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.majorCategory}
                              onChange={(value) => handleEditFieldChange('majorCategory', value)}
                              options={majorCategoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.majorCategory
                          )}
                        </td>
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg, minWidth: '120px' }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.middleCategory}
                              onChange={(value) => handleEditFieldChange('middleCategory', value)}
                              options={middleCategoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.middleCategory
                          )}
                        </td>
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg, minWidth: '150px' }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.item}
                              onChange={(value) => handleEditFieldChange('item', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.item))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="400px"
                            />
                          ) : (
                            displayLinked.item
                          )}
                        </td>
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.manufacturer}
                              onChange={(value) => handleEditFieldChange('manufacturer', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.maker))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.manufacturer
                          )}
                        </td>
                        <td style={{ ...tdBase, backgroundColor: isEditing ? '#fffde7' : linkedBg }}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.model}
                              onChange={(value) => handleEditFieldChange('model', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.model))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.model
                          )}
                        </td>

                        {/* 操作 */}
                        <td style={{ ...tdBase, position: 'sticky', right: 60, backgroundColor: 'white', zIndex: 1, minWidth: '60px', textAlign: 'center' }}>
                          {isEditing ? (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              キャンセル
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#e3f2fd',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              編集
                            </button>
                          )}
                        </td>
                        <td style={{ ...tdBase, position: 'sticky', right: 0, backgroundColor: 'white', zIndex: 1, minWidth: '60px', textAlign: 'center' }}>
                          {isEditing ? (
                            <button
                              onClick={saveEdit}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }}
                            >
                              保存
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmRow(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#c8e6c9',
                                color: '#2e7d32',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }}
                            >
                              確定
                            </button>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginTop: '16px'
          }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              ← 前へ
            </button>
            <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
              1 - {filteredData.length} / {filteredData.length}
            </span>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              次へ →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 32px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← 戻る
          </button>
          <button
            onClick={completeMatching}
            style={{
              padding: '12px 32px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            突き合わせ完了
          </button>
        </div>
      </footer>
    </div>
  );
}
