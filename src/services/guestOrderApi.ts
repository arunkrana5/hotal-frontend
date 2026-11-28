import { api } from './api';

export interface RoomQrCodeDto {
  id: number;
  propertyId: number;
  roomId: number;
  roomNumber: string;
  roomType: string;
  qrToken: string;
  qrUrl: string;
  requirePin: boolean;
  pinCode?: string | null;
  isActive: boolean;
  scanCount: number;
  generatedAt: string;
  lastScannedAt?: string | null;
}

export interface GenerateRoomQrRequest {
  roomId: number;
  requirePin?: boolean;
  pinCode?: string | null;
}

export interface BulkGenerateRoomQrRequest {
  roomIds?: number[] | null;
  overwriteExisting?: boolean;
}

export interface QrValidationResultDto {
  isValid: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  propertyId?: number | null;
  propertyName?: string | null;
  roomId?: number | null;
  roomNumber?: string | null;
  roomType?: string | null;
  requirePin: boolean;
  isOccupied: boolean;
  guestName?: string | null;
  sessionToken?: string | null;
}

export interface GuestSessionInitRequest {
  qrToken: string;
  pinCode?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
}

export interface GuestSessionDto {
  sessionToken: string;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomNumber: string;
  guestDisplayName?: string | null;
  isStayVerified: boolean;
  verificationMode: string;
  expiresAt: string;
}

export interface MenuItemDto {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  description?: string | null;
  price: number;
  preparationTimeMinutes: number;
  dietaryType: string;
  isAvailable: boolean;
  imageUrl?: string | null;
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
  notes?: string | null;
}

export interface GuestPlaceOrderRequest {
  sessionToken: string;
  guestDisplayName?: string | null;
  deliveryContactPhone?: string | null;
  specialInstructions?: string | null;
  paymentMethod: string;
  items: CreateOrderItemRequest[];
}

export interface RestaurantOrderItemDto {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  notes?: string | null;
}

export interface GuestOrderSummaryDto {
  id: number;
  orderNumber: string;
  roomId: number;
  roomNumber: string;
  guestDisplayName?: string | null;
  deliveryContactPhone?: string | null;
  isStayVerified: boolean;
  status: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  specialInstructions?: string | null;
  placedAt: string;
  acceptedAt?: string | null;
  preparedAt?: string | null;
  deliveredAt?: string | null;
  estimatedDeliveryMinutes?: number | null;
  deliveryStaffName?: string | null;
  items: RestaurantOrderItemDto[];
}

export interface StaffRoomOrderDto {
  id: number;
  orderNumber: string;
  orderType: string;
  tableId?: number | null;
  tableNumber?: string | null;
  roomId?: number | null;
  roomNumber?: string | null;
  guestId?: number | null;
  guestName?: string | null;
  folioId?: number | null;
  status: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  serverUserId?: number | null;
  serverUserName?: string | null;
  specialInstructions?: string | null;
  placedAt: string;
  preparedAt?: string | null;
  servedAt?: string | null;
  deliveredAt?: string | null;
  source?: string | null;
  deliveryContactPhone?: string | null;
  guestDisplayName?: string | null;
  isStayVerified: boolean;
  estimatedDeliveryMinutes?: number | null;
  deliveryStaffName?: string | null;
  items: RestaurantOrderItemDto[];
}

export interface GuestCreateServiceRequest {
  sessionToken: string;
  requestType: string;
  description?: string | null;
}

export interface GuestServiceRequestDto {
  id: number;
  requestNumber: string;
  roomId: number;
  roomNumber: string;
  floorNumber: number;
  guestId?: number | null;
  guestName?: string | null;
  requestType: string;
  department: string;
  priority: string;
  status: string;
  description: string;
  assignedToUserId?: number | null;
  assignedToUserName?: string | null;
  requestedAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

export interface StaffUpdateRoomOrderStatusRequest {
  status: string;
  estimatedDeliveryMinutes?: number | null;
  deliveryStaffName?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const guestOrderApi = {
  // Staff methods
  getRoomQrCodes: () => api.get<RoomQrCodeDto[]>('/guest-order/qr-codes'),

  generateRoomQr: (data: GenerateRoomQrRequest) =>
    api.post<RoomQrCodeDto>('/guest-order/qr-codes/generate', data),

  bulkGenerateRoomQr: (data: BulkGenerateRoomQrRequest) =>
    api.post<RoomQrCodeDto[]>('/guest-order/qr-codes/bulk-generate', data),

  revokeRoomQr: (id: number) =>
    api.post<boolean>(`/guest-order/qr-codes/${id}/revoke`),

  getRoomOrders: (page = 1, pageSize = 15, status?: string) => {
    let url = `/guest-order/room-orders?page=${page}&pageSize=${pageSize}`;
    if (status && status !== 'ALL') {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return api.get<PagedResult<StaffRoomOrderDto>>(url);
  },

  updateRoomOrderStatus: (id: number, data: StaffUpdateRoomOrderStatusRequest) =>
    api.put<StaffRoomOrderDto>(`/guest-order/room-orders/${id}/status`, data),

  // Guest portal methods (public)
  resolveQrToken: (token: string) =>
    api.get<QrValidationResultDto>(`/guest-order/resolve/${encodeURIComponent(token)}`),

  initSession: (data: GuestSessionInitRequest) =>
    api.post<GuestSessionDto>('/guest-order/session', data),

  getGuestMenu: (sessionToken: string, category?: string) => {
    let url = `/guest-order/menu?sessionToken=${encodeURIComponent(sessionToken)}`;
    if (category && category !== 'ALL') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    return api.get<MenuItemDto[]>(url);
  },

  placeGuestOrder: (data: GuestPlaceOrderRequest) =>
    api.post<GuestOrderSummaryDto>('/guest-order/orders', data),

  getOrderDetails: (orderNumber: string) =>
    api.get<GuestOrderSummaryDto>(`/guest-order/orders/${encodeURIComponent(orderNumber)}`),

  requestService: (data: GuestCreateServiceRequest) =>
    api.post<GuestServiceRequestDto>('/guest-order/services', data),
};
