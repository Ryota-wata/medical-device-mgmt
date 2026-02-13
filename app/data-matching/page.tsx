'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useDataMatchingFilters } from '@/lib/hooks/useDataMatchingFilters';
import { SurveyData, LedgerData, MatchingStatus } from '@/lib/types/data-matching';
import { surveyDataSample, ledgerDataSample, meLedgerDataSample } from '@/lib/data/data-matching-sample';

// 整形済みリスト（asset-matchingで作成されたリスト）の型
interface CleanedList {
  id: string;
  name: string;
  type: 'fixed-asset' | 'me-ledger' | 'other';
  recordCount: number;
  createdAt: string;
  createdBy: string;
}

// 統合リストアイテム（突合結果を蓄積）
interface MergedListItem {
  id: string;
  qrCode?: string;
  assetNo?: string;
  meNo?: string;
  department: string;
  section: string;
  roomName?: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  quantity: number;
  acquisitionDate?: string;
  sourceListNames: string[];  // どのリストから来たか
  matchingStatus?: MatchingStatus;  // undefined = 未突合
  memo?: string;
}

// 一致検索タイプ
type MatchFilterType = 'none' | 'category' | 'assetNo' | 'item' | 'manufacturer';

// 突合状況オプション
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

  // 画面モード: 'select' = リスト選択, 'matching' = 突合作業中
  const [mode, setMode] = useState<'select' | 'matching'>('select');

  // 統合済みリスト名の履歴
  const [mergedListNames, setMergedListNames] = useState<string[]>(['現有品調査リスト']);

  // 統合リスト（突合結果を蓄積していく）
  const [mergedList, setMergedList] = useState<MergedListItem[]>(() => {
    // 初期状態: 現有品調査リストをそのまま統合リストとして使用
    return surveyDataSample.map(item => ({
      id: item.id,
      qrCode: item.qrCode,
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
      sourceListNames: ['現有品調査リスト'],
      matchingStatus: undefined,  // 初期状態は未突合
      memo: undefined,
    }));
  });

  // 整形済みリスト（asset-matchingで作成されたリスト）
  const [availableLists, setAvailableLists] = useState<CleanedList[]>([
    {
      id: 'list-1',
      name: '固定資産台帳_2024年12月',
      type: 'fixed-asset',
      recordCount: ledgerDataSample.length,
      createdAt: '2024-12-03 14:30',
      createdBy: '田中太郎',
    },
    {
      id: 'list-2',
      name: 'ME管理台帳_外来部門',
      type: 'me-ledger',
      recordCount: meLedgerDataSample.length,
      createdAt: '2024-12-05 10:15',
      createdBy: '田中太郎',
    },
  ]);

  // 現在選択中のリスト
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // 現在突合中のリストのデータ
  const [currentLedgerData, setCurrentLedgerData] = useState<LedgerData[]>([]);

  // 突合作業用: 統合リストから未突合のものを抽出
  const [workingMergedData, setWorkingMergedData] = useState<MergedListItem[]>([]);

  // UI状態
  const [ledgerWindowRef, setLedgerWindowRef] = useState<Window | null>(null);
  const [selectedMergedIds, setSelectedMergedIds] = useState<Set<string>>(new Set());
  const [matchFilter, setMatchFilter] = useState<MatchFilterType>('none');

  // 突合実行モーダル
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchingStatusSelection, setMatchingStatusSelection] = useState<MatchingStatus>('完全一致');
  const [pendingLedgerIds, setPendingLedgerIds] = useState<string[]>([]);

  // 原本リストモーダル
  const [showResultModal, setShowResultModal] = useState(false);

  // タブ切り替え: 'pending' = 対応中, 'completed' = 対応済み
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // 対応済みタブ用: 突合状況フィルター
  const [completedStatusFilter, setCompletedStatusFilter] = useState<string>('');

  // フィルターフック（統合リストに対して適用）
  const {
    filters,
    setFilters,
    filteredData: filteredMergedData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    resetFilters
  } = useDataMatchingFilters({
    data: workingMergedData.map(item => ({
      ...item,
      matchingStatus: undefined  // フィルター用にはundefinedに
    })) as SurveyData[]
  });

  // フィルター適用後の作業データ
  const displayMergedData = React.useMemo(() => {
    return workingMergedData.filter(item => {
      const matchesFilter = filteredMergedData.some(f => f.id === item.id);
      return matchesFilter;
    });
  }, [workingMergedData, filteredMergedData]);

  // フィルターをLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('dataMatchingFilters', JSON.stringify(filters));

    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({ type: 'FILTER_UPDATE', filters }, '*');
    }
  }, [filters, ledgerWindowRef]);

  // 一致検索フィルターをLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('dataMatchingMatchFilter', matchFilter);

    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({ type: 'MATCH_FILTER_UPDATE', matchFilter }, '*');
    }
  }, [matchFilter, ledgerWindowRef]);

  // 他のウィンドウからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'FILTER_UPDATE' && event.source !== window) {
        setFilters(event.data.filters);
      }
      if (event.data.type === 'LEDGER_SELECTION') {
        (window as any).ledgerSelectedIds = event.data.selectedIds;
      }
      if (event.data.type === 'MATCH_FILTER_UPDATE' && event.source !== window) {
        setMatchFilter(event.data.matchFilter);
      }
      // 台帳側からの「未確認」確定通知（台帳にあって統合リストにない）
      if (event.data.type === 'LEDGER_UNCONFIRMED') {
        handleLedgerUnconfirmed(event.data.ledgerItems);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedListId]);

  // 台帳側で「未確認」になったレコードを統合リストに追加
  const handleLedgerUnconfirmed = (ledgerItems: any[]) => {
    const currentList = availableLists.find(l => l.id === selectedListId);
    const currentListName = currentList?.name || '台帳';

    const newItems: MergedListItem[] = ledgerItems.map(item => ({
      id: `merged-ledger-${item.id}-${Date.now()}`,
      assetNo: item.assetNo,
      meNo: item.meNo,
      department: item.department,
      section: item.section,
      roomName: item.roomName,
      category: item.category,
      majorCategory: item.majorCategory,
      middleCategory: item.middleCategory,
      item: item.item,
      manufacturer: item.manufacturer,
      model: item.model,
      serialNo: item.serialNo,
      quantity: item.quantity,
      acquisitionDate: item.acquisitionDate,
      sourceListNames: [currentListName],
      matchingStatus: '未確認' as MatchingStatus,
      memo: '台帳のみ存在（現場に未確認）',
    }));

    // 統合リストに追加
    setMergedList(prev => [...prev, ...newItems]);

    // workingMergedDataにも追加（UIに即時反映させるため）
    setWorkingMergedData(prev => [...prev, ...newItems]);

    // 台帳データを更新
    setCurrentLedgerData(prev => prev.map(l => {
      const matched = ledgerItems.find(li => li.id === l.id);
      if (matched) {
        return { ...l, matchingStatus: '未確認' as MatchingStatus };
      }
      return l;
    }));
  };

  const handleBack = () => {
    if (mode === 'matching') {
      if (confirm('突合作業を中断してリスト選択に戻りますか？\n作業中の突合結果は保持されます。')) {
        closeLedgerWindow();
        setMode('select');
        setSelectedListId(null);
        setSelectedMergedIds(new Set());
        setMatchFilter('none');
      }
    } else {
      router.push('/main');
    }
  };

  const closeLedgerWindow = () => {
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.close();
    }
    setLedgerWindowRef(null);
  };

  // リスト選択して突合開始
  const startMatching = () => {
    if (!selectedListId) {
      alert('突合するリストを選択してください');
      return;
    }

    const list = availableLists.find(l => l.id === selectedListId);
    if (!list) return;

    setMode('matching');

    // リストの種類に応じてデータをセット
    if (list.type === 'fixed-asset') {
      setCurrentLedgerData(ledgerDataSample.map(d => ({ ...d, matchingStatus: undefined })));
    } else if (list.type === 'me-ledger') {
      // ME管理台帳データをLedgerData形式に変換
      setCurrentLedgerData(meLedgerDataSample.map(d => ({
        id: d.id,
        assetNo: d.assetNo || d.meNo,
        department: d.department,
        section: d.section,
        roomName: d.roomName,
        category: d.category,
        majorCategory: d.majorCategory,
        middleCategory: d.middleCategory,
        item: d.item,
        manufacturer: d.manufacturer,
        model: d.model,
        quantity: d.quantity,
        acquisitionDate: d.inspectionDate || '',
        matchingStatus: undefined,
      })));
    }

    // 作業用データ: 統合リストの全件を作業対象にする
    // （既に突合済みのものも表示するが、未突合のものだけ選択可能にする）
    setWorkingMergedData([...mergedList]);
  };

  const openLedgerWindow = () => {
    const width = 1400;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    const currentList = availableLists.find(l => l.id === selectedListId);
    const ledgerPath = currentList?.type === 'me-ledger'
      ? `${basePath}/data-matching/me-ledger`
      : `${basePath}/data-matching/ledger`;

    const newWindow = window.open(
      ledgerPath,
      'ledgerWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      setLedgerWindowRef(newWindow);

      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          setLedgerWindowRef(null);
          clearInterval(checkWindowClosed);
        }
      }, 1000);
    }
  };

  // チェックボックスの選択処理
  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedMergedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMergedIds(newSelected);
  };

  // 一括選択処理
  const handleSelectAll = () => {
    if (selectedMergedIds.size === matchFilteredData.length) {
      setSelectedMergedIds(new Set());
    } else {
      setSelectedMergedIds(new Set(matchFilteredData.map(d => d.id)));
    }
  };

  // 突合実行ボタンクリック時
  const handleMatchClick = () => {
    if (selectedMergedIds.size === 0) {
      alert('統合リスト側から突合する項目を選択してください');
      return;
    }

    const ledgerSelectedIds = (window as any).ledgerSelectedIds as string[] | undefined;
    if (!ledgerSelectedIds || ledgerSelectedIds.length === 0) {
      alert('台帳から突合する項目を選択してください');
      return;
    }

    setPendingLedgerIds(ledgerSelectedIds);
    setMatchingStatusSelection('完全一致');
    setShowMatchModal(true);
  };

  // 突合を確定
  const executeMatch = () => {
    const now = new Date().toISOString();
    const currentList = availableLists.find(l => l.id === selectedListId);
    const currentListName = currentList?.name || '';

    // 選択された統合リストアイテム
    const selectedMergedItems = workingMergedData.filter(m => selectedMergedIds.has(m.id));
    const selectedLedgers = currentLedgerData.filter(l => pendingLedgerIds.includes(l.id));

    // 統合リストを更新
    const updatedMergedList = mergedList.map(item => {
      if (selectedMergedIds.has(item.id)) {
        const ledger = selectedLedgers[0];
        return {
          ...item,
          assetNo: item.assetNo || ledger?.assetNo,
          sourceListNames: [...item.sourceListNames, currentListName],
          matchingStatus: matchingStatusSelection,
        };
      }
      return item;
    });

    // 作業データも更新
    const updatedWorkingData = workingMergedData.map(item => {
      if (selectedMergedIds.has(item.id)) {
        const ledger = selectedLedgers[0];
        return {
          ...item,
          assetNo: item.assetNo || ledger?.assetNo,
          sourceListNames: [...item.sourceListNames, currentListName],
          matchingStatus: matchingStatusSelection,
        };
      }
      return item;
    });

    // 台帳データも更新
    const updatedLedgerData = currentLedgerData.map(item => {
      if (pendingLedgerIds.includes(item.id)) {
        return {
          ...item,
          matchingStatus: matchingStatusSelection,
          matchedAt: now,
          matchedBy: '現在のユーザー'
        };
      }
      return item;
    });

    setMergedList(updatedMergedList);
    setWorkingMergedData(updatedWorkingData);
    setCurrentLedgerData(updatedLedgerData);
    setSelectedMergedIds(new Set());
    setShowMatchModal(false);

    // 台帳側にも通知
    if (ledgerWindowRef && !ledgerWindowRef.closed) {
      ledgerWindowRef.postMessage({
        type: 'MATCH_COMPLETE',
        ledgerIds: pendingLedgerIds,
        matchingStatus: matchingStatusSelection
      }, '*');
    }

    alert(`${selectedMergedIds.size}件の突合が完了しました（${matchingStatusSelection}）`);
  };

  // 未登録として登録（統合リストにあるが台帳にない）
  const handleMarkAsUnregistered = () => {
    if (selectedMergedIds.size === 0) {
      alert('未登録として登録する項目を選択してください');
      return;
    }

    const currentList = availableLists.find(l => l.id === selectedListId);
    const confirmMark = confirm(
      `選択した${selectedMergedIds.size}件を「未登録」（${currentList?.name}に存在しない）として登録しますか？`
    );
    if (!confirmMark) return;

    const currentListName = currentList?.name || '';

    // 統合リストを更新
    const updatedMergedList = mergedList.map(item => {
      if (selectedMergedIds.has(item.id)) {
        return {
          ...item,
          sourceListNames: [...item.sourceListNames, `${currentListName}(未登録)`],
          matchingStatus: '未登録' as MatchingStatus,
          memo: `${currentListName}に存在しない`,
        };
      }
      return item;
    });

    // 作業データも更新
    const updatedWorkingData = workingMergedData.map(item => {
      if (selectedMergedIds.has(item.id)) {
        return {
          ...item,
          sourceListNames: [...item.sourceListNames, `${currentListName}(未登録)`],
          matchingStatus: '未登録' as MatchingStatus,
          memo: `${currentListName}に存在しない`,
        };
      }
      return item;
    });

    setMergedList(updatedMergedList);
    setWorkingMergedData(updatedWorkingData);
    setSelectedMergedIds(new Set());

    alert(`${selectedMergedIds.size}件を「未登録」として登録しました`);
  };

  // 現在選択中のリスト（useMemoより先に定義）
  const currentList = availableLists.find(l => l.id === selectedListId);

  // タブに基づいてフィルタリング
  const tabFilteredData = React.useMemo(() => {
    const currentListName = currentList?.name || '';

    return displayMergedData.filter(item => {
      const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentListName) ||
        item.sourceListNames.includes(`${currentListName}(未登録)`);
      const isRecheck = item.matchingStatus === '再確認';

      if (activeTab === 'pending') {
        // 対応中: 現在の台帳と突合されていない、または再確認
        return !isMatchedWithCurrentLedger || isRecheck;
      } else {
        // 対応済み: 現在の台帳と突合済みで、再確認ではない
        const isCompleted = isMatchedWithCurrentLedger && !isRecheck;
        if (!isCompleted) return false;

        // 突合状況フィルターを適用
        if (completedStatusFilter && item.matchingStatus !== completedStatusFilter) {
          return false;
        }
        return true;
      }
    });
  }, [displayMergedData, activeTab, currentList?.name, completedStatusFilter]);

  // 一致検索フィルターを適用
  const matchFilteredData = React.useMemo(() => {
    if (matchFilter === 'none') {
      return tabFilteredData;
    }

    const ledgerValues = new Set<string>();
    currentLedgerData.filter(l => !l.matchingStatus).forEach(ledger => {
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

    return tabFilteredData.filter(item => {
      switch (matchFilter) {
        case 'category':
          return item.category && ledgerValues.has(item.category);
        case 'assetNo':
          return item.assetNo && ledgerValues.has(item.assetNo);
        case 'item':
          return item.item && ledgerValues.has(item.item);
        case 'manufacturer':
          return item.manufacturer && ledgerValues.has(item.manufacturer);
        default:
          return true;
      }
    });
  }, [tabFilteredData, matchFilter, currentLedgerData]);

  const handleMatchFilterClick = (type: MatchFilterType) => {
    if (matchFilter === type) {
      setMatchFilter('none');
    } else {
      setMatchFilter(type);
    }
  };

  // タブ切り替え時に選択と一致検索をクリア
  const handleTabChange = (tab: 'pending' | 'completed') => {
    setActiveTab(tab);
    setSelectedMergedIds(new Set());
    if (tab === 'completed') {
      setMatchFilter('none');
    } else {
      // 対応中タブに切り替え時は突合状況フィルターをリセット
      setCompletedStatusFilter('');
    }
  };

  // 現在のリストとの突合を完了
  const completeCurrentMatching = () => {
    const currentList = availableLists.find(l => l.id === selectedListId);
    if (!currentList) return;

    const unmatchedMergedCount = workingMergedData.filter(m =>
      !m.sourceListNames.includes(currentList.name) &&
      !m.sourceListNames.includes(`${currentList.name}(未登録)`)
    ).length;
    const ledgerUnmatched = currentLedgerData.filter(l => !l.matchingStatus).length;

    if (unmatchedMergedCount > 0 || ledgerUnmatched > 0) {
      const confirmComplete = confirm(
        `未突合の項目が残っています:\n` +
        `・統合リスト: ${unmatchedMergedCount}件\n` +
        `・${currentList.name}: ${ledgerUnmatched}件\n\n` +
        `このまま突合を完了しますか？`
      );
      if (!confirmComplete) return;
    }

    // 統合リスト名の履歴を更新
    setMergedListNames(prev => [...prev, currentList.name]);

    // このリストを選択肢から削除
    setAvailableLists(prev => prev.filter(l => l.id !== selectedListId));

    closeLedgerWindow();
    setMode('select');
    setSelectedListId(null);
    setSelectedMergedIds(new Set());
    setMatchFilter('none');

    alert(`「${currentList.name}」との突合が完了しました。\n統合リストが更新されました。`);
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
    mergedTotal: mergedList.length,
    currentLedgerTotal: currentLedgerData.length,
    currentLedgerUnmatched: currentLedgerData.filter(d => !d.matchingStatus).length,
    currentLedgerMatched: currentLedgerData.filter(d => d.matchingStatus).length,
  };

  // タブ別件数計算
  // 対応中: 現在の台帳とまだ突合されていないもの + 再確認
  const pendingItems = workingMergedData.filter(item => {
    const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentList?.name || '') ||
      item.sourceListNames.includes(`${currentList?.name}(未登録)`);
    const isRecheck = item.matchingStatus === '再確認';
    // 現在の台帳と突合されていない、または再確認のものが対応中
    return !isMatchedWithCurrentLedger || isRecheck;
  });

  // 対応済み: 現在の台帳と突合済み（再確認以外）
  const completedItems = workingMergedData.filter(item => {
    const isMatchedWithCurrentLedger = item.sourceListNames.includes(currentList?.name || '') ||
      item.sourceListNames.includes(`${currentList?.name}(未登録)`);
    const isRecheck = item.matchingStatus === '再確認';
    // 現在の台帳と突合済みで、再確認ではないものが対応済み
    return isMatchedWithCurrentLedger && !isRecheck;
  });

  // 進捗計算
  const totalItems = workingMergedData.length;
  const completedCount = completedItems.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          データ統合
        </div>
        <div style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={() => router.push('/main')}
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
          メイン画面に戻る
        </button>
      </div>
    );
  }

  // === リスト選択モード ===
  if (mode === 'select') {
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
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => router.push('/main')}
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
                <span>←</span> メイン画面に戻る
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                データ統合
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* 現在の統合リスト */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
                現在の統合リスト
              </h2>

              {/* 統合履歴 */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                {mergedListNames.map((name, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: idx < mergedListNames.length - 1 ? '8px' : 0 }}>
                    {idx > 0 && (
                      <span style={{ color: '#4caf50', fontWeight: '600', marginRight: '8px' }}>+</span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: idx === 0 ? '#e3f2fd' : '#e8f5e9',
                      color: idx === 0 ? '#1976d2' : '#2e7d32',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {name}
                    </span>
                    {idx > 0 && (
                      <span style={{ color: '#4caf50', fontSize: '14px' }}>✓ 突合済み</span>
                    )}
                  </div>
                ))}
                <div style={{
                  borderTop: '1px dashed #ccc',
                  marginTop: '12px',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>=</span>
                  <span style={{
                    padding: '6px 16px',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    統合リスト: {mergedList.length}件
                  </span>
                </div>
              </div>
            </div>

            {/* 次に突合するリスト */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                次に突合するリストを選択
              </h2>
              <p style={{ fontSize: '14px', color: '#5a6c7d', marginBottom: '24px' }}>
                統合リストと突合するリストを選択してください
              </p>

              {availableLists.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '8px',
                  border: '1px solid #4caf50'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                    すべてのリストとの突合が完了しました
                  </div>
                  <div style={{ fontSize: '14px', color: '#5a6c7d', marginBottom: '16px' }}>
                    統合リストを原本リストとして確定できます
                  </div>
                  <button
                    onClick={() => {
                      alert(`原本リスト ${mergedList.length}件の登録が完了しました`);
                    }}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    原本リストとして確定
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {availableLists.map(list => (
                      <label
                        key={list.id}
                        style={{
                          padding: '16px',
                          border: selectedListId === list.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          backgroundColor: selectedListId === list.id ? '#e3f2fd' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="targetList"
                          checked={selectedListId === list.id}
                          onChange={() => setSelectedListId(list.id)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                              {list.name}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: list.type === 'fixed-asset' ? '#e3f2fd' : list.type === 'me-ledger' ? '#e8f5e9' : '#f5f5f5',
                              color: list.type === 'fixed-asset' ? '#1976d2' : list.type === 'me-ledger' ? '#2e7d32' : '#666'
                            }}>
                              {list.type === 'fixed-asset' ? '固定資産台帳' : list.type === 'me-ledger' ? 'ME管理台帳' : 'その他'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#5a6c7d' }}>
                            {list.recordCount}件 | 作成: {list.createdAt} | 作成者: {list.createdBy}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        if (confirm('現在の統合リストを原本リストとして確定しますか？\n残りのリストとの突合はスキップされます。')) {
                          alert(`原本リスト ${mergedList.length}件の登録が完了しました`);
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#ffffff',
                        color: '#4caf50',
                        border: '2px solid #4caf50',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      このまま原本リスト確定
                    </button>
                    <button
                      onClick={startMatching}
                      disabled={!selectedListId}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedListId ? '#1976d2' : '#cccccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedListId ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      選択したリストと突合を開始
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // === 突合作業モード ===
  function renderResultModal() {
    return (
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
                統合リスト
              </h3>
              <div style={{ fontSize: '13px', color: '#5a6c7d', marginTop: '4px' }}>
                統合元: {mergedListNames.join(' + ')} = {mergedList.length}件
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
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
            <div style={{ overflow: 'auto', maxHeight: '500px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合状況</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>QRコード</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部門</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '10px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedList.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0' }}>
                        {row.matchingStatus ? (
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
                        ) : (
                          <span style={{ color: '#999', fontSize: '11px' }}>ー</span>
                        )}
                      </td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.qrCode || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </div>
        </div>
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
              <span>←</span> リスト選択に戻る
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
              データ統合
            </h1>
            <span style={{
              padding: '4px 12px',
              backgroundColor: currentList?.type === 'me-ledger' ? '#e8f5e9' : '#e3f2fd',
              color: currentList?.type === 'me-ledger' ? '#2e7d32' : '#1976d2',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              突合中: {mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'} × {currentList?.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={completeCurrentMatching}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              このリストとの突合を完了
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
              <span>🗗</span> {currentList?.name}を別窓で開く
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* プログレスバー */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                突合進捗
              </span>
              <span style={{ fontSize: '14px', color: '#5a6c7d', fontVariantNumeric: 'tabular-nums' }}>
                {completedCount}/{totalItems}件 ({progressPercent}%)
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent === 100 ? '#4caf50' : '#1976d2',
                borderRadius: '6px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* タブ */}
          <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '-2px'
          }}>
            <button
              onClick={() => handleTabChange('pending')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'pending' ? '2px solid #1976d2' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'pending' ? '600' : '400',
                color: activeTab === 'pending' ? '#1976d2' : '#5a6c7d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              対応中
              <span style={{
                padding: '2px 8px',
                backgroundColor: activeTab === 'pending' ? '#e3f2fd' : '#f5f5f5',
                color: activeTab === 'pending' ? '#1976d2' : '#666',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {pendingItems.length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'completed' ? '2px solid #4caf50' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'completed' ? '600' : '400',
                color: activeTab === 'completed' ? '#4caf50' : '#5a6c7d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              対応済み
              <span style={{
                padding: '2px 8px',
                backgroundColor: activeTab === 'completed' ? '#e8f5e9' : '#f5f5f5',
                color: activeTab === 'completed' ? '#4caf50' : '#666',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {completedItems.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 使用方法パネル（対応中タブのみ表示） */}
      {activeTab === 'pending' && (
        <div style={{
          backgroundColor: '#e3f2fd',
          borderBottom: '1px solid #90caf9',
          padding: '12px 24px'
        }}>
          <div style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            <span style={{ fontWeight: '600' }}>手順:</span>
            <span>①「{currentList?.name}を別窓で開く」</span>
            <span>→</span>
            <span>②{mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'}の項目をチェック</span>
            <span>→</span>
            <span>③別窓で{currentList?.name}の項目をチェック</span>
            <span>→</span>
            <span style={{ fontWeight: '600', color: '#27ae60' }}>④「台帳と突合実行」</span>
          </div>
        </div>
      )}

      {/* 一致検索パネル（対応中タブのみ表示） */}
      {activeTab === 'pending' && (
        <div style={{
          backgroundColor: '#fff8e1',
          borderBottom: '1px solid #ffe082',
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
            <span style={{ fontSize: '14px', color: '#f57c00', fontWeight: '600' }}>
              一致検索（{currentList?.name}との照合）:
            </span>
            {['category', 'assetNo', 'item', 'manufacturer'].map((type) => (
              <button
                key={type}
                onClick={() => handleMatchFilterClick(type as MatchFilterType)}
                style={{
                  padding: '6px 16px',
                  backgroundColor: matchFilter === type ? '#f57c00' : '#ffffff',
                  color: matchFilter === type ? '#ffffff' : '#f57c00',
                  border: '1px solid #f57c00',
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
                onClick={() => setMatchFilter('none')}
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
      )}

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
            {/* 対応済みタブ時のみ: 突合状況フィルター */}
            {activeTab === 'completed' && (
              <select
                value={completedStatusFilter}
                onChange={(e) => setCompletedStatusFilter(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #4caf50',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: completedStatusFilter ? '#e8f5e9' : 'white'
                }}
              >
                <option value="">突合状況: 全て</option>
                <option value="完全一致">完全一致</option>
                <option value="部分一致">部分一致</option>
                <option value="数量不一致">数量不一致</option>
                <option value="未確認">未確認</option>
                <option value="未登録">未登録</option>
              </select>
            )}

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
              onClick={() => {
                resetFilters();
                setCompletedStatusFilter('');
              }}
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
                {mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'}
                <span style={{
                  marginLeft: '12px',
                  padding: '4px 12px',
                  backgroundColor: activeTab === 'pending' ? '#e3f2fd' : '#e8f5e9',
                  color: activeTab === 'pending' ? '#1976d2' : '#4caf50',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {activeTab === 'pending' ? '対応中' : '対応済み'}
                </span>
              </h2>
              {activeTab === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                    選択: {selectedMergedIds.size}件
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
                    {selectedMergedIds.size === matchFilteredData.length && matchFilteredData.length > 0 ? '全解除' : '全選択'}
                  </button>
                  <button
                    onClick={handleMarkAsUnregistered}
                    disabled={selectedMergedIds.size === 0}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: selectedMergedIds.size > 0 ? '#9c27b0' : '#cccccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedMergedIds.size > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    未登録として登録
                  </button>
                  <button
                    onClick={handleMatchClick}
                    disabled={selectedMergedIds.size === 0}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: selectedMergedIds.size > 0 ? '#27ae60' : '#cccccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedMergedIds.size > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    台帳と突合実行
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
                  突合済み: {completedItems.length}件
                </div>
              )}
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    {activeTab === 'pending' && (
                      <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={selectedMergedIds.size === matchFilteredData.length && matchFilteredData.length > 0}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </th>
                    )}
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合状況</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>QRコード</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部門</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {matchFilteredData.map((row) => (
                    <tr key={row.id} style={{ backgroundColor: selectedMergedIds.has(row.id) && activeTab === 'pending' ? '#e3f2fd' : 'transparent' }}>
                      {activeTab === 'pending' && (
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedMergedIds.has(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                      )}
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
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.qrCode || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                    </tr>
                  ))}
                  {matchFilteredData.length === 0 && activeTab === 'pending' && pendingItems.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px'
                          }}>
                            ✓
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#2e7d32' }}>
                            すべての突合が完了しました
                          </div>
                          <div style={{ fontSize: '14px', color: '#5a6c7d', marginBottom: '8px' }}>
                            「{currentList?.name}」との突合作業が完了しました。<br />
                            「対応済み」タブで突合結果を確認できます。
                          </div>
                          <button
                            onClick={completeCurrentMatching}
                            style={{
                              padding: '12px 32px',
                              backgroundColor: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            このリストとの突合を完了して次へ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {matchFilteredData.length === 0 && activeTab === 'pending' && pendingItems.length > 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        フィルター条件に該当するデータがありません
                      </td>
                    </tr>
                  )}
                  {matchFilteredData.length === 0 && activeTab === 'completed' && (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ fontSize: '48px', color: '#e0e0e0' }}>📋</div>
                          <div style={{ fontSize: '16px', color: '#5a6c7d' }}>
                            まだ対応済みの項目はありません
                          </div>
                          <div style={{ fontSize: '14px', color: '#999' }}>
                            「対応中」タブで突合作業を行うと、ここに表示されます
                          </div>
                        </div>
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
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
                  {mergedListNames.length === 1 ? '現有品調査リスト' : '統合リスト'}: {selectedMergedIds.size}件 と {currentList?.name}: {pendingLedgerIds.length}件 を突合します
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

      {/* 統合リストモーダル */}
      {showResultModal && renderResultModal()}
    </div>
  );
}
