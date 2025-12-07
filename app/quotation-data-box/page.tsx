'use client';

import React, { useState, useEffect } from 'react';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useMasterStore } from '@/lib/stores';
import { RfqGroupStatus, AssetMaster } from '@/lib/types';
import {
  OCRResult,
  QuotationFormData,
  QuotationFilter
} from '@/lib/types/quotation';
import { Header } from '@/components/layouts/Header';
import { WINDOW_SIZES, TIMEOUTS, MESSAGES } from '@/lib/constants/quotation';
import { MOCK_OCR_RESULT } from '@/lib/mocks/quotationMockData';
import { RfqGroupsTab } from './components/RfqGroupsTab';
import { QuotationsTab } from './components/QuotationsTab';
import { QuotationRegistrationModal } from './components/QuotationRegistrationModal';

type TabType = 'rfqGroups' | 'quotations';

export default function QuotationManagementPage() {
  const { rfqGroups, updateRfqGroup, deleteRfqGroup } = useRfqGroupStore();
  const {
    quotationGroups,
    quotationItems,
    addQuotationGroup,
    addQuotationItems,
    deleteQuotationGroup,
    generateReceivedQuotationNo
  } = useQuotationStore();
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
  const [itemAssetLinks, setItemAssetLinks] = useState<Record<number, string>>({});

  // 現在紐づけ中の明細項目ID（モーダルStep 3用）
  const [linkingItemId, setLinkingItemId] = useState<number | null>(null);

  // SHIP資産マスタを別ウィンドウで開く（特定の明細項目に紐づける）
  const handleOpenAssetMasterWindow = (itemId: number) => {
    setLinkingItemId(itemId);
    const { width, height } = WINDOW_SIZES.ASSET_MASTER;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/asset-master',
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // AI推薦機能（見積明細とマッチする資産マスタを推薦）
  const getAIRecommendation = (item: { itemName: string; manufacturer?: string; model?: string }) => {
    // 品目名とメーカー、型番で簡易的にマッチング
    const recommendation = assetMasterData.find(asset =>
      asset.item.includes(item.itemName) ||
      (item.manufacturer && asset.maker.includes(item.manufacturer)) ||
      (item.model && asset.model === item.model)
    );
    return recommendation;
  };

  // 資産マスタ選択ウィンドウからのメッセージを受信（モーダルStep 3用）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // セキュリティチェック: 同一オリジンからのメッセージのみ処理
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED' && linkingItemId !== null) {
        const selectedAssets = event.data.assets as AssetMaster[];
        if (selectedAssets && selectedAssets.length > 0) {
          // 最初に選択された資産を使用
          const asset = selectedAssets[0];

          // モーダルのステップ3での紐付け
          setItemAssetLinks(prev => ({
            ...prev,
            [linkingItemId]: asset.id
          }));
          setLinkingItemId(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [linkingItemId]);

  // 見積書登録開始
  const handleStartQuotationRegistration = (rfqGroupId?: number) => {
    setQuotationFormData({
      rfqGroupId: rfqGroupId?.toString() || '',
      pdfFile: null
    });
    setModalStep(1);
    setOcrResult(null);
    setItemAssetLinks({});
    setShowQuotationModal(true);
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

  // 見積書登録確定
  const handleSubmitQuotation = () => {
    if (!ocrResult) return;

    const rfqGroup = quotationFormData.rfqGroupId
      ? rfqGroups.find(g => g.id.toString() === quotationFormData.rfqGroupId)
      : undefined;

    // 見積グループ（ヘッダー）を作成
    const groupId = addQuotationGroup({
      receivedQuotationNo: generateReceivedQuotationNo(),
      rfqGroupId: rfqGroup?.id,
      rfqNo: rfqGroup?.rfqNo,
      vendorName: ocrResult.vendorName,
      quotationDate: ocrResult.quotationDate,
      validityPeriod: ocrResult.validityPeriod,
      deliveryPeriod: ocrResult.deliveryPeriod,
      phase: ocrResult.phase,
      totalAmount: ocrResult.totalAmount,
      pdfUrl: quotationFormData.pdfFile ? URL.createObjectURL(quotationFormData.pdfFile) : undefined
    });

    // 見積明細を作成（個別レコードとして）
    const quotationNo = generateReceivedQuotationNo();
    const itemsToAdd = ocrResult.items.map((item, index) => ({
      quotationGroupId: groupId,
      receivedQuotationNo: quotationNo,
      itemType: item.itemType,
      itemName: item.itemName,
      manufacturer: item.manufacturer,
      model: item.model,
      quantity: item.quantity,
      unit: item.unit,
      listPriceUnit: item.listPriceUnit,
      listPriceTotal: item.listPriceTotal,
      sellingPriceUnit: item.sellingPriceUnit,
      sellingPriceTotal: item.sellingPriceTotal,
      discount: item.discount,
      taxRate: item.taxRate,
      totalWithTax: item.totalWithTax,
      assetMasterId: itemAssetLinks[index] ? itemAssetLinks[index] : undefined,
      linkedApplicationIds: []
    }));

    addQuotationItems(itemsToAdd);

    // 見積依頼グループのステータスを更新
    if (rfqGroup) {
      updateRfqGroup(rfqGroup.id, { status: '回答受領' });
    }

    alert(MESSAGES.QUOTATION_REGISTERED(quotationNo, itemsToAdd.length));
    setShowQuotationModal(false);
    setModalStep(1);
    setItemAssetLinks({});
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
            見積依頼グループ ({rfqGroups.length})
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
            受領見積 ({quotationGroups.length})
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

      {/* 受領見積タブ */}
      {activeTab === 'quotations' && (
        <QuotationsTab
          quotationGroups={quotationGroups}
          quotationItems={quotationItems}
          rfqGroups={rfqGroups}
          assetMasterData={assetMasterData}
          quotationFilter={quotationFilter}
          onFilterChange={setQuotationFilter}
          onRegisterQuotation={() => handleStartQuotationRegistration()}
          onDeleteQuotation={deleteQuotationGroup}
        />
      )}

      {/* 見積書登録モーダル */}
      <QuotationRegistrationModal
        show={showQuotationModal}
        step={modalStep}
        rfqGroups={rfqGroups}
        assetMasterData={assetMasterData}
        formData={quotationFormData}
        ocrProcessing={ocrProcessing}
        ocrResult={ocrResult}
        itemAssetLinks={itemAssetLinks}
        onFormDataChange={setQuotationFormData}
        onPdfUpload={handlePdfUpload}
        onGenerateTestOCR={handleGenerateTestOCR}
        onStepChange={(step) => {
          if (step === 3) {
            setItemAssetLinks({});
          }
          setModalStep(step);
        }}
        onOpenAssetMasterWindow={handleOpenAssetMasterWindow}
        onAdoptRecommendation={(itemIndex, assetId) => {
          setItemAssetLinks({ ...itemAssetLinks, [itemIndex]: assetId });
        }}
        onRemoveLink={(itemIndex) => {
          const newLinks = { ...itemAssetLinks };
          delete newLinks[itemIndex];
          setItemAssetLinks(newLinks);
        }}
        getAIRecommendation={getAIRecommendation}
        onSubmit={handleSubmitQuotation}
        onClose={() => setShowQuotationModal(false)}
      />
    </div>
  );
}
