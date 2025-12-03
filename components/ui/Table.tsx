'use client';

/**
 * 共通テーブルコンポーネント
 * Phase 1-2で作成したスタイル定数とフックを活用
 */

import React, { useState } from 'react';
import { tableStyle, tableCellStyle } from '@/lib/styles/helpers';
import { useTableRowHover } from '@/lib/hooks/useHover';
import { colors, spacing } from '@/lib/styles/constants';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T) => string | number);
  fixedLayout?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  resizable?: boolean;
}

/**
 * 汎用テーブルコンポーネント
 *
 * 使用例:
 * ```tsx
 * const columns: TableColumn[] = [
 *   { key: 'id', label: 'ID', width: '80px' },
 *   { key: 'name', label: '名前', width: '200px' },
 *   { key: 'status', label: 'ステータス', render: (val) => <Badge>{val}</Badge> }
 * ];
 *
 * <Table
 *   columns={columns}
 *   data={assets}
 *   rowKey="id"
 *   hoverable
 *   resizable
 *   onRowClick={(row) => router.push(`/asset/${row.id}`)}
 * />
 * ```
 */
export const Table = <T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  fixedLayout = false,
  striped = false,
  hoverable = true,
  bordered = true,
  onRowClick,
  emptyMessage = 'データがありません',
  loading = false,
  resizable = false,
}: TableProps<T>) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    columns.forEach((col) => {
      initial[col.key] = col.width ? parseInt(col.width) : 150;
    });
    return initial;
  });

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    if (!resizable) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  React.useEffect(() => {
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

  const getRowKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return row[rowKey] ?? index;
  };

  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(row[column.key], row, data.indexOf(row));
    }
    return row[column.key];
  };

  const baseTableStyle = tableStyle({ fixedLayout, fullWidth: true });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
        ⏳ 読み込み中...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          ...baseTableStyle,
          border: bordered ? `1px solid ${colors.border.light}` : 'none',
        }}
      >
        <thead>
          <tr style={{ background: colors.background.light }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...tableCellStyle({ isHeader: true, align: col.align }),
                  width: resizable ? `${columnWidths[col.key]}px` : col.width,
                  position: 'relative',
                  borderBottom: `2px solid ${colors.border.medium}`,
                }}
              >
                {col.label}
                {resizable && (
                  <div
                    onMouseDown={(e) => handleResizeStart(e, col.key)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      background: resizingColumn === col.key ? colors.accent.blue : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = colors.border.light;
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                    }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={getRowKey(row, rowIndex)}
              row={row}
              rowIndex={rowIndex}
              columns={columns}
              striped={striped}
              hoverable={hoverable}
              bordered={bordered}
              onClick={onRowClick}
              getCellValue={getCellValue}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps<T> {
  row: T;
  rowIndex: number;
  columns: TableColumn<T>[];
  striped: boolean;
  hoverable: boolean;
  bordered: boolean;
  onClick?: (row: T, index: number) => void;
  getCellValue: (row: T, column: TableColumn<T>) => React.ReactNode;
}

const TableRow = <T extends Record<string, any>>({
  row,
  rowIndex,
  columns,
  striped,
  hoverable,
  bordered,
  onClick,
  getCellValue,
}: TableRowProps<T>) => {
  const { style: hoverStyle, hoverProps } = hoverable ? useTableRowHover() : { style: {}, hoverProps: {} };

  const stripedBackground = striped && rowIndex % 2 === 1 ? colors.background.gray : colors.background.white;

  return (
    <tr
      {...hoverProps}
      style={{
        ...hoverStyle,
        background: stripedBackground,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={() => onClick?.(row, rowIndex)}
    >
      {columns.map((col) => (
        <td
          key={col.key}
          style={{
            ...tableCellStyle({ align: col.align }),
            borderBottom: bordered ? `1px solid ${colors.border.light}` : 'none',
          }}
        >
          {getCellValue(row, col)}
        </td>
      ))}
    </tr>
  );
};
