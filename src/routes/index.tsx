import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

// Auth Screens
import { LoginScreen } from '@/features/authentication/screens/LoginScreen';
import { ForgotPasswordScreen } from '@/features/authentication/screens/ForgotPasswordScreen';
import { VerifyTokenScreen } from '@/features/authentication/screens/VerifyTokenScreen';
import { ResetPasswordScreen } from '@/features/authentication/screens/ResetPasswordScreen';
import { ChangePasswordScreen } from '@/features/authentication/screens/ChangePasswordScreen';
import { FirstLoginScreen } from '@/features/authentication/screens/FirstLoginScreen';
import { SessionExpiredScreen } from '@/features/authentication/screens/SessionExpiredScreen';
import { AccessDeniedScreen } from '@/features/authentication/screens/AccessDeniedScreen';
import { AccountLockedScreen } from '@/features/authentication/screens/AccountLockedScreen';
import { ProfileScreen } from '@/features/authentication/screens/ProfileScreen';
import { ActiveSessionsScreen } from '@/features/authentication/screens/ActiveSessionsScreen';

// Dashboard
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';

// IT Administration & Core Engines
import { ITDashboardScreen } from '@/features/it-administration/screens/ITDashboardScreen';
import { MasterManagementScreen } from '@/features/it-administration/screens/MasterManagementScreen';
import { WorkflowManagementScreen } from '@/features/it-administration/screens/WorkflowManagementScreen';
import { DynamicFormViewerScreen } from '@/features/it-administration/screens/DynamicFormViewerScreen';
import { DocumentNumberingScreen } from '@/features/it-administration/screens/DocumentNumberingScreen';

// PMS Core: Front Office, Reservations & Guests
import { RoomGridScreen } from '@/features/front-office/screens/RoomGridScreen';
import { ArrivalsScreen } from '@/features/front-office/screens/ArrivalsScreen';
import { DeparturesScreen } from '@/features/front-office/screens/DeparturesScreen';
import { FolioManagementScreen } from '@/features/front-office/screens/FolioManagementScreen';
import { ReservationListScreen } from '@/features/reservations/screens/ReservationListScreen';
import { NewReservationScreen } from '@/features/reservations/screens/NewReservationScreen';
import { GuestDirectoryScreen } from '@/features/guests/screens/GuestDirectoryScreen';

// Phase 5: Operational Departments
import { RoomStatusBoardScreen } from '@/features/housekeeping/screens/RoomStatusBoardScreen';
import { HousekeepingTasksScreen } from '@/features/housekeeping/screens/HousekeepingTasksScreen';
import { LinenLaundryScreen } from '@/features/housekeeping/screens/LinenLaundryScreen';
import { LivePosTerminalScreen } from '@/features/restaurant/screens/LivePosTerminalScreen';
import { TableManagementScreen } from '@/features/restaurant/screens/TableManagementScreen';
import { MenuItemsScreen } from '@/features/restaurant/screens/MenuItemsScreen';
import { KitchenKdsScreen } from '@/features/kitchen/screens/KitchenKdsScreen';
import { BanquetEventsScreen } from '@/features/banquet/screens/BanquetEventsScreen';
import { BanquetSpacesScreen } from '@/features/banquet/screens/BanquetSpacesScreen';
import { GuestRequestsScreen } from '@/features/front-office/screens/GuestRequestsScreen';

// Phase 6: Enterprise ERP
import { PurchaseRequisitionsScreen } from '@/features/purchase/screens/PurchaseRequisitionsScreen';
import { PurchaseOrdersScreen } from '@/features/purchase/screens/PurchaseOrdersScreen';
import { VendorDirectoryScreen } from '@/features/purchase/screens/VendorDirectoryScreen';
import { InventoryItemsScreen } from '@/features/inventory/screens/InventoryItemsScreen';
import { StoresLedgerScreen } from '@/features/inventory/screens/StoresLedgerScreen';
import { GeneralLedgerScreen } from '@/features/finance/screens/GeneralLedgerScreen';
import { InvoicesScreen } from '@/features/finance/screens/InvoicesScreen';
import { StaffDirectoryScreen } from '@/features/hr/screens/StaffDirectoryScreen';
import { AttendanceScreen } from '@/features/hr/screens/AttendanceScreen';
import { WorkOrdersScreen } from '@/features/maintenance/screens/WorkOrdersScreen';
import { AssetRegisterScreen } from '@/features/maintenance/screens/AssetRegisterScreen';
import { VisitorLogScreen } from '@/features/security/screens/VisitorLogScreen';
import { IncidentReportsScreen } from '@/features/security/screens/IncidentReportsScreen';

