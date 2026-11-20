import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { GuestServiceRequestDto } from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Select, Textarea, FormGrid } from '@/components/common/Input';
import {
  BellRing,
  Plus,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const GuestRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<GuestServiceRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // Log Request Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [requestType, setRequestType] = useState<string>('EXTRA_TOWELS');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [department, setDepartment] = useState<string>('HOUSEKEEPING');
  const [description, setDescription] = useState<string>('');

  // Resolve Modal
  const [resolveTarget, setResolveTarget] = useState<GuestServiceRequestDto | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);

  const fetchRequests = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);
    if (departmentFilter) query.append('department', departmentFilter);

    const res = await api.get<PagedResult<GuestServiceRequestDto>>(`/operations/requests?${query.toString()}`);
    if (res.success && res.data) {
      setRequests(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [pageIndex, pageSize, statusFilter, departmentFilter]);

  const loadOccupiedRooms = async () => {
    const res = await api.get<PagedResult<RoomDto>>('/pms/rooms?status=OCC&pageSize=50');
    if (res.success && res.data) {
      setRooms(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedRoomId(res.data.items[0].id);
      }
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    setSubmitting(true);
    const res = await api.post('/operations/requests', {
      roomId: Number(selectedRoomId),
      requestType,
      department,
      priority,
      description,
    });
    setSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setSelectedRoomId('');
      setDescription('');
      await fetchRequests();
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;

    setResolving(true);
    const res = await api.put(`/operations/requests/${resolveTarget.id}/status`, {
      status: 'RESOLVED',
      resolutionNotes,
    });
    setResolving(false);

    if (res.success) {
      setResolveTarget(null);
      setResolutionNotes('');
      await fetchRequests();
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'OPEN').length;
  const urgentCount = requests.filter(r => r.priority === 'URGENT' || r.priority === 'HIGH').length;

  const columns = useMemo<ColumnDef<GuestServiceRequestDto>[]>(
    () => [
      {
        accessorKey: 'requestNumber',
        header: 'Ticket #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'roomNumber',
        header: 'Room & Guest',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Room {row.roomNumber}</span>
              {row.guestName && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.guestName}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'requestType',
        header: 'Service Category',
        cell: (info) => {
          const t = (info.getValue() as string) || '';
          return (
            <Badge variant="neutral" size="sm">
              {t.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Assigned Dept',
        cell: (info) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = (info.getValue() as string) || '';
          if (p === 'HIGH' || p === 'URGENT') {
            return <Badge variant="danger" size="sm" dot>{p}</Badge>;
          }
          if (p === 'MEDIUM') {
            return <Badge variant="warning" size="sm">{p}</Badge>;
          }
          return <Badge variant="neutral" size="sm">{p}</Badge>;
        },
      },
      {
        accessorKey: 'description',
        header: 'Request Details',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="max-w-xs">
              <p className="text-xs text-slate-800 dark:text-slate-200 truncate">{row.description}</p>
              {row.resolutionNotes && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate italic">
                  ✓ {row.resolutionNotes}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'PENDING' || s === 'OPEN') return <Badge variant="warning" dot>Pending</Badge>;
          if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return <Badge variant="brand" dot>In Progress</Badge>;
          if (s === 'RESOLVED' || s === 'COMPLETED') return <Badge variant="success">Resolved</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          const req = row.original;
          if (req.status === 'RESOLVED' || req.status === 'COMPLETED') {
            return (
              <span className="text-[11px] text-slate-400 font-medium">Closed</span>
            );
          }
          return (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setResolveTarget(req);
                setResolutionNotes('');
              }}
              className="font-semibold text-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Complete</span>
            </Button>
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
          { label: 'Front Office', href: '/front-office/room-grid' },
          { label: 'Guest Service Requests' },
        ]}
        title="Guest Requests &amp; Rapid Response"
        subtitle="Concierge tickets, housekeeping dispatches, room amenities, and SLA fulfillment"
        icon={<BellRing className="w-4 h-4" />}
        badge={<Badge variant="warning">Concierge</Badge>}
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                loadOccupiedRooms();
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Log Request
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Requests Logged
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active / In Queue
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High / Urgent SLA
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {urgentCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concierge Service
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              Active 24/7 Desk
            </div>
          </div>
        </Card>
      </div>

      {/* DataTable with Integrated Toolbar & Filters */}
      <DataTable<GuestServiceRequestDto>
        title="Active Service Requests"
        data={requests}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchRequests}
        exportFileName="guest_requests.csv"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Resolved', value: 'RESOLVED' },
            ],
            onChange: (val) => {
              setStatusFilter(val);
              setPageIndex(0);
            },
            width: 'w-40',
          },
          {
            id: 'dept',
            label: 'Department',
            value: departmentFilter,
            options: [
              { label: 'All Departments', value: '' },
              { label: 'Housekeeping', value: 'HOUSEKEEPING' },
              { label: 'Engineering', value: 'MAINTENANCE' },
              { label: 'Room Service', value: 'ROOM_SERVICE' },
              { label: 'Front Desk', value: 'FRONT_OFFICE' },
            ],
            onChange: (val) => {
              setDepartmentFilter(val);
              setPageIndex(0);
            },
            width: 'w-44',
          },
        ]}
      />

      {/* Log Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Guest Request Ticket"
        subtitle="Dispatch request directly to relevant department queue"
        icon={<Plus className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateRequest}
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
              disabled={submitting || !selectedRoomId || !description.trim()}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Dispatch Ticket
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Occupied Guest Room *
          </label>
          <Select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            required
          >
            <option value="">Select guest room...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} &mdash; Floor {r.floorNumber} ({r.roomTypeCode})
              </option>
            ))}
          </Select>
        </div>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Service Type
            </label>
            <Select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
            >
              <option value="EXTRA_TOWELS">Extra Towels &amp; Linens</option>
              <option value="ROOM_CLEANING">Turnover / Refresh</option>
              <option value="AMENITIES">Bathroom Amenities Refill</option>
              <option value="MINIBAR_RESTOCK">Mini-Bar Restock</option>
              <option value="LUGGAGE_ASSIST">Luggage Assistance</option>
              <option value="MAINTENANCE_AC">Air Conditioning Check</option>
              <option value="MAINTENANCE_PLUMBING">Plumbing / Water</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low (Normal Shift)</option>
              <option value="MEDIUM">Medium (Within 30m)</option>
              <option value="HIGH">High (Within 15m)</option>
              <option value="URGENT">Urgent (Immediate)</option>
            </Select>
          </div>
        </FormGrid>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Department
          </label>
          <Select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="HOUSEKEEPING">Housekeeping</option>
            <option value="MAINTENANCE">Engineering &amp; Maintenance</option>
            <option value="ROOM_SERVICE">Food &amp; Beverage / Room Service</option>
            <option value="FRONT_OFFICE">Front Desk &amp; Concierge</option>
          </Select>
        </div>

        <div>
          <Textarea
            label="Detailed Guest Request Notes *"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 2 additional bath sheets and hypoallergenic pillows requested by guest."
          />
        </div>
      </Modal>

      {/* Resolve Request Modal */}
      {resolveTarget && (
        <Modal
          isOpen={!!resolveTarget}
          onClose={() => setResolveTarget(null)}
          title="Resolve Service Request"
          subtitle={`Ticket #${resolveTarget.requestNumber} • Room ${resolveTarget.roomNumber}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          size="md"
          onSubmit={handleResolve}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResolveTarget(null)}
                disabled={resolving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                disabled={resolving}
                isLoading={resolving}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Mark Resolved
              </Button>
            </>
          }
        >
          <div>
            <Textarea
              label="Resolution &amp; Completion Notes"
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Delivered towels to guest in person; guest verified satisfied."
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
