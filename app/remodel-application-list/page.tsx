'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { Application, OriginalRegistration } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';
import {
  RfqGroupModal,
  ApplicationTypeFilterBar,
  OriginalRegistrationModal,
  DisposalExecutionModal,
  MovementExecutionModal,
  EditableCell,
  BulkEditModal,
} from './components';
import { APPLICATION_TYPE_BADGE_STYLES, WINDOW_SIZES } from './constants';

// 原本登録対象の申請種別
const ORIGINAL_REGISTRATION_TYPES = ['新規申請', '更新申請', '増設申請'];

// 廃棄執行対象の申請種別
const DISPOSAL_EXECUTION_TYPES = ['廃棄申請'];

// 移動執行対象の申請種別
const MOVEMENT_EXECUTION_TYPES = ['移動申請'];

function RemodelApplicationListContent() {
  const searchParams = useSearchParams();
  const { facilities, assets } = useMasterStore();
  const { applications, updateApplication, deleteApplication } = useApplicationStore();
  const { generateRfqNo, addRfqGroup } = useRfqGroupStore();
  const { isMobile } = useResponsive();

  // URLパラメータから施設・部署を取得
  const facility = searchParams.get('facility') || '';
  const department = searchParams.get('department') || '';

  // ページタイトル
  const pageTitle = facility && department
    ? `リモデル申請一覧 - ${facility} ${department}`
    : 'リモデル申請一覧';

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    applicationType: ''
  });

  // 選択された行
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // 見積依頼グループ登録モーダル
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');
  const [rfqModalMode, setRfqModalMode] = useState<'create' | 'edit'>('create');
  const [editingRfqNo, setEditingRfqNo] = useState<string>('');
  const [editingAppId, setEditingAppId] = useState<number | null>(null);


  // 原本登録モーダル
  const [showOriginalRegistrationModal, setShowOriginalRegistrationModal] = useState(false);
  const [originalRegistrationApplication, setOriginalRegistrationApplication] = useState<Application | null>(null);

  // 廃棄執行モーダル
  const [showDisposalExecutionModal, setShowDisposalExecutionModal] = useState(false);
  const [disposalExecutionApplication, setDisposalExecutionApplication] = useState<Application | null>(null);

  // 移動執行モーダル
  const [showMovementExecutionModal, setShowMovementExecutionModal] = useState(false);
  const [movementExecutionApplication, setMovementExecutionApplication] = useState<Application | null>(null);

  // QRコードNo.採番カウンター（実際にはstoreやDBで管理）
  const [qrCodeCounter, setQrCodeCounter] = useState(1);

  // 一括編集モーダル
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditFieldKey, setBulkEditFieldKey] = useState('');
  const [bulkEditCurrentValue, setBulkEditCurrentValue] = useState('');


  // フィルターオプション生成
  const filterOptions = useMemo(() => ({
    building: Array.from(new Set(facilities.map(f => f.building))).filter(Boolean) as string[],
    floor: Array.from(new Set(facilities.map(f => f.floor))).filter(Boolean) as string[],
    department: Array.from(new Set(facilities.map(f => f.department))).filter(Boolean) as string[],
    section: Array.from(new Set(facilities.map(f => f.section))).filter(Boolean) as string[],
    category: Array.from(new Set(assets.map(a => a.category))).filter(Boolean) as string[],
    largeClass: Array.from(new Set(assets.map(a => a.largeClass))).filter(Boolean) as string[],
    mediumClass: Array.from(new Set(assets.map(a => a.mediumClass))).filter(Boolean) as string[],
  }), [facilities, assets]);

  // フィルタリングされた申請データ
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (filters.building && app.facility.building !== filters.building) return false;
      if (filters.floor && app.facility.floor !== filters.floor) return false;
      if (filters.department && app.facility.department !== filters.department) return false;
      if (filters.section && app.facility.section !== filters.section) return false;
      if (filters.applicationType && app.applicationType !== filters.applicationType) return false;
      return true;
    });
  }, [applications, filters]);

  // 行選択ハンドラー
  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(filteredApplications.map(app => app.id)) : new Set());
  };

  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const handleDeleteRow = (id: number) => {
    if (confirm('この申請を削除しますか？')) {
      deleteApplication(id);
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 申請種別フィルター
  const handleApplicationTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      applicationType: prev.applicationType === type ? '' : type
    }));
  };

  // 見積依頼グループ登録（新規作成モード）
  const handleOpenRfqModal = (appId?: number) => {
    if (selectedRows.size === 0 && appId) {
      setSelectedRows(new Set([appId]));
    }
    if (selectedRows.size === 0 && !appId) {
      alert('見積依頼グループに追加する申請を選択してください');
      return;
    }
    setRfqModalMode('create');
    setEditingRfqNo('');
    setEditingAppId(null);
    setShowRfqModal(true);
    setRfqGroupName('');
  };

  // 見積依頼グループ編集（編集モード）
  const handleOpenRfqEditModal = (app: Application) => {
    if (!app.rfqNo) return;
    setRfqModalMode('edit');
    setEditingRfqNo(app.rfqNo);
    setEditingAppId(app.id);
    setRfqGroupName(app.rfqGroupName || '');
    setShowRfqModal(true);
  };

  const handleCreateRfqGroup = () => {
    if (!rfqGroupName.trim()) {
      alert('見積依頼グループ名称を入力してください');
      return;
    }

    if (rfqModalMode === 'edit') {
      // 編集モード: 同じrfqNoを持つ全ての申請のグループ名を更新
      applications.forEach(app => {
        if (app.rfqNo === editingRfqNo) {
          updateApplication(app.id, { rfqGroupName });
        }
      });
      alert(`見積依頼グループを更新しました\n見積依頼No: ${editingRfqNo}\nグループ名称: ${rfqGroupName}`);
    } else {
      // 新規作成モード
      const rfqNo = generateRfqNo();
      const today = new Date();
      const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      addRfqGroup({
        rfqNo,
        groupName: rfqGroupName,
        createdDate,
        applicationIds: Array.from(selectedRows),
        status: '見積依頼'
      });

      selectedRows.forEach(id => {
        updateApplication(id, { rfqNo, rfqGroupName });
      });

      alert(`見積依頼グループを作成しました\n見積依頼No: ${rfqNo}\nグループ名称: ${rfqGroupName}\n登録件数: ${selectedRows.size}件`);
      setSelectedRows(new Set());
    }

    setShowRfqModal(false);
    setRfqGroupName('');
    setEditingRfqNo('');
    setEditingAppId(null);
  };

  // 見積依頼グループ削除
  const handleDeleteRfqGroup = () => {
    if (!editingRfqNo) return;

    if (!confirm(`見積依頼No: ${editingRfqNo} を削除しますか？\n\n紐づいている全ての申請から見積依頼No.とグループ名称が削除されます。`)) {
      return;
    }

    // 同じrfqNoを持つ全ての申請からrfqNo/rfqGroupNameを削除
    applications.forEach(app => {
      if (app.rfqNo === editingRfqNo) {
        updateApplication(app.id, { rfqNo: undefined, rfqGroupName: undefined });
      }
    });

    alert(`見積依頼グループを削除しました: ${editingRfqNo}`);
    setShowRfqModal(false);
    setRfqGroupName('');
    setEditingRfqNo('');
    setEditingAppId(null);
  };

  // 別ウィンドウで開く
  const openWindow = (url: string, name: string, size: { width: number; height: number }) => {
    const left = (window.screen.width - size.width) / 2;
    const top = (window.screen.height - size.height) / 2;
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fullUrl = `${basePath}${url}`;
    window.open(fullUrl, name, `width=${size.width},height=${size.height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  // 原本登録モーダルを開く
  const handleOpenOriginalRegistrationModal = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalRegistrationApplication(app);
    setShowOriginalRegistrationModal(true);
  };

  // QRコードNo.採番
  const generateQrCodeNo = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const counter = String(qrCodeCounter).padStart(5, '0');
    return `QR-${year}${month}${day}-${counter}`;
  };

  // 原本登録を確定（執行完了後にレコード削除）
  const handleOriginalRegistrationSubmit = (applicationId: number, registration: OriginalRegistration) => {
    updateApplication(applicationId, { originalRegistration: registration });
    setQrCodeCounter(prev => prev + 1);
    alert(`原本登録が完了しました\nQRコードNo: ${registration.qrCodeNo}\n\n申請はクローズされます。`);
    deleteApplication(applicationId);
  };

  // 廃棄執行モーダルを開く
  const handleOpenDisposalExecutionModal = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setDisposalExecutionApplication(app);
    setShowDisposalExecutionModal(true);
  };

  // 廃棄執行を確定（執行完了後にレコード削除）
  const handleDisposalExecutionSubmit = (applicationId: number) => {
    alert('廃棄執行が完了しました。\n\n申請はクローズされます。');
    deleteApplication(applicationId);
  };

  // 移動執行モーダルを開く
  const handleOpenMovementExecutionModal = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setMovementExecutionApplication(app);
    setShowMovementExecutionModal(true);
  };

  // 移動執行を確定（執行完了後にレコード削除）
  const handleMovementExecutionSubmit = (applicationId: number) => {
    alert('移動執行が完了しました。\n\n申請はクローズされます。');
    deleteApplication(applicationId);
  };

  // 申請種別バッジスタイル取得
  const getTypeBadgeStyle = (type: string) => {
    return APPLICATION_TYPE_BADGE_STYLES[type as keyof typeof APPLICATION_TYPE_BADGE_STYLES] || { background: '#f5f5f5', color: '#555' };
  };

  // 数値フィールドのリスト
  const numericFields = ['quotationAmount', 'estimatedAmount'];

  // セル単体編集ハンドラー
  const handleCellSave = (id: number, fieldKey: string, value: string) => {
    const updateData: Partial<Application> = {};

    // ネストしたフィールドの処理
    if (fieldKey.startsWith('facility.')) {
      const subKey = fieldKey.split('.')[1] as keyof Application['facility'];
      const app = applications.find(a => a.id === id);
      if (app) {
        updateData.facility = { ...app.facility, [subKey]: value };
      }
    } else if (fieldKey.startsWith('asset.')) {
      const subKey = fieldKey.split('.')[1] as keyof Application['asset'];
      const app = applications.find(a => a.id === id);
      if (app) {
        updateData.asset = { ...app.asset, [subKey]: value };
      }
    } else if (numericFields.includes(fieldKey)) {
      // 数値フィールドの場合は数値に変換
      const numValue = value ? parseInt(value.replace(/[,¥]/g, ''), 10) : undefined;
      (updateData as Record<string, number | undefined>)[fieldKey] = numValue;
    } else {
      (updateData as Record<string, string>)[fieldKey] = value;
    }

    updateApplication(id, updateData);
  };

  // 一括編集モーダルを開く
  const handleOpenBulkEdit = (fieldKey: string, currentValue: string) => {
    setBulkEditFieldKey(fieldKey);
    setBulkEditCurrentValue(currentValue);
    setShowBulkEditModal(true);
  };

  // 一括編集を実行
  const handleBulkEditSubmit = (value: string) => {
    selectedRows.forEach(id => {
      handleCellSave(id, bulkEditFieldKey, value);
    });
    alert(`${selectedRows.size}件の申請を更新しました`);
    setShowBulkEditModal(false);
  };

  // フィールドの値を取得するヘルパー
  const getFieldValue = (app: Application, fieldKey: string): string => {
    if (fieldKey.startsWith('facility.')) {
      const subKey = fieldKey.split('.')[1] as keyof Application['facility'];
      return app.facility[subKey] || '';
    } else if (fieldKey.startsWith('asset.')) {
      const subKey = fieldKey.split('.')[1] as keyof Application['asset'];
      return app.asset[subKey] || '';
    }
    return ((app as unknown) as Record<string, string>)[fieldKey] || '';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title={pageTitle}
        resultCount={filteredApplications.length}
        showOriginalLabel={false}
        showBackButton={true}
        hideMenu={true}
      >
        <button
          style={{ padding: '8px 16px', background: '#16a085', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
          onClick={() => openWindow('/ship-asset-master', 'ShipAssetMasterWindow', WINDOW_SIZES.ASSET_MASTER)}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#138d75'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#16a085'; }}
        >
          資産マスタを別ウィンドウで開く
        </button>
        <button
          style={{ padding: '8px 16px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
          onClick={() => openWindow('/quotation-data-box', 'QuotationManagementWindow', WINDOW_SIZES.QUOTATION_MANAGEMENT)}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#7d3c98'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#8e44ad'; }}
        >
          見積管理を別ウィンドウで開く
        </button>
      </Header>

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {[
            { label: '棟', key: 'building', options: filterOptions.building },
            { label: '階', key: 'floor', options: filterOptions.floor },
            { label: '部門', key: 'department', options: filterOptions.department },
            { label: '部署', key: 'section', options: filterOptions.section },
            { label: 'Category', key: 'category', options: filterOptions.category },
            { label: '大分類', key: 'largeClass', options: filterOptions.largeClass },
            { label: '中分類', key: 'mediumClass', options: filterOptions.mediumClass },
          ].map(({ label, key, options }) => (
            <div key={key} style={{ flex: '1', minWidth: '120px' }}>
              <SearchableSelect
                label={label}
                value={filters[key as keyof typeof filters]}
                onChange={(value) => setFilters(prev => ({ ...prev, [key]: value }))}
                options={['', ...options]}
                placeholder="すべて"
                isMobile={isMobile}
              />
            </div>
          ))}
        </div>
      </div>

      {/* アクションバー */}
      <ApplicationTypeFilterBar
        selectedCount={selectedRows.size}
        currentFilter={filters.applicationType}
        onFilterChange={handleApplicationTypeFilter}
        onClearFilter={() => setFilters(prev => ({ ...prev, applicationType: '' }))}
      />

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ overflowX: 'auto', position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '2860px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', width: '50px', position: 'sticky', left: 0, background: '#f8f9fa', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>申請番号</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>申請日</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>申請種別</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>棟</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>階</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>部門</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>部署</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>諸室名</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '200px' }}>品目</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>メーカー</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>型式</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>数量</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>単位</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>現在の接続状況</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>現在の接続先</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '140px' }}>要望機器の接続要望</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>要望機器の接続先</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '200px' }}>申請理由・コメント等</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>執行年度</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積依頼No.</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>グループ名称</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>見積業者</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積金額</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>概算金額</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>編集カラム</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>編集カラム</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', width: '180px', position: 'sticky', right: 0, background: '#f8f9fa', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', zIndex: 10 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const isSelected = selectedRows.has(app.id);
                const badgeStyle = getTypeBadgeStyle(app.applicationType);

                return (
                  <tr
                    key={app.id}
                    style={{ borderBottom: '1px solid #dee2e6', background: isSelected ? '#e3f2fd' : 'white' }}
                  >
                    <td style={{ padding: '12px 8px', textAlign: 'center', position: 'sticky', left: 0, background: isSelected ? '#e3f2fd' : 'white', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 5 }}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleRowSelect(app.id)} />
                    </td>
                    <EditableCell
                      value={app.applicationNo}
                      fieldKey="applicationNo"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      style={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                    <EditableCell
                      value={app.applicationDate}
                      fieldKey="applicationDate"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.applicationType}
                      fieldKey="applicationType"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      type="select"
                      options={['新規申請', '増設申請', '更新申請', '移動申請', '廃棄申請', '保留']}
                    />
                    <EditableCell
                      value={app.facility.building}
                      fieldKey="facility.building"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.facility.floor}
                      fieldKey="facility.floor"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.facility.department}
                      fieldKey="facility.department"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.facility.section}
                      fieldKey="facility.section"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.roomName || ''}
                      fieldKey="roomName"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.asset.name}
                      fieldKey="asset.name"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.vendor}
                      fieldKey="vendor"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.asset.model}
                      fieldKey="asset.model"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.quantity || ''}
                      fieldKey="quantity"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.unit || ''}
                      fieldKey="unit"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.currentConnectionStatus || ''}
                      fieldKey="currentConnectionStatus"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      type="select"
                      options={['接続あり', '接続なし', 'スタンドアロン']}
                    />
                    <EditableCell
                      value={app.currentConnectionDestination || ''}
                      fieldKey="currentConnectionDestination"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.requestConnectionStatus || ''}
                      fieldKey="requestConnectionStatus"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      type="select"
                      options={['接続希望', '接続不要', 'スタンドアロン']}
                    />
                    <EditableCell
                      value={app.requestConnectionDestination || ''}
                      fieldKey="requestConnectionDestination"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.applicationReason || ''}
                      fieldKey="applicationReason"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.executionYear}
                      fieldKey="executionYear"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <td
                      style={{
                        padding: '12px 8px',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        background: !app.rfqNo ? '#fffbf0' : undefined,
                      }}
                      onDoubleClick={() => {
                        if (app.rfqNo) {
                          // 登録済みの場合は編集モードで開く
                          handleOpenRfqEditModal(app);
                        } else {
                          if (selectedRows.size > 0 && isSelected) {
                            // 複数選択されていて、この行も選択されている場合は一括登録
                            handleOpenRfqModal();
                          } else {
                            // 単一行の場合はこの行を選択してモーダルを開く
                            handleOpenRfqModal(app.id);
                          }
                        }
                      }}
                      title={app.rfqNo ? 'ダブルクリックで編集' : 'ダブルクリックで見積依頼No.を発行'}
                    >
                      {app.rfqNo || <span style={{ color: '#bdc3c7', fontSize: '12px' }}>未発行</span>}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {app.rfqGroupName || <span style={{ color: '#bdc3c7', fontSize: '12px' }}>-</span>}
                    </td>
                    <EditableCell
                      value={app.quotationVendor || ''}
                      fieldKey="quotationVendor"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.quotationAmount?.toString() || ''}
                      fieldKey="quotationAmount"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      style={{ textAlign: 'right', fontWeight: 600 }}
                    />
                    <EditableCell
                      value={app.estimatedAmount?.toString() || ''}
                      fieldKey="estimatedAmount"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                      style={{ textAlign: 'right' }}
                    />
                    <EditableCell
                      value={app.editColumn1 || ''}
                      fieldKey="editColumn1"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <EditableCell
                      value={app.editColumn2 || ''}
                      fieldKey="editColumn2"
                      applicationId={app.id}
                      isSelected={isSelected}
                      selectedCount={selectedRows.size}
                      onSave={handleCellSave}
                      onBulkEdit={handleOpenBulkEdit}
                    />
                    <td style={{ padding: '12px 8px', textAlign: 'center', position: 'sticky', right: 0, background: isSelected ? '#e3f2fd' : 'white', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {ORIGINAL_REGISTRATION_TYPES.includes(app.applicationType) && (
                          <button
                            onClick={(e) => handleOpenOriginalRegistrationModal(app, e)}
                            style={{
                              padding: '6px 12px',
                              background: app.originalRegistration ? '#27ae60' : '#f39c12',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = app.originalRegistration ? '#219a52' : '#d68910'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = app.originalRegistration ? '#27ae60' : '#f39c12'; }}
                          >
                            {app.originalRegistration ? '原本登録済' : '原本登録'}
                          </button>
                        )}
                        {DISPOSAL_EXECUTION_TYPES.includes(app.applicationType) && (
                          <button
                            onClick={(e) => handleOpenDisposalExecutionModal(app, e)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#e74c3c'; }}
                          >
                            廃棄執行
                          </button>
                        )}
                        {MOVEMENT_EXECUTION_TYPES.includes(app.applicationType) && (
                          <button
                            onClick={(e) => handleOpenMovementExecutionModal(app, e)}
                            style={{
                              padding: '6px 12px',
                              background: '#9b59b6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#8e44ad'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#9b59b6'; }}
                          >
                            移動執行
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRow(app.id)}
                          style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#e74c3c'; }}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d', fontSize: '16px' }}>
            申請データがありません
          </div>
        )}
      </div>

      {/* モーダル */}
      <RfqGroupModal
        show={showRfqModal}
        onClose={() => setShowRfqModal(false)}
        selectedCount={rfqModalMode === 'edit' ? applications.filter(app => app.rfqNo === editingRfqNo).length : selectedRows.size}
        rfqNo={rfqModalMode === 'edit' ? editingRfqNo : generateRfqNo()}
        rfqGroupName={rfqGroupName}
        onRfqGroupNameChange={setRfqGroupName}
        onSubmit={handleCreateRfqGroup}
        mode={rfqModalMode}
        onDelete={handleDeleteRfqGroup}
      />

      <BulkEditModal
        show={showBulkEditModal}
        fieldKey={bulkEditFieldKey}
        currentValue={bulkEditCurrentValue}
        selectedCount={selectedRows.size}
        onClose={() => setShowBulkEditModal(false)}
        onSubmit={handleBulkEditSubmit}
      />

      <OriginalRegistrationModal
        show={showOriginalRegistrationModal}
        onClose={() => setShowOriginalRegistrationModal(false)}
        application={originalRegistrationApplication}
        onSubmit={handleOriginalRegistrationSubmit}
        generateQrCodeNo={generateQrCodeNo}
      />

      <DisposalExecutionModal
        show={showDisposalExecutionModal}
        onClose={() => setShowDisposalExecutionModal(false)}
        application={disposalExecutionApplication}
        onSubmit={handleDisposalExecutionSubmit}
      />

      <MovementExecutionModal
        show={showMovementExecutionModal}
        onClose={() => setShowMovementExecutionModal(false)}
        application={movementExecutionApplication}
        onSubmit={handleMovementExecutionSubmit}
      />

    </div>
  );
}

export default function RemodelApplicationListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemodelApplicationListContent />
    </Suspense>
  );
}
