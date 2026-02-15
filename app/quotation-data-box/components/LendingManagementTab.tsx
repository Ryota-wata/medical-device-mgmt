'use client';

import React, { useState, useMemo } from 'react';
import { useAssetStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Asset } from '@/lib/types';

// 貸出機器データ型
interface LendingDevice {
  id: number;
  qrLabel: string;
  meManagementNo: string;
  itemName: string;
  maker: string;
  model: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  status: '貸出可' | '貸出中' | '点検中' | '修理中' | '廃棄予定';
  installedDepartment: string;
  lendingDate: string | null;
  expectedReturnDate: string | null;
  overduedays: number;
  inspectionMarginDays: number;
  isFixedPlacement: boolean;
  freeComment: string;
}

// 資産検索フィルター
interface AssetSearchFilter {
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
}

// モックデータ: 貸出登録済み機器
const MOCK_LENDING_DEVICES: LendingDevice[] = [
  {
    id: 1,
    qrLabel: 'QR-001',
    meManagementNo: 'ME-2024-001',
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    category: 'ME機器',
    majorCategory: '生命維持管理装置',
    middleCategory: '人工呼吸器',
    status: '貸出中',
    installedDepartment: 'ICU',
    lendingDate: '2026-01-15',
    expectedReturnDate: '2026-02-15',
    overduedays: 0,
    inspectionMarginDays: 45,
    isFixedPlacement: false,
    freeComment: '',
  },
  {
    id: 2,
    qrLabel: 'QR-002',
    meManagementNo: 'ME-2024-002',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-171',
    category: 'ME機器',
    majorCategory: '輸液・輸血用器具',
    middleCategory: '輸液ポンプ',
    status: '貸出中',
    installedDepartment: '3階東病棟',
    lendingDate: '2026-01-20',
    expectedReturnDate: '2026-02-01',
    overduedays: 7,
    inspectionMarginDays: 30,
    isFixedPlacement: true,
    freeComment: '長期貸出申請中',
  },
  {
    id: 3,
    qrLabel: 'QR-003',
    meManagementNo: 'ME-2024-003',
    itemName: 'シリンジポンプ',
    maker: 'テルモ',
    model: 'TE-SS700',
    category: 'ME機器',
    majorCategory: '輸液・輸血用器具',
    middleCategory: 'シリンジポンプ',
    status: '貸出可',
    installedDepartment: 'ME室',
    lendingDate: null,
    expectedReturnDate: null,
    overduedays: 0,
    inspectionMarginDays: 60,
    isFixedPlacement: false,
    freeComment: '',
  },
  {
    id: 4,
    qrLabel: 'QR-004',
    meManagementNo: 'ME-2024-004',
    itemName: '除細動器',
    maker: '日本光電',
    model: 'TEC-5600',
    category: 'ME機器',
    majorCategory: '生命維持管理装置',
    middleCategory: '除細動器',
    status: '点検中',
    installedDepartment: '外来',
    lendingDate: null,
    expectedReturnDate: null,
    overduedays: 0,
    inspectionMarginDays: 15,
    isFixedPlacement: true,
    freeComment: '定期点検中',
  },
  {
    id: 5,
    qrLabel: 'QR-005',
    meManagementNo: 'ME-2024-005',
    itemName: '心電計',
    maker: 'フクダ電子',
    model: 'FX-8000',
    category: 'ME機器',
    majorCategory: '生体情報モニタ',
    middleCategory: '心電計',
    status: '貸出中',
    installedDepartment: '2階西病棟',
    lendingDate: '2026-01-10',
    expectedReturnDate: '2026-01-25',
    overduedays: 14,
    inspectionMarginDays: 20,
    isFixedPlacement: false,
    freeComment: '',
  },
];

// フィルター状態
interface LendingFilter {
  category: string;
  majorCategory: string;
  middleCategory: string;
  itemName: string;
  maker: string;
  model: string;
  status: string;
  installedDepartment: string;
  overdueOnly: boolean;
  fixedPlacementOnly: boolean;
}

