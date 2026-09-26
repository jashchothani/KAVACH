import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextDef';
import type { User } from './authContextDef';
import { api } from '../api/client';

export type { User } from './authContextDef';

export const normalizeRole = (role?: string): string => {
  if (!role) return 'user';
  const r = role.toLowerCase().trim();
  if (r === 'layman' || r === 'layman_user' || r === 'member' || r === 'student') return 'user';
  return r;
};

export const getRoleDisplayName = (role?: string): string => {
  const norm = normalizeRole(role);
  if (norm === 'admin' || norm === 'super_admin' || norm === 'owner') return 'Administrator';
  if (norm === 'soc_analyst' || norm === 'analyst' || norm === 'security_analyst') return 'SOC Analyst';
  if (norm === 'incident_responder') return 'Incident Responder';
  if (norm === 'security_manager') return 'Security Manager';
  if (norm === 'auditor') return 'Auditor';
  return 'User';
};

export const isAnalystRole = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return [
    'soc_analyst',
    'security_analyst',
    'analyst',
    'super_admin',
    'admin',
    'owner',
    'incident_responder',
    'security_manager',
    'auditor',
  ].includes(r);
};

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
            const parsed = JSON.parse(savedUser);
            parsed.role = normalizeRole(parsed.role);
            parsed.role_name = getRoleDisplayName(parsed.role);
            setUser(parsed);
          } catch {
            // Ignore parse errors
          }
        }
        // Validate and refresh with backend
        try {
          const profile = await api.auth.getMe();
          const cleanRole = normalizeRole(profile.role);
          const mappedUser: User = {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            full_name: profile.username,
            role: cleanRole,
            role_name: getRoleDisplayName(cleanRole),
            is_active: profile.is_active ?? true,
            permissions: profile.permissions || [],
            department: profile.department || (cleanRole === 'user' ? 'Digital Defense' : 'Security Operations'),
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
      const cleanRole = normalizeRole(resp.role);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || `${resp.username}@kavach.local`,
        username: resp.username,
        full_name: resp.username,
        role: cleanRole,
        role_name: getRoleDisplayName(cleanRole),
        is_active: true,
        permissions: resp.permissions || [],
        department: cleanRole === 'user' ? 'Digital Defense' : 'Security Operations',
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
      const cleanRole = normalizeRole(resp.role);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || `${resp.username}@kavach.local`,
        username: resp.username,
        full_name: resp.username,
        role: cleanRole,
        role_name: getRoleDisplayName(cleanRole),
        is_active: true,
        permissions: resp.permissions || [],
        department: cleanRole === 'user' ? 'Digital Defense' : 'Security Operations',
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
    role = 'user'
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cleanRole = normalizeRole(role);
      const resp = await api.auth.register(username, email, password, cleanRole);
      const userRole = normalizeRole(resp.role || cleanRole);
      const mappedUser: User = {
        id: resp.username,
        email: resp.email || email,
        username: resp.username,
        full_name: resp.username,
        role: userRole,
        role_name: getRoleDisplayName(userRole),
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
