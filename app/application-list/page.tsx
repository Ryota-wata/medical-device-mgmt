'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationStore } from '@/lib/stores';
import {
  Application,
  ApplicationType,
  ApplicationStatus,
  getApplicationTypeBadgeStyle,
  getStatusBadgeStyle,
} from '@/lib/types';

export default function ApplicationListPage() {
  const router = useRouter();
  const { applications, addApplication } = useApplicationStore();
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // フィルター状態
  const [filters, setFilters] = useState({
    applicationType: '',
    status: '',
    rfqNo: '',
    dateFrom: '',
    dateTo: '',
    keyword: '',
  });

  // フィルター適用
  useEffect(() => {
    let filtered = [...applications];

    if (filters.applicationType) {
      filtered = filtered.filter((a) => a.applicationType === filters.applicationType);
    }
    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }
    if (filters.rfqNo) {
      filtered = filtered.filter((a) => a.rfqNo?.includes(filters.rfqNo));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter((a) => a.applicationDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((a) => a.applicationDate <= filters.dateTo);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.applicationNo.toLowerCase().includes(keyword) ||
          a.asset.name.toLowerCase().includes(keyword)
      );
    }

    setFilteredApplications(filtered);
  }, [filters, applications]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      applicationType: '',
      status: '',
      rfqNo: '',
      dateFrom: '',
      dateTo: '',
      keyword: '',
    });
  };

  const handleDetail = (app: Application) => {
    alert(`申請詳細: ${app.applicationNo}`);
  };

  const handleEdit = (app: Application) => {
    alert(`申請編集: ${app.applicationNo}`);
  };

  const handleDelete = (app: Application) => {
    if (confirm(`申請 ${app.applicationNo} を削除しますか?`)) {
      alert('削除しました');
    }
  };

  const handleRegisterIndividual = (app: Application) => {
    alert(`個体登録: ${app.applicationNo}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
      }}
    >
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
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>申請一覧</div>
          </div>
          <span style={{ fontSize: '14px', color: '#ecf0f1' }}>
            {filteredApplications.length}件
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              申請種別
            </label>
            <select
              value={filters.applicationType}
              onChange={(e) => setFilters({ ...filters, applicationType: e.target.value as ApplicationType | '' })}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">すべて</option>
              <option value="新規申請">新規申請</option>
              <option value="増設申請">増設申請</option>
              <option value="更新申請">更新申請</option>
              <option value="移動申請">移動申請</option>
              <option value="廃棄申請">廃棄申請</option>
              <option value="保留">保留</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              状態
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ApplicationStatus | '' })}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">すべて</option>
              <option value="下書き">下書き</option>
              <option value="承認待ち">承認待ち</option>
              <option value="承認済み">承認済み</option>
              <option value="差し戻し">差し戻し</option>
              <option value="却下">却下</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              見積依頼No
            </label>
            <input
              type="text"
              value={filters.rfqNo}
              onChange={(e) => setFilters({ ...filters, rfqNo: e.target.value })}
              placeholder="RFQ-2025-0001"
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              申請日（開始）
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              申請日（終了）
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#555' }}>
              キーワード
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="申請番号、資産名で検索"
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              border: '1px solid #3498db',
              borderRadius: '4px',
              background: 'white',
              color: '#3498db',
              fontSize: '13px',
              cursor: 'pointer',
              height: '36px',
            }}
          >
            🔄 クリア
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1500px', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '50px' }}>
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                  />
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '120px' }}>申請番号</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '100px' }}>申請日</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '120px' }}>申請種別</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '200px' }}>資産情報</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '80px' }}>数量</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '120px' }}>見積依頼No</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '150px' }}>購入先店舗</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '200px' }}>見積情報</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '100px' }}>状態</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '100px' }}>承認進捗</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '150px' }}>アクション</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const typeStyle = getApplicationTypeBadgeStyle(app.applicationType);
                const statusStyle = getStatusBadgeStyle(app.status);

                return (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid #dee2e6',
                      background: selectedIds.has(app.id) ? '#e3f2fd' : 'white',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => handleSelect(app.id)}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {app.applicationNo}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{app.applicationDate}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: typeStyle.background,
                          color: typeStyle.color,
                        }}
                      >
                        {app.applicationType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '2px' }}>
                        {app.asset.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{app.asset.model}</div>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{app.quantity}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {app.rfqNo ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2c3e50' }}>
                          {app.rfqNo}
                        </span>
                      ) : (
                        <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>未割当</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{app.vendor}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {app.quotationInfo && app.quotationInfo.length > 0 ? (
                        <div style={{ lineHeight: 1.6 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: '#3498db',
                              fontSize: '13px',
                              marginBottom: '2px',
                            }}
                          >
                            {app.quotationInfo[0].ocrItemName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 600 }}>
                            ¥{app.quotationInfo[0].amount.toLocaleString()}
                          </div>
                          {app.quotationInfo.length > 1 && (
                            <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>
                              他{app.quotationInfo.length - 1}件
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: statusStyle.background,
                          color: statusStyle.color,
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '13px', color: '#34495e' }}>
                      <span style={{ fontWeight: 600 }}>
                        {app.approvalProgress.current}/{app.approvalProgress.total}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleDetail(app)}
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
                          詳細
                        </button>
                        <button
                          onClick={() => handleEdit(app)}
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
                          編集
                        </button>
                        {app.status === '下書き' && (
                          <button
                            onClick={() => handleDelete(app)}
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
                        )}
                        {app.status === '承認済み' && !app.individualRegistered && (
                          <button
                            onClick={() => handleRegisterIndividual(app)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #9b59b6',
                              borderRadius: '4px',
                              background: 'white',
                              color: '#9b59b6',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            個体登録
                          </button>
                        )}
                        {app.individualRegistered && (
                          <span
                            style={{
                              padding: '6px 12px',
                              background: '#27ae60',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            登録済
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 一括操作バー */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#2c3e50',
            color: 'white',
            padding: '20px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedIds.size}件選択中</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  padding: '10px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                選択解除
              </button>
              <button
                onClick={() => alert('見積グルーピング機能（開発中）')}
                style={{
                  padding: '10px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                見積グルーピング
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
