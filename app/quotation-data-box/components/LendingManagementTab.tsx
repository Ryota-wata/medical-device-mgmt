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

// 貸出履歴レコード型
interface LendingHistoryRecord {
  id: string;
  deviceId: number;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  lendingDate: string;
  returnDate: string | null;
  lendingDepartment: string;
  staffName: string;
  status: '貸出中' | '返却済';
}

// モックデータ: 貸出履歴
const MOCK_LENDING_HISTORY: LendingHistoryRecord[] = [
  { id: 'H001', deviceId: 1, qrLabel: 'QR-001', itemName: '人工呼吸器', maker: 'フクダ電子', model: 'FV-500', lendingDate: '2026-01-15', returnDate: null, lendingDepartment: 'ICU', staffName: '山田太郎', status: '貸出中' },
  { id: 'H002', deviceId: 1, qrLabel: 'QR-001', itemName: '人工呼吸器', maker: 'フクダ電子', model: 'FV-500', lendingDate: '2025-12-01', returnDate: '2025-12-20', lendingDepartment: '3階東病棟', staffName: '佐藤花子', status: '返却済' },
  { id: 'H003', deviceId: 1, qrLabel: 'QR-001', itemName: '人工呼吸器', maker: 'フクダ電子', model: 'FV-500', lendingDate: '2025-10-15', returnDate: '2025-11-10', lendingDepartment: 'ICU', staffName: '田中一郎', status: '返却済' },
  { id: 'H004', deviceId: 2, qrLabel: 'QR-002', itemName: '輸液ポンプ', maker: 'テルモ', model: 'TE-171', lendingDate: '2026-01-20', returnDate: null, lendingDepartment: '3階東病棟', staffName: '鈴木次郎', status: '貸出中' },
  { id: 'H005', deviceId: 2, qrLabel: 'QR-002', itemName: '輸液ポンプ', maker: 'テルモ', model: 'TE-171', lendingDate: '2025-12-10', returnDate: '2026-01-05', lendingDepartment: '2階西病棟', staffName: '高橋三郎', status: '返却済' },
  { id: 'H006', deviceId: 3, qrLabel: 'QR-003', itemName: 'シリンジポンプ', maker: 'テルモ', model: 'TE-SS700', lendingDate: '2025-11-01', returnDate: '2025-11-20', lendingDepartment: 'ICU', staffName: '伊藤四郎', status: '返却済' },
  { id: 'H007', deviceId: 5, qrLabel: 'QR-005', itemName: '心電計', maker: 'フクダ電子', model: 'FX-8000', lendingDate: '2026-01-10', returnDate: null, lendingDepartment: '2階西病棟', staffName: '渡辺五郎', status: '貸出中' },
  { id: 'H008', deviceId: 5, qrLabel: 'QR-005', itemName: '心電計', maker: 'フクダ電子', model: 'FX-8000', lendingDate: '2025-12-15', returnDate: '2026-01-05', lendingDepartment: '外来', staffName: '中村六郎', status: '返却済' },
  { id: 'H009', deviceId: 3, qrLabel: 'QR-003', itemName: 'シリンジポンプ', maker: 'テルモ', model: 'TE-SS700', lendingDate: '2026-01-25', returnDate: '2026-02-05', lendingDepartment: '手術室', staffName: '小林七郎', status: '返却済' },
  { id: 'H010', deviceId: 4, qrLabel: 'QR-004', itemName: '除細動器', maker: '日本光電', model: 'TEC-5600', lendingDate: '2025-11-20', returnDate: '2025-12-10', lendingDepartment: '救急外来', staffName: '加藤八郎', status: '返却済' },
];

