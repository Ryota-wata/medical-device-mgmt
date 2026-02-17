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
  { step: 1, label: '受付' },
  { step: 2, label: '見積登録' },
  { step: 3, label: '発注登録' },
  { step: 4, label: '検収登録' },
  { step: 5, label: '完了処理' },
];

// ステータス型
type DisposalStatus = '申請中' | '受付済' | '見積取得済' | '発注済' | '検収済';

// 登録済みドキュメントの型
interface RegisteredDocument {
  id: number;
  documentType: '見積書' | '発注書' | '検収書' | '廃棄証明書';
  fileName: string;
  registeredAt: string;
  step: 2 | 3 | 4 | 5;
  // 見積書用
  vendorName?: string;
  quotationPhase?: '発注用' | '参考';
  saveFormat?: '電子取引' | 'スキャナ保存' | '未指定';
}

// 見積入力フォームの型
interface QuotationFormData {
  phase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  vendorName: string;
}

// 廃棄申請データ型
interface DisposalApplication {
  id: string;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
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
  // 受付情報
  receptionComment: string;
  receptionDate: string;
  // 発注情報
  orderVendorName: string;
  orderDate: string;
  orderNo: string;
  // 検収情報
  acceptanceDate: string;
  acceptancePerson: string;
}

// モックデータ取得
const getMockApplication = (id: string): DisposalApplication => {
  const statusMap: Record<string, DisposalStatus> = {
    '1': '発注済',
    '2': '受付済',
    '3': '申請中',
    '4': '見積取得済',
    '5': '検収済',
  };

  return {
    id,
    applicationNo: `DSP-2026-${id.padStart(3, '0')}`,
    applicationDate: '2026-02-10',
    applicantName: '山田 太郎',
    applicantDepartment: 'ME室',
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
    status: statusMap[id] || '申請中',
    receptionComment: '',
    receptionDate: '',
    orderVendorName: '',
    orderDate: '',
    orderNo: '',
    acceptanceDate: '',
    acceptancePerson: '',
  };
};

// ステータスから初期ステップを取得
const getInitialStep = (status: DisposalStatus): number => {
  switch (status) {
    case '申請中': return 1;
    case '受付済': return 2;
    case '見積取得済': return 3;
    case '発注済': return 4;
    case '検収済': return 5;
    default: return 1;
  }
};

// 共通スタイル
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
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
        padding: '12px 16px',
        background: enabled ? accentColor : completed ? COLORS.success : COLORS.sectionHeader,
        color: COLORS.textOnColor,
        borderRadius: '6px 6px 0 0',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          fontSize: '13px',
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

function DisposalTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') || '3';

  const [application, setApplication] = useState<DisposalApplication | null>(null);
  const [formData, setFormData] = useState<DisposalApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');

  // 見積入力フォームの状態
  const [quotationForm, setQuotationForm] = useState<QuotationFormData>({
    phase: '発注用',
    saveFormat: '電子取引',
    vendorName: '',
  });

  // プレビュータブ用の状態（STEP2:見積書, STEP3:発注書, STEP4:検収書, STEP5:廃棄証明書）
  const [previewTab, setPreviewTab] = useState<2 | 3 | 4 | 5>(2);
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

  const updateFormData = (updates: Partial<DisposalApplication>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/disposal-management"
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

  // STEP1: 受付処理
  const handleStep1Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '受付済', receptionDate: new Date().toISOString().split('T')[0] } : prev);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP2: 見積登録
  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '見積取得済' } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP3: 発注登録
  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注済', orderVendorName: formData.orderVendorName, orderDate: formData.orderDate, orderNo: formData.orderNo } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP4: 検収登録
  const handleStep4Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '検収済', acceptanceDate: formData.acceptanceDate, acceptancePerson: formData.acceptancePerson } : prev);
      setCurrentStep(5);
      setIsSubmitting(false);
    }, 300);
  };

  // STEP5: 完了処理（タスククローズ、レコード削除）
  const handleStep5Complete = () => {
    if (confirm('廃棄タスクを完了し、このレコードを削除しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`廃棄タスク（${application.applicationNo}）が完了しました。\nレコードを削除し、一覧画面に戻ります。`);
        router.push('/quotation-data-box/disposal-management');
      }, 300);
    }
  };

  // ドキュメント追加
  const handleAddDocument = (documentType: RegisteredDocument['documentType'], step: 2 | 3 | 4 | 5) => {
    if (!selectedFileName) return;
    const newDoc: RegisteredDocument = {
      id: Date.now(),
      documentType,
      fileName: selectedFileName,
      registeredAt: new Date().toISOString(),
      step,
    };
    setRegisteredDocuments(prev => [...prev, newDoc]);
    setSelectedFileName('');
    setPreviewTab(step);
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
        backHref="/quotation-data-box/disposal-management"
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
          {/* STEP1: 受付 */}
          <Section
            step={1}
            title="STEP1. 受付"
            accentColor="#3498db"
            enabled={isStepEnabled(1)}
            completed={1 < activeStep}
          >
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                受付コメント
              </label>
              <textarea
                value={formData.receptionComment}
                onChange={(e) => updateFormData({ receptionComment: e.target.value })}
                placeholder="受付時のコメントを入力（任意）"
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                disabled={!isStepEnabled(1) || 1 < activeStep}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleStep1Complete}
                disabled={!isStepEnabled(1) || 1 < activeStep || isSubmitting}
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
                受付完了 → 見積登録へ
              </button>
            </div>
          </Section>

          {/* STEP2: 見積登録 */}
          <Section
            step={2}
            title="STEP2. 見積登録"
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
              廃棄業者から取得した見積をフェーズごとに登録してください。発注用見積は必須です。
            </div>

            {/* 登録済み見積一覧 */}
            {registeredDocuments.filter(d => d.step === 2).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: COLORS.textPrimary,
                  marginBottom: '8px',
                }}>
                  登録済み見積（{registeredDocuments.filter(d => d.step === 2).length}件）
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: COLORS.surfaceAlt }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>フェーズ</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>業者名</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>ファイル名</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>保存形式</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.filter(d => d.step === 2).map((q) => (
                        <tr key={q.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: q.quotationPhase === '発注用' ? '#e3f2fd' : '#f3e5f5',
                              color: q.quotationPhase === '発注用' ? '#1565c0' : '#7b1fa2',
                            }}>
                              {q.quotationPhase === '発注用' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', fontSize: '12px' }}>{q.vendorName || '-'}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px' }}>📄</span>
                              <span>{q.fileName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted }}>{q.saveFormat || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (confirm('この見積を削除しますか？')) {
                                  setRegisteredDocuments(prev => prev.filter(d => d.id !== q.id));
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

            {/* 見積入力フォーム（テーブル形式） */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: COLORS.textPrimary,
                marginBottom: '8px',
              }}>
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
                              if (file) {
                                setSelectedFileName(file.name);
                              }
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
                        value={quotationForm.vendorName}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, vendorName: e.target.value }))}
                        placeholder="廃棄業者名を入力"
                        disabled={!isStepEnabled(2) || 2 < activeStep}
                        style={{
                          ...inputStyle,
                          width: '300px',
                        }}
                      />
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
                            checked={quotationForm.phase === '発注用'}
                            onChange={() => setQuotationForm(prev => ({ ...prev, phase: '発注用' }))}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          発注登録用見積
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={quotationForm.phase === '参考'}
                            onChange={() => setQuotationForm(prev => ({ ...prev, phase: '参考' }))}
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="saveFormat"
                            checked={quotationForm.saveFormat === '電子取引'}
                            onChange={() => setQuotationForm(prev => ({ ...prev, saveFormat: '電子取引' }))}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          電子取引
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="saveFormat"
                            checked={quotationForm.saveFormat === 'スキャナ保存'}
                            onChange={() => setQuotationForm(prev => ({ ...prev, saveFormat: 'スキャナ保存' }))}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          スキャナ保存
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="saveFormat"
                            checked={quotationForm.saveFormat === '未指定'}
                            onChange={() => setQuotationForm(prev => ({ ...prev, saveFormat: '未指定' }))}
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                          />
                          未指定
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 登録ボタン */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  className="task-btn"
                  onClick={() => {
                    if (!selectedFileName) return;
                    const newDoc: RegisteredDocument = {
                      id: Date.now(),
                      documentType: '見積書',
                      fileName: selectedFileName,
                      registeredAt: new Date().toISOString(),
                      step: 2,
                      vendorName: quotationForm.vendorName,
                      quotationPhase: quotationForm.phase,
                      saveFormat: quotationForm.saveFormat,
                    };
                    setRegisteredDocuments(prev => [...prev, newDoc]);
                    setSelectedFileName('');
                    setQuotationForm({ phase: '発注用', saveFormat: '電子取引', vendorName: '' });
                    setPreviewTab(2);
                  }}
                  disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || 2 < activeStep}
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

            {/* STEP3へ進むボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
                見積登録完了 → 発注登録へ
              </button>
            </div>
          </Section>

          {/* STEP3: 発注登録 */}
          <Section
            step={3}
            title="STEP3. 発注登録"
            accentColor="#27ae60"
            enabled={isStepEnabled(3)}
            completed={3 < activeStep}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  発注先業者
                </label>
                <input
                  type="text"
                  value={formData.orderVendorName}
                  onChange={(e) => updateFormData({ orderVendorName: e.target.value })}
                  placeholder="業者名を入力"
                  style={inputStyle}
                  disabled={!isStepEnabled(3) || 3 < activeStep}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  発注番号
                </label>
                <input
                  type="text"
                  value={formData.orderNo}
                  onChange={(e) => updateFormData({ orderNo: e.target.value })}
                  placeholder="発注番号を入力"
                  style={inputStyle}
                  disabled={!isStepEnabled(3) || 3 < activeStep}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                発注日
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => updateFormData({ orderDate: e.target.value })}
                style={{ ...inputStyle, width: '180px' }}
                disabled={!isStepEnabled(3) || 3 < activeStep}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                発注書をアップロード
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFileName(file.name);
                  }}
                  style={{ flex: 1 }}
                  disabled={!isStepEnabled(3) || 3 < activeStep}
                />
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('発注書', 3)}
                  disabled={!selectedFileName || !isStepEnabled(3) || 3 < activeStep}
                  style={{
                    padding: '8px 16px',
                    background: selectedFileName ? '#27ae60' : COLORS.disabled,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFileName ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  登録
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleStep3Complete}
                disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                発注登録完了 → 検収登録へ
              </button>
            </div>
          </Section>

          {/* STEP4: 検収登録 */}
          <Section
            step={4}
            title="STEP4. 検収登録"
            accentColor="#e67e22"
            enabled={isStepEnabled(4)}
            completed={4 < activeStep}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  検収日
                </label>
                <input
                  type="date"
                  value={formData.acceptanceDate}
                  onChange={(e) => updateFormData({ acceptanceDate: e.target.value })}
                  style={inputStyle}
                  disabled={!isStepEnabled(4) || 4 < activeStep}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  検収担当者
                </label>
                <input
                  type="text"
                  value={formData.acceptancePerson}
                  onChange={(e) => updateFormData({ acceptancePerson: e.target.value })}
                  placeholder="担当者名を入力"
                  style={inputStyle}
                  disabled={!isStepEnabled(4) || 4 < activeStep}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                検収確認書をアップロード
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFileName(file.name);
                  }}
                  style={{ flex: 1 }}
                  disabled={!isStepEnabled(4) || 4 < activeStep}
                />
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('検収書', 4)}
                  disabled={!selectedFileName || !isStepEnabled(4) || 4 < activeStep}
                  style={{
                    padding: '8px 16px',
                    background: selectedFileName ? '#e67e22' : COLORS.disabled,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFileName ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  登録
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleStep4Complete}
                disabled={!isStepEnabled(4) || 4 < activeStep || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                検収登録完了 → 完了処理へ
              </button>
            </div>
          </Section>

          {/* STEP5: 完了処理 */}
          <Section
            step={5}
            title="STEP5. 完了処理"
            accentColor="#9b59b6"
            enabled={isStepEnabled(5)}
            completed={false}
          >
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                廃棄証明書・マニフェスト等をアップロード
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFileName(file.name);
                  }}
                  style={{ flex: 1 }}
                  disabled={!isStepEnabled(5)}
                />
                <button
                  className="task-btn"
                  onClick={() => handleAddDocument('廃棄証明書', 5)}
                  disabled={!selectedFileName || !isStepEnabled(5)}
                  style={{
                    padding: '8px 16px',
                    background: selectedFileName ? '#9b59b6' : COLORS.disabled,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFileName ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  登録
                </button>
              </div>
              <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>
                ※廃棄証明書、マニフェスト等の証跡をアップロードしてください
              </p>
            </div>

            {/* 登録済み証明書一覧 */}
            {registeredDocuments.filter(d => d.step === 5).length > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: COLORS.surfaceAlt, borderRadius: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>登録済み証明書:</p>
                {registeredDocuments.filter(d => d.step === 5).map(doc => (
                  <div key={doc.id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    📄 {doc.fileName}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              padding: '12px',
              background: '#fce4ec',
              borderRadius: '4px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#c2185b', margin: 0 }}>
                「廃棄完了」をクリックすると、この廃棄タスクは完了となり、一覧から削除されます。
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="task-btn"
                onClick={handleStep5Complete}
                disabled={!isStepEnabled(5) || isSubmitting}
                style={{
                  padding: '10px 24px',
                  background: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                廃棄完了（タスククローズ）
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
          {/* プレビューヘッダー */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.borderLight}`,
            background: previewTab === 2 ? '#2980b9' : previewTab === 3 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#9b59b6',
            color: COLORS.textOnColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              {previewDocumentIndex !== null
                ? `プレビュー - ${registeredDocuments.filter(d => d.step === previewTab)[previewDocumentIndex]?.fileName || ''}`
                : previewTab === 2 ? '見積書一覧' : previewTab === 3 ? '発注書一覧' : previewTab === 4 ? '検収書一覧' : '廃棄証明書一覧'}
            </h3>
          </div>

          {/* プレビューコンテンツ */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* ドキュメント一覧 */}
            {previewDocumentIndex === null && (() => {
              const docs = registeredDocuments.filter(d => d.step === previewTab);
              const tabLabel = previewTab === 2 ? '見積書' : previewTab === 3 ? '発注書' : previewTab === 4 ? '検収書' : '廃棄証明書';
              const tabColor = previewTab === 2 ? '#2980b9' : previewTab === 3 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#9b59b6';

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
                        {previewTab === 2 && 'STEP2で見積書を登録してください'}
                        {previewTab === 3 && 'STEP3で発注書を登録してください'}
                        {previewTab === 4 && 'STEP4で検収書を登録してください'}
                        {previewTab === 5 && 'STEP5で廃棄証明書を登録してください'}
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
              const tabColor = previewTab === 2 ? '#2980b9' : previewTab === 3 ? '#27ae60' : previewTab === 4 ? '#e67e22' : '#9b59b6';

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
          {([2, 3, 4, 5] as const).map((step) => {
            const tabColor = step === 2 ? '#2980b9' : step === 3 ? '#27ae60' : step === 4 ? '#e67e22' : '#9b59b6';
            const tabLabel = step === 2 ? '見積書' : step === 3 ? '発注書' : step === 4 ? '検収書' : '証明書';
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
                    color: 'white',
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

export default function DisposalTaskPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/disposal-management"
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
