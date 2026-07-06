'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit2, Trash2, Plus, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useUserStore } from '@/lib/stores/userStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { useFacilityFeatureStore } from '@/lib/stores/facilityFeatureStore';
import { useUserFeatureStore } from '@/lib/stores/userFeatureStore';
import { PERMISSION_UNITS, PERMISSION_CATEGORY_ORDER, PermissionUnit } from '@/lib/data/permission-units';
import { User } from '@/lib/types/user';
import { SAMPLE_USERS } from '@/lib/data/sample-users';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { EmptyState } from '@/components/ui/EmptyState';

// SHIPユーザー管理 (コンサルユーザー管理)
// - 対象: SHIPユーザー (= hospital 未設定) のみ
// - 担当施設 (accessibleFacilities) を施設マスタから明示選択で割り当て、そのうち1つを既定施設 (defaultFacility) に指定
//   （API/DB 整合: 通常アカウントに「全施設」概念はなし。全施設利用は SYSTEM_ADMIN 領分）
// - 担当施設ごとに機能 (PU) 単位の権限を ON/OFF (ユーザー管理画面踏襲)
//   1段目 (施設×PU) で許可された機能のみ 2段目 (ユーザー×施設×PU) で ON/OFF 可能
// - role は型互換のため "system_admin" 固定 (UI では参照しない)
const LEGACY_ROLE_FOR_NEW_USER = 'system_admin' as const;

type ShipUserForm = {
  username: string;
  email: string;
  department: string; // 所属部門
  section: string; // 所属部署
  position: string;
  phone: string;
  isActive: boolean; // アカウント有効フラグ
  assignedFacilities: string[]; // 担当施設（明示列挙）
  defaultFacility: string; // 既定施設（assignedFacilities のうち1つ）
};

const EMPTY_FORM: ShipUserForm = {
  username: '',
  email: '',
  department: '',
  section: '',
  position: '',
  phone: '',
  isActive: true,
  assignedFacilities: [],
  defaultFacility: '',
};

