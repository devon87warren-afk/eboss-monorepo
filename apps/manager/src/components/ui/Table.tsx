import React, { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
}

const Table = React.forwardRef<HTMLDivElement, TableProps<any>>(
  (
    {
      columns,
      data,
      keyField = 'id',
      onRowClick,
      selectable = false,
      onSelectionChange,
      loading = false,
      emptyMessage = 'No data found',
      sortable = true,
    },
    ref
  ) => {
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

    const handleSort = (key: string) => {
      if (!sortable) return;
      if (sortBy === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(key);
        setSortOrder('asc');
      }
    };

    const handleSelectAll = () => {
      if (selectedRows.size === data.length) {
        setSelectedRows(new Set());
        onSelectionChange?.([]);
      } else {
        const newSelected = new Set(data.map(row => row[keyField]));
        setSelectedRows(newSelected);
        onSelectionChange?.(data);
      }
    };

    const handleSelectRow = (rowKey: any) => {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(rowKey)) {
        newSelected.delete(rowKey);
      } else {
        newSelected.add(rowKey);
      }
      setSelectedRows(newSelected);
      const selectedData = data.filter(row => newSelected.has(row[keyField]));
      onSelectionChange?.(selectedData);
    };

    const sortedData = sortBy
      ? [...data].sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          return sortOrder === 'asc' ? comparison : -comparison;
        })
      : data;

    if (loading) {
      return <Skeleton count={5} height={40} className="mb-2" />;
    }

    return (
      <div ref={ref} className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50">
              {selectable && (
                <th className="px-4 py-3 text-left w-10">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                  className={`
                    px-4 py-3 text-left text-sm font-semibold
                    text-slate-700 dark:text-slate-300
                    ${column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-800' : ''}
                  `}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortable && (
                      <div className="w-4 h-4">
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        ) : (
                          <ArrowUpDown size={16} className="opacity-30" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={String(row[keyField]) || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    border-b border-slate-200 dark:border-dark-700
                    ${onRowClick ? 'hover:bg-slate-50 dark:hover:bg-dark-900/50 cursor-pointer' : ''}
                    transition-colors
                  `}
                >
                  {selectable && (
                    <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(row[keyField])}
                        onChange={() => handleSelectRow(row[keyField])}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export { Table };
