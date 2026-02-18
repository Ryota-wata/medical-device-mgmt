'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore, useApplicationStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/types';
import { CreatePurchaseApplicationInput, PurchaseApplicationAsset } from '@/lib/types/purchaseApplication';

// 要望機器
interface DesiredEquipment {
  item: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
}

interface UpdateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 更新対象として選択された資産（1件のみ）
  onSuccess?: () => void;
}

export function UpdateApplicationModal({
  isOpen,
  onClose,
  assets,
  onSuccess,
}: UpdateApplicationModalProps) {
  const router = useRouter();
  const { departments, facilities } = useMasterStore();
  const { user } = useAuthStore();
  const { addApplication: addPurchaseApplication } = usePurchaseApplicationStore();
  const { addApplication: addDisposalApplication } = useApplicationStore();
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

  // 要望機器（新規購入希望）
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

  // 廃棄同意
  const [disposalAgreed, setDisposalAgreed] = useState(false);

  // 確認画面表示
  const [isConfirmView, setIsConfirmView] = useState(false);

  // 部門・部署オプション
  const divisionOptions = [...new Set(departments.map(d => d.division))];
  const departmentOptions = [...new Set(departments.map(d => d.department))];

  // 選択された資産から初期値を設定
  useEffect(() => {
    if (assets.length > 0 && isOpen) {
      const primaryAsset = assets[0];
      setInstallationDepartment(primaryAsset.department || '');
      setInstallationSection(primaryAsset.section || '');
      setInstallationRoomName(primaryAsset.roomName || '');
    }
  }, [assets, isOpen]);

  // 資産マスタからのメッセージを受信するハンドラー
  const handleAssetMessage = useCallback((event: MessageEvent) => {
    // 同一オリジンからのメッセージのみ処理
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
  }, []);

  // isOpenがtrueの時のみイベントリスナーを登録
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleAssetMessage);
      return () => {
        window.removeEventListener('message', handleAssetMessage);
      };
    }
  }, [isOpen, handleAssetMessage]);

  if (!isOpen || assets.length === 0) return null;

  // 要望機器の追加（最大3つまで）
  const MAX_EQUIPMENT = 3;
  const handleAddEquipment = () => {
    if (desiredEquipments.length >= MAX_EQUIPMENT) return;
    setDesiredEquipments(prev => [...prev, { item: '', maker: '', model: '', quantity: 1, unit: '台' }]);
  };

  // 要望機器の削除
  const handleRemoveEquipment = (index: number) => {
    setDesiredEquipments(prev => prev.filter((_, i) => i !== index));
  };

  // 要望機器の順序入れ替え
  const handleMoveEquipment = (index: number, direction: 'up' | 'down') => {
    setDesiredEquipments(prev => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    });
  };

  // 希望順ラベル
  const getHopeLabel = (index: number): string => {
    const labels = ['第一希望', '第二希望', '第三希望'];
    return labels[index] || '';
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

  // 確認画面へ遷移
  const handleConfirm = () => {
    // バリデーション
    if (!installationDepartment || !installationSection) {
      alert('設置部門・設置部署を入力してください');
      return;
    }

    const validEquipments = desiredEquipments.filter(e => e.item.trim() !== '');
    if (validEquipments.length === 0) {
      alert('要望機器（新規購入希望）を1つ以上入力してください');
      return;
    }

    if (!disposalAgreed) {
      alert('更新対象機器の廃棄処理に同意してください');
      return;
    }

    setIsConfirmView(true);
  };

  // 入力画面に戻る
  const handleBackToEdit = () => {
    setIsConfirmView(false);
  };

  // 申請送信
  const handleSubmit = () => {
    const validEquipments = desiredEquipments.filter(e => e.item.trim() !== '');

    // 1. 購入申請を作成
    const purchaseAssets: PurchaseApplicationAsset[] = validEquipments.map(equipment => ({
      name: equipment.item,
      maker: equipment.maker,
      model: equipment.model,
      quantity: equipment.quantity,
      unit: equipment.unit,
    }));

    const purchaseInput: CreatePurchaseApplicationInput = {
      applicationType: '更新申請',
      applicantId: user?.id || 'user-unknown',
      applicantName: applicantName,
      applicantDepartment: managementDepartment,
      assets: purchaseAssets,
      facility: facilities.length > 0 ? facilities[0].facilityName : '〇〇病院',
      building: '',
      floor: '',
      department: installationDepartment,
      section: installationSection,
      roomName: installationRoomName,
      desiredDeliveryDate: `${desiredDeliveryYear}-${String(desiredDeliveryMonth).padStart(2, '0')}-01`,
      applicationReason: `${usagePurpose}${caseCount ? ` (症例数: ${caseCount}${caseCountUnit})` : ''}${comment ? `\n${comment}` : ''}\n\n【更新対象機器】\n${assets.map(a => `- ${a.name} (${a.model})`).join('\n')}`,
      attachedFiles: attachedFiles.map(f => f.name),
    };

    addPurchaseApplication(purchaseInput);

    // 2. 廃棄申請を作成（更新対象機器ごと）
    assets.forEach((asset) => {
      addDisposalApplication({
        applicationNo: `DISP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: applicationDate,
        applicationType: '廃棄申請',
        asset: {
          name: asset.name,
          model: asset.model,
        },
        vendor: asset.maker,
        quantity: String(asset.quantity || 1),
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: asset.building,
          floor: asset.floor,
          department: asset.department,
          section: asset.section,
        },
        roomName: asset.roomName || '',
        freeInput: `更新申請に伴う廃棄\n申請日: ${applicationDate}`,
        executionYear: desiredDeliveryYear,
        applicationReason: '更新申請に伴う廃棄処理',
      });
    });

    alert(`更新申請を送信しました\n\n【購入申請】\n要望機器: ${validEquipments.length}件\n\n【廃棄申請】\n更新対象機器: ${assets.length}件`);
    setIsConfirmView(false);
    onClose();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/quotation-data-box/purchase-management');
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
      maxWidth: '950px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      background: '#e67e22',
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
      color: '#e67e22',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #e67e22',
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
      border: '1px solid #e67e22',
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
      border: '1px solid #e67e22',
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
      border: '1px solid #e67e22',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
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
      background: '#e67e22',
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
          <span>{isConfirmView ? '更新購入申請 - 内容確認' : '更新購入申請'}</span>
          <button style={styles.closeButton} onClick={onClose} aria-label="閉じる">×</button>
        </div>

        {/* ボディ */}
        <div style={styles.body}>
        {isConfirmView ? (
          /* 確認画面 */
          <div>
            <div style={{ background: '#fff3e0', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ color: '#e65100', fontWeight: 'bold' }}>以下の内容で申請します。内容をご確認ください。</span>
            </div>

            {/* 申請基本情報 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>申請基本情報</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '150px' }}>管理部署</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{managementDepartment}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '150px' }}>申請者</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{applicantName}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>申請日</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{applicationDate}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>優先順位</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{priority}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>設置部門</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{installationDepartment || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>設置部署</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{installationSection || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>設置室名</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{installationRoomName || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>希望納期</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{desiredDeliveryYear}年{desiredDeliveryMonth}月</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 更新対象機器（廃棄予定） */}
            <div style={styles.section}>
              <div style={{ ...styles.sectionTitle, color: '#c0392b', borderBottomColor: '#c0392b' }}>更新対象機器（廃棄予定）</div>
              <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#c0392b', marginBottom: '12px' }}>
                  {assets[0]?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#666' }}>メーカー:</span> {assets[0]?.maker || '-'}</div>
                  <div><span style={{ color: '#666' }}>型式:</span> {assets[0]?.model || '-'}</div>
                  <div><span style={{ color: '#666' }}>設置場所:</span> {assets[0]?.roomName || '-'}</div>
                  <div><span style={{ color: '#666' }}>管理番号:</span> {assets[0]?.managementNo || '-'}</div>
                </div>
              </div>
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#ffebee', borderRadius: '4px', fontSize: '12px', color: '#c0392b', textAlign: 'center' }}>
                この機器は廃棄申請されます
              </div>
            </div>

            {/* 要望機器（新規購入希望） */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>要望機器（新規購入希望）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', width: '80px' }}>希望順</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>品目</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>メーカー</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>型式</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', width: '60px' }}>数量</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', width: '60px' }}>単位</th>
                  </tr>
                </thead>
                <tbody>
                  {desiredEquipments.filter(e => e.item.trim() !== '').map((equipment, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, color: '#e67e22' }}>{getHopeLabel(index)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{equipment.item}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{equipment.maker || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{equipment.model || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{equipment.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{equipment.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 使用用途及び件数 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>使用用途及び件数</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '150px' }}>用途</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{usagePurpose || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '150px' }}>症例数</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{caseCount ? `${caseCount} ${caseCountUnit}` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* コメント */}
            {comment && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>コメント（必要理由 他）</div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd', whiteSpace: 'pre-wrap' }}>
                  {comment}
                </div>
              </div>
            )}

            {/* 添付ファイル */}
            {attachedFiles.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>添付ファイル</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ padding: '4px 0' }}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* システム接続要望 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>システム接続要望</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '180px' }}>現在の接続状況</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{currentConnectionStatus === 'connected' ? '接続中' : '接続無し'}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left', width: '150px' }}>接続先</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{currentConnectionDestination || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>要望機器の接続要望</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{requestConnectionStatus === 'required' ? '接続要望あり' : '接続不要'}</td>
                    <th style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', textAlign: 'left' }}>要望機器の接続先</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{requestConnectionDestination || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 入力画面 */
          <>
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
                <label style={styles.label}>設置部門 <span style={{ color: '#e74c3c' }}>*</span></label>
                <SearchableSelect
                  value={installationDepartment}
                  onChange={setInstallationDepartment}
                  options={divisionOptions}
                  placeholder="選択してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置部署 <span style={{ color: '#e74c3c' }}>*</span></label>
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

          {/* 更新対象機器（廃棄予定） */}
          <div style={styles.section}>
            <div style={{ ...styles.sectionTitle, color: '#c0392b', borderBottomColor: '#c0392b' }}>
              更新対象機器（廃棄予定）
            </div>
            <div style={{ background: '#fff8f8', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#c0392b', marginBottom: '12px' }}>
                {assets[0]?.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>メーカー</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.maker || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>型式</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.model || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>管理番号</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.managementNo || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>設置場所</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.roomName || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>部門</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.department || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>部署</div>
                  <div style={{ fontWeight: 500 }}>{assets[0]?.section || '-'}</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff3e0', borderRadius: '4px', fontSize: '12px', color: '#e65100' }}>
              ※ この機器は更新に伴い廃棄申請されます。新規購入希望の機器は下記「要望機器」セクションで入力してください。
            </div>
          </div>

          {/* 要望機器（新規購入希望） */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={styles.sectionTitle}>要望機器（新規購入希望・最大3つ）</div>
              <button
                onClick={handleAddEquipment}
                disabled={desiredEquipments.length >= MAX_EQUIPMENT}
                style={{
                  padding: '6px 16px',
                  background: desiredEquipments.length >= MAX_EQUIPMENT ? '#ccc' : '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: desiredEquipments.length >= MAX_EQUIPMENT ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                + 資産を追加 ({desiredEquipments.length}/{MAX_EQUIPMENT})
              </button>
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '80px' }}>希望順</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '50px' }}>順序</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>品目</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>メーカー</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>型式</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '60px' }}>数量</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '60px' }}>単位</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '120px' }}>選択</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '50px' }}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {desiredEquipments.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                        「+ 資産を追加」ボタンで要望機器を追加してください
                      </td>
                    </tr>
                  ) : (
                    desiredEquipments.map((equipment, index) => (
                      <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, color: '#e67e22' }}>
                          {getHopeLabel(index)}
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                              onClick={() => handleMoveEquipment(index, 'up')}
                              disabled={index === 0}
                              style={{
                                padding: '2px 6px',
                                background: index === 0 ? '#ccc' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                              }}
                              aria-label="上に移動"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveEquipment(index, 'down')}
                              disabled={index === desiredEquipments.length - 1}
                              style={{
                                padding: '2px 6px',
                                background: index === desiredEquipments.length - 1 ? '#ccc' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: index === desiredEquipments.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                              }}
                              aria-label="下に移動"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
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
                              background: '#e67e22',
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
              placeholder="更新理由やコメントを入力してください"
            />
          </div>

          {/* 添付ファイル */}
          <div style={styles.section}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}>
              <button style={{
                padding: '8px 16px',
                background: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}>添付ファイル</button>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
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
                      background: '#fff3e0',
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
            <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '8px' }}>
              見積書・修理不能証明など手持ちの書類を添付してください
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

          {/* 廃棄処理の確認 */}
          <div style={styles.section}>
            <div style={{ ...styles.sectionTitle, color: '#c0392b', borderBottomColor: '#c0392b' }}>廃棄処理の確認</div>
            <div style={{
              padding: '16px',
              background: '#ffebee',
              borderRadius: '8px',
              border: '1px solid #ef9a9a',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={disposalAgreed}
                  onChange={(e) => setDisposalAgreed(e.target.checked)}
                  style={{ marginTop: '4px', width: '20px', height: '20px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#c0392b', marginBottom: '8px' }}>
                    更新対象機器の廃棄処理に同意します <span style={{ color: '#e74c3c' }}>*</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                    上記「更新対象機器」に記載された「{assets[0]?.name}」は、本更新申請の承認後に廃棄申請として処理されます。
                    廃棄処理が完了すると、当該資産は資産台帳から除外されます。
                  </div>
                </div>
              </label>
            </div>
          </div>
          </>
        )}
        </div>

        {/* フッター */}
        <div style={styles.footer}>
          {isConfirmView ? (
            <>
              <button
                onClick={handleBackToEdit}
                style={{
                  padding: '12px 32px',
                  background: 'white',
                  color: '#e67e22',
                  border: '1px solid #e67e22',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginRight: '16px',
                }}
              >
                ← 修正する
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '12px 32px',
                  background: '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                申請する
              </button>
            </>
          ) : (
            <button style={styles.confirmButton} onClick={handleConfirm}>
              記載内容を確認する
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
