import React from 'react';
import { PROJECT_DETAILS, TEAM_MEMBERS } from '../data/projectData';
import { Shield, Award, Users, Building2, CheckCircle2, ArrowRight, BookOpen, Layers, Zap, Download, Mail, Activity, Lock, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { KavachLogo } from './KavachLogo';

interface HomeOverviewProps {
  onNavigate: (tab: string) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-16 pb-20"
    >
      
      {/* Hero Section with Pulsing 3D Gradient Backdrop Effect */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white p-8 sm:p-16 shadow-2xl border border-rose-950/50">
        {/* Animated Background 3D Rings / Glow */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-bold tracking-wider uppercase"
          >
            <Shield className="w-4 h-4 text-rose-400 animate-pulse" />
            Diploma Final Year Project • Shri Bhagubhai Mafatlal Polytechnic
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]"
          >
            AI-Driven SOAR-XDR <br />
            <span className="bg-gradient-to-r from-rose-400 via-rose-200 to-sky-400 bg-clip-text text-transparent">
              Threat Intelligence & Response
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-normal"
          >
            Kavach unifies endpoint telemetry, machine behavior, and human-layer defense (deepfake vishing, phishing) into a single automated SOAR pipeline with MITRE ATT&CK mapping and instant one-click rollback.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-rose-600/30 transform hover:-translate-y-0.5"
            >
              <span>Get Started (XDR Live)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 backdrop-blur-md transition-all"
            >
              <Users className="w-4 h-4 text-rose-400" />
              <span>About Project Team</span>
            </button>
            <button
              onClick={() => onNavigate('download')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 backdrop-blur-md transition-all"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download Agent & PDF</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => onNavigate('dashboard')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">XDR Simulator</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Test live threat detections, Sysmon events, and automated SOAR playbooks.</p>
        </div>

        <div
          onClick={() => onNavigate('mitre')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">MITRE ATT&CK</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Explore industry-aligned detection rules mapped to documented adversary tactics.</p>
        </div>

        <div
          onClick={() => onNavigate('soar')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Terminal className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">SOAR Playbooks</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Automated host isolation, process termination, and one-click rollback commands.</p>
        </div>

        <div
          onClick={() => onNavigate('contact')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Contact Us</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Get in touch with the student team, project guide, and Swastik Chemical sponsor.</p>
        </div>
      </div>

      {/* Sponsor & Institutional Highlights */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8 sm:p-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Sponsored Real-World Deployment</h2>
            <p className="text-slate-500 text-sm mt-1">Built and validated against actual industrial threat exposure at Swastik Chemical (India).</p>
          </div>
          <button
            onClick={() => onNavigate('about')}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-4 py-2.5 rounded-xl w-fit"
          >
            <span>Read Full About Us & Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">01</div>
            <h4 className="font-bold text-slate-900 text-base">Machine Telemetry Layer</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Continuous monitoring of Windows Event Logs (4624, 4625, 4648), Microsoft Sysmon (1, 3, 10, 11), File Integrity Monitoring, and ransomware canary files.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">02</div>
            <h4 className="font-bold text-slate-900 text-base">Human-Layer Defense</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated AI engine detecting deepfake voice/video impersonation, vishing calls, and phishing websites/emails in real-time before financial loss occurs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">03</div>
            <h4 className="font-bold text-slate-900 text-base">Automated SOAR & Rollback</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pre-built automated playbooks for host isolation, process termination, account lockout, and file quarantine with one-click reversible audit rollback.
            </p>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
