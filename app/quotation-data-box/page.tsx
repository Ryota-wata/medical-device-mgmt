'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { useEditListStore } from '@/lib/stores/editListStore';
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
import { RepairRequestsTab } from './components/RepairRequestsTab';
import { QuotationRegistrationModal } from './components/QuotationRegistrationModal';
import { ApplicationFormData } from './components/QuotationRegistrationModal/ApplicationCreationModal';

// サブタブ
type SubTabType = 'rfqGroups' | 'quotations' | 'repairRequests' | 'repairDetails' | 'makerMaintenance' | 'inHouseInspection';

const SUB_TABS: { key: SubTabType; label: string }[] = [
  { key: 'rfqGroups', label: '見積G一覧' },
  { key: 'quotations', label: '見積明細' },
  { key: 'repairRequests', label: '修理依頼一覧' },
  { key: 'repairDetails', label: '修理明細' },
  { key: 'makerMaintenance', label: 'メーカー保守一覧' },
  { key: 'inHouseInspection', label: '院内点検一覧' },
];

// クエリパラメータを読み取るコンポーネント
function TabSwitcher({ onTabChange }: { onTabChange: (tab: SubTabType) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') as SubTabType | null;
    if (tab && SUB_TABS.some(t => t.key === tab)) {
      onTabChange(tab);
    }
  }, [searchParams, onTabChange]);

  return null;
}

export default function QuotationManagementPage() {
  const router = useRouter();
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
  const { editLists } = useEditListStore();

  // サブタブ
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('rfqGroups');
  // 選択中の編集リスト
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');

  // 見積依頼グループタブ用のステータスフィルター
  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqGroupStatus | ''>('');

  // 受領見積タブ用のフィルター
  const [quotationFilter, setQuotationFilter] = useState<QuotationFilter>({
    rfqGroupId: '',
    phase: ''
  });

  // 見積書登録モーダル
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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
    const today = new Date();
    const applicationNo = `APP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Date.now() % 1000).padStart(3, '0')}`;

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

    if (quotationFormData.rfqGroupId) {
      const rfqGroup = rfqGroups.find(g => g.id.toString() === quotationFormData.rfqGroupId);
      if (rfqGroup) {
        const newAppId = applications.length + 1;
        updateRfqGroup(rfqGroup.id, {
          applicationIds: [...rfqGroup.applicationIds, newAppId]
        });
      }
    }

    alert(`申請を作成しました: ${applicationNo}`);
  };

  // テストデータでOCR結果を生成して明細確認画面へ遷移
  const handleGenerateTestOCR = () => {
    setOcrProcessing(true);
    setTimeout(() => {
      setOcrResult(MOCK_OCR_RESULT);
      setOcrProcessing(false);
      setShowQuotationModal(false);
      // 明細確認画面へ遷移
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
    setActiveSubTab('quotations');
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
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f5' }}>
      {/* クエリパラメータでタブ切り替え */}
      <Suspense fallback={null}>
        <TabSwitcher onTabChange={setActiveSubTab} />
      </Suspense>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        centerContent={
          <div style={{
            background: '#c0392b',
            padding: '6px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>編集リスト:</span>
            <select
              value={selectedEditListId}
              onChange={(e) => setSelectedEditListId(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '3px',
                background: 'white',
                minWidth: '180px',
              }}
            >
              <option value="">選択してください</option>
              {editLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左側：メインパネル */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          {/* サブタブ */}
          <div style={{ background: 'white', borderBottom: '2px solid #dee2e6', display: 'flex', borderRadius: '4px 4px 0 0' }}>
            {SUB_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  background: activeSubTab === tab.key ? '#3498db' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeSubTab === tab.key ? 'bold' : 'normal',
                  color: activeSubTab === tab.key ? 'white' : '#555',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* フィルター（見積G一覧タブのみ表示） */}
          {activeSubTab === 'rfqGroups' && (
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
                <label style={{ fontSize: '12px', color: '#555' }}>見積区分</label>
                <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                  <option value="">すべて</option>
                  <option value="purchase">購入</option>
                  <option value="lease">リース</option>
                  <option value="installment">割賦</option>
                  <option value="rental">レンタル</option>
                  <option value="trial">試用</option>
                  <option value="borrow">借用</option>
                  <option value="repair">修理</option>
                  <option value="maintenance">保守</option>
                  <option value="inspection">点検</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#555' }}>見積フェーズ</label>
                <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                  <option value="">すべて</option>
                  <option value="listPrice">定価</option>
                  <option value="estimate">概算</option>
                  <option value="final">最終原本登録用</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#555' }}>ステータス</label>
                <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                  <option value="">すべて</option>
                  <option value="見積依頼">見積依頼</option>
                  <option value="見積依頼済">見積依頼済</option>
                  <option value="見積登録済">見積登録済</option>
                  <option value="発注登録済">発注登録済</option>
                  <option value="検収登録済">検収登録済</option>
                  <option value="資産仮登録済">資産仮登録済</option>
                  <option value="資産登録済">資産登録済</option>
                </select>
              </div>
            </div>
          )}

          {/* テーブルエリア */}
          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            {activeSubTab === 'rfqGroups' && (
              <RfqGroupsTab
                rfqGroups={rfqGroups}
                rfqStatusFilter={rfqStatusFilter}
                onFilterChange={setRfqStatusFilter}
                onRegisterQuotation={handleStartQuotationRegistration}
                onRegisterOrder={handleStartOrderRegistration}
                onRegisterInspection={handleStartInspectionRegistration}
                onRegisterAssetProvisional={handleStartAssetProvisionalRegistration}
                onUpdateDeadline={(id, deadline) => updateRfqGroup(id, { deadline })}
              />
            )}
            {activeSubTab === 'quotations' && (
              <QuotationsTab
                quotationGroups={quotationGroups}
                quotationItems={quotationItems}
                rfqGroups={rfqGroups}
                quotationFilter={quotationFilter}
                onFilterChange={setQuotationFilter}
                onUpdateItem={updateQuotationItem}
              />
            )}
            {activeSubTab === 'repairRequests' && (
              <RepairRequestsTab />
            )}
            {activeSubTab === 'repairDetails' && (
              <div style={{ padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>明細No</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>依頼No</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>修理内容</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>部品名</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>金額</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                        データがありません
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {activeSubTab === 'makerMaintenance' && (
              <div style={{ padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>保守No</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>資産名</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>メーカー</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>契約期間</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>次回点検日</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                        データがありません
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {activeSubTab === 'inHouseInspection' && (
              <div style={{ padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>点検No</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>資産名</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>点検種別</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>前回点検日</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>次回点検日</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                        データがありません
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 資産仮登録モード選択ダイアログ */}
      {showModeSelection && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8, textWrap: 'balance' }}>資産仮登録の入力方法を選択</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>登録作業の状況に応じて入力方法を選んでください。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* モバイル */}
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

              {/* PC */}
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
        onCreateApplication={handleCreateApplication}
        onSubmit={handleSubmitQuotation}
        onClose={() => setShowQuotationModal(false)}
      />
    </div>
  );
}
