'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useUserStore } from '@/lib/stores/userStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { useFacilityFeatureStore } from '@/lib/stores/facilityFeatureStore';
import { useUserFeatureStore } from '@/lib/stores/userFeatureStore';
import { useFacilityGroupStore } from '@/lib/stores/facilityGroupStore';
import { PERMISSION_UNITS, PERMISSION_CATEGORY_ORDER, PermissionUnit } from '@/lib/data/permission-units';
import { User } from '@/lib/types/user';
import { SAMPLE_USERS } from '@/lib/data/sample-users';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { EmptyState } from '@/components/ui/EmptyState';

// ロール概念は撤廃 (2026-06-03)
// 仕様:
//   1段目 = SHIPシステム全体管理者 が 病院(施設) に対し使える機能を設定 (facilityFeatureStore)
//   2段目 = 病院内システム管理者 が 院内ユーザー に対し使える機能を設定 (userFeatureStore)
//   他施設の閲覧 = /facility-group-management で作成した施設グループに連動 (facilityGroupStore)
// User.role は型互換のため "system_admin" 固定で発行 (UI では参照しない)
const LEGACY_ROLE_FOR_NEW_USER = 'system_admin' as const;

export default function UserManagementPage() {
  const { isMobile, isTablet } = useResponsive();
  const { users, setUsers, addUser, updateUser, deleteUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const { facilities } = useMasterStore();
  const { getGroupsForFacility } = useFacilityGroupStore();

  const [filterUsername, setFilterUsername] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFacility, setFilterFacility] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 2段階権限モデル: 2段目 (ユーザー×施設×PU の ON/OFF) — 2026-06-03 追加
  const { getSetting: getFacilityFeature } = useFacilityFeatureStore();
  const { setSetting: setUserFeature, getSetting: getUserFeature } = useUserFeatureStore();
  // モーダル内の保留変更: facility -> { puId: enabled }
  const [permPending, setPermPending] = useState<Record<string, Record<string, boolean>>>({});
  const [permSearch, setPermSearch] = useState('');

  // フォーム状態 (role/accessibleFacilities/contactPerson は撤廃、所属病院 hospital を主軸)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    hospital: '',
    department: '',
    position: '',
    phone: '',
  });

  // 現ログインユーザー が SHIP 全体管理者か (= 所属病院なし)
  const isShipUser = !currentUser?.hospital;
  const currentUserHospital = currentUser?.hospital;

  // 施設マスタから施設名リスト
  const facilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // 部署の選択肢（ユニーク値）
  const departmentOptions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];
  }, [users]);

  // サンプルデータを初期化 (user-management / ship-user-management 共通の初期データ)
  useEffect(() => {
    if (users.length === 0) {
      setUsers(SAMPLE_USERS);
    }
  }, [users.length, setUsers]);

  // ユーザー一覧のフィルタリング
  const filteredUsers = useMemo(() => {
    let result = users;

    // 病院ユーザーの場合、同一施設のユーザーのみ表示
    if (!isShipUser && currentUserHospital) {
      result = result.filter(user => user.hospital === currentUserHospital);
    }

    // 検索フィルター適用
    return result.filter((user) => {
      const matchUsername = !filterUsername || user.username.toLowerCase().includes(filterUsername.toLowerCase());
      const matchDepartment = !filterDepartment || (user.department?.includes(filterDepartment) ?? false);
      const matchFacility = !filterFacility || user.hospital === filterFacility;
      return matchUsername && matchDepartment && matchFacility;
    });
  }, [users, isShipUser, currentUserHospital, filterUsername, filterDepartment, filterFacility]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      hospital: user.hospital || '',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('このユーザーを削除してもよろしいですか?')) {
      deleteUser(id);
    }
  };

  const handleOpenNewModal = () => {
    setFormData({
      username: '',
      email: '',
      hospital: isShipUser ? '' : (currentUserHospital || ''),
      department: '',
      position: '',
      phone: '',
    });
    setShowNewModal(true);
  };

  const handleNewSubmit = () => {
    if (!formData.username || !formData.email) {
      alert('ユーザー名とメールアドレスは必須です');
      return;
    }
    if (!formData.hospital) {
      alert('所属病院は必須です');
      return;
    }

    const newUser: User = {
      id: `U${String(users.length + 1).padStart(3, '0')}`,
      username: formData.username,
      email: formData.email,
      hospital: formData.hospital,
      department: formData.department,
      position: formData.position,
      phone: formData.phone,
      role: LEGACY_ROLE_FOR_NEW_USER, // 後方互換のためダミー値 (UI 不参照)
      accessibleFacilities: [], // 施設グループから派生するため空配列
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addUser(newUser);
    // 権限設定の保留変更を保存 (2段目 userFeatureStore)
    flushPermPending(newUser.id);
    setShowNewModal(false);
    clearPermState();
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    if (!formData.username || !formData.email) {
      alert('ユーザー名とメールアドレスは必須です');
      return;
    }
    if (!formData.hospital) {
      alert('所属病院は必須です');
      return;
    }

    updateUser(selectedUser.id, {
      username: formData.username,
      email: formData.email,
      hospital: formData.hospital,
      department: formData.department,
      position: formData.position,
      phone: formData.phone,
      // role / accessibleFacilities / contactPerson は既存値を保持 (UI 不参照、後方互換)
    });
    // 権限設定の保留変更を保存 (2段目 userFeatureStore)
    flushPermPending(selectedUser.id);
    setShowEditModal(false);
    setSelectedUser(null);
    clearPermState();
  };

  // 閲覧可能施設 = 所属病院 + 施設グループに含まれる他施設 (派生計算)
  const getViewableFacilitiesForUser = (user: User): { ownFacility: string | null; groupedFacilities: Array<{ facility: string; groupName: string; sharing: { asset: boolean; estimate: boolean; history: boolean } }> } => {
    if (!user.hospital) {
      // SHIP 全体管理者 (所属病院なし) は全施設アクセス
      return { ownFacility: null, groupedFacilities: [] };
    }
    const ownFacility = user.hospital;
    const groups = getGroupsForFacility(ownFacility);
    const groupedFacilities: Array<{ facility: string; groupName: string; sharing: { asset: boolean; estimate: boolean; history: boolean } }> = [];
    for (const g of groups) {
      for (const f of g.facilityIds) {
        if (f === ownFacility) continue;
        if (groupedFacilities.some((x) => x.facility === f)) continue;
        groupedFacilities.push({ facility: f, groupName: g.name, sharing: g.sharing });
      }
    }
    return { ownFacility, groupedFacilities };
  };

  // ユーザー一覧の「所属施設」表示用テキスト
  const getHospitalText = (user: User): string => {
    if (!user.hospital) return 'SHIP (全体管理)';
    return user.hospital;
  };

  // ユーザー一覧の「閲覧可能施設数」表示用テキスト (所属施設 + 共有グループ数)
  const getViewableFacilitiesCountText = (user: User): string => {
    if (!user.hospital) return '全施設';
    const { groupedFacilities } = getViewableFacilitiesForUser(user);
    if (groupedFacilities.length === 0) return '所属のみ';
    return `所属 + ${groupedFacilities.length} 施設 (グループ)`;
  };

  // ─────────────────────────────────────────────────────────
  // 権限設定セクション (2段目: ユーザー×施設×PU の ON/OFF)
  // 2026-06-03 v2: 対象は所属病院1施設に固定 (施設タブ廃止)
  // 1段目で許可された PU のみ表示し、ユーザー単位で ON/OFF
  // ─────────────────────────────────────────────────────────

  /** 対象施設 = 所属病院 (1施設のみ) */
  const permTargetFacility = formData.hospital;

  /** モーダル閉じる際の権限関連state クリア (アクション側で呼ぶ) */
  const clearPermState = () => {
    setPermPending({});
    setPermSearch('');
  };

  /** PU の現在の有効状態を取得 (保留 > ユーザー個別 > 施設既定) */
  const getPermDisplayValue = (facility: string, unit: PermissionUnit): { enabled: boolean; source: 'pending' | 'user' | 'facility-default'; facilityEnabled: boolean } => {
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

  /** 保留変更を userFeatureStore に保存 (保存ボタン押下時) */
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
        ? units.filter((u) => u.id.toLowerCase().includes(keyword) || u.displayName.toLowerCase().includes(keyword) || (u.switchContent || '').toLowerCase().includes(keyword))
        : units;
      if (filtered.length > 0) groups[cat] = filtered;
    }
    return groups;
  }, [permSearch]);

  /** 権限設定セクション レンダー */
  const renderPermissionSection = () => {
    if (!permTargetFacility) {
      return (
        <div style={{ padding: '16px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', margin: 0, marginBottom: '6px' }}>権限設定</h3>
          <p style={{ fontSize: '12px', color: '#8A8A8A', margin: 0 }}>
            所属病院が未設定のため、権限設定はできません。所属病院を選択してください。
          </p>
        </div>
      );
    }
    return (
      <div style={{ padding: '16px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', margin: 0, marginBottom: '4px' }}>
            権限設定 <span style={{ fontSize: '11px', color: '#8A8A8A', fontWeight: 400 }}>({permTargetFacility})</span>
          </h3>
          <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0, marginBottom: '8px' }}>
            病院内システム管理者が、このユーザーに対し使える機能をON/OFFします。<br />
            (病院に対する機能の許可は SHIPシステム全体管理者が「権限管理」画面で設定します)
          </p>
          <input
            type="text"
            placeholder="権限を検索 (PU-001/ラベル/説明)"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', width: '100%', maxWidth: '360px', boxSizing: 'border-box' }}
          />
        </div>

        {/* PU カテゴリ別 */}
        <div style={{ maxHeight: '560px', overflowY: 'auto', border: '1px solid #E1E1E1', borderRadius: '4px', background: 'white' }}>
          {Object.entries(permGroupedUnits).map(([cat, units]) => (
            <div key={cat} style={{ borderBottom: '1px solid #E1E1E1' }}>
              <div style={{ padding: '8px 12px', background: '#F1F1F1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                <strong style={{ fontSize: '12px', color: '#4A4A4A' }}>{cat}</strong>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handlePermCategoryBulk(permTargetFacility, units, true)}
                    style={{ padding: '2px 8px', background: 'white', color: '#146E2E', border: '1px solid #146E2E', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                  >全 ON</button>
                  <button
                    onClick={() => handlePermCategoryBulk(permTargetFacility, units, false)}
                    style={{ padding: '2px 8px', background: 'white', color: '#8A8A8A', border: '1px solid #8A8A8A', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                  >全 OFF</button>
                </div>
              </div>
              {units.map((unit) => {
                const { enabled, source, facilityEnabled } = getPermDisplayValue(permTargetFacility, unit);
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
                      onChange={() => handlePermToggle(permTargetFacility, unit)}
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
  };

  /** 閲覧可能施設 (施設グループ派生) セクション レンダー */
  const renderViewableFacilitiesSection = () => {
    if (!formData.hospital) return null;
    const groups = getGroupsForFacility(formData.hospital);
    return (
      <div style={{ padding: '16px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', margin: 0, marginBottom: '4px' }}>
          閲覧可能施設
        </h3>
        <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0, marginBottom: '10px' }}>
          施設グループに連動して自動決定されます。グループ編集は「施設グループ管理」画面で行います。
        </p>
        <div style={{ background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', padding: '10px' }}>
          <div style={{ fontSize: '12px', color: '#4A4A4A', marginBottom: '8px' }}>
            <strong>自施設:</strong> {formData.hospital}
          </div>
          {groups.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#8A8A8A' }}>
              所属する施設グループはありません (他施設の閲覧不可)
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', color: '#8A8A8A', marginBottom: '4px' }}>所属グループ:</div>
              {groups.map((g) => (
                <div key={g.id} style={{ marginBottom: '6px', paddingLeft: '8px', borderLeft: '2px solid #E1E1E1' }}>
                  <div style={{ fontSize: '12px', color: '#4A4A4A', fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: '#8A8A8A', marginTop: '2px' }}>
                    施設: {g.facilityIds.filter((f) => f !== formData.hospital).join(', ') || '(他施設なし)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A8A8A', marginTop: '2px', display: 'flex', gap: '8px' }}>
                    <span>共有: </span>
                    {g.sharing.asset && <span style={{ background: '#EBF5EE', color: '#146E2E', padding: '1px 6px', borderRadius: '8px' }}>資産</span>}
                    {g.sharing.estimate && <span style={{ background: '#FDF1E5', color: '#B45309', padding: '1px 6px', borderRadius: '8px' }}>見積</span>}
                    {g.sharing.history && <span style={{ background: '#E7F0FE', color: '#1851A6', padding: '1px 6px', borderRadius: '8px' }}>履歴</span>}
                    {!g.sharing.asset && !g.sharing.estimate && !g.sharing.history && <span style={{ color: '#8A8A8A' }}>なし</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
        onClick={() => { if (isEdit) { setShowEditModal(false); setSelectedUser(null); } else { setShowNewModal(false); } clearPermState(); }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '1100px',
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
            <h2 style={{ margin: 0, fontSize: '18px', color: '#4A4A4A' }}>
              {isEdit ? 'ユーザー編集' : 'ユーザー新規作成'}
            </h2>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 基本情報 グリッド (PC は 2 カラム、モバイルは 1 カラム) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              columnGap: '24px',
              rowGap: '16px',
            }}>
              {/* ユーザー名 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  ユーザー名 <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  メールアドレス <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 所属病院 (必須) — 2 カラム占有 */}
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  所属病院 <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <div style={{ maxWidth: '480px' }}>
                  <SearchableSelect
                    value={formData.hospital}
                    onChange={(value) => setFormData({ ...formData, hospital: value })}
                    options={facilityOptions}
                    placeholder="所属病院を検索..."
                    isMobile={isMobile}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#8A8A8A', marginTop: '4px', marginBottom: 0 }}>
                  所属病院に対する権限は SHIPシステム全体管理者が「権限管理」画面で設定します。
                </p>
              </div>

              {/* 所属部署 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  所属部署
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="例: 医事課"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 役職 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  役職
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="例: 課長"
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 連絡先 */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#4A4A4A', fontSize: '13px' }}>
                  連絡先
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="例: 03-1234-5678"
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '10px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* 閲覧可能施設 (施設グループ派生・読取専用) */}
            {renderViewableFacilitiesSection()}

            {/* 権限設定セクション (2段階権限モデル 2段目: ユーザー×PU ON/OFF) */}
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
              onClick={() => { if (isEdit) { setShowEditModal(false); setSelectedUser(null); } else { setShowNewModal(false); } clearPermState(); }}
              style={{
                padding: '10px 20px',
                background: '#8A8A8A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              キャンセル
            </button>
            <button
              onClick={isEdit ? handleEditSubmit : handleNewSubmit}
              style={{
                padding: '10px 20px',
                background: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
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
        title="ユーザー管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
        resultCount={filteredUsers.length}
        showOriginalLabel={false}
      >
        {!isShipUser && currentUserHospital && (
          <span className="bg-surface-select text-cta-primary-dark border border-cta-primary rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
            {currentUserHospital}
          </span>
        )}
        <button
          onClick={handleOpenNewModal}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-cta-primary text-white border-0 rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors`}
        >
          <Plus size={16} aria-hidden />
          新規作成
        </button>
      </Header>

      {/* Filter Header */}
      <div style={{
        background: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
        borderBottom: '2px solid #E1E1E1',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(160px, 1fr))',
        gap: isMobile ? '12px' : '16px',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            ユーザー名
          </label>
          <input
            type="text"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="ユーザー名で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            部署
          </label>
          <SearchableSelect
            value={filterDepartment}
            onChange={setFilterDepartment}
            options={['', ...departmentOptions]}
            placeholder="部署で検索..."
            isMobile={isMobile}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            所属病院
          </label>
          <SearchableSelect
            value={filterFacility}
            onChange={setFilterFacility}
            options={['', ...facilityOptions]}
            placeholder="所属病院で検索..."
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((user) => {
              return (
                <div key={user.id} style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#4A4A4A' }}>
                        {user.username}
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: user.hospital ? '#EBF5EE' : '#FDF1E5',
                        color: user.hospital ? '#146E2E' : '#B45309',
                        whiteSpace: 'nowrap',
                      }}>
                        {getHospitalText(user)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8A8A8A' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div><span style={{ color: '#8A8A8A' }}>所属部署:</span> {user.department || '-'}</div>
                    <div><span style={{ color: '#8A8A8A' }}>役職:</span> {user.position || '-'}</div>
                    <div><span style={{ color: '#8A8A8A' }}>連絡先:</span> {user.phone || '-'}</div>
                    <div><span style={{ color: '#8A8A8A' }}>閲覧可能施設:</span> {getViewableFacilitiesCountText(user)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#4A4A4A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#DA0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                <thead>
                  <tr>
                    {(['所属部署', '役職', 'ユーザー名', '連絡先', 'メールアドレス'] as const).map((label) => (
                      <th key={label} style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>{label}</th>
                    ))}
                    <th style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>所属病院</th>
                    <th style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>閲覧可能施設</th>
                    <th style={{ padding: isTablet ? '10px 12px' : '12px 14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap', width: '92px' }}>操作</th>
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
                    const viewableText = getViewableFacilitiesCountText(user);
                    return (
                      <tr key={user.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ ...cellBaseStyle, fontWeight: 500 }}>{user.department || '-'}</td>
                        <td style={cellBaseStyle}>{user.position || '-'}</td>
                        <td style={cellBaseStyle}>{user.username}</td>
                        <td style={{ ...cellBaseStyle, fontVariantNumeric: 'tabular-nums' }}>{user.phone || '-'}</td>
                        <td style={cellBaseStyle}>{user.email}</td>
                        <td style={{ ...cellBaseStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: user.hospital ? '#EBF5EE' : '#FDF1E5',
                            color: user.hospital ? '#146E2E' : '#B45309',
                          }}>
                            {getHospitalText(user)}
                          </span>
                        </td>
                        <td style={{ ...cellBaseStyle, fontSize: isTablet ? '12px' : '13px', color: '#8A8A8A', maxWidth: '200px' }}>
                          <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }} title={viewableText}>
                            {viewableText}
                          </div>
                        </td>
                        <td style={{ ...cellBaseStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(user)}
                              aria-label={`${user.username || 'ユーザー'} を編集`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px',
                                background: 'transparent', color: '#146E2E',
                                border: '1px solid #008C1D', borderRadius: '4px', cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={14} aria-hidden />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              aria-label={`${user.username || 'ユーザー'} を削除`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px',
                                background: 'transparent', color: '#DA0000',
                                border: '1px solid #DA0000', borderRadius: '4px', cursor: 'pointer',
                              }}
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
          <div className="bg-surface-card rounded-lg">
            <EmptyState
              title="検索条件に一致するユーザーがいません"
              description="検索条件を変更するか、フィルターをリセットしてください"
              actionLabel="フィルターをリセット"
              onAction={() => {
                setFilterUsername('');
                setFilterDepartment('');
                setFilterFacility('');
              }}
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