// Phase 7: Reporting, Analytics & Intelligence Hub
import { ReportsCenterScreen } from '@/features/reports/screens/ReportsCenterScreen';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/verify-token" element={<VerifyTokenScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/first-login" element={<FirstLoginScreen />} />
      <Route path="/session-expired" element={<SessionExpiredScreen />} />
      <Route path="/access-denied" element={<AccessDeniedScreen />} />
      <Route path="/account-locked" element={<AccountLockedScreen />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/sessions" element={<ActiveSessionsScreen />} />
          <Route path="/change-password" element={<ChangePasswordScreen />} />

          {/* Front Office Routes */}
          <Route path="/front-office" element={<Navigate to="/front-office/room-grid" replace />} />
          <Route path="/front-office/room-grid" element={<RoomGridScreen />} />
          <Route path="/front-office/arrivals" element={<ArrivalsScreen />} />
          <Route path="/front-office/departures" element={<DeparturesScreen />} />
          <Route path="/front-office/folios" element={<FolioManagementScreen />} />
          <Route path="/front-office/requests" element={<GuestRequestsScreen />} />

          {/* Reservations Routes */}
          <Route path="/reservations" element={<Navigate to="/reservations/list" replace />} />
          <Route path="/reservations/list" element={<ReservationListScreen />} />
          <Route path="/reservations/new" element={<NewReservationScreen />} />

          {/* Guests Directory Routes */}
          <Route path="/guests" element={<Navigate to="/guests/list" replace />} />
          <Route path="/guests/list" element={<GuestDirectoryScreen />} />
          <Route path="/guests/loyalty" element={<GuestDirectoryScreen />} />

          {/* Housekeeping Routes */}
          <Route path="/housekeeping" element={<Navigate to="/housekeeping/board" replace />} />
          <Route path="/housekeeping/board" element={<RoomStatusBoardScreen />} />
          <Route path="/housekeeping/tasks" element={<HousekeepingTasksScreen />} />
          <Route path="/housekeeping/linen" element={<LinenLaundryScreen />} />
          <Route path="/housekeeping/requests" element={<GuestRequestsScreen />} />

          {/* Restaurant & POS Routes */}
          <Route path="/restaurant" element={<Navigate to="/restaurant/pos" replace />} />
          <Route path="/restaurant/pos" element={<LivePosTerminalScreen />} />
          <Route path="/restaurant/tables" element={<TableManagementScreen />} />
          <Route path="/restaurant/items" element={<MenuItemsScreen />} />

          {/* Kitchen Display System Routes */}
          <Route path="/kitchen" element={<Navigate to="/kitchen/queue" replace />} />
          <Route path="/kitchen/queue" element={<KitchenKdsScreen />} />

          {/* Banquet & Events Routes */}
          <Route path="/banquet" element={<Navigate to="/banquet/events" replace />} />
          <Route path="/banquet/events" element={<BanquetEventsScreen />} />
          <Route path="/banquet/spaces" element={<BanquetSpacesScreen />} />

          {/* Operations & Concierge Requests */}
          <Route path="/operations/requests" element={<GuestRequestsScreen />} />

          {/* Phase 6: Purchase & Procurement */}
          <Route path="/purchase" element={<Navigate to="/purchase/requisitions" replace />} />
          <Route path="/purchase/requisitions" element={<PurchaseRequisitionsScreen />} />
          <Route path="/purchase/orders" element={<PurchaseOrdersScreen />} />
          <Route path="/purchase/vendors" element={<VendorDirectoryScreen />} />

          {/* Phase 6: Inventory & Stores */}
          <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />
          <Route path="/inventory/items" element={<InventoryItemsScreen />} />
          <Route path="/inventory/stores" element={<StoresLedgerScreen />} />

          {/* Phase 6: Finance & Accounts */}
          <Route path="/finance" element={<Navigate to="/finance/ledger" replace />} />
          <Route path="/finance/ledger" element={<GeneralLedgerScreen />} />
          <Route path="/finance/invoices" element={<InvoicesScreen />} />

          {/* Phase 6: Human Resources & Attendance */}
          <Route path="/hr" element={<Navigate to="/hr/staff" replace />} />
          <Route path="/hr/staff" element={<StaffDirectoryScreen />} />
          <Route path="/hr/attendance" element={<AttendanceScreen />} />

          {/* Phase 6: Engineering & Maintenance */}
          <Route path="/maintenance" element={<Navigate to="/maintenance/orders" replace />} />
          <Route path="/maintenance/orders" element={<WorkOrdersScreen />} />
          <Route path="/maintenance/assets" element={<AssetRegisterScreen />} />

          {/* Phase 6: Security & Incident Management */}
          <Route path="/security" element={<Navigate to="/security/visitors" replace />} />
          <Route path="/security/visitors" element={<VisitorLogScreen />} />
          <Route path="/security/incidents" element={<IncidentReportsScreen />} />

          {/* Phase 7: Financial & Operational Reports */}
          <Route path="/reports" element={<Navigate to="/reports/center" replace />} />
          <Route path="/reports/center" element={<ReportsCenterScreen />} />
          <Route path="/reports/night-audit" element={<ReportsCenterScreen />} />
          <Route path="/reports/forecast" element={<ReportsCenterScreen />} />
          <Route path="/reports/trial-balance" element={<ReportsCenterScreen />} />

          {/* IT Department & Dynamic Engines */}
          <Route path="/it" element={<Navigate to="/it/dashboard" replace />} />
          <Route path="/it/dashboard" element={<ITDashboardScreen />} />
          <Route path="/it/masters" element={<MasterManagementScreen />} />
          <Route path="/it/dropdowns" element={<MasterManagementScreen />} />
          <Route path="/it/workflows" element={<WorkflowManagementScreen />} />
          <Route path="/it/forms" element={<DynamicFormViewerScreen />} />
          <Route path="/it/numbering" element={<DocumentNumberingScreen />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
