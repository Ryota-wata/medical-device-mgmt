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

/** 借用フローのステップ定義 */
const BORROWING_STEPS = [
  { step: 1, label: '承認', status: '承認済' },
  { step: 2, label: '契約登録', status: '契約締結' },
  { step: 3, label: '日程調整', status: '日程確定' },
  { step: 4, label: '納品確認', status: '貸出中' },
  { step: 5, label: '返却処理', status: '返却済' },
];

// 借用申請のステータス
type BorrowingStatus = '申請中' | '承認済' | '契約締結' | '日程確定' | '貸出中' | '返却済' | '却下';

// 登録済みドキュメントの型
interface RegisteredDocument {
  id: number;
  documentType: '契約書' | '納品書' | '返却確認書' | 'その他';
  fileName: string;
  registeredAt: string;
  step: number;
}

// 借用申請データ型
interface BorrowingApplication {
  id: string;
  // 貸出元情報
  companyName: string;
  contactPerson: string;
  contactInfo: string;
  email: string;
  // 申請情報
  applicationDate: string;
  managementDepartment: string;
  applicantName: string;
  // 設置情報
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  // 貸出目的
  purposes: string[];
  // 期間
  desiredDeliveryDate: string;
  returnDate: string;
  casesPerMonth: string;
  // 貸出機器
  itemName: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
  // 費用負担
  costBurdenInstallation: '貸出元' | '貸出先' | '';
  costBurdenRemoval: '貸出元' | '貸出先' | '';
  costBurdenMaintenance: '貸出元' | '貸出先' | '';
  costBurdenConsumables: '貸出元' | '貸出先' | '';
  costBurdenOther: '貸出元' | '貸出先' | '';
  // コメント
  comment: string;
  // ステータス
  status: BorrowingStatus;
  // 承認情報
  approvalComment: string;
  approvalDate: string;
  approverName: string;
  // 契約情報
  contractNo: string;
  contractDate: string;
  // 日程情報
  scheduledDeliveryDate: string;
  scheduledReturnDate: string;
  // 納品情報
  actualDeliveryDate: string;
  deliveryNote: string;
  // 返却情報
  actualReturnDate: string;
  returnNote: string;
}

// モックデータ取得
const getMockApplication = (id: string): BorrowingApplication => {
  const statusMap: Record<string, BorrowingStatus> = {
    'BR-2026-001': '契約締結',
    'BR-2026-002': '貸出中',
    'BR-2026-003': '申請中',
    'BR-2026-004': '返却済',
  };

  return {
    id: id,
    companyName: 'オリンパス株式会社',
    contactPerson: '山田太郎',
    contactInfo: '03-1234-5678',
    email: 'yamada@olympus.co.jp',
    applicationDate: '2026-02-01',
    managementDepartment: '手術部',
    applicantName: '手藤 次郎',
    installationDivision: '中央手術部門',
    installationDepartment: '手術部',
    installationRoom: '手術室B',
    purposes: ['臨床試用', 'デモ'],
    desiredDeliveryDate: '2026-03-01',
    returnDate: '2026-04-30',
    casesPerMonth: '10',
    itemName: '電気手術器',
    maker: 'オリンパス',
    model: 'ESG-400',
    quantity: 1,
    unit: '台',
    costBurdenInstallation: '貸出元',
    costBurdenRemoval: '貸出元',
    costBurdenMaintenance: '貸出先',
    costBurdenConsumables: '貸出先',
    costBurdenOther: '',
    comment: '新機種の評価目的',
    status: statusMap[id] || '申請中',
    approvalComment: statusMap[id] !== '申請中' ? '問題なし。承認します。' : '',
    approvalDate: statusMap[id] !== '申請中' ? '2026-02-03' : '',
    approverName: statusMap[id] !== '申請中' ? '管理者 太郎' : '',
    contractNo: ['契約締結', '日程確定', '貸出中', '返却済'].includes(statusMap[id] || '') ? 'CT-2026-001' : '',
    contractDate: ['契約締結', '日程確定', '貸出中', '返却済'].includes(statusMap[id] || '') ? '2026-02-10' : '',
    scheduledDeliveryDate: ['日程確定', '貸出中', '返却済'].includes(statusMap[id] || '') ? '2026-03-01' : '',
    scheduledReturnDate: ['日程確定', '貸出中', '返却済'].includes(statusMap[id] || '') ? '2026-04-30' : '',
    actualDeliveryDate: ['貸出中', '返却済'].includes(statusMap[id] || '') ? '2026-03-01' : '',
    deliveryNote: ['貸出中', '返却済'].includes(statusMap[id] || '') ? '予定通り納品完了' : '',
    actualReturnDate: statusMap[id] === '返却済' ? '2026-04-28' : '',
    returnNote: statusMap[id] === '返却済' ? '良好な状態で返却' : '',
  };
};

