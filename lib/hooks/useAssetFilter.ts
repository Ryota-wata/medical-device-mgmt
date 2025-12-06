import { useState, useEffect, useMemo } from 'react';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';

interface AssetFilters {
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
}

export function useAssetFilter(initialAssets: Asset[]) {
  const { facilities } = useMasterStore();

  // フィルター状態
  const [filters, setFilters] = useState<AssetFilters>({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: ''
  });

  // フィルタリングされた資産
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssets);

  // 資産マスタからオプションを生成
  const { assets: assetMasters } = useMasterStore();

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean) as string[];
  }, [assetMasters]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean) as string[];
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean) as string[];
  }, [assetMasters]);

  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities]);

  // フィルターの適用
  useEffect(() => {
    let filtered = initialAssets;

    if (filters.building) {
      filtered = filtered.filter(asset => asset.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(asset => asset.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(asset => asset.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(asset => asset.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(asset => asset.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(asset => asset.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(asset => asset.mediumClass === filters.mediumClass);
    }

    setFilteredAssets(filtered);
  }, [filters, initialAssets]);

  return {
    filters,
    setFilters,
    filteredAssets,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
  };
}
