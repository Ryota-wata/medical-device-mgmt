/**
 * データ突合画面のフィルター機能を提供するカスタムフック
 */

import { useMemo, useState } from 'react';
import { SurveyData, DataMatchingFilters } from '@/lib/types/data-matching';
import { FACILITY_CONSTANTS } from '@/lib/types/facility';

interface UseDataMatchingFiltersProps {
  data: SurveyData[];
}

interface UseDataMatchingFiltersReturn {
  filters: DataMatchingFilters;
  setFilters: React.Dispatch<React.SetStateAction<DataMatchingFilters>>;
  filteredData: SurveyData[];
  departmentOptions: string[];
  sectionOptions: string[];
  categoryOptions: string[];
  majorCategoryOptions: string[];
  middleCategoryOptions: string[];
  resetFilters: () => void;
}

/**
 * データ突合画面のフィルター機能を提供
 *
 * @param data - フィルタリング対象の調査データ
 * @returns フィルター状態、設定関数、フィルタリング済みデータ、各種オプション
 */
export function useDataMatchingFilters({
  data
}: UseDataMatchingFiltersProps): UseDataMatchingFiltersReturn {
  const [filters, setFilters] = useState<DataMatchingFilters>({
    category: '',
    department: '',
    section: '',
    majorCategory: '',
    middleCategory: '',
    matchingStatus: '全て',
    keyword: ''
  });

  // 部門オプション（施設マスタから取得）
  const departmentOptions = useMemo(() => [...FACILITY_CONSTANTS.divisions], []);

  // 部署オプション（選択された部門に応じて動的に生成）
  const sectionOptions = useMemo(() => {
    if (!filters.department) return [];
    const sections = FACILITY_CONSTANTS.sectionsByDivision[filters.department as keyof typeof FACILITY_CONSTANTS.sectionsByDivision];
    return sections ? [...sections] : [];
  }, [filters.department]);

  // カテゴリオプション（データから一意の値を抽出）
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(data.map(d => d.category)));
    return uniqueCategories.filter(Boolean);
  }, [data]);

  // 大分類オプション（データから一意の値を抽出）
  const majorCategoryOptions = useMemo(() => {
    const uniqueMajorCategories = Array.from(new Set(data.map(d => d.majorCategory)));
    return uniqueMajorCategories.filter(Boolean);
  }, [data]);

  // 中分類オプション（データから一意の値を抽出）
  const middleCategoryOptions = useMemo(() => {
    const uniqueMiddleCategories = Array.from(new Set(data.map(d => d.middleCategory)));
    return uniqueMiddleCategories.filter(Boolean);
  }, [data]);

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    let filtered = data;

    // 部門フィルター
    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }

    // 部署フィルター
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }

    // カテゴリフィルター
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }

    // 大分類フィルター
    if (filters.majorCategory) {
      filtered = filtered.filter(d => d.majorCategory === filters.majorCategory);
    }

    // 中分類フィルター
    if (filters.middleCategory) {
      filtered = filtered.filter(d => d.middleCategory === filters.middleCategory);
    }

    // 突合状況フィルター
    if (filters.matchingStatus && filters.matchingStatus !== '全て') {
      filtered = filtered.filter(d => d.matchingStatus === filters.matchingStatus);
    }

    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.qrCode?.toLowerCase().includes(keyword) ||
        d.assetNo?.toLowerCase().includes(keyword) ||
        d.item?.toLowerCase().includes(keyword) ||
        d.manufacturer?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword) ||
        d.memo?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [data, filters]);

  // フィルターをリセット
  const resetFilters = () => {
    setFilters({
      category: '',
      department: '',
      section: '',
      majorCategory: '',
      middleCategory: '',
      matchingStatus: '全て',
      keyword: ''
    });
  };

  return {
    filters,
    setFilters,
    filteredData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    majorCategoryOptions,
    middleCategoryOptions,
    resetFilters
  };
}
