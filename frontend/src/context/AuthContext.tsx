import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextDef';
import type { User } from './authContextDef';
import { api } from '../api/client';

export type { User } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kavach_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('kavach_token');
      const savedUser = localStorage.getItem('kavach_user');

      if (savedToken) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // Ignore parse errors
          }
        }
        // Validate and refresh with backend
        try {
          const profile = await api.auth.getMe();
          const mappedUser: User = {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            full_name: profile.username,
            role: profile.role,
            role_name: profile.role,
            is_active: profile.is_active ?? true,
            permissions: profile.permissions || [],
            department: profile.department || 'Security Operations',
            avatar_url: profile.avatar_url,
          };
          setUser(mappedUser);
          setToken(savedToken);
          localStorage.setItem('kavach_user', JSON.stringify(mappedUser));
        } catch {
          // Token invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('kavach_token');
          localStorage.removeItem('kavach_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const resp = await api.auth.login(identifier, password);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || `${resp.username}@kavach.local`,
        username: resp.username,
        full_name: resp.username,
        role: resp.role,
        role_name: resp.role,
        is_active: true,
        permissions: resp.permissions || [],
        department: 'Security Operations',
      };

      setUser(mappedUser);
      setToken(resp.access_token);
      localStorage.setItem('kavach_token', resp.access_token);
      localStorage.setItem('kavach_user', JSON.stringify(mappedUser));
      sessionStorage.setItem('kavach_trigger_login_intro', 'true');
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const loginWithOtp = async (identifier: string, otpCode: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const resp = await api.auth.verifyOtp(identifier, otpCode);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || `${resp.username}@kavach.local`,
        username: resp.username,
        full_name: resp.username,
        role: resp.role,
        role_name: resp.role,
        is_active: true,
        permissions: resp.permissions || [],
        department: 'Security Operations',
      };

      setUser(mappedUser);
      setToken(resp.access_token);
      localStorage.setItem('kavach_token', resp.access_token);
      localStorage.setItem('kavach_user', JSON.stringify(mappedUser));
      sessionStorage.setItem('kavach_trigger_login_intro', 'true');
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role = 'member'
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const resp = await api.auth.register(username, email, password, role);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || email,
        username: resp.username,
        full_name: resp.username,
        role: resp.role,
        role_name: resp.role,
        is_active: true,
        permissions: resp.permissions || [],
      };

      setUser(mappedUser);
      setToken(resp.access_token);
      localStorage.setItem('kavach_token', resp.access_token);
      localStorage.setItem('kavach_user', JSON.stringify(mappedUser));
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('kavach_user');
    localStorage.removeItem('kavach_token');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin' || user.role === 'super_admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithOtp,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
