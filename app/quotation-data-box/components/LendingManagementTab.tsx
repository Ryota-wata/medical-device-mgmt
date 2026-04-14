'use client';

import React, { useState, useMemo } from 'react';
import { useLendingStore } from '@/lib/stores';

// ステータス型
type LendingStatus = '待機中' | '貸出可' | '貸出中' | '使用中' | '使用済' | '返却済' | '使用不可';

// 定期点検ステータス型
type PeriodicInspectionStatus = '01点検週' | '02点検月' | '03点検●ヶ月前' | '04点検月超過' | null;

// 貸出機器データ型
interface LendingDevice {
  id: number;
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  status: LendingStatus;
  installedDepartment: string;
  lendingDate: string | null;
  overdueDays: number;
  dailyInspectionMenu: string | null;
  dailyInspectionDate: string | null;
  periodicInspectionStatus: PeriodicInspectionStatus;
  lendingCount: number;
  lendingGroupName: string;
  lendingTypeName: string;
  alertDays: number;
  freeComment: string;
}

// フィルター状態
interface LendingFilter {
  lendingGroupName: string;
  itemName: string;
  maker: string;
  model: string;
  status: string;
  installedDepartment: string;
  overdueOnly: boolean;
}

// ソート状態
type SortDirection = 'asc' | 'desc' | null;
type SortableField = 'maker' | 'model' | 'lendingDate' | 'dailyInspectionDate' | 'periodicInspectionStatus' | 'lendingCount';

interface SortState {
  field: SortableField | null;
  direction: SortDirection;
}

// モックデータ
const MOCK_LENDING_DEVICES: LendingDevice[] = [
  {
    id: 1,
    qrCode: 'QR-001',
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    status: '貸出中',
    installedDepartment: 'ICU',
    lendingDate: '2026-01-15',
    overdueDays: 45,
    dailyInspectionMenu: '人工呼吸器 使用前後点検',
    dailyInspectionDate: '2026-02-15',
    periodicInspectionStatus: '02点検月',
    lendingCount: 8,
    lendingGroupName: 'ME機器貸出A',
    lendingTypeName: '短期貸出',
    alertDays: 7,
    freeComment: '',
  },
  {
    id: 2,
    qrCode: 'QR-002',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-171',
    status: '使用中',
    installedDepartment: '3階東病棟',
    lendingDate: '2026-02-20',
    overdueDays: 0,
    dailyInspectionMenu: '輸液ポンプ 使用前後点検',
    dailyInspectionDate: '2026-02-19',
    periodicInspectionStatus: '01点検週',
    lendingCount: 12,
    lendingGroupName: 'ME機器貸出A',
    lendingTypeName: '短期貸出',
    alertDays: 3,
    freeComment: '長期貸出申請中',
  },
  {
    id: 3,
    qrCode: 'QR-003',
    itemName: 'シリンジポンプ',
    maker: 'テルモ',
    model: 'TE-SS700',
    status: '貸出可',
    installedDepartment: 'ME室',
    lendingDate: null,
    overdueDays: 0,
    dailyInspectionMenu: 'シリンジポンプ 使用前後点検',
    dailyInspectionDate: '2026-03-10',
    periodicInspectionStatus: '01点検週',
    lendingCount: 5,
    lendingGroupName: 'ME機器貸出A',
    lendingTypeName: '短期貸出',
    alertDays: 3,
    freeComment: '',
  },
  {
    id: 4,
    qrCode: 'QR-004',
    itemName: '除細動器',
    maker: '日本光電',
    model: 'TEC-5600',
    status: '待機中',
    installedDepartment: 'ME室',
    lendingDate: null,
    overdueDays: 0,
    dailyInspectionMenu: '除細動器 日常点検',
    dailyInspectionDate: null,
    periodicInspectionStatus: '03点検●ヶ月前',
    lendingCount: 3,
    lendingGroupName: '救急機器貸出',
    lendingTypeName: '定数配置',
    alertDays: 14,
    freeComment: '日常点検待ち',
  },
  {
    id: 5,
    qrCode: 'QR-005',
    itemName: '心電計',
    maker: 'フクダ電子',
    model: 'FX-8000',
    status: '返却済',
    installedDepartment: 'ME室',
    lendingDate: null,
    overdueDays: 0,
    dailyInspectionMenu: '心電計 使用前後点検',
    dailyInspectionDate: '2026-03-01',
    periodicInspectionStatus: '02点検月',
    lendingCount: 6,
    lendingGroupName: '救急機器貸出',
    lendingTypeName: '短期貸出',
    alertDays: 7,
    freeComment: '',
  },
  {
    id: 6,
    qrCode: 'QR-006',
    itemName: '生体情報モニタ',
    maker: '日本光電',
    model: 'BSM-3000',
    status: '使用不可',
    installedDepartment: 'ME室',
    lendingDate: null,
    overdueDays: 0,
    dailyInspectionMenu: null,
    dailyInspectionDate: null,
    periodicInspectionStatus: '04点検月超過',
    lendingCount: 2,
    lendingGroupName: 'ME機器貸出A',
    lendingTypeName: '短期貸出',
    alertDays: 7,
    freeComment: '修理申請中',
  },
  {
    id: 7,
    qrCode: 'QR-007',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-171',
    status: '使用済',
    installedDepartment: '2階西病棟',
    lendingDate: '2026-03-01',
    overdueDays: 0,
    dailyInspectionMenu: '輸液ポンプ 使用前後点検',
    dailyInspectionDate: '2026-02-28',
    periodicInspectionStatus: '01点検週',
    lendingCount: 9,
    lendingGroupName: 'ME機器貸出A',
    lendingTypeName: '短期貸出',
    alertDays: 3,
    freeComment: '',
  },
];

