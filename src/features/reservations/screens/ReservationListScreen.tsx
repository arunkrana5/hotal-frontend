import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { ReservationDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  RowActions,
  StatusBadge,
  DetailDrawer,
  FinancialSummary,
} from '@/components/enterprise';
import {
  CalendarCheck,
  Plus,
  Crown,
  LogIn,
  LogOut,
  Calendar,
  Bed,
  User,
  CreditCard,
  Download,
} from 'lucide-react';

export const ReservationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Detail Drawer
  const [selectedBooking, setSelectedBooking] = useState<ReservationDto | null>(null);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusTab !== 'ALL') params.append('status', statusTab);
      if (sourceFilter !== 'ALL') params.append('bookingSource', sourceFilter);

      const res = await api.request<PagedResult<ReservationDto>>(
        `/pms/reservations?${params.toString()}`
      );
      if (res.success && res.data) {
        setReservations(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, search, statusTab, sourceFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const columns: ColumnDef<ReservationDto>[] = useMemo(
    () => [
      {
        accessorKey: 'confirmationNumber',
        header: 'Booking #',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
              {row.original.confirmationNumber}
            </span>
            <span className="text-[10px] text-brand-muted uppercase font-mono">
              {row.original.bookingSource || 'DIRECT'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'guestName',
        header: 'Guest Name',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
              <span>{row.original.guestName}</span>
              {row.original.guestVip && row.original.guestVip !== 'Standard' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5 text-amber-500" />
                  <span>{row.original.guestVip}</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-brand-muted">
              {row.original.adultsCount} Adults{row.original.childrenCount ? `, ${row.original.childrenCount} Kids` : ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'roomTypeCode',
        header: 'Room Allocation',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {row.original.roomTypeCode}
            </div>
            <div className="text-[11px] font-mono text-brand-muted">
              {row.original.assignedRoomNumber ? `Room #${row.original.assignedRoomNumber}` : 'Unallocated'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'checkInDate',
        header: 'Stay Schedule',
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5 font-mono">
            <div className="text-brand-text">
              In: {new Date(row.original.checkInDate).toLocaleDateString()}
            </div>
            <div className="text-brand-muted text-[11px]">
              Out: {new Date(row.original.checkOutDate).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'totalEstimatedAmount',
        header: 'Folio Total',
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
        accessorKey: 'reservationStatus',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.reservationStatus} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedBooking(row.original)}
            customActions={[
              ...(row.original.reservationStatus === 'CONF'
                ? [
                    {
                      label: 'Check In Guest',
                      icon: <LogIn className="w-3.5 h-3.5 text-[#16845B]" />,
                      onClick: () => navigate('/front-office/arrivals'),
                    },
                  ]
                : []),
              ...(row.original.reservationStatus === 'CHKI'
                ? [
                    {
                      label: 'Check Out Guest',
                      icon: <LogOut className="w-3.5 h-3.5 text-[#C78B24]" />,
                      onClick: () => navigate('/front-office/departures'),
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    [navigate]
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Reservations Management"
        badge={<StatusBadge status="ACTIVE" label="Central Reservation System" />}
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
            <Link to="/reservations/new">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Booking
              </Button>
            </Link>
          </PageActions>
        }
      />

      {/* 2. High-Contrast Segmented Status Tabs */}
      <PageTabs
        activeTab={statusTab}
        onChange={setStatusTab}
        tabs={[
          { id: 'ALL', label: 'All Bookings', count: totalCount },
          { id: 'CONF', label: 'Confirmed' },
          { id: 'CHKI', label: 'In-House (Checked In)' },
          { id: 'CHKO', label: 'Checked Out' },
          { id: 'PROV', label: 'Provisional' },
          { id: 'CANC', label: 'Cancelled' },
        ]}
      />

      {/* 3. Single-Row Filter Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search confirmation #, guest name, phone..."
        filters={[
          {
            id: 'source',
            label: 'Booking Source',
            value: sourceFilter,
            options: [
              { label: 'All Sources', value: 'ALL' },
              { label: 'Direct Booking', value: 'DIRECT' },
              { label: 'OTA / Booking.com', value: 'OTA' },
              { label: 'Corporate Contract', value: 'CORPORATE' },
              { label: 'Travel Agent', value: 'AGENT' },
            ],
            onChange: setSourceFilter,
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setSourceFilter('ALL');
        }}
        isFiltered={search !== '' || sourceFilter !== 'ALL'}
      />

      {/* 4. Data Table */}
      <DataTable
        data={reservations}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        enableSearch={false}
        enableExport={true}
      />

      {/* 5. Detail Drawer: Comprehensive Booking Inspection */}
      {selectedBooking && (
        <DetailDrawer
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.confirmationNumber}`}
          subtitle={`Guest: ${selectedBooking.guestName} | Source: ${selectedBooking.bookingSource || 'DIRECT'}`}
          status={selectedBooking.reservationStatus}
          width="lg"
          actions={
            <div className="flex items-center space-x-2">
              {selectedBooking.reservationStatus === 'CONF' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/front-office/arrivals')}
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Proceed to Check-In
                </Button>
              )}
              {selectedBooking.reservationStatus === 'CHKI' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/front-office/departures')}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Proceed to Check-Out
                </Button>
              )}
              <Link to="/front-office/folios">
                <Button variant="outline" size="sm" className="text-xs" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
                  Open Folio
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Stay Details Card */}
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Check-In Date</span>
                <span className="font-semibold text-brand-text">
                  {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Check-Out Date</span>
                <span className="font-semibold text-brand-text">
                  {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Room Type</span>
                <span className="font-semibold text-brand-text">{selectedBooking.roomTypeCode}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Room Assigned</span>
                <span className="font-mono font-bold text-brand-primary dark:text-[#8495FF]">
                  {selectedBooking.assignedRoomNumber ? `#${selectedBooking.assignedRoomNumber}` : 'Pending Check-In'}
                </span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <FinancialSummary
              subtotal={selectedBooking.totalEstimatedAmount || 0}
              grandTotal={selectedBooking.totalEstimatedAmount || 0}
              amountPaid={(selectedBooking.totalEstimatedAmount || 0) - (selectedBooking.balanceAmount || 0)}
              balanceDue={selectedBooking.balanceAmount || 0}
            />

            {/* Special Preferences & Notes */}
            {selectedBooking.specialRequests && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">
                  Special Guest Requests
                </span>
                <p className="text-xs text-brand-text leading-relaxed">{selectedBooking.specialRequests}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
