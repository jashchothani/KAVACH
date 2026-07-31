import React from 'react';
import { Database, Cpu, CheckCircle2, AlertTriangle, BookOpen, Layers } from 'lucide-react';

export const SystemSpecsModal: React.FC = () => {
  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
          <Database className="w-4 h-4" />
          Technical Specifications & Documentation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Specifications, Scope & Limitations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Comprehensive hardware/software stack requirements, project scope for Swastik Chemical (India), limitations, and academic references.
        </p>
      </div>

      {/* Software & Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Software Requirements</h2>
              <p className="text-xs text-slate-500">Operating systems and backend frameworks</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { cat: 'Operating System', tech: 'Windows 10 / 11 (endpoint agent), Windows Server (management console)' },
              { cat: 'Programming Language', tech: 'Python (detection & AI/ML engine), JavaScript / TypeScript, React.js' },
              { cat: 'Backend Framework', tech: 'Flask / Django (REST API & orchestration layer)' },
              { cat: 'Telemetry Sources', tech: 'Windows Event Log, Microsoft Sysmon, custom File Integrity Monitor' },
              { cat: 'AI / ML Libraries', tech: 'scikit-learn, Pandas, NumPy (anomaly detection & baselining)' },
              { cat: 'Database', tech: 'MySQL / PostgreSQL (structured data), Elasticsearch (log indexing & search)' },
              { cat: 'Standards Reference', tech: 'MITRE ATT&CK Framework, NIST SP 800-61 (Incident Handling Guide)' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between gap-4">
                <span className="font-bold text-slate-700 w-40 shrink-0">{item.cat}</span>
                <span className="text-slate-600 text-right">{item.tech}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hardware Minimum Specifications</h2>
              <p className="text-xs text-slate-500">Dedicated SOC management server requirements</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { comp: 'Processor', spec: 'Intel Core i5 (8th Gen) / equivalent or higher' },
              { comp: 'RAM', spec: '8 GB minimum (16 GB recommended for AI/ML model training)' },
              { comp: 'Storage', spec: '256 GB SSD (for logs, quarantine store, and training datasets)' },
              { comp: 'Network', spec: 'Isolated LAN / virtualised test lab for safe attack simulation' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between gap-4">
                <span className="font-bold text-slate-750 w-36 shrink-0">{item.comp}</span>
                <span className="text-slate-600 text-right font-medium">{item.spec}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Scope and Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Scope of the Project & Future Enhancements
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The current scope covers building and deploying a production-ready version of Kavach for Swastik Chemical (India), capable of monitoring Windows endpoints, detecting the nine threat categories — including deepfake impersonation, vishing, and phishing — and executing automated playbooks.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pt-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
              <span>Integration with external threat-intelligence feeds such as VirusTotal and MISP.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
              <span>Extending endpoint coverage to Linux and cloud workloads for true multi-platform XDR.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
              <span>Mobile companion app for real-time SOC alerts and one-tap approvals.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            Limitations & Constraints
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
              <span>Initial deployment protects Windows endpoints and sponsor communication channels (does not yet cover macOS or cloud-native workloads).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
              <span>AI/ML detection accuracy depends on the quality and volume of real-world training data available within the project timeline.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
              <span>Zero-day threats without a known behavioral signature may require external threat intelligence subscription.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* References */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <BookOpen className="w-5 h-5 text-sky-600" />
          References & Standards
        </div>
        <ul className="space-y-2 text-xs text-slate-600 font-mono">
          <li>• MITRE ATT&CK® Framework — https://attack.mitre.org</li>
          <li>• MITRE ATT&CK Technique T1656: Impersonation — https://attack.mitre.org/techniques/T1656/</li>
          <li>• MITRE ATT&CK Technique T1598.004: Phishing for Information – Spearphishing Voice — https://attack.mitre.org/techniques/T1598/004/</li>
          <li>• Microsoft Sysmon Documentation — https://learn.microsoft.com/sysinternals/downloads/sysmon</li>
          <li>• NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide</li>
        </ul>
      </div>

    </div>
  );
};