// ステータスバッジスタイル
const getStatusStyle = (status: LendingStatus): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  };
  switch (status) {
    case '待機中':
      return { ...baseStyle, background: '#fff3e0', color: '#e65100' };
    case '貸出可':
      return { ...baseStyle, background: '#e8f5e9', color: '#2e7d32' };
    case '貸出中':
      return { ...baseStyle, background: '#e3f2fd', color: '#1565c0' };
    case '使用中':
      return { ...baseStyle, background: '#e8eaf6', color: '#283593' };
    case '使用済':
      return { ...baseStyle, background: '#f3e5f5', color: '#6a1b9a' };
    case '返却済':
      return { ...baseStyle, background: '#e0f2f1', color: '#00695c' };
    case '使用不可':
      return { ...baseStyle, background: '#fce4ec', color: '#b71c1c' };
    default:
      return baseStyle;
  }
};

// 定期点検ステータスのスタイル
const getPeriodicInspectionStyle = (status: PeriodicInspectionStatus): React.CSSProperties => {
  if (!status) return {};
  switch (status) {
    case '01点検週':
      return { color: '#2e7d32' };
    case '02点検月':
      return { color: '#1565c0' };
    case '03点検●ヶ月前':
      return { color: '#e65100' };
    case '04点検月超過':
      return { color: '#b71c1c', fontWeight: 'bold' };
    default:
      return {};
  }
};

// テーブルスタイル
const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #495057',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #6c757d',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  cursor: 'default',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #ddd',
  whiteSpace: 'nowrap',
  fontSize: '13px',
};

