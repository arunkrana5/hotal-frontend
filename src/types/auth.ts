export interface UserProfile {
  id: number;
  publicId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  employeeId?: string | null;
  departmentId?: number | null;
  designationId?: number | null;
  status: 'Active' | 'Inactive' | 'Locked' | 'PendingFirstLogin';
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  defaultPropertyId?: number | null;
  assignedPropertyIds: number[];
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserProfile;
}

export interface UserSession {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  statusCode: number;
}
