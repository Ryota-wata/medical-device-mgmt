'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useHospitalFacilityStore } from '@/lib/stores/hospitalFacilityStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ExcelImportPreviewModal } from '@/components/ui/ExcelImportPreviewModal';
import { exportFacilitiesToExcel, parseFacilitiesFromExcel, assignFacilityIds, downloadFacilityTemplate } from '@/lib/utils/excel-hospital-facility';

/** インライン編集用のフォームデータ型 */
interface InlineFormData {
  oldShipDivision: string;
  oldShipDepartment: string;
  oldShipRoomCategory: string;
  oldFloor: string;
  oldDepartment: string;
  oldSection: string;
  oldRoomName: string;
  newShipDivision: string;
  newShipDepartment: string;
  newShipRoomCategory: string;
  newFloor: string;
  newDepartment: string;
  newSection: string;
  newRoomName: string;
}

const emptyForm: InlineFormData = {
  oldShipDivision: '', oldShipDepartment: '', oldShipRoomCategory: '',
  oldFloor: '', oldDepartment: '', oldSection: '', oldRoomName: '',
  newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '',
  newFloor: '', newDepartment: '', newSection: '', newRoomName: '',
};

function HospitalFacilityMasterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { facilities: masterFacilities, departments } = useMasterStore();
  const {
    facilities,
    setFacilities,
    addFacility,
    updateFacility,
    deleteFacility,
    generateFacilityId,
  } = useHospitalFacilityStore();

  // URLパラメータから施設名を取得
  const facilityParam = searchParams.get('facility');
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>(facilityParam || '');

  // 施設マスタから施設名オプションを生成
  const facilityOptions = masterFacilities.map(f => f.facilityName);

  // フィルター状態
  const [filterOldFloor, setFilterOldFloor] = useState('');
  const [filterOldDepartment, setFilterOldDepartment] = useState('');
  const [filterNewFloor, setFilterNewFloor] = useState('');
  const [filterNewDepartment, setFilterNewDepartment] = useState('');

  // インライン編集状態: null=表示モード, 'new'=新規行, それ以外=編集中のfacility.id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InlineFormData>(emptyForm);

  // Excel インポート/エクスポート
  const [importPreview, setImportPreview] = useState<{ facilities: HospitalFacilityMaster[]; errors: string[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // サンプルデータ初期化
  useEffect(() => {
    if (facilities.length === 0 && masterFacilities.length > 0) {
      const firstFacility = masterFacilities[0]?.facilityName || '東京中央病院';
      const secondFacility = masterFacilities[1]?.facilityName || '大阪総合医療センター';

      const sampleFacilities: HospitalFacilityMaster[] = [
        { id: 'HF00001', hospitalId: firstFacility, hospitalName: firstFacility, oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '3F', oldDepartment: '手術部門', oldSection: '手術部門', oldRoomName: '手術室1', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '4F', newDepartment: '手術部門', newSection: '手術部門', newRoomName: '手術室A', status: 'mapped', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: 'HF00002', hospitalId: firstFacility, hospitalName: firstFacility, oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '3F', oldDepartment: '手術部門', oldSection: '手術部門', oldRoomName: '手術室2', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '4F', newDepartment: '手術部門', newSection: '手術部門', newRoomName: '手術室B', status: 'completed', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: 'HF00003', hospitalId: firstFacility, hospitalName: firstFacility, oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来', oldSection: '外来', oldRoomName: '診察室1', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '3F', newDepartment: '外来', newSection: '外来', newRoomName: '診察室A', status: 'draft', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: 'HF00004', hospitalId: secondFacility, hospitalName: secondFacility, oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '1F', oldDepartment: '救急部門', oldSection: '救急部門', oldRoomName: '救急処置室', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '1F', newDepartment: '救急部門', newSection: '救急部門', newRoomName: '救急処置室A', status: 'draft', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: 'HF00005', hospitalId: secondFacility, hospitalName: secondFacility, oldShipDivision: '検査部門', oldShipDepartment: '検査科', oldShipRoomCategory: '検体検査室', oldFloor: '2F', oldDepartment: '検査部門', oldSection: '検査部門', oldRoomName: '検査室1', newShipDivision: '検査部門', newShipDepartment: '検査科', newShipRoomCategory: '検体検査室', newFloor: '2F', newDepartment: '検査部門', newSection: '検査部門', newRoomName: '検査室A', status: 'draft', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];
      setFacilities(sampleFacilities);
    }
  }, [facilities.length, masterFacilities, setFacilities]);

  // 選択施設の個別施設一覧を取得
  const hospitalFacilities = selectedFacilityName
    ? facilities.filter((f) => f.hospitalName === selectedFacilityName)
    : [];

  // フィルタリング処理
  const filteredFacilities = hospitalFacilities.filter((facility) => {
    const matchOldFloor = !filterOldFloor || facility.oldFloor.toLowerCase().includes(filterOldFloor.toLowerCase());
    const matchOldDepartment = !filterOldDepartment || facility.oldDepartment.toLowerCase().includes(filterOldDepartment.toLowerCase());
    const matchNewFloor = !filterNewFloor || facility.newFloor.toLowerCase().includes(filterNewFloor.toLowerCase());
    const matchNewDepartment = !filterNewDepartment || facility.newDepartment.toLowerCase().includes(filterNewDepartment.toLowerCase());
    return matchOldFloor && matchOldDepartment && matchNewFloor && matchNewDepartment;
  });

  // ── SHIP連動プルダウンオプション ──
  const divisionOptions = useMemo(() =>
    Array.from(new Set(departments.map(d => d.division))).filter(Boolean),
    [departments]
  );

  // 旧 SHIP部署（部門で絞り込み）
  const oldDeptOptions = useMemo(() => {
    if (!editForm.oldShipDivision) return [];
    return Array.from(new Set(departments.filter(d => d.division === editForm.oldShipDivision).map(d => d.department))).filter(Boolean);
  }, [departments, editForm.oldShipDivision]);

  // 旧 SHIP諸室区分（部門+部署で絞り込み）
  const oldRoomCatOptions = useMemo(() => {
    if (!editForm.oldShipDivision || !editForm.oldShipDepartment) return [];
    return Array.from(new Set(departments.filter(d => d.division === editForm.oldShipDivision && d.department === editForm.oldShipDepartment).map(d => d.roomCategory1))).filter(Boolean);
  }, [departments, editForm.oldShipDivision, editForm.oldShipDepartment]);

  // 新 SHIP部署
  const newDeptOptions = useMemo(() => {
    if (!editForm.newShipDivision) return [];
    return Array.from(new Set(departments.filter(d => d.division === editForm.newShipDivision).map(d => d.department))).filter(Boolean);
  }, [departments, editForm.newShipDivision]);

  // 新 SHIP諸室区分
  const newRoomCatOptions = useMemo(() => {
    if (!editForm.newShipDivision || !editForm.newShipDepartment) return [];
    return Array.from(new Set(departments.filter(d => d.division === editForm.newShipDivision && d.department === editForm.newShipDepartment).map(d => d.roomCategory1))).filter(Boolean);
  }, [departments, editForm.newShipDivision, editForm.newShipDepartment]);

  // ── 操作ハンドラ ──
  const handleBack = () => router.push('/main');

  const handleStartNew = () => {
    setEditingId('new');
    setEditForm({ ...emptyForm });
  };

  const handleStartEdit = (facility: HospitalFacilityMaster) => {
    setEditingId(facility.id);
    setEditForm({
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
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ ...emptyForm });
  };

  const handleSave = () => {
    if (editingId === 'new') {
      if (!selectedFacilityName) return;
      const newFacility: HospitalFacilityMaster = {
        id: generateFacilityId(),
        hospitalId: selectedFacilityName,
        hospitalName: selectedFacilityName,
        ...editForm,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addFacility(newFacility);
    } else if (editingId) {
      updateFacility(editingId, editForm);
    }
    setEditingId(null);
    setEditForm({ ...emptyForm });
  };

  const handleDelete = (id: string) => {
    if (confirm('この施設マスタを削除してもよろしいですか？')) {
      deleteFacility(id);
      if (editingId === id) handleCancel();
    }
  };

  // ── Excel インポート/エクスポート ハンドラ ──
  const handleExport = () => {
    exportFacilitiesToExcel(filteredFacilities);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseFacilitiesFromExcel(file);
      setImportPreview(result);
      setShowImportModal(true);
    } catch {
      alert('ファイルの読み込みに失敗しました');
    }
    e.target.value = '';
  };

  const handleImportAdd = () => {
    if (!importPreview) return;
    const withIds = assignFacilityIds(importPreview.facilities, facilities);
    setFacilities([...facilities, ...withIds]);
    setShowImportModal(false);
    setImportPreview(null);
  };

  const handleImportReplace = () => {
    if (!importPreview || !selectedFacilityName) return;
    const withIds = assignFacilityIds(importPreview.facilities, []);
    // 選択中の病院の施設を入れ替え（他病院のデータは維持）
    const otherFacilities = facilities.filter((f) => f.hospitalName !== selectedFacilityName);
    setFacilities([...otherFacilities, ...withIds]);
    setShowImportModal(false);
    setImportPreview(null);
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setImportPreview(null);
  };

  // SHIP連動: 親変更時に子をクリア
  const updateField = (key: keyof InlineFormData, value: string) => {
    setEditForm(prev => {
      const next = { ...prev, [key]: value };
      // 旧 部門→部署・諸室クリア
      if (key === 'oldShipDivision') { next.oldShipDepartment = ''; next.oldShipRoomCategory = ''; }
      if (key === 'oldShipDepartment') { next.oldShipRoomCategory = ''; }
      // 新 部門→部署・諸室クリア
      if (key === 'newShipDivision') { next.newShipDepartment = ''; next.newShipRoomCategory = ''; }
      if (key === 'newShipDepartment') { next.newShipRoomCategory = ''; }
      return next;
    });
  };

  // ── スタイル定数 ──
  const thStyleOld = (isTab: boolean) => ({
    padding: isTab ? '10px 8px' : '12px 10px',
    textAlign: 'left' as const,
    fontSize: isTab ? '12px' : '13px',
    fontWeight: 600,
    color: '#2c3e50',
    whiteSpace: 'nowrap' as const,
    background: '#f8f9fa',
  });

  const thStyleNew = (isTab: boolean) => ({
    padding: isTab ? '10px 8px' : '12px 10px',
    textAlign: 'left' as const,
    fontSize: isTab ? '12px' : '13px',
    fontWeight: 600,
    color: '#8e44ad',
    whiteSpace: 'nowrap' as const,
    background: '#f5f0ff',
  });

  const tdBase = (isTab: boolean) => ({
    padding: isTab ? '6px 4px' : '8px 6px',
    fontSize: isTab ? '12px' : '13px',
    whiteSpace: 'nowrap' as const,
    verticalAlign: 'top' as const,
  });

  const cellInputStyle = {
    width: '100%',
    minWidth: '60px',
    padding: '6px 8px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
  };

  const filterLabelStyle = (color: string) => ({
    display: 'block' as const,
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 600,
    marginBottom: '6px',
    color,
  });

  const filterInputStyle = (borderColor: string) => ({
    width: '100%',
    padding: isMobile ? '8px' : '10px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    fontSize: isMobile ? '13px' : '14px',
  });

  // ── 共通: インライン入力セル（SHIP SearchableSelect） ──
  const renderShipSelect = (
    fieldKey: keyof InlineFormData,
    options: string[],
    placeholder: string,
    disabled?: boolean,
  ) => (
    <SearchableSelect
      value={editForm[fieldKey]}
      onChange={(v) => updateField(fieldKey, v)}
      options={['', ...options]}
      placeholder={disabled ? '-' : placeholder}
      isMobile={isMobile}
      disabled={disabled}
      dropdownMinWidth="160px"
    />
  );

  // ── 共通: インラインテキスト入力セル ──
  const renderTextInput = (fieldKey: keyof InlineFormData, placeholder: string, borderColor?: string) => (
    <input
      type="text"
      value={editForm[fieldKey]}
      onChange={(e) => updateField(fieldKey, e.target.value)}
      placeholder={placeholder}
      style={{ ...cellInputStyle, ...(borderColor ? { borderColor } : {}) }}
    />
  );

  // ── 操作ボタン（表示モード） ──
  const renderActionButtons = (facility: HospitalFacilityMaster, isTab: boolean) => (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
      <button
        onClick={() => handleStartEdit(facility)}
        disabled={editingId !== null}
        style={{
          padding: '5px 10px',
          background: editingId !== null ? '#bdc3c7' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: isTab ? '12px' : '13px',
          fontWeight: 600,
          cursor: editingId !== null ? 'not-allowed' : 'pointer',
        }}
      >
        編集
      </button>
      <button
        onClick={() => handleDelete(facility.id)}
        disabled={editingId !== null}
        style={{
          padding: '5px 10px',
          background: editingId !== null ? '#bdc3c7' : '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: isTab ? '12px' : '13px',
          fontWeight: 600,
          cursor: editingId !== null ? 'not-allowed' : 'pointer',
        }}
      >
        削除
      </button>
    </div>
  );

  // ── 操作ボタン（編集モード: 保存 / キャンセル） ──
  const renderSaveCancelButtons = (isTab: boolean) => (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
      <button
        onClick={handleSave}
        style={{
          padding: '5px 10px',
          background: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: isTab ? '12px' : '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        保存
      </button>
      <button
        onClick={handleCancel}
        style={{
          padding: '5px 10px',
          background: '#95a5a6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: isTab ? '12px' : '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        取消
      </button>
    </div>
  );

  // ── 編集行レンダー（テーブル） ──
  const renderEditRow = (key: string) => {
    const editBg = '#fffde7';
    return (
      <tr key={key} style={{ background: editBg, borderBottom: '2px solid #f9a825' }}>
        {/* 旧 個別 */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldFloor', '3F')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldDepartment', '手術部門')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldSection', '外科')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '1px solid #e0e0e0' }}>{renderTextInput('oldRoomName', '手術室1')}</td>
        {/* 旧 SHIP */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('oldShipDivision', divisionOptions, '部門')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('oldShipDepartment', oldDeptOptions, '部署', !editForm.oldShipDivision)}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '2px solid #e0e0e0' }}>{renderShipSelect('oldShipRoomCategory', oldRoomCatOptions, '諸室', !editForm.oldShipDepartment)}</td>
        {/* 新 個別 */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newFloor', '4F', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newDepartment', '手術部門', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newSection', '外科', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '1px solid #e0e0e0' }}>{renderTextInput('newRoomName', '手術室A', '#d7bde2')}</td>
        {/* 新 SHIP */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('newShipDivision', divisionOptions, '部門')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('newShipDepartment', newDeptOptions, '部署', !editForm.newShipDivision)}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '2px solid #e0e0e0' }}>{renderShipSelect('newShipRoomCategory', newRoomCatOptions, '諸室', !editForm.newShipDepartment)}</td>
        {/* 操作 */}
        <td style={{ ...tdBase(isTablet), background: editBg, textAlign: 'center' }}>{renderSaveCancelButtons(isTablet)}</td>
      </tr>
    );
  };

  // ── 表示行レンダー（テーブル） ──
  const renderDisplayRow = (facility: HospitalFacilityMaster, index: number) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven ? 'white' : '#fafafa';
    const newBg = isEven ? '#faf8fc' : '#f5f0ff';
    return (
      <tr key={facility.id} style={{ borderBottom: '1px solid #f0f0f0', background: rowBg }}>
        {/* 旧 個別 */}
        <td style={tdBase(isTablet)}>{facility.oldFloor}</td>
        <td style={tdBase(isTablet)}>{facility.oldDepartment}</td>
        <td style={tdBase(isTablet)}>{facility.oldSection}</td>
        <td style={{ ...tdBase(isTablet), borderRight: '1px solid #e0e0e0' }}>{facility.oldRoomName}</td>
        {/* 旧 SHIP */}
        <td style={tdBase(isTablet)}>{facility.oldShipDivision}</td>
        <td style={tdBase(isTablet)}>{facility.oldShipDepartment}</td>
        <td style={{ ...tdBase(isTablet), borderRight: '2px solid #e0e0e0' }}>{facility.oldShipRoomCategory}</td>
        {/* 新 個別 */}
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newFloor || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newDepartment || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newSection || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg, borderRight: '1px solid #e0e0e0' }}>{facility.newRoomName || '-'}</td>
        {/* 新 SHIP */}
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newShipDivision || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newShipDepartment || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg, borderRight: '2px solid #e0e0e0' }}>{facility.newShipRoomCategory || '-'}</td>
        {/* 操作 */}
        <td style={{ ...tdBase(isTablet), textAlign: 'center' }}>{renderActionButtons(facility, isTablet)}</td>
      </tr>
    );
  };

  // ── モバイル: 編集カード ──
  const renderMobileEditCard = (key: string) => {
    const selectLabelStyle = { fontSize: '12px', color: '#546e7a', marginBottom: '4px' };
    const inputLabelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#2c3e50', marginBottom: '4px' };
    const purpleLabelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#8e44ad', marginBottom: '4px' };
    return (
      <div key={key} style={{ background: '#fffde7', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '2px solid #f9a825' }}>
        {/* 旧 個別 */}
        <div style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #e0e0e0', fontSize: '14px' }}>旧（現状）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div><div style={inputLabelStyle}>フロア</div><input type="text" value={editForm.oldFloor} onChange={(e) => updateField('oldFloor', e.target.value)} placeholder="3F" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>部門</div><input type="text" value={editForm.oldDepartment} onChange={(e) => updateField('oldDepartment', e.target.value)} placeholder="手術部門" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>部署</div><input type="text" value={editForm.oldSection} onChange={(e) => updateField('oldSection', e.target.value)} placeholder="外科" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>室名称</div><input type="text" value={editForm.oldRoomName} onChange={(e) => updateField('oldRoomName', e.target.value)} placeholder="手術室1" style={cellInputStyle} /></div>
        </div>
        {/* 旧 SHIP */}
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部門</div>
          <SearchableSelect value={editForm.oldShipDivision} onChange={(v) => updateField('oldShipDivision', v)} options={['', ...divisionOptions]} placeholder="選択" isMobile />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部署</div>
          <SearchableSelect value={editForm.oldShipDepartment} onChange={(v) => updateField('oldShipDepartment', v)} options={['', ...oldDeptOptions]} placeholder={editForm.oldShipDivision ? '選択' : '-'} isMobile disabled={!editForm.oldShipDivision} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={selectLabelStyle}>SHIP諸室区分</div>
          <SearchableSelect value={editForm.oldShipRoomCategory} onChange={(v) => updateField('oldShipRoomCategory', v)} options={['', ...oldRoomCatOptions]} placeholder={editForm.oldShipDepartment ? '選択' : '-'} isMobile disabled={!editForm.oldShipDepartment} />
        </div>

        {/* 新 個別 */}
        <div style={{ fontWeight: 600, color: '#8e44ad', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #e8daef', fontSize: '14px' }}>新（新居）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div><div style={purpleLabelStyle}>フロア</div><input type="text" value={editForm.newFloor} onChange={(e) => updateField('newFloor', e.target.value)} placeholder="4F" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>部門</div><input type="text" value={editForm.newDepartment} onChange={(e) => updateField('newDepartment', e.target.value)} placeholder="手術部門" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>部署</div><input type="text" value={editForm.newSection} onChange={(e) => updateField('newSection', e.target.value)} placeholder="外科" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>室名称</div><input type="text" value={editForm.newRoomName} onChange={(e) => updateField('newRoomName', e.target.value)} placeholder="手術室A" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
        </div>
        {/* 新 SHIP */}
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部門</div>
          <SearchableSelect value={editForm.newShipDivision} onChange={(v) => updateField('newShipDivision', v)} options={['', ...divisionOptions]} placeholder="選択" isMobile />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部署</div>
          <SearchableSelect value={editForm.newShipDepartment} onChange={(v) => updateField('newShipDepartment', v)} options={['', ...newDeptOptions]} placeholder={editForm.newShipDivision ? '選択' : '-'} isMobile disabled={!editForm.newShipDivision} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={selectLabelStyle}>SHIP諸室区分</div>
          <SearchableSelect value={editForm.newShipRoomCategory} onChange={(v) => updateField('newShipRoomCategory', v)} options={['', ...newRoomCatOptions]} placeholder={editForm.newShipDepartment ? '選択' : '-'} isMobile disabled={!editForm.newShipDepartment} />
        </div>

        {/* 保存/取消 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>保存</button>
          <button onClick={handleCancel} style={{ flex: 1, padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>取消</button>
        </div>
      </div>
    );
  };

  // ── モバイル: 表示カード ──
  const renderMobileDisplayCard = (facility: HospitalFacilityMaster) => (
    <div key={facility.id} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, color: '#7f8c8d', marginBottom: '6px' }}>旧（現状）</div>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#95a5a6', fontSize: '12px' }}>場所: </span>{facility.oldFloor} / {facility.oldDepartment} / {facility.oldSection} / {facility.oldRoomName}</div>
          <div><span style={{ color: '#95a5a6', fontSize: '12px' }}>SHIP: </span>{facility.oldShipDivision} / {facility.oldShipDepartment} / {facility.oldShipRoomCategory}</div>
        </div>
        <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, color: '#8e44ad', marginBottom: '6px' }}>新（新居）</div>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#b39ddb', fontSize: '12px' }}>場所: </span>{facility.newFloor || '-'} / {facility.newDepartment || '-'} / {facility.newSection || '-'} / {facility.newRoomName || '-'}</div>
          <div><span style={{ color: '#b39ddb', fontSize: '12px' }}>SHIP: </span>{facility.newShipDivision || '-'} / {facility.newShipDepartment || '-'} / {facility.newShipRoomCategory || '-'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={() => handleStartEdit(facility)} disabled={editingId !== null} style={{ flex: 1, padding: '8px', background: editingId !== null ? '#bdc3c7' : '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: editingId !== null ? 'not-allowed' : 'pointer' }}>編集</button>
        <button onClick={() => handleDelete(facility.id)} disabled={editingId !== null} style={{ flex: 1, padding: '8px', background: editingId !== null ? '#bdc3c7' : '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: editingId !== null ? 'not-allowed' : 'pointer' }}>削除</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? '12px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', padding: isMobile ? '6px 10px' : '8px 12px', borderRadius: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: 700, letterSpacing: '1px' }}>施設</div>
            <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>個別施設マスタ</h1>
          </div>
          {selectedFacilityName && (
            <div style={{ background: '#34495e', color: '#ffffff', padding: isMobile ? '4px 12px' : '6px 16px', borderRadius: '20px', fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }}>
              {selectedFacilityName} - {filteredFacilities.length}件
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {selectedFacilityName && (
            <>
              <button
                onClick={handleExport}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  background: '#2980b9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                エクスポート
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  background: '#8e44ad',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                インポート
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                onClick={handleStartNew}
                disabled={editingId !== null}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  background: editingId !== null ? '#7f8c8d' : '#8e44ad',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  cursor: editingId !== null ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                新規作成
              </button>
            </>
          )}
          <button onClick={handleBack} style={{ padding: isMobile ? '8px 16px' : '10px 20px', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', fontSize: isMobile ? '13px' : '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            メイン画面に戻る
          </button>
        </div>
      </header>

      {/* Facility Selection */}
      {!facilityParam && (
        <div style={{ background: 'white', padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: '2px solid #e0e0e0' }}>
          <SearchableSelect
            label="施設を選択"
            value={selectedFacilityName}
            onChange={(value) => { setSelectedFacilityName(value); handleCancel(); }}
            options={['', ...facilityOptions]}
            placeholder="施設を選択してください"
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Filter Header */}
      {selectedFacilityName && (
        <div style={{ background: 'white', padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px', borderBottom: '2px solid #e0e0e0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '16px' }}>
          <div><label style={filterLabelStyle('#2c3e50')}>旧 - フロア</label><input type="text" value={filterOldFloor} onChange={(e) => setFilterOldFloor(e.target.value)} placeholder="3F" style={filterInputStyle('#d0d0d0')} /></div>
          <div><label style={filterLabelStyle('#2c3e50')}>旧 - 部門</label><input type="text" value={filterOldDepartment} onChange={(e) => setFilterOldDepartment(e.target.value)} placeholder="手術部門" style={filterInputStyle('#d0d0d0')} /></div>
          <div><label style={filterLabelStyle('#8e44ad')}>新 - フロア</label><input type="text" value={filterNewFloor} onChange={(e) => setFilterNewFloor(e.target.value)} placeholder="4F" style={filterInputStyle('#d7bde2')} /></div>
          <div><label style={filterLabelStyle('#8e44ad')}>新 - 部門</label><input type="text" value={filterNewDepartment} onChange={(e) => setFilterNewDepartment(e.target.value)} placeholder="手術部門" style={filterInputStyle('#d7bde2')} /></div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {!selectedFacilityName ? (
          <div style={{ background: 'white', borderRadius: '8px', padding: isMobile ? '40px 20px' : '60px 40px', textAlign: 'center', color: '#7f8c8d', fontSize: isMobile ? '14px' : '16px' }}>
            施設を選択してください
          </div>
        ) : isMobile ? (
          /* ── モバイル: カード表示 ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {editingId === 'new' && renderMobileEditCard('new-card')}
            {filteredFacilities.map((facility) =>
              editingId === facility.id
                ? renderMobileEditCard(`edit-${facility.id}`)
                : renderMobileDisplayCard(facility)
            )}
          </div>
        ) : (
          /* ── PC/タブレット: テーブル表示 ── */
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {/* Row 1: 旧 / 新 / 操作 */}
                  <tr>
                    <th colSpan={7} style={{ padding: isTablet ? '8px' : '10px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 700, color: '#2c3e50', background: '#e8e8e8', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>旧（現状）</th>
                    <th colSpan={7} style={{ padding: isTablet ? '8px' : '10px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 700, color: '#8e44ad', background: '#ede7f6', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>新（新居）</th>
                    <th rowSpan={3} style={{ padding: isTablet ? '10px 8px' : '12px 10px', textAlign: 'center', fontSize: isTablet ? '12px' : '13px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', verticalAlign: 'middle', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>操作</th>
                  </tr>
                  {/* Row 2: 個別 / SHIP */}
                  <tr>
                    <th colSpan={4} style={{ padding: isTablet ? '6px' : '8px', textAlign: 'center', fontSize: isTablet ? '11px' : '12px', fontWeight: 600, color: '#546e7a', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>個別</th>
                    <th colSpan={3} style={{ padding: isTablet ? '6px' : '8px', textAlign: 'center', fontSize: isTablet ? '11px' : '12px', fontWeight: 600, color: '#546e7a', background: '#f0f0f0', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>SHIP</th>
                    <th colSpan={4} style={{ padding: isTablet ? '6px' : '8px', textAlign: 'center', fontSize: isTablet ? '11px' : '12px', fontWeight: 600, color: '#7b1fa2', background: '#f3e5f5', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}>個別</th>
                    <th colSpan={3} style={{ padding: isTablet ? '6px' : '8px', textAlign: 'center', fontSize: isTablet ? '11px' : '12px', fontWeight: 600, color: '#7b1fa2', background: '#e8def8', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>SHIP</th>
                  </tr>
                  {/* Row 3: カラム名 */}
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    {/* 旧 個別 4列 */}
                    <th style={thStyleOld(isTablet)}>フロア</th>
                    <th style={thStyleOld(isTablet)}>部門</th>
                    <th style={thStyleOld(isTablet)}>部署</th>
                    <th style={{ ...thStyleOld(isTablet), borderRight: '1px solid #dee2e6' }}>室名称</th>
                    {/* 旧 SHIP 3列 */}
                    <th style={thStyleOld(isTablet)}>部門</th>
                    <th style={thStyleOld(isTablet)}>部署</th>
                    <th style={{ ...thStyleOld(isTablet), borderRight: '2px solid #dee2e6' }}>諸室区分</th>
                    {/* 新 個別 4列 */}
                    <th style={thStyleNew(isTablet)}>フロア</th>
                    <th style={thStyleNew(isTablet)}>部門</th>
                    <th style={thStyleNew(isTablet)}>部署</th>
                    <th style={{ ...thStyleNew(isTablet), borderRight: '1px solid #dee2e6' }}>室名称</th>
                    {/* 新 SHIP 3列 */}
                    <th style={thStyleNew(isTablet)}>部門</th>
                    <th style={thStyleNew(isTablet)}>部署</th>
                    <th style={{ ...thStyleNew(isTablet), borderRight: '2px solid #dee2e6' }}>諸室区分</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 新規行（テーブル先頭） */}
                  {editingId === 'new' && renderEditRow('new-row')}
                  {/* データ行 */}
                  {filteredFacilities.map((facility, index) =>
                    editingId === facility.id
                      ? renderEditRow(`edit-${facility.id}`)
                      : renderDisplayRow(facility, index)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedFacilityName && filteredFacilities.length === 0 && editingId !== 'new' && (
          <div style={{ background: 'white', borderRadius: '8px', padding: isMobile ? '40px 20px' : '60px 40px', textAlign: 'center', color: '#7f8c8d', fontSize: isMobile ? '14px' : '16px' }}>
            検索条件に一致する施設マスタがありません
          </div>
        )}
      </main>

      {/* インポートプレビューモーダル */}
      <ExcelImportPreviewModal
        isOpen={showImportModal && !!importPreview}
        importableCount={importPreview?.facilities.length ?? 0}
        errors={importPreview?.errors ?? []}
        onCancel={handleImportCancel}
        onAdd={handleImportAdd}
        onReplace={handleImportReplace}
        onDownloadTemplate={downloadFacilityTemplate}
      />
    </div>
  );
}

export default function HospitalFacilityMasterPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>}>
      <HospitalFacilityMasterContent />
    </Suspense>
  );
}
