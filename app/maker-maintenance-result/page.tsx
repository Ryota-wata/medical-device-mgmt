'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useInspectionStore } from '@/lib/stores';
import { InspectionTask } from '@/lib/types';

interface CostItem {
  id: string;
  costType: string;       // 発生費用（部品交換、作業など）
  description: string;    // 概要
  amount: string;         // 金額
}

interface FormData {
  attachedFile: File | null;
  documentType: '点検報告書' | 'その他';
  customFileName: string;
  inspectionDate: string;
  vendorName: string;
  staffName: string;
  contactInfo: string;
  costItems: CostItem[];
}

export default function MakerMaintenanceResultPage() {
  const router = useRouter();
  const { deleteTask, addRecord } = useInspectionStore();

  const [task, setTask] = useState<InspectionTask | null>(null);
  const [formData, setFormData] = useState<FormData>({
    attachedFile: null,
    documentType: '点検報告書',
    customFileName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    staffName: '',
    contactInfo: '',
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
      if (parsed.vendorName) {
        setFormData(prev => ({ ...prev, vendorName: parsed.vendorName || '' }));
      }
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
  const handleInputChange = (field: keyof FormData, value: string) => {
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
      actualDate: formData.inspectionDate,
      result: '合格',
      staffName: formData.staffName,
      vendorName: formData.vendorName,
      documentType: formData.documentType,
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

  // 戻る
  const handleBack = () => {
    sessionStorage.removeItem('makerMaintenanceTask');
    router.push('/quotation-data-box/inspection-requests');
  };

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' }}>
        <Header
          title="メーカー保守 点検結果登録"
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' }}>
      <Header
        title="メーカー保守 点検結果登録"
        hideMenu={true}
        showBackButton={false}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        {/* 対象機器情報 */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1f2937',
        }}>
          <span>{task.inspectionGroupName || '保守・点検グループ名'}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.assetName}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.maker}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.model}</span>
        </div>

        {/* メインコンテンツ */}
        <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* 左側: 登録エリア */}
          <div style={{
            width: `${leftPanelWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}>
            {/* ヘッダー */}
            <div style={{
              padding: '12px 16px',
              background: '#9b59b6',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              borderBottom: '1px solid #ddd',
            }}>
              点検結果登録（添付ドキュメントの登録）
            </div>

            {/* フォーム */}
            <div style={{ padding: '20px', flex: 1 }}>
              {/* 添付ファイル */}
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>添付ファイル</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    style={{
                      padding: '8px 16px',
                      background: '#3498db',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    ファイルを選択
                  </label>
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    {formData.attachedFile ? formData.attachedFile.name : '選択されていません'}
                  </span>
                </div>
              </div>

              {/* ドキュメント種類 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>ドキュメント</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="documentType"
                      value="点検報告書"
                      checked={formData.documentType === '点検報告書'}
                      onChange={(e) => handleInputChange('documentType', e.target.value)}
                    />
                    <span>点検報告書</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="documentType"
                      value="その他"
                      checked={formData.documentType === 'その他'}
                      onChange={(e) => handleInputChange('documentType', e.target.value)}
                    />
                    <span>その他</span>
                  </label>
                  {formData.documentType === 'その他' && (
                    <input
                      type="text"
                      value={formData.customFileName}
                      onChange={(e) => handleInputChange('customFileName', e.target.value)}
                      placeholder="ファイル名を入力"
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        width: '200px',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 点検実施日 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>点検実施日</label>
                <input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* 点検業者セクション */}
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '20px',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 16px',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #ddd',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>点検業者</span>
                  <span style={{ color: '#aaa' }}>|</span>
                  <span>担当者</span>
                  <span style={{ color: '#aaa' }}>|</span>
                  <span>連絡先</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>点検業者</label>
                    <input
                      type="text"
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
                      placeholder="業者名を入力"
                      style={styles.input}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>担当者</label>
                    <input
                      type="text"
                      value={formData.staffName}
                      onChange={(e) => handleInputChange('staffName', e.target.value)}
                      placeholder="担当者名を入力"
                      style={styles.input}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>連絡先</label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                      placeholder="電話番号・メール等"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* 発生費用セクション */}
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '20px',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #ddd',
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    発生費用
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCostItem}
                    style={{
                      padding: '4px 12px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    + 行追加
                  </button>
                </div>

                {/* 費用テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e9ecef' }}>
                      <th style={styles.th}>発生費用</th>
                      <th style={styles.th}>概要</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'right' }}>金額</th>
                      <th style={{ ...styles.th, width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.costItems.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={item.costType}
                            onChange={(e) => handleCostItemChange(item.id, 'costType', e.target.value)}
                            placeholder="例: 部品交換"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleCostItemChange(item.id, 'description', e.target.value)}
                            placeholder="概要を入力"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={(e) => handleCostItemChange(item.id, 'amount', e.target.value)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                boxSizing: 'border-box',
                              }}
                            />
                            <span style={{ fontSize: '12px', color: '#666' }}>円</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveCostItem(item.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                            aria-label="行を削除"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.costItems.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                          費用項目がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td colSpan={2} style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                        合計
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {totalCost.toLocaleString()} 円
                        </span>
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

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
          }}>
            {/* プレビューヘッダー */}
            <div style={{
              padding: '12px 16px',
              background: '#34495e',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              ドキュメントプレビュー
            </div>

            {/* プレビュー本体 */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
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
                <div style={{
                  textAlign: 'center',
                  color: '#999',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <p style={{ fontSize: '14px' }}>ファイルを選択するとプレビューが表示されます</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッターボタン */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          marginTop: '16px',
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 28px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 28px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            点検記録を登録
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#495057',
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'middle',
  },
};
