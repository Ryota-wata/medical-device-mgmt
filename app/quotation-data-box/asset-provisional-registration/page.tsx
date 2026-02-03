'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useIndividualStore } from '@/lib/stores/individualStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { OrderItem } from '@/lib/types';

// ============================================================
// カラートークン（survey-location / asset-survey-integrated 準拠）
// ============================================================
const C = {
  headerBg: '#1976d2',
  bg: '#f5f5f5',
  card: '#ffffff',
  textDark: '#2c3e50',
  textMuted: '#5a6c7d',
  border: '#ccc',
  borderLight: '#ddd',
  borderLighter: '#eee',
  divider: '#1976d2',
  green: '#27ae60',
  greenLight: '#d5f4e6',
  greenBg: '#e8f5e9',
  red: '#e74c3c',
  redLight: '#fadbd8',
  gray: '#ecf0f1',
  accent: '#ff9800',
  white: '#ffffff',
  inputBg: '#f8f8f8',
  disabled: '#999',
} as const;

// ============================================================
// PC モード用カラートークン（order-registration / inspection-registration 準拠）
// ============================================================
const COLORS = {
  primary: '#4a6fa5',
  primaryDark: '#3d5a80',
  accent: '#e67e22',
  textOnAccent: '#1f2937',
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnColor: '#ffffff',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  surface: '#f9fafb',
  surfaceAlt: '#f3f4f6',
  sectionHeader: '#4b5563',
  white: '#ffffff',
  disabled: '#9ca3af',
  green: '#27ae60',
  greenBg: '#e8f5e9',
} as const;

// ============================================================
// Types
// ============================================================
type ViewState = 'list' | 'form';

interface FormData {
  serialNumber: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  width: string;
  depth: string;
  height: string;
  remarks: string;
  labelApplied: boolean;
  photoTaken: boolean;
  qrCode: string;
  largeClass: string;
  mediumClass: string;
  itemClass: string;
}

const EMPTY_FORM: FormData = {
  serialNumber: '', building: '', floor: '', department: '', section: '',
  width: '', depth: '', height: '', remarks: '',
  labelApplied: false, photoTaken: false, qrCode: '',
  largeClass: '', mediumClass: '', itemClass: '',
};

/** PC 契約単位の編集データ */
interface ContractEditData {
  approvalNo: string;         // 院内決済番号
  applicationDept: string;    // 申請部署
  applicationPerson: string;  // 申請担当者
  managementDept: string;     // 管理部署
  managementPerson: string;   // 管理担当者
  vendorRegNo: string;        // 事業者登録番号
}

const EMPTY_CONTRACT: ContractEditData = {
  approvalNo: '', applicationDept: '', applicationPerson: '',
  managementDept: '', managementPerson: '', vendorRegNo: '',
};

/** PC テーブル行ごとの編集データ */
interface RowEditData {
  assetMasterId: string;      // 資産MasterID
  category: string;           // category
  largeClass: string;         // 大分類
  mediumClass: string;        // 中分類
  itemClass: string;          // 品目
  qrCode: string;             // QRコード
  fixedAssetNo: string;       // 固定資産番号
  meDeviceNo: string;         // ME機器管理No.
  serialNumber: string;       // シリアルNo.
  makerRegNo: string;         // メーカー事業者登録番号
  salesPerson: string;        // 担当者（営業）
  techPerson: string;         // 担当者（技術）
  floor: string;              // 階
  department: string;         // 部門
  section: string;            // 部署
  roomName: string;           // 室名
  accountType: string;        // 会計区分
  accountItem: string;        // 勘定科目
}

/** SearchParams 読み取り */
function ParamsReader({ onRead }: { onRead: (rfqGroupId: number | null, mode: string) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  const modeParam = searchParams.get('mode') || 'mobile';
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null, modeParam);
  }, [rfqGroupIdParam, modeParam, onRead]);
  return null;
}

