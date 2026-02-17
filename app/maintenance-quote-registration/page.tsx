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

// 登録済み見積の型
interface RegisteredQuotation {
  id: number;
  phase: '保守登録用見積' | '参考見積';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  registeredAt: string;
  // AI OCR取得データ
  quotationDate: string;
  registrationDate: string;
  businessRegistrationNo: string;
  vendorName: string;
  vendorPerson: string;
  totalAmount: number;
}

// 登録済みドキュメントの型
interface RegisteredDocument {
  id: number;
  documentType: '契約書' | 'その他（免責部品一覧など）点検';
  accountType: string;
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

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

  // 登録済み見積・ドキュメント
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);

  // プレビュータブ
  const [previewTab, setPreviewTab] = useState<1 | 2>(1);
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
    // sessionStorageから契約データを取得
    const storedData = sessionStorage.getItem('maintenanceContract');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const data: MaintenanceContract = {
          ...getMockContract(contractId),
          // sessionStorageからのデータをマッピング
          applicationDepartment: parsed.managementDepartment || '',
          contractGroupName: parsed.contractGroupName || '',
          vendorName: parsed.contractorName || '',
          vendorPerson: parsed.contractorPerson || '',
          itemName: parsed.item || '',
          maker: parsed.maker || '',
          maintenanceType: parsed.maintenanceType || 'フルメンテナンス',
        };
        setContract(data);
        setFormData({ ...data });
      } catch {
        const data = getMockContract(contractId);
        setContract(data);
        setFormData({ ...data });
      }
    } else {
      const data = getMockContract(contractId);
      setContract(data);
      setFormData({ ...data });
    }
  }, [contractId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!contract || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="保守契約管理" hideMenu={true} showBackButton={false} />
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
      router.push('/quotation-data-box/maintenance-contracts');
      setIsSubmitting(false);
    }, 500);
  };

  // 見積削除
  const handleQuotationDelete = (id: number) => {
    if (confirm('この見積を削除しますか？')) {
      setRegisteredQuotations(prev => prev.filter(q => q.id !== id));
      setPreviewQuotationIndex(null);
    }
  };

  // ドキュメント削除
  const handleDocumentDelete = (id: number) => {
    if (confirm('このドキュメントを削除しますか？')) {
      setRegisteredDocuments(prev => prev.filter(d => d.id !== id));
      setPreviewDocumentIndex(null);
    }
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
        title="保守契約管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/maintenance-contracts"
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
          {/* STEP1: 保守契約の登録 */}
          <Section
            step={1}
            title="STEP1. 保守契約の登録"
            accentColor="#3498db"
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* 基本情報: 申請部署 */}
                <tr>
                  <td style={{
                    width: '180px',
                    padding: '10px 12px',
                    background: '#6b7280',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    申請部署
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#f9fafb', color: COLORS.textPrimary }}>
                    {formData.applicationDepartment || '（未設定）'}
                  </td>
                </tr>

                {/* 基本情報: 保守契約グループ名 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#6b7280',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    保守契約グループ名
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#f9fafb', color: COLORS.textPrimary }}>
                    {formData.contractGroupName || '（未設定）'}
                  </td>
                </tr>

                {/* 保守種別 */}
                <tr>
                  <td style={{
                    width: '180px',
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    保守種別
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <select
                      value={formData.maintenanceType}
                      onChange={(e) => updateFormData({ maintenanceType: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '200px' }}
                    >
                      <option value="フルメンテナンス">フルメンテナンス</option>
                      <option value="定期点検">定期点検</option>
                      <option value="スポット対応">スポット対応</option>
                      <option value="POG契約">POG契約</option>
                    </select>
                  </td>
                </tr>

                {/* 見積書を登録 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'top',
                  }}>
                    見積書を登録
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
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
                            if (file) {
                              const fileName = file.name;
                              // AI OCR シミュレーション: 見積書から値を自動取得して登録
                              setTimeout(() => {
                                const ocrData = {
                                  quotationDate: '2026-02-01',
                                  registrationDate: '2026-02-15',
                                  businessRegistrationNo: 'T1234567890123',
                                  vendorName: 'フィリップス・ジャパン株式会社',
                                  vendorPerson: '山田 太郎',
                                  totalAmount: 1500000,
                                };
                                // 自動登録
                                const newQuotation: RegisteredQuotation = {
                                  id: Date.now(),
                                  phase: formData?.quotationPhase || '保守登録用見積',
                                  saveFormat: formData?.saveFormat || '未指定',
                                  fileName: fileName,
                                  registeredAt: new Date().toISOString(),
                                  ...ocrData,
                                };
                                setRegisteredQuotations(prev => [...prev, newQuotation]);
                                setPreviewTab(1);
                                alert(`見積書「${fileName}」をAI OCRで読み取り、登録しました。`);
                              }, 500);
                            }
                          }}
                          disabled={!isStepEnabled(1)}
                        />
                      </label>
                      <span style={{ fontSize: '13px', color: selectedQuotationFile ? COLORS.textPrimary : COLORS.textMuted }}>
                        {selectedQuotationFile || 'ファイルが選択されていません'}
                      </span>
                    </div>
                    {/* 見積フェーズ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                      <span style={{ color: COLORS.textMuted, minWidth: '80px' }}>見積フェーズ:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="quotationPhase"
                          checked={formData.quotationPhase === '保守登録用見積'}
                          onChange={() => updateFormData({ quotationPhase: '保守登録用見積' })}
                          disabled={!isStepEnabled(1)}
                        />
                        保守登録用見積
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="quotationPhase"
                          checked={formData.quotationPhase === '参考見積'}
                          onChange={() => updateFormData({ quotationPhase: '参考見積' })}
                          disabled={!isStepEnabled(1)}
                        />
                        参考見積
                      </label>
                    </div>
                    {/* 保存形式 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: COLORS.textMuted, minWidth: '80px' }}>保存形式:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="saveFormat"
                          checked={formData.saveFormat === '電子取引'}
                          onChange={() => updateFormData({ saveFormat: '電子取引' })}
                          disabled={!isStepEnabled(1)}
                        />
                        電子取引
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="saveFormat"
                          checked={formData.saveFormat === 'スキャナ保存'}
                          onChange={() => updateFormData({ saveFormat: 'スキャナ保存' })}
                          disabled={!isStepEnabled(1)}
                        />
                        スキャナ保存
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  </td>
                </tr>

                {/* AI OCR取得項目: 見積日 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    見積日
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="date"
                      value={formData.quotationDate}
                      onChange={(e) => updateFormData({ quotationDate: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '150px' }}
                    />
                  </td>
                </tr>

                {/* AI OCR取得項目: 登録日 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    登録日
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="date"
                      value={formData.registrationDate}
                      onChange={(e) => updateFormData({ registrationDate: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '150px' }}
                    />
                  </td>
                </tr>

                {/* AI OCR取得項目: 事業者登録番号 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    事業者登録番号
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="text"
                      placeholder="例: T1234567890123"
                      value={formData.businessRegistrationNo}
                      onChange={(e) => updateFormData({ businessRegistrationNo: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '200px' }}
                    />
                  </td>
                </tr>

                {/* AI OCR取得項目: 業者名 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    業者名
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="text"
                      placeholder="業者名を入力"
                      value={formData.vendorName}
                      onChange={(e) => updateFormData({ vendorName: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '300px' }}
                    />
                  </td>
                </tr>

                {/* AI OCR取得項目: 担当者 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    担当者
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="text"
                      placeholder="担当者名を入力"
                      value={formData.vendorPerson}
                      onChange={(e) => updateFormData({ vendorPerson: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{ ...inputStyle, width: '200px' }}
                    />
                  </td>
                </tr>

                {/* AI OCR取得項目: 見積金額 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#5a9bd5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    見積金額
                    <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal', opacity: 0.8 }}>※AI OCR</span>
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="0"
                        value={formData.totalAmount ? formData.totalAmount.toLocaleString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          const num = parseInt(value, 10);
                          updateFormData({ totalAmount: isNaN(num) ? 0 : num });
                        }}
                        disabled={!isStepEnabled(1)}
                        style={{ ...inputStyle, width: '150px', textAlign: 'right' }}
                      />
                      <span>円（税別）</span>
                    </div>
                  </td>
                </tr>

                {/* 契約期間 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    契約期間
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="date"
                        value={formData.contractPeriod.split('〜')[0]?.replace(/\//g, '-') || ''}
                        onChange={(e) => {
                          const start = e.target.value;
                          const end = formData.contractPeriod.split('〜')[1] || '';
                          updateFormData({ contractPeriod: `${start}〜${end}` });
                        }}
                        disabled={!isStepEnabled(1)}
                        style={{ ...inputStyle, width: '150px' }}
                      />
                      <span>〜</span>
                      <input
                        type="date"
                        value={formData.contractPeriod.split('〜')[1]?.replace(/\//g, '-') || ''}
                        onChange={(e) => {
                          const start = formData.contractPeriod.split('〜')[0] || '';
                          const end = e.target.value;
                          updateFormData({ contractPeriod: `${start}〜${end}` });
                        }}
                        disabled={!isStepEnabled(1)}
                        style={{ ...inputStyle, width: '150px' }}
                      />
                    </div>
                  </td>
                </tr>

                {/* 定期点検の有無・回数 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'top',
                  }}>
                    定期点検の有無・回数
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={formData.inspectionCountPerYear > 0}
                          onChange={(e) => updateFormData({ inspectionCountPerYear: e.target.checked ? 1 : 0 })}
                          disabled={!isStepEnabled(1)}
                        />
                        あり
                      </label>
                      {formData.inspectionCountPerYear > 0 && (
                        <>
                          <span>年</span>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={formData.inspectionCountPerYear}
                            onChange={(e) => updateFormData({ inspectionCountPerYear: parseInt(e.target.value, 10) || 0 })}
                            disabled={!isStepEnabled(1)}
                            style={{ ...inputStyle, width: '60px', textAlign: 'right' }}
                          />
                          <span>回</span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.warning }}>
                      ※複数資産で点検回数が異なる場合は明細から登録
                    </div>
                  </td>
                </tr>

                {/* 交換部品免責 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    交換部品免責
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={formData.exchangePartsExemption}
                          onChange={(e) => updateFormData({ exchangePartsExemption: e.target.checked })}
                          disabled={!isStepEnabled(1)}
                        />
                        あり
                      </label>
                      {formData.exchangePartsExemption && (
                        <>
                          <span>免責金額:</span>
                          <input
                            type="text"
                            placeholder="例: 50万円"
                            value={formData.exemptionAmount}
                            onChange={(e) => updateFormData({ exemptionAmount: e.target.value })}
                            disabled={!isStepEnabled(1)}
                            style={{ ...inputStyle, width: '120px' }}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* オンコール対応 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    オンコール対応
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={formData.onCallSupport}
                        onChange={(e) => updateFormData({ onCallSupport: e.target.checked })}
                        disabled={!isStepEnabled(1)}
                      />
                      あり
                    </label>
                  </td>
                </tr>

                {/* リモートメンテナンス */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    リモートメンテナンス
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={formData.remoteMaintenanceAvailable}
                        onChange={(e) => updateFormData({ remoteMaintenanceAvailable: e.target.checked })}
                        disabled={!isStepEnabled(1)}
                      />
                      あり
                    </label>
                  </td>
                </tr>

                {/* リモートメンテナンス IPアドレス */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    リモートメンテナンス<br />IPアドレス
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <input
                      type="text"
                      placeholder="例: 192.168.1.100"
                      value={formData.remoteMaintenanceIpAddress}
                      onChange={(e) => updateFormData({ remoteMaintenanceIpAddress: e.target.value })}
                      disabled={!isStepEnabled(1) || !formData.remoteMaintenanceAvailable}
                      style={{
                        ...inputStyle,
                        width: '200px',
                        background: formData.remoteMaintenanceAvailable ? '#fff' : COLORS.disabledBg,
                      }}
                    />
                  </td>
                </tr>

                {/* フリーコメント */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#4a6fa5',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'top',
                  }}>
                    フリーコメント
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <textarea
                      placeholder="備考・特記事項など"
                      value={formData.freeComment}
                      onChange={(e) => updateFormData({ freeComment: e.target.value })}
                      disabled={!isStepEnabled(1)}
                      style={{
                        ...inputStyle,
                        width: '100%',
                        minHeight: '80px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 仮登録ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* 添付ファイル */}
                <tr>
                  <td style={{
                    width: '180px',
                    padding: '10px 12px',
                    background: '#27ae60',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    添付ファイル
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            if (file) {
                              const fileName = file.name;
                              // 自動登録
                              const newDocument: RegisteredDocument = {
                                id: Date.now(),
                                documentType: formData?.documentType || '契約書',
                                accountType: formData?.accountType || '',
                                accountOther: formData?.accountOther,
                                fileName: fileName,
                                registeredAt: new Date().toISOString(),
                              };
                              setRegisteredDocuments(prev => [...prev, newDocument]);
                              setPreviewTab(2);
                              alert(`ドキュメント「${fileName}」を登録しました。`);
                            }
                          }}
                          disabled={!isStepEnabled(2)}
                        />
                      </label>
                      <span style={{ fontSize: '13px', color: selectedDocumentFile ? COLORS.textPrimary : COLORS.textMuted }}>
                        {selectedDocumentFile || 'ファイルが選択されていません'}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* ドキュメント種別 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#27ae60',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    ドキュメント種別
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === '契約書'}
                          onChange={() => updateFormData({ documentType: '契約書' })}
                          disabled={!isStepEnabled(2)}
                        />
                        契約書
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === 'その他（免責部品一覧など）点検'}
                          onChange={() => updateFormData({ documentType: 'その他（免責部品一覧など）点検' })}
                          disabled={!isStepEnabled(2)}
                        />
                        その他（免責部品一覧など）
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 勘定科目 */}
                <tr>
                  <td style={{
                    padding: '10px 12px',
                    background: '#27ae60',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #d1d5db',
                    verticalAlign: 'middle',
                  }}>
                    勘定科目
                  </td>
                  <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="accountType"
                          checked={formData.accountType === '○○○○○○○'}
                          onChange={() => updateFormData({ accountType: '○○○○○○○' })}
                          disabled={!isStepEnabled(2)}
                        />
                        ○○○○○○○
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          disabled={!isStepEnabled(2)}
                          style={{ ...inputStyle, width: '150px' }}
                        />
                        ）
                      </label>
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* 保守登録ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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

        {/* 右側: プレビューエリア（タブ付き） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: COLORS.surfaceAlt,
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.borderLight}`,
            background: previewTab === 1 ? '#5a9bd5' : '#27ae60',
            color: COLORS.textOnColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              {previewTab === 1 && (previewQuotationIndex !== null
                ? `見積プレビュー - ${registeredQuotations[previewQuotationIndex]?.fileName || ''}`
                : '登録済み見積一覧')}
              {previewTab === 2 && (previewDocumentIndex !== null
                ? `ドキュメントプレビュー - ${registeredDocuments[previewDocumentIndex]?.fileName || ''}`
                : '登録済みドキュメント一覧')}
            </h3>
          </div>

          {/* プレビューコンテンツ */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* STEP1: 見積一覧 */}
            {previewTab === 1 && previewQuotationIndex === null && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#5a9bd5' }}>
                  登録済み見積一覧
                </h4>
                {registeredQuotations.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#5a9bd5', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '80px' }}>フェーズ</th>
                        <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc', width: '100px' }}>金額</th>
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
                              fontSize: '10px',
                              background: q.phase === '保守登録用見積' ? '#e3f2fd' : '#fff8e1',
                              color: q.phase === '保守登録用見積' ? '#1565c0' : '#f57c00',
                            }}>
                              {q.phase === '保守登録用見積' ? '登録用' : '参考'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {q.totalAmount.toLocaleString()}円
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewQuotationIndex(idx)}
                              style={{
                                padding: '4px 8px',
                                background: '#5a9bd5',
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
                              onClick={() => handleQuotationDelete(q.id)}
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
                    <div>登録済みの見積はありません</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP1で見積を登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP1: 見積プレビュー（選択時） */}
            {previewTab === 1 && previewQuotationIndex !== null && registeredQuotations[previewQuotationIndex] && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
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
                  padding: '32px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {registeredQuotations[previewQuotationIndex].fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                    PDFプレビュー（モック）
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold', width: '120px' }}>見積フェーズ</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].phase}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>保存形式</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].saveFormat}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>見積日</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].quotationDate}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>業者名</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].vendorName}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>担当者</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].vendorPerson}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>事業者登録番号</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].businessRegistrationNo}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>見積金額</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', color: COLORS.primary }}>
                        {registeredQuotations[previewQuotationIndex].totalAmount.toLocaleString()}円（税別）
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>登録日時</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        {new Date(registeredQuotations[previewQuotationIndex].registeredAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* STEP2: ドキュメント一覧 */}
            {previewTab === 2 && previewDocumentIndex === null && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#27ae60' }}>
                  登録済みドキュメント一覧
                </h4>
                {registeredDocuments.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#27ae60', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc' }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', width: '100px' }}>種別</th>
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
                              fontSize: '10px',
                              background: d.documentType === '契約書' ? '#e8f5e9' : '#fff8e1',
                              color: d.documentType === '契約書' ? '#2e7d32' : '#f57c00',
                            }}>
                              {d.documentType === '契約書' ? '契約書' : 'その他'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewDocumentIndex(idx)}
                              style={{
                                padding: '4px 8px',
                                background: '#27ae60',
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
                              onClick={() => handleDocumentDelete(d.id)}
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
                    <div>登録済みのドキュメントはありません</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP2でドキュメントを登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP2: ドキュメントプレビュー（選択時） */}
            {previewTab === 2 && previewDocumentIndex !== null && registeredDocuments[previewDocumentIndex] && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
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
                  padding: '32px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {registeredDocuments[previewDocumentIndex].fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                    PDFプレビュー（モック）
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', background: '#27ae60', color: 'white', fontWeight: 'bold', width: '120px' }}>種別</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredDocuments[previewDocumentIndex].documentType}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#27ae60', color: 'white', fontWeight: 'bold' }}>勘定科目</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        {registeredDocuments[previewDocumentIndex].accountType}
                        {registeredDocuments[previewDocumentIndex].accountOther && ` (${registeredDocuments[previewDocumentIndex].accountOther})`}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#27ae60', color: 'white', fontWeight: 'bold' }}>登録日時</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        {new Date(registeredDocuments[previewDocumentIndex].registeredAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
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
          {[1, 2].map((step) => (
            <button
              key={step}
              onClick={() => {
                setPreviewTab(step as 1 | 2);
                if (step === 1) setPreviewQuotationIndex(null);
                if (step === 2) setPreviewDocumentIndex(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderBottom: '1px solid #ddd',
                background: previewTab === step
                  ? step === 1 ? '#5a9bd5' : '#27ae60'
                  : 'transparent',
                color: previewTab === step ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: previewTab === step ? 'bold' : 'normal',
                transition: 'all 0.2s',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                padding: '12px 0',
              }}
              title={step === 1 ? '見積一覧' : 'ドキュメント一覧'}
            >
              {step === 1 ? '見積' : 'Doc'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceQuoteRegistrationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header title="保守契約管理" hideMenu={true} showBackButton={false} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: COLORS.textMuted }}>読み込み中...</p>
        </div>
      </div>
    }>
      <MaintenanceQuoteRegistrationContent />
    </Suspense>
  );
}
