'use client';

import React, { useState, useEffect } from 'react';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { RfqGroupStatus, AssetMaster } from '@/lib/types';
import {
  OCRResult,
  OCRResultItem,
  QuotationFormData,
  QuotationFilter,
  ConfirmedStateMap
} from '@/lib/types/quotation';
import { Header } from '@/components/layouts/Header';
import { WINDOW_SIZES, TIMEOUTS, MESSAGES } from '@/lib/constants/quotation';
import { MOCK_OCR_RESULT } from '@/lib/mocks/quotationMockData';
import { RfqGroupsTab } from './components/RfqGroupsTab';
import { QuotationsTab } from './components/QuotationsTab';
import { QuotationRegistrationModal } from './components/QuotationRegistrationModal';
import { ApplicationFormData } from './components/QuotationRegistrationModal/ApplicationCreationModal';

type TabType = 'rfqGroups' | 'quotations';

export default function QuotationManagementPage() {
  const { rfqGroups, updateRfqGroup, deleteRfqGroup } = useRfqGroupStore();
  const {
    quotationGroups,
    quotationItems,
    addQuotationGroup,
    addQuotationItems,
    updateQuotationItem,
    deleteQuotationGroup,
    generateReceivedQuotationNo
  } = useQuotationStore();
  const { applications, addApplication } = useApplicationStore();
  const { assets: assetMasterData } = useMasterStore();

  const [activeTab, setActiveTab] = useState<TabType>('rfqGroups');

  // 見積依頼グループタブ用のステータスフィルター
  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqGroupStatus | ''>('');

  // 受領見積タブ用のフィルター
  const [quotationFilter, setQuotationFilter] = useState<QuotationFilter>({
    rfqGroupId: '',
    phase: ''
  });

  // 見積書登録モーダル
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [quotationFormData, setQuotationFormData] = useState<QuotationFormData>({
    rfqGroupId: '',
    pdfFile: null
  });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

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

  // 申請を作成
  const handleCreateApplication = (
    formData: ApplicationFormData,
    ocrItem: OCRResultItem
  ) => {
    // 申請番号を生成
    const today = new Date();
    const applicationNo = `APP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Date.now() % 1000).padStart(3, '0')}`;

    // 申請を作成
    addApplication({
      applicationNo,
      applicationDate: today.toISOString().split('T')[0],
      applicationType: formData.applicationType,
      facility: {
        building: formData.building,
        floor: formData.floor,
        department: formData.department,
        section: formData.section,
      },
      roomName: formData.roomName,
      asset: {
        name: ocrItem.itemName,
        model: ocrItem.model || '',
      },
      vendor: ocrItem.manufacturer || '',
      quantity: String(formData.quantity),
      unit: ocrItem.unit || '台',
      applicationReason: formData.applicationReason,
      executionYear: formData.executionYear,
      status: '下書き',
      approvalProgress: {
        current: 0,
        total: 3,
      },
      freeInput: '',
      quotationInfo: [],
    });

    // 見積依頼グループに申請を追加
    if (quotationFormData.rfqGroupId) {
      const rfqGroup = rfqGroups.find(g => g.id.toString() === quotationFormData.rfqGroupId);
      if (rfqGroup) {
        // 最新の申請IDを取得（簡易的な実装）
        const newAppId = applications.length + 1;
        updateRfqGroup(rfqGroup.id, {
          applicationIds: [...rfqGroup.applicationIds, newAppId]
        });
      }
    }

    alert(`申請を作成しました: ${applicationNo}`);
  };

  // テストデータでOCR結果を生成
  const handleGenerateTestOCR = () => {
    setOcrProcessing(true);

    setTimeout(() => {
      setOcrResult(MOCK_OCR_RESULT);
      setOcrProcessing(false);
      setModalStep(2);
    }, TIMEOUTS.OCR_SIMULATION);
  };

  // PDFアップロード & OCR処理
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuotationFormData(prev => ({ ...prev, pdfFile: file }));
    handleGenerateTestOCR();
  };

  // 見積書登録確定（全明細を登録、資産マスタ紐付けはオプション）
  const handleSubmitQuotation = (confirmedState: ConfirmedStateMap, submittedOcrResult: OCRResult) => {
    if (!submittedOcrResult) return;

    const rfqGroup = quotationFormData.rfqGroupId
      ? rfqGroups.find(g => g.id.toString() === quotationFormData.rfqGroupId)
      : undefined;

    // 見積グループ（ヘッダー）を作成
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

    // 全明細を登録（OCRの明細をそのまま1レコードとして登録）
    const quotationNo = generateReceivedQuotationNo();
    const itemsToAdd: Parameters<typeof addQuotationItems>[0] = [];

    // 全てのOCRアイテムを処理
    submittedOcrResult.items.forEach((ocrItem, ocrItemIndex) => {
      // 資産マスタ紐付け情報を取得（あれば）
      const key = `${ocrItemIndex}`;
      const confirmedInfo = confirmedState[key];
      const assetInfo = confirmedInfo?.assetInfo;

      // AI判定から情報を取得（資産マスタ紐付けがなければAI判定を使用）
      const aiJudgment = ocrItem.aiJudgments[0];

      // 資産マスタから選択した場合、assetMasterIdを取得
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
        // 商品情報（原本情報）
        rowNo: ocrItem.rowNo,
        originalItemName: ocrItem.itemName,
        originalManufacturer: ocrItem.manufacturer,
        originalModel: ocrItem.model,
        originalQuantity: ocrItem.quantity,
        // AI判定・資産マスタ情報（紐付けがあればそれを使用、なければAI判定、なければ原本情報）
        itemType: ocrItem.itemType,
        category: assetInfo?.category || aiJudgment?.category || '',
        largeClass: assetInfo?.majorCategory || aiJudgment?.majorCategory || '',
        middleClass: assetInfo?.middleCategory || aiJudgment?.middleCategory || '',
        itemName: assetInfo?.assetName || aiJudgment?.assetName || ocrItem.itemName,
        manufacturer: assetInfo?.manufacturer || aiJudgment?.manufacturer || ocrItem.manufacturer,
        model: assetInfo?.model || aiJudgment?.model || ocrItem.model,
        aiQuantity: ocrItem.quantity,
        // 見積依頼No
        rfqNo: rfqGroup?.rfqNo,
        // 価格情報（原本情報）
        unit: ocrItem.unit,
        listPriceUnit: ocrItem.listPriceUnit,
        listPriceTotal: ocrItem.listPriceTotal,
        purchasePriceUnit: ocrItem.purchasePriceUnit,
        purchasePriceTotal: ocrItem.purchasePriceTotal,
        remarks: ocrItem.remarks,
        // 価格情報（按分登録）- 初期値は原本情報と同じ（ユーザーが手動で編集）
        allocListPriceUnit: ocrItem.listPriceUnit,
        allocListPriceTotal: ocrItem.listPriceTotal,
        allocPriceUnit: ocrItem.purchasePriceUnit,
        allocDiscount: ocrItem.discount,
        allocTaxRate: ocrItem.taxRate,
        allocTaxTotal: ocrItem.totalWithTax,
        // 資産マスタとの紐づけ（あれば）
        assetMasterId: matchedAsset?.id,
        linkedApplicationIds: []
      });
    });

    addQuotationItems(itemsToAdd);

    // 見積依頼グループのステータスを更新
    if (rfqGroup) {
      updateRfqGroup(rfqGroup.id, { status: '回答受領' });
    }

    alert(MESSAGES.QUOTATION_REGISTERED(quotationNo, itemsToAdd.length));
    setShowQuotationModal(false);
    setModalStep(1);
    setOcrResult(null);
    setActiveTab('quotations');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title="見積管理"
        showBackButton={true}
        hideMenu={true}
      />

      {/* タブ切り替え */}
      <div style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
        <div style={{ display: 'flex', padding: '0 20px' }}>
          <button
            onClick={() => setActiveTab('rfqGroups')}
            style={{
              padding: '15px 30px',
              background: activeTab === 'rfqGroups' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'rfqGroups' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'rfqGroups' ? 'bold' : 'normal',
              color: activeTab === 'rfqGroups' ? '#2c3e50' : '#7f8c8d'
            }}
          >
            見積依頼グループ
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            style={{
              padding: '15px 30px',
              background: activeTab === 'quotations' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'quotations' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'quotations' ? 'bold' : 'normal',
              color: activeTab === 'quotations' ? '#2c3e50' : '#7f8c8d'
            }}
          >
            見積明細情報
          </button>
        </div>
      </div>

      {/* 見積依頼グループタブ */}
      {activeTab === 'rfqGroups' && (
        <RfqGroupsTab
          rfqGroups={rfqGroups}
          rfqStatusFilter={rfqStatusFilter}
          onFilterChange={setRfqStatusFilter}
          onRegisterQuotation={handleStartQuotationRegistration}
        />
      )}

      {/* 見積明細情報タブ */}
      {activeTab === 'quotations' && (
        <QuotationsTab
          quotationGroups={quotationGroups}
          quotationItems={quotationItems}
          rfqGroups={rfqGroups}
          quotationFilter={quotationFilter}
          onFilterChange={setQuotationFilter}
          onUpdateItem={updateQuotationItem}
        />
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
        onCreateApplication={handleCreateApplication}
        onSubmit={handleSubmitQuotation}
        onClose={() => setShowQuotationModal(false)}
      />
    </div>
  );
}
