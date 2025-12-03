'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';

// カラム定義（資産検索結果画面と同じ）
interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'facility', label: '施設名', width: '200px', defaultVisible: true },
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true },
  { key: 'assetNo', label: '固定資産番号', width: '150px', defaultVisible: false },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false },
  { key: 'building', label: '棟', width: '100px', defaultVisible: true },
  { key: 'floor', label: '階', width: '80px', defaultVisible: true },
  { key: 'department', label: '部門名', width: '120px', defaultVisible: true },
  { key: 'section', label: '部署名', width: '120px', defaultVisible: false },
  { key: 'roomClass1', label: '諸室区分①', width: '120px', defaultVisible: false },
  { key: 'roomClass2', label: '諸室区分②', width: '120px', defaultVisible: false },
  { key: 'roomName', label: '諸室名称', width: '150px', defaultVisible: false },
  { key: 'category', label: 'Category', width: '120px', defaultVisible: false },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: false },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: false },
  { key: 'item', label: '品目', width: '150px', defaultVisible: false },
  { key: 'name', label: '個体管理名称', width: '200px', defaultVisible: true },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true },
  { key: 'quantityUnit', label: '数量／単位', width: '120px', defaultVisible: false },
  { key: 'quantity', label: '数量', width: '80px', defaultVisible: false },
  { key: 'serialNumber', label: 'シリアル番号', width: '150px', defaultVisible: false },
  { key: 'width', label: 'W', width: '80px', defaultVisible: false },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false },
  { key: 'contractName', label: '契約･見積名称', width: '180px', defaultVisible: false },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false },
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false },
  { key: 'rental', label: '借用', width: '80px', defaultVisible: false },
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false },
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false },
  { key: 'legalServiceLife', label: '耐用年数（法定）', width: '140px', defaultVisible: false },
  { key: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', width: '180px', defaultVisible: false },
  { key: 'endOfService', label: 'End of service：販売終了', width: '180px', defaultVisible: false },
  { key: 'endOfSupport', label: 'End of support：メンテ終了', width: '180px', defaultVisible: false },
];

