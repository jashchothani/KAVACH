export interface TeamMember {
  name: string;
  roll: string;
  role?: string;
}

export interface GanttWeek {
  weekNum: number;
  dates: string;
}

export interface GanttActivity {
  id: string;
  name: string;
  activeWeeks: number[];
}

export interface DevelopmentModule {
  number: number;
  title: string;
  duration: string;
  description: string;
  deliverables: string[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: 'Jash Bharat Chothani', roll: 'B007', role: 'Security Architect & AI Lead' },
  { name: 'Shishir Jaimin Bhavsar', roll: 'B030', role: 'Frontend & 3D WebGL Lead' },
  { name: 'Ved Kantilal Waghela', roll: 'B061', role: 'Backend & SOAR Engine Lead' },
];

export const PROJECT_DETAILS = {
  title: 'Kavach – AI-Driven SOAR-XDR Threat Intelligence & Response Platform',
  subtitle: 'Diploma Final Year Project in Computer Engineering (2026–2027)',
  institute: "Shri Bhagubhai Mafatlal Polytechnic (Shri Vile Parle Kelavani Mandal's)",
  guide: 'Smt. Priti Bokariya',
  hod: 'Shri J. S. Kulkarni',
  sponsor: 'Swastik Chemical (India)',
  courseCode: 'PRO230812',
  semester: 'VI',
};

export const GANTT_WEEKS: GanttWeek[] = [
  { weekNum: 1, dates: '13-19 Jul' },
  { weekNum: 2, dates: '20-26 Jul' },
  { weekNum: 3, dates: '27 Jul-02 Aug' },
  { weekNum: 4, dates: '03-09 Aug' },
  { weekNum: 5, dates: '10-16 Aug' },
  { weekNum: 6, dates: '17-23 Aug' },
  { weekNum: 7, dates: '24-30 Aug' },
  { weekNum: 8, dates: '31 Aug-06 Sep' },
  { weekNum: 9, dates: '07-13 Sep' },
  { weekNum: 10, dates: '14-20 Sep' },
  { weekNum: 11, dates: '21-27 Sep' },
];

export const GANTT_ACTIVITIES: GanttActivity[] = [
  { id: 'act-1', name: 'Requirement Analysis & Swastik OT Architecture Review', activeWeeks: [1, 2] },
  { id: 'act-2', name: 'Threat Vector Modeling & MITRE ATT&CK Matrix Mapping', activeWeeks: [2, 3] },
  { id: 'act-3', name: 'eBPF Kernel Sensor & Telemetry Ingestion Pipeline', activeWeeks: [3, 4, 5] },
  { id: 'act-4', name: 'Neural Anomaly Detection & AI Speech FFT Classifier', activeWeeks: [4, 5, 6] },
  { id: 'act-5', name: 'Sub-12ms Microsecond DAG SOAR Playbook Engine', activeWeeks: [5, 6, 7] },
  { id: 'act-6', name: 'SCADA Modbus & Industrial Protocol Stateful Parser', activeWeeks: [6, 7, 8] },
  { id: 'act-7', name: '3D WebGL Crystal Showcase & React SOC Dashboard', activeWeeks: [7, 8, 9] },
  { id: 'act-8', name: 'FastAPI Backend, WebSocket Stream & Merkle Vault', activeWeeks: [8, 9, 10] },
  { id: 'act-9', name: 'Swastik Chemical Plant Integration & Final Testing', activeWeeks: [10, 11] },
];

export const DEVELOPMENT_MODULES: DevelopmentModule[] = [
  {
    number: 1,
    title: 'Requirement Analysis & Security Specification',
    duration: 'Week 1-2',
    description: 'Establish baseline security requirements for Swastik Chemical OT network and enterprise cloud endpoints.',
    deliverables: ['System SRS Document', 'Threat Vector Catalog', 'Swastik Architecture Blueprint'],
  },
  {
    number: 2,
    title: 'MITRE ATT&CK Alignment & TTP Engine',
    duration: 'Week 2-3',
    description: 'Map adversary tactics and techniques against 9 critical attack categories and STIX/TAXII threat feeds.',
    deliverables: ['MITRE ATT&CK v14 Correlation Matrix', 'TTP Rule Registry', 'IOC Extractor'],
  },
  {
    number: 3,
    title: 'eBPF Telemetry Ingestion & Kernel Sensor',
    duration: 'Week 3-5',
    description: 'High-throughput sensor processing 2.4M kernel events per second across multi-cloud clusters.',
    deliverables: ['eBPF Syscall Hook Sensor', 'Windows Event Log/Sysmon Parser', 'Stream Normalizer'],
  },
  {
    number: 4,
    title: 'Neural Anomaly Detection & FFT Audio Shield',
    duration: 'Week 4-6',
    description: 'Deep learning models detecting zero-day memory injection and synthetic speech voice clone fraud.',
    deliverables: ['Transformer Zero-Day Classifier', '48 kHz FFT Audio Spectrum Analyzer', 'Biometric Vocal Model'],
  },
  {
    number: 5,
    title: 'Sub-12ms Autonomous SOAR Response Engine',
    duration: 'Week 5-7',
    description: 'Directed Acyclic Graph (DAG) remediation pipelines executing deterministic host quarantine and null-routing.',
    deliverables: ['Rust/Python Async DAG Engine', 'IP Null-Route Daemon', 'Active Directory Token Revoker'],
  },
  {
    number: 6,
    title: 'SCADA / OT Industrial Protocol DPI',
    duration: 'Week 6-8',
    description: 'Deep packet inspection for Modbus TCP, DNP3, and PROFINET chemical process sensors.',
    deliverables: ['Modbus TCP Frame Inspector', 'PLC Holding Register Whitelist', 'Air-Gapped Sync Bridge'],
  },
  {
    number: 7,
    title: '3D WebGL Showcase & SOC Command Console',
    duration: 'Week 7-9',
    description: 'Interactive Three.js 3D crystal visualization and responsive React SOC incident triage dashboard.',
    deliverables: ['3D WebGL Crystal Canvas', 'Incident Management UI', 'Interactive Sandbox Simulator'],
  },
  {
    number: 8,
    title: 'FastAPI Backend & Immutable Audit Vault',
    duration: 'Week 8-11',
    description: 'Production FastAPI REST services, WebSocket telemetry push, and SHA3-256 Merkle audit anchoring.',
    deliverables: ['FastAPI v1 API Suite', 'Real-time WebSocket Hub', 'Zero-Knowledge Merkle Ledger'],
  },
];
