'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { Asset } from '@/lib/types';
import { CreatePurchaseApplicationInput, PurchaseApplicationAsset } from '@/lib/types/purchaseApplication';

interface AdditionApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 増設参考として選択された資産（1件のみ）
  onSuccess?: () => void;
}

export function AdditionApplicationModal({
  isOpen,
  onClose,
  assets,
  onSuccess,
}: AdditionApplicationModalProps) {
  const { departments, facilities } = useMasterStore();
  const { user } = useAuthStore();
  const { addApplication: addPurchaseApplication } = usePurchaseApplicationStore();
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

  // 増設数量
  const [additionQuantity, setAdditionQuantity] = useState(1);

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

  if (!isOpen || assets.length === 0) return null;

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

    if (additionQuantity < 1) {
      alert('増設数量は1以上を入力してください');
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
    const primaryAsset = assets[0];

    // 購入申請を作成（参考機器の情報を使用）
    const purchaseAssets: PurchaseApplicationAsset[] = [{
      name: primaryAsset.item || primaryAsset.name || '',
      maker: primaryAsset.maker || '',
      model: primaryAsset.model || '',
      quantity: additionQuantity,
      unit: '台',
    }];

    const purchaseInput: CreatePurchaseApplicationInput = {
      applicationType: '増設申請',
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
      applicationReason: `${usagePurpose}${caseCount ? ` (症例数: ${caseCount}${caseCountUnit})` : ''}${comment ? `\n${comment}` : ''}\n\n【増設参考機器】\n- ${primaryAsset.name} (${primaryAsset.model})`,
      attachedFiles: attachedFiles.map(f => f.name),
    };

    addPurchaseApplication(purchaseInput);

    alert(`増設申請を送信しました\n\n品目: ${primaryAsset.item || primaryAsset.name}\n数量: ${additionQuantity}台`);
    setIsConfirmView(false);
    onClose();
    onSuccess?.();
  };

  // テーマカラー（増設申請用：青系）
  const themeColor = '#2980b9';
  const themeLightBg = '#e3f2fd';
  const themeBorder = '#90caf9';

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
      background: themeColor,
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
      color: themeColor,
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: `2px solid ${themeColor}`,
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
      border: `1px solid ${themeColor}`,
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
      border: `1px solid ${themeColor}`,
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
      border: `1px solid ${themeColor}`,
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
      background: themeColor,
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
          <span>{isConfirmView ? '増設購入申請 - 内容確認' : '増設購入申請'}</span>
          <button style={styles.closeButton} onClick={onClose} aria-label="閉じる">×</button>
        </div>

        {/* ボディ */}
        <div style={styles.body}>
        {isConfirmView ? (
          /* 確認画面 */
          <div>
            <div style={{ background: themeLightBg, padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ color: themeColor, fontWeight: 'bold' }}>以下の内容で申請します。内容をご確認ください。</span>
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

            {/* 増設対象機器 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>増設対象機器</div>
              <div style={{ background: themeLightBg, border: `1px solid ${themeBorder}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: themeColor, marginBottom: '12px' }}>
                  {assets[0]?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#666' }}>メーカー:</span> {assets[0]?.maker || '-'}</div>
                  <div><span style={{ color: '#666' }}>型式:</span> {assets[0]?.model || '-'}</div>
                  <div><span style={{ color: '#666' }}>設置場所:</span> {assets[0]?.roomName || '-'}</div>
                  <div><span style={{ color: '#666' }}>管理番号:</span> {assets[0]?.managementNo || '-'}</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff3e0', borderRadius: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e65100' }}>増設数量:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e65100', fontVariantNumeric: 'tabular-nums' }}>{additionQuantity} 台</span>
              </div>
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

          {/* 増設対象機器 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              増設対象機器
            </div>
            <div style={{ background: themeLightBg, border: `1px solid ${themeBorder}`, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: themeColor, marginBottom: '12px' }}>
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
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffcc80' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#e65100' }}>
                増設数量 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                value={additionQuantity}
                onChange={(e) => setAdditionQuantity(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  border: '2px solid #e65100',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e65100' }}>台</span>
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                ※ 上記機器と同等品を何台増設するかを入力してください
              </span>
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
              placeholder="増設理由やコメントを入力してください"
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
                background: themeColor,
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
                      background: themeLightBg,
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
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              見積書・参考資料などを添付してください
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
                  color: themeColor,
                  border: `1px solid ${themeColor}`,
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
                  background: themeColor,
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
