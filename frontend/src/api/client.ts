import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach Authorization and X-Request-ID headers
apiClient.interceptors.request.use(
  (config) => {
    if (config.headers) {
      if (!config.headers['X-Request-ID']) {
        config.headers['X-Request-ID'] = 'web-' + Math.random().toString(36).substring(2, 10);
      }
      const token = localStorage.getItem('kavach_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for handling 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 if not logging in
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('kavach_token');
        localStorage.removeItem('kavach_user');
      }
    }
    return Promise.reject(error);
  }
);

// --- API Service Interfaces & Methods ---

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  department?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  email?: string;
  permissions: string[];
}

export interface DashboardSummary {
  kavach_score: number;
  status: 'PROTECTED' | 'ATTENTION' | 'CRITICAL';
  status_headline: string;
  status_explanation: string;
  metrics: {
    total_events: number;
    active_threats: number;
    active_incidents: number;
    connected_devices: number;
    active_collectors: number;
    avg_risk_score: number;
  };
  recent_activity: Array<{
    id: string;
    action: string;
    actor: string;
    details: any;
    timestamp: string;
  }>;
  collectors_summary: {
    running: number;
    degraded: number;
    stopped: number;
    error: number;
  };
  threat_distribution: Record<string, number>;
  timestamp: string;
}

export interface SystemLogEntry {
  timestamp: string;
  stream: string;
  level: string;
  component: string;
  message: string;
  details?: any;
}

export interface CollectorStatus {
  name: string;
  status: 'running' | 'degraded' | 'stopped' | 'error';
  category: string;
  uptime_seconds: number;
  event_count: number;
  last_heartbeat: string | null;
  last_error: string | null;
}

export interface ThreatItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  source_ip?: string;
  target_user?: string;
  timestamp: string;
  risk_score: number;
  details?: any;
  recommendation?: string;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  status: string;
  username?: string;
}

export interface NetworkConnectionItem {
  local_address: string;
  remote_address: string;
  status: string;
  pid?: number;
  process_name?: string;
}

export interface ScannedURLResult {
  url: string;
  is_safe: boolean;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
  threat_score: number;
  categories: string[];
  findings: string[];
  scanned_at: string;
}