// ============================================================
// Main page
// ============================================================
export default function AssetProvisionalRegistrationPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { getRfqGroupById, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId } = useOrderStore();
  const { addIndividual } = useIndividualStore();
  const { getApplicationsByRfqNo } = useApplicationStore();
  const { assets: assetMasters } = useMasterStore();

  // Params
  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const [mode, setMode] = useState<string>('mobile');
  const handleParamsRead = useCallback((id: number | null, m: string) => {
    setRfqGroupId(id);
    setMode(m);
  }, []);

  const isMobileMode = mode === 'mobile';

  // View state (mobile)
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared state
  const [registeredItemIds, setRegisteredItemIds] = useState<number[]>([]);
  const [registrationComplete, setRegistrationComplete] = useState<{
    groupName: string;
    itemCount: number;
    inspectionDate: string;
  } | null>(null);

  // PC state
  const [contractEdit, setContractEdit] = useState<ContractEditData>(EMPTY_CONTRACT);
  const [rowEditMap, setRowEditMap] = useState<Record<number, RowEditData>>({});

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showDialog = useCallback((opts: {
    title: string; message: string; onConfirm: () => void; confirmLabel?: string;
  }) => {
    setConfirmDialog({ isOpen: true, ...opts });
  }, []);

  const closeDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Data
  const rfqGroup = useMemo(() => rfqGroupId ? getRfqGroupById(rfqGroupId) : undefined, [rfqGroupId, getRfqGroupById]);
  const orderGroup = useMemo(() => rfqGroupId ? getOrderGroupByRfqGroupId(rfqGroupId) : undefined, [rfqGroupId, getOrderGroupByRfqGroupId]);
  const orderItems = useMemo(() => orderGroup ? getOrderItemsByGroupId(orderGroup.id) : [], [orderGroup, getOrderItemsByGroupId]);

  const totalItems = orderItems.length;
  const registeredCount = registeredItemIds.length;
  const progressPercent = totalItems > 0 ? Math.round((registeredCount / totalItems) * 100) : 0;
  const allRegistered = totalItems > 0 && registeredCount === totalItems;

  const totalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + item.totalPrice, 0), [orderItems]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return orderItems.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, orderItems]);

  const getAssetMasterMatch = useCallback((item: OrderItem) => {
    return assetMasters.find(m => m.item === item.itemName || m.model === item.model);
  }, [assetMasters]);

  // 編集リスト（Application）から設置場所を取得
  const rfqApplications = useMemo(() => {
    if (!rfqGroup) return [];
    return getApplicationsByRfqNo(rfqGroup.rfqNo);
  }, [rfqGroup, getApplicationsByRfqNo]);

  const getApplicationLocationMatch = useCallback((item: OrderItem) => {
    // itemName または model でマッチする Application を検索
    const direct = rfqApplications.find(app =>
      app.asset.name === item.itemName || app.asset.model === item.model
    );
    if (direct) return direct;

    // 付属品の場合: 同じ quotationItemId を持つ本体の Application を参照
    if (item.registrationType === '付属品' && item.quotationItemId != null) {
      const parentItem = orderItems.find(i =>
        i.quotationItemId === item.quotationItemId && i.registrationType === '本体'
      );
      if (parentItem) {
        return rfqApplications.find(app =>
          app.asset.name === parentItem.itemName || app.asset.model === parentItem.model
        );
      }
    }
    // 最終フォールバック: rfqApplications の先頭（同じグループなので同施設の可能性が高い）
    return rfqApplications.length > 0 ? rfqApplications[0] : undefined;
  }, [rfqApplications, orderItems]);

  // SearchableSelect options from asset masters
  const largeClassOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.largeClass).filter(Boolean))), [assetMasters]);
  const mediumClassOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.mediumClass).filter(Boolean))), [assetMasters]);
  const itemOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.item).filter(Boolean))), [assetMasters]);

  // Initialize PC row data
  React.useEffect(() => {
    if (orderItems.length > 0 && Object.keys(rowEditMap).length === 0) {
      const newMap: Record<number, RowEditData> = {};
      orderItems.forEach(item => {
        const match = getAssetMasterMatch(item);
        const appMatch = getApplicationLocationMatch(item);
        newMap[item.id] = {
          assetMasterId: match?.id?.toString() || '',
          category: match?.category || '',
          largeClass: match?.largeClass || '',
          mediumClass: match?.mediumClass || '',
          itemClass: match?.item || '',
          qrCode: '',
          fixedAssetNo: '',
          meDeviceNo: '',
          serialNumber: '',
          makerRegNo: '',
          salesPerson: '',
          techPerson: '',
          floor: appMatch?.facility?.floor || '',
          department: appMatch?.facility?.department || '',
          section: appMatch?.facility?.section || '',
          roomName: appMatch?.roomName || '',
          accountType: '',
          accountItem: '',
        };
      });
      setRowEditMap(newMap);
    }
  }, [orderItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const purchaseDate = orderGroup?.inspectionDate || orderGroup?.deliveryDate || '';

  // === Handlers ===
  const handleBack = useCallback(() => {
    if (isMobileMode && viewState === 'form') {
      setViewState('list');
      setSelectedItemId(null);
    } else {
      router.push('/quotation-data-box');
    }
  }, [isMobileMode, viewState, router]);

  const handleSelectItem = useCallback((itemId: number) => {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;
    const match = getAssetMasterMatch(item);
    const appMatch = getApplicationLocationMatch(item);
    setFormData({
      ...EMPTY_FORM,
      qrCode: '',
      largeClass: match?.largeClass || '',
      mediumClass: match?.mediumClass || '',
      itemClass: match?.item || '',
      building: appMatch?.facility?.building || '',
      floor: appMatch?.facility?.floor || '',
      department: appMatch?.facility?.department || '',
      section: appMatch?.facility?.section || '',
    });
    setSelectedItemId(itemId);
    setViewState('form');
  }, [orderItems, getAssetMasterMatch, getApplicationLocationMatch]);

  const handleFieldChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleQRScan = useCallback(() => {
    alert('QRコードを読み取りました（モック）');
  }, []);

  const handlePhotoCapture = useCallback(() => {
    if (isMobileMode && viewState === 'form') {
      setFormData(prev => ({ ...prev, photoTaken: true }));
    }
    alert('写真を撮影しました（モック）');
  }, [isMobileMode, viewState]);

  const handleRegisterItem = useCallback(() => {
    if (!selectedItem || !orderGroup) return;
    setIsSubmitting(true);
    setTimeout(() => {
      addIndividual({
        qrCode: formData.qrCode,
        assetName: selectedItem.itemName,
        model: selectedItem.model,
        location: { building: formData.building, floor: formData.floor, department: formData.department, section: formData.section },
        registrationDate: new Date().toISOString().split('T')[0],
        applicationNo: rfqGroup?.rfqNo || '',
        applicationType: '新規申請',
        status: '使用中',
        vendor: orderGroup.vendorName,
        serialNumber: formData.serialNumber,
        acquisitionCost: selectedItem.totalPrice,
        orderItemId: selectedItem.id,
        orderGroupId: orderGroup.id,
        largeClass: formData.largeClass,
        mediumClass: formData.mediumClass,
        itemClass: formData.itemClass,
        width: formData.width ? parseInt(formData.width, 10) : undefined,
        depth: formData.depth ? parseInt(formData.depth, 10) : undefined,
        height: formData.height ? parseInt(formData.height, 10) : undefined,
        photoTaken: formData.photoTaken,
        labelApplied: formData.labelApplied,
        remarks: formData.remarks,
      });
      setRegisteredItemIds(prev => [...prev, selectedItem.id]);
      setIsSubmitting(false);
      setViewState('list');
      setSelectedItemId(null);
    }, 400);
  }, [selectedItem, orderGroup, rfqGroup, formData, addIndividual]);

  // PC handlers
  const handleContractChange = useCallback((field: keyof ContractEditData, value: string) => {
    setContractEdit(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePcCellChange = useCallback((itemId: number, field: keyof RowEditData, value: string) => {
    setRowEditMap(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const handlePcRegisterAll = useCallback(() => {
    if (!orderGroup || !rfqGroup || !rfqGroupId) return;
    showDialog({
      title: '資産仮登録確認',
      message: `全${totalItems}件の資産仮登録を実行し、ステータスを「資産仮登録済」に更新します。`,
      confirmLabel: '資産仮登録する',
      onConfirm: () => {
        orderItems.forEach(item => {
          const rowData = rowEditMap[item.id];
          if (!rowData) return;
          addIndividual({
            qrCode: rowData.qrCode,
            assetName: item.itemName,
            model: item.model,
            location: { floor: rowData.floor, department: rowData.department, section: rowData.section, room: rowData.roomName },
            registrationDate: new Date().toISOString().split('T')[0],
            applicationNo: rfqGroup.rfqNo || '',
            applicationType: '新規申請',
            status: '使用中',
            vendor: orderGroup.vendorName,
            serialNumber: rowData.serialNumber,
            acquisitionCost: item.totalPrice,
            orderItemId: item.id,
            orderGroupId: orderGroup.id,
            largeClass: rowData.largeClass,
            mediumClass: rowData.mediumClass,
            itemClass: rowData.itemClass,
          });
        });
        updateRfqGroup(rfqGroupId, { status: '資産仮登録済' });
        setRegistrationComplete({
          groupName: rfqGroup.groupName,
          itemCount: totalItems,
          inspectionDate: orderGroup.inspectionDate || orderGroup.deliveryDate || '-',
        });
      },
    });
  }, [orderGroup, rfqGroup, rfqGroupId, orderItems, totalItems, rowEditMap, addIndividual, updateRfqGroup, showDialog]);

  // Mobile: complete all (after individual registrations)
  const handleCompleteAll = useCallback(() => {
    if (!rfqGroupId || !allRegistered || !rfqGroup || !orderGroup) return;
    showDialog({
      title: '資産仮登録完了確認',
      message: `全${totalItems}件の資産仮登録を完了します。ステータスを「資産仮登録済」に更新します。`,
      confirmLabel: '登録を完了する',
      onConfirm: () => {
        updateRfqGroup(rfqGroupId, { status: '資産仮登録済' });
        setRegistrationComplete({
          groupName: rfqGroup.groupName,
          itemCount: totalItems,
          inspectionDate: orderGroup.inspectionDate || orderGroup.deliveryDate || '-',
        });
      },
    });
  }, [rfqGroupId, allRegistered, totalItems, rfqGroup, orderGroup, updateRfqGroup, showDialog]);

  // ============================================================
  // Render: PC mode（order-registration / inspection-registration 準拠）
  // ============================================================
  if (!isMobileMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
        <style>{`
          .order-btn { transition: filter 150ms ease-out; }
          .order-btn:hover:not(:disabled) { filter: brightness(0.9); }
          .order-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
          .order-btn-secondary { transition: background 150ms ease-out; }
          .order-btn-secondary:hover { background: ${COLORS.borderLight} !important; }
          .order-btn-secondary:focus-visible { outline: 2px solid ${COLORS.border}; outline-offset: 2px; }
          .prov-cell-input { transition: border-color 150ms ease-out; }
          .prov-cell-input:focus { border-color: ${COLORS.primary} !important; outline: none; }
        `}</style>

        <Suspense fallback={null}>
          <ParamsReader onRead={handleParamsRead} />
        </Suspense>

        <Header
          title={registrationComplete ? '資産仮登録完了' : '資産仮登録'}
          hideMenu={true}
          showBackButton={false}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {/* PC: 完了画面 */}
          {registrationComplete ? (
            <div style={{ maxWidth: '560px', margin: '40px auto', textAlign: 'center' }}>
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '32px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px', textWrap: 'balance' }}>
                  資産仮登録が完了しました
                </h2>
                <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px', fontVariantNumeric: 'tabular-nums', textWrap: 'pretty' }}>
                  {registrationComplete.groupName}（{registrationComplete.itemCount}品目 / 検収日: {registrationComplete.inspectionDate}）
                </p>
                <button
                  className="order-btn"
                  onClick={() => router.push('/quotation-data-box')}
                  style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px' }}
                >
                  一覧画面に戻る
                </button>
              </div>
            </div>

          /* PC: データなし */
          ) : !rfqGroup || !orderGroup || orderItems.length === 0 ? (
            <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', color: COLORS.textMuted }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: '8px' }}>
                対象の発注データが見つかりません
              </p>
              <p style={{ fontSize: '12px', marginBottom: '16px', textWrap: 'pretty' }}>
                URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。
              </p>
              <button
                className="order-btn"
                onClick={() => router.push('/quotation-data-box')}
                style={{ padding: '8px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ← 一覧画面に戻る
              </button>
            </div>

          /* PC: メイン入力画面 */
          ) : (
            <>
              {/* 基本情報セクション（読取専用） */}
              <div style={{ background: COLORS.white, borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 16px', background: COLORS.sectionHeader, color: COLORS.textOnColor, fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>
                  基本情報
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={pcInfoThStyle}>見積依頼No.</td>
                        <td style={pcInfoTdStyle}>{rfqGroup.rfqNo}</td>
                        <td style={pcInfoThStyle}>見積依頼G名称</td>
                        <td style={pcInfoTdStyle}>{rfqGroup.groupName}</td>
                      </tr>
                      <tr>
                        <td style={pcInfoThStyle}>発注先</td>
                        <td style={pcInfoTdStyle}>{orderGroup.vendorName}</td>
                        <td style={pcInfoThStyle}>担当</td>
                        <td style={pcInfoTdStyle}>{rfqGroup.personInCharge || '-'}</td>
                      </tr>
                      <tr>
                        <td style={pcInfoThStyle}>発注形態</td>
                        <td style={pcInfoTdStyle}>{orderGroup.orderType}</td>
                        <td style={pcInfoThStyle}>見積日付</td>
                        <td style={{ ...pcInfoTdStyle, fontVariantNumeric: 'tabular-nums' }}>{rfqGroup.createdDate || '-'}</td>
                      </tr>
                      <tr>
                        <td style={pcInfoThStyle}>発注日</td>
                        <td style={{ ...pcInfoTdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.orderDate || '-'}</td>
                        <td style={pcInfoThStyle}>納品日</td>
                        <td style={{ ...pcInfoTdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.deliveryDate || '-'}</td>
                      </tr>
                      <tr>
                        <td style={pcInfoThStyle}>検収日</td>
                        <td style={{ ...pcInfoTdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.inspectionDate || '-'}</td>
                        <td style={pcInfoThStyle}>合計金額</td>
                        <td style={{ ...pcInfoTdStyle, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>¥{totalAmount.toLocaleString()}</td>
                      </tr>
                      {orderGroup.orderType?.includes('リース') && (
                        <tr>
                          <td style={pcInfoThStyle}>リース開始日</td>
                          <td style={{ ...pcInfoTdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.leaseStartDate || '-'}</td>
                          <td style={pcInfoThStyle}>リース年数</td>
                          <td style={pcInfoTdStyle}>{orderGroup.leaseYears ? `${orderGroup.leaseYears}年` : '-'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 登録情報入力セクション（編集可能） */}
              <div style={{ border: `2px solid ${COLORS.accent}`, borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ background: COLORS.accent, color: COLORS.textOnAccent, padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', textWrap: 'balance' }}>
                  登録情報入力
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr 120px 1fr', gap: '8px 16px', alignItems: 'center' }}>
                    <label style={pcLabelStyle}>院内決済番号</label>
                    <input className="prov-cell-input" type="text" value={contractEdit.approvalNo} onChange={(e) => handleContractChange('approvalNo', e.target.value)} placeholder="未設定" style={pcInputStyle} />
                    <label style={pcLabelStyle}>申請部署</label>
                    <input className="prov-cell-input" type="text" value={contractEdit.applicationDept} onChange={(e) => handleContractChange('applicationDept', e.target.value)} placeholder="未設定" style={pcInputStyle} />
                    <label style={pcLabelStyle}>管理部署</label>
                    <input className="prov-cell-input" type="text" value={contractEdit.managementDept} onChange={(e) => handleContractChange('managementDept', e.target.value)} placeholder="未設定" style={pcInputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr 120px 1fr', gap: '8px 16px', alignItems: 'center', marginTop: '8px' }}>
                    <label style={pcLabelStyle}>管理担当者</label>
                    <input className="prov-cell-input" type="text" value={contractEdit.managementPerson} onChange={(e) => handleContractChange('managementPerson', e.target.value)} placeholder="未設定" style={pcInputStyle} />
                    <label style={pcLabelStyle}>事業者登録番号</label>
                    <input className="prov-cell-input" type="text" value={contractEdit.vendorRegNo} onChange={(e) => handleContractChange('vendorRegNo', e.target.value)} placeholder="T0000000000000" style={{ ...pcInputStyle, maxWidth: '200px' }} />
                    <div />
                    <div />
                  </div>
                </div>
              </div>

              {/* 明細テーブル */}
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: '4px', marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  background: COLORS.primary,
                  color: COLORS.textOnColor,
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>
                    明細に対する基本情報
                    <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: '12px', opacity: 0.9 }}>
                      【オレンジ列 = 入力項目】
                    </span>
                  </span>
                  <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                    合計金額（税別）:
                    <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                      ¥{totalAmount.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: 2400 }}>
                    <thead>
                      {/* グループヘッダー行 */}
                      <tr style={{ background: COLORS.sectionHeader, color: COLORS.textOnColor }}>
                        <th style={{ ...pcTableThStyle, textAlign: 'center' }} rowSpan={2}>No</th>
                        <th style={pcTableThStyle} colSpan={7}>商品分類</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }} colSpan={4}>管理番号</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }} colSpan={3}>メーカー情報</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }} colSpan={4}>設置場所</th>
                        <th style={pcTableThStyle} colSpan={1}>金額</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }} colSpan={2}>会計</th>
                      </tr>
                      {/* 個別ヘッダー行 */}
                      <tr style={{ background: COLORS.primary, color: COLORS.textOnColor }}>
                        <th style={pcTableThStyle}>資産MasterID</th>
                        <th style={pcTableThStyle}>category</th>
                        <th style={pcTableThStyle}>大分類</th>
                        <th style={pcTableThStyle}>中分類</th>
                        <th style={pcTableThStyle}>品名</th>
                        <th style={pcTableThStyle}>メーカー名</th>
                        <th style={pcTableThStyle}>型式</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>QRコード</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>固定資産番号</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>ME機器管理No.</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>シリアルNo.</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>事業者登録番号</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>担当者(営業)</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>担当者(技術)</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>階</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>部門</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>部署</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>室名</th>
                        <th style={{ ...pcTableThStyle, textAlign: 'right' }}>取得金額(税別)</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>会計区分</th>
                        <th style={{ ...pcTableThStyle, background: '#fff7ed', color: '#c2410c' }}>勘定科目</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => {
                        const r = rowEditMap[item.id];
                        if (!r) return null;
                        return (
                          <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                            <td style={{ ...pcTableTdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{index + 1}</td>
                            <td style={{ ...pcTableTdStyle, fontFamily: 'monospace', fontSize: '10px', color: COLORS.textMuted }}>{r.assetMasterId || '-'}</td>
                            <td style={{ ...pcTableTdStyle, fontSize: '10px' }}>{r.category || '-'}</td>
                            <td style={{ ...pcTableTdStyle, fontSize: '10px' }}>{r.largeClass || '-'}</td>
                            <td style={{ ...pcTableTdStyle, fontSize: '10px' }}>{r.mediumClass || '-'}</td>
                            <td style={{ ...pcTableTdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item.itemName}</td>
                            <td style={{ ...pcTableTdStyle, whiteSpace: 'nowrap' }}>{item.manufacturer}</td>
                            <td style={{ ...pcTableTdStyle, fontFamily: 'monospace', fontSize: '10px' }}>{item.model}</td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.qrCode} onChange={(e) => handlePcCellChange(item.id, 'qrCode', e.target.value)} placeholder="QRコード" style={{ ...pcCellInputStyle, width: '120px', fontFamily: 'monospace' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.fixedAssetNo} onChange={(e) => handlePcCellChange(item.id, 'fixedAssetNo', e.target.value)} placeholder="入力" style={{ ...pcCellInputStyle, width: '90px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.meDeviceNo} onChange={(e) => handlePcCellChange(item.id, 'meDeviceNo', e.target.value)} placeholder="入力" style={{ ...pcCellInputStyle, width: '90px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.serialNumber} onChange={(e) => handlePcCellChange(item.id, 'serialNumber', e.target.value)} placeholder="入力" style={pcCellInputStyle} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.makerRegNo} onChange={(e) => handlePcCellChange(item.id, 'makerRegNo', e.target.value)} placeholder="T000..." style={{ ...pcCellInputStyle, width: '100px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.salesPerson} onChange={(e) => handlePcCellChange(item.id, 'salesPerson', e.target.value)} placeholder="氏名" style={{ ...pcCellInputStyle, width: '70px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.techPerson} onChange={(e) => handlePcCellChange(item.id, 'techPerson', e.target.value)} placeholder="氏名" style={{ ...pcCellInputStyle, width: '70px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.floor} onChange={(e) => handlePcCellChange(item.id, 'floor', e.target.value)} placeholder="階" style={{ ...pcCellInputStyle, width: '40px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.department} onChange={(e) => handlePcCellChange(item.id, 'department', e.target.value)} placeholder="部門" style={{ ...pcCellInputStyle, width: '80px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.section} onChange={(e) => handlePcCellChange(item.id, 'section', e.target.value)} placeholder="部署" style={{ ...pcCellInputStyle, width: '70px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.roomName} onChange={(e) => handlePcCellChange(item.id, 'roomName', e.target.value)} placeholder="室名" style={{ ...pcCellInputStyle, width: '70px' }} /></td>
                            <td style={{ ...pcTableTdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, whiteSpace: 'nowrap' }}>¥{item.totalPrice.toLocaleString()}</td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.accountType} onChange={(e) => handlePcCellChange(item.id, 'accountType', e.target.value)} placeholder="区分" style={{ ...pcCellInputStyle, width: '70px' }} /></td>
                            <td style={pcEditCellStyle}><input className="prov-cell-input" type="text" value={r.accountItem} onChange={(e) => handlePcCellChange(item.id, 'accountItem', e.target.value)} placeholder="科目" style={{ ...pcCellInputStyle, width: '80px' }} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* フッターボタン */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <button
                  className="order-btn-secondary"
                  onClick={() => router.push('/quotation-data-box')}
                  style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  ← 一覧画面に戻る
                </button>
                <button
                  className="order-btn"
                  onClick={handlePcRegisterAll}
                  style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', minHeight: '44px' }}
                >
                  資産仮登録する
                </button>
              </div>
            </>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeDialog}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
        />
      </div>
    );
  }

  // ============================================================
  // Render: Mobile mode（survey-location / asset-survey-integrated 準拠）
  // ============================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: C.bg }}>
      <style>{`
        .prov-cell-input { transition: border-color 150ms ease-out; }
        .prov-cell-input:focus { border-color: ${C.headerBg} !important; outline: none; }
      `}</style>

      <Suspense fallback={null}>
        <ParamsReader onRead={handleParamsRead} />
      </Suspense>

      {/* ======== Sticky Header（asset-survey-integrated 準拠） ======== */}
      <div style={{
        backgroundColor: C.headerBg,
        color: C.white,
        padding: isMobile ? '12px 16px' : '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <h1 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 600,
            margin: 0,
            textWrap: 'balance',
          }}>
            {registrationComplete ? '資産仮登録完了' : '資産仮登録'}
          </h1>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            marginLeft: '8px',
          }}>
            モバイル
          </span>
        </div>
      </div>

      {/* ======== Main Content ======== */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 12px 120px 12px' : '24px 20px 120px 20px',
        overflowY: 'auto',
      }}>

        {/* ======== 登録完了画面 ======== */}
        {registrationComplete ? (
          <div style={{ maxWidth: '500px', margin: '40px auto' }}>
            <div style={{
              backgroundColor: C.card,
              borderRadius: '8px',
              padding: isMobile ? '24px 16px' : '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: C.greenBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
                color: C.green,
              }}>
                &#10003;
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: C.textDark, marginBottom: '8px', textWrap: 'balance' }}>
                資産仮登録が完了しました
              </h2>
              <p style={{ fontSize: '14px', color: C.textMuted, marginBottom: '24px', fontVariantNumeric: 'tabular-nums', textWrap: 'pretty' }}>
                {registrationComplete.groupName}<br />
                {registrationComplete.itemCount}品目 / 検収日: {registrationComplete.inspectionDate}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => router.push('/quotation-data-box')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: C.headerBg,
                    color: C.white,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    width: '240px',
                    minHeight: '44px',
                  }}
                >
                  一覧画面に戻る
                </button>
              </div>
            </div>
          </div>

        /* ======== データなし ======== */
        ) : !rfqGroup || !orderGroup || orderItems.length === 0 ? (
          <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center' }}>
            <div style={{
              backgroundColor: C.card,
              borderRadius: '8px',
              padding: '32px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: C.textDark, marginBottom: '8px' }}>
                対象の発注データが見つかりません
              </p>
              <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '16px', textWrap: 'pretty' }}>
                URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。
              </p>
              <button
                onClick={() => router.push('/quotation-data-box')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: C.headerBg,
                  color: C.white,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                一覧画面に戻る
              </button>
            </div>
          </div>

        /* ======== モバイル: フォーム表示 ======== */
        ) : viewState === 'form' && selectedItem ? (
          <>
            {/* QR入力 */}
            <Card isMobile={isMobile}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.textDark, marginBottom: '12px' }}>
                QRコード
              </div>
              <input
                type="text"
                value={formData.qrCode}
                onChange={(e) => handleFieldChange('qrCode', e.target.value)}
                placeholder="QRコードを入力してください"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  boxSizing: 'border-box' as const,
                }}
              />
            </Card>

            {/* Blue Bar */}
            <BlueDivider />

            {/* Asset Info */}
            <Card isMobile={isMobile}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.textDark, marginBottom: '12px' }}>
                {selectedItem.itemName}
                <span style={{ fontSize: '12px', fontWeight: 400, color: C.textMuted, marginLeft: '8px' }}>
                  {selectedItem.model} / {selectedItem.registrationType}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>品目名</label>
                  <div style={readOnlyStyle}>{selectedItem.itemName}</div>
                </div>
                <div>
                  <label style={labelStyle}>メーカー</label>
                  <div style={readOnlyStyle}>{selectedItem.manufacturer}</div>
                </div>
                <div>
                  <label style={labelStyle}>型式</label>
                  <div style={readOnlyStyle}>{selectedItem.model}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>シリアルNo.</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
                    placeholder="シリアルNo.を入力"
                    style={inputFieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>購入年月日</label>
                  <div style={readOnlyStyle}>{purchaseDate || '-'}</div>
                </div>
                <div>
                  <label style={labelStyle}>取得金額</label>
                  <div style={{ ...readOnlyStyle, fontVariantNumeric: 'tabular-nums' }}>¥{selectedItem.totalPrice.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: C.disabled, fontStyle: 'italic' }}>
                ※ 資産番号・備品番号は本登録時に配番されます
              </div>
            </Card>

            {/* Photo Display */}
            <Card isMobile={isMobile}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.textDark, marginBottom: '12px' }}>写真</div>
              <div style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: formData.photoTaken ? C.greenBg : '#f9f9f9',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '14px', color: C.textMuted }}>
                  {formData.photoTaken ? '写真撮影済み' : '写真を撮影してください'}
                </div>
              </div>
            </Card>

            {/* Blue Bar */}
            <BlueDivider />

            {/* Classification */}
            <Card isMobile={isMobile}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.textDark, marginBottom: '16px' }}>分類情報</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <SearchableSelect label="大分類" value={formData.largeClass} onChange={(v) => handleFieldChange('largeClass', v)} options={['', ...largeClassOptions]} placeholder="選択してください" isMobile={isMobile} />
                <SearchableSelect label="中分類" value={formData.mediumClass} onChange={(v) => handleFieldChange('mediumClass', v)} options={['', ...mediumClassOptions]} placeholder="選択してください" isMobile={isMobile} />
                <SearchableSelect label="品目" value={formData.itemClass} onChange={(v) => handleFieldChange('itemClass', v)} options={['', ...itemOptions]} placeholder="選択してください" isMobile={isMobile} />
              </div>
            </Card>

            {/* Location */}
            <Card isMobile={isMobile}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.textDark, marginBottom: '16px' }}>設置場所</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>棟</label>
                  <input type="text" value={formData.building} onChange={(e) => handleFieldChange('building', e.target.value)} placeholder="例: 本館" style={inputFieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>階</label>
                  <input type="text" value={formData.floor} onChange={(e) => handleFieldChange('floor', e.target.value)} placeholder="例: 3F" style={inputFieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>部門</label>
                  <input type="text" value={formData.department} onChange={(e) => handleFieldChange('department', e.target.value)} placeholder="例: 内視鏡センター" style={inputFieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>部署</label>
                  <input type="text" value={formData.section} onChange={(e) => handleFieldChange('section', e.target.value)} placeholder="例: 検査室1" style={inputFieldStyle} />
                </div>
              </div>
            </Card>

            {/* Size */}
            <Card isMobile={isMobile}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.textDark, marginBottom: '16px' }}>サイズ情報</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>W (幅)</label>
                  <input type="number" value={formData.width} onChange={(e) => handleFieldChange('width', e.target.value)} placeholder="0" style={{ ...inputFieldStyle, fontVariantNumeric: 'tabular-nums' }} />
                </div>
                <div>
                  <label style={labelStyle}>D (奥行)</label>
                  <input type="number" value={formData.depth} onChange={(e) => handleFieldChange('depth', e.target.value)} placeholder="0" style={{ ...inputFieldStyle, fontVariantNumeric: 'tabular-nums' }} />
                </div>
                <div>
                  <label style={labelStyle}>H (高さ)</label>
                  <input type="number" value={formData.height} onChange={(e) => handleFieldChange('height', e.target.value)} placeholder="0" style={{ ...inputFieldStyle, fontVariantNumeric: 'tabular-nums' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '8px' }}>単位: mm</div>
            </Card>

            {/* Remarks */}
            <Card isMobile={isMobile}>
              <label style={labelStyle}>備考</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleFieldChange('remarks', e.target.value)}
                placeholder="備考を入力してください"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </Card>
          </>

        /* ======== モバイル: リスト表示 ======== */
        ) : (
          <>
            {/* 基本情報 */}
            <Card isMobile={isMobile}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.textDark, marginBottom: '12px' }}>基本情報</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '120px 1fr', gap: '8px' }}>
                <InfoRow label="見積依頼No." value={rfqGroup.rfqNo} />
                <InfoRow label="見積G名称" value={rfqGroup.groupName} />
                <InfoRow label="発注先" value={orderGroup.vendorName} />
                <InfoRow label="検収日" value={orderGroup.inspectionDate || orderGroup.deliveryDate || '-'} />
              </div>
            </Card>

            {/* 進捗バー */}
            <Card isMobile={isMobile}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: C.textDark }}>
                  登録済: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{registeredCount} / {totalItems} 件</span>
                </span>
                <span style={{ fontSize: '12px', color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>{progressPercent}%</span>
              </div>
              <div style={{ height: 6, background: '#e0e0e0', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: progressPercent === 100 ? C.green : C.headerBg,
                  borderRadius: 9999,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </Card>

            {/* Blue Bar */}
            <BlueDivider />

            {/* 品目リスト */}
            <Card isMobile={isMobile} noPadding>
              <div style={{ padding: isMobile ? '12px 16px' : '16px 20px', borderBottom: `1px solid ${C.borderLighter}` }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.textDark }}>個体管理品目一覧</div>
              </div>
              {orderItems.map((item) => {
                const isRegistered = registeredItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !isRegistered && handleSelectItem(item.id)}
                    disabled={isRegistered}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: isMobile ? '14px 16px' : '16px 20px',
                      width: '100%',
                      textAlign: 'left',
                      background: isRegistered ? C.greenBg : C.white,
                      border: 'none',
                      borderBottom: `1px solid ${C.borderLighter}`,
                      cursor: isRegistered ? 'default' : 'pointer',
                      minHeight: 60,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isRegistered) e.currentTarget.style.background = '#f0f0f0'; }}
                    onMouseLeave={(e) => { if (!isRegistered) e.currentTarget.style.background = C.white; else e.currentTarget.style.background = C.greenBg; }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isRegistered ? C.greenLight : C.gray,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 16,
                      color: isRegistered ? C.green : C.disabled,
                      fontWeight: 700,
                    }}>
                      {isRegistered ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: isRegistered ? C.textMuted : C.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.itemName}
                      </div>
                      <div style={{ fontSize: '12px', color: C.textMuted, marginTop: 2 }}>
                        {item.model} / {item.registrationType}
                      </div>
                    </div>
                    {!isRegistered && <span style={{ color: C.disabled, fontSize: 18, flexShrink: 0 }}>&rsaquo;</span>}
                  </button>
                );
              })}
            </Card>
          </>
        )}
      </main>

      {/* ======== Fixed Footer（asset-survey-integrated 準拠） ======== */}
      {!registrationComplete && rfqGroup && orderGroup && (
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: C.white,
          borderTop: `1px solid ${C.borderLight}`,
          padding: isMobile ? '8px' : '10px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}>
          {/* 戻る */}
          <FooterButton
            onClick={handleBack}
            icon={
              <div style={{
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: `10px solid ${C.textDark}`,
              }} />
            }
            label="戻る"
            color={C.textDark}
            bgColor={C.gray}
            hoverBg={C.gray}
            isMobile={isMobile}
          />

          {/* QR読取 */}
          <FooterButton
            onClick={handleQRScan}
            icon={<span style={{ fontSize: '20px' }}>📷</span>}
            label="QR読取"
            color={C.red}
            bgColor={C.redLight}
            hoverBg={C.redLight}
            isMobile={isMobile}
          />

          {/* 写真撮影 */}
          <FooterButton
            onClick={handlePhotoCapture}
            icon={<span style={{ fontSize: '20px' }}>📷</span>}
            label="写真撮影"
            color={C.red}
            bgColor={C.redLight}
            hoverBg={C.redLight}
            isMobile={isMobile}
          />

          {/* 商品登録 / 登録完了 */}
          {viewState === 'form' ? (
            <FooterButton
              onClick={handleRegisterItem}
              disabled={isSubmitting}
              icon={<span style={{ fontSize: '20px' }}>✓</span>}
              label={isSubmitting ? '登録中...' : '商品登録'}
              color={C.green}
              bgColor={C.greenLight}
              hoverBg={C.greenLight}
              isMobile={isMobile}
            />
          ) : allRegistered ? (
            <FooterButton
              onClick={handleCompleteAll}
              icon={<span style={{ fontSize: '20px' }}>✓</span>}
              label="登録完了"
              color={C.green}
              bgColor={C.greenLight}
              hoverBg={C.greenLight}
              isMobile={isMobile}
            />
          ) : (
            <FooterButton
              onClick={() => {}}
              disabled
              icon={<span style={{ fontSize: '20px', opacity: 0.4 }}>✓</span>}
              label="商品登録"
              color={C.disabled}
              bgColor={C.gray}
              hoverBg={C.gray}
              isMobile={isMobile}
            />
          )}
        </footer>
      )}

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
      />
    </div>
  );
}

