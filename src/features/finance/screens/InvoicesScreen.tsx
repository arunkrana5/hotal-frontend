import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  InvoiceDto,
  CreateInvoiceRequest,
  RecordInvoicePaymentRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  Receipt,
  Plus,
  CreditCard,
  X,
  CheckCircle2,
  DollarSign,
  Clock,
  Building,
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const { documentNumber: invNumber, isLoading: isInvLoading, refetch: refetchInv } = useDocumentNumber('INVOICE');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form
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

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');

  const fetchInvoices = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (typeFilter) query.append('invoiceType', typeFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<InvoiceDto>>(`/finance/invoices?${query.toString()}`);
    if (res.success && res.data) {
      setInvoices(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [pageIndex, pageSize, typeFilter, statusFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<InvoiceDto>('/finance/invoices', newInvoice);
    if (res.success) {
      setShowCreateModal(false);
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
    }
    setSubmitting(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);

    const req: RecordInvoicePaymentRequest = {
      paymentAmount,
      paymentMethod,
    };

    const res = await api.post(`/finance/invoices/${selectedInvoice.id}/payments`, req);
    if (res.success) {
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    }
    setSubmitting(false);
  };

  const openPayment = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.totalAmount - inv.paidAmount);
    setShowPaymentModal(true);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

  const columns = useMemo<ColumnDef<InvoiceDto>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'clientOrVendorName',
        header: 'Customer / Counterparty',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            <div className="text-[11px] text-slate-400 font-mono uppercase">
              {info.row.original.invoiceType} {info.row.original.referenceId && `(${info.row.original.referenceId})`}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'issueDate',
        header: 'Issue / Due Date',
        cell: (info) => {
          const inv = info.row.original;
          return (
            <div className="text-xs">
              <div className="text-slate-800 dark:text-slate-200">{new Date(inv.issueDate).toLocaleDateString()}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Due: {new Date(inv.dueDate).toLocaleDateString()}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Billed Amount',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'paidAmount',
        header: 'Settled',
        cell: (info) => (
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'balance',
        header: 'Balance Due',
        cell: (info) => {
          const inv = info.row.original;
          const bal = inv.totalAmount - inv.paidAmount;
          return bal > 0 ? (
            <span className="font-mono font-bold text-danger text-xs">
              ${bal.toFixed(2)}
            </span>
          ) : (
            <Badge variant="success" size="sm">Paid in Full</Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'PAID') return <Badge variant="success">Paid</Badge>;
          if (s === 'PARTIALLY_PAID') return <Badge variant="warning" dot>Partial</Badge>;
          if (s === 'OVERDUE') return <Badge variant="danger" dot>Overdue</Badge>;
          return <Badge variant="brand" dot>{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Settlement',
        cell: (info) => {
          const inv = info.row.original;
          const bal = inv.totalAmount - inv.paidAmount;
          if (bal > 0) {
            return (
              <Button
                size="xs"
                variant="success"
                onClick={() => openPayment(inv)}
                className="font-semibold text-xs flex items-center gap-1"
              >
                <CreditCard className="w-3 h-3" />
                <span>Receive</span>
              </Button>
            );
          }
          return <span className="text-xs text-slate-400 font-mono">&mdash;</span>;
        },
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Finance', href: '/finance/invoices' },
          { label: 'Invoices' },
        ]}
        title="Accounts Receivable & Payable Invoicing"
        subtitle="Corporate guest invoices, travel agent vouchers, vendor AP matching & aging receivables"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Generate Tax Invoice
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
              Total Invoices
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Invoices
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Billed
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalInvoiced.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receivables Due
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
              ${totalOutstanding.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ledger Feed
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              Synced with AR/AP
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
            <option value="">All Invoice Types</option>
            <option value="GUEST">Guest Folio Invoices</option>
            <option value="CORPORATE">Corporate City Ledger</option>
            <option value="VENDOR">Vendor AP Invoices</option>
            <option value="BANQUET">Banquet Contracts</option>
          </Select>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Payment Statuses</option>
            <option value="ISSUED">Issued / Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Settled</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </div>
      </div>

      {/* Invoices DataTable */}
      <DataTable<InvoiceDto>
        title="Official Tax Invoice Ledger"
        subtitle="AR/AP invoices compliant with international hotel auditing standards"
        data={invoices}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchInvoices}
        exportFileName="invoices_ledger.csv"
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Draft Official Tax Invoice"
        subtitle="Generate accounts receivable or accounts payable invoice"
        icon={<Receipt className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateInvoice}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !newInvoice.clientOrVendorName}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Issue Invoice
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={invNumber}
          label="Invoice Number"
          isLoading={isInvLoading}
          onRefresh={refetchInv}
          helperText="Auto-assigned sequentially by Billing & Finance Engine"
        />

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Invoice Classification
            </label>
            <Select
              value={newInvoice.invoiceType}
              onChange={(e) => setNewInvoice({ ...newInvoice, invoiceType: e.target.value })}
            >
              <option value="GUEST">Guest Stay Billing</option>
              <option value="CORPORATE">Corporate City Ledger</option>
              <option value="VENDOR">Supplier / Vendor Invoice</option>
              <option value="BANQUET">Banquet Event Settlement</option>
            </Select>
          </div>

          <Input
            label="Client / Vendor Name *"
            required
            value={newInvoice.clientOrVendorName}
            onChange={(e) => setNewInvoice({ ...newInvoice, clientOrVendorName: e.target.value })}
            placeholder="e.g. Vance Luxury Holdings"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Subtotal Amount ($) *"
            type="number"
            step="0.01"
            required
            value={newInvoice.subTotal}
            onChange={(e) => setNewInvoice({ ...newInvoice, subTotal: Number(e.target.value) })}
            className="font-mono"
          />
          <Input
            label="VAT / Tax Amount ($) *"
            type="number"
            step="0.01"
            required
            value={newInvoice.taxAmount}
            onChange={(e) => setNewInvoice({ ...newInvoice, taxAmount: Number(e.target.value) })}
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Issue Date *"
            type="date"
            required
            value={newInvoice.issueDate}
            onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })}
          />
          <Input
            label="Due Date *"
            type="date"
            required
            value={newInvoice.dueDate}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
          />
        </FormGrid>

        <div>
          <Textarea
            label="Billing Remarks &amp; Terms"
            rows={2}
            value={newInvoice.notes}
            onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
            placeholder="e.g. Corporate discount applied; payment due by wire transfer..."
          />
        </div>
      </Modal>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Record Payment Receipt"
          subtitle={`Invoice #${selectedInvoice.invoiceNumber} • Balance: $${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}`}
          icon={<CreditCard className="w-4 h-4" />}
          size="md"
          onSubmit={handleRecordPayment}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || paymentAmount <= 0}
                isLoading={submitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Record Payment
              </Button>
            </>
          }
        >
          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="font-mono"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CREDIT_CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Direct Wire Transfer</option>
              <option value="CASH">Cash Deposit</option>
              <option value="CHEQUE">Bank Cheque</option>
            </Select>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
