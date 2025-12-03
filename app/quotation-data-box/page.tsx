'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuotationData {
  rfqNo: string;
  vendor: string;
  createdDate: string;
  applicationCount: number;
  quotations: {
    id: string;
    fileName: string;
    uploadDate: string;
    uploader: string;
  }[];
}

export default function QuotationDataBoxPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRfqSelectModalOpen, setIsRfqSelectModalOpen] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<{ rfqNo: string; vendor: string } | null>(null);
  const [outputRfq, setOutputRfq] = useState<{ rfqNo: string; vendor: string } | null>(null);

  // モックデータ - 見積データ
  const [quotationData] = useState<QuotationData[]>([
    {
      rfqNo: 'RFQ-2025-0001',
      vendor: '◯◯メディカル 東京支店',
      createdDate: '2025-11-15',
      applicationCount: 2,
      quotations: [
        {
          id: 'Q-001',
          fileName: '見積書_◯◯メディカル_20250115.pdf',
          uploadDate: '2025-01-15',
          uploader: '田中太郎',
        },
      ],
    },
    {
      rfqNo: 'RFQ-2025-0002',
      vendor: '日立メディコ 大阪支店',
      createdDate: '2025-11-14',
      applicationCount: 1,
      quotations: [
        {
          id: 'Q-002',
          fileName: '見積書_日立メディコ_20250114.pdf',
          uploadDate: '2025-01-14',
          uploader: '佐藤花子',
        },
      ],
    },
  ]);

  // モックデータ - 見積依頼リスト
  const availableRfqs = [
    {
      rfqNo: 'RFQ-2025-0001',
      vendor: '◯◯メディカル 東京支店',
      createdDate: '2025-11-15',
      applicationCount: 2,
      status: '見積待ち',
    },
    {
      rfqNo: 'RFQ-2025-0002',
      vendor: '日立メディコ 大阪支店',
      createdDate: '2025-11-14',
      applicationCount: 1,
      status: '見積取得済',
    },
    {
      rfqNo: 'RFQ-2025-0003',
      vendor: 'ABC医療機器 福岡支店',
      createdDate: '2025-11-16',
      applicationCount: 3,
      status: '見積待ち',
    },
  ];

  const handleUpload = () => {
    if (!selectedRfq) {
      alert('見積依頼を選択してください');
      return;
    }
    alert(`見積書をアップロードしました\n見積依頼No: ${selectedRfq.rfqNo}`);
    setIsUploadModalOpen(false);
    setSelectedRfq(null);
  };

  const handleSelectRfq = (rfq: { rfqNo: string; vendor: string }) => {
    setSelectedRfq(rfq);
    setIsRfqSelectModalOpen(false);
  };

  const handleShowOutputModal = (rfqNo: string, vendor: string) => {
    setOutputRfq({ rfqNo, vendor });
    setIsOutputModalOpen(true);
  };

  const handleGeneratePurchaseOrder = () => {
    alert('発注書を生成しました');
  };

  const handleGenerateInspectionReport = () => {
    alert('検収書を生成しました');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: '#2c3e50',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#27ae60',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              SHIP
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>見積書管理</div>
          </div>
          <span style={{ fontSize: '14px', color: '#ecf0f1' }}>{quotationData.length}件</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📄</span>
            <span>見積書アップロード</span>
          </button>

          {/* ナビゲーションメニュー */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                padding: '8px 16px',
                background: '#34495e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📑 メニュー</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 2000,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/application-list');
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#2c3e50',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📝</span>
                  <span>申請一覧</span>
                </div>
                <div
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/quotation-data-box');
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📦</span>
                  <span>見積書管理</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            戻る
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {quotationData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#95a5a6' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>見積書がアップロードされていません</div>
            <div style={{ fontSize: '13px' }}>「見積書アップロード」ボタンから追加してください</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quotationData.map((data) => (
              <div
                key={data.rfqNo}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'white',
                }}
              >
                {/* セクションヘッダー */}
                <div
                  style={{
                    background: '#f8f9fa',
                    padding: '15px 20px',
                    borderBottom: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                      見積依頼No: {data.rfqNo}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
                      業者: {data.vendor} | 申請件数: {data.applicationCount}件 | 作成日: {data.createdDate}
                    </div>
                  </div>
                  <button
                    onClick={() => handleShowOutputModal(data.rfqNo, data.vendor)}
                    style={{
                      padding: '8px 16px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    📄 発注書・検収書出力
                  </button>
                </div>

                {/* 見積書リスト */}
                <div style={{ padding: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                          ファイル名
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                          アップロード日
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                          アップロード者
                        </th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.quotations.map((quot) => (
                        <tr key={quot.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{quot.fileName}</td>
                          <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{quot.uploadDate}</td>
                          <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{quot.uploader}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => alert('見積書を表示')}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #3498db',
                                  borderRadius: '4px',
                                  background: 'white',
                                  color: '#3498db',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                表示
                              </button>
                              <button
                                onClick={() => alert('見積書をダウンロード')}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #27ae60',
                                  borderRadius: '4px',
                                  background: 'white',
                                  color: '#27ae60',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                DL
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('この見積書を削除しますか?')) {
                                    alert('削除しました');
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e74c3c',
                                  borderRadius: '4px',
                                  background: 'white',
                                  color: '#e74c3c',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 見積書アップロードモーダル */}
      {isUploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2c3e50' }}>
              見積書アップロード
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                見積依頼 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  background: '#f8f9fa',
                }}
              >
                {selectedRfq ? (
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{selectedRfq.rfqNo}</div>
                    <div style={{ fontSize: '13px', color: '#5a6c7d' }}>{selectedRfq.vendor}</div>
                  </div>
                ) : (
                  <div style={{ color: '#95a5a6' }}>見積依頼を選択してください</div>
                )}
              </div>
              <button
                onClick={() => setIsRfqSelectModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📋 見積依頼を選択
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                見積書PDF（任意）
              </label>
              <input
                type="file"
                accept=".pdf"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#5a6c7d' }}>
                ※ ファイルを選択しない場合はダミーの見積書が登録されます
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedRfq(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpload}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 見積依頼選択モーダル */}
      {isRfqSelectModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setIsRfqSelectModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>
              見積依頼を選択
            </h2>
            <p style={{ marginBottom: '20px', color: '#5a6c7d' }}>
              アップロードする見積書の見積依頼を選択してください
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>
                    選択
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                    見積依頼No
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>業者名</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>作成日</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>申請件数</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody>
                {availableRfqs.map((rfq) => (
                  <tr key={rfq.rfqNo} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <button
                        onClick={() => handleSelectRfq({ rfqNo: rfq.rfqNo, vendor: rfq.vendor })}
                        style={{
                          padding: '6px 12px',
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        選択
                      </button>
                    </td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#2c3e50' }}>
                      {rfq.rfqNo}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{rfq.vendor}</td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{rfq.createdDate}</td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{rfq.applicationCount}件</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: rfq.status === '見積取得済' ? '#27ae60' : '#f39c12',
                          color: 'white',
                        }}
                      >
                        {rfq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => setIsRfqSelectModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 発注書・検収書出力モーダル */}
      {isOutputModalOpen && outputRfq && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsOutputModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '700px',
              width: '90%',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2c3e50' }}>
              発注書・検収書の出力
            </h2>

            <div
              style={{
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>見積依頼No:</span>
                <span style={{ color: '#2c3e50' }}>{outputRfq.rfqNo}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>購入先店舗:</span>
                <span style={{ color: '#2c3e50' }}>{outputRfq.vendor}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                <div style={{ fontSize: '32px' }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                    発注書テンプレート
                  </div>
                  <div style={{ fontSize: '13px', color: '#5a6c7d' }}>
                    紐付けられた申請情報から発注書を生成します
                  </div>
                </div>
                <button
                  onClick={handleGeneratePurchaseOrder}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📥</span>
                  <span>Excel出力</span>
                </button>
              </div>

              <div
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                <div style={{ fontSize: '32px' }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                    検収書テンプレート
                  </div>
                  <div style={{ fontSize: '13px', color: '#5a6c7d' }}>
                    紐付けられた申請情報から検収書を生成します
                  </div>
                </div>
                <button
                  onClick={handleGenerateInspectionReport}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📥</span>
                  <span>Excel出力</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsOutputModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
