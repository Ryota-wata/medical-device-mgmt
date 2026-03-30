'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useHospitalFacilityStore } from '@/lib/stores/hospitalFacilityStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ExcelImportPreviewModal } from '@/components/ui/ExcelImportPreviewModal';
import { exportFacilitiesToExcel, parseFacilitiesFromExcel, assignFacilityIds, downloadFacilityTemplate } from '@/lib/utils/excel-hospital-facility';

/** インライン編集用のフォームデータ型 */
interface InlineFormData {
  oldShipDivision: string;
  oldShipDepartment: string;
  oldShipRoomCategory: string;
  shipRoomCategory2: string;
  divisionId: string;
  departmentId: string;
  roomId: string;
  oldBuilding: string;
  oldFloor: string;
  oldDepartment: string;
  oldSection: string;
  oldRoomName: string;
  newShipDivision: string;
  newShipDepartment: string;
  newShipRoomCategory: string;
  newBuilding: string;
  newFloor: string;
  newDepartment: string;
  newSection: string;
  newRoomName: string;
  newRoomCount: string;
}

const emptyForm: InlineFormData = {
  oldShipDivision: '', oldShipDepartment: '', oldShipRoomCategory: '',
  shipRoomCategory2: '', divisionId: '', departmentId: '', roomId: '',
  oldBuilding: '', oldFloor: '', oldDepartment: '', oldSection: '', oldRoomName: '',
  newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '',
  newBuilding: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', newRoomCount: '',
};

function HospitalFacilityMasterContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { facilities: masterFacilities, departments, roomCategories } = useMasterStore();
  const {
    facilities,
    setFacilities,
    addFacility,
    updateFacility,
    deleteFacility,
    generateFacilityId,
  } = useHospitalFacilityStore();

  // authStoreから選択中施設を取得
  const selectedFacilityFromAuth = useAuthStore().selectedFacility;
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>('');

  // persist hydration対応: auth storeの値が遅延ロードされるため監視
  useEffect(() => {
    if (selectedFacilityFromAuth) {
      setSelectedFacilityName(selectedFacilityFromAuth);
    }
  }, [selectedFacilityFromAuth]);

  // 施設マスタから施設名オプションを生成
  const facilityOptions = masterFacilities.map(f => f.facilityName);

  // フィルター状態（共通マスタの部門名／部署名）
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // インライン編集状態: null=表示モード, 'new'=新規行, それ以外=編集中のfacility.id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InlineFormData>(emptyForm);

  // Excel インポート/エクスポート
  const [importPreview, setImportPreview] = useState<{ facilities: HospitalFacilityMaster[]; errors: string[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // 選択施設の個別施設一覧を取得
  const hospitalFacilities = selectedFacilityName
    ? facilities.filter((f) => f.hospitalName === selectedFacilityName)
    : [];

  // フィルタリング処理（共通マスタの部門名／部署名で絞り込み）
  const filteredFacilities = hospitalFacilities.filter((facility) => {
    const matchDivision = !filterDivision || facility.oldShipDivision.toLowerCase().includes(filterDivision.toLowerCase());
    const matchDepartment = !filterDepartment || facility.oldShipDepartment.toLowerCase().includes(filterDepartment.toLowerCase());
    return matchDivision && matchDepartment;
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

  // 旧 SHIP諸室区分①（roomCategoriesから全候補を取得）
  const oldRoomCatOptions = useMemo(() => {
    return Array.from(new Set(roomCategories.map(r => r.roomCategory1))).filter(Boolean);
  }, [roomCategories]);

  // 諸室区分②（諸室区分①でフィルタ）
  const roomCat2Options = useMemo(() => {
    if (!editForm.oldShipRoomCategory) return [];
    return Array.from(new Set(
      roomCategories.filter(r => r.roomCategory1 === editForm.oldShipRoomCategory).map(r => r.roomCategory2)
    )).filter(Boolean);
  }, [roomCategories, editForm.oldShipRoomCategory]);

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
      shipRoomCategory2: facility.shipRoomCategory2,
      divisionId: facility.divisionId,
      departmentId: facility.departmentId,
      roomId: facility.roomId,
      oldBuilding: facility.oldBuilding,
      oldFloor: facility.oldFloor,
      oldDepartment: facility.oldDepartment,
      oldSection: facility.oldSection,
      oldRoomName: facility.oldRoomName,
      newShipDivision: facility.newShipDivision,
      newShipDepartment: facility.newShipDepartment,
      newShipRoomCategory: facility.newShipRoomCategory,
      newBuilding: facility.newBuilding,
      newFloor: facility.newFloor,
      newDepartment: facility.newDepartment,
      newSection: facility.newSection,
      newRoomName: facility.newRoomName,
      newRoomCount: facility.newRoomCount,
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
      // 旧 部門→部署クリア
      if (key === 'oldShipDivision') { next.oldShipDepartment = ''; }
      // 諸室区分①変更→諸室区分②クリア
      if (key === 'oldShipRoomCategory') { next.shipRoomCategory2 = ''; }
      return next;
    });
  };

  // ── スタイル定数 ──
  const thStyleOld = (isTab: boolean) => ({
    padding: isTab ? '10px 8px' : '12px 10px',
    textAlign: 'left' as const,
    fontSize: isTab ? '12px' : '13px',
    fontWeight: 600,
    color: '#1f2937',
    whiteSpace: 'nowrap' as const,
    background: '#f9fafb',
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

  const thStyleHosp = (isTab: boolean) => ({
    padding: isTab ? '10px 8px' : '12px 10px',
    textAlign: 'left' as const,
    fontSize: isTab ? '12px' : '13px',
    fontWeight: 600,
    color: '#2e7d32',
    whiteSpace: 'nowrap' as const,
    background: '#e8f5e9',
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
    border: '1px solid #d1d5db',
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
          background: editingId !== null ? '#9ca3af' : '#374151',
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
          background: editingId !== null ? '#9ca3af' : '#e74c3c',
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

  // ── 編集行レンダー（テーブル: 15列 + 操作） ──
  const renderEditRow = (key: string) => {
    const editBg = '#fffde7';
    return (
      <tr key={key} style={{ background: editBg, borderBottom: '2px solid #f9a825' }}>
        {/* 共通マスタ (4列) */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('oldShipDivision', divisionOptions, '部門')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('oldShipDepartment', oldDeptOptions, '部署', !editForm.oldShipDivision)}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderShipSelect('oldShipRoomCategory', oldRoomCatOptions, '諸室①')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '2px solid #e0e0e0' }}>
          <SearchableSelect
            value={editForm.shipRoomCategory2}
            onChange={(v) => updateField('shipRoomCategory2', v)}
            options={['', ...roomCat2Options]}
            placeholder={editForm.oldShipRoomCategory ? '諸室②' : '-'}
            isMobile={isMobile}
            disabled={!editForm.oldShipRoomCategory}
            dropdownMinWidth="160px"
          />
        </td>
        {/* 旧（現状） (7列) */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('divisionId', 'ID')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('departmentId', 'ID')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('roomId', 'ID')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldBuilding', '棟')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldDepartment', '部門')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('oldSection', '部署')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '2px solid #e0e0e0' }}>{renderTextInput('oldRoomName', '室名')}</td>
        {/* 新（リモデルのみ） (4列) */}
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newBuilding', '棟', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newDepartment', '部門', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg }}>{renderTextInput('newSection', '部署', '#d7bde2')}</td>
        <td style={{ ...tdBase(isTablet), background: editBg, borderRight: '2px solid #e0e0e0' }}>{renderTextInput('newRoomName', '室名', '#d7bde2')}</td>
        {/* 操作 */}
        <td style={{ ...tdBase(isTablet), background: editBg, textAlign: 'center' }}>{renderSaveCancelButtons(isTablet)}</td>
      </tr>
    );
  };

  // ── 表示行レンダー（テーブル: 15列 + 操作） ──
  const renderDisplayRow = (facility: HospitalFacilityMaster, index: number) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven ? 'white' : '#f9fafb';
    const newBg = isEven ? '#faf8fc' : '#f5f0ff';
    const hospBg = isEven ? '#f1f8e9' : '#e8f5e9';
    return (
      <tr key={facility.id} style={{ borderBottom: '1px solid #e5e7eb', background: rowBg }}>
        {/* 共通マスタ (4列) */}
        <td style={tdBase(isTablet)}>{facility.oldShipDivision}</td>
        <td style={tdBase(isTablet)}>{facility.oldShipDepartment}</td>
        <td style={tdBase(isTablet)}>{facility.oldShipRoomCategory}</td>
        <td style={{ ...tdBase(isTablet), borderRight: '2px solid #e0e0e0' }}>{facility.shipRoomCategory2}</td>
        {/* 旧（現状） (7列) */}
        <td style={{ ...tdBase(isTablet), color: '#2e7d32', background: hospBg }}>{facility.divisionId}</td>
        <td style={{ ...tdBase(isTablet), color: '#2e7d32', background: hospBg }}>{facility.departmentId}</td>
        <td style={{ ...tdBase(isTablet), color: '#2e7d32', background: hospBg }}>{facility.roomId}</td>
        <td style={{ ...tdBase(isTablet), background: hospBg }}>{facility.oldBuilding}</td>
        <td style={{ ...tdBase(isTablet), background: hospBg }}>{facility.oldDepartment}</td>
        <td style={{ ...tdBase(isTablet), background: hospBg }}>{facility.oldSection}</td>
        <td style={{ ...tdBase(isTablet), background: hospBg, borderRight: '2px solid #e0e0e0' }}>{facility.oldRoomName}</td>
        {/* 新（リモデルのみ） (4列) */}
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newBuilding || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newDepartment || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg }}>{facility.newSection || '-'}</td>
        <td style={{ ...tdBase(isTablet), color: '#8e44ad', background: newBg, borderRight: '2px solid #e0e0e0' }}>{facility.newRoomName || '-'}</td>
        {/* 操作 */}
        <td style={{ ...tdBase(isTablet), textAlign: 'center' }}>{renderActionButtons(facility, isTablet)}</td>
      </tr>
    );
  };

  // ── モバイル: 編集カード ──
  const renderMobileEditCard = (key: string) => {
    const selectLabelStyle = { fontSize: '12px', color: '#6b7280', marginBottom: '4px' };
    const inputLabelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#1f2937', marginBottom: '4px' };
    const purpleLabelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#8e44ad', marginBottom: '4px' };
    const greenLabelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#2e7d32', marginBottom: '4px' };
    return (
      <div key={key} style={{ background: '#fffde7', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '2px solid #f9a825' }}>
        {/* 共通マスタ */}
        <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #e0e0e0', fontSize: '14px' }}>共通マスタ</div>
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部門</div>
          <SearchableSelect value={editForm.oldShipDivision} onChange={(v) => updateField('oldShipDivision', v)} options={['', ...divisionOptions]} placeholder="選択" isMobile />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>SHIP部署</div>
          <SearchableSelect value={editForm.oldShipDepartment} onChange={(v) => updateField('oldShipDepartment', v)} options={['', ...oldDeptOptions]} placeholder={editForm.oldShipDivision ? '選択' : '-'} isMobile disabled={!editForm.oldShipDivision} />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={selectLabelStyle}>諸室区分①</div>
          <SearchableSelect value={editForm.oldShipRoomCategory} onChange={(v) => updateField('oldShipRoomCategory', v)} options={['', ...oldRoomCatOptions]} placeholder="選択" isMobile />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={selectLabelStyle}>諸室区分②</div>
          <SearchableSelect value={editForm.shipRoomCategory2} onChange={(v) => updateField('shipRoomCategory2', v)} options={['', ...roomCat2Options]} placeholder={editForm.oldShipRoomCategory ? '選択' : '-'} isMobile disabled={!editForm.oldShipRoomCategory} />
        </div>

        {/* 旧（現状） */}
        <div style={{ fontWeight: 600, color: '#2e7d32', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #c8e6c9', fontSize: '14px' }}>旧（現状）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div><div style={greenLabelStyle}>部門ID</div><input type="text" value={editForm.divisionId} onChange={(e) => updateField('divisionId', e.target.value)} placeholder="ID" style={cellInputStyle} /></div>
          <div><div style={greenLabelStyle}>部署ID</div><input type="text" value={editForm.departmentId} onChange={(e) => updateField('departmentId', e.target.value)} placeholder="ID" style={cellInputStyle} /></div>
          <div><div style={greenLabelStyle}>諸室ID</div><input type="text" value={editForm.roomId} onChange={(e) => updateField('roomId', e.target.value)} placeholder="ID" style={cellInputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div><div style={inputLabelStyle}>棟</div><input type="text" value={editForm.oldBuilding} onChange={(e) => updateField('oldBuilding', e.target.value)} placeholder="棟" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>部門</div><input type="text" value={editForm.oldDepartment} onChange={(e) => updateField('oldDepartment', e.target.value)} placeholder="部門" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>部署</div><input type="text" value={editForm.oldSection} onChange={(e) => updateField('oldSection', e.target.value)} placeholder="部署" style={cellInputStyle} /></div>
          <div><div style={inputLabelStyle}>諸室</div><input type="text" value={editForm.oldRoomName} onChange={(e) => updateField('oldRoomName', e.target.value)} placeholder="室名" style={cellInputStyle} /></div>
        </div>

        {/* 新（リモデルのみ） */}
        <div style={{ fontWeight: 600, color: '#8e44ad', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #e8daef', fontSize: '14px' }}>新（リモデルのみ）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div><div style={purpleLabelStyle}>棟</div><input type="text" value={editForm.newBuilding} onChange={(e) => updateField('newBuilding', e.target.value)} placeholder="棟" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>部門</div><input type="text" value={editForm.newDepartment} onChange={(e) => updateField('newDepartment', e.target.value)} placeholder="部門" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>部署</div><input type="text" value={editForm.newSection} onChange={(e) => updateField('newSection', e.target.value)} placeholder="部署" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
          <div><div style={purpleLabelStyle}>諸室</div><input type="text" value={editForm.newRoomName} onChange={(e) => updateField('newRoomName', e.target.value)} placeholder="室名" style={{ ...cellInputStyle, borderColor: '#d7bde2' }} /></div>
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
        {/* 共通マスタ */}
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>共通マスタ</div>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#95a5a6', fontSize: '12px' }}>部門/部署: </span>{facility.oldShipDivision} / {facility.oldShipDepartment}</div>
          <div><span style={{ color: '#95a5a6', fontSize: '12px' }}>諸室区分: </span>{facility.oldShipRoomCategory} / {facility.shipRoomCategory2}</div>
        </div>
        {/* 旧（現状） */}
        <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, color: '#2e7d32', marginBottom: '6px' }}>旧（現状）</div>
          {(facility.divisionId || facility.departmentId || facility.roomId) && (
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#66bb6a', fontSize: '12px' }}>ID: </span>{facility.divisionId} / {facility.departmentId} / {facility.roomId}</div>
          )}
          <div><span style={{ color: '#66bb6a', fontSize: '12px' }}>場所: </span>{facility.oldBuilding && `${facility.oldBuilding} / `}{facility.oldDepartment} / {facility.oldSection} / {facility.oldRoomName}</div>
        </div>
        {/* 新（リモデルのみ） */}
        <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, color: '#8e44ad', marginBottom: '6px' }}>新（リモデルのみ）</div>
          <div><span style={{ color: '#b39ddb', fontSize: '12px' }}>場所: </span>{facility.newBuilding || '-'} / {facility.newDepartment || '-'} / {facility.newSection || '-'} / {facility.newRoomName || '-'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={() => handleStartEdit(facility)} disabled={editingId !== null} style={{ flex: 1, padding: '8px', background: editingId !== null ? '#9ca3af' : '#374151', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: editingId !== null ? 'not-allowed' : 'pointer' }}>編集</button>
        <button onClick={() => handleDelete(facility.id)} disabled={editingId !== null} style={{ flex: 1, padding: '8px', background: editingId !== null ? '#9ca3af' : '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: editingId !== null ? 'not-allowed' : 'pointer' }}>削除</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f9fafb' }}>
      {/* Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? '12px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 700, color: '#1f2937', margin: 0 }}>個別部署マスタ</h1>
          {selectedFacilityName && (
            <div style={{ background: '#f3f4f6', color: '#6b7280', padding: isMobile ? '4px 12px' : '6px 16px', borderRadius: '20px', fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }}>
              {selectedFacilityName} - {filteredFacilities.length}件
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {selectedFacilityName && (
            <>
              <button
                onClick={handleExport}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  background: '#374151',
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
                  background: '#374151',
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
                  background: editingId !== null ? '#9ca3af' : '#27ae60',
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
          <button onClick={handleBack} style={{ padding: isMobile ? '8px 16px' : '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', fontSize: isMobile ? '13px' : '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            メイン画面に戻る
          </button>
        </div>
      </header>

      {/* Facility Selection */}
      {!selectedFacilityFromAuth && (
        <div style={{ background: 'white', padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
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
        <div style={{ background: 'white', padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '16px' }}>
          <div><label style={filterLabelStyle('#6b7280')}>共通マスタ - 部門</label><input type="text" value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} placeholder="診療部門" style={filterInputStyle('#d1d5db')} /></div>
          <div><label style={filterLabelStyle('#6b7280')}>共通マスタ - 部署</label><input type="text" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} placeholder="外科" style={filterInputStyle('#d1d5db')} /></div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {!selectedFacilityName ? (
          <div style={{ background: 'white', borderRadius: '8px', padding: isMobile ? '40px 20px' : '60px 40px', textAlign: 'center', color: '#6b7280', fontSize: isMobile ? '14px' : '16px' }}>
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
                  {/* Row 1: グループヘッダー */}
                  <tr>
                    <th colSpan={4} style={{ padding: isTablet ? '8px' : '10px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>
                      共通マスタ
                    </th>
                    <th colSpan={7} style={{ padding: isTablet ? '8px' : '10px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 700, color: '#2e7d32', background: '#e8f5e9', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>
                      旧（現状）
                    </th>
                    <th colSpan={4} style={{ padding: isTablet ? '8px' : '10px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 700, color: '#8e44ad', background: '#ede7f6', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #dee2e6' }}>
                      新（リモデルのみ）
                    </th>
                    <th rowSpan={2} style={{ padding: isTablet ? '10px 8px' : '12px 10px', textAlign: 'center', fontSize: isTablet ? '12px' : '13px', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', verticalAlign: 'middle', background: '#f9fafb', borderBottom: '2px solid #dee2e6' }}>操作</th>
                  </tr>
                  {/* Row 2: カラム名 */}
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    {/* 共通マスタ 4列 */}
                    <th style={thStyleOld(isTablet)}>部門</th>
                    <th style={thStyleOld(isTablet)}>部署</th>
                    <th style={thStyleOld(isTablet)}>諸室区分①</th>
                    <th style={{ ...thStyleOld(isTablet), borderRight: '2px solid #dee2e6' }}>諸室区分②</th>
                    {/* 旧（現状） 7列 */}
                    <th style={thStyleHosp(isTablet)}>部門ID</th>
                    <th style={thStyleHosp(isTablet)}>部署ID</th>
                    <th style={thStyleHosp(isTablet)}>諸室ID</th>
                    <th style={thStyleHosp(isTablet)}>棟</th>
                    <th style={thStyleHosp(isTablet)}>部門</th>
                    <th style={thStyleHosp(isTablet)}>部署</th>
                    <th style={{ ...thStyleHosp(isTablet), borderRight: '2px solid #dee2e6' }}>諸室</th>
                    {/* 新（リモデルのみ） 4列 */}
                    <th style={thStyleNew(isTablet)}>棟</th>
                    <th style={thStyleNew(isTablet)}>部門</th>
                    <th style={thStyleNew(isTablet)}>部署</th>
                    <th style={{ ...thStyleNew(isTablet), borderRight: '2px solid #dee2e6' }}>諸室</th>
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
          <div style={{ background: 'white', borderRadius: '8px', padding: isMobile ? '40px 20px' : '60px 40px', textAlign: 'center', color: '#6b7280', fontSize: isMobile ? '14px' : '16px' }}>
            検索条件に一致する施設マスタがありません
          </div>
        )}
      </main>

      <footer style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>

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
  return <HospitalFacilityMasterContent />;
}
