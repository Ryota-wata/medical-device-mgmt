'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useEditListStore, useApplicationStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { useRepairRequestStore } from '@/lib/stores/repairRequestStore';
import { generateMockAssets } from '@/lib/data/generateMockAssets';
import { getUserType } from '@/lib/types';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function MainPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { facilities } = useMasterStore();
  const { editLists, addEditList, deleteEditList } = useEditListStore();
  const { isMobile, isTablet } = useResponsive();
  const { showToast } = useToast();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isHospitalSelectModalOpen, setIsHospitalSelectModalOpen] = useState(false);
  const [isHospitalMasterModalOpen, setIsHospitalMasterModalOpen] = useState(false);
  const [isLendingMenuModalOpen, setIsLendingMenuModalOpen] = useState(false);
  const [isApplicationStatusModalOpen, setIsApplicationStatusModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedFacilityForMaster, setSelectedFacilityForMaster] = useState('');
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  // 編集リスト関連のstate
  const [editListMode, setEditListMode] = useState<'select' | 'create'>('select');
  const [newEditListName, setNewEditListName] = useState('');
  const [selectedEditListFacilities, setSelectedEditListFacilities] = useState<string[]>([]);

  // 削除確認ダイアログ用のstate
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetList, setDeleteTargetList] = useState<{ id: string; name: string } | null>(null);

  // 施設マスタから施設名オプションを生成
  const facilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // メールアドレスからユーザー種別を判定
  const userType = user ? getUserType(user.email) : 'ship';
  const isShipUser = userType === 'ship';
  const isHospitalUser = userType === 'hospital';

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
      // PurchaseApplication系
      '申請中': { bg: 'bg-amber-100', text: 'text-amber-800' },
      '編集中': { bg: 'bg-sky-100', text: 'text-sky-800' },
      '見積中': { bg: 'bg-purple-100', text: 'text-purple-800' },
      '発注済': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      '検収済': { bg: 'bg-teal-100', text: 'text-teal-800' },
      '完了': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      '却下': { bg: 'bg-red-100', text: 'text-red-800' },
      // Application系
      '承認待ち': { bg: 'bg-amber-100', text: 'text-amber-800' },
      '承認済み': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      '見積依頼中': { bg: 'bg-purple-100', text: 'text-purple-800' },
      // RepairRequest系
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
    logout();
    router.push('/login');
  };

  const handleQRRead = () => {
    showToast('QR読取機能（開発中）', 'info');
  };

  // 編集リスト関連の関数
  const handleEditListManagement = () => {
    setIsEditListModalOpen(true);
    setEditListMode('select');
  };

  const closeEditListModal = () => {
    setIsEditListModalOpen(false);
    setEditListMode('select');
    setNewEditListName('');
    setSelectedEditListFacilities([]);
  };

  const handleFacilityToggle = (facilityName: string) => {
    setSelectedEditListFacilities(prev => {
      if (prev.includes(facilityName)) {
        return prev.filter(f => f !== facilityName);
      } else {
        return [...prev, facilityName];
      }
    });
  };

  const handleCreateEditList = () => {
    if (!newEditListName.trim()) {
      showToast('編集リスト名を入力してください', 'warning');
      return;
    }
    if (selectedEditListFacilities.length === 0) {
      showToast('施設を1つ以上選択してください', 'warning');
      return;
    }

    // 対象施設の原本資産を生成
    const baseAssets = generateMockAssets(selectedEditListFacilities);
    addEditList({
      name: newEditListName.trim(),
      facilities: selectedEditListFacilities,
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
    router.push('/quotation-data-box');
  };

  const showMasterModal = () => {
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
    setSelectedFacility('');
    setButtonsEnabled(false);
  };

  const handleFacilityChange = (facilityName: string) => {
    setSelectedFacility(facilityName);
    setButtonsEnabled(!!facilityName);
  };

  const handleMenuSelect = (menuName: string) => {
    const facilityParam = selectedFacility ? `?facility=${encodeURIComponent(selectedFacility)}` : '';
    closeListModal();

    switch (menuName) {
      case 'QRコード発行':
        router.push(`/qr-issue${facilityParam}`);
        break;
      case '現有品調査':
        router.push(`/offline-prep${facilityParam}`);
        break;
      case '現有品調査内容修正':
        router.push(`/registration-edit${facilityParam}`);
        break;
      case '資産台帳取込':
        router.push(`/asset-import${facilityParam}`);
        break;
      case 'データ突合':
        router.push(`/data-matching${facilityParam}`);
        break;
    }
  };

  const handleQRIssueFromModal = () => {
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

  const handleAllDataView = () => {
    showToast('全データ閲覧機能（開発中）', 'info');
  };

  // 病院ユーザー用ハンドラー
  const handleAssetListForHospital = () => {
    router.push('/asset-search-result');
  };

  const handleLendingMenu = () => {
    setIsLendingMenuModalOpen(true);
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

  return (
    <div className="min-h-dvh flex flex-col bg-slate-100 p-5">
      <div className="max-w-[1400px] mx-auto bg-white rounded-lg shadow-lg w-full">
        {/* ヘッダー */}
        <header className="bg-slate-700 text-white px-5 py-4 rounded-t-lg flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                SHIP
              </div>
              <div className="text-lg font-bold text-balance">
                HEALTHCARE 医療機器管理システム
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            {/* コンサルタント専用ボタン */}
            {isShipUser && (
              <>
                <button
                  onClick={handleQRRead}
                  className="px-4 py-2 bg-emerald-500 text-white border-0 rounded cursor-pointer text-sm hover:bg-emerald-600 transition-colors"
                >
                  QR読取
                </button>
                <button
                  onClick={handleEditListManagement}
                  className="px-4 py-2 bg-emerald-500 text-white border-0 rounded cursor-pointer text-sm hover:bg-emerald-600 transition-colors"
                >
                  編集リスト
                </button>
                <button
                  onClick={handleQuotationManagement}
                  className="px-4 py-2 bg-emerald-500 text-white border-0 rounded cursor-pointer text-sm hover:bg-emerald-600 transition-colors"
                >
                  タスク管理
                </button>
                <button
                  onClick={showMasterModal}
                  className="px-4 py-2 bg-slate-600 text-white border-0 rounded cursor-pointer text-sm hover:bg-slate-700 transition-colors"
                >
                  マスタ管理
                </button>
              </>
            )}

            {/* 病院ユーザー専用ボタン */}
            {isHospitalUser && (
              <>
                <button
                  onClick={handleQRIssueFromModal}
                  className="px-4 py-2 bg-emerald-500 text-white border-0 rounded cursor-pointer text-sm hover:bg-emerald-600 transition-colors"
                >
                  QRコード発行
                </button>
                <button
                  onClick={() => setIsHospitalMasterModalOpen(true)}
                  className="px-4 py-2 bg-slate-600 text-white border-0 rounded cursor-pointer text-sm hover:bg-slate-700 transition-colors"
                >
                  マスタ管理
                </button>
              </>
            )}

            {/* ログアウトボタン（全ユーザー共通） */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white border-0 rounded cursor-pointer text-sm hover:bg-red-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* メニューセクション */}
        <div className={`bg-slate-50 ${isMobile ? 'px-2.5 py-4' : isTablet ? 'px-2.5 py-5' : 'px-5 py-8'}`}>
          {isHospitalUser ? (
            /* 病院ユーザー用メニュー - 横一列（デスクトップ）/ 2×2グリッド（モバイル） */
            <div className={`max-w-[1400px] mx-auto justify-center ${
              isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-nowrap gap-3'
            }`}>
              <button
                onClick={handleAssetListForHospital}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-3 text-xs min-h-11' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                資産リスト（各種申請）
              </button>
              <button
                onClick={handleLendingMenu}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-3 text-xs min-h-11' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                貸出
              </button>
              <button
                onClick={handleRepairApplication}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-3 text-xs min-h-11' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                修理申請
              </button>
              <button
                onClick={handleApplicationStatus}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-3 text-xs min-h-11' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                申請ステータス
              </button>
            </div>
          ) : (
            /* SHIPユーザー用メニュー */
            <div
              className={`flex max-w-[1400px] mx-auto justify-center ${
                isMobile || isTablet ? 'flex-wrap' : 'flex-nowrap'
              } ${isMobile ? 'gap-1.5' : isTablet ? 'gap-2' : 'gap-3'}`}
            >
              <button
                onClick={handleAssetBrowseAndApplication}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap flex-none hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-2 text-xs min-h-11' : isTablet ? 'px-3 py-2.5 text-xs' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                資産閲覧・申請
              </button>
              <button
                onClick={handleMaintenanceInspection}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap flex-none hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-2 text-xs min-h-11' : isTablet ? 'px-3 py-2.5 text-xs' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                保守・点検
              </button>
              <button
                onClick={handleLendingManagement}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap flex-none hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-2 text-xs min-h-11' : isTablet ? 'px-3 py-2.5 text-xs' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                貸出管理
              </button>
              <button
                onClick={handleRepairApplication}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap flex-none hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-2 text-xs min-h-11' : isTablet ? 'px-3 py-2.5 text-xs' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                修理申請
              </button>
              <button
                onClick={handleAllDataView}
                className={`bg-white border-2 border-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer transition-all whitespace-nowrap flex-none hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 ${
                  isMobile ? 'px-3 py-2 text-xs min-h-11' : isTablet ? 'px-3 py-2.5 text-xs' : 'px-5 py-3.5 text-[15px]'
                }`}
              >
                全データ閲覧（閲覧・出力）
              </button>
            </div>
          )}
        </div>

        {/* ダッシュボードボディ（次スコープ用） */}
        <div className="px-5 py-10 min-h-[300px] flex items-center justify-center">
          <div className="text-center text-slate-500 text-base p-10 bg-white border-2 border-dashed border-slate-300 rounded-lg max-w-[600px] mx-auto">
            <p className="text-pretty">※ ダッシュボード機能は次スコープで実装予定です</p>
          </div>
        </div>
      </div>

      {/* 個体管理リスト作成モーダル */}
      {isListModalOpen && (
        <div
          onClick={closeListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-[90%] max-w-[600px] shadow-xl overflow-hidden"
          >
            {/* モーダルヘッダー */}
            <div className="bg-emerald-500 text-white px-6 py-5 text-xl font-bold text-balance flex justify-between items-center">
              <span>個体管理リスト作成</span>
              <button
                onClick={closeListModal}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6">
              {/* 施設選択 */}
              <div className="mb-8">
                <SearchableSelect
                  label="施設を選択"
                  value={selectedFacility}
                  onChange={handleFacilityChange}
                  options={['', ...facilityOptions]}
                  placeholder="施設を選択してください"
                  isMobile={isMobile}
                />
              </div>

              {/* メニューボタン */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleMenuSelect('QRコード発行')}
                  disabled={!buttonsEnabled}
                  className={`px-4 py-3.5 rounded-md text-[15px] font-semibold transition-all min-h-[50px] flex items-center justify-center relative overflow-hidden ${
                    buttonsEnabled
                      ? 'bg-white text-slate-700 border-2 border-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  QRコード発行
                </button>

                <button
                  onClick={() => handleMenuSelect('現有品調査')}
                  disabled={!buttonsEnabled}
                  className={`px-4 py-3.5 rounded-md text-[15px] font-semibold transition-all min-h-[50px] flex items-center justify-center relative overflow-hidden ${
                    buttonsEnabled
                      ? 'bg-white text-slate-700 border-2 border-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  現有品調査
                </button>

                <button
                  onClick={() => handleMenuSelect('現有品調査内容修正')}
                  disabled={!buttonsEnabled}
                  className={`px-4 py-3.5 rounded-md text-[15px] font-semibold transition-all min-h-[50px] flex items-center justify-center relative overflow-hidden ${
                    buttonsEnabled
                      ? 'bg-white text-slate-700 border-2 border-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  現有品調査内容修正
                </button>

                <button
                  onClick={() => handleMenuSelect('資産台帳取込')}
                  disabled={!buttonsEnabled}
                  className={`px-4 py-3.5 rounded-md text-[15px] font-semibold transition-all min-h-[50px] flex items-center justify-center relative overflow-hidden ${
                    buttonsEnabled
                      ? 'bg-white text-slate-700 border-2 border-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  資産台帳取込
                </button>

                <button
                  onClick={() => handleMenuSelect('データ突合')}
                  disabled={!buttonsEnabled}
                  className={`px-4 py-3.5 rounded-md text-[15px] font-semibold transition-all min-h-[50px] flex items-center justify-center relative overflow-hidden ${
                    buttonsEnabled
                      ? 'bg-white text-slate-700 border-2 border-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  データ突合
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* マスタ管理モーダル */}
      {isMasterModalOpen && (
        <div
          onClick={closeMasterModal}
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-[500px] max-h-[80vh] flex flex-col shadow-xl"
          >
            {/* モーダルヘッダー */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="m-0 text-xl font-semibold text-slate-700 text-balance">
                マスタ管理
              </h2>
              <button
                onClick={closeMasterModal}
                className="bg-transparent border-0 text-2xl cursor-pointer text-slate-400 p-0 size-8 flex items-center justify-center rounded-full transition-colors hover:bg-slate-100"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/ship-asset-master');
                  }}
                  className="px-6 py-4 bg-white border-2 border-sky-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-sky-500 hover:text-white"
                >
                  <span>🏥 SHIP資産マスタ</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/ship-facility-master');
                  }}
                  className="px-6 py-4 bg-white border-2 border-emerald-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-emerald-500 hover:text-white"
                >
                  <span>🏥 SHIP施設マスタ</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/ship-department-master');
                  }}
                  className="px-6 py-4 bg-white border-2 border-emerald-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-emerald-500 hover:text-white"
                >
                  <span>🏢 SHIP部署マスタ</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    if (isHospitalUser && user?.hospital) {
                      router.push(`/hospital-facility-master?facility=${encodeURIComponent(user.hospital)}`);
                    } else {
                      setIsHospitalSelectModalOpen(true);
                    }
                  }}
                  className="px-6 py-4 bg-white border-2 border-purple-600 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-purple-600 hover:text-white"
                >
                  <span>🏢 個別施設マスタ</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/vendor-master');
                  }}
                  className="px-6 py-4 bg-white border-2 border-purple-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-purple-500 hover:text-white"
                >
                  <span>🏭 業者マスタ</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/user-management');
                  }}
                  className="px-6 py-4 bg-white border-2 border-purple-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-purple-500 hover:text-white"
                >
                  <span>👤 ユーザー管理</span>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    showListModal();
                  }}
                  className="px-6 py-4 bg-white border-2 border-red-500 rounded-lg text-base font-semibold text-slate-700 cursor-pointer flex items-center justify-between transition-all hover:bg-red-500 hover:text-white"
                >
                  <span>📋 個体管理リスト作成</span>
                  <span className="text-xl">→</span>
                </button>
              </div>

              <p className="mt-5 text-sm text-slate-500 text-center text-pretty">
                マスタ管理と各種リスト管理を行えます
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 編集リストモーダル */}
      {isEditListModalOpen && (
        <div
          onClick={closeEditListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-[90%] max-w-[600px] shadow-xl overflow-visible flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="bg-emerald-500 text-white px-5 py-4 text-lg font-bold flex justify-between items-center">
              <span className="text-balance">編集リスト</span>
              <button
                onClick={closeEditListModal}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* タブ切り替え */}
            <div className="flex border-b border-slate-300">
              <button
                onClick={() => setEditListMode('select')}
                className={`flex-1 p-3 border-0 cursor-pointer font-semibold text-sm transition-all ${
                  editListMode === 'select' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700'
                }`}
              >
                作成済みリストを選択
              </button>
              <button
                onClick={() => setEditListMode('create')}
                className={`flex-1 p-3 border-0 cursor-pointer font-semibold text-sm transition-all ${
                  editListMode === 'create' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700'
                }`}
              >
                新規リスト作成
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-visible">
              {editListMode === 'select' ? (
                /* 作成済みリスト選択モード */
                <div>
                  {editLists.length === 0 ? (
                    <p className="text-center text-slate-500 p-5 text-pretty">
                      作成済みの編集リストがありません
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {editLists.map((list) => (
                        <div
                          key={list.id}
                          className="flex items-stretch gap-2"
                        >
                          <button
                            onClick={() => handleSelectEditList(list.id)}
                            className="flex-1 p-4 bg-white border-2 border-emerald-500 rounded-lg cursor-pointer text-left transition-all hover:bg-emerald-500 hover:text-white"
                          >
                            <div className="font-semibold text-base mb-2">
                              {list.name}
                            </div>
                            <div className="text-sm opacity-80">
                              施設: {list.facilities.join(', ')}
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              作成日: {new Date(list.createdAt).toLocaleDateString('ja-JP')}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEditList({ id: list.id, name: list.name });
                            }}
                            className="px-4 py-3 bg-white border-2 border-red-500 rounded-lg cursor-pointer text-red-500 text-sm font-semibold flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
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
                /* 新規作成モード */
                <div>
                  {/* 編集リスト名称 */}
                  <div className="mb-5">
                    <label className="block mb-2 font-semibold text-slate-700">
                      編集リスト名称
                    </label>
                    <input
                      type="text"
                      value={newEditListName}
                      onChange={(e) => setNewEditListName(e.target.value)}
                      placeholder="例: 2025年度リモデル計画"
                      className="w-full p-3 border-2 border-slate-300 rounded-md text-sm"
                    />
                  </div>

                  {/* 施設選択 */}
                  <div className="relative z-10">
                    <label className="block mb-2 font-semibold text-slate-700">
                      取り込む原本データ（施設）を選択
                    </label>
                    <p className="text-xs text-slate-500 mb-3 text-pretty">
                      複数選択可能です（選択後もプルダウンから追加できます）
                    </p>

                    {/* 選択済み施設タグ */}
                    {selectedEditListFacilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedEditListFacilities.map((facility) => (
                          <span
                            key={facility}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-500 rounded-full text-sm text-slate-700"
                          >
                            {facility}
                            <button
                              type="button"
                              onClick={() => handleFacilityToggle(facility)}
                              className="bg-transparent border-0 cursor-pointer p-0 text-base text-red-500 leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 施設プルダウン */}
                    <SearchableSelect
                      label=""
                      value=""
                      onChange={() => {}}
                      onSelect={(value) => {
                        if (value && !selectedEditListFacilities.includes(value)) {
                          setSelectedEditListFacilities(prev => [...prev, value]);
                        }
                      }}
                      options={['', ...facilityOptions.filter(f => !selectedEditListFacilities.includes(f))]}
                      placeholder="施設を検索して選択..."
                      isMobile={isMobile}
                    />

                    {selectedEditListFacilities.length > 0 && (
                      <p className="text-sm text-emerald-500 mt-2">
                        {selectedEditListFacilities.length}件選択中
                      </p>
                    )}
                  </div>

                  {/* 作成ボタン */}
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      onClick={closeEditListModal}
                      className="px-5 py-2.5 bg-slate-400 text-white border-0 rounded cursor-pointer text-sm font-semibold transition-colors hover:bg-slate-500"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleCreateEditList}
                      disabled={!newEditListName.trim() || selectedEditListFacilities.length === 0}
                      className={`px-5 py-2.5 border-0 rounded text-sm font-semibold transition-colors ${
                        newEditListName.trim() && selectedEditListFacilities.length > 0
                          ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                          : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      作成
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 病院選択モーダル（個別施設マスタ用） */}
      {isHospitalSelectModalOpen && (
        <div
          onClick={() => {
            setIsHospitalSelectModalOpen(false);
            setSelectedFacilityForMaster('');
          }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[90vh] shadow-xl overflow-visible flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="bg-purple-600 text-white px-5 py-4 text-lg font-bold flex justify-between items-center rounded-t-xl">
              <span className="text-balance">個別施設マスタ - 施設選択</span>
              <button
                onClick={() => {
                  setIsHospitalSelectModalOpen(false);
                  setSelectedFacilityForMaster('');
                }}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-visible">
              {/* 施設選択 */}
              <div className="mb-6 relative z-[3]">
                <SearchableSelect
                  label="施設を選択"
                  value={selectedFacilityForMaster}
                  onChange={(facilityName) => setSelectedFacilityForMaster(facilityName)}
                  options={['', ...facilityOptions]}
                  placeholder="施設を選択してください"
                  isMobile={isMobile}
                />
              </div>

              {/* 決定ボタン */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsHospitalSelectModalOpen(false);
                    setSelectedFacilityForMaster('');
                  }}
                  className="px-5 py-2.5 bg-slate-400 text-white border-0 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-slate-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    if (selectedFacilityForMaster) {
                      router.push(`/hospital-facility-master?facility=${encodeURIComponent(selectedFacilityForMaster)}`);
                      setIsHospitalSelectModalOpen(false);
                      setSelectedFacilityForMaster('');
                    }
                  }}
                  disabled={!selectedFacilityForMaster}
                  className={`px-5 py-2.5 border-0 rounded-md text-sm font-semibold transition-colors ${
                    selectedFacilityForMaster
                      ? 'bg-purple-600 text-white cursor-pointer hover:bg-purple-700'
                      : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 病院ユーザー用マスタ管理モーダル */}
      {isHospitalMasterModalOpen && (
        <div
          onClick={() => setIsHospitalMasterModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[90vh] shadow-xl flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="bg-slate-600 text-white px-5 py-4 text-lg font-bold flex justify-between items-center rounded-t-xl shrink-0">
              <span className="text-balance">マスタ管理</span>
              <button
                onClick={() => setIsHospitalMasterModalOpen(false)}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsHospitalMasterModalOpen(false);
                    const hospitalName = user?.hospital || '東京中央病院';
                    router.push(`/hospital-facility-master?facility=${encodeURIComponent(hospitalName)}`);
                  }}
                  className="px-5 py-4 bg-purple-600 text-white border-0 rounded-lg cursor-pointer text-[15px] font-semibold flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/40"
                >
                  <span className="text-xl">🏢</span>
                  <span>個別施設マスタ</span>
                </button>
              </div>

              {/* 閉じるボタン */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsHospitalMasterModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-400 text-white border-0 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-slate-500"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 貸出メニューモーダル */}
      {isLendingMenuModalOpen && (
        <div
          onClick={() => setIsLendingMenuModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-[90%] max-w-[400px] shadow-xl flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="bg-emerald-500 text-white px-5 py-4 text-lg font-bold flex justify-between items-center rounded-t-xl shrink-0">
              <span className="text-balance">貸出メニュー</span>
              <button
                onClick={() => setIsLendingMenuModalOpen(false)}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAvailableDevices}
                  className="px-5 py-4 bg-white border-2 border-emerald-500 rounded-lg cursor-pointer text-[15px] font-semibold text-slate-700 flex items-center gap-3 transition-all hover:bg-emerald-500 hover:text-white"
                >
                  <span className="text-xl">📋</span>
                  <span>貸出可能機器閲覧</span>
                </button>
                <button
                  onClick={handleLendingCheckout}
                  className="px-5 py-4 bg-white border-2 border-sky-500 rounded-lg cursor-pointer text-[15px] font-semibold text-slate-700 flex items-center gap-3 transition-all hover:bg-sky-500 hover:text-white"
                >
                  <span className="text-xl">🔄</span>
                  <span>貸出・返却</span>
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
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isMobile ? 'p-2' : 'p-5'}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-xl w-full max-h-[95vh] shadow-xl flex flex-col ${
              isMobile ? 'max-w-full mx-2' : isTablet ? 'max-w-[700px]' : 'max-w-[900px]'
            }`}
          >
            {/* モーダルヘッダー */}
            <div className={`bg-emerald-600 text-white ${isMobile ? 'px-3 py-3 text-base' : 'px-5 py-4 text-lg'} font-bold flex justify-between items-center rounded-t-xl shrink-0`}>
              <span className="text-balance">申請ステータス</span>
              <button
                onClick={() => setIsApplicationStatusModalOpen(false)}
                className="bg-transparent border-0 text-xl cursor-pointer text-white p-0 size-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* 所属部署表示 */}
            <div className={`${isMobile ? 'px-3 py-2' : 'px-5 py-3'} border-b border-slate-200 bg-slate-50 shrink-0`}>
              <div className="flex items-center gap-2">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 whitespace-nowrap`}>申請部署</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-800`}>{userDepartment}</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 ml-2`}>({unifiedApplications.length}件)</span>
              </div>
            </div>

            {/* モーダルボディ */}
            <div className={`${isMobile ? 'p-2' : 'p-4'} overflow-y-auto flex-1`}>
              {unifiedApplications.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-pretty">申請履歴がありません</p>
                  <p className="text-sm mt-2 text-slate-400 text-pretty">資産リスト画面から各種申請を行ってください</p>
                </div>
              ) : isMobile ? (
                /* モバイル: カード形式 */
                <div className="flex flex-col gap-3">
                  {unifiedApplications.map((app) => {
                    const statusStyle = getStatusBadgeStyle(app.status);
                    const typeStyle = getTypeBadgeStyle(app.applicationType);

                    return (
                      <div key={app.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-600">{app.applicationNo}</span>
                            <span className="text-xs text-slate-400">|</span>
                            <span className="text-xs text-slate-500 tabular-nums">{app.applicationDate}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {app.applicationType}
                          </span>
                          <span className="text-sm font-medium text-slate-800 truncate">{app.itemName}</span>
                        </div>
                        {app.deadline && (
                          <div className="text-xs text-orange-600">
                            期限: {app.deadline}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* PC/タブレット: テーブル形式 */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">申請No.</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">申請日</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">申請種別</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">品目</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">ステータス</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">期限</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unifiedApplications.map((app) => {
                        const statusStyle = getStatusBadgeStyle(app.status);
                        const typeStyle = getTypeBadgeStyle(app.applicationType);

                        return (
                          <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{app.applicationNo}</td>
                            <td className="py-2.5 px-3 text-slate-600 tabular-nums">{app.applicationDate}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                                {app.applicationType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 max-w-[200px] truncate">{app.itemName}</td>
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

            {/* フッター */}
            <div className={`${isMobile ? 'px-3 py-3' : 'px-5 py-4'} border-t border-slate-200 bg-slate-50 rounded-b-xl shrink-0`}>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsApplicationStatusModalOpen(false)}
                  className={`px-4 py-2 bg-slate-600 text-white rounded-md font-medium transition-colors hover:bg-slate-700 ${
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
    </div>
  );
}
