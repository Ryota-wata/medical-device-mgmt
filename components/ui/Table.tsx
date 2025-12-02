import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  selectedRows?: Set<any>;
  onRowSelect?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
}

export function Table<T>({
  data,
  columns,
  onRowClick,
  selectedRows,
  onRowSelect,
  keyExtractor
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onRowSelect && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={(e) => {
                    // TODO: 全選択/全解除の実装
                  }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => {
            const key = keyExtractor(item);
            const isSelected = selectedRows?.has(key);

            return (
              <tr
                key={key}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-blue-50' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {onRowSelect && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onRowSelect(item);
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onRowSelect ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500"
              >
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
