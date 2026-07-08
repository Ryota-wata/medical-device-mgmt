'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useInspectionStore, useAuthStore } from '@/lib/stores';
import { InspectionTask } from '@/lib/types';

type DocumentType = '' | '点検報告書' | '請求書' | '見積書' | 'その他';
type StorageFormat = '' | '電子取引' | 'スキャナ保存' | '未指定';

interface CostItem {
  id: string;
  costType: string;       // 発生費用（部品交換、作業など）
  description: string;    // 概要
  amount: string;         // 金額
}

interface FormData {
  attachedFile: File | null;
  documentType: DocumentType;
  customFileName: string;
  storageFormat: StorageFormat;
  documentDate: string;
  documentNo: string;
  accountItem: string;
  costItems: CostItem[];
}

const ACCOUNT_OPTIONS = ['消耗品費', '修繕費', '保守料', '委託費', '雑費'];

export default function MakerMaintenanceResultPage() {
  const router = useRouter();
  const { deleteTask, addRecord } = useInspectionStore();
  const { user } = useAuthStore(); // 担当者はログインユーザーから自動取得

  const [task, setTask] = useState<InspectionTask | null>(null);
  const [formData, setFormData] = useState<FormData>({
    attachedFile: null,
    documentType: '',
    customFileName: '',
    storageFormat: '',
    documentDate: '',
    documentNo: '',
    accountItem: '',
    costItems: [
      { id: '1', costType: '部品交換', description: '', amount: '' },
      { id: '2', costType: '作業', description: '', amount: '' },
    ],
  });

  // パネル幅の状態（左パネルの幅をパーセントで管理）
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // プレビューURL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('makerMaintenanceTask');
    if (stored) {
      const parsed = JSON.parse(stored) as InspectionTask;
      setTask(parsed);
    }
  }, []);

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

  // ファイル選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, attachedFile: file }));

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // 入力変更
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 費用項目の変更
  const handleCostItemChange = (id: string, field: keyof CostItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 費用項目の追加
  const handleAddCostItem = () => {
    setFormData(prev => ({
      ...prev,
      costItems: [
        ...prev.costItems,
        { id: `${Date.now()}`, costType: '', description: '', amount: '' },
      ],
    }));
  };

  // 費用項目の削除
  const handleRemoveCostItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.filter(item => item.id !== id),
    }));
  };

  // 合計金額計算
  const totalCost = formData.costItems.reduce((sum, item) => {
    return sum + parseInt(item.amount.replace(/,/g, '') || '0', 10);
  }, 0);

  // ドキュメント登録
  const handleRegisterDocument = () => {
    alert('ドキュメントを登録しました');
  };

  // 登録処理
  const handleSubmit = () => {
    if (!task) return;

    // 費用の集計
    const partsItems = formData.costItems.filter(item => item.costType === '部品交換');
    const laborItems = formData.costItems.filter(item => item.costType === '作業');
    const partsCost = partsItems.reduce((sum, item) => sum + parseInt(item.amount.replace(/,/g, '') || '0', 10), 0);
    const laborCost = laborItems.reduce((sum, item) => sum + parseInt(item.amount.replace(/,/g, '') || '0', 10), 0);
    const partsDetail = partsItems.map(item => item.description).filter(Boolean).join(', ');

    // 点検実績を登録
    addRecord({
      taskId: task.id,
      assetId: task.assetId,
      menuId: '',  // メーカー保守はメニューなし
      plannedDate: task.nextInspectionDate,
      actualDate: formData.documentDate,
      result: '合格',
      staffName: '',
      vendorName: task.vendorName || '',
      documentType: formData.documentType === '点検報告書' ? '点検報告書' : 'その他',
      documentUrl: previewUrl || undefined,
      partsCost: partsCost,
      partsDetail: partsDetail,
      laborCost: laborCost,
      totalCost: totalCost,
    });

    // タスクを削除
    deleteTask(task.id);

    sessionStorage.removeItem('makerMaintenanceTask');
    alert('点検記録を登録しました');
    router.push('/quotation-data-box/inspection-requests');
  };

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
        <Header
          title="メーカー点検結果登録"
          hideMenu={true}
          showBackButton={false}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>タスク情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
      <Header
        title="メーカー点検結果登録"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/inspection-requests"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      {/* 契約情報行（プログレスバー同幅で上部固定表示） */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '10px 24px',
        background: '#F5F5F5',
        borderBottom: '1px solid #E1E1E1',
        fontSize: '13px',
        color: '#4A4A4A',
      }}>
        <span>契約申請No. <span style={{ fontVariantNumeric: 'tabular-nums' }}>{task.maintenanceContractId || 'APP26-契12345'}</span></span>
        <span>契約グループ名 {task.inspectionGroupName || '●●●●●'}</span>
        <span>契約種別 {task.inspectionType || '●●●●●'}</span>
        <span style={{ color: '#C4C4C4' }}>|</span>
        <span>点検業者 {task.vendorName || ''}</span>
        <span style={{ color: '#C4C4C4' }}>|</span>
      </div>

      {/* 対象品目行（赤・プログレスバー同幅で上部固定表示） */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        padding: '10px 24px',
        background: '#EDEDED',
        borderBottom: '1px solid #E1E1E1',
        fontSize: '13px',
        fontWeight: 700,
        color: '#DA0000',
      }}>
        <span style={{ color: '#DA0000' }}>|</span>
        <span>対象品目</span>
        <span style={{ color: '#DA0000' }}>|</span>
        <span>QRコード <span style={{ fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</span></span>
        <span>品目 {task.assetName}</span>
        <span>メーカー名 {task.maker}</span>
        <span>型式 {task.model}</span>
      </div>

      {/* メインコンテンツ */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* 左側: 登録エリア（ブロックのスクロールコンテナ。flex-columnだと子がshrinkして下部が到達不能になるため） */}
        <div style={{
          width: `${leftPanelWidth}%`,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          padding: '16px',
        }}>
          {/* 受付部署／担当者 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            padding: '16px',
            background: 'white',
            border: '1px solid #E1E1E1',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, color: '#4A4A4A' }}>受付部署</span>
              <span style={{ color: '#4A4A4A' }}>{task.managementDepartment || '●●●●●●'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, color: '#4A4A4A' }}>担当者</span>
              <input
                type="text"
                value={user?.username ?? ''}
                readOnly
                title="ログインユーザーから自動取得"
                style={{ ...styles.input, width: '180px', background: '#F7F7F7', color: '#4A4A4A' }}
              />
            </div>
          </div>

          {/* 完了登録（本画面は完了登録のみのためSTEP番号なし） */}
          <div style={{
            background: 'white',
            border: '1px solid #E1E1E1',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#4A4A4A',
            }}>
              完了登録
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              {/* 案内メッセージ */}
              <div style={{
                padding: '12px 16px',
                background: '#DFF3E3',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#146E2E',
              }}>
                登録対象のファイル選択し、必要項目を入力してください。
              </div>

              {/* 添付ファイル / ドキュメント種別 / 保存形式 (テーブル UI) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '24px' }}>
                <tbody>
                  <tr>
                    <th style={styles.th}>添付ファイル</th>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="file-input"
                        />
                        <label htmlFor="file-input" style={styles.fileSelectBtn}>
                          ファイルの選択
                        </label>
                        <span style={{ flex: 1, fontSize: '13px', color: '#8A8A8A' }}>
                          {formData.attachedFile ? formData.attachedFile.name : 'ファイルが選択されていません'}
                        </span>
                        <button
                          type="button"
                          disabled={!formData.attachedFile}
                          style={{
                            padding: '8px 16px',
                            background: '#E9E9E9',
                            color: '#8A8A8A',
                            border: '1px solid #E1E1E1',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: formData.attachedFile ? 'pointer' : 'not-allowed',
                          }}
                        >
                          プレビュー
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ ...styles.th, verticalAlign: 'top' }}>ドキュメント種別</th>
                    <td style={styles.td}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '10px', columnGap: '16px' }}>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="点検報告書"
                            checked={formData.documentType === '点検報告書'}
                            onChange={() => handleInputChange('documentType', '点検報告書')}
                          />
                          <span>点検報告書</span>
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="見積書"
                            checked={formData.documentType === '見積書'}
                            onChange={() => handleInputChange('documentType', '見積書')}
                          />
                          <span>見積書（追加費用が発生した場合）</span>
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="請求書"
                            checked={formData.documentType === '請求書'}
                            onChange={() => handleInputChange('documentType', '請求書')}
                          />
                          <span>請求書</span>
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="その他"
                            checked={formData.documentType === 'その他'}
                            onChange={() => handleInputChange('documentType', 'その他')}
                          />
                          <span>その他</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <input
                          type="text"
                          value={formData.customFileName}
                          onChange={(e) => handleInputChange('customFileName', e.target.value)}
                          placeholder="その他ドキュメント名の入力"
                          disabled={formData.documentType !== 'その他'}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #E1E1E1',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '260px',
                            boxSizing: 'border-box',
                            background: formData.documentType === 'その他' ? 'white' : '#FAFAFA',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ ...styles.th, verticalAlign: 'top' }}>保存形式</th>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['電子取引', 'スキャナ保存', '未指定'] as StorageFormat[]).map((fmt) => (
                          <label key={fmt} style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="storageFormat"
                              value={fmt}
                              checked={formData.storageFormat === fmt}
                              onChange={() => handleInputChange('storageFormat', fmt)}
                            />
                            <span>{fmt}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 日付 / ドキュメントNo. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A4A4A' }}>日付</span>
                <input
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => handleInputChange('documentDate', e.target.value)}
                  style={{ ...styles.input, width: '170px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A4A4A', marginLeft: '16px' }}>ドキュメントNo.</span>
                <input
                  type="text"
                  value={formData.documentNo}
                  onChange={(e) => handleInputChange('documentNo', e.target.value)}
                  placeholder="登録ドキュメントのNo.を入力"
                  style={{ ...styles.input, width: '260px' }}
                />
              </div>

              {/* 発生費用セクション */}
              <div style={{
                border: '1px solid #E1E1E1',
                borderRadius: '4px',
                marginBottom: '24px',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#FAFAFA',
                  borderBottom: '1px solid #E1E1E1',
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#4A4A4A' }}>
                    発生費用
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCostItem}
                    style={{
                      padding: '4px 12px',
                      background: 'white',
                      color: '#146E2E',
                      border: '1px solid #146E2E',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    + 行追加
                  </button>
                </div>

                {/* 費用テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F1F1F1' }}>
                      <th style={styles.costTh}>発生費用</th>
                      <th style={styles.costTh}>概要</th>
                      <th style={{ ...styles.costTh, width: '130px', textAlign: 'right' }}>金額</th>
                      <th style={{ ...styles.costTh, width: '44px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.costItems.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.costTd}>
                          <input
                            type="text"
                            value={item.costType}
                            onChange={(e) => handleCostItemChange(item.id, 'costType', e.target.value)}
                            placeholder="例: 部品交換"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.costTd}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleCostItemChange(item.id, 'description', e.target.value)}
                            placeholder="概要を入力"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.costTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={(e) => handleCostItemChange(item.id, 'amount', e.target.value)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #E1E1E1',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                boxSizing: 'border-box',
                              }}
                            />
                            <span style={{ fontSize: '12px', color: '#8A8A8A' }}>円</span>
                          </div>
                        </td>
                        <td style={{ ...styles.costTd, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveCostItem(item.id)}
                            style={{
                              background: 'transparent',
                              color: '#8A8A8A',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label="行を削除"
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.costItems.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...styles.costTd, textAlign: 'center', color: '#8A8A8A' }}>
                          費用項目がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#FAFAFA' }}>
                      <td colSpan={2} style={{ ...styles.costTd, textAlign: 'right', fontWeight: 700 }}>
                        合計
                      </td>
                      <td style={{ ...styles.costTd, textAlign: 'right' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#4A4A4A',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {totalCost.toLocaleString()} 円
                        </span>
                      </td>
                      <td style={styles.costTd}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 勘定科目 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A4A4A' }}>勘定科目</span>
                <select
                  value={formData.accountItem}
                  onChange={(e) => handleInputChange('accountItem', e.target.value)}
                  style={{ ...styles.input, width: '260px', color: formData.accountItem ? '#4A4A4A' : '#8A8A8A' }}
                >
                  <option value="">選択してください</option>
                  {ACCOUNT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* ドキュメント登録 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={handleRegisterDocument}
                  style={{
                    padding: '10px 24px',
                    background: '#2E8B57',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ドキュメント登録
                </button>
              </div>

              {/* 点検記録を登録 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    padding: '14px 40px',
                    background: '#2E8B57',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  点検記録を登録
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
            background: '#E1E1E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: '#C4C4C4',
            borderRadius: '2px',
          }} />
        </div>

        {/* 右側: プレビューエリア */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'white',
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '2px solid #2E8B57',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#4A4A4A' }}>
              ドキュメントプレビュー
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  background: 'white',
                  color: '#4A4A4A',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                PDF出力
              </button>
              <button
                type="button"
                aria-label="印刷"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4A4A4A',
                  display: 'inline-flex',
                  padding: '4px',
                }}
              >
                <Printer size={18} aria-hidden />
              </button>
            </div>
          </div>

          {/* プレビュー本体 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            overflow: 'auto',
          }}>
            {previewUrl ? (
              formData.attachedFile?.type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', color: '#C4C4C4' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  input: {
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  fileSelectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#FFFFFF',
    border: '1px solid #C4C4C4',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4A4A4A',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#4A4A4A',
    cursor: 'pointer',
  },
  th: {
    padding: '14px 16px',
    background: '#F7F7F7',
    border: '1px solid #E1E1E1',
    textAlign: 'left',
    width: '150px',
    fontWeight: 700,
    color: '#4A4A4A',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  td: {
    padding: '14px 16px',
    border: '1px solid #E1E1E1',
    verticalAlign: 'middle',
  },
  costTh: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  costTd: {
    padding: '10px 12px',
    borderBottom: '1px solid #E1E1E1',
    verticalAlign: 'middle',
  },
};
