'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';

function RemodelApplicationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilities, assets } = useMasterStore();
  const { applications, updateApplication } = useApplicationStore();
  const { generateRfqNo, addRfqGroup } = useRfqGroupStore();
  const { quotationGroups, quotationItems, getQuotationItemsByGroupId } = useQuotationStore();
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
    applicationType: '', // 申請種別フィルター
    quotationStatus: '' // 見積紐付け状態フィルター: '' | '紐付け済み' | '未紐付け'
  });

  // 選択された行
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // 見積依頼グループ登録モーダル
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  // 見積紐付けモーダル
  const [showQuotationLinkModal, setShowQuotationLinkModal] = useState(false);
  const [linkingApplication, setLinkingApplication] = useState<Application | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);

  // 一括見積紐付けモーダル
  const [showBulkQuotationLinkModal, setShowBulkQuotationLinkModal] = useState(false);
  const [bulkSelectedQuotationId, setBulkSelectedQuotationId] = useState<number | null>(null);

  // フィルターoptionsを生成（施設マスタから）
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities]);

  // 資産マスタから分類オプションを生成
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assets.map(a => a.category)));
    return uniqueCategories.filter(Boolean) as string[];
  }, [assets]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assets.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean) as string[];
  }, [assets]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assets.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean) as string[];
  }, [assets]);

  // フィルタリングされた申請データ
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (filters.building) {
      filtered = filtered.filter(a => a.facility.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(a => a.facility.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(a => a.facility.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(a => a.facility.section === filters.section);
    }
    if (filters.applicationType) {
      filtered = filtered.filter(a => a.applicationType === filters.applicationType);
    }
    if (filters.quotationStatus) {
      if (filters.quotationStatus === '紐付け済み') {
        filtered = filtered.filter(a => a.quotationInfo && a.quotationInfo.length > 0);
      } else if (filters.quotationStatus === '未紐付け') {
        filtered = filtered.filter(a => !a.quotationInfo || a.quotationInfo.length === 0);
      }
    }
    // TODO: category, largeClass, mediumClassでもフィルタリングできるように
    // Application型に資産分類情報を追加する必要がある

    return filtered;
  }, [applications, filters]);

  // チェックボックスの全選択/全解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredApplications.map(app => app.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // 個別チェックボックス
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // 行削除
  const handleDeleteRow = (id: number) => {
    if (confirm('この申請を削除しますか？')) {
      const { deleteApplication } = useApplicationStore.getState();
      deleteApplication(id);
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 申請種別フィルターボタンのハンドラー
  const handleApplicationTypeFilter = (type: string) => {
    if (filters.applicationType === type) {
      // 既に選択されている場合は解除
      setFilters({...filters, applicationType: ''});
    } else {
      setFilters({...filters, applicationType: type});
    }
  };

  // 行クリック
  const handleRowClick = (app: Application) => {
    handleRowSelect(app.id);
  };

  // 選択項目の切り替え
  const handleSelectItem = (id: number) => {
    handleRowSelect(id);
  };

  // 見積依頼グループ登録モーダルを開く
  const handleOpenRfqModal = () => {
    if (selectedRows.size === 0) {
      alert('見積依頼グループに追加する申請を選択してください');
      return;
    }
    setShowRfqModal(true);
    setRfqGroupName('');
  };

  // 見積依頼グループ登録
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

    // 選択された申請にRFQ No.を設定
    const { updateApplication } = useApplicationStore.getState();
    selectedRows.forEach(id => {
      updateApplication(id, { rfqNo });
    });

    alert(`見積依頼グループを作成しました\n見積依頼No: ${rfqNo}`);
    setShowRfqModal(false);
    setRfqGroupName('');
    setSelectedRows(new Set());
  };

  // 見積紐付けモーダルを開く
  const handleOpenQuotationLinkModal = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkingApplication(app);
    setSelectedQuotationId(null);
    setShowQuotationLinkModal(true);
  };

  // 見積を紐付け
  const handleLinkQuotation = () => {
    if (!linkingApplication || selectedQuotationId === null) {
      alert('見積を選択してください');
      return;
    }

    const quotationGroup = quotationGroups.find(q => q.id === selectedQuotationId);
    if (!quotationGroup) {
      alert('見積が見つかりません');
      return;
    }

    // 見積明細の中で資産マスタが選択されているものを紐付け
    const allItems = getQuotationItemsByGroupId(quotationGroup.id);
    const linkedItems = allItems.filter(item => item.assetMasterId);

    if (linkedItems.length === 0) {
      alert('この見積には資産マスタが紐付けられた明細がありません');
      return;
    }

    // 申請に見積情報を追加
    const newQuotationInfo = linkedItems.map(item => {
      const assetMaster = assets.find(a => String(a.id) === String(item.assetMasterId));
      return {
        quotationId: quotationGroup.receivedQuotationNo,
        quotationDate: quotationGroup.quotationDate,
        vendor: quotationGroup.vendorName,
        ocrItemName: item.itemName,
        assetMaster: {
          itemId: assetMaster?.id || '',
          itemName: assetMaster?.item || '',
          largeName: assetMaster?.largeClass || '',
          mediumName: assetMaster?.mediumClass || ''
        },
        quantity: item.quantity || 0,
        unitPrice: item.sellingPriceUnit || 0,
        amount: item.sellingPriceTotal || 0
      };
    });

    const existingQuotationInfo = linkingApplication.quotationInfo || [];
    updateApplication(linkingApplication.id, {
      quotationInfo: [...existingQuotationInfo, ...newQuotationInfo]
    });

    alert(`見積を紐付けました\n見積No: ${quotationGroup.receivedQuotationNo}\n紐付け明細数: ${linkedItems.length}`);
    setShowQuotationLinkModal(false);
    setLinkingApplication(null);
    setSelectedQuotationId(null);
  };

  // 一括見積紐付けモーダルを開く
  const handleOpenBulkQuotationLinkModal = () => {
    if (selectedRows.size === 0) {
      alert('見積を紐付ける申請を選択してください');
      return;
    }
    setBulkSelectedQuotationId(null);
    setShowBulkQuotationLinkModal(true);
  };

  // 一括見積紐付け
  const handleBulkLinkQuotation = () => {
    if (bulkSelectedQuotationId === null) {
      alert('見積を選択してください');
      return;
    }

    const quotationGroup = quotationGroups.find(q => q.id === bulkSelectedQuotationId);
    if (!quotationGroup) {
      alert('見積が見つかりません');
      return;
    }

    // 見積明細の中で資産マスタが選択されているものを紐付け
    const allItems = getQuotationItemsByGroupId(quotationGroup.id);
    const linkedItems = allItems.filter(item => item.assetMasterId);

    if (linkedItems.length === 0) {
      alert('この見積には資産マスタが紐付けられた明細がありません');
      return;
    }

    // 選択された全申請に見積情報を追加
    let successCount = 0;
    selectedRows.forEach(appId => {
      const application = applications.find(a => a.id === appId);
      if (application) {
        const newQuotationInfo = linkedItems.map(item => {
          const assetMaster = assets.find(a => String(a.id) === String(item.assetMasterId));
          return {
            quotationId: quotationGroup.receivedQuotationNo,
            quotationDate: quotationGroup.quotationDate,
            vendor: quotationGroup.vendorName,
            ocrItemName: item.itemName,
            assetMaster: {
              itemId: assetMaster?.id || '',
              itemName: assetMaster?.item || '',
              largeName: assetMaster?.largeClass || '',
              mediumName: assetMaster?.mediumClass || ''
            },
            quantity: item.quantity || 0,
            unitPrice: item.sellingPriceUnit || 0,
            amount: item.sellingPriceTotal || 0
          };
        });

        const existingQuotationInfo = application.quotationInfo || [];
        updateApplication(appId, {
          quotationInfo: [...existingQuotationInfo, ...newQuotationInfo]
        });
        successCount++;
      }
    });

    alert(`見積を一括紐付けしました\n見積No: ${quotationGroup.receivedQuotationNo}\n紐付け申請数: ${successCount}件\n紐付け明細数: ${linkedItems.length}件/申請`);
    setShowBulkQuotationLinkModal(false);
    setBulkSelectedQuotationId(null);
    setSelectedRows(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title={pageTitle}
        resultCount={filteredApplications.length}
        showOriginalLabel={false}
        showBackButton={true}
        hideMenu={true}
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

          <div style={{ flex: '1', minWidth: '140px' }}>
            <SearchableSelect
              label="見積紐付け状態"
              value={filters.quotationStatus}
              onChange={(value) => setFilters({...filters, quotationStatus: value})}
              options={['', '紐付け済み', '未紐付け']}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* アクションバー（申請種別フィルター） */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>
          {selectedRows.size}件選択中
        </span>
        {selectedRows.size > 0 && (
          <>
            <button
              style={{
                padding: '8px 16px',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              onClick={handleOpenRfqModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2ecc71';
              }}
            >
              見積依頼グループ登録
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}
              onClick={handleOpenBulkQuotationLinkModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2980b9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3498db';
              }}
            >
              一括見積紐付け
            </button>
          </>
        )}
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '新規申請' ? '#1e8449' : '#27ae60',
            color: 'white',
            border: filters.applicationType === '新規申請' ? '2px solid #145a32' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '新規申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('新規申請')}
        >
          新規申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '増設申請' ? '#21618c' : '#3498db',
            color: 'white',
            border: filters.applicationType === '増設申請' ? '2px solid #1a4971' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '増設申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('増設申請')}
        >
          増設申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '更新申請' ? '#ba4a00' : '#e67e22',
            color: 'white',
            border: filters.applicationType === '更新申請' ? '2px solid #873600' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '更新申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('更新申請')}
        >
          更新申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '移動申請' ? '#6c3483' : '#9b59b6',
            color: 'white',
            border: filters.applicationType === '移動申請' ? '2px solid #512e5f' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '移動申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('移動申請')}
        >
          移動申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '廃棄申請' ? '#a93226' : '#e74c3c',
            color: 'white',
            border: filters.applicationType === '廃棄申請' ? '2px solid #78281f' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '廃棄申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('廃棄申請')}
        >
          廃棄申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '保留' ? '#626567' : '#95a5a6',
            color: 'white',
            border: filters.applicationType === '保留' ? '2px solid #424949' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '保留' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('保留')}
        >
          保留
        </button>
        {filters.applicationType && (
          <button
            style={{
              padding: '8px 16px',
              background: 'white',
              color: '#e74c3c',
              border: '1px solid #e74c3c',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
              marginLeft: '10px'
            }}
            onClick={() => setFilters({...filters, applicationType: ''})}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e74c3c';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#e74c3c';
            }}
          >
            🔄 クリア
          </button>
        )}
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  width: '50px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
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
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app) => (
              <tr
                key={app.id}
                style={{
                  borderBottom: '1px solid #dee2e6',
                  cursor: 'pointer',
                  background: selectedRows.has(app.id) ? '#e3f2fd' : 'white'
                }}
                onClick={() => handleRowClick(app)}
                onMouseEnter={(e) => {
                  if (!selectedRows.has(app.id)) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedRows.has(app.id)) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(app.id)}
                    onChange={() => handleSelectItem(app.id)}
                  />
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace', fontWeight: 600 }}>
                  {app.applicationNo}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.applicationDate}
                </td>
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: app.applicationType === '新規申請' ? '#e8f5e9' :
                               app.applicationType === '増設申請' ? '#e3f2fd' :
                               app.applicationType === '更新申請' ? '#fff3e0' :
                               app.applicationType === '移動申請' ? '#f3e5f5' :
                               app.applicationType === '廃棄申請' ? '#ffebee' : '#f5f5f5',
                    color: app.applicationType === '新規申請' ? '#2e7d32' :
                           app.applicationType === '増設申請' ? '#1565c0' :
                           app.applicationType === '更新申請' ? '#e65100' :
                           app.applicationType === '移動申請' ? '#6a1b9a' :
                           app.applicationType === '廃棄申請' ? '#c62828' : '#555'
                  }}>
                    {app.applicationType}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.building}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.facility.floor}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.department}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.section}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.roomName || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.asset.name}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.vendor}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.asset.model}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.quantity || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.unit || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.currentConnectionStatus || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.currentConnectionDestination || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.requestConnectionStatus || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.requestConnectionDestination || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.applicationReason || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.executionYear}
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {app.rfqNo || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                {/* 見積紐付け状態 */}
                <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {app.quotationInfo && app.quotationInfo.length > 0 ? (
                    <span style={{
                      padding: '4px 12px',
                      background: '#27ae60',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      紐付け済み ({app.quotationInfo.length})
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 12px',
                      background: '#95a5a6',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      未紐付け
                    </span>
                  )}
                </td>
                {/* 見積情報 */}
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.quotationInfo && app.quotationInfo.length > 0
                    ? app.quotationInfo.map(q => q.vendor).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')
                    : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                  {app.quotationInfo && app.quotationInfo.length > 0
                    ? `¥${app.quotationInfo.reduce((sum, q) => sum + q.amount, 0).toLocaleString()}`
                    : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.quotationInfo && app.quotationInfo.length > 0 && app.quotationInfo[0].assetMaster.largeName
                    ? app.quotationInfo[0].assetMaster.largeName
                    : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.quotationInfo && app.quotationInfo.length > 0 && app.quotationInfo[0].assetMaster.mediumName
                    ? app.quotationInfo[0].assetMaster.mediumName
                    : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                  {app.quotationInfo && app.quotationInfo.length > 0 && app.quotationInfo[0].assetMaster.itemName
                    ? app.quotationInfo[0].assetMaster.itemName
                    : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenQuotationLinkModal(app, e)}
                    style={{
                      padding: '6px 12px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2980b9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3498db';
                    }}
                  >
                    見積紐付け
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredApplications.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: '16px'
          }}>
            申請データがありません
          </div>
        )}
      </div>

      {/* 見積依頼グループ登録モーダル */}
      {showRfqModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowRfqModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              minWidth: '500px',
              maxWidth: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
              見積依頼グループ登録
            </h2>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #27ae60' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
                <strong>選択された申請:</strong> {selectedRows.size}件
              </p>
              <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                これらの申請をまとめて見積依頼グループとして登録します
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                見積依頼No.
              </label>
              <input
                type="text"
                value={generateRfqNo()}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#f5f5f5',
                  color: '#555',
                  fontFamily: 'monospace',
                  fontWeight: 'bold'
                }}
              />
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                ※自動採番されます
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                見積依頼グループ名称 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                value={rfqGroupName}
                onChange={(e) => setRfqGroupName(e.target.value)}
                placeholder="例: 2025年度リモデル第1期"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => setShowRfqModal(false)}
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
                style={{
                  padding: '10px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={handleCreateRfqGroup}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#229954';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#27ae60';
                }}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 見積紐付けモーダル */}
      {showQuotationLinkModal && linkingApplication && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQuotationLinkModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              minWidth: '700px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
              見積紐付け
            </h2>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #3498db' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
                <strong>申請番号:</strong> {linkingApplication.applicationNo}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
                <strong>品目:</strong> {linkingApplication.asset.name}
              </p>
              <p style={{ margin: '0', fontSize: '14px', color: '#2c3e50' }}>
                <strong>申請種別:</strong> {linkingApplication.applicationType}
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                見積を選択 <span style={{ color: '#e74c3c' }}>*</span>
              </label>

              {quotationGroups.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#7f8c8d'
                }}>
                  登録された見積がありません
                </div>
              ) : (
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                  {quotationGroups.map((quotationGroup) => {
                    const items = getQuotationItemsByGroupId(quotationGroup.id);
                    const linkedItemsCount = items.filter(item => item.assetMasterId).length;
                    const isSelected = selectedQuotationId === quotationGroup.id;

                    return (
                      <div
                        key={quotationGroup.id}
                        onClick={() => setSelectedQuotationId(quotationGroup.id)}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #ddd',
                          cursor: 'pointer',
                          background: isSelected ? '#e3f2fd' : 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => setSelectedQuotationId(quotationGroup.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 'bold', color: '#2c3e50', fontFamily: 'monospace' }}>
                              {quotationGroup.receivedQuotationNo}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: quotationGroup.phase === '定価見積' ? '#e8f5e9' :
                                         quotationGroup.phase === '概算見積' ? '#fff3e0' : '#e3f2fd',
                              color: quotationGroup.phase === '定価見積' ? '#2e7d32' :
                                     quotationGroup.phase === '概算見積' ? '#e65100' : '#1565c0',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {quotationGroup.phase}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#555', marginLeft: '24px' }}>
                            <div>業者: {quotationGroup.vendorName}</div>
                            <div>見積日: {quotationGroup.quotationDate}</div>
                            <div>
                              資産マスタ紐付け: {linkedItemsCount}件 / {items.length}明細
                              {linkedItemsCount === 0 && (
                                <span style={{ color: '#e74c3c', marginLeft: '10px', fontWeight: 'bold' }}>
                                  ※紐付けされた明細がありません
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                            ¥{quotationGroup.totalAmount?.toLocaleString() || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => setShowQuotationLinkModal(false)}
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
                style={{
                  padding: '10px 24px',
                  background: selectedQuotationId !== null ? '#3498db' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedQuotationId !== null ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={handleLinkQuotation}
                disabled={selectedQuotationId === null}
                onMouseEnter={(e) => {
                  if (selectedQuotationId !== null) {
                    e.currentTarget.style.background = '#2980b9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedQuotationId !== null) {
                    e.currentTarget.style.background = '#3498db';
                  }
                }}
              >
                紐付け
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括見積紐付けモーダル */}
      {showBulkQuotationLinkModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowBulkQuotationLinkModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              minWidth: '700px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
              一括見積紐付け
            </h2>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #3498db' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
                <strong>選択された申請:</strong> {selectedRows.size}件
              </p>
              <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                選択された全ての申請に同じ見積を紐付けます
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                見積を選択 <span style={{ color: '#e74c3c' }}>*</span>
              </label>

              {quotationGroups.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#7f8c8d'
                }}>
                  登録された見積がありません
                </div>
              ) : (
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                  {quotationGroups.map((quotationGroup) => {
                    const items = getQuotationItemsByGroupId(quotationGroup.id);
                    const linkedItemsCount = items.filter(item => item.assetMasterId).length;
                    const isSelected = bulkSelectedQuotationId === quotationGroup.id;

                    return (
                      <div
                        key={quotationGroup.id}
                        onClick={() => setBulkSelectedQuotationId(quotationGroup.id)}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #ddd',
                          cursor: 'pointer',
                          background: isSelected ? '#e3f2fd' : 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => setBulkSelectedQuotationId(quotationGroup.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 'bold', color: '#2c3e50', fontFamily: 'monospace' }}>
                              {quotationGroup.receivedQuotationNo}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: quotationGroup.phase === '定価見積' ? '#e8f5e9' :
                                         quotationGroup.phase === '概算見積' ? '#fff3e0' : '#e3f2fd',
                              color: quotationGroup.phase === '定価見積' ? '#2e7d32' :
                                     quotationGroup.phase === '概算見積' ? '#e65100' : '#1565c0',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {quotationGroup.phase}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#555', marginLeft: '24px' }}>
                            <div>業者: {quotationGroup.vendorName}</div>
                            <div>見積日: {quotationGroup.quotationDate}</div>
                            <div>
                              資産マスタ紐付け: {linkedItemsCount}件 / {items.length}明細
                              {linkedItemsCount === 0 && (
                                <span style={{ color: '#e74c3c', marginLeft: '10px', fontWeight: 'bold' }}>
                                  ※紐付けされた明細がありません
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                            ¥{quotationGroup.totalAmount?.toLocaleString() || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => setShowBulkQuotationLinkModal(false)}
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
                style={{
                  padding: '10px 24px',
                  background: bulkSelectedQuotationId !== null ? '#3498db' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: bulkSelectedQuotationId !== null ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={handleBulkLinkQuotation}
                disabled={bulkSelectedQuotationId === null}
                onMouseEnter={(e) => {
                  if (bulkSelectedQuotationId !== null) {
                    e.currentTarget.style.background = '#2980b9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (bulkSelectedQuotationId !== null) {
                    e.currentTarget.style.background = '#3498db';
                  }
                }}
              >
                一括紐付け
              </button>
            </div>
          </div>
        </div>
      )}
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
