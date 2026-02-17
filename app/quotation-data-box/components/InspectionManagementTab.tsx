'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useInspectionStore, useMasterStore } from '@/lib/stores';
import { InspectionTask, InspectionTaskStatus } from '@/lib/types';
import { InspectionMenuModal } from './InspectionMenuModal';
import { InspectionRegistrationModal } from './InspectionRegistrationModal';
import { InspectionExecutionModal, InspectionResult } from './InspectionExecutionModal';

interface InspectionManagementTabProps {
  isMobile?: boolean;
}

export function InspectionManagementTab({ isMobile = false }: InspectionManagementTabProps) {
  const router = useRouter();
  const { tasks, menus, startInspection, skipInspection, setInspectionDate, getMenuById } = useInspectionStore();
  const { assets, departments } = useMasterStore();

  // assetsからユニークな値を抽出
  const categories = useMemo(() => [...new Set(assets.map((a) => a.category))], [assets]);
  const largeClasses = useMemo(() => [...new Set(assets.map((a) => a.largeClass))], [assets]);
  const mediumClassesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    assets.forEach((a) => {
      if (!map[a.largeClass]) map[a.largeClass] = [];
      if (!map[a.largeClass].includes(a.mediumClass)) {
        map[a.largeClass].push(a.mediumClass);
      }
    });
    return map;
  }, [assets]);
  const itemsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    assets.forEach((a) => {
      if (!map[a.mediumClass]) map[a.mediumClass] = [];
      if (!map[a.mediumClass].includes(a.item)) {
        map[a.mediumClass].push(a.item);
      }
    });
    return map;
  }, [assets]);
  const departmentNames = useMemo(() => [...new Set(departments.map((d) => d.department))], [departments]);

  // フィルター状態
  const [filters, setFilters] = useState({
    inspectionType: '',
    managementDepartment: '',
    status: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    maker: '',
  });

  // モーダル状態
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // 日程調整モーダル
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedTaskForDate, setSelectedTaskForDate] = useState<InspectionTask | null>(null);
  const [newDate, setNewDate] = useState('');

  // 点検実施モーダル
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [selectedTaskForExecution, setSelectedTaskForExecution] = useState<InspectionTask | null>(null);

  // フィルタリング
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.inspectionType && task.inspectionType !== filters.inspectionType) return false;
      if (filters.managementDepartment && task.managementDepartment !== filters.managementDepartment) return false;
      if (filters.status && task.status !== filters.status) return false;
      // category フィルターは現時点ではtaskにcategoryが無いためスキップ（将来対応）
      if (filters.largeClass && task.largeClass !== filters.largeClass) return false;
      if (filters.mediumClass && task.mediumClass !== filters.mediumClass) return false;
      if (filters.item && task.assetName !== filters.item) return false;
      if (filters.maker && task.maker !== filters.maker) return false;
      return true;
    });
  }, [tasks, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      inspectionType: '',
      managementDepartment: '',
      status: '',
      category: '',
      largeClass: '',
      mediumClass: '',
      item: '',
      maker: '',
    });
  };

  const getStatusStyle = (status: InspectionTaskStatus): React.CSSProperties => {
    switch (status) {
      case '点検月超過':
        return { backgroundColor: '#e74c3c', color: 'white' };
      case '点検月':
        return { backgroundColor: '#f39c12', color: 'white' };
      case '点検2ヶ月前':
        return { backgroundColor: '#3498db', color: 'white' };
      case '点検日調整':
        return { backgroundColor: '#9b59b6', color: 'white' };
      case '点検実施中':
        return { backgroundColor: '#e67e22', color: 'white' };
      case '点検完了':
        return { backgroundColor: '#27ae60', color: 'white' };
      case '再点検':
        return { backgroundColor: '#c0392b', color: 'white' };
      default:
        return { backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const getDailyMenuNames = (task: InspectionTask) => {
    const names: string[] = [];
    if (task.dailyMenus.before) {
      const menu = getMenuById(task.dailyMenus.before);
      if (menu) names.push(`前: ${menu.name}`);
    }
    if (task.dailyMenus.during) {
      const menu = getMenuById(task.dailyMenus.during);
      if (menu) names.push(`中: ${menu.name}`);
    }
    if (task.dailyMenus.after) {
      const menu = getMenuById(task.dailyMenus.after);
      if (menu) names.push(`後: ${menu.name}`);
    }
    return names.length > 0 ? names.join(', ') : '-';
  };

  const handleStartInspection = (task: InspectionTask) => {
    setSelectedTaskForExecution(task);
    setIsExecutionModalOpen(true);
  };

  const handleCompleteInspection = (result: InspectionResult) => {
    // 点検完了処理
    if (result.taskId) {
      startInspection(result.taskId);
    }
    // TODO: result の詳細データ（itemResults, remarks, overallResult等）を保存する処理を追加
    console.log('点検完了:', result);
  };

  const handleSkipInspection = (task: InspectionTask) => {
    skipInspection(task.id);
  };

  const handleOpenDateModal = (task: InspectionTask) => {
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

  const handleExportSchedule = () => {
    alert('点検予定表をCSV出力します');
  };

  const statusOptions = [
    '点検2ヶ月前',
    '点検月',
    '点検月超過',
    '点検日調整',
    '点検実施中',
    '点検完了',
  ];

  const inspectionTypeOptions = ['院内定期点検', 'メーカー保守', '院内スポット点検'];

  // メーカー一覧
  const makers = useMemo(() => {
    return [...new Set(tasks.map((t) => t.maker).filter(Boolean))];
  }, [tasks]);

  return (
    <div style={styles.container}>
      {/* フィルター検索エリア */}
      <div style={styles.filterSection}>
        <div style={styles.filterHeader}>
          <div style={styles.filterActions}>
            <button style={styles.menuButton} onClick={() => setIsMenuModalOpen(true)}>
              点検メニュー登録
            </button>
            <button style={styles.registrationButton} onClick={() => setIsRegistrationModalOpen(true)}>
              点検管理登録
            </button>
            <button style={styles.exportButton} onClick={handleExportSchedule}>
              点検予定表の出力
            </button>
          </div>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>点検種別</label>
            <SearchableSelect
              value={filters.inspectionType}
              onChange={(v) => handleFilterChange('inspectionType', v)}
              options={inspectionTypeOptions}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>管理部署</label>
            <SearchableSelect
              value={filters.managementDepartment}
              onChange={(v) => handleFilterChange('managementDepartment', v)}
              options={departmentNames}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>ステータス</label>
            <SearchableSelect
              value={filters.status}
              onChange={(v) => handleFilterChange('status', v)}
              options={statusOptions}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Category</label>
            <SearchableSelect
              value={filters.category}
              onChange={(v) => handleFilterChange('category', v)}
              options={categories}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>大分類</label>
            <SearchableSelect
              value={filters.largeClass}
              onChange={(v) => handleFilterChange('largeClass', v)}
              options={largeClasses}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>中分類</label>
            <SearchableSelect
              value={filters.mediumClass}
              onChange={(v) => handleFilterChange('mediumClass', v)}
              options={filters.largeClass ? mediumClassesMap[filters.largeClass] || [] : []}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>品目</label>
            <SearchableSelect
              value={filters.item}
              onChange={(v) => handleFilterChange('item', v)}
              options={filters.mediumClass ? itemsMap[filters.mediumClass] || [] : []}
              placeholder="全て"
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>メーカー</label>
            <SearchableSelect
              value={filters.maker}
              onChange={(v) => handleFilterChange('maker', v)}
              options={makers}
              placeholder="全て"
            />
          </div>
        </div>

        <div style={styles.filterFooter}>
          <button style={styles.clearButton} onClick={handleClearFilters}>
            フィルタークリア
          </button>
          <span style={styles.resultCount}>
            {filteredTasks.length} 件
          </span>
        </div>
      </div>

      {/* タスクテーブルエリア */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            {/* グループヘッダー */}
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={styles.thGroupFirst} rowSpan={2}>点検種別</th>
              <th style={styles.thGroup} colSpan={2}>部署情報</th>
              <th style={styles.thGroup} colSpan={6}>商品情報</th>
              <th style={styles.thGroup} colSpan={7}>点検情報</th>
            </tr>
            {/* カラムヘッダー */}
            <tr>
              <th style={styles.thFirstInGroup}>管理部署</th>
              <th style={styles.th}>設置部署</th>
              <th style={styles.thFirstInGroup}>QRコード</th>
              <th style={styles.th}>大分類</th>
              <th style={styles.th}>中分類</th>
              <th style={styles.th}>品目</th>
              <th style={styles.th}>メーカー</th>
              <th style={styles.th}>型式</th>
              <th style={styles.thFirstInGroup}>購入年月日</th>
              <th style={styles.th}>採用中の点検メニュー</th>
              <th style={styles.th}>点検周期</th>
              <th style={styles.th}>前回点検日</th>
              <th style={styles.th}>次回点検予定</th>
              <th style={styles.th}>ステータス</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={16} style={styles.emptyCell}>
                  点検タスクがありません。資産を選択して点検タスクを追加してください。
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, index) => {
                const periodicMenuNames = task.periodicMenuIds
                  .map((id) => getMenuById(id)?.name)
                  .filter(Boolean)
                  .join(', ') || '-';
                const periodicCycle = task.periodicMenuIds.length > 0
                  ? task.periodicMenuIds
                      .map((id) => {
                        const menu = getMenuById(id);
                        return menu?.cycleMonths ? `${menu.cycleMonths}ヶ月` : null;
                      })
                      .filter(Boolean)
                      .join(', ')
                  : '-';

                return (
                  <tr key={task.id} style={index % 2 === 0 ? styles.row : styles.rowAlt}>
                    <td style={styles.td}>{task.inspectionType}</td>
                    <td style={styles.tdFirstInGroup}>{task.managementDepartment}</td>
                    <td style={styles.td}>{task.installedDepartment}</td>
                    <td style={{ ...styles.tdFirstInGroup, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</td>
                    <td style={styles.td}>{task.largeClass}</td>
                    <td style={styles.td}>{task.mediumClass}</td>
                    <td style={styles.td}>{task.assetName}</td>
                    <td style={styles.td}>{task.maker}</td>
                    <td style={styles.td}>{task.model}</td>
                    <td style={styles.tdFirstInGroup}>{task.purchaseDate || '-'}</td>
                    <td style={styles.td}>{periodicMenuNames}</td>
                    <td style={styles.td}>{periodicCycle}</td>
                    <td style={styles.td}>{task.lastInspectionDate || '-'}</td>
                    <td style={styles.td}>{task.nextInspectionDate}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...getStatusStyle(task.status) }}>
                        {task.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        {task.inspectionType === 'メーカー保守' ? (
                          task.status === '点検日調整' ? (
                            <button
                              style={styles.actionButton}
                              onClick={() => handleOpenDateModal(task)}
                            >
                              点検日登録
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.actionButton, ...styles.makerMaintenanceAction }}
                              onClick={() => {
                                sessionStorage.setItem('makerMaintenanceTask', JSON.stringify(task));
                                router.push('/maker-maintenance-result');
                              }}
                              disabled={task.status === '点検完了'}
                            >
                              点検記録登録
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              style={{ ...styles.actionButton, ...styles.primaryAction }}
                              onClick={() => handleStartInspection(task)}
                              disabled={task.status === '点検完了'}
                            >
                              点検実施
                            </button>
                            <button
                              style={styles.actionButton}
                              onClick={() => handleSkipInspection(task)}
                            >
                              スキップ
                            </button>
                          </>
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

      {/* 注記 */}
      <div style={styles.notes}>
        <p>※次回点検予定日はあくまで予定日となります。ステータスに「点検月」「点検2ヶ月前」「点検月超過」が表示されます</p>
        <p>※メーカー保守については点検2ヶ月前より点検日を設定できます（「点検日程調整」）</p>
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
        <div style={styles.modalOverlay} onClick={() => setIsDateModalOpen(false)}>
          <div style={styles.dateModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.dateModalTitle}>点検日程調整</h3>
            <p style={styles.dateModalAsset}>{selectedTaskForDate.assetName}</p>
            <div style={styles.dateModalField}>
              <label>点検予定日</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={styles.dateModalInput}
              />
            </div>
            <div style={styles.dateModalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsDateModalOpen(false)}>
                キャンセル
              </button>
              <button style={styles.confirmBtn} onClick={handleSetDate}>
                設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 点検実施モーダル */}
      <InspectionExecutionModal
        isOpen={isExecutionModalOpen}
        task={selectedTaskForExecution}
        menu={selectedTaskForExecution?.periodicMenuIds[0] ? getMenuById(selectedTaskForExecution.periodicMenuIds[0]) ?? null : null}
        onClose={() => {
          setIsExecutionModalOpen(false);
          setSelectedTaskForExecution(null);
        }}
        onComplete={handleCompleteInspection}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  filterSection: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '12px',
  },
  filterActions: {
    display: 'flex',
    gap: '8px',
  },
  registrationButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  menuButton: {
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  exportButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '140px',
    flex: '1 1 140px',
    maxWidth: '180px',
  },
  filterLabel: {
    fontSize: '12px',
    color: '#555',
    fontWeight: 500,
  },
  filterFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  clearButton: {
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  resultCount: {
    fontSize: '13px',
    color: '#555',
  },
  tableContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '0 16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  thGroup: {
    backgroundColor: '#e8ecef',
    padding: '8px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
    borderLeft: '2px solid #ccc',
  },
  thGroupFirst: {
    backgroundColor: '#e8ecef',
    padding: '8px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '10px 8px',
    textAlign: 'left',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
  },
  thFirstInGroup: {
    backgroundColor: '#f8f9fa',
    padding: '10px 8px',
    textAlign: 'left',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
    borderLeft: '2px solid #ccc',
  },
  td: {
    padding: '8px',
    border: '1px solid #ddd',
    whiteSpace: 'nowrap',
  },
  tdFirstInGroup: {
    padding: '8px',
    border: '1px solid #ddd',
    whiteSpace: 'nowrap',
    borderLeft: '2px solid #ccc',
  },
  row: {
    backgroundColor: 'white',
  },
  rowAlt: {
    backgroundColor: '#fafafa',
  },
  emptyCell: {
    padding: '48px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '14px',
    borderBottom: '1px solid #e9ecef',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
  },
  actionButton: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  primaryAction: {
    backgroundColor: '#27ae60',
    color: 'white',
    borderColor: '#27ae60',
  },
  makerMaintenanceAction: {
    backgroundColor: '#9b59b6',
    color: 'white',
    borderColor: '#9b59b6',
  },
  notes: {
    padding: '12px 16px',
    fontSize: '12px',
    color: '#7f8c8d',
    lineHeight: 1.6,
    borderTop: '1px solid #e0e0e0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dateModal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
  },
  dateModalTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#2c3e50',
  },
  dateModalAsset: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#7f8c8d',
  },
  dateModalField: {
    marginBottom: '20px',
  },
  dateModalInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginTop: '8px',
    boxSizing: 'border-box',
  },
  dateModalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