export default function ShipUserManagementPage() {
  const { isMobile, isTablet } = useResponsive();
  const { users, setUsers, addUser, updateUser, deleteUser } = useUserStore();
  const { facilities } = useMasterStore();
  // 2段階権限モデル: 1段目 (施設×PU) で許可された機能のみ 2段目 (ユーザー×施設×PU) で ON/OFF
  const { getSetting: getFacilityFeature } = useFacilityFeatureStore();
  const { setSetting: setUserFeature, getSetting: getUserFeature } = useUserFeatureStore();

  const [filterUsername, setFilterUsername] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFacility, setFilterFacility] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<ShipUserForm>(EMPTY_FORM);
  // モーダル内の権限保留変更: facility -> { puId: enabled }
  const [permPending, setPermPending] = useState<Record<string, Record<string, boolean>>>({});
  const [permSearch, setPermSearch] = useState('');

  // 施設マスタから施設名リスト
  const facilityOptions = useMemo(() => facilities.map((f) => f.facilityName), [facilities]);

  // SHIPユーザー (= 所属病院なし) のみを対象
  const shipUsers = useMemo(() => users.filter((u) => !u.hospital), [users]);

  // 部署の選択肢 (SHIPユーザーの所属部署ユニーク値。一覧APIの検索対象 sectionName に対応)
  const sectionOptions = useMemo(
    () => Array.from(new Set(shipUsers.map((u) => u.section).filter(Boolean))) as string[],
    [shipUsers]
  );

  // サンプルデータ初期化 (直接遷移時の空表示を防ぐ。user-management と共通の初期データ)
  useEffect(() => {
    if (users.length === 0) {
      setUsers(SAMPLE_USERS);
    }
  }, [users.length, setUsers]);

  // 担当施設 表示テキスト（既定施設を先頭に「（既定）」付きで表示）
  const getAssignedFacilitiesText = (user: User): string => {
    const acc = user.accessibleFacilities ?? [];
    if (acc.length === 0) return '未割当';
    const def = user.defaultFacility;
    const ordered = def && acc.includes(def) ? [def, ...acc.filter((f) => f !== def)] : acc;
    return ordered.map((f) => (f === def ? `${f}（既定）` : f)).join(', ');
  };

  // フィルタリング
  const filteredUsers = useMemo(() => {
    return shipUsers.filter((user) => {
      const acc = user.accessibleFacilities ?? [];
      const matchUsername =
        !filterUsername || user.username.toLowerCase().includes(filterUsername.toLowerCase());
      // 部署フィルター: 所属部署 (section) を対象（一覧APIの sectionName 検索に対応）
      const matchSection = !filterDepartment || (user.section?.includes(filterDepartment) ?? false);
      // 担当施設フィルター: 担当施設（明示列挙）に含まれるか
      const matchFacility = !filterFacility || acc.includes(filterFacility);
      return matchUsername && matchSection && matchFacility;
    });
  }, [shipUsers, filterUsername, filterDepartment, filterFacility]);

  const handleOpenNewModal = () => {
    setFormData(EMPTY_FORM);
    setShowNewModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    const acc = user.accessibleFacilities ?? [];
    setFormData({
      username: user.username,
      email: user.email,
      department: user.department || '',
      section: user.section || '',
      position: user.position || '',
      phone: user.phone || '',
      isActive: user.isActive ?? true,
      assignedFacilities: acc,
      defaultFacility: user.defaultFacility && acc.includes(user.defaultFacility) ? user.defaultFacility : acc[0] ?? '',
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`SHIPユーザー「${user.username}」を削除してもよろしいですか?`)) {
      deleteUser(user.id);
    }
  };

  // 初回設定案内送信（未利用ユーザーのみ。利用開始済みは再設定=パスワード再設定へ誘導）
  const handleSendInvitation = (user: User) => {
    if (user.lastLoginAt) {
      alert('このユーザーは利用開始済みです。パスワードの再設定はパスワード再設定機能から行ってください。');
      return;
    }
    if (confirm(`SHIPユーザー「${user.username}」へ初回設定案内メールを送信しますか?`)) {
      alert(`${user.email} へ初回設定案内を送信しました。`);
    }
  };

  const closeModals = () => {
    setShowNewModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData(EMPTY_FORM);
    setPermPending({});
    setPermSearch('');
  };

  /** 入力検証 (共通) */
  const validateForm = (): boolean => {
    if (!formData.username || !formData.email) {
      alert('ユーザー名とメールアドレスは必須です');
      return false;
    }
    if (formData.assignedFacilities.length === 0) {
      alert('担当施設を1つ以上選択してください');
      return false;
    }
    if (!formData.defaultFacility || !formData.assignedFacilities.includes(formData.defaultFacility)) {
      alert('既定施設を担当施設の中から1つ選択してください');
      return false;
    }
    return true;
  };

  const handleNewSubmit = () => {
    if (!validateForm()) return;
    const newUser: User = {
      id: `U${String(users.length + 1).padStart(3, '0')}`,
      username: formData.username,
      email: formData.email,
      hospital: undefined, // SHIPユーザー (コンサル) は所属病院なし
      department: formData.department, // 所属部門
      section: formData.section, // 所属部署
      position: formData.position,
      phone: formData.phone,
      isActive: formData.isActive,
      role: LEGACY_ROLE_FOR_NEW_USER, // 後方互換のためダミー値 (UI 不参照)
      accessibleFacilities: formData.assignedFacilities, // 担当施設（明示列挙）
      defaultFacility: formData.defaultFacility, // 既定施設
      lastLoginAt: undefined, // 新規は未利用
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addUser(newUser);
    flushPermPending(newUser.id); // 担当施設ごとの機能権限 (2段目) を保存
    closeModals();
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    if (!validateForm()) return;
    updateUser(selectedUser.id, {
      username: formData.username,
      email: formData.email,
      hospital: undefined, // SHIPユーザーのまま維持
      department: formData.department, // 所属部門
      section: formData.section, // 所属部署
      position: formData.position,
      phone: formData.phone,
      isActive: formData.isActive,
      accessibleFacilities: formData.assignedFacilities, // 担当施設（明示列挙）
      defaultFacility: formData.defaultFacility, // 既定施設
      updatedAt: new Date().toISOString(),
    });
    flushPermPending(selectedUser.id); // 担当施設ごとの機能権限 (2段目) を保存
    closeModals();
  };

  /** 担当施設チェックボックスのトグル（既定施設も連動して整合） */
  const toggleAssignedFacility = (facilityName: string) => {
    setFormData((prev) => {
      const has = prev.assignedFacilities.includes(facilityName);
      const nextAssigned = has
        ? prev.assignedFacilities.filter((f) => f !== facilityName)
        : [...prev.assignedFacilities, facilityName];
      // 既定施設の整合: 未設定なら先頭を既定に、既定を外したら残りの先頭へ、空なら空に
      let nextDefault = prev.defaultFacility;
      if (!has && !nextDefault) {
        nextDefault = facilityName; // 初めての選択を既定に
      } else if (has && facilityName === prev.defaultFacility) {
        nextDefault = nextAssigned[0] ?? '';
      }
      return { ...prev, assignedFacilities: nextAssigned, defaultFacility: nextDefault };
    });
  };

  /** 既定施設の指定（担当施設の中から1つ） */
  const setDefaultFacility = (facilityName: string) => {
    setFormData((prev) => ({ ...prev, defaultFacility: facilityName }));
  };

  /** 担当施設セクション（明示選択＋既定施設ラジオ） */
  const renderAssignedFacilitiesSection = () => (
    <div data-element-id="suser-assigned-section" style={{ padding: '16px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', margin: 0, marginBottom: '4px' }}>
        担当施設 <span style={{ color: '#DA0000' }}>*</span>
      </h3>
      <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0, marginBottom: '10px' }}>
        コンサルユーザーが担当する施設を選択します。選択した<strong>担当施設ごと</strong>に、下の「機能権限設定」で機能の ON/OFF を設定します。担当施設のうち<strong>1つを既定施設</strong>に指定してください。
      </p>

      {/* 個別施設リスト（チェック＝担当 / ラジオ＝既定） */}
      <div
        data-element-id="suser-facility-list"
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          background: 'white',
        }}
      >
        {facilityOptions.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '12px', color: '#8A8A8A' }}>
            施設マスタに施設が登録されていません
          </div>
        ) : (
          facilityOptions.map((facilityName) => {
            const checked = formData.assignedFacilities.includes(facilityName);
            const isDefault = formData.defaultFacility === facilityName;
            return (
              <div
                key={facilityName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderTop: '1px solid #FAFAFA',
                  background: checked ? '#EBF5EE' : 'white',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAssignedFacility(facilityName)}
                  />
                  <span style={{ fontSize: '13px', color: '#4A4A4A' }}>{facilityName}</span>
                </label>
                {/* 既定施設ラジオ（担当に含まれる施設のみ選択可） */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: checked ? '#146E2E' : '#C4C4C4',
                    cursor: checked ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <input
                    type="radio"
                    name="suser-default-facility"
                    checked={isDefault}
                    disabled={!checked}
                    onChange={() => setDefaultFacility(facilityName)}
                  />
                  既定
                </label>
              </div>
            );
          })
        )}
      </div>

      {/* 選択中サマリ */}
      <div data-element-id="suser-assigned-summary" style={{ fontSize: '11px', color: '#8A8A8A', marginTop: '8px' }}>
        担当:{' '}
        <strong style={{ color: '#146E2E' }}>
          {formData.assignedFacilities.length === 0 ? '未選択' : `${formData.assignedFacilities.length} 施設`}
        </strong>
        {formData.defaultFacility && (
          <>
            {' / '}既定: <strong style={{ color: '#146E2E' }}>{formData.defaultFacility}</strong>
          </>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // 機能権限設定 (2段目: ユーザー×施設×PU の ON/OFF)
  // 対象施設 = 担当施設 (明示列挙)。担当施設ごとに 1段目許可 PU のみユーザー単位で ON/OFF。
  // 1段目 (施設×PU) で許可された PU のみ表示し、担当施設ごとにユーザー単位で ON/OFF。
  // ─────────────────────────────────────────────────────────

  /** PU の現在の有効状態を取得 (保留 > ユーザー個別 > 施設既定) */
  const getPermDisplayValue = (
    facility: string,
    unit: PermissionUnit
  ): { enabled: boolean; source: 'pending' | 'user' | 'facility-default'; facilityEnabled: boolean } => {
    const facilityEnabled = getFacilityFeature(facility, unit.id);
    const userId = showEditModal ? selectedUser?.id : undefined;
    if (permPending[facility]?.[unit.id] !== undefined) {
      return { enabled: permPending[facility][unit.id], source: 'pending', facilityEnabled };
    }
    if (userId) {
      const userVal = getUserFeature(userId, facility, unit.id);
      if (userVal !== undefined) {
        return { enabled: facilityEnabled && userVal, source: 'user', facilityEnabled };
      }
    }
    return { enabled: facilityEnabled, source: 'facility-default', facilityEnabled };
  };

  /** PU トグル */
  const handlePermToggle = (facility: string, unit: PermissionUnit) => {
    const { enabled, facilityEnabled } = getPermDisplayValue(facility, unit);
    if (!facilityEnabled) return; // 1段目 OFF はトグル不可
    const newVal = !enabled;
    setPermPending((prev) => ({
      ...prev,
      [facility]: { ...(prev[facility] || {}), [unit.id]: newVal },
    }));
  };

  /** カテゴリ一括 ON/OFF */
  const handlePermCategoryBulk = (facility: string, units: PermissionUnit[], enabled: boolean) => {
    setPermPending((prev) => {
      const next = { ...prev };
      next[facility] = { ...(next[facility] || {}) };
      for (const u of units) {
        if (getFacilityFeature(facility, u.id)) {
          next[facility][u.id] = enabled;
        }
      }
      return next;
    });
  };

  /** 保留変更を userFeatureStore に保存 (保存ボタン押下時、全担当施設分) */
  const flushPermPending = (userId: string) => {
    for (const [facility, puMap] of Object.entries(permPending)) {
      for (const [puId, enabled] of Object.entries(puMap)) {
        setUserFeature(userId, facility, puId, enabled);
      }
    }
  };

  /** PU カテゴリ別 グルーピング + 検索フィルター */
  const permGroupedUnits = useMemo((): Record<string, PermissionUnit[]> => {
    const groups: Record<string, PermissionUnit[]> = {};
    const keyword = permSearch.trim().toLowerCase();
    for (const cat of PERMISSION_CATEGORY_ORDER) {
      const units = PERMISSION_UNITS.filter((u) => u.category === cat);
      const filtered = keyword
        ? units.filter(
            (u) =>
              u.id.toLowerCase().includes(keyword) ||
              u.displayName.toLowerCase().includes(keyword) ||
              (u.switchContent || '').toLowerCase().includes(keyword)
          )
        : units;
      if (filtered.length > 0) groups[cat] = filtered;
    }
    return groups;
  }, [permSearch]);

  /** 1 施設分の権限グリッド */
  const renderPermissionGridForFacility = (facility: string, isFirst: boolean) => (
    <div
      key={facility}
      {...(isFirst ? { 'data-element-id': 'suser-perm-facility-first' } : {})}
      style={{ marginBottom: '12px', border: '1px solid #E1E1E1', borderRadius: '4px', background: 'white' }}
    >
      <div style={{ padding: '8px 12px', background: '#EBF5EE', borderBottom: '1px solid #E1E1E1', fontSize: '13px', fontWeight: 600, color: '#146E2E' }}>
        {facility}
      </div>
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {Object.entries(permGroupedUnits).map(([cat, units]) => (
          <div key={cat} style={{ borderBottom: '1px solid #E1E1E1' }}>
            <div style={{ padding: '8px 12px', background: '#F1F1F1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
              <strong style={{ fontSize: '12px', color: '#4A4A4A' }}>{cat}</strong>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handlePermCategoryBulk(facility, units, true)}
                  style={{ padding: '2px 8px', background: 'white', color: '#146E2E', border: '1px solid #146E2E', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                >全 ON</button>
                <button
                  type="button"
                  onClick={() => handlePermCategoryBulk(facility, units, false)}
                  style={{ padding: '2px 8px', background: 'white', color: '#8A8A8A', border: '1px solid #8A8A8A', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                >全 OFF</button>
              </div>
            </div>
            {units.map((unit) => {
              const { enabled, source, facilityEnabled } = getPermDisplayValue(facility, unit);
              return (
                <label
                  key={unit.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '6px 12px',
                    borderTop: '1px solid #FAFAFA',
                    cursor: facilityEnabled ? 'pointer' : 'not-allowed',
                    opacity: facilityEnabled ? 1 : 0.5,
                    background: source === 'pending' ? '#FFF8E1' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={!facilityEnabled}
                    onChange={() => handlePermToggle(facility, unit)}
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#4A4A4A' }}>
                      <strong>{unit.id}</strong> {unit.displayName}
                    </div>
                    {unit.switchContent && (
                      <div style={{ fontSize: '10px', color: '#8A8A8A' }}>{unit.switchContent}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8A8A8A', whiteSpace: 'nowrap' }}>
                    {!facilityEnabled && <span style={{ color: '#DA0000' }}>(施設で未提供)</span>}
                    {facilityEnabled && source === 'facility-default' && <span>(施設既定値)</span>}
                    {facilityEnabled && source === 'user' && <span style={{ color: '#146E2E' }}>(個別設定)</span>}
                    {source === 'pending' && <span style={{ color: '#B45309' }}>(未保存)</span>}
                  </div>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  /** 機能権限設定セクション (担当施設ごと) */
  const renderPermissionSection = () => (
    <div data-element-id="suser-perm-section" style={{ padding: '16px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', margin: 0, marginBottom: '4px' }}>
        機能権限設定 <span style={{ fontSize: '11px', color: '#8A8A8A', fontWeight: 400 }}>(担当施設ごと)</span>
      </h3>
      <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0, marginBottom: '8px' }}>
        担当施設ごとに、このユーザーが使える機能を ON/OFF します。<br />
        (施設に対する機能の許可は SHIPシステム全体管理者が「権限管理」画面で設定します。施設で未提供の機能はトグルできません)
      </p>

      {formData.assignedFacilities.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#8A8A8A', margin: 0, padding: '12px', background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px' }}>
          担当施設を選択すると、施設ごとに機能権限を設定できます。
        </p>
      ) : (
        <>
          <input
            data-element-id="suser-perm-search"
            type="text"
            placeholder="権限を検索 (PU-ID/ラベル/説明)"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', width: '100%', maxWidth: '360px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          {formData.assignedFacilities.map((facility, i) =>
            renderPermissionGridForFacility(facility, i === 0)
          )}
        </>
      )}
    </div>
  );

  const renderModal = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showNewModal;
    if (!isOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={closeModals}
      >
        <div
          data-element-id="suser-modal"
          style={{
            background: 'white',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #E1E1E1',
              background: '#FAFAFA',
              position: 'sticky',
              top: 0,
            }}
          >
            <h2 data-element-id="suser-modal-title" style={{ margin: 0, fontSize: '18px', color: '#4A4A4A' }}>
              {isEdit ? 'SHIPユーザー編集' : 'SHIPユーザー新規作成'}
            </h2>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 基本情報 グリッド */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                columnGap: '24px',
                rowGap: '16px',
              }}
            >
              {/* ユーザー名 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  ユーザー名 <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  data-element-id="suser-input-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  メールアドレス <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  data-element-id="suser-input-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 所属部門 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  所属部門
                </label>
                <input
                  data-element-id="suser-input-department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="例: コンサルティング部"
                  style={{ width: '100%', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 所属部署 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  所属部署
                </label>
                <input
                  data-element-id="suser-input-section"
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="例: 第一課"
                  style={{ width: '100%', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 役職 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  役職
                </label>
                <input
                  data-element-id="suser-input-position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="例: コンサルタント"
                  style={{ width: '100%', maxWidth: '240px', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 連絡先 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  連絡先
                </label>
                <input
                  data-element-id="suser-input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="例: 03-1234-5678"
                  style={{ width: '100%', maxWidth: '200px', padding: '10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* アカウント有効フラグ（編集時のみ。新規は常に有効で作成） */}
              {isEdit && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                    アカウント状態
                  </label>
                  <label
                    data-element-id="suser-input-active"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span style={{ fontSize: '13px', color: '#4A4A4A' }}>
                      アカウントを有効にする
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* 担当施設セクション */}
            {renderAssignedFacilitiesSection()}

            {/* 機能権限設定セクション (担当施設ごと、2段目: ユーザー×施設×PU ON/OFF) */}
            {renderPermissionSection()}
          </div>

          <div
            style={{
              padding: '15px 20px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              position: 'sticky',
              bottom: 0,
              background: 'white',
            }}
          >
            <button
              data-element-id="suser-cancel-btn"
              onClick={closeModals}
              style={{ padding: '10px 20px', background: '#8A8A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              キャンセル
            </button>
            <button
              data-element-id="suser-submit-btn"
              onClick={isEdit ? handleEditSubmit : handleNewSubmit}
              style={{ padding: '10px 20px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              {isEdit ? '更新' : '作成'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      {/* Header */}
      <Header
        title="SHIPユーザー管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
        resultCount={filteredUsers.length}
        showOriginalLabel={false}
      >
        <button
          data-element-id="suser-new-btn"
          onClick={handleOpenNewModal}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-cta-primary text-white border-0 rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors`}
        >
          <Plus size={16} aria-hidden />
          新規作成
        </button>
      </Header>

      {/* Filter Header */}
      <div
        style={{
          background: 'white',
          padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
          borderBottom: '2px solid #E1E1E1',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(160px, 1fr))',
          gap: isMobile ? '12px' : '16px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            ユーザー名
          </label>
          <input
            data-element-id="suser-filter-username"
            type="text"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="ユーザー名で検索"
            style={{ width: '100%', padding: isMobile ? '8px' : '10px', border: '1px solid #E1E1E1', borderRadius: '6px', fontSize: isMobile ? '13px' : '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div data-element-id="suser-filter-dept">
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            部署
          </label>
          <SearchableSelect
            value={filterDepartment}
            onChange={setFilterDepartment}
            options={['', ...sectionOptions]}
            placeholder="部署で検索..."
            isMobile={isMobile}
          />
        </div>
        <div data-element-id="suser-filter-facility">
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            担当施設
          </label>
          <SearchableSelect
            value={filterFacility}
            onChange={setFilterFacility}
            options={['', ...facilityOptions]}
            placeholder="担当施設で検索..."
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((user) => (
              <div key={user.id} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #FAFAFA' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#4A4A4A', marginBottom: '4px' }}>{user.username}</div>
                  <div style={{ fontSize: '13px', color: '#8A8A8A' }}>{user.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div><span style={{ color: '#8A8A8A' }}>所属部門:</span> {user.department || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>所属部署:</span> {user.section || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>役職:</span> {user.position || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>連絡先:</span> {user.phone || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>担当施設:</span> {getAssignedFacilitiesText(user)}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleEdit(user)} style={{ flex: 1, padding: '8px', background: '#4A4A4A', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>編集</button>
                  <button
                    onClick={() => handleSendInvitation(user)}
                    disabled={!!user.lastLoginAt}
                    style={{ flex: 1, padding: '8px', background: user.lastLoginAt ? '#C4C4C4' : '#1F6FBF', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: user.lastLoginAt ? 'not-allowed' : 'pointer' }}
                  >
                    初回設定案内
                  </button>
                  <button onClick={() => handleDelete(user)} style={{ flex: 1, padding: '8px', background: '#DA0000', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>削除</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table data-element-id="suser-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
                <thead>
                  <tr>
                    {(['所属部署', '役職', 'ユーザー名', '連絡先', 'メールアドレス', '担当施設'] as const).map((label) => (
                      <th key={label} style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>{label}</th>
                    ))}
                    <th style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap', width: '128px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const cellBaseStyle: React.CSSProperties = {
                      padding: isTablet ? '10px 12px' : '12px 14px',
                      fontSize: isTablet ? '13px' : '14px',
                      color: '#4A4A4A',
                      border: '1px solid #E1E1E1',
                      verticalAlign: 'middle',
                    };
                    const assignedText = getAssignedFacilitiesText(user);
                    return (
                      <tr key={user.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ ...cellBaseStyle, fontWeight: 500 }}>{user.section || '-'}</td>
                        <td style={cellBaseStyle}>{user.position || '-'}</td>
                        <td style={cellBaseStyle}>{user.username}</td>
                        <td style={{ ...cellBaseStyle, fontVariantNumeric: 'tabular-nums' }}>{user.phone || '-'}</td>
                        <td style={cellBaseStyle}>{user.email}</td>
                        <td style={{ ...cellBaseStyle, maxWidth: '220px' }} {...(index === 0 ? { 'data-element-id': 'suser-assigned-cell-first' } : {})}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={assignedText}>
                            {assignedText}
                          </div>
                        </td>
                        <td style={{ ...cellBaseStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(user)}
                              aria-label={`${user.username || 'ユーザー'} を編集`}
                              {...(index === 0 ? { 'data-element-id': 'suser-edit-btn-first' } : {})}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', color: '#146E2E', border: '1px solid #008C1D', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Edit2 size={14} aria-hidden />
                            </button>
                            <button
                              onClick={() => handleSendInvitation(user)}
                              disabled={!!user.lastLoginAt}
                              aria-label={`${user.username || 'ユーザー'} へ初回設定案内を送信`}
                              title={user.lastLoginAt ? '利用開始済み（初回設定案内は送信できません）' : '初回設定案内を送信'}
                              {...(index === 0 ? { 'data-element-id': 'suser-invite-btn-first' } : {})}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', color: user.lastLoginAt ? '#C4C4C4' : '#1F6FBF', border: `1px solid ${user.lastLoginAt ? '#E1E1E1' : '#1F6FBF'}`, borderRadius: '4px', cursor: user.lastLoginAt ? 'not-allowed' : 'pointer' }}
                            >
                              <Mail size={14} aria-hidden />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              aria-label={`${user.username || 'ユーザー'} を削除`}
                              {...(index === 0 ? { 'data-element-id': 'suser-delete-btn-first' } : {})}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', color: '#DA0000', border: '1px solid #DA0000', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="bg-surface-card rounded-lg" data-element-id="suser-empty">
            <EmptyState
              title="SHIPユーザーがいません"
              description="「新規作成」からコンサルユーザーを追加するか、検索条件を変更してください"
              actionLabel="新規作成"
              onAction={handleOpenNewModal}
            />
          </div>
        )}
      </main>

      {/* モーダル */}
      {renderModal(false)}
      {renderModal(true)}
    </div>
  );
}
