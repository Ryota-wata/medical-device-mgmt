'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { RfqGroupStatus } from '@/lib/types';
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

// 購入申請のステータス
type PurchaseApplicationStatus = '申請中' | '対応中' | '見積中' | '発注済' | '検収待ち' | '完了';

// 購入申請データの型
interface PurchaseApplication {
  id: number;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
  applicationType: '更新申請' | '増設申請' | '新規申請';
  targetAssetId?: string;
  targetAssetName: string;
  reason: string;
  desiredDeliveryDate: string;
  isUrgent: boolean;
  status: PurchaseApplicationStatus;
  rfqNo?: string;
  assignedTo?: string;
}

// モック購入申請データ
const MOCK_PURCHASE_APPLICATIONS: PurchaseApplication[] = [
  {
    id: 1,
    applicationNo: 'PA-2025-001',
    applicationDate: '2025-02-15',
    applicantName: '佐藤 美咲',
    applicantDepartment: '外科',
    applicationType: '更新申請',
    targetAssetId: 'CT-001',
    targetAssetName: 'CTスキャナー SOMATOM Drive',
    reason: '老朽化・故障頻発',
    desiredDeliveryDate: '2025-04',
    isUrgent: false,
    status: '申請中',
  },
  {
    id: 2,
    applicationNo: 'PA-2025-002',
    applicationDate: '2025-02-14',
    applicantName: '田中 一郎',
    applicantDepartment: '内科',
    applicationType: '増設申請',
    targetAssetId: 'US-003',
    targetAssetName: 'エコー装置 Aplio i800',
    reason: '業務拡大',
    desiredDeliveryDate: '2025-05',
    isUrgent: false,
    status: '申請中',
  },
  {
    id: 3,
    applicationNo: 'PA-2025-003',
    applicationDate: '2025-02-13',
    applicantName: '鈴木 花子',
    applicantDepartment: '検査科',
    applicationType: '更新申請',
    targetAssetId: 'XR-002',
    targetAssetName: 'X線撮影装置 CALNEO Smart',
    reason: '保守終了',
    desiredDeliveryDate: '2025-03',
    isUrgent: true,
    status: '対応中',
    rfqNo: 'RFQ-2025-015',
    assignedTo: '高橋 健二',
  },
  {
    id: 4,
    applicationNo: 'PA-2025-004',
    applicationDate: '2025-02-10',
    applicantName: '渡辺 真理',
    applicantDepartment: 'リハビリ科',
    applicationType: '新規申請',
    targetAssetName: '超音波治療器',
    reason: '新規導入',
    desiredDeliveryDate: '2025-06',
    isUrgent: false,
    status: '見積中',
    rfqNo: 'RFQ-2025-012',
    assignedTo: '高橋 健二',
  },
];

