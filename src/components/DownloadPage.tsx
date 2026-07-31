import React, { useState } from 'react';
import { Download, FileText, Shield, Terminal, CheckCircle2, HardDrive, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export const DownloadPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownload = (fileName: string) => {
    setDownloading(fileName);
    setTimeout(() => {
      setDownloading(null);
      setSuccessMsg(`Successfully downloaded ${fileName}! Check your downloads folder.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1500);
  };

  const downloads = [
    {
      title: 'Kavach Windows XDR Agent v1.0.4 (MSI)',
      category: 'Endpoint Sensor',
      size: '42.8 MB',
      version: 'v1.0.4 Stable',
      description: 'Production endpoint sensor for Windows 10/11 & Windows Server. Ingests Sysmon, Security Event Logs, and FIM telemetry.',
      icon: Shield,
    },
    {
      title: 'Microsoft Sysmon Hardened Configuration (XML)',
      category: 'Telemetry Config',
      size: '245 KB',
      version: 'Sysmon v15+',
      description: 'Pre-tuned Sysmon configuration template optimized for detecting LSASS dumping, PowerShell abuse, and process injection.',
      icon: Terminal,
    },
    {
      title: 'Kavach Automated SOAR Playbooks Bundle (ZIP)',
      category: 'Orchestration Engine',
      size: '12.4 MB',
      version: 'v2.1',
      description: 'Pre-built Python & Bash response playbooks for host isolation, account lockdown, file quarantine, and vishing blocking.',
      icon: Cpu,
    },
    {
      title: 'Kavach Diploma Final Year Project Synopsis & Report (PDF)',
      category: 'Documentation',
      size: '8.6 MB',
      version: '2026–2027 Edition',
      description: 'Complete 12-page project synopsis report including MITRE ATT&CK mapping, Gantt chart, and Swastik Chemical validation data.',
      icon: FileText,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            Releases & Asset Downloads
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Download Kavach Platform & Agents
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access production-ready installers, Sysmon configuration profiles, SOAR playbooks, and the official project documentation report.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Downloads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {downloads.map((item, idx) => {
          const Icon = item.icon;
          const isDownloading = downloading === item.title;
          return (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-rose-300 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700">
                      {item.version}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">File Size: {item.size}</span>
                <button
                  onClick={() => handleDownload(item.title)}
                  disabled={isDownloading}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>{isDownloading ? 'Downloading...' : 'Download Asset'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
