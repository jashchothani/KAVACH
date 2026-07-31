import React from 'react';
import { PROJECT_DETAILS, TEAM_MEMBERS } from '../data/projectData';
import { Building2, Award, Users, BookOpen, CheckCircle2, Shield, Target, Compass } from 'lucide-react';
import { motion } from 'motion/react';

export const AboutUs: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12 pb-16"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-rose-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.15),transparent_60%)]"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold">
            <Award className="w-4 h-4 text-rose-400" />
            Diploma Final Year Project (2026–2027) • Computer Engineering
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            About Kavach & Project Team
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Developed as a sponsored, real-world deployment for <strong className="text-white">Swastik Chemical (India)</strong> under Shri Bhagubhai Mafatlal Polytechnic (SVKM's), Kavach bridges the gap between machine telemetry and human-layer social engineering defense.
          </p>
        </div>
      </div>

      {/* College & Sponsor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Institution</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Shri Vile Parle Kelavani Mandal's<br />
            <strong className="text-slate-900">Shri Bhagubhai Mafatlal Polytechnic</strong><br />
            Department of Computer Engineering (Semester VI)
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Industry Sponsor</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            <strong className="text-slate-900">Swastik Chemical (India)</strong><br />
            Validated against live industrial IT infrastructure, chemical plant endpoints, and secure communications.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Academic Guidance</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            <strong>Project Guide:</strong> Smt. Priti Bokariya<br />
            <strong>Head of Department:</strong> Shri J. S. Kulkarni<br />
            <strong>Course Code:</strong> PRO230812 (2026–2027)
          </p>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Diploma Computer Engineering Project Team</h2>
            <p className="text-xs text-slate-500">Committed student developers building enterprise-grade security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM_MEMBERS.map((member, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3 relative overflow-hidden group hover:border-rose-300 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                0{idx + 1}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{member.name}</h4>
                <p className="text-xs text-rose-600 font-mono font-bold mt-0.5">Roll No: {member.roll}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer Engineering Diploma Candidate specialized in XDR telemetry architecture, AI threat correlation, and SOAR automation playbooks.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 text-rose-700">
            <Compass className="w-6 h-6" />
            <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            “Create a sustainable academic environment to produce highly competent computer professionals of the future, capable of defending critical industrial assets against advanced AI-driven cyber threats.”
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 text-sky-700">
            <Target className="w-6 h-6" />
            <h3 className="text-lg font-bold text-slate-900">Project Objectives</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>Unify Windows Security Events, Sysmon, FIM, and ransomware canary files into one pipeline.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>Add dedicated human-layer defense against deepfake vishing calls and phishing URLs.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>Provide instant automated SOAR playbooks with one-click reversible rollback.</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
