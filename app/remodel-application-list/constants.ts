import { ApplicationType } from '@/lib/types/application';

// 申請種別の背景色・文字色設定
export const APPLICATION_TYPE_BADGE_STYLES: Record<ApplicationType, { background: string; color: string }> = {
  '新規申請': { background: '#e8f5e9', color: '#2e7d32' },
  '増設申請': { background: '#e3f2fd', color: '#1565c0' },
  '更新申請': { background: '#fff3e0', color: '#e65100' },
  '移動申請': { background: '#f3e5f5', color: '#6a1b9a' },
  '廃棄申請': { background: '#ffebee', color: '#c62828' },
  '保留': { background: '#f5f5f5', color: '#555' },
};

// テーブルカラム定義
export interface ColumnDefinition {
  key: string;
  label: string;
  width: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export const TABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'checkbox', label: '', width: '50px', align: 'left' },
  { key: 'applicationNo', label: '申請番号', width: '120px' },
  { key: 'applicationDate', label: '申請日', width: '100px' },
  { key: 'applicationType', label: '申請種別', width: '120px' },
  { key: 'building', label: '棟', width: '100px' },
  { key: 'floor', label: '階', width: '80px' },
  { key: 'department', label: '部門', width: '120px' },
  { key: 'section', label: '部署', width: '120px' },
  { key: 'roomName', label: '諸室名', width: '150px' },
  { key: 'assetName', label: '品目', width: '200px' },
  { key: 'vendor', label: 'メーカー', width: '150px' },
  { key: 'model', label: '型式', width: '150px' },
  { key: 'quantity', label: '数量', width: '80px' },
  { key: 'unit', label: '単位', width: '80px' },
  { key: 'currentConnectionStatus', label: '現在の接続状況', width: '120px' },
  { key: 'currentConnectionDestination', label: '現在の接続先', width: '150px' },
  { key: 'requestConnectionStatus', label: '要望機器の接続要望', width: '140px' },
  { key: 'requestConnectionDestination', label: '要望機器の接続先', width: '150px' },
  { key: 'applicationReason', label: '申請理由・コメント等', width: '200px' },
  { key: 'executionYear', label: '執行年度', width: '100px' },
  { key: 'group', label: 'グループ', width: '100px' },
  { key: 'rfqNo', label: '見積依頼No.', width: '120px' },
  { key: 'rfqGroupName', label: 'グループ名称', width: '150px' },
  { key: 'quotationStatus', label: '見積紐付け状態', width: '120px', align: 'center' },
  { key: 'quotationVendor', label: '見積業者', width: '150px' },
  { key: 'quotationAmount', label: '見積金額', width: '120px', align: 'right' },
  { key: 'largeClass', label: '大分類', width: '120px' },
  { key: 'mediumClass', label: '中分類', width: '120px' },
  { key: 'item', label: '品目', width: '180px' },
  { key: 'estimatedAmount', label: '概算金額', width: '120px', align: 'right' },
  { key: 'editColumn1', label: '編集カラム', width: '150px' },
  { key: 'editColumn2', label: '編集カラム', width: '150px' },
  { key: 'operation', label: '操作', width: '180px', align: 'center', sticky: true },
];

// ウィンドウサイズ設定
export const WINDOW_SIZES = {
  ASSET_MASTER: { width: 1400, height: 900 },
  QUOTATION_MANAGEMENT: { width: 1400, height: 900 },
};

// 共通スタイル
export const STYLES = {
  headerCell: {
    padding: '12px 8px',
    fontWeight: 'bold' as const,
    color: '#2c3e50',
  },
  dataCell: {
    padding: '12px 8px',
    color: '#2c3e50',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  stickyColumn: {
    position: 'sticky' as const,
    right: 0,
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
  },
};
