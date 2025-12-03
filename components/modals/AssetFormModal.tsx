'use client';

import { useState, useEffect } from 'react';
import { AssetMaster } from '@/lib/types/master';

interface AssetFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  asset?: AssetMaster;
  onClose: () => void;
  onSubmit: (data: Partial<AssetMaster>) => void;
  isMobile?: boolean;
}

export function AssetFormModal({
  isOpen,
  mode,
  asset,
  onClose,
  onSubmit,
  isMobile = false
}: AssetFormModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    maker: '',
    model: ''
  });

  useEffect(() => {
    if (mode === 'edit' && asset) {
      setFormData({
        category: asset.category,
        largeClass: asset.largeClass,
        mediumClass: asset.mediumClass,
        item: asset.item,
        maker: asset.maker,
        model: asset.model
      });
    } else {
      setFormData({
        category: '',
        largeClass: '',
        mediumClass: '',
        item: '',
        maker: '',
        model: ''
      });
    }
  }, [mode, asset, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{...styles.modalContent, ...(isMobile && styles.modalContentMobile)}} onClick={(e) => e.stopPropagation()}>
        {/* モーダルヘッダー */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {mode === 'create' ? 'SHIP資産マスタ新規作成' : 'SHIP資産マスタ編集'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* フォームコンテンツ */}
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* 分類情報セクション */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>分類情報</h3>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Category<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <select
                    style={styles.select}
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="医療機器">医療機器</option>
                    <option value="什器備品">什器備品</option>
                  </select>
                  <small style={styles.hint}>医療機器または什器備品を選択</small>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    大分類<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.largeClass}
                    onChange={(e) => handleChange('largeClass', e.target.value)}
                    placeholder="放射線関連機器"
                    required
                  />
                  <small style={styles.hint}>例: 放射線関連機器</small>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    中分類<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.mediumClass}
                    onChange={(e) => handleChange('mediumClass', e.target.value)}
                    placeholder="CT関連"
                    required
                  />
                  <small style={styles.hint}>例: CT関連</small>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    品目<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.item}
                    onChange={(e) => handleChange('item', e.target.value)}
                    placeholder="CTスキャナ"
                    required
                  />
                  <small style={styles.hint}>例: CTスキャナ</small>
                </div>
              </div>

              <div style={{...styles.formRow, ...(isMobile && styles.formRowMobile)}}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>
                    メーカー<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.maker}
                    onChange={(e) => handleChange('maker', e.target.value)}
                    placeholder="GEヘルスケア"
                    required
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>
                    型式<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="Revolution CT"
                    required
                  />
                </div>
              </div>
            </div>

            {/* フォームアクション */}
            <div style={{...styles.formActions, ...(isMobile && styles.formActionsMobile)}}>
              <button type="button" style={{...styles.button, ...styles.cancelButton}} onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" style={{...styles.button, ...styles.submitButton}}>
                {mode === 'create' ? '登録' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  modal: {
    display: 'block',
    position: 'fixed',
    zIndex: 2000,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: '3% auto',
    padding: 0,
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideDown 0.3s ease-out'
  },
  modalContentMobile: {
    width: '95%',
    margin: '5% auto',
    maxHeight: '90vh'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white',
    padding: '20px 28px',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '28px',
    lineHeight: '1',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formContainer: {
    padding: 0,
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  formSection: {
    padding: '24px 28px',
    borderBottom: '1px solid #f0f0f0'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2c3e50',
    marginBottom: '20px',
    paddingBottom: '8px',
    borderBottom: '2px solid #4CAF50'
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  formRowMobile: {
    flexDirection: 'column',
    gap: '12px'
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  formGroupHalf: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    padding: '10px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.2s',
    background: 'white'
  },
  select: {
    padding: '10px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.2s',
    background: 'white',
    cursor: 'pointer'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
    display: 'block'
  },
  formActions: {
    padding: '20px 28px',
    borderTop: '2px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    background: '#f8f9fa'
  },
  formActionsMobile: {
    flexDirection: 'column',
    padding: '16px 20px'
  },
  button: {
    padding: '12px 28px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '120px'
  },
  cancelButton: {
    background: '#95a5a6',
    color: 'white'
  },
  submitButton: {
    background: '#4CAF50',
    color: 'white'
  }
};
