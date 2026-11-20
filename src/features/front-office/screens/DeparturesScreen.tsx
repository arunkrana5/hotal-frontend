import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ReservationDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
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
import {
  LogOut,
  CreditCard,
  DoorClosed,
  AlertCircle,
  Download,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const DeparturesScreen: React.FC = () => {
  const [departures, setDepartures] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Checkout modal/drawer
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false);
  const [settlementPayment, setSettlementPayment] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CC');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOpenCheckout = (resDto: ReservationDto) => {
    setSelectedReservation(resDto);
    setCheckoutError(null);
    setSettlementPayment(resDto.balanceAmount > 0 ? resDto.balanceAmount : 0);
    setPaymentMode('CC');
    setCheckoutNotes('');
    setShowCheckoutDrawer(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setIsSubmitting(true);
    setCheckoutError(null);
    try {
      const payload = {
        reservationId: selectedReservation.id,
        settlementPayment: Number(settlementPayment),
        settlementPaymentMethod: paymentMode,
        keyReturned: true,
        notes: checkoutNotes,
      };

      const res = await api.request('/pms/front-office/check-out', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setShowCheckoutDrawer(false);
        setSelectedReservation(null);
        fetchDepartures();
      } else {
        setCheckoutError(res.message || 'Checkout failed. Please inspect outstanding folio balance.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepartures = useMemo(() => {
    if (activeTab === 'SETTLED') {
      return departures.filter((d) => (d.balanceAmount || 0) <= 0);
    }
    if (activeTab === 'PENDING') {
      return departures.filter((d) => (d.balanceAmount || 0) > 0);
    }
    return departures;
  }, [departures, activeTab]);

  const columns: ColumnDef<ReservationDto>[] = useMemo(
    () => [
      {
        accessorKey: 'confirmationNumber',
        header: 'Booking #',
        cell: ({ row }) => (
          <div className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {row.original.confirmationNumber}
          </div>
        ),
      },
      {
        accessorKey: 'guestName',
        header: 'Guest Details',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
              {row.original.guestName}
            </div>
            <div className="text-[11px] text-brand-muted">
              {row.original.roomTypeCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'assignedRoomNumber',
        header: 'Room #',
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-text">
            <DoorClosed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>#{row.original.assignedRoomNumber || 'N/A'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalEstimatedAmount',
        header: 'Total Folio',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-brand-text">
            ${row.original.totalEstimatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'balanceAmount',
        header: 'Balance Due',
        cell: ({ row }) => {
          const bal = row.original.balanceAmount || 0;
          return (
            <span
              className={`font-mono font-bold text-xs ${bal > 0 ? 'text-[#D44848] dark:text-[#F07878]' : 'text-[#16845B] dark:text-[#45C79A]'}`}
            >
              ${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: () => <StatusBadge status="DUEOUT" label="Due Out Today" />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenCheckout(row.original)}
              leftIcon={<LogOut className="w-3 h-3 text-[#D44848]" />}
              className="text-[11px] h-7"
            >
              Checkout
            </Button>
            <RowActions onView={() => setSelectedReservation(row.original)} />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Departures & Checkout"
        badge={<StatusBadge status="ACTIVE" label="Live Front Desk" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Print Departures List
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: "Today's Due Out", count: totalCount },
          { id: 'SETTLED', label: 'Zero Balance (Express)' },
          { id: 'PENDING', label: 'Pending Settlement' },
        ]}
      />

      {/* 3. Data Table with Unified Top Toolbar */}
      <DataTable
        data={filteredDepartures}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departing guest, room #, booking #..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="departures_manifest.csv"
      />

      {/* 5. Checkout Drawer */}
      {selectedReservation && showCheckoutDrawer && (
        <FormDrawer
          isOpen={showCheckoutDrawer}
          onClose={() => setShowCheckoutDrawer(false)}
          onSubmit={handleConfirmCheckout}
          title={`Check-Out: Room #${selectedReservation.assignedRoomNumber || 'N/A'}`}
          subtitle={`Guest: ${selectedReservation.guestName} &bull; Booking #${selectedReservation.confirmationNumber}`}
          submitText={isSubmitting ? 'Processing...' : 'Complete Checkout'}
          isLoading={isSubmitting}
          width="lg"
        >
          {checkoutError && (
            <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          <FormSection title="Final Folio Settlement" description="Collect remaining balance or verify zero balance">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Settlement Payment ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settlementPayment}
                onChange={(e) => setSettlementPayment(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-[#16845B] dark:text-[#45C79A] focus:outline-none"
              />
            </div>

            <div>
              <UniversalSelect
                label="Payment Method"
                size="sm"
                value={paymentMode}
                onChange={(val) => setPaymentMode(val || 'CC')}
                masterType="PAYMENT_METHOD"
                options={[
                  { value: 'CC', label: 'Credit / Debit Card', badge: 'CC' },
                  { value: 'CASH', label: 'Cash Settlement', badge: 'CSH' },
                  { value: 'BANK', label: 'Bank Wire', badge: 'WIRE' },
                  { value: 'DIRECT_BILL', label: 'Company Direct Bill', badge: 'CORP' },
                ]}
                clearable={false}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Checkout Notes &amp; Key Return Confirmation
              </label>
              <input
                type="text"
                placeholder="e.g. 2 keycards returned, minibar checked, guest satisfied"
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          </FormSection>

          {/* Financial Summary */}
          <FinancialSummary
            subtotal={selectedReservation.totalEstimatedAmount || 0}
            grandTotal={selectedReservation.totalEstimatedAmount || 0}
            amountPaid={(selectedReservation.totalEstimatedAmount || 0) - (selectedReservation.balanceAmount || 0) + settlementPayment}
            balanceDue={Math.max(0, (selectedReservation.balanceAmount || 0) - settlementPayment)}
          />
        </FormDrawer>
      )}

      {/* 6. Detail Drawer */}
      {selectedReservation && !showCheckoutDrawer && (
        <DetailDrawer
          isOpen={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          title={`Booking ${selectedReservation.confirmationNumber}`}
          subtitle={`Guest: ${selectedReservation.guestName} | Room #${selectedReservation.assignedRoomNumber || 'N/A'}`}
          status={selectedReservation.reservationStatus}
          width="lg"
        >
          <FinancialSummary
            subtotal={selectedReservation.totalEstimatedAmount || 0}
            grandTotal={selectedReservation.totalEstimatedAmount || 0}
            amountPaid={(selectedReservation.totalEstimatedAmount || 0) - (selectedReservation.balanceAmount || 0)}
            balanceDue={selectedReservation.balanceAmount || 0}
          />
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
