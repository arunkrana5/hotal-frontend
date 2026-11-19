export interface DailyRevenuePoint {
  date: string;
  roomRevenue: number;
  fnBRevenue: number;
  banquetRevenue: number;
  totalRevenue: number;
}

export interface DepartmentRevenueSlice {
  department: string;
  amount: number;
  percentage: number;
}

export interface OperationalHealthSummary {
  totalRooms: number;
  cleanRooms: number;
  dirtyRooms: number;
  inspectedRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  openDiningTables: number;
  occupiedDiningTables: number;
  pendingKitchenOrders: number;
  openWorkOrders: number;
  lowStockItemsCount: number;
  activeVisitorsInPremises: number;
  openSecurityIncidents: number;
}

export interface ExecutiveDashboard {
  propertyId: number;
  occupancyRate: number;
  adr: number;
  revPar: number;
  todayTotalRevenue: number;
  monthToDateRevenue: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  operationalHealth: OperationalHealthSummary;
  revenueTrend7Days: DailyRevenuePoint[];
  departmentRevenueDistribution: DepartmentRevenueSlice[];
}

export interface NightAuditReport {
  auditDate: string;
  propertyId: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPercent: number;
  roomTariffRevenue: number;
  foodBeverageRevenue: number;
  banquetRevenue: number;
  taxRevenue: number;
  totalRevenueGross: number;
  totalPaymentsSettled: number;
  outstandingCityLedgerBalance: number;
  checkInsProcessed: number;
  checkOutsProcessed: number;
  foliosAudited: number;
}

export interface AccountBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface RevenueTrialBalanceReport {
  asOfDate: string;
  propertyId: number;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  accounts: AccountBalanceRow[];
}

export interface ForecastDay {
  date: string;
  totalRooms: number;
  roomsBooked: number;
  roomsAvailable: number;
  projectedOccupancyPercent: number;
  projectedRevenue: number;
}

export interface OccupancyForecastReport {
  propertyId: number;
  generatedAt: string;
  forecastDays: ForecastDay[];
}

export interface DepartmentSpendRow {
  department: string;
  poCount: number;
  totalSpend: number;
  percentage: number;
}

export interface DepartmentProcurementReport {
  asOfDate: string;
  propertyId: number;
  totalSpend: number;
  departmentSpends: DepartmentSpendRow[];
}

export interface DepartmentPayrollRow {
  department: string;
  employeeCount: number;
  totalBaseSalary: number;
  totalOvertimeBonus: number;
  netDisbursement: number;
}

export interface StaffPayrollSummaryReport {
  asOfDate: string;
  propertyId: number;
  totalPayroll: number;
  totalEmployees: number;
  departments: DepartmentPayrollRow[];
}

export interface AppNotification {
  id: number;
  propertyId: number;
  userId?: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}
