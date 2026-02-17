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

/** 保守契約登録のステップ定義 */
const MAINTENANCE_STEPS = [
  { step: 1, label: '保守申請の受付' },
  { step: 2, label: '完了登録' },
];

// 保守契約データ型
interface MaintenanceContract {
  id: string;
  // 申請情報
  applicationDepartment: string;
  applicationPerson: string;
  applicationContact: string;
  // 保守契約情報
  maintenanceNo: string;
  contractGroupName: string;
  contractPeriod: string;
  maintenanceType: string;
  // 添付ファイル（見積）
  quotationFile: string;
  quotationPhase: '保守登録用見積' | '参考見積';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  quotationDate: string;
  registrationDate: string;
  businessRegistrationNo: string;
  vendorName: string;
  vendorPerson: string;
  // 合計金額
  totalAmount: number;
  // 契約期限
  contractEndDate: string;
  // 契約詳細
  inspectionCountPerYear: number;
  isCompensated: boolean;
  compensationAmount: string;
  exchangePartsExemption: boolean;
  exemptionAmount: string;
  onCallSupport: boolean;
  remoteMaintenanceAvailable: boolean;
  remoteMaintenanceIpAddress: string;
  freeComment: string;
  // 完了登録用
  documentFile: string;
  documentType: '契約書' | 'その他（免責部品一覧など）点検';
  accountType: string;
  accountOther: string;
  // 機器情報
  itemName: string;
  maker: string;
  model: string;
  assetCount: number;
}

// モックデータ取得
const getMockContract = (id: string): MaintenanceContract => {
  return {
    id,
    applicationDepartment: '',
    applicationPerson: '',
    applicationContact: '',
    maintenanceNo: `MC-2026-${id.padStart(4, '0')}`,
    contractGroupName: '',
    contractPeriod: '',
    maintenanceType: 'フルメンテナンス',
    quotationFile: '',
    quotationPhase: '保守登録用見積',
    saveFormat: '未指定',
    quotationDate: '',
    registrationDate: '',
    businessRegistrationNo: '',
    vendorName: '',
    vendorPerson: '',
    totalAmount: 0,
    contractEndDate: '',
    inspectionCountPerYear: 0,
    isCompensated: false,
    compensationAmount: '',
    exchangePartsExemption: false,
    exemptionAmount: '',
    onCallSupport: false,
    remoteMaintenanceAvailable: false,
    remoteMaintenanceIpAddress: '',
    freeComment: '',
    documentFile: '',
    documentType: '契約書',
    accountType: '',
    accountOther: '',
    itemName: '人工呼吸器',
    maker: 'フィリップス',
    model: 'V680',
    assetCount: 2,
  };
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
  whiteSpace: 'nowrap',
  minWidth: '100px',
  background: '#4a6fa5',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: '4px 0 0 4px',
};

const fieldContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '12px',
};

const inputContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderLeft: 'none',
  borderRadius: '0 4px 4px 0',
  background: COLORS.white,
};

