import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import { EmployeeDto, CreateEmployeeRequest } from '@/types/erp';
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
  Briefcase,
  Plus,
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Download,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const StaffDirectoryScreen: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<EmployeeDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (departmentFilter !== 'ALL') query.append('department', departmentFilter);
    if (activeTab === 'ACTIVE') query.append('status', 'ACTIVE');
    if (activeTab === 'INACTIVE') query.append('status', 'INACTIVE');

    const res = await api.get<PagedResult<EmployeeDto>>(`/hr/employees?${query.toString()}`);
    if (res.success && res.data) {
      setEmployees(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, departmentFilter, activeTab]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.employeeCode.trim() || !newEmployee.firstName.trim() || !newEmployee.lastName.trim()) {
      setErrorMsg('Employee code, first name, and last name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const res = await api.post<EmployeeDto>('/hr/employees', newEmployee);
    if (res.success) {
      setShowCreateDrawer(false);
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
    } else {
      setErrorMsg(res.message || 'Failed to onboard employee.');
    }
    setSubmitting(false);
  };

  const columns: ColumnDef<EmployeeDto>[] = useMemo(
    () => [
      {
        accessorKey: 'employeeCode',
        header: 'Staff ID',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: 'Employee Name',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            <div className="text-[11px] text-brand-muted">
              {info.row.original.designation || 'Staff Member'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'departmentCode',
        header: 'Department',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'employmentType',
        header: 'Employment Type',
        cell: (info) => (
          <span className="text-xs text-brand-text capitalize">
            {(info.getValue() as string || 'FULL_TIME').replace(/_/g, ' ').toLowerCase()}
          </span>
        ),
      },
      {
        accessorKey: 'dateOfJoining',
        header: 'Date of Joining',
        cell: (info) => (
          <span className="font-mono text-xs text-brand-muted">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-brand-text flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.original.email || 'N/A'}</span>
            </div>
            {row.original.phone && (
              <div className="text-brand-muted font-mono text-[11px] flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{row.original.phone}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string || 'ACTIVE'} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onView={() => setSelectedStaff(row.original)}
            isActive={row.original.status !== 'INACTIVE'}
            onToggleStatus={() => {}}
          />
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Human Resources & Staff Directory"
        badge={<StatusBadge status="ACTIVE" label="Enterprise Personnel" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Onboard Staff Member
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Personnel', count: totalCount },
          { id: 'ACTIVE', label: 'Active on Duty' },
          { id: 'INACTIVE', label: 'Offboarded / Leave' },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff by name, code, designation..."
        filters={[
          {
            id: 'dept',
            label: 'Department',
            value: departmentFilter,
            options: [
              { label: 'All Departments', value: 'ALL' },
              { label: 'Front Office (FO)', value: 'FO' },
              { label: 'Housekeeping (HK)', value: 'HK' },
              { label: 'Food & Beverage (FB)', value: 'FB' },
              { label: 'Kitchen & Culinary (KIT)', value: 'KIT' },
              { label: 'Maintenance & Eng (ENG)', value: 'ENG' },
              { label: 'Security & Safety (SEC)', value: 'SEC' },
              { label: 'Finance & Accounts (FIN)', value: 'FIN' },
              { label: 'IT & Systems (IT)', value: 'IT' },
            ],
            onChange: setDepartmentFilter,
            width: 'w-48',
          },
        ]}
        onResetFilters={() => {
          setSearch('');
          setDepartmentFilter('ALL');
        }}
        isFiltered={search !== '' || departmentFilter !== 'ALL'}
      />

      {/* 4. Data Table */}
      <DataTable
        data={employees}
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

      {/* 5. Onboard Employee Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateEmployee}
        title="Onboard New Employee"
        subtitle="Create official personnel record and assign department role"
        submitText={submitting ? 'Onboarding...' : 'Onboard Employee'}
        isLoading={submitting}
        width="lg"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Employee Profile" description="Legal name and staff identifier">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Staff ID / Employee Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EMP-2026-042"
              value={newEmployee.employeeCode}
              onChange={(e) => setNewEmployee({ ...newEmployee, employeeCode: e.target.value.toUpperCase() })}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Department *
            </label>
            <select
              value={newEmployee.departmentCode}
              onChange={(e) => setNewEmployee({ ...newEmployee, departmentCode: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              <option value="FO">Front Office</option>
              <option value="HK">Housekeeping</option>
              <option value="FB">Food &amp; Beverage</option>
              <option value="KIT">Kitchen</option>
              <option value="ENG">Engineering &amp; Maintenance</option>
              <option value="SEC">Security</option>
              <option value="FIN">Finance</option>
              <option value="IT">IT Department</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robert"
              value={newEmployee.firstName}
              onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vance"
              value={newEmployee.lastName}
              onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Designation / Job Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Front Office Manager / Executive Sous Chef"
              value={newEmployee.designation}
              onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>

        <FormSection title="Employment Contract & Contact" description="Salary, joining date, and contact channels">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Date of Joining
            </label>
            <input
              type="date"
              value={newEmployee.dateOfJoining}
              onChange={(e) => setNewEmployee({ ...newEmployee, dateOfJoining: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Employment Classification
            </label>
            <select
              value={newEmployee.employmentType}
              onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            >
              <option value="FULL_TIME">Full-Time Staff</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contractor</option>
              <option value="SEASONAL">Seasonal Peak Worker</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="robert.vance@hotelos.com"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 882-1920"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Staff Detail Drawer */}
      {selectedStaff && (
        <DetailDrawer
          isOpen={!!selectedStaff}
          onClose={() => setSelectedStaff(null)}
          title={selectedStaff.fullName}
          subtitle={`Staff ID #${selectedStaff.employeeCode} | Department: ${selectedStaff.departmentCode}`}
          status={selectedStaff.status || 'ACTIVE'}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Designation</span>
                <span className="font-semibold text-brand-text">{selectedStaff.designation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Joined Date</span>
                <span className="font-mono text-brand-text">{new Date(selectedStaff.dateOfJoining).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Email</span>
                <span className="text-brand-text">{selectedStaff.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Phone</span>
                <span className="font-mono text-brand-text">{selectedStaff.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
