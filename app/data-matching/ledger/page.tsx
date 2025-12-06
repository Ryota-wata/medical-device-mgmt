'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LedgerData, MatchingStatus, DataMatchingFilters } from '@/lib/types/data-matching';
import { ledgerDataSample } from '@/lib/data/data-matching-sample';
import { FACILITY_CONSTANTS } from '@/lib/types/facility';

const MATCHING_STATUS_OPTIONS: MatchingStatus[] = [
  '完全一致',
  '部分一致',
  '数量不一致',
  '再確認',
  '未確認',
  '未登録',
  '未突合'
];

export default function LedgerWindowPage() {
  const [data, setData] = useState<LedgerData[]>(ledgerDataSample);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<DataMatchingFilters>({
    category: '',
    department: '',
    section: '',
    majorCategory: '',
    middleCategory: '',
    matchingStatus: '全て',
    keyword: ''
  });

  // 初回ロード時にLocalStorageからフィルターを読み込む
  useEffect(() => {
    const savedFilters = localStorage.getItem('dataMatchingFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Failed to parse filters from localStorage', error);
      }
    }
  }, []);

  // フィルター変更時にLocalStorageに保存し、他のウィンドウに通知
  useEffect(() => {
    localStorage.setItem('dataMatchingFilters', JSON.stringify(filters));

    // 親ウィンドウと他のウィンドウにフィルター変更を通知
    if (window.opener) {
      window.opener.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
    }
    window.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
  }, [filters]);

  // 選択情報を親ウィンドウに送信
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'LEDGER_SELECTION',
        selectedIds: Array.from(selectedIds)
      }, '*');
    }
  }, [selectedIds]);

  // 他のウィンドウからのフィルター更新と突合完了を受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FILTER_UPDATE' && event.source !== window) {
        setFilters(event.data.filters);
      }
      // 突合完了通知を受け取る
      if (event.data.type === 'MATCH_COMPLETE') {
        const { ledgerIds } = event.data;
        // 突合完了したデータを更新
        const now = new Date().toISOString();
        const updatedData = data.map(item => {
          if (ledgerIds.includes(item.id)) {
            return {
              ...item,
              matchingStatus: '完全一致' as MatchingStatus,
              matchedAt: now,
              matchedBy: '現在のユーザー'
            };
          }
          return item;
        });
        setData(updatedData);
        setSelectedIds(new Set());
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data]);

  // 部門オプション
  const departmentOptions = useMemo(() => [...FACILITY_CONSTANTS.divisions], []);

  // 部署オプション（選択された部門に応じて動的に生成）
  const sectionOptions = useMemo(() => {
    if (!filters.department) return [];
    const sections = FACILITY_CONSTANTS.sectionsByDivision[filters.department as keyof typeof FACILITY_CONSTANTS.sectionsByDivision];
    return sections ? [...sections] : [];
  }, [filters.department]);

  // カテゴリオプション
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(data.map(d => d.category)));
    return uniqueCategories.filter(Boolean);
  }, [data]);

  // 大分類オプション
  const majorCategoryOptions = useMemo(() => {
    const uniqueMajorCategories = Array.from(new Set(data.map(d => d.majorCategory)));
    return uniqueMajorCategories.filter(Boolean);
  }, [data]);

  // 中分類オプション
  const middleCategoryOptions = useMemo(() => {
    const uniqueMiddleCategories = Array.from(new Set(data.map(d => d.middleCategory)));
    return uniqueMiddleCategories.filter(Boolean);
  }, [data]);

  // フィルタリング
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.majorCategory) {
      filtered = filtered.filter(d => d.majorCategory === filters.majorCategory);
    }
    if (filters.middleCategory) {
      filtered = filtered.filter(d => d.middleCategory === filters.middleCategory);
    }
    if (filters.matchingStatus && filters.matchingStatus !== '全て') {
      filtered = filtered.filter(d => d.matchingStatus === filters.matchingStatus);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.assetNo?.toLowerCase().includes(keyword) ||
        d.item?.toLowerCase().includes(keyword) ||
        d.manufacturer?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [data, filters]);

  const resetFilters = () => {
    setFilters({
      category: '',
      department: '',
      section: '',
      majorCategory: '',
      middleCategory: '',
      matchingStatus: '全て',
      keyword: ''
    });
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

  const handleSelectAsset = (asset: LedgerData) => {
    // 親ウィンドウに選択した資産情報を送信
    if (window.opener) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        asset: asset
      }, '*');
    }

    // 選択後もウィンドウは開いたまま（ユーザーが複数の資産を参照できるように）
    alert(`資産番号 ${asset.assetNo} を選択しました。\n親ウィンドウで編集モーダルに反映してください。`);
  };

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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            固定資産台帳（参照用）
          </h1>
          <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
            ※フィルターは自動的に現有品調査リストと連動します
          </div>
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
            <span style={{ color: getStatusColor('未確認'), fontWeight: '600', marginLeft: '4px' }}>未確認 {stats.未確認}</span>
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
                固定資産台帳リスト
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
                <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                  | 表示: {filteredData.length}件 / 全体: {data.length}件
                </span>
              </div>
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
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.roomName || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.majorCategory}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.middleCategory}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>{row.quantity}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.acquisitionDate}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleSelectAsset(row)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            backgroundColor: row.matchingStatus === '未確認' ? '#e3f2fd' : '#f5f5f5',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: row.matchingStatus === '未確認' ? 'pointer' : 'not-allowed',
                            color: row.matchingStatus === '未確認' ? '#000' : '#999'
                          }}
                          disabled={row.matchingStatus !== '未確認'}
                        >
                          選択
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={13} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        該当するデータがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 使用方法の説明 */}
          <div style={{
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>使用方法</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>このウィンドウは固定資産台帳の参照用です</li>
              <li>フィルターは現有品調査リストと自動的に連動します</li>
              <li>「未確認」状態の資産のみ選択ボタンが有効です</li>
              <li>選択ボタンをクリックすると、親ウィンドウの編集モーダルに資産番号が反映されます</li>
              <li>ウィンドウは開いたままで、複数の資産を参照できます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
