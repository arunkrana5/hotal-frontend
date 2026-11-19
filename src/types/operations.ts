export interface HousekeepingTaskDto {
  id: number;
  taskNumber: string;
  roomId: number;
  roomNumber: string;
  floorNumber: number;
  roomTypeCode: string;
  taskType: string;
  priority: string;
  status: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  inspectedByUserId?: number;
  inspectedByUserName?: string;
  inspectedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface CreateHousekeepingTaskRequest {
  roomId: number;
  taskType: string;
  priority: string;
  assignedToUserId?: number;
  remarks?: string;
}

export interface UpdateHousekeepingTaskStatusRequest {
  status: string;
  remarks?: string;
}

export interface LinenItemDto {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  parLevel: number;
  cleanStock: number;
  inUseStock: number;
  inLaundryStock: number;
  discardedStock: number;
  unit?: string;
}

export interface UpdateLinenStockRequest {
  cleanStock: number;
  inUseStock: number;
  inLaundryStock: number;
  discardedStock: number;
}

export interface LaundryOrderItemDto {
  id: number;
  serviceType: string;
  garmentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
}

export interface LaundryOrderDto {
  id: number;
  orderNumber: string;
  orderType: string;
  roomId?: number;
  roomNumber?: string;
  guestId?: number;
  guestName?: string;
  folioId?: number;
  status: string;
  totalPieces: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  isExpress: boolean;
  specialInstructions?: string;
  deliveredAt?: string;
  createdAt: string;
  items: LaundryOrderItemDto[];
}

export interface CreateLaundryOrderItemRequest {
  serviceType: string;
  garmentName: string;
  quantity: number;
  unitPrice: number;
  remarks?: string;
}

export interface CreateLaundryOrderRequest {
  orderType: string;
  roomId?: number;
  guestId?: number;
  isExpress: boolean;
  specialInstructions?: string;
  items: CreateLaundryOrderItemRequest[];
}

export interface DiningTableDto {
  id: number;
  tableNumber: string;
  section: string;
  capacity: number;
  status: string;
  displayOrder: number;
}

export interface MenuItemDto {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  description?: string;
  price: number;
  preparationTimeMinutes: number;
  dietaryType: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface CreateMenuItemRequest {
  itemCode: string;
  itemName: string;
  category: string;
  description?: string;
  price: number;
  preparationTimeMinutes: number;
  dietaryType: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface RestaurantOrderItemDto {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  notes?: string;
}

export interface RestaurantOrderDto {
  id: number;
  orderNumber: string;
  orderType: string;
  tableId?: number;
  tableNumber?: string;
  roomId?: number;
  roomNumber?: string;
  guestId?: number;
  guestName?: string;
  folioId?: number;
  status: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  serverUserId?: number;
  serverUserName?: string;
  specialInstructions?: string;
  placedAt: string;
  preparedAt?: string;
  servedAt?: string;
  items: RestaurantOrderItemDto[];
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface CreateRestaurantOrderRequest {
  orderType: string;
  tableId?: number;
  roomId?: number;
  guestId?: number;
  specialInstructions?: string;
  items: CreateOrderItemRequest[];
}

export interface SettleRestaurantOrderRequest {
  paymentStatus: string;
  paymentMethod?: string;
}

export interface BanquetVenueDto {
  id: number;
  venueCode: string;
  venueName: string;
  location: string;
  maxCapacity: number;
  hourlyRate: number;
  dayRate: number;
  status: string;
  amenitiesJson?: string;
}

export interface BanquetBookingDto {
  id: number;
  bookingNumber: string;
  venueId: number;
  venueName: string;
  eventName: string;
  eventType: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  guestId?: number;
  guestName?: string;
  startDateTime: string;
  endDateTime: string;
  expectedGuests: number;
  status: string;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  cateringPackage?: string;
  setupStyle?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface CreateBanquetBookingRequest {
  venueId: number;
  eventName: string;
  eventType: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  guestId?: number;
  startDateTime: string;
  endDateTime: string;
  expectedGuests: number;
  totalAmount: number;
  advancePaid: number;
  cateringPackage?: string;
  setupStyle?: string;
  specialRequests?: string;
}

export interface GuestServiceRequestDto {
  id: number;
  requestNumber: string;
  roomId: number;
  roomNumber: string;
  floorNumber: number;
  guestId?: number;
  guestName?: string;
  requestType: string;
  department: string;
  priority: string;
  status: string;
  description: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  requestedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface CreateGuestServiceRequest {
  roomId: number;
  guestId?: number;
  requestType: string;
  department: string;
  priority: string;
  description: string;
  assignedToUserId?: number;
}
