import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, ProfileUpdateData, RegisterData } from '../services/authService';
import { socketService } from '../services/socketService';

interface AuthContextType {
  currentUser: User;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
  updateCurrentUser: (user: Partial<User>) => void;
}

const DEFAULT_UNAUTHENTICATED_USER: User = {
  id: '',
  _id: '',
  name: '',
  email: '',
  role: 'EMPLOYEE',
  department: '',
  designation: '',
  joiningDate: '',
  joinDate: '',
  phone: '',
  profilePhoto: '',
  avatar: '',
  status: 'INACTIVE'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_UNAUTHENTICATED_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.hasToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to ensure avatar, id, and joinDate compatibility
  const normalizeUser = (user: any): User => {
    if (!user) return DEFAULT_UNAUTHENTICATED_USER;
    const rawId = (user.id || user._id)?.toString() || '';
    return {
      ...user,
      id: rawId,
      _id: rawId,
      avatar: user.profilePhoto || user.avatar || '',
      profilePhoto: user.profilePhoto || user.avatar || '',
      joinDate: user.joiningDate || user.joinDate || '',
      joiningDate: user.joiningDate || user.joinDate || ''
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
          socketService.disconnect();
          authService.removeToken();
          setIsAuthenticated(false);
          setCurrentUser(DEFAULT_UNAUTHENTICATED_USER);
        }
      } else {
        socketService.disconnect();
        setIsAuthenticated(false);
        setCurrentUser(DEFAULT_UNAUTHENTICATED_USER);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      socketService.disconnect();
      const response = await authService.login(identifier, password);
      const normalized = normalizeUser(response.user);
      setCurrentUser(normalized);
      setIsAuthenticated(true);
      socketService.connect();
      return normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<User> => {
    setIsLoading(true);
    try {
      socketService.disconnect();
      const response = await authService.register(data);
      const normalized = normalizeUser(response.user);
      setCurrentUser(normalized);
      setIsAuthenticated(true);
      socketService.connect();
      return normalized;
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
      socketService.disconnect();
      authService.removeToken();
      setIsAuthenticated(false);
      setCurrentUser(DEFAULT_UNAUTHENTICATED_USER);
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

  const activeRole: UserRole = currentUser.role || 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
        isLoading,
        login,
        register,
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
