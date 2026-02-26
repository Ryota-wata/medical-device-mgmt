'use client';

import { useState, useEffect, useMemo } from 'react';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';
import { useMasterStore } from '@/lib/stores/masterStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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
  const { departments } = useMasterStore();

  const [formData, setFormData] = useState({
    oldShipDivision: '',
    oldShipDepartment: '',
    oldShipRoomCategory: '',
    oldFloor: '',
    oldDepartment: '',
    oldSection: '',
    oldRoomName: '',
    newShipDivision: '',
    newShipDepartment: '',
    newShipRoomCategory: '',
    newFloor: '',
    newDepartment: '',
    newSection: '',
    newRoomName: '',
  });

  useEffect(() => {
    if (mode === 'edit' && facility) {
      setFormData({
        oldShipDivision: facility.oldShipDivision,
        oldShipDepartment: facility.oldShipDepartment,
        oldShipRoomCategory: facility.oldShipRoomCategory,
        oldFloor: facility.oldFloor,
        oldDepartment: facility.oldDepartment,
        oldSection: facility.oldSection,
        oldRoomName: facility.oldRoomName,
        newShipDivision: facility.newShipDivision,
        newShipDepartment: facility.newShipDepartment,
        newShipRoomCategory: facility.newShipRoomCategory,
        newFloor: facility.newFloor,
        newDepartment: facility.newDepartment,
        newSection: facility.newSection,
        newRoomName: facility.newRoomName,
      });
    } else {
      setFormData({
        oldShipDivision: '',
        oldShipDepartment: '',
        oldShipRoomCategory: '',
        oldFloor: '',
        oldDepartment: '',
        oldSection: '',
        oldRoomName: '',
        newShipDivision: '',
        newShipDepartment: '',
        newShipRoomCategory: '',
        newFloor: '',
        newDepartment: '',
        newSection: '',
        newRoomName: '',
      });
    }
  }, [mode, facility, isOpen]);

  // SHIP部門の一意なオプション
  const divisionOptions = useMemo(() => {
    return Array.from(new Set(departments.map(d => d.division))).filter(Boolean);
  }, [departments]);

  // 旧: SHIP部署（SHIP部門で絞り込み）
  const oldDeptOptions = useMemo(() => {
    if (!formData.oldShipDivision) return [];
    return Array.from(new Set(
      departments.filter(d => d.division === formData.oldShipDivision).map(d => d.department)
    )).filter(Boolean);
  }, [departments, formData.oldShipDivision]);

  // 旧: SHIP諸室区分（SHIP部門+SHIP部署で絞り込み）
  const oldRoomCatOptions = useMemo(() => {
    if (!formData.oldShipDivision || !formData.oldShipDepartment) return [];
    return Array.from(new Set(
      departments
        .filter(d => d.division === formData.oldShipDivision && d.department === formData.oldShipDepartment)
        .map(d => d.roomCategory1)
    )).filter(Boolean);
  }, [departments, formData.oldShipDivision, formData.oldShipDepartment]);

  // 新: SHIP部署（SHIP部門で絞り込み）
  const newDeptOptions = useMemo(() => {
    if (!formData.newShipDivision) return [];
    return Array.from(new Set(
      departments.filter(d => d.division === formData.newShipDivision).map(d => d.department)
    )).filter(Boolean);
  }, [departments, formData.newShipDivision]);

  // 新: SHIP諸室区分（SHIP部門+SHIP部署で絞り込み）
  const newRoomCatOptions = useMemo(() => {
    if (!formData.newShipDivision || !formData.newShipDepartment) return [];
    return Array.from(new Set(
      departments
        .filter(d => d.division === formData.newShipDivision && d.department === formData.newShipDepartment)
        .map(d => d.roomCategory1)
    )).filter(Boolean);
  }, [departments, formData.newShipDivision, formData.newShipDepartment]);

  // 旧: 親変更時に子をクリア
  const handleOldDivisionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oldShipDivision: value,
      oldShipDepartment: '',
      oldShipRoomCategory: '',
    }));
  };

  const handleOldDeptChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oldShipDepartment: value,
      oldShipRoomCategory: '',
    }));
  };

  // 新: 親変更時に子をクリア
  const handleNewDivisionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      newShipDivision: value,
      newShipDepartment: '',
      newShipRoomCategory: '',
    }));
  };

  const handleNewDeptChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      newShipDepartment: value,
      newShipRoomCategory: '',
    }));
  };

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
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 600 as const,
    marginBottom: '6px',
    color: '#2c3e50',
  };

  const sectionGrid = {
    display: 'grid' as const,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: isMobile ? '12px' : '16px',
  };

  const textFieldGrid = {
    display: 'grid' as const,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: isMobile ? '12px' : '16px',
    marginTop: isMobile ? '12px' : '16px',
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
          maxWidth: isMobile ? '100%' : '800px',
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
          {/* 旧（現状）セクション */}
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
              旧（現状の設置場所）
            </h3>

            {/* SHIP連動プルダウン3つ */}
            <div style={sectionGrid}>
              <div>
                <SearchableSelect
                  label="SHIP部門"
                  value={formData.oldShipDivision}
                  onChange={handleOldDivisionChange}
                  options={['', ...divisionOptions]}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>
              <div>
                <SearchableSelect
                  label="SHIP部署"
                  value={formData.oldShipDepartment}
                  onChange={handleOldDeptChange}
                  options={['', ...oldDeptOptions]}
                  placeholder={formData.oldShipDivision ? '選択してください' : 'SHIP部門を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.oldShipDivision}
                />
              </div>
              <div>
                <SearchableSelect
                  label="SHIP諸室区分"
                  value={formData.oldShipRoomCategory}
                  onChange={(v) => setFormData(prev => ({ ...prev, oldShipRoomCategory: v }))}
                  options={['', ...oldRoomCatOptions]}
                  placeholder={formData.oldShipDepartment ? '選択してください' : 'SHIP部署を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.oldShipDepartment}
                />
              </div>
            </div>

            {/* テキスト入力4つ */}
            <div style={textFieldGrid}>
              <div>
                <label style={labelStyle}>フロア</label>
                <input
                  type="text"
                  value={formData.oldFloor}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldFloor: e.target.value }))}
                  placeholder="3F"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>部門</label>
                <input
                  type="text"
                  value={formData.oldDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldDepartment: e.target.value }))}
                  placeholder="手術部門"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>部署</label>
                <input
                  type="text"
                  value={formData.oldSection}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldSection: e.target.value }))}
                  placeholder="外科"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>室名称</label>
                <input
                  type="text"
                  value={formData.oldRoomName}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldRoomName: e.target.value }))}
                  placeholder="手術室1"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* 新（新居）セクション */}
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
              新（新居の設置場所）
            </h3>

            {/* SHIP連動プルダウン3つ */}
            <div style={sectionGrid}>
              <div>
                <SearchableSelect
                  label="SHIP部門"
                  value={formData.newShipDivision}
                  onChange={handleNewDivisionChange}
                  options={['', ...divisionOptions]}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>
              <div>
                <SearchableSelect
                  label="SHIP部署"
                  value={formData.newShipDepartment}
                  onChange={handleNewDeptChange}
                  options={['', ...newDeptOptions]}
                  placeholder={formData.newShipDivision ? '選択してください' : 'SHIP部門を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.newShipDivision}
                />
              </div>
              <div>
                <SearchableSelect
                  label="SHIP諸室区分"
                  value={formData.newShipRoomCategory}
                  onChange={(v) => setFormData(prev => ({ ...prev, newShipRoomCategory: v }))}
                  options={['', ...newRoomCatOptions]}
                  placeholder={formData.newShipDepartment ? '選択してください' : 'SHIP部署を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.newShipDepartment}
                />
              </div>
            </div>

            {/* テキスト入力4つ */}
            <div style={textFieldGrid}>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>フロア</label>
                <input
                  type="text"
                  value={formData.newFloor}
                  onChange={(e) => setFormData(prev => ({ ...prev, newFloor: e.target.value }))}
                  placeholder="4F"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>部門</label>
                <input
                  type="text"
                  value={formData.newDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, newDepartment: e.target.value }))}
                  placeholder="手術部門"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>部署</label>
                <input
                  type="text"
                  value={formData.newSection}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSection: e.target.value }))}
                  placeholder="外科"
                  style={{ ...inputStyle, borderColor: '#d7bde2' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#8e44ad' }}>室名称</label>
                <input
                  type="text"
                  value={formData.newRoomName}
                  onChange={(e) => setFormData(prev => ({ ...prev, newRoomName: e.target.value }))}
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
