import { createContext } from 'react';

export interface User {
  id: string | number;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  role_id?: number;
  role_name?: string;
  is_active: boolean;
  mfa_enabled?: boolean;
  permissions?: string[];
  department?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  loginWithOtp?: (identifier: string, otpCode: string) => Promise<boolean>;
  register?: (username: string, email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
