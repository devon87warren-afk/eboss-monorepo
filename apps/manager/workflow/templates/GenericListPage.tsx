import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Table, { Column } from '../../components/ui/Table';
import Filter, { FilterField } from '../../components/ui/Filter';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { ListPageLayout, PageConfig } from '../types/WorkflowConfig';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { resolveDataFetcher } from '../utils/dataResolver';
import { renderCellValue } from '../utils/cellRenderers';
import { executeAction } from '../utils/actionExecutor';

interface GenericListPageProps {
  config: PageConfig;
}

const GenericListPage: React.FC<GenericListPageProps> = ({ config }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filterByRole } = useRoleAccess();

  const layout = config.layout as ListPageLayout;

  // State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [selectedRows, setSelectedRows] = useState<unknown[]>([]);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(
    searchParams.get('pageSize') || String(layout.pagination?.defaultPageSize || 20),
    10
  );

  // Data fetching
  const { entity, queryKey, defaultFilters, defaultSort } = config.dataSource;
  const fetcher = resolveDataFetcher(entity);

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKey, { page, pageSize, filters, searchTerm }],
    queryFn: () => fetcher.getAll({ page, pageSize }),
  });

  // Filter visible columns by role
  const visibleColumns = useMemo(
    () => filterByRole(layout.columns).filter(col => col.visible !== false),
    [layout.columns, filterByRole]
  );

  // Transform config columns to Table columns
  const tableColumns: Column<any>[] = useMemo(
    () =>
      visibleColumns.map(col => ({
        key: col.key,
        label: col.label,
        sortable: col.sortable,
        width: col.width,
        render: (value: unknown, row: unknown) =>
          renderCellValue(value, row as Record<string, unknown>, col),
      })),
    [visibleColumns]
  );

  // Search filtering
  const filteredData = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    // Apply search filter
    if (searchTerm && layout.searchFields) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row: any) =>
        layout.searchFields!.some(field =>
          String(row[field] || '').toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        filtered = filtered.filter((row: any) => {
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    return filtered;
  }, [data?.data, searchTerm, filters, layout.searchFields]);

  // Handlers
  const handleRowClick = useCallback(
    (row: unknown) => {
      const viewAction = layout.rowActions?.find(a => a.id === 'view');
      if (viewAction) {
        executeAction(viewAction, row, navigate);
      }
    },
    [layout.rowActions, navigate]
  );

  const handleFilterApply = useCallback(
    (newFilters: Record<string, unknown>) => {
      setFilters(newFilters);
      setSearchParams(prev => {
        prev.set('page', '1');
        return prev;
      });
    },
    [setSearchParams]
  );

  const handleFilterClear = useCallback(() => {
    setFilters({});
    setSearchParams(prev => {
      prev.set('page', '1');
      return prev;
    });
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams(prev => {
        prev.set('page', String(newPage));
        return prev;
      });
    },
    [setSearchParams]
  );

  // Filter visible actions by role
  const pageActions = filterByRole(config.actions || []);
  const bulkActions = filterByRole(layout.bulkActions || []);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400">Error loading data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="text-slate-500 dark:text-slate-400">{config.subtitle}</p>
          )}
        </div>
        <div className="flex gap-2">
          {pageActions.map(action => (
            <Button
              key={action.id}
              variant={action.variant || 'primary'}
              onClick={() => executeAction(action, null, navigate)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 flex flex-col md:flex-row gap-4">
        {layout.searchFields && layout.searchFields.length > 0 && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-dark-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        {layout.filters && layout.filters.length > 0 && (
          <Filter
            fields={layout.filters as FilterField[]}
            onApply={handleFilterApply}
            onClear={handleFilterClear}
          />
        )}
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="bg-brand-50 dark:bg-brand-900/20 p-3 rounded-lg flex items-center gap-4">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selectedRows.length} selected
          </span>
          {bulkActions.map(action => (
            <Button
              key={action.id}
              variant="secondary"
              size="sm"
              onClick={() => executeAction(action, selectedRows, navigate)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <Skeleton count={5} height={48} className="mb-2" />
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
          <Table
            columns={tableColumns}
            data={filteredData}
            onRowClick={handleRowClick}
            selectable={layout.selectable}
            onSelectionChange={setSelectedRows}
            emptyMessage={`No ${config.title.toLowerCase()} found`}
          />
        </div>
      )}

      {/* Simple pagination info */}
      {data?.total && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            Showing {Math.min(filteredData.length, pageSize)} of {filteredData.length} results
            {data.total !== filteredData.length && ` (${data.total} total)`}
          </span>
          {data.total > pageSize && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-1.5">Page {page}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenericListPage;
