import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { ReservationDto, RoomDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { Button } from '@/components/common/Button';
import { Card, Badge, Alert } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Input, Select } from '@/components/common/Input';
import {
  LogIn,
  CheckCircle,
  Key,
  X,
  Calendar,
  Sparkles,
  Crown,
  CreditCard,
  UserCheck,
  DoorOpen,
} from 'lucide-react';

export const ArrivalsScreen: React.FC = () => {
  const [arrivals, setArrivals] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check-In Modal
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [keyCardUid, setKeyCardUid] = useState<string>('');
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CC');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // When opening Check-In Modal, load clean/inspected rooms
  const handleOpenCheckInModal = async (resDto: ReservationDto) => {
    setSelectedReservation(resDto);
    setCheckInError(null);
    setAdvanceDeposit(resDto.balanceAmount > 0 ? resDto.balanceAmount : 0);
    setPaymentMode('CC');
    setKeyCardUid(`NFC-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`);

    try {
      const res = await api.request<PagedResult<RoomDto>>(
        `/pms/rooms?status=CLN&pageSize=50`
      );
      if (res.success && res.data) {
        setAvailableRooms(res.data.items);
        const matchingRoom = res.data.items.find(r => r.roomTypeCode === resDto.roomTypeCode);
        if (matchingRoom) {
          setSelectedRoomId(matchingRoom.id);
        } else if (res.data.items.length > 0) {
          setSelectedRoomId(res.data.items[0].id);
        }
      }
    } catch {
      setCheckInError('Unable to load inspected rooms. Please verify housekeeping turnover status.');
    }
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || !selectedRoomId) {
      setCheckInError('Please select a clean room for check-in.');
      return;
    }

    setIsSubmitting(true);
    setCheckInError(null);
    try {
      const res = await api.request<ReservationDto>('/pms/front-office/check-in', {
        method: 'POST',
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          roomId: selectedRoomId,
          keyCardUid: keyCardUid.trim(),
          advanceDeposit: advanceDeposit > 0 ? advanceDeposit : null,
          paymentModeCode: advanceDeposit > 0 ? paymentMode : null,
        }),
      });

      if (res.success) {
        const guest = selectedReservation.guestName;
        setSelectedReservation(null);
        setSuccessMessage(`Check-in successful! Guest ${guest} has been assigned their room and electronic key card issued.`);
        setTimeout(() => setSuccessMessage(null), 6000);
        fetchArrivals();
      } else {
        setCheckInError(res.message || 'Check-in failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary
  const vipCount = arrivals.filter(a => a.guestVip && a.guestVip !== 'Standard').length;
  const totalBalanceDue = arrivals.reduce((acc, a) => acc + (a.balanceAmount || 0), 0);

  const columns: ColumnDef<ReservationDto>[] = [
    {
      accessorKey: 'confirmationNumber',
      header: 'Booking #',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {row.original.confirmationNumber}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {row.original.bookingSource}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'guestName',
      header: 'Guest Details',
      cell: ({ row }) => (
        <div className="py-0.5">
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{row.original.guestName}</span>
            {row.original.guestVip && row.original.guestVip !== 'Standard' && (
              <Badge variant="warning" size="sm" className="font-bold flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 text-amber-500" />
                <span>{row.original.guestVip}</span>
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {row.original.guestPhone || 'No contact on file'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'roomTypeCode',
      header: 'Room Type',
      cell: ({ row }) => (
        <Badge variant="neutral" size="sm" className="font-mono">
          {row.original.roomTypeCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'checkInDate',
      header: 'Stay Schedule',
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {row.original.checkInDate} <span className="text-slate-400">&rarr;</span> {row.original.checkOutDate}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'ratePerNight',
      header: 'Nightly Rate',
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          ${Number(row.original.ratePerNight).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'totalEstimatedAmount',
      header: 'Total Est.',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          ${Number(row.original.totalEstimatedAmount).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Due at Desk',
      cell: ({ row }) => {
        const bal = Number(row.original.balanceAmount || 0);
        return bal > 0 ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">
            ${bal.toFixed(2)}
          </span>
        ) : (
          <Badge variant="success" size="sm">Prepaid</Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Button
          size="xs"
          onClick={() => handleOpenCheckInModal(row.original)}
          className="shadow-sm font-semibold flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Check In</span>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Front Office', href: '/front-office/room-grid' },
          { label: 'Arrivals & Check-In' },
        ]}
        title="Arrivals & Check-In Queue"
        subtitle="Expected arrivals, room allocation, key generation, and advance deposit"
        icon={<LogIn className="w-4 h-4" />}
        badge={<Badge variant="info">Front Desk</Badge>}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchArrivals}
              disabled={isLoading}
            >
              Refresh Queue
            </Button>
          </PageActions>
        }
      />

      {successMessage && (
        <Alert
          type="success"
          title="Operation Succeeded"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* KPI Pulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total In Queue
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              VIP Guests
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {vipCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Arrivals Balance Due
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${totalBalanceDue.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Desk Operations
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
              Active Shift Open
            </div>
          </div>
        </Card>
      </div>

      {/* Arrivals DataTable */}
      <DataTable<ReservationDto>
        title="Expected Arrivals Today"
        subtitle="Live arrival manifest linked directly with reservation folios and room turnover"
        data={arrivals}
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
        onRefresh={fetchArrivals}
        searchPlaceholder="Filter by booking # or guest name..."
        exportFileName="todays_arrivals.csv"
      />

      {/* Check-In Modal */}
      {selectedReservation && (
        <Modal
          isOpen={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          title="Process Guest Check-In"
          subtitle={`${selectedReservation.guestName} • Booking #${selectedReservation.confirmationNumber}`}
          icon={<LogIn className="w-4 h-4" />}
          size="lg"
          onSubmit={handleConfirmCheckIn}
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
                size="sm"
                disabled={isSubmitting || availableRooms.length === 0}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Confirm &amp; Issue Key
              </Button>
            </>
          }
        >
          {checkInError && (
            <Alert type="error" message={checkInError} />
          )}

          {/* Room Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Allocate Clean &amp; Inspected Room <span className="text-danger">*</span>
            </label>
            {availableRooms.length > 0 ? (
              <Select
                value={selectedRoomId || ''}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                className="font-medium text-xs"
              >
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} &mdash; Floor {r.floorNumber} ({r.roomTypeCode}) &bull; ${r.baseRatePerNight}/night
                  </option>
                ))}
              </Select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>No clean rooms currently available for this type. Please check the Housekeeping Status Board for turnover.</span>
              </div>
            )}
          </div>

          {/* Key Card UID */}
          <div>
            <Input
              label="Key Card Serial / NFC UID"
              type="text"
              value={keyCardUid}
              onChange={(e) => setKeyCardUid(e.target.value)}
              leftIcon={<Key className="w-4 h-4 text-slate-400" />}
              placeholder="e.g. NFC-842-9102"
              className="font-mono"
            />
          </div>

          {/* Advance Deposit Collection */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border dark:border-navy-800">
            <div>
              <Input
                label="Advance Deposit ($)"
                type="number"
                step="0.01"
                value={advanceDeposit}
                onChange={(e) => setAdvanceDeposit(Number(e.target.value))}
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
                placeholder="Choose payment channel..."
              />
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="bg-slate-50 dark:bg-navy-800/60 p-3.5 rounded-xl border border-border dark:border-navy-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Estimated Total Stay:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${Number(selectedReservation.totalEstimatedAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Previously Paid:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ${Number(selectedReservation.paidAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-navy-700">
              <span>Balance Due at Desk:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">
                ${Number(selectedReservation.balanceAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