// ============================================================
// Sub-components（asset-survey-integrated 準拠）
// ============================================================

/** カードコンポーネント */
function Card({ children, isMobile, noPadding }: { children: React.ReactNode; isMobile: boolean; noPadding?: boolean }) {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: '8px',
      padding: noPadding ? 0 : (isMobile ? '16px' : '20px'),
      marginBottom: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      {children}
    </div>
  );
}

/** ブルーバー区切り */
function BlueDivider() {
  return (
    <div style={{
      height: '4px',
      backgroundColor: C.divider,
      margin: '24px 0',
      borderRadius: '2px',
    }} />
  );
}

/** 基本情報行（モバイル） */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600, padding: '4px 0' }}>{label}</div>
      <div style={{ fontSize: '14px', color: C.textDark, padding: '4px 0', fontVariantNumeric: 'tabular-nums' }}>{value || '-'}</div>
    </>
  );
}

/** フッターボタン（asset-survey-integrated 準拠: 丸型アイコン + ラベル） */
function FooterButton({ onClick, icon, label, color, bgColor, hoverBg, isMobile, disabled }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  hoverBg: string;
  isMobile: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: isMobile ? '5px' : '8px',
        borderRadius: '8px',
        transition: 'background 0.15s',
        minWidth: isMobile ? '60px' : '70px',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      <div style={{
        width: isMobile ? '35px' : '40px',
        height: isMobile ? '35px' : '40px',
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: isMobile ? '11px' : '12px', color }}>{label}</span>
    </button>
  );
}

