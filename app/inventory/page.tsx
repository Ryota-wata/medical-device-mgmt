'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts';
import { useApplicationStore, useMasterStore } from '@/lib/stores';
import { Asset, Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { DisposalApplicationModal } from '@/components/ui/DisposalApplicationModal';
import { TransferApplicationModal } from '@/components/ui/TransferApplicationModal';
import { exportInventoryToExcel } from '@/lib/utils/excel-inventory';

// 棚卸し確認ステータス
type InventoryStatus = 'unchecked' | 'stock_ok' | 'location_changed' | 'disposed' | 'action_required';

interface InventoryItem {
  asset: Asset;
  status: InventoryStatus;
  newBuilding?: string;
  newFloor?: string;
  newDepartment?: string;
  newSection?: string;
  newRoomName?: string;
  disposalReason?: string;
  confirmedAt?: string;
  actionRequiredComment?: string;
}

// localStorageキー
const INVENTORY_STORAGE_KEY = 'inventory_work_state';

// 初期データ生成
const generateInitialData = (): InventoryItem[] => [
  {
    asset: {
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
      acquisitionCost: 15000000,
      legalServiceLife: '6年',
    },
    status: 'unchecked'
  },
  ...Array.from({ length: 19 }, (_, i) => ({
    asset: {
      qrCode: `QR-2025-${String(i + 2).padStart(4, '0')}`,
      no: i + 2,
      facility: '〇〇〇〇〇〇病院',
      building: i % 2 === 0 ? '本館' : '別館',
      floor: `${(i % 5) + 1}F`,
      department: ['手術部門', '外来部門', '病棟部門', '検査部門', '放射線部門'][i % 5],
      section: ['手術', '内科', '外科', '検査', '放射線'][i % 5],
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: 'CT関連',
      item: `品目${i + 2}`,
      name: `サンプル製品${i + 2}`,
      maker: '医療機器メーカー',
      model: `MODEL-${i + 2}`,
      quantity: 1,
      width: 500 + i * 10,
      depth: 600 + i * 10,
      height: 700 + i * 10,
      assetNo: `10605379-${String(i + 1).padStart(3, '0')}`,
      managementNo: `${1338 + i + 1}`,
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: `室${String.fromCharCode(66 + (i % 10))}`,
      installationLocation: `室${String.fromCharCode(66 + (i % 10))}-中央`,
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: `SN-2024-${String(i + 2).padStart(3, '0')}`,
      acquisitionCost: 1000000 * (i + 2),
      legalServiceLife: '6年',
    } as Asset,
    status: 'unchecked' as InventoryStatus
  }))
];

export default function InventoryPage() {
  const router = useRouter();
  const { addApplication } = useApplicationStore();
  const { facilities, assets: assetMasters, departments } = useMasterStore();
  const { isMobile } = useResponsive();

  // フィルター状態（6つのフィルター）
  const [filterStatus, setFilterStatus] = useState<'all' | 'unchecked' | 'checked' | 'action_required'>('all');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLargeClass, setFilterLargeClass] = useState('');
  const [filterMediumClass, setFilterMediumClass] = useState('');

  // 場所変更モーダル
  const [locationChangeModal, setLocationChangeModal] = useState<{
    isOpen: boolean;
    itemIndex: number | null;
  }>({ isOpen: false, itemIndex: null });

  // 廃棄理由モーダル
  const [disposalModal, setDisposalModal] = useState<{
    isOpen: boolean;
    itemIndex: number | null;
  }>({ isOpen: false, itemIndex: null });

  // 完了確認モーダル
  const [completeModal, setCompleteModal] = useState(false);

  // 棚卸しリセット確認モーダル
  const [resetModal, setResetModal] = useState(false);

  // 在庫あり確認モーダル
  const [stockOkModal, setStockOkModal] = useState<{
    isOpen: boolean;
    itemIndex: number | null;
  }>({ isOpen: false, itemIndex: null });

  // 一括確定確認モーダル
  const [bulkConfirmModal, setBulkConfirmModal] = useState(false);

  // 廃棄申請モーダル（一括用）
  const [bulkDisposalModal, setBulkDisposalModal] = useState(false);

  // 移動申請モーダル（一括用）
  const [bulkTransferModal, setBulkTransferModal] = useState(false);

  // 要対応（保留）コメント入力モーダル
  const [actionRequiredModal, setActionRequiredModal] = useState(false);
  const [actionRequiredComment, setActionRequiredComment] = useState('');

  // チェックボックス選択状態
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 棚卸しデータ（localStorageから復元または初期データ）
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorageからデータを復元
  useEffect(() => {
    const savedData = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setInventoryItems(parsed);
      } catch {
        setInventoryItems(generateInitialData());
      }
    } else {
      setInventoryItems(generateInitialData());
    }
    setIsLoaded(true);
  }, []);

  // データ変更時にlocalStorageに保存
  useEffect(() => {
    if (isLoaded && inventoryItems.length > 0) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryItems));
    }
  }, [inventoryItems, isLoaded]);

  // 場所変更用の一時データ
  const [tempLocation, setTempLocation] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    roomName: ''
  });


  // フィルタリングされた棚卸しアイテム
  // 「すべて」と「未確認」では未確認のみ表示（確定したカードは非表示）
  // 「確認済」「要対応」では該当するカードを表示
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // ステータスフィルター
      // 「すべて」は未確認のものだけを表示（確定したものは消える）
      if (filterStatus === 'all' && item.status !== 'unchecked') return false;
      if (filterStatus === 'unchecked' && item.status !== 'unchecked') return false;
      if (filterStatus === 'checked' && (item.status === 'unchecked' || item.status === 'action_required')) return false;
      if (filterStatus === 'action_required' && !['location_changed', 'disposed', 'action_required'].includes(item.status)) return false;

      // フィルター（6つ）
      if (filterDepartment && item.asset.department !== filterDepartment) return false;
      if (filterDivision) {
        // 部門名は部署マスタのdivisionでフィルター（asset.departmentに対応するdivisionを検索）
        const matchingDept = departments.find(d => d.department === item.asset.section);
        if (!matchingDept || matchingDept.division !== filterDivision) return false;
      }
      if (filterSection && item.asset.section !== filterSection) return false;
      if (filterCategory && item.asset.category !== filterCategory) return false;
      if (filterLargeClass && item.asset.largeClass !== filterLargeClass) return false;
      if (filterMediumClass && item.asset.mediumClass !== filterMediumClass) return false;

      return true;
    });
  }, [inventoryItems, filterStatus, filterDepartment, filterDivision, filterSection, filterCategory, filterLargeClass, filterMediumClass, departments]);

  // 進捗計算
  const progress = useMemo(() => {
    const total = inventoryItems.length;
    const checked = inventoryItems.filter(item => item.status !== 'unchecked').length;
    const actionRequired = inventoryItems.filter(item => ['location_changed', 'disposed', 'action_required'].includes(item.status)).length;
    return { total, checked, actionRequired, percentage: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [inventoryItems]);

  // フィルターオプション（マスターデータから取得）
  // 棟・階はフィルターから除外したが、場所変更モーダルで使用するため残す
  const buildingOptions = useMemo(() => {
    const fromFacilities = facilities.map(f => f.building);
    const fromItems = inventoryItems.map(item => item.asset.building);
    return [...new Set([...fromFacilities, ...fromItems])].filter(Boolean) as string[];
  }, [facilities, inventoryItems]);

  const floorOptions = useMemo(() => {
    const fromFacilities = facilities.map(f => f.floor);
    const fromItems = inventoryItems.map(item => item.asset.floor);
    return [...new Set([...fromFacilities, ...fromItems])].filter(Boolean) as string[];
  }, [facilities, inventoryItems]);

  const departmentOptions = useMemo(() => {
    const fromFacilities = facilities.map(f => f.department);
    const fromItems = inventoryItems.map(item => item.asset.department);
    return [...new Set([...fromFacilities, ...fromItems])].filter(Boolean) as string[];
  }, [facilities, inventoryItems]);

  const divisionOptions = useMemo(() => {
    return [...new Set(departments.map(d => d.division))].filter(Boolean) as string[];
  }, [departments]);

  const sectionOptions = useMemo(() => {
    const fromFacilities = facilities.map(f => f.section);
    const fromItems = inventoryItems.map(item => item.asset.section);
    return [...new Set([...fromFacilities, ...fromItems])].filter(Boolean) as string[];
  }, [facilities, inventoryItems]);

  const categoryOptions = useMemo(() => {
    const fromMasters = assetMasters.map(a => a.category);
    const fromItems = inventoryItems.map(item => item.asset.category);
    return [...new Set([...fromMasters, ...fromItems])].filter(Boolean) as string[];
  }, [assetMasters, inventoryItems]);

  const largeClassOptions = useMemo(() => {
    const fromMasters = assetMasters.map(a => a.largeClass);
    const fromItems = inventoryItems.map(item => item.asset.largeClass);
    return [...new Set([...fromMasters, ...fromItems])].filter(Boolean) as string[];
  }, [assetMasters, inventoryItems]);

  const mediumClassOptions = useMemo(() => {
    const fromMasters = assetMasters.map(a => a.mediumClass);
    const fromItems = inventoryItems.map(item => item.asset.mediumClass);
    return [...new Set([...fromMasters, ...fromItems])].filter(Boolean) as string[];
  }, [assetMasters, inventoryItems]);

  // ステータス変更
  const handleStatusChange = (index: number, status: InventoryStatus) => {
    if (status === 'location_changed') {
      // 場所変更モーダルを開く
      const item = inventoryItems[index];
      setTempLocation({
        building: item.asset.building,
        floor: item.asset.floor,
        department: item.asset.department,
        section: item.asset.section,
        roomName: item.asset.roomName || ''
      });
      setLocationChangeModal({ isOpen: true, itemIndex: index });
    } else if (status === 'disposed') {
      // 廃棄モーダルを開く
      setDisposalModal({ isOpen: true, itemIndex: index });
    } else if (status === 'stock_ok') {
      // 在庫あり確認モーダルを開く
      setStockOkModal({ isOpen: true, itemIndex: index });
    }
  };

  // 在庫あり確定
  const handleStockOkConfirm = () => {
    if (stockOkModal.itemIndex === null) return;

    const newItems = [...inventoryItems];
    newItems[stockOkModal.itemIndex] = {
      ...newItems[stockOkModal.itemIndex],
      status: 'stock_ok',
      confirmedAt: new Date().toISOString()
    };
    setInventoryItems(newItems);
    setStockOkModal({ isOpen: false, itemIndex: null });
  };

  // 場所変更確定
  const handleLocationChangeConfirm = () => {
    if (locationChangeModal.itemIndex === null) return;

    const newItems = [...inventoryItems];
    newItems[locationChangeModal.itemIndex] = {
      ...newItems[locationChangeModal.itemIndex],
      status: 'location_changed',
      newBuilding: tempLocation.building,
      newFloor: tempLocation.floor,
      newDepartment: tempLocation.department,
      newSection: tempLocation.section,
      newRoomName: tempLocation.roomName,
      confirmedAt: new Date().toISOString()
    };
    setInventoryItems(newItems);
    setLocationChangeModal({ isOpen: false, itemIndex: null });
  };


  // 棚卸しリセット
  const handleReset = () => {
    localStorage.removeItem(INVENTORY_STORAGE_KEY);
    setInventoryItems(generateInitialData());
    setSelectedItems(new Set());
    setResetModal(false);
  };

  // チェックボックス選択切り替え
  const handleToggleSelect = (qrCode: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(qrCode)) {
      newSelected.delete(qrCode);
    } else {
      newSelected.add(qrCode);
    }
    setSelectedItems(newSelected);
  };

  // 全選択/全解除
  const handleSelectAll = () => {
    const uncheckedItems = filteredItems.filter(item => item.status === 'unchecked');
    if (selectedItems.size === uncheckedItems.length && uncheckedItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(uncheckedItems.map(item => item.asset.qrCode)));
    }
  };

  // 一括在庫あり確定（確認モーダルを開く）
  const handleBulkStockOkClick = () => {
    if (selectedItems.size === 0) return;
    setBulkConfirmModal(true);
  };

  // 一括在庫あり確定実行
  const handleBulkStockOkConfirm = () => {
    const newItems = [...inventoryItems];
    selectedItems.forEach(qrCode => {
      const index = newItems.findIndex(item => item.asset.qrCode === qrCode);
      if (index !== -1 && newItems[index].status === 'unchecked') {
        newItems[index] = {
          ...newItems[index],
          status: 'stock_ok',
          confirmedAt: new Date().toISOString()
        };
      }
    });
    setInventoryItems(newItems);
    setSelectedItems(new Set());
    setBulkConfirmModal(false);
  };

  // 一括要対応（保留）実行
  const handleBulkActionRequired = () => {
    const newItems = [...inventoryItems];
    selectedItems.forEach(qrCode => {
      const index = newItems.findIndex(item => item.asset.qrCode === qrCode);
      if (index !== -1 && newItems[index].status === 'unchecked') {
        newItems[index] = {
          ...newItems[index],
          status: 'action_required',
          confirmedAt: new Date().toISOString(),
          actionRequiredComment: actionRequiredComment,
        };
      }
    });
    setInventoryItems(newItems);
    setSelectedItems(new Set());
    setActionRequiredModal(false);
    setActionRequiredComment('');
  };

  // 一括申請で選択中の資産一覧
  const selectedAssets = useMemo(() => {
    return inventoryItems
      .filter(item => selectedItems.has(item.asset.qrCode))
      .map(item => item.asset);
  }, [inventoryItems, selectedItems]);


  // 棚卸し完了処理
  const handleComplete = () => {
    // 移動申請と廃棄申請を自動作成
    const locationChangedItems = inventoryItems.filter(item => item.status === 'location_changed');
    const disposedItems = inventoryItems.filter(item => item.status === 'disposed');

    // 移動申請作成
    locationChangedItems.forEach(item => {
      const applicationData: Omit<Application, 'id'> = {
        applicationNo: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: new Date().toISOString().split('T')[0],
        applicationType: '移動申請',
        asset: {
          name: item.asset.name,
          model: item.asset.model,
        },
        vendor: item.asset.maker,
        quantity: '1',
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: item.newBuilding || '',
          floor: item.newFloor || '',
          department: item.newDepartment || '',
          section: item.newSection || '',
        },
        roomName: item.newRoomName || '',
        freeInput: `棚卸しにより設置場所変更を確認。旧場所: ${item.asset.building} ${item.asset.floor} ${item.asset.department}`,
        executionYear: new Date().getFullYear().toString(),
      };
      addApplication(applicationData);
    });

    // 廃棄申請作成
    disposedItems.forEach(item => {
      const applicationData: Omit<Application, 'id'> = {
        applicationNo: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: new Date().toISOString().split('T')[0],
        applicationType: '廃棄申請',
        asset: {
          name: item.asset.name,
          model: item.asset.model,
        },
        vendor: item.asset.maker,
        quantity: '1',
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: item.asset.building,
          floor: item.asset.floor,
          department: item.asset.department,
          section: item.asset.section,
        },
        roomName: item.asset.roomName || '',
        freeInput: `棚卸しにより在庫なしを確認。廃棄理由: ${item.disposalReason || '記載なし'}`,
        executionYear: new Date().getFullYear().toString(),
      };
      addApplication(applicationData);
    });

    // localStorageをクリア
    localStorage.removeItem(INVENTORY_STORAGE_KEY);

    setCompleteModal(false);
    alert(`棚卸しを完了しました。\n移動申請: ${locationChangedItems.length}件\n廃棄申請: ${disposedItems.length}件\n\nメイン画面に移動します。`);
    router.push('/main');
  };

  // ステータスバッジの取得
  const getStatusBadge = (status: InventoryStatus) => {
    const styles: Record<InventoryStatus, { bg: string; color: string; text: string }> = {
      unchecked: { bg: '#e0e0e0', color: '#666', text: '未確認' },
      stock_ok: { bg: '#d4edda', color: '#155724', text: '確認済' },
      location_changed: { bg: '#fff3cd', color: '#856404', text: '移動' },
      disposed: { bg: '#f8d7da', color: '#721c24', text: '廃棄' },
      action_required: { bg: '#fce4ec', color: '#c62828', text: '要対応' }
    };
    const style = styles[status];
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  // カルテ画面（資産詳細画面）に遷移
  const handleViewKarte = (asset: Asset) => {
    router.push(`/asset-detail?no=${asset.no}&readonly=true&from=inventory`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6fa' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f6fa' }}>
      <Header
        title="棚卸し"
        resultCount={filteredItems.length}
        showBackButton={true}
        backHref="/main"
        backLabel="一時保存して戻る"
        hideMenu={true}
      />

      {/* 進捗バー */}
      <div style={{ background: 'white', padding: '20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
            棚卸し進捗: {progress.checked} / {progress.total} 件 ({progress.percentage}%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: '#e67e22' }}>
              要対応: {progress.actionRequired}件
            </span>
            <button
              onClick={() => setCompleteModal(true)}
              disabled={progress.percentage < 100}
              style={{
                padding: '8px 20px',
                background: progress.percentage < 100 ? '#ccc' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: progress.percentage < 100 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              棚卸し完了
            </button>
            <button
              onClick={() => setResetModal(true)}
              style={{
                padding: '8px 12px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              リセット
            </button>
          </div>
        </div>
        <div style={{
          width: '100%',
          height: '20px',
          background: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress.percentage}%`,
            height: '100%',
            background: progress.percentage === 100 ? '#27ae60' : '#27ae60',
            borderRadius: '10px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* フィルターバー */}
      <div style={{ background: 'white', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        {/* ステータスフィルター */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {[
            { value: 'all', label: '未確認' },
            { value: 'checked', label: '確認済' },
            { value: 'action_required', label: '要対応' }
          ].map(option => (
            <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="filterStatus"
                checked={filterStatus === option.value}
                onChange={() => setFilterStatus(option.value as typeof filterStatus)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              {option.label}
            </label>
          ))}
        </div>

        {/* 6つのフィルター */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="管理部署"
              value={filterDepartment}
              onChange={setFilterDepartment}
              options={['', ...departmentOptions]}
              placeholder="管理部署"
              isMobile={isMobile}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="部門名"
              value={filterDivision}
              onChange={setFilterDivision}
              options={['', ...divisionOptions]}
              placeholder="部門名"
              isMobile={isMobile}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="部署名"
              value={filterSection}
              onChange={setFilterSection}
              options={['', ...sectionOptions]}
              placeholder="部署名"
              isMobile={isMobile}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="category"
              value={filterCategory}
              onChange={setFilterCategory}
              options={['', ...categoryOptions]}
              placeholder="category"
              isMobile={isMobile}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="大分類"
              value={filterLargeClass}
              onChange={setFilterLargeClass}
              options={['', ...largeClassOptions]}
              placeholder="大分類"
              isMobile={isMobile}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="中分類"
              value={filterMediumClass}
              onChange={setFilterMediumClass}
              options={['', ...mediumClassOptions]}
              placeholder="中分類"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* 一括操作バー（未確認フィルター時のみ表示） */}
      {filterStatus === 'all' && filteredItems.length > 0 && (
        <div style={{
          background: '#e8f4fd',
          padding: '12px 20px',
          borderBottom: '1px solid #bee5eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedItems.size === filteredItems.filter(item => item.status === 'unchecked').length && filteredItems.filter(item => item.status === 'unchecked').length > 0}
              onChange={handleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#1f2937', whiteSpace: 'nowrap' }}>
              全選択 ({selectedItems.size}/{filteredItems.filter(item => item.status === 'unchecked').length})
            </span>
          </label>
          <button
            disabled={selectedItems.size === 0}
            onClick={handleBulkStockOkClick}
            style={{
              padding: '8px 16px',
              background: selectedItems.size === 0 ? '#ccc' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            確認済
          </button>
          <button
            disabled={selectedItems.size === 0}
            onClick={() => {
              if (selectedItems.size === 0) return;
              setBulkDisposalModal(true);
            }}
            style={{
              padding: '8px 16px',
              background: selectedItems.size === 0 ? '#ccc' : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            廃棄（除却）申請へ
          </button>
          <button
            disabled={selectedItems.size === 0}
            onClick={() => {
              if (selectedItems.size === 0) return;
              setBulkTransferModal(true);
            }}
            style={{
              padding: '8px 16px',
              background: selectedItems.size === 0 ? '#ccc' : '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            移動申請へ
          </button>
          <button
            disabled={selectedItems.size === 0}
            onClick={() => {
              if (selectedItems.size === 0) return;
              setActionRequiredModal(true);
            }}
            style={{
              padding: '8px 16px',
              background: selectedItems.size === 0 ? '#ccc' : '#7f8c8d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            要対応（保留）
          </button>
        </div>
      )}

      {/* カード一覧 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredItems.map((item) => {
            const originalIndex = inventoryItems.indexOf(item);
            return (
              <div
                key={item.asset.qrCode}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: item.status === 'unchecked' ? '1px solid #dee2e6' :
                         item.status === 'stock_ok' ? '2px solid #27ae60' :
                         item.status === 'location_changed' ? '2px solid #f39c12' :
                         '2px solid #e74c3c'
                }}
              >
                {/* 画像エリア */}
                <div
                  style={{
                    height: '160px',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {/* チェックボックス（未確認のものだけ） */}
                  {item.status === 'unchecked' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 10
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.asset.qrCode)}
                        onChange={() => handleToggleSelect(item.asset.qrCode)}
                        style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                      />
                    </div>
                  )}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: '#999'
                  }}>
                    📦
                  </div>
                  {/* ステータスバッジ */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {getStatusBadge(item.status)}
                  </div>
                  {/* 詳細表示ボタン */}
                  <button
                    onClick={() => handleViewKarte(item.asset)}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(52, 152, 219, 0.9)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    詳細を見る
                  </button>
                </div>

                {/* カード本体 */}
                <div style={{ padding: '16px' }}>
                  {/* ヘッダー情報：QRコード + 日付 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#7f8c8d' }}>{item.asset.qrCode}</span>
                    <span style={{ fontSize: '11px', color: '#7f8c8d' }}>
                      {item.confirmedAt ? new Date(item.confirmedAt).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {/* 資産名 */}
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 8px 0'
                    }}
                  >
                    {item.asset.name}
                  </h3>

                  {/* 資産情報 */}
                  <div style={{
                    fontSize: '12px',
                    color: '#5a6c7d',
                    lineHeight: '1.8',
                    marginBottom: '12px'
                  }}>
                    <div>管理部署：{item.asset.department}</div>
                    <div>設置場所：{item.asset.building}　{item.asset.section}　{item.asset.roomName || ''}</div>
                    <div>メーカー：{item.asset.maker}</div>
                    <div>型式　　：{item.asset.model}</div>
                    <div>シリアルNo.：{item.asset.serialNumber || '---'}</div>
                    <div>固定資産番号：{item.asset.assetNo || '---'}</div>
                  </div>

                  {item.status === 'action_required' && item.actionRequiredComment && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#fce4ec',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#c62828',
                      borderLeft: '3px solid #c62828',
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>保留理由:</div>
                      {item.actionRequiredComment}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* 場所変更モーダル */}
      {locationChangeModal.isOpen && (
        <div
          onClick={() => setLocationChangeModal({ isOpen: false, itemIndex: null })}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#f39c12',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              場所変更
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                変更後の設置場所を入力してください。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', zIndex: 5 }}>
                  <SearchableSelect
                    label="棟"
                    value={tempLocation.building}
                    onChange={(v) => setTempLocation({ ...tempLocation, building: v })}
                    options={buildingOptions}
                    placeholder="選択してください"
                    isMobile={isMobile}
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 4 }}>
                  <SearchableSelect
                    label="階"
                    value={tempLocation.floor}
                    onChange={(v) => setTempLocation({ ...tempLocation, floor: v })}
                    options={floorOptions}
                    placeholder="選択してください"
                    isMobile={isMobile}
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 3 }}>
                  <SearchableSelect
                    label="部門"
                    value={tempLocation.department}
                    onChange={(v) => setTempLocation({ ...tempLocation, department: v })}
                    options={departmentOptions}
                    placeholder="選択してください"
                    isMobile={isMobile}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
                    諸室名
                  </label>
                  <input
                    type="text"
                    value={tempLocation.roomName}
                    onChange={(e) => setTempLocation({ ...tempLocation, roomName: e.target.value })}
                    placeholder="諸室名を入力"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setLocationChangeModal({ isOpen: false, itemIndex: null })}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleLocationChangeConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 廃棄申請モーダル（単体用） */}
      <DisposalApplicationModal
        isOpen={disposalModal.isOpen && disposalModal.itemIndex !== null}
        assets={disposalModal.itemIndex !== null && inventoryItems[disposalModal.itemIndex] ? [inventoryItems[disposalModal.itemIndex].asset] : []}
        onClose={() => setDisposalModal({ isOpen: false, itemIndex: null })}
        onSuccess={() => {
          if (disposalModal.itemIndex === null) return;
          const newItems = [...inventoryItems];
          newItems[disposalModal.itemIndex] = {
            ...newItems[disposalModal.itemIndex],
            status: 'disposed',
            confirmedAt: new Date().toISOString()
          };
          setInventoryItems(newItems);
          setDisposalModal({ isOpen: false, itemIndex: null });
        }}
        returnDestination="棚卸し画面"
        returnHref="/inventory"
      />

      {/* 廃棄申請モーダル（一括用） */}
      <DisposalApplicationModal
        isOpen={bulkDisposalModal}
        assets={selectedAssets}
        onClose={() => setBulkDisposalModal(false)}
        onSuccess={() => {
          const newItems = [...inventoryItems];
          selectedItems.forEach(qrCode => {
            const index = newItems.findIndex(item => item.asset.qrCode === qrCode);
            if (index !== -1 && newItems[index].status === 'unchecked') {
              newItems[index] = {
                ...newItems[index],
                status: 'disposed',
                confirmedAt: new Date().toISOString()
              };
            }
          });
          setInventoryItems(newItems);
          setSelectedItems(new Set());
          setBulkDisposalModal(false);
        }}
        returnDestination="棚卸し画面"
        returnHref="/inventory"
      />

      {/* 移動申請モーダル（一括用） */}
      <TransferApplicationModal
        isOpen={bulkTransferModal}
        assets={selectedAssets}
        onClose={() => setBulkTransferModal(false)}
        returnDestination="棚卸し画面"
        returnHref="/inventory"
        onSuccess={() => {
          const newItems = [...inventoryItems];
          selectedItems.forEach(qrCode => {
            const index = newItems.findIndex(item => item.asset.qrCode === qrCode);
            if (index !== -1 && newItems[index].status === 'unchecked') {
              newItems[index] = {
                ...newItems[index],
                status: 'location_changed',
                confirmedAt: new Date().toISOString()
              };
            }
          });
          setInventoryItems(newItems);
          setSelectedItems(new Set());
          setBulkTransferModal(false);
        }}
      />

      {/* 完了確認モーダル */}
      {completeModal && (
        <div
          onClick={() => setCompleteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#27ae60',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              棚卸し完了確認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#1f2937', fontWeight: 'bold' }}>
                棚卸しを完了してよろしいですか？
              </p>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>確認済み:</strong> {progress.checked}件 / {progress.total}件
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>移動申請（自動作成）:</strong> {inventoryItems.filter(i => i.status === 'location_changed').length}件
                </div>
                <div style={{ fontSize: '14px' }}>
                  <strong>廃棄申請（自動作成）:</strong> {inventoryItems.filter(i => i.status === 'disposed').length}件
                </div>
              </div>
              <p style={{ color: '#666', fontSize: '13px' }}>
                ※ 場所変更・廃棄とした資産については、自動的に申請が作成されます。
              </p>
              <button
                onClick={() => exportInventoryToExcel(inventoryItems)}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: 'white',
                  color: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                棚卸し結果をExcel出力
              </button>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setCompleteModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleComplete}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                完了する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リセット確認モーダル */}
      {resetModal && (
        <div
          onClick={() => setResetModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#e74c3c',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              棚卸しリセット確認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: '#1f2937' }}>
                棚卸しの作業内容をすべてリセットします。<br />
                この操作は取り消せません。よろしいですか？
              </p>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setResetModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 20px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 在庫あり確認モーダル（単一アイテム用） */}
      {stockOkModal.isOpen && stockOkModal.itemIndex !== null && (
        <div
          onClick={() => setStockOkModal({ isOpen: false, itemIndex: null })}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#27ae60',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              在庫あり確認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#1f2937', fontWeight: 'bold' }}>
                以下の資産を「在庫あり（現状維持）」で確定しますか？
              </p>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>資産名:</strong> {inventoryItems[stockOkModal.itemIndex]?.asset.name}
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>資産番号:</strong> {inventoryItems[stockOkModal.itemIndex]?.asset.assetNo}
                </div>
                <div style={{ fontSize: '14px' }}>
                  <strong>場所:</strong> {inventoryItems[stockOkModal.itemIndex]?.asset.building} {inventoryItems[stockOkModal.itemIndex]?.asset.floor} {inventoryItems[stockOkModal.itemIndex]?.asset.roomName}
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setStockOkModal({ isOpen: false, itemIndex: null })}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleStockOkConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                確定する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括確定確認モーダル */}
      {bulkConfirmModal && (
        <div
          onClick={() => setBulkConfirmModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#27ae60',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              一括確定確認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#1f2937', fontWeight: 'bold' }}>
                選択した資産を一括で「在庫あり（現状維持）」で確定しますか？
              </p>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>選択件数:</strong> {selectedItems.size}件
                </div>
                <div style={{ fontSize: '13px', color: '#666', maxHeight: '150px', overflow: 'auto' }}>
                  {Array.from(selectedItems).map(qrCode => {
                    const item = inventoryItems.find(i => i.asset.qrCode === qrCode);
                    return item ? (
                      <div key={qrCode} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                        {item.asset.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setBulkConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkStockOkConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {selectedItems.size}件を確定する
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 要対応（保留）コメント入力モーダル */}
      {actionRequiredModal && (
        <div
          onClick={() => {
            setActionRequiredModal(false);
            setActionRequiredComment('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: '#7f8c8d',
              color: 'white',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              要対応（保留）理由
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#1f2937' }}>
                選択した {selectedItems.size} 件を「要対応（保留）」にします。
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
                  保留理由（任意）
                </label>
                <textarea
                  value={actionRequiredComment}
                  onChange={(e) => setActionRequiredComment(e.target.value)}
                  placeholder="保留理由を入力してください"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setActionRequiredModal(false);
                  setActionRequiredComment('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkActionRequired}
                style={{
                  padding: '10px 20px',
                  background: '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                登録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
