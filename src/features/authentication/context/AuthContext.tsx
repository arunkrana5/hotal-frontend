import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { authService } from '../services/authService';
import { api } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hotelos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getAccessToken();
      if (token) {
        try {
          const res = await authService.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            api.clearTokens();
            setUser(null);
          }
        } catch {
          api.clearTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await authService.login({
        usernameOrEmail,
        password,
        rememberMe,
        deviceInfo: navigator.userAgent,
      });

      if (res.success && res.data) {
        setUser(res.data.user);
        return { success: true, message: res.message };
      }

      return { success: false, message: res.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    const res = await authService.getProfile();
    if (res.success && res.data) {
      setUser(res.data);
    }
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) ?? false;
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
