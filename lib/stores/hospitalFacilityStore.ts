import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HospitalFacilityMaster,
  HospitalFacilityStatus,
  HospitalInfo,
  FacilityMapping,
  CurrentLocationKey,
} from '@/lib/types/hospitalFacility';

// 全20病院の初期サンプルデータ（新フィールド構造）
const initialHospitalFacilities: HospitalFacilityMaster[] = [
  // 東京総合病院 (FAC001)
  { id: 'HF00001', hospitalId: 'FAC001', hospitalName: '東京総合病院', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '総合受付', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '1F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '総合受付A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00002', hospitalId: 'FAC001', hospitalName: '東京総合病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '内科外来', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '2F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '内科外来A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00003', hospitalId: 'FAC001', hospitalName: '東京総合病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '3F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '3階病棟', newShipDivision: '看護部門', newShipDepartment: '病棟', newShipRoomCategory: '一般病棟', newFloor: '3F', newDepartment: '病棟部門', newSection: '病棟部門', newRoomName: '3階病棟A', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00004', hospitalId: 'FAC001', hospitalName: '東京総合病院', oldShipDivision: '検査部門', oldShipDepartment: '検査科', oldShipRoomCategory: '検体検査室', oldFloor: '1F', oldDepartment: '検査部門', oldSection: '検査部門', oldRoomName: '臨床検査室', newShipDivision: '検査部門', newShipDepartment: '検査科', newShipRoomCategory: '検体検査室', newFloor: '1F', newDepartment: '検査部門', newSection: '検査部門', newRoomName: '臨床検査室A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00005', hospitalId: 'FAC001', hospitalName: '東京総合病院', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '2F', oldDepartment: '手術部門', oldSection: '手術部門', oldRoomName: '手術室1', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '2F', newDepartment: '手術部門', newSection: '手術部門', newRoomName: '手術室A', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 横浜医療センター (FAC002)
  { id: 'HF00006', hospitalId: 'FAC002', hospitalName: '横浜医療センター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '正面玄関', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '1F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: 'メインエントランス', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00007', hospitalId: 'FAC002', hospitalName: '横浜医療センター', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '外科外来', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '2F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '外科外来A', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00008', hospitalId: 'FAC002', hospitalName: '横浜医療センター', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '1F', oldDepartment: '救急部門', oldSection: '救急部門', oldRoomName: '救急外来', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '1F', newDepartment: '救急部門', newSection: '救急部門', newRoomName: '救急センター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00009', hospitalId: 'FAC002', hospitalName: '横浜医療センター', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: 'ICU', oldFloor: '3F', oldDepartment: '病棟部門', oldSection: '集中治療部門', oldRoomName: 'ICU', newShipDivision: '看護部門', newShipDepartment: '病棟', newShipRoomCategory: 'ICU', newFloor: '3F', newDepartment: '集中治療部門', newSection: '集中治療部門', newRoomName: 'ICU-A', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 大阪クリニック (FAC003)
  { id: 'HF00010', hospitalId: 'FAC003', hospitalName: '大阪クリニック', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '受付', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '1F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '総合受付', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00011', hospitalId: 'FAC003', hospitalName: '大阪クリニック', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '診察室1', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '2F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '診察室A', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00012', hospitalId: 'FAC003', hospitalName: '大阪クリニック', oldShipDivision: '検査部門', oldShipDepartment: '放射線科', oldShipRoomCategory: 'CT室', oldFloor: '1F', oldDepartment: '検査部門', oldSection: '画像診断部門', oldRoomName: 'CT室', newShipDivision: '検査部門', newShipDepartment: '放射線科', newShipRoomCategory: 'CT室', newFloor: '1F', newDepartment: '画像診断部門', newSection: '画像診断部門', newRoomName: 'CT室A', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 名古屋中央病院 (FAC004)
  { id: 'HF00013', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: 'ロビー', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '1F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: 'メインロビー', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00014', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '4F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '4階病棟', newShipDivision: '看護部門', newShipDepartment: '病棟', newShipRoomCategory: '一般病棟', newFloor: '4F', newDepartment: '病棟部門', newSection: '病棟部門', newRoomName: '4階一般病棟', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00015', hospitalId: 'FAC004', hospitalName: '名古屋中央病院', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '2F', oldDepartment: '手術部門', oldSection: '手術部門', oldRoomName: '手術室2', newShipDivision: '診療部門', newShipDepartment: '外科', newShipRoomCategory: '手術室', newFloor: '2F', newDepartment: '手術部門', newSection: '手術部門', newRoomName: '手術室B', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 福岡市民病院 (FAC005)
  { id: 'HF00016', hospitalId: 'FAC005', hospitalName: '福岡市民病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '総合案内', newShipDivision: '診療部門', newShipDepartment: '内科', newShipRoomCategory: '診察室', newFloor: '1F', newDepartment: '外来部門', newSection: '外来部門', newRoomName: '総合案内センター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00017', hospitalId: 'FAC005', hospitalName: '福岡市民病院', oldShipDivision: '診療部門', oldShipDepartment: '小児科', oldShipRoomCategory: '診察室', oldFloor: '3F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '小児科病棟', newShipDivision: '診療部門', newShipDepartment: '小児科', newShipRoomCategory: '診察室', newFloor: '3F', newDepartment: '病棟部門', newSection: '病棟部門', newRoomName: '小児センター', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00018', hospitalId: 'FAC005', hospitalName: '福岡市民病院', oldShipDivision: 'リハビリ部門', oldShipDepartment: 'リハビリテーション科', oldShipRoomCategory: '理学療法室', oldFloor: '1F', oldDepartment: 'リハビリ部門', oldSection: 'リハビリ部門', oldRoomName: 'リハビリ室', newShipDivision: 'リハビリ部門', newShipDepartment: 'リハビリテーション科', newShipRoomCategory: '理学療法室', newFloor: '1F', newDepartment: 'リハビリ部門', newSection: 'リハビリ部門', newRoomName: 'リハビリセンター', status: 'mapped' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 札幌記念病院 (FAC006)
  { id: 'HF00019', hospitalId: 'FAC006', hospitalName: '札幌記念病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '外来受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00020', hospitalId: 'FAC006', hospitalName: '札幌記念病院', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '整形外科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00021', hospitalId: 'FAC006', hospitalName: '札幌記念病院', oldShipDivision: '検査部門', oldShipDepartment: '放射線科', oldShipRoomCategory: 'MRI室', oldFloor: 'B1F', oldDepartment: '検査部門', oldSection: '検査部門', oldRoomName: 'MRI室', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 仙台総合医療センター (FAC007)
  { id: 'HF00022', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: 'エントランス', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00023', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '眼科外来', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00024', hospitalId: 'FAC007', hospitalName: '仙台総合医療センター', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '5F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '5階病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 神戸中央クリニック (FAC008)
  { id: 'HF00025', hospitalId: 'FAC008', hospitalName: '神戸中央クリニック', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '待合室', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00026', hospitalId: 'FAC008', hospitalName: '神戸中央クリニック', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '皮膚科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 京都大学病院 (FAC009)
  { id: 'HF00027', hospitalId: 'FAC009', hospitalName: '京都大学病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '初診受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00028', hospitalId: 'FAC009', hospitalName: '京都大学病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '3F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '神経内科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00029', hospitalId: 'FAC009', hospitalName: '京都大学病院', oldShipDivision: '管理部門', oldShipDepartment: '事務局', oldShipRoomCategory: '事務室', oldFloor: '2F', oldDepartment: '研究部門', oldSection: '研究部門', oldRoomName: '臨床研究室', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 広島県立病院 (FAC010)
  { id: 'HF00030', hospitalId: 'FAC010', hospitalName: '広島県立病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '会計窓口', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00031', hospitalId: 'FAC010', hospitalName: '広島県立病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '4F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '産婦人科病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00032', hospitalId: 'FAC010', hospitalName: '広島県立病院', oldShipDivision: '管理部門', oldShipDepartment: '事務局', oldShipRoomCategory: '事務室', oldFloor: '1F', oldDepartment: '薬剤部門', oldSection: '薬剤部門', oldRoomName: '薬局', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 千葉メディカルセンター (FAC011)
  { id: 'HF00033', hospitalId: 'FAC011', hospitalName: '千葉メディカルセンター', oldShipDivision: '診療部門', oldShipDepartment: '外科', oldShipRoomCategory: '手術室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '救急受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00034', hospitalId: 'FAC011', hospitalName: '千葉メディカルセンター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '循環器内科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 埼玉協同病院 (FAC012)
  { id: 'HF00035', hospitalId: 'FAC012', hospitalName: '埼玉協同病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '正面受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00036', hospitalId: 'FAC012', hospitalName: '埼玉協同病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '3F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '透析センター', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 静岡県総合病院 (FAC013)
  { id: 'HF00037', hospitalId: 'FAC013', hospitalName: '静岡県総合病院', oldShipDivision: '管理部門', oldShipDepartment: '事務局', oldShipRoomCategory: '事務室', oldFloor: '1F', oldDepartment: '管理部門', oldSection: '管理部門', oldRoomName: '事務局', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00038', hospitalId: 'FAC013', hospitalName: '静岡県総合病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '耳鼻咽喉科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 岡山中央医療センター (FAC014)
  { id: 'HF00039', hospitalId: 'FAC014', hospitalName: '岡山中央医療センター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '予約受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00040', hospitalId: 'FAC014', hospitalName: '岡山中央医療センター', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '5F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '緩和ケア病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 熊本赤十字病院 (FAC015)
  { id: 'HF00041', hospitalId: 'FAC015', hospitalName: '熊本赤十字病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '献血ルーム', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00042', hospitalId: 'FAC015', hospitalName: '熊本赤十字病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '血液内科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 鹿児島市立病院 (FAC016)
  { id: 'HF00043', hospitalId: 'FAC016', hospitalName: '鹿児島市立病院', oldShipDivision: '管理部門', oldShipDepartment: '事務局', oldShipRoomCategory: '事務室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '市民相談窓口', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00044', hospitalId: 'FAC016', hospitalName: '鹿児島市立病院', oldShipDivision: 'リハビリ部門', oldShipDepartment: 'リハビリテーション科', oldShipRoomCategory: '理学療法室', oldFloor: '6F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '回復期リハ病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 新潟大学医歯学総合病院 (FAC017)
  { id: 'HF00045', hospitalId: 'FAC017', hospitalName: '新潟大学医歯学総合病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '初再診受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00046', hospitalId: 'FAC017', hospitalName: '新潟大学医歯学総合病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '歯科部門', oldSection: '歯科部門', oldRoomName: '歯科診療室', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 金沢医療センター (FAC018)
  { id: 'HF00047', hospitalId: 'FAC018', hospitalName: '金沢医療センター', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '外来ホール', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00048', hospitalId: 'FAC018', hospitalName: '金沢医療センター', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '3F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '整形外科病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 長野県立こども病院 (FAC019)
  { id: 'HF00049', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', oldShipDivision: '診療部門', oldShipDepartment: '小児科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: 'プレイルーム', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00050', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', oldShipDivision: '診療部門', oldShipDepartment: '小児科', oldShipRoomCategory: '診察室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '小児外科', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00051', hospitalId: 'FAC019', hospitalName: '長野県立こども病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: 'ICU', oldFloor: '3F', oldDepartment: '集中治療部門', oldSection: '集中治療部門', oldRoomName: 'NICU', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },

  // 沖縄総合病院 (FAC020)
  { id: 'HF00052', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', oldShipDivision: '診療部門', oldShipDepartment: '内科', oldShipRoomCategory: '診察室', oldFloor: '1F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '総合受付', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00053', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', oldShipDivision: '検査部門', oldShipDepartment: '検査科', oldShipRoomCategory: '検体検査室', oldFloor: '2F', oldDepartment: '外来部門', oldSection: '外来部門', oldRoomName: '内視鏡センター', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'HF00054', hospitalId: 'FAC020', hospitalName: '沖縄総合病院', oldShipDivision: '看護部門', oldShipDepartment: '病棟', oldShipRoomCategory: '一般病棟', oldFloor: '4F', oldDepartment: '病棟部門', oldSection: '病棟部門', oldRoomName: '療養病棟', newShipDivision: '', newShipDepartment: '', newShipRoomCategory: '', newFloor: '', newDepartment: '', newSection: '', newRoomName: '', status: 'draft' as HospitalFacilityStatus, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
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
  getNewLocationByCurrentLocation: (key: CurrentLocationKey) => { floor: string; department: string; section: string; roomName: string } | undefined;

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
          (f.oldShipDivision.toLowerCase().includes(lowerQuery) ||
           f.oldShipDepartment.toLowerCase().includes(lowerQuery) ||
           f.oldShipRoomCategory.toLowerCase().includes(lowerQuery) ||
           f.oldFloor.toLowerCase().includes(lowerQuery) ||
           f.oldDepartment.toLowerCase().includes(lowerQuery) ||
           f.oldSection.toLowerCase().includes(lowerQuery) ||
           f.oldRoomName.toLowerCase().includes(lowerQuery) ||
           f.newShipDivision.toLowerCase().includes(lowerQuery) ||
           f.newShipDepartment.toLowerCase().includes(lowerQuery) ||
           f.newShipRoomCategory.toLowerCase().includes(lowerQuery) ||
           f.newFloor.toLowerCase().includes(lowerQuery) ||
           f.newDepartment.toLowerCase().includes(lowerQuery) ||
           f.newSection.toLowerCase().includes(lowerQuery) ||
           f.newRoomName.toLowerCase().includes(lowerQuery))
        );
      },

      // マッピング機能
      getMappingByCurrentLocation: (key) => {
        const facility = get().facilities.find((f) =>
          f.hospitalId === key.hospitalId &&
          f.oldFloor === key.floor &&
          f.oldDepartment === key.department &&
          f.oldSection === key.section &&
          f.oldRoomName === key.roomName
        );
        if (!facility) return undefined;
        return {
          currentLocation: {
            shipDivision: facility.oldShipDivision,
            shipDepartment: facility.oldShipDepartment,
            shipRoomCategory: facility.oldShipRoomCategory,
            floor: facility.oldFloor,
            department: facility.oldDepartment,
            section: facility.oldSection,
            roomName: facility.oldRoomName,
          },
          newLocation: {
            shipDivision: facility.newShipDivision,
            shipDepartment: facility.newShipDepartment,
            shipRoomCategory: facility.newShipRoomCategory,
            floor: facility.newFloor,
            department: facility.newDepartment,
            section: facility.newSection,
            roomName: facility.newRoomName,
          },
        };
      },

      getNewLocationByCurrentLocation: (key) => {
        const mapping = get().getMappingByCurrentLocation(key);
        if (!mapping) return undefined;
        return {
          floor: mapping.newLocation.floor,
          department: mapping.newLocation.department,
          section: mapping.newLocation.section,
          roomName: mapping.newLocation.roomName,
        };
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
                oldShipDivision: f.newShipDivision,
                oldShipDepartment: f.newShipDepartment,
                oldShipRoomCategory: f.newShipRoomCategory,
                oldFloor: f.newFloor,
                oldDepartment: f.newDepartment,
                oldSection: f.newSection,
                oldRoomName: f.newRoomName,
                newShipDivision: '',
                newShipDepartment: '',
                newShipRoomCategory: '',
                newFloor: '',
                newDepartment: '',
                newSection: '',
                newRoomName: '',
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
        // 既存データが空、存在しない、またはoldFloorが無いデータがある場合は初期データを使用
        const hasValidData = persisted.facilities &&
          persisted.facilities.length > 0 &&
          persisted.facilities.every(f => f.oldFloor !== undefined && f.oldRoomName !== undefined);
        return {
          ...currentState,
          ...persisted,
          facilities: hasValidData ? persisted.facilities! : initialHospitalFacilities,
        };
      },
    }
  )
);