export const LendingManagementTab: React.FC = () => {
  const { devices: storeDevices, updateDevice: storeUpdateDevice, removeDevice: storeRemoveDevice } = useLendingStore();
  const [devices, setDevices] = useState<LendingDevice[]>([]);

  React.useEffect(() => {
    setDevices(storeDevices as LendingDevice[]);
  }, [storeDevices]);
  const [filter, setFilter] = useState<LendingFilter>({
    lendingGroupName: '',
    itemName: '',
    maker: '',
    model: '',
    status: '',
    installedDepartment: '',
    overdueOnly: false,
  });

  // ソート状態
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: null });

  // 設定モーダル（フリーコメント＋貸出設定を統合）
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [selectedDeviceForSetting, setSelectedDeviceForSetting] = useState<LendingDevice | null>(null);
  const [settingTypeName, setSettingTypeName] = useState('');
  const [settingAlertDays, setSettingAlertDays] = useState(0);
  const [settingComment, setSettingComment] = useState('');

  // フィルターオプション生成
  const uniqueGroupNames = useMemo(() => [...new Set(devices.map(d => d.lendingGroupName))].sort(), [devices]);
  const uniqueMakers = useMemo(() => [...new Set(devices.map(d => d.maker))].sort(), [devices]);
  const uniqueDepartments = useMemo(() => [...new Set(devices.map(d => d.installedDepartment))].sort(), [devices]);
  const allStatuses: LendingStatus[] = ['待機中', '貸出可', '貸出中', '使用中', '使用済', '返却済', '使用不可'];

  // フィルター適用
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      if (filter.lendingGroupName && device.lendingGroupName !== filter.lendingGroupName) return false;
      if (filter.itemName && !device.itemName.includes(filter.itemName)) return false;
      if (filter.maker && device.maker !== filter.maker) return false;
      if (filter.model && !device.model.includes(filter.model)) return false;
      if (filter.status && device.status !== filter.status) return false;
      if (filter.installedDepartment && device.installedDepartment !== filter.installedDepartment) return false;
      if (filter.overdueOnly && device.overdueDays <= 0) return false;
      return true;
    });
  }, [devices, filter]);

  // ソート適用
  const sortedDevices = useMemo(() => {
    if (!sortState.field || !sortState.direction) return filteredDevices;

    const sorted = [...filteredDevices];
    const { field, direction } = sortState;
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }

      return String(valA).localeCompare(String(valB), 'ja') * multiplier;
    });

    return sorted;
  }, [filteredDevices, sortState]);

  // ソートトグル
  const handleSort = (field: SortableField) => {
    setSortState(prev => {
      if (prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      if (prev.direction === 'desc') return { field: null, direction: null };
      return { field, direction: 'asc' };
    });
  };

  // ソート矢印の表示
  const getSortArrow = (field: SortableField) => {
    const isActive = sortState.field === field;
    const upColor = isActive && sortState.direction === 'asc' ? '#c0392b' : '#aaa';
    const downColor = isActive && sortState.direction === 'desc' ? '#c0392b' : '#aaa';
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '2px', lineHeight: 1, fontSize: '9px', verticalAlign: 'middle' }}>
        <span style={{ color: upColor }}>&#9650;</span>
        <span style={{ color: downColor, marginTop: '-2px' }}>&#9660;</span>
      </span>
    );
  };

  // 設定モーダルを開く（フリーコメント＋貸出設定を統合）
  const openSettingModal = (device: LendingDevice) => {
    setSelectedDeviceForSetting(device);
    setSettingTypeName(device.lendingTypeName);
    setSettingAlertDays(device.alertDays);
    setSettingComment(device.freeComment);
    setShowSettingModal(true);
  };

  const handleSaveSetting = () => {
    if (!selectedDeviceForSetting) return;
    setDevices(prev => prev.map(d =>
      d.id === selectedDeviceForSetting.id
        ? { ...d, lendingTypeName: settingTypeName, alertDays: settingAlertDays, freeComment: settingComment }
        : d
    ));
    setShowSettingModal(false);
    setSelectedDeviceForSetting(null);
    alert('設定を保存しました');
  };

  const handleReleaseLending = () => {
    if (!selectedDeviceForSetting) return;
    if (!confirm(`${selectedDeviceForSetting.qrCode}（${selectedDeviceForSetting.itemName}）を貸出管理から解除しますか？`)) return;
    setDevices(prev => prev.filter(d => d.id !== selectedDeviceForSetting.id));
    setShowSettingModal(false);
    setSelectedDeviceForSetting(null);
    alert('貸出機器を解除しました');
  };

  // フィルタークリア
  const clearFilter = () => {
    setFilter({
      lendingGroupName: '',
      itemName: '',
      maker: '',
      model: '',
      status: '',
      installedDepartment: '',
      overdueOnly: false,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 情報バー */}
      <div style={{
        padding: '12px 16px',
        background: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#333' }}>登録済み機器: <strong>{devices.length}件</strong></span>
          <span style={{
            background: '#343a40',
            color: 'white',
            padding: '4px 14px',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            絞込み台数 : <strong>{sortedDevices.length}</strong> 台
          </span>
        </div>
        <div />
      </div>

      {/* フィルターバー */}
      <div style={{
        padding: '10px 16px',
        background: 'white',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            value={filter.lendingGroupName}
            onChange={(e) => setFilter(prev => ({ ...prev, lendingGroupName: e.target.value }))}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #999',
              borderRadius: '3px',
              minWidth: '200px',
              fontWeight: 600,
            }}
          >
            <option value="">貸出グループ名</option>
            {uniqueGroupNames.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>品目</label>
          <input
            type="text"
            value={filter.itemName}
            onChange={(e) => setFilter(prev => ({ ...prev, itemName: e.target.value }))}
            placeholder="品目名"
            style={{ padding: '5px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '120px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>メーカー</label>
          <select
            value={filter.maker}
            onChange={(e) => setFilter(prev => ({ ...prev, maker: e.target.value }))}
            style={{ padding: '5px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="">すべて</option>
            {uniqueMakers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#555' }}>型式</label>
          <input
            type="text"
            value={filter.model}
            onChange={(e) => setFilter(prev => ({ ...prev, model: e.target.value }))}
            style={{ padding: '5px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              border: '2px solid #f1c40f',
              borderRadius: '3px',
              minWidth: '120px',
              fontWeight: 600,
              background: '#fffde7',
            }}
          >
            <option value="">ステータス</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            value={filter.installedDepartment}
            onChange={(e) => setFilter(prev => ({ ...prev, installedDepartment: e.target.value }))}
            style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #999', borderRadius: '3px', minWidth: '120px' }}
          >
            <option value="">設置部署</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#333', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filter.overdueOnly}
            onChange={(e) => setFilter(prev => ({ ...prev, overdueOnly: e.target.checked }))}
          />
          返却超過機器
        </label>

        <button
          onClick={clearFilter}
          style={{
            padding: '5px 12px',
            background: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#555',
          }}
        >
          クリア
        </button>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            {/* グループヘッダー */}
            <tr style={{ background: '#343a40', color: 'white' }}>
              <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center', background: '#fce4ec', color: '#333', borderColor: '#e57373' }}>商品情報</th>
              <th colSpan={8} style={{ ...thGroupStyle, textAlign: 'center', background: '#fff9c4', color: '#333', borderColor: '#f9a825' }}>貸出機器状況</th>
              <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center', background: '#f3e5f5', color: '#333', borderColor: '#ba68c8' }}>操作</th>
            </tr>
            {/* サブカラムヘッダー */}
            <tr style={{ background: '#495057', color: 'white' }}>
              {/* 商品情報 */}
              <th style={{ ...thSubStyle, background: '#ffcdd2', color: '#333', borderColor: '#e57373' }}>QRコード</th>
              <th style={{ ...thSubStyle, background: '#ffcdd2', color: '#333', borderColor: '#e57373' }}>品目</th>
              <th
                style={{ ...thSubStyle, background: '#ffcdd2', color: '#333', borderColor: '#e57373', cursor: 'pointer' }}
                onClick={() => handleSort('maker')}
              >
                メーカー{getSortArrow('maker')}
              </th>
              <th
                style={{ ...thSubStyle, background: '#ffcdd2', color: '#333', borderColor: '#e57373', cursor: 'pointer' }}
                onClick={() => handleSort('model')}
              >
                型式{getSortArrow('model')}
              </th>
              {/* 貸出機器状況 */}
              <th style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825' }}>ステータス</th>
              <th style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825' }}>設置部署</th>
              <th
                style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825', cursor: 'pointer' }}
                onClick={() => handleSort('lendingDate')}
              >
                貸出日{getSortArrow('lendingDate')}
              </th>
              <th style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825' }}>超過日数</th>
              <th style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825' }}>日常点検メニュー</th>
              <th
                style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825', cursor: 'pointer' }}
                onClick={() => handleSort('dailyInspectionDate')}
              >
                日常点検日{getSortArrow('dailyInspectionDate')}
              </th>
              <th
                style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825', cursor: 'pointer' }}
                onClick={() => handleSort('periodicInspectionStatus')}
              >
                定期点検予定{getSortArrow('periodicInspectionStatus')}
              </th>
              <th
                style={{ ...thSubStyle, background: '#fff59d', color: '#333', borderColor: '#f9a825', cursor: 'pointer' }}
                onClick={() => handleSort('lendingCount')}
              >
                貸出回数累計{getSortArrow('lendingCount')}
              </th>
              {/* 操作 */}
              <th style={{ ...thSubStyle, background: '#e1bee7', color: '#333', borderColor: '#ba68c8' }}>フリーコメント</th>
              <th style={{ ...thSubStyle, background: '#e1bee7', color: '#333', borderColor: '#ba68c8' }}>貸出設定変更</th>
              <th style={{ ...thSubStyle, background: '#e1bee7', color: '#333', borderColor: '#ba68c8', textAlign: 'center', width: '40px' }}>
                <span style={{ fontSize: '14px' }}>&#9881;</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDevices.map((device, index) => {
              const isOverdue = device.overdueDays > 0;
              return (
                <tr key={device.id} style={{
                  background: isOverdue ? '#fff5f5' : (index % 2 === 0 ? 'white' : '#fafafa'),
                  verticalAlign: 'top',
                }}>
                  {/* 商品情報 */}
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#3498db' }}>{device.qrCode}</td>
                  <td style={tdStyle}>{device.itemName}</td>
                  <td style={tdStyle}>{device.maker}</td>
                  <td style={tdStyle}>{device.model}</td>
                  {/* 貸出機器状況 */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={getStatusStyle(device.status)}>{device.status}</span>
                  </td>
                  <td style={tdStyle}>{device.installedDepartment}</td>
                  <td style={tdStyle} className="tabular-nums">{device.lendingDate || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums">
                    {isOverdue ? (
                      <span style={{ color: '#c0392b', fontWeight: 'bold' }}>{device.overdueDays}日</span>
                    ) : (
                      <span style={{ color: '#7f8c8d' }}>-</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {device.dailyInspectionMenu || '-'}
                  </td>
                  <td style={tdStyle} className="tabular-nums">{device.dailyInspectionDate || '-'}</td>
                  <td style={tdStyle}>
                    {device.periodicInspectionStatus ? (
                      <span style={getPeriodicInspectionStyle(device.periodicInspectionStatus)}>
                        {device.periodicInspectionStatus}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums">
                    {device.lendingCount}
                  </td>
                  {/* 操作 */}
                  <td style={{ ...tdStyle, fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', color: device.freeComment ? '#333' : '#bbb' }}>
                    {device.freeComment || '-'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span>{device.lendingTypeName}</span>
                      <span style={{ color: '#888' }}>アラート: {device.alertDays}日</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      onClick={() => openSettingModal(device)}
                      style={{ color: '#666', cursor: 'pointer', fontSize: '14px' }}
                      title="設定編集"
                    >
                      &#9881;
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedDevices.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
            該当する貸出機器がありません
          </div>
        )}
      </div>

      {/* 貸出設定モーダル（フリーコメント＋貸出設定 統合） */}
      {showSettingModal && selectedDeviceForSetting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 8, width: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>貸出設定変更</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                {selectedDeviceForSetting.qrCode} - {selectedDeviceForSetting.itemName}（{selectedDeviceForSetting.maker} {selectedDeviceForSetting.model}）
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', textAlign: 'left', width: '140px', fontWeight: 600 }}>貸出種別名</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                      <input
                        type="text"
                        value={settingTypeName}
                        onChange={(e) => setSettingTypeName(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '3px', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>アラート発生日数</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          value={settingAlertDays}
                          onChange={(e) => setSettingAlertDays(Number(e.target.value))}
                          min={0}
                          style={{ width: '80px', padding: '6px 8px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '3px', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '13px', color: '#555' }}>日</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>現在のステータス</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                      <span style={getStatusStyle(selectedDeviceForSetting.status)}>{selectedDeviceForSetting.status}</span>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600, verticalAlign: 'top' }}>フリーコメント</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #dee2e6' }}>
                      <textarea
                        value={settingComment}
                        onChange={(e) => setSettingComment(e.target.value)}
                        placeholder="コメントを入力..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '8px',
                          fontSize: '13px',
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                onClick={handleReleaseLending}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: '#e74c3c',
                  border: '1px solid #e74c3c',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                貸出機解除
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setShowSettingModal(false); setSelectedDeviceForSetting(null); }}
                  style={{ padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveSetting}
                  style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  設定を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
