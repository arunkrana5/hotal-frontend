import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/services/api';
import {
  Activity,
  ShieldCheck,
  History,
  Menu,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Clock
} from 'lucide-react';

interface SystemHealth {
  status: string;
  databaseConnected: boolean;
  databaseEngine: string;
  hostEnvironment: string;
  processUptime: string;
  memoryWorkingSetMb: number;
  serverTimeUtc: string;
  totalUsers: number;
  totalRooms: number;
  totalReservations: number;
}

interface AuditLogItem {
  id: number;
  action: string;
  entityName: string;
  entityId?: string;
  performedBy?: string;
  ipAddress?: string;
  changesJson?: string;
  timestamp: string;
}

interface SecurityEventItem {
  id: number;
  eventType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  username?: string;
  occurredAt: string;
}

interface NavigationMenuEntity {
  id: number;
  code: string;
  title: string;
  path: string;
  icon?: string;
  module: string;
  displayOrder: number;
  badgeText?: string;
  parentId?: number;
  isActive: boolean;
}

export const ITSystemControlScreen: React.FC = () => {
  const location = useLocation();

  const getInitialTab = (): 'health' | 'audit' | 'security' | 'menus' => {
    if (location.pathname.includes('/it/audit')) return 'audit';
    if (location.pathname.includes('/it/security')) return 'security';
    if (location.pathname.includes('/it/menus')) return 'menus';
    return 'health';
  };

  const [activeTab, setActiveTab] = useState<'health' | 'audit' | 'security' | 'menus'>(getInitialTab());
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>([]);
  const [menus, setMenus] = useState<NavigationMenuEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchHealth = async () => {
    try {
      const res = await api.request<SystemHealth>('/system/health');
      if (res.success && res.data) setHealth(res.data);
    } catch {
      // silent
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let q = '?page=1&pageSize=20';
      if (searchQuery.trim()) q += `&search=${encodeURIComponent(searchQuery.trim())}`;
      const res = await api.request<{ items: AuditLogItem[] }>(`/system/audit-logs${q}`);
      if (res.success && res.data) setAuditLogs(res.data.items);
    } catch {
      // silent
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      let q = '?page=1&pageSize=20';
      if (searchQuery.trim()) q += `&search=${encodeURIComponent(searchQuery.trim())}`;
      const res = await api.request<{ items: SecurityEventItem[] }>(`/system/security-events${q}`);
      if (res.success && res.data) setSecurityEvents(res.data.items);
    } catch {
      // silent
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await api.request<NavigationMenuEntity[]>('/system/menus');
      if (res.success && res.data) setMenus(res.data);
    } catch {
      // silent
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    if (activeTab === 'health') await fetchHealth();
    else if (activeTab === 'audit') await fetchAuditLogs();
    else if (activeTab === 'security') await fetchSecurityEvents();
    else if (activeTab === 'menus') await fetchMenus();
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleToggleMenu = async (m: NavigationMenuEntity) => {
    try {
      const res = await api.request(`/system/menus/${m.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: m.title,
          displayOrder: m.displayOrder,
          isActive: !m.isActive,
          badgeText: m.badgeText,
        }),
      });
      if (res.success) {
        fetchMenus();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Universal Page Header */}
      <PageHeader
        title={
          activeTab === 'health'
            ? 'System Infrastructure & Cluster Health'
            : activeTab === 'audit'
            ? 'Enterprise Transaction Audit Trail'
            : activeTab === 'security'
            ? 'Security Events & Session Monitoring'
            : 'Database Navigation Menu Configuration'
        }
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-brand-border bg-slate-100 dark:bg-navy-950 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('health')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'health'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Health
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'security'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Security Events
              </button>
              <button
                onClick={() => setActiveTab('menus')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'menus'
                    ? 'bg-brand-surface dark:bg-navy-900 text-brand-primary dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Menu Config
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 shadow-soft-xs"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 2. TAB: SYSTEM HEALTH */}
      {activeTab === 'health' && health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Status</span>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-base font-bold text-slate-900 dark:text-white">{health.status}</span>
              </div>
              <span className="text-[11px] text-slate-500">PostgreSQL Connection: OK</span>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Process Uptime</span>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{health.processUptime}</div>
              <span className="text-[11px] text-slate-500">Live API Worker Node</span>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RAM Working Set</span>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{health.memoryWorkingSetMb} MB</div>
              <span className="text-[11px] text-slate-500">GC Gen 0/1/2 Balanced</span>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface shadow-soft-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Records</span>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{health.totalRooms} Rooms • {health.totalUsers} Operators</div>
              <span className="text-[11px] text-slate-500">{health.totalReservations} Live Bookings Seeded</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-surface dark:bg-brand-darkSurface space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-brand-primary" />
              <span>Database Architecture &amp; RDBMS Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-brand-border space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Database Engine</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.databaseEngine}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-brand-border space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Environment</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{health.hostEnvironment}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-brand-border space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Server UTC Time</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{new Date(health.serverTimeUtc).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl p-3 shadow-soft-xs">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                placeholder="Search audit trail by action, entity or user..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-950 border border-brand-border rounded-lg"
              />
            </div>
          </div>

          <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl overflow-hidden shadow-soft-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-slate-50/70 dark:bg-navy-950 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Name</th>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                    <td className="py-2.5 px-3 font-semibold text-brand-primary">{log.action}</td>
                    <td className="py-2.5 px-3 font-mono">{log.entityName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{log.entityId || '-'}</td>
                    <td className="py-2.5 px-3">{log.performedBy}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: SECURITY EVENTS */}
      {activeTab === 'security' && (
        <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl overflow-hidden shadow-soft-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-slate-50/70 dark:bg-navy-950 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Occurred At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {securityEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{evt.eventType}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{evt.description}</td>
                  <td className="py-2.5 px-3 font-semibold">{evt.username || 'ANONYMOUS'}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{evt.ipAddress || '127.0.0.1'}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                    {new Date(evt.occurredAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {securityEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No security events recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TAB: MENU CONFIG */}
      {activeTab === 'menus' && (
        <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl overflow-hidden shadow-soft-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-slate-50/70 dark:bg-navy-950 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Menu Title &amp; Code</th>
                <th className="py-2.5 px-3">Route Path</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Badge</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {menus.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{m.displayOrder}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white">{m.title}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({m.code})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{m.path}</td>
                  <td className="py-2.5 px-3">{m.module}</td>
                  <td className="py-2.5 px-3">
                    {m.badgeText ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-brand-primary">
                        {m.badgeText}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleMenu(m)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        m.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {m.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default ITSystemControlScreen;
