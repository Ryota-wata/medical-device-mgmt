'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useDataMatchingFilters } from '@/lib/hooks/useDataMatchingFilters';
import { SurveyData, MatchingStatus, MatchingEditData } from '@/lib/types/data-matching';
import { surveyDataSample } from '@/lib/data/data-matching-sample';

const MATCHING_STATUS_OPTIONS: MatchingStatus[] = [
  '完全一致',
  '部分一致',
  '数量不一致',
  '再確認',
  '未確認',
  '未登録',
  '未突合'
];

export default function DataMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [data, setData] = useState<SurveyData[]>(surveyDataSample);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState<SurveyData | null>(null);
  const [ledgerWindowRef, setLedgerWindowRef] = useState<Window | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // フィルターフック
  const {
    filters,
    setFilters,
    filteredData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    majorCategoryOptions,
    middleCategoryOptions,
    resetFilters
  } = useDataMatchingFilters({ data });

  // フィルターをLocalStorageに保存（他ウィンドウと連動）
  useEffect(() => {
    localStorage.setItem('dataMatchingFilters', JSON.stringify(filters));

    // 台帳ウィンドウが開いている場合、直接メッセージを送信
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
    }
  }, [filters, ledgerWindowRef]);

  // 他のウィンドウからのフィルター更新を受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FILTER_UPDATE' && event.source !== window) {
        setFilters(event.data.filters);
      }
      // 台帳側からの選択情報を受け取る
      if (event.data.type === 'LEDGER_SELECTION') {
        // ledgerSelectedIdsをwindowオブジェクトに保存
        (window as any).ledgerSelectedIds = event.data.selectedIds;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setFilters]);

  const handleBack = () => {
    router.back();
  };

  const openLedgerWindow = () => {
    // 台帳ウィンドウを開く（別ページとして）
    const width = 1400;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const newWindow = window.open(
      '/data-matching/ledger',
      'ledgerWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      setLedgerWindowRef(newWindow);

      // ウィンドウが閉じられたときの処理
      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          setLedgerWindowRef(null);
          clearInterval(checkWindowClosed);
        }
      }, 1000);
    }
  };

  const handleEdit = (row: SurveyData) => {
    setEditingData({ ...row });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingData(null);
  };

  const saveEdit = () => {
    if (!editingData) return;

    // データを更新
    const updatedData = data.map(item =>
      item.id === editingData.id
        ? {
            ...editingData,
            matchedAt: new Date().toISOString(),
            matchedBy: '現在のユーザー' // 実際にはログインユーザー情報を使用
          }
        : item
    );

    setData(updatedData);
    closeEditModal();
  };

  // チェックボックスの選択処理
  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 一括選択処理
  const handleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(d => d.id)));
    }
  };

  // 突合処理
  const handleMatch = () => {
    if (selectedIds.size === 0) {
      alert('現有リスト側から突合する項目を選択してください');
      return;
    }

    const ledgerSelectedIds = (window as any).ledgerSelectedIds as string[] | undefined;
    if (!ledgerSelectedIds || ledgerSelectedIds.length === 0) {
      alert('台帳リスト側から突合する項目を選択してください');
      return;
    }

    // 1対1の突合チェック
    if (selectedIds.size !== ledgerSelectedIds.length) {
      const confirmMatch = confirm(
        `選択数が一致しません。\n現有品: ${selectedIds.size}件\n台帳: ${ledgerSelectedIds.length}件\n\nこのまま突合を実行しますか？`
      );
      if (!confirmMatch) return;
    }

    // 突合処理を実行
    const now = new Date().toISOString();
    const updatedData = data.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          matchingStatus: '完全一致' as MatchingStatus,
          matchedLedgerId: ledgerSelectedIds[0], // 簡易実装：最初の台帳IDと紐付け
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setData(updatedData);
    setSelectedIds(new Set());

    // 台帳側にも突合完了を通知
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({
        type: 'MATCH_COMPLETE',
        surveyIds: Array.from(selectedIds),
        ledgerIds: ledgerSelectedIds
      }, '*');
    }

    alert(`${selectedIds.size}件の突合が完了しました`);
  };

  const getStatusColor = (status: MatchingStatus) => {
    switch (status) {
      case '完全一致': return '#4caf50';
      case '部分一致': return '#8bc34a';
      case '数量不一致': return '#ff9800';
      case '再確認': return '#2196f3';
      case '未確認': return '#f44336';
      case '未登録': return '#9c27b0';
      case '未突合': return '#757575';
      default: return '#999';
    }
  };

  // 統計情報を計算
  const stats = {
    total: data.length,
    完全一致: data.filter(d => d.matchingStatus === '完全一致').length,
    部分一致: data.filter(d => d.matchingStatus === '部分一致').length,
    数量不一致: data.filter(d => d.matchingStatus === '数量不一致').length,
    再確認: data.filter(d => d.matchingStatus === '再確認').length,
    未確認: data.filter(d => d.matchingStatus === '未確認').length,
    未登録: data.filter(d => d.matchingStatus === '未登録').length,
    未突合: data.filter(d => d.matchingStatus === '未突合').length
  };

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          データ突合
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
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>←</span> 戻る
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
              データ突合
            </h1>
          </div>
          <button
            onClick={openLedgerWindow}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🗗</span> 資産台帳を別窓で開く
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>突合状況:</span>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            全{stats.total}件 |
            <span style={{ color: getStatusColor('完全一致'), fontWeight: '600', marginLeft: '4px' }}>完全一致 {stats.完全一致}</span> |
            <span style={{ color: getStatusColor('部分一致'), fontWeight: '600', marginLeft: '4px' }}>部分一致 {stats.部分一致}</span> |
            <span style={{ color: getStatusColor('数量不一致'), fontWeight: '600', marginLeft: '4px' }}>数量不一致 {stats.数量不一致}</span> |
            <span style={{ color: getStatusColor('再確認'), fontWeight: '600', marginLeft: '4px' }}>再確認 {stats.再確認}</span> |
            <span style={{ color: getStatusColor('未確認'), fontWeight: '600', marginLeft: '4px' }}>未確認 {stats.未確認}</span> |
            <span style={{ color: getStatusColor('未登録'), fontWeight: '600', marginLeft: '4px' }}>未登録 {stats.未登録}</span> |
            <span style={{ color: getStatusColor('未突合'), fontWeight: '600', marginLeft: '4px' }}>未突合 {stats.未突合}</span>
          </span>
        </div>
      </div>

      {/* Filter Panel */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '12px'
          }}>
            {/* 突合状況フィルター */}
            <select
              value={filters.matchingStatus}
              onChange={(e) => setFilters({ ...filters, matchingStatus: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="全て">突合状況: 全て</option>
              {MATCHING_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* 部門フィルター */}
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value, section: '' })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">部門: 全て</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* 部署フィルター */}
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              disabled={!filters.department}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: filters.department ? 'white' : '#f5f5f5'
              }}
            >
              <option value="">部署: 全て</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>

            {/* カテゴリフィルター */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">カテゴリ: 全て</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* 大分類フィルター */}
            <select
              value={filters.majorCategory}
              onChange={(e) => setFilters({ ...filters, majorCategory: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">大分類: 全て</option>
              {majorCategoryOptions.map(major => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>

            {/* 中分類フィルター */}
            <select
              value={filters.middleCategory}
              onChange={(e) => setFilters({ ...filters, middleCategory: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">中分類: 全て</option>
              {middleCategoryOptions.map(middle => (
                <option key={middle} value={middle}>{middle}</option>
              ))}
            </select>

            {/* キーワード検索 */}
            <input
              type="text"
              placeholder="キーワード検索..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />

            {/* フィルター解除ボタン */}
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              フィルター解除
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '16px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              gap: '12px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                現有品調査リスト
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                  選択: {selectedIds.size}件
                </span>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {selectedIds.size === filteredData.length ? '全解除' : '全選択'}
                </button>
                <button
                  onClick={handleMatch}
                  disabled={selectedIds.size === 0}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: selectedIds.size > 0 ? '#27ae60' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  突合実行
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                表示: {filteredData.length}件 / 全体: {data.length}件
              </span>
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合状況</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>QRコード</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部門</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>諸室名称</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>大分類</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>中分類</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>数量</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>取得年月日</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メモ</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: getStatusColor(row.matchingStatus) + '20',
                          color: getStatusColor(row.matchingStatus),
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {row.matchingStatus}
                        </span>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.qrCode}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.roomName || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.majorCategory}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.middleCategory}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>{row.quantity}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.acquisitionDate || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', minWidth: '300px', maxWidth: '500px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.memo || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleEdit(row)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            backgroundColor: '#e3f2fd',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={15} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        該当するデータがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                突合情報を編集
              </h3>
              <button
                onClick={closeEditModal}
                style={{
                  fontSize: '24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              {/* 現有品情報表示 */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2c3e50' }}>現有品情報</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>QRコード:</div>
                  <div>{editingData.qrCode}</div>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>品目:</div>
                  <div>{editingData.item}</div>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>メーカー:</div>
                  <div>{editingData.manufacturer || '-'}</div>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>型式:</div>
                  <div>{editingData.model || '-'}</div>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>数量:</div>
                  <div>{editingData.quantity}</div>
                  <div style={{ color: '#5a6c7d', fontWeight: '600' }}>部門/部署:</div>
                  <div>{editingData.department} / {editingData.section}</div>
                </div>
              </div>

              {/* 突合情報編集 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  突合状況 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <select
                  value={editingData.matchingStatus}
                  onChange={(e) => setEditingData({ ...editingData, matchingStatus: e.target.value as MatchingStatus })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {MATCHING_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  資産番号
                </label>
                <input
                  type="text"
                  value={editingData.assetNo || ''}
                  onChange={(e) => setEditingData({ ...editingData, assetNo: e.target.value })}
                  placeholder="台帳の資産番号を入力"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#5a6c7d' }}>
                  台帳から選択した資産の番号を入力してください
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  メモ
                </label>
                <textarea
                  value={editingData.memo || ''}
                  onChange={(e) => setEditingData({ ...editingData, memo: e.target.value })}
                  placeholder="突合時の注意事項やコメントを入力"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* 突合履歴 */}
              {editingData.matchedAt && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '13px' }}>
                  <div style={{ color: '#2e7d32', fontWeight: '600' }}>
                    最終突合: {new Date(editingData.matchedAt).toLocaleString('ja-JP')}
                  </div>
                  {editingData.matchedBy && (
                    <div style={{ color: '#5a6c7d', marginTop: '4px' }}>
                      実施者: {editingData.matchedBy}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={closeEditModal}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
