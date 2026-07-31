export interface ThreatAlert {
  id: string;
  timestamp: string;
  threatType: string;
  mitreId: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  sourceLayer: 'Windows Event Log' | 'Sysmon' | 'FIM' | 'Canary' | 'Deepfake/Vishing' | 'Phishing Engine';
  target: string;
  detectionRule: string;
  automatedMitigation: string;
  status: 'Detected' | 'Contained' | 'Rolled Back' | 'Pending Approval';
  details: string;
}

export interface MitreTechnique {
  threatType: string;
  mitreId: string;
  detectionRule: string;
  automatedMitigation: string;
  category: 'Endpoint' | 'Network' | 'Human Layer';
}

export interface DevelopmentModule {
  number: number;
  title: string;
  duration: string;
  dates: string;
  description: string;
  keyTasks: string[];
}

export interface GanttWeek {
  weekNum: number;
  dates: string;
  label: string;
}

export interface GanttActivity {
  id: string;
  name: string;
  activeWeeks: number[]; // e.g., [1, 2]
}
