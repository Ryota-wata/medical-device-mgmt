'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset, Application, ApplicationType } from '@/lib/types';
import { useMasterStore, useApplicationStore, useHospitalFacilityStore, useIndividualStore, useEditListStore, useRfqGroupStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { useColumnFeatures } from '@/lib/hooks/useColumnFeatures';
import { Header } from '@/components/layouts/Header';
import { REMODEL_COLUMNS, type ColumnDef } from '@/lib/constants/assetColumns';
import { RfqGroupModal } from '@/components/remodel/RfqGroupModal';
import { generateMockAssets, BUILDING_LIST } from '@/lib/data/generateMockAssets';

const ALL_COLUMNS = REMODEL_COLUMNS;

function RemodelApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addApplication, applications } = useApplicationStore();
  const { getNewLocationByCurrentLocation, facilities: hospitalFacilities, swapToNewLocation } = useHospitalFacilityStore();
  const { individuals, updateIndividual } = useIndividualStore();
  const { getEditListById } = useEditListStore();
  const { addRfqGroup, generateRfqNo } = useRfqGroupStore();
  const { isMobile } = useResponsive();

  // URLパラメータから編集リストIDを取得
  const listId = searchParams.get('listId') || '';
  const editList = listId ? getEditListById(listId) : null;

  // 編集リストがない場合は従来の施設・部署パラメータを使用
  const facility = editList ? editList.facilities.join(', ') : (searchParams.get('facility') || '');
  const department = searchParams.get('department') || '';

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 編集リストモードかどうか（listIdが指定されていて編集リストが存在する場合）
  const isEditListMode = Boolean(listId && editList);

  // 申請モーダル関連の状態
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [currentApplicationType, setCurrentApplicationType] = useState<ApplicationType | ''>('');
  const [applicationBuilding, setApplicationBuilding] = useState('');
  const [applicationFloor, setApplicationFloor] = useState('');
  const [applicationDepartment, setApplicationDepartment] = useState('');
  const [applicationSection, setApplicationSection] = useState('');
  const [applicationRoomName, setApplicationRoomName] = useState('');

  // 見積依頼グループ作成モーダル関連の状態
  const [isRfqGroupModalOpen, setIsRfqGroupModalOpen] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  // セル編集関連の状態
  const [editingCell, setEditingCell] = useState<{ rowNo: number; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ rowNo: number; colKey: string } | null>(null);

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

  // クローズ確認モーダル
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  // クローズ処理
  const handleCloseProject = () => {
    const facilityMasters = hospitalFacilities.filter(f => f.hospitalName === facility);

    // 個別施設マスタの新居→現状への切り替え
    facilityMasters.forEach(f => {
      if (f.status !== 'completed' && f.newFloor) {
        swapToNewLocation(f.id);
      }
    });

    // 個体管理の設置場所更新
    individuals.forEach(ind => {
      const matchingFacility = facilityMasters.find(f =>
        f.currentFloor === ind.location.floor &&
        f.currentDepartment === ind.location.department
      );
      if (matchingFacility && matchingFacility.newFloor) {
        updateIndividual(ind.id, {
          location: {
            ...ind.location,
            floor: matchingFacility.newFloor,
            department: matchingFacility.newDepartment,
            section: matchingFacility.newSection,
          },
        });
      }
    });

    alert('リモデル管理をクローズしました。\n\n・個別施設マスタの新居が現状に反映されました\n・資産の設置場所が更新されました');
    setShowCloseConfirmModal(false);
  };

  // 対象施設リスト
  const targetFacilities = editList ? editList.facilities : (facility ? [facility] : []);

  // モックデータ（施設ごとにデータを生成）
  const [mockAssets, setMockAssets] = useState<Asset[]>(() => generateMockAssets(targetFacilities));

  // 表示用データソース：編集リストモード時はbaseAssets + items、従来モードはmockAssets
  const displayAssets: Asset[] = useMemo(() => {
    if (isEditListMode && editList) {
      // 原本資産にsourceType: 'base'を付与
      const baseWithSource: Asset[] = (editList.baseAssets || []).map(asset => ({
        ...asset,
        sourceType: 'base' as const,
      }));

      // 追加された要望機器をAsset型に変換
      const itemsAsAssets: Asset[] = (editList.items || []).map((item, index) => ({
        qrCode: item.qrCode || '',
        no: 90000 + index, // 追加レコード用の仮番号
        facility: item.facility,
        building: item.building,
        floor: item.floor,
        department: item.department,
        section: item.section,
        category: item.category || '',
        largeClass: item.largeClass || '',
        mediumClass: item.mediumClass || '',
        item: item.item || '',
        name: item.name,
        maker: item.maker,
        model: item.model,
        quantity: item.quantity,
        width: '',
        depth: '',
        height: '',
        roomName: item.roomName,
        // 申請関連フィールド
        applicationCategory: item.applicationType,
        applicationNo: item.applicationNo,
        applicationReason: item.applicationReason,
        desiredDeliveryDate: item.desiredDeliveryDate,
        applicantName: item.applicantName,
        applicantDepartment: item.applicantDepartment,
        applicationDate: item.applicationDate,
        priority: item.priority,
        usagePurpose: item.usagePurpose,
        caseCount: item.caseCount,
        comment: item.comment,
        attachedFiles: item.attachedFiles,
        currentConnectionStatus: item.currentConnectionStatus,
        currentConnectionDestination: item.currentConnectionDestination,
        requestConnectionStatus: item.requestConnectionStatus,
        requestConnectionDestination: item.requestConnectionDestination,
        sourceType: 'added' as const,
      }));

      return [...baseWithSource, ...itemsAsAssets];
    }
    return mockAssets;
  }, [isEditListMode, editList, mockAssets]);

  // 個別施設マスタの統計
  const facilityMasterStats = useMemo(() => {
    const facilityMasters = hospitalFacilities.filter(f => f.hospitalName === facility);
    return {
      total: facilityMasters.length,
      completed: facilityMasters.filter(f => f.status === 'completed').length,
    };
  }, [facility, hospitalFacilities]);

  // 資産ベースの進捗統計（原本リストの資産を基準に）
  const assetProgress = useMemo(() => {
    const totalAssets = displayAssets.length;

    // 申請中の資産数（applicationsに該当資産がある場合）
    const inProgressAssets = displayAssets.filter(asset => {
      return applications.some(app =>
        app.asset.name === asset.name &&
        app.asset.model === asset.model
      );
    }).length;

    // 未申請の資産数
    const notAppliedAssets = totalAssets - inProgressAssets;

    // 執行済み資産数（申請が執行されて削除された資産）
    // ※ 執行完了時に申請が削除されるので、実際の執行済み数は別途管理が必要
    const executedAssets = 0;

    return {
      total: totalAssets,
      notApplied: notAppliedAssets,
      inProgress: inProgressAssets,
      executed: executedAssets,
    };
  }, [displayAssets, applications]);

  // 進捗率（申請中 + 執行済み / 全体）
  const progressRate = useMemo(() => {
    if (assetProgress.total === 0) return 0;
    return Math.round(((assetProgress.inProgress + assetProgress.executed) / assetProgress.total) * 100);
  }, [assetProgress]);

  // クローズ可能条件（すべての資産が申請済み、かつ申請中がゼロ）
  const canClose = useMemo(() => {
    return assetProgress.notApplied === 0 && assetProgress.inProgress === 0;
  }, [assetProgress]);

  // useAssetFilterフックを使用
  const {
    filters,
    setFilters,
    filteredAssets,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
  } = useAssetFilter(displayAssets);

  // カラム機能（ソート、フィルター、並び替え）
  const {
    sortConfig,
    handleSort,
    columnFilters,
    openFilterColumn,
    setOpenFilterColumn,
    getColumnUniqueValues,
    toggleColumnFilter,
    clearColumnFilter,
    draggedColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    orderedColumns,
    finalFilteredAssets,
  } = useColumnFeatures({
    columns: ALL_COLUMNS,
    assets: mockAssets,
    baseFilteredAssets: filteredAssets,
  });

  // useAssetTableフックを使用
  const {
    visibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  } = useAssetTable(ALL_COLUMNS);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(finalFilteredAssets.map(a => a.no)));
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
    router.push(`/asset-detail?qrCode=${asset.qrCode}&readonly=true&from=remodel`);
  };

  // 資産の申請ステータスを取得
  const getAssetApplications = (asset: Asset) => {
    // この資産に関連する申請を取得（名前とモデルで照合）
    return applications.filter(app =>
      app.asset.name === asset.name &&
      app.asset.model === asset.model
    );
  };

  // 申請ステータスバッジを描画
  const renderApplicationStatus = (asset: Asset) => {
    const assetApplications = getAssetApplications(asset);

    if (assetApplications.length === 0) {
      return <span style={{ color: '#95a5a6', fontSize: '12px' }}>-</span>;
    }

    // 申請タイプごとの色定義
    const typeColors: Record<string, string> = {
      '新規申請': '#27ae60',
      '増設申請': '#3498db',
      '更新申請': '#e67e22',
      '移動申請': '#9b59b6',
      '廃棄申請': '#e74c3c',
      '保留': '#95a5a6',
    };

    // ユニークな申請タイプを取得
    const uniqueTypes = Array.from(new Set(assetApplications.map(app => app.applicationType)));

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {uniqueTypes.map((type, index) => (
          <span
            key={index}
            style={{
              padding: '2px 8px',
              background: typeColors[type] || '#95a5a6',
              color: 'white',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            {type}
          </span>
        ))}
      </div>
    );
  };

  // セル編集開始
  const handleCellDoubleClick = (rowNo: number, colKey: string, currentValue: string) => {
    // 見積依頼No.カラムの場合はモーダルを開く
    if (colKey === 'rfqNo') {
      // 選択されていない場合は該当行を選択
      if (selectedItems.size === 0 || !selectedItems.has(rowNo)) {
        setSelectedItems(new Set([rowNo]));
      }
      setIsRfqGroupModalOpen(true);
      return;
    }

    setEditingCell({ rowNo, colKey });
    setEditingValue(currentValue);
  };

  // セル編集確定（複数選択時は一括編集）
  const handleCellSave = () => {
    if (!editingCell) return;

    // 複数選択されていて、編集中のセルが選択レコードに含まれている場合は一括編集
    if (selectedItems.size > 1 && selectedItems.has(editingCell.rowNo)) {
      setMockAssets(prev => prev.map(asset => {
        if (selectedItems.has(asset.no)) {
          return { ...asset, [editingCell.colKey]: editingValue };
        }
        return asset;
      }));
    } else {
      // 単一編集
      setMockAssets(prev => prev.map(asset => {
        if (asset.no === editingCell.rowNo) {
          return { ...asset, [editingCell.colKey]: editingValue };
        }
        return asset;
      }));
    }

    setEditingCell(null);
    setEditingValue('');
  };

  // セル編集キャンセル
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // 編集可能なカラム
  const editableColumns = ALL_COLUMNS.filter(col =>
    !['applicationStatus'].includes(col.key)
  );

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
    setCurrentApplicationType(actionType as ApplicationType);
    setApplicationBuilding('');
    setApplicationFloor('');
    setApplicationDepartment('');
    setApplicationSection('');
    setApplicationRoomName('');
    setIsApplicationModalOpen(true);
  };

  // 申請送信処理
  const handleSubmitApplication = () => {
    // 申請タイプのバリデーション
    if (!currentApplicationType) {
      alert('申請タイプを選択してください');
      return;
    }

    // 選択された資産を取得
    const selectedAssets = finalFilteredAssets.filter(asset => selectedItems.has(asset.no));

    // 廃棄申請以外はバリデーション
    if (currentApplicationType !== '廃棄申請') {
      if (!applicationBuilding || !applicationDepartment || !applicationSection || !applicationRoomName) {
        alert('すべての設置情報を入力してください');
        return;
      }
    }

    // 申請データを作成してストアに保存（各資産ごとに1レコード）
    selectedAssets.forEach(asset => {
      const applicationData: Omit<Application, 'id'> = {
        applicationNo: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: new Date().toISOString().split('T')[0],
        applicationType: currentApplicationType as ApplicationType,
        asset: {
          name: asset.name,
          model: asset.model,
        },
        vendor: asset.maker,
        quantity: '1',
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: currentApplicationType !== '廃棄申請' ? applicationBuilding : asset.building,
          floor: currentApplicationType !== '廃棄申請' ? applicationFloor : asset.floor,
          department: currentApplicationType !== '廃棄申請' ? applicationDepartment : asset.department,
          section: currentApplicationType !== '廃棄申請' ? applicationSection : asset.section,
        },
        roomName: currentApplicationType !== '廃棄申請' ? applicationRoomName : undefined,
        freeInput: currentApplicationType !== '廃棄申請' ? applicationRoomName : '廃棄',
        executionYear: new Date().getFullYear().toString(),
        currentConnectionStatus: currentApplicationType === '移動申請' ? currentConnectionStatus : undefined,
        currentConnectionDestination: currentApplicationType === '移動申請' ? currentConnectionDestination : undefined,
      };

      // ストアに申請データを追加
      addApplication(applicationData);
    });

    alert(`${currentApplicationType}を送信しました\n申請件数: ${selectedAssets.length}件`);

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
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master`,
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
        const assetMasters = event.data.assets as any[];

        // AssetMaster型をAsset型に変換して selectedAssets に追加
        const newSelectedAssets = assetMasters.map(assetMaster => ({
          asset: {
            ...assetMaster,
            name: assetMaster.item, // AssetMasterの item を Asset の name にマッピング
            no: 0, // ダミー値
            qrCode: '',
            facility: '',
            building: '',
            floor: '',
            department: '',
            section: '',
            category: assetMaster.category || '',
            largeClass: assetMaster.largeClass || '',
            mediumClass: assetMaster.mediumClass || '',
            item: assetMaster.item || '',
            maker: assetMaster.maker || '',
            model: assetMaster.model || '',
            quantity: 1,
            width: 0,
            depth: 0,
            height: 0
          } as Asset,
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
    selectedAssets.forEach(({ asset, quantity, unit }) => {
      const applicationData: Omit<Application, 'id'> = {
        applicationNo: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: new Date().toISOString().split('T')[0],
        applicationType: '新規申請',
        asset: {
          name: asset.name,
          model: asset.model,
        },
        vendor: asset.maker,
        quantity: `${quantity}`,
        unit: unit,
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: newAppBuilding,
          floor: newAppFloor,
          department: newAppDepartment,
          section: newAppSection,
        },
        roomName: newAppRoomName,
        freeInput: applicationReason,
        executionYear: executionYear || new Date().getFullYear().toString(),
        requestConnectionStatus: requestConnectionStatus,
        requestConnectionDestination: requestConnectionDestination,
        applicationReason: applicationReason,
      };

      // ストアに申請データを追加
      addApplication(applicationData);
    });

    alert(`新規申請を送信しました\n申請件数: ${selectedAssets.length}件`);

    // モーダルを閉じる
    setIsNewApplicationModalOpen(false);

    // 選択された資産をクリア
    setSelectedAssets([]);
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'white' }}>
      <Header
        title={editList ? `編集リスト: ${editList.name}` : `リモデル管理 - ${facility} ${department}`}
        resultCount={finalFilteredAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        facility={facility}
        department={department}
        targetFacilities={editList?.facilities}
        createdAt={editList?.createdAt}
      />

      {/* アクションボタンバー */}
      <div style={{
        background: '#fff',
        padding: '12px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => alert('API連携機能（開発中）')}
          style={{
            padding: '8px 16px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#229954'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#27ae60'; }}
        >
          API連携
        </button>
        <button
          onClick={() => alert('要望区分機能（開発中）')}
          style={{
            padding: '8px 16px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#229954'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#27ae60'; }}
        >
          要望区分
        </button>
        <button
          onClick={() => {
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            window.open(`${basePath}/ship-asset-master`, '_blank', 'width=1200,height=800');
          }}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#e74c3c'; }}
        >
          マスタを開く
        </button>
        <button
          onClick={() => {
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            window.open(`${basePath}/quotation-data-box`, '_blank', 'width=1200,height=800');
          }}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#e74c3c'; }}
        >
          見積DBを開く
        </button>
        <button
          onClick={() => alert('原本を開く機能（開発中）')}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#e74c3c'; }}
        >
          原本を開く
        </button>

        {/* 見積依頼グループ作成ボタン */}
        <button
          onClick={() => {
            if (selectedItems.size === 0) {
              alert('見積依頼グループに含める資産を選択してください');
              return;
            }
            setIsRfqGroupModalOpen(true);
          }}
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#bdc3c7' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 0.2s',
          }}
        >
          見積依頼グループ作成（{selectedItems.size}件選択中）
        </button>
        </div>

        {/* 合計表示 */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{
            padding: '8px 16px',
            background: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
          }}>
            <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>表示数量合計:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{finalFilteredAssets.length}件</span>
          </div>
          <div style={{
            padding: '8px 16px',
            background: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
          }}>
            <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>表示金額合計:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
              ¥{finalFilteredAssets.reduce((sum, asset) => {
                const amount = asset.rfqAmount;
                if (typeof amount === 'number') return sum + amount;
                if (typeof amount === 'string' && amount) {
                  const num = parseInt(amount.replace(/[^0-9]/g, ''), 10);
                  return sum + (isNaN(num) ? 0 : num);
                }
                return sum;
              }, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="資産管理部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={['', ...sectionOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }}>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {/* 資産テーブル（編集リストモード・従来モード共通） */}
        {currentView === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 102, background: '#f8f9fa' }}>
              <tr>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    width: `${columnWidths.checkbox}px`,
                    minWidth: `${columnWidths.checkbox}px`,
                    position: 'sticky',
                    left: 0,
                    zIndex: 101,
                    background: '#f8f9fa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    borderRight: '1px solid #dee2e6',
                    borderBottom: '2px solid #dee2e6',
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'checkbox')}
                      style={{
                        position: 'absolute',
                        right: -8,
                        top: -12,
                        bottom: -12,
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
                  </div>
                </th>
                {orderedColumns.filter((col) => visibleColumns[col.key]).map((col) => {
                  const isSorted = sortConfig?.key === col.key;
                  const hasFilter = columnFilters[col.key]?.length > 0;
                  const uniqueValues = getColumnUniqueValues(col.key);

                  return (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={() => handleDragStart(col.key)}
                      onDragOver={(e) => handleDragOver(e, col.key)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                        width: `${columnWidths[col.key]}px`,
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        background: draggedColumn === col.key ? '#e3f2fd' : '#f8f9fa',
                        zIndex: openFilterColumn === col.key ? 100 : 1,
                        borderRight: '1px solid #dee2e6',
                        borderBottom: '2px solid #dee2e6',
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* カラム名とソートボタン */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            onClick={() => handleSort(col.key)}
                            style={{ cursor: 'pointer', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={col.label}
                          >
                            {col.label}
                          </span>
                          <span
                            onClick={() => handleSort(col.key)}
                            style={{ cursor: 'pointer', fontSize: '10px', color: isSorted ? '#3498db' : '#aaa' }}
                          >
                            {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterColumn(openFilterColumn === col.key ? null : col.key);
                            }}
                            style={{
                              cursor: 'pointer',
                              fontSize: '10px',
                              color: hasFilter ? '#e74c3c' : '#aaa',
                              padding: '2px',
                            }}
                          >
                            ▼
                          </span>
                        </div>

                        {/* フィルタードロップダウン */}
                        {openFilterColumn === col.key && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              background: 'white',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 1000,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              minWidth: '150px',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px',
                                borderBottom: '1px solid #dee2e6',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>絞り込み</span>
                              <button
                                onClick={() => clearColumnFilter(col.key)}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                }}
                              >
                                クリア
                              </button>
                            </div>
                            {uniqueValues.map((value) => (
                              <label
                                key={value}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  borderBottom: '1px solid #f0f0f0',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters[col.key]?.includes(value) || false}
                                  onChange={() => toggleColumnFilter(col.key, value)}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {value || '(空)'}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart(e, col.key);
                        }}
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
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {finalFilteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                >
                  <td style={{
                    padding: '12px 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    position: 'sticky',
                    left: 0,
                    zIndex: 100,
                    background: selectedItems.has(asset.no) ? '#e3f2fd' : 'white',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    borderRight: '1px solid #dee2e6',
                    borderBottom: '1px solid #dee2e6',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                    />
                  </td>
                  {orderedColumns.filter((col) => visibleColumns[col.key]).map((col) => {
                    const isEditing = editingCell?.rowNo === asset.no && editingCell?.colKey === col.key;
                    const isHovered = hoveredCell?.rowNo === asset.no && hoveredCell?.colKey === col.key;
                    const cellValue = getCellValue(asset, col.key);
                    const isEditable = col.key !== 'applicationStatus';
                    const isRowSelected = selectedItems.has(asset.no);

                    // セル背景色の決定
                    const getCellBackground = () => {
                      if (isEditing) return '#fff3cd';
                      if (isHovered && isEditable) {
                        // 選択状態では濃い青、非選択では薄い青
                        return isRowSelected ? '#bbdefb' : '#e8f4fd';
                      }
                      // デフォルトは行の背景色に合わせる
                      return isRowSelected ? '#e3f2fd' : 'white';
                    };

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: isEditing ? '4px' : '12px 8px',
                          color: '#2c3e50',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: getCellBackground(),
                          cursor: isEditable ? 'pointer' : 'default',
                          transition: 'background 0.15s',
                          position: 'relative',
                          zIndex: 0,
                          borderRight: '1px solid #dee2e6',
                          borderBottom: '1px solid #dee2e6',
                        }}
                        onMouseEnter={() => isEditable && setHoveredCell({ rowNo: asset.no, colKey: col.key })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onDoubleClick={() => isEditable && handleCellDoubleClick(asset.no, col.key, cellValue)}
                      >
                        {col.key === 'applicationStatus' ? (
                          renderApplicationStatus(asset)
                        ) : isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave();
                              if (e.key === 'Escape') handleCellCancel();
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '2px solid #3498db',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          cellValue
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {finalFilteredAssets.map((asset) => (
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
                onDoubleClick={() => router.push(`/asset-karte/${asset.no}`)}
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
      </div>

      {/* カラム設定モーダル */}
      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        onClose={() => setIsColumnSettingsOpen(false)}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onVisibilityChange={toggleColumnVisibility}
        onSelectAll={handleSelectAllColumns}
        onDeselectAll={handleDeselectAllColumns}
      />

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
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>品目</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>メーカー</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>型式</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalFilteredAssets.filter(asset => selectedItems.has(asset.no)).map((asset) => (
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                      新しい設置情報
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        // 選択された資産の現在の設置場所から新居情報を自動取得
                        const selectedAssetsList = finalFilteredAssets.filter(a => selectedItems.has(a.no));
                        if (selectedAssetsList.length === 0) {
                          alert('資産を選択してください');
                          return;
                        }
                        const firstAsset = selectedAssetsList[0];
                        const newLocation = getNewLocationByCurrentLocation({
                          hospitalId: facility,
                          building: firstAsset.building,
                          floor: firstAsset.floor,
                          department: firstAsset.department,
                          section: firstAsset.roomName || firstAsset.section,
                        });
                        if (newLocation && newLocation.floor) {
                          setApplicationFloor(newLocation.floor);
                          setApplicationDepartment(newLocation.department);
                          setApplicationRoomName(newLocation.section);
                          alert('個別施設マスタから新居情報を取得しました');
                        } else {
                          alert('個別施設マスタに該当するマッピング情報がありません。\n個別施設マスタで現状→新居のマッピングを登録してください。');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>🏢</span>
                      <span>個別施設マスタから自動入力</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
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

                    <div style={{ gridColumn: '1 / -1' }}>
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

                  {/* 移動申請の場合のみ接続状況を表示 */}
                  {currentApplicationType === '移動申請' && (
                    <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
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
                    </div>
                  )}
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
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
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
                  <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
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
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>品目</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>メーカー</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={executionYear}
                        onChange={(e) => setExecutionYear(e.target.value)}
                        placeholder="例: 2024"
                        style={{
                          width: '150px',
                          padding: '10px 12px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#2c3e50' }}>年度</span>
                    </div>
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

      {/* クローズ確認モーダル */}
      {showCloseConfirmModal && (
        <div
          onClick={() => setShowCloseConfirmModal(false)}
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
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#2c3e50',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>リモデルクローズ確認</span>
              <button
                onClick={() => setShowCloseConfirmModal(false)}
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
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <p style={{ margin: 0, color: '#856404', fontWeight: 'bold', marginBottom: '8px' }}>
                  以下の処理が実行されます:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404', fontSize: '14px' }}>
                  <li>個別施設マスタの「新居」情報が「現状」に反映されます</li>
                  <li>資産の設置場所が新しい場所に更新されます</li>
                  <li>この操作は取り消すことができません</li>
                </ul>
              </div>

              <div style={{
                background: '#e8f5e9',
                border: '1px solid #a5d6a7',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px' }}>
                  対象施設: <strong>{facility}</strong>
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#2e7d32', fontSize: '14px' }}>
                  個別施設マスタ: <strong>{facilityMasterStats.total}件</strong>
                </p>
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
                onClick={() => setShowCloseConfirmModal(false)}
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
                onClick={handleCloseProject}
                style={{
                  padding: '10px 24px',
                  background: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                クローズ実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 見積依頼グループ作成モーダル */}
      <RfqGroupModal
        isOpen={isRfqGroupModalOpen}
        onClose={() => setIsRfqGroupModalOpen(false)}
        rfqGroupName={rfqGroupName}
        setRfqGroupName={setRfqGroupName}
        selectedCount={selectedItems.size}
        generatedRfqNo={generateRfqNo()}
        onSubmit={() => {
          const rfqNo = generateRfqNo();
          const today = new Date();
          const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          addRfqGroup({
            rfqNo,
            groupName: rfqGroupName.trim(),
            createdDate,
            applicationIds: Array.from(selectedItems).map(String),
            status: '見積依頼',
          });

          // 編集リストモードの場合はeditList.baseAssetsを更新する必要があるが、
          // Zustand storeを通じて更新するため、ここではmockAssetsを更新
          setMockAssets(prev => prev.map(asset => {
            if (selectedItems.has(asset.no)) {
              return {
                ...asset,
                rfqNo: rfqNo,
                rfqGroupName: rfqGroupName.trim(),
              };
            }
            return asset;
          }));

          alert(`見積依頼グループ「${rfqGroupName.trim()}」を作成しました\n\n見積依頼No.: ${rfqNo}\n選択レコード: ${selectedItems.size}件`);
          setIsRfqGroupModalOpen(false);
          setRfqGroupName('');
          setSelectedItems(new Set());
        }}
      />
    </div>
  );
}

export default function RemodelApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemodelApplicationContent />
    </Suspense>
  );
}
