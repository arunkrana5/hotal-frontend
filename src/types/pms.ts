export interface RoomDto {
  id: number;
  roomNumber: string;
  floorNumber: number;
  roomTypeCode: string;
  roomStatusCode: string; // CLN, DRT, OCC, INS, OOD, MNT, DND
  maxOccupancy: number;
  baseRatePerNight: number;
  isSmoking: boolean;
  keyCardUid?: string;
  notes?: string;
}

export interface FloorRoomsDto {
  floorNumber: number;
  rooms: RoomDto[];
}

export interface RoomGridSummaryDto {
  totalRooms: number;
  occupiedCount: number;
  cleanCount: number;
  dirtyCount: number;
  inspectedCount: number;
  maintenanceCount: number;
  outOfOrderCount: number;
  floors: FloorRoomsDto[];
}

export interface GuestDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  vipStatus: string;
  totalStays: number;
  lifetimeSpend: number;
  specialPreferences?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  vipStatus?: string;
  specialPreferences?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UpdateGuestRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  vipStatus?: string;
  specialPreferences?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface GuestCrmSummaryDto {
  totalStays: number;
  upcomingReservations: number;
  completedStays: number;
  totalRevenue: number;
  outstandingBalance: number;
  lastStayDate?: string;
  averageStayDurationNights: number;
}

export interface GuestStayHistoryDto {
  reservationId: number;
  confirmationNumber: string;
  roomTypeCode: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  status: string;
}

export interface GuestFolioItemDto {
  id: number;
  itemType: string;
  departmentCode: string;
  description: string;
  amount: number;
  paymentModeCode?: string;
  transactionReference?: string;
  postedAt: string;
}

export interface GuestFolioSummaryDto {
  folioId: number;
  folioNumber: string;
  reservationConfirmation: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  createdAt: string;
  items: GuestFolioItemDto[];
}

export interface GuestAuditEventDto {
  eventType: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface GuestCrmProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  vipStatus: string;
  specialPreferences?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  summary: GuestCrmSummaryDto;
  reservations: ReservationDto[];
  stayHistory: GuestStayHistoryDto[];
  folios: GuestFolioSummaryDto[];
  auditLog: GuestAuditEventDto[];
}

export interface GuestCrmStatsDto {
  totalCount: number;
  activeCount: number;
  vipCount: number;
  inactiveCount: number;
  totalSpend: number;
  averageSpend: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedGuest?: GuestDto;
}

export interface ReservationDto {
  id: number;
  confirmationNumber: string;
  guestId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestVip?: string;
  roomTypeCode: string;
  assignedRoomId?: number;
  assignedRoomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount: number;
  reservationStatus: string;
  bookingSource: string;
  ratePerNight: number;
  totalEstimatedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  specialRequests?: string;
  actualCheckInAt?: string;
  actualCheckOutAt?: string;
}

export interface CreateReservationRequest {
  guestId?: number;
  newGuest?: CreateGuestRequest;
  roomTypeCode: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount?: number;
  childrenCount?: number;
  bookingSource?: string;
  customRate?: number;
  specialRequests?: string;
}

export interface CheckInRequest {
  reservationId: number;
  roomId: number;
  keyCardUid?: string;
  advanceDeposit?: number;
  paymentModeCode?: string;
}

export interface CheckOutRequest {
  reservationId: number;
  settlementPayment?: number;
  paymentModeCode?: string;
  notes?: string;
}

export interface FolioItemDto {
  id: number;
  itemType: string;
  departmentCode: string;
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  paymentModeCode?: string;
  transactionReference?: string;
  postedAt: string;
  postedBy: string;
}

export interface FolioDto {
  id: number;
  folioNumber: string;
  reservationId: number;
  confirmationNumber: string;
  guestId: number;
  guestName: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  balanceAmount: number;
  items: FolioItemDto[];
}

export interface PostChargeRequest {
  folioId: number;
  departmentCode: string;
  description: string;
  unitPrice: number;
  quantity?: number;
}

export interface PostPaymentRequest {
  folioId: number;
  amount: number;
  paymentModeCode: string;
  transactionReference?: string;
}

export interface UpdateRoomStatusRequest {
  statusCode: string;
  notes?: string;
}
