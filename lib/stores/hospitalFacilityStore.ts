import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HospitalFacilityMaster,
  HospitalFacilityStatus,
  HospitalInfo,
  FacilityMapping,
  CurrentLocationKey,
} from '@/lib/types/hospitalFacility';

// 全20病院の初期サンプルデータ
const initialHospitalFacilities: HospitalFacilityMaster[] = [
  // 東京総合病院 (FAC001)
  { id: 'HF00001', hospitalId: 'FAC001', hospitalName: '東京総合病院', currentBuilding: '本館', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '総合受付', newBuilding: '新本館', newFloor: '1F', newDepartment: '外来部門', newSection: '総合受付A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00002', hospitalId: 'FAC001', hospitalName: '東京総合病院', currentBuilding: '本館', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '内科外来', newBuilding: '新本館', newFloor: '2F', newDepartment: '外来部門', newSection: '内科外来A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00003', hospitalId: 'FAC001', hospitalName: '東京総合病院', currentBuilding: '本館', currentFloor: '3F', currentDepartment: '病棟部門', currentSection: '3階病棟', newBuilding: '新本館', newFloor: '3F', newDepartment: '病棟部門', newSection: '3階病棟A', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00004', hospitalId: 'FAC001', hospitalName: '東京総合病院', currentBuilding: '別館', currentFloor: '1F', currentDepartment: '検査部門', currentSection: '臨床検査室', newBuilding: '新別館', newFloor: '1F', newDepartment: '検査部門', newSection: '臨床検査室A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00005', hospitalId: 'FAC001', hospitalName: '東京総合病院', currentBuilding: '別館', currentFloor: '2F', currentDepartment: '手術部門', currentSection: '手術室1', newBuilding: '新別館', newFloor: '2F', newDepartment: '手術部門', newSection: '手術室A', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 横浜医療センター (FAC002)
  { id: 'HF00006', hospitalId: 'FAC002', hospitalName: '横浜医療センター', currentBuilding: 'A棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '正面玄関', newBuilding: '新A棟', newFloor: '1F', newDepartment: '外来部門', newSection: 'メインエントランス', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00007', hospitalId: 'FAC002', hospitalName: '横浜医療センター', currentBuilding: 'A棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '外科外来', newBuilding: '新A棟', newFloor: '2F', newDepartment: '外来部門', newSection: '外科外来A', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00008', hospitalId: 'FAC002', hospitalName: '横浜医療センター', currentBuilding: 'B棟', currentFloor: '1F', currentDepartment: '救急部門', currentSection: '救急外来', newBuilding: '新B棟', newFloor: '1F', newDepartment: '救急部門', newSection: '救急センター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00009', hospitalId: 'FAC002', hospitalName: '横浜医療センター', currentBuilding: 'B棟', currentFloor: '3F', currentDepartment: '病棟部門', currentSection: 'ICU', newBuilding: '新B棟', newFloor: '3F', newDepartment: '集中治療部門', newSection: 'ICU-A', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 大阪クリニック (FAC003)
  { id: 'HF00010', hospitalId: 'FAC003', hospitalName: '大阪クリニック', currentBuilding: '診療棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '受付', newBuilding: '新診療棟', newFloor: '1F', newDepartment: '外来部門', newSection: '総合受付', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00011', hospitalId: 'FAC003', hospitalName: '大阪クリニック', currentBuilding: '診療棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '診察室1', newBuilding: '新診療棟', newFloor: '2F', newDepartment: '外来部門', newSection: '診察室A', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00012', hospitalId: 'FAC003', hospitalName: '大阪クリニック', currentBuilding: '検査棟', currentFloor: '1F', currentDepartment: '検査部門', currentSection: 'CT室', newBuilding: '新検査棟', newFloor: '1F', newDepartment: '画像診断部門', newSection: 'CT室A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 名古屋中央病院 (FAC004)
  { id: 'HF00013', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', currentBuilding: '中央棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: 'ロビー', newBuilding: '新中央棟', newFloor: '1F', newDepartment: '外来部門', newSection: 'メインロビー', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00014', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', currentBuilding: '中央棟', currentFloor: '4F', currentDepartment: '病棟部門', currentSection: '4階病棟', newBuilding: '新中央棟', newFloor: '4F', newDepartment: '病棟部門', newSection: '4階一般病棟', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00015', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', currentBuilding: '東棟', currentFloor: '2F', currentDepartment: '手術部門', currentSection: '手術室2', newBuilding: '新東棟', newFloor: '2F', newDepartment: '手術部門', newSection: '手術室B', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 福岡市民病院 (FAC005)
  { id: 'HF00016', hospitalId: 'FAC005', hospitalName: '福岡市民病院', currentBuilding: '南館', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '総合案内', newBuilding: '新南館', newFloor: '1F', newDepartment: '外来部門', newSection: '総合案内センター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00017', hospitalId: 'FAC005', hospitalName: '福岡市民病院', currentBuilding: '南館', currentFloor: '3F', currentDepartment: '病棟部門', currentSection: '小児科病棟', newBuilding: '新南館', newFloor: '3F', newDepartment: '病棟部門', newSection: '小児センター', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00018', hospitalId: 'FAC005', hospitalName: '福岡市民病院', currentBuilding: '北館', currentFloor: '1F', currentDepartment: 'リハビリ部門', currentSection: 'リハビリ室', newBuilding: '新北館', newFloor: '1F', newDepartment: 'リハビリ部門', newSection: 'リハビリセンター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 札幌記念病院 (FAC006)
  { id: 'HF00019', hospitalId: 'FAC006', hospitalName: '札幌記念病院', currentBuilding: '本館', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '外来受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00020', hospitalId: 'FAC006', hospitalName: '札幌記念病院', currentBuilding: '本館', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '整形外科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00021', hospitalId: 'FAC006', hospitalName: '札幌記念病院', currentBuilding: '西館', currentFloor: 'B1F', currentDepartment: '検査部門', currentSection: 'MRI室', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 仙台総合医療センター (FAC007)
  { id: 'HF00022', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', currentBuilding: '外来棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: 'エントランス', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00023', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', currentBuilding: '外来棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '眼科外来', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00024', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', currentBuilding: '入院棟', currentFloor: '5F', currentDepartment: '病棟部門', currentSection: '5階病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 神戸中央クリニック (FAC008)
  { id: 'HF00025', hospitalId: 'FAC008', hospitalName: '神戸中央クリニック', currentBuilding: 'クリニック棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '待合室', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00026', hospitalId: 'FAC008', hospitalName: '神戸中央クリニック', currentBuilding: 'クリニック棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '皮膚科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 京都大学病院 (FAC009)
  { id: 'HF00027', hospitalId: 'FAC009', hospitalName: '京都大学病院', currentBuilding: '中央診療棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '初診受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00028', hospitalId: 'FAC009', hospitalName: '京都大学病院', currentBuilding: '中央診療棟', currentFloor: '3F', currentDepartment: '外来部門', currentSection: '神経内科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00029', hospitalId: 'FAC009', hospitalName: '京都大学病院', currentBuilding: '研究棟', currentFloor: '2F', currentDepartment: '研究部門', currentSection: '臨床研究室', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 広島県立病院 (FAC010)
  { id: 'HF00030', hospitalId: 'FAC010', hospitalName: '広島県立病院', currentBuilding: '1号館', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '会計窓口', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00031', hospitalId: 'FAC010', hospitalName: '広島県立病院', currentBuilding: '1号館', currentFloor: '4F', currentDepartment: '病棟部門', currentSection: '産婦人科病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00032', hospitalId: 'FAC010', hospitalName: '広島県立病院', currentBuilding: '2号館', currentFloor: '1F', currentDepartment: '薬剤部門', currentSection: '薬局', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 千葉メディカルセンター (FAC011)
  { id: 'HF00033', hospitalId: 'FAC011', hospitalName: '千葉メディカルセンター', currentBuilding: 'メイン棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '救急受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00034', hospitalId: 'FAC011', hospitalName: '千葉メディカルセンター', currentBuilding: 'メイン棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '循環器内科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 埼玉協同病院 (FAC012)
  { id: 'HF00035', hospitalId: 'FAC012', hospitalName: '埼玉協同病院', currentBuilding: '東館', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '正面受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00036', hospitalId: 'FAC012', hospitalName: '埼玉協同病院', currentBuilding: '東館', currentFloor: '3F', currentDepartment: '病棟部門', currentSection: '透析センター', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 静岡県総合病院 (FAC013)
  { id: 'HF00037', hospitalId: 'FAC013', hospitalName: '静岡県総合病院', currentBuilding: '管理棟', currentFloor: '1F', currentDepartment: '管理部門', currentSection: '事務局', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00038', hospitalId: 'FAC013', hospitalName: '静岡県総合病院', currentBuilding: '診療棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '耳鼻咽喉科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 岡山中央医療センター (FAC014)
  { id: 'HF00039', hospitalId: 'FAC014', hospitalName: '岡山中央医療センター', currentBuilding: '本棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '予約受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00040', hospitalId: 'FAC014', hospitalName: '岡山中央医療センター', currentBuilding: '本棟', currentFloor: '5F', currentDepartment: '病棟部門', currentSection: '緩和ケア病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 熊本赤十字病院 (FAC015)
  { id: 'HF00041', hospitalId: 'FAC015', hospitalName: '熊本赤十字病院', currentBuilding: '赤十字棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '献血ルーム', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00042', hospitalId: 'FAC015', hospitalName: '熊本赤十字病院', currentBuilding: '赤十字棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '血液内科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 鹿児島市立病院 (FAC016)
  { id: 'HF00043', hospitalId: 'FAC016', hospitalName: '鹿児島市立病院', currentBuilding: '市立棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '市民相談窓口', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00044', hospitalId: 'FAC016', hospitalName: '鹿児島市立病院', currentBuilding: '市立棟', currentFloor: '6F', currentDepartment: '病棟部門', currentSection: '回復期リハ病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 新潟大学医歯学総合病院 (FAC017)
  { id: 'HF00045', hospitalId: 'FAC017', hospitalName: '新潟大学医歯学総合病院', currentBuilding: '医学部棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '初再診受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00046', hospitalId: 'FAC017', hospitalName: '新潟大学医歯学総合病院', currentBuilding: '歯学部棟', currentFloor: '2F', currentDepartment: '歯科部門', currentSection: '歯科診療室', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 金沢医療センター (FAC018)
  { id: 'HF00047', hospitalId: 'FAC018', hospitalName: '金沢医療センター', currentBuilding: '北陸棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '外来ホール', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00048', hospitalId: 'FAC018', hospitalName: '金沢医療センター', currentBuilding: '北陸棟', currentFloor: '3F', currentDepartment: '病棟部門', currentSection: '整形外科病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 長野県立こども病院 (FAC019)
  { id: 'HF00049', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', currentBuilding: 'こども棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: 'プレイルーム', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00050', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', currentBuilding: 'こども棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '小児外科', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00051', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', currentBuilding: 'NICU棟', currentFloor: '3F', currentDepartment: '集中治療部門', currentSection: 'NICU', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 沖縄総合病院 (FAC020)
  { id: 'HF00052', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', currentBuilding: '琉球棟', currentFloor: '1F', currentDepartment: '外来部門', currentSection: '総合受付', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00053', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', currentBuilding: '琉球棟', currentFloor: '2F', currentDepartment: '外来部門', currentSection: '内視鏡センター', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00054', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', currentBuilding: '海風棟', currentFloor: '4F', currentDepartment: '病棟部門', currentSection: '療養病棟', newBuilding: '', newFloor: '', newDepartment: '', newSection: '', status: 'pending' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

interface HospitalFacilityState {
  // 病院リスト
  hospitals: HospitalInfo[];
  // 個別施設マスタ
  facilities: HospitalFacilityMaster[];

  // 病院操作
  setHospitals: (hospitals: HospitalInfo[]) => void;
  addHospital: (hospital: HospitalInfo) => void;
  updateHospital: (id: string, updates: Partial<HospitalInfo>) => void;
  deleteHospital: (id: string) => void;
  getHospitalById: (id: string) => HospitalInfo | undefined;

  // 施設マスタ操作
  setFacilities: (facilities: HospitalFacilityMaster[]) => void;
  addFacility: (facility: HospitalFacilityMaster) => void;
  updateFacility: (id: string, updates: Partial<HospitalFacilityMaster>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => HospitalFacilityMaster | undefined;

  // 検索・フィルター
  getFacilitiesByHospitalId: (hospitalId: string) => HospitalFacilityMaster[];
  searchFacilities: (hospitalId: string, query: string) => HospitalFacilityMaster[];

  // マッピング機能
  getMappingByCurrentLocation: (key: CurrentLocationKey) => FacilityMapping | undefined;
  getNewLocationByCurrentLocation: (key: CurrentLocationKey) => { building: string; floor: string; department: string; section: string } | undefined;

  // リモデル完了処理
  completeRemodel: (hospitalId: string, facilityIds: string[]) => void;
  swapToNewLocation: (facilityId: string) => void;

  // 統計
  getHospitalStats: (hospitalId: string) => { total: number; mapped: number; completed: number };

  // ID生成
  generateFacilityId: () => string;
  generateHospitalId: () => string;
}

export const useHospitalFacilityStore = create<HospitalFacilityState>()(
  persist(
    (set, get) => ({
      hospitals: [],
      facilities: initialHospitalFacilities,

      // 病院操作
      setHospitals: (hospitals) => set({ hospitals }),

      addHospital: (hospital) => set((state) => ({
        hospitals: [...state.hospitals, hospital]
      })),

      updateHospital: (id, updates) => set((state) => ({
        hospitals: state.hospitals.map((h) =>
          h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
        )
      })),

      deleteHospital: (id) => set((state) => ({
        hospitals: state.hospitals.filter((h) => h.id !== id),
        facilities: state.facilities.filter((f) => f.hospitalId !== id)
      })),

      getHospitalById: (id) => get().hospitals.find((h) => h.id === id),

      // 施設マスタ操作
      setFacilities: (facilities) => set({ facilities }),

      addFacility: (facility) => set((state) => ({
        facilities: [...state.facilities, facility]
      })),

      updateFacility: (id, updates) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        )
      })),

      deleteFacility: (id) => set((state) => ({
        facilities: state.facilities.filter((f) => f.id !== id)
      })),

      getFacilityById: (id) => get().facilities.find((f) => f.id === id),

      // 検索・フィルター
      getFacilitiesByHospitalId: (hospitalId) =>
        get().facilities.filter((f) => f.hospitalId === hospitalId),

      searchFacilities: (hospitalId, query) => {
        const lowerQuery = query.toLowerCase();
        return get().facilities.filter((f) =>
          f.hospitalId === hospitalId &&
          (f.currentBuilding.toLowerCase().includes(lowerQuery) ||
           f.currentFloor.toLowerCase().includes(lowerQuery) ||
           f.currentDepartment.toLowerCase().includes(lowerQuery) ||
           f.currentSection.toLowerCase().includes(lowerQuery) ||
           f.newBuilding.toLowerCase().includes(lowerQuery) ||
           f.newFloor.toLowerCase().includes(lowerQuery) ||
           f.newDepartment.toLowerCase().includes(lowerQuery) ||
           f.newSection.toLowerCase().includes(lowerQuery))
        );
      },

      // マッピング機能
      getMappingByCurrentLocation: (key) => {
        const facility = get().facilities.find((f) =>
          f.hospitalId === key.hospitalId &&
          f.currentBuilding === key.building &&
          f.currentFloor === key.floor &&
          f.currentDepartment === key.department &&
          f.currentSection === key.section
        );
        if (!facility) return undefined;
        return {
          currentLocation: {
            building: facility.currentBuilding,
            floor: facility.currentFloor,
            department: facility.currentDepartment,
            section: facility.currentSection,
          },
          newLocation: {
            building: facility.newBuilding,
            floor: facility.newFloor,
            department: facility.newDepartment,
            section: facility.newSection,
          },
        };
      },

      getNewLocationByCurrentLocation: (key) => {
        const mapping = get().getMappingByCurrentLocation(key);
        return mapping?.newLocation;
      },

      // リモデル完了処理
      completeRemodel: (hospitalId, facilityIds) => {
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.hospitalId === hospitalId && facilityIds.includes(f.id)
              ? { ...f, status: 'completed' as HospitalFacilityStatus, updatedAt: new Date().toISOString() }
              : f
          )
        }));
        // 病院のステータス更新
        const stats = get().getHospitalStats(hospitalId);
        if (stats.total === stats.completed) {
          get().updateHospital(hospitalId, { remodelStatus: 'completed' });
        }
      },

      // 新居→現状への切り替え（単一施設）
      swapToNewLocation: (facilityId) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === facilityId
            ? {
                ...f,
                currentBuilding: f.newBuilding,
                currentFloor: f.newFloor,
                currentDepartment: f.newDepartment,
                currentSection: f.newSection,
                newBuilding: '',
                newFloor: '',
                newDepartment: '',
                newSection: '',
                status: 'completed' as HospitalFacilityStatus,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      })),

      // 統計
      getHospitalStats: (hospitalId) => {
        const facilities = get().getFacilitiesByHospitalId(hospitalId);
        return {
          total: facilities.length,
          mapped: facilities.filter((f) => f.status === 'mapped' || f.status === 'completed').length,
          completed: facilities.filter((f) => f.status === 'completed').length,
        };
      },

      // ID生成
      generateFacilityId: () => {
        const facilities = get().facilities;
        const maxId = facilities.reduce((max, f) => {
          const num = parseInt(f.id.replace('HF', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HF${String(maxId + 1).padStart(5, '0')}`;
      },

      generateHospitalId: () => {
        const hospitals = get().hospitals;
        const maxId = hospitals.reduce((max, h) => {
          const num = parseInt(h.id.replace('HOSP', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HOSP${String(maxId + 1).padStart(3, '0')}`;
      },
    }),
    {
      name: 'hospital-facility-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<HospitalFacilityState>;
        // 既存データが空、存在しない、またはcurrentBuildingが無いデータがある場合は初期データを使用
        const hasValidData = persisted.facilities &&
          persisted.facilities.length > 0 &&
          persisted.facilities.every(f => f.currentBuilding && f.currentSection);
        return {
          ...currentState,
          ...persisted,
          facilities: hasValidData ? persisted.facilities! : initialHospitalFacilities,
        };
      },
    }
  )
);
