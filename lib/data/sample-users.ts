import { User } from '@/lib/types/user';

// ロール概念は撤廃 (2026-06-03)。role は型互換のため "system_admin" 固定 (UI では参照しない)。
// SHIPユーザー (= hospital 未設定) は コンサルユーザー。accessibleFacilities が担当施設（明示列挙）。
//   - API/DB 整合 (2026-07-06): 通常アカウントに「全施設」概念は持たせない（全施設利用は SYSTEM_ADMIN 領分）。
//     担当施設は施設マスタから明示選択し、そのうち1つを defaultFacility（既定施設 = users.facility_id 相当）とする。
const LEGACY_ROLE = 'system_admin' as const;

/**
 * ユーザー初期サンプル。
 * user-management 画面 (病院ユーザー中心) と ship-user-management 画面 (SHIPコンサル) の
 * 双方が同じ初期データを参照できるよう共通化 (直接遷移時の空表示を防ぐ)。
 */
export const SAMPLE_USERS: User[] = [
  // ── SHIP (コンサル) ユーザー: hospital 未設定 ──
  {
    id: 'U001',
    username: '管理者太郎',
    email: 'admin@ship.com',
    hospital: undefined,
    role: LEGACY_ROLE,
    department: '情報システム部', // 所属部門
    section: '基盤課', // 所属部署
    position: '部長',
    contactPerson: '管理者太郎',
    phone: '03-0000-0001',
    accessibleFacilities: ['東京総合病院', '横浜医療センター', '大阪クリニック'],
    defaultFacility: '東京総合病院',
    isActive: true,
    lastLoginAt: '2026-06-30T09:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'U002',
    username: '佐々木コンサル',
    email: 'consultant-sasaki@ship.com',
    hospital: undefined,
    role: LEGACY_ROLE,
    department: 'コンサルティング部', // 所属部門
    section: '第一課', // 所属部署
    position: 'シニアコンサルタント',
    contactPerson: '佐々木コンサル',
    phone: '03-0000-0002',
    accessibleFacilities: ['東京総合病院', '名古屋中央病院'],
    defaultFacility: '名古屋中央病院',
    isActive: true,
    lastLoginAt: '2026-06-28T10:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'U003',
    username: '山本コンサル',
    email: 'consultant-yamamoto@ship.com',
    hospital: undefined,
    role: LEGACY_ROLE,
    department: 'コンサルティング部', // 所属部門
    section: '第二課', // 所属部署
    position: 'コンサルタント',
    contactPerson: '山本コンサル',
    phone: '03-0000-0003',
    accessibleFacilities: ['横浜医療センター'],
    defaultFacility: '横浜医療センター',
    isActive: true,
    lastLoginAt: undefined, // 未利用（初回設定案内の送信対象）
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  // ── 病院ユーザー: hospital 設定あり ──
  {
    id: 'U004',
    username: '佐藤美智子',
    email: 'hospital-admin@hospital.com',
    hospital: '東京中央病院',
    role: LEGACY_ROLE,
    department: '医事課',
    position: '課長',
    contactPerson: '佐藤美智子',
    phone: '03-1234-5678',
    accessibleFacilities: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'U005',
    username: '高橋健二',
    email: 'hospital-office@hospital.com',
    hospital: '東京中央病院',
    role: LEGACY_ROLE,
    department: '医事課',
    position: '主任',
    contactPerson: '高橋健二',
    phone: '03-1234-5679',
    accessibleFacilities: [],
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'U006',
    username: '田中花子',
    email: 'hospital-me@hospital.com',
    hospital: '東京中央病院',
    role: LEGACY_ROLE,
    department: 'ME室',
    position: '臨床工学技士',
    contactPerson: '田中花子',
    phone: '03-1234-5680',
    accessibleFacilities: [],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];
