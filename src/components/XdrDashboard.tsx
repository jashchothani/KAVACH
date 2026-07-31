import React, { useState } from 'react';
import { INITIAL_ALERTS } from '../data/projectData';
import { ThreatAlert } from '../types';
import { ShieldAlert, Play, RotateCcw, CheckCircle2, AlertTriangle, Terminal, Cpu, Radio, Lock, RefreshCw, Search, Filter } from 'lucide-react';

export const XdrDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(INITIAL_ALERTS[0]);
  const [simulationLog, setSimulationLog] = useState<string>('System initialized. Monitoring Windows Event Logs, Sysmon, FIM, Canary files, and Deepfake audio streams in real time.');

  const handleSimulateThreat = (type: string) => {
    let newAlert: ThreatAlert;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (type === 'powershell') {
      newAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        threatType: 'PowerShell Abuse',
        mitreId: 'T1059.001',
        severity: 'High',
        sourceLayer: 'Sysmon',
        target: 'DESKTOP-SW-08 (ENGINEERING)',
        detectionRule: 'Command line flagged for -enc, -nop, -w hidden, or IEX cradles.',
        automatedMitigation: 'Terminate the malicious PowerShell process automatically.',
        status: 'Contained',
        details: 'Simulated encoded PowerShell download cradle detected and automatically terminated by SOAR playbook.'
      };
    } else if (type === 'deepfake') {
      newAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        threatType: 'Deepfake Voice/Video Impersonation',
        mitreId: 'T1656 / T1588.007',
        severity: 'Critical',
        sourceLayer: 'Deepfake/Vishing',
        target: 'Director Zoom Meeting #88',
        detectionRule: 'AI model flags synthetic-audio spectral artefacts or facial-consistency anomalies.',
        automatedMitigation: 'Auto-terminate the session, alert SOC, and flag for mandatory manual verification.',
        status: 'Contained',
        details: 'Simulated AI-generated deepfake voice impersonation detected during executive audio stream. Session auto-terminated.'
      };
    } else if (type === 'ransomware') {
      newAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        threatType: 'Ransomware Encryption',
        mitreId: 'T1486',
        severity: 'Critical',
        sourceLayer: 'Canary',
        target: 'FILESVR-02 / Finance Share',
        detectionRule: 'Canary file modified, or >10 file modifications detected within 30 seconds.',
        automatedMitigation: 'Ransomware playbook: immediate firewall block of all ingress/egress traffic.',
        status: 'Contained',
        details: 'Simulated ransomware canary file tripped! Immediate firewall quarantine executed.'
      };
    } else {
      newAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        threatType: 'LSASS Memory Dump',
        mitreId: 'T1003.001',
        severity: 'Critical',
        sourceLayer: 'Sysmon',
        target: 'WORKSTATION-12',
        detectionRule: 'Sysmon Event ID 10 flags handles opened to lsass.exe with dangerous VM_READ access masks.',
        automatedMitigation: 'Isolate the host from the network and kill the dumping process.',
        status: 'Contained',
        details: 'Simulated credential dumping attempt on lsass.exe detected and host isolated.'
      };
    }

    setAlerts([newAlert, ...alerts]);
    setSelectedAlert(newAlert);
    setSimulationLog(`[SOAR Engine] Threat detected (${newAlert.threatType} [${newAlert.mitreId}]). Playbook executed: ${newAlert.automatedMitigation}. Status: CONTAINED & LOGGED.`);
  };

  const handleRollback = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Rolled Back' } : a));
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert({ ...selectedAlert, status: 'Rolled Back' });
    }
    setSimulationLog(`[Rollback Engine] Successfully executed one-click rollback for alert ${id}. State restored to baseline.`);
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSev = filterSeverity === 'All' || a.severity === filterSeverity;
    const matchesSearch = a.threatType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.mitreId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & Simulator Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse text-emerald-500" />
            Live SOC Operations & Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kavach XDR Threat Dashboard & Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time threat detection across Windows events, Sysmon, FIM, canary files, and deepfake audio streams. Test automated SOAR response playbooks instantly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleSimulateThreat('powershell')}
            className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-sky-600" />
            Simulate PowerShell Abuse
          </button>
          <button
            onClick={() => handleSimulateThreat('deepfake')}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-purple-600" />
            Simulate Deepfake Vishing
          </button>
          <button
            onClick={() => handleSimulateThreat('ransomware')}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-rose-600" />
            Simulate Ransomware Canary
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Alerts Today</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{alerts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Automated Containment</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {alerts.filter(a => a.status === 'Contained' || a.status === 'Rolled Back').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Critical Threats</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {alerts.filter(a => a.severity === 'Critical').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Avg Response Time</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">0.42s</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Live Simulation Audit Console Ticker */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs flex items-center gap-3 shadow-md">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></div>
        <span className="text-sky-400 font-bold shrink-0">[SOAR AUDIT LOG]:</span>
        <span className="truncate text-slate-300">{simulationLog}</span>
      </div>

      {/* Main Alert Table & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Alert List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Active Telemetry & Threat Alerts</h2>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search threat or target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
                />
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Threat / MITRE ID</th>
                  <th className="py-3 px-4">Source Layer</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50/70 font-semibold' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{alert.threatType}</div>
                        <div className="text-[10px] text-sky-600 font-mono">{alert.mitreId} • {alert.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{alert.sourceLayer}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          alert.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          alert.severity === 'High' ? 'bg-amber-100 text-amber-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          alert.status === 'Contained' ? 'bg-emerald-100 text-emerald-700' :
                          alert.status === 'Rolled Back' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sky-600 hover:underline font-semibold">Inspect</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Alert Detail & SOAR Playbook Action */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">Alert & Playbook Inspector</h3>
            {selectedAlert && (
              <span className="text-xs font-mono text-slate-400">{selectedAlert.id}</span>
            )}
          </div>

          {selectedAlert ? (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Threat & MITRE Reference</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAlert.threatType}</p>
                <p className="text-xs text-sky-600 font-mono mt-0.5">MITRE ATT&CK: {selectedAlert.mitreId}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Target & Telemetry Source</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedAlert.target}</p>
                <p className="text-xs text-slate-500 mt-0.5">Layer: {selectedAlert.sourceLayer} ({selectedAlert.timestamp})</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-sky-600" />
                  Detection Rule Triggered
                </p>
                <p className="text-xs text-slate-700 font-mono">{selectedAlert.detectionRule}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  Automated SOAR Mitigation
                </p>
                <p className="text-xs text-emerald-900 font-semibold">{selectedAlert.automatedMitigation}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Remediation Control & Audit</p>
                {selectedAlert.status !== 'Rolled Back' ? (
                  <button
                    onClick={() => handleRollback(selectedAlert.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <span>Execute One-Click Rollback</span>
                  </button>
                ) : (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center text-xs font-bold text-indigo-800">
                    ✓ Rollback Executed Successfully (State Restored)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">Select an alert from the table to view telemetry details.</p>
          )}
        </div>

      </div>

    </div>
  );
};
