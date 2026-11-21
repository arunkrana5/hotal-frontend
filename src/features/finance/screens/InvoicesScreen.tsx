import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  InvoiceDto,
  CreateInvoiceRequest,
  RecordInvoicePaymentRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
  FinancialSummary,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import {
  Receipt,
  Plus,
  CreditCard,
  Download,
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { documentNumber: invNumber, isLoading: isInvLoading, refetch: refetchInv } = useDocumentNumber('INVOICE');

  // Create Form State
  const [newInvoice, setNewInvoice] = useState<CreateInvoiceRequest>({
    invoiceType: 'GUEST',
    referenceId: '',
    clientOrVendorName: '',
    subTotal: 500,
    taxAmount: 50,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (typeFilter !== 'ALL') query.append('invoiceType', typeFilter);
    if (activeTab !== 'ALL') query.append('status', activeTab);

    const res = await api.get<PagedResult<InvoiceDto>>(`/finance/invoices?${query.toString()}`);
    if (res.success && res.data) {
      setInvoices(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, typeFilter, activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientOrVendorName.trim()) {
      setErrorMsg('Client or Vendor name is required.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    const payload: CreateInvoiceRequest = {
      ...newInvoice,
      referenceId: newInvoice.referenceId || invNumber || undefined,
    };

    const res = await api.post<InvoiceDto>('/finance/invoices', payload);
    if (res.success) {
      setShowCreateDrawer(false);
      refetchInv();
      setNewInvoice({
        invoiceType: 'GUEST',
        referenceId: '',
        clientOrVendorName: '',
        subTotal: 500,
        taxAmount: 50,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: '',
      });
      fetchInvoices();
    } else {
      setErrorMsg(res.message || 'Failed to create invoice.');
    }
    setSubmitting(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;
    setSubmitting(true);

    const req: RecordInvoicePaymentRequest = {
      paymentAmount: Number(paymentAmount),
      paymentMethod,
    };

    const res = await api.post<InvoiceDto>(
      `/finance/invoices/${selectedInvoice.id}/payments`,
      req
    );
    if (res.success) {
      setShowPaymentDrawer(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } else {
      setErrorMsg(res.message || 'Payment recording failed.');
    }
    setSubmitting(false);
  };

  const columns = useMemo<ColumnDef<InvoiceDto>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: (info) => (
          <div className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'clientOrVendorName',
        header: 'Billed To (Party)',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
              {info.getValue() as string}
            </span>
            <span className="text-[10px] text-brand-muted uppercase font-mono shrink-0">
              ({info.row.original.invoiceType})
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'issueDate',
        header: 'Dates',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-text truncate">
            {new Date(info.getValue() as string).toLocaleDateString()} (Due: {new Date(info.row.original.dueDate).toLocaleDateString()})
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total Billed',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'paidAmount',
        header: 'Paid Amount',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-[#16845B] dark:text-[#45C79A]">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'balanceAmount',
        header: 'Outstanding Balance',
        cell: (info) => {
          const bal = info.getValue() as number;
          return (
            <span className={`font-mono font-bold text-xs ${bal > 0 ? 'text-[#D44848] dark:text-[#F07878]' : 'text-slate-400'}`}>
              ${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedInvoice(row.original)}
            customActions={[
              ...(row.original.balanceAmount > 0
                ? [
                    {
                      label: 'Record Payment',
                      icon: <CreditCard className="w-3.5 h-3.5" />,
                      onClick: () => {
                        setSelectedInvoice(row.original);
                        setPaymentAmount(row.original.balanceAmount);
                        setShowPaymentDrawer(true);
                      },
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Invoices & Settlements"
        badge={<StatusBadge status="ACTIVE" label="Real-Time Ledger" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Invoice
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Invoices', count: totalCount },
          { id: 'ISSUED', label: 'Unpaid / Issued' },
          { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
          { id: 'PAID', label: 'Fully Settled' },
          { id: 'OVERDUE', label: 'Overdue' },
        ]}
      />

      {/* 3. Data Table with Integrated Toolbar & Filters */}
      <DataTable
        data={invoices}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice #, client, vendor..."
        filters={[
          {
            id: 'type',
            label: 'Invoice Type',
            value: typeFilter,
            options: [
              { label: 'All Types', value: 'ALL' },
              { label: 'Guest Folio Invoices', value: 'GUEST' },
              { label: 'Vendor Payables', value: 'VENDOR' },
              { label: 'Corporate Accounts', value: 'CORPORATE' },
            ],
            onChange: setTypeFilter,
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setTypeFilter('ALL');
        }}
        isFiltered={search !== '' || typeFilter !== 'ALL'}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="invoices_register.csv"
      />

      {/* 5. Create Invoice Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateInvoice}
        title="Create New Invoice"
        subtitle="Generate authoritative guest or vendor invoice"
        submitText={submitting ? 'Generating...' : 'Issue Invoice'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Invoice Identification" description="Document number and billing party">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Invoice Number (Read-Only)
            </label>
            <input
              type="text"
              readOnly
              value={invNumber || 'Generating...'}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-primary dark:text-[#8495FF]"
            />
          </div>

          <div>
            <UniversalSelect
              label="Invoice Category"
              required
              size="sm"
              value={newInvoice.invoiceType}
              onChange={(val) => setNewInvoice({ ...newInvoice, invoiceType: val || 'GUEST' })}
              options={[
                { value: 'GUEST', label: 'Guest Billing', badge: 'GST' },
                { value: 'VENDOR', label: 'Vendor Payable', badge: 'VND' },
                { value: 'CORPORATE', label: 'Corporate Direct Bill', badge: 'CORP' },
              ]}
              clearable={false}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Client or Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corporation / John Doe"
              value={newInvoice.clientOrVendorName}
              onChange={(e) => setNewInvoice({ ...newInvoice, clientOrVendorName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Financial Breakdown" description="Subtotal, tax calculation, and payment terms">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Subtotal ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={newInvoice.subTotal}
              onChange={(e) => setNewInvoice({ ...newInvoice, subTotal: parseFloat(e.target.value) || 0 })}
              className="w-full h-8 px-2.5 text-xs font-mono font-semibold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Tax Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={newInvoice.taxAmount}
              onChange={(e) => setNewInvoice({ ...newInvoice, taxAmount: parseFloat(e.target.value) || 0 })}
              className="w-full h-8 px-2.5 text-xs font-mono font-semibold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Issue Date
            </label>
            <input
              type="date"
              value={newInvoice.issueDate}
              onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={newInvoice.dueDate}
              onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        {/* Real-Time Financial Summary Preview */}
        <FinancialSummary
          subtotal={newInvoice.subTotal}
          taxesTotal={newInvoice.taxAmount}
          grandTotal={newInvoice.subTotal + newInvoice.taxAmount}
          amountPaid={0}
          balanceDue={newInvoice.subTotal + newInvoice.taxAmount}
        />
      </FormDrawer>

      {/* 6. Record Payment Drawer */}
      {selectedInvoice && showPaymentDrawer && (
        <FormDrawer
          isOpen={showPaymentDrawer}
          onClose={() => setShowPaymentDrawer(false)}
          onSubmit={handleRecordPayment}
          title={`Record Payment for ${selectedInvoice.invoiceNumber}`}
          subtitle={`Total Billed: $${selectedInvoice.totalAmount.toFixed(2)} | Balance Due: $${selectedInvoice.balanceAmount.toFixed(2)}`}
          submitText={submitting ? 'Recording...' : 'Register Payment'}
          isLoading={submitting}
          width="md"
        >
          <FormSection title="Settlement Details" description="Select payment method and settled amount">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoice.balanceAmount}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-[#16845B] dark:text-[#45C79A] focus:outline-none"
              />
            </div>

            <div>
              <UniversalSelect
                label="Payment Method"
                required
                size="sm"
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val || 'CREDIT_CARD')}
                masterType="PAYMENT_METHOD"
                options={[
                  { value: 'CREDIT_CARD', label: 'Credit / Debit Card', badge: 'CC' },
                  { value: 'BANK_TRANSFER', label: 'Direct Bank Transfer', badge: 'WIRE' },
                  { value: 'CASH', label: 'Cash Drawer', badge: 'CSH' },
                  { value: 'ROOM_FOLIO', label: 'Charge to Guest Folio', badge: 'FOLIO' },
                ]}
                clearable={false}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Payment Notes / Transaction Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Auth Code: #88219"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          </FormSection>
        </FormDrawer>
      )}

      {/* 7. Detail Drawer: Full Invoice View */}
      {selectedInvoice && !showPaymentDrawer && (
        <DetailDrawer
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          subtitle={`Billed to: ${selectedInvoice.clientOrVendorName}`}
          status={selectedInvoice.status}
          width="lg"
        >
          <FinancialSummary
            subtotal={selectedInvoice.subTotal}
            taxesTotal={selectedInvoice.taxAmount}
            grandTotal={selectedInvoice.totalAmount}
            amountPaid={selectedInvoice.paidAmount}
            balanceDue={selectedInvoice.balanceAmount}
          />
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
