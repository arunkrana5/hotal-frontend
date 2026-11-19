import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { StockTransactionDto } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Select } from '@/components/common/Input';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Boxes,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  PackageCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const StoresLedgerScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchTransactions = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (typeFilter) query.append('transactionType', typeFilter);

    const res = await api.get<PagedResult<StockTransactionDto>>(
      `/inventory/transactions?${query.toString()}`
    );
    if (res.success && res.data) {
      setTransactions(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [pageIndex, pageSize, typeFilter]);

  const receiptCount = transactions.filter(t => t.transactionType === 'RECEIPT').length;
  const issueCount = transactions.filter(t => t.transactionType === 'ISSUE').length;

  const columns = useMemo<ColumnDef<StockTransactionDto>[]>(
    () => [
      {
        accessorKey: 'transactionNumber',
        header: 'Tx Number',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
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
            <div className="text-xs">
              <div className="font-medium text-slate-800 dark:text-slate-200">{date.toLocaleDateString()}</div>
              <div className="text-[11px] text-slate-400 font-mono">{date.toLocaleTimeString()}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'itemCode',
        header: 'SKU & Description',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
              {info.getValue() as string}
            </span>
            <div className="text-xs text-slate-900 dark:text-white font-medium">{info.row.original.itemName}</div>
          </div>
        ),
      },
      {
        accessorKey: 'transactionType',
        header: 'Movement Type',
        cell: (info) => {
          const type = (info.getValue() as string) || '';
          if (type === 'RECEIPT') {
            return (
              <Badge variant="success" size="sm" className="flex items-center gap-1 font-semibold">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Receipt (+)</span>
              </Badge>
            );
          }
          if (type === 'ISSUE') {
            return (
              <Badge variant="brand" size="sm" className="flex items-center gap-1 font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                <span>Issue (-)</span>
              </Badge>
            );
          }
          return (
            <Badge variant="warning" size="sm" className="flex items-center gap-1 font-semibold">
              <SlidersHorizontal className="w-3 h-3" />
              <span>{type}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: (info) => {
          const qty = info.getValue() as number;
          const isIssue = info.row.original.transactionType === 'ISSUE';
          return (
            <span className={`font-mono font-bold text-xs ${isIssue ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isIssue ? `-${qty}` : `+${qty}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'departmentCode',
        header: 'Dept / Source',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {(info.getValue() as string) || 'CENTRAL'}
          </Badge>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: 'Total Valuation',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Voucher Remarks',
        cell: (info) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs block">
            {(info.getValue() as string) || '&mdash;'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Inventory', href: '/inventory/items' },
          { label: 'Stock Ledger' },
        ]}
        title="Stores Perpetual Stock Ledger"
        subtitle="FIFO / Weighted-Average inventory movements, receipts, issues & audit ledgers"
        actions={
          <PageActions>
            <Button
              onClick={fetchTransactions}
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh Ledger
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Transactions
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Entries
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Goods Inward (GRN)
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {receiptCount} Receipts
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Department Issues
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {issueCount} Issues
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valuation Method
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Weighted Avg
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Movement Types</option>
            <option value="RECEIPT">Stock Receipts (+)</option>
            <option value="ISSUE">Department Issues (-)</option>
            <option value="AUDIT_ADJUST">Audit Corrections</option>
            <option value="DAMAGE">Damages &amp; Write-Offs</option>
          </Select>
        </div>
      </div>

      {/* Transactions DataTable */}
      <DataTable<StockTransactionDto>
        title="Stock Movement Ledger"
        subtitle="Unchangeable audit log of every stock movement through hotel stores"
        data={transactions}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchTransactions}
        exportFileName="stores_ledger.csv"
      />
    </PageContainer>
  );
};
