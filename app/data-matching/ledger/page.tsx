'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LedgerData, MatchingStatus, DataMatchingFilters } from '@/lib/types/data-matching';
import { ledgerDataSample, surveyDataSample } from '@/lib/data/data-matching-sample';
import { FACILITY_CONSTANTS } from '@/lib/types/facility';

// 一致検索タイプ
type MatchFilterType = 'none' | 'category' | 'assetNo' | 'item' | 'manufacturer';

// 突合状況オプション（未突合はundefinedで表現するので除外）
const MATCHING_STATUS_OPTIONS: MatchingStatus[] = [
  '完全一致',
  '部分一致',
  '数量不一致',
  '再確認',
  '未確認',
  '未登録'
];

export default function LedgerWindowPage() {
  const [data, setData] = useState<LedgerData[]>(ledgerDataSample);
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
    // 一致検索フィルターも読み込む
    const savedMatchFilter = localStorage.getItem('dataMatchingMatchFilter');
    if (savedMatchFilter && ['none', 'category', 'assetNo', 'item', 'manufacturer'].includes(savedMatchFilter)) {
      setMatchFilter(savedMatchFilter as MatchFilterType);
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

  // 一致検索フィルター変更時にLocalStorageに保存し、親ウィンドウに通知
  useEffect(() => {
    localStorage.setItem('dataMatchingMatchFilter', matchFilter);

    // 親ウィンドウに一致検索フィルター変更を通知
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

  // 他のウィンドウからのフィルター更新と突合完了を受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FILTER_UPDATE' && event.source !== window) {
        setFilters(event.data.filters);
      }
      // 一致検索フィルター更新を受け取る
      if (event.data.type === 'MATCH_FILTER_UPDATE' && event.source !== window) {
        setMatchFilter(event.data.matchFilter);
      }
      // 突合完了通知を受け取る
      if (event.data.type === 'MATCH_COMPLETE') {
        const { ledgerIds, matchingStatus } = event.data;
        // 突合完了したデータを更新（関数型更新で最新のstateを参照）
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
      // 突合解除（元に戻す）通知を受け取る
      if (event.data.type === 'REVERT_MATCH') {
        const { ledgerIds } = event.data;
        setData(prev => prev.map(item => {
          if (ledgerIds.includes(item.id)) {
            return {
              ...item,
              matchingStatus: undefined,
              matchedSurveyId: undefined,
              matchedAt: undefined,
              matchedBy: undefined
            };
          }
          return item;
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 未突合のデータのみ（matchingStatusがundefinedのもの）
  const unmatchedData = useMemo(() => {
    return data.filter(item => !item.matchingStatus);
  }, [data]);

  // 突合完了したデータ
  const matchedData = useMemo(() => {
    return data.filter(item => item.matchingStatus);
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

  // フィルタリング（未突合のデータのみ対象）
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
    if (filters.majorCategory) {
      filtered = filtered.filter(d => d.majorCategory === filters.majorCategory);
    }
    if (filters.middleCategory) {
      filtered = filtered.filter(d => d.middleCategory === filters.middleCategory);
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
    if (selectedIds.size === matchFilteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matchFilteredData.map(d => d.id)));
    }
  };

  // 選択したレコードを「未確認」として確定（現場にないが台帳にある）
  const handleMarkAsUnconfirmed = () => {
    if (selectedIds.size === 0) {
      alert('「未確認」として確定するレコードを選択してください');
      return;
    }

    const confirmMark = confirm(
      `選択した${selectedIds.size}件を「未確認」（現場に存在しない）として確定しますか？\n確定後、リストから消えて個体管理リストに追加されます。`
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
      const confirmedItems = selectedItems.map(item => ({
        id: item.id,
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
        acquisitionDate: item.acquisitionDate
      }));
      window.opener.postMessage({
        type: 'LEDGER_UNCONFIRMED',
        ledgerItems: confirmedItems
      }, '*');
    }

    setSelectedIds(new Set());
    alert(`${selectedIds.size}件を「未確認」として確定しました。\n個体管理リストに追加されます。`);
  };

  // 一致検索フィルターを適用したデータ（未突合のみ）
  const matchFilteredData = useMemo(() => {
    if (matchFilter === 'none') {
      return filteredData;
    }

    // 未突合の現有品データの対応するフィールドの値リストを取得
    const surveyValues = new Set<string>();
    surveyDataSample.filter(s => !s.matchingStatus).forEach(survey => {
      switch (matchFilter) {
        case 'category':
          if (survey.category) surveyValues.add(survey.category);
          break;
        case 'assetNo':
          if (survey.assetNo) surveyValues.add(survey.assetNo);
          break;
        case 'item':
          if (survey.item) surveyValues.add(survey.item);
          break;
        case 'manufacturer':
          if (survey.manufacturer) surveyValues.add(survey.manufacturer);
          break;
      }
    });

    // 台帳データをフィルタリング
    return filteredData.filter(ledger => {
      switch (matchFilter) {
        case 'category':
          return ledger.category && surveyValues.has(ledger.category);
        case 'assetNo':
          return ledger.assetNo && surveyValues.has(ledger.assetNo);
        case 'item':
          return ledger.item && surveyValues.has(ledger.item);
        case 'manufacturer':
          return ledger.manufacturer && surveyValues.has(ledger.manufacturer);
        default:
          return true;
      }
    });
  }, [filteredData, matchFilter]);

  // 一致検索ボタンのハンドラー
  const handleMatchFilterClick = (type: MatchFilterType) => {
    if (matchFilter === type) {
      setMatchFilter('none');
    } else {
      setMatchFilter(type);
    }
  };

  // 一致検索解除
  const resetMatchFilter = () => {
    setMatchFilter('none');
  };

  const getStatusColor = (status?: MatchingStatus) => {
    if (!status) return '#757575'; // 未突合
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

  // 統計情報を計算
  const stats = {
    total: data.length,
    未突合: unmatchedData.length,
    突合済: matchedData.length,
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
            固定資産台帳（未突合）
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
          <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>資産台帳:</span>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            全{stats.total}件 |
            <span style={{ color: '#757575', fontWeight: '600', marginLeft: '4px' }}>未突合 {stats.未突合}</span> |
            <span style={{ color: '#4caf50', fontWeight: '600', marginLeft: '4px' }}>突合済 {stats.突合済}</span> |
            <span style={{ color: getStatusColor('未確認'), fontWeight: '600', marginLeft: '4px' }}>未確認 {stats.未確認}</span>
          </span>
          {stats.未突合 === 0 && (
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
          <button
            onClick={() => handleMatchFilterClick('category')}
            style={{
              padding: '6px 16px',
              backgroundColor: matchFilter === 'category' ? '#1976d2' : '#ffffff',
              color: matchFilter === 'category' ? '#ffffff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            category
          </button>
          <button
            onClick={() => handleMatchFilterClick('assetNo')}
            style={{
              padding: '6px 16px',
              backgroundColor: matchFilter === 'assetNo' ? '#1976d2' : '#ffffff',
              color: matchFilter === 'assetNo' ? '#ffffff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            資産番号一致
          </button>
          <button
            onClick={() => handleMatchFilterClick('item')}
            style={{
              padding: '6px 16px',
              backgroundColor: matchFilter === 'item' ? '#1976d2' : '#ffffff',
              color: matchFilter === 'item' ? '#ffffff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            個体管理品目一致
          </button>
          <button
            onClick={() => handleMatchFilterClick('manufacturer')}
            style={{
              padding: '6px 16px',
              backgroundColor: matchFilter === 'manufacturer' ? '#1976d2' : '#ffffff',
              color: matchFilter === 'manufacturer' ? '#ffffff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            メーカー一致
          </button>
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
          {matchFilter !== 'none' && (
            <span style={{ fontSize: '13px', color: '#1976d2', marginLeft: '8px' }}>
              ※ 未突合の現有品と{matchFilter === 'category' ? 'カテゴリ' : matchFilter === 'assetNo' ? '資産番号' : matchFilter === 'item' ? '品目' : 'メーカー'}が一致するレコードを表示中
            </span>
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
            gap: '12px',
            marginBottom: '12px'
          }}>
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
                固定資産台帳リスト（未突合）
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
                  {selectedIds.size === matchFilteredData.length && matchFilteredData.length > 0 ? '全解除' : '全選択'}
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
                表示: {matchFilteredData.length}件 / 未突合全体: {unmatchedData.length}件
                {matchFilter !== 'none' && (
                  <span style={{ color: '#1976d2', marginLeft: '8px' }}>
                    （一致検索適用中）
                  </span>
                )}
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
                        checked={selectedIds.size === matchFilteredData.length && matchFilteredData.length > 0}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
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
                  </tr>
                </thead>
                <tbody>
                  {matchFilteredData.map((row) => (
                    <tr key={row.id} style={{ backgroundColor: selectedIds.has(row.id) ? '#e3f2fd' : 'transparent' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
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
                    </tr>
                  ))}
                  {matchFilteredData.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        {unmatchedData.length === 0 ? '全ての台帳レコードの突合が完了しました' : '該当するデータがありません'}
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
              <li>このリストには未突合の資産台帳レコードのみ表示されます</li>
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
