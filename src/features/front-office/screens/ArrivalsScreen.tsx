import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { ReservationDto, RoomDto } from '@/types/pms';
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
  LogIn,
  Key,
  Crown,
  CreditCard,
  DoorOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';

export const ArrivalsScreen: React.FC = () => {
  const [arrivals, setArrivals] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Check-In Drawer State
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [showCheckInDrawer, setShowCheckInDrawer] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [keyCardUid, setKeyCardUid] = useState<string>('');
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CC');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArrivals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await api.request<PagedResult<ReservationDto>>(
        `/pms/front-office/arrivals?${params.toString()}`
      );
      if (res.success && res.data) {
        setArrivals(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search]);

  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  const handleOpenCheckIn = async (resDto: ReservationDto) => {
    setSelectedReservation(resDto);
    setCheckInError(null);
    setAdvanceDeposit(resDto.balanceAmount > 0 ? resDto.balanceAmount : 0);
    setPaymentMode('CC');
    setKeyCardUid(`NFC-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`);
    setShowCheckInDrawer(true);

    try {
      const res = await api.request<PagedResult<RoomDto>>(`/pms/rooms?status=CLN&pageSize=50`);
      if (res.success && res.data) {
        setAvailableRooms(res.data.items);
        if (resDto.assignedRoomId) {
          setSelectedRoomId(resDto.assignedRoomId);
        } else if (res.data.items.length > 0) {
          setSelectedRoomId(res.data.items[0].id);
        }
      }
    } catch {
      // fallback
    }
  };

  const handleExecuteCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || !selectedRoomId) {
      setCheckInError('Please select a clean room to assign.');
      return;
    }

    setIsSubmitting(true);
    setCheckInError(null);
    try {
      const payload = {
        reservationId: selectedReservation.id,
        roomId: selectedRoomId,
        keyCardNumber: keyCardUid,
        initialDeposit: Number(advanceDeposit),
        depositPaymentMethod: paymentMode,
      };

      const res = await api.request('/pms/front-office/check-in', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setShowCheckInDrawer(false);
        setSelectedReservation(null);
        fetchArrivals();
      } else {
        setCheckInError(res.message || 'Check-in failed. Room may have been allocated.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredArrivals = useMemo(() => {
    if (activeTab === 'VIP') {
      return arrivals.filter((a) => a.guestVip && a.guestVip !== 'Standard');
    }
    return arrivals;
  }, [arrivals, activeTab]);

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
        header: 'Guest Name',
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
              {row.original.guestName}
            </span>
            {row.original.guestVip && row.original.guestVip !== 'Standard' && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                <Crown className="w-2.5 h-2.5 text-amber-500" />
                <span>{row.original.guestVip}</span>
              </span>
            )}
            <span className="text-[11px] text-brand-muted shrink-0">
              ({row.original.adultsCount}A • {row.original.roomTypeCode})
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'assignedRoomNumber',
        header: 'Assigned Room',
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-brand-text">
              {row.original.assignedRoomNumber ? `#${row.original.assignedRoomNumber}` : 'Assign at Desk'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'balanceAmount',
        header: 'Folio Balance',
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
        cell: () => <StatusBadge status="ARRIVING" label="Expected Today" />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="xs"
              onClick={() => handleOpenCheckIn(row.original)}
              leftIcon={<LogIn className="w-3 h-3" />}
              className="text-[11px] h-7"
            >
              Check In
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
        title="Arrivals & Guest Check-In"
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
              Print Arrivals List
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: "Today's Expected Arrivals", count: totalCount },
          { id: 'VIP', label: 'VIP Guests' },
        ]}
      />

      {/* 3. Data Table with Unified Top Toolbar */}
      <DataTable
        data={filteredArrivals}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search arriving guest, booking #..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
        enableExport={true}
        enableColumnVisibility={true}
        exportFileName="arrivals_manifest.csv"
      />

      {/* 5. Check-In Drawer */}
      {selectedReservation && showCheckInDrawer && (
        <FormDrawer
          isOpen={showCheckInDrawer}
          onClose={() => setShowCheckInDrawer(false)}
          onSubmit={handleExecuteCheckIn}
          title={`Check-In: ${selectedReservation.guestName}`}
          subtitle={`Booking #${selectedReservation.confirmationNumber} &bull; Room Type: ${selectedReservation.roomTypeCode}`}
          submitText={isSubmitting ? 'Checking In...' : 'Confirm Check-In'}
          isLoading={isSubmitting}
          width="lg"
        >
          {checkInError && (
            <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          <FormSection title="Room Assignment" description="Select an inspected and sanitized room">
            <div className="sm:col-span-2">
              <UniversalSelect
                label="Available Clean Rooms"
                required
                size="sm"
                value={selectedRoomId || ''}
                onChange={(val) => setSelectedRoomId(Number(val))}
                options={availableRooms.map((r) => ({
                  value: r.id,
                  label: `Room #${r.roomNumber} - Floor ${r.floorNumber} (${r.roomTypeCode}) - Ready`,
                  badge: r.roomTypeCode,
                }))}
                placeholder="Choose clean available room..."
                clearable={false}
              />
            </div>
          </FormSection>

          <FormSection title="Key Card & Digital Access" description="Encode keycard UID for NFC lock reader">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Key Card UID *
              </label>
              <input
                type="text"
                required
                value={keyCardUid}
                onChange={(e) => setKeyCardUid(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Advance Deposit ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={advanceDeposit}
                onChange={(e) => setAdvanceDeposit(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-[#16845B] dark:text-[#45C79A] focus:outline-none"
              />
            </div>
          </FormSection>

          {/* Financial Summary */}
          <FinancialSummary
            subtotal={selectedReservation.totalEstimatedAmount || 0}
            grandTotal={selectedReservation.totalEstimatedAmount || 0}
            amountPaid={advanceDeposit}
            balanceDue={Math.max(0, (selectedReservation.totalEstimatedAmount || 0) - advanceDeposit)}
          />
        </FormDrawer>
      )}

      {/* 6. Detail Drawer */}
      {selectedReservation && !showCheckInDrawer && (
        <DetailDrawer
          isOpen={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          title={`Reservation ${selectedReservation.confirmationNumber}`}
          subtitle={`Guest: ${selectedReservation.guestName}`}
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
