'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore, useApplicationStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { Asset, Application } from '@/lib/types';

// 申請区分
type ApplicationCategory = '新規申請' | '更新申請' | '増設申請';

// 要望機器
interface DesiredEquipment {
  id: string;
  item: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
  isFromMaster: boolean;
}

// 更新対象機器
interface UpdateTargetAsset {
  qrCode: string;
  item: string;
  maker: string;
  model: string;
  purchaseDate: string;
}

interface PurchaseApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // 更新申請用：選択された資産
  selectedAssets?: Asset[];
}

export function PurchaseApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  selectedAssets = [],
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
  const [applicationCategory, setApplicationCategory] = useState<ApplicationCategory>('新規申請');
  const [priority, setPriority] = useState('1');
  const [desiredDeliveryYear, setDesiredDeliveryYear] = useState(() => String(new Date().getFullYear() + 1));
  const [desiredDeliveryMonth, setDesiredDeliveryMonth] = useState('3');

  // 要望機器（最大3つ）
  const [desiredEquipments, setDesiredEquipments] = useState<DesiredEquipment[]>([
    { id: '1', item: '', maker: '', model: '', quantity: 1, unit: '台', isFromMaster: false },
  ]);

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

  // 更新対象機器（更新申請用）
  const [updateTargetAssets, setUpdateTargetAssets] = useState<UpdateTargetAsset[]>([]);

  // 部門・部署オプション
  const divisionOptions = [...new Set(departments.map(d => d.division))];
  const departmentOptions = [...new Set(departments.map(d => d.department))];

  // 更新申請の場合、選択された資産を更新対象に設定
  useEffect(() => {
    if (selectedAssets.length > 0 && applicationCategory === '更新申請') {
      setUpdateTargetAssets(selectedAssets.map(asset => ({
        qrCode: asset.qrCode,
        item: asset.item,
        maker: asset.maker,
        model: asset.model,
        purchaseDate: asset.contractDate || '',
      })));
    }
  }, [selectedAssets, applicationCategory]);

  if (!isOpen) return null;

  // 要望機器の追加
  const handleAddDesiredEquipment = () => {
    if (desiredEquipments.length >= 3) return;
    setDesiredEquipments([
      ...desiredEquipments,
      { id: String(Date.now()), item: '', maker: '', model: '', quantity: 1, unit: '台', isFromMaster: false },
    ]);
  };

  // 要望機器の削除
  const handleRemoveDesiredEquipment = (id: string) => {
    if (desiredEquipments.length <= 1) return;
    setDesiredEquipments(desiredEquipments.filter(e => e.id !== id));
  };

  // 要望機器の更新
  const handleUpdateDesiredEquipment = (id: string, field: keyof DesiredEquipment, value: string | number | boolean) => {
    setDesiredEquipments(desiredEquipments.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  // 資産マスタを別ウィンドウで開く
  const handleOpenAssetMaster = (equipmentId: string) => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    // equipmentIdをsessionStorageに保存
    sessionStorage.setItem('targetEquipmentId', equipmentId);

    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED') {
        const assetMasters = event.data.assets as any[];
        const targetEquipmentId = sessionStorage.getItem('targetEquipmentId');

        if (assetMasters.length > 0 && targetEquipmentId) {
          const assetMaster = assetMasters[0];
          setDesiredEquipments(prev =>
            prev.map(e =>
              e.id === targetEquipmentId
                ? { ...e, item: assetMaster.item, maker: assetMaster.maker, model: assetMaster.model, isFromMaster: true }
                : e
            )
          );
          sessionStorage.removeItem('targetEquipmentId');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ファイル選択
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles(prev => [...prev, ...Array.from(files)]);
  };

  // ファイル削除
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 更新対象機器の廃棄申請
  const handleDisposalApplication = (qrCode: string) => {
    alert(`${qrCode} の廃棄申請画面に遷移します（未実装）`);
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
        applicationType: applicationCategory,
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
    equipmentRow: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '12px',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
    },
    equipmentInput: {
      flex: 1,
      minWidth: '80px',
    },
    equipmentInputSmall: {
      width: '60px',
    },
    masterButton: {
      padding: '8px 12px',
      background: '#4a6741',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap' as const,
    },
    deleteButton: {
      padding: '8px 12px',
      background: '#e74c3c',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
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
    targetAssetTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '13px',
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
          <span>購入申請 モーダル</span>
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
              <div></div>
              <div style={{ ...styles.formItem, gridColumn: '1 / 3' }}>
                <label style={styles.label}>申請区分</label>
                <div style={styles.radioGroup}>
                  {(['新規申請', '更新申請', '増設申請'] as ApplicationCategory[]).map((cat) => (
                    <label key={cat} style={styles.radioLabel}>
                      <input
                        type="radio"
                        checked={applicationCategory === cat}
                        onChange={() => setApplicationCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
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
            <div style={styles.sectionTitle}>要望機器</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              フリー入力も可能ですが、資産マスタに登録があればカタログ・添付文書を閲覧の上、選択ができます
            </div>

            {desiredEquipments.map((equipment, index) => (
              <div key={equipment.id}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a6741', marginBottom: '8px' }}>
                  第{['一', '二', '三'][index]}希望
                </div>
                <div style={styles.equipmentRow}>
                  <div style={styles.equipmentInput}>
                    <label style={{ fontSize: '12px', color: '#666' }}>品目</label>
                    <input
                      style={{
                        ...styles.input,
                        width: '100%',
                        background: equipment.isFromMaster ? '#e8f5e9' : 'white',
                      }}
                      value={equipment.item}
                      onChange={(e) => handleUpdateDesiredEquipment(equipment.id, 'item', e.target.value)}
                      placeholder="品目"
                    />
                  </div>
                  <div style={styles.equipmentInput}>
                    <label style={{ fontSize: '12px', color: '#666' }}>メーカー</label>
                    <input
                      style={styles.input}
                      value={equipment.maker}
                      onChange={(e) => handleUpdateDesiredEquipment(equipment.id, 'maker', e.target.value)}
                      placeholder="メーカー"
                    />
                  </div>
                  <div style={styles.equipmentInput}>
                    <label style={{ fontSize: '12px', color: '#666' }}>型式</label>
                    <input
                      style={styles.input}
                      value={equipment.model}
                      onChange={(e) => handleUpdateDesiredEquipment(equipment.id, 'model', e.target.value)}
                      placeholder="型式"
                    />
                  </div>
                  <div style={styles.equipmentInputSmall}>
                    <label style={{ fontSize: '12px', color: '#666' }}>数</label>
                    <input
                      type="number"
                      style={{ ...styles.input, width: '100%' }}
                      value={equipment.quantity}
                      onChange={(e) => handleUpdateDesiredEquipment(equipment.id, 'quantity', Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div style={styles.equipmentInputSmall}>
                    <label style={{ fontSize: '12px', color: '#666' }}>単</label>
                    <select
                      style={{ ...styles.select, width: '100%' }}
                      value={equipment.unit}
                      onChange={(e) => handleUpdateDesiredEquipment(equipment.id, 'unit', e.target.value)}
                    >
                      <option value="台">台</option>
                      <option value="個">個</option>
                      <option value="式">式</option>
                      <option value="セット">セット</option>
                    </select>
                  </div>
                  {desiredEquipments.length > 1 && (
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleRemoveDesiredEquipment(equipment.id)}
                    >
                      ×
                    </button>
                  )}
                  <button
                    style={styles.masterButton}
                    onClick={() => handleOpenAssetMaster(equipment.id)}
                  >
                    資産マスタから選択する
                  </button>
                </div>
              </div>
            ))}

            {desiredEquipments.length < 3 && (
              <button
                onClick={handleAddDesiredEquipment}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: '#4a6741',
                  border: '1px dashed #4a6741',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                + 希望を追加
              </button>
            )}
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

          {/* 更新対象機器（更新申請の場合のみ） */}
          {applicationCategory === '更新申請' && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>更新対象機器</div>
              {updateTargetAssets.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: '6px' }}>
                  更新対象機器がありません
                </div>
              ) : (
                <table style={styles.targetAssetTable}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>更新対象:</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>QRコード</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>品目</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>メーカー</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>型式</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>購入年月日</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateTargetAssets.map((asset, index) => (
                      <tr key={index}>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}></td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{asset.qrCode}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{asset.item}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{asset.maker}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{asset.model}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{asset.purchaseDate}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDisposalApplication(asset.qrCode)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            廃棄申請
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
