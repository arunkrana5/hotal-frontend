import { api } from '@/services/api';
import { AuthTokenResponse, UserProfile, UserSession } from '@/types/auth';

export const authService = {
  login: async (body: { usernameOrEmail: string; password: string; rememberMe?: boolean; deviceInfo?: string }) => {
    const res = await api.request<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.success && res.data) {
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('hotelos_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  logout: async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } finally {
      api.clearTokens();
    }
  },

  forgotPassword: async (email: string) => {
    return api.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyResetToken: async (email: string, token: string) => {
    return api.request<{ isValid: boolean; message: string }>('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },

  resetPassword: async (body: { email: string; token: string; newPassword: string; confirmNewPassword: string }) => {
    return api.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  changePassword: async (body: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    return api.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  firstLoginSetup: async (body: { email: string; token: string; newPassword: string; confirmNewPassword: string }) => {
    return api.request('/auth/first-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  verifyEmail: async (email: string, token: string) => {
    return api.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },

  getSessions: async () => {
    return api.request<UserSession[]>('/auth/sessions', {
      method: 'GET',
    });
  },

  revokeSession: async (sessionId: string) => {
    return api.request('/auth/revoke-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  revokeAllSessions: async () => {
    return api.request('/auth/revoke-all-sessions', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    const res = await api.request<UserProfile>('/auth/profile', {
      method: 'GET',
    });
    if (res.success && res.data) {
      localStorage.setItem('hotelos_user', JSON.stringify(res.data));
    }
    return res;
  },
};
