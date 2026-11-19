// Phase 6 ERP Types

// 1. Purchase & Vendor
export interface VendorDto {
  id: number;
  vendorCode: string;
  vendorName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
  paymentTermsDays: number;
  status: string;
}

export interface CreateVendorRequest {
  vendorCode: string;
  vendorName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
  paymentTermsDays: number;
}

export interface PurchaseRequisitionItemDto {
  id: number;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedPrice: number;
}

export interface CreateRequisitionItemRequest {
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
}

export interface PurchaseRequisitionDto {
  id: number;
  requisitionNumber: string;
  departmentCode: string;
  requestedByUserId: number;
  requestedByUserName?: string;
  requiredByDate: string;
  priority: string;
  status: string;
  totalEstimatedAmount: number;
  justification?: string;
  createdAt: string;
  items: PurchaseRequisitionItemDto[];
}

export interface CreatePurchaseRequisitionRequest {
  departmentCode: string;
  requiredByDate: string;
  priority: string;
  justification?: string;
  items: CreateRequisitionItemRequest[];
}

export interface UpdateRequisitionStatusRequest {
  status: string;
}

export interface PurchaseOrderItemDto {
  id: number;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CreatePurchaseOrderItemRequest {
  itemName: string;
  quantityOrdered: number;
  unit: string;
  unitPrice: number;
}

export interface PurchaseOrderDto {
  id: number;
  orderNumber: string;
  purchaseRequisitionId?: number;
  vendorId: number;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  items: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderRequest {
  vendorId: number;
  purchaseRequisitionId?: number;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms?: string;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface UpdatePurchaseOrderStatusRequest {
  status: string;
}

// 2. Inventory & Stores
export interface InventoryItemDto {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  currentStock: number;
  reorderLevel: number;
  minimumStock: number;
  maximumStock: number;
  locationBin?: string;
}

export interface CreateInventoryItemRequest {
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  currentStock: number;
  reorderLevel: number;
  minimumStock: number;
  maximumStock: number;
  locationBin?: string;
}

export interface StockTransactionDto {
  id: number;
  transactionNumber: string;
  inventoryItemId: number;
  itemCode: string;
  itemName: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  departmentCode?: string;
  referenceNumber?: string;
  transactionDate: string;
  notes?: string;
}

export interface RecordStockTransactionRequest {
  inventoryItemId: number;
  transactionType: string;
  quantity: number;
  unitCost: number;
  departmentCode?: string;
  referenceNumber?: string;
  notes?: string;
}

// 3. Finance & Accounts
export interface AccountDto {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  description?: string;
}

export interface CreateAccountRequest {
  accountCode: string;
  accountName: string;
  accountType: string;
  initialBalance: number;
  description?: string;
}

export interface JournalLineDto {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface CreateJournalLineRequest {
  accountId: number;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface JournalEntryDto {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  referenceNumber?: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  lines: JournalLineDto[];
}

export interface CreateJournalEntryRequest {
  entryDate: string;
  description: string;
  referenceNumber?: string;
  lines: CreateJournalLineRequest[];
}

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  invoiceType: string;
  referenceId?: string;
  clientOrVendorName: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  notes?: string;
}

export interface CreateInvoiceRequest {
  invoiceType: string;
  referenceId?: string;
  clientOrVendorName: string;
  subTotal: number;
  taxAmount: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export interface RecordInvoicePaymentRequest {
  paymentAmount: number;
  paymentMethod?: string;
}

// 4. Human Resources & Attendance
export interface EmployeeDto {
  id: number;
  employeeCode: string;
  userId?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  departmentCode: string;
  designation: string;
  dateOfJoining: string;
  employmentType: string;
  basicSalary: number;
  status: string;
  email: string;
  phone: string;
  emergencyContact?: string;
}

export interface CreateEmployeeRequest {
  employeeCode: string;
  userId?: number;
  firstName: string;
  lastName: string;
  departmentCode: string;
  designation: string;
  dateOfJoining: string;
  employmentType: string;
  basicSalary: number;
  email: string;
  phone: string;
  emergencyContact?: string;
}

export interface UpdateEmployeeStatusRequest {
  status: string;
}

export interface AttendanceRecordDto {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentCode: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  shift: string;
  status: string;
  overtimeHours: number;
  remarks?: string;
}

export interface RecordAttendanceRequest {
  employeeId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  shift: string;
  status: string;
  overtimeHours: number;
  remarks?: string;
}

// 5. Engineering & Maintenance
export interface AssetDto {
  id: number;
  assetCode: string;
  assetName: string;
  category: string;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiryDate?: string;
  status: string;
  serialNumber?: string;
  manufacturer?: string;
}

export interface CreateAssetRequest {
  assetCode: string;
  assetName: string;
  category: string;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiryDate?: string;
  serialNumber?: string;
  manufacturer?: string;
}

export interface WorkOrderDto {
  id: number;
  workOrderNumber: string;
  assetId?: number;
  assetName?: string;
  roomId?: number;
  roomNumber?: string;
  departmentCode: string;
  issueDescription: string;
  priority: string;
  status: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  requestedAt: string;
  completedAt?: string;
  resolutionNotes?: string;
  totalCost: number;
}

export interface CreateWorkOrderRequest {
  assetId?: number;
  roomId?: number;
  departmentCode: string;
  issueDescription: string;
  priority: string;
  assignedToUserId?: number;
}

export interface UpdateWorkOrderStatusRequest {
  status: string;
  resolutionNotes?: string;
  additionalCost: number;
}

// 6. Security & Incident Management
export interface VisitorLogDto {
  id: number;
  passNumber: string;
  visitorName: string;
  idType: string;
  idNumber: string;
  phone: string;
  purpose: string;
  visitingDepartment: string;
  roomOrArea?: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  badgeNumber?: string;
}

export interface CheckInVisitorRequest {
  visitorName: string;
  idType: string;
  idNumber: string;
  phone: string;
  purpose: string;
  visitingDepartment: string;
  roomOrArea?: string;
  badgeNumber?: string;
}

export interface CheckOutVisitorRequest {
  remarks?: string;
}

export interface IncidentReportDto {
  id: number;
  incidentNumber: string;
  incidentDate: string;
  location: string;
  severity: string;
  category: string;
  description: string;
  reportedByUserId?: number;
  reportedByUserName?: string;
  status: string;
  actionTaken?: string;
  resolvedAt?: string;
}

export interface CreateIncidentReportRequest {
  incidentDate: string;
  location: string;
  severity: string;
  category: string;
  description: string;
  actionTaken?: string;
}

export interface UpdateIncidentStatusRequest {
  status: string;
  actionTaken?: string;
}
