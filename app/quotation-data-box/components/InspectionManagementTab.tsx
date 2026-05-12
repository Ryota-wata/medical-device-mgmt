'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useInspectionStore } from '@/lib/stores';
import { InspectionTask, LendingStatus } from '@/lib/types';
import { InspectionMenuModal } from './InspectionMenuModal';
import { InspectionRegistrationModal } from './InspectionRegistrationModal';

interface InspectionManagementTabProps {
  isMobile?: boolean;
}

// ソート方向
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'maker' | 'model' | 'lendingStatus' | 'nextInspectionDate' | 'status';

// 貸出ステータスの色
const LENDING_STATUS_COLORS: Record<LendingStatus, string> = {
  '待機中': '#8A8A8A',
  '貸出可': '#008C1D',
  '貸出中': '#0092E6',
  '使用中': '#A35414',
  '使用済': '#8A8A8A',
  '返却済': '#16a085',
  '使用不可': '#DA0000',
};

// 定期ステータスの色
const getInspectionStatusColor = (status: string): string => {
  if (status === '点検月超過') return '#DA0000';
  if (status === '点検週') return '#A30000';
  if (status === '点検月') return '#A35414';
  if (status.includes('ヶ月前')) return '#0092E6';
  return '#8A8A8A';
};

// 定期ステータスの行背景色
const getRowHighlight = (status: string): string | undefined => {
  if (status === '点検月超過') return '#fff0f0';
  if (status === '点検週') return '#fff8e1';
  if (status === '点検月') return '#fffde7';
  return undefined;
};

// ソート値の算出（ステータス順序）
const getStatusSortValue = (status: string): number => {
  if (status === '点検月超過') return 0;
  if (status === '点検週') return 1;
  if (status === '点検月') return 2;
  const match = status.match(/点検(\d+)ヶ月前/);
  if (match) return 2 + parseInt(match[1], 10);
  return 999;
};

// 貸出ステータスソート値
const LENDING_STATUS_ORDER: Record<LendingStatus, number> = {
  '使用不可': 0,
  '使用中': 1,
  '貸出中': 2,
  '使用済': 3,
  '返却済': 4,
  '待機中': 5,
  '貸出可': 6,
};

