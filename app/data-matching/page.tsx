'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useDataMatchingFilters } from '@/lib/hooks/useDataMatchingFilters';
import { SurveyData, LedgerData, MatchingStatus } from '@/lib/types/data-matching';
import { surveyDataSample, ledgerDataSample } from '@/lib/data/data-matching-sample';

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

export default function DataMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [data, setData] = useState<SurveyData[]>(surveyDataSample);
  const [ledgerData, setLedgerData] = useState<LedgerData[]>(ledgerDataSample);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState<SurveyData | null>(null);
  const [ledgerWindowRef, setLedgerWindowRef] = useState<Window | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [matchFilter, setMatchFilter] = useState<MatchFilterType>('none');

  // 突合実行モーダル
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchingStatusSelection, setMatchingStatusSelection] = useState<MatchingStatus>('完全一致');
  const [matchMemo, setMatchMemo] = useState('');
  const [pendingLedgerIds, setPendingLedgerIds] = useState<string[]>([]);

  // 個体管理リストモーダル
  const [showResultModal, setShowResultModal] = useState(false);

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

  // 未突合のデータのみ表示（matchingStatusがundefinedのもの）
  const unmatchedData = React.useMemo(() => {
    return filteredData.filter(item => !item.matchingStatus);
  }, [filteredData]);

  // 突合完了したデータ
  const matchedData = React.useMemo(() => {
    return data.filter(item => item.matchingStatus);
  }, [data]);

  // フィルターをLocalStorageに保存（他ウィンドウと連動）
  useEffect(() => {
    localStorage.setItem('dataMatchingFilters', JSON.stringify(filters));

    // 台帳ウィンドウが開いている場合、直接メッセージを送信
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
    }
  }, [filters, ledgerWindowRef]);

  // 一致検索フィルターをLocalStorageに保存（他ウィンドウと連動）
  useEffect(() => {
    localStorage.setItem('dataMatchingMatchFilter', matchFilter);

    // 台帳ウィンドウが開いている場合、直接メッセージを送信
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({ type: 'MATCH_FILTER_UPDATE', matchFilter }, '*');
    }
  }, [matchFilter, ledgerWindowRef]);

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
      // 台帳側からの一致検索フィルター更新を受け取る
      if (event.data.type === 'MATCH_FILTER_UPDATE' && event.source !== window) {
        setMatchFilter(event.data.matchFilter);
      }
      // 台帳側からの「未確認」確定通知を受け取る
      if (event.data.type === 'LEDGER_UNCONFIRMED') {
        const { ledgerItems } = event.data;
        const now = new Date().toISOString();
        // ledgerDataを更新
        setLedgerData(prev => prev.map(item => {
          const matchedItem = ledgerItems.find((li: any) => li.id === item.id);
          if (matchedItem) {
            return {
              ...item,
              matchingStatus: '未確認' as MatchingStatus,
              matchedAt: now,
              matchedBy: '現在のユーザー'
            };
          }
          return item;
        }));
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
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    const newWindow = window.open(
      `${basePath}/data-matching/ledger`,
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
    if (selectedIds.size === matchFilteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matchFilteredData.map(d => d.id)));
    }
  };

  // 突合実行ボタンクリック時（モーダルを開く）
  const handleMatchClick = () => {
    if (selectedIds.size === 0) {
      alert('現有リスト側から突合する項目を選択してください');
      return;
    }

    const ledgerSelectedIds = (window as any).ledgerSelectedIds as string[] | undefined;
    if (!ledgerSelectedIds || ledgerSelectedIds.length === 0) {
      alert('台帳リスト側から突合する項目を選択してください');
      return;
    }

    // 突合モーダルを表示
    setPendingLedgerIds(ledgerSelectedIds);
    setMatchingStatusSelection('完全一致');
    setMatchMemo('');
    setShowMatchModal(true);
  };

  // 突合を確定
  const executeMatch = () => {
    const now = new Date().toISOString();

    // 現有品調査リストを更新
    const updatedData = data.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          matchingStatus: matchingStatusSelection,
          matchedLedgerId: pendingLedgerIds[0], // 最初の台帳IDと紐付け
          matchedAt: now,
          matchedBy: '現在のユーザー',
          memo: matchMemo || item.memo
        };
      }
      return item;
    });

    // 資産台帳も更新
    const updatedLedgerData = ledgerData.map(item => {
      if (pendingLedgerIds.includes(item.id)) {
        return {
          ...item,
          matchingStatus: matchingStatusSelection,
          matchedSurveyId: Array.from(selectedIds)[0],
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setData(updatedData);
    setLedgerData(updatedLedgerData);
    setSelectedIds(new Set());
    setShowMatchModal(false);

    // 台帳側にも突合完了を通知
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({
        type: 'MATCH_COMPLETE',
        surveyIds: Array.from(selectedIds),
        ledgerIds: pendingLedgerIds,
        matchingStatus: matchingStatusSelection
      }, '*');
    }

    alert(`${selectedIds.size}件の突合が完了しました（${matchingStatusSelection}）`);
  };

  // 未登録として登録（台帳に存在しない機器）
  const handleMarkAsUnregistered = () => {
    if (selectedIds.size === 0) {
      alert('未登録として登録する項目を選択してください');
      return;
    }

    const confirmMark = confirm(
      `選択した${selectedIds.size}件を「未登録」（台帳に存在しない）として登録しますか？`
    );
    if (!confirmMark) return;

    const now = new Date().toISOString();
    const updatedData = data.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          matchingStatus: '未登録' as MatchingStatus,
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setData(updatedData);
    setSelectedIds(new Set());

    alert(`${selectedIds.size}件を「未登録」として登録しました`);
  };

  // 一致検索フィルターを適用したデータ（未突合のみ）
  const matchFilteredData = React.useMemo(() => {
    if (matchFilter === 'none') {
      return unmatchedData;
    }

    // 未突合の台帳データの対応するフィールドの値リストを取得
    const ledgerValues = new Set<string>();
    ledgerData.filter(l => !l.matchingStatus).forEach(ledger => {
      switch (matchFilter) {
        case 'category':
          if (ledger.category) ledgerValues.add(ledger.category);
          break;
        case 'assetNo':
          if (ledger.assetNo) ledgerValues.add(ledger.assetNo);
          break;
        case 'item':
          if (ledger.item) ledgerValues.add(ledger.item);
          break;
        case 'manufacturer':
          if (ledger.manufacturer) ledgerValues.add(ledger.manufacturer);
          break;
      }
    });

    // 現有品データをフィルタリング
    return unmatchedData.filter(survey => {
      switch (matchFilter) {
        case 'category':
          return survey.category && ledgerValues.has(survey.category);
        case 'assetNo':
          return survey.assetNo && ledgerValues.has(survey.assetNo);
        case 'item':
          return survey.item && ledgerValues.has(survey.item);
        case 'manufacturer':
          return survey.manufacturer && ledgerValues.has(survey.manufacturer);
        default:
          return true;
      }
    });
  }, [unmatchedData, matchFilter, ledgerData]);

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

  // 個体管理リストを生成
  const generateAssetList = () => {
    setShowResultModal(true);
  };

  // 突合を解除してデータ元リストに戻す
  const handleRevertToList = (item: typeof assetListData[0]) => {
    if (item.source === '現有品調査') {
      // 現有品調査リストの突合状況をリセット
      setData(prev => prev.map(d => {
        if (d.id === item.id) {
          return {
            ...d,
            matchingStatus: undefined,
            matchedLedgerId: undefined,
            matchedAt: undefined,
            matchedBy: undefined
          };
        }
        return d;
      }));

      // 紐付いていた台帳レコードもリセット
      if (item.matchedLedgerId) {
        setLedgerData(prev => prev.map(l => {
          if (l.id === item.matchedLedgerId) {
            return {
              ...l,
              matchingStatus: undefined,
              matchedSurveyId: undefined,
              matchedAt: undefined,
              matchedBy: undefined
            };
          }
          return l;
        }));

        // 台帳ウィンドウにも通知
        if (ledgerWindowRef && !ledgerWindowRef.closed) {
          ledgerWindowRef.postMessage({
            type: 'REVERT_MATCH',
            ledgerIds: [item.matchedLedgerId]
          }, '*');
        }
      }
    } else {
      // 資産台帳（未確認）の場合、台帳データの突合状況をリセット
      const ledgerId = item.id.replace('ledger-', '');
      setLedgerData(prev => prev.map(l => {
        if (l.id === ledgerId) {
          return {
            ...l,
            matchingStatus: undefined,
            matchedAt: undefined,
            matchedBy: undefined
          };
        }
        return l;
      }));

      // 台帳ウィンドウにも通知
      if (ledgerWindowRef && !ledgerWindowRef.closed) {
        ledgerWindowRef.postMessage({
          type: 'REVERT_MATCH',
          ledgerIds: [ledgerId]
        }, '*');
      }
    }
  };

  // 個体管理リストを登録
  const handleRegisterAssetList = () => {
    if (assetListData.length === 0) {
      alert('登録するデータがありません');
      return;
    }

    const confirmRegister = confirm(
      `個体管理リスト ${assetListData.length}件を登録しますか？\n登録後は編集できません。`
    );
    if (!confirmRegister) return;

    // 実際のAPIコールなどを実装
    alert(`個体管理リスト ${assetListData.length}件の登録が完了しました`);
    setShowResultModal(false);
  };

  // 個体管理リストのデータ（突合完了したレコードのみ）
  const assetListData = React.useMemo(() => {
    // 突合完了した現有品調査リスト
    const surveyItems = matchedData.map(item => ({
      ...item,
      source: '現有品調査' as const
    }));

    // 資産台帳の「未確認」データ（現場にないが台帳にはある）
    const unconfirmedLedgerItems = ledgerData
      .filter(item => item.matchingStatus === '未確認')
      .map(item => ({
        id: `ledger-${item.id}`,
        qrCode: '-',
        assetNo: item.assetNo,
        department: item.department,
        section: item.section,
        roomName: item.roomName,
        category: item.category,
        majorCategory: item.majorCategory,
        middleCategory: item.middleCategory,
        item: item.item,
        manufacturer: item.manufacturer,
        model: item.model,
        quantity: item.quantity,
        acquisitionDate: item.acquisitionDate,
        matchingStatus: '未確認' as MatchingStatus,
        matchedLedgerId: item.id,
        memo: '台帳にのみ存在',
        source: '資産台帳' as const
      }));

    return [...surveyItems, ...unconfirmedLedgerItems];
  }, [matchedData, ledgerData]);

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
    未突合: data.filter(d => !d.matchingStatus).length,
    完全一致: data.filter(d => d.matchingStatus === '完全一致').length,
    部分一致: data.filter(d => d.matchingStatus === '部分一致').length,
    数量不一致: data.filter(d => d.matchingStatus === '数量不一致').length,
    再確認: data.filter(d => d.matchingStatus === '再確認').length,
    未確認: data.filter(d => d.matchingStatus === '未確認').length,
    未登録: data.filter(d => d.matchingStatus === '未登録').length
  };

  // 台帳の統計
  const ledgerStats = {
    total: ledgerData.length,
    未突合: ledgerData.filter(d => !d.matchingStatus).length,
    突合済: ledgerData.filter(d => d.matchingStatus).length,
    未確認: ledgerData.filter(d => d.matchingStatus === '未確認').length
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={generateAssetList}
              style={{
                padding: '8px 16px',
                backgroundColor: assetListData.length > 0 ? '#4caf50' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: assetListData.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              個体管理リスト確認（{assetListData.length}件）
            </button>
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
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>現有品調査リスト:</span>
            <span style={{ fontSize: '14px', color: '#2c3e50' }}>
              全{stats.total}件 |
              <span style={{ color: '#757575', fontWeight: '600', marginLeft: '4px' }}>未突合 {stats.未突合}</span> |
              <span style={{ color: getStatusColor('完全一致'), fontWeight: '600', marginLeft: '4px' }}>完全一致 {stats.完全一致}</span> |
              <span style={{ color: getStatusColor('部分一致'), fontWeight: '600', marginLeft: '4px' }}>部分一致 {stats.部分一致}</span> |
              <span style={{ color: getStatusColor('数量不一致'), fontWeight: '600', marginLeft: '4px' }}>数量不一致 {stats.数量不一致}</span> |
              <span style={{ color: getStatusColor('再確認'), fontWeight: '600', marginLeft: '4px' }}>再確認 {stats.再確認}</span> |
              <span style={{ color: getStatusColor('未登録'), fontWeight: '600', marginLeft: '4px' }}>未登録 {stats.未登録}</span>
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>資産台帳:</span>
            <span style={{ fontSize: '14px', color: '#2c3e50' }}>
              全{ledgerStats.total}件 |
              <span style={{ color: '#757575', fontWeight: '600', marginLeft: '4px' }}>未突合 {ledgerStats.未突合}</span> |
              <span style={{ color: '#4caf50', fontWeight: '600', marginLeft: '4px' }}>突合済 {ledgerStats.突合済}</span> |
              <span style={{ color: getStatusColor('未確認'), fontWeight: '600', marginLeft: '4px' }}>未確認 {ledgerStats.未確認}</span>
            </span>
          </div>
          {stats.未突合 === 0 && ledgerStats.未突合 === 0 && (
            <div style={{
              marginTop: '8px',
              padding: '8px 16px',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px',
              color: '#2e7d32',
              fontWeight: '600'
            }}>
              突合完了！全てのレコードの突合が完了しました。
            </div>
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
            一致検索（台帳との照合）:
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
              ※ 未突合の台帳と{matchFilter === 'category' ? 'カテゴリ' : matchFilter === 'assetNo' ? '資産番号' : matchFilter === 'item' ? '品目' : 'メーカー'}が一致するレコードを表示中
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
                現有品調査リスト（未突合）
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
                  onClick={handleMarkAsUnregistered}
                  disabled={selectedIds.size === 0}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: selectedIds.size > 0 ? '#9c27b0' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  未登録として登録
                </button>
                <button
                  onClick={handleMatchClick}
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
                  台帳と突合実行
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
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.acquisitionDate || '-'}</td>
                    </tr>
                  ))}
                  {matchFilteredData.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        {unmatchedData.length === 0 ? '全ての現有品の突合が完了しました' : '該当するデータがありません'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 突合実行モーダル */}
      {showMatchModal && (
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
            maxWidth: '600px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                突合実行
              </h3>
              <button
                onClick={() => setShowMatchModal(false)}
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

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
                  現有品調査: <strong>{selectedIds.size}件</strong> と 資産台帳: <strong>{pendingLedgerIds.length}件</strong> を突合します
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  突合状況 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <select
                  value={matchingStatusSelection}
                  onChange={(e) => setMatchingStatusSelection(e.target.value as MatchingStatus)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {MATCHING_STATUS_OPTIONS.filter(s => s !== '未確認' && s !== '未登録').map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#5a6c7d' }}>
                  <div><strong>完全一致:</strong> 全ての情報が一致</div>
                  <div><strong>部分一致:</strong> 一部情報に差異あり（型式・メーカー名の表記ゆれ等）</div>
                  <div><strong>数量不一致:</strong> 数量に差異あり</div>
                  <div><strong>再確認:</strong> 後で再度確認が必要</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  メモ（任意）
                </label>
                <textarea
                  value={matchMemo}
                  onChange={(e) => setMatchMemo(e.target.value)}
                  placeholder="突合時の注意事項やコメントを入力"
                  rows={3}
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
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowMatchModal(false)}
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
                onClick={executeMatch}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                突合を確定
              </button>
            </div>
          </div>
        </div>
      )}

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
                  value={editingData.matchingStatus || ''}
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
                  <option value="">（未設定）</option>
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

      {/* Result Modal - 個体管理リスト */}
      {showResultModal && (
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
            width: '95%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                  個体管理リスト（突合完了分）
                </h3>
                <div style={{ fontSize: '13px', color: '#5a6c7d', marginTop: '4px' }}>
                  突合完了した現有品調査リスト + 未確認の台帳データ = 合計 {assetListData.length}件
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
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

            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              {assetListData.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  まだ突合が完了したレコードがありません。<br />
                  現有品調査リストと資産台帳を突合してください。
                </div>
              ) : (
                <>
                  {/* ステータスサマリー */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {(['完全一致', '部分一致', '数量不一致', '再確認', '未確認', '未登録'] as MatchingStatus[]).map(status => {
                      const count = assetListData.filter(d => d.matchingStatus === status).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={status}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '13px',
                            backgroundColor: getStatusColor(status) + '20',
                            color: getStatusColor(status),
                            fontWeight: '600'
                          }}
                        >
                          {status}: {count}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>操作</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>データ元</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合状況</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>QRコード</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部門</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>数量</th>
                          <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メモ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetListData.map((row) => (
                          <tr
                            key={row.id}
                            style={{
                              backgroundColor: row.source === '資産台帳' ? '#fff3e0' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => handleRevertToList(row)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  backgroundColor: '#ff9800',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                元に戻す
                              </button>
                            </td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                backgroundColor: row.source === '現有品調査' ? '#e3f2fd' : '#fff3e0',
                                color: row.source === '現有品調査' ? '#1976d2' : '#e65100'
                              }}>
                                {row.source}
                              </span>
                            </td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                backgroundColor: getStatusColor(row.matchingStatus) + '20',
                                color: getStatusColor(row.matchingStatus),
                                fontWeight: '600'
                              }}>
                                {row.matchingStatus}
                              </span>
                            </td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.qrCode}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo || '-'}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model || '-'}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>{row.quantity}</td>
                            <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0' }}>{row.memo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#5a6c7d' }}>
                ※「元に戻す」でデータ元リストに戻して再編集できます
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowResultModal(false)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  閉じる
                </button>
                <button
                  onClick={handleRegisterAssetList}
                  disabled={assetListData.length === 0}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: assetListData.length > 0 ? '#4caf50' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: assetListData.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  個体管理リスト登録
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
