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
type RepairStatus = '新規申請' | '受付済' | '依頼済' | '修理中' | '完了';

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

function RepairTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id') || '3';

  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [formData, setFormData] = useState<RepairRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleBack = () => {
    router.push('/quotation-data-box?tab=repairRequests');
  };

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
        alert('院内修理として受付しました。STEP5へスキップします。');
        setRequest(prev => prev ? { ...prev, status: '修理中', repairCategory: category } : prev);
      } else {
        alert('院外修理として受付しました。STEP2へ進みます。');
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

  // STEP3: 見積登録
  const handleStep3Submit = () => {
    if (!formData.quotationAmount) {
      alert('見積金額を入力してください');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積を登録しました。STEP4へ進みます。');
      setRequest(prev => prev ? { ...prev, status: '修理中' } : prev);
      setIsSubmitting(false);
    }, 500);
  };

  // STEP4: 発注
  const handleStep4Order = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('発注書を発行しました。');
      setIsSubmitting(false);
    }, 500);
  };

  const handleStep4Internal = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('院内決済伺いを発行しました。');
      setIsSubmitting(false);
    }, 500);
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

  // セクションコンポーネント
  const Section = ({
    step,
    title,
    children,
    accentColor = COLORS.primary,
    headerAction,
  }: {
    step: number;
    title: string;
    children: React.ReactNode;
    accentColor?: string;
    headerAction?: React.ReactNode;
  }) => {
    const enabled = isStepEnabled(step);
    const completed = step < activeStep;

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

  // フォーム行コンポーネント
  const FormRow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', ...style }}>
      {children}
    </div>
  );

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
        showBackButton={false}
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
          headerAction={
            <button
              className="repair-btn"
              onClick={() => setShowPreview(true)}
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
        <Section step={2} title="STEP2. 修理見積の依頼" accentColor="#9c27b0">
          <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: COLORS.surfaceAlt }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}`, width: '80px' }}></th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>業者名 <span style={{ color: COLORS.error }}>*</span></th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>担当者名</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>メール <span style={{ color: COLORS.error }}>*</span></th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>連絡先</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}`, width: '130px' }}>提出期限</th>
                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted, fontSize: '11px' }}>依頼先{i + 1}</td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="text"
                        value={formData.vendors[i]?.name || ''}
                        onChange={(e) => updateVendor(i, 'name', e.target.value)}
                        placeholder="業者名"
                        {...getInputProps(2)}
                        style={{ ...getInputProps(2).style, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="text"
                        value={formData.vendors[i]?.person || ''}
                        onChange={(e) => updateVendor(i, 'person', e.target.value)}
                        placeholder="担当者"
                        {...getInputProps(2)}
                        style={{ ...getInputProps(2).style, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="email"
                        value={formData.vendors[i]?.email || ''}
                        onChange={(e) => updateVendor(i, 'email', e.target.value)}
                        placeholder="email@example.com"
                        {...getInputProps(2)}
                        style={{ ...getInputProps(2).style, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="tel"
                        value={formData.vendors[i]?.contact || ''}
                        onChange={(e) => updateVendor(i, 'contact', e.target.value)}
                        placeholder="03-0000-0000"
                        {...getInputProps(2)}
                        style={{ ...getInputProps(2).style, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="date"
                        value={formData.vendors[i]?.deadline || ''}
                        onChange={(e) => updateVendor(i, 'deadline', e.target.value)}
                        {...getInputProps(2)}
                        style={{ ...getInputProps(2).style, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '4px', textAlign: 'center' }}>
                      <button
                        className="repair-btn"
                        onClick={() => handleStep2Submit(i)}
                        disabled={!isStepEnabled(2)}
                        style={{
                          padding: '4px 10px',
                          background: COLORS.primary,
                          color: COLORS.textOnColor,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        依頼送信
                      </button>
                    </td>
                  </tr>
                ))}
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
        <Section step={3} title="STEP3. 修理見積の登録" accentColor="#27ae60">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div>
              <FormRow>
                <span style={labelStyle}>添付ファイル</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  disabled={!isStepEnabled(3)}
                  style={{ fontSize: '12px' }}
                />
              </FormRow>

              <FormRow>
                <span style={labelStyle}>見積フェーズ</span>
                <select
                  value={formData.quotationPhase}
                  onChange={(e) => updateFormData({ quotationPhase: e.target.value as '発注用' | '参考' | '追加' })}
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '160px' }}
                >
                  <option value="発注用">修理発注登録用見積</option>
                  <option value="参考">参考見積</option>
                  <option value="追加">追加見積（部品交換等）</option>
                </select>
              </FormRow>

              <FormRow>
                <span style={labelStyle}>見積金額（税抜）<span style={{ color: COLORS.error }}>*</span></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: COLORS.textMuted }}>¥</span>
                  <input
                    type="number"
                    value={formData.quotationAmount || ''}
                    onChange={(e) => updateFormData({ quotationAmount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    {...getInputProps(3)}
                    style={{ ...getInputProps(3).style, width: '140px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
              </FormRow>

              <FormRow>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFreeRepair}
                    onChange={(e) => updateFormData({ isFreeRepair: e.target.checked })}
                    disabled={!isStepEnabled(3)}
                  />
                  無償対応（保証期間内等）
                </label>
              </FormRow>
            </div>

            <div>
              <FormRow>
                <span style={labelStyle}>保存形式</span>
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

              <FormRow>
                <span style={labelStyle}>見積日</span>
                <input
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) => updateFormData({ quotationDate: e.target.value })}
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '150px' }}
                />
              </FormRow>

              <FormRow>
                <span style={labelStyle}>業者情報</span>
                <input
                  type="text"
                  value={formData.quotationVendorName}
                  onChange={(e) => updateFormData({ quotationVendorName: e.target.value })}
                  placeholder="業者名"
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '150px' }}
                />
                <input
                  type="text"
                  value={formData.quotationVendorPerson}
                  onChange={(e) => updateFormData({ quotationVendorPerson: e.target.value })}
                  placeholder="担当者"
                  {...getInputProps(3)}
                  style={{ ...getInputProps(3).style, width: '120px' }}
                />
              </FormRow>

              <FormRow style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  className="repair-btn"
                  onClick={handleStep3Submit}
                  disabled={!isStepEnabled(3) || isSubmitting}
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
                  見積登録 → STEP4へ
                </button>
              </FormRow>
            </div>
          </div>
        </Section>

        {/* STEP4: 修理の依頼（発注） */}
        <Section step={4} title="STEP4. 修理の依頼（発注）" accentColor="#e67e22">
          <FormRow>
            <span style={labelStyle}>対応区分</span>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="inHouse"
                checked={formData.isInHouse}
                onChange={() => updateFormData({ isInHouse: true, isRejected: false })}
                disabled={!isStepEnabled(4)}
              />
              院内対応
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="inHouse"
                checked={!formData.isInHouse && !formData.isRejected}
                onChange={() => updateFormData({ isInHouse: false, isRejected: false })}
                disabled={!isStepEnabled(4)}
              />
              外部発注
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.error }}>
              <input
                type="radio"
                name="inHouse"
                checked={formData.isRejected}
                onChange={() => updateFormData({ isInHouse: false, isRejected: true })}
                disabled={!isStepEnabled(4)}
              />
              申請却下・修理不能
            </label>
          </FormRow>

          {!formData.isInHouse && !formData.isRejected && (
            <FormRow>
              <span style={labelStyle}>発注先</span>
              <input
                type="text"
                value={formData.orderVendorName}
                onChange={(e) => updateFormData({ orderVendorName: e.target.value })}
                placeholder="業者名"
                {...getInputProps(4)}
                style={{ ...getInputProps(4).style, width: '150px' }}
              />
              <input
                type="text"
                value={formData.orderVendorPerson}
                onChange={(e) => updateFormData({ orderVendorPerson: e.target.value })}
                placeholder="担当者"
                {...getInputProps(4)}
                style={{ ...getInputProps(4).style, width: '120px' }}
              />
              <input
                type="email"
                value={formData.orderVendorEmail}
                onChange={(e) => updateFormData({ orderVendorEmail: e.target.value })}
                placeholder="email"
                {...getInputProps(4)}
                style={{ ...getInputProps(4).style, width: '180px' }}
              />
              <input
                type="tel"
                value={formData.orderVendorContact}
                onChange={(e) => updateFormData({ orderVendorContact: e.target.value })}
                placeholder="連絡先"
                {...getInputProps(4)}
                style={{ ...getInputProps(4).style, width: '140px' }}
              />
            </FormRow>
          )}

          <FormRow>
            <span style={labelStyle}>商品引き取り</span>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="pickup"
                checked={formData.needsPickup}
                onChange={() => updateFormData({ needsPickup: true })}
                disabled={!isStepEnabled(4)}
              />
              必要
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="pickup"
                checked={!formData.needsPickup}
                onChange={() => updateFormData({ needsPickup: false })}
                disabled={!isStepEnabled(4)}
              />
              不要（出張修理等）
            </label>
            {formData.needsPickup && (
              <>
                <span style={{ color: COLORS.textMuted, fontSize: '12px', marginLeft: '12px' }}>引き取り日:</span>
                <input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => updateFormData({ pickupDate: e.target.value })}
                  {...getInputProps(4)}
                  style={{ ...getInputProps(4).style, width: '150px' }}
                />
              </>
            )}
          </FormRow>

          <FormRow style={{ justifyContent: 'flex-start', gap: '12px', marginTop: '16px' }}>
            {formData.isInHouse ? (
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
                院内決済伺いを発行
              </button>
            ) : !formData.isRejected ? (
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
                発注書を発行
              </button>
            ) : null}
          </FormRow>
        </Section>

        {/* STEP5: 完了登録 */}
        <Section step={5} title="STEP5. 完了登録（修理報告書の登録）" accentColor="#e74c3c">
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

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingBottom: '24px' }}>
          <button
            className="repair-btn"
            onClick={handleBack}
            style={{
              padding: '12px 24px',
              background: COLORS.white,
              color: COLORS.textMuted,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ← 一覧に戻る
          </button>
        </div>
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
            background: COLORS.primary,
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>修理申請書プレビュー</span>
            {showPreview && (
              <div style={{ display: 'flex', gap: '8px' }}>
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
                  拡大
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
                  ダウンロード
                </button>
              </div>
            )}
          </div>
          {/* プレビューコンテンツ */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: '#f5f5f5',
            padding: showPreview ? '24px' : '0',
            display: showPreview ? 'block' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {showPreview ? (
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
            ) : (
              /* プレビュー未表示時のプレースホルダー */
              <div style={{
                textAlign: 'center',
                color: '#999',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '14px' }}>STEP1の「プレビュー」ボタンを押すと</div>
                <div style={{ fontSize: '14px' }}>修理申請書のプレビューが表示されます</div>
              </div>
            )}
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
