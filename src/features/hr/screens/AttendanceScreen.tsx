import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  AttendanceRecordDto,
  RecordAttendanceRequest,
  EmployeeDto,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Clock,
  Plus,
  RefreshCw,
  Calendar,
  X,
  CheckCircle2,
  Users,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const AttendanceScreen: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Punch Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [punchData, setPunchData] = useState<RecordAttendanceRequest>({
    employeeId: 0,
    date: new Date().toISOString().split('T')[0],
    checkInTime: '08:00',
    checkOutTime: '17:00',
    shift: 'MORNING',
    status: 'PRESENT',
    overtimeHours: 0,
    remarks: 'Regular daily roster shift',
  });

  const fetchRecords = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (dateFilter) query.append('date', dateFilter);

    const res = await api.get<PagedResult<AttendanceRecordDto>>(`/hr/attendance?${query.toString()}`);
    if (res.success && res.data) {
      setRecords(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await api.get<PagedResult<EmployeeDto>>('/hr/employees?pageSize=100');
    if (res.success && res.data && res.data.items) {
      const items = res.data.items;
      setEmployees(items);
      if (items.length > 0 && punchData.employeeId === 0) {
        setPunchData((prev) => ({ ...prev, employeeId: items[0].id }));
      }
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, [pageIndex, pageSize, dateFilter]);

  const handleRecordPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchData.employeeId) return;
    setSubmitting(true);
    const res = await api.post('/hr/attendance', punchData);
    if (res.success) {
      setShowModal(false);
      fetchRecords();
    }
    setSubmitting(false);
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  const overtimeTotal = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  const columns = useMemo<ColumnDef<AttendanceRecordDto>[]>(
    () => [
      {
        accessorKey: 'employeeCode',
        header: 'Staff ID',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'employeeName',
        header: 'Staff Member',
        cell: (info) => (
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
              {info.getValue() as string}
            </span>
            <span className="text-[11px] text-slate-400 font-mono shrink-0">
              ({info.row.original.departmentCode})
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'shift',
        header: 'Assigned Shift',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'checkInTime',
        header: 'Clock In',
        cell: (info) => (
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
            {(info.getValue() as string) || '&mdash;'}
          </span>
        ),
      },
      {
        accessorKey: 'checkOutTime',
        header: 'Clock Out',
        cell: (info) => (
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
            {(info.getValue() as string) || '&mdash;'}
          </span>
        ),
      },
      {
        accessorKey: 'overtimeHours',
        header: 'Overtime (Hrs)',
        cell: (info) => {
          const ot = info.getValue() as number;
          return ot > 0 ? (
            <Badge variant="purple" size="sm" className="font-mono font-bold">
              +{ot}h OT
            </Badge>
          ) : (
            <span className="text-slate-400 font-mono text-xs">0h</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'PRESENT') return <Badge variant="success" dot>Present</Badge>;
          if (s === 'LATE') return <Badge variant="warning" dot>Late Arrival</Badge>;
          if (s === 'ABSENT') return <Badge variant="danger" dot>Absent</Badge>;
          if (s === 'ON_LEAVE') return <Badge variant="brand">On Leave</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        accessorKey: 'remarks',
        header: 'Supervisor Notes',
        cell: (info) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs block">
            {(info.getValue() as string) || '&mdash;'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'HR', href: '/hr/staff' },
          { label: 'Attendance' },
        ]}
        title="Biometric Attendance & Shift Logs"
        subtitle="Timecard tracking, shift rosters, overtime calculation & payroll integration"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Timecard Punch
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Shift Records
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Logged
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On-Duty Present
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {presentCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Late Arrivals
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {lateCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Overtime
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tracking-tight font-mono">
              {overtimeTotal} Hours
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPageIndex(0);
            }}
          />
        </div>
      </div>

      {/* Attendance DataTable */}
      <DataTable<AttendanceRecordDto>
        title="Biometric Timecard Register"
        subtitle="Daily staff turnstile punches and duty roster logs"
        data={records}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchRecords}
        exportFileName="attendance_records.csv"
      />

      {/* Timecard Punch Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Manual Timecard Adjustment / Punch"
        subtitle="Log supervisor-approved shift attendance or duty punch"
        icon={<Clock className="w-4 h-4" />}
        size="lg"
        onSubmit={handleRecordPunch}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !punchData.employeeId}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Timecard
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Staff Member *
          </label>
          <Select
            value={punchData.employeeId}
            onChange={(e) => setPunchData({ ...punchData, employeeId: Number(e.target.value) })}
            required
          >
            <option value={0}>Choose employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.employeeCode} - {e.fullName} ({e.designation})
              </option>
            ))}
          </Select>
        </div>

        <FormGrid cols={2}>
          <Input
            label="Roster Date *"
            type="date"
            required
            value={punchData.date}
            onChange={(e) => setPunchData({ ...punchData, date: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shift
            </label>
            <Select
              value={punchData.shift}
              onChange={(e) => setPunchData({ ...punchData, shift: e.target.value })}
            >
              <option value="MORNING">Morning Shift (07:00 - 15:30)</option>
              <option value="EVENING">Evening Shift (15:00 - 23:30)</option>
              <option value="NIGHT">Night Shift (23:00 - 07:30)</option>
              <option value="GENERAL">General Shift (09:00 - 18:00)</option>
            </Select>
          </div>
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Check-In Time"
            type="time"
            value={punchData.checkInTime}
            onChange={(e) => setPunchData({ ...punchData, checkInTime: e.target.value })}
          />
          <Input
            label="Check-Out Time"
            type="time"
            value={punchData.checkOutTime}
            onChange={(e) => setPunchData({ ...punchData, checkOutTime: e.target.value })}
          />
          <Input
            label="Overtime (Hrs)"
            type="number"
            step="0.5"
            min="0"
            value={punchData.overtimeHours}
            onChange={(e) => setPunchData({ ...punchData, overtimeHours: Number(e.target.value) })}
          />
        </FormGrid>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Attendance Status
          </label>
          <Select
            value={punchData.status}
            onChange={(e) => setPunchData({ ...punchData, status: e.target.value })}
          >
            <option value="PRESENT">Present (Full Shift)</option>
            <option value="LATE">Late Arrival</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">Approved Leave</option>
            <option value="ABSENT">Unexcused Absence</option>
          </Select>
        </div>

        <div>
          <Textarea
            label="Supervisor Justification"
            rows={2}
            value={punchData.remarks}
            onChange={(e) => setPunchData({ ...punchData, remarks: e.target.value })}
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
