import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { HousekeepingTaskDto } from '@/types/operations';
import { RoomDto } from '@/types/pms';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  PageTabs,
  ListToolbar,
  RowActions,
  StatusBadge,
  FormDrawer,
  FormSection,
  DetailDrawer,
} from '@/components/enterprise';
import { DataTable } from '@/components/data-table/DataTable';
import {
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Clock,
  DoorOpen,
  AlertCircle,
  Download,
} from 'lucide-react';

export const HousekeepingTasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<HousekeepingTaskDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTaskDto | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [taskType, setTaskType] = useState<string>('DAILY_CLEAN');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab !== 'ALL') query.append('status', activeTab);
    if (priorityFilter !== 'ALL') query.append('priority', priorityFilter);
    if (taskTypeFilter !== 'ALL') query.append('taskType', taskTypeFilter);

    const res = await api.get<PagedResult<HousekeepingTaskDto>>(
      `/housekeeping/tasks?${query.toString()}`
    );
    if (res.success && res.data) {
      setTasks(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab, priorityFilter, taskTypeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const loadRooms = async () => {
    const res = await api.get<PagedResult<RoomDto>>('/pms/rooms?pageSize=100');
    if (res.success && res.data) {
      setAvailableRooms(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedRoomId(res.data.items[0].id);
      }
    }
  };

  const handleOpenCreateDrawer = () => {
    loadRooms();
    setShowCreateDrawer(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    setCreateSubmitting(true);
    setErrorMsg(null);
    const res = await api.post('/housekeeping/tasks', {
      roomId: Number(selectedRoomId),
      taskType,
      priority,
      remarks,
    });
    if (res.success) {
      setShowCreateDrawer(false);
      setRemarks('');
      fetchTasks();
    } else {
      setErrorMsg(res.message || 'Failed to create task.');
    }
    setCreateSubmitting(false);
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    const res = await api.put(`/housekeeping/tasks/${taskId}/status`, {
      status: newStatus,
    });
    if (res.success) {
      fetchTasks();
    }
  };

  const columns: ColumnDef<HousekeepingTaskDto>[] = useMemo(
    () => [
      {
        accessorKey: 'roomNumber',
        header: 'Room',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 font-mono">
            <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-xs text-brand-primary dark:text-[#8495FF]">
              #{info.getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'taskType',
        header: 'Task Type',
        cell: (info) => (
          <span className="font-semibold text-xs text-brand-text">
            {(info.getValue() as string).replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const p = (info.getValue() as string) || '';
          const variant = p === 'URGENT' || p === 'HIGH' ? 'danger' : p === 'MEDIUM' ? 'warning' : 'neutral';
          return <StatusBadge status={p} variant={variant} />;
        },
      },
      {
        accessorKey: 'assignedToStaffName',
        header: 'Assigned Attendant',
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? (
            <div className="flex items-center space-x-1 text-xs font-medium text-brand-text">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{val}</span>
            </div>
          ) : (
            <span className="text-[11px] text-brand-muted italic">Unassigned</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            {row.original.status === 'PENDING' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateStatus(row.original.id, 'IN_PROGRESS')}
                className="text-[11px] h-7"
                leftIcon={<Play className="w-3 h-3 text-[#2876C7]" />}
              >
                Start
              </Button>
            )}

            {row.original.status === 'IN_PROGRESS' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateStatus(row.original.id, 'INSPECTED')}
                className="text-[11px] h-7 text-[#16845B]"
                leftIcon={<CheckCircle2 className="w-3 h-3" />}
              >
                Finish
              </Button>
            )}

            <RowActions
              onView={() => setSelectedTask(row.original)}
              customActions={[
                {
                  label: 'Mark Clean & Inspected',
                  icon: <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />,
                  onClick: () => handleUpdateStatus(row.original.id, 'COMPLETED'),
                },
              ]}
            />
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
        title="Housekeeping Tasks & Cleaning"
        badge={<StatusBadge status="ACTIVE" label="Operations Active" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Tasks
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateDrawer}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Cleaning Task
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Tasks', count: totalCount },
          { id: 'PENDING', label: 'Pending Assignment' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'INSPECTED', label: 'Inspected' },
          { id: 'COMPLETED', label: 'Completed' },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room #, attendant name..."
        filters={[
          {
            id: 'priority',
            label: 'Priority',
            value: priorityFilter,
            options: [
              { label: 'All Priorities', value: 'ALL' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ],
            onChange: setPriorityFilter,
          },
          {
            id: 'taskType',
            label: 'Cleaning Type',
            value: taskTypeFilter,
            options: [
              { label: 'All Types', value: 'ALL' },
              { label: 'Daily Service', value: 'DAILY_CLEAN' },
              { label: 'Checkout Turn', value: 'CHECKOUT_CLEAN' },
              { label: 'Deep Sanitize', value: 'DEEP_CLEAN' },
              { label: 'Evening Turndown', value: 'TURNDOWN' },
            ],
            onChange: setTaskTypeFilter,
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setPriorityFilter('ALL');
          setTaskTypeFilter('ALL');
        }}
        isFiltered={search !== '' || priorityFilter !== 'ALL' || taskTypeFilter !== 'ALL'}
      />

      {/* 4. Data Table */}
      <DataTable
        data={tasks}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        enableSearch={false}
        enableExport={true}
      />

      {/* 5. Create Task Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateTask}
        title="Dispatch Cleaning Task"
        subtitle="Assign housekeeping task to room inventory"
        submitText={createSubmitting ? 'Dispatching...' : 'Dispatch Task'}
        isLoading={createSubmitting}
        width="md"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Task Parameters" description="Select target room and cleaning protocol">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Select Room *
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
              required
              className="w-full h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room #{r.roomNumber} - Floor {r.floorNumber} ({r.roomTypeCode}) - Current Status: {r.roomStatusCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Task Type *
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              <option value="DAILY_CLEAN">Daily Service Clean</option>
              <option value="CHECKOUT_CLEAN">Checkout Turnover</option>
              <option value="DEEP_CLEAN">Deep Sanitation</option>
              <option value="TURNDOWN">Evening Turndown</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              <option value="URGENT">Urgent (VIP Arriving)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium (Normal)</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Instructions &amp; Special Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Extra towels requested, change linen sets, restock minibar"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Detail Drawer */}
      {selectedTask && (
        <DetailDrawer
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task: Room #${selectedTask.roomNumber}`}
          subtitle={`Cleaning Type: ${selectedTask.taskType.replace(/_/g, ' ')}`}
          status={selectedTask.status}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Priority</span>
                <StatusBadge status={selectedTask.priority} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Attendant</span>
                <span className="font-semibold text-brand-text">{selectedTask.assignedToUserName || 'Unassigned'}</span>
              </div>
            </div>

            {selectedTask.remarks && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Special Instructions</span>
                <p className="text-brand-text">{selectedTask.remarks}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