// セクションコンポーネント
const Section = ({
  step,
  title,
  children,
  accentColor = COLORS.primary,
  enabled,
  completed,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
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
        {enabled && !completed && (
          <span style={{
            fontSize: '11px',
            background: 'rgba(255,255,255,0.3)',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            作業中
          </span>
        )}
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

function MaintenanceQuoteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractId = searchParams.get('id') || '1';

  const [contract, setContract] = useState<MaintenanceContract | null>(null);
  const [formData, setFormData] = useState<MaintenanceContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedQuotationFile, setSelectedQuotationFile] = useState<string>('');
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<string>('');

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
    const data = getMockContract(contractId);
    setContract(data);
    setFormData({ ...data });
  }, [contractId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!contract || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="保守契約 見積登録" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<MaintenanceContract>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const getInputProps = (step: number) => {
    const enabled = isStepEnabled(step);
    return {
      style: enabled ? inputStyle : disabledInputStyle,
      disabled: !enabled,
    };
  };

  // STEP1: 仮登録
  const handleStep1Submit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('STEP1の仮登録が完了しました。STEP2へ進みます。');
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 500);
  };

  // STEP2: 保守登録（完了）
  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('保守契約の登録が完了しました。');
      router.push('/quotation-data-box?tab=maintenance-contracts');
      setIsSubmitting(false);
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
      {MAINTENANCE_STEPS.map((item, index) => (
        <React.Fragment key={item.step}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '100px',
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
          {index < MAINTENANCE_STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: '3px',
              background: item.step < activeStep ? COLORS.stepCompleted : COLORS.stepPending,
              margin: '0 16px',
              marginBottom: '18px',
              minWidth: '40px',
              maxWidth: '80px',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      <style>{`
        .maintenance-btn { transition: filter 150ms ease-out; }
        .maintenance-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .maintenance-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
        .maintenance-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <Header
        title="保守契約 見積登録"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box?tab=maintenance-contracts"
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
        <span><strong>保守No:</strong> {contract.maintenanceNo}</span>
        <span><strong>品目:</strong> {contract.itemName}</span>
        <span><strong>メーカー:</strong> {contract.maker}</span>
        <span><strong>型式:</strong> {contract.model}</span>
        <span><strong>対象台数:</strong> {contract.assetCount}台</span>
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
          {/* STEP1: 保守申請の受付 */}
          <Section
            step={1}
            title="STEP1. 保守申請の受付"
            accentColor="#3498db"
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            {/* 申請部署 */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>申請部署</span>
              <div style={inputContainerStyle}>
                <input
                  type="text"
                  placeholder="部署名"
                  value={formData.applicationDepartment}
                  onChange={(e) => updateFormData({ applicationDepartment: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
                <input
                  type="text"
                  placeholder="担当者名"
                  value={formData.applicationPerson}
                  onChange={(e) => updateFormData({ applicationPerson: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '120px' }}
                />
                <input
                  type="text"
                  placeholder="連絡先"
                  value={formData.applicationContact}
                  onChange={(e) => updateFormData({ applicationContact: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
              </div>
            </div>

            {/* 保守申請No */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>保守申請No</span>
              <div style={inputContainerStyle}>
                <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>{contract.maintenanceNo}</span>
                <span style={{ marginLeft: '24px', ...labelStyle, minWidth: 'auto', borderRadius: '4px' }}>保守契約グループ名</span>
                <input
                  type="text"
                  placeholder="グループ名を入力"
                  value={formData.contractGroupName}
                  onChange={(e) => updateFormData({ contractGroupName: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '180px' }}
                />
                <span style={{ marginLeft: '24px', ...labelStyle, minWidth: 'auto', borderRadius: '4px' }}>契約期間</span>
                <input
                  type="text"
                  placeholder="例: 2026/04/01〜2027/03/31"
                  value={formData.contractPeriod}
                  onChange={(e) => updateFormData({ contractPeriod: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '200px' }}
                />
                <span style={{
                  padding: '6px 12px',
                  background: COLORS.surfaceAlt,
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: COLORS.textPrimary,
                }}>
                  {formData.maintenanceType}
                </span>
              </div>
            </div>

            {/* 添付ファイル */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>添付ファイル</span>
              <div style={inputContainerStyle}>
                <label style={{
                  padding: '6px 16px',
                  background: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}>
                  ファイルの選択
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedQuotationFile(file.name);
                    }}
                    disabled={!isStepEnabled(1)}
                  />
                </label>
                <span style={{ fontSize: '13px', color: selectedQuotationFile ? COLORS.textPrimary : COLORS.textMuted }}>
                  {selectedQuotationFile || 'ファイルが選択されていません'}
                </span>
              </div>
            </div>

            {/* 見積フェーズ */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>見積フェーズ</span>
              <div style={inputContainerStyle}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="quotationPhase"
                    checked={formData.quotationPhase === '保守登録用見積'}
                    onChange={() => updateFormData({ quotationPhase: '保守登録用見積' })}
                    disabled={!isStepEnabled(1)}
                  />
                  保守登録用見積
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
                  <input
                    type="radio"
                    name="quotationPhase"
                    checked={formData.quotationPhase === '参考見積'}
                    onChange={() => updateFormData({ quotationPhase: '参考見積' })}
                    disabled={!isStepEnabled(1)}
                  />
                  参考見積
                </label>
                <span style={{ marginLeft: '24px', fontSize: '13px', color: COLORS.textMuted }}>保存形式 |</span>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={formData.saveFormat === '電子取引'}
                    onChange={() => updateFormData({ saveFormat: '電子取引' })}
                    disabled={!isStepEnabled(1)}
                  />
                  電子取引
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={formData.saveFormat === 'スキャナ保存'}
                    onChange={() => updateFormData({ saveFormat: 'スキャナ保存' })}
                    disabled={!isStepEnabled(1)}
                  />
                  スキャナ保存
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={formData.saveFormat === '未指定'}
                    onChange={() => updateFormData({ saveFormat: '未指定' })}
                    disabled={!isStepEnabled(1)}
                  />
                  未指定
                </label>
              </div>
            </div>

            {/* 見積日・登録日・事業者登録番号・業者名・担当者 */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>見積日</span>
              <div style={inputContainerStyle}>
                <input
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) => updateFormData({ quotationDate: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
                <span style={{ marginLeft: '16px', ...labelStyle, minWidth: 'auto', borderRadius: '4px' }}>登録日</span>
                <input
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => updateFormData({ registrationDate: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
                <span style={{ marginLeft: '16px', ...labelStyle, minWidth: 'auto', borderRadius: '4px' }}>事業者登録番号</span>
                <input
                  type="text"
                  placeholder="T0000000000000"
                  value={formData.businessRegistrationNo}
                  onChange={(e) => updateFormData({ businessRegistrationNo: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
              </div>
            </div>

            {/* 業者名・担当者 */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>業者名</span>
              <div style={inputContainerStyle}>
                <input
                  type="text"
                  placeholder="業者名"
                  value={formData.vendorName}
                  onChange={(e) => updateFormData({ vendorName: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '200px' }}
                />
                <span style={{ marginLeft: '16px', ...labelStyle, minWidth: 'auto', borderRadius: '4px' }}>担当者</span>
                <input
                  type="text"
                  placeholder="担当者名"
                  value={formData.vendorPerson}
                  onChange={(e) => updateFormData({ vendorPerson: e.target.value })}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px' }}
                />
              </div>
            </div>

            {/* 合計金額 */}
            <div style={fieldContainerStyle}>
              <span style={{ ...labelStyle, background: COLORS.accent }}>合計金額</span>
              <div style={inputContainerStyle}>
                <span style={{ fontSize: '13px', color: COLORS.textMuted }}>合計金額（税抜）</span>
                <span style={{ fontSize: '13px', marginRight: '4px' }}>¥</span>
                <input
                  type="text"
                  placeholder="0,000,000"
                  value={formData.totalAmount > 0 ? formData.totalAmount.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/,/g, ''), 10);
                    updateFormData({ totalAmount: isNaN(value) ? 0 : value });
                  }}
                  {...getInputProps(1)}
                  style={{ ...getInputProps(1).style, width: '150px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
            </div>

            {/* 契約期限を登録 */}
            <div style={{
              padding: '12px 16px',
              background: COLORS.surfaceAlt,
              borderRadius: '4px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>契約期限を登録</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px' }}>
                ・定期点検の有無：回数
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・途中解約「合意質」の場合は明細から登録</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・交換部品免責の有無・免責金額を登録</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・オンコール対応の有無</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・リモートメンテナンスの有無</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・リモートメンテナンス IPアドレス</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>・フリーコメント</span>
              </div>
            </div>

            {/* 仮登録ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="maintenance-btn"
                onClick={handleStep1Submit}
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
                仮登録
              </button>
            </div>
          </Section>

          {/* STEP2: 完了登録（添付ドキュメントの登録） */}
          <Section
            step={2}
            title="STEP2. 完了登録（添付ドキュメントの登録）"
            accentColor="#27ae60"
            enabled={isStepEnabled(2)}
            completed={2 < activeStep}
          >
            {/* 添付ファイル */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>添付ファイル</span>
              <div style={inputContainerStyle}>
                <label style={{
                  padding: '6px 16px',
                  background: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}>
                  ファイルの選択
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedDocumentFile(file.name);
                    }}
                    disabled={!isStepEnabled(2)}
                  />
                </label>
                <span style={{ fontSize: '13px', color: selectedDocumentFile ? COLORS.textPrimary : COLORS.textMuted }}>
                  {selectedDocumentFile || 'ファイルが選択されていません'}
                </span>
              </div>
            </div>

            {/* ドキュメント */}
            <div style={fieldContainerStyle}>
              <span style={labelStyle}>ドキュメント</span>
              <div style={inputContainerStyle}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="documentType"
                    checked={formData.documentType === '契約書'}
                    onChange={() => updateFormData({ documentType: '契約書' })}
                    disabled={!isStepEnabled(2)}
                  />
                  契約書
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
                  <input
                    type="radio"
                    name="documentType"
                    checked={formData.documentType === 'その他（免責部品一覧など）点検'}
                    onChange={() => updateFormData({ documentType: 'その他（免責部品一覧など）点検' })}
                    disabled={!isStepEnabled(2)}
                  />
                  その他（免責部品一覧など）点検
                </label>
              </div>
            </div>

            {/* 注意文言 */}
            <div style={{
              padding: '12px 16px',
              background: '#ffe0e0',
              borderRadius: '8px',
              marginBottom: '16px',
              marginLeft: '112px',
            }}>
              <div style={{ fontSize: '13px', color: '#c0392b', fontWeight: 'bold' }}>
                機器が廃棄された場合に契約内容の変更
              </div>
              <div style={{ fontSize: '13px', color: '#c0392b', fontWeight: 'bold' }}>
                覚書などのドキュメント追加
              </div>
            </div>

            {/* 勘定科目 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary }}>勘定科目</span>
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>|</span>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="accountType"
                  checked={formData.accountType === '○○○○○○○'}
                  onChange={() => updateFormData({ accountType: '○○○○○○○' })}
                  disabled={!isStepEnabled(2)}
                />
                ○○○○○○○
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="accountType"
                  checked={formData.accountType === 'その他'}
                  onChange={() => updateFormData({ accountType: 'その他' })}
                  disabled={!isStepEnabled(2)}
                />
                その他（
                <input
                  type="text"
                  placeholder=""
                  value={formData.accountOther}
                  onChange={(e) => updateFormData({ accountOther: e.target.value })}
                  {...getInputProps(2)}
                  style={{ ...getInputProps(2).style, width: '150px' }}
                />
                ）
              </label>
            </div>

            {/* 保守登録ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="maintenance-btn"
                onClick={handleStep2Complete}
                disabled={!isStepEnabled(2) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.warning,
                  color: COLORS.textPrimary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                保守登録
              </button>
            </div>
          </Section>
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
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: COLORS.border,
            borderRadius: '2px',
          }} />
        </div>

        {/* 右側: プレビューエリア */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          background: COLORS.surfaceAlt,
        }}>
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${COLORS.borderLight}`,
            background: COLORS.white,
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary }}>
              プレビュー
            </h3>
          </div>
          <div style={{ flex: 1, padding: '16px' }}>
            {selectedQuotationFile || selectedDocumentFile ? (
              <div style={{
                background: COLORS.white,
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                border: `1px solid ${COLORS.borderLight}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 'bold' }}>
                  {selectedDocumentFile || selectedQuotationFile}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' }}>
                  ファイルプレビュー（モック）
                </div>
              </div>
            ) : (
              <div style={{
                background: COLORS.white,
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                border: `2px dashed ${COLORS.borderLight}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                <div style={{ fontSize: '14px', color: COLORS.textMuted }}>
                  ファイルを選択するとプレビューが表示されます
                </div>
              </div>
            )}

            {/* 入力内容サマリー */}
            <div style={{
              marginTop: '24px',
              background: COLORS.white,
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid ${COLORS.borderLight}`,
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary }}>
                入力内容サマリー
              </h4>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted, width: '120px' }}>申請部署:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary }}>
                      {formData.applicationDepartment || '-'} / {formData.applicationPerson || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>契約グループ名:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary }}>{formData.contractGroupName || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>契約期間:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary }}>{formData.contractPeriod || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>保守種別:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary }}>{formData.maintenanceType}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>業者:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary }}>
                      {formData.vendorName || '-'} / {formData.vendorPerson || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>合計金額:</td>
                    <td style={{ padding: '6px 8px', color: COLORS.textPrimary, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                      {formData.totalAmount > 0 ? `¥${formData.totalAmount.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceQuoteRegistrationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="保守契約 見積登録" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
        </div>
      </div>
    }>
      <MaintenanceQuoteRegistrationContent />
    </Suspense>
  );
}
