'use client';

import React, { useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { Header } from '@/components/layouts/Header';

// ──────────────────────────────────────────────
// 全体ステップ定義
// ──────────────────────────────────────────────
const STEPS = [
  { num: 1, label: '見積情報入力' },
  { num: 2, label: 'OCR明細確認' },
  { num: 3, label: '登録区分登録' },
  { num: 4, label: '個体品目AI判定' },
  { num: 5, label: '個体登録,金額案分' },
  { num: 6, label: '登録確認' },
];

// ──────────────────────────────────────────────
// メインコンテンツ
// ──────────────────────────────────────────────
function RfqProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqGroupId = searchParams.get('rfqGroupId');

  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { getItemsByEditListId } = useEditListStore();

  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return null;
    return rfqGroups.find(g => g.id === Number(rfqGroupId)) || null;
  }, [rfqGroups, rfqGroupId]);

  // 編集リストの品目
  const editListItems = useMemo(() => {
    if (!rfqGroup?.editListId) return [];
    return getItemsByEditListId(rfqGroup.editListId);
  }, [rfqGroup, getItemsByEditListId]);

  // ── 基本情報フォーム ──
  const [vendorName, setVendorName] = useState(rfqGroup?.vendorName || '');
  const [personInCharge, setPersonInCharge] = useState(rfqGroup?.personInCharge || '');
  const [email, setEmail] = useState(rfqGroup?.email || '');
  const [tel, setTel] = useState(rfqGroup?.tel || '');
  const [submitDeadline, setSubmitDeadline] = useState(rfqGroup?.deadline || '');

  // ── 依頼事項 ──
  const [requestNote, setRequestNote] = useState('');

  // ── 見積登録フォーム ──
  const [quotationPhase, setQuotationPhase] = useState<'定価見積' | '概算見積' | '発注登録用見積'>('定価見積');
  const [saveFormat, setSaveFormat] = useState<'電子取引' | 'スキャナ保存' | '未指定'>('スキャナ保存');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // ── プレビュー表示 ──
  const [showPreview, setShowPreview] = useState(false);

  // ── パネル幅（ドラッグリサイズ） ──
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

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

  // ── PDF アップロード ──
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  // ── 「登録へ」→ OCR処理 → OCR確認画面へ ──
  const handleProceedToRegistration = () => {
    setOcrProcessing(true);
    setTimeout(() => {
      setOcrProcessing(false);
      router.push('/quotation-data-box/ocr-confirm');
    }, 1500);
  };

  // ── 「SHIPへ依頼」 ──
  const handleSendRfq = () => {
    if (!rfqGroup) return;
    updateRfqGroup(rfqGroup.id, {
      vendorName,
      personInCharge,
      email,
      tel,
      deadline: submitDeadline,
      status: '見積依頼済',
    });
    alert(`見積依頼 ${rfqGroup.rfqNo} をSHIPへ送信しました`);
    router.push('/quotation-data-box/purchase-management');
  };

  // ── 「タスク管理に戻る」 ──
  const handleCancel = () => {
    router.push('/quotation-data-box/purchase-management');
  };

  // ── Not Found ──
  if (!rfqGroup) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
        <Header title="見積依頼" showBackButton backHref="/quotation-data-box/purchase-management" backLabel="タスク管理に戻る" hideMenu />
        <div style={{ padding: '60px 40px', textAlign: 'center', color: '#7f8c8d' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>見積依頼グループが見つかりません</div>
          <div style={{ fontSize: '13px', marginBottom: '24px' }}>URLのパラメータを確認してください。</div>
          <button
            onClick={() => router.push('/quotation-data-box/purchase-management')}
            style={{ padding: '8px 24px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            タスク管理に戻る
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      {/* ===== ヘッダー ===== */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{
          background: '#3498db',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>SHIP</span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          見積依頼・見積登録
        </span>
        <span style={{
          background: '#e74c3c',
          padding: '2px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
        }}>STEP 1</span>
        <span style={{ fontSize: '12px', color: '#bdc3c7', marginLeft: '8px' }}>
          {rfqGroup.rfqNo} - {rfqGroup.groupName}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCancel}
          style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          タスク管理に戻る
        </button>
      </div>

      {/* ===== プログレスバー ===== */}
      <div style={{
        background: 'white',
        padding: '16px 32px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              {i > 0 && (
                <div style={{
                  height: '2px',
                  width: '64px',
                  background: step.num <= 1 ? '#3498db' : '#dee2e6',
                  marginTop: '13px',
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: step.num < 1 ? '#27ae60'
                    : step.num === 1 ? '#3498db'
                    : '#dee2e6',
                  color: step.num <= 1 ? 'white' : '#999',
                }}>
                  {step.num < 1 ? '✓' : step.num}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: step.num === 1 ? '#2c3e50' : step.num < 1 ? '#27ae60' : '#999',
                  whiteSpace: 'nowrap',
                  fontWeight: step.num === 1 ? 600 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ===== メインコンテンツ（STEP1: 見積情報入力）===== */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>

        {/* ── 左カラム ── */}
        <div style={{ width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '16px', gap: '16px' }}>

          {/* ========== セクション1: 見積依頼 ========== */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
            <div style={{ background: '#3498db', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}>
              見積依頼
            </div>

            {/* 黄色ガイダンス */}
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              margin: '12px',
              padding: '10px 16px',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#856404',
              fontWeight: 500,
            }}>
              業者を登録し見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
            </div>

            {/* ヘッダーラベル行 */}
            <div style={{ padding: '0 12px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ width: '44px' }} />
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>
                業者名 <span style={{ color: '#e74c3c' }}>*</span>
              </div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>担当者名</div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>
                メール <span style={{ color: '#e74c3c' }}>*</span>
              </div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>連絡先</div>
              <div style={{ width: '140px', fontSize: '12px', fontWeight: 600, color: '#555' }}>提出期限</div>
              <div style={{ width: '160px', fontSize: '12px', fontWeight: 600, color: '#555' }}>アクション</div>
            </div>

            {/* 入力行 */}
            <div style={{ padding: '0 12px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                background: '#f39c12',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                flexShrink: 0,
                width: '44px',
                textAlign: 'center',
              }}>依頼</span>
              <input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="業者名"
                style={inputStyle}
              />
              <input
                value={personInCharge}
                onChange={(e) => setPersonInCharge(e.target.value)}
                placeholder="担当者"
                style={inputStyle}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={inputStyle}
              />
              <input
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="03-0000-0000"
                style={{ ...inputStyle, maxWidth: '150px' }}
              />
              <input
                type="date"
                value={submitDeadline}
                onChange={(e) => setSubmitDeadline(e.target.value)}
                style={{ ...inputStyle, width: '140px', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', gap: '4px', width: '160px', flexShrink: 0 }}>
                <button
                  onClick={() => setShowPreview(p => !p)}
                  style={{
                    padding: '6px 10px',
                    background: showPreview ? '#2c3e50' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                  }}
                >{showPreview ? 'プレビュー閉' : 'プレビュー'}</button>
                <button style={accentBtnSmall}>依頼送信</button>
              </div>
            </div>

            {/* ご依頼事項 */}
            <div style={{ borderTop: '1px solid #dee2e6' }}>
              <div style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: '#555',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: '#f39c12', fontWeight: 600 }}>依頼先1</span>
                <span style={{ fontWeight: 600 }}>ご依頼事項</span>
              </div>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="ご依頼事項を入力してください"
                rows={3}
                style={textareaStyle}
              />
            </div>
          </div>

          {/* ========== セクション2: 見積登録 ========== */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ background: '#27ae60', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}>
              見積登録
            </div>

            {/* 登録フォーム */}
            <div style={{ padding: '16px', flex: 1 }}>
              <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  {/* 添付ファイル */}
                  <tr>
                    <td style={formLabelTd}>添付ファイル</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{
                          padding: '6px 16px',
                          background: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.xlsx,.xls"
                            onChange={handlePdfUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          {pdfFile ? pdfFile.name : 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* 申請者 */}
                  <tr>
                    <td style={formLabelTd}>申請者</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          defaultValue="user001"
                          readOnly
                          style={{ ...inputStyleCompact, width: '100px', background: '#f8f9fa' }}
                        />
                        <span style={{ fontSize: '13px', color: '#555' }}>担当者名</span>
                      </div>
                    </td>
                  </tr>
                  {/* 見積フェーズ */}
                  <tr>
                    <td style={formLabelTd}>見積フェーズ</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['定価見積', '概算見積', '発注登録用見積'] as const).map((phase) => (
                          <label key={phase} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="quotationPhase"
                              checked={quotationPhase === phase}
                              onChange={() => setQuotationPhase(phase)}
                            />
                            {phase}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {/* 保存形式 */}
                  <tr>
                    <td style={formLabelTd}>保存形式</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['電子取引', 'スキャナ保存', '未指定'] as const).map((fmt) => (
                          <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="saveFormat"
                              checked={saveFormat === fmt}
                              onChange={() => setSaveFormat(fmt)}
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

            {/* アクションエリア */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                onClick={() => alert('Excel取込機能（モック）')}
                style={{
                  padding: '8px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Excel取込
              </button>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>登録期限:</span>
                <input
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  style={{ ...inputStyleCompact, width: '160px' }}
                />
                <button
                  onClick={handleSendRfq}
                  style={{
                    padding: '8px 24px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  SHIPへ依頼
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: '#dee2e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: '#adb5bd',
            borderRadius: '2px',
          }} />
        </div>

        {/* ── 右カラム: プレビューエリア（常時表示） ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#e9ecef',
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            padding: '8px 16px',
            background: '#343a40',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>見積依頼書 プレビュー</span>
            {showPreview && (
              <button
                onClick={() => window.print()}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                印刷
              </button>
            )}
          </div>

          {/* 帳票本体 or プレースホルダー */}
          {showPreview ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                padding: '40px 48px',
                margin: '0 auto',
                fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
                color: '#111827',
                lineHeight: 1.8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                {/* タイトル */}
                <h1 style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  letterSpacing: '8px',
                  borderBottom: '2px solid #111827',
                  paddingBottom: '8px',
                  marginBottom: '28px',
                }}>
                  見積依頼書
                </h1>

                {/* 日付・依頼番号 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>依頼番号:</span>{' '}
                    <span className="tabular-nums">{rfqGroup.rfqNo}</span>
                  </div>
                  <div>{today}</div>
                </div>

                {/* 宛先 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid #555', display: 'inline-block', paddingBottom: '2px' }}>
                    {vendorName || '（業者名未入力）'}
                  </div>
                  <span style={{ fontSize: '15px', marginLeft: '4px' }}>御中</span>
                  {personInCharge && (
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                      ご担当: {personInCharge} 様
                    </div>
                  )}
                </div>

                {/* 差出人 */}
                <div style={{ textAlign: 'right', marginBottom: '28px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>医療法人社団 サンプル病院</div>
                  <div>医療機器管理部</div>
                  <div style={{ marginTop: '4px', color: '#555' }}>
                    TEL: 03-0000-0000　FAX: 03-0000-0001
                  </div>
                </div>

                {/* 件名 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>件名</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', padding: '6px 10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '2px' }}>
                    {rfqGroup.groupName} に係るお見積りのお願い
                  </div>
                </div>

                {/* 本文 */}
                <div style={{ fontSize: '12px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 6px' }}>
                    拝啓　時下ますますご清栄のこととお慶び申し上げます。
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    下記の品目につきまして、お見積りをいただきたくお願い申し上げます。
                  </p>
                  <p style={{ margin: 0 }}>
                    ご多用中誠に恐縮ですが、ご対応のほどよろしくお願いいたします。
                  </p>
                </div>

                {/* 提出期限 */}
                {submitDeadline && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '8px 12px',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '2px',
                    fontSize: '12px',
                  }}>
                    <span style={{ fontWeight: 'bold' }}>ご提出期限:</span>{' '}
                    <span className="tabular-nums">
                      {new Date(submitDeadline + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}

                {/* 依頼品目テーブル */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #dee2e6', paddingBottom: '4px' }}>
                    依頼品目（{editListItems.length}件）
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={previewThStyle}>No.</th>
                        <th style={previewThStyle}>部署</th>
                        <th style={previewThStyle}>室名</th>
                        <th style={previewThStyle}>品目</th>
                        <th style={previewThStyle}>参考型式</th>
                        <th style={previewThStyle}>備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editListItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#999', border: '1px solid #dee2e6' }}>
                            品目が登録されていません
                          </td>
                        </tr>
                      ) : (
                        editListItems.map((item, idx) => (
                          <tr key={item.id}>
                            <td style={{ ...previewTdStyle, textAlign: 'center' }} className="tabular-nums">{idx + 1}</td>
                            <td style={previewTdStyle}>{item.department || '-'}</td>
                            <td style={previewTdStyle}>{item.roomName || '-'}</td>
                            <td style={previewTdStyle}>{item.name || item.item || '-'}</td>
                            <td style={previewTdStyle}>{item.model || '-'}</td>
                            <td style={previewTdStyle}>{item.comment || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ご依頼事項 */}
                {requestNote && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #dee2e6', paddingBottom: '4px' }}>
                      ご依頼事項
                    </div>
                    <div style={{
                      padding: '10px 12px',
                      background: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '2px',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      minHeight: '40px',
                    }}>
                      {requestNote}
                    </div>
                  </div>
                )}

                {/* 連絡先 */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '12px',
                  borderTop: '1px solid #dee2e6',
                  fontSize: '11px',
                  color: '#555',
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ご回答送付先</div>
                  {email && <div>E-mail: {email}</div>}
                  {tel && <div>TEL: {tel}</div>}
                  {!email && !tel && <div style={{ color: '#999' }}>（連絡先未入力）</div>}
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px', fontSize: '12px' }}>以上</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ textAlign: 'center', color: '#adb5bd' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128196;</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>見積依頼書プレビュー</div>
                <div style={{ fontSize: '12px' }}>左側の基本情報を入力し「プレビュー」ボタンを押すと、見積依頼書が表示されます</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== フッター ===== */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* 左: 戻る */}
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          タスク管理に戻る
        </button>

        {/* 右: 登録へ */}
        <button
          onClick={handleProceedToRegistration}
          disabled={ocrProcessing}
          style={{
            padding: '8px 20px',
            background: ocrProcessing ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: ocrProcessing ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {ocrProcessing ? '処理中...' : '登録へ'}
        </button>
      </div>

      {/* OCR処理中オーバーレイ */}
      {ocrProcessing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px 48px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
              OCR処理中...
            </div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
              見積書のAI読み取りを実行しています
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// スタイル定数
// ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '13px',
  minWidth: 0,
};

const inputStyleCompact: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '13px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  padding: '8px 12px',
  fontSize: '13px',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const accentBtnSmall: React.CSSProperties = {
  padding: '6px 10px',
  background: '#8e44ad',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
};

const formLabelTd: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#2c3e50',
  background: '#f8f9fa',
  border: '1px solid #dee2e6',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  width: '120px',
};

const formValueTd: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid #dee2e6',
  verticalAlign: 'top',
};

const previewThStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const previewTdStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #dee2e6',
  fontSize: '12px',
};

// ──────────────────────────────────────────────
// Page Export
// ──────────────────────────────────────────────
export default function RfqProcessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <RfqProcessContent />
    </Suspense>
  );
}
