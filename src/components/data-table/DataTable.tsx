import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  RefreshCw,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortBy: string, isDescending: boolean) => void;
  onRefresh?: () => void;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableExport?: boolean;
  exportFileName?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DataTable<TData>({
  data,
  columns,
  totalCount,
  pageIndex,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  onRefresh,
  searchPlaceholder = 'Search records...',
  enableSearch = true,
  enableExport = true,
  exportFileName = 'export.csv',
  className,
  title,
  subtitle,
  actions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(nextSorting);
      if (nextSorting.length > 0 && onSortChange) {
        onSortChange(nextSorting[0].id, nextSorting[0].desc);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearchChange) onSearchChange('');
  };

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const visibleCols = table.getVisibleLeafColumns();
    const headers = visibleCols.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
    const rows = data.map((row) =>
      visibleCols.map((c) => {
        const val = (row as any)[c.id];
        return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      })
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div
      className={cn(
        'rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden transition-all',
        className
      )}
    >
      {/* Table Toolbar: Search, Filters, Records count, Export */}
      <div className="p-3 sm:p-3.5 border-b border-brand-border dark:border-brand-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-3 bg-brand-secondarySurface dark:bg-brand-darkCard">
        {/* Title & record badge */}
        <div>
          {title && (
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">{title}</h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-brand-muted text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-brand-border dark:border-brand-darkBorder">
                {totalCount} Total
              </span>
            </div>
          )}
          {subtitle && <p className="text-[11px] text-brand-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Search, filters, export and actions */}
        <div className="flex flex-wrap items-center gap-2">
          {enableSearch && (
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary w-48 sm:w-60 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          )}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-brand-muted hover:text-brand-text"
              title="Refresh Records"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </Button>
          )}

          {/* Column Visibility Menu */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnMenuOpen(!columnMenuOpen)}
              className="text-brand-muted hover:text-brand-text"
              title="Toggle Columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>

            {columnMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard shadow-lg p-2 z-30 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1 mb-1 border-b border-brand-border dark:border-brand-darkBorder">
                  Toggle Columns
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {table.getAllLeafColumns().map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-brand-darkSurface rounded cursor-pointer text-brand-text"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                      />
                      <span className="truncate">
                        {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={data.length === 0}
              className="text-brand-muted hover:text-brand-text text-xs"
              title="Export to CSV"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
          )}

          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative min-h-[180px]">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-brand-border dark:border-brand-darkBorder bg-slate-50/75 dark:bg-brand-darkCard/80 text-[11px] font-bold uppercase tracking-wider text-brand-muted"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3.5 py-2.5 select-none whitespace-nowrap',
                        canSort && 'cursor-pointer hover:text-brand-primary dark:hover:text-[#8495FF] transition-colors'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="text-slate-400">
                            {isSorted === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-brand-primary" />
                            ) : isSorted === 'desc' ? (
                              <ArrowDown className="w-3.5 h-3.5 text-brand-primary" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder text-xs text-brand-text">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {table.getVisibleLeafColumns().map((_, cIdx) => (
                    <td key={`cell-${rIdx}-${cIdx}`} className="px-3.5 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Clean Empty State
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-brand-muted">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-1" />
                    <p className="text-xs font-medium text-brand-muted">
                      No records found matching your filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Live Data Rows
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-brand-darkCard/60 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2.5 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-3 border-t border-brand-border dark:border-brand-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/40 dark:bg-brand-darkSurface">
        {/* Record Count & Page Size */}
        <div className="flex items-center space-x-3 text-brand-muted">
          <span>
            Showing <strong className="text-brand-text">{startRecord}</strong> to{' '}
            <strong className="text-brand-text">{endRecord}</strong> of{' '}
            <strong className="text-brand-text">{totalCount}</strong> records
          </span>

          <div className="flex items-center space-x-1 pl-3 border-l border-brand-border dark:border-brand-darkBorder">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 text-xs px-2 rounded border border-brand-border bg-brand-surface dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onPageChange(0)}
            disabled={pageIndex === 0 || isLoading}
            className="p-1 h-7 w-7 text-brand-muted"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0 || isLoading}
            className="p-1 h-7 w-7 text-brand-muted"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <span className="px-2 text-xs text-brand-muted">
            Page <strong className="text-brand-text">{pageIndex + 1}</strong> of{' '}
            <strong className="text-brand-text">{totalPages}</strong>
          </span>

          <Button
            variant="outline"
            size="xs"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1 || isLoading}
            className="p-1 h-7 w-7 text-brand-muted"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1 || isLoading}
            className="p-1 h-7 w-7 text-brand-muted"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
