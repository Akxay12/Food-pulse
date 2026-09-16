import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }) => Promise<UserProfile>;
  loginWithGoogle: (role?: UserRole) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default role is 'user' or derived from active profile
  const userRole: UserRole = currentUser?.role || 'user';

  // Listen to Auth state changes and session persistence (Module 1E)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authService.login(email, password);
      setCurrentUser(profile);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authService.signUp(params);
      setCurrentUser(profile);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Sign up failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: UserRole = 'user'): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authService.loginWithGoogle(role);
      setCurrentUser(profile);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Google sign-in failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    try {
      await userService.updateUserProfile(currentUser.uid, { role: newRole });
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    } catch (err) {
      console.warn('Failed to switch role:', err);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser?.uid) return;
    const refreshed = await userService.getUserProfile(currentUser.uid);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isLoading,
        error,
        login,
        signUp,
        loginWithGoogle,
        logout,
        switchRole,
        clearError,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
