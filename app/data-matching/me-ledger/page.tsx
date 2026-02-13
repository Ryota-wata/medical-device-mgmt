'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MELedgerData, MatchingStatus, DataMatchingFilters } from '@/lib/types/data-matching';
import { meLedgerDataSample } from '@/lib/data/data-matching-sample';
import { FACILITY_CONSTANTS } from '@/lib/types/facility';

// 一致検索タイプ
type MatchFilterType = 'none' | 'category' | 'assetNo' | 'item' | 'manufacturer';

export default function MELedgerWindowPage() {
  const [data, setData] = useState<MELedgerData[]>(meLedgerDataSample);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [matchFilter, setMatchFilter] = useState<MatchFilterType>('none');
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
    const savedMatchFilter = localStorage.getItem('dataMatchingMatchFilter');
    if (savedMatchFilter && ['none', 'category', 'assetNo', 'item', 'manufacturer'].includes(savedMatchFilter)) {
      setMatchFilter(savedMatchFilter as MatchFilterType);
    }
  }, []);

  // フィルター変更時にLocalStorageに保存し、他のウィンドウに通知
  useEffect(() => {
    localStorage.setItem('dataMatchingFilters', JSON.stringify(filters));
    if (window.opener) {
      window.opener.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
    }
    window.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
  }, [filters]);

  // 一致検索フィルター変更時
  useEffect(() => {
    localStorage.setItem('dataMatchingMatchFilter', matchFilter);
    if (window.opener) {
      window.opener.postMessage({ type: 'MATCH_FILTER_UPDATE', matchFilter }, '*');
    }
  }, [matchFilter]);

  // 選択情報を親ウィンドウに送信
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'LEDGER_SELECTION',
        selectedIds: Array.from(selectedIds)
      }, '*');
    }
  }, [selectedIds]);

  // 他のウィンドウからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FILTER_UPDATE' && event.source !== window) {
        setFilters(event.data.filters);
      }
      if (event.data.type === 'MATCH_FILTER_UPDATE' && event.source !== window) {
        setMatchFilter(event.data.matchFilter);
      }
      // 突合完了通知
      if (event.data.type === 'MATCH_COMPLETE') {
        const { ledgerIds, matchingStatus } = event.data;
        if (ledgerIds) {
          const now = new Date().toISOString();
          setData(prev => prev.map(item => {
            if (ledgerIds.includes(item.id)) {
              return {
                ...item,
                matchingStatus: matchingStatus as MatchingStatus,
                matchedAt: now,
                matchedBy: '現在のユーザー'
              };
            }
            return item;
          }));
          setSelectedIds(new Set());
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 対応中のデータ（未突合 または 再確認）
  const unmatchedData = useMemo(() => {
    return data.filter(item => !item.matchingStatus || item.matchingStatus === '再確認');
  }, [data]);

  // 突合完了したデータ
  const matchedData = useMemo(() => {
    return data.filter(item => item.matchingStatus);
  }, [data]);

  // 部門オプション
  const departmentOptions = useMemo(() => [...FACILITY_CONSTANTS.divisions], []);

  // 部署オプション
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

  // フィルタリング
  const filteredData = useMemo(() => {
    let filtered = unmatchedData;

    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.meNo?.toLowerCase().includes(keyword) ||
        d.assetNo?.toLowerCase().includes(keyword) ||
        d.item?.toLowerCase().includes(keyword) ||
        d.manufacturer?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [unmatchedData, filters]);

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

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(d => d.id)));
    }
  };

  // 「未確認」として確定
  const handleMarkAsUnconfirmed = () => {
    if (selectedIds.size === 0) {
      alert('「未確認」として確定するレコードを選択してください');
      return;
    }

    const confirmMark = confirm(
      `選択した${selectedIds.size}件を「未確認」（中間リストに存在しない）として確定しますか？`
    );
    if (!confirmMark) return;

    const now = new Date().toISOString();
    const selectedItems = data.filter(d => selectedIds.has(d.id));
    const updatedData = data.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          matchingStatus: '未確認' as MatchingStatus,
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setData(updatedData);

    // 親ウィンドウに通知
    if (window.opener) {
      window.opener.postMessage({
        type: 'ME_LEDGER_UNCONFIRMED',
        meItems: selectedItems.map(item => ({
          id: item.id,
          meNo: item.meNo,
          assetNo: item.assetNo,
          item: item.item,
          manufacturer: item.manufacturer,
          model: item.model,
          department: item.department,
          section: item.section,
          roomName: item.roomName,
          category: item.category,
          majorCategory: item.majorCategory,
          middleCategory: item.middleCategory,
          quantity: item.quantity,
          serialNo: item.serialNo,
        }))
      }, '*');
    }

    setSelectedIds(new Set());
    alert(`${selectedIds.size}件を「未確認」として確定しました。`);
  };

  const handleMatchFilterClick = (type: MatchFilterType) => {
    if (matchFilter === type) {
      setMatchFilter('none');
    } else {
      setMatchFilter(type);
    }
  };

  const resetMatchFilter = () => {
    setMatchFilter('none');
  };

  const getStatusColor = (status?: MatchingStatus) => {
    if (!status) return '#757575';
    switch (status) {
      case '完全一致': return '#4caf50';
      case '部分一致': return '#8bc34a';
      case '数量不一致': return '#ff9800';
      case '再確認': return '#2196f3';
      case '未確認': return '#f44336';
      case '未登録': return '#9c27b0';
      default: return '#999';
    }
  };

  // 統計情報
  const stats = {
    total: data.length,
    対応中: unmatchedData.length,
    突合済: matchedData.length,
    再確認: data.filter(d => d.matchingStatus === '再確認').length,
    未確認: data.filter(d => d.matchingStatus === '未確認').length
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
        backgroundColor: '#e8f5e9',
        borderBottom: '1px solid #a5d6a7',
        padding: '16px 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>
            ME管理台帳（対応中）
          </h1>
          <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
            ※フィルターは現有品調査リストと連動
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
          <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>ME管理台帳:</span>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            全{stats.total}件 |
            <span style={{ color: '#757575', fontWeight: '600', marginLeft: '4px' }}>対応中 {stats.対応中}</span> |
            <span style={{ color: '#4caf50', fontWeight: '600', marginLeft: '4px' }}>突合済 {stats.突合済}</span>
            {stats.再確認 > 0 && (
              <span style={{ color: getStatusColor('再確認'), fontWeight: '600', marginLeft: '4px' }}>| 再確認 {stats.再確認}</span>
            )}
          </span>
          {stats.対応中 === 0 && (
            <span style={{
              padding: '4px 12px',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px',
              color: '#2e7d32',
              fontWeight: '600',
              fontSize: '13px'
            }}>
              突合完了！
            </span>
          )}
        </div>
      </div>

      {/* 一致検索パネル */}
      <div style={{
        backgroundColor: '#e8f4fd',
        borderBottom: '1px solid #b8daff',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px', color: '#1976d2', fontWeight: '600' }}>
            一致検索（現有品との照合）:
          </span>
          {['category', 'assetNo', 'item', 'manufacturer'].map((type) => (
            <button
              key={type}
              onClick={() => handleMatchFilterClick(type as MatchFilterType)}
              style={{
                padding: '6px 16px',
                backgroundColor: matchFilter === type ? '#1976d2' : '#ffffff',
                color: matchFilter === type ? '#ffffff' : '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {type === 'category' ? 'カテゴリ' : type === 'assetNo' ? '資産番号' : type === 'item' ? '品目' : 'メーカー'}一致
            </button>
          ))}
          {matchFilter !== 'none' && (
            <button
              onClick={resetMatchFilter}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                marginLeft: '8px'
              }}
            >
              一致検索解除
            </button>
          )}
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
            gap: '12px'
          }}>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value, section: '' })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">部門: 全て</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

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

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">カテゴリ: 全て</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="キーワード検索..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />

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
                ME管理台帳リスト（対応中）
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
                  {selectedIds.size === filteredData.length && filteredData.length > 0 ? '全解除' : '全選択'}
                </button>
                <button
                  onClick={handleMarkAsUnconfirmed}
                  disabled={selectedIds.size === 0}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: selectedIds.size > 0 ? '#f44336' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  未確認として確定
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                表示: {filteredData.length}件 / 対応中全体: {unmatchedData.length}件
              </span>
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8f5e9' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>突合状況</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>ME番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>部門</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>シリアル番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>数量</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #a5d6a7', whiteSpace: 'nowrap' }}>点検日</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.id} style={{ backgroundColor: selectedIds.has(row.id) ? '#e8f5e9' : 'transparent' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
                        {row.matchingStatus ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: getStatusColor(row.matchingStatus) + '20',
                            color: getStatusColor(row.matchingStatus),
                            fontWeight: '600'
                          }}>
                            {row.matchingStatus}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>ー</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', color: '#2e7d32', fontWeight: '600' }}>{row.meNo}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.serialNo || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>{row.quantity}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.inspectionDate || '-'}</td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        {unmatchedData.length === 0 ? '全てのME管理台帳レコードの突合が完了しました' : '該当するデータがありません'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 使用方法 */}
          <div style={{
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            color: '#2e7d32'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>使用方法</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>このリストには未突合のME管理台帳レコードのみ表示されます</li>
              <li>現有品調査リストと見比べて、対応するレコードをチェックしてください</li>
              <li>現有品調査リスト側で「台帳と突合実行」をクリックすると突合が完了します</li>
              <li>現場に存在しない資産は「未確認として確定」をクリックしてください</li>
              <li>突合が完了したレコードはリストから消えます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
