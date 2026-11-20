import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  VisitorLogDto,
  CheckInVisitorRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { UniversalSelect } from '@/components/common/UniversalSelect';
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
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import {
  ShieldCheck,
  Plus,
  LogOut,
  MapPin,
  Download,
  AlertCircle,
  Phone,
  Clock,
} from 'lucide-react';

export const VisitorLogScreen: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorLogDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLogDto | null>(null);
  const { documentNumber: visNumber, isLoading: isVisLoading, refetch: refetchVis } = useDocumentNumber('VISITOR_PASS');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (search.trim()) query.append('search', search.trim());
    if (activeTab === 'ON_PREMISES') query.append('status', 'CHECKED_IN');
    if (activeTab === 'CHECKED_OUT') query.append('status', 'CHECKED_OUT');

    const res = await api.get<PagedResult<VisitorLogDto>>(`/security/visitors?${query.toString()}`);
    if (res.success && res.data) {
      setVisitors(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, search, activeTab]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.visitorName.trim()) {
      setErrorMsg('Visitor name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const res = await api.post<VisitorLogDto>('/security/visitors/check-in', {
      ...newVisitor,
      badgeNumber: newVisitor.badgeNumber || visNumber,
    });
    if (res.success) {
      setShowCreateDrawer(false);
      refetchVis();
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
    } else {
      setErrorMsg(res.message || 'Visitor check-in failed.');
    }
    setSubmitting(false);
  };

  const handleCheckOut = async (visitorId: number) => {
    const res = await api.put(`/security/visitors/${visitorId}/check-out`, {});
    if (res.success) {
      fetchVisitors();
    }
  };

  const columns: ColumnDef<VisitorLogDto>[] = useMemo(
    () => [
      {
        accessorKey: 'badgeNumber',
        header: 'Badge / Pass #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-brand-primary dark:text-[#8495FF]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'visitorName',
        header: 'Visitor Identity',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-xs">
              {info.getValue() as string}
            </div>
            {info.row.original.phone && (
              <div className="text-[11px] font-mono text-brand-muted flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{info.row.original.phone}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'visitingDepartment',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {row.original.visitingDepartment}
            </span>
            {row.original.roomOrArea && (
              <div className="text-[11px] text-brand-muted">
                Area: {row.original.roomOrArea}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'checkInTime',
        header: 'Check-In Stamp',
        cell: (info) => {
          const d = new Date(info.getValue() as string);
          return (
            <div className="text-xs font-mono">
              <span className="font-medium text-brand-text">{d.toLocaleDateString()}</span>{' '}
              <span className="text-[11px] text-brand-muted">{d.toLocaleTimeString()}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'checkOutTime',
        header: 'Check-Out Stamp',
        cell: (info) => {
          const val = info.getValue() as string;
          if (!val) return <span className="text-brand-muted italic text-[11px]">Still on premises</span>;
          const d = new Date(val);
          return (
            <div className="text-xs font-mono">
              <span className="font-medium text-brand-text">{d.toLocaleDateString()}</span>{' '}
              <span className="text-[11px] text-brand-muted">{d.toLocaleTimeString()}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          const isCheckedIn = s === 'CHECKED_IN' || s === 'IN';
          return (
            <StatusBadge
              status={isCheckedIn ? 'INHOUSE' : 'CHECKEDOUT'}
              label={isCheckedIn ? 'On Premises' : 'Departed'}
            />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isCheckedIn = row.original.status === 'CHECKED_IN' || row.original.status === 'IN';
          return (
            <div className="flex items-center space-x-2">
              {isCheckedIn && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleCheckOut(row.original.id)}
                  className="text-[11px] h-7 text-[#D44848]"
                  leftIcon={<LogOut className="w-3 h-3" />}
                >
                  Exit Gate
                </Button>
              )}
              <RowActions onView={() => setSelectedVisitor(row.original)} />
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Security & Visitor Access Logs"
        badge={<StatusBadge status="ACTIVE" label="Perimeter Gate Control" />}
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDrawer(true)}
              className="text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Issue Visitor Pass
            </Button>
          </PageActions>
        }
      />

      {/* 2. Page Tabs */}
      <PageTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'ALL', label: 'All Visitor Logs', count: totalCount },
          { id: 'ON_PREMISES', label: 'Currently on Premises' },
          { id: 'CHECKED_OUT', label: 'Departed Visitors' },
        ]}
      />

      {/* 3. List Toolbar */}
      <ListToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search visitor name, badge #, department..."
        onResetFilters={() => setSearch('')}
        isFiltered={search !== ''}
      />

      {/* 4. Data Table */}
      <DataTable
        data={visitors}
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

      {/* 5. Issue Visitor Pass Drawer */}
      <FormDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCheckIn}
        title="Issue Security Visitor Pass"
        subtitle="Record visitor credentials and destination before granting access"
        submitText={submitting ? 'Issuing...' : 'Grant Access Pass'}
        isLoading={submitting}
        width="md"
      >
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#D44848]/10 text-[#D44848] text-xs font-medium border border-[#D44848]/25 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormSection title="Visitor Identity" description="Legal identification and contact">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Badge / Pass # (Auto)
            </label>
            <input
              type="text"
              readOnly
              value={visNumber || 'Generating...'}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-brand-border bg-slate-100 dark:bg-brand-darkCard dark:border-brand-darkBorder text-brand-primary dark:text-[#8495FF]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Michael Scott"
              value={newVisitor.visitorName}
              onChange={(e) => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 991-2831"
              value={newVisitor.phone}
              onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>

          <div>
            <UniversalSelect
              label="Visiting Department"
              required
              size="sm"
              value={newVisitor.visitingDepartment}
              onChange={(val) => setNewVisitor({ ...newVisitor, visitingDepartment: val || 'FO' })}
              masterType="DEPARTMENT"
              options={[
                { value: 'FO', label: 'Front Office / Executive', badge: 'FO' },
                { value: 'ENG', label: 'Engineering / Facilities', badge: 'ENG' },
                { value: 'FB', label: 'Kitchen & Banquet', badge: 'FB' },
                { value: 'HK', label: 'Housekeeping Stores', badge: 'HK' },
                { value: 'HR', label: 'Human Resources', badge: 'HR' },
                { value: 'IT', label: 'Server Room & IT', badge: 'IT' },
              ]}
              clearable={false}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Visit Purpose / Destination Area
            </label>
            <input
              type="text"
              placeholder="e.g. Elevator annual safety inspection / Room 402 guest visitor"
              value={newVisitor.purpose}
              onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
            />
          </div>
        </FormSection>
      </FormDrawer>

      {/* 6. Visitor Detail Drawer */}
      {selectedVisitor && (
        <DetailDrawer
          isOpen={!!selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          title={selectedVisitor.visitorName}
          subtitle={`Pass #${selectedVisitor.badgeNumber} | Destination: ${selectedVisitor.visitingDepartment}`}
          status={selectedVisitor.status}
          width="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-slate-50/70 dark:bg-brand-darkCard grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Check-In Time</span>
                <span className="font-mono text-brand-text">{new Date(selectedVisitor.checkInTime).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-muted block">Phone</span>
                <span className="font-mono text-brand-text">{selectedVisitor.phone || 'N/A'}</span>
              </div>
            </div>

            {selectedVisitor.purpose && (
              <div className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface">
                <span className="text-[10px] font-bold uppercase text-brand-muted block mb-0.5">Visit Purpose</span>
                <p className="text-brand-text">{selectedVisitor.purpose}</p>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </PageContainer>
  );
};
