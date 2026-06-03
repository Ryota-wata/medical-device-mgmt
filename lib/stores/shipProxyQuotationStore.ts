import { create } from 'zustand';
import { ShipProxyQuotation, ShipProxyQuotationStatus } from '@/lib/types/shipProxyQuotation';

// SHIP代理見積依頼ストア (2026-06-03 新規)
// 病院ユーザーが見積書PDFをアップロード→SHIP代理見積ユーザーがOCR〜見積DB登録までを代行する依頼の状態管理

interface ShipProxyQuotationStore {
  requests: ShipProxyQuotation[];
  addRequest: (
    input: Omit<ShipProxyQuotation, 'id' | 'requestNo' | 'requestedAt' | 'status'>,
  ) => ShipProxyQuotation;
  updateStatus: (
    id: string,
    status: ShipProxyQuotationStatus,
    updates?: Partial<ShipProxyQuotation>,
  ) => void;
  getByStatus: (status: ShipProxyQuotationStatus) => ShipProxyQuotation[];
  getByHospital: (hospitalId: string) => ShipProxyQuotation[];
}

// デモ用サンプル (依頼中3件 / 作業中2件 / 完了2件 / 差戻1件)
const initialRequests: ShipProxyQuotation[] = [
  {
    id: 'spq-001',
    requestNo: 'SPQ-20260530-0001',
    requestedAt: '2026-05-30T10:00:00',
    hospitalId: 'hosp-tokyo',
    hospitalName: '東京中央病院',
    rfqGroupId: 1,
    rfqGroupName: '2026年度CT装置更新',
    attachedFileName: 'CT_装置_見積書.pdf',
    applicantId: 'user-admin-001',
    applicantName: '佐藤 美智子',
    quotationPhase: '発注登録用見積',
    saveFormat: '電子取引',
    vendorName: 'シーメンスヘルスケア',
    registrationDeadline: '2026-06-10',
    status: '依頼中',
  },
  {
    id: 'spq-002',
    requestNo: 'SPQ-20260601-0001',
    requestedAt: '2026-06-01T14:30:00',
    hospitalId: 'hosp-tokyo',
    hospitalName: '東京中央病院',
    rfqGroupId: 2,
    rfqGroupName: '2026年度内視鏡システム更新',
    attachedFileName: '内視鏡_見積書_オリンパス.pdf',
    applicantId: 'user-admin-001',
    applicantName: '佐藤 美智子',
    quotationPhase: '概算見積',
    saveFormat: '電子取引',
    vendorName: 'オリンパスメディカル',
    registrationDeadline: '2026-06-15',
    status: '依頼中',
  },
  {
    id: 'spq-003',
    requestNo: 'SPQ-20260602-0001',
    requestedAt: '2026-06-02T09:15:00',
    hospitalId: 'hosp-yokohama',
    hospitalName: '横浜総合病院',
    rfqGroupId: 3,
    rfqGroupName: 'リハビリ機器導入',
    attachedFileName: 'リハビリ機器_一括見積.pdf',
    applicantId: 'user-admin-002',
    applicantName: '田中 一郎',
    quotationPhase: '定価見積',
    saveFormat: '電子取引',
    vendorName: 'パラマウントベッド',
    registrationDeadline: '2026-06-20',
    status: '依頼中',
  },
  {
    id: 'spq-004',
    requestNo: 'SPQ-20260528-0001',
    requestedAt: '2026-05-28T11:00:00',
    hospitalId: 'hosp-tokyo',
    hospitalName: '東京中央病院',
    rfqGroupId: 4,
    rfqGroupName: '保管庫増設',
    attachedFileName: '保管庫_パナソニック_見積.pdf',
    applicantId: 'user-admin-001',
    applicantName: '佐藤 美智子',
    quotationPhase: '概算見積',
    saveFormat: '電子取引',
    vendorName: 'パナソニックヘルスケア',
    registrationDeadline: '2026-06-08',
    status: 'SHIP作業中',
    shipUserName: 'SHIP代理 山田',
  },
  {
    id: 'spq-005',
    requestNo: 'SPQ-20260529-0001',
    requestedAt: '2026-05-29T15:00:00',
    hospitalId: 'hosp-yokohama',
    hospitalName: '横浜総合病院',
    rfqGroupId: 5,
    rfqGroupName: 'X線撮影装置',
    attachedFileName: 'X線_見積.pdf',
    applicantId: 'user-admin-002',
    applicantName: '田中 一郎',
    quotationPhase: '発注登録用見積',
    saveFormat: '電子取引',
    vendorName: '富士フイルムメディカル',
    registrationDeadline: '2026-06-12',
    status: 'SHIP作業中',
    shipUserName: 'SHIP代理 鈴木',
  },
  {
    id: 'spq-006',
    requestNo: 'SPQ-20260525-0001',
    requestedAt: '2026-05-25T10:00:00',
    hospitalId: 'hosp-tokyo',
    hospitalName: '東京中央病院',
    rfqGroupId: 6,
    rfqGroupName: '心電計更新',
    attachedFileName: '心電計_見積.pdf',
    applicantId: 'user-admin-001',
    applicantName: '佐藤 美智子',
    quotationPhase: '発注登録用見積',
    saveFormat: '電子取引',
    vendorName: '日本光電',
    registrationDeadline: '2026-06-05',
    status: '完了',
    shipUserName: 'SHIP代理 山田',
    completedAt: '2026-05-29T16:30:00',
    quotationDbId: 'qdb-2026-001',
  },
  {
    id: 'spq-007',
    requestNo: 'SPQ-20260520-0001',
    requestedAt: '2026-05-20T14:00:00',
    hospitalId: 'hosp-yokohama',
    hospitalName: '横浜総合病院',
    rfqGroupId: 7,
    rfqGroupName: '輸液ポンプ追加',
    attachedFileName: '輸液ポンプ_テルモ.pdf',
    applicantId: 'user-admin-002',
    applicantName: '田中 一郎',
    quotationPhase: '定価見積',
    saveFormat: '電子取引',
    vendorName: 'テルモ',
    registrationDeadline: '2026-05-30',
    status: '完了',
    shipUserName: 'SHIP代理 鈴木',
    completedAt: '2026-05-25T11:00:00',
    quotationDbId: 'qdb-2026-002',
  },
  {
    id: 'spq-008',
    requestNo: 'SPQ-20260526-0001',
    requestedAt: '2026-05-26T16:00:00',
    hospitalId: 'hosp-tokyo',
    hospitalName: '東京中央病院',
    rfqGroupId: 8,
    rfqGroupName: 'ベッドサイドモニター',
    attachedFileName: 'BSM_見積_不明.pdf',
    applicantId: 'user-admin-001',
    applicantName: '佐藤 美智子',
    quotationPhase: '概算見積',
    saveFormat: '電子取引',
    registrationDeadline: '2026-06-10',
    status: '差戻',
    shipUserName: 'SHIP代理 山田',
    rejectReason: '添付ファイルの品目情報が読み取り不能。鮮明な見積書を再アップロードしてください。',
  },
];

export const useShipProxyQuotationStore = create<ShipProxyQuotationStore>((set, get) => ({
  requests: initialRequests,

  addRequest: (input) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const count = get().requests.filter((r) => r.requestNo.includes(dateStr)).length + 1;
    const newRequest: ShipProxyQuotation = {
      ...input,
      id: `spq-${Date.now()}`,
      requestNo: `SPQ-${dateStr}-${String(count).padStart(4, '0')}`,
      requestedAt: now.toISOString(),
      status: '依頼中',
    };
    set((state) => ({ requests: [...state.requests, newRequest] }));
    return newRequest;
  },

  updateStatus: (id, status, updates) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, ...updates, status } : r,
      ),
    }));
  },

  getByStatus: (status) => get().requests.filter((r) => r.status === status),

  getByHospital: (hospitalId) => get().requests.filter((r) => r.hospitalId === hospitalId),
}));