export default function RemodelApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { assets: assetMasters, facilities } = useMasterStore();
  const { isMobile } = useResponsive();

  // URLパラメータから施設・部署を取得
  const facility = searchParams.get('facility') || '';
  const department = searchParams.get('department') || '';

  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      initial[col.key] = col.defaultVisible ?? false;
    });
    return initial;
  });

  // 申請モーダル関連の状態
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [currentApplicationType, setCurrentApplicationType] = useState<string>('');
  const [applicationBuilding, setApplicationBuilding] = useState('');
  const [applicationFloor, setApplicationFloor] = useState('');
  const [applicationDepartment, setApplicationDepartment] = useState('');
  const [applicationSection, setApplicationSection] = useState('');
  const [applicationRoomName, setApplicationRoomName] = useState('');

  // 新規申請モーダル関連の状態
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false);
  const [newAppBuilding, setNewAppBuilding] = useState('');
  const [newAppFloor, setNewAppFloor] = useState('');
  const [newAppDepartment, setNewAppDepartment] = useState('');
  const [newAppSection, setNewAppSection] = useState('');
  const [newAppRoomName, setNewAppRoomName] = useState('');

  // 選択された資産リスト（新規申請用）
  interface SelectedAsset {
    asset: Asset;
    quantity: number;
    unit: string;
  }
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);

  // システム関連情報（任意）
  const [currentConnectionStatus, setCurrentConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [currentConnectionDestination, setCurrentConnectionDestination] = useState('');
  const [requestConnectionStatus, setRequestConnectionStatus] = useState<'required' | 'not-required'>('not-required');
  const [requestConnectionDestination, setRequestConnectionDestination] = useState('');

  // その他情報（任意）
  const [applicationReason, setApplicationReason] = useState('');
  const [executionYear, setExecutionYear] = useState('');

  // カラム幅の状態管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = { checkbox: 50 };
    ALL_COLUMNS.forEach((col) => {
      initial[col.key] = parseInt(col.width || '150');
    });
    return initial;
  });

  // リサイズ中の状態管理
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: ''
  });

  // マスタデータからフィルターoptionsを生成
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean);
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean);
  }, [assetMasters]);

  // 施設マスタからフィルターoptionsを生成
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building).filter((b): b is string => !!b)));
    return uniqueBuildings;
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor).filter((f): f is string => !!f)));
    return uniqueFloors;
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department).filter((d): d is string => !!d)));
    return uniqueDepartments;
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section).filter((s): s is string => !!s)));
    return uniqueSections;
  }, [facilities]);

  const roomNameOptions = useMemo(() => {
    const uniqueRoomNames = Array.from(new Set(facilities.map(f => f.roomName).filter((r): r is string => !!r)));
    return uniqueRoomNames;
  }, [facilities]);

  // モックデータ
  const [mockAssets] = useState<Asset[]>(
    Array.from({length: 20}, (_, i) => ({
      qrCode: `QR-2025-${String(i + 1).padStart(4, '0')}`,
      no: i + 1,
      facility: facility,
      building: '本館',
      floor: '2F',
      department: department,
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: i % 2 === 0 ? '電気メス 双極' : 'CT関連',
      item: `品目${i + 1}`,
      name: `サンプル製品${i + 1}`,
      maker: '医療機器',
      model: `MODEL-${i + 1}`,
      quantity: 1,
      width: 500 + i * 10,
      depth: 600 + i * 10,
      height: 700 + i * 10,
      assetNo: `10605379-${String(i + 1).padStart(3, '0')}`,
      managementNo: `${1338 + i + 1}`,
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: `手術室${String.fromCharCode(65 + i)}`,
      installationLocation: `手術室${String.fromCharCode(65 + i)}-中央`,
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: `SN-2024-${String(i + 1).padStart(3, '0')}`,
      contractName: `医療機器購入契約2024-${String(i + 1).padStart(2, '0')}`,
      contractNo: `C-2024-${String(i + 1).padStart(4, '0')}`,
      quotationNo: `Q-2024-${String(i + 1).padStart(4, '0')}`,
      contractDate: '2024-01-10',
      deliveryDate: '2024-01-20',
      inspectionDate: '2024-01-25',
      lease: i % 3 === 0 ? 'あり' : 'なし',
      rental: i % 5 === 0 ? 'あり' : 'なし',
      leaseStartDate: i % 3 === 0 ? '2024-01-01' : '',
      leaseEndDate: i % 3 === 0 ? '2029-12-31' : '',
      acquisitionCost: 1000000 * (i + 1),
      legalServiceLife: '6年',
      recommendedServiceLife: '8年',
      endOfService: '2032-12-31',
      endOfSupport: '2035-12-31',
    }))
  );

  useEffect(() => {
    // フィルター適用
    let filtered = mockAssets;

    if (filters.building) {
      filtered = filtered.filter(a => a.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(a => a.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(a => a.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(a => a.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(a => a.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(a => a.mediumClass === filters.mediumClass);
    }

    setFilteredAssets(filtered);
  }, [filters, mockAssets]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map(a => a.no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (no: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(no)) {
      newSelected.delete(no);
    } else {
      newSelected.add(no);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}&readonly=true`);
  };

  // カラム表示切り替え
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 全選択/全解除
  const handleSelectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
  };

  const handleDeselectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = false;
    });
    setVisibleColumns(newState);
  };

  // カラムリサイズのハンドラー
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // セルの値を取得
  const getCellValue = (asset: Asset, key: string): any => {
    if (key === 'acquisitionCost' && asset.acquisitionCost) {
      return `¥${asset.acquisitionCost.toLocaleString()}`;
    }
    return (asset as any)[key] ?? '-';
  };

  // 申請アクションハンドラー
  const handleApplicationAction = (actionType: string) => {
    if (selectedItems.size === 0 && actionType !== '新規申請') {
      alert('申請する資産を選択してください');
      return;
    }

    if (actionType === '新規申請') {
      // 新規申請モーダルを開く
      setNewAppBuilding('');
      setNewAppFloor('');
      setNewAppDepartment('');
      setNewAppSection('');
      setNewAppRoomName('');
      setSelectedAssets([]);
      setCurrentConnectionStatus('disconnected');
      setCurrentConnectionDestination('');
      setRequestConnectionStatus('not-required');
      setRequestConnectionDestination('');
      setApplicationReason('');
      setExecutionYear('');
      setIsNewApplicationModalOpen(true);
      return;
    }

    // 増設・更新・移動・廃棄申請の場合はモーダルを開く
    setCurrentApplicationType(actionType);
    setApplicationBuilding('');
    setApplicationFloor('');
    setApplicationDepartment('');
    setApplicationSection('');
    setApplicationRoomName('');
    setIsApplicationModalOpen(true);
  };

  // 申請送信処理
  const handleSubmitApplication = () => {
    // 選択された資産を取得
    const selectedAssets = filteredAssets.filter(asset => selectedItems.has(asset.no));

    // 廃棄申請以外はバリデーション
    if (currentApplicationType !== '廃棄申請') {
      if (!applicationBuilding || !applicationDepartment || !applicationSection || !applicationRoomName) {
        alert('すべての設置情報を入力してください');
        return;
      }
    }

    // 申請データを作成（各資産ごとに1レコード）
    const applications = selectedAssets.map(asset => ({
      id: `APP-${Date.now()}-${asset.no}`,
      applicationType: currentApplicationType,
      assetQrCode: asset.qrCode,
      assetName: asset.name,
      assetMaker: asset.maker,
      assetModel: asset.model,
      facility: facility,
      currentBuilding: asset.building,
      currentFloor: asset.floor,
      currentDepartment: asset.department,
      currentSection: asset.section,
      newBuilding: currentApplicationType !== '廃棄申請' ? applicationBuilding : '',
      newFloor: currentApplicationType !== '廃棄申請' ? applicationFloor : '',
      newDepartment: currentApplicationType !== '廃棄申請' ? applicationDepartment : '',
      newSection: currentApplicationType !== '廃棄申請' ? applicationSection : '',
      newRoomName: currentApplicationType !== '廃棄申請' ? applicationRoomName : '',
      applicationDate: new Date().toISOString(),
      status: '申請中'
    }));

    // ここで実際にはAPIに送信するか、Zustandストアに保存する
    console.log('申請データ:', applications);

    alert(`${currentApplicationType}を送信しました\n申請件数: ${applications.length}件`);

    // モーダルを閉じて選択をクリア
    setIsApplicationModalOpen(false);
    setSelectedItems(new Set());
  };

  // 資産マスタ別ウィンドウを開く
  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/asset-master',
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // セキュリティチェック: 同じオリジンからのメッセージのみ受け入れる
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED') {
        const assets = event.data.assets as Asset[];

        // 選択された資産を selectedAssets に追加（デフォルト数量1、単位「台」）
        const newSelectedAssets = assets.map(asset => ({
          asset,
          quantity: 1,
          unit: '台'
        }));

        setSelectedAssets(prev => [...prev, ...newSelectedAssets]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 選択資産の削除
  const handleRemoveSelectedAsset = (index: number) => {
    setSelectedAssets(prev => prev.filter((_, i) => i !== index));
  };

  // 選択資産の数量変更
  const handleQuantityChange = (index: number, quantity: number) => {
    setSelectedAssets(prev =>
      prev.map((item, i) => i === index ? { ...item, quantity } : item)
    );
  };

  // 選択資産の単位変更
  const handleUnitChange = (index: number, unit: string) => {
    setSelectedAssets(prev =>
      prev.map((item, i) => i === index ? { ...item, unit } : item)
    );
  };

  // 新規申請の送信処理
  const handleSubmitNewApplication = () => {
    // バリデーション
    if (!newAppBuilding || !newAppDepartment || !newAppSection || !newAppRoomName) {
      alert('すべての設置情報を入力してください');
      return;
    }

    if (selectedAssets.length === 0) {
      alert('資産を選択してください');
      return;
    }

    // 申請データを作成（各資産ごとに1レコード）
    const applications = selectedAssets.map(({ asset, quantity, unit }) => ({
      id: `APP-NEW-${Date.now()}-${asset.no}`,
      applicationType: '新規申請',
      assetQrCode: asset.qrCode,
      assetName: asset.name,
      assetMaker: asset.maker,
      assetModel: asset.model,
      quantity,
      unit,
      facility: facility,
      newBuilding: newAppBuilding,
      newFloor: newAppFloor,
      newDepartment: newAppDepartment,
      newSection: newAppSection,
      newRoomName: newAppRoomName,
      currentConnectionStatus,
      currentConnectionDestination,
      requestConnectionStatus,
      requestConnectionDestination,
      applicationReason,
      executionYear,
      applicationDate: new Date().toISOString(),
      status: '申請中'
    }));

    // ここで実際にはAPIに送信するか、Zustandストアに保存する
    console.log('新規申請データ:', applications);

    alert(`新規申請を送信しました\n申請件数: ${applications.length}件`);

    // モーダルを閉じる
    setIsNewApplicationModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title={`リモデル申請 - ${facility} ${department}`}
        resultCount={filteredAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
        hideMenu={true}
        showApplicationListLink={true}
      />

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({...filters, building: value})}
              options={['', ...buildingOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({...filters, floor: value})}
              options={['', ...floorOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={['', ...departmentOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={['', ...sectionOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={['', ...categoryOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={['', ...largeClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={['', ...mediumClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* アクションバー */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>
          {selectedItems.size}件選択中
        </span>
        <button
          style={{
            padding: '8px 16px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('新規申請')}
        >
          新規申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('増設申請')}
        >
          増設申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('更新申請')}
        >
          更新申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('移動申請')}
        >
          移動申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('廃棄申請')}
        >
          廃棄申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleApplicationAction('保留')}
        >
          保留
        </button>
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {currentView === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    width: `${columnWidths.checkbox}px`,
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'checkbox')}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      background: resizingColumn === 'checkbox' ? '#3498db' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                    }}
                  />
                </th>
                {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      width: `${columnWidths[col.key]}px`,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {col.label}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        background: resizingColumn === col.key ? '#3498db' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                  style={{
                    borderBottom: '1px solid #dee2e6',
                    cursor: 'pointer',
                    background: selectedItems.has(asset.no) ? '#e3f2fd' : 'white'
                  }}
                  onClick={() => handleRowClick(asset)}
                  onMouseEnter={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                    />
                  </td>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                    <td key={col.key} style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getCellValue(asset, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredAssets.map((asset) => (
              <div
                key={asset.no}
                style={{
                  background: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => handleRowClick(asset)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(asset.no)}
                    onChange={() => handleSelectItem(asset.no)}
                  />
                  <strong style={{ color: '#2c3e50' }}>No. {asset.no}</strong>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2c3e50' }}>{asset.name}</h3>
                <div style={{ fontSize: '13px', color: '#5a6c7d', lineHeight: '1.6' }}>
                  <div>施設: {asset.facility}</div>
                  <div>場所: {asset.building} {asset.floor}</div>
                  <div>部門: {asset.department}</div>
                  <div>メーカー: {asset.maker}</div>
                  <div>型式: {asset.model}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* カラム設定モーダル */}
      {isColumnSettingsOpen && (
        <div
          onClick={() => setIsColumnSettingsOpen(false)}
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
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#9b59b6',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>表示カラム設定（42カラム）</span>
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSelectAllColumns}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て選択
                </button>
                <button
                  onClick={handleDeselectAllColumns}
                  style={{
                    padding: '8px 16px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て解除
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: visibleColumns[col.key] ? '#e8f5e9' : '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumnVisibility(col.key)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#2c3e50' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* モーダルフッター */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 申請モーダル */}
      {isApplicationModalOpen && (
        <div
          onClick={() => setIsApplicationModalOpen(false)}
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
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#3498db',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}
            >
              <span>{currentApplicationType}</span>
              <button
                onClick={() => setIsApplicationModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '32px', flex: 1 }}>
              {/* 選択された資産リスト */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                  選択された資産 ({selectedItems.size}件)
                </h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>個体管理名称</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>メーカー名</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>型式</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.filter(asset => selectedItems.has(asset.no)).map((asset) => (
                        <tr key={asset.no} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '10px', color: '#2c3e50' }}>{asset.name}</td>
                          <td style={{ padding: '10px', color: '#2c3e50' }}>{asset.maker}</td>
                          <td style={{ padding: '10px', color: '#2c3e50' }}>{asset.model}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {currentApplicationType !== '廃棄申請' && (
                  <p style={{ fontSize: '13px', color: '#777', marginTop: '12px' }}>
                    ※ 一括申請の場合、すべての資産に同じ設置情報が適用されます。
                  </p>
                )}
              </div>

              {/* 新しい設置情報（廃棄申請以外） */}
              {currentApplicationType !== '廃棄申請' && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                    新しい設置情報
                  </h3>

                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ position: 'relative', zIndex: 5 }}>
                      <SearchableSelect
                        label="棟"
                        value={applicationBuilding}
                        onChange={setApplicationBuilding}
                        options={buildingOptions}
                        placeholder="選択してください"
                        isMobile={isMobile}
                      />
                    </div>

                    <div style={{ position: 'relative', zIndex: 4 }}>
                      <SearchableSelect
                        label="階"
                        value={applicationFloor}
                        onChange={setApplicationFloor}
                        options={floorOptions}
                        placeholder="選択してください"
                        isMobile={isMobile}
                      />
                    </div>

                    <div style={{ position: 'relative', zIndex: 3 }}>
                      <SearchableSelect
                        label="部門"
                        value={applicationDepartment}
                        onChange={setApplicationDepartment}
                        options={departmentOptions}
                        placeholder="選択してください"
                        isMobile={isMobile}
                      />
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <SearchableSelect
                        label="部署"
                        value={applicationSection}
                        onChange={setApplicationSection}
                        options={sectionOptions}
                        placeholder="選択してください"
                        isMobile={isMobile}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}>
                        諸室名
                      </label>
                      <input
                        type="text"
                        value={applicationRoomName}
                        onChange={(e) => setApplicationRoomName(e.target.value)}
                        placeholder="諸室名を入力してください"
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
              )}
            </div>

            {/* モーダルフッター */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setIsApplicationModalOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmitApplication}
                style={{
                  padding: '10px 24px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                申請する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規申請モーダル */}
      {isNewApplicationModalOpen && (
        <div
          onClick={() => setIsNewApplicationModalOpen(false)}
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
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#3498db',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}
            >
              <span>新規申請</span>
              <button
                onClick={() => setIsNewApplicationModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
              {/* 設置情報 */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                  設置情報
                </h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ position: 'relative', zIndex: 5 }}>
                    <SearchableSelect
                      label="棟"
                      value={newAppBuilding}
                      onChange={setNewAppBuilding}
                      options={buildingOptions}
                      placeholder="選択してください"
                      isMobile={isMobile}
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 4 }}>
                    <SearchableSelect
                      label="階"
                      value={newAppFloor}
                      onChange={setNewAppFloor}
                      options={floorOptions}
                      placeholder="選択してください"
                      isMobile={isMobile}
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 3 }}>
                    <SearchableSelect
                      label="部門"
                      value={newAppDepartment}
                      onChange={setNewAppDepartment}
                      options={departmentOptions}
                      placeholder="選択してください"
                      isMobile={isMobile}
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <SearchableSelect
                      label="部署"
                      value={newAppSection}
                      onChange={setNewAppSection}
                      options={sectionOptions}
                      placeholder="選択してください"
                      isMobile={isMobile}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      諸室名
                    </label>
                    <input
                      type="text"
                      value={newAppRoomName}
                      onChange={(e) => setNewAppRoomName(e.target.value)}
                      placeholder="諸室名を入力してください"
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

              {/* 資産選択 */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '8px', flex: 1 }}>
                    資産選択
                  </h3>
                </div>
                <button
                  onClick={handleOpenAssetMaster}
                  style={{
                    padding: '12px 24px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#229954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                  }}
                >
                  📋 資産マスタを別ウィンドウで開く
                </button>

                {/* 選択された資産リスト */}
                {selectedAssets.length > 0 && (
                  <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>個体管理名称</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>メーカー名</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>型式</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>数量</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>単位</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>削除</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAssets.map((item, index) => (
                          <tr key={index} style={{ borderBottom: index < selectedAssets.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <td style={{ padding: '12px', color: '#2c3e50' }}>{item.asset.name}</td>
                            <td style={{ padding: '12px', color: '#2c3e50' }}>{item.asset.maker}</td>
                            <td style={{ padding: '12px', color: '#2c3e50' }}>{item.asset.model}</td>
                            <td style={{ padding: '8px' }}>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                min="1"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #d0d0d0',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <select
                                value={item.unit}
                                onChange={(e) => handleUnitChange(index, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #d0d0d0',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="台">台</option>
                                <option value="個">個</option>
                                <option value="式">式</option>
                                <option value="セット">セット</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleRemoveSelectedAsset(index)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#c0392b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#e74c3c';
                                }}
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedAssets.length === 0 && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#7f8c8d',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px dashed #d0d0d0'
                  }}>
                    資産が選択されていません
                  </div>
                )}
              </div>

              {/* システム関連情報（任意） */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                  システム関連情報（任意）
                </h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      現在の接続状況
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={currentConnectionStatus === 'connected'}
                          onChange={() => setCurrentConnectionStatus('connected')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#2c3e50' }}>接続あり</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={currentConnectionStatus === 'disconnected'}
                          onChange={() => setCurrentConnectionStatus('disconnected')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#2c3e50' }}>接続なし</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      現在の接続先
                    </label>
                    <input
                      type="text"
                      value={currentConnectionDestination}
                      onChange={(e) => setCurrentConnectionDestination(e.target.value)}
                      placeholder="接続先を入力してください"
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
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      要望機器の接続要望
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={requestConnectionStatus === 'required'}
                          onChange={() => setRequestConnectionStatus('required')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#2c3e50' }}>接続要望</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={requestConnectionStatus === 'not-required'}
                          onChange={() => setRequestConnectionStatus('not-required')}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#2c3e50' }}>接続不要</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      要望機器の接続先
                    </label>
                    <input
                      type="text"
                      value={requestConnectionDestination}
                      onChange={(e) => setRequestConnectionDestination(e.target.value)}
                      placeholder="接続先を入力してください"
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

              {/* その他情報（任意） */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                  その他情報（任意）
                </h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      申請理由・コメント等
                    </label>
                    <textarea
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      placeholder="申請理由やコメントを入力してください"
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
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      執行年度
                    </label>
                    <input
                      type="text"
                      value={executionYear}
                      onChange={(e) => setExecutionYear(e.target.value)}
                      placeholder="例: 2024年度"
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
            </div>

            {/* モーダルフッター */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8f9fa'
              }}
            >
              <button
                onClick={() => setIsNewApplicationModalOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#95a5a6';
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmitNewApplication}
                style={{
                  padding: '10px 24px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2980b9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3498db';
                }}
              >
                申請する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
