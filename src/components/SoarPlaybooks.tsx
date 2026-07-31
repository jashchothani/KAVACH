import React, { useState } from 'react';
import { Workflow, RotateCcw, Terminal, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const SoarPlaybooks: React.FC = () => {
  const [activePlaybook, setActivePlaybook] = useState<number>(0);
  const [testExecuted, setTestExecuted] = useState<boolean>(false);

  const playbooks = [
    {
      title: 'Host Isolation & Rollback',
      target: 'Windows Endpoints (Windows 10/11 & Server)',
      trigger: 'Ransomware Canary trip or LSASS memory dump detection',
      action: 'Automatically creates Windows Firewall inbound/outbound deny rules to isolate infected endpoint from lateral movement.',
      rollbackCommand: 'netsh advfirewall firewall delete rule name="Kavach_Isolate_Block_..."',
      description: 'Ensures compromised machines are instantly severed from network access while preserving forensic memory state for SOC investigation.'
    },
    {
      title: 'Account Lockout & Enable Rollback',
      target: 'Domain Controller Active Directory / Local Users',
      trigger: 'Brute-Force Attack (>5 failed logons within 10 minutes)',
      action: 'Automatically disables targeted user account to prevent credential stuffing and brute-force takeover.',
      rollbackCommand: 'net user <username> /active:yes',
      description: 'Stops automated password spraying attacks instantly and provides a simple single-command administrative account reactivation upon verification.'
    },
    {
      title: 'File Quarantine & Restoration',
      target: 'System32 / SysWOW64 / User Profile Directories',
      trigger: 'Malware hash match or unauthorized binary tampering (FIM)',
      action: 'Quarantines malicious file into secure encrypted storage vault and strips execution permissions.',
      rollbackCommand: 'Restore from secure quarantine store using transaction metadata chain-of-custody logs.',
      description: 'Preserves complete chain-of-custody for forensic audit while neutralizing malicious payloads instantly.'
    },
    {
      title: 'Human-Layer Vishing & Phishing Takedown',
      target: 'VoIP Call Streams & Phishing URL Endpoints',
      trigger: 'AI Voice-spectrogram or NLP Phishing Content Classifier',
      action: 'Auto-blocks caller ID, warns recipient with real-time HUD alert, and submits malicious URL takedown request.',
      rollbackCommand: 'API call to release caller blocklist and restore URL DNS resolution.',
      description: 'Extends SOAR automation beyond traditional endpoints into human communications (calls, video, email).'
    },
  ];

  const handleTestPlaybook = () => {
    setTestExecuted(true);
    setTimeout(() => setTestExecuted(false), 4000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Workflow className="w-4 h-4" />
            Automated Orchestration & Response
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SOAR Playbook Response & One-Click Rollback
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every automated action taken by Kavach is logged with full audit detail and can be reversed with a single command, ensuring analysts retain complete control.
          </p>
        </div>

        <button
          onClick={handleTestPlaybook}
          className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Terminal className="w-4 h-4" />
          <span>Simulate Playbook Test</span>
        </button>
      </div>

      {testExecuted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Simulated SOAR playbook triggered successfully! Automated containment rules applied across target nodes with full audit trail logged.</span>
        </div>
      )}

      {/* Playbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playbooks.map((pb, idx) => {
          const isActive = activePlaybook === idx;
          return (
            <div
              key={idx}
              onClick={() => setActivePlaybook(idx)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer bg-white space-y-4 ${
                isActive ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-sky-600 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100">
                  Playbook #{idx + 1}
                </span>
                <span className="text-xs text-slate-500 font-medium">{pb.target}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{pb.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{pb.description}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-700">Trigger:</span> <span className="text-slate-600">{pb.trigger}</span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-700">Action:</span> <span className="text-slate-600">{pb.action}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                <div className="text-[10px] text-sky-400 font-bold uppercase flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Rollback Command
                </div>
                <div className="truncate text-slate-300">{pb.rollbackCommand}</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
