'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset } from '@/lib/types';
import { PurchaseApplication } from '@/lib/types/purchaseApplication';
import { useMasterStore, useApplicationStore, useHospitalFacilityStore, useIndividualStore, useEditListStore, useRfqGroupStore, useQuotationStore, useAuthStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { useColumnFeatures } from '@/lib/hooks/useColumnFeatures';
import { Header } from '@/components/layouts/Header';
import { REMODEL_COLUMNS, REMODEL_COLUMN_GROUPS, type ColumnDef } from '@/lib/constants/assetColumns';
import { RfqGroupModal } from '@/components/remodel/RfqGroupModal';
import { DataLinkModal } from '@/components/remodel/DataLinkModal';
import { generateMockAssets, BUILDING_LIST } from '@/lib/data/generateMockAssets';

const ALL_COLUMNS = REMODEL_COLUMNS;

function RemodelApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applications } = useApplicationStore();
  const { getNewLocationByCurrentLocation, facilities: hospitalFacilities, swapToNewLocation } = useHospitalFacilityStore();
  const { individuals, updateIndividual } = useIndividualStore();
  const { getEditListById, addItemsFromApplications, updateRfqInfo, updateBaseAsset, addBaseAssets } = useEditListStore();
  const { addRfqGroup, generateRfqNo, generateDisposalNo, generateTransferNo, rfqGroups } = useRfqGroupStore();
  const { assets: assetMasters, vendors } = useMasterStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { applications: purchaseApplications } = usePurchaseApplicationStore();
  const { isMobile } = useResponsive();

  // URLパラメータから編集リストIDを取得
  const listId = searchParams.get('listId') || '';
  const editList = listId ? getEditListById(listId) : null;

  // 編集リストがない場合はauthStoreの選択施設を使用
  const { selectedFacility: authFacility } = useAuthStore();
  const facility = editList ? editList.facilities.join(', ') : (authFacility || '');
  const department = searchParams.get('department') || '';

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 編集リストモードかどうか（listIdが指定されていて編集リストが存在する場合）
  const isEditListMode = Boolean(listId && editList);

  // インライン申請実行関連の状態
  const [showApplicationConfirm, setShowApplicationConfirm] = useState(false);
  const [applicationBreakdown, setApplicationBreakdown] = useState<Record<string, number>>({});
  const [applicationErrors, setApplicationErrors] = useState<{ rowNo: number; field: string; message: string }[]>([]);
  const [appliedRows, setAppliedRows] = useState<Set<number>>(new Set());
  const [errorRows, setErrorRows] = useState<Set<number>>(new Set());
  const [applicationFeedback, setApplicationFeedback] = useState<string | null>(null);

  // 見積依頼グループ作成モーダル関連の状態
  const [isRfqGroupModalOpen, setIsRfqGroupModalOpen] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  // Data Linkモーダル関連の状態
  const [isDataLinkModalOpen, setIsDataLinkModalOpen] = useState(false);

  // 購入区分の確認ダイアログ
  const [showUpdateConfirm, setShowUpdateConfirm] = useState<{ rowNo: number } | null>(null);
  const [showAdditionInput, setShowAdditionInput] = useState<{ rowNo: number; quantity: number } | null>(null);

  // セル編集関連の状態
  const [editingCell, setEditingCell] = useState<{ rowNo: number; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ rowNo: number; colKey: string } | null>(null);

  // 資産マスタ選択（インライン新規用）
  interface SelectedAsset {
    asset: Asset;
    quantity: number;
    unit: string;
  }
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);

  // クローズ確認モーダル
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  // インライン新規申請モード
  const [isInlineNewMode, setIsInlineNewMode] = useState(false);
  const [inlineNewData, setInlineNewData] = useState<Record<string, string>>({});
  const [inlineEditingCol, setInlineEditingCol] = useState<string | null>(null);
  const [inlineEditingValue, setInlineEditingValue] = useState('');
  const inlineNewRowRef = useRef<HTMLTableRowElement>(null);

  // クローズ処理
  const handleCloseProject = () => {
    const facilityMasters = hospitalFacilities.filter(f => f.hospitalName === facility);

    // 個別部署マスタの新居→現状への切り替え
    facilityMasters.forEach(f => {
      if (f.status !== 'completed' && f.newFloor) {
        swapToNewLocation(f.id);
      }
    });

    // 個体管理の設置場所更新
    individuals.forEach(ind => {
      const matchingFacility = facilityMasters.find(f =>
        f.oldFloor === ind.location.floor &&
        f.oldDepartment === ind.location.department
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

    alert('リモデル管理をクローズしました。\n\n・個別部署マスタの新居が現状に反映されました\n・資産の設置場所が更新されました');
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
        rfqNo: item.rfqNo || '',
        sourceType: 'added' as const,
      }));

      return [...baseWithSource, ...itemsAsAssets];
    }
    return mockAssets;
  }, [isEditListMode, editList, mockAssets]);

  // 個別部署マスタの統計
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

    // 申請中の資産数（applicationStore + purchaseApplicationStore 両方を参照）
    const inProgressAssets = displayAssets.filter(asset => {
      const hasApplication = applications.some(app =>
        app.asset.name === asset.name &&
        app.asset.model === asset.model
      );
      const hasPurchaseApplication = purchaseApplications.some(app =>
        app.assets.some(a => a.name === asset.name && a.model === asset.model)
      );
      return hasApplication || hasPurchaseApplication;
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
  }, [displayAssets, applications, purchaseApplications]);

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
    setVisibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  } = useAssetTable(ALL_COLUMNS);

  // テーブルグループヘッダーのスパン計算
  const groupHeaderSpans = useMemo(() => {
    const visibleCols = orderedColumns.filter(col => visibleColumns[col.key]);
    const spans: { groupId: string; label: string; color: string; colSpan: number }[] = [];
    let currentGroupId = '';
    for (const col of visibleCols) {
      const gid = col.group || '';
      if (gid === currentGroupId && spans.length > 0) {
        spans[spans.length - 1].colSpan++;
      } else {
        const groupDef = REMODEL_COLUMN_GROUPS.find(g => g.id === gid);
        spans.push({
          groupId: gid,
          label: groupDef?.label || gid,
          color: groupDef?.color || '#6c757d',
          colSpan: 1,
        });
        currentGroupId = gid;
      }
    }
    return spans;
  }, [orderedColumns, visibleColumns]);

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

  // セル編集開始
  const handleCellDoubleClick = (rowNo: number, colKey: string, currentValue: string) => {
    // 購入区分は常時selectなのでスキップ
    if (colKey === 'purchaseCategory') return;
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

  // 資産マスターID自動紐付け: item/maker/model から assetMasterId を検索
  const resolveAssetMasterId = (asset: Asset, patchedField: string, patchedValue: string): string | undefined => {
    const currentItem = patchedField === 'item' ? patchedValue : (asset.item || '');
    const currentMaker = patchedField === 'maker' ? patchedValue : (asset.maker || '');
    const currentModel = patchedField === 'model' ? patchedValue : (asset.model || '');

    if (!currentItem && !currentMaker && !currentModel) return undefined;

    // 完全一致（item + maker + model）
    const exact = assetMasters.find(m =>
      m.item === currentItem && m.maker === currentMaker && m.model === currentModel
    );
    if (exact) return exact.assetMasterId;

    // 部分一致（item + maker）
    const partial = assetMasters.find(m =>
      m.item === currentItem && m.maker === currentMaker
    );
    if (partial) return partial.assetMasterId;

    // 部分一致（itemのみ）
    const itemOnly = assetMasters.find(m => m.item === currentItem);
    if (itemOnly) return itemOnly.assetMasterId;

    return undefined;
  };

  // セル編集確定（複数選択時は一括編集）
  const handleCellSave = () => {
    if (!editingCell) return;

    const colKey = editingCell.colKey;
    const patch: Record<string, string> = { [colKey]: editingValue };

    // 資産マスターID自動紐付け（item/maker/model変更時）
    const autoLinkFields = ['item', 'maker', 'model'];
    const shouldAutoLink = autoLinkFields.includes(colKey);

    if (isEditListMode && listId) {
      // 編集リストモード: ストア経由で更新
      const targetNos = (selectedItems.size > 1 && selectedItems.has(editingCell.rowNo))
        ? Array.from(selectedItems)
        : [editingCell.rowNo];

      targetNos.forEach(no => {
        const targetPatch = { ...patch };
        if (shouldAutoLink) {
          const asset = displayAssets.find(a => a.no === no);
          if (asset) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            if (masterId) {
              targetPatch.assetMasterId = masterId;
            } else {
              targetPatch.assetMasterId = '';
            }
          }
        }
        updateBaseAsset(listId, no, targetPatch);
      });
    } else {
      // 通常モード: ローカルstate更新
      if (selectedItems.size > 1 && selectedItems.has(editingCell.rowNo)) {
        setMockAssets(prev => prev.map(asset => {
          if (!selectedItems.has(asset.no)) return asset;
          const targetPatch = { ...patch };
          if (shouldAutoLink) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            targetPatch.assetMasterId = masterId || '';
          }
          return { ...asset, ...targetPatch };
        }));
      } else {
        setMockAssets(prev => prev.map(asset => {
          if (asset.no !== editingCell.rowNo) return asset;
          const targetPatch = { ...patch };
          if (shouldAutoLink) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            targetPatch.assetMasterId = masterId || '';
          }
          return { ...asset, ...targetPatch };
        }));
      }
    }

    setEditingCell(null);
    setEditingValue('');
  };

  // セル編集キャンセル
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Data Link 紐づけ実行ハンドラー
  const handleDataLinkExecute = (updates: Map<number, Partial<Asset>>) => {
    if (updates.size === 0) return;
    setMockAssets(prev => prev.map(asset => {
      const patch = updates.get(asset.no);
      if (patch) {
        return { ...asset, ...patch };
      }
      return asset;
    }));
  };

  // Data Link: 新規行追加ハンドラ
  const handleDataLinkAddNewAssets = (newAssets: Asset[]) => {
    if (newAssets.length === 0) return;
    // 既存の最大Noを取得して連番を振り直す
    const maxNo = Math.max(...displayAssets.map(a => a.no), 0);
    const renumbered = newAssets.map((asset, i) => ({ ...asset, no: maxNo + 1 + i }));
    if (isEditListMode && listId) {
      addBaseAssets(listId, renumbered);
    } else {
      setMockAssets(prev => [...prev, ...renumbered]);
    }
  };

  // Data Link モーダルに渡す選択中レコード
  const dataLinkSelectedAssets = useMemo(() => {
    return finalFilteredAssets.filter(a => selectedItems.has(a.no));
  }, [finalFilteredAssets, selectedItems]);

  // 原本資産（Data Link用）
  const baseAssetsForDataLink = useMemo(() => {
    if (isEditListMode && editList) {
      return editList.baseAssets || [];
    }
    return mockAssets;
  }, [isEditListMode, editList, mockAssets]);

  // 編集可能なカラム
  const editableColumns = ALL_COLUMNS.filter(col =>
    !['purchaseCategory'].includes(col.key)
  );

  // 購入区分変更ハンドラ（常時表示selectから直接呼ばれる）
  const handlePurchaseCategoryChange = (rowNo: number, newCategory: Asset['purchaseCategory']) => {
    if (newCategory === '更新') {
      setShowUpdateConfirm({ rowNo });
      // カラム自動表示: 購入申請情報
      const purchaseCols = ALL_COLUMNS.filter(c => c.group === 'purchaseApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        purchaseCols.forEach(c => { next[c.key] = true; });
        return next;
      });
      return;
    }
    if (newCategory === '増設') {
      setShowAdditionInput({ rowNo, quantity: 1 });
      // カラム自動表示: 購入申請情報
      const purchaseCols = ALL_COLUMNS.filter(c => c.group === 'purchaseApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        purchaseCols.forEach(c => { next[c.key] = true; });
        return next;
      });
      return;
    }
    // 移設・廃棄予定・新規・クリアはそのまま設定
    if (isEditListMode && listId) {
      updateBaseAsset(listId, rowNo, { purchaseCategory: newCategory });
    } else {
      setMockAssets(prev => prev.map(asset =>
        asset.no === rowNo ? { ...asset, purchaseCategory: newCategory } : asset
      ));
    }

    // カラム自動表示
    if (newCategory === '廃棄予定') {
      const disposalCols = ALL_COLUMNS.filter(c => c.group === 'disposalApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        disposalCols.forEach(c => { next[c.key] = true; });
        return next;
      });
    } else if (newCategory === '移設') {
      const transferCols = ALL_COLUMNS.filter(c => c.group === 'transferApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        transferCols.forEach(c => { next[c.key] = true; });
        return next;
      });
    }
  };

  // 更新確定ハンドラ（旧→廃棄予定、新レコード生成 → 選択行の直下に挿入）
  const handleUpdateConfirm = () => {
    if (!showUpdateConfirm) return;
    const { rowNo } = showUpdateConfirm;
    const sourceAsset = displayAssets.find(a => a.no === rowNo);
    if (!sourceAsset) return;

    const maxNo = Math.max(...displayAssets.map(a => a.no)) + 1;
    const newAsset: Asset = {
      ...sourceAsset,
      no: maxNo,
      qrCode: '',
      assetNo: '',
      managementNo: '',
      serialNumber: '',
      purchaseCategory: '更新',
      updateSourceNo: rowNo,
      sourceType: 'added',
    };

    if (isEditListMode && listId) {
      updateBaseAsset(listId, rowNo, { purchaseCategory: '廃棄予定' });
      addBaseAssets(listId, [newAsset], rowNo);
    } else {
      setMockAssets(prev => {
        const result: Asset[] = [];
        for (const asset of prev) {
          if (asset.no === rowNo) {
            result.push({ ...asset, purchaseCategory: '廃棄予定' as const });
            result.push(newAsset);
          } else {
            result.push(asset);
          }
        }
        return result;
      });
    }
    setShowUpdateConfirm(null);
  };

  // 増設確定ハンドラ（選択行の直下に挿入）
  const handleAdditionConfirm = () => {
    if (!showAdditionInput) return;
    const { rowNo, quantity } = showAdditionInput;
    const sourceAsset = displayAssets.find(a => a.no === rowNo);
    if (!sourceAsset) return;

    const maxNo = Math.max(...displayAssets.map(a => a.no));
    const newAssets: Asset[] = [];
    for (let i = 0; i < quantity; i++) {
      newAssets.push({
        ...sourceAsset,
        no: maxNo + 1 + i,
        qrCode: '',
        assetNo: '',
        managementNo: '',
        serialNumber: '',
        purchaseCategory: '増設',
        sourceType: 'added',
      });
    }

    if (isEditListMode && listId) {
      addBaseAssets(listId, newAssets, rowNo);
    } else {
      setMockAssets(prev => {
        const result: Asset[] = [];
        for (const asset of prev) {
          result.push(asset);
          if (asset.no === rowNo) {
            result.push(...newAssets);
          }
        }
        return result;
      });
    }
    setShowAdditionInput(null);
  };

  // 廃棄・移設のみの申請対象マッピング
  const disposalTransferCategories: Record<string, { workflowType: 'disposal' | 'transfer'; initialStatus: '廃棄承認待ち' | '移動承認待ち'; label: string }> = {
    '廃棄予定': { workflowType: 'disposal', initialStatus: '廃棄承認待ち', label: '廃棄申請' },
    '移設': { workflowType: 'transfer', initialStatus: '移動承認待ち', label: '移動申請' },
  };

  // インライン申請バリデーション（廃棄・移設のみ対象）
  const validateAssetForApplication = (asset: Asset): { valid: boolean; errors: { field: string; message: string }[] } => {
    const errors: { field: string; message: string }[] = [];
    const cat = asset.purchaseCategory;
    if (!cat) return { valid: false, errors: [{ field: 'purchaseCategory', message: 'リモデル区分が未設定' }] };

    // 購入系（新規・更新・増設）は見積依頼グループで管理するため申請対象外
    if (cat === '新規' || cat === '更新' || cat === '増設') {
      return { valid: false, errors: [{ field: 'purchaseCategory', message: '購入系は見積依頼グループで管理します' }] };
    }

    // 廃棄予定・移設ともに必須なし（移設先情報はカラム上で任意入力）

    return { valid: errors.length === 0, errors };
  };

  // 申請実行前のバリデーション＋確認ダイアログ表示（廃棄・移設のみ）
  const handleApplicationExecute = () => {
    if (selectedItems.size === 0) return;

    const selectedAssetsList = finalFilteredAssets.filter(a => selectedItems.has(a.no));
    const breakdown: Record<string, number> = {};
    const errors: { rowNo: number; field: string; message: string }[] = [];
    const newErrorRows = new Set<number>();
    let skippedPurchase = 0;

    selectedAssetsList.forEach(asset => {
      const cat = asset.purchaseCategory;
      if (!cat) {
        errors.push({ rowNo: asset.no, field: 'purchaseCategory', message: 'リモデル区分が未設定' });
        newErrorRows.add(asset.no);
        return;
      }
      // 購入系はスキップ
      if (cat === '新規' || cat === '更新' || cat === '増設') {
        skippedPurchase++;
        return;
      }
      // 申請済みスキップ
      if (appliedRows.has(asset.no)) return;

      const result = validateAssetForApplication(asset);
      if (result.valid) {
        const mapping = disposalTransferCategories[cat];
        if (mapping) {
          breakdown[mapping.label] = (breakdown[mapping.label] || 0) + 1;
        }
      } else {
        result.errors.forEach(err => errors.push({ rowNo: asset.no, field: err.field, message: err.message }));
        newErrorRows.add(asset.no);
      }
    });

    // 対象がない場合
    if (Object.keys(breakdown).length === 0 && errors.length === 0) {
      if (skippedPurchase > 0) {
        setApplicationFeedback(`購入系（${skippedPurchase}件）は見積依頼グループで管理します。廃棄・移設のレコードを選択してください。`);
        setTimeout(() => setApplicationFeedback(null), 4000);
      }
      return;
    }

    setApplicationBreakdown(breakdown);
    setApplicationErrors(errors);
    setErrorRows(newErrorRows);
    setShowApplicationConfirm(true);
  };

  // 申請作成を実行（廃棄・移設 → rfqGroupStoreにレコード追加）
  const handleApplicationConfirm = () => {
    const selectedAssetsList = finalFilteredAssets.filter(a => selectedItems.has(a.no));
    const today = new Date().toISOString().split('T')[0];
    const newAppliedRows = new Set(appliedRows);
    let successCount = 0;

    selectedAssetsList.forEach(asset => {
      const cat = asset.purchaseCategory;
      if (!cat || appliedRows.has(asset.no) || errorRows.has(asset.no)) return;
      // 購入系はスキップ
      if (cat === '新規' || cat === '更新' || cat === '増設') return;

      const result = validateAssetForApplication(asset);
      if (!result.valid) return;

      const mapping = disposalTransferCategories[cat];
      if (!mapping) return;

      const rfqNo = mapping.workflowType === 'disposal'
        ? generateDisposalNo()
        : generateTransferNo();

      const assetName = asset.item || asset.name;
      const groupName = mapping.workflowType === 'disposal'
        ? `廃棄：${assetName}`
        : `移設：${assetName}（→${asset.transferDepartment || ''}${asset.transferRoomName || ''}）`;

      // rfqGroupStoreに追加
      addRfqGroup({
        rfqNo,
        groupName,
        createdDate: today,
        applicationIds: [String(asset.no)],
        status: mapping.initialStatus,
        editListId: listId || undefined,
        workflowType: mapping.workflowType,
      });

      // baseAssetへの自動書き込み
      const patch: Record<string, unknown> = {};

      if (mapping.workflowType === 'disposal') {
        patch.disposalApplicationNo = rfqNo;
        patch.disposalApplicationDate = today;
      }
      if (mapping.workflowType === 'transfer') {
        patch.transferApplicationNo = rfqNo;
        patch.transferApplicationDate = today;
      }

      if (isEditListMode && listId) {
        updateBaseAsset(listId, asset.no, patch);
      } else {
        setMockAssets(prev => prev.map(a => a.no === asset.no ? { ...a, ...patch } as Asset : a));
      }

      newAppliedRows.add(asset.no);
      successCount++;
    });

    setAppliedRows(newAppliedRows);
    setShowApplicationConfirm(false);
    setApplicationFeedback(`${successCount}件の廃棄・移設申請を作成しました`);
    setTimeout(() => setApplicationFeedback(null), 4000);
  };

  // 資産マスタ別ウィンドウを開く
  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
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
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED') {
        const assetMasters = event.data.assets as any[];
        const newSelectedAssets = assetMasters.map(assetMaster => ({
          asset: {
            ...assetMaster,
            name: assetMaster.item,
            no: 0,
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

  // --- インライン新規申請関連 ---
  const getInitialInlineData = (): Record<string, string> => ({
    // (新)設置情報
    newBuilding: '',
    newFloor: '',
    newDepartment: '',
    newSection: '',
    newRoomName: '',
    // 購入申請情報
    applicationCategory: '新規申請',
    applicationDate: new Date().toISOString().split('T')[0],
    applicationNo: `AP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    desiredDeliveryDate: '',
    priority: '',
    applicationItem: '',
    quantity: '1',
    quantityUnit: '台',
    requestItem1: '',
    requestMaker1: '',
    requestModel1: '',
    requestItem2: '',
    requestMaker2: '',
    requestModel2: '',
    requestItem3: '',
    requestMaker3: '',
    requestModel3: '',
    usagePurpose: '',
    caseCount: '',
    caseCountUnit: '',
    comment: '',
    serialNumber: '',
    currentConnectionStatus: '',
    requestConnectionStatus: '',
  });

  // インライン新規申請を開始
  const handleStartInlineNew = () => {
    if (isInlineNewMode) {
      // 既にインラインモード中 → 該当行にスクロール
      inlineNewRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsInlineNewMode(true);
    setSelectedAssets([]);
    setInlineNewData(getInitialInlineData());
    setInlineEditingCol(null);
    setTimeout(() => {
      inlineNewRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // インライン新規申請を確定
  const handleInlineNewConfirm = () => {
    const now = new Date().toISOString();
    const appId = `pa-inline-${Date.now()}`;

    // PurchaseApplication オブジェクトを構築
    const newApplication: PurchaseApplication = {
      id: appId,
      applicationNo: inlineNewData.applicationNo,
      applicationType: '新規申請',
      applicantId: 'inline-user',
      applicantName: '',
      applicantDepartment: inlineNewData.newDepartment,
      applicationDate: inlineNewData.applicationDate,
      status: '編集中',
      assets: [{
        name: inlineNewData.applicationItem,
        maker: inlineNewData.requestMaker1 || '',
        model: inlineNewData.requestModel1 || '',
        category: inlineNewData.category || '',
        largeClass: inlineNewData.largeClass || '',
        mediumClass: inlineNewData.mediumClass || '',
        item: inlineNewData.applicationItem,
        quantity: parseInt(inlineNewData.quantity) || 1,
        unit: inlineNewData.quantityUnit || '台',
      }],
      facility: facility,
      building: inlineNewData.newBuilding,
      floor: inlineNewData.newFloor,
      department: inlineNewData.newDepartment,
      section: inlineNewData.newSection,
      roomName: inlineNewData.newRoomName,
      desiredDeliveryDate: inlineNewData.desiredDeliveryDate,
      priority: inlineNewData.priority,
      usagePurpose: inlineNewData.usagePurpose,
      caseCount: inlineNewData.caseCount,
      comment: inlineNewData.comment,
      currentConnectionStatus: inlineNewData.currentConnectionStatus,
      requestConnectionStatus: inlineNewData.requestConnectionStatus,
      createdAt: now,
      updatedAt: now,
    };

    if (isEditListMode && listId) {
      addItemsFromApplications(listId, [newApplication]);
    }

    alert(`新規購入申請を追加しました\n品目: ${inlineNewData.applicationItem}`);
    setIsInlineNewMode(false);
    setInlineNewData({});
    setInlineEditingCol(null);
    setSelectedAssets([]);
  };

  // インライン新規申請をキャンセル
  const handleInlineNewCancel = () => {
    setIsInlineNewMode(false);
    setInlineNewData({});
    setInlineEditingCol(null);
    setSelectedAssets([]);
  };

  // インラインセル編集開始
  const handleInlineCellClick = (colKey: string) => {
    setInlineEditingCol(colKey);
    setInlineEditingValue(inlineNewData[colKey] || '');
  };

  // インラインセル編集確定
  const handleInlineCellSave = () => {
    if (inlineEditingCol) {
      setInlineNewData(prev => ({ ...prev, [inlineEditingCol]: inlineEditingValue }));
      setInlineEditingCol(null);
      setInlineEditingValue('');
    }
  };

  // インラインセル編集キャンセル
  const handleInlineCellCancel = () => {
    setInlineEditingCol(null);
    setInlineEditingValue('');
  };

  // 資産マスタ選択時にインライン行データを同期
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isInlineNewMode && selectedAssets.length > 0) {
      const lastAsset = selectedAssets[selectedAssets.length - 1];
      setInlineNewData(prev => ({
        ...prev,
        applicationItem: lastAsset.asset.item || lastAsset.asset.name || '',
        category: lastAsset.asset.category || '',
        largeClass: lastAsset.asset.largeClass || '',
        mediumClass: lastAsset.asset.mediumClass || '',
        requestItem1: lastAsset.asset.item || lastAsset.asset.name || '',
        requestMaker1: lastAsset.asset.maker || '',
        requestModel1: lastAsset.asset.model || '',
      }));
    }
  }, [isInlineNewMode, selectedAssets.length]);

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
          onClick={() => {
            if (selectedItems.size === 0) {
              alert('紐づけるレコードを選択してください');
              return;
            }
            setIsDataLinkModalOpen(true);
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
          Data Link
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
          見積DB Link
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

        {/* 廃棄・移設申請ボタン（選択行に廃棄予定 or 移設がある場合のみ活性） */}
        {(() => {
          const dtCount = finalFilteredAssets.filter(a =>
            selectedItems.has(a.no) &&
            (a.purchaseCategory === '廃棄予定' || a.purchaseCategory === '移設') &&
            !appliedRows.has(a.no)
          ).length;
          const disabled = dtCount === 0;
          return (
            <button
              onClick={handleApplicationExecute}
              disabled={disabled}
              style={{
                padding: '8px 16px',
                background: disabled ? '#bdc3c7' : '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              廃棄・移設申請{dtCount > 0 ? `（${dtCount}件）` : ''}
            </button>
          );
        })()}

        {/* 一括新規追加ボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid #dee2e6' }}>
          <button
            onClick={handleStartInlineNew}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#4a6741',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3d5636'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4a6741'; }}
          >
            一括新規追加
          </button>
        </div>

        </div>

        {/* 右側: 選択件数 + タスク管理リンク + 合計表示 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedItems.size > 0 && (
            <div style={{
              padding: '6px 12px',
              background: '#1565c0',
              color: 'white',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              選択: {selectedItems.size}件
            </div>
          )}
          <button
            onClick={() => router.push('/quotation-data-box/remodel-management')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#3498db',
              border: '1px solid #3498db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3498db'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3498db'; }}
          >
            タスク管理 &rarr;
          </button>
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

        {/* 一括適用バナー */}
        {selectedItems.size > 1 && editingCell !== null && selectedItems.has(editingCell.rowNo) && (
          <div style={{
            padding: '8px 16px',
            background: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#1565c0',
            fontWeight: 600,
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              background: '#1565c0',
              color: 'white',
              borderRadius: '50%',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {selectedItems.size}
            </span>
            {selectedItems.size}件のレコードに一括適用されます
          </div>
        )}

        {/* 資産テーブル（編集リストモード・従来モード共通） */}
        {currentView === 'list' && (
          <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 102 }}>
              {/* グループヘッダー行 */}
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    padding: '4px',
                    textAlign: 'center',
                    width: `${columnWidths.checkbox}px`,
                    minWidth: `${columnWidths.checkbox}px`,
                    position: 'sticky',
                    left: 0,
                    zIndex: 103,
                    background: '#343a40',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    borderRight: '1px solid #495057',
                    borderBottom: '2px solid #dee2e6',
                  }}
                >
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ accentColor: '#fff' }}
                  />
                </th>
                {groupHeaderSpans.map((span, i) => (
                  <th
                    key={`${span.groupId}-${i}`}
                    colSpan={span.colSpan}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'white',
                      background: span.color,
                      borderRight: '1px solid rgba(255,255,255,0.3)',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {span.label}
                  </th>
                ))}
              </tr>
              {/* カラムヘッダー行 */}
              <tr>
                {/* checkbox列はrowSpan=2で上行に含まれるため省略 */}
                {orderedColumns.filter((col) => visibleColumns[col.key]).map((col) => {
                  const isSorted = sortConfig?.key === col.key;
                  const hasFilter = columnFilters[col.key]?.length > 0;
                  const uniqueValues = getColumnUniqueValues(col.key);
                  const groupDef = REMODEL_COLUMN_GROUPS.find(g => g.id === col.group);
                  const groupColor = groupDef?.color || '#6c757d';

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
                        borderTop: `2px solid ${groupColor}`,
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
                            {isSorted ? (sortConfig.direction === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
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
                            {'\u25BC'}
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
              {finalFilteredAssets.map((asset) => {
                // 行ステータスの左ボーダー色
                const getRowBorderColor = () => {
                  if (errorRows.has(asset.no)) return '#e74c3c';
                  if (appliedRows.has(asset.no)) return '#27ae60';
                  if (asset.purchaseCategory) return '#f39c12';
                  return 'transparent';
                };
                return (
                <tr
                  key={asset.no}
                  style={{ borderLeft: `4px solid ${getRowBorderColor()}` }}
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
                    const isEditable = col.key !== 'purchaseCategory';
                    const isRowSelected = selectedItems.has(asset.no);

                    // 一括編集対象かどうか（他行で編集中 + 自分が選択中）
                    const isBulkEditTarget = editingCell !== null
                      && editingCell.rowNo !== asset.no
                      && selectedItems.size > 1
                      && isRowSelected
                      && selectedItems.has(editingCell.rowNo);

                    // セル背景色の決定
                    const getCellBackground = () => {
                      if (isEditing) return '#fff3cd';
                      // 一括適用対象行のハイライト
                      if (isBulkEditTarget && editingCell?.colKey === col.key) return '#fff8e1';
                      if (isHovered && isEditable) {
                        // 選択状態では濃い青、非選択では薄い青
                        return isRowSelected ? '#bbdefb' : '#e8f4fd';
                      }
                      // 一括適用対象行の通常ハイライト
                      if (isBulkEditTarget) return '#fffde7';
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
                        {col.key === 'purchaseCategory' ? (
                          (() => {
                            const currentVal = asset.purchaseCategory || '';
                            const categoryColors: Record<string, string> = {
                              '新規': '#27ae60',
                              '更新': '#e67e22',
                              '移設': '#3498db',
                              '増設': '#8e44ad',
                              '廃棄予定': '#e74c3c',
                            };
                            // 新規追加レコード（sourceType === 'added' かつ purchaseCategory === '新規'）はバッジ固定
                            if (currentVal === '新規') {
                              return (
                                <span style={{
                                  padding: '2px 8px',
                                  background: '#27ae60',
                                  color: 'white',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                }}>
                                  新規
                                </span>
                              );
                            }
                            // 既存レコード: プルダウン（新規なし）
                            return (
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value as Asset['purchaseCategory'];
                                  handlePurchaseCategoryChange(asset.no, val || undefined);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '100%',
                                  padding: '4px 2px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  background: currentVal ? categoryColors[currentVal] || '#f0f0f0' : 'transparent',
                                  color: currentVal ? 'white' : '#95a5a6',
                                  appearance: 'auto',
                                }}
                              >
                                <option value="">-</option>
                                <option value="更新">更新</option>
                                <option value="移設">移設</option>
                                <option value="増設">増設</option>
                                <option value="廃棄予定">廃棄予定</option>
                              </select>
                            );
                          })()
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
                );
              })}

              {/* インライン新規行 */}
              {isInlineNewMode && (() => {
                // 自動設定カラム（編集不可）
                const autoFilledCols = ['applicationCategory', 'applicationDate', 'applicationNo'];
                // ドロップダウンで編集するカラムとそのオプション
                const dropdownCols: Record<string, string[]> = {
                  newBuilding: buildingOptions,
                  newFloor: floorOptions,
                  newDepartment: departmentOptions,
                  newSection: sectionOptions,
                };

                return (
                  <tr ref={inlineNewRowRef} style={{ background: '#e8f5e9' }}>
                    {/* ★ アクションセル */}
                    <td style={{
                      padding: '6px 4px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 100,
                      background: '#e8f5e9',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                      borderRight: '1px solid #dee2e6',
                      borderBottom: '2px solid #4caf50',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#4caf50', fontSize: '12px', fontWeight: 'bold' }}>新規</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button
                            onClick={handleInlineNewConfirm}
                            title="申請を確定する"
                            style={{
                              width: '24px', height: '24px',
                              background: '#4caf50', color: 'white',
                              border: 'none', borderRadius: '4px',
                              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleInlineNewCancel}
                            title="キャンセル"
                            style={{
                              width: '24px', height: '24px',
                              background: '#e74c3c', color: 'white',
                              border: 'none', borderRadius: '4px',
                              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </td>
                    {orderedColumns.filter(col => visibleColumns[col.key]).map(col => {
                      const isPurchaseCol = col.group === 'purchaseApplication';
                      const isNewLocationCol = col.group === 'newLocation';
                      const isInlineEditing = inlineEditingCol === col.key;
                      const cellValue = inlineNewData[col.key] || '';
                      const isAutoFilled = autoFilledCols.includes(col.key);
                      const isDropdown = col.key in dropdownCols;

                      // 編集可能: (新)設置情報 or 購入申請情報（自動設定以外）
                      const isEditable = (isNewLocationCol || (isPurchaseCol && !isAutoFilled));

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: isInlineEditing ? '4px' : '8px 8px',
                            background: isInlineEditing ? '#fff3cd' : isEditable ? '#f1f8e9' : '#e8f5e9',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: '1px solid #dee2e6',
                            borderBottom: '2px solid #4caf50',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: isEditable ? 'pointer' : 'default',
                            transition: 'background 0.15s',
                          }}
                          onClick={() => isEditable && handleInlineCellClick(col.key)}
                        >
                          {/* リモデル区分バッジ（新規追加は固定） */}
                          {col.key === 'purchaseCategory' ? (
                            <span style={{
                              padding: '2px 8px',
                              background: '#27ae60',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                            }}>新規</span>

                          /* ドロップダウン編集（設置情報の選択カラム） */
                          ) : isInlineEditing && isDropdown ? (
                            <select
                              value={inlineEditingValue}
                              onChange={(e) => {
                                setInlineNewData(prev => ({ ...prev, [col.key]: e.target.value }));
                                setInlineEditingCol(null);
                                setInlineEditingValue('');
                              }}
                              onBlur={handleInlineCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleInlineCellCancel();
                              }}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '6px 4px',
                                border: '2px solid #4caf50',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="">選択してください</option>
                              {dropdownCols[col.key].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                          /* テキスト入力編集 */
                          ) : isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineEditingValue}
                              onChange={(e) => setInlineEditingValue(e.target.value)}
                              onBlur={handleInlineCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineCellSave();
                                if (e.key === 'Escape') handleInlineCellCancel();
                              }}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '2px solid #4caf50',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                              }}
                            />

                          /* 申請品目セル（資産マスタ選択ボタン付き） */
                          ) : col.key === 'applicationItem' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: cellValue ? '#2c3e50' : '#a5d6a7',
                                fontStyle: cellValue ? 'normal' : 'italic',
                                fontSize: '13px',
                              }}>
                                {cellValue || '入力 or 選択'}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenAssetMaster(); }}
                                title="資産マスタから選択"
                                style={{
                                  padding: '2px 6px',
                                  background: '#27ae60',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                選択
                              </button>
                            </div>

                          /* 通常表示 */
                          ) : (
                            <span style={{
                              color: cellValue ? '#2c3e50' : (isEditable ? '#a5d6a7' : '#bbb'),
                              fontStyle: isEditable && !cellValue ? 'italic' : 'normal',
                              fontSize: '13px',
                            }}>
                              {cellValue || (isEditable ? '入力' : '-')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })()}
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

        {/* 申請実行フィードバック */}
        {applicationFeedback && (
          <div style={{
            padding: '10px 16px',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>&#10003;</span>
            {applicationFeedback}
          </div>
        )}
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

      {/* 申請実行確認ダイアログ */}
      {showApplicationConfirm && (
        <div
          onClick={() => setShowApplicationConfirm(false)}
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
              maxWidth: '480px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#e67e22',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>廃棄・移設申請の確認</span>
              <button
                onClick={() => setShowApplicationConfirm(false)}
                aria-label="閉じる"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* 種別ごとの件数 */}
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>
                以下の廃棄・移設申請を作成します:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {Object.entries(applicationBreakdown).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#2c3e50' }}>
                    <span>{type}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{count}件</span>
                  </div>
                ))}
              </div>
              {Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 && (
                <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '4px', fontSize: '13px', color: '#856404', marginBottom: '12px' }}>
                  有効な廃棄・移設対象がありません。リモデル区分を確認してください。
                </div>
              )}
              {applicationErrors.length > 0 && (
                <div style={{ padding: '12px', background: '#f8d7da', borderRadius: '4px', fontSize: '13px', color: '#721c24', marginBottom: '12px' }}>
                  バリデーションエラー: {applicationErrors.length}件（スキップされます）
                </div>
              )}
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowApplicationConfirm(false)}
                style={{
                  padding: '8px 20px',
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
                onClick={handleApplicationConfirm}
                disabled={Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0}
                style={{
                  padding: '8px 20px',
                  background: Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 ? '#bdc3c7' : '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                申請を作成
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
                  <li>個別部署マスタの「新居」情報が「現状」に反映されます</li>
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
                  個別部署マスタ: <strong>{facilityMasterStats.total}件</strong>
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
            editListId: isEditListMode ? listId : undefined,
          });

          if (isEditListMode && listId) {
            // 編集リストモード: editListStore経由でbaseAssets/itemsのrfqNoを更新
            updateRfqInfo(listId, selectedItems, rfqNo, rfqGroupName.trim());
          } else {
            // 通常モード: ローカルstateを更新
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
          }

          alert(`見積依頼グループ「${rfqGroupName.trim()}」を作成しました\n\n見積依頼No.: ${rfqNo}\n選択レコード: ${selectedItems.size}件`);
          setIsRfqGroupModalOpen(false);
          setRfqGroupName('');
          setSelectedItems(new Set());
        }}
      />

      {/* Data Linkモーダル */}
      <DataLinkModal
        isOpen={isDataLinkModalOpen}
        onClose={() => setIsDataLinkModalOpen(false)}
        selectedAssets={dataLinkSelectedAssets}
        baseAssets={baseAssetsForDataLink}
        assetMasters={assetMasters}
        vendors={vendors}
        quotationGroups={quotationGroups}
        quotationItems={quotationItems}
        rfqGroups={rfqGroups}
        onExecute={handleDataLinkExecute}
        onAddNewAssets={handleDataLinkAddNewAssets}
      />

      {/* 更新確認ダイアログ */}
      {showUpdateConfirm && (
        <div
          onClick={() => setShowUpdateConfirm(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
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
              maxWidth: '480px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#e67e22',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              更新レコードの作成確認
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2c3e50' }}>
                以下の処理が実行されます:
              </p>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', color: '#555', lineHeight: 1.8 }}>
                <li>現在のレコード → 購入区分が「廃棄予定」に変更</li>
                <li>新しいレコード → 品目・メーカー・型式をコピーして「更新」として追加</li>
              </ul>
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowUpdateConfirm(null)}
                style={{
                  padding: '8px 20px',
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
                onClick={handleUpdateConfirm}
                style={{
                  padding: '8px 20px',
                  background: '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                更新レコードを作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 増設数量入力ダイアログ */}
      {showAdditionInput && (
        <div
          onClick={() => setShowAdditionInput(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
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
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#8e44ad',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              増設数量の入力
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2c3e50' }}>
                追加するレコード数を入力してください:
              </p>
              <input
                type="number"
                min="1"
                max="99"
                value={showAdditionInput.quantity}
                onChange={(e) => setShowAdditionInput(prev => prev ? { ...prev, quantity: Math.max(1, Number(e.target.value)) } : null)}
                autoFocus
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              />
              <span style={{ marginLeft: '8px', fontSize: '14px', color: '#555' }}>件</span>
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowAdditionInput(null)}
                style={{
                  padding: '8px 20px',
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
                onClick={handleAdditionConfirm}
                style={{
                  padding: '8px 20px',
                  background: '#8e44ad',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                増設レコードを追加
              </button>
            </div>
          </div>
        </div>
      )}
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
