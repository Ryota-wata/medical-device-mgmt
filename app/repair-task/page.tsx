'use client';

import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';

/** カラートークン（order-registration準拠） */
const COLORS = {
  primary: '#27ae60',
  primaryDark: '#3d5a80',
  accent: '#e67e22',
  textOnAccent: '#1f2937',
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnColor: '#ffffff',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  surface: '#f9fafb',
  surfaceAlt: '#f3f4f6',
  sectionHeader: '#4b5563',
  white: '#ffffff',
  error: '#dc2626',
  success: '#27ae60',
  successLight: '#e8f5e9',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningBorder: '#f59e0b',
  warningText: '#92400e',
  disabled: '#9ca3af',
  disabledBg: '#f3f4f6',
  stepActive: '#3498db',
  stepCompleted: '#27ae60',
  stepPending: '#dee2e6',
} as const;

/** 修理フローのステップ定義（4ステップ） */
const REPAIR_STEPS = [
  { step: 1, label: '受付・見積依頼' },
  { step: 2, label: '見積登録・発注' },
  { step: 3, label: '納期・検収' },
  { step: 4, label: '完了（資産登録）' },
];

// 修理依頼のステータス（新ステータス体系）
type RepairStatus = '新規申請' | '見積依頼済' | '見積登録済' | '発注済' | '納期確定' | '検収登録' | '完了' | '却下';

// 登録済み見積の型（STEP3用）
interface RegisteredQuotation {
  id: number;
  phase: '発注用' | '参考' | '追加';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  vendorName: string;
  amount: number;
  registeredAt: string;
}

// 登録済みドキュメントの型（STEP5用）
interface RegisteredDocument {
  id: number;
  documentType: '修理報告書' | '納品書' | 'その他';
  accountType: '修繕費' | 'その他';
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

// 修理依頼データ型
interface RepairRequest {
  id: number;
  requestNo: string;
  requestDate: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  status: RepairStatus;
  symptoms: string;
  repairCategory: '院内修理' | '院外修理' | '';
  // 受付情報
  receptionDepartment: string;
  receptionPerson: string;
  receptionContact: string;
  // 代替機
  needsAlternative: boolean;
  alternativeDeliveryDate: string;
  alternativeReturnDate: string;
  // 導入業者
  installerName: string;
  installerPerson: string;
  installerContact: string;
  // 保守契約
  hasMaintenanceContract: boolean;
  warrantyEndDate: string;
  // 見積依頼先（複数）
  vendors: {
    name: string;
    person: string;
    email: string;
    contact: string;
    deadline: string;
  }[];
  // 見積情報
  quotationFile: string;
  quotationPhase: '発注用' | '参考' | '追加';
  quotationAmount: number;
  isFreeRepair: boolean;
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  quotationDate: string;
  registrationDate: string;
  businessRegistrationNo: string;
  quotationVendorName: string;
  quotationVendorPerson: string;
  // STEP①追加：ご依頼事項
  requestComment: string;
  // STEP①追加：商品引取日・修理品納品日
  pickupDate: string;
  repairDeliveryDate: string;
  // STEP①追加：代替機返却済フラグ
  alternativeReturned: boolean;
  // 発注情報
  isRejected: boolean;
  orderVendorName: string;
  orderVendorPerson: string;
  orderVendorEmail: string;
  orderVendorContact: string;
  // 完了情報
  documentType: '修理報告書' | '納品書';
  accountType: '修繕費' | 'その他';
  accountOther: string;
  deliveryDate: string;
}

// モックデータ取得
const getMockRequest = (id: string): RepairRequest => {
  const statusMap: Record<string, RepairStatus> = {
    '1': '納期確定',
    '2': '見積依頼済',
    '3': '新規申請',
    '4': '見積登録済',
  };

  return {
    id: parseInt(id),
    requestNo: `REP-2026020${id}-001`,
    requestDate: '2026-02-05',
    qrLabel: `QR-00${id}`,
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    serialNo: 'SN-001234',
    applicantDepartment: '集中治療室',
    applicantName: '田中花子',
    applicantContact: '03-1234-5678',
    status: statusMap[id] || '新規申請',
    symptoms: '電源が入らない',
    repairCategory: '',
    receptionDepartment: '',
    receptionPerson: '',
    receptionContact: '',
    hasMaintenanceContract: true,
    warrantyEndDate: '2027-03-31',
    needsAlternative: false,
    alternativeDeliveryDate: '',
    alternativeReturnDate: '',
    installerName: 'フクダ電子株式会社',
    installerPerson: '山田太郎',
    installerContact: '03-9876-5432',
    requestComment: '',
    pickupDate: '',
    repairDeliveryDate: '',
    alternativeReturned: false,
    vendors: [
      { name: 'フクダ電子株式会社', person: '山田太郎', email: '', contact: '03-9876-5432', deadline: '' },
      { name: '', person: '', email: '', contact: '', deadline: '' },
      { name: '', person: '', email: '', contact: '', deadline: '' },
    ],
    quotationFile: '',
    quotationPhase: '発注用',
    quotationAmount: 0,
    isFreeRepair: false,
    saveFormat: '未指定',
    quotationDate: '',
    registrationDate: '',
    businessRegistrationNo: '',
    quotationVendorName: '',
    quotationVendorPerson: '',
    isRejected: false,
    orderVendorName: '',
    orderVendorPerson: '',
    orderVendorEmail: '',
    orderVendorContact: '',
    documentType: '修理報告書',
    accountType: '修繕費',
    accountOther: '',
    deliveryDate: '',
  };
};

// ステータスから初期ステップを取得（初期表示用）
const getInitialStep = (status: RepairStatus): number => {
  switch (status) {
    case '新規申請': return 1;
    case '見積依頼済': return 1;
    case '見積登録済': return 2;
    case '発注済': return 3;
    case '納期確定': return 3;
    case '検収登録': return 3;
    case '完了': return 4;
    case '却下': return 2;
    default: return 1;
  }
};

// 共通スタイル
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

// セクションコンポーネント（コンポーネント外に定義してリレンダリング問題を回避）
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
  return (
    <div style={{
      background: COLORS.white,
      border: enabled ? `2px solid ${accentColor}` : `1px solid ${COLORS.borderLight}`,
      borderRadius: '8px',
      marginBottom: '16px',
      opacity: enabled ? 1 : 0.7,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: enabled ? accentColor : completed ? COLORS.success : COLORS.sectionHeader,
        color: COLORS.textOnColor,
        borderRadius: '6px 6px 0 0',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {completed ? '✓' : step}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 'bold', flex: 1 }}>{title}</span>
        {completed && (
          <span style={{
            fontSize: '11px',
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            完了
          </span>
        )}
        {enabled && !headerAction && (
          <span style={{
            fontSize: '11px',
            background: 'rgba(255,255,255,0.3)',
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

// フォーム行コンポーネント（コンポーネント外に定義してリレンダリング問題を回避）
const FormRow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', ...style }}>
    {children}
  </div>
);

function RepairTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id') || '3';

  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [formData, setFormData] = useState<RepairRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // STEP②用：見積登録時の選択業者名・金額
  const [quotationVendorName, setQuotationVendorName] = useState<string>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  // STEP3用：登録済み見積リスト
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  // STEP3用：選択中のファイル名
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  // STEP5用：登録済みドキュメントリスト
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  // STEP5用：選択中のファイル名
  const [selectedDocFileName, setSelectedDocFileName] = useState<string>('');
  // STEP5用：納期確定フラグ
  const [isDeliveryDateConfirmed, setIsDeliveryDateConfirmed] = useState<boolean>(false);
  // STEP②用：対応区分（発注 or 申請却下）
  const [orderDisposition, setOrderDisposition] = useState<'order' | 'reject'>('order');
  // STEP④用：固定資産番号
  const [fixedAssetNo, setFixedAssetNo] = useState<string>('');
  // STEP④用：最終勘定科目
  const [finalAccountType, setFinalAccountType] = useState<'修繕費' | 'その他'>('修繕費');
  const [finalAccountOther, setFinalAccountOther] = useState<string>('');
  // 現在のステップ（ステータスとは別に管理）
  const [currentStep, setCurrentStep] = useState<number>(1);
  // プレビュータブ（右端縦型タブ、文書名ベース）
  type PreviewDocTab = '申請申請書' | '修理依頼書' | '見積書' | '修理発注書' | '完了報告書他';
  const [previewTab, setPreviewTab] = useState<PreviewDocTab>('申請申請書');
  // 修理依頼書プレビュー対象の業者インデックス
  const [previewVendorIndex, setPreviewVendorIndex] = useState<number | null>(null);
  // 見積書プレビュー用：選択中の見積インデックス
  const [previewQuotationIndex, setPreviewQuotationIndex] = useState<number | null>(null);
  // 完了報告書プレビュー用：選択中のドキュメントインデックス
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number | null>(null);

  // パネル幅の状態（左パネルの幅をパーセントで管理）
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // ドラッグハンドラ
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    // 最小30%、最大70%に制限
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
    const data = getMockRequest(requestId);
    setRequest(data);
    setFormData({ ...data });
    // 初期ステップを設定
    setCurrentStep(getInitialStep(data.status));
  }, [requestId]);

  // currentStepをactiveStepとして使用
  const activeStep = currentStep;

  const isStepEnabled = (step: number) => step <= activeStep;

  if (!request || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="修理申請管理" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<RepairRequest>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const updateVendor = (index: number, field: string, value: string) => {
    if (!formData) return;
    const newVendors = [...formData.vendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    updateFormData({ vendors: newVendors });
  };

  // STEP①: 院内/院外修理を選択して受付
  const handleStep1Submit = (category: '院内修理' | '院外修理') => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (category === '院内修理') {
        setRequest(prev => prev ? { ...prev, status: '納期確定', repairCategory: category } : prev);
        setCurrentStep(3); // 院内修理はSTEP③（納期・検収）へ
      } else {
        // 院外修理：STEP①内の見積依頼セクション表示（repairCategoryで制御）
        setRequest(prev => prev ? { ...prev, status: '見積依頼済', repairCategory: category } : prev);
        updateFormData({ repairCategory: category });
      }
      setIsSubmitting(false);
    }, 500);
  };

  // STEP2: 見積依頼
  const handleStep2Submit = (index: number) => {
    const vendor = formData.vendors[index];
    if (!vendor.name || !vendor.email) {
      alert('業者名とメールアドレスを入力してください');
      return;
    }
    alert(`${vendor.name}へ見積依頼を送信しました。`);
  };

  // STEP①内の見積依頼完了 → STEP②へ
  const handleStep1VendorComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積依頼を完了しました。STEP②へ進みます。');
      setRequest(prev => prev ? { ...prev, status: '見積登録済' } : prev);
      setCurrentStep(2); // STEP②へ
      setIsSubmitting(false);
    }, 500);
  };

