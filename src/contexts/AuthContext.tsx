import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/auth-service';
import { PageKey, canManageUsers as userCanManageUsers, hasPageAccess } from '../constants/pagePermissions';
import { apiService } from '../services/api-service';
import { enhancedStorageService } from '../services/enhanced-storage-service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isUser: boolean;
  canManageUsers: boolean;
  hasAccess: (page: PageKey) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const clearUserDataCache = () => {
    apiService.clearCache();
    try {
      enhancedStorageService.clearCache();
    } catch (error) {
      console.warn('Failed to clear local quote cache:', error);
    }
  };

  const login = async (username: string, password: string) => {
    clearUserDataCache();
    const authResponse = await authService.login(username, password);
    setUser(authResponse.user);
  };

  const logout = () => {
    clearUserDataCache();
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: userCanManageUsers(user),
    isEditor: authService.isEditor(),
    isUser: authService.isUser(),
    canManageUsers: userCanManageUsers(user),
    hasAccess: (page: PageKey) => hasPageAccess(user, page),
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
