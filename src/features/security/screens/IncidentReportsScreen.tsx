import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { api } from '@/services/api';
import { PagedResult } from '@/types/common';
import {
  IncidentReportDto,
  CreateIncidentReportRequest,
} from '@/types/erp';
import { Button } from '@/components/common/Button';
import { Card, Badge } from '@/components/common/Card';
import { Input, Select, Textarea, FormGrid } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import { useDocumentNumber } from '@/hooks/useDocumentNumber';
import { DocumentNumberField } from '@/components/common/DocumentNumberField';
import {
  ShieldAlert,
  Plus,
  MapPin,
  X,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';

export const IncidentReportsScreen: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReportDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const { documentNumber: incNumber, isLoading: isIncLoading, refetch: refetchInc } = useDocumentNumber('INCIDENT_REPORT');
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReportDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form
  const [newIncident, setNewIncident] = useState<CreateIncidentReportRequest>({
    incidentDate: new Date().toISOString(),
    location: '',
    severity: 'MEDIUM',
    category: 'SECURITY',
    description: '',
    actionTaken: '',
  });

  // Status Form
  const [updatedStatus, setUpdatedStatus] = useState<string>('INVESTIGATING');
  const [updatedAction, setUpdatedAction] = useState<string>('');

  const fetchIncidents = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      pageSize: pageSize.toString(),
    });
    if (severityFilter) query.append('severity', severityFilter);
    if (statusFilter) query.append('status', statusFilter);

    const res = await api.get<PagedResult<IncidentReportDto>>(`/security/incidents?${query.toString()}`);
    if (res.success && res.data) {
      setIncidents(res.data.items);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, [pageIndex, pageSize, severityFilter, statusFilter]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post<IncidentReportDto>('/security/incidents', newIncident);
    if (res.success) {
      setShowCreateModal(false);
      setNewIncident({
        incidentDate: new Date().toISOString(),
        location: '',
        severity: 'MEDIUM',
        category: 'SECURITY',
        description: '',
        actionTaken: '',
      });
      fetchIncidents();
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    const res = await api.put(`/security/incidents/${selectedIncident.id}/status`, {
      status: updatedStatus,
      actionTaken: updatedAction,
    });
    if (res.success) {
      setShowStatusModal(false);
      setSelectedIncident(null);
      fetchIncidents();
    }
    setSubmitting(false);
  };

  const openStatus = (inc: IncidentReportDto) => {
    setSelectedIncident(inc);
    setUpdatedStatus(inc.status || 'INVESTIGATING');
    setUpdatedAction(inc.actionTaken || '');
    setShowStatusModal(true);
  };

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  const openCount = incidents.filter(i => i.status === 'REPORTED' || i.status === 'INVESTIGATING').length;

  const columns = useMemo<ColumnDef<IncidentReportDto>[]>(
    () => [
      {
        accessorKey: 'incidentNumber',
        header: 'Incident #',
        cell: (info) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => (
          <Badge variant="neutral" size="sm" className="font-mono">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Incident Location',
        cell: (info) => (
          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Incident Summary',
        cell: (info) => (
          <p className="text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs font-medium">
            {info.getValue() as string}
          </p>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'CRITICAL' || s === 'HIGH') return <Badge variant="danger" size="sm" dot>{s}</Badge>;
          if (s === 'MEDIUM') return <Badge variant="warning" size="sm">{s}</Badge>;
          return <Badge variant="neutral" size="sm">{s}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Resolution Status',
        cell: (info) => {
          const s = (info.getValue() as string) || '';
          if (s === 'CLOSED' || s === 'RESOLVED') return <Badge variant="success">Closed</Badge>;
          if (s === 'INVESTIGATING') return <Badge variant="warning" dot>Investigating</Badge>;
          return <Badge variant="brand" dot>{s}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: (info) => {
          const inc = info.row.original;
          if (inc.status !== 'CLOSED' && inc.status !== 'RESOLVED') {
            return (
              <Button
                size="xs"
                variant="outline"
                onClick={() => openStatus(inc)}
                className="font-semibold text-xs"
              >
                Update
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
          { label: 'Security', href: '/security/incidents' },
          { label: 'Incident Reports' },
        ]}
        title="Hotel Security Incidents & Safety Log"
        subtitle="Loss prevention, fire safety audits, guest incident investigations & legal compliance reports"
        actions={
          <PageActions>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Log Security Incident
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Recorded
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {totalCount} Incidents
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Investigations
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {openCount} Open
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Severity
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {criticalCount}
            </div>
          </div>
        </Card>

        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Loss Prevention
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Protocols Enforced
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPageIndex(0);
            }}
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
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
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_INVESTIGATION">In Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
      </div>

      {/* Incidents DataTable */}
      <DataTable<IncidentReportDto>
        title="Security &amp; Safety Incident Log"
        subtitle="Confidential audit trail for hotel safety officers, GM reviews, and insurance reporting"
        data={incidents}
        columns={columns}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        isLoading={loading}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={fetchIncidents}
        exportFileName="incident_reports.csv"
      />

      {/* Log Incident Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Security Incident Report"
        subtitle="File official incident report for hotel loss prevention"
        icon={<ShieldAlert className="w-4 h-4" />}
        size="lg"
        onSubmit={handleCreateIncident}
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
              disabled={submitting || !newIncident.location || !newIncident.description.trim()}
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              File Security Report
            </Button>
          </>
        }
      >
        <DocumentNumberField
          value={incNumber}
          label="Incident Report Number"
          isLoading={isIncLoading}
          onRefresh={refetchInc}
          helperText="Auto-assigned sequentially by Loss Prevention & Security Engine"
        />

        <FormGrid cols={2}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <Select
              value={newIncident.category}
              onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
            >
              <option value="SECURITY">Physical Security</option>
              <option value="GUEST_DISPUTE">Guest Dispute / Noise</option>
              <option value="THEFT_LOSS">Lost &amp; Found / Theft</option>
              <option value="FIRE_SAFETY">Fire / Environmental Safety</option>
              <option value="MEDICAL">Medical Emergency</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Severity
            </label>
            <Select
              value={newIncident.severity}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
        </FormGrid>

        <Input
          label="Location of Incident *"
          required
          value={newIncident.location}
          onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
          placeholder="e.g. Swimming Pool Deck / Floor 3 Service Elevator"
        />

        <div>
          <Textarea
            label="Detailed Incident Summary *"
            rows={3}
            required
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            placeholder="e.g. Unattended bag discovered near ballroom foyer; security perimeter established..."
          />
        </div>

        <div>
          <Textarea
            label="Immediate Action Taken"
            rows={2}
            value={newIncident.actionTaken}
            onChange={(e) => setNewIncident({ ...newIncident, actionTaken: e.target.value })}
            placeholder="e.g. Area cordoned off; CCTV reviewed; guest identified and property returned."
          />
        </div>
      </Modal>

      {/* Update Status Modal */}
      {selectedIncident && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={`Update Incident #${selectedIncident.incidentNumber}`}
          subtitle={`${selectedIncident.category} • ${selectedIncident.location}`}
          icon={<ShieldAlert className="w-4 h-4" />}
          size="md"
          onSubmit={handleUpdateStatus}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                isLoading={submitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Save Incident Status
              </Button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Resolution Status
            </label>
            <Select
              value={updatedStatus}
              onChange={(e) => setUpdatedStatus(e.target.value)}
            >
              <option value="INVESTIGATING">Under Investigation</option>
              <option value="ESCALATED_TO_GM">Escalated to General Manager</option>
              <option value="RESOLVED">Resolved &amp; Closed</option>
            </Select>
          </div>

          <div>
            <Textarea
              label="Investigation Notes &amp; Action Taken"
              rows={3}
              value={updatedAction}
              onChange={(e) => setUpdatedAction(e.target.value)}
              placeholder="Document findings and final corrective action..."
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