// ============================================================
// Style constants（asset-survey-integrated 準拠）
// ============================================================

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: C.textMuted,
  display: 'block',
  marginBottom: '4px',
};

const readOnlyStyle: React.CSSProperties = {
  backgroundColor: C.inputBg,
  border: `1px solid #e0e0e0`,
  borderRadius: '4px',
  padding: '10px',
  fontSize: '14px',
  color: '#666666',
};

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: `1px solid ${C.border}`,
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
};

// ============================================================
// PC モード用 Style constants（order-registration / inspection-registration 準拠）
// ============================================================

/** PC 基本情報テーブル: ヘッダーセル */
const pcInfoThStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: COLORS.surfaceAlt,
  fontWeight: 'bold',
  width: '120px',
  border: `1px solid ${COLORS.borderLight}`,
  fontSize: '12px',
};

/** PC 基本情報テーブル: データセル */
const pcInfoTdStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: `1px solid ${COLORS.borderLight}`,
  fontSize: '12px',
};

/** PC 入力セクション: ラベル */
const pcLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: COLORS.textPrimary,
  whiteSpace: 'nowrap',
};

/** PC 入力セクション: input */
const pcInputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box' as const,
};

/** PC 明細テーブル: ヘッダー */
const pcTableThStyle: React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontWeight: 'bold',
  fontSize: '11px',
  borderBottom: `1px solid ${COLORS.primaryDark}`,
};

/** PC 明細テーブル: データセル */
const pcTableTdStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '12px',
  color: COLORS.textPrimary,
  verticalAlign: 'middle',
};

/** PC 明細テーブル: 編集可能セル */
const pcEditCellStyle: React.CSSProperties = {
  ...pcTableTdStyle,
  background: '#fff7ed',
};

/** PC 明細テーブル: セル内input */
const pcCellInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontSize: '12px',
  border: '1px solid #fdba74',
  borderRadius: '3px',
  fontFamily: 'inherit',
  background: COLORS.white,
  boxSizing: 'border-box' as const,
};