function PurchaseManagementContent() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const {
    addQuotationGroup,
    addQuotationItems,
    generateReceivedQuotationNo
  } = useQuotationStore();
  const { applications, addApplication } = useApplicationStore();
  const { assets: assetMasterData } = useMasterStore();

  // 購入申請一覧（モック）
  const [purchaseApplications, setPurchaseApplications] = useState<PurchaseApplication[]>(MOCK_PURCHASE_APPLICATIONS);

  // フィルター
  const [statusFilter, setStatusFilter] = useState<PurchaseApplicationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // 見積依頼グループタブ用のステータスフィルター
  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqGroupStatus | ''>('');

  // 見積書登録モーダル
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [quotationFormData, setQuotationFormData] = useState<QuotationFormData>({
    rfqGroupId: '',
    pdfFile: null
  });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // 対応開始モーダル
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PurchaseApplication | null>(null);

  // フィルタリングされた申請一覧
  const filteredApplications = purchaseApplications.filter(app => {
    if (statusFilter && app.status !== statusFilter) return false;
    if (typeFilter && app.applicationType !== typeFilter) return false;
    return true;
  });

  // 対応開始
  const handleStartResponse = (application: PurchaseApplication) => {
    setSelectedApplication(application);
    setShowStartModal(true);
  };

  // 対応開始確定
  const handleConfirmStartResponse = () => {
    if (!selectedApplication) return;

    // ステータスを「対応中」に更新し、見積依頼No.を採番
    const newRfqNo = `RFQ-2025-${String(rfqGroups.length + 16).padStart(3, '0')}`;
    setPurchaseApplications(prev => prev.map(app =>
      app.id === selectedApplication.id
        ? { ...app, status: '対応中' as PurchaseApplicationStatus, rfqNo: newRfqNo, assignedTo: '現在のユーザー' }
        : app
    ));

    setShowStartModal(false);
    setSelectedApplication(null);

    alert(`対応を開始しました。\n見積依頼No.: ${newRfqNo}`);
  };

  // 見積書登録開始
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
      updateRfqGroup(rfqGroup.id, { status: '見積登録済' });
    }

    alert(MESSAGES.QUOTATION_REGISTERED(quotationNo, itemsToAdd.length));
    setShowQuotationModal(false);
    setModalStep(1);
    setOcrResult(null);
    router.push('/quotation-data-box/quotations');
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

  // ステータスバッジの色
  const getStatusColor = (status: PurchaseApplicationStatus) => {
    switch (status) {
      case '申請中': return { bg: '#fef3c7', text: '#92400e' };
      case '対応中': return { bg: '#dbeafe', text: '#1e40af' };
      case '見積中': return { bg: '#e0e7ff', text: '#3730a3' };
      case '発注済': return { bg: '#d1fae5', text: '#065f46' };
      case '検収待ち': return { bg: '#fce7f3', text: '#9d174d' };
      case '完了': return { bg: '#f3f4f6', text: '#374151' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  // 申請種別バッジの色
  const getTypeColor = (type: string) => {
    switch (type) {
      case '更新申請': return { bg: '#fee2e2', text: '#991b1b' };
      case '増設申請': return { bg: '#fef3c7', text: '#92400e' };
      case '新規申請': return { bg: '#d1fae5', text: '#065f46' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  // 未対応申請件数
  const pendingCount = purchaseApplications.filter(app => app.status === '申請中').length;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        centerContent={
          <div style={{
            background: '#27ae60',
            padding: '6px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>購入申請受付</span>
            {pendingCount > 0 && (
              <span style={{
                background: '#e74c3c',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}>
                未対応 {pendingCount}件
              </span>
            )}
          </div>
        }
      />

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          {/* サブタブ */}
          <SubTabNavigation activeTab="purchaseManagement" />

          {/* フィルター */}
          <div style={{
            background: 'white',
            padding: '12px 16px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>申請種別</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
              >
                <option value="">すべて</option>
                <option value="更新申請">更新申請</option>
                <option value="増設申請">増設申請</option>
                <option value="新規申請">新規申請</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PurchaseApplicationStatus | '')}
                style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
              >
                <option value="">すべて</option>
                <option value="申請中">申請中</option>
                <option value="対応中">対応中</option>
                <option value="見積中">見積中</option>
                <option value="発注済">発注済</option>
                <option value="検収待ち">検収待ち</option>
                <option value="完了">完了</option>
              </select>
            </div>
          </div>

          {/* 申請一覧テーブル */}
          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>申請No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>申請日</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>申請者</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>種別</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>対象資産</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>申請理由</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>希望納期</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>ステータス</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>見積依頼No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app, index) => {
                  const statusColor = getStatusColor(app.status);
                  const typeColor = getTypeColor(app.applicationType);
                  return (
                    <tr key={app.id} style={{ background: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#1e293b' }}>
                        {app.applicationNo}
                        {app.isUrgent && (
                          <span style={{ marginLeft: '6px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>緊急</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{app.applicationDate}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{app.applicantName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{app.applicantDepartment}</div>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: typeColor.bg, color: typeColor.text }}>
                          {app.applicationType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.targetAssetName}>
                          {app.targetAssetName}
                        </div>
                        {app.targetAssetId && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{app.targetAssetId}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.reason}>
                        {app.reason}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>{app.desiredDeliveryDate}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: statusColor.bg, color: statusColor.text }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#3b82f6', fontWeight: 500 }}>
                        {app.rfqNo || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {app.status === '申請中' && (
                          <button
                            onClick={() => handleStartResponse(app)}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            対応開始
                          </button>
                        )}
                        {app.status === '対応中' && (
                          <button
                            onClick={() => handleStartQuotationRegistration()}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            見積登録
                          </button>
                        )}
                        {app.status === '見積中' && (
                          <button
                            onClick={() => handleStartOrderRegistration(app.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            発注登録
                          </button>
                        )}
                        {app.status === '発注済' && (
                          <button
                            onClick={() => handleStartInspectionRegistration(app.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            検収登録
                          </button>
                        )}
                        {app.status === '検収待ち' && (
                          <button
                            onClick={() => handleStartAssetProvisionalRegistration(app.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ec4899',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            資産登録
                          </button>
                        )}
                        {app.status === '完了' && (
                          <span style={{ color: '#9ca3af', fontSize: '12px' }}>完了</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredApplications.length === 0 && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>申請がありません</div>
                <div style={{ fontSize: '13px' }}>購入申請が届くとここに表示されます</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 対応開始確認モーダル */}
      {showStartModal && selectedApplication && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16, textWrap: 'balance' }}>対応を開始しますか？</h2>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', minWidth: 80 }}>申請No.</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedApplication.applicationNo}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', minWidth: 80 }}>申請者</span>
                  <span style={{ color: '#1e293b' }}>{selectedApplication.applicantName}（{selectedApplication.applicantDepartment}）</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', minWidth: 80 }}>対象資産</span>
                  <span style={{ color: '#1e293b' }}>{selectedApplication.targetAssetName}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', minWidth: 80 }}>申請種別</span>
                  <span style={{ color: '#1e293b' }}>{selectedApplication.applicationType}</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              対応を開始すると、見積依頼No.が自動採番され、購入プロセスが開始されます。
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => { setShowStartModal(false); setSelectedApplication(null); }}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmStartResponse}
                style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                対応を開始する
              </button>
            </div>
          </div>
        </div>
      )}

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
