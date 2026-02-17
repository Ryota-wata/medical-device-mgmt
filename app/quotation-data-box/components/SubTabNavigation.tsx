'use client';

import { useRouter } from 'next/navigation';

export type SubTabType = 'remodelManagement' | 'purchaseManagement' | 'remodelQuotations' | 'purchaseQuotations' | 'borrowingManagement' | 'transferManagement' | 'disposalManagement' | 'repairRequests' | 'repairDetails' | 'makerMaintenance' | 'inHouseInspection' | 'lendingManagement';

export const SUB_TABS: { key: SubTabType; label: string; path: string }[] = [
  { key: 'remodelManagement', label: 'リモデル管理', path: '/quotation-data-box/remodel-management' },
  { key: 'remodelQuotations', label: 'リモデル見積明細', path: '/quotation-data-box/remodel-quotations' },
  { key: 'purchaseManagement', label: '購入管理', path: '/quotation-data-box/purchase-management' },
  { key: 'purchaseQuotations', label: '購入見積明細', path: '/quotation-data-box/purchase-quotations' },
  { key: 'borrowingManagement', label: '借用管理', path: '/quotation-data-box/borrowing-management' },
  { key: 'transferManagement', label: '移動管理', path: '/quotation-data-box/transfer-management' },
  { key: 'disposalManagement', label: '廃棄管理', path: '/quotation-data-box/disposal-management' },
  { key: 'repairRequests', label: '修理管理', path: '/quotation-data-box/repair-requests' },
  { key: 'repairDetails', label: '修理明細', path: '/quotation-data-box/repair-details' },
  { key: 'makerMaintenance', label: '保守契約管理', path: '/quotation-data-box/maintenance-contracts' },
  { key: 'inHouseInspection', label: '点検管理', path: '/quotation-data-box/inspection-requests' },
  { key: 'lendingManagement', label: '貸出管理', path: '/quotation-data-box/lending-management' },
];

interface SubTabNavigationProps {
  activeTab: SubTabType;
}

export function SubTabNavigation({ activeTab }: SubTabNavigationProps) {
  const router = useRouter();

  return (
    <div style={{ background: 'white', borderBottom: '2px solid #dee2e6', display: 'flex', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
      {SUB_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => router.push(tab.path)}
          style={{
            padding: '10px 20px',
            background: activeTab === tab.key ? '#3498db' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === tab.key ? 'bold' : 'normal',
            color: activeTab === tab.key ? 'white' : '#555',
            borderRadius: '4px 4px 0 0',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
