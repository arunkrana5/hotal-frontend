import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { DynamicDropdown } from '@/components/dynamic-dropdown/DynamicDropdown';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  VisitorLogDto,
  CheckInVisitorRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  ShieldCheck,
  Plus,
  LogOut,
  MapPin,
  CheckCircle2,
  Clock,
  X,
  UserCheck,
  Users,
} from 'lucide-react';

export const VisitorLogScreen: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorLogDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const { documentNumber: visNumber, isLoading: isVisLoading, refetch: refetchVis } = useDocumentNumber('VISITOR_PASS');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newVisitor, setNewVisitor] = useState<CheckInVisitorRequest>({
    visitorName: '',
    idType: 'NATIONAL_ID',
    idNumber: '',
    phone: '',
    purpose: '',
    visitingDepartment: 'FO',
    roomOrArea: '',
    badgeNumber: '',
  });

  const fetchVisitors = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<VisitorLogDto>>(`/security/visitors?${query.toString()}`);
    if (res.success && res.data) {
      setVisitors(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVisitors();
  }, [pageIndex, pageSize, search, statusFilter]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<VisitorLogDto>('/security/visitors/check-in', {
      ...newVisitor,
      badgeNumber: newVisitor.badgeNumber || visNumber,
    });
    if (res.success) {
      setShowModal(false);
      setNewVisitor({
        visitorName: '',
        idType: 'NATIONAL_ID',
        idNumber: '',
        phone: '',
        purpose: '',
        visitingDepartment: 'FO',
        roomOrArea: '',
        badgeNumber: '',
      });
      fetchVisitors();
    }
    setSubmitting(false);
  };

  const handleCheckOut = async (id: number) => {
    await api.put(`/security/visitors/${id}/check-out`, {});
    fetchVisitors();
  };

  const onSiteCount = visitors.filter(v => v.status === 'CHECKED_IN').length;

  const columns = useMemo<ColumnDef<VisitorLogDto>[]>(
    () => [
      {
        accessorKey: 'badgeNumber',
        header: 'Pass #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {(info.getValue() as string) || 'V-VISITOR'}
          </span>
        ),
      },
      {
        accessorKey: 'visitorName',
        header: 'Visitor Details',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">{info.getValue() as string}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {info.row.original.phone || 'No phone'} • {info.row.original.idNumber}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'purpose',
        header: 'Visit Purpose',
        cell: (info) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs block">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'roomOrArea',
        header: 'Destination Area',
        cell: (info) => (
          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{(info.getValue() as string) || info.row.original.visitingDepartment}</span>
          </div>
        ),
      },
      {
        accessorKey: 'checkInTime',
        header: 'Entry Time',
        cell: (info) => (
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
            {new Date(info.getValue() as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          return s === 'CHECKED_IN' ? (
            <Badge variant="success" dot>On Premises</Badge>
          ) : (
            <Badge variant="neutral">Departed</Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Security Action',
        cell: (info) => {
          const v = info.row.original;
          if (v.status === 'CHECKED_IN') {
            return (
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleCheckOut(v.id)}
                className="font-semibold text-xs flex items-center gap-1"
              >
                <LogOut className="w-3 h-3 text-rose-500" />
                <span>Check Out</span>
              </Button>
            );
          }
          return <span className="text-xs text-slate-400 font-mono">&mdash;</span>;
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
          { label: 'Security', href: '/security/visitors' },
          { label: 'Visitor Log' },
        ]}
        title="Hotel Security & Visitor Gatehouse"
        subtitle="Visitor registration, access badge issuance, contractor verification & premises manifest"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Gate Visitor
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
              Total Logged Entries
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Visitors
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Currently On Premises
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {onSiteCount} Inside
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gatehouse Desk
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              Active Guard Shift
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Access Badges
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Passes Controlled
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
            <option value="">All Visitor Statuses</option>
            <option value="CHECKED_IN">On Premises Only</option>
            <option value="CHECKED_OUT">Departed</option>
          </Select>
        </div>
      </div>

      {/* Visitors DataTable */}
      <DataTable<VisitorLogDto>
        title="Visitor Gatehouse Register"
        subtitle="Live security access records with national identity numbers and host departments"
        data={visitors}
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
        onRefresh={fetchVisitors}
        searchPlaceholder="Filter visitors by name, pass, phone..."
        exportFileName="visitor_log.csv"
      />

      {/* Register Visitor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Gate Visitor / Contractor"
        subtitle="Verify government ID and issue security pass badge"
        icon={<ShieldCheck className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCheckIn}
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
              disabled={submitting || !newVisitor.visitorName || !newVisitor.idNumber}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Issue Access Badge
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={visNumber}
          label="Visitor Gate Pass Number"
          isLoading={isVisLoading}
          onRefresh={refetchVis}
          helperText="Auto-assigned sequentially by Security Access Engine"
        />

        <FormGrid cols={2}>
          <Input
            label="Visitor Full Name *"
            required
            value={newVisitor.visitorName}
            onChange={(e) => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
            placeholder="e.g. David Hassel"
          />
          <Input
            label="Phone / Mobile *"
            required
            value={newVisitor.phone}
            onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
            placeholder="+1 (555) 432-1098"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ID Document
            </label>
            <Select
              value={newVisitor.idType}
              onChange={(e) => setNewVisitor({ ...newVisitor, idType: e.target.value })}
            >
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driver's License</option>
            </Select>
          </div>

          <Input
            label="ID Number *"
            required
            value={newVisitor.idNumber}
            onChange={(e) => setNewVisitor({ ...newVisitor, idNumber: e.target.value })}
            placeholder="e.g. ID-89421"
            className="font-mono"
          />

          <Input
            label="Pass / Badge #"
            value={newVisitor.badgeNumber}
            onChange={(e) => setNewVisitor({ ...newVisitor, badgeNumber: e.target.value })}
            placeholder="e.g. PASS-04"
            className="font-mono"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Visiting Department
            </label>
            <DynamicDropdown
              masterCode="DEPARTMENT"
              value={newVisitor.visitingDepartment}
              onChange={(val) => setNewVisitor({ ...newVisitor, visitingDepartment: val })}
              placeholder="Select Department..."
            />
          </div>

          <Input
            label="Destination Room / Area"
            value={newVisitor.roomOrArea}
            onChange={(e) => setNewVisitor({ ...newVisitor, roomOrArea: e.target.value })}
            placeholder="e.g. Suite 402 or Kitchen Dock"
          />
        </FormGrid>

        <div>
          <Input
            label="Purpose of Visit *"
            required
            value={newVisitor.purpose}
            onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
            placeholder="e.g. Kitchen equipment inspection / Guest visitor"
          />
        </div>
      </Modal>
    </PageContainer>
  );
};
