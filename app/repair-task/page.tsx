'use client';

import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';

/** カラートークン（order-registration準拠） */
const COLORS = {
  primary: '#4a6fa5',
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

/** 修理フローのステップ定義 */
const REPAIR_STEPS = [
  { step: 1, label: '修理受付', status: '受付済' },
  { step: 2, label: '見積依頼', status: '依頼済' },
  { step: 3, label: '見積登録', status: '依頼済' },
  { step: 4, label: '修理発注', status: '修理中' },
  { step: 5, label: '完了登録', status: '完了' },
];

// 修理依頼のステータス
type RepairStatus = '新規申請' | '受付済' | '依頼済' | '修理中' | '院内対応中' | '完了';

// 登録済み見積の型
interface RegisteredQuotation {
  id: number;
  phase: '発注用' | '参考' | '追加';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
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
  // 発注情報
  isInHouse: boolean;
  isRejected: boolean;
  needsPickup: boolean;
  pickupDate: string;
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
    '1': '修理中',
    '2': '受付済',
    '3': '新規申請',
    '4': '依頼済',
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
    vendors: [
      { name: '', person: '', email: '', contact: '', deadline: '' },
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
    isInHouse: false,
    isRejected: false,
    needsPickup: true,
    pickupDate: '',
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

// ステータスからアクティブなステップを取得
const getActiveStep = (status: RepairStatus): number => {
  switch (status) {
    case '新規申請': return 1;
    case '受付済': return 2;
    case '依頼済': return 3;
    case '修理中': return 4;
    case '院内対応中': return 5; // 院内修理の場合はSTEP5へ直接遷移
    case '完了': return 5;
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
  const [showPreview, setShowPreview] = useState(false);
  // STEP2用：プレビュー対象の業者インデックス（null=非表示）
  const [previewVendorIndex, setPreviewVendorIndex] = useState<number | null>(null);
  // プレビュータイプ
  const [previewType, setPreviewType] = useState<'step1' | 'step2' | 'step4' | null>(null);
  // STEP3用：登録済み見積リスト
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  // STEP3用：選択中のファイル名
  const [selectedFileName, setSelectedFileName] = useState<string>('');

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
  }, [requestId]);

  const activeStep = useMemo(() => {
    return request ? getActiveStep(request.status) : 1;
  }, [request]);

  const isStepEnabled = (step: number) => step === activeStep;

  if (!request || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="修理申請タスク" hideMenu={true} showBackButton={false} />
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

  // STEP1: 院内/院外修理を選択して受付
  const handleStep1Submit = (category: '院内修理' | '院外修理') => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (category === '院内修理') {
        setRequest(prev => prev ? { ...prev, status: '院内対応中', repairCategory: category } : prev);
      } else {
        setRequest(prev => prev ? { ...prev, status: '受付済', repairCategory: category } : prev);
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

  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積依頼を完了しました。STEP3へ進みます。');
      setRequest(prev => prev ? { ...prev, status: '依頼済' } : prev);
      setIsSubmitting(false);
    }, 500);
  };

  // STEP3: 見積登録（リストに追加）
  const handleAddQuotation = () => {
    if (!selectedFileName) {
      alert('見積ファイルを選択してください');
      return;
    }

    const newQuotation: RegisteredQuotation = {
      id: Date.now(),
      phase: formData.quotationPhase,
      saveFormat: formData.saveFormat,
      fileName: selectedFileName,
      registeredAt: new Date().toISOString(),
    };

    setRegisteredQuotations(prev => [...prev, newQuotation]);

    // 入力フォームをリセット
    setSelectedFileName('');

    alert('見積を登録しました');
  };

  // STEP3: 見積削除
  const handleDeleteQuotation = (id: number) => {
    if (confirm('この見積を削除しますか？')) {
      setRegisteredQuotations(prev => prev.filter(q => q.id !== id));
    }
  };

  // STEP3 → STEP4へ進む
  const handleGoToStep4 = () => {
    setRequest(prev => prev ? { ...prev, status: '修理中' } : prev);
  };

  // STEP4: 院内対応（タスククローズ）
  const handleStep4Internal = () => {
    if (confirm('院内対応としてこのタスクを完了しますか？')) {
      alert('タスクを完了しました。一覧に戻ります。');
      router.push('/quotation-data-box?tab=repairRequests');
    }
  };

  // STEP4: 申請却下・修理不能（購入申請へ）
  const handleStep4Rejected = () => {
    if (confirm('修理不能のため購入申請画面へ移動しますか？')) {
      router.push('/quotation-data-box');
    }
  };

  // STEP4: 発注書プレビュー表示
  const handleShowOrderPreview = () => {
    setShowPreview(true);
    setPreviewType('step4');
    setPreviewVendorIndex(null);
  };

  // STEP4: 発注書発行（STEP5へ）
  const handleStep4Order = () => {
    setRequest(prev => prev ? { ...prev, status: '修理中' } : prev);
    alert('発注書を発行しました。STEP5へ進みます。');
  };

  // STEP5: 完了
  const handleStep5Complete = () => {
    if (!formData.deliveryDate) {
      alert('納品日を入力してください');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      alert('修理完了を登録しました。タスク管理画面に戻ります。');
      router.push('/quotation-data-box?tab=repairRequests');
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
          {index < REPAIR_STEPS.length - 1 && (
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
        title="修理申請タスク"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box?tab=repairRequests"
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
        {/* STEP1: 修理依頼の受付 */}
        <Section
          step={1}
          title="STEP1. 修理依頼の受付"
          accentColor="#3498db"
          enabled={isStepEnabled(1)}
          completed={1 < activeStep}
          headerAction={
            <button
              className="repair-btn"
              onClick={() => {
                setShowPreview(true);
                setPreviewType('step1');
                setPreviewVendorIndex(null);
              }}
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
            修理申請書の確認を実施し院内修理か外部委託修理か判断してください。
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
              院内修理：STEP５へ
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
              院外修理
            </button>
          </FormRow>
        </Section>

        {/* STEP2: 修理見積の依頼 */}
        <Section step={2} title="STEP2. 修理見積の依頼" accentColor="#9c27b0" enabled={isStepEnabled(2)} completed={2 < activeStep}>
          <div style={{
            padding: '12px 16px',
            background: '#f3e5f5',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#6a1b9a',
          }}>
            修理業者を登録し、修理見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
          </div>
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
                  const isSelected = previewType === 'step2' && previewVendorIndex === i;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${COLORS.borderLight}`,
                        background: isSelected ? '#f3e5f5' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 8px', color: COLORS.textMuted, fontSize: '11px' }}>依頼先{i + 1}</td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="text"
                          value={vendor?.name || ''}
                          onChange={(e) => updateVendor(i, 'name', e.target.value)}
                          placeholder="業者名"
                          {...getInputProps(2)}
                          style={{ ...getInputProps(2).style, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="text"
                          value={vendor?.person || ''}
                          onChange={(e) => updateVendor(i, 'person', e.target.value)}
                          placeholder="担当者"
                          {...getInputProps(2)}
                          style={{ ...getInputProps(2).style, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="email"
                          value={vendor?.email || ''}
                          onChange={(e) => updateVendor(i, 'email', e.target.value)}
                          placeholder="email@example.com"
                          {...getInputProps(2)}
                          style={{ ...getInputProps(2).style, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="tel"
                          value={vendor?.contact || ''}
                          onChange={(e) => updateVendor(i, 'contact', e.target.value)}
                          placeholder="03-0000-0000"
                          {...getInputProps(2)}
                          style={{ ...getInputProps(2).style, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input
                          type="date"
                          value={vendor?.deadline || ''}
                          onChange={(e) => updateVendor(i, 'deadline', e.target.value)}
                          {...getInputProps(2)}
                          style={{ ...getInputProps(2).style, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            className="repair-btn"
                            onClick={() => {
                              setShowPreview(true);
                              setPreviewType('step2');
                              setPreviewVendorIndex(i);
                            }}
                            disabled={!isStepEnabled(2) || !hasVendorData}
                            style={{
                              padding: '4px 8px',
                              background: hasVendorData ? '#9c27b0' : COLORS.disabled,
                              color: COLORS.textOnColor,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: hasVendorData ? 'pointer' : 'not-allowed',
                              fontSize: '11px',
                            }}
                            title={hasVendorData ? 'プレビュー表示' : '業者名とメールを入力してください'}
                          >
                            プレビュー
                          </button>
                          <button
                            className="repair-btn"
                            onClick={() => handleStep2Submit(i)}
                            disabled={!isStepEnabled(2) || !hasVendorData}
                            style={{
                              padding: '4px 8px',
                              background: hasVendorData ? COLORS.primary : COLORS.disabled,
                              color: COLORS.textOnColor,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: hasVendorData ? 'pointer' : 'not-allowed',
                              fontSize: '11px',
                            }}
                            title={hasVendorData ? '依頼を送信' : '業者名とメールを入力してください'}
                          >
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

          <FormRow style={{ justifyContent: 'flex-end' }}>
            <button
              className="repair-btn"
              onClick={handleStep2Complete}
              disabled={!isStepEnabled(2) || isSubmitting}
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
              見積依頼完了 → STEP3へ
            </button>
          </FormRow>
        </Section>

        {/* STEP3: 修理見積の登録 */}
        <Section step={3} title="STEP3. 修理見積の登録" accentColor="#27ae60" enabled={isStepEnabled(3)} completed={3 < activeStep}>
          {/* ガイドメッセージ */}
          <div style={{
            padding: '12px 16px',
            background: '#e8f5e9',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#2e7d32',
          }}>
            STEP2で取得した見積をフェーズごとに登録してください。発注用見積は必須です。
          </div>

          {/* 登録済み見積一覧 */}
          {registeredQuotations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.textPrimary,
                marginBottom: '8px',
              }}>
                登録済み見積（{registeredQuotations.length}件）
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: COLORS.surfaceAlt }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>フェーズ</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>保存形式</th>
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
                            background: q.phase === '発注用' ? '#e3f2fd' : q.phase === '参考' ? '#f3e5f5' : '#fff3e0',
                            color: q.phase === '発注用' ? '#1565c0' : q.phase === '参考' ? '#7b1fa2' : '#e65100',
                          }}>
                            {q.phase === '発注用' ? '修理発注登録用' : q.phase === '参考' ? '参考' : '追加'}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>📄</span>
                            <span>{q.fileName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted }}>{q.saveFormat}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteQuotation(q.id)}
                            disabled={!isStepEnabled(3)}
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

          {/* 見積入力フォーム */}
          <div style={{
            padding: '16px',
            background: COLORS.surfaceAlt,
            borderRadius: '8px',
            border: `1px solid ${COLORS.borderLight}`,
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: COLORS.textPrimary,
              marginBottom: '12px',
            }}>
              見積を追加
            </div>

            {/* ファイル選択エリア */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px' }}>
                添付ファイル <span style={{ color: COLORS.error }}>*</span>
              </div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  border: `2px dashed ${selectedFileName ? COLORS.success : COLORS.border}`,
                  borderRadius: '8px',
                  background: selectedFileName ? '#e8f5e9' : COLORS.white,
                  cursor: isStepEnabled(3) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: isStepEnabled(3) ? 1 : 0.6,
                }}
              >
                {selectedFileName ? (
                  <>
                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>✅</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.success }}>{selectedFileName}</span>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>クリックして変更</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>📁</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary }}>クリックしてファイルを選択</span>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>PDF, JPG, PNG対応</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={!isStepEnabled(3)}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFileName(file.name);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* フェーズと保存形式 */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <FormRow style={{ marginBottom: 0 }}>
                <span style={labelStyle}>見積フェーズ <span style={{ color: COLORS.error }}>*</span></span>
                <select
                  value={formData.quotationPhase}
                  onChange={(e) => updateFormData({ quotationPhase: e.target.value as '発注用' | '参考' | '追加' })}
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '200px' }}
                >
                  <option value="発注用">修理発注登録用見積</option>
                  <option value="参考">参考見積</option>
                  <option value="追加">追加見積（部品交換など）</option>
                </select>
              </FormRow>

              <FormRow style={{ marginBottom: 0 }}>
                <span style={labelStyle}>保存形式 <span style={{ color: COLORS.error }}>*</span></span>
                <select
                  value={formData.saveFormat}
                  onChange={(e) => updateFormData({ saveFormat: e.target.value as '電子取引' | 'スキャナ保存' | '未指定' })}
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '140px' }}
                >
                  <option value="電子取引">電子取引</option>
                  <option value="スキャナ保存">スキャナ保存</option>
                  <option value="未指定">未指定</option>
                </select>
              </FormRow>
            </div>

            {/* 登録ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="repair-btn"
                onClick={handleAddQuotation}
                disabled={!isStepEnabled(3) || isSubmitting || !selectedFileName}
                style={{
                  padding: '8px 20px',
                  background: selectedFileName ? COLORS.success : COLORS.disabled,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedFileName ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                + 見積を登録
              </button>
            </div>
          </div>

          {/* STEP4へ進むボタン */}
          <FormRow style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              className="repair-btn"
              onClick={handleGoToStep4}
              disabled={!isStepEnabled(3) || isSubmitting}
              style={{
                padding: '10px 32px',
                background: COLORS.accent,
                color: COLORS.textOnAccent,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              STEP4へ
            </button>
          </FormRow>
        </Section>

        {/* STEP4: 修理の依頼（発注） */}
        <Section step={4} title="STEP4. 修理の依頼（発注）" accentColor="#e67e22" enabled={isStepEnabled(4)} completed={4 < activeStep}>
          {/* ガイドメッセージ */}
          <div style={{
            padding: '12px 16px',
            background: '#fff3e0',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#e65100',
          }}>
            対応区分を選択してください。外部発注の場合は発注書のプレビュー・出力ができます。
          </div>

          {/* 対応区分選択 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {/* 院内対応 */}
            <div
              onClick={() => isStepEnabled(4) && updateFormData({ isInHouse: true, isRejected: false })}
              style={{
                padding: '16px',
                border: `2px solid ${formData.isInHouse ? COLORS.primary : COLORS.border}`,
                borderRadius: '8px',
                background: formData.isInHouse ? '#e3f2fd' : COLORS.white,
                cursor: isStepEnabled(4) ? 'pointer' : 'not-allowed',
                opacity: isStepEnabled(4) ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="radio"
                  name="step4Action"
                  checked={formData.isInHouse}
                  onChange={() => updateFormData({ isInHouse: true, isRejected: false })}
                  disabled={!isStepEnabled(4)}
                />
                <span style={{ fontWeight: 'bold', color: COLORS.primary }}>院内対応</span>
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, paddingLeft: '24px' }}>
                院内で修理対応を行い、タスクを完了します
              </div>
            </div>

            {/* 外部発注 */}
            <div
              onClick={() => isStepEnabled(4) && updateFormData({ isInHouse: false, isRejected: false })}
              style={{
                padding: '16px',
                border: `2px solid ${!formData.isInHouse && !formData.isRejected ? COLORS.accent : COLORS.border}`,
                borderRadius: '8px',
                background: !formData.isInHouse && !formData.isRejected ? '#fff3e0' : COLORS.white,
                cursor: isStepEnabled(4) ? 'pointer' : 'not-allowed',
                opacity: isStepEnabled(4) ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="radio"
                  name="step4Action"
                  checked={!formData.isInHouse && !formData.isRejected}
                  onChange={() => updateFormData({ isInHouse: false, isRejected: false })}
                  disabled={!isStepEnabled(4)}
                />
                <span style={{ fontWeight: 'bold', color: COLORS.accent }}>発注書の発行</span>
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, paddingLeft: '24px' }}>
                業者に発注書を発行し、STEP5へ進みます
              </div>
            </div>

            {/* 申請却下・修理不能 */}
            <div
              onClick={() => isStepEnabled(4) && updateFormData({ isInHouse: false, isRejected: true })}
              style={{
                padding: '16px',
                border: `2px solid ${formData.isRejected ? COLORS.error : COLORS.border}`,
                borderRadius: '8px',
                background: formData.isRejected ? '#ffebee' : COLORS.white,
                cursor: isStepEnabled(4) ? 'pointer' : 'not-allowed',
                opacity: isStepEnabled(4) ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="radio"
                  name="step4Action"
                  checked={formData.isRejected}
                  onChange={() => updateFormData({ isInHouse: false, isRejected: true })}
                  disabled={!isStepEnabled(4)}
                />
                <span style={{ fontWeight: 'bold', color: COLORS.error }}>申請却下・修理不能</span>
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, paddingLeft: '24px' }}>
                修理不能のため、購入申請へ移行します
              </div>
            </div>
          </div>

          {/* 外部発注の場合：発注先情報（STEP2から自動取得） */}
          {!formData.isInHouse && !formData.isRejected && (
            <div style={{
              padding: '16px',
              background: COLORS.surfaceAlt,
              borderRadius: '8px',
              border: `1px solid ${COLORS.borderLight}`,
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.textPrimary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>発注先情報</span>
                {formData.vendors[0]?.name && (
                  <span style={{
                    fontSize: '11px',
                    color: COLORS.success,
                    background: '#e8f5e9',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    STEP2から自動取得
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <FormRow style={{ marginBottom: 0 }}>
                  <span style={labelStyle}>業者名</span>
                  <input
                    type="text"
                    value={formData.orderVendorName || formData.vendors[0]?.name || ''}
                    onChange={(e) => updateFormData({ orderVendorName: e.target.value })}
                    placeholder="業者名"
                    {...getInputProps(4)}
                    style={{ ...getInputProps(4).style, width: '150px' }}
                  />
                </FormRow>
                <FormRow style={{ marginBottom: 0 }}>
                  <span style={labelStyle}>担当者</span>
                  <input
                    type="text"
                    value={formData.orderVendorPerson || formData.vendors[0]?.person || ''}
                    onChange={(e) => updateFormData({ orderVendorPerson: e.target.value })}
                    placeholder="担当者"
                    {...getInputProps(4)}
                    style={{ ...getInputProps(4).style, width: '120px' }}
                  />
                </FormRow>
                <FormRow style={{ marginBottom: 0 }}>
                  <span style={labelStyle}>メール</span>
                  <input
                    type="email"
                    value={formData.orderVendorEmail || formData.vendors[0]?.email || ''}
                    onChange={(e) => updateFormData({ orderVendorEmail: e.target.value })}
                    placeholder="email"
                    {...getInputProps(4)}
                    style={{ ...getInputProps(4).style, width: '180px' }}
                  />
                </FormRow>
                <FormRow style={{ marginBottom: 0 }}>
                  <span style={labelStyle}>連絡先</span>
                  <input
                    type="tel"
                    value={formData.orderVendorContact || formData.vendors[0]?.contact || ''}
                    onChange={(e) => updateFormData({ orderVendorContact: e.target.value })}
                    placeholder="連絡先"
                    {...getInputProps(4)}
                    style={{ ...getInputProps(4).style, width: '140px' }}
                  />
                </FormRow>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <FormRow style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            {formData.isInHouse && (
              <button
                className="repair-btn"
                onClick={handleStep4Internal}
                disabled={!isStepEnabled(4) || isSubmitting}
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
                タスクを完了する
              </button>
            )}
            {!formData.isInHouse && !formData.isRejected && (
              <>
                <button
                  className="repair-btn"
                  onClick={handleShowOrderPreview}
                  disabled={!isStepEnabled(4) || isSubmitting}
                  style={{
                    padding: '10px 24px',
                    background: '#34495e',
                    color: COLORS.textOnColor,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  発注書プレビュー
                </button>
                <button
                  className="repair-btn"
                  onClick={handleStep4Order}
                  disabled={!isStepEnabled(4) || isSubmitting}
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
                  発注書を発行 → STEP5へ
                </button>
              </>
            )}
            {formData.isRejected && (
              <button
                className="repair-btn"
                onClick={handleStep4Rejected}
                disabled={!isStepEnabled(4) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.error,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                購入申請へ移行
              </button>
            )}
          </FormRow>
        </Section>

        {/* STEP5: 完了登録 */}
        <Section step={5} title="STEP5. 完了登録（修理報告書の登録）" accentColor="#e74c3c" enabled={isStepEnabled(5)} completed={5 < activeStep}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div>
              <FormRow>
                <span style={labelStyle}>添付ファイル</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  disabled={!isStepEnabled(5)}
                  style={{ fontSize: '12px' }}
                />
              </FormRow>

              <FormRow>
                <span style={labelStyle}>ドキュメント種別</span>
                <select
                  value={formData.documentType}
                  onChange={(e) => updateFormData({ documentType: e.target.value as '修理報告書' | '納品書' })}
                  {...getInputProps(5)}
                  style={{ ...getInputProps(5).style, width: '140px' }}
                >
                  <option value="修理報告書">修理報告書</option>
                  <option value="納品書">納品書</option>
                </select>
              </FormRow>
            </div>

            <div>
              <FormRow>
                <span style={labelStyle}>勘定科目</span>
                <select
                  value={formData.accountType}
                  onChange={(e) => updateFormData({ accountType: e.target.value as '修繕費' | 'その他' })}
                  {...getInputProps(5)}
                  style={{ ...getInputProps(5).style, width: '120px' }}
                >
                  <option value="修繕費">修繕費</option>
                  <option value="その他">その他</option>
                </select>
                {formData.accountType === 'その他' && (
                  <input
                    type="text"
                    value={formData.accountOther}
                    onChange={(e) => updateFormData({ accountOther: e.target.value })}
                    placeholder="科目名"
                    {...getInputProps(5)}
                    style={{ ...getInputProps(5).style, width: '120px' }}
                  />
                )}
              </FormRow>

              <FormRow>
                <span style={labelStyle}>納品日（修理完了日）<span style={{ color: COLORS.error }}>*</span></span>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => updateFormData({ deliveryDate: e.target.value })}
                  {...getInputProps(5)}
                  style={{ ...getInputProps(5).style, width: '150px' }}
                />
              </FormRow>

              <FormRow style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  className="repair-btn"
                  onClick={handleStep5Complete}
                  disabled={!isStepEnabled(5) || isSubmitting}
                  style={{
                    padding: '10px 24px',
                    background: COLORS.error,
                    color: COLORS.textOnColor,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {isSubmitting ? '登録中...' : '修理完了を登録'}
                </button>
              </FormRow>
            </div>
          </div>
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

        {/* 右側: プレビューエリア */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'white',
          margin: '16px 16px 16px 0',
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            padding: '12px 16px',
            background: previewType === 'step2' ? '#9c27b0' : COLORS.primary,
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>
              {previewType === 'step1' && '修理申請書プレビュー'}
              {previewType === 'step2' && previewVendorIndex !== null && `修理見積依頼書 - ${formData?.vendors[previewVendorIndex]?.name || `依頼先${previewVendorIndex + 1}`}`}
              {!previewType && 'プレビュー'}
            </span>
            {showPreview && previewType && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="repair-btn"
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewType(null);
                    setPreviewVendorIndex(null);
                  }}
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
                  閉じる
                </button>
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
            )}
          </div>
          {/* プレビューコンテンツ */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: '#f5f5f5',
            padding: showPreview && previewType ? '24px' : '0',
            display: showPreview && previewType ? 'block' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {showPreview && previewType === 'step1' && (
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
                    </tbody>
                  </table>
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

            {showPreview && previewType === 'step2' && previewVendorIndex !== null && formData && (() => {
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
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #333',
                  }}>
                    修理見積依頼
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
                      【対象機器】
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
                    }}>
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>上記機器の修理をお願いいたします。</li>
                        <li>修理着手前に見積書をご提出ください。</li>
                        <li>修理期間の目安をご連絡ください。</li>
                      </ol>
                    </div>
                  </div>

                  {/* 見積提出期限 */}
                  <div style={{
                    padding: '16px',
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

            {/* STEP4: 発注書プレビュー */}
            {showPreview && previewType === 'step4' && formData && (() => {
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

                  {/* 発注番号 */}
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
                      <strong>発注番号：</strong>
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
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>修理内容</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>{request.symptoms}に対する修理</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>見積参照</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
                            {orderQuotation ? orderQuotation.fileName : '貴社見積書'}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#e3f2fd', border: '1px solid #ccc', textAlign: 'left', fontWeight: 'bold' }}>発注金額</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc', fontWeight: 'bold', fontSize: '15px', color: '#1565c0' }}>
                            ¥ ○○○,○○○-（税込）
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 納品・支払条件 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#333',
                    }}>
                      【納品・支払条件】
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', width: '100px', textAlign: 'left' }}>納品場所</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>○○病院 {request.applicantDepartment}</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>希望納期</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>修理完了後、速やかに</td>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', textAlign: 'left' }}>支払条件</th>
                          <td style={{ padding: '8px 12px', border: '1px solid #ccc' }}>月末締め翌月末払い</td>
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

            {!showPreview || !previewType ? (
              /* プレビュー未表示時のプレースホルダー */
              <div style={{
                textAlign: 'center',
                color: '#999',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '14px' }}>各STEPの「プレビュー」ボタンを押すと</div>
                <div style={{ fontSize: '14px' }}>帳票のプレビューが表示されます</div>
              </div>
            ) : null}
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
        <Header title="修理申請タスク" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280' }}>読み込み中...</p>
        </div>
      </div>
    }>
      <RepairTaskContent />
    </Suspense>
  );
}