// ステータスからステップを取得
const getStepFromStatus = (status: BorrowingStatus): number => {
  switch (status) {
    case '申請中': return 1;
    case '承認済': return 2;
    case '契約締結': return 3;
    case '日程確定': return 4;
    case '貸出中': return 5;
    case '返却済': return 6; // 完了
    case '却下': return 0;
    default: return 1;
  }
};

// スタイル定義
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '13px',
  background: COLORS.white,
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: COLORS.disabledBg,
  color: COLORS.disabled,
  cursor: 'not-allowed',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: COLORS.textSecondary,
  minWidth: '100px',
};

// セクションコンポーネント
const Section: React.FC<{
  step: number;
  title: string;
  accentColor: string;
  enabled: boolean;
  completed: boolean;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}> = ({ step, title, accentColor, enabled, completed, children, headerAction }) => (
  <div style={{
    marginBottom: '16px',
    border: `1px solid ${enabled ? COLORS.border : COLORS.borderLight}`,
    borderRadius: '8px',
    overflow: 'hidden',
    opacity: enabled ? 1 : 0.6,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: completed ? COLORS.successLight : enabled ? accentColor : COLORS.disabledBg,
      color: completed ? COLORS.success : enabled ? COLORS.white : COLORS.textMuted,
      fontWeight: 'bold',
      fontSize: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {completed && <span>✓</span>}
        <span>{title}</span>
      </div>
      {headerAction}
    </div>
    <div style={{ padding: '16px', background: COLORS.white }}>
      {children}
    </div>
  </div>
);

// フォーム行コンポーネント
const FormRow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', ...style }}>
    {children}
  </div>
);

function BorrowingTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') || 'BR-2026-003';

  const [application, setApplication] = useState<BorrowingApplication | null>(null);
  const [formData, setFormData] = useState<BorrowingApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');

  // プレビュータブ用の状態（STEP2:契約書, STEP4:納品書, STEP5:返却確認書）
  const [previewTab, setPreviewTab] = useState<2 | 4 | 5>(2);
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
    setCurrentStep(getStepFromStatus(data.status));
  }, [applicationId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="借用契約タスク"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/borrowing-management"
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

  const updateFormData = (updates: Partial<BorrowingApplication>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  // STEP1: 承認処理
  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '承認済', approvalComment: formData.approvalComment, approvalDate: new Date().toISOString().split('T')[0], approverName: 'ログインユーザー' } : prev);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 300);
  };

  const handleReject = () => {
    if (confirm('この申請を却下しますか？')) {
      setApplication(prev => prev ? { ...prev, status: '却下' } : prev);
      alert('申請を却下しました。');
      router.push('/quotation-data-box/borrowing-management');
    }
  };

  // STEP2: 契約登録
  const handleContractRegister = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '契約締結', contractNo: formData.contractNo, contractDate: formData.contractDate } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP3: 日程確定
  const handleScheduleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '日程確定', scheduledDeliveryDate: formData.scheduledDeliveryDate, scheduledReturnDate: formData.scheduledReturnDate } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP4: 納品確認
  const handleDeliveryConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '貸出中', actualDeliveryDate: formData.actualDeliveryDate, deliveryNote: formData.deliveryNote } : prev);
      setCurrentStep(5);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP5: 返却処理（完了でタスククローズ、レコード削除）
  const handleReturnConfirm = () => {
    if (confirm('借用契約タスクを完了し、このレコードを削除しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`借用契約タスク（${application.id}）が完了しました。\nレコードを削除し、一覧画面に戻ります。`);
        router.push('/quotation-data-box/borrowing-management');
      }, 300);
    }
  };

  // ドキュメント追加
  const handleAddDocument = (documentType: RegisteredDocument['documentType'], step: number) => {
    if (!selectedFileName) {
      alert('ファイルを選択してください');
      return;
    }
    const newDoc: RegisteredDocument = {
      id: Date.now(),
      documentType,
      fileName: selectedFileName,
      registeredAt: new Date().toISOString(),
      step,
    };
    setRegisteredDocuments(prev => [...prev, newDoc]);
    setSelectedFileName('');
    alert('ドキュメントを登録しました');
  };

  const getInputProps = (step: number) => {
    const enabled = isStepEnabled(step);
    return {
      style: enabled ? inputStyle : disabledInputStyle,
      disabled: !enabled,
    };
  };

  // ステータスバッジ
  const getStatusColor = (status: BorrowingStatus) => {
    switch (status) {
      case '申請中': return { bg: '#fff3e0', color: '#e65100' };
      case '承認済': return { bg: '#e3f2fd', color: '#1565c0' };
      case '契約締結': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '日程確定': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case '貸出中': return { bg: '#e0f7fa', color: '#00838f' };
      case '返却済': return { bg: '#eceff1', color: '#546e7a' };
      case '却下': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  const statusColor = getStatusColor(application.status);

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
      {BORROWING_STEPS.map((item, index) => (
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
          {index < BORROWING_STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: '3px',
              background: item.step < activeStep ? COLORS.stepCompleted : COLORS.stepPending,
              margin: '0 8px',
              marginBottom: '18px',
              minWidth: '20px',
              maxWidth: '40px',
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
        title="借用契約タスク"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/borrowing-management"
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
        alignItems: 'center',
      }}>
        <span><strong>申請ID:</strong> {application.id}</span>
        <span><strong>貸出元:</strong> {application.companyName}</span>
        <span><strong>品目:</strong> {application.itemName}</span>
        <span><strong>メーカー:</strong> {application.maker}</span>
        <span><strong>型式:</strong> {application.model}</span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          background: statusColor.bg,
          color: statusColor.color,
        }}>
          {application.status}
        </span>
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
          {/* STEP1: 申請承認 */}
          <Section
            step={1}
            title="STEP1. 申請承認"
            accentColor="#3498db"
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            <FormRow>
              <span style={labelStyle}>承認コメント</span>
              <textarea
                placeholder="承認または却下の理由を入力"
                value={formData.approvalComment}
                onChange={(e) => updateFormData({ approvalComment: e.target.value })}
                disabled={!isStepEnabled(1) || activeStep !== 1}
                style={{
                  ...getInputProps(1).style,
                  flex: 1,
                  minHeight: '60px',
                  resize: 'vertical',
                }}
              />
            </FormRow>
            {activeStep === 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="task-btn"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  却下
                </button>
                <button
                  className="task-btn"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  承認して次へ →
                </button>
              </div>
            )}
            {1 < activeStep && (
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                承認日: {application.approvalDate} / 承認者: {application.approverName}
              </div>
            )}
          </Section>

          {/* STEP2: 契約登録 */}
          <Section
            step={2}
            title="STEP2. 契約登録"
            accentColor="#27ae60"
            enabled={isStepEnabled(2)}
            completed={2 < activeStep}
          >
            <FormRow>
              <span style={labelStyle}>契約番号</span>
              <input
                type="text"
                placeholder="CT-2026-XXX"
                value={formData.contractNo}
                onChange={(e) => updateFormData({ contractNo: e.target.value })}
                {...getInputProps(2)}
                disabled={!isStepEnabled(2) || activeStep !== 2}
                style={{ ...inputStyle, width: '180px' }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>契約日</span>
              <input
                type="date"
                value={formData.contractDate}
                onChange={(e) => updateFormData({ contractDate: e.target.value })}
                {...getInputProps(2)}
                disabled={!isStepEnabled(2) || activeStep !== 2}
                style={{ ...inputStyle, width: '180px' }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>契約書</span>
              <input
                type="file"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || '')}
                disabled={!isStepEnabled(2) || activeStep !== 2}
                style={{ fontSize: '13px' }}
              />
              {activeStep === 2 && selectedFileName && (
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('契約書', 2)}
                  style={{
                    padding: '4px 12px',
                    background: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  登録
                </button>
              )}
            </FormRow>
            {activeStep === 2 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  className="task-btn"
                  onClick={handleContractRegister}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  契約登録して次へ →
                </button>
              </div>
            )}
          </Section>

          {/* STEP3: 日程調整 */}
          <Section
            step={3}
            title="STEP3. 日程調整"
            accentColor="#9b59b6"
            enabled={isStepEnabled(3)}
            completed={3 < activeStep}
          >
            <FormRow>
              <span style={labelStyle}>納品予定日</span>
              <input
                type="date"
                value={formData.scheduledDeliveryDate}
                onChange={(e) => updateFormData({ scheduledDeliveryDate: e.target.value })}
                {...getInputProps(3)}
                disabled={!isStepEnabled(3) || activeStep !== 3}
                style={{ ...inputStyle, width: '180px' }}
              />
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                (希望: {application.desiredDeliveryDate})
              </span>
            </FormRow>
            <FormRow>
              <span style={labelStyle}>返却予定日</span>
              <input
                type="date"
                value={formData.scheduledReturnDate}
                onChange={(e) => updateFormData({ scheduledReturnDate: e.target.value })}
                {...getInputProps(3)}
                disabled={!isStepEnabled(3) || activeStep !== 3}
                style={{ ...inputStyle, width: '180px' }}
              />
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                (希望: {application.returnDate})
              </span>
            </FormRow>
            {activeStep === 3 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  className="task-btn"
                  onClick={handleScheduleConfirm}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  日程確定して次へ →
                </button>
              </div>
            )}
          </Section>

          {/* STEP4: 納品確認 */}
          <Section
            step={4}
            title="STEP4. 納品確認"
            accentColor="#e67e22"
            enabled={isStepEnabled(4)}
            completed={4 < activeStep}
          >
            <FormRow>
              <span style={labelStyle}>納品実績日</span>
              <input
                type="date"
                value={formData.actualDeliveryDate}
                onChange={(e) => updateFormData({ actualDeliveryDate: e.target.value })}
                {...getInputProps(4)}
                disabled={!isStepEnabled(4) || activeStep !== 4}
                style={{ ...inputStyle, width: '180px' }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>備考</span>
              <input
                type="text"
                placeholder="納品時の状態など"
                value={formData.deliveryNote}
                onChange={(e) => updateFormData({ deliveryNote: e.target.value })}
                {...getInputProps(4)}
                disabled={!isStepEnabled(4) || activeStep !== 4}
                style={{ ...inputStyle, flex: 1 }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>納品書</span>
              <input
                type="file"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || '')}
                disabled={!isStepEnabled(4) || activeStep !== 4}
                style={{ fontSize: '13px' }}
              />
              {activeStep === 4 && selectedFileName && (
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('納品書', 4)}
                  style={{
                    padding: '4px 12px',
                    background: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  登録
                </button>
              )}
            </FormRow>
            {activeStep === 4 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  className="task-btn"
                  onClick={handleDeliveryConfirm}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  納品確認して次へ →
                </button>
              </div>
            )}
          </Section>

          {/* STEP5: 返却処理 */}
          <Section
            step={5}
            title="STEP5. 返却処理"
            accentColor="#c0392b"
            enabled={isStepEnabled(5)}
            completed={5 < activeStep}
          >
            <FormRow>
              <span style={labelStyle}>返却実績日</span>
              <input
                type="date"
                value={formData.actualReturnDate}
                onChange={(e) => updateFormData({ actualReturnDate: e.target.value })}
                {...getInputProps(5)}
                disabled={!isStepEnabled(5) || activeStep !== 5}
                style={{ ...inputStyle, width: '180px' }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>備考</span>
              <input
                type="text"
                placeholder="返却時の状態など"
                value={formData.returnNote}
                onChange={(e) => updateFormData({ returnNote: e.target.value })}
                {...getInputProps(5)}
                disabled={!isStepEnabled(5) || activeStep !== 5}
                style={{ ...inputStyle, flex: 1 }}
              />
            </FormRow>
            <FormRow>
              <span style={labelStyle}>返却確認書</span>
              <input
                type="file"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || '')}
                disabled={!isStepEnabled(5) || activeStep !== 5}
                style={{ fontSize: '13px' }}
              />
              {activeStep === 5 && selectedFileName && (
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('返却確認書', 5)}
                  style={{
                    padding: '4px 12px',
                    background: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  登録
                </button>
              )}
            </FormRow>
            {activeStep === 5 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  className="task-btn"
                  onClick={handleReturnConfirm}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  返却完了
                </button>
              </div>
            )}
            {activeStep === 6 && (
              <div style={{ padding: '16px', background: COLORS.successLight, borderRadius: '4px', textAlign: 'center' }}>
                <span style={{ color: COLORS.success, fontWeight: 'bold', fontSize: '14px' }}>✓ 借用契約が完了しました</span>
              </div>
            )}
          </Section>
          </div>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: '6px',
            background: COLORS.borderLight,
            cursor: 'col-resize',
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
          {/* プレビューヘッダー */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.borderLight}`,
            background: previewTab === 2 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#c0392b',
            color: COLORS.textOnColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              {previewDocumentIndex !== null
                ? `プレビュー - ${registeredDocuments.filter(d => d.step === previewTab)[previewDocumentIndex]?.fileName || ''}`
                : previewTab === 2 ? '契約書一覧' : previewTab === 4 ? '納品書一覧' : '返却確認書一覧'}
            </h3>
          </div>

          {/* プレビューコンテンツ */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* ドキュメント一覧 */}
            {previewDocumentIndex === null && (() => {
              const docs = registeredDocuments.filter(d => d.step === previewTab);
              const tabLabel = previewTab === 2 ? '契約書' : previewTab === 4 ? '納品書' : '返却確認書';
              const tabColor = previewTab === 2 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#c0392b';

              return (
                <div style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: tabColor }}>
                    登録済み{tabLabel}一覧
                  </h4>
                  {docs.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: tabColor, color: 'white' }}>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc' }}>ファイル名</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '100px' }}>登録日</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map((doc, idx) => (
                          <tr key={doc.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                            <td style={{ padding: '8px', border: '1px solid #ccc' }}>{doc.fileName}</td>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                              {new Date(doc.registeredAt).toLocaleDateString('ja-JP')}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                              <button
                                onClick={() => setPreviewDocumentIndex(idx)}
                                style={{
                                  padding: '4px 8px',
                                  background: tabColor,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  marginRight: '4px',
                                }}
                              >
                                表示
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('このドキュメントを削除しますか？')) {
                                    setRegisteredDocuments(prev => prev.filter(d => d.id !== doc.id));
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: COLORS.error,
                                  color: 'white',
                                  border: 'none',
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
                  ) : (
                    <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '32px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
                      <div>登録済みの{tabLabel}はありません</div>
                      <div style={{ fontSize: '11px', marginTop: '8px' }}>
                        {previewTab === 2 && 'STEP2で契約書を登録してください'}
                        {previewTab === 4 && 'STEP4で納品書を登録してください'}
                        {previewTab === 5 && 'STEP5で返却確認書を登録してください'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ドキュメントプレビュー（選択時） */}
            {previewDocumentIndex !== null && (() => {
              const docs = registeredDocuments.filter(d => d.step === previewTab);
              const doc = docs[previewDocumentIndex];
              const tabColor = previewTab === 2 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#c0392b';

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
                  {/* PDFプレビューエリア（モック） */}
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
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>
                      {doc.fileName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      PDFプレビュー（モック）
                    </div>
                  </div>
                  {/* ドキュメント情報 */}
                  <div style={{ marginTop: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px', background: tabColor, color: 'white', fontWeight: 'bold', width: '120px' }}>種別</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{doc.documentType}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', background: tabColor, color: 'white', fontWeight: 'bold' }}>登録日時</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                            {new Date(doc.registeredAt).toLocaleString('ja-JP')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 縦型タブバー（右端） */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#f0f0f0',
          borderLeft: '1px solid #ddd',
          width: '40px',
          flexShrink: 0,
        }}>
          {([2, 4, 5] as const).map((step) => {
            const tabColor = step === 2 ? '#27ae60' : step === 4 ? '#e67e22' : '#c0392b';
            const tabLabel = step === 2 ? '契約書' : step === 4 ? '納品書' : '返却書';
            const docsCount = registeredDocuments.filter(d => d.step === step).length;

            return (
              <button
                key={step}
                onClick={() => {
                  setPreviewTab(step);
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
                  background: previewTab === step ? tabColor : 'transparent',
                  color: previewTab === step ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: previewTab === step ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  padding: '8px 0',
                  gap: '4px',
                }}
                title={tabLabel}
              >
                <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>{tabLabel}</span>
                {docsCount > 0 && (
                  <span style={{
                    background: previewTab === step ? 'rgba(255,255,255,0.3)' : tabColor,
                    color: previewTab === step ? 'white' : 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}>
                    {docsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BorrowingTaskPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="借用契約タスク"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/borrowing-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
        </div>
      </div>
    }>
      <BorrowingTaskContent />
    </Suspense>
  );
}
