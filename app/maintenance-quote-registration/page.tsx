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
  // ステップ別テーマカラー
  step1: '#7c3aed',  // 紫: 見積依頼
  step2: '#d97706',  // 琥珀: 見積登録
  step3: '#3498db',  // 青: 契約発注
  step4: '#27ae60',  // 緑: 完了登録
} as const;

/** 保守契約登録のステップ定義 */
const MAINTENANCE_STEPS = [
  { step: 1, label: '見積依頼', color: COLORS.step1 },
  { step: 2, label: '見積登録', color: COLORS.step2 },
  { step: 3, label: '契約発注', color: COLORS.step3 },
  { step: 4, label: '完了登録', color: COLORS.step4 },
];

// 依頼先業者
interface RfqVendor {
  id: number;
  vendorName: string;
  personInCharge: string;
  email: string;
  tel: string;
  isSent: boolean;
}

// 登録済み見積の型
interface RegisteredQuotation {
  id: number;
  phase: '発注登録用見積' | '参考見積';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  registeredAt: string;
  vendorName: string;
  personInCharge: string;
  quotationAmount: number;
  annualAmount: number;
}

// 登録済みドキュメントの型
interface RegisteredDocument {
  id: number;
  documentType: '契約書' | 'その他（免責部品一覧など）';
  accountType: string;
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

// 保守契約データ型
interface MaintenanceContract {
  id: string;
  // 受付部署
  applicationDepartment: string;
  applicationPerson: string;
  applicationContact: string;
  // 保守契約情報
  maintenanceNo: string;
  contractGroupName: string;
  contractType: string;
  contractTypeMemo: string;
  contractPeriodStart: string;
  contractPeriodEnd: string;
  contractReviewStartDate: string;
  // ご依頼事項
  rfqNote: string;
  // 完了登録用
  documentType: '契約書' | 'その他（免責部品一覧など）';
  accountType: string;
  accountOther: string;
  // 基本表示用
  itemName: string;
  maker: string;
  model: string;
  assetCount: number;
}

// モックデータ取得
const getMockContract = (id: string): MaintenanceContract => {
  return {
    id,
    applicationDepartment: 'ME室',
    applicationPerson: '佐藤 花子',
    applicationContact: '内線2346',
    maintenanceNo: `MC-2026-${id.padStart(4, '0')}`,
    contractGroupName: '',
    contractType: '',
    contractTypeMemo: 'フルメンテナンス',
    contractPeriodStart: '',
    contractPeriodEnd: '',
    contractReviewStartDate: '',
    rfqNote: '',
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

// テーブルラベルセルスタイル生成
const thCellStyle = (bg: string): React.CSSProperties => ({
  width: '180px',
  padding: '10px 12px',
  background: bg,
  color: '#fff',
  fontWeight: 'bold',
  border: '1px solid #d1d5db',
  verticalAlign: 'middle',
  fontSize: '13px',
});

const tdCellStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  background: '#fff',
  fontSize: '13px',
};

const readonlyTdStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  color: COLORS.textPrimary,
  fontSize: '13px',
};

function MaintenanceQuoteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractId = searchParams.get('id') || '1';

  const [formData, setFormData] = useState<MaintenanceContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP① 依頼先業者
  const [rfqVendors, setRfqVendors] = useState<RfqVendor[]>([
    { id: 1, vendorName: 'フィリップス・ジャパン', personInCharge: '田中 太郎', email: 'tanaka@philips.example.com', tel: '03-1234-5678', isSent: false },
    { id: 2, vendorName: '', personInCharge: '', email: '', tel: '', isSent: false },
    { id: 3, vendorName: '', personInCharge: '', email: '', tel: '', isSent: false },
  ]);

  // STEP② 見積登録
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [selectedQuotationFile, setSelectedQuotationFile] = useState<string>('');
  const [quotationPhase, setQuotationPhase] = useState<'発注登録用見積' | '参考見積'>('発注登録用見積');
  const [saveFormat, setSaveFormat] = useState<'電子取引' | 'スキャナ保存' | '未指定'>('未指定');
  const [selectedQuotationVendorId, setSelectedQuotationVendorId] = useState<number | ''>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  const [annualAmount, setAnnualAmount] = useState<string>('');

