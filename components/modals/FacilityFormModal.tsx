'use client';

import { useState, useEffect } from 'react';
import { FacilityMaster } from '@/lib/types/master';

interface FacilityFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  facility?: FacilityMaster;
  onClose: () => void;
  onSubmit: (data: Partial<FacilityMaster>) => void;
  isMobile?: boolean;
}

export function FacilityFormModal({
  isOpen,
  mode,
  facility,
  onClose,
  onSubmit,
  isMobile = false
}: FacilityFormModalProps) {
  const [formData, setFormData] = useState({
    facilityCode: '',
    facilityName: '',
    building: '',
    floor: '',
    department: '',
    section: ''
  });

  useEffect(() => {
    if (mode === 'edit' && facility) {
      setFormData({
        facilityCode: facility.facilityCode,
        facilityName: facility.facilityName,
        building: facility.building || '',
        floor: facility.floor || '',
        department: facility.department || '',
        section: facility.section || ''
      });
    } else {
      setFormData({
        facilityCode: '',
        facilityName: '',
        building: '',
        floor: '',
        department: '',
        section: ''
      });
    }
  }, [mode, facility, isOpen]);

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
            {mode === 'create' ? 'SHIP施設マスタ新規作成' : 'SHIP施設マスタ編集'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* フォームコンテンツ */}
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* 基本情報セクション */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>基本情報</h3>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    施設コード<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.facilityCode}
                    onChange={(e) => handleChange('facilityCode', e.target.value)}
                    placeholder="F001"
                    required
                  />
                  <small style={styles.hint}>例: F001</small>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    施設名<span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.facilityName}
                    onChange={(e) => handleChange('facilityName', e.target.value)}
                    placeholder="東京中央総合病院"
                    required
                  />
                </div>
              </div>

              <div style={{...styles.formRow, ...(isMobile && styles.formRowMobile)}}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>棟</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.building}
                    onChange={(e) => handleChange('building', e.target.value)}
                    placeholder="本館"
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>階</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.floor}
                    onChange={(e) => handleChange('floor', e.target.value)}
                    placeholder="1F"
                  />
                </div>
              </div>

              <div style={{...styles.formRow, ...(isMobile && styles.formRowMobile)}}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>部門</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="内科"
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>部署</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.section}
                    onChange={(e) => handleChange('section', e.target.value)}
                    placeholder="外来"
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