export function InspectionManagementTab({ isMobile = false }: InspectionManagementTabProps) {
  const router = useRouter();
  const { tasks, menus, skipInspection, setInspectionDate, getMenuById } = useInspectionStore();

  // フィルター状態（REQ-108: 4項目のみ）
  const [filters, setFilters] = useState({
    inspectionDate: '',      // 点検超過 / 点検月 / 点検１ヶ月前
    inspectionType: '',      // 院内点検 / メーカー点検 / スポット点検
    inspectionGroupName: '',
    lendingState: '',        // 貸出中 / 貸出中以外
  });

  // ソート状態
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // モーダル状態
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedTaskForDate, setSelectedTaskForDate] = useState<InspectionTask | null>(null);
  const [newDate, setNewDate] = useState('');
  // Actionドロップダウン状態
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    if (openActionId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionId]);

  // 保守・点検グループ名のオプション
  const inspectionGroupOptions = useMemo(() => {
    return [...new Set(tasks.map(t => t.inspectionGroupName).filter(Boolean))] as string[];
  }, [tasks]);

  // 貸出ステータスオプション

  // フィルタリング（REQ-108: 4項目）
  const filteredTasks = useMemo(() => {
    // 点検日 表示値 → task.status データ値 マッピング
    const inspectionDateMap: Record<string, string> = {
      '点検超過': '点検月超過',
      '点検月': '点検月',
      '点検１ヶ月前': '点検1ヶ月前',
    };
    // 定期点検種別 表示値 → task.inspectionType データ値 マッピング
    const inspectionTypeMap: Record<string, string> = {
      '院内点検': '院内定期点検',
      'メーカー点検': 'メーカー保守',
      'スポット点検': '院内スポット点検',
    };
    return tasks.filter((task) => {
      if (filters.inspectionDate) {
        const target = inspectionDateMap[filters.inspectionDate];
        if (target && task.status !== target) return false;
      }
      if (filters.inspectionType) {
        const target = inspectionTypeMap[filters.inspectionType];
        if (target && task.inspectionType !== target) return false;
      }
      if (filters.inspectionGroupName && task.inspectionGroupName !== filters.inspectionGroupName) return false;
      if (filters.lendingState) {
        if (filters.lendingState === '貸出中' && task.lendingStatus !== '貸出中') return false;
        if (filters.lendingState === '貸出中以外' && task.lendingStatus === '貸出中') return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // ソート適用
  const sortedTasks = useMemo(() => {
    if (!sortField || !sortDirection) return filteredTasks;
    const sorted = [...filteredTasks];
    const mul = sortDirection === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortField) {
        case 'maker': return a.maker.localeCompare(b.maker) * mul;
        case 'model': return a.model.localeCompare(b.model) * mul;
        case 'lendingStatus': return (LENDING_STATUS_ORDER[a.lendingStatus] - LENDING_STATUS_ORDER[b.lendingStatus]) * mul;
        case 'nextInspectionDate': return a.nextInspectionDate.localeCompare(b.nextInspectionDate) * mul;
        case 'status': return (getStatusSortValue(a.status) - getStatusSortValue(b.status)) * mul;
        default: return 0;
      }
    });
    return sorted;
  }, [filteredTasks, sortField, sortDirection]);

  const handleSortToggle = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField(null);
      setSortDirection(null);
    }
  };

  const getSortArrow = (field: SortField) => {
    const isActive = sortField === field;
    const upColor = isActive && sortDirection === 'asc' ? '#A30000' : '#aaa';
    const downColor = isActive && sortDirection === 'desc' ? '#A30000' : '#aaa';
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '2px', lineHeight: 1, fontSize: '8px', verticalAlign: 'middle' }}>
        <span style={{ color: upColor }}>&#9650;</span>
        <span style={{ color: downColor, marginTop: '-2px' }}>&#9660;</span>
      </span>
    );
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ inspectionDate: '', inspectionType: '', inspectionGroupName: '', lendingState: '' });
    setSortField(null);
    setSortDirection(null);
  };

  // 点検メニュー名取得
  const getPeriodicMenuDisplay = (task: InspectionTask) => {
    if (task.inspectionType === 'メーカー保守') {
      return task.inspectionGroupName || task.vendorName || '-';
    }
    const names = task.periodicMenuIds
      .map((id) => getMenuById(id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };

  // 点検周期取得
  const getPeriodicCycle = (task: InspectionTask) => {
    if (task.inspectionType === 'メーカー保守') return '-';
    const cycles = task.periodicMenuIds
      .map((id) => {
        const menu = getMenuById(id);
        return menu?.cycleMonths ? `${menu.cycleMonths}ヶ月` : null;
      })
      .filter(Boolean);
    return cycles.length > 0 ? cycles.join(', ') : '-';
  };

  // 操作ハンドラ
  const handleStartInspection = (task: InspectionTask) => {
    setOpenActionId(null);
    sessionStorage.setItem('periodicInspectionTask', JSON.stringify(task));
    router.push('/periodic-inspection');
  };

  const handleSkipInspection = (task: InspectionTask) => {
    setOpenActionId(null);
    skipInspection(task.id);
  };

  const handleOpenDateModal = (task: InspectionTask) => {
    setOpenActionId(null);
    setSelectedTaskForDate(task);
    setNewDate(task.nextInspectionDate);
    setIsDateModalOpen(true);
  };

  const handleSetDate = () => {
    if (selectedTaskForDate && newDate) {
      setInspectionDate(selectedTaskForDate.id, newDate);
      setIsDateModalOpen(false);
      setSelectedTaskForDate(null);
    }
  };

  const handleResultRegistration = (task: InspectionTask) => {
    setOpenActionId(null);
    if (task.inspectionType === 'メーカー保守') {
      sessionStorage.setItem('makerMaintenanceTask', JSON.stringify(task));
      router.push('/maker-maintenance-result');
    } else {
      alert('結果登録（未実装）');
    }
  };

  const handleExportSchedule = () => {
    alert('点検予定表をCSV出力します');
  };

  // テーブルヘッダースタイル
  const thGroup: React.CSSProperties = {
    padding: '8px 6px',
    border: '1px solid #4A4A4A',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    textAlign: 'center',
  };
  const thSub: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #8A8A8A',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
  };
  const thSortable: React.CSSProperties = { ...thSub, cursor: 'pointer', userSelect: 'none' };
  const td: React.CSSProperties = {
    padding: '8px',
    border: '1px solid #E1E1E1',
    whiteSpace: 'nowrap',
    fontSize: '13px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ボタンバー */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #E1E1E1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={() => setIsMenuModalOpen(true)} style={btnStyle('#008C1D')}>点検メニュー登録</button>
        <button onClick={handleExportSchedule} style={btnStyle('#FFFFFF')}>点検予定表の出力</button>
      </div>

      {/* フィルターエリア（REQ-108: 4項目のみ） */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E1E1E1', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'nowrap' }}>
          <FilterItem label="点検日">
            <SearchableSelect value={filters.inspectionDate} onChange={(v) => handleFilterChange('inspectionDate', v)} options={['点検超過', '点検月', '点検１ヶ月前']} placeholder="全て" />
          </FilterItem>
          <FilterItem label="定期点検種別">
            <SearchableSelect value={filters.inspectionType} onChange={(v) => handleFilterChange('inspectionType', v)} options={['院内点検', 'メーカー点検', 'スポット点検']} placeholder="全て" />
          </FilterItem>
          <FilterItem label="点検グループ名">
            <SearchableSelect value={filters.inspectionGroupName} onChange={(v) => handleFilterChange('inspectionGroupName', v)} options={inspectionGroupOptions} placeholder="全て" />
          </FilterItem>
          <FilterItem label="貸出状況">
            <SearchableSelect value={filters.lendingState} onChange={(v) => handleFilterChange('lendingState', v)} options={['貸出中', '貸出中以外']} placeholder="全て" />
          </FilterItem>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button onClick={handleClearFilters} style={{ background: '#8A8A8A', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
            フィルタークリア
          </button>
          <span style={{ fontSize: '13px', color: '#555' }}>{sortedTasks.length} 件</span>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            {/* グループヘッダー */}
            <tr>
              <th colSpan={2} style={{ ...thGroup, background: '#EBF5EE', color: '#333' }}>設置情報</th>
              <th colSpan={4} style={{ ...thGroup, background: '#fff9c4', color: '#333' }}>商品情報</th>
              <th style={{ ...thGroup, background: '#EAF3FB', color: '#333' }}>貸出状況</th>
              <th colSpan={6} style={{ ...thGroup, background: '#ffccbc', color: '#333' }}>定期点検情報</th>
              <th colSpan={3} style={{ ...thGroup, background: '#F1ECF7', color: '#333' }}>操作</th>
            </tr>
            {/* サブカラムヘッダー */}
            <tr>
              <th style={{ ...thSub, background: '#EBF5EE' }}>部門</th>
              <th style={{ ...thSub, background: '#EBF5EE' }}>部署</th>
              <th style={{ ...thSub, background: '#fffde7' }}>QRコード</th>
              <th style={{ ...thSub, background: '#fffde7' }}>品目</th>
              <th style={{ ...thSortable, background: '#fffde7' }} onClick={() => handleSortToggle('maker')}>メーカー{getSortArrow('maker')}</th>
              <th style={{ ...thSortable, background: '#fffde7' }} onClick={() => handleSortToggle('model')}>型式{getSortArrow('model')}</th>
              <th style={{ ...thSortable, background: '#EAF3FB' }} onClick={() => handleSortToggle('lendingStatus')}>ステータス{getSortArrow('lendingStatus')}</th>
              <th style={{ ...thSub, background: '#fbe9e7' }}>種別</th>
              <th style={{ ...thSub, background: '#fbe9e7' }}>点検メニュー</th>
              <th style={{ ...thSub, background: '#fbe9e7' }}>点検周期</th>
              <th style={{ ...thSub, background: '#fbe9e7' }}>前回点検日</th>
              <th style={{ ...thSortable, background: '#fbe9e7' }} onClick={() => handleSortToggle('nextInspectionDate')}>次回点検予定{getSortArrow('nextInspectionDate')}</th>
              <th style={{ ...thSortable, background: '#fbe9e7' }} onClick={() => handleSortToggle('status')}>ステータス{getSortArrow('status')}</th>
              <th style={{ ...thSub, background: '#F1ECF7', textAlign: 'center' }}>Action</th>
              <th style={{ ...thSub, background: '#F1ECF7', textAlign: 'center' }}>設定変更</th>
              <th style={{ ...thSub, background: '#F1ECF7', textAlign: 'center' }}>カルテ</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ padding: '48px', textAlign: 'center', color: '#8A8A8A', fontSize: '14px', border: '1px solid #E1E1E1' }}>
                  点検タスクがありません。資産を選択して点検タスクを追加してください。
                </td>
              </tr>
            ) : (
              sortedTasks.map((task, index) => {
                const rowBg = getRowHighlight(task.status) || (index % 2 === 0 ? 'white' : '#FAFAFA');
                return (
                  <tr key={task.id} style={{ background: rowBg }}>
                    {/* 設置情報 */}
                    <td style={td}>{task.managementDepartment}</td>
                    <td style={td}>{task.installedDepartment}</td>
                    {/* 商品情報 */}
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600, color: '#0092E6' }}>{task.assetId}</td>
                    <td style={td}>{task.assetName}</td>
                    <td style={td}>{task.maker}</td>
                    <td style={td}>{task.model}</td>
                    {/* 貸出状況 */}
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: LENDING_STATUS_COLORS[task.lendingStatus] || '#8A8A8A',
                        color: 'white',
                        whiteSpace: 'nowrap',
                      }}>
                        {task.lendingStatus}
                      </span>
                    </td>
                    {/* 定期点検情報 */}
                    <td style={td}>{task.inspectionType}</td>
                    <td style={{ ...td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getPeriodicMenuDisplay(task)}</td>
                    <td style={td}>{getPeriodicCycle(task)}</td>
                    <td style={td} className="tabular-nums">{task.lastInspectionDate || '-'}</td>
                    <td style={td} className="tabular-nums">{task.nextInspectionDate}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: getInspectionStatusColor(task.status),
                        color: 'white',
                        whiteSpace: 'nowrap',
                      }}>
                        {task.status}
                      </span>
                    </td>
                    {/* 操作: Action ドロップダウン */}
                    <td style={{ ...td, textAlign: 'center', position: 'relative' }}>
                      <div ref={openActionId === task.id ? actionRef : null} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={() => setOpenActionId(openActionId === task.id ? null : task.id)}
                          style={{
                            padding: '4px 12px',
                            background: '#4A4A4A',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          Action ▾
                        </button>
                        {openActionId === task.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '2px',
                            background: 'white',
                            border: '1px solid #E1E1E1',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            minWidth: '120px',
                          }}>
                            <button
                              onClick={() => handleOpenDateModal(task)}
                              style={dropdownItemStyle('#0092E6')}
                            >
                              日程調整
                            </button>
                            {task.inspectionType !== 'メーカー保守' && (
                              <button
                                onClick={() => handleStartInspection(task)}
                                style={dropdownItemStyle('#008C1D')}
                              >
                                点検実施
                              </button>
                            )}
                            {task.inspectionType === 'メーカー保守' && (
                              <button
                                onClick={() => handleResultRegistration(task)}
                                style={dropdownItemStyle('#4527A0')}
                              >
                                結果登録
                              </button>
                            )}
                            <button
                              onClick={() => handleSkipInspection(task)}
                              style={dropdownItemStyle('#8A8A8A')}
                            >
                              スキップ
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 操作: 設定変更 */}
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button
                        onClick={() => alert(`設定変更: ${task.assetName}（未実装）`)}
                        aria-label="設定変更"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px 8px',
                          color: '#555',
                        }}
                      >
                        ⚙
                      </button>
                    </td>
                    {/* 操作: カルテ */}
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button
                        onClick={() => alert(`点検カルテ: ${task.assetName}（未実装）`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#0092E6',
                          textDecoration: 'underline',
                          padding: '4px 8px',
                        }}
                      >
                        カルテ
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 点検メニュー登録モーダル */}
      <InspectionMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
      />

      {/* 点検登録モーダル */}
      <InspectionRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />

      {/* 日程調整モーダル */}
      {isDateModalOpen && selectedTaskForDate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsDateModalOpen(false)}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#4A4A4A' }}>点検日程調整</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#8A8A8A' }}>{selectedTaskForDate.assetName}</p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#333' }}>点検予定日</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', marginTop: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsDateModalOpen(false)} style={{ padding: '10px 20px', background: '#8A8A8A', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleSetDate} style={{ padding: '10px 20px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>設定</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ヘルパーコンポーネント: フィルター項目
function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', maxWidth: '180px' }}>
      <label style={{ fontSize: '12px', color: '#555', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

// ヘルパー: ボタンスタイル（背景が白の場合はoutlineスタイル）
function btnStyle(bg: string): React.CSSProperties {
  const isWhite = bg === '#FFFFFF' || bg === '#fff' || bg === 'white';
  return {
    backgroundColor: bg,
    color: isWhite ? '#4A4A4A' : 'white',
    border: isWhite ? '1px solid #E1E1E1' : 'none',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

// ヘルパー: ドロップダウンメニュー項目スタイル
function dropdownItemStyle(color: string): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    textAlign: 'left',
    fontSize: '12px',
    color: color,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
