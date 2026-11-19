import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { BanquetBookingDto, BanquetVenueDto } from '@/types/operations';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  Wine,
  Plus,
  Calendar,
  Users,
  X,
  Building,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export const BanquetEventsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<BanquetBookingDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const { documentNumber: bnqNumber, isLoading: isBnqLoading, refetch: refetchBnq } = useDocumentNumber('BANQUET_BOOKING');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [venues, setVenues] = useState<BanquetVenueDto[]>([]);
  const [venueId, setVenueId] = useState<number | ''>('');
  const [eventName, setEventName] = useState<string>('');
  const [eventType, setEventType] = useState<string>('WEDDING');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-12-15T18:00');
  const [endDate, setEndDate] = useState<string>('2026-12-15T23:00');
  const [expectedGuests, setExpectedGuests] = useState<number>(100);
  const [totalAmount, setTotalAmount] = useState<number>(5000);
  const [advancePaid, setAdvancePaid] = useState<number>(2000);
  const [cateringPackage, setCateringPackage] = useState<string>('Royal Degustation');
  const [setupStyle, setSetupStyle] = useState<string>('ROUND_TABLE');

  const fetchBookings = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<BanquetBookingDto>>(`/banquet/bookings?${query.toString()}`);
    if (res.success && res.data) {
      setBookings(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  const fetchVenues = async () => {
    const res = await api.get<BanquetVenueDto[]>('/banquet/venues');
    if (res.success && res.data) {
      setVenues(res.data);
      if (res.data.length > 0) setVenueId(res.data[0].id);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pageIndex, pageSize, statusFilter]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) return;

    setSubmitting(true);
    const res = await api.post('/banquet/bookings', {
      venueId: Number(venueId),
      eventName,
      eventType,
      clientName,
      clientPhone,
      clientEmail,
      startDateTime: new Date(startDate).toISOString(),
      endDateTime: new Date(endDate).toISOString(),
      expectedGuests,
      totalAmount,
      advancePaid,
      cateringPackage,
      setupStyle,
    });
    setSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      await fetchBookings();
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const res = await api.put(`/banquet/bookings/${id}/status`, { status });
    if (res.success) {
      await fetchBookings();
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalGuests = bookings.reduce((sum, b) => sum + (b.expectedGuests || 0), 0);

  const columns = useMemo<ColumnDef<BanquetBookingDto>[]>(
    () => [
      {
        accessorKey: 'bookingNumber',
        header: 'Booking #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'eventName',
        header: 'Event & Client',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{row.eventName}</span>
                <Badge variant="neutral" size="sm">{row.eventType}</Badge>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Client: {row.clientName} &bull; {row.clientPhone}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'venueName',
        header: 'Venue Space',
        cell: (info) => (
          <Badge variant="brand" size="sm" className="font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'startDateTime',
        header: 'Event Schedule',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <div>{new Date(row.startDateTime).toLocaleDateString()}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {new Date(row.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
                {new Date(row.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'expectedGuests',
        header: 'Pax / Guests',
        cell: (info) => (
          <span className="font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
            {info.getValue() as number} Pax
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Contract Value',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                ${row.totalAmount.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                Adv: ${row.advancePaid.toFixed(2)}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'CONFIRMED') return <Badge variant="brand" dot>Confirmed</Badge>;
          if (s === 'IN_PROGRESS') return <Badge variant="warning" dot>Live Event</Badge>;
          if (s === 'COMPLETED') return <Badge variant="success">Completed</Badge>;
          if (s === 'CANCELLED') return <Badge variant="danger">Cancelled</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const b = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              {b.status === 'CONFIRMED' && (
                <Button
                  size="xs"
                  onClick={() => handleUpdateStatus(b.id, 'IN_PROGRESS')}
                  className="font-semibold text-xs"
                >
                  Start Event
                </Button>
              )}
              {b.status === 'IN_PROGRESS' && (
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                  className="font-semibold text-xs"
                >
                  Conclude
                </Button>
              )}
              {b.status === 'COMPLETED' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Archived</span>
                </span>
              )}
            </div>
          );
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
          { label: 'Banquets', href: '/banquet/events' },
          { label: 'Event Operations' },
        ]}
        title="Banquet & Event Operations"
        subtitle="Ballrooms, corporate summits, luxury weddings, catering packages & stage layouts"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                fetchVenues();
                setShowCreateModal(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Book Event Contract
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bookings
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Events
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Contracted Revenue
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expected Event Guests
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalGuests} Attendees
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Event Spaces
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
              Ballrooms &amp; Lawns
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Event Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">Live / In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Bookings DataTable */}
      <DataTable<BanquetBookingDto>
        title="Banquet Event Manifest"
        subtitle="Comprehensive event registry across ballrooms, outdoor lawns, and conference halls"
        data={bookings}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchBookings}
        exportFileName="banquet_events.csv"
      />

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Contract New Banquet Event"
        subtitle="Reserve venue hall, assign catering tier, and log initial deposit"
        icon={<Wine className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateBooking}
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
              disabled={submitting || !venueId}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm Banquet Contract
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={bnqNumber}
          label="Banquet Booking Number"
          isLoading={isBnqLoading}
          onRefresh={refetchBnq}
          helperText="Auto-assigned sequentially by Banquet Event Engine"
        />

        <FormGrid cols={2}>
          <Input
            label="Event Title *"
            required
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Vance Gala &amp; Awards"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Type
            </label>
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="WEDDING">Wedding Celebration</option>
              <option value="CONFERENCE">Corporate Conference</option>
              <option value="GALA">Annual Gala Dinner</option>
              <option value="BIRTHDAY">Private Birthday / Anniversary</option>
            </Select>
          </div>
        </FormGrid>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Venue Hall / Space *
          </label>
          <Select
            value={venueId}
            onChange={(e) => setVenueId(Number(e.target.value))}
            required
          >
            <option value="">Select event space...</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.venueName} &bull; Capacity: {v.maxCapacity} Pax (${v.hourlyRate}/hr)
              </option>
            ))}
          </Select>
        </div>

        <FormGrid cols={3}>
          <Input
            label="Client Full Name *"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Lady Vance"
          />
          <Input
            label="Client Phone *"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+1 (555) 304-9812"
          />
          <Input
            label="Client Email *"
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@luxuryevents.com"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Event Start Date &amp; Time *"
            type="datetime-local"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Event End Date &amp; Time *"
            type="datetime-local"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Expected Guests *"
            type="number"
            min="1"
            required
            value={expectedGuests}
            onChange={(e) => setExpectedGuests(Number(e.target.value))}
          />
          <Input
            label="Total Value ($) *"
            type="number"
            step="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="font-mono"
          />
          <Input
            label="Advance Deposit ($) *"
            type="number"
            step="0.01"
            required
            value={advancePaid}
            onChange={(e) => setAdvancePaid(Number(e.target.value))}
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Catering Tier / Menu Package"
            value={cateringPackage}
            onChange={(e) => setCateringPackage(e.target.value)}
            placeholder="e.g. Royal Degustation 5-Course"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Seating Setup
            </label>
            <Select
              value={setupStyle}
              onChange={(e) => setSetupStyle(e.target.value)}
            >
              <option value="ROUND_TABLE">Round Tables (Banquet)</option>
              <option value="THEATER">Theater Seating</option>
              <option value="CLASSROOM">Classroom Style</option>
              <option value="U_SHAPE">Executive U-Shape</option>
            </Select>
          </div>
        </FormGrid>
      </Modal>
    </PageContainer>
  );
};
