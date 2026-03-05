'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';

/** カラートークン */
const COLORS = {
  primary: '#4a6fa5',
  primaryDark: '#3d5a80',
  accent: '#e67e22',
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

/** 廃棄フローのステップ定義 */
const DISPOSAL_STEPS = [
  { step: 1, label: '見積依頼' },
  { step: 2, label: '見積登録' },
  { step: 3, label: '発注登録' },
  { step: 5, label: '検収登録' },
];

// ステータス型（8ステータス）
type DisposalStatus = '新規申請' | '見積依頼済' | '発注用見積登録済' | '発注済' | '納期確定' | '検収済' | '完了' | '申請見送り';

// 登録済み見積の型
interface RegisteredQuotation {
  id: number;
  phase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  vendorName: string;
  amount: number;
  registeredAt: string;
}

// 登録済みドキュメントの型（STEP⑤用）
interface RegisteredDocument {
  id: number;
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

// 廃棄申請データ型
interface DisposalApplication {
  id: string;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
  applicantContact: string;
  // 設置情報
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  // 廃棄対象機器
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  qrLabel: string;
  // 廃棄理由
  disposalReason: string;
  comment: string;
  // ステータス
  status: DisposalStatus;
  // 受付部署情報
  receptionDepartment: string;
  receptionPerson: string;
  receptionContact: string;
  // 見積依頼先（複数、最大3社）
  vendors: {
    name: string;
    person: string;
    email: string;
    contact: string;
    deadline: string;
  }[];
  // ご依頼事項
  requestComment: string;
  // 見積情報
  quotationPhase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  // 納期確認
  deliveryDate: string;
  // 検収ドキュメント
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther: string;
}

// モックデータ取得
const getMockApplication = (id: string): DisposalApplication => {
  const statusMap: Record<string, DisposalStatus> = {
    '1': '発注済',
    '2': '見積依頼済',
    '3': '新規申請',
    '4': '発注用見積登録済',
    '5': '検収済',
  };

  return {
    id,
    applicationNo: `DSP-2026-${id.padStart(3, '0')}`,
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
    status: statusMap[id] || '新規申請',
    receptionDepartment: 'ME室',
    receptionPerson: '佐藤 花子',
    receptionContact: '内線2346',
    vendors: [
      { name: '環境サービス株式会社', person: '鈴木一郎', email: 'suzuki@kankyou.co.jp', contact: '03-1111-2222', deadline: '' },
      { name: '', person: '', email: '', contact: '', deadline: '' },
      { name: '', person: '', email: '', contact: '', deadline: '' },
    ],
    requestComment: '',
    quotationPhase: '発注用',
    saveFormat: '電子取引',
    deliveryDate: '',
    documentType: '完了報告書',
    accountType: '廃棄費',
    accountOther: '',
  };
};

// ステータスから初期ステップを取得
const getInitialStep = (status: DisposalStatus): number => {
  switch (status) {
    case '新規申請': return 1;
    case '見積依頼済': return 1;
    case '発注用見積登録済': return 2;
    case '発注済': return 3;
    case '納期確定': return 3;
    case '検収済': return 5;
    case '完了': return 5;
    case '申請見送り': return 1;
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

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: COLORS.textPrimary,
  whiteSpace: 'nowrap',
};

// セクションコンポーネント
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
        {enabled && !headerAction && !completed && (
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

// フォーム行コンポーネント
const FormRow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', ...style }}>
    {children}
  </div>
);

// プレビュータブ型
type PreviewDocTab = '見積依頼書' | '見積書' | '発注書' | '完了報告書他';

function DisposalTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') || '3';

  const [application, setApplication] = useState<DisposalApplication | null>(null);
  const [formData, setFormData] = useState<DisposalApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // STEP②用：見積関連
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [quotationVendorName, setQuotationVendorName] = useState<string>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  // STEP⑤用：ドキュメント関連
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedDocFileName, setSelectedDocFileName] = useState<string>('');
  // プレビュータブ
  const [previewTab, setPreviewTab] = useState<PreviewDocTab>('見積依頼書');
  // 見積依頼書プレビュー対象の業者インデックス
  const [previewVendorIndex, setPreviewVendorIndex] = useState<number | null>(null);
  const [previewQuotationIndex, setPreviewQuotationIndex] = useState<number | null>(null);
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number | null>(null);

  // パネル幅の状態
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // ドラッグハンドラ
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
    const data = getMockApplication(applicationId);
    setApplication(data);
    setFormData({ ...data });
    setCurrentStep(getInitialStep(data.status));
  }, [applicationId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="廃棄契約管理"
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

  const updateVendor = (index: number, field: string, value: string) => {
    if (!formData) return;
    const newVendors = [...formData.vendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    updateFormData({ vendors: newVendors });
  };

  // STEP①: 見積依頼送信
  const handleStep1VendorSubmit = (index: number) => {
    const vendor = formData.vendors[index];
    if (!vendor.name || !vendor.email) {
      alert('業者名とメールアドレスを入力してください');
      return;
    }
    alert(`${vendor.name}へ見積依頼を送信しました。`);
  };

  // STEP①完了 → STEP②へ
  const handleStep1Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積依頼を完了しました。STEP②へ進みます。');
      setApplication(prev => prev ? { ...prev, status: '見積依頼済' } : prev);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP①: 申請見送り
  const handleCancelApplication = () => {
    if (confirm('この廃棄申請を見送りますか？廃棄品の更新が必要な場合は原本リストより更新申請を行って下さい。')) {
      setApplication(prev => prev ? { ...prev, status: '申請見送り' } : prev);
      alert('申請を見送りました。一覧画面に戻ります。');
      router.push('/quotation-data-box/transfer-management');
    }
  };

  // STEP②: 見積登録
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
    setSelectedFileName('');
    setQuotationVendorName('');
    setQuotationAmount('');
    alert('見積を登録しました');
  };

  // STEP②完了 → STEP③へ
  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注用見積登録済' } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP③: 発注登録完了 → STEP⑤へ
  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注済' } : prev);
      setCurrentStep(5);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP③: 納期確定
  const handleDeliveryDateConfirm = () => {
    if (!formData.deliveryDate) {
      alert('納期を入力してください');
      return;
    }
    setApplication(prev => prev ? { ...prev, status: '納期確定' } : prev);
    alert('納期を確定しました。');
  };

  // STEP⑤: ドキュメント追加
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

  // STEP⑤: 検収完了（タスク完了）
  const handleStep5Complete = () => {
    if (confirm('検収を完了し、このタスクを完了しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`廃棄タスク（${application.applicationNo}）が完了しました。\n一覧画面に戻ります。`);
        router.push('/quotation-data-box/transfer-management');
      }, 300);
    }
  };

  // 見積依頼済みの業者名リスト（STEP②の業者選択用）
  const vendorOptions = formData.vendors
    .filter(v => v.name)
    .map(v => v.name);

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
      {DISPOSAL_STEPS.map((item, index) => (
        <React.Fragment key={item.step}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '80px',
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
              fontSize: '11px',
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
              minWidth: '30px',
              maxWidth: '60px',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      <style>{`
        .task-btn { transition: filter 150ms ease-out; }
        .task-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .task-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
        .task-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <Header
        title="廃棄契約管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/transfer-management"
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
        <span><strong>申請No:</strong> {application.applicationNo}</span>
        <span><strong>品目:</strong> {application.itemName}</span>
        <span><strong>メーカー:</strong> {application.maker}</span>
        <span><strong>型式:</strong> {application.model}</span>
        <span><strong>QRラベル:</strong> {application.qrLabel}</span>
      </div>

      {/* メインコンテンツ（左右分割） */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* 左側: タスク入力エリア */}
        <div style={{
          width: `${leftPanelWidth}%`,
          minWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}>

          {/* ===== STEP① 見積依頼 ===== */}
          <Section
            step={1}
            title="STEP①．見積依頼"
            accentColor="#3498db"
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            {/* ガイドメッセージ */}
            <div style={{
              padding: '12px 16px',
              background: '#e3f2fd',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1565c0',
            }}>
              業者を登録し見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
            </div>

            {/* 受付部署 */}
            <div style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: COLORS.surfaceAlt,
              borderRadius: '4px',
              border: `1px solid ${COLORS.borderLight}`,
            }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                受付部署
              </div>
              <FormRow>
                <label style={labelStyle}>部署名</label>
                <input
                  type="text"
                  value={formData.receptionDepartment}
                  onChange={(e) => updateFormData({ receptionDepartment: e.target.value })}
                  style={{ ...inputStyle, width: '160px' }}
                  disabled={1 < activeStep}
                />
                <label style={labelStyle}>担当者名</label>
                <input
                  type="text"
                  value={formData.receptionPerson}
                  onChange={(e) => updateFormData({ receptionPerson: e.target.value })}
                  style={{ ...inputStyle, width: '120px' }}
                  disabled={1 < activeStep}
                />
                <label style={labelStyle}>連絡先</label>
                <input
                  type="text"
                  value={formData.receptionContact}
                  onChange={(e) => updateFormData({ receptionContact: e.target.value })}
                  style={{ ...inputStyle, width: '140px' }}
                  disabled={1 < activeStep}
                />
              </FormRow>
            </div>

            {/* 依頼先テーブル（紫ヘッダー、最大3行） */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                依頼先
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#7b1fa2' }}>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'left', border: '1px solid #7b1fa2', width: '30px' }}>#</th>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'left', border: '1px solid #7b1fa2' }}>業者名</th>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'left', border: '1px solid #7b1fa2' }}>担当者</th>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'left', border: '1px solid #7b1fa2' }}>メール</th>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'left', border: '1px solid #7b1fa2' }}>連絡先</th>
                      <th style={{ padding: '8px', color: 'white', textAlign: 'center', border: '1px solid #7b1fa2', width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.vendors.map((vendor, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}`, textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}` }}>
                          <input
                            type="text"
                            value={vendor.name}
                            onChange={(e) => updateVendor(idx, 'name', e.target.value)}
                            placeholder="業者名"
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                            disabled={1 < activeStep}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}` }}>
                          <input
                            type="text"
                            value={vendor.person}
                            onChange={(e) => updateVendor(idx, 'person', e.target.value)}
                            placeholder="担当者名"
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                            disabled={1 < activeStep}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}` }}>
                          <input
                            type="email"
                            value={vendor.email}
                            onChange={(e) => updateVendor(idx, 'email', e.target.value)}
                            placeholder="メール"
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                            disabled={1 < activeStep}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}` }}>
                          <input
                            type="text"
                            value={vendor.contact}
                            onChange={(e) => updateVendor(idx, 'contact', e.target.value)}
                            placeholder="連絡先"
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                            disabled={1 < activeStep}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', border: `1px solid ${COLORS.borderLight}`, textAlign: 'center' }}>
                          {vendor.name && (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                className="task-btn"
                                onClick={() => {
                                  setPreviewVendorIndex(idx);
                                  setPreviewTab('見積依頼書');
                                }}
                                style={{
                                  padding: '4px 10px',
                                  background: '#4b5563',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                プレビュー
                              </button>
                              <button
                                className="task-btn"
                                onClick={() => handleStep1VendorSubmit(idx)}
                                disabled={1 < activeStep || isSubmitting}
                                style={{
                                  padding: '4px 10px',
                                  background: '#7b1fa2',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                依頼送信
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ご依頼事項（黄色背景） */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}>
                <span style={{
                  background: '#f5c518',
                  color: '#1f2937',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}>
                  ご依頼事項
                </span>
              </div>
              <textarea
                value={formData.requestComment}
                onChange={(e) => updateFormData({ requestComment: e.target.value })}
                placeholder="例：廃棄品の引取りをお願いします / 見積書を作成してください"
                style={{
                  ...inputStyle,
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '60px',
                  resize: 'vertical',
                }}
                disabled={1 < activeStep}
              />
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleCancelApplication}
                disabled={1 < activeStep || isSubmitting}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: COLORS.error,
                  border: `1px solid ${COLORS.error}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                申請を見送る
              </button>
              <button
                className="task-btn"
                onClick={handleStep1Complete}
                disabled={1 < activeStep || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                見積依頼完了 → STEP②へ
              </button>
            </div>
          </Section>

          {/* ===== STEP② 見積登録 ===== */}
          <Section
            step={2}
            title="STEP②．見積登録"
            accentColor="#2980b9"
            enabled={isStepEnabled(2)}
            completed={2 < activeStep}
          >
            {/* ガイドメッセージ */}
            <div style={{
              padding: '12px 16px',
              background: '#e3f2fd',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1565c0',
            }}>
              見積書をファイル選択して登録し、業者名と見積金額を入力してください。
            </div>

            {/* 見積を追加テーブル（青枠） */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                見積を追加
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #2980b9' }}>
                <tbody>
                  {/* 添付ファイル */}
                  <tr>
                    <th style={{
                      background: '#2980b9',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '120px',
                      border: '1px solid #2980b9',
                      whiteSpace: 'nowrap',
                    }}>
                      添付ファイル
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #2980b9',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          padding: '6px 16px',
                          background: '#f5f5f5',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: isStepEnabled(2) && activeStep <= 2 ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          opacity: isStepEnabled(2) && activeStep <= 2 ? 1 : 0.6,
                        }}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFileName(file.name);
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ color: selectedFileName ? COLORS.success : '#666', fontSize: '13px' }}>
                          {selectedFileName || 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* 業者名 */}
                  <tr>
                    <th style={{
                      background: '#2980b9',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '120px',
                      border: '1px solid #2980b9',
                      whiteSpace: 'nowrap',
                    }}>
                      業者名
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #2980b9',
                    }}>
                      <input
                        type="text"
                        value={formData.vendors[0]?.name || ''}
                        disabled
                        style={{
                          ...inputStyle,
                          width: '300px',
                          background: COLORS.disabledBg,
                          color: COLORS.textMuted,
                        }}
                      />
                      <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '8px' }}>
                        ※STEP①で登録した依頼先から自動取得
                      </span>
                    </td>
                  </tr>

                  {/* 見積フェーズ */}
                  <tr>
                    <th style={{
                      background: '#2980b9',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '120px',
                      border: '1px solid #2980b9',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                    }}>
                      見積フェーズ
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #2980b9',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={formData.quotationPhase === '発注用'}
                            onChange={() => updateFormData({ quotationPhase: '発注用' })}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          発注登録用見積
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={formData.quotationPhase === '参考'}
                            onChange={() => updateFormData({ quotationPhase: '参考' })}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          参考見積
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* 保存形式 */}
                  <tr>
                    <th style={{
                      background: '#2980b9',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '120px',
                      border: '1px solid #2980b9',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                    }}>
                      保存形式
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #2980b9',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(['電子取引', 'スキャナ保存', '未指定'] as const).map(fmt => (
                          <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="saveFormat"
                              checked={formData.saveFormat === fmt}
                              onChange={() => updateFormData({ saveFormat: fmt })}
                              disabled={!isStepEnabled(2) || 2 < activeStep}
                            />
                            {fmt}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 見積登録業者（黄色ラベル） */}
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: '#fffde7',
              borderRadius: '4px',
              border: '1px solid #f5c518',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}>
                <span style={{
                  background: '#f5c518',
                  color: '#1f2937',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}>
                  見積登録業者
                </span>
              </div>
              <FormRow>
                <label style={labelStyle}>業者名</label>
                <select
                  value={quotationVendorName}
                  onChange={(e) => setQuotationVendorName(e.target.value)}
                  style={{ ...inputStyle, width: '200px' }}
                  disabled={!isStepEnabled(2) || 2 < activeStep}
                >
                  <option value="">選択してください</option>
                  {vendorOptions.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
                <label style={labelStyle}>担当者</label>
                <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                  {formData.vendors.find(v => v.name === quotationVendorName)?.person || '-'}
                </span>
              </FormRow>
              <FormRow>
                <label style={labelStyle}>見積金額</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px' }}>¥</span>
                  <input
                    type="text"
                    value={quotationAmount}
                    onChange={(e) => setQuotationAmount(e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, width: '150px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    disabled={!isStepEnabled(2) || 2 < activeStep}
                  />
                  <span style={{ fontSize: '12px', color: COLORS.textMuted }}>（税別）</span>
                </div>
              </FormRow>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="task-btn"
                  onClick={handleAddQuotation}
                  disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || !quotationVendorName || 2 < activeStep}
                  style={{
                    padding: '8px 20px',
                    background: selectedFileName && quotationVendorName ? COLORS.success : COLORS.disabled,
                    color: COLORS.textOnColor,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFileName && quotationVendorName ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  見積を登録
                </button>
              </div>
            </div>

            {/* 登録済み見積一覧 */}
            {registeredQuotations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                  登録済み見積（{registeredQuotations.length}件）
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: COLORS.surfaceAlt }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>フェーズ</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>業者名</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.border}` }}>見積金額</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q) => (
                        <tr key={q.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: q.phase === '発注用' ? '#e3f2fd' : '#f3e5f5',
                              color: q.phase === '発注用' ? '#1565c0' : '#7b1fa2',
                            }}>
                              {q.phase === '発注用' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td style={{ padding: '8px' }}>{q.vendorName}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            ¥{q.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px' }}>📄</span>
                              <span>{q.fileName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (confirm('この見積を削除しますか？')) {
                                  setRegisteredQuotations(prev => prev.filter(rq => rq.id !== q.id));
                                }
                              }}
                              disabled={!isStepEnabled(2) || 2 < activeStep}
                              style={{
                                padding: '2px 8px',
                                background: 'transparent',
                                color: COLORS.error,
                                border: `1px solid ${COLORS.error}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
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

            {/* STEP③へ進むボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="task-btn"
                onClick={handleStep2Complete}
                disabled={!isStepEnabled(2) || 2 < activeStep || isSubmitting}
                style={{
                  padding: '10px 32px',
                  background: COLORS.accent,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                見積登録完了 → STEP③へ
              </button>
            </div>
          </Section>

          {/* ===== STEP③ 発注登録 ===== */}
          <Section
            step={3}
            title="STEP③．発注登録"
            accentColor="#4b5563"
            enabled={isStepEnabled(3)}
            completed={3 < activeStep}
          >
            {/* 発注書の発行 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                発注書の発行
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  className="task-btn"
                  onClick={() => setPreviewTab('発注書')}
                  disabled={!isStepEnabled(3) || 3 < activeStep}
                  style={{
                    padding: '8px 16px',
                    background: '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  発注書プレビュー
                </button>
                <button
                  className="task-btn"
                  onClick={() => alert('発注書を送信しました（モック）')}
                  disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: '#e67e22',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  発注送信
                </button>
              </div>
            </div>

            {/* 納期確認 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                納期確認
              </div>
                <FormRow>
                  <label style={labelStyle}>納期</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => updateFormData({ deliveryDate: e.target.value })}
                    style={{ ...inputStyle, width: '180px' }}
                    disabled={!isStepEnabled(3) || 3 < activeStep}
                  />
                  <button
                    className="task-btn"
                    onClick={handleDeliveryDateConfirm}
                    disabled={!isStepEnabled(3) || 3 < activeStep || !formData.deliveryDate || isSubmitting}
                    style={{
                      padding: '6px 16px',
                      background: formData.deliveryDate ? '#27ae60' : COLORS.disabled,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: formData.deliveryDate ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                    }}
                  >
                    納期確定
                  </button>
                </FormRow>
              </div>

            {/* STEP⑤へ進むボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleStep3Complete}
                disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                発注登録完了 → STEP⑤へ
              </button>
            </div>
          </Section>

          {/* ===== STEP⑤ 検収登録 ===== */}
          <Section
            step={5}
            title="STEP⑤．検収登録"
            accentColor="#dc2626"
            enabled={isStepEnabled(5)}
            completed={false}
          >
            {/* ガイドメッセージ */}
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#991b1b',
            }}>
              完了報告書・廃棄証明書等のドキュメントを登録し、検収を完了してください。
            </div>

            {/* ドキュメント追加テーブル（赤枠） */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                ドキュメント追加
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dc2626' }}>
                <tbody>
                  {/* 添付ファイル */}
                  <tr>
                    <th style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '140px',
                      border: '1px solid #dc2626',
                      whiteSpace: 'nowrap',
                    }}>
                      添付ファイル
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #dc2626',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          padding: '6px 16px',
                          background: '#f5f5f5',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: isStepEnabled(5) ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          opacity: isStepEnabled(5) ? 1 : 0.6,
                        }}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!isStepEnabled(5)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedDocFileName(file.name);
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ color: selectedDocFileName ? COLORS.success : '#666', fontSize: '13px' }}>
                          {selectedDocFileName || 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* ドキュメント種別 */}
                  <tr>
                    <th style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '140px',
                      border: '1px solid #dc2626',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                    }}>
                      ドキュメント種別
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #dc2626',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(['完了報告書', '廃棄証明書', 'マニフェスト', 'その他'] as const).map(dtype => (
                          <label key={dtype} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="documentType"
                              checked={formData.documentType === dtype}
                              onChange={() => updateFormData({ documentType: dtype })}
                              disabled={!isStepEnabled(5)}
                            />
                            {dtype}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* 勘定科目 */}
                  <tr>
                    <th style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      width: '140px',
                      border: '1px solid #dc2626',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                    }}>
                      仮）勘定科目
                    </th>
                    <td style={{
                      background: 'white',
                      padding: '10px 12px',
                      border: '1px solid #dc2626',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(['修繕費', '廃棄費', 'その他'] as const).map(atype => (
                          <label key={atype} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="accountType"
                              checked={formData.accountType === atype}
                              onChange={() => updateFormData({ accountType: atype })}
                              disabled={!isStepEnabled(5)}
                            />
                            {atype}
                          </label>
                        ))}
                        {formData.accountType === 'その他' && (
                          <input
                            type="text"
                            value={formData.accountOther}
                            onChange={(e) => updateFormData({ accountOther: e.target.value })}
                            placeholder="勘定科目名を入力"
                            style={{ ...inputStyle, width: '200px', marginLeft: '22px' }}
                            disabled={!isStepEnabled(5)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 登録ボタン */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  className="task-btn"
                  onClick={handleAddDocument}
                  disabled={!isStepEnabled(5) || !selectedDocFileName}
                  style={{
                    padding: '8px 20px',
                    background: selectedDocFileName ? '#dc2626' : COLORS.disabled,
                    color: COLORS.textOnColor,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedDocFileName ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  ドキュメント登録
                </button>
              </div>
            </div>

            {/* 登録済みドキュメント一覧 */}
            {registeredDocuments.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                  登録済みドキュメント（{registeredDocuments.length}件）
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: COLORS.surfaceAlt }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>種別</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>勘定科目</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: '#fef2f2',
                              color: '#dc2626',
                            }}>
                              {doc.documentType}
                            </span>
                          </td>
                          <td style={{ padding: '8px', fontSize: '12px' }}>
                            {doc.accountType === 'その他' ? doc.accountOther : doc.accountType}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px' }}>📄</span>
                              <span>{doc.fileName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (confirm('このドキュメントを削除しますか？')) {
                                  setRegisteredDocuments(prev => prev.filter(d => d.id !== doc.id));
                                }
                              }}
                              disabled={!isStepEnabled(5)}
                              style={{
                                padding: '2px 8px',
                                background: 'transparent',
                                color: COLORS.error,
                                border: `1px solid ${COLORS.error}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
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

            {/* 検収完了ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="task-btn"
                onClick={handleStep5Complete}
                disabled={!isStepEnabled(5) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
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
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: COLORS.borderLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '2px', height: '40px', background: COLORS.border, borderRadius: '1px' }} />
        </div>

        {/* 右側: ドキュメントプレビューエリア */}
        <div style={{
          flex: 1,
          minWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          background: COLORS.surfaceAlt,
        }}>
          {/* プレビューコンテンツ */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>

            {/* === 見積依頼書プレビュー === */}
            {previewTab === '見積依頼書' && (() => {
              const vIdx = previewVendorIndex ?? 0;
              const vendor = formData.vendors[vIdx];
              return (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: COLORS.textPrimary, textDecoration: 'underline' }}>
                  見積依頼書
                </h2>

                {/* 宛先 + 差出人 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>【宛先】</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary }}>
                      {vendor?.name || '（未設定）'}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                      {vendor?.person || ''} 様
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>【差出人】</div>
                    <div style={{ fontSize: '13px', color: COLORS.textPrimary }}>
                      {formData.receptionDepartment || '○○病院'}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                      {formData.receptionPerson} / {formData.receptionContact}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>記</div>

                {/* 申請No */}
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                  <strong>申請No.</strong> {application.applicationNo}
                </div>

                {/* 機器情報テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                  <tbody>
                    {[
                      ['QRラベル', application.qrLabel],
                      ['品目名', application.itemName],
                      ['メーカー', application.maker],
                      ['型式', application.model],
                      ['シリアルNo.', application.serialNo],
                      ['設置部署', `${application.installationDivision} ${application.installationDepartment}`],
                      ['室名', application.installationRoom],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <th style={{
                          padding: '6px 10px',
                          background: '#4b5563',
                          color: 'white',
                          textAlign: 'left',
                          width: '100px',
                          border: '1px solid #4b5563',
                          fontSize: '11px',
                        }}>
                          {label}
                        </th>
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid #ccc',
                          fontSize: '12px',
                        }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 廃棄理由 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>廃棄理由</div>
                  <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                    {application.disposalReason}
                  </div>
                </div>

                {/* ご依頼事項 */}
                {formData.requestComment && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>ご依頼事項</div>
                    <div style={{
                      fontSize: '12px',
                      color: COLORS.textSecondary,
                      padding: '8px',
                      background: '#fffde7',
                      borderRadius: '4px',
                      border: '1px solid #f5c518',
                    }}>
                      {formData.requestComment}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '24px' }}>
                  — 以上 —
                </div>
              </div>
              );
            })()}

            {/* === 見積書プレビュー === */}
            {previewTab === '見積書' && previewQuotationIndex === null && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#2980b9' }}>
                  登録済み見積書一覧
                </h4>
                {registeredQuotations.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#2980b9', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #2980b9' }}>業者名</th>
                        <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #2980b9' }}>見積金額</th>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #2980b9' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #2980b9', width: '80px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q, idx) => (
                        <tr key={q.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{q.vendorName}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            ¥{q.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{q.fileName}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewQuotationIndex(idx)}
                              style={{
                                padding: '4px 8px',
                                background: '#2980b9',
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
                  <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '32px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
                    <div>登録済みの見積書はありません</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP②で見積書を登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* 見積書個別プレビュー */}
            {previewTab === '見積書' && previewQuotationIndex !== null && (() => {
              const q = registeredQuotations[previewQuotationIndex];
              if (!q) return null;
              return (
                <div style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '8px',
                  padding: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <button
                    onClick={() => setPreviewQuotationIndex(null)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      alignSelf: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    ← 一覧に戻る
                  </button>
                  <div style={{
                    flex: 1,
                    background: '#525659',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{q.fileName}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>PDFプレビュー（モック）</div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {[
                          ['業者名', q.vendorName],
                          ['見積金額', `¥${q.amount.toLocaleString()}（税別）`],
                          ['フェーズ', q.phase === '発注用' ? '発注登録用' : '参考'],
                          ['保存形式', q.saveFormat],
                        ].map(([label, value]) => (
                          <tr key={label}>
                            <td style={{ padding: '8px', background: '#2980b9', color: 'white', fontWeight: 'bold', width: '120px' }}>{label}</td>
                            <td style={{ padding: '8px', border: '1px solid #ccc' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* === 発注書プレビュー === */}
            {previewTab === '発注書' && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: COLORS.textPrimary, textDecoration: 'underline' }}>
                  廃棄発注書
                </h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>【宛先】</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary }}>
                      {formData.vendors[0]?.name || '（未設定）'}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>【差出人】</div>
                    <div style={{ fontSize: '13px', color: COLORS.textPrimary }}>
                      {formData.receptionDepartment || '○○病院'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>記</div>

                {/* 発注内容テーブル */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: COLORS.textPrimary }}>【発注内容】</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      {[
                        ['発注No.', application.applicationNo],
                        ['発注金額', `¥${(registeredQuotations.find(q => q.phase === '発注用')?.amount || 0).toLocaleString()}（税別）`],
                        ['納品場所', `${application.installationDivision} ${application.installationDepartment} ${application.installationRoom}`],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <th style={{
                            padding: '6px 10px',
                            background: '#4b5563',
                            color: 'white',
                            textAlign: 'left',
                            width: '100px',
                            border: '1px solid #4b5563',
                            fontSize: '11px',
                          }}>
                            {label}
                          </th>
                          <td style={{
                            padding: '6px 10px',
                            border: '1px solid #ccc',
                            fontSize: '12px',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '24px' }}>
                  — 以上 —
                </div>
              </div>
            )}

            {/* === 完了報告書他プレビュー === */}
            {previewTab === '完了報告書他' && previewDocumentIndex === null && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#dc2626' }}>
                  登録済みドキュメント一覧
                </h4>
                {registeredDocuments.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#dc2626', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dc2626' }}>種別</th>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dc2626' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dc2626' }}>登録日</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dc2626', width: '80px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.map((doc, idx) => (
                        <tr key={doc.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{doc.documentType}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{doc.fileName}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            {new Date(doc.registeredAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewDocumentIndex(idx)}
                              style={{
                                padding: '4px 8px',
                                background: '#dc2626',
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
                  <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '32px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
                    <div>登録済みのドキュメントはありません</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP⑤でドキュメントを登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* 完了報告書他 個別プレビュー */}
            {previewTab === '完了報告書他' && previewDocumentIndex !== null && (() => {
              const doc = registeredDocuments[previewDocumentIndex];
              if (!doc) return null;
              return (
                <div style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '8px',
                  padding: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <button
                    onClick={() => setPreviewDocumentIndex(null)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      alignSelf: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    ← 一覧に戻る
                  </button>
                  <div style={{
                    flex: 1,
                    background: '#525659',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{doc.fileName}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>PDFプレビュー（モック）</div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {[
                          ['種別', doc.documentType],
                          ['勘定科目', doc.accountType === 'その他' ? doc.accountOther || 'その他' : doc.accountType],
                          ['登録日時', new Date(doc.registeredAt).toLocaleString('ja-JP')],
                        ].map(([label, value]) => (
                          <tr key={label}>
                            <td style={{ padding: '8px', background: '#dc2626', color: 'white', fontWeight: 'bold', width: '120px' }}>{label}</td>
                            <td style={{ padding: '8px', border: '1px solid #ccc' }}>{value}</td>
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

        {/* 縦型タブバー（右端・文書名ベース） */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#f0f0f0',
          borderLeft: '1px solid #ddd',
          width: '40px',
          flexShrink: 0,
        }}>
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
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderBottom: '1px solid #ddd',
                  background: isActive ? '#f5c518' : 'transparent',
                  color: isActive ? '#1f2937' : '#666',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  padding: '8px 0',
                  gap: '4px',
                }}
                title={tab}
              >
                <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DisposalTaskPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="廃棄契約管理"
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
    }>
      <DisposalTaskContent />
    </Suspense>
  );
}
