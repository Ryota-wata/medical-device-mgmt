'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { useEditListStore } from '@/lib/stores/editListStore';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { RfqGroupStatus, CreateEditListInput } from '@/lib/types';
import {
  PurchaseApplication,
  getPurchaseApplicationTypeStyle,
  getPurchaseApplicationStatusStyle,
} from '@/lib/types/purchaseApplication';
import {
  OCRResult,
  QuotationFormData,
  ConfirmedStateMap
} from '@/lib/types/quotation';
import { Header } from '@/components/layouts/Header';
import { TIMEOUTS, MESSAGES } from '@/lib/constants/quotation';
import { MOCK_OCR_RESULT } from '@/lib/mocks/quotationMockData';
import { RfqGroupsTab } from '../components/RfqGroupsTab';
import { QuotationRegistrationModal } from '../components/QuotationRegistrationModal';
import { SubTabNavigation } from '../components/SubTabNavigation';
import { AddToEditListModal } from '../components/AddToEditListModal';
import { ApplicationDetailModal } from '../components/ApplicationDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function PurchaseManagementContent() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup, deleteRfqGroup } = useRfqGroupStore();
  const {
    addQuotationGroup,
    addQuotationItems,
    generateReceivedQuotationNo
  } = useQuotationStore();
  const { applications, addApplication } = useApplicationStore();
  const { assets: assetMasterData } = useMasterStore();
  const { editLists, addEditList, addItemsFromApplications } = useEditListStore();
  const {
    applications: purchaseApplications,
    addToEditList,
    rejectApplication,
    getPendingApplications,
  } = usePurchaseApplicationStore();

  // 申請受付関連
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set());
  const [showAddToEditListModal, setShowAddToEditListModal] = useState(false);
  const [showApplicationDetailModal, setShowApplicationDetailModal] = useState(false);
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<PurchaseApplication | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null);

  // 見積依頼グループ: ステップタブ
  type StepKey = 'all' | 'rfq-quotation' | 'order-rfq' | 'order' | 'delivery' | 'inspection' | 'asset';
  const STEP_TABS: { key: StepKey; label: string; statuses: RfqGroupStatus[] }[] = [
    { key: 'all', label: 'すべて', statuses: [] },
    { key: 'rfq-quotation', label: '①見積依頼/登録', statuses: ['見積依頼', '見積依頼済', '見積DB登録済'] },
    { key: 'order-rfq', label: '②発注見積依頼', statuses: ['見積登録依頼中', '発注用見積依頼済'] },
    { key: 'order', label: '③発注登録', statuses: ['発注見積登録済'] },
    { key: 'delivery', label: '④納品日登録', statuses: ['発注済'] },
    { key: 'inspection', label: '⑤検収登録', statuses: ['納期確定'] },
    { key: 'asset', label: '⑥資産登録', statuses: ['検収済'] },
  ];
  const [activeStep, setActiveStep] = useState<StepKey>('all');

  // 完了・見送りを除いたアクティブなグループ
  const activeRfqGroups = useMemo(() => {
    const EXCLUDED_STATUSES: RfqGroupStatus[] = ['完了', '申請を見送る'];
    return rfqGroups.filter(g => !EXCLUDED_STATUSES.includes(g.status));
  }, [rfqGroups]);

  // ステップタブでフィルタされた見積依頼グループ
  const filteredRfqGroups = useMemo(() => {
    const tab = STEP_TABS.find(t => t.key === activeStep);
    if (!tab || tab.statuses.length === 0) return activeRfqGroups;
    return activeRfqGroups.filter(g => tab.statuses.includes(g.status));
  }, [activeRfqGroups, activeStep]);

  // 見積書登録モーダル
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [quotationFormData, setQuotationFormData] = useState<QuotationFormData>({
    rfqGroupId: '',
    pdfFile: null
  });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // 申請中の申請のみ取得
  const pendingApplications = purchaseApplications.filter(app => app.status === '申請中');

  // 申請選択ハンドラー
  const handleSelectApplication = (id: string) => {
    const newSelected = new Set(selectedApplicationIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApplicationIds(newSelected);
  };

  // 全選択/全解除
  const handleSelectAllApplications = (checked: boolean) => {
    if (checked) {
      setSelectedApplicationIds(new Set(pendingApplications.map(app => app.id)));
    } else {
      setSelectedApplicationIds(new Set());
    }
  };

  // 編集リストへ追加（既存リスト）
  const handleAddToExistingEditList = (editListId: string) => {
    const editList = editLists.find(l => l.id === editListId);
    if (editList) {
      // 選択した申請を取得
      const selectedApps = purchaseApplications.filter(app => selectedApplicationIds.has(app.id));
      // 申請の要望機器を編集リストにアイテムとして追加
      const addedCount = addItemsFromApplications(editListId, selectedApps);
      // 申請のステータスを更新
      addToEditList(Array.from(selectedApplicationIds), editListId, editList.name);
      setSelectedApplicationIds(new Set());
      alert(`${addedCount}件の機器を「${editList.name}」に追加しました`);
    }
  };

  // 編集リストへ追加（新規作成）
  const handleCreateAndAddToEditList = (input: CreateEditListInput) => {
    const newEditList = addEditList(input);
    // 選択した申請を取得
    const selectedApps = purchaseApplications.filter(app => selectedApplicationIds.has(app.id));
    // 申請の要望機器を編集リストにアイテムとして追加
    const addedCount = addItemsFromApplications(newEditList.id, selectedApps);
    // 申請のステータスを更新
    addToEditList(Array.from(selectedApplicationIds), newEditList.id, newEditList.name);
    setSelectedApplicationIds(new Set());
    alert(`編集リスト「${newEditList.name}」を作成し、${addedCount}件の機器を追加しました`);
  };

  // 申請詳細表示
  const handleViewApplicationDetail = (application: PurchaseApplication) => {
    setSelectedApplicationForDetail(application);
    setShowApplicationDetailModal(true);
  };

  // 却下確認
  const handleConfirmReject = (id: string) => {
    setApplicationToReject(id);
    setShowRejectConfirm(true);
  };

  // 却下実行
  const handleReject = () => {
    if (applicationToReject) {
      rejectApplication(applicationToReject);
      setApplicationToReject(null);
      setShowRejectConfirm(false);
    }
  };

  // 単一申請を編集リストへ追加
  const handleAddSingleToEditList = (id: string) => {
    setSelectedApplicationIds(new Set([id]));
    setShowAddToEditListModal(true);
  };

  // 見積依頼/見積登録 → STEP画面へ遷移
  const handleNavigateToRfqProcess = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/rfq-process?rfqGroupId=${rfqGroupId}`);
  };

  // 見積書登録開始（既存モーダル: リモデル用に残す）
  const handleStartQuotationRegistration = (rfqGroupId?: number) => {
    setQuotationFormData({
      rfqGroupId: rfqGroupId?.toString() || '',
      pdfFile: null
    });
    setModalStep(1);
    setOcrResult(null);
    setShowQuotationModal(true);
  };

  // テストデータでOCR結果を生成して明細確認画面へ遷移
  const handleGenerateTestOCR = () => {
    setOcrProcessing(true);
    setTimeout(() => {
      setOcrResult(MOCK_OCR_RESULT);
      setOcrProcessing(false);
      setShowQuotationModal(false);
      router.push('/quotation-data-box/ocr-confirm');
    }, TIMEOUTS.OCR_SIMULATION);
  };

  // PDFアップロード & OCR処理
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuotationFormData(prev => ({ ...prev, pdfFile: file }));
    handleGenerateTestOCR();
  };

  // 見積書登録確定
  const handleSubmitQuotation = (confirmedState: ConfirmedStateMap, submittedOcrResult: OCRResult) => {
    if (!submittedOcrResult) return;

    const rfqGroup = quotationFormData.rfqGroupId
      ? rfqGroups.find(g => g.id.toString() === quotationFormData.rfqGroupId)
      : undefined;

    const groupId = addQuotationGroup({
      receivedQuotationNo: generateReceivedQuotationNo(),
      rfqGroupId: rfqGroup?.id,
      rfqNo: rfqGroup?.rfqNo,
      vendorName: submittedOcrResult.vendorName,
      quotationDate: submittedOcrResult.quotationDate,
      validityPeriod: submittedOcrResult.validityPeriod,
      deliveryPeriod: submittedOcrResult.deliveryPeriod,
      phase: submittedOcrResult.phase,
      totalAmount: submittedOcrResult.totalAmount,
      pdfUrl: quotationFormData.pdfFile ? URL.createObjectURL(quotationFormData.pdfFile) : undefined
    });

    const quotationNo = generateReceivedQuotationNo();
    const itemsToAdd: Parameters<typeof addQuotationItems>[0] = [];

    submittedOcrResult.items.forEach((ocrItem, ocrItemIndex) => {
      const key = `${ocrItemIndex}`;
      const confirmedInfo = confirmedState[key];
      const assetInfo = confirmedInfo?.assetInfo;
      const aiJudgment = ocrItem.aiJudgments[0];

      const matchedAsset = assetInfo
        ? assetMasterData.find(a =>
            a.item === assetInfo.assetName &&
            a.model === assetInfo.model &&
            a.maker === assetInfo.manufacturer
          )
        : undefined;

      itemsToAdd.push({
        quotationGroupId: groupId,
        receivedQuotationNo: quotationNo,
        rowNo: ocrItem.rowNo,
        originalItemName: ocrItem.itemName,
        originalManufacturer: ocrItem.manufacturer,
        originalModel: ocrItem.model,
        originalQuantity: ocrItem.quantity,
        itemType: ocrItem.itemType,
        category: assetInfo?.category || aiJudgment?.category || '',
        largeClass: assetInfo?.majorCategory || aiJudgment?.majorCategory || '',
        middleClass: assetInfo?.middleCategory || aiJudgment?.middleCategory || '',
        itemName: assetInfo?.assetName || aiJudgment?.assetName || ocrItem.itemName,
        manufacturer: assetInfo?.manufacturer || aiJudgment?.manufacturer || ocrItem.manufacturer,
        model: assetInfo?.model || aiJudgment?.model || ocrItem.model,
        aiQuantity: ocrItem.quantity,
        rfqNo: rfqGroup?.rfqNo,
        unit: ocrItem.unit,
        listPriceUnit: ocrItem.listPriceUnit,
        listPriceTotal: ocrItem.listPriceTotal,
        purchasePriceUnit: ocrItem.purchasePriceUnit,
        purchasePriceTotal: ocrItem.purchasePriceTotal,
        remarks: ocrItem.remarks,
        allocListPriceUnit: ocrItem.listPriceUnit,
        allocListPriceTotal: ocrItem.listPriceTotal,
        allocPriceUnit: ocrItem.purchasePriceUnit,
        allocDiscount: ocrItem.discount,
        allocTaxRate: ocrItem.taxRate,
        allocTaxTotal: ocrItem.totalWithTax,
        assetMasterId: matchedAsset?.id,
        linkedApplicationIds: []
      });
    });

    addQuotationItems(itemsToAdd);

    if (rfqGroup) {
      updateRfqGroup(rfqGroup.id, { status: '見積DB登録済' });
    }

    alert(MESSAGES.QUOTATION_REGISTERED(quotationNo, itemsToAdd.length));
    setShowQuotationModal(false);
    setModalStep(1);
    setOcrResult(null);
    router.push('/quotation-data-box/purchase-quotations');
  };

  // 発注登録開始（画面遷移）
  const handleStartOrderRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/order-registration?rfqGroupId=${rfqGroupId}`);
  };

  // 検収登録開始（画面遷移）
  const handleStartInspectionRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/inspection-registration?rfqGroupId=${rfqGroupId}`);
  };

  // 資産仮登録開始（モード選択）
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [pendingRfqGroupId, setPendingRfqGroupId] = useState<number | null>(null);

  const handleStartAssetProvisionalRegistration = (rfqGroupId: number) => {
    setPendingRfqGroupId(rfqGroupId);
    setShowModeSelection(true);
  };

  const handleModeSelected = (mode: 'mobile' | 'pc') => {
    if (pendingRfqGroupId !== null) {
      router.push(`/quotation-data-box/asset-provisional-registration?rfqGroupId=${pendingRfqGroupId}&mode=${mode}`);
    }
    setShowModeSelection(false);
    setPendingRfqGroupId(null);
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden', gap: '16px' }}>
          {/* サブタブ */}
          <SubTabNavigation activeTab="purchaseManagement" />

          {/* セクション①: 申請受付 */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#27ae60',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>申請受付</span>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                未処理: {pendingApplications.length}件
              </span>
            </div>

            {pendingApplications.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#7f8c8d',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '14px' }}>未処理の申請はありません</div>
              </div>
            ) : (
              <>
                {/* テーブル */}
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      {/* グループヘッダー行 */}
                      <tr style={{ background: '#343a40', color: 'white' }}>
                        <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #495057', width: '36px', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={pendingApplications.length > 0 && selectedApplicationIds.size === pendingApplications.length}
                            onChange={(e) => handleSelectAllApplications(e.target.checked)}
                          />
                        </th>
                        <th colSpan={2} style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>申請情報</th>
                        <th colSpan={3} style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>設置情報</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>品目情報</th>
                        <th colSpan={3} style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>院内担当情報</th>
                        <th rowSpan={2} style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px', verticalAlign: 'middle' }}>コメント</th>
                        <th rowSpan={2} style={{ padding: '6px 8px', border: '1px solid #495057', textAlign: 'center', fontWeight: 600, fontSize: '12px', verticalAlign: 'middle' }}></th>
                      </tr>
                      {/* サブカラムヘッダー行 */}
                      <tr style={{ background: '#495057', color: 'white' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>申請日</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>申請No, 種別</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>部門名</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>部署名</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>室名</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>品目名</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>所属部署</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>氏名</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #6c757d', textAlign: 'left', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>連絡先</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApplications.map((app) => {
                        const typeStyle = getPurchaseApplicationTypeStyle(app.applicationType);
                        return (
                          <tr
                            key={app.id}
                            style={{
                              borderBottom: '1px solid #dee2e6',
                              background: selectedApplicationIds.has(app.id) ? '#e3f2fd' : 'transparent',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleViewApplicationDetail(app)}
                          >
                            <td style={{ padding: '8px 6px', borderBottom: '1px solid #dee2e6' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedApplicationIds.has(app.id)}
                                onChange={() => handleSelectApplication(app.id)}
                              />
                            </td>
                            {/* 申請情報: 申請日, 申請No/種別 */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', whiteSpace: 'nowrap' }}>{app.applicationDate}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#3498db', fontWeight: 'bold', cursor: 'pointer' }}>{app.applicationNo}</span>
                              <span style={{
                                ...typeStyle,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                marginLeft: '8px',
                                display: 'inline-block',
                              }}>
                                {app.applicationType}
                              </span>
                            </td>
                            {/* 設置情報: 部門名, 部署名, 室名 */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#2c3e50' }}>{app.department}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', fontSize: '12px' }}>{app.section || '-'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', fontSize: '12px' }}>{app.roomName || '-'}</td>
                            {/* 品目名 */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#2c3e50', fontSize: '12px' }}>
                              {app.assets.map(a => a.name).join(', ')}
                            </td>
                            {/* 院内担当情報: 所属部署, 氏名, 連絡先 */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', fontSize: '12px' }}>{app.applicantDepartment}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#2c3e50' }}>{app.applicantName}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', fontSize: '12px' }}>-</td>
                            {/* コメント */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', color: '#5a6c7d', fontSize: '12px' }}>
                              {app.comment || '-'}
                            </td>
                            {/* 申請内容ボタン */}
                            <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleViewApplicationDetail(app)}
                                style={{
                                  padding: '6px 12px',
                                  background: 'white',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  color: '#2c3e50',
                                }}
                              >
                                申請内容
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* アクションバー */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #dee2e6',
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: '#5a6c7d' }}>
                    選択した申請: {selectedApplicationIds.size}件
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowAddToEditListModal(true)}
                      disabled={selectedApplicationIds.size === 0}
                      style={{
                        padding: '8px 16px',
                        background: selectedApplicationIds.size === 0 ? '#bdc3c7' : '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: selectedApplicationIds.size === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      編集リストへ追加
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* セクション②: 見積依頼グループ */}
          <div style={{
            flex: 1,
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#3498db',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>見積（発注）グループ</span>
            </div>

            {/* ステップタブ */}
            <div style={{
              borderBottom: '2px solid #dee2e6',
              display: 'flex',
              background: '#fafafa',
              overflowX: 'auto',
            }}>
              {STEP_TABS.map((tab) => {
                const isActive = activeStep === tab.key;
                const count = tab.statuses.length === 0
                  ? activeRfqGroups.length
                  : activeRfqGroups.filter(g => tab.statuses.includes(g.status)).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStep(tab.key)}
                    style={{
                      padding: '10px 16px',
                      background: isActive ? '#3498db' : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #3498db' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? 'white' : '#555',
                      whiteSpace: 'nowrap',
                      marginBottom: '-2px',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      marginLeft: '6px',
                      background: isActive ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }} className="tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* テーブルエリア */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {rfqGroups.length === 0 ? (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  color: '#7f8c8d',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>見積依頼グループがありません</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    編集リストから見積依頼グループを作成すると、<br />
                    ここに表示されます。
                  </div>
                </div>
              ) : (
                <RfqGroupsTab
                  rfqGroups={filteredRfqGroups}
                  onSendRfq={handleNavigateToRfqProcess}
                  onRegisterQuotation={handleNavigateToRfqProcess}
                  onRegisterOrder={handleStartOrderRegistration}
                  onRegisterInspection={handleStartInspectionRegistration}
                  onRegisterAssetProvisional={handleStartAssetProvisionalRegistration}
                  onDelete={(id) => {
                    if (confirm('この見積（発注）グループを削除しますか？')) {
                      deleteRfqGroup(id);
                    }
                  }}
                  onUpdateDeadline={(id, field, value) => updateRfqGroup(id, { [field]: value })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 編集リストへ追加モーダル */}
      <AddToEditListModal
        isOpen={showAddToEditListModal}
        onClose={() => setShowAddToEditListModal(false)}
        editLists={editLists}
        selectedApplicationIds={Array.from(selectedApplicationIds)}
        onAddToExisting={handleAddToExistingEditList}
        onCreateAndAdd={handleCreateAndAddToEditList}
      />

      {/* 申請詳細モーダル */}
      <ApplicationDetailModal
        isOpen={showApplicationDetailModal}
        onClose={() => setShowApplicationDetailModal(false)}
        application={selectedApplicationForDetail}
        onReject={handleConfirmReject}
        onAddToEditList={handleAddSingleToEditList}
      />

      {/* 却下確認ダイアログ */}
      <ConfirmDialog
        isOpen={showRejectConfirm}
        onClose={() => {
          setShowRejectConfirm(false);
          setApplicationToReject(null);
        }}
        onConfirm={handleReject}
        title="申請を却下"
        message="この申請を却下しますか？この操作は取り消せません。"
        confirmLabel="却下する"
        cancelLabel="キャンセル"
        variant="danger"
      />

      {/* 資産仮登録モード選択ダイアログ */}
      {showModeSelection && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8, textWrap: 'balance' }}>資産仮登録の入力方法を選択</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>登録作業の状況に応じて入力方法を選んでください。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleModeSelected('mobile')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>&#128241;</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>モバイル（現場作業）</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    現場でQRラベル貼付・写真撮影・シリアルNo.入力を行います。<br />
                    1品目ずつ登録する操作フローです。
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleModeSelected('pc')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>&#128187;</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>PC（手書き検収書から手入力）</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    手書き検収書の内容をテーブル形式で一括入力します。<br />
                    全品目を一覧しながら効率的に登録できます。
                  </div>
                </div>
              </button>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModeSelection(false); setPendingRfqGroupId(null); }}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 見積書登録モーダル */}
      <QuotationRegistrationModal
        show={showQuotationModal}
        step={modalStep}
        rfqGroups={rfqGroups}
        assetMasterData={assetMasterData}
        applications={applications}
        formData={quotationFormData}
        ocrProcessing={ocrProcessing}
        ocrResult={ocrResult}
        onFormDataChange={setQuotationFormData}
        onPdfUpload={handlePdfUpload}
        onGenerateTestOCR={handleGenerateTestOCR}
        onStepChange={setModalStep}
        onCreateApplication={() => {}}
        onSubmit={handleSubmitQuotation}
        onClose={() => setShowQuotationModal(false)}
      />
    </div>
  );
}

export default function PurchaseManagementPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <PurchaseManagementContent />
    </Suspense>
  );
}
