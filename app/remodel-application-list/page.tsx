'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { Application, OriginalRegistration } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';
import {
  RfqGroupModal,
  QuotationLinkModal,
  ApplicationTypeFilterBar,
  OriginalRegistrationModal,
} from './components';
import { APPLICATION_TYPE_BADGE_STYLES, WINDOW_SIZES } from './constants';

// 原本登録対象の申請種別
const ORIGINAL_REGISTRATION_TYPES = ['新規申請', '更新申請', '増設申請'];

function RemodelApplicationListContent() {
  const searchParams = useSearchParams();
  const { facilities, assets } = useMasterStore();
  const { applications, updateApplication, deleteApplication } = useApplicationStore();
  const { generateRfqNo, addRfqGroup } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
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
    applicationType: '',
    quotationStatus: ''
  });

  // 選択された行
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // 見積依頼グループ登録モーダル
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  // 見積紐付けモーダル
  const [showQuotationLinkModal, setShowQuotationLinkModal] = useState(false);
  const [linkingApplication, setLinkingApplication] = useState<Application | null>(null);
  const [selectedQuotationItemId, setSelectedQuotationItemId] = useState<number | null>(null);

  // 原本登録モーダル
  const [showOriginalRegistrationModal, setShowOriginalRegistrationModal] = useState(false);
  const [originalRegistrationApplication, setOriginalRegistrationApplication] = useState<Application | null>(null);

  // QRコードNo.採番カウンター（実際にはstoreやDBで管理）
  const [qrCodeCounter, setQrCodeCounter] = useState(1);


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
      if (filters.quotationStatus === '紐付け済み' && (!app.quotationInfo || app.quotationInfo.length === 0)) return false;
      if (filters.quotationStatus === '未紐付け' && app.quotationInfo && app.quotationInfo.length > 0) return false;
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

  // 見積依頼グループ登録
  const handleOpenRfqModal = (appId?: number) => {
    if (selectedRows.size === 0 && appId) {
      setSelectedRows(new Set([appId]));
    }
    if (selectedRows.size === 0 && !appId) {
      alert('見積依頼グループに追加する申請を選択してください');
      return;
    }
    setShowRfqModal(true);
    setRfqGroupName('');
  };

  const handleCreateRfqGroup = () => {
    if (!rfqGroupName.trim()) {
      alert('見積依頼グループ名称を入力してください');
      return;
    }

    const rfqNo = generateRfqNo();
    const today = new Date();
    const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    addRfqGroup({
      rfqNo,
      groupName: rfqGroupName,
      createdDate,
      applicationIds: Array.from(selectedRows),
      status: '未送信'
    });

    selectedRows.forEach(id => {
      updateApplication(id, { rfqNo, rfqGroupName });
    });

    alert(`見積依頼グループを作成しました\n見積依頼No: ${rfqNo}\nグループ名称: ${rfqGroupName}\n登録件数: ${selectedRows.size}件`);
    setShowRfqModal(false);
    setRfqGroupName('');
    setSelectedRows(new Set());
  };

  // 見積紐付け
  const handleOpenQuotationLinkModal = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkingApplication(app);
    setSelectedQuotationItemId(null);
    setShowQuotationLinkModal(true);
  };

  const handleLinkQuotation = () => {
    if (!linkingApplication || selectedQuotationItemId === null) {
      alert('見積明細を選択してください');
      return;
    }

    const selectedItem = quotationItems.find(item => item.id === selectedQuotationItemId);
    if (!selectedItem) {
      alert('見積明細が見つかりません');
      return;
    }

    const group = quotationGroups.find(g => g.id === selectedItem.quotationGroupId);
    const assetMaster = selectedItem.assetMasterId ? assets.find(a => a.id === selectedItem.assetMasterId) : null;

    const quotationInfo = [{
      quotationId: selectedItem.receivedQuotationNo,
      quotationDate: group?.quotationDate || '',
      vendor: group?.vendorName || '',
      ocrItemName: selectedItem.itemName,
      assetMaster: assetMaster ? {
        itemId: String(assetMaster.id),
        itemName: assetMaster.item || '',
        largeName: assetMaster.largeClass || '',
        mediumName: assetMaster.mediumClass || ''
      } : { itemId: '', itemName: '', largeName: '', mediumName: '' },
      quantity: selectedItem.quantity || 0,
      unitPrice: selectedItem.sellingPriceUnit || 0,
      amount: selectedItem.sellingPriceTotal || 0
    }];

    updateApplication(linkingApplication.id, { quotationInfo });
    alert(`見積を紐付けました\n見積番号: ${selectedItem.receivedQuotationNo}`);
    setShowQuotationLinkModal(false);
    setLinkingApplication(null);
    setSelectedQuotationItemId(null);
  };

  // 別ウィンドウで開く
  const openWindow = (url: string, name: string, size: { width: number; height: number }) => {
    const left = (window.screen.width - size.width) / 2;
    const top = (window.screen.height - size.height) / 2;
    window.open(url, name, `width=${size.width},height=${size.height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
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

  // 原本登録を確定
  const handleOriginalRegistrationSubmit = (applicationId: number, registration: OriginalRegistration) => {
    updateApplication(applicationId, { originalRegistration: registration });
    setQrCodeCounter(prev => prev + 1);
    alert(`原本登録が完了しました\nQRコードNo: ${registration.qrCodeNo}`);
  };

  // 申請種別バッジスタイル取得
  const getTypeBadgeStyle = (type: string) => {
    return APPLICATION_TYPE_BADGE_STYLES[type as keyof typeof APPLICATION_TYPE_BADGE_STYLES] || { background: '#f5f5f5', color: '#555' };
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
          <div style={{ flex: '1', minWidth: '140px' }}>
            <SearchableSelect
              label="見積紐付け状態"
              value={filters.quotationStatus}
              onChange={(value) => setFilters(prev => ({ ...prev, quotationStatus: value }))}
              options={['', '紐付け済み', '未紐付け']}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
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
          <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '3500px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '50px' }}>
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
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>グループ</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積依頼No.</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>グループ名称</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積紐付け状態</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>見積業者</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積金額</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>大分類</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>中分類</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '180px' }}>品目</th>
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
                    style={{ borderBottom: '1px solid #dee2e6', cursor: 'pointer', background: isSelected ? '#e3f2fd' : 'white' }}
                    onClick={() => handleRowSelect(app.id)}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                  >
                    <td style={{ padding: '12px 8px' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleRowSelect(app.id)} />
                    </td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{app.applicationNo}</td>
                    <td style={{ padding: '12px 8px' }}>{app.applicationDate}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, ...badgeStyle }}>
                        {app.applicationType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.facility.building}</td>
                    <td style={{ padding: '12px 8px' }}>{app.facility.floor}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.facility.department}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.facility.section}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.roomName || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.asset.name}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.vendor}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.asset.model}</td>
                    <td style={{ padding: '12px 8px' }}>{app.quantity || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{app.unit || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.currentConnectionStatus || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.currentConnectionDestination || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.requestConnectionStatus || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.requestConnectionDestination || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.applicationReason || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{app.executionYear}</td>
                    <td style={{ padding: '12px 8px', color: '#7f8c8d' }}>-</td>
                    <td
                      style={{ padding: '12px 8px', color: app.rfqNo ? '#2c3e50' : '#3498db', fontFamily: 'monospace', cursor: selectedRows.size > 0 ? 'pointer' : 'default', textDecoration: selectedRows.size > 0 && !app.rfqNo ? 'underline' : 'none' }}
                      onClick={(e) => { e.stopPropagation(); if (selectedRows.size > 0) handleOpenRfqModal(app.id); }}
                      title={selectedRows.size > 0 ? 'クリックして見積依頼グループを登録' : 'チェックボックスを選択してからクリック'}
                    >
                      {app.rfqNo || (selectedRows.size > 0 ? '+ 登録' : '-')}
                    </td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.rfqGroupName || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {app.quotationInfo && app.quotationInfo.length > 0 ? (
                        <span style={{ padding: '4px 12px', background: '#27ae60', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>紐付け済み</span>
                      ) : (
                        <span style={{ padding: '4px 12px', background: '#95a5a6', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>未紐付け</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.quotationInfo?.map(q => q.vendor).filter((v, i, arr) => arr.indexOf(v) === i).join(', ') || '-'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                      {app.quotationInfo?.length ? `¥${app.quotationInfo.reduce((sum, q) => sum + q.amount, 0).toLocaleString()}` : '-'}
                    </td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.quotationInfo?.[0]?.assetMaster.largeName || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.quotationInfo?.[0]?.assetMaster.mediumName || '-'}</td>
                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{app.quotationInfo?.[0]?.assetMaster.itemName || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#7f8c8d' }}>-</td>
                    <td style={{ padding: '12px 8px', color: '#7f8c8d' }}>-</td>
                    <td style={{ padding: '12px 8px', color: '#7f8c8d' }}>-</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', position: 'sticky', right: 0, background: isSelected ? '#e3f2fd' : 'white', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={(e) => handleOpenQuotationLinkModal(app, e)}
                          style={{ padding: '6px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#2980b9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#3498db'; }}
                        >
                          見積紐付け
                        </button>
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
        selectedCount={selectedRows.size}
        rfqNo={generateRfqNo()}
        rfqGroupName={rfqGroupName}
        onRfqGroupNameChange={setRfqGroupName}
        onSubmit={handleCreateRfqGroup}
      />

      <QuotationLinkModal
        show={showQuotationLinkModal}
        onClose={() => setShowQuotationLinkModal(false)}
        linkingApplication={linkingApplication}
        quotationItems={quotationItems}
        quotationGroups={quotationGroups}
        assets={assets}
        selectedQuotationItemId={selectedQuotationItemId}
        onSelectQuotationItem={setSelectedQuotationItemId}
        onSubmit={handleLinkQuotation}
      />

      <OriginalRegistrationModal
        show={showOriginalRegistrationModal}
        onClose={() => setShowOriginalRegistrationModal(false)}
        application={originalRegistrationApplication}
        onSubmit={handleOriginalRegistrationSubmit}
        generateQrCodeNo={generateQrCodeNo}
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
