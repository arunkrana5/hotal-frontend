import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ReservationDto } from '@/types/pms';
import { PagedResult } from '@/types/common';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Select } from '@/components/common/Input';
import {
  CalendarCheck,
  Plus,
  FileText,
  Calendar,
  CreditCard,
  Crown,
  Users,
  CheckCircle,
} from 'lucide-react';

export const ReservationListScreen: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        pageSize: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter.trim()) params.append('status', statusFilter.trim());

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
  }, [pageIndex, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONF':
        return <Badge variant="brand" dot>Confirmed</Badge>;
      case 'CHKI':
        return <Badge variant="success" dot>Checked In</Badge>;
      case 'CHKO':
        return <Badge variant="neutral">Checked Out</Badge>;
      case 'CANC':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'PROV':
        return <Badge variant="warning">Provisional</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

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
      header: 'Guest Name',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{row.original.guestName}</span>
            {row.original.guestVip && row.original.guestVip !== 'Standard' && (
              <Badge variant="warning" size="sm" className="font-bold flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 text-amber-500" />
                <span>{row.original.guestVip}</span>
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
      accessorKey: 'roomTypeCode',
      header: 'Room Type',
      cell: ({ row }) => (
        <Badge variant="neutral" size="sm" className="font-mono">
          {row.original.roomTypeCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedRoomNumber',
      header: 'Assigned Room',
      cell: ({ row }) =>
        row.original.assignedRoomNumber ? (
          <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
            Room {row.original.assignedRoomNumber}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Unassigned</span>
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
      accessorKey: 'totalEstimatedAmount',
      header: 'Total Value',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          ${Number(row.original.totalEstimatedAmount).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance',
      cell: ({ row }) => {
        const bal = Number(row.original.balanceAmount || 0);
        return bal > 0 ? (
          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 text-xs">
            ${bal.toFixed(2)}
          </span>
        ) : (
          <Badge variant="success" size="sm">Prepaid</Badge>
        );
      },
    },
    {
      accessorKey: 'reservationStatus',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.reservationStatus),
    },
    {
      id: 'actions',
      header: 'Folio',
      cell: ({ row }) => (
        <Link
          to={`/front-office/folios?reservationId=${row.original.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ledger</span>
        </Link>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Reservations', href: '/reservations' },
          { label: 'Booking Registry' },
        ]}
        title="Reservations &amp; Central Registry"
        subtitle="Reservation tracking, stay analytics, VIP classification, and room allocations"
        icon={<CalendarCheck className="w-4 h-4" />}
        badge={<Badge variant="info">PMS</Badge>}
        actions={
          <PageActions>
            <Link to="/reservations/new">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Reservation
              </Button>
            </Link>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Registrations
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In-House Active
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {reservations.filter(r => r.reservationStatus === 'CHKI').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              VIP Patrons
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {reservations.filter(r => r.guestVip && r.guestVip !== 'Standard').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pre-Arrival Status
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {reservations.filter(r => r.reservationStatus === 'CONF').length} Confirmed
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Reservation Statuses</option>
            <option value="CONF">Confirmed Only</option>
            <option value="CHKI">Checked In (In-House)</option>
            <option value="CHKO">Checked Out</option>
            <option value="CANC">Cancelled</option>
            <option value="PROV">Provisional</option>
          </Select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable<ReservationDto>
        title="Active Reservation Ledger"
        subtitle="Full audit trail across direct bookings, corporate agreements, and OTAs"
        data={reservations}
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
        onRefresh={fetchReservations}
        searchPlaceholder="Search confirmation # or guest..."
        exportFileName="reservations_manifest.csv"
      />
    </PageContainer>
  );
};
