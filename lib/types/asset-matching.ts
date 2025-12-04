/**
 * 資産マスタとの突き合わせ画面の型定義
 */

export interface AIRecommendation {
  major: string;
  middle: string;
  item: string;
  manufacturer: string;
  model: string;
}

export interface MatchingData {
  id: number;
  fixedAssetNo: string;
  managementDeviceNo: string;
  department: string;
  section: string;
  roomName: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer: string;
  model: string;
  quantityUnit: string;
  inspectionDate: string;
  aiRecommendation: AIRecommendation;
  aiApplied: boolean;
  status: 'pending' | 'completed';
}

export interface AssetMatchingFilters {
  department: string;
  section: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
}