// エクスポートレポート種別
type ExportReportType =
  | 'device-history'      // ① 機器単体の貸出履歴
  | 'monthly-summary'     // ② 月次貸出実績一覧
  | 'utilization-rate'    // ③ 機器別稼働率表
  | 'ward-summary'        // ④ 病棟別貸出台数集計
  | 'overdue-list';       // ⑤ 遅延機器一覧

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

  // 返却期間設定モーダル
  const [showReturnPeriodModal, setShowReturnPeriodModal] = useState(false);
  const [returnPeriodTarget, setReturnPeriodTarget] = useState<'single' | 'deviceType'>('single');
  const [selectedDeviceForReturnPeriod, setSelectedDeviceForReturnPeriod] = useState<LendingDevice | null>(null);
  const [newReturnPeriodDays, setNewReturnPeriodDays] = useState<number>(90);

  // 定数機器設定モーダル
  const [showFixedPlacementModal, setShowFixedPlacementModal] = useState(false);
  const [selectedDeviceForFixedPlacement, setSelectedDeviceForFixedPlacement] = useState<LendingDevice | null>(null);
  const [fixedPlacementDepartment, setFixedPlacementDepartment] = useState<string>('');

  // フリーコメントモーダル
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedDeviceForComment, setSelectedDeviceForComment] = useState<LendingDevice | null>(null);
  const [newComment, setNewComment] = useState<string>('');

  // エクスポート関連
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportType, setExportReportType] = useState<ExportReportType | null>(null);
  const [exportSelectedDevice, setExportSelectedDevice] = useState<string>('');
  const [exportTargetMonth, setExportTargetMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM形式
  );
  const [exportStartDate, setExportStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0]
  );
  const [exportEndDate, setExportEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 貸出履歴データ
  const [lendingHistory] = useState<LendingHistoryRecord[]>(MOCK_LENDING_HISTORY);

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

  // 返却期間設定モーダルを開く
  const openReturnPeriodModal = (device: LendingDevice) => {
    setSelectedDeviceForReturnPeriod(device);
    setNewReturnPeriodDays(device.inspectionMarginDays);
    setReturnPeriodTarget('single');
    setShowReturnPeriodModal(true);
  };

  // 返却期間を保存
  const handleSaveReturnPeriod = () => {
    if (!selectedDeviceForReturnPeriod) return;

    if (returnPeriodTarget === 'single') {
      // 単一機器のみ更新
      setDevices(prev => prev.map(d =>
        d.id === selectedDeviceForReturnPeriod.id
          ? { ...d, inspectionMarginDays: newReturnPeriodDays }
          : d
      ));
    } else {
      // 同じ機種（品目+メーカー+型式）をまとめて更新
      setDevices(prev => prev.map(d =>
        d.itemName === selectedDeviceForReturnPeriod.itemName &&
        d.maker === selectedDeviceForReturnPeriod.maker &&
        d.model === selectedDeviceForReturnPeriod.model
          ? { ...d, inspectionMarginDays: newReturnPeriodDays }
          : d
      ));
    }

    setShowReturnPeriodModal(false);
    setSelectedDeviceForReturnPeriod(null);
  };

  // 定数機器設定モーダルを開く
  const openFixedPlacementModal = (device: LendingDevice) => {
    setSelectedDeviceForFixedPlacement(device);
    setFixedPlacementDepartment(device.isFixedPlacement ? device.installedDepartment : '');
    setShowFixedPlacementModal(true);
  };

  // 定数機器設定を保存
  const handleSaveFixedPlacement = (isFixed: boolean) => {
    if (!selectedDeviceForFixedPlacement) return;

    setDevices(prev => prev.map(d =>
      d.id === selectedDeviceForFixedPlacement.id
        ? {
            ...d,
            isFixedPlacement: isFixed,
            installedDepartment: isFixed ? fixedPlacementDepartment : d.installedDepartment,
            expectedReturnDate: isFixed ? null : d.expectedReturnDate,
          }
        : d
    ));

    setShowFixedPlacementModal(false);
    setSelectedDeviceForFixedPlacement(null);
  };

  // フリーコメントモーダルを開く
  const openCommentModal = (device: LendingDevice) => {
    setSelectedDeviceForComment(device);
    setNewComment(device.freeComment);
    setShowCommentModal(true);
  };

  // フリーコメントを保存
  const handleSaveComment = () => {
    if (!selectedDeviceForComment) return;

    setDevices(prev => prev.map(d =>
      d.id === selectedDeviceForComment.id
        ? { ...d, freeComment: newComment }
        : d
    ));

    setShowCommentModal(false);
    setSelectedDeviceForComment(null);
  };

  // エクスポートモーダルを開く
  const openExportModal = (reportType: ExportReportType) => {
    setExportReportType(reportType);
    setShowExportDropdown(false);
    setShowExportModal(true);
    setExportSelectedDevice('');
  };

  // CSV生成・ダウンロード
  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const bom = '\uFEFF'; // BOM for Excel
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ① 機器単体の貸出履歴エクスポート
  const exportDeviceHistory = () => {
    if (!exportSelectedDevice) return;

    const deviceHistory = lendingHistory.filter(h => h.qrLabel === exportSelectedDevice);
    const headers = ['貸出日', '返却日', '貸出先部署', '貸出期間(日)', '担当者', 'ステータス'];
    const rows = deviceHistory.map(h => {
      const lendingDays = h.returnDate
        ? Math.ceil((new Date(h.returnDate).getTime() - new Date(h.lendingDate).getTime()) / (1000 * 60 * 60 * 24))
        : '-';
      return [h.lendingDate, h.returnDate || '-', h.lendingDepartment, String(lendingDays), h.staffName, h.status];
    });

    downloadCsv(`機器貸出履歴_${exportSelectedDevice}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    setShowExportModal(false);
  };

  // ② 月次貸出実績一覧エクスポート
  const exportMonthlySummary = () => {
    const [year, month] = exportTargetMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const monthlyHistory = lendingHistory.filter(h => {
      const lendingDate = new Date(h.lendingDate);
      return lendingDate >= startOfMonth && lendingDate <= endOfMonth;
    });

    const headers = ['QRラベル', '機器名', 'メーカー', '型式', '貸出日', '返却日', '貸出先', 'ステータス'];
    const rows = monthlyHistory.map(h => [
      h.qrLabel, h.itemName, h.maker, h.model, h.lendingDate, h.returnDate || '-', h.lendingDepartment, h.status
    ]);

    downloadCsv(`月次貸出実績_${exportTargetMonth}.csv`, headers, rows);
    setShowExportModal(false);
  };

  // ③ 機器別稼働率表エクスポート
  const exportUtilizationRate = () => {
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 機器ごとに集計
    const deviceStats: Record<string, { itemName: string; maker: string; model: string; activeDays: number; lendingCount: number }> = {};

    devices.forEach(d => {
      deviceStats[d.qrLabel] = { itemName: d.itemName, maker: d.maker, model: d.model, activeDays: 0, lendingCount: 0 };
    });

    lendingHistory.forEach(h => {
      if (!deviceStats[h.qrLabel]) return;

      const lendStart = new Date(h.lendingDate);
      const lendEnd = h.returnDate ? new Date(h.returnDate) : end;

      // 期間内の稼働日数を計算
      const effectiveStart = lendStart < start ? start : lendStart;
      const effectiveEnd = lendEnd > end ? end : lendEnd;

      if (effectiveStart <= effectiveEnd) {
        const days = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        deviceStats[h.qrLabel].activeDays += days;
        deviceStats[h.qrLabel].lendingCount += 1;
      }
    });

    const headers = ['QRラベル', '機器名', 'メーカー', '型式', '稼働日数', '稼働率(%)', '貸出回数'];
    const rows = Object.entries(deviceStats).map(([qrLabel, stats]) => {
      const utilizationRate = totalDays > 0 ? ((stats.activeDays / totalDays) * 100).toFixed(1) : '0';
      return [qrLabel, stats.itemName, stats.maker, stats.model, String(stats.activeDays), utilizationRate, String(stats.lendingCount)];
    });

    downloadCsv(`機器別稼働率_${exportStartDate}_${exportEndDate}.csv`, headers, rows);
    setShowExportModal(false);
  };

  // ④ 病棟別貸出台数集計エクスポート
  const exportWardSummary = () => {
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);

    // 部署ごとに集計
    const wardStats: Record<string, { lendingCount: number; returnCount: number; currentLending: number; totalDays: number }> = {};

    lendingHistory.forEach(h => {
      const lendDate = new Date(h.lendingDate);
      if (lendDate < start || lendDate > end) return;

      if (!wardStats[h.lendingDepartment]) {
        wardStats[h.lendingDepartment] = { lendingCount: 0, returnCount: 0, currentLending: 0, totalDays: 0 };
      }

      wardStats[h.lendingDepartment].lendingCount += 1;

      if (h.returnDate) {
        wardStats[h.lendingDepartment].returnCount += 1;
        const days = Math.ceil((new Date(h.returnDate).getTime() - lendDate.getTime()) / (1000 * 60 * 60 * 24));
        wardStats[h.lendingDepartment].totalDays += days;
      } else {
        wardStats[h.lendingDepartment].currentLending += 1;
      }
    });

    const headers = ['部署名', '貸出台数', '返却台数', '現在貸出中', '平均貸出期間(日)'];
    const rows = Object.entries(wardStats).map(([dept, stats]) => {
      const avgDays = stats.returnCount > 0 ? (stats.totalDays / stats.returnCount).toFixed(1) : '-';
      return [dept, String(stats.lendingCount), String(stats.returnCount), String(stats.currentLending), avgDays];
    });

    downloadCsv(`病棟別貸出集計_${exportStartDate}_${exportEndDate}.csv`, headers, rows);
    setShowExportModal(false);
  };

  // ⑤ 遅延機器一覧エクスポート
  const exportOverdueList = () => {
    const overdueDevices = devices.filter(d => d.overduedays > 0);

    const headers = ['QRラベル', 'ME管理No.', '機器名', 'メーカー', '型式', '貸出日', '返却予定日', '超過日数', '貸出先'];
    const rows = overdueDevices.map(d => [
      d.qrLabel, d.meManagementNo, d.itemName, d.maker, d.model,
      d.lendingDate || '-', d.expectedReturnDate || '-', String(d.overduedays), d.installedDepartment
    ]);

    downloadCsv(`遅延機器一覧_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    setShowExportModal(false);
  };

  // エクスポート実行
  const handleExport = () => {
    switch (exportReportType) {
      case 'device-history':
        exportDeviceHistory();
        break;
      case 'monthly-summary':
        exportMonthlySummary();
        break;
      case 'utilization-rate':
        exportUtilizationRate();
        break;
      case 'ward-summary':
        exportWardSummary();
        break;
      case 'overdue-list':
        exportOverdueList();
        break;
    }
  };

  // エクスポートレポートのタイトル取得
  const getExportReportTitle = (type: ExportReportType | null) => {
    switch (type) {
      case 'device-history': return '機器単体の貸出履歴';
      case 'monthly-summary': return '月次貸出実績一覧';
      case 'utilization-rate': return '機器別稼働率表';
      case 'ward-summary': return '病棟別貸出台数集計';
      case 'overdue-list': return '遅延機器一覧';
      default: return '';
    }
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
      {/* ヘッダー: 追加ボタン・エクスポートボタン */}
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* エクスポートドロップダウン */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
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
              <span style={{ fontSize: '14px' }}>📊</span>
              エクスポート
              <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
            </button>
            {showExportDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '220px',
                zIndex: 100,
              }}>
                <button
                  onClick={() => openExportModal('device-history')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                    borderBottom: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ① 機器単体の貸出履歴
                </button>
                <button
                  onClick={() => openExportModal('monthly-summary')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                    borderBottom: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ② 月次貸出実績一覧
                </button>
                <button
                  onClick={() => openExportModal('utilization-rate')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                    borderBottom: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ③ 機器別稼働率表
                </button>
                <button
                  onClick={() => openExportModal('ward-summary')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                    borderBottom: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ④ 病棟別貸出台数集計
                </button>
                <button
                  onClick={() => openExportModal('overdue-list')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ⑤ 遅延機器一覧
                </button>
              </div>
            )}
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                        {device.isFixedPlacement ? '-' : `${device.inspectionMarginDays}日`}
                      </span>
                      {!device.isFixedPlacement && (
                        <button
                          onClick={() => openReturnPeriodModal(device)}
                          style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            background: '#fff',
                            border: '1px solid #c0392b',
                            color: '#c0392b',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          変更
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {device.isFixedPlacement ? (
                        <>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '3px',
                            fontWeight: 500,
                          }}>
                            定数配置
                          </span>
                          <span style={{ fontSize: '11px', color: '#666' }}>
                            {device.installedDepartment}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#999' }}>未設定</span>
                      )}
                      <button
                        onClick={() => openFixedPlacementModal(device)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          background: '#fff',
                          border: '1px solid #c0392b',
                          color: '#c0392b',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {device.isFixedPlacement ? '解除' : '設定'}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {device.freeComment ? (
                        <span style={{
                          fontSize: '11px',
                          color: '#333',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {device.freeComment}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#999' }}>-</span>
                      )}
                      <button
                        onClick={() => openCommentModal(device)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          background: '#fff',
                          border: '1px solid #c0392b',
                          color: '#c0392b',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {device.freeComment ? '編集' : '入力'}
                      </button>
                    </div>
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

      {/* 返却期間設定モーダル */}
      {showReturnPeriodModal && selectedDeviceForReturnPeriod && (
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
            width: '450px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              デフォルト返却期間の設定
            </h3>

            {/* 対象機器情報 */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <div><strong>品目:</strong> {selectedDeviceForReturnPeriod.itemName}</div>
              <div><strong>メーカー:</strong> {selectedDeviceForReturnPeriod.maker}</div>
              <div><strong>型式:</strong> {selectedDeviceForReturnPeriod.model}</div>
            </div>

            {/* 設定対象の選択 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                設定対象
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="returnPeriodTarget"
                    checked={returnPeriodTarget === 'single'}
                    onChange={() => setReturnPeriodTarget('single')}
                  />
                  <span style={{ fontSize: '13px' }}>この機器のみ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="returnPeriodTarget"
                    checked={returnPeriodTarget === 'deviceType'}
                    onChange={() => setReturnPeriodTarget('deviceType')}
                  />
                  <span style={{ fontSize: '13px' }}>
                    同じ機種をまとめて設定
                    <span style={{ color: '#666', fontSize: '11px', marginLeft: '4px' }}>
                      （{selectedDeviceForReturnPeriod.itemName} / {selectedDeviceForReturnPeriod.maker} / {selectedDeviceForReturnPeriod.model}）
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* 返却期間入力 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                返却期間
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={newReturnPeriodDays}
                  onChange={(e) => setNewReturnPeriodDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  style={{
                    width: '100px',
                    padding: '10px 12px',
                    fontSize: '16px',
                    fontVariantNumeric: 'tabular-nums',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    textAlign: 'right',
                  }}
                />
                <span style={{ fontSize: '14px' }}>日</span>
              </div>
            </div>

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReturnPeriodModal(false);
                  setSelectedDeviceForReturnPeriod(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveReturnPeriod}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 定数機器設定モーダル */}
      {showFixedPlacementModal && selectedDeviceForFixedPlacement && (
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
            width: '450px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              定数設置機器の設定
            </h3>

            {/* 対象機器情報 */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <div><strong>QRラベル:</strong> {selectedDeviceForFixedPlacement.qrLabel}</div>
              <div><strong>品目:</strong> {selectedDeviceForFixedPlacement.itemName}</div>
              <div><strong>メーカー:</strong> {selectedDeviceForFixedPlacement.maker}</div>
            </div>

            {selectedDeviceForFixedPlacement.isFixedPlacement ? (
              // 解除モード
              <div>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#e65100',
                }}>
                  この機器は現在「{selectedDeviceForFixedPlacement.installedDepartment}」に定数配置されています。
                  解除すると返却期間が適用されます。
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowFixedPlacementModal(false);
                      setSelectedDeviceForFixedPlacement(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#fff',
                      color: '#666',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveFixedPlacement(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    定数配置を解除
                  </button>
                </div>
              </div>
            ) : (
              // 設定モード
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#2e7d32',
                }}>
                  定数設置機器に設定すると、返却期間が無しとなります。
                </div>

                {/* 配置部署選択 */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    定数配置する部署 <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    value={fixedPlacementDepartment}
                    onChange={(e) => setFixedPlacementDepartment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">部署を選択...</option>
                    {uniqueDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="ICU">ICU</option>
                    <option value="手術室">手術室</option>
                    <option value="救急外来">救急外来</option>
                    <option value="ME室">ME室</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowFixedPlacementModal(false);
                      setSelectedDeviceForFixedPlacement(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#fff',
                      color: '#666',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveFixedPlacement(true)}
                    disabled={!fixedPlacementDepartment}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: fixedPlacementDepartment ? '#27ae60' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: fixedPlacementDepartment ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    定数配置に設定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* フリーコメントモーダル */}
      {showCommentModal && selectedDeviceForComment && (
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
            width: '450px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              フリーコメント
            </h3>

            {/* 対象機器情報 */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <div><strong>QRラベル:</strong> {selectedDeviceForComment.qrLabel}</div>
              <div><strong>品目:</strong> {selectedDeviceForComment.itemName}</div>
            </div>

            {/* コメント入力 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                コメント
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  minHeight: '100px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setSelectedDeviceForComment(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveComment}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エクスポートモーダル */}
      {showExportModal && exportReportType && (
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
            width: '500px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {getExportReportTitle(exportReportType)}
            </h3>

            {/* ① 機器単体の貸出履歴 */}
            {exportReportType === 'device-history' && (
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1565c0',
                }}>
                  選択した機器の貸出履歴をCSVでエクスポートします（トレーサビリティ用）
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    対象機器を選択 <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    value={exportSelectedDevice}
                    onChange={(e) => setExportSelectedDevice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">機器を選択...</option>
                    {devices.map(d => (
                      <option key={d.qrLabel} value={d.qrLabel}>
                        {d.qrLabel} - {d.itemName} ({d.maker} {d.model})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ② 月次貸出実績一覧 */}
            {exportReportType === 'monthly-summary' && (
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1565c0',
                }}>
                  指定月の全貸出実績をCSVでエクスポートします
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    対象年月 <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="month"
                    value={exportTargetMonth}
                    onChange={(e) => setExportTargetMonth(e.target.value)}
                    style={{
                      width: '200px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* ③ 機器別稼働率表 */}
            {exportReportType === 'utilization-rate' && (
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1565c0',
                }}>
                  指定期間における各機器の稼働率を算出してCSVでエクスポートします
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    集計期間 <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>〜</span>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ④ 病棟別貸出台数集計 */}
            {exportReportType === 'ward-summary' && (
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1565c0',
                }}>
                  指定期間における部署別の貸出台数・返却状況をCSVでエクスポートします
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    集計期間 <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>〜</span>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ⑤ 遅延機器一覧 */}
            {exportReportType === 'overdue-list' && (
              <div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#e65100',
                }}>
                  現在返却期限を超過している機器の一覧をCSVでエクスポートします
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e74c3c', fontVariantNumeric: 'tabular-nums' }}>
                    {devices.filter(d => d.overduedays > 0).length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    件の遅延機器
                  </div>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportReportType(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleExport}
                disabled={
                  (exportReportType === 'device-history' && !exportSelectedDevice) ||
                  (exportReportType === 'overdue-list' && devices.filter(d => d.overduedays > 0).length === 0)
                }
                style={{
                  padding: '10px 20px',
                  backgroundColor:
                    (exportReportType === 'device-history' && !exportSelectedDevice) ||
                    (exportReportType === 'overdue-list' && devices.filter(d => d.overduedays > 0).length === 0)
                      ? '#ccc'
                      : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    (exportReportType === 'device-history' && !exportSelectedDevice) ||
                    (exportReportType === 'overdue-list' && devices.filter(d => d.overduedays > 0).length === 0)
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                CSVをエクスポート
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ドロップダウン外クリックで閉じる */}
      {showExportDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
          onClick={() => setShowExportDropdown(false)}
        />
      )}
    </div>
  );
};
