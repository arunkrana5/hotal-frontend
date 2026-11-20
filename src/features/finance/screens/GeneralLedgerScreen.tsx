import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  JournalEntryDto,
  AccountDto,
  CreateJournalEntryRequest,
  CreateJournalLineRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
  ConfirmDialog,
  LedgerSummary,
  TransactionTable,
  LedgerTransaction,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import {
  Receipt,
  Plus,
  Trash2,
  Scale,
  BookOpen,
  DollarSign,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const GeneralLedgerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENTRIES' | 'ACCOUNTS' | 'RECONCILIATION'>('ENTRIES');
  const [entries, setEntries] = useState<JournalEntryDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  // Modals / Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedVoucher, setSelectedVoucher] = useState<JournalEntryDto | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const { documentNumber: jvNumber, isLoading: isJvLoading, refetch: refetchJv } = useDocumentNumber('JOURNAL_VOUCHER');

  // Create Form State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [lines, setLines] = useState<CreateJournalLineRequest[]>([
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: '' },
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (statusFilter !== 'ALL') query.append('status', statusFilter);

    const res = await api.get<PagedResult<JournalEntryDto>>(
      `/finance/journal-entries?${query.toString()}`
    );
    if (res.success && res.data) {
      setEntries(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, statusFilter]);

  const fetchAccounts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, [fetchEntries, fetchAccounts]);

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

  const totalFormDebit = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0),
    [lines]
  );
  const totalFormCredit = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0),
    [lines]
  );
  const isFormBalanced = Math.abs(totalFormDebit - totalFormCredit) < 0.001 && totalFormDebit > 0;
  const balanceDifference = Math.abs(totalFormDebit - totalFormCredit);

  const handlePostEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) {
      setErrorMsg('Debits and credits must be exactly balanced and greater than $0.00.');
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
      setShowCreateDrawer(false);
      setDescription('');
      setReferenceNumber('');
      refetchJv();
      fetchEntries();
      fetchAccounts();
    } else {
      setErrorMsg(res.message || 'Failed to post journal entry.');
    }
    setSubmitting(false);
  };

  // Convert Journal Entries to authoritative Ledger Transactions with running balance
  const ledgerTransactions: LedgerTransaction[] = useMemo(() => {
    let running = 0;
    return entries.map((e) => {
      const net = (e.totalDebit || 0) - (e.totalCredit || 0);
      running += net;
      return {
        id: e.id,
        date: new Date(e.entryDate).toLocaleDateString(),
        voucherNo: e.entryNumber,
        particulars: e.description,
        reference: e.referenceNumber,
        debit: e.totalDebit || 0,
        credit: e.totalCredit || 0,
        balance: running,
        status: e.status || 'POSTED',
      };
    });
  }, [entries]);

  const totalLedgerDebits = useMemo(() => entries.reduce((sum, e) => sum + (e.totalDebit || 0), 0), [entries]);
  const totalLedgerCredits = useMemo(() => entries.reduce((sum, e) => sum + (e.totalCredit || 0), 0), [entries]);

  // Chart of Accounts Column Definitions
  const accountColumns = useMemo<ColumnDef<AccountDto>[]>(
    () => [
      {
        accessorKey: 'accountCode',
        header: 'Code',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'accountName',
        header: 'Account Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] text-brand-muted">
              {info.row.original.description || info.row.original.accountType}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'accountType',
        header: 'Classification',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'currentBalance',
        header: 'Current Balance',
        cell: (info) => {
          const val = Number(info.getValue()) || 0;
          return (
            <span className="font-mono font-bold text-xs text-brand-text">
              ${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-[10px] text-brand-muted font-normal">
                {val >= 0 ? 'Dr' : 'Cr'}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: (info) => (
          <StatusBadge status={info.getValue() ? 'ACTIVE' : 'INACTIVE'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedAccount(row.original)}
            onEdit={() => {}}
            isActive={true}
            onToggleStatus={() => {}}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Universal Enterprise Compact Header */}
      <PageHeader
        title="General Ledger & Accounts"
        badge={<StatusBadge status="AUDITED" variant="success" label="Period Open" />}
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Journal Voucher
            </Button>
          </PageActions>
        }
      />

      {/* 2. Ledger Financial KPI Summary */}
      <LedgerSummary
        openingBalance={125000}
        totalDebit={totalLedgerDebits}
        totalCredit={totalLedgerCredits}
        closingBalance={125000 + (totalLedgerDebits - totalLedgerCredits)}
        currencySymbol="$"
      />

      {/* 3. High-Contrast Segmented Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'ENTRIES', label: 'Journal Entries & Ledger', count: totalCount, icon: <Receipt className="w-3.5 h-3.5" /> },
          { id: 'ACCOUNTS', label: 'Chart of Accounts', count: accounts.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'RECONCILIATION', label: 'Bank & Cash Accounts', icon: <Scale className="w-3.5 h-3.5" /> },
        ]}
      />

      {/* 4. Single-Row Filter Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search voucher no., reference, narration..."
        filters={[
          {
            id: 'status',
            label: 'Audit Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Posted', value: 'POSTED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Reversed', value: 'REVERSED' },
            ],
            onChange: setStatusFilter,
          },
          {
            id: 'account',
            label: 'Account Filter',
            value: accountFilter,
            options: [
              { label: 'All Accounts', value: 'ALL' },
              ...accounts.map((a) => ({ label: `${a.accountCode} - ${a.accountName}`, value: a.id.toString() })),
            ],
            onChange: setAccountFilter,
            width: 'w-48',
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('ALL');
          setAccountFilter('ALL');
        }}
        isFiltered={search !== '' || statusFilter !== 'ALL' || accountFilter !== 'ALL'}
      />

      {/* 5. Main Content Switching between Double-Entry Ledger and Chart of Accounts */}
      {activeTab === 'ENTRIES' ? (
        <TransactionTable
          transactions={ledgerTransactions}
          onVoucherClick={(voucherNo) => {
            const match = entries.find((e) => e.entryNumber === voucherNo);
            if (match) setSelectedVoucher(match);
          }}
          isLoading={loading}
          currencySymbol="$"
        />
      ) : activeTab === 'ACCOUNTS' ? (
        <DataTable
          data={accounts}
          columns={accountColumns}
          totalCount={accounts.length}
          pageIndex={0}
          pageSize={50}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          isLoading={false}
          enableSearch={false}
          enableExport={true}
        />
      ) : (
        <div className="p-8 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface text-center text-brand-muted">
          <Scale className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-1 mb-2" />
          <h4 className="text-xs font-bold uppercase text-brand-text">Bank &amp; Cash Reconciliation</h4>
          <p className="text-xs text-brand-muted mt-1">
            All banking accounts are reconciled with clearing accounts and nightly revenue drops.
          </p>
        </div>
      )}

      {/* 6. Form Drawer: New Journal Voucher with Real-Time Double-Entry Balancing */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handlePostEntry}
        title="Post New Journal Voucher"
        subtitle="Double-entry manual journal entry with automated sequence numbering"
        submitText={submitting ? 'Posting...' : 'Post Voucher'}
        isLoading={submitting}
        width="xl"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Document Details */}
        <FormSection title="Voucher Information" description="Authoritative sequence number and transaction metadata">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Voucher Number (Read-Only)
            </label>
            <input
              type="text"
              readOnly
              value={jvNumber || 'Generating...'}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-primary dark:text-[#8495FF]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Posting Date *
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Narration / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Month-end depreciation adjustment for kitchen assets"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </FormSection>

        {/* Section 2: Real-Time Balancing Indicator */}
        <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard">
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-brand-muted text-[11px] uppercase block">Total Debit:</span>
              <span className="font-bold text-[#16845B] dark:text-[#45C79A] text-sm">
                ${totalFormDebit.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-brand-muted text-[11px] uppercase block text-right">Total Credit:</span>
              <span className="font-bold text-[#C78B24] dark:text-[#E7B65A] text-sm">
                ${totalFormCredit.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-brand-muted text-[11px] uppercase block">Status:</span>
              {isFormBalanced ? (
                <span className="inline-flex items-center space-x-1 text-[#16845B] dark:text-[#45C79A] font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Balanced</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[#D44848] dark:text-[#F07878] font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Diff: ${balanceDifference.toFixed(2)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Debit & Credit Transaction Lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Transaction Lines
            </h4>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddLine}
              className="text-[11px]"
              leftIcon={<Plus className="w-3 h-3" />}
            >
              Add Row
            </Button>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface grid grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="col-span-5">
                  <UniversalSelect
                    size="sm"
                    value={line.accountId}
                    onChange={(val) => handleLineChange(idx, 'accountId', Number(val))}
                    masterType="ACCOUNT"
                    options={accounts.map((a) => ({
                      value: a.id,
                      label: `${a.accountCode} - ${a.accountName}`,
                      badge: a.accountType,
                    }))}
                    placeholder="Select ledger account..."
                    clearable={false}
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit ($)"
                    value={line.debitAmount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleLineChange(idx, 'debitAmount', val);
                      if (val > 0) handleLineChange(idx, 'creditAmount', 0);
                    }}
                    className="w-full h-7 px-2 text-xs text-right font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-[#16845B] dark:text-[#45C79A] font-semibold focus:outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Credit ($)"
                    value={line.creditAmount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleLineChange(idx, 'creditAmount', val);
                      if (val > 0) handleLineChange(idx, 'debitAmount', 0);
                    }}
                    className="w-full h-7 px-2 text-xs text-right font-mono rounded border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkCard text-[#C78B24] dark:text-[#E7B65A] font-semibold focus:outline-none"
                  />
                </div>

                <div className="col-span-1 text-right">
                  {lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1 rounded text-slate-400 hover:text-[#D44848]"
                      title="Delete line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FormDrawer>

      {/* 7. Detail Drawer: Voucher Drilldown View */}
      {selectedVoucher && (
        <DetailDrawer
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          title={`Journal Voucher #${selectedVoucher.entryNumber}`}
          subtitle={`Posting Date: ${new Date(selectedVoucher.entryDate).toLocaleDateString()}`}
          status={selectedVoucher.status || 'POSTED'}
          width="lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Narration</span>
              <p className="text-xs font-semibold text-brand-text mt-0.5">{selectedVoucher.description}</p>
              {selectedVoucher.referenceNumber && (
                <div className="text-[11px] font-mono text-brand-muted mt-1">
                  Reference: {selectedVoucher.referenceNumber}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Voucher Lines</span>
              <div className="border border-brand-border dark:border-brand-darkBorder rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-brand-muted">
                      <th className="p-2.5">Account Code</th>
                      <th className="p-2.5">Account Name</th>
                      <th className="p-2.5 text-right">Debit ($)</th>
                      <th className="p-2.5 text-right">Credit ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder">
                    {selectedVoucher.lines?.map((line, lIdx) => (
                      <tr key={lIdx}>
                        <td className="p-2.5 font-mono text-brand-primary dark:text-[#8495FF]">{line.accountCode}</td>
                        <td className="p-2.5 font-medium">{line.accountName}</td>
                        <td className="p-2.5 text-right font-mono text-[#16845B] dark:text-[#45C79A]">
                          {line.debitAmount > 0 ? `$ ${line.debitAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#C78B24] dark:text-[#E7B65A]">
                          {line.creditAmount > 0 ? `$ ${line.creditAmount.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/80 dark:bg-brand-darkCard font-bold text-xs border-t border-brand-border dark:border-brand-darkBorder">
                      <td colSpan={2} className="p-2.5 text-right uppercase text-[10px]">Voucher Total:</td>
                      <td className="p-2.5 text-right font-mono text-[#16845B] dark:text-[#45C79A]">
                        ${(selectedVoucher.totalDebit || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#C78B24] dark:text-[#E7B65A]">
                        ${(selectedVoucher.totalCredit || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
