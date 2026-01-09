'use client';

import { useState, useEffect } from 'react';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';

interface HospitalFacilityFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  facility?: HospitalFacilityMaster;
  onClose: () => void;
  onSubmit: (data: Partial<HospitalFacilityMaster>) => void;
  isMobile: boolean;
}

export function HospitalFacilityFormModal({
  isOpen,
  mode,
  facility,
  onClose,
  onSubmit,
  isMobile,
}: HospitalFacilityFormModalProps) {
  const [formData, setFormData] = useState({
    currentBuilding: '',
    currentFloor: '',
    currentDepartment: '',
    currentSection: '',
    newBuilding: '',
    newFloor: '',
    newDepartment: '',
    newSection: '',
  });

  useEffect(() => {
    if (mode === 'edit' && facility) {
      setFormData({
        currentBuilding: facility.currentBuilding,
        currentFloor: facility.currentFloor,
        currentDepartment: facility.currentDepartment,
        currentSection: facility.currentSection,
        newBuilding: facility.newBuilding,
        newFloor: facility.newFloor,
        newDepartment: facility.newDepartment,
        newSection: facility.newSection,
      });
    } else {
      setFormData({
        currentBuilding: '',
        currentFloor: '',
        currentDepartment: '',
        currentSection: '',
        newBuilding: '',
        newFloor: '',
        newDepartment: '',
        newSection: '',
      });
    }
  }, [mode, facility, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px' : '12px',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: isMobile ? '14px' : '15px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 600 as const,
    marginBottom: '6px',
    color: '#2c3e50',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '600px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
            color: 'white',
            padding: isMobile ? '16px' : '20px',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 600 }}>
            {mode === 'create' ? '施設マスタ新規作成' : '施設マスタ編集'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '24px' }}>
          {/* 現状の設置場所 */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#2c3e50',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e0e0e0',
              }}
            >
              現状の設置場所
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '16px' : '20px',
              }}
            >
              <div>
                <label style={labelStyle}>
                  棟 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.currentBuilding}
                  onChange={(e) => setFormData({ ...formData, currentBuilding: e.target.value })}
                  placeholder="本館"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  階 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.currentFloor}
                  onChange={(e) => setFormData({ ...formData, currentFloor: e.target.value })}
                  placeholder="3F"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  部門 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.currentDepartment}
                  onChange={(e) => setFormData({ ...formData, currentDepartment: e.target.value })}
                  placeholder="手術部門"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  部署 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.currentSection}
                  onChange={(e) => setFormData({ ...formData, currentSection: e.target.value })}
                  placeholder="手術室1"
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* 新居の設置場所 */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#8e44ad',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e8daef',
              }}
            >
              新居の設置場所
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '16px' : '20px',
              }}
            >
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>棟</label>
                <input
                  type="text"
                  value={formData.newBuilding}
                  onChange={(e) => setFormData({ ...formData, newBuilding: e.target.value })}
                  placeholder="新館"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>階</label>
                <input
                  type="text"
                  value={formData.newFloor}
                  onChange={(e) => setFormData({ ...formData, newFloor: e.target.value })}
                  placeholder="4F"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>部門</label>
                <input
                  type="text"
                  value={formData.newDepartment}
                  onChange={(e) => setFormData({ ...formData, newDepartment: e.target.value })}
                  placeholder="手術部門"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>部署</label>
                <input
                  type="text"
                  value={formData.newSection}
                  onChange={(e) => setFormData({ ...formData, newSection: e.target.value })}
                  placeholder="手術室A"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#7f8c8d' }}>
              ※ 新居の設置場所は後から入力できます。全て入力するとステータスが「マッピング済」になります。
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: isMobile ? '10px 20px' : '12px 24px',
                background: '#ecf0f1',
                color: '#2c3e50',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: isMobile ? '10px 20px' : '12px 24px',
                background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {mode === 'create' ? '作成' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
