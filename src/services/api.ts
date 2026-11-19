import { ApiResponse, AuthTokenResponse } from '@/types/auth';

const API_BASE_URL = 'http://localhost:5000/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.accessToken = localStorage.getItem('hotelos_access_token');
    this.refreshToken = localStorage.getItem('hotelos_refresh_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('hotelos_access_token', accessToken);
    localStorage.setItem('hotelos_refresh_token', refreshToken);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('hotelos_access_token');
    localStorage.removeItem('hotelos_refresh_token');
    localStorage.removeItem('hotelos_user');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'omit', // Let explicit Authorization header carry the token
      });

      // If 401 Unauthorized and not already refreshing, attempt token rotation
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshedToken = await this.tryRefreshToken();
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return await retryResponse.json();
        } else {
          this.clearTokens();
          window.location.href = '/session-expired';
          return {
            success: false,
            message: 'Session expired. Please log in again.',
            statusCode: 401,
          };
        }
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error occurred.',
        statusCode: 500,
        errors: [err.message],
      };
    }
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => resolve(token));
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.isRefreshing = false;
        return null;
      }

      const resData: ApiResponse<AuthTokenResponse> = await response.json();
      if (resData.success && resData.data) {
        this.setTokens(resData.data.accessToken, resData.data.refreshToken);
        this.onRefreshed(resData.data.accessToken);
        this.isRefreshing = false;
        return resData.data.accessToken;
      }

      this.isRefreshing = false;
      return null;
    } catch {
      this.isRefreshing = false;
      return null;
    }
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }
}

export const api = new ApiClient();
