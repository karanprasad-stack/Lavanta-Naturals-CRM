import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, ProfileUpdateData } from '../services/authService';

interface AuthContextType {
  currentUser: User;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
  updateCurrentUser: (user: Partial<User>) => void;
}

const DEFAULT_FALLBACK_USER: User = {
  id: 'user-karan',
  name: 'Karan Prasad',
  email: 'karan@lavantanaturals.com',
  role: 'FOUNDER',
  department: 'Executive',
  designation: 'Founder & CEO',
  joiningDate: '2023-01-15',
  joinDate: '2023-01-15',
  phone: '+91 98201 44521',
  profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  status: 'ACTIVE'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_FALLBACK_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.hasToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to ensure avatar and joinDate compatibility
  const normalizeUser = (user: any): User => {
    return {
      ...user,
      id: user.id || user._id,
      avatar: user.profilePhoto || user.avatar || DEFAULT_FALLBACK_USER.avatar,
      profilePhoto: user.profilePhoto || user.avatar || DEFAULT_FALLBACK_USER.profilePhoto,
      joinDate: user.joiningDate || user.joinDate || '2023-01-15',
      joiningDate: user.joiningDate || user.joinDate || '2023-01-15'
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.hasToken()) {
        try {
          const user = await authService.getMe();
          setCurrentUser(normalizeUser(user));
          setIsAuthenticated(true);
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setCurrentUser(normalizeUser(response.user));
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API logout errors
    } finally {
      authService.removeToken();
      setIsAuthenticated(false);
      setCurrentUser(DEFAULT_FALLBACK_USER);
    }
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<User> => {
    const updated = await authService.updateProfile(data);
    const normalized = normalizeUser(updated);
    setCurrentUser(normalized);
    return normalized;
  };

  const updateCurrentUser = (user: Partial<User>) => {
    setCurrentUser(prev => normalizeUser({ ...prev, ...user }));
  };

  const activeRole: UserRole = currentUser.role || 'FOUNDER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProfile,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
