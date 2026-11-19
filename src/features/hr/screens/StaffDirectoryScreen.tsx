import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { EmployeeDto, CreateEmployeeRequest } from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  Mail,
  Phone,
  X,
  CheckCircle2,
  DollarSign,
  Users,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const StaffDirectoryScreen: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeRequest>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    departmentCode: 'FO',
    designation: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    basicSalary: 4000,
    email: '',
    phone: '',
    emergencyContact: '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search) query.append('search', search);
    if (departmentFilter) query.append('department', departmentFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<EmployeeDto>>(`/hr/employees?${query.toString()}`);
    if (res.success && res.data) {
      setEmployees(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [pageIndex, pageSize, search, departmentFilter, statusFilter]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<EmployeeDto>('/hr/employees', newEmployee);
    if (res.success) {
      setShowModal(false);
      setNewEmployee({
        employeeCode: '',
        firstName: '',
        lastName: '',
        departmentCode: 'FO',
        designation: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        basicSalary: 4000,
        email: '',
        phone: '',
        emergencyContact: '',
      });
      fetchEmployees();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.put(`/hr/employees/${id}/status`, { status });
    fetchEmployees();
  };

  const totalPayroll = employees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;

  const columns = useMemo<ColumnDef<EmployeeDto>[]>(
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
        accessorKey: 'fullName',
        header: 'Staff Member',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{info.row.original.designation}</div>
          </div>
        ),
      },
      {
        accessorKey: 'departmentCode',
        header: 'Department',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono font-bold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Staff Contacts',
        cell: (info) => (
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{info.getValue() as string}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{info.row.original.phone}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'employmentType',
        header: 'Contract Type',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'dateOfJoining',
        header: 'Hire Date',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'basicSalary',
        header: 'Monthly Compensation',
        cell: (info) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'ACTIVE') return <Badge variant="success" dot>Active</Badge>;
          if (s === 'ON_LEAVE') return <Badge variant="warning" dot>On Leave</Badge>;
          if (s === 'RESIGNED' || s === 'TERMINATED') return <Badge variant="danger">Inactive</Badge>;
          return <Badge variant="neutral">{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const emp = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              {emp.status === 'ACTIVE' ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleStatusChange(emp.id, 'ON_LEAVE')}
                  className="font-semibold text-[11px]"
                >
                  Set Leave
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleStatusChange(emp.id, 'ACTIVE')}
                  className="font-semibold text-[11px]"
                >
                  Activate
                </Button>
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
          { label: 'HR', href: '/hr/staff' },
          { label: 'Staff Directory' },
        ]}
        title="Human Resources & Staff Directory"
        subtitle="Hotel workforce master, departmental staffing, employment contracts & payroll compensation"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Onboard Staff Member
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
              Total Employees
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Staff
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active on Roster
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {activeCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Monthly Base Payroll
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tracking-tight font-mono">
              ${totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              HR Compliance
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Contracts Verified
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Hotel Departments</option>
            <option value="FO">Front Office</option>
            <option value="HK">Housekeeping</option>
            <option value="FB">Food &amp; Beverage</option>
            <option value="MAINT">Maintenance</option>
            <option value="SEC">Security</option>
            <option value="FIN">Finance &amp; Admin</option>
          </Select>
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Employment Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RESIGNED">Resigned / Former</option>
          </Select>
        </div>
      </div>

      {/* Employees DataTable */}
      <DataTable<EmployeeDto>
        title="Employee Master Register"
        subtitle="Confidential HR records synchronized across biometric timecards and payroll"
        data={employees}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSearchChange={(s) => {
          setSearch(s);
          setPageIndex(0);
        }}
        onRefresh={fetchEmployees}
        searchPlaceholder="Filter staff by name, code, role..."
        exportFileName="staff_directory.csv"
      />

      {/* Onboard Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Onboard New Staff Member"
        subtitle="Register employee details, department, contract, and payroll basic"
        icon={<Briefcase className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateEmployee}
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
              disabled={submitting || !newEmployee.employeeCode || !newEmployee.firstName}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Onboard Employee
            </Button>
          </>
        }
      >
        <FormGrid cols={3}>
          <Input
            label="Employee Code *"
            required
            value={newEmployee.employeeCode}
            onChange={(e) => setNewEmployee({ ...newEmployee, employeeCode: e.target.value })}
            placeholder="e.g. EMP-910"
            className="font-mono uppercase"
          />
          <Input
            label="First Name *"
            required
            value={newEmployee.firstName}
            onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
            placeholder="e.g. Liam"
          />
          <Input
            label="Last Name *"
            required
            value={newEmployee.lastName}
            onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
            placeholder="e.g. Gallagher"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Department
            </label>
            <DynamicDropdown
              masterCode="DEPARTMENT"
              value={newEmployee.departmentCode}
              onChange={(val) => setNewEmployee({ ...newEmployee, departmentCode: val })}
              placeholder="Select department..."
            />
          </div>

          <Input
            label="Designation / Job Title *"
            required
            value={newEmployee.designation}
            onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
            placeholder="e.g. Concierge Supervisor"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Employment Type
            </label>
            <Select
              value={newEmployee.employmentType}
              onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
            >
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contractual</option>
              <option value="INTERN">Intern / Trainee</option>
            </Select>
          </div>

          <Input
            label="Joining Date *"
            type="date"
            required
            value={newEmployee.dateOfJoining}
            onChange={(e) => setNewEmployee({ ...newEmployee, dateOfJoining: e.target.value })}
          />

          <Input
            label="Basic Salary ($) *"
            type="number"
            step="0.01"
            required
            value={newEmployee.basicSalary}
            onChange={(e) => setNewEmployee({ ...newEmployee, basicSalary: Number(e.target.value) })}
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Input
            label="Email Address *"
            type="email"
            required
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            placeholder="liam.g@hotelos.internal"
          />
          <Input
            label="Phone / Mobile *"
            type="tel"
            required
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            placeholder="+1 (555) 789-4321"
          />
        </FormGrid>
      </Modal>
    </PageContainer>
  );
};
