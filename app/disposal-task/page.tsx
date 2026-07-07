'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { ACCOUNT_DIVISIONS } from '@/lib/data/account-divisions';
import { OrderRegistrationModal } from '@/components/ui/OrderRegistrationModal';

/** カラートークン（repair-task と統一） */
const COLORS = {
  primary: '#008C1D',
  primaryDark: '#146E2E',
  accent: '#4A4A4A',
  textOnAccent: '#4A4A4A',
  textPrimary: '#4A4A4A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
  textOnColor: '#ffffff',
  border: '#E1E1E1',
  borderLight: '#E1E1E1',
  surface: '#FAFAFA',
  surfaceAlt: '#F1F1F1',
  sectionHeader: '#4A4A4A',
  white: '#ffffff',
  error: '#DA0000',
  success: '#008C1D',
  successLight: '#EBF5EE',
  warning: '#4A4A4A',
  warningBg: '#FAFAFA',
  warningBorder: '#4A4A4A',
  warningText: '#4A4A4A',
  disabled: '#D6D6D6',
  disabledBg: '#F1F1F1',
  stepActive: '#008C1D',
  stepCompleted: '#146E2E',
  stepPending: '#E1E1E1',
} as const;

// 廃棄フローのステップ定義（プログレスバー ラベルは現状維持）
const DISPOSAL_STEPS = [
  { step: 1, label: '見積依頼' },
  { step: 2, label: '見積登録/発注登録' },
  { step: 3, label: '作業日登録' },
  { step: 4, label: '完了登録' },
];

// ============================================================
// Types
// ============================================================
interface VendorEntry {
  localId: string;
  vendorName: string;
  personInCharge: string;
  email: string;
  tel: string;
  submitDeadline: string;
  isSent: boolean;
}

let vendorLocalIdCounter = 0;
function generateLocalId(): string {
  vendorLocalIdCounter += 1;
  return `dv-${vendorLocalIdCounter}`;
}

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

// STEP④ ドキュメント種別（廃棄_RENDER-2 のレイアウトに準拠。2カラム順・重複「注文書」を含めて忠実再現）
const DISPOSAL_DOC_TYPES = [
  '院内決済書類',
  '見積書（変更が発生した場合）',
  '産業廃棄物処理委託契約書',
  '注文書',
  '注文書',
  '廃棄物証明書（処分完了報告書）',
  '産業廃棄物管理票（マニフェスト）',
  '請求書',
  'その他',
] as const;

interface RegisteredDocument {
  id: number;
  documentType: string;
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
  requestComment: string;
  quotationPhase: '発注用' | '参考';
  quotationAmount: number;
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  deliveryDate: string;
  documentType: string;
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther: string;
}

const getMockApplication = (groupId: string): DisposalApplication => {
  const groupDataMap: Record<string, { groupName: string; rfqNo: string; status: DisposalStatus }> = {
    '1': { groupName: 'ME室 心電計廃棄一式', rfqNo: 'RFQ-20260110-0001', status: '見積依頼済' },
    '2': { groupName: '放射線科 超音波装置廃棄', rfqNo: 'RFQ-20260111-0002', status: '発注用見積登録済' },
    '3': { groupName: '検査科 血液ガス分析装置廃棄', rfqNo: 'RFQ-20260113-0003', status: '発注済' },
    '4': { groupName: '看護部 輸液ポンプ廃棄', rfqNo: 'RFQ-20260115-0004', status: '納期確定' },
    '5': { groupName: '手術部 電気メス移動作業', rfqNo: 'RFQ-20260120-0005', status: '完了' },
  };

  const groupData = groupDataMap[groupId] || { groupName: '新規グループ', rfqNo: `RFQ-NEW-${groupId}`, status: '新規申請' as DisposalStatus };

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
    requestComment: '',
    quotationPhase: '発注用',
    quotationAmount: 0,
    saveFormat: '電子取引',
    deliveryDate: '',
    documentType: '院内決済書類',
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

// 共通スタイル（repair-task と統一）
const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '13px',
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: COLORS.disabledBg,
  color: COLORS.disabled,
  cursor: 'not-allowed',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: COLORS.textPrimary,
  whiteSpace: 'nowrap',
};

