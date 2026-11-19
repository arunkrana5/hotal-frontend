import { api } from './api';
import {
  ExecutiveDashboard,
  NightAuditReport,
  RevenueTrialBalanceReport,
  OccupancyForecastReport,
  DepartmentProcurementReport,
  StaffPayrollSummaryReport,
  AppNotification,
} from '../types/reporting';

export const reportingService = {
  // 1. Executive Dashboard
  getExecutiveDashboard: async (propertyId?: number): Promise<ExecutiveDashboard | null> => {
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    const res = await api.request<ExecutiveDashboard>(`/reports/dashboard${query}`);
    return res.data || null;
  },

  // 2. Night Audit
  getNightAudit: async (propertyId?: number, auditDate?: string): Promise<NightAuditReport | null> => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId.toString());
    if (auditDate) params.append('auditDate', auditDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.request<NightAuditReport>(`/reports/night-audit${query}`);
    return res.data || null;
  },

  // 3. Revenue Trial Balance
  getRevenueTrialBalance: async (propertyId?: number): Promise<RevenueTrialBalanceReport | null> => {
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    const res = await api.request<RevenueTrialBalanceReport>(`/reports/revenue-ledger${query}`);
    return res.data || null;
  },

  // 4. Occupancy Forecast
  getOccupancyForecast: async (propertyId?: number, days = 14): Promise<OccupancyForecastReport | null> => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (propertyId) params.append('propertyId', propertyId.toString());
    const res = await api.request<OccupancyForecastReport>(`/reports/occupancy-forecast?${params.toString()}`);
    return res.data || null;
  },

  // 5. Procurement Spend
  getProcurementSpend: async (propertyId?: number): Promise<DepartmentProcurementReport | null> => {
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    const res = await api.request<DepartmentProcurementReport>(`/reports/procurement-spend${query}`);
    return res.data || null;
  },

  // 6. Payroll Summary
  getPayrollSummary: async (propertyId?: number): Promise<StaffPayrollSummaryReport | null> => {
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    const res = await api.request<StaffPayrollSummaryReport>(`/reports/payroll-summary${query}`);
    return res.data || null;
  },

  // 7. CSV Export
  exportReportCsv: async (reportCode: string, propertyId?: number): Promise<void> => {
    const token = api.getAccessToken();
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    const url = `http://localhost:5000/api/v1/reports/export/${reportCode}${query}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download report CSV: ${res.statusText}`);
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${reportCode.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  // 8. Notifications
  getNotifications: async (limit = 20): Promise<AppNotification[]> => {
    const res = await api.request<AppNotification[]>(`/notifications?limit=${limit}`);
    return res.data || [];
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.request(`/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllAsRead: async (): Promise<void> => {
    await api.request('/notifications/read-all', { method: 'PUT' });
  },
};
