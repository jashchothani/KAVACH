import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextDef';
import type { User } from './authContextDef';

// Re-export types for external consumers
export type { User } from './authContextDef';

// Define permissions matrix matching backend App
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard:view', 'users:manage', 'threats:view', 'threats:manage',
    'incidents:view', 'incidents:manage', 'playbooks:execute', 'playbooks:approve',
    'analytics:view', 'reports:export', 'audit:view', 'ai_security:use',
    'threat_intel:view', 'settings:manage'
  ],
  soc_analyst: [
    'dashboard:view', 'threats:view', 'threats:manage',
    'incidents:view', 'incidents:manage', 'analytics:view',
    'ai_security:use', 'threat_intel:view'
  ],
  incident_responder: [
    'dashboard:view', 'threats:view', 'incidents:view', 'incidents:manage',
    'playbooks:execute', 'analytics:view', 'ai_security:use', 'threat_intel:view'
  ],
  security_manager: [
    'dashboard:view', 'users:manage', 'threats:view', 'threats:manage',
    'incidents:view', 'incidents:manage', 'playbooks:execute', 'playbooks:approve',
    'analytics:view', 'reports:export', 'audit:view', 'ai_security:use',
    'threat_intel:view'
  ],
  auditor: [
    'dashboard:view', 'threats:view', 'incidents:view',
    'analytics:view', 'reports:export', 'audit:view'
  ],
};

const MOCK_USERS: Record<string, User & { password_hash: string }> = {
  'admin@kavach.io': {
    id: 1,
    email: 'admin@kavach.io',
    username: 'admin',
    full_name: 'Kavach Admin',
    role_id: 1,
    role_name: 'super_admin',
    is_active: true,
    mfa_enabled: false,
    department: 'Security Operations',
    password_hash: 'admin123'
  },
  'analyst@kavach.io': {
    id: 2,
    email: 'analyst@kavach.io',
    username: 'analyst',
    full_name: 'SOC Analyst',
    role_id: 2,
    role_name: 'soc_analyst',
    is_active: true,
    mfa_enabled: false,
    department: 'SOC Team',
    password_hash: 'analyst123'
  },
  'responder@kavach.io': {
    id: 3,
    email: 'responder@kavach.io',
    username: 'responder',
    full_name: 'Incident Responder',
    role_id: 3,
    role_name: 'incident_responder',
    is_active: true,
    mfa_enabled: false,
    department: 'IR Team',
    password_hash: 'responder123'
  },
  'manager@kavach.io': {
    id: 4,
    email: 'manager@kavach.io',
    username: 'manager',
    full_name: 'Security Manager',
    role_id: 4,
    role_name: 'security_manager',
    is_active: true,
    mfa_enabled: false,
    department: 'Management',
    password_hash: 'manager123'
  },
  'auditor@kavach.io': {
    id: 5,
    email: 'auditor@kavach.io',
    username: 'auditor',
    full_name: 'Security Auditor',
    role_id: 5,
    role_name: 'auditor',
    is_active: true,
    mfa_enabled: false,
    department: 'Compliance',
    password_hash: 'auditor123'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('kavach_user');
    const savedToken = localStorage.getItem('kavach_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API network call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password_hash === password) {
      const { password_hash: _password_hash, ...userProfile } = mockUser;
      const fakeToken = 'mock_jwt_token_' + Math.random().toString(36).substring(7);
      
      setUser(userProfile as User);
      setToken(fakeToken);
      
      localStorage.setItem('kavach_user', JSON.stringify(userProfile));
      localStorage.setItem('kavach_token', fakeToken);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kavach_user');
    localStorage.removeItem('kavach_token');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role_name === 'super_admin') return true;
    const permissions = ROLE_PERMISSIONS[user.role_name] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
