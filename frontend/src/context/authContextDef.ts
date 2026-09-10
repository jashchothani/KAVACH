import { createContext } from 'react';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role_id: number;
  role_name: 'super_admin' | 'soc_analyst' | 'incident_responder' | 'security_manager' | 'auditor';
  is_active: boolean;
  mfa_enabled: boolean;
  department?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
