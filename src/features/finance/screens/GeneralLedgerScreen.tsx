import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  JournalEntryDto,
  AccountDto,
  CreateJournalEntryRequest,
  CreateJournalLineRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Input, Select, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  Receipt,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  DollarSign,
  Scale,
  BookOpen,
} from 'lucide-react';

export const GeneralLedgerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENTRIES' | 'ACCOUNTS'>('ENTRIES');
  const [entries, setEntries] = useState<JournalEntryDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const { documentNumber: jvNumber, isLoading: isJvLoading, refetch: refetchJv } = useDocumentNumber('JOURNAL_VOUCHER');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [lines, setLines] = useState<CreateJournalLineRequest[]>([
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: '' },
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    const res = await api.get<PagedResult<JournalEntryDto>>(
      `/finance/journal-entries?${query.toString()}`
    );
    if (res.success && res.data) {
      setEntries(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  const fetchAccounts = async () => {
    const res = await api.get<AccountDto[]>('/finance/accounts');
    if (res.success && res.data) {
      setAccounts(res.data);
      if (res.data.length >= 2 && lines[0].accountId === 0) {
        setLines([
          { accountId: res.data[0].id, debitAmount: 0, creditAmount: 0, description: '' },
          { accountId: res.data[1].id, debitAmount: 0, creditAmount: 0, description: '' },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, [pageIndex, pageSize]);

  const handleAddLine = () => {
    const defaultAccId = accounts[0]?.id || 0;
    setLines([...lines, { accountId: defaultAccId, debitAmount: 0, creditAmount: 0, description: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof CreateJournalLineRequest, val: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: val };
    setLines(updated);
  };

  const totalDebit = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0),
    [lines]
  );
  const totalCredit = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0),
    [lines]
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handlePostEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setErrorMsg('Debits and credits must be equal and greater than $0.00.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    const req: CreateJournalEntryRequest = {
      entryDate,
      description,
      referenceNumber: referenceNumber || jvNumber || undefined,
      lines,
    };

    const res = await api.post('/finance/journal-entries', req);
    if (res.success) {
      setShowModal(false);
      setDescription('');
      setReferenceNumber('');
      fetchEntries();
      fetchAccounts();
    } else {
      setErrorMsg(res.message || 'Failed to post entry.');
    }
    setSubmitting(false);
  };

  const totalLedgerDebits = entries.reduce((sum, e) => sum + (e.totalDebit || 0), 0);

  const entryColumns = useMemo<ColumnDef<JournalEntryDto>[]>(
    () => [
      {
        accessorKey: 'entryNumber',
        header: 'Voucher #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'entryDate',
        header: 'Posting Date',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Journal Narration',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            {info.row.original.referenceNumber && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Ref: {info.row.original.referenceNumber}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'totalDebit',
        header: 'Debit Amount',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'totalCredit',
        header: 'Credit Amount',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Audit Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          return s === 'POSTED' ? (
            <Badge variant="success">Posted to GL</Badge>
          ) : (
            <Badge variant="warning">{s}</Badge>
          );
        },
      },
    ],
    []
  );

  const accountColumns = useMemo<ColumnDef<AccountDto>[]>(
    () => [
      {
        accessorKey: 'accountCode',
        header: 'Account Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'accountName',
        header: 'Chart of Account Name',
        cell: (info) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'accountType',
        header: 'Category Type',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'currentBalance',
        header: 'Net Ledger Balance',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currency',
        cell: (info) => (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {info.getValue() as string}
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
          { label: 'Finance', href: '/finance/ledger' },
          { label: 'General Ledger' },
        ]}
        title="General Ledger & Financial Accounting"
        subtitle="Chart of Accounts, double-entry journal vouchers, trial balance audit & PMS settlement feeds"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                setErrorMsg(null);
                setShowModal(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Post Journal Voucher
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Posted Vouchers
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Entries
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Volume
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalLedgerDebits.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chart of Accounts
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {accounts.length} Ledgers
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balance Check
            </div>
            <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
              Debits = Credits Verified
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-800 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('ENTRIES')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'ENTRIES'
              ? 'bg-white dark:bg-navy-900 text-brand-indigo dark:text-brand-blue shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Journal Vouchers</span>
        </button>
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'ACCOUNTS'
              ? 'bg-white dark:bg-navy-900 text-brand-indigo dark:text-brand-blue shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Chart of Accounts</span>
        </button>
      </div>

      {/* Views */}
      {activeTab === 'ENTRIES' ? (
        <DataTable<JournalEntryDto>
          title="General Journal Voucher Ledger"
          subtitle="All balanced financial postings including night audit runs and guest folio settlements"
          data={entries}
          columns={entryColumns}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          isLoading={loading}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onRefresh={fetchEntries}
          exportFileName="general_ledger_entries.csv"
        />
      ) : (
        <DataTable<AccountDto>
          title="Chart of Accounts Master"
          subtitle="Hierarchical structure of balance sheet, income, asset, and liability ledger accounts"
          data={accounts}
          columns={accountColumns}
          totalCount={accounts.length}
          pageIndex={0}
          pageSize={50}
          isLoading={false}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          onRefresh={fetchAccounts}
          exportFileName="chart_of_accounts.csv"
        />
      )}

      {/* Post Journal Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Post General Journal Voucher"
        subtitle="Balanced double-entry posting to the official financial general ledger"
        icon={<Receipt className="w-4 h-4" />}
        size="lg"
        onSubmit={handlePostEntry}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !isBalanced}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Post to General Ledger
            </Button>
          </>
        }
      >
        {errorMsg && (
          <Alert type="error" message={errorMsg} />
        )}

        <DocumentNumberField
          value={jvNumber}
          label="Journal Voucher Number"
          isLoading={isJvLoading}
          onRefresh={refetchJv}
          helperText="Auto-assigned sequentially by Finance Document Engine"
        />

        <FormGrid cols={2}>
          <Input
            label="Voucher Date *"
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
          <Input
            label="Voucher Narration *"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Month-End Depreciation"
          />
        </FormGrid>

        {/* Dynamic Line Items */}
        <div className="space-y-3 pt-2 border-t border-border dark:border-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Debit &amp; Credit Ledger Lines</span>
            <Button type="button" size="xs" variant="outline" onClick={handleAddLine} leftIcon={<Plus className="w-3 h-3" />}>
              Add Line
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {lines.map((ln, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800/60 p-2.5 rounded-xl border border-border dark:border-navy-700">
                <div className="flex-1">
                  <Select
                    value={ln.accountId}
                    onChange={(e) => handleLineChange(idx, 'accountId', Number(e.target.value))}
                    className="h-8 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit $"
                    value={ln.debitAmount}
                    onChange={(e) => handleLineChange(idx, 'debitAmount', Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Credit $"
                    value={ln.creditAmount}
                    onChange={(e) => handleLineChange(idx, 'creditAmount', Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                {lines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="p-1.5 text-slate-400 hover:text-danger rounded-lg transition shrink-0"
                    title="Remove line"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Balance Meter */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isBalanced
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">
                {isBalanced ? 'Balanced Voucher' : 'Out of Balance'}
              </span>
            </div>
            <div className="font-mono text-xs space-x-3">
              <span>Total Debits: <strong>${totalDebit.toFixed(2)}</strong></span>
              <span>Total Credits: <strong>${totalCredit.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
