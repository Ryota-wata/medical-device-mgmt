'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rfq, getRfqStatusBadgeStyle } from '@/lib/types/rfq';

// サンプルデータ
const mockRfqData: Rfq[] = [
  {
    id: 1,
    rfqNo: 'RFQ-2025-0001',
    vendor: '〇〇〇〇商事',
    requestDate: '2025-01-15',
    status: '見積待ち',
    applicationCount: 3,
    applications: [
      { applicationNo: 'APP-2025-0001', assetName: '電気手術用電源装置2システム' },
      { applicationNo: 'APP-2025-0002', assetName: '医科歯科用洗浄器' },
      { applicationNo: 'APP-2025-0005', assetName: '超音波診断装置' },
    ],
  },
  {
    id: 2,
    rfqNo: 'RFQ-2025-0002',
    vendor: '△△△△メディカル',
    requestDate: '2025-01-16',
    status: '見積受領',
    applicationCount: 2,
    applications: [
      { applicationNo: 'APP-2025-0003', assetName: 'CT関連機器' },
      { applicationNo: 'APP-2025-0004', assetName: 'MRI装置' },
    ],
  },
  {
    id: 3,
    rfqNo: 'RFQ-2025-0003',
    vendor: '□□□□株式会社',
    requestDate: '2025-01-17',
    status: '見積待ち',
    applicationCount: 1,
    applications: [{ applicationNo: 'APP-2025-0006', assetName: 'X線撮影装置' }],
  },
  {
    id: 4,
    rfqNo: 'RFQ-2025-0004',
    vendor: '◇◇◇◇医療機器',
    requestDate: '2025-01-18',
    status: '見積受領',
    applicationCount: 4,
    applications: [
      { applicationNo: 'APP-2025-0007', assetName: '内視鏡システム' },
      { applicationNo: 'APP-2025-0008', assetName: '人工呼吸器' },
      { applicationNo: 'APP-2025-0009', assetName: '心電計' },
      { applicationNo: 'APP-2025-0010', assetName: '輸液ポンプ' },
    ],
  },
];

export default function RfqListPage() {
  const router = useRouter();
  const [rfqData, setRfqData] = useState<Rfq[]>(mockRfqData);
  const [filteredData, setFilteredData] = useState<Rfq[]>(mockRfqData);

  const handleViewDetail = (rfqId: number) => {
    const rfq = rfqData.find((r) => r.id === rfqId);
    if (!rfq) return;

    alert(
      `見積依頼詳細\n\n見積依頼No: ${rfq.rfqNo}\n購入先店舗: ${rfq.vendor}\n申請件数: ${rfq.applicationCount}件`
    );
  };

  const handleProcessQuotation = (rfqId: number) => {
    const rfq = rfqData.find((r) => r.id === rfqId);
    if (!rfq) return;

    // 見積処理画面へ遷移
    router.push(`/quotation-processing?rfqNo=${rfq.rfqNo}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: '#2c3e50',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              SHIP
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>見積依頼一覧</h1>
          </div>
          <span
            style={{
              background: '#34495e',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {filteredData.length}件
          </span>
        </div>
        <div>
          <button
            onClick={() => router.back()}
            style={{
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>←</span>
            <span>戻る</span>
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                minWidth: '900px',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '150px',
                    }}
                  >
                    見積依頼No
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '200px',
                    }}
                  >
                    購入先店舗
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '120px',
                    }}
                  >
                    依頼日
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '120px',
                    }}
                  >
                    ステータス
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '100px',
                    }}
                  >
                    申請件数
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '200px',
                    }}
                  >
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                        見積依頼がありません
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((rfq) => {
                    const statusStyle = getRfqStatusBadgeStyle(rfq.status);
                    return (
                      <tr key={rfq.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '15px' }}>
                          <strong style={{ color: '#2c3e50' }}>{rfq.rfqNo}</strong>
                        </td>
                        <td style={{ padding: '15px', color: '#5a6c7d' }}>{rfq.vendor}</td>
                        <td style={{ padding: '15px', color: '#5a6c7d' }}>{rfq.requestDate}</td>
                        <td style={{ padding: '15px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              background: statusStyle.background,
                              color: statusStyle.color,
                            }}
                          >
                            {rfq.status}
                          </span>
                        </td>
                        <td style={{ padding: '15px', color: '#5a6c7d' }}>{rfq.applicationCount}件</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewDetail(rfq.id)}
                              style={{
                                background: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                              }}
                            >
                              詳細
                            </button>
                            {rfq.status === '見積受領' && (
                              <button
                                onClick={() => handleProcessQuotation(rfq.id)}
                                style={{
                                  background: '#27ae60',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 16px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                }}
                              >
                                見積処理
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
