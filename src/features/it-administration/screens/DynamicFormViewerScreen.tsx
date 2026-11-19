import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DynamicFormDto } from '@/types/configuration';
import { DynamicForm } from '@/components/dynamic-form/DynamicForm';
import { Card, StatCard, Badge } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  FileCode,
  Layers,
  Sparkles,
  CheckCircle,
  Eye,
  Code,
  AlertCircle,
  RefreshCw,
  Database,
  Sliders,
  ChevronRight,
  Copy,
  Terminal,
} from 'lucide-react';

export const DynamicFormViewerScreen: React.FC = () => {
  const [forms, setForms] = useState<DynamicFormDto[]>([]);
  const [selectedForm, setSelectedForm] = useState<DynamicFormDto | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'schema'>('preview');
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request<DynamicFormDto[]>('/forms');
      if (res.success && res.data && res.data.length > 0) {
        setForms(res.data);
        setSelectedForm(res.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve form schemas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleFormSubmit = async (values: Record<string, any>) => {
    setSubmittedData(values);
  };

  const handleCopyPayload = () => {
    if (submittedData) {
      navigator.clipboard.writeText(JSON.stringify(submittedData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalFields = forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0);
  const autowiredSelects = forms.reduce(
    (acc, f) => acc + (f.fields?.filter((fld) => !!fld.masterDefinitionCode)?.length || 0),
    0
  );

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Dynamic Forms' },
        ]}
        title="Dynamic Forms Engine"
        subtitle="Database-Driven Field Schemas, Dropdown Autowiring, Zero Hardcoding & Instant Rerender"
        actions={
          <PageActions>
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-xs border border-border dark:border-navy-700">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-surface dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'schema'
                    ? 'bg-surface dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-indigo-500" />
                <span>Schema</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchForms}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Dynamic Schemas"
          value={forms.length}
          subtitle="Database-managed forms"
          icon={<Layers className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Configured Fields"
          value={totalFields}
          subtitle="Across all form layouts"
          icon={<Sliders className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Master Dropdowns"
          value={autowiredSelects}
          subtitle="Autowiring 5-record rule"
          icon={<Database className="w-5 h-5" />}
          accentColor="blue"
        />
        <StatCard
          title="Runtime Engine"
          value="v2.0 Active"
          subtitle="Realtime reactive binding"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Form Selector & Features */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-navy-700/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Registered Forms
              </span>
              <Badge variant="success">{forms.length} Forms</Badge>
            </div>

            <div className="space-y-2">
              {forms.map((f) => {
                const isSelected = selectedForm?.id === f.id;
                return (
                  <button
                    key={f.code}
                    onClick={() => {
                      setSelectedForm(f);
                      setSubmittedData(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'border-border dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{f.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Module: <span className="font-medium text-slate-600 dark:text-slate-300">{f.module}</span> &bull; {f.fields?.length || 0} fields
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
                        v{f.version}.0
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-navy-900 dark:to-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Section 8 Enterprise Architecture</span>
            </div>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Relational Storage:</strong> Field schemas load strictly from PostgreSQL via REST API.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>5-Record Dropdown Rule:</strong> Autowired selects fetch in verified batches with live search.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Zero Code Changes:</strong> IT can alter sections, labels, and validation rules instantly.</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Column: Preview or Schema View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedForm && activeTab === 'preview' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border dark:border-navy-700/60 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedForm.title} &mdash; Interactive Form
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedForm.description}
                    </p>
                  </div>
                  <Badge variant="indigo" size="md">
                    Live Form Simulator
                  </Badge>
                </div>

                <DynamicForm
                  key={selectedForm.code}
                  formDefinition={selectedForm}
                  onSubmit={handleFormSubmit}
                  submitButtonText="Test Submit Dynamic Payload"
                />
              </Card>

              {submittedData && (
                <Card className="p-5 space-y-3 bg-navy-950 text-slate-100 border-navy-800 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-navy-800">
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
                      <Terminal className="w-4 h-4" />
                      <span>Captured Form Submission Payload (JSON)</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyPayload}
                        className="text-xs px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                      </button>
                      <button
                        onClick={() => setSubmittedData(null)}
                        className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs font-mono overflow-x-auto text-emerald-300 bg-navy-900/80 p-4 rounded-xl border border-navy-800">
                    {JSON.stringify(submittedData, null, 2)}
                  </pre>
                </Card>
              )}
            </div>
          )}

          {selectedForm && activeTab === 'schema' && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border dark:border-navy-700/60 gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Field Configuration Schema ({selectedForm.fields.length} Fields)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Field dictionary and validation metadata configured in centralized database
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-border dark:border-navy-700">
                  Code: {selectedForm.code}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border dark:border-navy-700/60 bg-slate-50 dark:bg-navy-800/50">
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Field Key</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Display Label</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Control Type</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Required</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Master Source</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Group / Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-navy-700/60">
                    {selectedForm.fields.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition">
                        <td className="p-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{field.fieldKey}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{field.fieldLabel}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-border dark:border-navy-700">
                            {field.fieldType}
                          </span>
                        </td>
                        <td className="p-3">
                          {field.isMandatory ? (
                            <Badge variant="danger">Required</Badge>
                          ) : (
                            <span className="text-slate-400">Optional</span>
                          )}
                        </td>
                        <td className="p-3">
                          {field.masterDefinitionCode ? (
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                              {field.masterDefinitionCode}
                            </span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{field.sectionName || 'General'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
