'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLendingStore } from '@/lib/stores';
import { Asset } from '@/lib/types';

interface LendingRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAssets?: Asset[];
}

export function LendingRegistrationModal({
  isOpen,
  onClose,
  preSelectedAssets,
}: LendingRegistrationModalProps) {
  const { devices, addDevice } = useLendingStore();

  const [lendingGroupName, setLendingGroupName] = useState('');
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [alertDays, setAlertDays] = useState('7');

  const existingGroupNames = useMemo(() => {
    return [...new Set(devices.map(d => d.lendingGroupName).filter(Boolean))];
  }, [devices]);

  useEffect(() => {
    if (isOpen) {
      setLendingGroupName('');
      setIsNewGroup(false);
      setAlertDays('7');
    }
  }, [isOpen]);

  if (!isOpen || !preSelectedAssets || preSelectedAssets.length === 0) return null;

  const handleSubmit = () => {
    if (!lendingGroupName) {
      alert('貸出グループ名を設定してください');
      return;
    }

    preSelectedAssets.forEach((asset) => {
      addDevice({
        qrCode: asset.qrCode,
        itemName: asset.item || asset.name,
        maker: asset.maker,
        model: asset.model,
        department: asset.department || '',
        section: asset.section || '',
        lendingGroupName,
        alertDays: Number(alertDays) || 7,
      });
    });

    alert(`${preSelectedAssets.length}件の資産を貸出管理に登録しました`);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: '8px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>貸出機器登録</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d' }} aria-label="閉じる">×</button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 貸出グループ名 */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: '8px' }}>貸出グループ名</label>
            {!isNewGroup ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                  value={lendingGroupName}
                  onChange={(e) => setLendingGroupName(e.target.value)}
                >
                  <option value="">グループを選択</option>
                  {existingGroupNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setIsNewGroup(true); setLendingGroupName(''); }}
                  style={{ padding: '8px 14px', fontSize: '13px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  新規作成
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                  value={lendingGroupName}
                  onChange={(e) => setLendingGroupName(e.target.value)}
                  placeholder="新しいグループ名を入力"
                />
                <button
                  type="button"
                  onClick={() => { setIsNewGroup(false); setLendingGroupName(''); }}
                  style={{ padding: '8px 14px', fontSize: '13px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  既存から選択
                </button>
              </div>
            )}
          </div>

          {/* アラート期間 */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: '8px' }}>アラート発生までの期間</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="1"
                max="365"
                style={{ width: '80px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', textAlign: 'right' }}
                value={alertDays}
                onChange={(e) => setAlertDays(e.target.value)}
              />
              <span style={{ fontSize: '14px', color: '#555' }}>日</span>
            </div>
          </div>

          {/* 対象資産一覧 */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: '8px' }}>対象資産（{preSelectedAssets.length}件）</label>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', textAlign: 'left', position: 'sticky', top: 0 }}>QRコード</th>
                    <th style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', textAlign: 'left', position: 'sticky', top: 0 }}>品目</th>
                    <th style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', textAlign: 'left', position: 'sticky', top: 0 }}>メーカー</th>
                    <th style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', textAlign: 'left', position: 'sticky', top: 0 }}>型式</th>
                    <th style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', textAlign: 'left', position: 'sticky', top: 0 }}>部署</th>
                  </tr>
                </thead>
                <tbody>
                  {preSelectedAssets.map((asset, index) => (
                    <tr key={`${asset.qrCode}-${index}`}>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{asset.qrCode}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{asset.item}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{asset.maker}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{asset.model}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{asset.section || asset.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>戻る</button>
          <button onClick={handleSubmit} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>貸出管理に登録</button>
        </div>
      </div>
    </div>
  );
}
