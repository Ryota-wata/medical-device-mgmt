'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore, useApplicationStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { Asset, Application } from '@/lib/types';

// 要望機器
interface DesiredEquipment {
  item: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
}

interface PurchaseApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PurchaseApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseApplicationModalProps) {
  const router = useRouter();
  const { departments, facilities } = useMasterStore();
  const { user } = useAuthStore();
  const { addApplication } = useApplicationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 申請基本情報
  const [managementDepartment] = useState(user?.department || '手術部');
  const [applicantName] = useState(user?.username || '手術 紺太郎');
  const [applicationDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [installationDepartment, setInstallationDepartment] = useState('');
  const [installationSection, setInstallationSection] = useState('');
  const [installationRoomName, setInstallationRoomName] = useState('');
  const [priority, setPriority] = useState('1');
  const [desiredDeliveryYear, setDesiredDeliveryYear] = useState(() => String(new Date().getFullYear() + 1));
  const [desiredDeliveryMonth, setDesiredDeliveryMonth] = useState('3');

  // 要望機器
  const [desiredEquipments, setDesiredEquipments] = useState<DesiredEquipment[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // 使用用途及び件数
  const [usagePurpose, setUsagePurpose] = useState('');
  const [caseCount, setCaseCount] = useState('');
  const [caseCountUnit, setCaseCountUnit] = useState('件／月');

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // システム接続要望
  const [currentConnectionStatus, setCurrentConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [currentConnectionDestination, setCurrentConnectionDestination] = useState('');
  const [requestConnectionStatus, setRequestConnectionStatus] = useState<'required' | 'not-required'>('not-required');
  const [requestConnectionDestination, setRequestConnectionDestination] = useState('');

  // 部門・部署オプション
  const divisionOptions = [...new Set(departments.map(d => d.division))];
  const departmentOptions = [...new Set(departments.map(d => d.department))];

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'ASSET_SELECTED' && event.data?.assets) {
        const receivedAssets = event.data.assets;
        if (receivedAssets.length > 0) {
          const asset = receivedAssets[0];
          const targetIndex = sessionStorage.getItem('editingEquipmentIndex');

          if (targetIndex !== null) {
            const index = parseInt(targetIndex, 10);
            setDesiredEquipments(prev => prev.map((e, i) =>
              i === index
                ? { ...e, item: asset.item || '', maker: asset.maker || '', model: asset.model || '' }
                : e
            ));
            sessionStorage.removeItem('editingEquipmentIndex');
            setEditingRowIndex(null);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  // 要望機器の追加
  const handleAddEquipment = () => {
    setDesiredEquipments(prev => [...prev, { item: '', maker: '', model: '', quantity: 1, unit: '台' }]);
  };

  // 要望機器の削除
  const handleRemoveEquipment = (index: number) => {
    setDesiredEquipments(prev => prev.filter((_, i) => i !== index));
  };

  // 要望機器の更新
  const handleUpdateEquipment = (index: number, field: keyof DesiredEquipment, value: string | number) => {
    setDesiredEquipments(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  // 資産マスタを別ウィンドウで開く（行指定）
  const handleOpenAssetMaster = (index: number) => {
    sessionStorage.setItem('editingEquipmentIndex', String(index));
    setEditingRowIndex(index);

    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master?mode=simple`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // ファイル選択
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles(prev => [...prev, ...Array.from(files)]);
  };

  // ファイル削除
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 申請内容確認
  const handleConfirm = () => {
    // バリデーション
    if (!installationDepartment || !installationSection) {
      alert('設置部門・設置部署を入力してください');
      return;
    }

    const validEquipments = desiredEquipments.filter(e => e.item.trim() !== '');
    if (validEquipments.length === 0) {
      alert('要望機器を1つ以上入力してください');
      return;
    }

    // 申請データを作成
    validEquipments.forEach((equipment) => {
      const applicationData: Omit<Application, 'id'> = {
        applicationNo: `APP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: applicationDate,
        applicationType: '新規申請',
        asset: {
          name: equipment.item,
          model: equipment.model,
        },
        vendor: equipment.maker,
        quantity: String(equipment.quantity),
        unit: equipment.unit,
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: '',
          floor: '',
          department: installationDepartment,
          section: installationSection,
        },
        roomName: installationRoomName,
        freeInput: comment,
        executionYear: desiredDeliveryYear,
        requestConnectionStatus: requestConnectionStatus,
        requestConnectionDestination: requestConnectionDestination,
        applicationReason: `${usagePurpose}${caseCount ? ` (症例数: ${caseCount}${caseCountUnit})` : ''}`,
      };

      addApplication(applicationData);
    });

    alert(`購入申請を送信しました\n申請件数: ${validEquipments.length}件`);
    onClose();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/application-list');
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'white',
      borderRadius: '8px',
      width: '95%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      background: '#4a6741',
      color: 'white',
      padding: '16px 24px',
      fontSize: '18px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '30px',
      height: '30px',
    },
    body: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4a6741',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #4a6741',
    },
    note: {
      fontSize: '12px',
      color: '#666',
      textAlign: 'right' as const,
      marginBottom: '12px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      alignItems: 'end',
    },
    formItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#333',
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #4a6741',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
    },
    inputDisabled: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      background: '#f5f5f5',
      color: '#666',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #4a6741',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      border: '1px solid #4a6741',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
    },
    fileUploadSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    attachButton: {
      padding: '8px 16px',
      background: '#4a6741',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold',
    },
    fileSelectButton: {
      padding: '8px 16px',
      background: 'white',
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    fileHint: {
      fontSize: '12px',
      color: '#e74c3c',
      marginTop: '8px',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #dee2e6',
      display: 'flex',
      justifyContent: 'center',
      background: '#f8f9fa',
    },
    confirmButton: {
      padding: '12px 48px',
      background: '#4a6741',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <span>新規購入申請</span>
          <button style={styles.closeButton} onClick={onClose} aria-label="閉じる">×</button>
        </div>

        {/* ボディ */}
        <div style={styles.body}>
          {/* 申請基本情報 */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.sectionTitle}>申請基本情報</div>
              <div style={styles.note}>申請情報に変更があれば記入ください</div>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formItem}>
                <label style={styles.label}>管理部署</label>
                <input style={styles.inputDisabled} value={managementDepartment} disabled />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>申請者</label>
                <input style={styles.inputDisabled} value={applicantName} disabled />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>申請日</label>
                <input style={styles.inputDisabled} value={applicationDate} disabled />
              </div>
              <div></div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置部門</label>
                <SearchableSelect
                  value={installationDepartment}
                  onChange={setInstallationDepartment}
                  options={divisionOptions}
                  placeholder="選択してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置部署</label>
                <SearchableSelect
                  value={installationSection}
                  onChange={setInstallationSection}
                  options={departmentOptions}
                  placeholder="選択してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置室名</label>
                <input
                  style={styles.input}
                  value={installationRoomName}
                  onChange={(e) => setInstallationRoomName(e.target.value)}
                  placeholder="手術室B"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>優先順位</label>
                <select style={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>希望納期</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    style={{ ...styles.select, width: '90px' }}
                    value={desiredDeliveryYear}
                    onChange={(e) => setDesiredDeliveryYear(e.target.value)}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <span>年</span>
                  <select
                    style={{ ...styles.select, width: '70px' }}
                    value={desiredDeliveryMonth}
                    onChange={(e) => setDesiredDeliveryMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span>月</span>
                </div>
              </div>
            </div>
          </div>

          {/* 要望機器 */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={styles.sectionTitle}>要望機器</div>
              <button
                onClick={handleAddEquipment}
                style={{
                  padding: '6px 16px',
                  background: '#4a6741',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + 資産を追加
              </button>
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>品目</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>メーカー</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>型式</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '70px' }}>数量</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '70px' }}>単位</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '130px' }}>選択</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '50px' }}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {desiredEquipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                        「+ 資産を追加」ボタンで要望機器を追加してください
                      </td>
                    </tr>
                  ) : (
                    desiredEquipments.map((equipment, index) => (
                      <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={equipment.item}
                            onChange={(e) => handleUpdateEquipment(index, 'item', e.target.value)}
                            placeholder="品目"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={equipment.maker}
                            onChange={(e) => handleUpdateEquipment(index, 'maker', e.target.value)}
                            placeholder="メーカー"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={equipment.model}
                            onChange={(e) => handleUpdateEquipment(index, 'model', e.target.value)}
                            placeholder="型式"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                          <input
                            type="number"
                            value={equipment.quantity}
                            onChange={(e) => handleUpdateEquipment(index, 'quantity', Number(e.target.value) || 1)}
                            min={1}
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                          <select
                            value={equipment.unit}
                            onChange={(e) => handleUpdateEquipment(index, 'unit', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                            }}
                          >
                            <option value="台">台</option>
                            <option value="個">個</option>
                            <option value="式">式</option>
                            <option value="セット">セット</option>
                          </select>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenAssetMaster(index)}
                            style={{
                              padding: '4px 8px',
                              background: '#4a6741',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            資産マスタから選択
                          </button>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveEquipment(index)}
                            style={{
                              padding: '4px 8px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            aria-label={`${equipment.item || '機器'}を削除`}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 使用用途及び件数 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>使用用途及び件数</div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>用途</label>
                <input
                  style={{ ...styles.input, width: '100%' }}
                  value={usagePurpose}
                  onChange={(e) => setUsagePurpose(e.target.value)}
                  placeholder="使用用途を入力"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={styles.label}>症例数</label>
                <input
                  type="number"
                  style={{ ...styles.input, width: '80px' }}
                  value={caseCount}
                  onChange={(e) => setCaseCount(e.target.value)}
                />
                <select
                  style={styles.select}
                  value={caseCountUnit}
                  onChange={(e) => setCaseCountUnit(e.target.value)}
                >
                  <option value="件／月">件／月</option>
                  <option value="件／週">件／週</option>
                  <option value="件／年">件／年</option>
                </select>
              </div>
            </div>
          </div>

          {/* コメント */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>コメント（必要理由 他）</div>
            <textarea
              style={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="申請理由やコメントを入力してください"
            />
          </div>

          {/* 添付ファイル */}
          <div style={styles.section}>
            <div style={styles.fileUploadSection}>
              <button style={styles.attachButton}>添付ファイル</button>
              <button
                style={styles.fileSelectButton}
                onClick={() => fileInputRef.current?.click()}
              >
                ファイルの選択
              </button>
              <span style={{ fontSize: '13px', color: '#666' }}>
                {attachedFiles.length === 0 ? 'ファイルが選択されていません' : `${attachedFiles.length}件選択中`}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {attachedFiles.map((file, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {file.name}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={styles.fileHint}>
              要望機種の見積書・修理不能証明など手持ちの書類を添付してください
            </div>
          </div>

          {/* システム接続要望 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>システム接続要望</div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={styles.label}>現在の接続状況</label>
                <div style={{ ...styles.radioGroup, marginTop: '8px' }}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={currentConnectionStatus === 'connected'}
                      onChange={() => setCurrentConnectionStatus('connected')}
                    />
                    接続あり
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={currentConnectionStatus === 'disconnected'}
                      onChange={() => setCurrentConnectionStatus('disconnected')}
                    />
                    接続なし
                  </label>
                </div>
              </div>
              <div>
                <label style={styles.label}>現在の接続先</label>
                <input
                  style={{ ...styles.input, width: '100%', marginTop: '6px' }}
                  value={currentConnectionDestination}
                  onChange={(e) => setCurrentConnectionDestination(e.target.value)}
                  placeholder="接続先を入力してください"
                />
              </div>
              <div>
                <label style={styles.label}>要望機器の接続要望</label>
                <div style={{ ...styles.radioGroup, marginTop: '8px' }}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={requestConnectionStatus === 'required'}
                      onChange={() => setRequestConnectionStatus('required')}
                    />
                    接続要望
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={requestConnectionStatus === 'not-required'}
                      onChange={() => setRequestConnectionStatus('not-required')}
                    />
                    接続不要
                  </label>
                </div>
              </div>
              <div>
                <label style={styles.label}>要望機器の接続先</label>
                <input
                  style={{ ...styles.input, width: '100%', marginTop: '6px' }}
                  value={requestConnectionDestination}
                  onChange={(e) => setRequestConnectionDestination(e.target.value)}
                  placeholder="接続先を入力してください"
                />
              </div>
            </div>
          </div>

        </div>

        {/* フッター */}
        <div style={styles.footer}>
          <button style={styles.confirmButton} onClick={handleConfirm}>
            記載内容を確認する
          </button>
        </div>
      </div>
    </div>
  );
}
