'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useEditListStore, useApplicationStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { useRepairRequestStore } from '@/lib/stores/repairRequestStore';
import { generateMockAssets } from '@/lib/data/generateMockAssets';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

export default function MainPage() {
  const router = useRouter();
  const { user, logout, selectedFacility } = useAuthStore();
  useMasterStore();
  const { editLists, addEditList, deleteEditList } = useEditListStore();
  const { isMobile, isTablet } = useResponsive();
  const { showToast } = useToast();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isHospitalMasterModalOpen, setIsHospitalMasterModalOpen] = useState(false);
  const [isLendingMenuModalOpen, setIsLendingMenuModalOpen] = useState(false);
  const [isApplicationStatusModalOpen, setIsApplicationStatusModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // 編集リスト関連のstate
  const [editListMode, setEditListMode] = useState<'select' | 'create'>('select');
  const [newEditListName, setNewEditListName] = useState('');

  // 削除確認ダイアログ用のstate
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetList, setDeleteTargetList] = useState<{ id: string; name: string } | null>(null);

  // モーダル表示中のbodyスクロールロック
  const isAnyModalOpen = isListModalOpen || isMasterModalOpen || isEditListModalOpen || isHospitalMasterModalOpen || isLendingMenuModalOpen || isApplicationStatusModalOpen || isLogoutConfirmOpen || deleteConfirmOpen;
  useBodyScrollLock(isAnyModalOpen);

  // 権限フック
  const {
    isAdmin,
    isShipUser,
    isHospitalUser,
    isFacilityAdmin,
    isMainButtonVisible,
    canAccess,
  } = usePermissions();

  // ユーザーの所属部署
  const userDepartment = user?.department || '未設定';

  // 各ストアからデータ取得
  const { applications: purchaseApps } = usePurchaseApplicationStore();
  const { applications: generalApps } = useApplicationStore();
  const { requests: repairRequests } = useRepairRequestStore();

  // 統合された申請リスト型
  interface UnifiedApplication {
    id: string;
    applicationNo: string;
    applicationType: string;
    itemName: string;
    status: string;
    applicationDate: string;
    deadline?: string;
  }

  // 統合申請リスト（ユーザーの所属部署でフィルタ）
  const unifiedApplications = useMemo((): UnifiedApplication[] => {
    const result: UnifiedApplication[] = [];

    // PurchaseApplication（新規/更新/増設）
    purchaseApps
      .filter(app => app.applicantDepartment === userDepartment)
      .forEach(app => {
        result.push({
          id: app.id,
          applicationNo: app.applicationNo,
          applicationType: app.applicationType,
          itemName: app.assets[0]?.name || '-',
          status: app.status,
          applicationDate: app.applicationDate,
          deadline: app.desiredDeliveryDate,
        });
      });

    // Application（移動/廃棄）※部門フィルタはfacility.departmentを使用
    generalApps
      .filter(app =>
        (app.applicationType === '移動申請' || app.applicationType === '廃棄申請') &&
        app.facility.department === userDepartment
      )
      .forEach(app => {
        result.push({
          id: String(app.id),
          applicationNo: app.applicationNo,
          applicationType: app.applicationType,
          itemName: app.asset.name,
          status: app.status,
          applicationDate: app.applicationDate,
          deadline: undefined,
        });
      });

    // RepairRequest（修理）
    repairRequests
      .filter(req => req.applicantDepartment === userDepartment)
      .forEach(req => {
        result.push({
          id: req.id,
          applicationNo: req.requestNo,
          applicationType: '修理申請',
          itemName: req.itemName,
          status: req.status,
          applicationDate: req.requestDate,
          deadline: req.deliveryDate,
        });
      });

    // 申請日降順でソート
    return result.sort((a, b) =>
      new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
    );
  }, [purchaseApps, generalApps, repairRequests, userDepartment]);

  // ステータスのバッジスタイル取得
  const getStatusBadgeStyle = (status: string): { bg: string; text: string } => {
    const styles: Record<string, { bg: string; text: string }> = {
      '申請中': { bg: 'bg-amber-100', text: 'text-amber-800' },
      '編集中': { bg: 'bg-sky-100', text: 'text-sky-800' },
      '見積中': { bg: 'bg-purple-100', text: 'text-purple-800' },
      '発注済': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      '検収済': { bg: 'bg-teal-100', text: 'text-teal-800' },
      '完了': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      '却下': { bg: 'bg-red-100', text: 'text-red-800' },
      '承認待ち': { bg: 'bg-amber-100', text: 'text-amber-800' },
      '承認済み': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      '見積依頼中': { bg: 'bg-purple-100', text: 'text-purple-800' },
      '受付': { bg: 'bg-orange-100', text: 'text-orange-800' },
      '依頼済': { bg: 'bg-sky-100', text: 'text-sky-800' },
      '引取済': { bg: 'bg-purple-100', text: 'text-purple-800' },
      '修理中': { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    return styles[status] || { bg: 'bg-slate-100', text: 'text-slate-800' };
  };

  // 申請種別のバッジスタイル取得
  const getTypeBadgeStyle = (type: string): { bg: string; text: string } => {
    const styles: Record<string, { bg: string; text: string }> = {
      '新規申請': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      '更新申請': { bg: 'bg-sky-100', text: 'text-sky-800' },
      '増設申請': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      '移動申請': { bg: 'bg-amber-100', text: 'text-amber-800' },
      '廃棄申請': { bg: 'bg-red-100', text: 'text-red-800' },
      '修理申請': { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    return styles[type] || { bg: 'bg-slate-100', text: 'text-slate-800' };
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    router.push('/login');
  };

  const handleQRRead = () => {
    showToast('QR読取機能（開発中）', 'info');
  };

  const handleEditListManagement = () => {
    setIsEditListModalOpen(true);
    setEditListMode('select');
    setIsMobileMenuOpen(false);
  };

  const closeEditListModal = () => {
    setIsEditListModalOpen(false);
    setEditListMode('select');
    setNewEditListName('');
  };

  const handleCreateEditList = () => {
    if (!newEditListName.trim()) {
      showToast('編集リスト名を入力してください', 'warning');
      return;
    }
    if (!selectedFacility) {
      showToast('施設が選択されていません', 'warning');
      return;
    }

    const baseAssets = generateMockAssets([selectedFacility]);
    addEditList({
      name: newEditListName.trim(),
      facilities: [selectedFacility],
      baseAssets,
    });

    showToast(`編集リスト「${newEditListName.trim()}」を作成しました`, 'success');
    closeEditListModal();
  };

  const handleSelectEditList = (listId: string) => {
    const params = new URLSearchParams({
      listId: listId,
    });
    router.push(`/remodel-application?${params.toString()}`);
    closeEditListModal();
  };

  const handleQuotationManagement = () => {
    setIsMobileMenuOpen(false);
    router.push('/quotation-data-box');
  };

  const showMasterModal = () => {
    setIsMobileMenuOpen(false);
    setIsMasterModalOpen(true);
  };

  const closeMasterModal = () => {
    setIsMasterModalOpen(false);
  };

  const showListModal = () => {
    setIsListModalOpen(true);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
  };

  const handleMenuSelect = (menuName: string) => {
    closeListModal();

    switch (menuName) {
      case 'QRコード発行':
        router.push('/qr-issue');
        break;
      case '現有品調査':
        router.push('/offline-prep');
        break;
      case '現有品調査内容修正':
        router.push('/registration-edit');
        break;
      case '資産台帳取込':
        router.push('/asset-import');
        break;
      case 'データ突合':
        router.push('/data-matching');
        break;
    }
  };

  const handleQRIssueFromModal = () => {
    setIsMobileMenuOpen(false);
    router.push('/qr-issue');
  };

  const handleAssetBrowseAndApplication = () => {
    router.push('/asset-search-result');
  };

  const handleMaintenanceInspection = () => {
    router.push('/inspection-prep');
  };

  const handleLendingManagement = () => {
    setIsLendingMenuModalOpen(true);
  };

  const handleRepairApplication = () => {
    router.push('/repair-request');
  };

  const handleAssetListForHospital = () => {
    router.push('/asset-search-result');
  };

  const handleAvailableDevices = () => {
    setIsLendingMenuModalOpen(false);
    router.push('/lending-available');
  };

  const handleLendingCheckout = () => {
    setIsLendingMenuModalOpen(false);
    router.push('/lending-checkout');
  };

  const handleApplicationStatus = () => {
    setIsApplicationStatusModalOpen(true);
  };

  const handleDeleteEditList = (list: { id: string; name: string }) => {
    setDeleteTargetList(list);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEditList = () => {
    if (deleteTargetList) {
      deleteEditList(deleteTargetList.id);
      showToast(`「${deleteTargetList.name}」を削除しました`, 'success');
      setDeleteTargetList(null);
    }
  };

  // ヘッダーナビアイテムのスタイル
  const navItemClass = 'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#1f2937] hover:bg-[#f3f4f6] rounded-md transition-colors cursor-pointer border-0 bg-transparent';
  const navIconClass = 'size-4 text-[#6b7280]';

  // ヘッダーナビアイテムの構築
  const headerNavItems = useMemo(() => {
    const items: { key: string; label: string; icon: string; onClick: () => void; visible: boolean }[] = [
      { key: 'qr', label: 'QR読取', icon: 'qr', onClick: handleQRRead, visible: isShipUser },
      { key: 'editList', label: '編集リスト', icon: 'list', onClick: handleEditListManagement, visible: isMainButtonVisible('edit_list') },
      { key: 'taskMgmt', label: 'タスク管理', icon: 'clipboard', onClick: handleQuotationManagement, visible: canAccess('normal_purchase') },
      { key: 'quotation', label: '見積管理', icon: 'clipboard', onClick: () => router.push('/quotation-management'), visible: isMainButtonVisible('quotation_management') },
      { key: 'qrIssue', label: 'QRコード発行', icon: 'qr', onClick: handleQRIssueFromModal, visible: isHospitalUser && canAccess('qr_issue') },
      { key: 'master', label: 'マスタ管理', icon: 'user', onClick: isShipUser ? showMasterModal : () => { setIsMobileMenuOpen(false); setIsHospitalMasterModalOpen(true); }, visible: isMainButtonVisible('master_management') },
    ];
    return items.filter(item => item.visible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShipUser, isHospitalUser, isAdmin, canAccess, isMainButtonVisible]);

  // SVGアイコンコンポーネント
  const NavIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'qr':
        return (
          <svg className={navIconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h1a1 1 0 110 2h-2a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM13 11a1 1 0 100 2h3a1 1 0 100-2h-3zM15 13a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
          </svg>
        );
      case 'list':
        return (
          <svg className={navIconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg className={navIconClass} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'user':
        return (
          <svg className={navIconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9fafb] p-5">
      <div className="max-w-[1400px] mx-auto bg-white rounded-lg shadow-lg w-full flex flex-col">
        {/* ヘッダー */}
        <header className="bg-white border-b border-[#e5e7eb] px-5 py-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            {/* 左: ロゴ + タイトル */}
            <div className="flex items-center gap-2.5">
              <div className="size-10 bg-[#27ae60] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">
                logo
              </div>
              {!isMobile && (
                <div className="text-lg font-bold text-[#1f2937] text-balance">
                  HEALTHCARE 医療機器管理システム
                </div>
              )}
            </div>

            {/* PC/タブレット: ナビゲーション */}
            {!isMobile && (
              <div className="flex items-center gap-0.5">
                {/* 施設バッジ */}
                {selectedFacility && user?.accessibleFacilities && (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                      {selectedFacility}
                    </span>
                    <button
                      onClick={() => router.push('/facility-select')}
                      className="px-2 py-1 text-xs text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f3f4f6] rounded border-0 bg-transparent cursor-pointer transition-colors"
                    >
                      施設切替
                    </button>
                  </div>
                )}

                {/* ナビアイテム */}
                {headerNavItems.map(item => (
                  <button key={item.key} onClick={item.onClick} className={navItemClass}>
                    <NavIcon type={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}

                {/* ユーティリティアイコン */}
                <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-[#e5e7eb]">
                  <button
                    className="size-9 flex items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                    aria-label="ユーザー情報"
                    title={user?.username || ''}
                  >
                    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="size-9 flex items-center justify-center rounded-md text-[#6b7280] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent"
                    aria-label="ログアウト"
                  >
                    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H7a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 11-2 0V7.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* スマートフォン: ハンバーガーメニュー */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="size-10 flex items-center justify-center rounded-md text-[#1f2937] hover:bg-[#f3f4f6] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="メニュー"
              >
                {isMobileMenuOpen ? (
                  <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* スマートフォン: 展開メニュー */}
          {isMobile && isMobileMenuOpen && (
            <div className="mt-3 pt-3 border-t border-[#e5e7eb] flex flex-col gap-1">
              {/* 施設バッジ */}
              {selectedFacility && user?.accessibleFacilities && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                    {selectedFacility}
                  </span>
                  <button
                    onClick={() => router.push('/facility-select')}
                    className="text-xs text-[#6b7280] hover:text-[#1f2937] border-0 bg-transparent cursor-pointer"
                  >
                    施設切替
                  </button>
                </div>
              )}

              {headerNavItems.map(item => (
                <button key={item.key} onClick={item.onClick} className={navItemClass}>
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="border-t border-[#e5e7eb] mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent w-full"
                >
                  <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H7a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 11-2 0V7.414z" clipRule="evenodd" />
                  </svg>
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* メニューセクション */}
        <div className={`bg-white ${isMobile ? 'px-4 py-5' : isTablet ? 'px-5 py-6' : 'px-8 py-10'}`}>
          <div className={`max-w-[1000px] mx-auto ${
            isMobile
              ? 'flex flex-col gap-3'
              : isTablet
                ? 'grid grid-cols-3 gap-3'
                : 'flex flex-wrap justify-center gap-3'
          }`}>
            {/* 資産リスト（全ロール） */}
            {isMainButtonVisible('asset_list') && (
              <button
                onClick={isHospitalUser ? handleAssetListForHospital : handleAssetBrowseAndApplication}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                {isHospitalUser ? '資産リスト（各種申請）' : '資産閲覧・申請'}
              </button>
            )}

            {/* 保守・点検 */}
            {isMainButtonVisible('maintenance_inspection') && (
              <button
                onClick={handleMaintenanceInspection}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                保守・点検
              </button>
            )}

            {/* 貸出管理/貸出 */}
            {isMainButtonVisible('lending_management') && (
              <button
                onClick={isHospitalUser ? () => setIsLendingMenuModalOpen(true) : handleLendingManagement}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                {isHospitalUser ? '貸出' : '貸出管理'}
              </button>
            )}

            {/* 棚卸し */}
            {isMainButtonVisible('inventory') && (
              <button
                onClick={() => router.push('/inventory')}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                棚卸し
              </button>
            )}

            {/* 修理申請 */}
            {isMainButtonVisible('repair_request') && (
              <button
                onClick={handleRepairApplication}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                修理申請
              </button>
            )}

            {/* 申請ステータス（病院側のみ） */}
            {isHospitalUser && (
              <button
                onClick={handleApplicationStatus}
                className={`bg-white border-2 border-[#27ae60] rounded-lg font-semibold text-[#1f2937] cursor-pointer transition-all hover:bg-[#27ae60] hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-[15px]'
                }`}
              >
                申請ステータス
              </button>
            )}
          </div>
        </div>

        {/* ダッシュボードボディ（次スコープ用） */}
        <div className="px-5 py-10 min-h-[300px] flex items-center justify-center flex-1">
          <div className="text-center text-[#6b7280] text-base p-10 bg-white border-2 border-dashed border-[#d1d5db] rounded-lg max-w-[600px] mx-auto">
            <p className="text-pretty">※ ダッシュボード機能は次スコープで実装予定です</p>
          </div>
        </div>

        {/* フッター */}
        <footer className="text-center text-xs text-[#9ca3af] py-4 border-t border-[#e5e7eb]">
          &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
        </footer>
      </div>

      {/* 個体管理リスト作成モーダル */}
      {isListModalOpen && (
        <div
          onClick={closeListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-[90%] max-w-[500px] shadow-xl overflow-hidden"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="m-0 text-lg font-semibold text-[#1f2937] text-balance">個体管理リスト作成</h2>
              <button
                onClick={closeListModal}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* 施設選択 */}
            <div className="px-6 pt-5">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">施設選択</label>
              {selectedFacility && (
                <div className="px-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-md text-sm text-[#1f2937]">
                  {selectedFacility}
                </div>
              )}
            </div>

            {/* メニューボタン */}
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {['ラベル発行', '現有品調査', '現有品調査内容修正', '資産台帳取込', 'データ突合'].map((label) => {
                  const menuMap: Record<string, string> = {
                    'ラベル発行': 'QRコード発行',
                    '現有品調査': '現有品調査',
                    '現有品調査内容修正': '現有品調査内容修正',
                    '資産台帳取込': '資産台帳取込',
                    'データ突合': 'データ突合',
                  };
                  return (
                    <button
                      key={label}
                      onClick={() => handleMenuSelect(menuMap[label])}
                      className="px-4 py-3 bg-white border border-[#d1d5db] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer transition-all hover:border-[#27ae60] hover:bg-[#f0fdf4]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* マスタ管理モーダル */}
      {isMasterModalOpen && (
        <div
          onClick={closeMasterModal}
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-full max-w-[460px] max-h-[80vh] flex flex-col shadow-xl"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-[#e5e7eb] flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-[#1f2937] text-balance">マスタ管理</h2>
              <button
                onClick={closeMasterModal}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="px-6 pt-4 pb-6 overflow-y-auto overscroll-contain">
              <p className="text-sm text-[#6b7280] mb-4 text-pretty">マスタ管理と各種リスト管理を行えます</p>
              <div className="flex flex-col gap-2">
                {/* SHIP施設マスタ */}
                {canAccess('facility_master_list') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/ship-facility-master'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    SHIP施設マスタ
                  </button>
                )}

                {/* SHIP資産マスタ */}
                {canAccess('asset_master_list') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/ship-asset-master'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    SHIP資産マスタ
                  </button>
                )}

                {/* ユーザー管理 */}
                {isMainButtonVisible('user_management') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/user-management'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    ユーザー管理
                  </button>
                )}

                {/* 個別施設マスタ → サブメニュー展開 */}
                {canAccess('hospital_dept_master_edit') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/hospital-facility-master'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    個別施設マスタ
                  </button>
                )}

                {/* 個体管理リスト作成 → サブメニュー展開 */}
                {canAccess('existing_survey') && (
                  <button
                    onClick={() => { closeMasterModal(); showListModal(); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center relative transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    個体管理リスト作成
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 absolute right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}

                {/* 業者マスタ */}
                {canAccess('vendor_master_edit') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/vendor-master'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    業者マスタ
                  </button>
                )}

                {/* 権限管理（system_admin のみ） */}
                {isAdmin && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/permission-management'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    権限管理
                  </button>
                )}

                {/* 施設グループ管理（system_admin のみ） */}
                {isAdmin && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/facility-group-management'); }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    施設グループ管理
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集リストモーダル */}
      {isEditListModalOpen && (
        <div
          onClick={closeEditListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-[90%] max-w-[600px] shadow-xl overflow-visible flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="px-5 py-4 border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="m-0 text-lg font-semibold text-[#1f2937] text-balance">編集リスト</h2>
              <button
                onClick={closeEditListModal}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* タブ切り替え */}
            <div className="flex border-b border-[#e5e7eb]">
              <button
                onClick={() => setEditListMode('select')}
                className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-0 ${
                  editListMode === 'select'
                    ? 'bg-white text-[#27ae60] border-b-2 border-b-[#27ae60]'
                    : 'bg-[#f9fafb] text-[#6b7280] hover:text-[#1f2937]'
                }`}
              >
                作成済みリスト
              </button>
              <button
                onClick={() => setEditListMode('create')}
                className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-0 ${
                  editListMode === 'create'
                    ? 'bg-white text-[#27ae60] border-b-2 border-b-[#27ae60]'
                    : 'bg-[#f9fafb] text-[#6b7280] hover:text-[#1f2937]'
                }`}
              >
                新規リスト作成
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-visible">
              {editListMode === 'select' ? (
                <div>
                  {editLists.length === 0 ? (
                    <p className="text-center text-[#6b7280] p-5 text-pretty">
                      作成済みの編集リストがありません
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {editLists.map((list) => (
                        <div key={list.id} className="flex items-stretch gap-2">
                          <button
                            onClick={() => handleSelectEditList(list.id)}
                            className="flex-1 p-4 bg-white border border-[#d1d5db] rounded-lg cursor-pointer text-left transition-all hover:border-[#27ae60] hover:bg-[#f0fdf4]"
                          >
                            <div className="font-semibold text-sm text-[#1f2937] mb-1">
                              {list.name}
                            </div>
                            <div className="text-xs text-[#6b7280]">
                              施設: {list.facilities.join(', ')}
                            </div>
                            <div className="text-xs text-[#9ca3af] mt-1 tabular-nums">
                              作成日: {new Date(list.createdAt).toLocaleDateString('ja-JP')}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEditList({ id: list.id, name: list.name });
                            }}
                            className="px-3 py-2 bg-white border border-[#d1d5db] rounded-lg cursor-pointer text-[#dc2626] text-xs font-medium flex items-center justify-center transition-all hover:bg-red-50 hover:border-[#dc2626]"
                            title="削除"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-5">
                    <label className="block mb-2 text-sm font-medium text-[#1f2937]">
                      編集リスト名称
                    </label>
                    <input
                      type="text"
                      value={newEditListName}
                      onChange={(e) => setNewEditListName(e.target.value)}
                      placeholder="例: 2025年度リモデル計画"
                      className="w-full p-3 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:border-[#27ae60] focus:ring-1 focus:ring-[#27ae60]"
                    />
                  </div>

                  {selectedFacility && (
                    <div className="mb-5">
                      <label className="block mb-2 text-sm font-medium text-[#1f2937]">
                        取り込む原本データ（施設）を選択
                      </label>
                      <select className="w-full p-3 border border-[#d1d5db] rounded-lg text-sm bg-white focus:outline-none focus:border-[#27ae60]">
                        <option>{selectedFacility}</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleCreateEditList}
                    disabled={!newEditListName.trim()}
                    className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                      newEditListName.trim()
                        ? 'bg-[#27ae60] text-white cursor-pointer hover:bg-[#219a52]'
                        : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                    }`}
                  >
                    作成
                  </button>

                  <button
                    onClick={closeEditListModal}
                    className="w-full mt-2 py-2.5 text-sm font-medium text-[#dc2626] hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 病院ユーザー用マスタ管理モーダル */}
      {isHospitalMasterModalOpen && (
        <div
          onClick={() => setIsHospitalMasterModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-[90%] max-w-[460px] max-h-[90vh] shadow-xl flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-[#e5e7eb] flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-[#1f2937] text-balance">マスタ管理</h2>
              <button
                onClick={() => setIsHospitalMasterModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-y-auto overscroll-contain">
              <p className="text-sm text-[#6b7280] mb-4 text-pretty">マスタ管理と各種リスト管理を行えます</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsHospitalMasterModalOpen(false);
                    router.push('/hospital-facility-master');
                  }}
                  className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                >
                  個別部署マスタ
                </button>

                {isMainButtonVisible('user_management') && (
                  <button
                    onClick={() => {
                      setIsHospitalMasterModalOpen(false);
                      router.push('/user-management');
                    }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    ユーザー管理
                  </button>
                )}

                {isFacilityAdmin && (
                  <button
                    onClick={() => {
                      setIsHospitalMasterModalOpen(false);
                      router.push('/user-permission-management');
                    }}
                    className="px-4 py-3 bg-white border border-[#27ae60] rounded-lg text-sm font-medium text-[#1f2937] cursor-pointer flex items-center justify-center transition-all hover:bg-[#27ae60] hover:text-white"
                  >
                    ユーザー権限管理
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 貸出メニューモーダル */}
      {isLendingMenuModalOpen && (
        <div
          onClick={() => setIsLendingMenuModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-[90%] max-w-[400px] shadow-xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-[#e5e7eb] flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-[#1f2937] text-balance">貸出メニュー</h2>
              <button
                onClick={() => setIsLendingMenuModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAvailableDevices}
                  className="px-4 py-3 bg-white border border-[#d1d5db] rounded-lg cursor-pointer text-sm font-medium text-[#1f2937] transition-all hover:border-[#27ae60] hover:bg-[#f0fdf4]"
                >
                  貸出可能機器閲覧
                </button>
                <button
                  onClick={handleLendingCheckout}
                  className="px-4 py-3 bg-white border border-[#d1d5db] rounded-lg cursor-pointer text-sm font-medium text-[#1f2937] transition-all hover:border-[#27ae60] hover:bg-[#f0fdf4]"
                >
                  貸出・返却
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 申請ステータスモーダル */}
      {isApplicationStatusModalOpen && (
        <div
          onClick={() => setIsApplicationStatusModalOpen(false)}
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isMobile ? 'p-2' : 'p-3 sm:p-5'}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-lg w-full max-h-[95vh] shadow-xl flex flex-col ${
              isMobile ? 'max-w-full mx-2' : isTablet ? 'max-w-[700px]' : 'max-w-[900px]'
            }`}
          >
            <div className={`bg-white border-b border-[#e5e7eb] ${isMobile ? 'px-3 py-3 text-base' : 'px-5 py-4 text-lg'} font-bold flex justify-between items-center rounded-t-lg shrink-0`}>
              <span className="text-[#1f2937] text-balance">申請ステータス</span>
              <button
                onClick={() => setIsApplicationStatusModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className={`${isMobile ? 'px-3 py-2' : 'px-5 py-3'} border-b border-[#e5e7eb] bg-[#f9fafb] shrink-0`}>
              <div className="flex items-center gap-2">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-[#6b7280] whitespace-nowrap`}>申請部署</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-[#1f2937]`}>{userDepartment}</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-[#9ca3af] ml-2 tabular-nums`}>({unifiedApplications.length}件)</span>
              </div>
            </div>

            <div className={`${isMobile ? 'p-2' : 'p-4'} overflow-y-auto overscroll-contain flex-1`}>
              {unifiedApplications.length === 0 ? (
                <div className="text-center py-10 text-[#6b7280]">
                  <p className="text-pretty">申請履歴がありません</p>
                  <p className="text-sm mt-2 text-[#9ca3af] text-pretty">資産リスト画面から各種申請を行ってください</p>
                </div>
              ) : isMobile ? (
                <div className="flex flex-col gap-3">
                  {unifiedApplications.map((app) => {
                    const statusStyle = getStatusBadgeStyle(app.status);
                    const typeStyle = getTypeBadgeStyle(app.applicationType);
                    return (
                      <div key={app.id} className="border border-[#e5e7eb] rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#6b7280]">{app.applicationNo}</span>
                            <span className="text-xs text-[#d1d5db]">|</span>
                            <span className="text-xs text-[#6b7280] tabular-nums">{app.applicationDate}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {app.applicationType}
                          </span>
                          <span className="text-sm font-medium text-[#1f2937] truncate">{app.itemName}</span>
                        </div>
                        {app.deadline && (
                          <div className="text-xs text-orange-600">期限: {app.deadline}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#f9fafb]">
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">申請No.</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">申請日</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">申請種別</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">品目</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">ステータス</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-[#1f2937] whitespace-nowrap border-b border-[#e5e7eb]">期限</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unifiedApplications.map((app) => {
                        const statusStyle = getStatusBadgeStyle(app.status);
                        const typeStyle = getTypeBadgeStyle(app.applicationType);
                        return (
                          <tr key={app.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                            <td className="py-2.5 px-3 font-mono text-xs text-[#6b7280]">{app.applicationNo}</td>
                            <td className="py-2.5 px-3 text-[#6b7280] tabular-nums">{app.applicationDate}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                                {app.applicationType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#1f2937] max-w-[200px] truncate">{app.itemName}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-orange-600 font-medium tabular-nums">{app.deadline || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={`${isMobile ? 'px-3 py-3' : 'px-5 py-4'} border-t border-[#e5e7eb] bg-[#f9fafb] rounded-b-lg shrink-0`}>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsApplicationStatusModalOpen(false)}
                  className={`px-4 py-2 bg-[#4b5563] text-white rounded-md font-medium transition-colors hover:bg-[#374151] border-0 cursor-pointer ${
                    isMobile ? 'text-sm' : 'text-base'
                  }`}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetList(null);
        }}
        onConfirm={confirmDeleteEditList}
        title="編集リストの削除"
        message={deleteTargetList ? `「${deleteTargetList.name}」を削除しますか？この操作は取り消せません。` : ''}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="danger"
      />

      {/* ログアウト確認ダイアログ */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={executeLogout}
        title="ログアウト"
        message="ログアウトしますか？"
        confirmLabel="ログアウト"
        cancelLabel="キャンセル"
      />
    </div>
  );
}
