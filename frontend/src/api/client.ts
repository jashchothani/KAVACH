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
  security_score: number;
  score_category: string;
  status_banner: string;
  status_color: string;
  last_scan_mins_ago: number;
  stats: {
    monitored_devices: number;
    active_threats: number;
    open_incidents: number;
    total_alerts: number;
    url_scans_performed: number;
    collectors_running: number;
  };
  score_breakdown: {
    network: number;
    device: number;
    threats: number;
    applications: number;
    accounts: number;
  };
  recent_threats: Array<{
    id: string;
    name: string;
    severity: string;
    risk_score: number;
    status: string;
    what_happened: string;
    why_it_matters: string;
    recommended_action: string;
    created_at: string;
  }>;
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

export interface SystemResources {
  cpu: {
    percent: number;
    cores: number[];
    count: number;
  };
  ram: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  network_io: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  hostname: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MitreTactic {
  id: string;
  name: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  techniques: MitreTechnique[];
}

export interface MitreHeatmapResponse {
  tactics: MitreTactic[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'host' | 'process' | 'file' | 'ip' | 'registry' | 'user';
  status: 'compromised' | 'suspicious' | 'clean' | 'remediated';
  risk_score: number;
  details: Record<string, any>;
  is_patient_zero: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'spawned_by' | 'wrote_to' | 'connected_to' | 'injected_into' | 'modified_reg' | 'authenticated_as';
  label: string;
  timestamp: string;
}

export interface BlastRadiusSummary {
  total_nodes: number;
  compromised_count: number;
  affected_endpoints: number;
  compromised_processes: number;
  external_c2_ips: number;
  affected_users: number;
  containment_status: 'uncontained' | 'partially_contained' | 'isolated' | 'remediated';
  patient_zero_id: string;
  critical_path: string[];
}

export interface AttackGraphData {
  scenario_id: string;
  scenario_title: string;
  mitre_tactic: string;
  mitre_technique: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  blast_radius: BlastRadiusSummary;
}

export interface CertInIncident {
  incident_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  regulatory_category: string;
  detected_at_utc: string;
  detected_at_ist: string;
  deadline_utc: string;
  deadline_ist: string;
  time_remaining_minutes: number;
  reported_to_certin: boolean;
  affected_systems_count: number;
  blast_radius: string;
}

export interface CertInReport {
  incident_id: string;
  report_reference_id: string;
  generated_at_utc: string;
  generated_at_ist: string;
  regulatory_mandate: string;
  submission_target_email: string;
  reporting_entity: Record<string, any>;
  incident_details: Record<string, any>;
  technical_indicators: Record<string, any>;
  impact_assessment: Record<string, any>;
  remedial_actions_taken: string[];
  official_formatted_declaration: string;
}

export interface CertInAdvisory {
  id: string;
  advisory_number: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  published_date: string;
  target_sector: string;
  mitre_attack: string;
  summary: string;
  recommended_mitigation: string;
}

export interface AuditVaultStatus {
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  retention_days_guaranteed: number;
  mandatory_retention_days: number;
  ntp_clock_synchronized: boolean;
  merkle_hash_chain_active: boolean;
  cold_storage_encryption: string;
  jurisdiction: string;
  total_events_archived: number;
  earliest_record_timestamp: string;
  latest_record_timestamp: string;
}

export interface FlowNode {
  id: string;
  title: string;
  category: 'trigger' | 'condition' | 'action' | 'ai';
  action_type: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  x: number;
  y: number;
  config: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition_value?: boolean;
}

export interface FlowWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'ransomware' | 'phishing' | 'usb_defense' | 'identity' | 'custom';
  active: boolean;
  trigger_count: number;
  created_at: string;
  updated_at: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface StepExecutionResult {
  node_id: string;
  node_title: string;
  category: string;
  status: 'success' | 'skipped' | 'failed';
  duration_ms: number;
  output_message: string;
}

export interface SimulationResponse {
  workflow_id: string;
  success: boolean;
  total_duration_ms: number;
  steps_executed: StepExecutionResult[];
  containment_achieved: boolean;
  summary: string;
}

export interface DecoyItem {
  id: string;
  name: string;
  decoy_type: 'honey_file' | 'honey_credential' | 'ghost_socket' | 'registry_trap';
  target_asset: string;
  location_or_port: string;
  status: 'active_monitoring' | 'tripped' | 'quarantined' | 'dormant';
  created_at: string;
  tripped_count: number;
  threat_description: string;
}

export interface TripwireEvent {
  id: string;
  timestamp: string;
  decoy_id: string;
  decoy_name: string;
  decoy_type: string;
  host: string;
  adversary_process: string;
  pid: number;
  user: string;
  access_type: string;
  action_taken: string;
  containment_latency_ms: number;
}

export interface DeceptionOverview {
  total_active_decoys: number;
  honey_files_deployed: number;
  memory_credential_traps: number;
  ghost_listening_ports: number;
  total_tripped_events: number;
  containment_success_rate: string;
  avg_neutralization_ms: number;
  false_positive_rate: string;
}

export const api = {
  // Authentication
  auth: {
    login: async (identifier: string, password: string): Promise<TokenResponse> => {
      const resp = await apiClient.post<TokenResponse>('/auth/login', {
        username_or_email: identifier,
        username: identifier,
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

  // Logs & Audit Trail & Telemetry Engine
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
    search: async (params: { collector?: string; severity?: string; query?: string; limit?: number } = {}): Promise<{ results: any[]; count: number }> => {
      const resp = await apiClient.get('/logs/search', { params });
      return resp.data;
    },
    getNormalLogs: async (params: { level?: string; query?: string; limit?: number } = {}): Promise<{ logs: { raw: string; timestamp?: string }[]; total: number; file_path: string }> => {
      const resp = await apiClient.get('/logs/normal', { params });
      return resp.data;
    },
    getProcessingEngineInfo: async (): Promise<{
      engine_name: string;
      version: string;
      architecture_layers: {
        stage: number;
        name: string;
        technologies: string[];
        description: string;
        status: string;
      }[];
      metrics: {
        events_processed_today: number;
        anomalies_detected: number;
        active_rules: number;
        cold_storage_format: string;
        average_pipeline_latency_ms: number;
      };
    }> => {
      const resp = await apiClient.get('/logs/processing-engine');
      return resp.data;
    },
  },

  // Telemetry & Collectors
  monitoring: {
    getResources: async (): Promise<SystemResources> => {
      const resp = await apiClient.get<SystemResources>('/monitoring/system-resources');
      return resp.data;
    },
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
  url: {
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



  // MITRE ATT&CK
  mitre: {
    getHeatmap: async (): Promise<MitreHeatmapResponse> => {
      const resp = await apiClient.get<MitreHeatmapResponse>('/mitre/heatmap');
      return resp.data;
    },
  },

  // Machine Learning
  ml: {
    getStatus: async (): Promise<any> => {
      const resp = await apiClient.get('/ml/status');
      return resp.data;
    },
    train: async (): Promise<any> => {
      const resp = await apiClient.post('/ml/train');
      return resp.data;
    },
  },

  // Chakra Attack Graph & Blast Radius
  graph: {
    getOverview: async (): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/graph/overview');
      return resp.data;
    },
    getAttackTree: async (scenarioId = 'apt29-spearphish'): Promise<AttackGraphData> => {
      const resp = await apiClient.get<AttackGraphData>(`/graph/attack-tree/${scenarioId}`);
      return resp.data;
    },
    remediateNode: async (nodeId: string, action: string, reason?: string): Promise<any> => {
      const resp = await apiClient.post('/graph/remediate-node', { node_id: nodeId, action, reason });
      return resp.data;
    },
    containBlastRadius: async (scenarioId: string, isolationMode = 'full_quarantine'): Promise<any> => {
      const resp = await apiClient.post('/graph/contain-blast-radius', { scenario_id: scenarioId, isolation_mode: isolationMode });
      return resp.data;
    },
    resetScenario: async (scenarioId: string): Promise<any> => {
      const resp = await apiClient.post(`/graph/reset-scenario/${scenarioId}`);
      return resp.data;
    },
  },

  // Sovereign Indian CERT-In Compliance Suite
  compliance: {
    getIncidents: async (): Promise<CertInIncident[]> => {
      const resp = await apiClient.get<CertInIncident[]>('/compliance/cert-in/incidents');
      return resp.data;
    },
    generateReport: async (incidentId: string): Promise<CertInReport> => {
      const resp = await apiClient.post<CertInReport>(`/compliance/cert-in/generate-report/${incidentId}`);
      return resp.data;
    },
    getAdvisories: async (): Promise<CertInAdvisory[]> => {
      const resp = await apiClient.get<CertInAdvisory[]>('/compliance/cert-in/advisories');
      return resp.data;
    },
    getAuditVaultStatus: async (): Promise<AuditVaultStatus> => {
      const resp = await apiClient.get<AuditVaultStatus>('/compliance/cert-in/audit-vault-status');
      return resp.data;
    },
    markReported: async (incidentId: string): Promise<any> => {
      const resp = await apiClient.post(`/compliance/cert-in/mark-reported/${incidentId}`);
      return resp.data;
    },
    searchVault: async (query: string, daysBack = 180): Promise<any> => {
      const resp = await apiClient.post('/compliance/cert-in/search-vault', { query, days_back: daysBack });
      return resp.data;
    },
    getDownloadAnnexureUrl: (incidentId: string): string => {
      return `/api/v1/compliance/cert-in/download-annexure/${incidentId}`;
    },
  },

  // Raksha Flow — Visual Drag-and-Drop SOAR Studio
  rakshaFlow: {
    getWorkflows: async (): Promise<any[]> => {
      const resp = await apiClient.get<any[]>('/raksha-flow/workflows');
      return resp.data;
    },
    getWorkflow: async (workflowId: string): Promise<FlowWorkflow> => {
      const resp = await apiClient.get<FlowWorkflow>(`/raksha-flow/workflows/${workflowId}`);
      return resp.data;
    },
    saveWorkflow: async (workflow: FlowWorkflow): Promise<FlowWorkflow> => {
      const resp = await apiClient.post<FlowWorkflow>('/raksha-flow/workflows', workflow);
      return resp.data;
    },
    simulate: async (workflowId: string, sampleEvent: Record<string, any> = {}): Promise<SimulationResponse> => {
      const resp = await apiClient.post<SimulationResponse>('/raksha-flow/simulate', { workflow_id: workflowId, sample_event: sampleEvent });
      return resp.data;
    },
    generateWithAi: async (prompt: string): Promise<FlowWorkflow> => {
      const resp = await apiClient.post<FlowWorkflow>('/raksha-flow/generate-ai', { prompt });
      return resp.data;
    },
  },

  // Mayajaal — Active Deception & Honey-Token Engine
  deception: {
    getOverview: async (): Promise<DeceptionOverview> => {
      const resp = await apiClient.get<DeceptionOverview>('/deception/overview');
      return resp.data;
    },
    getDecoys: async (): Promise<DecoyItem[]> => {
      const resp = await apiClient.get<DecoyItem[]>('/deception/decoys');
      return resp.data;
    },
    getTripwireLogs: async (): Promise<TripwireEvent[]> => {
      const resp = await apiClient.get<TripwireEvent[]>('/deception/tripwire-logs');
      return resp.data;
    },
    deployDecoy: async (decoy: { name: string; decoy_type: string; target_asset: string; location_or_port: string; threat_description: string }): Promise<DecoyItem> => {
      const resp = await apiClient.post<DecoyItem>('/deception/deploy', decoy);
      return resp.data;
    },
    simulateTrip: async (): Promise<TripwireEvent> => {
      const resp = await apiClient.post<TripwireEvent>('/deception/simulate-trip');
      return resp.data;
    },
    decommissionDecoy: async (decoyId: string): Promise<any> => {
      const resp = await apiClient.delete(`/deception/decoys/${decoyId}`);
      return resp.data;
    },
    getDownloadCanaryUrl: (decoyId: string): string => {
      return `/api/v1/deception/download-canary/${decoyId}`;
    },
  },
};

