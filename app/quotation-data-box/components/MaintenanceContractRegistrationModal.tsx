'use client';

import { useState, useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAssetStore, useMasterStore } from '@/lib/stores';
import { Asset } from '@/lib/types';

interface MaintenanceContractRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: MaintenanceContractFormData) => void;
}

export interface MaintenanceContractFormData {
  managementDepartment: string;
  maintenanceType: 'メーカー保守' | 'スポット点検';
  hasLegalInspection: boolean;
  contractGroupName: string;
  selectedAssets: Asset[];
}

interface AssetSearchFilter {
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
}

export function MaintenanceContractRegistrationModal({
  isOpen,
  onClose,
  onRegister,
}: MaintenanceContractRegistrationModalProps) {
  const { assets } = useAssetStore();
  const { departments } = useMasterStore();

  // ステップ管理: 1=資産選択, 2=契約情報入力
  const [step, setStep] = useState<1 | 2>(1);

  // 資産検索
  const [assetSearchFilter, setAssetSearchFilter] = useState<AssetSearchFilter>({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
  });
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // 契約情報
  const [managementDepartment, setManagementDepartment] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'メーカー保守' | 'スポット点検'>('メーカー保守');
  const [hasLegalInspection, setHasLegalInspection] = useState(false);
  const [contractGroupName, setContractGroupName] = useState('');

  // マスタデータ
  const departmentNames = useMemo(() => [...new Set(departments.map((d) => d.department))], [departments]);
  const buildings = useMemo(() => [...new Set(assets.map((a) => a.building))], [assets]);
  const floors = useMemo(() => {
    if (!assetSearchFilter.building) return [...new Set(assets.map((a) => a.floor))];
    return [...new Set(assets.filter((a) => a.building === assetSearchFilter.building).map((a) => a.floor))];
  }, [assets, assetSearchFilter.building]);
  const depts = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) filtered = filtered.filter((a) => a.building === assetSearchFilter.building);
    if (assetSearchFilter.floor) filtered = filtered.filter((a) => a.floor === assetSearchFilter.floor);
    return [...new Set(filtered.map((a) => a.department))];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor]);
  const categories = useMemo(() => [...new Set(assets.map((a) => a.category))], [assets]);
  const largeClasses = useMemo(() => [...new Set(assets.map((a) => a.largeClass))], [assets]);
  const mediumClasses = useMemo(() => {
    if (!assetSearchFilter.largeClass) return [...new Set(assets.map((a) => a.mediumClass))];
    return [...new Set(assets.filter((a) => a.largeClass === assetSearchFilter.largeClass).map((a) => a.mediumClass))];
  }, [assets, assetSearchFilter.largeClass]);

  const handleSearch = () => {
    let results = assets;
    if (assetSearchFilter.building) results = results.filter((a) => a.building === assetSearchFilter.building);
    if (assetSearchFilter.floor) results = results.filter((a) => a.floor === assetSearchFilter.floor);
    if (assetSearchFilter.department) results = results.filter((a) => a.department === assetSearchFilter.department);
    if (assetSearchFilter.category) results = results.filter((a) => a.category === assetSearchFilter.category);
    if (assetSearchFilter.largeClass) results = results.filter((a) => a.largeClass === assetSearchFilter.largeClass);
    if (assetSearchFilter.mediumClass) results = results.filter((a) => a.mediumClass === assetSearchFilter.mediumClass);
    setSearchResults(results);
    setSelectedAssetIds(new Set());
    setHasSearched(true);
  };

  const toggleAssetSelection = (qrCode: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(qrCode)) {
      newSelected.delete(qrCode);
    } else {
      newSelected.add(qrCode);
    }
    setSelectedAssetIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.size === searchResults.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(searchResults.map((a) => a.qrCode)));
    }
  };

  const proceedToStep2 = () => {
    if (selectedAssetIds.size === 0) {
      alert('資産を選択してください');
      return;
    }
    setStep(2);
  };

  const handleRegister = () => {
    if (!managementDepartment) {
      alert('管理部署を選択してください');
      return;
    }
    if (!contractGroupName) {
      alert('契約グループ名称を入力してください');
      return;
    }
    const selectedAssets = searchResults.filter((a) => selectedAssetIds.has(a.qrCode));
    onRegister({
      managementDepartment,
      maintenanceType,
      hasLegalInspection,
      contractGroupName,
      selectedAssets,
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setAssetSearchFilter({ building: '', floor: '', department: '', section: '', category: '', largeClass: '', mediumClass: '' });
    setSearchResults([]);
    setSelectedAssetIds(new Set());
    setHasSearched(false);
    setManagementDepartment('');
    setMaintenanceType('メーカー保守');
    setHasLegalInspection(false);
    setContractGroupName('');
    onClose();
  };

  if (!isOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    header: {
      padding: '16px 24px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#2c3e50',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#7f8c8d',
    },
    body: {
      padding: '24px',
    },
    filterRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      marginBottom: '16px',
    },
    filterItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      minWidth: '120px',
      flex: '1 1 120px',
      maxWidth: '150px',
    },
    filterLabel: {
      fontSize: '12px',
      color: '#7f8c8d',
    },
    buttonRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    },
    searchButton: {
      padding: '8px 16px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    tableContainer: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      maxHeight: '300px',
      overflow: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '13px',
    },
    th: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '8px 12px',
      textAlign: 'left' as const,
      position: 'sticky' as const,
      top: 0,
    },
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid #eee',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
    },
    cancelButton: {
      padding: '10px 20px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    primaryButton: {
      padding: '10px 20px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    formRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    formLabel: {
      width: '120px',
      fontSize: '14px',
      fontWeight: 500,
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      width: '300px',
    },
    selectedCount: {
      fontSize: '14px',
      color: '#27ae60',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>
            {step === 1 ? '保守契約管理 - 資産選択' : '保守契約管理 - 登録モーダル'}
          </span>
          <button style={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div style={styles.body}>
          {step === 1 ? (
            <>
              {/* 資産検索フィルター */}
              <div style={styles.filterRow}>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>棟</label>
                  <SearchableSelect
                    options={buildings}
                    value={assetSearchFilter.building}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, building: v, floor: '', department: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>階</label>
                  <SearchableSelect
                    options={floors}
                    value={assetSearchFilter.floor}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, floor: v, department: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>部署</label>
                  <SearchableSelect
                    options={depts}
                    value={assetSearchFilter.department}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, department: v }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>Category</label>
                  <SearchableSelect
                    options={categories}
                    value={assetSearchFilter.category}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, category: v }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>大分類</label>
                  <SearchableSelect
                    options={largeClasses}
                    value={assetSearchFilter.largeClass}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, largeClass: v, mediumClass: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>中分類</label>
                  <SearchableSelect
                    options={mediumClasses}
                    value={assetSearchFilter.mediumClass}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, mediumClass: v }))}
                    placeholder="全て"
                  />
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button style={styles.searchButton} onClick={handleSearch}>検索</button>
                {hasSearched && <span style={styles.selectedCount}>{selectedAssetIds.size}件選択中</span>}
              </div>

              {/* 検索結果テーブル */}
              {hasSearched && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>
                          <input
                            type="checkbox"
                            checked={searchResults.length > 0 && selectedAssetIds.size === searchResults.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th style={styles.th}>QRコード</th>
                        <th style={styles.th}>棟</th>
                        <th style={styles.th}>階</th>
                        <th style={styles.th}>部署</th>
                        <th style={styles.th}>大分類</th>
                        <th style={styles.th}>中分類</th>
                        <th style={styles.th}>品目</th>
                        <th style={styles.th}>メーカー</th>
                        <th style={styles.th}>型式</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                            該当する資産がありません
                          </td>
                        </tr>
                      ) : (
                        searchResults.map((asset) => (
                          <tr key={asset.qrCode} style={{ backgroundColor: selectedAssetIds.has(asset.qrCode) ? '#e8f5e9' : 'white' }}>
                            <td style={styles.td}>
                              <input
                                type="checkbox"
                                checked={selectedAssetIds.has(asset.qrCode)}
                                onChange={() => toggleAssetSelection(asset.qrCode)}
                              />
                            </td>
                            <td style={styles.td}>{asset.qrCode}</td>
                            <td style={styles.td}>{asset.building}</td>
                            <td style={styles.td}>{asset.floor}</td>
                            <td style={styles.td}>{asset.department}</td>
                            <td style={styles.td}>{asset.largeClass}</td>
                            <td style={styles.td}>{asset.mediumClass}</td>
                            <td style={styles.td}>{asset.item}</td>
                            <td style={styles.td}>{asset.maker}</td>
                            <td style={styles.td}>{asset.model}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 契約情報入力 */}
              <div style={styles.formRow}>
                <label style={styles.formLabel}>管理部署</label>
                <SearchableSelect
                  options={departmentNames}
                  value={managementDepartment}
                  onChange={setManagementDepartment}
                  placeholder="選択してください"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.formLabel}>保守・点検種別</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="maintenanceType"
                      checked={maintenanceType === 'メーカー保守'}
                      onChange={() => setMaintenanceType('メーカー保守')}
                    />
                    メーカー保守
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="maintenanceType"
                      checked={maintenanceType === 'スポット点検'}
                      onChange={() => setMaintenanceType('スポット点検')}
                    />
                    スポット点検
                  </label>
                </div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.formLabel}>法令点検</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="legalInspection"
                      checked={hasLegalInspection}
                      onChange={() => setHasLegalInspection(true)}
                    />
                    有
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="legalInspection"
                      checked={!hasLegalInspection}
                      onChange={() => setHasLegalInspection(false)}
                    />
                    無
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#27ae60' }}>
                  メーカー保守・スポット点検
                </div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>契約グループ名称</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={contractGroupName}
                    onChange={(e) => setContractGroupName(e.target.value)}
                    placeholder="例: MRI保守契約"
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '14px', color: '#7f8c8d' }}>
                選択中の資産: {selectedAssetIds.size}件
              </div>
            </>
          )}
        </div>

        <div style={styles.footer}>
          {step === 1 ? (
            <>
              <button style={styles.cancelButton} onClick={handleClose}>キャンセル</button>
              <button style={styles.primaryButton} onClick={proceedToStep2}>次へ</button>
            </>
          ) : (
            <>
              <button style={styles.cancelButton} onClick={() => setStep(1)}>戻る</button>
              <button style={styles.primaryButton} onClick={handleRegister}>
                保守管理タスクリストに追加する
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
