import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Cpu,
  Layers,
  GitBranch,
  FileCode,
  ShieldCheck,
  Activity,
  ArrowRight,
  Database,
  CheckCircle,
  Server,
  Lock,
  Workflow,
} from 'lucide-react';

export const ITDashboardScreen: React.FC = () => {
  const statCards = [
    {
      title: 'Database Masters Engine',
      description: 'Zero hardcoded business choices. Centralized master codes, options & definitions.',
      count: '7 Core Masters',
      link: '/it/masters',
      icon: Database,
      badge: 'Active & Seeded',
      variant: 'brand' as const,
    },
    {
      title: 'State Workflow Engine',
      description: 'State machine definitions, multi-step SLA transitions, and immutable audit trails.',
      count: 'Enterprise Workflows',
      link: '/it/workflows',
      icon: GitBranch,
      badge: 'Versioned JSON',
      variant: 'purple' as const,
    },
    {
      title: 'Dynamic Form Generator',
      description: 'Dynamic schema generation, real-time validation rules & master dropdown binding.',
      count: 'Dynamic Schemas',
      link: '/it/forms',
      icon: FileCode,
      badge: 'Live Render',
      variant: 'success' as const,
    },
    {
      title: 'Security & Access Control',
      description: 'Zero-trust architecture, concurrent session revocation, token rotation & role matrix.',
      count: '15 RBAC Modules',
      link: '/sessions',
      icon: ShieldCheck,
      badge: 'AES-256 Hardened',
      variant: 'warning' as const,
    },
  ];

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Administration', href: '/it' },
          { label: 'Control Plane' },
        ]}
        title="IT & Systems Architecture Control Plane"
        subtitle="Core Dynamic Engines, Master Data Models, Dynamic JSON Schemas & Workflow State Machines"
        actions={
          <PageActions>
            <Badge variant="success" dot size="sm">
              All Workers Healthy
            </Badge>
          </PageActions>
        }
      />

      {/* Grid of Core IT Engines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="p-5 flex flex-col justify-between hover:shadow-card-hover hover:border-brand-indigo transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-brand-indigo group-hover:text-white transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant={card.variant} size="sm">
                    {card.badge}
                  </Badge>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-brand-indigo dark:group-hover:text-brand-blue transition">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border dark:border-navy-700 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {card.count}
                </span>
                <Link
                  to={card.link}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-indigo dark:text-brand-blue hover:underline"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Architecture System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-indigo" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">System Runtime Infrastructure</h3>
            </div>
            <Badge variant="brand" size="sm">.NET 10 LTS &bull; PostgreSQL</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">API Runtime Host:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">Kestrel / .NET 10.0 (C# 14)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">PostgreSQL 18 + EF Core 10</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Real-Time Hub:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">SignalR WebSocket Protocol</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Background Worker:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">HotelOS.Workers (Active)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Zero Hardcoding Rule:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Strictly Enforced (100% Master DB)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Enterprise Security Matrix</h3>
            </div>
            <Badge variant="success" size="sm">Zero Trust</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">JWT Token Rotation:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">HMAC-SHA256 (15m Access, 30d Refresh)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Session Revocation:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">Instant Multi-Device Termination</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Password Encryption:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">PBKDF2 with Cryptographic Salt</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-navy-800">
              <span className="text-slate-500">Lockout Policy:</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">5 Failed Attempts &rarr; Locked</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Audit Trail:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">Immutable System Logs</span>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
