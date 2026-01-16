import { useState, useEffect } from 'react';
import { Asset } from '@/lib/types';
import type { ColumnDef } from '@/lib/constants/assetColumns';

export function useAssetTable(columns: ColumnDef[]) {
  // カラム表示状態
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.key] = col.defaultVisible ?? false;
    });
    return initial;
  });

  // カラム幅の状態管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = { checkbox: 50 };
    columns.forEach((col) => {
      initial[col.key] = parseInt(col.width || '150');
    });
    return initial;
  });

  // リサイズ中の状態管理
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // カラム表示切り替え
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 全選択
  const handleSelectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    columns.forEach((col) => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
  };

  // 全解除
  const handleDeselectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    columns.forEach((col) => {
      newState[col.key] = false;
    });
    setVisibleColumns(newState);
  };

  // カラムリサイズのハンドラー
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  // リサイズ処理
  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // セルの値を取得
  const getCellValue = (asset: Asset, key: string): any => {
    if (key === 'acquisitionCost' && asset.acquisitionCost) {
      return `¥${asset.acquisitionCost.toLocaleString()}`;
    }
    if (key === 'rfqAmount' && (asset as any).rfqAmount) {
      const amount = (asset as any).rfqAmount;
      if (typeof amount === 'number') {
        return `¥${amount.toLocaleString()}`;
      }
      return amount;
    }
    return (asset as any)[key] ?? '-';
  };

  return {
    visibleColumns,
    setVisibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  };
}
