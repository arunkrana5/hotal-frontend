import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { StockTransactionDto } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  DetailDrawer,
  LedgerSummary,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  PackageCheck,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const StoresLedgerScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Detail Drawer
  const [selectedTx, setSelectedTx] = useState<StockTransactionDto | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab !== 'ALL') query.append('transactionType', activeTab);

    const res = await api.get<PagedResult<StockTransactionDto>>(
      `/inventory/transactions?${query.toString()}`
    );
    if (res.success && res.data) {
      setTransactions(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalReceipts = useMemo(
    () => transactions.filter((t) => t.transactionType === 'RECEIPT').reduce((sum, t) => sum + t.quantity, 0),
    [transactions]
  );
  const totalIssues = useMemo(
    () => transactions.filter((t) => t.transactionType === 'ISSUE').reduce((sum, t) => sum + t.quantity, 0),
    [transactions]
  );

  const columns: ColumnDef<StockTransactionDto>[] = useMemo(
    () => [
      {
        accessorKey: 'transactionNumber',
        header: 'Tx Number',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'transactionDate',
        header: 'Date & Time',
        cell: (info) => {
          const date = new Date(info.getValue() as string);
          return (
            <div className="text-xs font-mono">
              <div className="font-medium text-brand-text">{date.toLocaleDateString()}</div>
              <div className="text-[11px] text-brand-muted">{date.toLocaleTimeString()}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'itemName',
        header: 'Inventory SKU',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] font-mono text-brand-muted">
              Code: {info.row.original.itemCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'departmentCode',
        header: 'Department',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-text">
            {info.getValue() as string || 'CENTRAL_STORES'}
          </span>
        ),
      },
      {
        accessorKey: 'transactionType',
        header: 'Type',
        cell: (info) => {
          const type = info.getValue() as string;
          const isReceipt = type === 'RECEIPT';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isReceipt ? 'bg-[#16845B]/15 text-[#16845B]' : 'bg-[#C78B24]/15 text-[#C78B24]'}`}
            >
              {isReceipt ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              <span>{type}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Movement Qty',
        cell: (info) => {
          const isReceipt = info.row.original.transactionType === 'RECEIPT';
          const qty = info.getValue() as number;
          return (
            <span
              className={`font-mono font-bold text-xs ${isReceipt ? 'text-[#16845B] dark:text-[#45C79A]' : 'text-[#C78B24] dark:text-[#E7B65A]'}`}
            >
              {isReceipt ? `+${qty}` : `-${qty}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalCost',
        header: 'Total Value ($)',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions onView={() => setSelectedTx(row.original)} />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Central Stores Stock Ledger"
        badge={<StatusBadge status="ACTIVE" label="Real-Time Inventory" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Ledger
            </Button>
          </PageActions>
        }
      />

      {/* 2. Stock Ledger KPI Summary */}
      <LedgerSummary
        openingBalance={4500}
        totalDebit={totalReceipts}
        totalCredit={totalIssues}
        closingBalance={4500 + (totalReceipts - totalIssues)}
        currencySymbol="Qty"
      />

      {/* 3. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Stock Movements', count: totalCount },
          { id: 'RECEIPT', label: 'Goods Receipts (Inward)' },
          { id: 'ISSUE', label: 'Departmental Issues (Outward)' },
          { id: 'ADJUSTMENT', label: 'Audit Adjustments' },
        ]}
      />

      {/* 4. Data Table with Unified Top Toolbar (Search, Customize Columns & Multi-Format Export) */}
      <DataTable
        data={transactions}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tx number, item code, department..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="central_stores_ledger.csv"
      />

      {/* 6. Transaction Detail Drawer */}
      {selectedTx && (
        <DetailDrawer
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={`Stock Movement #${selectedTx.transactionNumber}`}
          subtitle={`Item: ${selectedTx.itemName} (${selectedTx.itemCode})`}
          status={selectedTx.transactionType}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Movement Type</span>
                <span className="font-semibold text-brand-text">{selectedTx.transactionType}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Department</span>
                <span className="font-mono text-brand-text">{selectedTx.departmentCode}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Quantity</span>
                <span className="font-mono font-bold text-sm text-brand-text">{selectedTx.quantity} units</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Total Valuation</span>
                <span className="font-mono font-bold text-sm text-[#16845B] dark:text-[#45C79A]">
                  ${(selectedTx.totalValue || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {selectedTx.notes && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Notes</span>
                <p className="text-brand-text">{selectedTx.notes}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