export const api = {
  // Authentication
  auth: {
    login: async (identifier: string, password: string): Promise<TokenResponse> => {
      const resp = await apiClient.post<TokenResponse>('/auth/login', {
        username_or_email: identifier,
        password,
      });
      return resp.data;
    },
    loginInit: async (identifier: string, password: string): Promise<{ status: string; message: string; username: string; email: string; full_email?: string; otp_code?: string }> => {
      const resp = await apiClient.post('/auth/login-init', {
        username_or_email: identifier,
        password,
      });
      return resp.data;
    },
    requestOtp: async (identifier: string): Promise<{ message: string; email: string; otp_code?: string; expires_in: number }> => {
      const resp = await apiClient.post('/auth/request-otp', {
        username_or_email: identifier,
      });
      return resp.data;
    },
    verifyOtp: async (identifier: string, otpCode: string): Promise<TokenResponse> => {
      const resp = await apiClient.post<TokenResponse>('/auth/verify-otp', {
        username_or_email: identifier,
        otp_code: otpCode,
      });
      return resp.data;
    },
    register: async (username: string, email: string, password: string, role = 'member'): Promise<TokenResponse> => {
      const resp = await apiClient.post<TokenResponse>('/auth/register', {
        username,
        email,
        password,
        role,
      });
      return resp.data;
    },
    getMe: async (): Promise<AuthUser> => {
      const resp = await apiClient.get<AuthUser>('/auth/me');
      return resp.data;
    },
    logout: async (): Promise<void> => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignore logout errors
      } finally {
        localStorage.removeItem('kavach_token');
        localStorage.removeItem('kavach_user');
      }
    },
  },

  // Dashboard
  dashboard: {
    getSummary: async (): Promise<DashboardSummary> => {
      const resp = await apiClient.get<DashboardSummary>('/dashboard/summary');
      return resp.data;
    },
    triggerScan: async (): Promise<{ status: string; scan_id: string; message: string }> => {
      const resp = await apiClient.post('/dashboard/scan');
      return resp.data;
    },
  },

  // Logs & Audit Trail
  logs: {
    getLogs: async (stream?: string, limit = 100, level?: string): Promise<SystemLogEntry[]> => {
      const params: Record<string, any> = { limit };
      if (stream) params.stream = stream;
      if (level) params.level = level;
      const resp = await apiClient.get<any>('/logs', { params });
      return Array.isArray(resp.data) ? resp.data : (resp.data?.items || []);
    },
    getAuditLogs: async (limit = 50): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/audit/logs', { params: { limit } });
      return resp.data;
    },
    exportLogs: async (format: 'json' | 'csv' = 'json', stream?: string): Promise<Blob> => {
      const resp = await apiClient.get('/logs/export', {
        params: { format, stream },
        responseType: 'blob',
      });
      return resp.data;
    },
  },

  // Telemetry & Collectors
  monitoring: {
    getProcesses: async (limit = 25): Promise<ProcessItem[]> => {
      const resp = await apiClient.get<ProcessItem[]>('/monitoring/processes', { params: { limit } });
      return resp.data;
    },
    getNetwork: async (limit = 25): Promise<NetworkConnectionItem[]> => {
      const resp = await apiClient.get<NetworkConnectionItem[]>('/monitoring/network', { params: { limit } });
      return resp.data;
    },
    getActivity: async (limit = 50): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/monitoring/activity', { params: { limit } });
      return resp.data;
    },
    getCollectorsStatus: async (): Promise<CollectorStatus[]> => {
      const resp = await apiClient.get<CollectorStatus[]>('/collectors/status');
      return resp.data;
    },
    toggleCollector: async (name: string, action: 'start' | 'stop' | 'restart'): Promise<any> => {
      const resp = await apiClient.post(`/collectors/${name}/toggle`, { action });
      return resp.data;
    },
  },

  // Threats, Alerts & Incidents
  threats: {
    getThreats: async (limit = 50): Promise<ThreatItem[]> => {
      const resp = await apiClient.get<ThreatItem[]>('/threats', { params: { limit } });
      return resp.data;
    },
    getAlerts: async (status?: string, limit = 50): Promise<any[]> => {
      const params: Record<string, any> = { limit };
      if (status) params.status = status;
      const resp = await apiClient.get<any[]>('/alerts', { params });
      return resp.data;
    },
    updateAlert: async (id: string, update: { status?: string; analyst_notes?: string }): Promise<any> => {
      const resp = await apiClient.patch(`/alerts/${id}`, update);
      return resp.data;
    },
    explainAlert: async (id: string): Promise<{ alert_id: string; explanation: string; status: string; confidence?: number; recommended_action?: string }> => {
      const resp = await apiClient.post(`/alerts/${id}/explain`);
      return resp.data;
    },
    getIncidents: async (limit = 25): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/incidents', { params: { limit } });
      return resp.data;
    },
    updateIncident: async (id: string, update: { status?: string; root_cause?: string }): Promise<any> => {
      const resp = await apiClient.patch(`/incidents/${id}`, update);
      return resp.data;
    },
  },

  // Devices & Endpoints
  devices: {
    getDevices: async (limit = 50): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/devices', { params: { limit } });
      return resp.data;
    },
    updateDevice: async (id: string, data: any): Promise<any> => {
      const resp = await apiClient.patch(`/devices/${id}`, data);
      return resp.data;
    },
  },

  // URL Security
  urlScanner: {
    scan: async (url: string): Promise<ScannedURLResult> => {
      const resp = await apiClient.post<ScannedURLResult>('/url/scan', { url });
      return resp.data;
    },
    getHistory: async (limit = 20): Promise<ScannedURLResult[]> => {
      const resp = await apiClient.get<ScannedURLResult[]>('/url/history', { params: { limit } });
      return resp.data;
    },
  },

  // Raksha AI
  raksha: {
    chat: async (message: string, context = ''): Promise<{ reply: string; provider: string; model: string }> => {
      const resp = await apiClient.post('/raksha/chat', { message, context });
      return resp.data;
    },
  },

  // SOAR Playbooks
  playbooks: {
    list: async (): Promise<any[]> => {
      const resp = await apiClient.get('/soar/playbooks');
      return resp.data;
    },
    execute: async (playbookId: string, params: Record<string, any> = {}, dryRun = false): Promise<any> => {
      const resp = await apiClient.post('/soar/execute', {
        playbook_id: playbookId,
        params,
        dry_run: dryRun,
      });
      return resp.data;
    },
  },
};
