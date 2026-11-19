import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { HousekeepingTaskDto } from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { Select, Textarea, FormGrid } from '@/components/common/Input';
import {
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  X,
  Clock,
  Layers,
} from 'lucide-react';

export const HousekeepingTasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<HousekeepingTaskDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [taskType, setTaskType] = useState<string>('DAILY_CLEAN');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [remarks, setRemarks] = useState<string>('');

  const fetchTasks = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter) query.append('status', statusFilter);
    if (taskTypeFilter) query.append('taskType', taskTypeFilter);
    if (priorityFilter) query.append('priority', priorityFilter);

    const res = await api.get<PagedResult<HousekeepingTaskDto>>(`/housekeeping/tasks?${query.toString()}`);
    if (res.success && res.data) {
      setTasks(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [pageIndex, pageSize, statusFilter, taskTypeFilter, priorityFilter]);

  const loadRooms = async () => {
    const res = await api.get<PagedResult<RoomDto>>('/pms/rooms?pageSize=100');
    if (res.success && res.data) {
      setAvailableRooms(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedRoomId(res.data.items[0].id);
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    setCreateSubmitting(true);
    const res = await api.post('/housekeeping/tasks', {
      roomId: Number(selectedRoomId),
      taskType,
      priority,
      remarks,
    });
    setCreateSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setSelectedRoomId('');
      setRemarks('');
      await fetchTasks();
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    const res = await api.put(`/housekeeping/tasks/${taskId}/status`, {
      status: newStatus,
    });
    if (res.success) {
      await fetchTasks();
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inspectedCount = tasks.filter(t => t.status === 'INSPECTED').length;

  const columns = useMemo<ColumnDef<HousekeepingTaskDto>[]>(
    () => [
      {
        accessorKey: 'taskNumber',
        header: 'Task #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'roomNumber',
        header: 'Room',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Room {row.roomNumber}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5 font-mono">
                (Floor {row.floorNumber} &bull; {row.roomTypeCode})
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'taskType',
        header: 'Task Scope',
        cell: (info) => {
          const type = (info.getValue() as string) || '';
          return (
            <Badge variant="neutral" size="sm">
              {type.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = (info.getValue() as string) || '';
          if (p === 'HIGH' || p === 'URGENT') return <Badge variant="danger" size="sm" dot>{p}</Badge>;
          if (p === 'MEDIUM') return <Badge variant="warning" size="sm">{p}</Badge>;
          return <Badge variant="neutral" size="sm">{p}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Progress',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'PENDING') return <Badge variant="warning" dot>Pending</Badge>;
          if (s === 'IN_PROGRESS') return <Badge variant="brand" dot>Cleaning Active</Badge>;
          if (s === 'COMPLETED') return <Badge variant="success">Completed</Badge>;
          if (s === 'INSPECTED') return <Badge variant="brand">Inspected &amp; OK</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        accessorKey: 'assignedToUserName',
        header: 'Attendant',
        cell: (info) => {
          const val = info.getValue() as string | undefined;
          return val ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{val}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Workflow Action',
        cell: (info) => {
          const task = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              {task.status === 'PENDING' && (
                <Button
                  size="xs"
                  onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                  className="font-semibold text-xs flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Start</span>
                </Button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                  className="font-semibold text-xs flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Done</span>
                </Button>
              )}
              {task.status === 'COMPLETED' && (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => handleUpdateStatus(task.id, 'INSPECTED')}
                  className="font-semibold text-xs flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Inspect</span>
                </Button>
              )}
              {task.status === 'INSPECTED' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Turnover Complete</span>
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
          { label: 'Housekeeping', href: '/housekeeping/status' },
          { label: 'Tasks & Turnover' },
        ]}
        title="Housekeeping Tasks &amp; Turnover"
        subtitle="Turnover assignments, deep cleans, supervisor QA inspections, and priority gating"
        icon={<Sparkles className="w-4 h-4" />}
        badge={<Badge variant="teal">Operations</Badge>}
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => {
                loadRooms();
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Dispatch Cleaning Task
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Shift Tasks
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
              Pending Turnover
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Currently Cleaning
            </div>
            <div className="text-xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
              {inProgressCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inspected &amp; Released
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {inspectedCount}
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
            <option value="">All Progress Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed (Needs QA)</option>
            <option value="INSPECTED">Inspected &amp; Approved</option>
          </Select>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={taskTypeFilter}
            onChange={(e) => {
              setTaskTypeFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Task Types</option>
            <option value="DAILY_CLEAN">Daily Clean</option>
            <option value="CHECKOUT_TURNOVER">Checkout Turnover</option>
            <option value="DEEP_CLEAN">Deep Clean</option>
            <option value="TURNDOWN">Evening Turndown</option>
          </Select>
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>
      </div>

      {/* Tasks DataTable */}
      <DataTable<HousekeepingTaskDto>
        title="Housekeeping Task Schedule"
        subtitle="Operational room turnover manifest synced with front desk departures"
        data={tasks}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchTasks}
        exportFileName="housekeeping_tasks.csv"
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Housekeeping Work Order"
        subtitle="Assign room cleaning or deep sanitization to housekeeping team"
        icon={<Sparkles className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateTask}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createSubmitting || !selectedRoomId}
              isLoading={createSubmitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Dispatch Task
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Room *
          </label>
          <Select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            required
          >
            <option value="">Choose room...</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} &mdash; Floor {r.floorNumber} ({r.roomTypeCode} &bull; Status: {r.roomStatusCode})
              </option>
            ))}
          </Select>
        </div>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cleaning Task Type
            </label>
            <Select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
            >
              <option value="DAILY_CLEAN">Daily In-Stay Clean</option>
              <option value="CHECKOUT_TURNOVER">Checkout Turnover (Full Reset)</option>
              <option value="DEEP_CLEAN">Deep Sanitization &amp; Carpet</option>
              <option value="TURNDOWN">Evening Turndown Service</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High (Next Arrival Expected)</option>
              <option value="URGENT">Urgent (VIP Arrival)</option>
            </Select>
          </div>
        </FormGrid>

        <div>
          <Textarea
            label="Special Housekeeping Directives / Instructions"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. VIP arrival at 2:00 PM; extra down pillows and orchid arrangement on dresser."
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
