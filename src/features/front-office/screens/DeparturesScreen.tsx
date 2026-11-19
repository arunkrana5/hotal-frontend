import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ReservationDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Textarea } from '@/components/common/Input';
import {
  LogOut,
  CheckCircle,
  FileText,
  X,
  CreditCard,
  Clock,
  Sparkles,
  DoorClosed,
  Receipt,
} from 'lucide-react';

export const DeparturesScreen: React.FC = () => {
  const [departures, setDepartures] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Checkout modal
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [settlementPayment, setSettlementPayment] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CC');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccessNotice, setCheckoutSuccessNotice] = useState<string | null>(null);

  const fetchDepartures = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await api.request<PagedResult<ReservationDto>>(
        `/pms/front-office/departures?${params.toString()}`
      );
      if (res.success && res.data) {
        setDepartures(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search]);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  const handleOpenCheckoutModal = (resDto: ReservationDto) => {
    setSelectedReservation(resDto);
    setCheckoutError(null);
    setSettlementPayment(resDto.balanceAmount > 0 ? resDto.balanceAmount : 0);
    setPaymentMode('CC');
    setCheckoutNotes('');
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setIsSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await api.request<ReservationDto>('/pms/front-office/check-out', {
        method: 'POST',
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          settlementPayment: settlementPayment > 0 ? settlementPayment : null,
          paymentModeCode: settlementPayment > 0 ? paymentMode : null,
          notes: checkoutNotes.trim() || undefined,
        }),
      });

      if (res.success) {
        const roomNum = selectedReservation.assignedRoomNumber || 'room';
        setSelectedReservation(null);
        setCheckoutSuccessNotice(`Guest departed successfully! Room ${roomNum} has automatically transitioned to Dirty (DRT) for housekeeping turnover.`);
        setTimeout(() => setCheckoutSuccessNotice(null), 7000);
        fetchDepartures();
      } else {
        setCheckoutError(res.message || 'Checkout failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingSettlementTotal = departures.reduce((sum, d) => sum + (d.balanceAmount || 0), 0);

  const columns: ColumnDef<ReservationDto>[] = [
    {
      accessorKey: 'assignedRoomNumber',
      header: 'Room',
      cell: ({ row }) => (
        <Badge variant="brand" size="md" className="font-mono font-bold">
          {row.original.assignedRoomNumber ? `Room ${row.original.assignedRoomNumber}` : 'Unassigned'}
        </Badge>
      ),
    },
    {
      accessorKey: 'confirmationNumber',
      header: 'Booking #',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
          {row.original.confirmationNumber}
        </span>
      ),
    },
    {
      accessorKey: 'guestName',
      header: 'Guest Name',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{row.original.guestName}</span>
            {row.original.guestVip && row.original.guestVip !== 'Standard' && (
              <Badge variant="warning" size="sm">
                {row.original.guestVip}
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {row.original.guestPhone || 'No contact'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'checkInDate',
      header: 'Check-In Date',
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs">
          {row.original.checkInDate}
        </span>
      ),
    },
    {
      accessorKey: 'totalEstimatedAmount',
      header: 'Folio Total',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-white">
          ${Number(row.original.totalEstimatedAmount).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Total Paid',
      cell: ({ row }) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          ${Number(row.original.paidAmount).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance Due',
      cell: ({ row }) => {
        const bal = Number(row.original.balanceAmount || 0);
        return bal > 0 ? (
          <span className="font-bold text-danger text-xs font-mono">
            ${bal.toFixed(2)}
          </span>
        ) : (
          <Badge variant="success" size="sm">Settled</Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/front-office/folios?reservationId=${row.original.id}`}
            className="p-1.5 rounded-lg border border-border dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition"
            title="View Itemized Folio"
          >
            <FileText className="w-3.5 h-3.5" />
          </Link>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleOpenCheckoutModal(row.original)}
            className="font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Check Out</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Front Office', href: '/front-office/room-grid' },
          { label: 'Departures & Checkout' },
        ]}
        title="Departures &amp; Folio Settlement"
        subtitle="Expected departures, final folio reconciliation, and room release"
        icon={<LogOut className="w-4 h-4" />}
        badge={<Badge variant="warning">Departures</Badge>}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDepartures}
              disabled={isLoading}
            >
              Refresh Departures
            </Button>
          </PageActions>
        }
      />

      {checkoutSuccessNotice && (
        <Alert
          type="success"
          title="Checkout Completed"
          message={checkoutSuccessNotice}
          onClose={() => setCheckoutSuccessNotice(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Departures
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Folios
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
              ${pendingSettlementTotal.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Standard Check-Out
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
              11:00 AM Local Time
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Turnover Automation
            </div>
            <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
              Auto-DRT on Checkout
            </div>
          </div>
        </Card>
      </div>

      {/* Departures DataTable */}
      <DataTable<ReservationDto>
        title="Expected Departures Today"
        subtitle="Active in-house guests scheduled for departure with outstanding balances"
        data={departures}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSearchChange={(t) => {
          setSearch(t);
          setPageIndex(0);
        }}
        onRefresh={fetchDepartures}
        searchPlaceholder="Filter by booking # or guest name..."
        exportFileName="todays_departures.csv"
      />

      {/* Checkout Settlement Modal */}
      {selectedReservation && (
        <Modal
          isOpen={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          title="Guest Check-Out &amp; Folio Settlement"
          subtitle={`Room ${selectedReservation.assignedRoomNumber} • ${selectedReservation.guestName}`}
          icon={<LogOut className="w-4 h-4" />}
          size="lg"
          onSubmit={handleConfirmCheckout}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedReservation(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Confirm &amp; Complete Check-Out
              </Button>
            </>
          }
        >
          {checkoutError && (
            <Alert type="error" message={checkoutError} />
          )}

          {/* Financial Balance Summary */}
          <div className="bg-slate-50 dark:bg-navy-800/60 p-4 rounded-xl border border-border dark:border-navy-700/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Billed Folio Charges:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${Number(selectedReservation.totalEstimatedAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Payments Recorded:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ${Number(selectedReservation.paidAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-navy-700">
              <span className="text-slate-900 dark:text-white">Remaining Balance:</span>
              <span className={selectedReservation.balanceAmount > 0 ? 'text-danger font-mono' : 'text-emerald-600 font-mono'}>
                ${Number(selectedReservation.balanceAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Settlement payment if balance > 0 */}
          {selectedReservation.balanceAmount > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Settle Outstanding Balance</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    label="Payment Amount ($)"
                    type="number"
                    step="0.01"
                    value={settlementPayment}
                    onChange={(e) => setSettlementPayment(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Mode
                  </label>
                  <DynamicDropdown
                    masterCode="PAYMENT_MODE"
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val)}
                    placeholder="Select method..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Checkout Notes */}
          <div>
            <Textarea
              label="Departure Notes / Luggage / Mini-Bar Remarks"
              rows={2}
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
              placeholder="e.g. Keys returned, minibar verified clear, invoice emailed..."
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-navy-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-navy-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-teal shrink-0" />
            <span>Confirming checkout will release key locks and instantly update Room {selectedReservation.assignedRoomNumber} to <strong>Dirty (DRT)</strong> on the Housekeeping Board.</span>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
