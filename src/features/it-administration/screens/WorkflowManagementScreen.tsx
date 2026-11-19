import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { WorkflowDefinitionDto, WorkflowInstanceDto } from '@/types/workflow';
import { WorkflowTracker } from '@/components/workflow/WorkflowTracker';
import { Button } from '@/components/common/Button';
import { Card, StatCard, Badge } from '@/components/common/Card';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  GitBranch,
  Play,
  Layers,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
  RefreshCw,
  Workflow,
  History,
  Timer,
  ChevronRight,
} from 'lucide-react';

export const WorkflowManagementScreen: React.FC = () => {
  const [definitions, setDefinitions] = useState<WorkflowDefinitionDto[]>([]);
  const [selectedDefinition, setSelectedDefinition] = useState<WorkflowDefinitionDto | null>(null);
  const [activeInstance, setActiveInstance] = useState<WorkflowInstanceDto | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all workflow definitions
  const fetchDefinitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request<WorkflowDefinitionDto[]>('/workflows/definitions');
      if (res.success && res.data && res.data.length > 0) {
        setDefinitions(res.data);
        setSelectedDefinition(res.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow definitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  // Launch a new live workflow instance for testing
  const handleStartTestInstance = async () => {
    if (!selectedDefinition) return;
    setIsStarting(true);
    setError(null);
    try {
      const mockEntityId = Math.floor(1000 + Math.random() * 9000);
      const res = await api.request<WorkflowInstanceDto>(
        `/workflows/start?code=${selectedDefinition.code}&entityType=Requisition&entityId=${mockEntityId}`,
        { method: 'POST' }
      );

      if (res.success && res.data) {
        setActiveInstance(res.data);
      } else {
        setError(res.message || 'Failed to start workflow instance.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while initiating workflow');
    } finally {
      setIsStarting(false);
    }
  };

  // Execute a transition step on the live instance
  const handleExecuteTransition = async (actionName: string, comments?: string) => {
    if (!activeInstance) return;
    setError(null);

    const res = await api.request<WorkflowInstanceDto>('/workflows/transition', {
      method: 'POST',
      body: JSON.stringify({
        instanceId: activeInstance.id,
        actionName,
        comments,
      }),
    });

    if (res.success && res.data) {
      setActiveInstance(res.data);
    } else {
      setError(res.message || 'Failed to transition workflow step.');
    }
  };

  const totalSteps = definitions.reduce((acc, d) => acc + (d.steps?.length || 0), 0);
  const avgSlaMinutes = selectedDefinition?.steps?.length
    ? Math.round(selectedDefinition.steps.reduce((acc, s) => acc + s.slaMinutes, 0) / selectedDefinition.steps.length)
    : 120;

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Workflows' },
        ]}
        title="Workflow State Machine & SLAs"
        subtitle="Configurable Approval Chains, Role Gating, Immutable Versioning & Real-time Audit Trails"
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDefinitions}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            {selectedDefinition && (
              <Button
                onClick={handleStartTestInstance}
                disabled={isStarting}
                size="sm"
                icon={isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              >
                Launch Simulation
              </Button>
            )}
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Workflow Schemas"
          value={definitions.length}
          subtitle="Registered state engines"
          icon={<Layers className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Total Pipeline Steps"
          value={totalSteps}
          subtitle="Configured sequential gates"
          icon={<GitBranch className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          title="Average Step SLA"
          value={`${avgSlaMinutes}m`}
          subtitle="Turnaround threshold"
          icon={<Timer className="w-5 h-5" />}
          accentColor="blue"
        />
        <StatCard
          title="Governance Engine"
          value="v2.4 Active"
          subtitle="Role gated &amp; versioned"
          icon={<Shield className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workflow Definitions Selector */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-navy-700/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Configured Workflows
              </span>
              <Badge variant="purple">{definitions.length} Engines</Badge>
            </div>

            <div className="space-y-2">
              {definitions.map((def) => {
                const isSelected = selectedDefinition?.id === def.id;
                return (
                  <button
                    key={def.code}
                    onClick={() => {
                      setSelectedDefinition(def);
                      setActiveInstance(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 shadow-sm'
                        : 'border-border dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{def.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Module: <span className="font-medium text-slate-600 dark:text-slate-300">{def.module}</span> &bull; Code: {def.code}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
                        v{def.version}.0
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Workflow Invariants Card */}
          <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-navy-900 dark:to-purple-950/20 border-purple-200/50 dark:border-purple-900/40">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Section 8 Enterprise Invariants</span>
            </div>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Immutable Versioning:</strong> In-flight instances stay bound to their creation definition schema.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Role Gating:</strong> Transitions validate caller credentials against required approval roles.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Audited Timers:</strong> Step transitions measure SLA adherence and record comments in immutable logs.</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Column: Step Visualizer & Live Instance Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Sequence Visualizer */}
          {selectedDefinition && (
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border dark:border-navy-700/60 gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedDefinition.title} &mdash; Approval Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDefinition.description}
                  </p>
                </div>
                <Badge variant="purple" size="md">
                  {selectedDefinition.steps.length} Sequential Stages
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedDefinition.steps.map((step) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl border border-border dark:border-navy-700/60 bg-slate-50/60 dark:bg-navy-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {step.stepOrder}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                        {step.stepType}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {step.stepName}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border dark:border-navy-700/60 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Role: <strong className="text-slate-700 dark:text-slate-200">{step.assignedRole || 'Any Authorized'}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>SLA Threshold: <strong className="text-slate-700 dark:text-slate-200">{step.slaMinutes} min</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Live Simulator (WorkflowTracker) */}
          {activeInstance ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Live Simulation Instance #{activeInstance.id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveInstance(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Close Simulation
                </Button>
              </div>

              <WorkflowTracker
                instance={activeInstance}
                onExecuteAction={handleExecuteTransition}
              />
            </div>
          ) : (
            <Card className="border-dashed border-2 p-10 text-center space-y-3 bg-slate-50/50 dark:bg-navy-900/30">
              <div className="inline-flex p-3.5 rounded-2xl bg-indigo-50 dark:bg-navy-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-navy-700">
                <Workflow className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Active Workflow Simulation Running
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Click <strong>"Launch Live Simulation"</strong> above to instantiate a test workflow on this definition. You will be able to verify sequential gate advancement, SLA timers, role constraints, and audit trails live.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
