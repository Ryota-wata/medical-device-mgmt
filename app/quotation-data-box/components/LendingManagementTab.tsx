'use client';

import React, { useState } from 'react';

// 貸出機器データ型
interface LendingDevice {
  id: number;
  qrLabel: string;
  meManagementNo: string;
  itemName: string;
  maker: string;
  model: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  status: '貸出可' | '貸出中' | '点検中' | '修理中' | '廃棄予定';
  installedDepartment: string;
  lendingDate: string | null;
  expectedReturnDate: string | null;
  overduedays: number;
  inspectionMarginDays: number;
  isFixedPlacement: boolean;
  freeComment: string;
}

// モックデータ
const MOCK_LENDING_DEVICES: LendingDevice[] = [
  {
    id: 1,
    qrLabel: 'QR-001',
    meManagementNo: 'ME-2024-001',
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    category: 'ME機器',
    majorCategory: '生命維持管理装置',
    middleCategory: '人工呼吸器',
    status: '貸出中',
    installedDepartment: 'ICU',
    lendingDate: '2026-01-15',
    expectedReturnDate: '2026-02-15',
    overduedays: 0,
    inspectionMarginDays: 45,
    isFixedPlacement: false,
    freeComment: '',
  },
  {
    id: 2,
    qrLabel: 'QR-002',
    meManagementNo: 'ME-2024-002',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-171',
    category: 'ME機器',
    majorCategory: '輸液・輸血用器具',
    middleCategory: '輸液ポンプ',
    status: '貸出中',
    installedDepartment: '3階東病棟',
    lendingDate: '2026-01-20',
    expectedReturnDate: '2026-02-01',
    overduedays: 7,
    inspectionMarginDays: 30,
    isFixedPlacement: true,
    freeComment: '長期貸出申請中',
  },
  {
    id: 3,
    qrLabel: 'QR-003',
    meManagementNo: 'ME-2024-003',
    itemName: 'シリンジポンプ',
    maker: 'テルモ',
    model: 'TE-SS700',
    category: 'ME機器',
    majorCategory: '輸液・輸血用器具',
    middleCategory: 'シリンジポンプ',
    status: '貸出可',
    installedDepartment: 'ME室',
    lendingDate: null,
    expectedReturnDate: null,
    overduedays: 0,
    inspectionMarginDays: 60,
    isFixedPlacement: false,
    freeComment: '',
  },
  {
    id: 4,
    qrLabel: 'QR-004',
    meManagementNo: 'ME-2024-004',
    itemName: '除細動器',
    maker: '日本光電',
    model: 'TEC-5600',
    category: 'ME機器',
    majorCategory: '生命維持管理装置',
    middleCategory: '除細動器',
    status: '点検中',
    installedDepartment: '外来',
    lendingDate: null,
    expectedReturnDate: null,
    overduedays: 0,
    inspectionMarginDays: 15,
    isFixedPlacement: true,
    freeComment: '定期点検中',
  },
  {
    id: 5,
    qrLabel: 'QR-005',
    meManagementNo: 'ME-2024-005',
    itemName: '心電計',
    maker: 'フクダ電子',
    model: 'FX-8000',
    category: 'ME機器',
    majorCategory: '生体情報モニタ',
    middleCategory: '心電計',
    status: '貸出中',
    installedDepartment: '2階西病棟',
    lendingDate: '2026-01-10',
    expectedReturnDate: '2026-01-25',
    overduedays: 14,
    inspectionMarginDays: 20,
    isFixedPlacement: false,
    freeComment: '',
  },
];

// フィルター状態
interface LendingFilter {
  category: string;
  majorCategory: string;
  middleCategory: string;
  itemName: string;
  maker: string;
  model: string;
  status: string;
  installedDepartment: string;
  overdueOnly: boolean;
  fixedPlacementOnly: boolean;
}

