import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Settings2, 
  RefreshCw, 
  History, 
  Edit3, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  X,
  Save,
  Search
} from 'lucide-react';
import { api } from '@/services/api';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { UniversalSelect } from '@/components/common/UniversalSelect';
import { FormDrawer, FormSection, DetailDrawer, StatusBadge } from '@/components/enterprise';

export interface DocumentConfig {
  id: number;
  propertyId: number;
  documentType: string;
  module: string;
  prefix: string;
  suffix?: string;
  dateFormat: string;
  sequenceLength: number;
  startingNumber: number;
  resetFrequency: string;
  currentSequence: number;
  lastResetDate: string;
  samplePreview: string;
  isActive: boolean;
}

export interface DocumentAudit {
  id: number;
  propertyId: number;
  documentType: string;
  documentNumber: string;
  generatedBy: string;
  generatedAt: string;
  entityId?: number;
  entityType?: string;
  status: string;
}

export const DocumentNumberingScreen: React.FC = () => {
  const [configs, setConfigs] = useState<DocumentConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConfig, setSelectedConfig] = useState<DocumentConfig | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [audits, setAudits] = useState<DocumentAudit[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Edit form state
  const [editPrefix, setEditPrefix] = useState<string>('');
  const [editSuffix, setEditSuffix] = useState<string>('');
  const [editDateFormat, setEditDateFormat] = useState<string>('yyyyMMdd');
  const [editSeqLength, setEditSeqLength] = useState<number>(4);
  const [editStartingNumber, setEditStartingNumber] = useState<number>(1);
  const [editResetFrequency, setEditResetFrequency] = useState<string>('DAILY');

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<DocumentConfig[]>('/documents/configurations');
      if (res.success && res.data) {
        setConfigs(res.data);
      }
    } catch (err) {
      console.error('Failed to load document numbering configurations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAudits = async (docType?: string) => {
    try {
      setIsAuditLoading(true);
      const url = docType 
        ? `/documents/audits?documentType=${encodeURIComponent(docType)}&pageSize=50`
        : '/documents/audits?pageSize=50';
      const res = await api.get<{ items: DocumentAudit[] }>(url);
      if (res.success && res.data?.items) {
        setAudits(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load document audits:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleOpenEdit = (cfg: DocumentConfig) => {
    setSelectedConfig(cfg);
    setEditPrefix(cfg.prefix);
    setEditSuffix(cfg.suffix || '');
    setEditDateFormat(cfg.dateFormat);
    setEditSeqLength(cfg.sequenceLength);
    setEditStartingNumber(cfg.startingNumber);
    setEditResetFrequency(cfg.resetFrequency);
    setIsEditModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;

    try {
      setIsSaving(true);
      await api.put(`/documents/configurations/${selectedConfig.id}`, {
        prefix: editPrefix,
        suffix: editSuffix || null,
        dateFormat: editDateFormat,
        sequenceLength: Number(editSeqLength),
        startingNumber: Number(editStartingNumber),
        resetFrequency: editResetFrequency,
        isActive: true,
      });

      setIsEditModalOpen(false);
      setSelectedConfig(null);
      await fetchConfigs();
    } catch (err) {
      console.error('Failed to update numbering configuration:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const computeModalPreview = () => {
    const cleanPrefix = editPrefix.replace(/-+$/, '');
    const today = new Date();
    let dateStr = '';
    if (editDateFormat === 'yyyyMMdd') {
      dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    } else if (editDateFormat === 'yyyyMM') {
      dateStr = today.toISOString().slice(0, 7).replace(/-/g, '');
    } else if (editDateFormat === 'yyyy') {
      dateStr = today.getFullYear().toString();
    }
    const datePart = dateStr ? `-${dateStr}` : '';
    const seq = String(editStartingNumber).padStart(editSeqLength, '0');
    const suffixPart = editSuffix ? `-${editSuffix.replace(/^-+/, '')}` : '';
    return `${cleanPrefix}${datePart}-${seq}${suffixPart}`;
  };

  const filteredConfigs = configs.filter(c => 
    c.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      {/* Strict Minimal Clean Header */}
      <PageHeader
        title="Document Numbering"
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAudits();
                setIsAuditModalOpen(true);
              }}
              className="text-xs h-8 sm:h-9"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Audit Trail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfigs}
              disabled={isLoading}
              className="text-xs h-8 sm:h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface dark:bg-navy-900 p-3 rounded-xl border border-border dark:border-navy-700/80 shadow-soft-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by type, prefix, module..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-navy-800 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-navy-700">
              {configs.length} Sequences Active
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-navy-600">•</span>
            <span className="hidden sm:inline">Thread-Safe PostgreSQL Row Locks</span>
          </div>
        </div>

        {/* Configurations Table */}
        <Card className="overflow-hidden border border-border dark:border-navy-700/80 p-0 shadow-soft-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border dark:border-navy-700/80 bg-slate-50/75 dark:bg-navy-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3.5">Module</th>
                  <th className="py-2.5 px-3.5">Document Type</th>
                  <th className="py-2.5 px-3.5">Prefix / Suffix</th>
                  <th className="py-2.5 px-3.5">Date Format</th>
                  <th className="py-2.5 px-3.5">Seq Length</th>
                  <th className="py-2.5 px-3.5">Reset Period</th>
                  <th className="py-2.5 px-3.5">Current Counter</th>
                  <th className="py-2.5 px-3.5">Live Preview</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-navy-700/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-600" />
                      Loading document sequences...
                    </td>
                  </tr>
                ) : filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No document sequences match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((cfg) => (
                    <tr
                      key={cfg.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-medium text-slate-700 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                          {cfg.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {cfg.documentType}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {cfg.prefix}
                        {cfg.suffix ? ` / ${cfg.suffix}` : ''}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {cfg.dateFormat}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">
                        {cfg.sequenceLength} digits
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                          {cfg.resetFrequency}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        #{cfg.currentSequence}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-indigo-50/80 dark:bg-navy-800/80 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-indigo-200/60 dark:border-navy-700">
                          <Lock className="w-3 h-3 text-indigo-500" />
                          <span>{cfg.samplePreview}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              fetchAudits(cfg.documentType);
                              setIsAuditModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="View sequence audit log"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(cfg)}
                            className="h-7 text-xs px-2"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Sequence Drawer */}
      {selectedConfig && (
        <FormDrawer
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSaveConfig}
          title={`Configure ${selectedConfig.documentType}`}
          subtitle={`Module: ${selectedConfig.module} • Sequence Length: ${editSeqLength}`}
          submitText={isSaving ? 'Saving...' : 'Save Sequence Rules'}
          isLoading={isSaving}
          width="md"
        >
          {/* Dynamic Real-time Preview Strip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white shadow-soft-sm border border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Live Preview
              </span>
            </div>
            <div className="font-mono text-sm font-bold tracking-wide text-emerald-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              {computeModalPreview()}
            </div>
          </div>

          <FormSection title="Formatting Rules" description="Prefix, suffix and date stamps">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Prefix *
              </label>
              <input
                type="text"
                required
                value={editPrefix}
                onChange={(e) => setEditPrefix(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
                placeholder="e.g. RES-"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Suffix (Optional)
              </label>
              <input
                type="text"
                value={editSuffix}
                onChange={(e) => setEditSuffix(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
                placeholder="e.g. HQ"
              />
            </div>

            <div>
              <UniversalSelect
                label="Date Segment"
                size="sm"
                value={editDateFormat}
                onChange={(val) => setEditDateFormat(val || 'yyyyMMdd')}
                options={[
                  { value: 'yyyyMMdd', label: 'yyyyMMdd (e.g. 20261119)', badge: 'DAY' },
                  { value: 'yyyyMM', label: 'yyyyMM (e.g. 202611)', badge: 'MO' },
                  { value: 'yyyy', label: 'yyyy (e.g. 2026)', badge: 'YR' },
                  { value: 'NONE', label: 'NONE (Sequential only)', badge: 'SEQ' },
                ]}
                clearable={false}
              />
            </div>

            <div>
              <UniversalSelect
                label="Reset Period"
                size="sm"
                value={editResetFrequency}
                onChange={(val) => setEditResetFrequency(val || 'DAILY')}
                options={[
                  { value: 'DAILY', label: 'Daily (Midnight)', badge: 'DAY' },
                  { value: 'MONTHLY', label: 'Monthly (1st of Month)', badge: 'MO' },
                  { value: 'YEARLY', label: 'Yearly (Jan 1st)', badge: 'YR' },
                  { value: 'NEVER', label: 'Never (Perpetual)', badge: 'NEV' },
                ]}
                clearable={false}
              />
            </div>
          </FormSection>

          <FormSection title="Counter Digits" description="Zero-padding sequence specifications">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Sequence Digits
              </label>
              <input
                type="number"
                min={2}
                max={8}
                required
                value={editSeqLength}
                onChange={(e) => setEditSeqLength(Number(e.target.value))}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Starting Number
              </label>
              <input
                type="number"
                min={1}
                required
                value={editStartingNumber}
                onChange={(e) => setEditStartingNumber(Number(e.target.value))}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface dark:border-brand-darkBorder text-brand-text focus:outline-none"
              />
            </div>
          </FormSection>
        </FormDrawer>
      )}

      {/* Audit Trail Detail Drawer */}
      <DetailDrawer
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Document Numbering Audit Trail"
        subtitle="Recent transaction sequence assignment log (Last 50 entries)"
        width="lg"
      >
        {isAuditLoading ? (
          <div className="py-8 text-center text-slate-500">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-brand-primary" />
            Loading audit logs...
          </div>
        ) : audits.length === 0 ? (
          <div className="py-8 text-center text-brand-muted text-xs">
            No generated document numbers found in audit history yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-border dark:border-brand-darkBorder">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-brand-darkCard border-b border-brand-border dark:border-brand-darkBorder text-[10px] uppercase font-bold text-brand-muted">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Document Number</th>
                  <th className="py-2.5 px-3">Generated By</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder font-medium">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-brand-darkCard transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-brand-text">
                      {a.documentType}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-primary dark:text-[#8495FF]">
                      {a.documentNumber}
                    </td>
                    <td className="py-2.5 px-3 text-brand-muted">
                      {a.generatedBy}
                    </td>
                    <td className="py-2.5 px-3 text-brand-muted text-[11px]">
                      {new Date(a.generatedAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailDrawer>
    </PageContainer>
  );
};