  // STEP②: 見積登録（リストに追加）
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
      registeredAt: new Date().toISOString(),
    };

    setRegisteredQuotations(prev => [...prev, newQuotation]);

    // 入力フォームをリセット
    setSelectedFileName('');
    setQuotationVendorName('');
    setQuotationAmount('');

    alert('見積を登録しました');
  };

  // STEP3: 見積削除
  const handleDeleteQuotation = (id: number) => {
    if (confirm('この見積を削除しますか？')) {
      setRegisteredQuotations(prev => prev.filter(q => q.id !== id));
    }
  };

  // STEP②: 申請却下（終了）
  const handleStep2Reject = () => {
    if (confirm('この修理申請を却下しますか？')) {
      setRequest(prev => prev ? { ...prev, status: '却下' } : prev);
      alert('修理申請を却下しました。一覧に戻ります。');
      router.push('/quotation-data-box/repair-requests');
    }
  };

  // STEP②: 対象品の廃棄申請へ
  const handleStep2Dispose = () => {
    if (confirm('廃棄申請画面へ移動しますか？')) {
      router.push('/quotation-data-box/disposal-management');
    }
  };

  // STEP②: 発注書送信 → STEP③へ
  const handleStep2Order = () => {
    setRequest(prev => prev ? { ...prev, status: '発注済' } : prev);
    setCurrentStep(3); // STEP③（納期・検収）へ
    alert('発注書を発行しました。STEP③へ進みます。');
  };

  // STEP③: ドキュメント登録（リストに追加）
  const handleAddDocument = () => {
    if (!selectedDocFileName) {
      alert('ファイルを選択してください');
      return;
    }

    const newDocument: RegisteredDocument = {
      id: Date.now(),
      documentType: formData.documentType,
      accountType: formData.accountType,
      accountOther: formData.accountType === 'その他' ? formData.accountOther : undefined,
      fileName: selectedDocFileName,
      registeredAt: new Date().toISOString(),
    };

    setRegisteredDocuments(prev => [...prev, newDocument]);
    setSelectedDocFileName('');
    alert('ドキュメントを登録しました');
  };

  // STEP③: ドキュメント削除
  const handleDeleteDocument = (id: number) => {
    if (confirm('このドキュメントを削除しますか？')) {
      setRegisteredDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  // STEP③: 納期確定
  const handleConfirmDeliveryDate = () => {
    if (!formData.deliveryDate) {
      alert('納期を入力してください');
      return;
    }
    setIsDeliveryDateConfirmed(true);
    setRequest(prev => prev ? { ...prev, status: '納期確定' } : prev);
    alert(`納期を ${formData.deliveryDate} で確定しました`);
  };

  // STEP③: 検収登録 → STEP④へ
  const handleStep3InspectionComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('検収を登録しました。STEP④へ進みます。');
      setRequest(prev => prev ? { ...prev, status: '検収登録' } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 500);
  };

  // STEP④: 資産登録完了
  const handleStep4Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setRequest(prev => prev ? { ...prev, status: '完了' } : prev);
      alert('資産登録を完了しました。タスク管理画面に戻ります。');
      router.push('/quotation-data-box/repair-requests');
    }, 500);
  };

  // プログレスバー
  const ProgressBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      background: COLORS.surfaceAlt,
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      {REPAIR_STEPS.map((item, index) => (
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
          {index < REPAIR_STEPS.length - 1 && (
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
        title="修理申請管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/repair-requests"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <ProgressBar />

      {/* 基本情報バー */}
      <div style={{
        padding: '8px 16px',
        background: COLORS.warningBg,
        borderBottom: `1px solid ${COLORS.warningBorder}`,
        display: 'flex',
        gap: '24px',
        fontSize: '12px',
        color: COLORS.warningText,
        flexWrap: 'wrap',
      }}>
        <span><strong>申請No:</strong> {request.requestNo}</span>
        <span><strong>品名:</strong> {request.itemName}</span>
        <span><strong>メーカー:</strong> {request.maker}</span>
        <span><strong>型式:</strong> {request.model}</span>
        <span><strong>症状:</strong> {request.symptoms}</span>
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
        {/* STEP①: 修理申請の受付・見積依頼 */}
        <Section
          step={1}
          title="STEP1. 修理申請の受付・見積依頼"
          accentColor="#3498db"
          enabled={isStepEnabled(1)}
          completed={1 < activeStep}
          headerAction={
            <button
              className="repair-btn"
              onClick={() => { setPreviewTab('申請申請書'); }}
              disabled={!isStepEnabled(1)}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.9)',
                color: '#3498db',
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
          <FormRow>
            <span style={labelStyle}>受付部署</span>
            <input
              type="text"
              placeholder="部署名"
              value={formData.receptionDepartment}
              onChange={(e) => updateFormData({ receptionDepartment: e.target.value })}
              {...getInputProps(1)}
              style={{ ...getInputProps(1).style, width: '150px' }}
            />
            <input
              type="text"
              placeholder="担当者名"
              value={formData.receptionPerson}
              onChange={(e) => updateFormData({ receptionPerson: e.target.value })}
              {...getInputProps(1)}
              style={{ ...getInputProps(1).style, width: '120px' }}
            />
            <input
              type="text"
              placeholder="連絡先"
              value={formData.receptionContact}
              onChange={(e) => updateFormData({ receptionContact: e.target.value })}
              {...getInputProps(1)}
              style={{ ...getInputProps(1).style, width: '150px' }}
            />
          </FormRow>

          <FormRow>
            <span style={labelStyle}>代替機対応</span>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="alternative"
                checked={formData.needsAlternative}
                onChange={() => updateFormData({ needsAlternative: true })}
                disabled={!isStepEnabled(1)}
              />
              必要
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="alternative"
                checked={!formData.needsAlternative}
                onChange={() => updateFormData({ needsAlternative: false })}
                disabled={!isStepEnabled(1)}
              />
              不要
            </label>
            {formData.needsAlternative && (
              <>
                <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>納品日:</span>
                <input
                  type="date"
                  value={formData.alternativeDeliveryDate}
                  onChange={(e) => updateFormData({ alternativeDeliveryDate: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
                <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>返却日:</span>
                <input
                  type="date"
                  value={formData.alternativeReturnDate}
                  onChange={(e) => updateFormData({ alternativeReturnDate: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
                <button
                  className="repair-btn"
                  onClick={() => updateFormData({ alternativeReturned: true })}
                  disabled={!isStepEnabled(1) || formData.alternativeReturned}
                  style={{
                    padding: '4px 12px',
                    background: formData.alternativeReturned ? COLORS.success : COLORS.primary,
                    color: COLORS.textOnColor,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: formData.alternativeReturned ? 'default' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {formData.alternativeReturned ? '返却済' : '返却済にする'}
                </button>
              </>
            )}
          </FormRow>

          <FormRow>
            <span style={labelStyle}>導入業者</span>
            <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>
              {request.installerName} / {request.installerPerson} / {request.installerContact}
            </span>
          </FormRow>

          <FormRow>
            <span style={labelStyle}>保守契約</span>
            <span style={{ fontSize: '13px', color: request.hasMaintenanceContract ? COLORS.success : COLORS.error }}>
              {request.hasMaintenanceContract ? '保守契約対象' : '保守契約なし'}
              {request.warrantyEndDate && ` (期限: ${request.warrantyEndDate})`}
            </span>
          </FormRow>

          <div style={{
            padding: '12px',
            background: COLORS.surfaceAlt,
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
            color: COLORS.textSecondary,
          }}>
            修理申請書を確認し院内修理の場合は院内修理対応とし、納期が確定次第、納期登録を実施してください。
          </div>

          <FormRow style={{ justifyContent: 'flex-start', gap: '12px' }}>
            <button
              className="repair-btn"
              onClick={() => handleStep1Submit('院内修理')}
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
              院内修理対応
            </button>
            <button
              className="repair-btn"
              onClick={() => handleStep1Submit('院外修理')}
              disabled={!isStepEnabled(1) || isSubmitting}
              style={{
                padding: '10px 24px',
                background: COLORS.accent,
                color: COLORS.textOnAccent,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              院外修理（見積依頼へ）
            </button>
          </FormRow>

          {/* 商品引取日・修理品納品日（どのタイミングでも入力可能） */}
          <div style={{
            padding: '12px 16px',
            background: '#fff8e1',
            borderRadius: '4px',
            border: '1px solid #ffcc80',
            marginBottom: '16px',
          }}>
            <FormRow style={{ marginBottom: '8px' }}>
              <span style={{ ...labelStyle, color: '#e65100', minWidth: '100px' }}>商品引取日</span>
              <input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => updateFormData({ pickupDate: e.target.value })}
                style={{ ...inputStyle, width: '160px' }}
              />
            </FormRow>
            <FormRow style={{ marginBottom: 0 }}>
              <span style={{ ...labelStyle, color: '#e65100', minWidth: '100px' }}>修理品納品日</span>
              <input
                type="date"
                value={formData.repairDeliveryDate}
                onChange={(e) => updateFormData({ repairDeliveryDate: e.target.value })}
                style={{ ...inputStyle, width: '160px' }}
              />
            </FormRow>
          </div>

          {/* 院外修理選択時：見積依頼セクション */}
          {formData.repairCategory === '院外修理' && (
            <>
              <div style={{
                padding: '12px 16px',
                background: '#e3f2fd',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1565c0',
              }}>
                修理業者を登録し、修理見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
              </div>

              {/* 依頼先テーブル */}
              <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ background: COLORS.surfaceAlt }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}`, width: '70px' }}></th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>業者名 <span style={{ color: COLORS.error }}>*</span></th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>担当者名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>メール <span style={{ color: COLORS.error }}>*</span></th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>連絡先</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}`, width: '130px' }}>提出期限</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '150px' }}>アクション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2].map((i) => {
                      const vendor = formData.vendors[i];
                      const hasVendorData = vendor?.name && vendor?.email;
                      const isSelected = previewTab === '修理依頼書' && previewVendorIndex === i;
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: `1px solid ${COLORS.borderLight}`,
                            background: isSelected ? '#e3f2fd' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '6px 8px', color: COLORS.textMuted, fontSize: '11px' }}>
                            依頼先{i + 1}
                            {i === 0 && <span style={{ display: 'block', fontSize: '10px', color: COLORS.success }}>(導入業者)</span>}
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input type="text" value={vendor?.name || ''} onChange={(e) => updateVendor(i, 'name', e.target.value)} placeholder="業者名" {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '100%' }} />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input type="text" value={vendor?.person || ''} onChange={(e) => updateVendor(i, 'person', e.target.value)} placeholder="担当者" {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '100%' }} />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input type="email" value={vendor?.email || ''} onChange={(e) => updateVendor(i, 'email', e.target.value)} placeholder="email@example.com" {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '100%' }} />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input type="tel" value={vendor?.contact || ''} onChange={(e) => updateVendor(i, 'contact', e.target.value)} placeholder="03-0000-0000" {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '100%' }} />
                          </td>
                          <td style={{ padding: '4px' }}>
                            <input type="date" value={vendor?.deadline || ''} onChange={(e) => updateVendor(i, 'deadline', e.target.value)} {...getInputProps(1)} style={{ ...getInputProps(1).style, width: '100%' }} />
                          </td>
                          <td style={{ padding: '4px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button className="repair-btn" onClick={() => { setPreviewTab('修理依頼書'); setPreviewVendorIndex(i); }} disabled={!isStepEnabled(1) || !hasVendorData} style={{ padding: '4px 8px', background: hasVendorData ? '#3498db' : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: hasVendorData ? 'pointer' : 'not-allowed', fontSize: '11px' }} title={hasVendorData ? 'プレビュー表示' : '業者名とメールを入力してください'}>
                                プレビュー
                              </button>
                              <button className="repair-btn" onClick={() => handleStep2Submit(i)} disabled={!isStepEnabled(1) || !hasVendorData} style={{ padding: '4px 8px', background: hasVendorData ? COLORS.primary : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: hasVendorData ? 'pointer' : 'not-allowed', fontSize: '11px' }} title={hasVendorData ? '依頼を送信' : '業者名とメールを入力してください'}>
                                依頼送信
                              </button>
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
                  placeholder="例：商品を引き取りにきてください / 見積書を作成してください / 保証期間内での対応は可能ですか？"
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
                  onClick={handleStep1VendorComplete}
                  disabled={!isStepEnabled(1) || isSubmitting}
                  style={{
                    padding: '10px 24px',
                    background: COLORS.accent,
                    color: COLORS.textOnAccent,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  見積依頼完了 → STEP2へ
                </button>
              </FormRow>
            </>
          )}
        </Section>

        {/* STEP②: 見積書登録・発注 */}
        <Section
          step={2}
          title="STEP2. 見積書登録・発注"
          accentColor="#27ae60"
          enabled={isStepEnabled(2)}
          completed={2 < activeStep}
          headerAction={
            <button className="repair-btn" onClick={() => { setPreviewTab('見積書'); setPreviewQuotationIndex(null); }} disabled={!isStepEnabled(2)} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: '#27ae60', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              一覧表示
            </button>
          }
        >
          <div style={{ padding: '12px 16px', background: '#e8f5e9', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#2e7d32' }}>
            STEP1で取得した見積をフェーズごとに登録してください。発注用見積は必須です。
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
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>フェーズ</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>業者名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.border}` }}>金額（税別）</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>保存形式</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredQuotations.map((q) => (
                      <tr key={q.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: q.phase === '発注用' ? '#e3f2fd' : q.phase === '参考' ? '#f3e5f5' : '#fff3e0', color: q.phase === '発注用' ? '#1565c0' : q.phase === '参考' ? '#7b1fa2' : '#e65100' }}>
                            {q.phase === '発注用' ? '修理発注登録用' : q.phase === '参考' ? '参考' : '追加'}
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
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>見積を追加</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #27ae60' }}>
              <tbody>
                <tr>
                  <th style={{ background: '#27ae60', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: '1px solid #27ae60', whiteSpace: 'nowrap' }}>添付ファイル</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #27ae60' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ padding: '6px 16px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed', fontSize: '13px', whiteSpace: 'nowrap', opacity: isStepEnabled(2) ? 1 : 0.6 }}>
                        ファイルの選択
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={!isStepEnabled(2)} onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedFileName(file.name); }} style={{ display: 'none' }} />
                      </label>
                      <span style={{ color: selectedFileName ? COLORS.success : '#666', fontSize: '13px' }}>
                        {selectedFileName || 'ファイルが選択されていません'}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th style={{ background: '#27ae60', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: '1px solid #27ae60', whiteSpace: 'nowrap', verticalAlign: 'top' }}>見積フェーズ</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #27ae60' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="quotationPhase" checked={formData.quotationPhase === '発注用'} onChange={() => updateFormData({ quotationPhase: '発注用' })} disabled={!isStepEnabled(2)} /> 修理発注登録用見積</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="quotationPhase" checked={formData.quotationPhase === '参考'} onChange={() => updateFormData({ quotationPhase: '参考' })} disabled={!isStepEnabled(2)} /> 参考見積</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="quotationPhase" checked={formData.quotationPhase === '追加'} onChange={() => updateFormData({ quotationPhase: '追加' })} disabled={!isStepEnabled(2)} /> 追加見積（部品交換など）</label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th style={{ background: '#27ae60', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '120px', border: '1px solid #27ae60', whiteSpace: 'nowrap', verticalAlign: 'top' }}>保存形式</th>
                  <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #27ae60' }}>
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

          {/* 見積登録業者セクション（テーブルの外） */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#fff176',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: COLORS.textPrimary,
              marginBottom: '12px',
            }}>
              見積登録業者
            </div>
            {/* 業者情報 + 金額 + 登録ボタン横並び */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>業者名</span>
                <select value={quotationVendorName} onChange={(e) => setQuotationVendorName(e.target.value)} disabled={!isStepEnabled(2)} style={{ ...inputStyle, width: '180px' }}>
                  <option value="">業者を選択</option>
                  {formData.vendors.filter(v => v.name).map((v, i) => (
                    <option key={i} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>担当者</span>
                <input type="text" value={formData.vendors.find(v => v.name === quotationVendorName)?.person || ''} readOnly style={{ ...disabledInputStyle, width: '100px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>見積金額</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥</span>
                <input
                  type="number"
                  value={quotationAmount}
                  onChange={(e) => setQuotationAmount(e.target.value)}
                  placeholder="0"
                  disabled={!isStepEnabled(2)}
                  style={{ ...inputStyle, width: '120px', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>（税別）</span>
              </div>
              <button
                className="repair-btn"
                onClick={handleAddQuotation}
                disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || !quotationVendorName}
                style={{
                  padding: '8px 20px',
                  background: selectedFileName && quotationVendorName ? '#fff176' : COLORS.disabledBg,
                  color: COLORS.textPrimary,
                  border: selectedFileName && quotationVendorName ? '1px solid #fdd835' : `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  cursor: selectedFileName && quotationVendorName ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}
              >
                見積を登録
              </button>
            </div>
          </div>

          {/* 対応区分の選択（ラジオカード） */}
          <div style={{
            padding: '12px 16px',
            background: '#fff8e1',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#e65100',
          }}>
            対応区分を選択してください。外部発注の場合は発注書のプレビュー・出力ができます。
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* 発注書の発行カード */}
            <label style={{
              display: 'block',
              padding: '16px 20px',
              border: `2px solid ${orderDisposition === 'order' ? COLORS.accent : COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: orderDisposition === 'order' ? '#fff8e1' : COLORS.white,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="orderDisposition"
                  checked={orderDisposition === 'order'}
                  onChange={() => setOrderDisposition('order')}
                  disabled={!isStepEnabled(2)}
                />
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.accent }}>発注書の発行</span>
              </div>
            </label>

            {/* 申請却下・修理不能カード */}
            <label style={{
              display: 'block',
              padding: '16px 20px',
              border: `2px solid ${orderDisposition === 'reject' ? COLORS.error : COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: orderDisposition === 'reject' ? '#ffebee' : COLORS.white,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="orderDisposition"
                  checked={orderDisposition === 'reject'}
                  onChange={() => setOrderDisposition('reject')}
                  disabled={!isStepEnabled(2)}
                />
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.error }}>申請却下・修理不能</span>
              </div>
            </label>
          </div>

          {/* 発注書の発行選択時のアクションボタン */}
          {orderDisposition === 'order' && (
            <FormRow style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button className="repair-btn" onClick={() => setPreviewTab('修理発注書')} disabled={!isStepEnabled(2) || isSubmitting} style={{ padding: '10px 24px', background: '#34495e', color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                発注書プレビュー
              </button>
              <button className="repair-btn" onClick={handleStep2Order} disabled={!isStepEnabled(2) || isSubmitting} style={{ padding: '10px 24px', background: COLORS.accent, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                発注書を発行 → STEP3へ
              </button>
            </FormRow>
          )}

          {/* 申請却下選択時のアクションボタン */}
          {orderDisposition === 'reject' && (
            <>
              <FormRow style={{ justifyContent: 'flex-end', gap: '12px' }}>
                <button className="repair-btn" onClick={handleStep2Reject} disabled={!isStepEnabled(2) || isSubmitting} style={{ padding: '10px 24px', background: COLORS.error, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  申請を却下し終了
                </button>
                <button className="repair-btn" onClick={handleStep2Dispose} disabled={!isStepEnabled(2) || isSubmitting} style={{ padding: '10px 24px', background: '#795548', color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  対象品の廃棄申請へ
                </button>
              </FormRow>
              <div style={{ textAlign: 'right', fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>
                廃棄品の更新が必要な場合は原本リストより更新申請を行ってください
              </div>
            </>
          )}
        </Section>

        {/* STEP③: 納期・検収 */}
        <Section
          step={3}
          title="STEP3. 納期・検収"
          accentColor="#e67e22"
          enabled={isStepEnabled(3)}
          completed={3 < activeStep}
          headerAction={
            <button className="repair-btn" onClick={() => { setPreviewTab('完了報告書他'); setPreviewDocumentIndex(null); }} disabled={!isStepEnabled(3)} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: '#e67e22', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              一覧表示
            </button>
          }
        >
          <div style={{ padding: '12px 16px', background: '#fff3e0', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#e65100' }}>
            納品日調整期限を登録し、検収を実施してください。
          </div>

          {/* 納期入力 */}
          <div style={{ padding: '16px', background: COLORS.surfaceAlt, borderRadius: '8px', border: `1px solid ${COLORS.borderLight}`, marginBottom: '16px' }}>
            <FormRow style={{ marginBottom: 0, alignItems: 'center' }}>
              <span style={{ ...labelStyle, fontWeight: 'bold' }}>納品日</span>
              <input type="date" value={formData.deliveryDate} onChange={(e) => { updateFormData({ deliveryDate: e.target.value }); setIsDeliveryDateConfirmed(false); }} disabled={!isStepEnabled(3)} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '160px' }} />
              {isDeliveryDateConfirmed && (
                <span style={{ marginLeft: '12px', padding: '4px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  ✓ 確定済み
                </span>
              )}
              <button className="repair-btn" onClick={handleConfirmDeliveryDate} disabled={!isStepEnabled(3) || isSubmitting || !formData.deliveryDate || isDeliveryDateConfirmed} style={{ padding: '8px 20px', background: isDeliveryDateConfirmed ? '#9e9e9e' : COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: isDeliveryDateConfirmed ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                {isDeliveryDateConfirmed ? '納期確定済み' : '納期確定'}
              </button>
            </FormRow>
          </div>

          {/* 検収セクション（納期確定後に表示） */}
          {isDeliveryDateConfirmed && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px', paddingTop: '8px', borderTop: `1px solid ${COLORS.borderLight}` }}>
                検収
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
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>種別</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>仮）勘定科目</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredDocuments.map((d) => (
                          <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                            <td style={{ padding: '8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: d.documentType === '修理報告書' ? '#e3f2fd' : d.documentType === '納品書' ? '#fff3e0' : '#f3e5f5', color: d.documentType === '修理報告書' ? '#1565c0' : d.documentType === '納品書' ? '#e65100' : '#7b1fa2' }}>
                                {d.documentType}
                              </span>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px' }}>📄</span>
                                <span>{d.fileName}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted }}>{d.accountType === 'その他' ? d.accountOther : d.accountType}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button onClick={() => handleDeleteDocument(d.id)} disabled={!isStepEnabled(3)} style={{ padding: '2px 8px', background: 'transparent', color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>削除</button>
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
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>ドキュメントを追加</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e67e22' }}>
                  <tbody>
                    <tr>
                      <th style={{ background: '#e67e22', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #e67e22', whiteSpace: 'nowrap' }}>添付ファイル</th>
                      <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #e67e22' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ padding: '6px 16px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: isStepEnabled(3) ? 'pointer' : 'not-allowed', fontSize: '13px', whiteSpace: 'nowrap', opacity: isStepEnabled(3) ? 1 : 0.6 }}>
                            ファイルの選択
                            <input type="file" accept=".pdf,.jpg,.png" disabled={!isStepEnabled(3)} onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedDocFileName(file.name); }} style={{ display: 'none' }} />
                          </label>
                          <span style={{ color: selectedDocFileName ? COLORS.success : '#666', fontSize: '13px' }}>{selectedDocFileName || 'ファイルが選択されていません'}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th style={{ background: '#e67e22', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #e67e22', whiteSpace: 'nowrap', verticalAlign: 'top' }}>ドキュメント種別</th>
                      <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #e67e22' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="documentType" checked={formData.documentType === '修理報告書'} onChange={() => updateFormData({ documentType: '修理報告書' })} disabled={!isStepEnabled(3)} /> 修理報告書</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="documentType" checked={formData.documentType === '納品書'} onChange={() => updateFormData({ documentType: '納品書' })} disabled={!isStepEnabled(3)} /> 納品書</label>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th style={{ background: '#e67e22', color: 'white', padding: '10px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', width: '150px', border: '1px solid #e67e22', whiteSpace: 'nowrap', verticalAlign: 'top' }}>仮）勘定科目</th>
                      <td style={{ background: 'white', padding: '10px 12px', border: '1px solid #e67e22' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" name="accountType" checked={formData.accountType === '修繕費'} onChange={() => updateFormData({ accountType: '修繕費' })} disabled={!isStepEnabled(3)} /> 修繕費</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="radio" name="accountType" checked={formData.accountType === 'その他'} onChange={() => updateFormData({ accountType: 'その他' })} disabled={!isStepEnabled(3)} />
                            その他
                            {formData.accountType === 'その他' && (
                              <input type="text" value={formData.accountOther} onChange={(e) => updateFormData({ accountOther: e.target.value })} placeholder="科目名を入力" disabled={!isStepEnabled(3)} style={{ marginLeft: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '120px' }} />
                            )}
                          </label>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="repair-btn" onClick={handleAddDocument} disabled={!isStepEnabled(3) || isSubmitting || !selectedDocFileName} style={{ padding: '8px 20px', background: selectedDocFileName ? '#e67e22' : COLORS.disabled, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: selectedDocFileName ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 'bold' }}>
                    + ドキュメントを登録
                  </button>
                </div>
              </div>

              {/* 検収金額 */}
              <FormRow>
                <span style={{ ...labelStyle, fontWeight: 'bold' }}>検収金額</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>¥</span>
                  <input type="number" value={formData.quotationAmount || ''} onChange={(e) => updateFormData({ quotationAmount: parseFloat(e.target.value) || 0 })} placeholder="0" disabled={!isStepEnabled(3)} style={{ ...inputStyle, width: '150px', fontVariantNumeric: 'tabular-nums' }} />
                  <span style={{ fontSize: '12px', color: COLORS.textMuted }}>（税別）</span>
                </div>
              </FormRow>

              {/* アクションボタン */}
              <FormRow style={{ justifyContent: 'flex-end', gap: '12px' }}>
                <button className="repair-btn" onClick={handleStep3InspectionComplete} disabled={!isStepEnabled(3) || isSubmitting} style={{ padding: '10px 24px', background: '#e67e22', color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  {isSubmitting ? '登録中...' : '検収登録 → STEP4へ'}
                </button>
              </FormRow>
            </>
          )}
        </Section>

        {/* STEP④: 完了（資産登録） */}
        <Section
          step={4}
          title="STEP4. 完了（資産登録）"
          accentColor="#e74c3c"
          enabled={isStepEnabled(4)}
          completed={4 < activeStep}
          headerAction={
            <button className="repair-btn" onClick={() => setPreviewTab('完了報告書他')} disabled={!isStepEnabled(4)} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              一覧表示
            </button>
          }
        >
          <div style={{ padding: '12px 16px', background: '#ffebee', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#c62828' }}>
            経理部にて固定資産番号、最終の勘定科目を登録してください。
          </div>

          <FormRow>
            <span style={{ ...labelStyle, fontWeight: 'bold' }}>固定資産番号</span>
            <input type="text" value={fixedAssetNo} onChange={(e) => setFixedAssetNo(e.target.value)} placeholder="固定資産番号を入力" disabled={!isStepEnabled(4)} style={{ ...inputStyle, width: '200px' }} />
          </FormRow>

          <FormRow>
            <span style={{ ...labelStyle, fontWeight: 'bold' }}>最終勘定科目</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="finalAccountType" checked={finalAccountType === '修繕費'} onChange={() => setFinalAccountType('修繕費')} disabled={!isStepEnabled(4)} />
                修繕費
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="finalAccountType" checked={finalAccountType === 'その他'} onChange={() => setFinalAccountType('その他')} disabled={!isStepEnabled(4)} />
                その他
                {finalAccountType === 'その他' && (
                  <input type="text" value={finalAccountOther} onChange={(e) => setFinalAccountOther(e.target.value)} placeholder="科目名を入力" disabled={!isStepEnabled(4)} style={{ marginLeft: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '150px' }} />
                )}
              </label>
            </div>
          </FormRow>

          <FormRow style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button className="repair-btn" onClick={handleStep4Complete} disabled={!isStepEnabled(4) || isSubmitting} style={{ padding: '10px 24px', background: '#e74c3c', color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              {isSubmitting ? '登録中...' : '資産登録を完了'}
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
            background: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: '#bdbdbd',
            borderRadius: '2px',
          }} />
        </div>

        {/* 右側: プレビューエリア（縦型タブ付き） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'white',
          margin: '16px 16px 16px 0',
        }}>
          {/* メインプレビューエリア */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* プレビューヘッダー */}
            <div style={{
              padding: '12px 16px',
              background: previewTab === '見積書' ? COLORS.success :
                         previewTab === '修理発注書' ? '#e67e22' :
                         previewTab === '完了報告書他' ? COLORS.error : COLORS.primary,
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>
                {previewTab === '申請申請書' && '修理申請書プレビュー'}
                {previewTab === '修理依頼書' && (previewVendorIndex !== null
                  ? `修理依頼書 - ${formData?.vendors[previewVendorIndex]?.name || `依頼先${previewVendorIndex + 1}`}`
                  : '修理依頼書（業者を選択）')}
                {previewTab === '見積書' && (previewQuotationIndex !== null
                  ? `見積書 - ${registeredQuotations[previewQuotationIndex]?.fileName || ''}`
                  : '見積書')}
                {previewTab === '修理発注書' && '修理発注書'}
                {previewTab === '完了報告書他' && (previewDocumentIndex !== null
                  ? `完了報告書 - ${registeredDocuments[previewDocumentIndex]?.fileName || ''}`
                  : '完了報告書他')}
              </span>
              <button
                className="repair-btn"
                style={{
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
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
            background: '#f5f5f5',
            padding: '24px',
          }}>
            {/* 申請申請書プレビュー */}
            {previewTab === '申請申請書' && (
              /* 修理申請書プレビュー（ユーザーからの申請） */
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '32px',
                maxWidth: '600px',
                margin: '0 auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {/* タイトル */}
                <h2 style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}>
                  修理申請書
                </h2>
                <div style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '24px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #333',
                }}>
                  申請No: {request.requestNo}
                </div>

                {/* 申請日・申請者情報 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: '#3498db',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '4px 4px 0 0',
                  }}>
                    申請者情報
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <th style={{ padding: '10px', background: '#e3f2fd', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>申請日</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.requestDate}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#e3f2fd', border: '1px solid #ccc', textAlign: 'left' }}>申請部署</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.applicantDepartment}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#e3f2fd', border: '1px solid #ccc', textAlign: 'left' }}>申請者</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.applicantName}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#e3f2fd', border: '1px solid #ccc', textAlign: 'left' }}>連絡先</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.applicantContact}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 修理対象機器 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: COLORS.primary,
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '4px 4px 0 0',
                  }}>
                    修理対象機器
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>品名</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{request.itemName}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>メーカー</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.maker}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>型式</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.model}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>シリアルNo.</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontFamily: 'monospace' }}>{request.serialNo}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>管理番号</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontFamily: 'monospace' }}>{request.qrLabel}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>設置部署</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{request.applicantDepartment}</td>
                      </tr>
                      <tr>
                        <th style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #ccc', textAlign: 'left' }}>室名</th>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>○○室</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 写真スペース */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: '#616161',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '4px 4px 0 0',
                  }}>
                    撮影写真
                  </div>
                  <div style={{
                    padding: '24px',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                    color: '#999',
                    fontSize: '13px',
                  }}>
                    （撮影された写真のスペース）
                  </div>
                </div>

                {/* 故障・不具合の内容 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: '#e65100',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '4px 4px 0 0',
                  }}>
                    故障・不具合の内容
                  </div>
                  <div style={{
                    padding: '16px',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    minHeight: '80px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}>
                    {request.symptoms}
                  </div>
                </div>

                {/* 参考情報 */}
                <div style={{
                  padding: '12px 16px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#666',
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>導入業者：</span>
                    {request.installerName}
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>保守契約：</span>
                    <span style={{ color: request.hasMaintenanceContract ? COLORS.success : COLORS.error }}>
                      {request.hasMaintenanceContract ? '対象' : '対象外'}
                    </span>
                    {request.warrantyEndDate && ` （期限: ${request.warrantyEndDate}）`}
                  </div>
                </div>
              </div>
            )}

            {/* 修理依頼書プレビュー（業者選択済み） */}
            {previewTab === '修理依頼書' && previewVendorIndex !== null && formData && (() => {
              const vendor = formData.vendors[previewVendorIndex];
              const today = new Date();
              const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
              return (
                <div style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '40px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
                }}>
                  {/* 日付（右寄せ） */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    marginBottom: '24px',
                  }}>
                    {dateStr}
                  </div>

                  {/* 宛先 + 差出人（横並び） */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '32px',
                  }}>
                    {/* 宛先（左） */}
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {vendor?.name || '○○○○'}　御中
                      </div>
                      {vendor?.person && (
                        <div style={{ fontSize: '14px', marginTop: '4px', paddingLeft: '16px' }}>
                          {vendor.person}　様
                        </div>
                      )}
                    </div>
                    {/* 差出人・受付者連絡先（右） */}
                    <div style={{
                      textAlign: 'right',
                      fontSize: '13px',
                      lineHeight: '1.8',
                    }}>
                      <div style={{ fontWeight: 'bold' }}>医療法人○○会　○○病院</div>
                      <div>{formData.receptionDepartment || request.applicantDepartment}</div>
                      <div>担当：{formData.receptionPerson || request.applicantName}</div>
                      <div>TEL：{formData.receptionContact || request.applicantContact}</div>
                    </div>
                  </div>

                  {/* タイトル */}
                  <h2 style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #333',
                  }}>
                    修理依頼書
                  </h2>

                  {/* 本文 */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '2',
                    marginBottom: '24px',
                  }}>
                    <p style={{ margin: '0 0 16px 0' }}>
                      拝啓　時下ますますご清栄のこととお慶び申し上げます。
                    </p>
                    <p style={{ margin: '0 0 16px 0' }}>
                      さて、下記機器につきまして故障が発生いたしましたので、修理見積のご提出をお願い申し上げます。
                    </p>
                  </div>

                  {/* 記 */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}>
                    記
                  </div>

                  {/* 申請No, */}
                  <div style={{
                    fontSize: '13px',
                    marginBottom: '16px',
                    color: '#333',
                  }}>
                    申請No,　{request.requestNo}
                  </div>

                  {/* 対象機器 + 写真スペース（横並び） */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【対象機器】
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {/* 機器情報テーブル（左） */}
                      <table style={{ borderCollapse: 'collapse', fontSize: '13px', flex: '1 1 auto' }}>
                        <tbody>
                          <tr>
                            <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', width: '100px', textAlign: 'left', whiteSpace: 'nowrap' }}>品名</th>
                            <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontWeight: 'bold' }}>{request.itemName}</td>
                          </tr>
                          <tr>
                            <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left', whiteSpace: 'nowrap' }}>メーカー</th>
                            <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.maker}</td>
                          </tr>
                          <tr>
                            <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
                            <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.model}</td>
                          </tr>
                          <tr>
                            <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left', whiteSpace: 'nowrap' }}>シリアルNo.</th>
                            <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontFamily: 'monospace' }}>{request.serialNo}</td>
                          </tr>
                        </tbody>
                      </table>
                      {/* 写真スペース（右） */}
                      <div style={{
                        width: '160px',
                        minHeight: '140px',
                        border: '2px dashed #ccc',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fafafa',
                        flexShrink: 0,
                      }}>
                        <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
                          <div>撮影された</div>
                          <div>写真のスペース</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 設置部署・室名 */}
                  <div style={{
                    fontSize: '13px',
                    marginBottom: '20px',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}>
                    <span>設置部署　{request.applicantDepartment}　　室名　{formData.receptionDepartment || '―'}</span>
                  </div>

                  {/* 故障状況 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【故障状況】
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      border: '1px solid #ccc',
                      background: '#fafafa',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      minHeight: '60px',
                    }}>
                      {request.symptoms}
                    </div>
                  </div>

                  {/* ご依頼事項 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【ご依頼事項】
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      border: '1px solid #ccc',
                      background: '#fafafa',
                      fontSize: '13px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {formData.requestComment || '上記機器の修理をお願いいたします。\n修理着手前に見積書をご提出ください。\n修理期間の目安をご連絡ください。'}
                    </div>
                  </div>

                  {/* 見積提出期限 */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#fff3e0',
                    border: '1px solid #ffb74d',
                    borderRadius: '4px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ fontSize: '13px' }}>
                      <strong>見積提出期限：</strong>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#e65100',
                        marginLeft: '8px',
                      }}>
                        {vendor?.deadline ? new Date(vendor.deadline).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '（別途ご相談）'}
                      </span>
                    </div>
                  </div>

                  {/* 結び */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '2',
                    marginBottom: '16px',
                  }}>
                    <p style={{ margin: '0 0 16px 0' }}>
                      ご多忙のところ恐れ入りますが、何卒よろしくお願い申し上げます。
                    </p>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      敬具
                    </p>
                  </div>

                  {/* 以上 */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    marginTop: '24px',
                  }}>
                    以上
                  </div>
                </div>
              );
            })()}

            {/* 修理発注書プレビュー */}
            {previewTab === '修理発注書' && formData && (() => {
              const vendor = formData.vendors[0]; // STEP2で登録した発注用見積の業者
              const today = new Date();
              const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
              // 発注用見積から金額を取得（仮データ）
              const orderQuotation = registeredQuotations.find(q => q.phase === '発注用');
              return (
                <div style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '40px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
                }}>
                  {/* 日付（右寄せ） */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    marginBottom: '24px',
                  }}>
                    {dateStr}
                  </div>

                  {/* 宛先 */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {vendor?.name || '○○○○'}　御中
                    </div>
                    {vendor?.person && (
                      <div style={{ fontSize: '14px', marginTop: '4px', paddingLeft: '16px' }}>
                        {vendor.person}　様
                      </div>
                    )}
                  </div>

                  {/* 差出人（右寄せ） */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    marginBottom: '32px',
                    lineHeight: '1.8',
                  }}>
                    <div style={{ fontWeight: 'bold' }}>医療法人○○会　○○病院</div>
                    <div>{formData.receptionDepartment || request.applicantDepartment}</div>
                    <div>担当：{formData.receptionPerson || request.applicantName}</div>
                    <div>TEL：{formData.receptionContact || request.applicantContact}</div>
                  </div>

                  {/* タイトル */}
                  <h2 style={{
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    paddingBottom: '8px',
                    borderBottom: '3px double #333',
                  }}>
                    修理発注書
                  </h2>

                  {/* 発注No. */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '20px',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                  }}>
                    <div>
                      <strong>発注No.：</strong>
                      <span style={{ fontFamily: 'monospace' }}>REP-{request.id}-{today.getFullYear()}{String(today.getMonth() + 1).padStart(2, '0')}{String(today.getDate()).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* 本文 */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '2',
                    marginBottom: '24px',
                  }}>
                    <p style={{ margin: '0 0 16px 0' }}>
                      拝啓　時下ますますご清栄のこととお慶び申し上げます。
                    </p>
                    <p style={{ margin: '0 0 16px 0' }}>
                      さて、貴社よりご提示いただきました見積書に基づき、下記のとおり修理を発注いたします。
                    </p>
                  </div>

                  {/* 記 */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                  }}>
                    記
                  </div>

                  {/* 修理対象機器 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【修理対象機器】
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>品名</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontWeight: 'bold' }}>{request.itemName}</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>メーカー</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.maker}</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>型式</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.model}</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>シリアルNo.</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontFamily: 'monospace' }}>{request.serialNo}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 発注内容 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【発注内容】
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>申請No.</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.requestNo}</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#e3f2fd', border: '1px solid #ccc', textAlign: 'left', fontWeight: 'bold' }}>発注金額</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontWeight: 'bold', fontSize: '15px', color: '#1565c0' }}>
                            ¥ ○○○,○○○-（税別）
                          </td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>納品場所</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>○○病院 {request.applicantDepartment}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 備考 */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#fff8e1',
                    border: '1px solid #ffcc80',
                    borderRadius: '4px',
                    marginBottom: '24px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                  }}>
                    <strong>【備考】</strong>
                    <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                      <li>修理完了後は納品書・請求書をご送付ください。</li>
                      <li>修理内容に変更が生じる場合は、事前にご連絡ください。</li>
                    </ul>
                  </div>

                  {/* 結び */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '2',
                    marginBottom: '16px',
                  }}>
                    <p style={{ margin: '0 0 16px 0' }}>
                      以上、よろしくお取り計らいのほどお願い申し上げます。
                    </p>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      敬具
                    </p>
                  </div>

                  {/* 以上 */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    marginTop: '24px',
                  }}>
                    以上
                  </div>
                </div>
              );
            })()}

            {/* 修理依頼書：業者未選択時 */}
            {previewTab === '修理依頼書' && previewVendorIndex === null && formData && (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '24px',
                maxWidth: '500px',
                margin: '0 auto',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#9c27b0',
                }}>
                  見積依頼書を表示する業者を選択
                </h3>
                {formData.vendors.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.vendors.map((vendor, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewVendorIndex(idx)}
                        style={{
                          padding: '12px 16px',
                          background: '#f3e5f5',
                          border: '1px solid #9c27b0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#9c27b0' }}>{vendor.name || `依頼先${idx + 1}`}</div>
                        {vendor.person && <div style={{ fontSize: '12px', color: '#666' }}>{vendor.person}</div>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    STEP2で依頼先を追加してください
                  </p>
                )}
              </div>
            )}

            {/* 見積書：登録済み見積一覧（初期表示 or 一覧戻り） */}
            {previewTab === '見積書' && (previewQuotationIndex === null || previewQuotationIndex === -1) && (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: COLORS.success,
                }}>
                  登録済み見積一覧
                </h3>
                {registeredQuotations.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: COLORS.success, color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>フェーズ</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '100px' }}>登録日時</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q, idx) => (
                        <tr key={q.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{q.fileName}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              background: q.phase === '発注用' ? '#e3f2fd' : q.phase === '参考' ? '#fff8e1' : '#f3e5f5',
                              color: q.phase === '発注用' ? '#1565c0' : q.phase === '参考' ? '#f57c00' : '#7b1fa2',
                            }}>
                              {q.phase}
                            </span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center', fontSize: '11px' }}>
                            {new Date(q.registeredAt).toLocaleString('ja-JP')}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewQuotationIndex(idx)}
                              style={{
                                padding: '4px 10px',
                                background: COLORS.success,
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                            >
                              表示
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
                    <div>登録済みの見積はありません</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>STEP3で見積を登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* 見積書：見積プレビュー（選択時） */}
            {previewTab === '見積書' && previewQuotationIndex !== null && previewQuotationIndex >= 0 && registeredQuotations[previewQuotationIndex] && (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    onClick={() => setPreviewQuotationIndex(null)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ← 一覧に戻る
                  </button>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {registeredQuotations[previewQuotationIndex].fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    フェーズ: {registeredQuotations[previewQuotationIndex].phase}<br />
                    保存形式: {registeredQuotations[previewQuotationIndex].saveFormat}<br />
                    登録日時: {new Date(registeredQuotations[previewQuotationIndex].registeredAt).toLocaleString('ja-JP')}
                  </div>
                </div>
              </div>
            )}

            {/* 完了報告書他：登録済みドキュメント一覧 */}
            {previewTab === '完了報告書他' && previewDocumentIndex === null && (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: COLORS.error,
                }}>
                  登録済みドキュメント一覧
                </h3>
                {registeredDocuments.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: COLORS.error, color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '90px' }}>種別</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>仮）勘定科目</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.map((d, idx) => (
                        <tr key={d.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{d.fileName}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              background: d.documentType === '修理報告書' ? '#e3f2fd' : d.documentType === '納品書' ? '#e8f5e9' : '#f5f5f5',
                              color: d.documentType === '修理報告書' ? '#1565c0' : d.documentType === '納品書' ? '#2e7d32' : '#616161',
                            }}>
                              {d.documentType}
                            </span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center', fontSize: '11px' }}>
                            {d.accountType}{d.accountOther ? `(${d.accountOther})` : ''}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewDocumentIndex(idx)}
                              style={{
                                padding: '4px 10px',
                                background: COLORS.error,
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                            >
                              表示
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
                    <div>登録済みのドキュメントはありません</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>STEP5でドキュメントを登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* 完了報告書他：ドキュメントプレビュー（選択時） */}
            {previewTab === '完了報告書他' && previewDocumentIndex !== null && registeredDocuments[previewDocumentIndex] && (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    onClick={() => setPreviewDocumentIndex(null)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ← 一覧に戻る
                  </button>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {registeredDocuments[previewDocumentIndex].fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    種別: {registeredDocuments[previewDocumentIndex].documentType}<br />
                    勘定科目: {registeredDocuments[previewDocumentIndex].accountType}
                    {registeredDocuments[previewDocumentIndex].accountOther ? ` (${registeredDocuments[previewDocumentIndex].accountOther})` : ''}<br />
                    登録日時: {new Date(registeredDocuments[previewDocumentIndex].registeredAt).toLocaleString('ja-JP')}
                  </div>
                </div>
              </div>
            )}

            {/* 完了報告書他：資産登録情報プレビュー（ドキュメント未選択時に表示） */}
            {previewTab === '完了報告書他' && previewDocumentIndex === null && (
              <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '32px', maxWidth: '600px', margin: '16px auto 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>資産登録情報</h2>
                  <span style={{ fontSize: '13px', color: COLORS.success }}>申請No: {request.requestNo}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    {[
                      ['品名', request.itemName],
                      ['メーカー', request.maker],
                      ['型式', request.model],
                      ['シリアルNo.', request.serialNo],
                      ['固定資産番号', fixedAssetNo || '（未登録）'],
                      ['最終勘定科目', finalAccountType === 'その他' ? finalAccountOther || 'その他' : finalAccountType],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f5f5f5', border: '1px solid #ddd', width: '140px', fontWeight: 'bold' }}>{label}</th>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>

          {/* 縦型タブバー（右端・文書名ベース） */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f0f0f0',
            borderLeft: '1px solid #ddd',
            width: '32px',
            flexShrink: 0,
          }}>
            {([
              { key: '申請申請書' as PreviewDocTab, label: '申請申請書' },
              { key: '修理依頼書' as PreviewDocTab, label: '修理依頼書' },
              { key: '見積書' as PreviewDocTab, label: '見積書' },
              { key: '修理発注書' as PreviewDocTab, label: '修理発注書' },
              { key: '完了報告書他' as PreviewDocTab, label: '完了報告書他' },
            ]).map((tab) => {
              const isActive = previewTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setPreviewTab(tab.key);
                    if (tab.key === '修理依頼書') setPreviewVendorIndex(null);
                    if (tab.key === '見積書') setPreviewQuotationIndex(null);
                    if (tab.key === '完了報告書他') setPreviewDocumentIndex(null);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderBottom: '1px solid #ddd',
                    background: isActive ? '#f5c518' : 'transparent',
                    color: isActive ? '#333' : '#666',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    padding: '6px 0',
                    letterSpacing: '1px',
                  }}
                  title={tab.label}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RepairTaskPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f9fafb' }}>
        <Header title="修理申請管理" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280' }}>読み込み中...</p>
        </div>
      </div>
    }>
      <RepairTaskContent />
    </Suspense>
  );
}
