import React, { useState, useMemo, useEffect } from 'react';
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
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { UniversalSelect, SelectOption } from '@/components/common/UniversalSelect';
import { ColumnVisibilityPopover, ColumnItem } from '@/components/enterprise/ColumnVisibilityPopover';
import { ExportMenu } from '@/components/enterprise/ExportMenu';

export interface FilterConfig {
  id: string;
  label?: string;
  value: string | number;
  options?: SelectOption[];
  masterType?: string;
  placeholder?: string;
  onChange: (value: any) => void;
  width?: string;
  isSecondary?: boolean;
}

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
  searchQuery?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onResetFilters?: () => void;
  isFiltered?: boolean;
  onSortChange?: (sortBy: string, isDescending: boolean) => void;
  onRefresh?: () => void;
  enableSearch?: boolean;
  enableExport?: boolean;
  enableColumnVisibility?: boolean;
  exportFileName?: string;
  onExportCsv?: () => Promise<void> | void;
  onExportExcel?: () => Promise<void> | void;
  onExportPdf?: () => Promise<void> | void;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  showHeader?: boolean;
  moduleKey?: string;
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
  searchQuery,
  searchPlaceholder = 'Search records...',
  filters = [],
  onResetFilters,
  isFiltered = false,
  onSortChange,
  onRefresh,
  enableSearch = true,
  enableExport = true,
  enableColumnVisibility = true,
  exportFileName = 'export.csv',
  onExportCsv,
  onExportExcel,
  onExportPdf,
  className,
  title,
  subtitle,
  actions,
  toolbar,
  showHeader,
  moduleKey,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [localSearch, setLocalSearch] = useState<string>(searchQuery ?? '');

  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

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
    if (onSearchChange) onSearchChange(localSearch);
  };

  const handleSearchInputChange = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  // Convert table columns to ColumnItem for ColumnVisibilityPopover
  const columnItems: ColumnItem[] = useMemo(() => {
    return table.getAllLeafColumns().map((col) => ({
      id: col.id,
      label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
      isVisible: col.getIsVisible(),
      isMandatory: col.id === 'actions' || col.id === 'select',
    }));
  }, [table, columnVisibility]);

  const handleColumnsChange = (updated: ColumnItem[]) => {
    const nextVis: VisibilityState = {};
    updated.forEach((item) => {
      nextVis[item.id] = item.isVisible;
    });
    setColumnVisibility(nextVis);
  };

  const handleDefaultExportCsv = () => {
    if (!data || data.length === 0) return;
    const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== 'actions');
    const headers = visibleCols.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
    const rows = data.map((row) =>
      visibleCols.map((c) => {
        const val = (row as any)[c.id];
        return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      })
    );

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDefaultExportExcel = () => {
    if (!data || data.length === 0) return;
    const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== 'actions');
    const headers = visibleCols.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
    const rows = data.map((row) =>
      visibleCols.map((c) => {
        const val = (row as any)[c.id];
        return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      })
    );

    const content =
      '\uFEFF' +
      [headers.join('\t'), ...rows.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join('\t'))].join('\n');

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName.replace(/\.[^/.]+$/, '') + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDefaultExportPdf = () => {
    window.print();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalCount);

  // Determine if top header should be rendered
  const effectiveShowHeader =
    showHeader !== undefined
      ? showHeader
      : toolbar !== undefined
      ? true
      : Boolean(
          title ||
          subtitle ||
          (enableSearch && onSearchChange) ||
          (enableSearch && searchQuery !== undefined) ||
          filters.length > 0 ||
          actions ||
          enableExport ||
          onRefresh
        );

  const effectiveModuleKey = moduleKey || exportFileName.replace(/\.[^/.]+$/, '') || 'table';

  return (
    <div
      className={cn(
        'rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs overflow-hidden transition-all',
        className
      )}
    >
      {/* 1. Custom Toolbar Override */}
      {toolbar ? (
        <div className="p-2 sm:p-2.5 border-b border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
          {toolbar}
        </div>
      ) : effectiveShowHeader ? (
        /* 2. Unified One-Row Enterprise Toolbar */
        <div className="px-3 py-2 border-b border-brand-border dark:border-brand-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-brand-secondarySurface/30 dark:bg-brand-darkCard/50">
          {/* Left: Search + Filters + Title in One Row */}
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap overflow-x-auto">
            {title && (
              <div className="flex items-center space-x-2 shrink-0 mr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">{title}</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-brand-muted text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-brand-border dark:border-brand-darkBorder">
                  {totalCount} Total
                </span>
              </div>
            )}

            {enableSearch && (
              <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] max-w-[280px] flex-1 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={localSearch}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full h-8 sm:h-8.5 pl-8 pr-7 text-xs rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary shadow-soft-xs transition-all"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            )}

            {/* Inline UniversalSelect Filters */}
            {filters.map((filter) => (
              <div key={filter.id} className={cn('shrink-0', filter.width || 'w-36 sm:w-44')}>
                <UniversalSelect
                  size="sm"
                  value={filter.value}
                  onChange={(val) => filter.onChange(val)}
                  options={filter.options}
                  masterType={filter.masterType}
                  placeholder={filter.placeholder || filter.label || 'Filter...'}
                  clearable={true}
                  className="w-full"
                />
              </div>
            ))}

            {/* Reset Filters Button */}
            {(isFiltered || !!localSearch.trim()) && onResetFilters && (
              <button
                type="button"
                onClick={() => {
                  handleClearSearch();
                  onResetFilters();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-muted hover:text-rose-500 transition-colors px-1.5 py-1 shrink-0"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Right: Columns Toggle (Customize) + Export Menu + Refresh + Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {enableColumnVisibility && (
              <ColumnVisibilityPopover
                moduleKey={effectiveModuleKey}
                columns={columnItems}
                onChange={handleColumnsChange}
              />
            )}

            {enableExport && (
              <ExportMenu
                onExportCsv={onExportCsv || handleDefaultExportCsv}
                onExportExcel={onExportExcel || handleDefaultExportExcel}
                onExportPdf={onExportPdf || handleDefaultExportPdf}
              />
            )}

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="text-brand-muted hover:text-brand-text h-8 sm:h-8.5 px-2.5"
                title="Refresh Records"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              </Button>
            )}

            {actions}
          </div>
        </div>
      ) : null}

      {/* Table Body Container */}
      <div className="overflow-x-auto min-h-[300px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-brand-surface/60 dark:bg-brand-darkSurface/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-brand-muted font-medium">Loading records...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard select-none"
              >
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-brand-muted whitespace-nowrap',
                        isSortable && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-brand-darkSurface transition-colors'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {isSortable && (
                          <span className="text-brand-muted/70">
                            {isSorted === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-brand-primary" />
                            ) : isSorted === 'desc' ? (
                              <ArrowDown className="w-3 h-3 text-brand-primary" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
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

          <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-brand-darkCard/50 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5 px-3 text-brand-text font-normal align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-brand-muted">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-slate-100 dark:bg-brand-darkCard rounded-full text-slate-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium">No records found matching your filters.</p>
                  </div>
                </td>
              </tr>
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
            <span className="text-[11px] whitespace-nowrap">Rows:</span>
            <div className="w-16">
              <UniversalSelect
                options={pageSizeOptions.map((opt) => ({ value: String(opt), label: String(opt) }))}
                value={String(pageSize)}
                onChange={(val) => onPageSizeChange(Number(val))}
                isSearchable={false}
                clearable={false}
                placeholder=""
                size="sm"
                className="h-7 text-xs"
              />
            </div>
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

          <span className="text-[11px] px-2 text-brand-muted">
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
