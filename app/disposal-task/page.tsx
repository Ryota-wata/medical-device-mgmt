'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { ACCOUNT_DIVISIONS } from '@/lib/data/account-divisions';
import { OrderRegistrationModal } from '@/components/ui/OrderRegistrationModal';

interface VendorEntry {
  localId: string;
  vendorName: string;
  personInCharge: string;
  email: string;
  tel: string;
  submitDeadline: string;
  requestNote: string;
  isSent: boolean;
}

let vendorLocalIdCounter = 0;
function generateLocalId(): string {
  vendorLocalIdCounter += 1;
  return `dv-${vendorLocalIdCounter}`;
}

const DISPOSAL_STEPS = [
  { step: 1, label: '見積依頼' },
  { step: 2, label: '見積登録' },
  { step: 3, label: '発注登録' },
  { step: 4, label: '完了登録' },
];

type DisposalStatus = '新規申請' | '見積依頼済' | '発注用見積登録済' | '発注済' | '納期確定' | '検収済' | '完了' | '申請見送り';

interface RegisteredQuotation {
  id: number;
  phase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  vendorName: string;
  amount: number;
  accountType: string;
  registeredAt: string;
}

interface RegisteredDocument {
  id: number;
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | '契約書' | '請求書' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

interface DisposalApplication {
  id: string;
  groupId: string;
  groupName: string;
  rfqNo: string;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
  applicantContact: string;
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  qrLabel: string;
  disposalReason: string;
  comment: string;
  status: DisposalStatus;
  receptionDepartment: string;
  receptionPerson: string;
  receptionContact: string;
  quotationPhase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  deliveryDate: string;
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | '契約書' | '請求書' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther: string;
}

const getMockApplication = (groupId: string): DisposalApplication => {
  const groupDataMap: Record<string, { groupName: string; rfqNo: string; status: DisposalStatus; vendorName: string; vendorPerson: string; vendorEmail: string; vendorContact: string }> = {
    '1': { groupName: 'ME室 心電計廃棄一式', rfqNo: 'RFQ-20260110-0001', status: '見積依頼済', vendorName: 'シーメンス・ジャパン', vendorPerson: '山田太郎', vendorEmail: 'yamada@siemens.co.jp', vendorContact: '03-1234-5678' },
    '2': { groupName: '放射線科 超音波装置廃棄', rfqNo: 'RFQ-20260111-0002', status: '発注用見積登録済', vendorName: 'GEヘルスケア', vendorPerson: '鈴木一郎', vendorEmail: 'suzuki@ge.co.jp', vendorContact: '03-2345-6789' },
    '3': { groupName: '検査科 血液ガス分析装置廃棄', rfqNo: 'RFQ-20260113-0003', status: '発注済', vendorName: 'フィリップス・ジャパン', vendorPerson: '佐藤花子', vendorEmail: 'sato@philips.co.jp', vendorContact: '03-3456-7890' },
    '4': { groupName: '看護部 輸液ポンプ廃棄', rfqNo: 'RFQ-20260115-0004', status: '納期確定', vendorName: 'オリンパス', vendorPerson: '田中次郎', vendorEmail: 'tanaka@olympus.co.jp', vendorContact: '03-4567-8901' },
    '5': { groupName: '手術部 電気メス移動作業', rfqNo: 'RFQ-20260120-0005', status: '完了', vendorName: 'キヤノンメディカル', vendorPerson: '高橋美咲', vendorEmail: 'takahashi@canon.co.jp', vendorContact: '03-5678-9012' },
  };

  const groupData = groupDataMap[groupId] || { groupName: '新規グループ', rfqNo: `RFQ-NEW-${groupId}`, status: '新規申請' as DisposalStatus, vendorName: '', vendorPerson: '', vendorEmail: '', vendorContact: '' };

  return {
    id: groupId,
    groupId,
    groupName: groupData.groupName,
    rfqNo: groupData.rfqNo,
    applicationNo: `DSP-2026-${groupId.padStart(3, '0')}`,
    applicationDate: '2026-02-10',
    applicantName: '山田 太郎',
    applicantDepartment: 'ME室',
    applicantContact: '内線2345',
    installationDivision: '診療技術部',
    installationDepartment: 'ME室',
    installationRoom: 'ME機器管理室',
    itemName: '心電計',
    maker: '日本光電',
    model: 'ECG-2550',
    serialNo: 'SN-2020-12345',
    qrLabel: 'QR-001234',
    disposalReason: '耐用年数超過',
    comment: '10年以上使用し、部品供給終了のため廃棄',
    status: groupData.status,
    receptionDepartment: 'ME室',
    receptionPerson: '佐藤 花子',
    receptionContact: '内線2346',
    quotationPhase: '発注用',
    saveFormat: '電子取引',
    deliveryDate: '',
    documentType: '完了報告書',
    accountType: '廃棄費',
    accountOther: '',
  };
};

const getInitialStep = (status: DisposalStatus): number => {
  switch (status) {
    case '新規申請': return 1;
    case '見積依頼済': return 1;
    case '発注用見積登録済': return 2;
    case '発注済': return 3;
    case '納期確定': return 3;
    case '検収済': return 4;
    case '完了': return 4;
    case '申請見送り': return 1;
    default: return 1;
  }
};

type PreviewDocTab = '見積依頼書' | '見積書' | '発注書' | '完了報告書他';

// ============================================================
// Tailwind class constants
// ============================================================
const inputCls =
  'h-[42px] px-3 rounded-lg bg-surface-card border border-stroke-input text-sm text-content-primary focus:outline-none focus:border-cta-primary transition-colors disabled:bg-stroke-card disabled:text-content-sub disabled:cursor-not-allowed';

const labelCls = 'text-sm font-semibold text-content-primary whitespace-nowrap';

// ============================================================
// Sub-components
// ============================================================

/**
 * Step カード
 * Step 4（廃棄完了, destructive）は alert (#DA0000) を使用、それ以外は Figma 緑
 */
function Section({
  step,
  title,
  children,
  destructive,
  enabled,
  completed,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  destructive?: boolean;
  enabled: boolean;
  completed: boolean;
}) {
  const headerBg = enabled
    ? (destructive ? 'bg-[#DA0000]' : 'bg-cta-primary')
    : (completed ? 'bg-cta-primary' : 'bg-content-primary');
  const borderClass = enabled
    ? (destructive ? 'border-2 border-[#DA0000]' : 'border-2 border-cta-primary')
    : 'border border-stroke-card';
  return (
    <div className={`bg-surface-card ${borderClass} rounded-2xl mb-4 ${enabled ? 'opacity-100' : 'opacity-70'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${headerBg} text-white rounded-t-2xl`}>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
          {completed ? '✓' : step}
        </span>
        <span className="text-sm font-bold flex-1">{title}</span>
        {completed && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">完了</span>}
        {enabled && !completed && (
          <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">作業中</span>
        )}
      </div>
      <div className={`p-4 ${enabled ? '' : 'pointer-events-none'}`}>{children}</div>
    </div>
  );
}

/** プログレスバー */
function ProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center justify-center px-4 py-3 bg-stroke-card border-b border-stroke-input">
      {DISPOSAL_STEPS.map((item, index) => {
        const isCompleted = item.step < activeStep;
        const isActive = item.step === activeStep;
        const circleClass = isCompleted
          ? 'bg-cta-primary-dark text-white'
          : isActive
          ? 'bg-cta-primary text-white border-2 border-cta-primary-dark'
          : 'bg-stroke-input text-content-sub';
        const labelClass = isActive
          ? 'text-cta-primary font-bold'
          : isCompleted
          ? 'text-cta-primary-dark'
          : 'text-content-sub';
        return (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
                {isCompleted ? '✓' : item.step}
              </div>
              <span className={`text-xs mt-1 text-center whitespace-nowrap ${labelClass}`}>
                {item.label}
              </span>
            </div>
            {index < DISPOSAL_STEPS.length - 1 && (
              <div
                className={`flex-1 h-[3px] mx-2 mb-4 min-w-[30px] max-w-[60px] ${isCompleted ? 'bg-cta-primary-dark' : 'bg-stroke-input'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ThLabelCell({ children, accent = 'primary', width = 'w-[120px]' }: { children: React.ReactNode; accent?: 'primary' | 'destructive'; width?: string }) {
  const bg = accent === 'destructive' ? 'bg-[#DA0000]' : 'bg-cta-primary';
  return (
    <th className={`${bg} text-white px-3 py-2.5 text-sm font-bold text-left ${width} border border-stroke-input whitespace-nowrap`}>
      {children}
    </th>
  );
}

function TdCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`bg-surface-card px-3 py-2.5 border border-stroke-input text-sm text-content-primary ${className}`}>
      {children}
    </td>
  );
}

function FormRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-4 mb-3 flex-wrap ${className}`}>{children}</div>
  );
}

// ============================================================
// Main content
// ============================================================
function DisposalTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId') || '1';

  const [application, setApplication] = useState<DisposalApplication | null>(null);
  const [formData, setFormData] = useState<DisposalApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<VendorEntry[]>([]);
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [quotationVendorName, setQuotationVendorName] = useState<string>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  const [quotationAccountType, setQuotationAccountType] = useState<string>('');
  const [settlementNo, setSettlementNo] = useState<string>('');
  const [isOrderRegisterModalOpen, setIsOrderRegisterModalOpen] = useState(false);
  const [registeredOrderNo, setRegisteredOrderNo] = useState<string>('');
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedDocFileName, setSelectedDocFileName] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<PreviewDocTab>('見積依頼書');
  const [previewVendorIndex, setPreviewVendorIndex] = useState<number | null>(null);
  const [previewQuotationIndex, setPreviewQuotationIndex] = useState<number | null>(null);
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number | null>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPanelWidth(Math.min(70, Math.max(30, newWidth)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  useEffect(() => {
    const data = getMockApplication(groupId);
    setApplication(data);
    setFormData({ ...data });
    setCurrentStep(getInitialStep(data.status));

    const groupDataMap: Record<string, { vendorName: string; vendorPerson: string; vendorEmail: string; vendorContact: string }> = {
      '1': { vendorName: 'シーメンス・ジャパン', vendorPerson: '山田太郎', vendorEmail: 'yamada@siemens.co.jp', vendorContact: '03-1234-5678' },
      '2': { vendorName: 'GEヘルスケア', vendorPerson: '鈴木一郎', vendorEmail: 'suzuki@ge.co.jp', vendorContact: '03-2345-6789' },
      '3': { vendorName: 'フィリップス・ジャパン', vendorPerson: '佐藤花子', vendorEmail: 'sato@philips.co.jp', vendorContact: '03-3456-7890' },
      '4': { vendorName: 'オリンパス', vendorPerson: '田中次郎', vendorEmail: 'tanaka@olympus.co.jp', vendorContact: '03-4567-8901' },
      '5': { vendorName: 'キヤノンメディカル', vendorPerson: '高橋美咲', vendorEmail: 'takahashi@canon.co.jp', vendorContact: '03-5678-9012' },
    };
    const vd = groupDataMap[groupId];
    const isSent = data.status !== '新規申請';
    if (vd && vd.vendorName) {
      setVendors([{
        localId: generateLocalId(),
        vendorName: vd.vendorName,
        personInCharge: vd.vendorPerson,
        email: vd.vendorEmail,
        tel: vd.vendorContact,
        submitDeadline: '',
        requestNote: '',
        isSent,
      }]);
    } else {
      setVendors([{
        localId: generateLocalId(),
        vendorName: '',
        personInCharge: '',
        email: '',
        tel: '',
        submitDeadline: '',
        requestNote: '',
        isSent: false,
      }]);
    }
  }, [groupId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<DisposalApplication>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const updateVendorField = (index: number, field: keyof VendorEntry, value: string) => {
    setVendors(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleAddVendor = () => {
    setVendors(prev => [
      ...prev,
      { localId: generateLocalId(), vendorName: '', personInCharge: '', email: '', tel: '', submitDeadline: '', requestNote: '', isSent: false },
    ]);
  };

  const handleRemoveVendor = (index: number) => {
    setVendors(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const unsentCount = vendors.filter(v => !v.isSent).length;

  const handleStep1VendorSubmit = (index: number) => {
    const vendor = vendors[index];
    if (!vendor.vendorName || !vendor.email) {
      alert('業者名とメールアドレスを入力してください');
      return;
    }
    if (!vendor.submitDeadline) {
      alert('見積提出期限を入力してください');
      return;
    }
    setVendors(prev => prev.map((v, i) => i === index ? { ...v, isSent: true } : v));
    alert(`${vendor.vendorName} への見積依頼を送信しました`);
  };

  const handleSendRfqAll = () => {
    const unsent = vendors.filter(v => !v.isSent);
    if (unsent.length === 0) {
      alert('送信対象の業者がありません');
      return;
    }
    const invalid = unsent.filter(v => !v.vendorName || !v.email);
    if (invalid.length > 0) {
      alert('未送信の業者すべてに業者名とメールアドレスを入力してください');
      return;
    }
    setVendors(prev => prev.map(v => ({ ...v, isSent: true })));
    alert(`${unsent.length}件の見積依頼を送信しました`);
  };

  const handleStep1Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積依頼を完了しました。STEP②へ進みます。');
      setApplication(prev => prev ? { ...prev, status: '見積依頼済' } : prev);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 300);
  };

  const handleCancelApplication = () => {
    if (confirm('この廃棄申請を見送りますか？廃棄品の更新が必要な場合は原本リストより更新申請を行って下さい。')) {
      setApplication(prev => prev ? { ...prev, status: '申請見送り' } : prev);
      alert('申請を見送りました。一覧画面に戻ります。');
      router.push('/quotation-data-box/transfer-management');
    }
  };

  const handleAddQuotation = () => {
    if (!selectedFileName) {
      alert('見積ファイルを選択してください');
      return;
    }
    if (!quotationVendorName) {
      alert('見積登録業者を選択してください');
      return;
    }
    const newQuotation: RegisteredQuotation = {
      id: Date.now(),
      phase: formData.quotationPhase,
      saveFormat: formData.saveFormat,
      fileName: selectedFileName,
      vendorName: quotationVendorName,
      amount: parseFloat(quotationAmount) || 0,
      accountType: quotationAccountType,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredQuotations(prev => [...prev, newQuotation]);
    setSelectedFileName('');
    setQuotationVendorName('');
    setQuotationAmount('');
    setQuotationAccountType('');
    alert(`${formData.quotationPhase === '発注用' ? '発注用' : '参考'}見積を登録しました`);
  };

  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注用見積登録済' } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注済' } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 300);
  };

  const handleAddDocument = () => {
    if (!selectedDocFileName) return;
    const newDoc: RegisteredDocument = {
      id: Date.now(),
      documentType: formData.documentType,
      accountType: formData.accountType,
      accountOther: formData.accountType === 'その他' ? formData.accountOther : undefined,
      fileName: selectedDocFileName,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredDocuments(prev => [...prev, newDoc]);
    setSelectedDocFileName('');
  };

  const handleStep5Complete = () => {
    if (confirm('検収を完了し、このタスクを完了しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`廃棄タスク（${application.applicationNo}）が完了しました。\n一覧画面に戻ります。`);
        router.push('/quotation-data-box/transfer-management');
      }, 300);
    }
  };

  const vendorOptions = vendors.filter(v => v.vendorName).map(v => v.vendorName);

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="廃棄契約管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/transfer-management"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <ProgressBar activeStep={activeStep} />

      {/* 見積依頼グループ名 */}
      <div className="px-4 py-2 bg-surface-select border-b border-cta-primary text-sm font-bold text-cta-primary-dark">
        見積依頼グループ: {application.groupName}
        <span className="ml-4 text-xs font-normal text-cta-primary-dark">{application.rfqNo}</span>
      </div>

      {/* 基本情報バー */}
      <div className="flex gap-6 flex-wrap px-4 py-2 bg-surface-select border-b border-cta-primary text-xs text-cta-primary-dark">
        <span><strong>申請No:</strong> {application.applicationNo}</span>
        <span><strong>品目:</strong> {application.itemName}</span>
        <span><strong>メーカー:</strong> {application.maker}</span>
        <span><strong>型式:</strong> {application.model}</span>
        <span><strong>QRラベル:</strong> {application.qrLabel}</span>
      </div>

      {/* メインコンテンツ */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* 左側 */}
        <div
          className="flex flex-col min-h-0 overflow-hidden min-w-[400px]"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-4">
            {/* ===== STEP① ===== */}
            <Section step={1} title="STEP①．見積依頼" enabled={isStepEnabled(1)} completed={1 < activeStep}>
              <div className="px-4 py-2.5 bg-surface-select border border-cta-primary rounded-md mb-4 text-sm text-cta-primary-dark font-medium">
                業者を登録し見積依頼書を作成してください。複数業者への相見積もりが可能です。
              </div>

              {/* 受付部署 */}
              <div className="mb-4 px-4 py-3 bg-stroke-card rounded-md border border-stroke-input">
                <p className="text-sm font-bold text-content-primary mb-2">受付部署</p>
                <FormRow>
                  <label className={labelCls}>部署名</label>
                  <input
                    type="text"
                    value={formData.receptionDepartment}
                    onChange={(e) => updateFormData({ receptionDepartment: e.target.value })}
                    className={`${inputCls} w-[160px]`}
                    disabled={1 < activeStep}
                  />
                  <label className={labelCls}>担当者名</label>
                  <input
                    type="text"
                    value={formData.receptionPerson}
                    onChange={(e) => updateFormData({ receptionPerson: e.target.value })}
                    className={`${inputCls} w-[120px]`}
                    disabled={1 < activeStep}
                  />
                  <label className={labelCls}>連絡先</label>
                  <input
                    type="text"
                    value={formData.receptionContact}
                    onChange={(e) => updateFormData({ receptionContact: e.target.value })}
                    className={`${inputCls} w-[140px]`}
                    disabled={1 < activeStep}
                  />
                </FormRow>
              </div>

              {/* 依頼先 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-content-primary">依頼先</p>
                  <button
                    onClick={handleAddVendor}
                    disabled={1 < activeStep}
                    className="px-3 py-1 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs font-semibold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    + 業者追加（{vendors.length}社）
                  </button>
                </div>

                {vendors.map((vendor, index) => (
                  <div
                    key={vendor.localId}
                    className={`p-2 mb-2 border border-stroke-input rounded-md ${vendor.isSent ? 'bg-surface-screen opacity-80' : 'bg-surface-card'}`}
                  >
                    {/* 1行目 */}
                    <div className="flex gap-2 items-center mb-1.5">
                      <span className="bg-cta-primary text-white px-1.5 py-1 rounded-md text-xs font-bold flex-shrink-0 min-w-[48px] text-center whitespace-nowrap">
                        {vendor.isSent ? '送信済' : `依頼${index + 1}`}
                      </span>
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-content-sub mb-0.5">業者名 <span className="text-content-alert">*</span></p>
                          <input
                            value={vendor.vendorName}
                            onChange={(e) => updateVendorField(index, 'vendorName', e.target.value)}
                            placeholder="業者名"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={`${inputCls} w-full`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-content-sub mb-0.5">担当者名</p>
                          <input
                            value={vendor.personInCharge}
                            onChange={(e) => updateVendorField(index, 'personInCharge', e.target.value)}
                            placeholder="担当者"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={`${inputCls} w-full`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setPreviewVendorIndex(index);
                            setPreviewTab('見積依頼書');
                          }}
                          className={`px-2 py-1.5 text-white border-0 rounded-md cursor-pointer text-xs whitespace-nowrap transition-colors ${previewVendorIndex === index ? 'bg-content-primary' : 'bg-content-sub hover:bg-content-primary'}`}
                        >プレビュー</button>
                        {!vendor.isSent && 1 >= activeStep && (
                          <button
                            onClick={() => handleStep1VendorSubmit(index)}
                            disabled={isSubmitting}
                            className="px-2 py-1.5 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs whitespace-nowrap font-semibold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >依頼送信</button>
                        )}
                        {!vendor.isSent && vendors.length > 1 && 1 >= activeStep && (
                          <button
                            onClick={() => handleRemoveVendor(index)}
                            className="px-2 py-1.5 bg-content-alert text-white border-0 rounded-md cursor-pointer text-xs whitespace-nowrap hover:opacity-90 transition-colors"
                          >削除</button>
                        )}
                      </div>
                    </div>

                    {/* 2行目 */}
                    <div className="flex gap-2 ml-14">
                      <div className="flex-1">
                        <p className="text-xs text-content-sub mb-0.5">メール <span className="text-content-alert">*</span></p>
                        <input
                          value={vendor.email}
                          onChange={(e) => updateVendorField(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          disabled={vendor.isSent || 1 < activeStep}
                          className={`${inputCls} w-full`}
                        />
                      </div>
                      <div className="w-[150px] flex-shrink-0">
                        <p className="text-xs text-content-sub mb-0.5">連絡先</p>
                        <input
                          value={vendor.tel}
                          onChange={(e) => updateVendorField(index, 'tel', e.target.value)}
                          placeholder="03-0000-0000"
                          disabled={vendor.isSent || 1 < activeStep}
                          className={`${inputCls} w-full`}
                        />
                      </div>
                      <div className="w-[150px] flex-shrink-0">
                        <p className="text-xs text-content-sub mb-0.5">提出期限</p>
                        <input
                          type="date"
                          value={vendor.submitDeadline}
                          onChange={(e) => updateVendorField(index, 'submitDeadline', e.target.value)}
                          disabled={vendor.isSent || 1 < activeStep}
                          className={`${inputCls} w-full tabular-nums`}
                        />
                      </div>
                    </div>

                    {/* ご依頼事項 */}
                    <div className="mt-2 ml-14 border border-stroke-input rounded-md overflow-hidden">
                      <div className="px-3 py-1 text-xs text-content-primary bg-surface-screen flex items-center gap-2">
                        <span className="font-semibold">ご依頼事項</span>
                      </div>
                      <textarea
                        value={vendor.requestNote}
                        onChange={(e) => updateVendorField(index, 'requestNote', e.target.value)}
                        placeholder="ご依頼事項を入力してください"
                        rows={2}
                        disabled={vendor.isSent || 1 < activeStep}
                        className="w-full px-3 py-2 bg-surface-card text-sm text-content-primary border-0 border-t border-stroke-input resize-y min-h-[48px] focus:outline-none focus:border-cta-primary disabled:bg-stroke-card disabled:text-content-sub"
                      />
                    </div>
                  </div>
                ))}

                {/* 一括送信 */}
                <div className="py-3 px-1 border-t border-stroke-input flex justify-end">
                  <button
                    onClick={handleSendRfqAll}
                    disabled={unsentCount === 0 || 1 < activeStep}
                    className={`h-10 px-6 text-white border-0 rounded-md text-sm font-bold transition-colors ${unsentCount === 0 || 1 < activeStep ? 'bg-content-sub cursor-not-allowed' : 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer'}`}
                  >
                    {unsentCount > 0 ? `一括依頼送信（${unsentCount}件）` : '全件送信済'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={handleCancelApplication}
                  disabled={1 < activeStep || isSubmitting}
                  className="h-9 px-4 bg-transparent text-content-alert border border-content-alert rounded-md cursor-pointer text-sm hover:bg-surface-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  申請を見送る
                </button>
                <button
                  onClick={handleStep1Complete}
                  disabled={1 < activeStep || isSubmitting}
                  className="h-10 px-6 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  見積依頼完了 → STEP②へ
                </button>
              </div>
            </Section>

            {/* ===== STEP② ===== */}
            <Section step={2} title="STEP②．見積登録/発注登録" enabled={isStepEnabled(2)} completed={2 < activeStep}>
              <div className="px-4 py-3 bg-surface-select rounded-md mb-4 text-sm text-cta-primary-dark">
                見積書をファイル選択して登録し、業者名と見積金額を入力してください。
              </div>

              {/* 見積を追加テーブル */}
              <div className="mb-5">
                <p className="text-sm font-bold text-content-primary mb-2">見積を追加</p>
                <table className="w-full border-collapse border border-stroke-input">
                  <tbody>
                    <tr>
                      <ThLabelCell>添付ファイル</ThLabelCell>
                      <TdCell>
                        <div className="flex items-center gap-2.5">
                          <label className={`px-4 py-1.5 bg-surface-screen border border-stroke-input rounded-md text-sm whitespace-nowrap hover:bg-stroke-card transition-colors ${isStepEnabled(2) && activeStep <= 2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                            ファイルの選択
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={!isStepEnabled(2) || 2 < activeStep}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setSelectedFileName(file.name);
                              }}
                              className="hidden"
                            />
                          </label>
                          <span className={`text-sm ${selectedFileName ? 'text-cta-primary' : 'text-content-primary'}`}>
                            {selectedFileName || 'ファイルが選択されていません'}
                          </span>
                        </div>
                      </TdCell>
                    </tr>
                    <tr>
                      <ThLabelCell>業者名</ThLabelCell>
                      <TdCell>
                        <input
                          type="text"
                          value={vendors[0]?.vendorName || ''}
                          disabled
                          className={`${inputCls} w-[300px]`}
                        />
                        <span className="text-xs text-content-sub ml-2">
                          ※STEP①で登録した依頼先から自動取得
                        </span>
                      </TdCell>
                    </tr>
                    <tr>
                      <ThLabelCell>見積フェーズ</ThLabelCell>
                      <TdCell>
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="quotationPhase"
                              checked={formData.quotationPhase === '発注用'}
                              onChange={() => updateFormData({ quotationPhase: '発注用' })}
                              disabled={!isStepEnabled(2) || 2 < activeStep}
                              className="accent-cta-primary"
                            />
                            発注登録用見積
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="quotationPhase"
                              checked={formData.quotationPhase === '参考'}
                              onChange={() => updateFormData({ quotationPhase: '参考' })}
                              disabled={!isStepEnabled(2) || 2 < activeStep}
                              className="accent-cta-primary"
                            />
                            参考見積
                          </label>
                        </div>
                      </TdCell>
                    </tr>
                    <tr>
                      <ThLabelCell>保存形式</ThLabelCell>
                      <TdCell>
                        <div className="flex flex-col gap-1.5">
                          {(['電子取引', 'スキャナ保存', '未指定'] as const).map(fmt => (
                            <label key={fmt} className="flex items-center gap-1.5 cursor-pointer text-sm">
                              <input
                                type="radio"
                                name="saveFormat"
                                checked={formData.saveFormat === fmt}
                                onChange={() => updateFormData({ saveFormat: fmt })}
                                disabled={!isStepEnabled(2) || 2 < activeStep}
                                className="accent-cta-primary"
                              />
                              {fmt}
                            </label>
                          ))}
                        </div>
                      </TdCell>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 見積登録業者 */}
              <div className="mb-5 border-2 border-cta-primary rounded-lg p-4">
                <p className="text-sm font-bold text-cta-primary mb-3">見積登録業者</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold min-w-[120px]">業者名</label>
                    <select
                      value={quotationVendorName}
                      onChange={(e) => setQuotationVendorName(e.target.value)}
                      disabled={!isStepEnabled(2) || 2 < activeStep}
                      className={`${inputCls} w-[250px]`}
                    >
                      <option value="">選択してください</option>
                      {vendorOptions.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold min-w-[120px]">担当者</label>
                    <span className="text-sm text-content-sub">
                      {vendors.find(v => v.vendorName === quotationVendorName)?.personInCharge || '---'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold min-w-[120px]">見積金額（税別）</label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold">¥</span>
                      <input
                        type="text"
                        value={quotationAmount}
                        onChange={(e) => setQuotationAmount(e.target.value)}
                        placeholder="0"
                        disabled={!isStepEnabled(2) || 2 < activeStep}
                        className={`${inputCls} w-[160px] tabular-nums`}
                      />
                      <span className="text-xs text-content-sub">（税別）</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold min-w-[120px]">会計区分</label>
                    <select
                      value={quotationAccountType}
                      onChange={(e) => setQuotationAccountType(e.target.value)}
                      disabled={!isStepEnabled(2) || 2 < activeStep}
                      className={`${inputCls} w-[250px]`}
                    >
                      <option value="">選択してください</option>
                      {ACCOUNT_DIVISIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddQuotation}
                      disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || !quotationVendorName || 2 < activeStep}
                      className={`h-9 px-5 text-white border-0 rounded-md text-sm font-bold transition-colors ${selectedFileName && quotationVendorName ? 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer' : 'bg-content-sub cursor-not-allowed'}`}
                    >
                      見積書の登録
                    </button>
                  </div>

                  {formData.quotationPhase === '発注用' && registeredQuotations.some((q) => q.phase === '発注用') && (
                    <div className="mt-2 pt-3 border-t border-dashed border-stroke-input">
                      <p className="text-xs font-bold text-cta-primary-dark mb-2">
                        発注登録用見積として登録済み — 発注登録に進めます
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="text-sm font-bold min-w-[120px]">決済No,</label>
                        <input
                          type="text"
                          value={settlementNo}
                          onChange={(e) => setSettlementNo(e.target.value)}
                          placeholder="院内の任意の決済番号"
                          disabled={!isStepEnabled(2) || 2 < activeStep}
                          className={`${inputCls} w-[250px]`}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => alert('発注書プレビュー（mock）')}
                          disabled={!isStepEnabled(2)}
                          className="h-9 px-4 bg-content-primary text-white border-0 rounded-md text-sm font-bold cursor-pointer hover:bg-content-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          発注書プレビュー
                        </button>
                        <button
                          onClick={() => setIsOrderRegisterModalOpen(true)}
                          disabled={!isStepEnabled(2) || !!registeredOrderNo}
                          className={`h-9 px-4 text-white border-0 rounded-md text-sm font-bold transition-colors ${registeredOrderNo ? 'bg-content-sub cursor-not-allowed' : 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer'} disabled:cursor-not-allowed`}
                        >
                          {registeredOrderNo ? `発注登録済 (${registeredOrderNo})` : '発注登録'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 登録済み見積一覧 */}
              {registeredQuotations.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-content-primary mb-2">
                    登録済み見積（{registeredQuotations.length}件）
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-stroke-card">
                          <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">フェーズ</th>
                          <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">業者名</th>
                          <th className="px-2 py-2 text-right border-b border-stroke-input font-semibold">見積金額</th>
                          <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">ファイル名</th>
                          <th className="px-2 py-2 text-center border-b border-stroke-input w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredQuotations.map((q) => (
                          <tr key={q.id} className="border-b border-stroke-input">
                            <td className="px-2 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${q.phase === '発注用' ? 'bg-surface-select text-cta-primary-dark' : 'bg-stroke-card text-content-sub'}`}>
                                {q.phase === '発注用' ? '発注登録用' : '参考'}
                              </span>
                            </td>
                            <td className="px-2 py-2">{q.vendorName}</td>
                            <td className="px-2 py-2 text-right tabular-nums">¥{q.amount.toLocaleString()}</td>
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center gap-1.5">
                                <span>📄</span>
                                <span>{q.fileName}</span>
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => {
                                  if (confirm('この見積を削除しますか？')) {
                                    setRegisteredQuotations(prev => prev.filter(rq => rq.id !== q.id));
                                  }
                                }}
                                disabled={!isStepEnabled(2) || 2 < activeStep}
                                className="px-2 py-0.5 bg-transparent text-content-alert border border-content-alert rounded-md cursor-pointer text-xs hover:bg-surface-card transition-colors disabled:opacity-50"
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 決済No + 発注書発行 */}
              <div className="mb-4 flex gap-4 items-end">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className={labelCls}>決済No.：</label>
                    <input
                      type="text"
                      value={settlementNo}
                      onChange={(e) => setSettlementNo(e.target.value)}
                      placeholder="院内決済番号を入力"
                      className={`${inputCls} flex-1 bg-[#fffbe3]`}
                      disabled={!isStepEnabled(2) || 2 < activeStep}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs font-bold text-content-primary mb-1 text-center">発注書の発行</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTab('発注書')}
                      disabled={!isStepEnabled(2) || 2 < activeStep}
                      className="h-9 px-4 bg-content-primary text-white border-0 rounded-md cursor-pointer text-sm hover:bg-content-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      発注書プレビュー
                    </button>
                    <button
                      onClick={() => alert('発注書を送信しました（モック）')}
                      disabled={!isStepEnabled(2) || 2 < activeStep || isSubmitting}
                      className="h-9 px-4 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      発注送信
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleStep2Complete}
                  disabled={!isStepEnabled(2) || 2 < activeStep || isSubmitting}
                  className="h-10 px-8 bg-cta-primary text-white border-0 rounded-md text-sm font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  見積登録完了 → STEP③へ
                </button>
              </div>
            </Section>

            {/* ===== STEP③ ===== */}
            <Section step={3} title="STEP③．作業日登録" enabled={isStepEnabled(3)} completed={3 < activeStep}>
              <div className="mb-5">
                <p className="text-sm font-bold text-content-primary mb-2">作業日確認</p>
                <FormRow>
                  <label className={labelCls}>作業日</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => updateFormData({ deliveryDate: e.target.value })}
                    className={`${inputCls} w-[180px] tabular-nums`}
                    disabled={!isStepEnabled(3) || 3 < activeStep}
                  />
                </FormRow>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStep3Complete}
                  disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting || !formData.deliveryDate}
                  className={`h-12 px-12 text-content-primary border border-stroke-input rounded-md text-sm font-bold transition-colors ${formData.deliveryDate ? 'bg-[#fffbe3] cursor-pointer hover:bg-[#fffdf5]' : 'bg-stroke-card cursor-not-allowed'} disabled:opacity-60`}
                >
                  作業日確定
                </button>
              </div>
            </Section>

            {/* ===== STEP④（destructive） ===== */}
            <Section step={5} title="STEP④．完了登録" destructive enabled={isStepEnabled(5)} completed={false}>
              <div className="px-4 py-3 bg-surface-select rounded-md mb-4 text-sm text-content-alert">
                完了報告書・廃棄証明書等のドキュメントを登録し、検収を完了してください。
              </div>

              <div className="mb-5">
                <p className="text-sm font-bold text-content-primary mb-2">ドキュメント追加</p>
                <table className="w-full border-collapse border border-[#DA0000]">
                  <tbody>
                    <tr>
                      <ThLabelCell accent="destructive" width="w-[140px]">添付ファイル</ThLabelCell>
                      <TdCell>
                        <div className="flex items-center gap-2.5">
                          <label className={`px-4 py-1.5 bg-surface-screen border border-stroke-input rounded-md text-sm whitespace-nowrap hover:bg-stroke-card transition-colors ${isStepEnabled(5) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                            ファイルの選択
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={!isStepEnabled(5)}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setSelectedDocFileName(file.name);
                              }}
                              className="hidden"
                            />
                          </label>
                          <span className={`text-sm ${selectedDocFileName ? 'text-cta-primary' : 'text-content-primary'}`}>
                            {selectedDocFileName || 'ファイルが選択されていません'}
                          </span>
                        </div>
                      </TdCell>
                    </tr>
                    <tr>
                      <ThLabelCell accent="destructive" width="w-[140px]">ドキュメント種別</ThLabelCell>
                      <TdCell>
                        <div className="flex flex-col gap-1.5">
                          {(['完了報告書', '廃棄証明書', 'マニフェスト', '契約書', '請求書', 'その他'] as const).map(dtype => (
                            <label key={dtype} className="flex items-center gap-1.5 cursor-pointer text-sm">
                              <input
                                type="radio"
                                name="documentType"
                                checked={formData.documentType === dtype}
                                onChange={() => updateFormData({ documentType: dtype })}
                                disabled={!isStepEnabled(5)}
                                className="accent-[#DA0000]"
                              />
                              {dtype}
                            </label>
                          ))}
                        </div>
                      </TdCell>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddDocument}
                    disabled={!isStepEnabled(5) || !selectedDocFileName}
                    className={`h-9 px-5 text-white border-0 rounded-md text-sm font-bold transition-colors ${selectedDocFileName ? 'bg-[#DA0000] hover:opacity-90 cursor-pointer' : 'bg-content-sub cursor-not-allowed'}`}
                  >
                    ドキュメント登録
                  </button>
                </div>
              </div>

              {/* 登録済みドキュメント */}
              {registeredDocuments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-content-primary mb-2">
                    登録済みドキュメント（{registeredDocuments.length}件）
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-stroke-card">
                          <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">種別</th>
                          <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">ファイル名</th>
                          <th className="px-2 py-2 text-center border-b border-stroke-input w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredDocuments.map((doc) => (
                          <tr key={doc.id} className="border-b border-stroke-input">
                            <td className="px-2 py-2">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-select text-content-alert">
                                {doc.documentType}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center gap-1.5">
                                <span>📄</span>
                                <span>{doc.fileName}</span>
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => {
                                  if (confirm('このドキュメントを削除しますか？')) {
                                    setRegisteredDocuments(prev => prev.filter(d => d.id !== doc.id));
                                  }
                                }}
                                disabled={!isStepEnabled(5)}
                                className="px-2 py-0.5 bg-transparent text-content-alert border border-content-alert rounded-md cursor-pointer text-xs hover:bg-surface-card transition-colors disabled:opacity-50"
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleStep5Complete}
                  disabled={!isStepEnabled(5) || isSubmitting}
                  className="h-10 px-6 bg-[#DA0000] text-white border-0 rounded-md text-sm font-bold cursor-pointer hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  検収完了（タスク完了）
                </button>
              </div>
            </Section>
          </div>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          className="w-2 cursor-col-resize bg-stroke-card flex items-center justify-center"
        >
          <div className="w-0.5 h-10 bg-stroke-input rounded" />
        </div>

        {/* 右側プレビュー */}
        <div className="flex-1 min-w-[300px] flex flex-col min-h-0 overflow-hidden bg-stroke-card">
          <div className="flex-1 p-4 overflow-auto">
            {/* 見積依頼書 */}
            {previewTab === '見積依頼書' && (() => {
              const vIdx = previewVendorIndex ?? 0;
              const vendor = vendors[vIdx];
              return (
                <div className="bg-surface-card border border-stroke-input rounded-2xl p-6 max-w-[600px] mx-auto">
                  <h2 className="text-center text-lg font-bold mb-4 text-content-primary underline">見積依頼書</h2>

                  <div className="flex justify-between mb-4 gap-6">
                    <div className="flex-1">
                      <p className="text-xs text-content-sub mb-1">【宛先】</p>
                      <p className="text-sm font-bold text-content-primary">{vendor?.vendorName || '（未設定）'}</p>
                      <p className="text-xs text-content-primary">{vendor?.personInCharge || ''} 様</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-content-sub mb-1">【差出人】</p>
                      <p className="text-sm text-content-primary">{formData.receptionDepartment || '○○病院'}</p>
                      <p className="text-xs text-content-primary">
                        {formData.receptionPerson} / {formData.receptionContact}
                      </p>
                    </div>
                  </div>

                  <p className="text-center text-sm font-bold mb-3">記</p>
                  <p className="text-xs mb-3"><strong>申請No.</strong> {application.applicationNo}</p>

                  <table className="w-full border-collapse text-xs mb-4">
                    <tbody>
                      {([
                        ['QRラベル', application.qrLabel],
                        ['品目名', application.itemName],
                        ['メーカー', application.maker],
                        ['型式', application.model],
                        ['シリアルNo.', application.serialNo],
                        ['設置部署', `${application.installationDivision} ${application.installationDepartment}`],
                        ['室名', application.installationRoom],
                      ] as [string, string][]).map(([label, value]) => (
                        <tr key={label}>
                          <th className="px-2.5 py-1.5 bg-content-primary text-white text-left w-[100px] border border-stroke-input text-xs">{label}</th>
                          <td className="px-2.5 py-1.5 border border-stroke-input text-xs">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1">廃棄理由</p>
                    <p className="text-xs text-content-primary">{application.disposalReason}</p>
                  </div>

                  {vendor?.requestNote && (
                    <div className="mb-3">
                      <p className="text-xs font-bold mb-1">ご依頼事項</p>
                      <p className="text-xs text-content-primary p-2 bg-[#fffbe3] rounded-md border border-stroke-input">
                        {vendor.requestNote}
                      </p>
                    </div>
                  )}

                  <p className="text-center text-xs text-content-sub mt-6">— 以上 —</p>
                </div>
              );
            })()}

            {/* 見積書一覧 */}
            {previewTab === '見積書' && previewQuotationIndex === null && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <h4 className="text-sm font-bold mb-3 text-cta-primary-dark">登録済み見積書一覧</h4>
                {registeredQuotations.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-cta-primary text-white">
                        <th className="px-2 py-2 text-left border border-stroke-input">業者名</th>
                        <th className="px-2 py-2 text-right border border-stroke-input">見積金額</th>
                        <th className="px-2 py-2 text-left border border-stroke-input">ファイル名</th>
                        <th className="px-2 py-2 text-center border border-stroke-input w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q, idx) => (
                        <tr key={q.id} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                          <td className="px-2 py-2 border border-stroke-input">{q.vendorName}</td>
                          <td className="px-2 py-2 border border-stroke-input text-right tabular-nums">¥{q.amount.toLocaleString()}</td>
                          <td className="px-2 py-2 border border-stroke-input">{q.fileName}</td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <button
                              onClick={() => setPreviewQuotationIndex(idx)}
                              className="px-2 py-1 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs hover:bg-cta-primary-dark transition-colors"
                            >
                              表示
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-content-sub p-8">
                    <p className="text-4xl mb-3">📁</p>
                    <p>登録済みの見積書はありません</p>
                    <p className="text-xs mt-2">STEP②で見積書を登録してください</p>
                  </div>
                )}
              </div>
            )}

            {/* 見積書個別 */}
            {previewTab === '見積書' && previewQuotationIndex !== null && (() => {
              const q = registeredQuotations[previewQuotationIndex];
              if (!q) return null;
              return (
                <div className="bg-surface-card border border-stroke-input rounded-2xl p-4 h-full flex flex-col">
                  <button
                    onClick={() => setPreviewQuotationIndex(null)}
                    className="px-3 py-1.5 bg-stroke-card border border-stroke-input rounded-md cursor-pointer text-xs self-start mb-4 hover:bg-stroke-input transition-colors"
                  >
                    ← 一覧に戻る
                  </button>
                  <div className="flex-1 bg-content-primary rounded-md flex flex-col items-center justify-center min-h-[300px]">
                    <p className="text-6xl mb-4">📄</p>
                    <p className="text-sm font-bold text-white">{q.fileName}</p>
                    <p className="text-xs text-content-sub mt-1">PDFプレビュー（モック）</p>
                  </div>
                  <div className="mt-4">
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        {([
                          ['業者名', q.vendorName],
                          ['見積金額', `¥${q.amount.toLocaleString()}（税別）`],
                          ['フェーズ', q.phase === '発注用' ? '発注登録用' : '参考'],
                          ['保存形式', q.saveFormat],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label}>
                            <td className="px-2 py-2 bg-cta-primary text-white font-bold w-[120px]">{label}</td>
                            <td className="px-2 py-2 border border-stroke-input">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* 発注書 */}
            {previewTab === '発注書' && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-6 max-w-[600px] mx-auto">
                <h2 className="text-center text-lg font-bold mb-4 text-content-primary underline">廃棄発注書</h2>

                <div className="flex justify-between mb-4 gap-6">
                  <div className="flex-1">
                    <p className="text-xs text-content-sub mb-1">【宛先】</p>
                    <p className="text-sm font-bold text-content-primary">{vendors[0]?.vendorName || '（未設定）'}</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-content-sub mb-1">【差出人】</p>
                    <p className="text-sm text-content-primary">{formData.receptionDepartment || '○○病院'}</p>
                  </div>
                </div>

                <p className="text-center text-sm font-bold mb-3">記</p>

                <div className="mb-4">
                  <p className="text-xs font-bold mb-1.5 text-content-primary">【発注内容】</p>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      {([
                        ['発注No.', application.applicationNo],
                        ['発注金額', `¥${(registeredQuotations.find(q => q.phase === '発注用')?.amount || 0).toLocaleString()}（税別）`],
                        ['納品場所', `${application.installationDivision} ${application.installationDepartment} ${application.installationRoom}`],
                      ] as [string, string][]).map(([label, value]) => (
                        <tr key={label}>
                          <th className="px-2.5 py-1.5 bg-content-primary text-white text-left w-[100px] border border-stroke-input text-xs">{label}</th>
                          <td className="px-2.5 py-1.5 border border-stroke-input text-xs tabular-nums">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-center text-xs text-content-sub mt-6">— 以上 —</p>
              </div>
            )}

            {/* 完了報告書他 一覧 */}
            {previewTab === '完了報告書他' && previewDocumentIndex === null && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <h4 className="text-sm font-bold mb-3 text-content-alert">登録済みドキュメント一覧</h4>
                {registeredDocuments.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#DA0000] text-white">
                        <th className="px-2 py-2 text-left border border-[#DA0000]">種別</th>
                        <th className="px-2 py-2 text-left border border-[#DA0000]">ファイル名</th>
                        <th className="px-2 py-2 text-center border border-[#DA0000]">登録日</th>
                        <th className="px-2 py-2 text-center border border-[#DA0000] w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.map((doc, idx) => (
                        <tr key={doc.id} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                          <td className="px-2 py-2 border border-stroke-input">{doc.documentType}</td>
                          <td className="px-2 py-2 border border-stroke-input">{doc.fileName}</td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            {new Date(doc.registeredAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <button
                              onClick={() => setPreviewDocumentIndex(idx)}
                              className="px-2 py-1 bg-[#DA0000] text-white border-0 rounded-md cursor-pointer text-xs hover:opacity-90 transition-colors"
                            >
                              表示
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-content-sub p-8">
                    <p className="text-4xl mb-3">📁</p>
                    <p>登録済みのドキュメントはありません</p>
                    <p className="text-xs mt-2">STEP④でドキュメントを登録してください</p>
                  </div>
                )}
              </div>
            )}

            {/* 完了報告書他 個別 */}
            {previewTab === '完了報告書他' && previewDocumentIndex !== null && (() => {
              const doc = registeredDocuments[previewDocumentIndex];
              if (!doc) return null;
              return (
                <div className="bg-surface-card border border-stroke-input rounded-2xl p-4 h-full flex flex-col">
                  <button
                    onClick={() => setPreviewDocumentIndex(null)}
                    className="px-3 py-1.5 bg-stroke-card border border-stroke-input rounded-md cursor-pointer text-xs self-start mb-4 hover:bg-stroke-input transition-colors"
                  >
                    ← 一覧に戻る
                  </button>
                  <div className="flex-1 bg-content-primary rounded-md flex flex-col items-center justify-center min-h-[300px]">
                    <p className="text-6xl mb-4">📄</p>
                    <p className="text-sm font-bold text-white">{doc.fileName}</p>
                    <p className="text-xs text-content-sub mt-1">PDFプレビュー（モック）</p>
                  </div>
                  <div className="mt-4">
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        {([
                          ['種別', doc.documentType],
                          ['勘定科目', doc.accountType === 'その他' ? doc.accountOther || 'その他' : doc.accountType],
                          ['登録日時', new Date(doc.registeredAt).toLocaleString('ja-JP')],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label}>
                            <td className="px-2 py-2 bg-[#DA0000] text-white font-bold w-[120px]">{label}</td>
                            <td className="px-2 py-2 border border-stroke-input">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 縦型タブバー */}
        <div className="flex flex-col bg-stroke-card border-l border-stroke-input w-10 flex-shrink-0">
          {(['見積依頼書', '見積書', '発注書', '完了報告書他'] as PreviewDocTab[]).map((tab) => {
            const isActive = previewTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setPreviewTab(tab);
                  setPreviewQuotationIndex(null);
                  setPreviewDocumentIndex(null);
                }}
                className={`flex-1 flex flex-col items-center justify-center border-0 border-b border-stroke-input cursor-pointer text-[10px] transition-all py-2 gap-1 ${isActive ? 'bg-surface-select text-content-primary font-bold' : 'bg-transparent text-content-primary hover:bg-stroke-input'}`}
                title={tab}
              >
                <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      <OrderRegistrationModal
        isOpen={isOrderRegisterModalOpen}
        onClose={() => setIsOrderRegisterModalOpen(false)}
        orderNoPrefix="PO-DISPOSAL"
        onConfirm={(orderNo, deliveryMethod) => {
          setRegisteredOrderNo(orderNo);
          setIsOrderRegisterModalOpen(false);
          alert(`発注登録が完了しました。\n発注No,: ${orderNo}\n送付方法: ${deliveryMethod}`);
        }}
      />
    </div>
  );
}

export default function DisposalTaskPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    }>
      <DisposalTaskContent />
    </Suspense>
  );
}