// セクションコンポーネント（repair-task と同一構造）
const Section = ({
  step,
  title,
  children,
  accentColor = COLORS.primary,
  headerAction,
  enabled,
  completed,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  headerAction?: React.ReactNode;
  enabled: boolean;
  completed: boolean;
}) => {
  void step;
  void accentColor;
  const titleColor = enabled || completed ? COLORS.textPrimary : COLORS.textMuted;
  return (
    <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: '8px',
      marginBottom: '16px',
      opacity: enabled ? 1 : 0.7,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: `1px solid ${COLORS.borderLight}`,
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', flex: 1, color: titleColor }}>
          {title}
        </span>
        {completed && (
          <span style={{
            fontSize: '11px',
            color: COLORS.success,
            border: `1px solid ${COLORS.success}`,
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            完了
          </span>
        )}
        {enabled && !completed && !headerAction && (
          <span style={{
            fontSize: '11px',
            color: COLORS.success,
            border: `1px solid ${COLORS.success}`,
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            作業中
          </span>
        )}
        {headerAction}
      </div>
      <div style={{
        padding: '16px',
        pointerEvents: enabled ? 'auto' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
};

// フォーム行コンポーネント（repair-task と同一）
const FormRow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', ...style }}>
    {children}
  </div>
);

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
  const [quotationAccountDivision, setQuotationAccountDivision] = useState<string>('');
  const [quotationNo, setQuotationNo] = useState<string>('');
  const [quotationDate, setQuotationDate] = useState<string>('');
  const [orderChoice, setOrderChoice] = useState<'発注書の発行' | '申請を見送る'>('発注書の発行');
  const [settlementDate, setSettlementDate] = useState<string>('');
  const [settlementNo, setSettlementNo] = useState<string>('');
  const [isOrderRegisterModalOpen, setIsOrderRegisterModalOpen] = useState(false);
  const [registeredOrderNo, setRegisteredOrderNo] = useState<string>('');
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedDocFileName, setSelectedDocFileName] = useState<string>('');
  const [docTypeIndex, setDocTypeIndex] = useState<number>(0);
  const [docSaveFormat, setDocSaveFormat] = useState<'電子取引' | 'スキャナ保存' | '未指定'>('未指定');
  const [docDate, setDocDate] = useState<string>('');
  const [docNo, setDocNo] = useState<string>('');
  const [docActualAmount, setDocActualAmount] = useState<string>('');
  const [docAccountDivision, setDocAccountDivision] = useState<string>('');
  const [docOtherName, setDocOtherName] = useState<string>('');
  const [isDeliveryDateConfirmed, setIsDeliveryDateConfirmed] = useState<boolean>(false);
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
        isSent: false,
      }]);
    }
  }, [groupId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="廃棄申請管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
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
      { localId: generateLocalId(), vendorName: '', personInCharge: '', email: '', tel: '', submitDeadline: '', isSent: false },
    ]);
  };

  const handleRemoveVendor = (index: number) => {
    setVendors(prev => {
      if (prev.length <= 1) return prev;
      if (prev[index]?.isSent) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVendorSubmit = (index: number) => {
    const vendor = vendors[index];
    if (!vendor.vendorName || !vendor.email) {
      alert('業者名とメールアドレスを入力してください');
      return;
    }
    setVendors(prev => prev.map((v, i) => i === index ? { ...v, isSent: true } : v));
    alert(`${vendor.vendorName}へ見積依頼を送信しました。`);
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
      accountType: quotationAccountDivision,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredQuotations(prev => [...prev, newQuotation]);
    setSelectedFileName('');
    setQuotationVendorName('');
    setQuotationAmount('');
    setQuotationAccountDivision('');
    setQuotationNo('');
    setQuotationDate('');
    alert('見積書を登録しました');
  };

  const handleCloseGroup = () => {
    if (confirm('この廃棄見積グループを解除し、タスクを終了しますか？')) {
      setApplication(prev => prev ? { ...prev, status: '申請見送り' } : prev);
      alert('見積グループを解除しました。一覧画面に戻ります。');
      router.push('/quotation-data-box/transfer-management');
    }
  };

  const handleDeleteQuotation = (id: number) => {
    if (confirm('この見積を削除しますか？')) {
      setRegisteredQuotations(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注用見積登録済' } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  const handleConfirmDeliveryDate = () => {
    if (!formData.deliveryDate) {
      alert('作業日を入力してください');
      return;
    }
    setIsDeliveryDateConfirmed(true);
    setApplication(prev => prev ? { ...prev, status: '納期確定' } : prev);
    alert(`作業日を ${formData.deliveryDate} で確定しました`);
  };

  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('作業日を登録しました。STEP④へ進みます。');
      setApplication(prev => prev ? { ...prev, status: '納期確定' } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 300);
  };

  const handleAddDocument = () => {
    if (!selectedDocFileName) {
      alert('ファイルを選択してください');
      return;
    }
    const docType = DISPOSAL_DOC_TYPES[docTypeIndex] || 'その他';
    const newDoc: RegisteredDocument = {
      id: Date.now(),
      documentType: docType === 'その他' && docOtherName ? docOtherName : docType,
      accountType: '廃棄費',
      accountOther: docAccountDivision || undefined,
      fileName: selectedDocFileName,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredDocuments(prev => [...prev, newDoc]);
    setSelectedDocFileName('');
    setDocDate('');
    setDocNo('');
    setDocActualAmount('');
    setDocOtherName('');
    alert('ドキュメントを登録しました');
  };

  const handleDeleteDocument = (id: number) => {
    if (confirm('このドキュメントを削除しますか？')) {
      setRegisteredDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleStep4Complete = () => {
    // 顧客イメージ注釈: 完了登録（タスク完了）押下後に、全ドキュメントが登録済みかのアラートを表示
    const requiredDocTypes = Array.from(new Set(DISPOSAL_DOC_TYPES.filter(t => t !== 'その他')));
    const registeredTypes = new Set(registeredDocuments.map(d => d.documentType));
    const missingDocTypes = requiredDocTypes.filter(t => !registeredTypes.has(t));
    if (missingDocTypes.length > 0) {
      const proceed = confirm(
        `未登録のドキュメントがあります（${missingDocTypes.length}件）:\n・${missingDocTypes.join('\n・')}\n\nすべてのドキュメントが登録されているか確認してください。このまま完了しますか？`
      );
      if (!proceed) return;
    }
    if (confirm('検収を完了し、このタスクを完了しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`廃棄タスク（${application.applicationNo}）が完了しました。\n一覧画面に戻ります。`);
        router.push('/quotation-data-box/transfer-management');
      }, 300);
    }
  };

  const vendorOptions = vendors.filter(v => v.vendorName).map(v => v.vendorName);

  // プログレスバー（ラベルは現状維持）
  const ProgressBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      background: COLORS.surfaceAlt,
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      {DISPOSAL_STEPS.map((item, index) => (
        <React.Fragment key={item.step}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '120px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              background: item.step < activeStep ? COLORS.stepCompleted : item.step === activeStep ? COLORS.stepActive : COLORS.stepPending,
              color: item.step <= activeStep ? 'white' : COLORS.textMuted,
              border: item.step === activeStep ? `2px solid ${COLORS.primaryDark}` : 'none',
            }}>
              {item.step < activeStep ? '✓' : item.step}
            </div>
            <span style={{
              fontSize: '10px',
              marginTop: '4px',
              color: item.step === activeStep ? COLORS.stepActive : item.step < activeStep ? COLORS.stepCompleted : COLORS.textMuted,
              fontWeight: item.step === activeStep ? 'bold' : 'normal',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </div>
          {index < DISPOSAL_STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: '3px',
              background: item.step < activeStep ? COLORS.stepCompleted : COLORS.stepPending,
              margin: '0 8px',
              marginBottom: '18px',
              minWidth: '20px',
              maxWidth: '80px',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const getInputProps = (step: number) => {
    const enabled = isStepEnabled(step);
    return {
      style: enabled ? inputStyle : disabledInputStyle,
      disabled: !enabled,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      <style>{`
        .repair-btn { transition: filter 150ms ease-out; }
        .repair-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .repair-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
        .repair-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <Header
        title="廃棄申請管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/transfer-management"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <ProgressBar />

      {/* 見積依頼No.＋廃棄見積グループ（プログレスバー同幅で上部固定表示） */}
      <div style={{ flexShrink: 0, padding: '10px 24px', background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, fontSize: '14px', fontWeight: 'bold', color: '#DA0000', fontVariantNumeric: 'tabular-nums' }}>
        見積依頼No. {application.rfqNo}　廃棄見積グループ：{application.groupName}
      </div>

      {/* メインコンテンツ（左右分割） */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* 左側: タスク入力エリア */}
        <div style={{
          width: `${leftPanelWidth}%`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: '16px',
        }}>
        {/* 受付部署／担当者 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '12px 16px', background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>受付部署</span>
            <input type="text" placeholder="部署名" value={formData.receptionDepartment} onChange={(e) => updateFormData({ receptionDepartment: e.target.value })} {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '150px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>担当者</span>
            <input type="text" placeholder="担当者名" value={formData.receptionPerson} onChange={(e) => updateFormData({ receptionPerson: e.target.value })} {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '120px' }} />
          </div>
        </div>

        {/* STEP①: 見積依頼 */}
        <Section
          step={1}
          title="STEP①．見積依頼"
          accentColor={COLORS.primary}
          enabled={isStepEnabled(1)}
          completed={1 < activeStep}
          headerAction={
            <button
              className="repair-btn"
              onClick={() => { setPreviewTab('見積依頼書'); setPreviewVendorIndex(null); }}
              disabled={!isStepEnabled(1)}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.9)',
                color: COLORS.primary,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              プレビュー
            </button>
          }
        >
          {/* 見積依頼セクション */}
          <>
            <div style={{
              padding: '12px 16px',
              background: '#EBF5EE',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#4A4A4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <span>廃棄業者を登録し、廃棄見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。</span>
              <button
                onClick={handleAddVendor}
                disabled={!isStepEnabled(1)}
                style={{
                  padding: '4px 12px',
                  background: '#4A4A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isStepEnabled(1) ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                + 業者追加（{vendors.length}社）
              </button>
            </div>

            {/* 依頼先テーブル */}
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: COLORS.surfaceAlt }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}`, width: '70px' }}></th>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>業者名 <span style={{ color: COLORS.error }}>*</span></th>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>担当者名</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>メール <span style={{ color: COLORS.error }}>*</span></th>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>連絡先</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}`, width: '130px' }}>提出期限</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: `1px solid ${COLORS.border}`, width: '210px' }}>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor, i) => {
                    const hasVendorData = vendor.vendorName && vendor.email;
                    const isSelected = previewTab === '見積依頼書' && previewVendorIndex === i;
                    const isSent = vendor.isSent;
                    const canDelete = !isSent && vendors.length > 1;
                    return (
                      <tr
                        key={vendor.localId}
                        style={{
                          borderBottom: `1px solid ${COLORS.borderLight}`,
                          background: isSelected ? '#EBF5EE' : 'transparent',
                          opacity: isSent ? 0.7 : 1,
                        }}
                      >
                        <td style={{ padding: '6px 8px', color: COLORS.textMuted, fontSize: '11px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isSent ? '#008C1D' : '#4A4A4A',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '11px',
                          }}>{isSent ? '済' : `依頼${i + 1}`}</span>
                          {i === 0 && <span style={{ display: 'block', fontSize: '10px', color: COLORS.success, marginTop: '2px' }}>(導入業者)</span>}
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input type="text" value={vendor.vendorName} onChange={(e) => updateVendorField(i, 'vendorName', e.target.value)} placeholder="業者名" disabled={!isStepEnabled(1) || isSent} style={{ ...getInputProps(1).style, width: '100%' }} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input type="text" value={vendor.personInCharge} onChange={(e) => updateVendorField(i, 'personInCharge', e.target.value)} placeholder="担当者" disabled={!isStepEnabled(1) || isSent} style={{ ...getInputProps(1).style, width: '100%' }} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input type="email" value={vendor.email} onChange={(e) => updateVendorField(i, 'email', e.target.value)} placeholder="email@example.com" disabled={!isStepEnabled(1) || isSent} style={{ ...getInputProps(1).style, width: '100%' }} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input type="tel" value={vendor.tel} onChange={(e) => updateVendorField(i, 'tel', e.target.value)} placeholder="03-0000-0000" disabled={!isStepEnabled(1) || isSent} style={{ ...getInputProps(1).style, width: '100%' }} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input type="date" value={vendor.submitDeadline} onChange={(e) => updateVendorField(i, 'submitDeadline', e.target.value)} disabled={!isStepEnabled(1) || isSent} style={{ ...getInputProps(1).style, width: '100%' }} />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button className="repair-btn" onClick={() => { setPreviewTab('見積依頼書'); setPreviewVendorIndex(i); }} disabled={!isStepEnabled(1) || !hasVendorData} style={{ padding: '4px 8px', background: hasVendorData ? COLORS.accent : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: hasVendorData ? 'pointer' : 'not-allowed', fontSize: '11px' }} title={hasVendorData ? 'プレビュー表示' : '業者名とメールを入力してください'}>
                              プレビュー
                            </button>
                            {!isSent && (
                              <button className="repair-btn" onClick={() => handleVendorSubmit(i)} disabled={!isStepEnabled(1) || !hasVendorData} style={{ padding: '4px 8px', background: hasVendorData ? COLORS.primary : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: hasVendorData ? 'pointer' : 'not-allowed', fontSize: '11px' }} title={hasVendorData ? 'メールを送信' : '業者名とメールを入力してください'}>
                                メール送信
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleRemoveVendor(i)} style={{ padding: '4px 8px', background: '#DA0000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} title="この業者を削除">
                                削除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ご依頼事項 */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>ご依頼事項</span>
              <textarea
                value={formData.requestComment}
                onChange={(e) => updateFormData({ requestComment: e.target.value })}
                placeholder="例：機器を引き取りにきてください / 廃棄見積書を作成してください / マニフェストの発行は可能ですか？"
                disabled={!isStepEnabled(1)}
                style={{
                  ...inputStyle,
                  width: '100%',
                  minHeight: '60px',
                  resize: 'vertical',
                }}
              />
            </div>

            <FormRow style={{ justifyContent: 'flex-end' }}>
              <button
                className="repair-btn"
                onClick={handleStep1Complete}
                disabled={!isStepEnabled(1) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.primary,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                見積依頼完了
              </button>
            </FormRow>
          </>
        </Section>

        {/* STEP②: 見積登録/発注登録 */}
        <Section
          step={2}
          title="STEP②．見積登録・発注"
          accentColor={COLORS.primary}
          enabled={isStepEnabled(2)}
          completed={2 < activeStep}
          headerAction={
            <button className="repair-btn" onClick={() => { setPreviewTab('見積書'); setPreviewQuotationIndex(null); }} disabled={!isStepEnabled(2)} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: COLORS.primary, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              一覧表示
            </button>
          }
        >
          <div style={{ padding: '12px 16px', background: '#EBF5EE', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#146E2E' }}>
            見積書をファイル選択し、必要項目を入力してください。
          </div>

          {/* 登録済み見積一覧 */}
          {registeredQuotations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                登録済み見積（{registeredQuotations.length}件）
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: COLORS.surfaceAlt }}>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>フェーズ</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>業者名</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>ファイル名</th>
                      <th style={{ padding: '8px', textAlign: 'right', border: `1px solid ${COLORS.border}` }}>金額（税別）</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>保存形式</th>
                      <th style={{ padding: '8px', textAlign: 'center', border: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredQuotations.map((q) => (
                      <tr key={q.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: q.phase === '発注用' ? '#EBF5EE' : '#FAFAFA', color: '#4A4A4A' }}>
                            {q.phase === '発注用' ? '発注登録用' : '参考'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontSize: '12px' }}>{q.vendorName}</td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>📄</span>
                            <span>{q.fileName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {q.amount > 0 ? `¥${q.amount.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted }}>{q.saveFormat}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteQuotation(q.id)} disabled={!isStepEnabled(2)} style={{ padding: '2px 8px', background: 'transparent', color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
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

          {/* 見積入力フォーム */}
          <div style={{ marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${COLORS.border}` }}>
              <tbody>
                <tr>
                  <th style={{ background: COLORS.surfaceAlt, color: COLORS.textPrimary, padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>添付ファイル</th>
                  <td colSpan={3} style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ padding: '6px 16px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '13px', whiteSpace: 'nowrap', opacity: isStepEnabled(2) ? 1 : 0.6 }}>
                        ファイルの選択
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={!isStepEnabled(2)} onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedFileName(file.name); }} style={{ display: 'none' }} />
                      </label>
                      <span style={{ color: selectedFileName ? COLORS.success : COLORS.textMuted, fontSize: '13px', flex: 1 }}>
                        {selectedFileName || 'ファイルが選択されていません'}
                      </span>
                      <button
                        className="repair-btn"
                        onClick={() => { setPreviewTab('見積書'); setPreviewQuotationIndex(null); }}
                        disabled={!isStepEnabled(2) || !selectedFileName}
                        style={{ padding: '6px 16px', background: selectedFileName ? COLORS.accent : COLORS.disabled, color: 'white', border: 'none', borderRadius: '4px', cursor: selectedFileName ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                      >
                        プレビュー
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th style={{ background: COLORS.surfaceAlt, color: COLORS.textPrimary, padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap', verticalAlign: 'top' }}>見積フェーズ</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.border}`, width: '38%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="quotationPhase" checked={formData.quotationPhase === '参考'} onChange={() => updateFormData({ quotationPhase: '参考' })} disabled={!isStepEnabled(2)} /> 参考見積</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="quotationPhase" checked={formData.quotationPhase === '発注用'} onChange={() => updateFormData({ quotationPhase: '発注用' })} disabled={!isStepEnabled(2)} /> 発注登録用見積</label>
                    </div>
                  </td>
                  <th style={{ background: COLORS.surfaceAlt, color: COLORS.textPrimary, padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap', verticalAlign: 'top' }}>保存形式</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="saveFormat" checked={formData.saveFormat === '電子取引'} onChange={() => updateFormData({ saveFormat: '電子取引' })} disabled={!isStepEnabled(2)} /> 電子取引</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="saveFormat" checked={formData.saveFormat === 'スキャナ保存'} onChange={() => updateFormData({ saveFormat: 'スキャナ保存' })} disabled={!isStepEnabled(2)} /> スキャナ保存</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="saveFormat" checked={formData.saveFormat === '未指定'} onChange={() => updateFormData({ saveFormat: '未指定' })} disabled={!isStepEnabled(2)} /> 未指定</label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 見積明細入力（2カラム） */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto minmax(0, 1fr)', gap: '12px 12px', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>業者名</label>
            <select value={quotationVendorName} onChange={(e) => setQuotationVendorName(e.target.value)} disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }}>
              <option value="">選択してください</option>
              {vendorOptions.map((name, i) => (
                <option key={i} value={name}>{name}</option>
              ))}
            </select>
            <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>見積No.</label>
            <input type="text" value={quotationNo} onChange={(e) => setQuotationNo(e.target.value)} placeholder="業者側の見積No.入力" disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }} />

            <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>見積日付</label>
            <input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '180px' }} />
            <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>見積金額（税別）</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥</span>
              <input type="number" value={quotationAmount} onChange={(e) => setQuotationAmount(e.target.value)} placeholder="0" disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '160px', fontVariantNumeric: 'tabular-nums' }} />
              <span style={{ fontSize: '12px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>（税別）</span>
            </div>

            <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>勘定科目</label>
            <select value={quotationAccountDivision} onChange={(e) => setQuotationAccountDivision(e.target.value)} disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }}>
              <option value="">選択してください</option>
              {ACCOUNT_DIVISIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div style={{ gridColumn: '3 / 5', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="repair-btn"
                onClick={handleAddQuotation}
                disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || !quotationVendorName}
                style={{
                  padding: '8px 20px',
                  background: selectedFileName && quotationVendorName ? COLORS.primary : COLORS.disabledBg,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedFileName && quotationVendorName ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                見積書の登録
              </button>
            </div>
          </div>

          {/* 発注書の発行 / 申請を見送る の選択 */}
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '4px', background: orderChoice === '発注書の発行' ? '#C6F0CF' : COLORS.surfaceAlt, flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="orderChoice" checked={orderChoice === '発注書の発行'} onChange={() => setOrderChoice('発注書の発行')} disabled={!isStepEnabled(2)} />
                発注書の発行
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: COLORS.error, padding: '8px 16px', borderRadius: '4px', background: orderChoice === '申請を見送る' ? '#F9CCE0' : COLORS.surfaceAlt, flex: 1, justifyContent: 'center' }}>
                <input type="radio" name="orderChoice" checked={orderChoice === '申請を見送る'} onChange={() => setOrderChoice('申請を見送る')} disabled={!isStepEnabled(2)} />
                申請を見送る
              </label>
            </div>

            {orderChoice === '発注書の発行' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                  <button
                    className="repair-btn"
                    onClick={() => setPreviewTab('発注書')}
                    disabled={!isStepEnabled(2)}
                    style={{ padding: '6px 16px', background: COLORS.accent, color: 'white', border: 'none', borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    プレビュー
                  </button>
                  <button
                    className="repair-btn"
                    onClick={() => setIsOrderRegisterModalOpen(true)}
                    disabled={!isStepEnabled(2)}
                    style={{ padding: '6px 16px', background: COLORS.accent, color: 'white', border: 'none', borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    メール送信
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto minmax(0, 1fr)', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>決済日</label>
                  <input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '180px' }} />
                  <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>決済No.</label>
                  <input type="text" value={settlementNo} onChange={(e) => setSettlementNo(e.target.value)} placeholder="院内の決済No.を入力（任意）" disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="repair-btn"
                    onClick={() => { setApplication(prev => prev ? { ...prev, status: '発注済' } : prev); setCurrentStep(3); }}
                    disabled={!isStepEnabled(2) || 2 < activeStep || isSubmitting}
                    style={{ padding: '8px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    発注登録
                  </button>
                </div>
              </>
            )}

            {orderChoice === '申請を見送る' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="repair-btn"
                  onClick={handleCloseGroup}
                  disabled={!isStepEnabled(2)}
                  style={{ padding: '10px 24px', background: COLORS.error, color: 'white', border: 'none', borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 'bold' }}
                >
                  見積グループを解除し終了
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* STEP③: 作業日登録 */}
        <Section
          step={3}
          title="STEP③．作業完了予定日登録"
          accentColor={COLORS.accent}
          enabled={isStepEnabled(3)}
          completed={3 < activeStep}
        >
          <div style={{ padding: '12px 16px', background: '#FAFAFA', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#4A4A4A' }}>
            作業日を登録してください
          </div>

          {/* 完了予定日入力 */}
          <div style={{ padding: '16px', background: COLORS.surfaceAlt, borderRadius: '8px', border: `1px solid ${COLORS.borderLight}`, marginBottom: '16px' }}>
            <FormRow style={{ marginBottom: 0, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ ...labelStyle, fontWeight: 'bold' }}>完了予定日</span>
                <input type="date" value={formData.deliveryDate} onChange={(e) => { updateFormData({ deliveryDate: e.target.value }); setIsDeliveryDateConfirmed(false); }} disabled={!isStepEnabled(3)} style={{ padding: '6px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', width: '180px' }} />
                {isDeliveryDateConfirmed && (
                  <span style={{ padding: '4px 12px', background: '#EBF5EE', color: '#146E2E', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    ✓ 登録済み
                  </span>
                )}
              </div>
              <button className="repair-btn" onClick={handleStep3Complete} disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting || !formData.deliveryDate} style={{ padding: '10px 24px', background: formData.deliveryDate ? COLORS.primary : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: formData.deliveryDate && isStepEnabled(3) ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 'bold' }}>
                作業日登録
              </button>
            </FormRow>
          </div>
        </Section>

        {/* STEP④: 完了登録 */}
        <Section
          step={4}
          title="STEP④．完了登録"
          accentColor={COLORS.accent}
          enabled={isStepEnabled(4)}
          completed={4 < activeStep}
          headerAction={
            <button className="repair-btn" onClick={() => { setPreviewTab('完了報告書他'); setPreviewDocumentIndex(null); }} disabled={!isStepEnabled(4)} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: COLORS.accent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              一覧表示
            </button>
          }
        >
          <div style={{ padding: '12px 16px', background: '#EBF5EE', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#146E2E' }}>
            登録対象のファイル選択し、必要項目を入力してください。
          </div>

          {/* 登録済みドキュメント一覧 */}
          {registeredDocuments.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '6px' }}>
                登録済みドキュメント（{registeredDocuments.length}件）
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: COLORS.surfaceAlt }}>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>種別</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>ファイル名</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: `1px solid ${COLORS.border}` }}>勘定科目</th>
                      <th style={{ padding: '8px', textAlign: 'center', border: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredDocuments.map((d) => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: '#EBF5EE', color: '#4A4A4A' }}>
                            {d.documentType}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>📄</span>
                            <span>{d.fileName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted }}>{d.accountOther || '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteDocument(d.id)} disabled={!isStepEnabled(4)} style={{ padding: '2px 8px', background: 'transparent', color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ドキュメント入力フォーム */}
          <div style={{ marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E1E1E1' }}>
              <tbody>
                <tr>
                  <th style={{ background: '#F1F1F1', color: '#4A4A4A', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>添付ファイル</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ padding: '6px 16px', background: '#FAFAFA', border: '1px solid #E1E1E1', borderRadius: '4px', cursor: isStepEnabled(4) ? 'pointer' : 'not-allowed', fontSize: '13px', whiteSpace: 'nowrap', opacity: isStepEnabled(4) ? 1 : 0.6 }}>
                        ファイルの選択
                        <input type="file" accept=".pdf,.jpg,.png" disabled={!isStepEnabled(4)} onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedDocFileName(file.name); }} style={{ display: 'none' }} />
                      </label>
                      <span style={{ color: selectedDocFileName ? COLORS.success : '#8A8A8A', fontSize: '13px', flex: 1 }}>{selectedDocFileName || 'ファイルが選択されていません'}</span>
                      <button
                        className="repair-btn"
                        onClick={() => { setPreviewTab('完了報告書他'); setPreviewDocumentIndex(null); }}
                        disabled={!isStepEnabled(4) || !selectedDocFileName}
                        style={{ padding: '6px 16px', background: selectedDocFileName ? COLORS.accent : COLORS.disabled, color: 'white', border: 'none', borderRadius: '4px', cursor: selectedDocFileName ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                      >
                        プレビュー
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th style={{ background: '#F1F1F1', color: '#4A4A4A', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #E1E1E1', whiteSpace: 'nowrap', verticalAlign: 'top' }}>ドキュメント種別</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '24px', rowGap: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {DISPOSAL_DOC_TYPES.map((dt, idx) => idx % 2 === 0 ? (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="radio" name="documentType" checked={docTypeIndex === idx} onChange={() => setDocTypeIndex(idx)} disabled={!isStepEnabled(4)} />
                            {dt}
                          </label>
                        ) : null)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {DISPOSAL_DOC_TYPES.map((dt, idx) => idx % 2 === 1 ? (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="radio" name="documentType" checked={docTypeIndex === idx} onChange={() => setDocTypeIndex(idx)} disabled={!isStepEnabled(4)} />
                            {dt}
                          </label>
                        ) : null)}
                      </div>
                    </div>
                    {DISPOSAL_DOC_TYPES[docTypeIndex] === 'その他' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <input type="text" value={docOtherName} onChange={(e) => setDocOtherName(e.target.value)} placeholder="その他ドキュメント名の入力" disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '260px' }} />
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th style={{ background: '#F1F1F1', color: '#4A4A4A', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #E1E1E1', whiteSpace: 'nowrap', verticalAlign: 'top' }}>保存形式</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="docSaveFormat" checked={docSaveFormat === '電子取引'} onChange={() => setDocSaveFormat('電子取引')} disabled={!isStepEnabled(4)} /> 電子取引</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="docSaveFormat" checked={docSaveFormat === 'スキャナ保存'} onChange={() => setDocSaveFormat('スキャナ保存')} disabled={!isStepEnabled(4)} /> スキャナ保存</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="docSaveFormat" checked={docSaveFormat === '未指定'} onChange={() => setDocSaveFormat('未指定')} disabled={!isStepEnabled(4)} /> 未指定</label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 日付・No.・金額・勘定科目（2カラム） */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto minmax(0, 1fr)', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>日付</label>
              <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '180px' }} />
              <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ドキュメントNo.</label>
              <input type="text" value={docNo} onChange={(e) => setDocNo(e.target.value)} placeholder="登録ドキュメントのNo.を入力" disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }} />

              {/* 実績金額・勘定科目は「見積書（変更が発生した場合）」選択時のみ表示（顧客イメージ注釈に準拠） */}
              {DISPOSAL_DOC_TYPES[docTypeIndex] === '見積書（変更が発生した場合）' && (
                <>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>実績金額（税別）</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥</span>
                    <input type="number" value={docActualAmount} onChange={(e) => setDocActualAmount(e.target.value)} placeholder="0" disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '160px', fontVariantNumeric: 'tabular-nums' }} />
                    <span style={{ fontSize: '12px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>（税別）</span>
                  </div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>勘定科目</label>
                  <select value={docAccountDivision} onChange={(e) => setDocAccountDivision(e.target.value)} disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '100%', maxWidth: '250px' }}>
                    <option value="">選択してください</option>
                    {ACCOUNT_DIVISIONS.map((d) => (
                      <option key={d.value} value={d.label}>{d.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <FormRow style={{ justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
            <button className="repair-btn" onClick={handleAddDocument} disabled={!isStepEnabled(4) || isSubmitting || !selectedDocFileName} style={{ padding: '10px 24px', background: selectedDocFileName ? COLORS.primary : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: selectedDocFileName ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 'bold' }}>
              ドキュメント登録
            </button>
            <button className="repair-btn" onClick={handleStep4Complete} disabled={!isStepEnabled(4) || isSubmitting} style={{ padding: '10px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              {isSubmitting ? '登録中...' : '登録完了（タスク完了）'}
            </button>
          </FormRow>
        </Section>

        </div>
        {/* 左側パネル終了 */}

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: '#E1E1E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: '#E1E1E1',
            borderRadius: '2px',
          }} />
        </div>

        {/* 右側: プレビューエリア（横型タブ付き） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'white',
          margin: '16px 16px 16px 0',
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 横タブ + Printer */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              background: COLORS.white,
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}>
              {([
                { key: '見積依頼書' as PreviewDocTab, label: '見積依頼書' },
                { key: '見積書' as PreviewDocTab, label: '見積書' },
                { key: '発注書' as PreviewDocTab, label: '発注書' },
                { key: '完了報告書他' as PreviewDocTab, label: '各種完了書類' },
              ]).map((tab) => {
                const isActive = previewTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setPreviewTab(tab.key);
                      if (tab.key === '見積依頼書') setPreviewVendorIndex(null);
                      if (tab.key === '見積書') setPreviewQuotationIndex(null);
                      if (tab.key === '完了報告書他') setPreviewDocumentIndex(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: 'none',
                      borderBottom: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                      background: COLORS.white,
                      color: isActive ? COLORS.primaryDark : COLORS.textMuted,
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <button
                className="repair-btn"
                aria-label="印刷"
                title="印刷"
                style={{
                  width: '40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: COLORS.white,
                  border: 'none',
                  borderBottom: '3px solid transparent',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Printer size={18} />
              </button>
            </div>
            {/* タブヘッダー: 現在タブのタイトル */}
            <div style={{
              padding: '12px 16px',
              background: COLORS.white,
              borderBottom: `1px solid ${COLORS.borderLight}`,
              color: COLORS.textPrimary,
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>
                {previewTab === '見積依頼書' && (previewVendorIndex !== null
                  ? `見積依頼書 - ${vendors[previewVendorIndex]?.vendorName || `依頼先${previewVendorIndex + 1}`}`
                  : '見積依頼書（業者を選択）')}
                {previewTab === '見積書' && (previewQuotationIndex !== null
                  ? `見積書 - ${registeredQuotations[previewQuotationIndex]?.fileName || ''}`
                  : '見積書')}
                {previewTab === '発注書' && '廃棄発注書'}
                {previewTab === '完了報告書他' && (previewDocumentIndex !== null
                  ? `完了報告書 - ${registeredDocuments[previewDocumentIndex]?.fileName || ''}`
                  : '完了報告書他')}
              </span>
              <button
                className="repair-btn"
                style={{
                  padding: '4px 12px',
                  background: COLORS.surface,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                PDF出力
              </button>
            </div>

            {/* プレビューコンテンツ */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: '#FAFAFA',
              padding: '24px',
            }}>
              {/* 見積依頼書プレビュー */}
              {previewTab === '見積依頼書' && (() => {
                const vIdx = previewVendorIndex ?? 0;
                const vendor = vendors[vIdx];
                return (
                  <div style={{
                    background: 'white',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    padding: '32px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderBottom: '2px solid #4A4A4A', paddingBottom: '12px', marginBottom: '16px' }}>
                      見積依頼書
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>【宛先】</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{vendor?.vendorName || '（未設定）'}</div>
                        <div style={{ fontSize: '13px' }}>{vendor?.personInCharge || ''} 様</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>【差出人】</div>
                        <div style={{ fontSize: '13px' }}>{formData.receptionDepartment || '○○病院'}</div>
                        <div style={{ fontSize: '11px' }}>{formData.receptionPerson} / {formData.receptionContact}</div>
                      </div>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>記</p>
                    <p style={{ fontSize: '13px', marginBottom: '12px', fontVariantNumeric: 'tabular-nums' }}><strong>申請No.</strong> {application.applicationNo}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
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
                            <th style={{ padding: '6px 12px', background: '#F1F1F1', textAlign: 'left', width: '128px', border: '1px solid #E1E1E1', fontWeight: 'normal' }}>{label}</th>
                            <td style={{ padding: '6px 12px', border: '1px solid #E1E1E1' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>廃棄理由</div>
                      <div style={{ fontSize: '13px' }}>{application.disposalReason}</div>
                    </div>
                    {formData.requestComment && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>ご依頼事項</div>
                        <div style={{ fontSize: '13px', padding: '12px', background: '#EBF5EE', borderRadius: '4px', border: '1px solid #E1E1E1' }}>{formData.requestComment}</div>
                      </div>
                    )}
                    <p style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '24px' }}>— 以上 —</p>
                  </div>
                );
              })()}

              {/* 見積書一覧 */}
              {previewTab === '見積書' && previewQuotationIndex === null && (
                <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>登録済み見積書一覧</div>
                  {registeredQuotations.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: COLORS.surfaceAlt }}>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #E1E1E1' }}>業者名</th>
                          <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #E1E1E1' }}>見積金額</th>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #E1E1E1' }}>ファイル名</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #E1E1E1', width: '70px' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredQuotations.map((q, idx) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid #E1E1E1' }}>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{q.vendorName}</td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>¥{q.amount.toLocaleString()}</td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{q.fileName}</td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center' }}>
                              <button onClick={() => setPreviewQuotationIndex(idx)} style={{ padding: '2px 10px', background: COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>表示</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '32px', fontSize: '13px' }}>
                      登録済みの見積書はありません<br />
                      <span style={{ fontSize: '11px' }}>STEP②で見積書を登録してください</span>
                    </div>
                  )}
                </div>
              )}

              {/* 見積書個別 */}
              {previewTab === '見積書' && previewQuotationIndex !== null && (() => {
                const q = registeredQuotations[previewQuotationIndex];
                if (!q) return null;
                return (
                  <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    <button onClick={() => setPreviewQuotationIndex(null)} style={{ padding: '4px 12px', background: COLORS.surface, border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginBottom: '16px' }}>
                      ← 一覧に戻る
                    </button>
                    <div style={{ background: '#4A4A4A', borderRadius: '4px', minHeight: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '40px' }}>📄</span>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>{q.fileName}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>PDFプレビュー（モック）</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        {([
                          ['業者名', q.vendorName],
                          ['見積金額', `¥${q.amount.toLocaleString()}（税別）`],
                          ['フェーズ', q.phase === '発注用' ? '発注登録用' : '参考'],
                          ['保存形式', q.saveFormat],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label}>
                            <th style={{ padding: '8px', background: '#F1F1F1', textAlign: 'left', width: '128px', border: '1px solid #E1E1E1', fontWeight: 'normal' }}>{label}</th>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* 発注書 */}
              {previewTab === '発注書' && (
                <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '32px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderBottom: '2px solid #4A4A4A', paddingBottom: '12px', marginBottom: '16px' }}>廃棄発注書</h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>【宛先】</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{vendors[0]?.vendorName || '（未設定）'}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>【差出人】</div>
                      <div style={{ fontSize: '13px' }}>{formData.receptionDepartment || '○○病院'}</div>
                    </div>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>記</p>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>【発注内容】</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        {([
                          ['発注No.', application.applicationNo],
                          ['発注金額', `¥${(registeredQuotations.find(q => q.phase === '発注用')?.amount || 0).toLocaleString()}（税別）`],
                          ['納品場所', `${application.installationDivision} ${application.installationDepartment} ${application.installationRoom}`],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label}>
                            <th style={{ padding: '6px 12px', background: '#F1F1F1', textAlign: 'left', width: '128px', border: '1px solid #E1E1E1', fontWeight: 'normal' }}>{label}</th>
                            <td style={{ padding: '6px 12px', border: '1px solid #E1E1E1', fontVariantNumeric: 'tabular-nums' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '24px' }}>— 以上 —</p>
                </div>
              )}

              {/* 完了報告書他 一覧 */}
              {previewTab === '完了報告書他' && previewDocumentIndex === null && (
                <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>登録済みドキュメント一覧</div>
                  {registeredDocuments.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: COLORS.surfaceAlt }}>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #E1E1E1' }}>種別</th>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #E1E1E1' }}>ファイル名</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #E1E1E1' }}>登録日</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #E1E1E1', width: '70px' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredDocuments.map((doc, idx) => (
                          <tr key={doc.id} style={{ borderBottom: '1px solid #E1E1E1' }}>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{doc.documentType}</td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{doc.fileName}</td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(doc.registeredAt).toLocaleDateString('ja-JP')}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center' }}>
                              <button onClick={() => setPreviewDocumentIndex(idx)} style={{ padding: '2px 10px', background: COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>表示</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '32px', fontSize: '13px' }}>
                      登録済みのドキュメントはありません<br />
                      <span style={{ fontSize: '11px' }}>STEP④でドキュメントを登録してください</span>
                    </div>
                  )}
                </div>
              )}

              {/* 完了報告書他 個別 */}
              {previewTab === '完了報告書他' && previewDocumentIndex !== null && (() => {
                const doc = registeredDocuments[previewDocumentIndex];
                if (!doc) return null;
                return (
                  <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    <button onClick={() => setPreviewDocumentIndex(null)} style={{ padding: '4px 12px', background: COLORS.surface, border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginBottom: '16px' }}>
                      ← 一覧に戻る
                    </button>
                    <div style={{ background: '#4A4A4A', borderRadius: '4px', minHeight: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '40px' }}>📄</span>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>{doc.fileName}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>PDFプレビュー（モック）</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        {([
                          ['種別', doc.documentType],
                          ['勘定科目', doc.accountType === 'その他' ? doc.accountOther || 'その他' : doc.accountType],
                          ['登録日時', new Date(doc.registeredAt).toLocaleString('ja-JP')],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label}>
                            <th style={{ padding: '8px', background: '#F1F1F1', textAlign: 'left', width: '128px', border: '1px solid #E1E1E1', fontWeight: 'normal' }}>{label}</th>
                            <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <OrderRegistrationModal
        isOpen={isOrderRegisterModalOpen}
        onClose={() => setIsOrderRegisterModalOpen(false)}
        orderNoPrefix="PO-DISPOSAL"
        onConfirm={(orderNo, deliveryMethod) => {
          setRegisteredOrderNo(orderNo);
          setIsOrderRegisterModalOpen(false);
          setApplication(prev => prev ? { ...prev, status: '発注済' } : prev);
          setCurrentStep(3);
          alert(`発注登録が完了しました。STEP③へ進みます。\n発注No,: ${orderNo}\n送付方法: ${deliveryMethod}`);
        }}
      />
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
export default function DisposalTaskPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
        <Header
          title="廃棄申請管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#8A8A8A' }}>読み込み中...</p>
        </div>
      </div>
    }>
      <DisposalTaskContent />
    </Suspense>
  );
}