export const LendingManagementTab: React.FC = () => {
  const { assets } = useAssetStore();

  const [devices, setDevices] = useState<LendingDevice[]>(MOCK_LENDING_DEVICES);
  const [filter, setFilter] = useState<LendingFilter>({
    category: '',
    majorCategory: '',
    middleCategory: '',
    itemName: '',
    maker: '',
    model: '',
    status: '',
    installedDepartment: '',
    overdueOnly: false,
    fixedPlacementOnly: false,
  });

  // モーダル状態
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // 資産検索関連
  const [assetSearchFilter, setAssetSearchFilter] = useState<AssetSearchFilter>({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
  });
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // 登録モーダル関連
  const [selectedAssetsForRegistration, setSelectedAssetsForRegistration] = useState<Asset[]>([]);
  const [returnPeriodDays, setReturnPeriodDays] = useState<number>(90);

  // マスタからフィルターオプションを生成（assetStoreのassetsを使用）
  const buildingOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map(a => a.building)));
    return unique.filter(Boolean) as string[];
  }, [assets]);

  const floorOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    const unique = Array.from(new Set(filtered.map(a => a.floor)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building]);

  const departmentOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    if (assetSearchFilter.floor) {
      filtered = filtered.filter(a => a.floor === assetSearchFilter.floor);
    }
    const unique = Array.from(new Set(filtered.map(a => a.department)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor]);

  const sectionOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    if (assetSearchFilter.floor) {
      filtered = filtered.filter(a => a.floor === assetSearchFilter.floor);
    }
    if (assetSearchFilter.department) {
      filtered = filtered.filter(a => a.department === assetSearchFilter.department);
    }
    const unique = Array.from(new Set(filtered.map(a => a.section)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor, assetSearchFilter.department]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map(a => a.category)));
    return unique.filter(Boolean) as string[];
  }, [assets]);

  const largeClassOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.category) {
      filtered = filtered.filter(a => a.category === assetSearchFilter.category);
    }
    const unique = Array.from(new Set(filtered.map(a => a.largeClass)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.category]);

  const mediumClassOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.category) {
      filtered = filtered.filter(a => a.category === assetSearchFilter.category);
    }
    if (assetSearchFilter.largeClass) {
      filtered = filtered.filter(a => a.largeClass === assetSearchFilter.largeClass);
    }
    const unique = Array.from(new Set(filtered.map(a => a.mediumClass)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.category, assetSearchFilter.largeClass]);

  // フィルター適用（一覧用）
  const filteredDevices = devices.filter(device => {
    if (filter.category && device.category !== filter.category) return false;
    if (filter.majorCategory && device.majorCategory !== filter.majorCategory) return false;
    if (filter.middleCategory && device.middleCategory !== filter.middleCategory) return false;
    if (filter.itemName && !device.itemName.includes(filter.itemName)) return false;
    if (filter.maker && device.maker !== filter.maker) return false;
    if (filter.model && !device.model.includes(filter.model)) return false;
    if (filter.status && device.status !== filter.status) return false;
    if (filter.installedDepartment && device.installedDepartment !== filter.installedDepartment) return false;
    if (filter.overdueOnly && device.overduedays <= 0) return false;
    if (filter.fixedPlacementOnly && !device.isFixedPlacement) return false;
    return true;
  });

  // ユニークな値を取得（一覧用）
  const uniqueCategories = [...new Set(devices.map(d => d.category))];
  const uniqueMajorCategories = [...new Set(devices.map(d => d.majorCategory))];
  const uniqueMiddleCategories = [...new Set(devices.map(d => d.middleCategory))];
  const uniqueMakers = [...new Set(devices.map(d => d.maker))];
  const uniqueDepartments = [...new Set(devices.map(d => d.installedDepartment))];
  const uniqueStatuses: LendingDevice['status'][] = ['貸出可', '貸出中', '点検中', '修理中', '廃棄予定'];

  const getStatusStyle = (status: LendingDevice['status']): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 'bold',
    };
    switch (status) {
      case '貸出可':
        return { ...baseStyle, background: '#e8f5e9', color: '#2e7d32' };
      case '貸出中':
        return { ...baseStyle, background: '#e3f2fd', color: '#1565c0' };
      case '点検中':
        return { ...baseStyle, background: '#fff3e0', color: '#ef6c00' };
      case '修理中':
        return { ...baseStyle, background: '#fce4ec', color: '#c2185b' };
      case '廃棄予定':
        return { ...baseStyle, background: '#f5f5f5', color: '#616161' };
      default:
        return baseStyle;
    }
  };

  // 既に貸出登録済みの資産QRコードを取得
  const registeredAssetQrCodes = useMemo(() => {
    return new Set(devices.map(d => d.qrLabel));
  }, [devices]);

  // 資産検索実行（曖昧検索: 部分一致）
  const handleAssetSearch = () => {
    const results = assets.filter(asset => {
      // 既に貸出登録済みは除外
      if (registeredAssetQrCodes.has(asset.qrCode)) return false;

      // 曖昧検索（部分一致）
      if (assetSearchFilter.building && !asset.building.includes(assetSearchFilter.building)) return false;
      if (assetSearchFilter.floor && !asset.floor.includes(assetSearchFilter.floor)) return false;
      if (assetSearchFilter.department && !asset.department.includes(assetSearchFilter.department)) return false;
      if (assetSearchFilter.section && !asset.section.includes(assetSearchFilter.section)) return false;
      if (assetSearchFilter.category && !asset.category.includes(assetSearchFilter.category)) return false;
      if (assetSearchFilter.largeClass && !asset.largeClass.includes(assetSearchFilter.largeClass)) return false;
      if (assetSearchFilter.mediumClass && !asset.mediumClass.includes(assetSearchFilter.mediumClass)) return false;
      return true;
    });
    setSearchResults(results);
    setSelectedAssetIds(new Set());
    setHasSearched(true);
  };

  // 資産選択トグル
  const toggleAssetSelection = (qrCode: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(qrCode)) {
      newSelected.delete(qrCode);
    } else {
      newSelected.add(qrCode);
    }
    setSelectedAssetIds(newSelected);
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedAssetIds.size === searchResults.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(searchResults.map(a => a.qrCode)));
    }
  };

  // 選択した資産を登録モーダルへ
  const proceedToRegistration = () => {
    const selected = searchResults.filter(a => selectedAssetIds.has(a.qrCode));
    setSelectedAssetsForRegistration(selected);
    setShowSearchModal(false);
    setShowRegistrationModal(true);
  };

  // 貸出登録実行
  const handleRegisterLending = () => {
    // 新しい貸出機器を追加
    const newDevices: LendingDevice[] = selectedAssetsForRegistration.map((asset, index) => ({
      id: devices.length + index + 1,
      qrLabel: asset.qrCode,
      meManagementNo: '',
      itemName: asset.name,
      maker: asset.maker,
      model: asset.model,
      category: asset.category,
      majorCategory: asset.largeClass,
      middleCategory: asset.mediumClass,
      status: '貸出可' as const,
      installedDepartment: asset.section,
      lendingDate: null,
      expectedReturnDate: null,
      overduedays: 0,
      inspectionMarginDays: returnPeriodDays,
      isFixedPlacement: false,
      freeComment: '',
    }));

    setDevices(prev => [...prev, ...newDevices]);
    setShowRegistrationModal(false);
    setSelectedAssetsForRegistration([]);
    setReturnPeriodDays(90);

    // 検索状態もリセット
    setAssetSearchFilter({
      building: '',
      floor: '',
      department: '',
      section: '',
      category: '',
      largeClass: '',
      mediumClass: '',
    });
    setSearchResults([]);
    setSelectedAssetIds(new Set());
    setHasSearched(false);

    alert(`${newDevices.length}件の機器を貸出管理タスクリストに追加しました`);
  };

  // 検索モーダルを開く
  const openSearchModal = () => {
    setShowSearchModal(true);
    setHasSearched(false);
    setSearchResults([]);
    setSelectedAssetIds(new Set());
  };

  // フィルター変更時に依存する下位フィルターをリセット
  const handleBuildingChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      building: value,
      floor: '',
      department: '',
      section: '',
    }));
  };

  const handleFloorChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      floor: value,
      department: '',
      section: '',
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      department: value,
      section: '',
    }));
  };

  const handleCategoryChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      category: value,
      largeClass: '',
      mediumClass: '',
    }));
  };

  const handleLargeClassChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      largeClass: value,
      mediumClass: '',
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ヘッダー: 追加ボタン */}
      <div style={{
        background: '#f8f9fa',
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '14px', color: '#333' }}>
          登録済み機器: <strong>{devices.length}件</strong>
        </div>
        <button
          onClick={openSearchModal}
          style={{
            padding: '8px 16px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          貸出機器を追加
        </button>
      </div>

      {/* フィルター */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>カテゴリ</label>
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>大分類</label>
          <select
            value={filter.majorCategory}
            onChange={(e) => setFilter(prev => ({ ...prev, majorCategory: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMajorCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>中分類</label>
          <select
            value={filter.middleCategory}
            onChange={(e) => setFilter(prev => ({ ...prev, middleCategory: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMiddleCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>品目</label>
          <input
            type="text"
            value={filter.itemName}
            onChange={(e) => setFilter(prev => ({ ...prev, itemName: e.target.value }))}
            placeholder="品目名"
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '120px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>メーカー</label>
          <select
            value={filter.maker}
            onChange={(e) => setFilter(prev => ({ ...prev, maker: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMakers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>型式</label>
          <input
            type="text"
            value={filter.model}
            onChange={(e) => setFilter(prev => ({ ...prev, model: e.target.value }))}
            placeholder="型式"
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>ステータス</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>設置部署</label>
          <select
            value={filter.installedDepartment}
            onChange={(e) => setFilter(prev => ({ ...prev, installedDepartment: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
            <input
              type="checkbox"
              checked={filter.overdueOnly}
              onChange={(e) => setFilter(prev => ({ ...prev, overdueOnly: e.target.checked }))}
            />
            返却超過機器
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
            <input
              type="checkbox"
              checked={filter.fixedPlacementOnly}
              onChange={(e) => setFilter(prev => ({ ...prev, fixedPlacementOnly: e.target.checked }))}
            />
            定数配置設定機器
          </label>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            {/* グループヘッダー */}
            <tr style={{ background: '#e9ecef' }}>
              <th colSpan={5} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                商品情報
              </th>
              <th style={{ borderLeft: '2px solid #ccc', width: '1px' }}></th>
              <th colSpan={6} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                貸出機器状況
              </th>
              <th style={{ borderLeft: '2px solid #ccc', width: '1px' }}></th>
              <th colSpan={3} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                操作
              </th>
            </tr>
            {/* カラムヘッダー */}
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>QRラベル</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>ME管理No.</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>品目</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>メーカー</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
              <th style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>ステータス</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>設置部署</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>貸出日</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>返却予定日</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>返却超過日数</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>点検余裕日数</th>
              <th style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>返却期間設定</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>定数機器設定</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>フリーコメント</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  データがありません
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => (
                <tr
                  key={device.id}
                  style={{
                    background: index % 2 === 0 ? 'white' : '#fafafa',
                    ...(device.overduedays > 0 ? { background: '#fff5f5' } : {}),
                  }}
                >
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{device.qrLabel}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{device.meManagementNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.itemName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.maker}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.model}</td>
                  <td style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <span style={getStatusStyle(device.status)}>{device.status}</span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.installedDepartment}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {device.lendingDate || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {device.expectedReturnDate || '-'}
                  </td>
                  <td style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    fontWeight: device.overduedays > 0 ? 'bold' : 'normal',
                    color: device.overduedays > 0 ? '#c0392b' : '#333',
                  }}>
                    {device.overduedays > 0 ? `${device.overduedays}日` : '-'}
                  </td>
                  <td style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    color: device.inspectionMarginDays <= 14 ? '#e67e22' : '#333',
                  }}>
                    {device.inspectionMarginDays}日
                  </td>
                  <td style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`返却期間設定: ${device.qrLabel}`);
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      設定
                    </a>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`定数機器設定: ${device.qrLabel}`);
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      {device.isFixedPlacement ? '解除' : '設定'}
                    </a>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const comment = prompt('コメントを入力', device.freeComment);
                        if (comment !== null) {
                          alert(`コメント保存: ${comment}`);
                        }
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      {device.freeComment ? '編集' : '入力'}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 資産検索モーダル */}
      {showSearchModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '1000px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {/* モーダルヘッダー */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>貸出機器を追加</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* 検索フィルター（資産一覧画面と同じ項目）- 曖昧検索対応 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'flex-end' }}>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>棟</label>
                  <SearchableSelect
                    value={assetSearchFilter.building}
                    onChange={(value) => handleBuildingChange(value)}
                    options={buildingOptions}
                    placeholder="すべて"
                    dropdownMinWidth="120px"
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>階</label>
                  <SearchableSelect
                    value={assetSearchFilter.floor}
                    onChange={(value) => handleFloorChange(value)}
                    options={floorOptions}
                    placeholder="すべて"
                    dropdownMinWidth="100px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>部門</label>
                  <SearchableSelect
                    value={assetSearchFilter.department}
                    onChange={(value) => handleDepartmentChange(value)}
                    options={departmentOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>部署</label>
                  <SearchableSelect
                    value={assetSearchFilter.section}
                    onChange={(value) => setAssetSearchFilter(prev => ({ ...prev, section: value }))}
                    options={sectionOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Category</label>
                  <SearchableSelect
                    value={assetSearchFilter.category}
                    onChange={(value) => handleCategoryChange(value)}
                    options={categoryOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>大分類</label>
                  <SearchableSelect
                    value={assetSearchFilter.largeClass}
                    onChange={(value) => handleLargeClassChange(value)}
                    options={largeClassOptions}
                    placeholder="すべて"
                    dropdownMinWidth="180px"
                  />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>中分類</label>
                  <SearchableSelect
                    value={assetSearchFilter.mediumClass}
                    onChange={(value) => setAssetSearchFilter(prev => ({ ...prev, mediumClass: value }))}
                    options={mediumClassOptions}
                    placeholder="すべて"
                    dropdownMinWidth="180px"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAssetSearch}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  検索
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
              {!hasSearched ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  検索条件を入力して「検索」ボタンをクリックしてください
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  該当する未登録の機器がありません
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.size === searchResults.length && searchResults.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>施設名</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>QRコード</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>棟</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>階</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>部門</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>個体管理名称</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>メーカー名</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((asset, index) => (
                      <tr
                        key={asset.qrCode}
                        style={{
                          background: selectedAssetIds.has(asset.qrCode) ? '#e3f2fd' : (index % 2 === 0 ? 'white' : '#fafafa'),
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleAssetSelection(asset.qrCode)}
                      >
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.has(asset.qrCode)}
                            onChange={() => toggleAssetSelection(asset.qrCode)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.facility}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{asset.qrCode}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.building}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.floor}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.department}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.maker}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{asset.model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* モーダルフッター */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
            }}>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {searchResults.length > 0 && `${selectedAssetIds.size}件選択中`}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowSearchModal(false)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#fff',
                    color: '#666',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={proceedToRegistration}
                  disabled={selectedAssetIds.size === 0}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: selectedAssetIds.size > 0 ? '#27ae60' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedAssetIds.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  選択した機器を貸出登録（{selectedAssetIds.size}件）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 貸出管理登録モーダル */}
      {showRegistrationModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '12px',
            width: '500px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
              貸出機器登録
            </h3>

            {/* 選択された機器数 */}
            <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#1565c0' }}>
                選択機器: <strong>{selectedAssetsForRegistration.length}件</strong>
              </span>
            </div>

            {/* 返却までの期限 */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}>
                <span style={{ fontSize: '16px', color: '#333' }}>返却までの期限</span>
                <input
                  type="number"
                  value={returnPeriodDays}
                  onChange={(e) => setReturnPeriodDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    fontSize: '18px',
                    fontVariantNumeric: 'tabular-nums',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '16px', color: '#333' }}>日</span>
              </div>
            </div>

            {/* 登録ボタン */}
            <button
              onClick={handleRegisterLending}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#d4edda',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              貸出管理タスクリストに追加する
            </button>

            {/* キャンセルリンク */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setShowSearchModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