export const LendingManagementTab: React.FC = () => {
  const [devices] = useState<LendingDevice[]>(MOCK_LENDING_DEVICES);
  const [filter, setFilter] = useState<LendingFilter>({
    category: '',
    majorCategory: '',
    middleCategory: '',
    itemName: '',
    maker: '',
    model: '',
    status: '',
    installedDepartment: '',
    overdueOnly: false,
    fixedPlacementOnly: false,
  });

  // フィルター適用
  const filteredDevices = devices.filter(device => {
    if (filter.category && device.category !== filter.category) return false;
    if (filter.majorCategory && device.majorCategory !== filter.majorCategory) return false;
    if (filter.middleCategory && device.middleCategory !== filter.middleCategory) return false;
    if (filter.itemName && !device.itemName.includes(filter.itemName)) return false;
    if (filter.maker && device.maker !== filter.maker) return false;
    if (filter.model && !device.model.includes(filter.model)) return false;
    if (filter.status && device.status !== filter.status) return false;
    if (filter.installedDepartment && device.installedDepartment !== filter.installedDepartment) return false;
    if (filter.overdueOnly && device.overduedays <= 0) return false;
    if (filter.fixedPlacementOnly && !device.isFixedPlacement) return false;
    return true;
  });

  // ユニークな値を取得
  const uniqueCategories = [...new Set(devices.map(d => d.category))];
  const uniqueMajorCategories = [...new Set(devices.map(d => d.majorCategory))];
  const uniqueMiddleCategories = [...new Set(devices.map(d => d.middleCategory))];
  const uniqueMakers = [...new Set(devices.map(d => d.maker))];
  const uniqueDepartments = [...new Set(devices.map(d => d.installedDepartment))];
  const uniqueStatuses: LendingDevice['status'][] = ['貸出可', '貸出中', '点検中', '修理中', '廃棄予定'];

  const getStatusStyle = (status: LendingDevice['status']): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 'bold',
    };
    switch (status) {
      case '貸出可':
        return { ...baseStyle, background: '#e8f5e9', color: '#2e7d32' };
      case '貸出中':
        return { ...baseStyle, background: '#e3f2fd', color: '#1565c0' };
      case '点検中':
        return { ...baseStyle, background: '#fff3e0', color: '#ef6c00' };
      case '修理中':
        return { ...baseStyle, background: '#fce4ec', color: '#c2185b' };
      case '廃棄予定':
        return { ...baseStyle, background: '#f5f5f5', color: '#616161' };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* フィルター */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>category</label>
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>大分類</label>
          <select
            value={filter.majorCategory}
            onChange={(e) => setFilter(prev => ({ ...prev, majorCategory: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMajorCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>中分類</label>
          <select
            value={filter.middleCategory}
            onChange={(e) => setFilter(prev => ({ ...prev, middleCategory: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMiddleCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>品目</label>
          <input
            type="text"
            value={filter.itemName}
            onChange={(e) => setFilter(prev => ({ ...prev, itemName: e.target.value }))}
            placeholder="品目名"
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '120px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>メーカー</label>
          <select
            value={filter.maker}
            onChange={(e) => setFilter(prev => ({ ...prev, maker: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMakers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>型式</label>
          <input
            type="text"
            value={filter.model}
            onChange={(e) => setFilter(prev => ({ ...prev, model: e.target.value }))}
            placeholder="型式"
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>ステータス</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>設置部署</label>
          <select
            value={filter.installedDepartment}
            onChange={(e) => setFilter(prev => ({ ...prev, installedDepartment: e.target.value }))}
            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
            <input
              type="checkbox"
              checked={filter.overdueOnly}
              onChange={(e) => setFilter(prev => ({ ...prev, overdueOnly: e.target.checked }))}
            />
            返却超過機器
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
            <input
              type="checkbox"
              checked={filter.fixedPlacementOnly}
              onChange={(e) => setFilter(prev => ({ ...prev, fixedPlacementOnly: e.target.checked }))}
            />
            定数配置設定機器
          </label>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            {/* グループヘッダー */}
            <tr style={{ background: '#e9ecef' }}>
              <th colSpan={5} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                商品情報
              </th>
              <th style={{ borderLeft: '2px solid #ccc', width: '1px' }}></th>
              <th colSpan={6} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                貸出機器状況
              </th>
              <th style={{ borderLeft: '2px solid #ccc', width: '1px' }}></th>
              <th colSpan={3} style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                操作
              </th>
            </tr>
            {/* カラムヘッダー */}
            <tr style={{ background: '#f8f9fa' }}>
              {/* 商品情報 */}
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>QRラベル</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>ME管理No.</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>品目</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>メーカー</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
              {/* セパレータ */}
              <th style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></th>
              {/* 貸出機器状況 */}
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>ステータス</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>設置部署</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>貸出日</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>返却予定日</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>返却超過日数</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>点検余裕日数</th>
              {/* セパレータ */}
              <th style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></th>
              {/* 操作 */}
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>返却期間設定</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>定数機器設定</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap', color: '#c0392b' }}>フリーコメント</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  データがありません
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => (
                <tr
                  key={device.id}
                  style={{
                    background: index % 2 === 0 ? 'white' : '#fafafa',
                    ...(device.overduedays > 0 ? { background: '#fff5f5' } : {}),
                  }}
                >
                  {/* 商品情報 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{device.qrLabel}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{device.meManagementNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.itemName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.maker}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.model}</td>
                  {/* セパレータ */}
                  <td style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></td>
                  {/* 貸出機器状況 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <span style={getStatusStyle(device.status)}>{device.status}</span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{device.installedDepartment}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {device.lendingDate || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {device.expectedReturnDate || '-'}
                  </td>
                  <td style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    fontWeight: device.overduedays > 0 ? 'bold' : 'normal',
                    color: device.overduedays > 0 ? '#c0392b' : '#333',
                  }}>
                    {device.overduedays > 0 ? `${device.overduedays}日` : '-'}
                  </td>
                  <td style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    color: device.inspectionMarginDays <= 14 ? '#e67e22' : '#333',
                  }}>
                    {device.inspectionMarginDays}日
                  </td>
                  {/* セパレータ */}
                  <td style={{ borderLeft: '2px solid #ccc', border: '1px solid #ddd', width: '1px', padding: 0 }}></td>
                  {/* 操作 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`返却期間設定: ${device.qrLabel}`);
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      設定
                    </a>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`定数機器設定: ${device.qrLabel}`);
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      {device.isFixedPlacement ? '解除' : '設定'}
                    </a>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const comment = prompt('コメントを入力', device.freeComment);
                        if (comment !== null) {
                          alert(`コメント保存: ${comment}`);
                        }
                      }}
                      style={{ color: '#c0392b', textDecoration: 'underline', fontSize: '11px' }}
                    >
                      {device.freeComment ? '編集' : '入力'}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