  // STEP④ ドキュメント
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);

  // プレビュータブ
  const [previewTab, setPreviewTab] = useState<number>(1);
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
    const storedData = sessionStorage.getItem('maintenanceContract');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const data: MaintenanceContract = {
          ...getMockContract(contractId),
          applicationDepartment: parsed.managementDepartment || 'ME室',
          contractGroupName: parsed.contractGroupName || '',
          contractType: parsed.contractType || '',
          itemName: parsed.item || '人工呼吸器',
          maker: parsed.maker || 'フィリップス',
        };
        setFormData({ ...data });
      } catch {
        setFormData({ ...getMockContract(contractId) });
      }
    } else {
      setFormData({ ...getMockContract(contractId) });
    }
  }, [contractId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!formData) {
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

  // 入力済み業者一覧（STEP②のドロップダウン用）
  const filledVendors = rfqVendors.filter(v => v.vendorName.trim() !== '');

  // === ステップ進行ハンドラ ===

  // STEP① → STEP②
  const handleStep1Complete = () => {
    const sentVendors = rfqVendors.filter(v => v.isSent);
    if (sentVendors.length === 0) {
      alert('少なくとも1社に見積依頼を送信してください。');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(2);
      setPreviewTab(2);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP① 申請を見送る
  const handleRejectApplication = () => {
    if (confirm('申請を見送りますか？この操作は元に戻せません。')) {
      alert('申請を見送りました。');
      router.push('/quotation-data-box/maintenance-contracts');
    }
  };

  // STEP② → STEP③
  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(3);
      setPreviewTab(3);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP③ → STEP④
  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(4);
      setPreviewTab(4);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP④ 保守登録（完了）
  const handleFinalComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('保守契約の登録が完了しました。');
      router.push('/quotation-data-box/maintenance-contracts');
      setIsSubmitting(false);
    }, 500);
  };

  // 依頼先テーブル操作
  const updateVendor = (id: number, updates: Partial<RfqVendor>) => {
    setRfqVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const handleSendRfq = (vendorId: number) => {
    const vendor = rfqVendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.vendorName.trim()) {
      alert('業者名を入力してください。');
      return;
    }
    if (confirm(`${vendor.vendorName} に見積依頼を送信しますか？`)) {
      updateVendor(vendorId, { isSent: true });
    }
  };

  // 見積登録
  const handleRegisterQuotation = () => {
    if (!selectedQuotationFile) return;
    const vendor = filledVendors.find(v => v.id === selectedQuotationVendorId);
    const newQuotation: RegisteredQuotation = {
      id: Date.now(),
      phase: quotationPhase,
      saveFormat,
      fileName: selectedQuotationFile,
      registeredAt: new Date().toISOString(),
      vendorName: vendor?.vendorName || '',
      personInCharge: vendor?.personInCharge || '',
      quotationAmount: parseInt(quotationAmount.replace(/,/g, ''), 10) || 0,
      annualAmount: parseInt(annualAmount.replace(/,/g, ''), 10) || 0,
    };
    setRegisteredQuotations(prev => [...prev, newQuotation]);
    setSelectedQuotationFile('');
    setQuotationAmount('');
    setAnnualAmount('');
    setSelectedQuotationVendorId('');
    setPreviewTab(2);
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
              background: item.step < activeStep ? COLORS.stepCompleted : item.step === activeStep ? item.color : COLORS.stepPending,
              color: item.step <= activeStep ? 'white' : COLORS.textMuted,
              border: item.step === activeStep ? `2px solid ${item.color}` : 'none',
            }}>
              {item.step < activeStep ? '✓' : item.step}
            </div>
            <span style={{
              fontSize: '11px',
              marginTop: '4px',
              color: item.step === activeStep ? item.color : item.step < activeStep ? COLORS.stepCompleted : COLORS.textMuted,
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
              margin: '0 8px',
              marginBottom: '18px',
              minWidth: '24px',
              maxWidth: '60px',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // 依頼先テーブルのヘッダー・セルスタイル
  const vendorThStyle: React.CSSProperties = {
    padding: '8px 10px',
    background: COLORS.step1,
    color: 'white',
    fontWeight: 600,
    fontSize: '12px',
    border: `1px solid ${COLORS.step1}`,
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };
  const vendorTdStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: '12px',
    verticalAlign: 'middle',
  };
  const vendorInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontSize: '12px',
    padding: '4px 8px',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  // 見積追加テーブルのスタイル
  const quoteThStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    color: 'white',
    padding: '10px 12px',
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'left',
    width: '120px',
    border: `1px solid ${bg}`,
    whiteSpace: 'nowrap',
    verticalAlign: 'top',
  });

  // プレビューエリア内のカラー取得
  const getPreviewColor = () => {
    if (previewTab <= 2) return '#5a9bd5';
    if (previewTab === 3) return COLORS.step3;
    return COLORS.step4;
  };

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
        <span><strong>保守No:</strong> {formData.maintenanceNo}</span>
        <span><strong>品目:</strong> {formData.itemName}</span>
        <span><strong>メーカー:</strong> {formData.maker}</span>
        <span><strong>型式:</strong> {formData.model}</span>
        <span><strong>対象台数:</strong> {formData.assetCount}台</span>
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

          {/* ===== STEP① 見積依頼 ===== */}
          <Section
            step={1}
            title="STEP①. 見積依頼"
            accentColor={COLORS.step1}
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            {/* ガイドテキスト */}
            <div style={{
              padding: '10px 14px',
              background: '#f5f3ff',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#5b21b6',
              lineHeight: 1.6,
            }}>
              業者を登録し見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
            </div>

            {/* 受付部署 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.step1,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  background: COLORS.warningBg,
                  border: `1px solid ${COLORS.warningBorder}`,
                  color: COLORS.warningText,
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>受付部署</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={thCellStyle(COLORS.sectionHeader)}>部署名</td>
                    <td style={readonlyTdStyle}>{formData.applicationDepartment || '（未設定）'}</td>
                  </tr>
                  <tr>
                    <td style={thCellStyle(COLORS.sectionHeader)}>担当者名</td>
                    <td style={readonlyTdStyle}>{formData.applicationPerson || '（未設定）'}</td>
                  </tr>
                  <tr>
                    <td style={thCellStyle(COLORS.sectionHeader)}>連絡先</td>
                    <td style={readonlyTdStyle}>{formData.applicationContact || '（未設定）'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 依頼先テーブル */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.step1,
                marginBottom: '8px',
              }}>
                依頼先
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...vendorThStyle, width: '30px', textAlign: 'center' }}>#</th>
                      <th style={vendorThStyle}>業者名</th>
                      <th style={vendorThStyle}>担当者</th>
                      <th style={vendorThStyle}>メール</th>
                      <th style={vendorThStyle}>連絡先</th>
                      <th style={{ ...vendorThStyle, textAlign: 'center', width: '160px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqVendors.map((vendor, idx) => (
                      <tr key={vendor.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...vendorTdStyle, textAlign: 'center', fontWeight: 'bold', color: COLORS.textMuted }}>
                          {idx + 1}
                        </td>
                        <td style={vendorTdStyle}>
                          <input
                            type="text"
                            value={vendor.vendorName}
                            onChange={(e) => updateVendor(vendor.id, { vendorName: e.target.value })}
                            placeholder="業者名"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            style={{
                              ...vendorInputStyle,
                              background: vendor.isSent ? COLORS.disabledBg : 'white',
                            }}
                          />
                        </td>
                        <td style={vendorTdStyle}>
                          <input
                            type="text"
                            value={vendor.personInCharge}
                            onChange={(e) => updateVendor(vendor.id, { personInCharge: e.target.value })}
                            placeholder="担当者"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            style={{
                              ...vendorInputStyle,
                              background: vendor.isSent ? COLORS.disabledBg : 'white',
                            }}
                          />
                        </td>
                        <td style={vendorTdStyle}>
                          <input
                            type="email"
                            value={vendor.email}
                            onChange={(e) => updateVendor(vendor.id, { email: e.target.value })}
                            placeholder="email@example.com"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            style={{
                              ...vendorInputStyle,
                              background: vendor.isSent ? COLORS.disabledBg : 'white',
                            }}
                          />
                        </td>
                        <td style={vendorTdStyle}>
                          <input
                            type="text"
                            value={vendor.tel}
                            onChange={(e) => updateVendor(vendor.id, { tel: e.target.value })}
                            placeholder="03-xxxx-xxxx"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            style={{
                              ...vendorInputStyle,
                              background: vendor.isSent ? COLORS.disabledBg : 'white',
                              width: '120px',
                            }}
                          />
                        </td>
                        <td style={{ ...vendorTdStyle, textAlign: 'center' }}>
                          {vendor.isSent ? (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: COLORS.successLight,
                              color: COLORS.success,
                            }}>
                              送信済
                            </span>
                          ) : vendor.vendorName.trim() ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                className="maintenance-btn"
                                onClick={() => setPreviewTab(1)}
                                style={{
                                  padding: '4px 10px',
                                  background: COLORS.surfaceAlt,
                                  color: COLORS.textPrimary,
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                プレビュー
                              </button>
                              <button
                                className="maintenance-btn"
                                onClick={() => handleSendRfq(vendor.id)}
                                disabled={!isStepEnabled(1)}
                                style={{
                                  padding: '4px 10px',
                                  background: COLORS.step1,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                }}
                              >
                                依頼送信
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ご依頼事項 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.step1,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  background: COLORS.warningBg,
                  border: `1px solid ${COLORS.warningBorder}`,
                  color: COLORS.warningText,
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>ご依頼事項</span>
              </div>
              <textarea
                placeholder="例：廃棄品の引取りをお願いします / 見積書を作成してください"
                value={formData.rfqNote}
                onChange={(e) => updateFormData({ rfqNote: e.target.value })}
                disabled={!isStepEnabled(1)}
                style={{
                  ...inputStyle,
                  width: '100%',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                className="maintenance-btn"
                onClick={handleRejectApplication}
                disabled={!isStepEnabled(1) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  color: COLORS.error,
                  border: `2px solid ${COLORS.error}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                申請を見送る
              </button>
              <button
                className="maintenance-btn"
                onClick={handleStep1Complete}
                disabled={!isStepEnabled(1) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.step1,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                見積依頼完了→STEP②へ
              </button>
            </div>
          </Section>

          {/* ===== STEP② 見積登録 ===== */}
          <Section
            step={2}
            title="STEP②. 見積登録"
            accentColor={COLORS.step2}
            enabled={isStepEnabled(2)}
            completed={2 < activeStep}
          >
            {/* ガイドテキスト */}
            <div style={{
              padding: '10px 14px',
              background: '#fffbeb',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#92400e',
              lineHeight: 1.6,
            }}>
              見積書をファイル選択して登録し、業者名と見積金額を入力してください。
            </div>

            {/* 見積を追加テーブル */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.step3,
                marginBottom: '8px',
              }}>
                見積を追加
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${COLORS.step3}` }}>
                <tbody>
                  {/* 添付ファイル */}
                  <tr>
                    <th style={quoteThStyle(COLORS.step3)}>添付ファイル</th>
                    <td style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.step3}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          padding: '6px 16px',
                          background: '#f5f5f5',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: isStepEnabled(2) ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          opacity: isStepEnabled(2) ? 1 : 0.6,
                        }}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!isStepEnabled(2)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedQuotationFile(file.name);
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ color: selectedQuotationFile ? COLORS.success : '#666', fontSize: '13px' }}>
                          {selectedQuotationFile || 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* 業者名（STEP①から自動） */}
                  <tr>
                    <th style={quoteThStyle(COLORS.step3)}>業者名</th>
                    <td style={{ background: '#f9fafb', padding: '10px 12px', border: `1px solid ${COLORS.step3}`, color: COLORS.textMuted, fontSize: '13px' }}>
                      {filledVendors.length > 0
                        ? filledVendors.map(v => v.vendorName).join('、')
                        : '（STEP①で業者を登録してください）'
                      }
                    </td>
                  </tr>
                  {/* 見積フェーズ */}
                  <tr>
                    <th style={quoteThStyle(COLORS.step3)}>見積フェーズ</th>
                    <td style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.step3}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={quotationPhase === '発注登録用見積'}
                            onChange={() => setQuotationPhase('発注登録用見積')}
                            disabled={!isStepEnabled(2)}
                          />
                          発注登録用見積
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={quotationPhase === '参考見積'}
                            onChange={() => setQuotationPhase('参考見積')}
                            disabled={!isStepEnabled(2)}
                          />
                          参考見積
                        </label>
                      </div>
                    </td>
                  </tr>
                  {/* 保存形式 */}
                  <tr>
                    <th style={quoteThStyle(COLORS.step3)}>保存形式</th>
                    <td style={{ background: 'white', padding: '10px 12px', border: `1px solid ${COLORS.step3}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(['電子取引', 'スキャナ保存', '未指定'] as const).map(fmt => (
                          <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="saveFormat"
                              checked={saveFormat === fmt}
                              onChange={() => setSaveFormat(fmt)}
                              disabled={!isStepEnabled(2)}
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

            {/* 見積登録業者セクション */}
            <div style={{
              marginBottom: '20px',
              border: `2px solid ${COLORS.step2}`,
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.step2,
                marginBottom: '12px',
              }}>
                見積登録業者
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 業者名ドロップダウン */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '80px' }}>業者名</label>
                  <select
                    value={selectedQuotationVendorId}
                    onChange={(e) => setSelectedQuotationVendorId(e.target.value ? parseInt(e.target.value, 10) : '')}
                    disabled={!isStepEnabled(2)}
                    style={{ ...inputStyle, width: '250px' }}
                  >
                    <option value="">選択してください</option>
                    {filledVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendorName}</option>
                    ))}
                  </select>
                  {selectedQuotationVendorId && (
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                      担当: {filledVendors.find(v => v.id === selectedQuotationVendorId)?.personInCharge || '-'}
                    </span>
                  )}
                </div>
                {/* 見積金額 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '80px' }}>見積金額</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px' }}>¥</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(e.target.value)}
                      disabled={!isStepEnabled(2)}
                      style={{ ...inputStyle, width: '160px', textAlign: 'right' }}
                      className="tabular-nums"
                    />
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>（税別）</span>
                  </div>
                </div>
                {/* 単年度金額 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '80px' }}>単年度金額</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px' }}>¥</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={annualAmount}
                      onChange={(e) => setAnnualAmount(e.target.value)}
                      disabled={!isStepEnabled(2)}
                      style={{
                        ...inputStyle,
                        width: '160px',
                        textAlign: 'right',
                        background: '#fffbeb',
                        borderColor: COLORS.step2,
                      }}
                      className="tabular-nums"
                    />
                  </div>
                </div>
                {/* 見積を登録ボタン */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="maintenance-btn"
                    onClick={handleRegisterQuotation}
                    disabled={!isStepEnabled(2) || !selectedQuotationFile}
                    style={{
                      padding: '8px 20px',
                      background: selectedQuotationFile ? COLORS.step2 : COLORS.disabled,
                      color: COLORS.textOnColor,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedQuotationFile ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    見積を登録
                  </button>
                </div>
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
                              background: q.phase === '発注登録用見積' ? '#e3f2fd' : '#f3e5f5',
                              color: q.phase === '発注登録用見積' ? '#1565c0' : '#7b1fa2',
                            }}>
                              {q.phase === '発注登録用見積' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td style={{ padding: '8px' }}>{q.vendorName || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }} className="tabular-nums">
                            {q.quotationAmount > 0 ? `¥${q.quotationAmount.toLocaleString()}` : '-'}
                          </td>
                          <td style={{ padding: '8px' }}>{q.fileName}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleQuotationDelete(q.id)}
                              disabled={!isStepEnabled(2)}
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

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="maintenance-btn"
                onClick={handleStep2Complete}
                disabled={!isStepEnabled(2) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.step2,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                見積登録完了→STEP③へ
              </button>
            </div>
          </Section>

          {/* ===== STEP③ 契約発注 ===== */}
          <Section
            step={3}
            title="STEP③. 契約発注"
            accentColor={COLORS.step3}
            enabled={isStepEnabled(3)}
            completed={3 < activeStep}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* 契約グループ（読み取り専用） */}
                <tr>
                  <td style={thCellStyle(COLORS.sectionHeader)}>契約グループ</td>
                  <td style={readonlyTdStyle}>{formData.contractGroupName || '（未設定）'}</td>
                </tr>
                {/* 契約種別（読み取り専用） */}
                <tr>
                  <td style={thCellStyle(COLORS.sectionHeader)}>契約種別</td>
                  <td style={readonlyTdStyle}>{formData.contractType || '（未設定）'}</td>
                </tr>
                {/* 種別備考 */}
                <tr>
                  <td style={thCellStyle(COLORS.step3)}>種別備考</td>
                  <td style={tdCellStyle}>
                    <select
                      value={formData.contractTypeMemo}
                      onChange={(e) => updateFormData({ contractTypeMemo: e.target.value })}
                      disabled={!isStepEnabled(3)}
                      style={{ ...inputStyle, width: '200px' }}
                    >
                      <option value="フルメンテナンス">フルメンテナンス</option>
                      <option value="定期点検">定期点検</option>
                      <option value="スポット対応">スポット対応</option>
                      <option value="POG契約">POG契約</option>
                    </select>
                  </td>
                </tr>
                {/* 契約期間 */}
                <tr>
                  <td style={thCellStyle(COLORS.step3)}>契約期間</td>
                  <td style={tdCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="date"
                        value={formData.contractPeriodStart}
                        onChange={(e) => updateFormData({ contractPeriodStart: e.target.value })}
                        disabled={!isStepEnabled(3)}
                        style={{ ...inputStyle, width: '160px' }}
                      />
                      <span>〜</span>
                      <input
                        type="date"
                        value={formData.contractPeriodEnd}
                        onChange={(e) => updateFormData({ contractPeriodEnd: e.target.value })}
                        disabled={!isStepEnabled(3)}
                        style={{ ...inputStyle, width: '160px' }}
                      />
                    </div>
                  </td>
                </tr>
                {/* 契約検討開始 */}
                <tr>
                  <td style={thCellStyle(COLORS.step3)}>契約検討開始</td>
                  <td style={tdCellStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="date"
                        value={formData.contractReviewStartDate}
                        onChange={(e) => updateFormData({ contractReviewStartDate: e.target.value })}
                        disabled={!isStepEnabled(3)}
                        style={{ ...inputStyle, width: '160px' }}
                      />
                      <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                        ※本契約期間終了前など任意で保守などの検討開始時期を登録できます
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="maintenance-btn"
                onClick={handleStep3Complete}
                disabled={!isStepEnabled(3) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.step3,
                  color: COLORS.textOnColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                契約発注完了→STEP④へ
              </button>
            </div>
          </Section>

          {/* ===== STEP④ 完了登録（添付ドキュメントの登録） ===== */}
          <Section
            step={4}
            title="STEP④. 完了登録（添付ドキュメントの登録）"
            accentColor={COLORS.step4}
            enabled={isStepEnabled(4)}
            completed={4 < activeStep}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {/* 添付ファイル */}
                <tr>
                  <td style={thCellStyle(COLORS.step4)}>添付ファイル</td>
                  <td style={tdCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        padding: '6px 16px',
                        background: COLORS.surfaceAlt,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '4px',
                        cursor: isStepEnabled(4) ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        opacity: isStepEnabled(4) ? 1 : 0.6,
                      }}>
                        ファイルの選択
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const newDocument: RegisteredDocument = {
                                id: Date.now(),
                                documentType: formData.documentType,
                                accountType: formData.accountType,
                                accountOther: formData.accountOther,
                                fileName: file.name,
                                registeredAt: new Date().toISOString(),
                              };
                              setRegisteredDocuments(prev => [...prev, newDocument]);
                              setPreviewTab(4);
                              alert(`ドキュメント「${file.name}」を登録しました。`);
                            }
                          }}
                          disabled={!isStepEnabled(4)}
                        />
                      </label>
                      <span style={{ fontSize: '13px', color: COLORS.textMuted }}>
                        ファイルが選択されていません
                      </span>
                    </div>
                  </td>
                </tr>
                {/* ドキュメント種別 */}
                <tr>
                  <td style={thCellStyle(COLORS.step4)}>ドキュメント種別</td>
                  <td style={tdCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === '契約書'}
                          onChange={() => updateFormData({ documentType: '契約書' })}
                          disabled={!isStepEnabled(4)}
                        />
                        契約書
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === 'その他（免責部品一覧など）'}
                          onChange={() => updateFormData({ documentType: 'その他（免責部品一覧など）' })}
                          disabled={!isStepEnabled(4)}
                        />
                        その他（免責部品一覧など）
                      </label>
                    </div>
                  </td>
                </tr>
                {/* 勘定科目 */}
                <tr>
                  <td style={thCellStyle(COLORS.step4)}>勘定科目</td>
                  <td style={tdCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="accountType"
                          checked={formData.accountType === '○○○○○○○'}
                          onChange={() => updateFormData({ accountType: '○○○○○○○' })}
                          disabled={!isStepEnabled(4)}
                        />
                        ○○○○○○○
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="accountType"
                          checked={formData.accountType === 'その他'}
                          onChange={() => updateFormData({ accountType: 'その他' })}
                          disabled={!isStepEnabled(4)}
                        />
                        その他（
                        <input
                          type="text"
                          value={formData.accountOther}
                          onChange={(e) => updateFormData({ accountOther: e.target.value })}
                          disabled={!isStepEnabled(4)}
                          style={{ ...inputStyle, width: '150px' }}
                        />
                        ）
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                className="maintenance-btn"
                disabled={!isStepEnabled(4) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  color: COLORS.step2,
                  border: `2px solid ${COLORS.step2}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                明細の登録
              </button>
              <button
                className="maintenance-btn"
                onClick={handleFinalComplete}
                disabled={!isStepEnabled(4) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: COLORS.step2,
                  color: COLORS.textOnColor,
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
          overflow: 'hidden',
          background: COLORS.surfaceAlt,
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.borderLight}`,
            background: getPreviewColor(),
            color: COLORS.textOnColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              {previewTab === 1 && '見積依頼書プレビュー'}
              {previewTab === 2 && (previewQuotationIndex !== null
                ? `見積プレビュー - ${registeredQuotations[previewQuotationIndex]?.fileName || ''}`
                : '登録済み見積一覧')}
              {previewTab === 3 && '契約情報プレビュー'}
              {previewTab === 4 && (previewDocumentIndex !== null
                ? `ドキュメントプレビュー - ${registeredDocuments[previewDocumentIndex]?.fileName || ''}`
                : '登録済みドキュメント一覧')}
            </h3>
          </div>

          {/* プレビューコンテンツ */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* STEP①: 見積依頼書プレビュー */}
            {previewTab === 1 && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '24px',
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: COLORS.step1, textAlign: 'center' }}>
                  見積依頼書
                </h4>
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ marginBottom: '8px' }}><strong>保守No:</strong> {formData.maintenanceNo}</div>
                  <div style={{ marginBottom: '8px' }}><strong>品目:</strong> {formData.itemName}</div>
                  <div style={{ marginBottom: '8px' }}><strong>メーカー:</strong> {formData.maker}</div>
                  <div><strong>対象台数:</strong> {formData.assetCount}台</div>
                </div>
                <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: COLORS.step1 }}>受付部署</div>
                  <div>{formData.applicationDepartment} / {formData.applicationPerson} / {formData.applicationContact}</div>
                </div>
                {formData.rfqNote && (
                  <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '4px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: COLORS.warningText }}>ご依頼事項</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{formData.rfqNote}</div>
                  </div>
                )}
                {!formData.rfqNote && (
                  <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '16px', fontSize: '13px' }}>
                    ご依頼事項が入力されるとここに表示されます
                  </div>
                )}
              </div>
            )}

            {/* STEP②: 見積一覧 */}
            {previewTab === 2 && previewQuotationIndex === null && (
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
                        <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ccc', width: '150px' }}>業者名</th>
                        <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc', width: '120px' }}>見積金額</th>
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
                              background: q.phase === '発注登録用見積' ? '#e3f2fd' : '#fff8e1',
                              color: q.phase === '発注登録用見積' ? '#1565c0' : '#f57c00',
                            }}>
                              {q.phase === '発注登録用見積' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ccc' }}>{q.vendorName || '-'}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }} className="tabular-nums">
                            {q.quotationAmount > 0 ? `¥${q.quotationAmount.toLocaleString()}` : '-'}
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
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP②で見積を登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP②: 見積プレビュー（選択時） */}
            {previewTab === 2 && previewQuotationIndex !== null && registeredQuotations[previewQuotationIndex] && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{ marginBottom: '16px' }}>
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
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>業者名</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].vendorName || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>見積金額</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }} className="tabular-nums">
                        {registeredQuotations[previewQuotationIndex].quotationAmount > 0
                          ? `¥${registeredQuotations[previewQuotationIndex].quotationAmount.toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: '#5a9bd5', color: 'white', fontWeight: 'bold' }}>保存形式</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredQuotations[previewQuotationIndex].saveFormat}</td>
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

            {/* STEP③: 契約情報プレビュー */}
            {previewTab === 3 && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '24px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: COLORS.step3 }}>
                  契約情報サマリー
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold', width: '140px' }}>保守No</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{formData.maintenanceNo}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold' }}>契約グループ</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{formData.contractGroupName || '（未設定）'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold' }}>種別備考</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{formData.contractTypeMemo}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold' }}>契約期間</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                        {formData.contractPeriodStart && formData.contractPeriodEnd
                          ? `${formData.contractPeriodStart} 〜 ${formData.contractPeriodEnd}`
                          : '（未設定）'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold' }}>契約検討開始</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{formData.contractReviewStartDate || '（未設定）'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', background: COLORS.step3, color: 'white', fontWeight: 'bold' }}>登録見積数</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{registeredQuotations.length}件</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* STEP④: ドキュメント一覧 */}
            {previewTab === 4 && previewDocumentIndex === null && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: COLORS.step4 }}>
                  登録済みドキュメント一覧
                </h4>
                {registeredDocuments.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: COLORS.step4, color: 'white' }}>
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
                                background: COLORS.step4,
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
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>STEP④でドキュメントを登録してください</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP④: ドキュメントプレビュー（選択時） */}
            {previewTab === 4 && previewDocumentIndex !== null && registeredDocuments[previewDocumentIndex] && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{ marginBottom: '16px' }}>
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
                      <td style={{ padding: '8px', background: COLORS.step4, color: 'white', fontWeight: 'bold', width: '120px' }}>種別</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{registeredDocuments[previewDocumentIndex].documentType}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: COLORS.step4, color: 'white', fontWeight: 'bold' }}>勘定科目</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        {registeredDocuments[previewDocumentIndex].accountType}
                        {registeredDocuments[previewDocumentIndex].accountOther && ` (${registeredDocuments[previewDocumentIndex].accountOther})`}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', background: COLORS.step4, color: 'white', fontWeight: 'bold' }}>登録日時</td>
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
          {MAINTENANCE_STEPS.map((item) => (
            <button
              key={item.step}
              onClick={() => {
                setPreviewTab(item.step);
                if (item.step !== 2) setPreviewQuotationIndex(null);
                if (item.step !== 4) setPreviewDocumentIndex(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderBottom: '1px solid #ddd',
                background: previewTab === item.step ? item.color : 'transparent',
                color: previewTab === item.step ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: previewTab === item.step ? 'bold' : 'normal',
                transition: 'all 0.2s',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                padding: '12px 0',
              }}
              title={item.label}
            >
              {item.label}
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
