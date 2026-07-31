/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeOverview } from './components/HomeOverview';
import { AboutUs } from './components/AboutUs';
import { XdrDashboard } from './components/XdrDashboard';
import { MitreMatrixView } from './components/MitreMatrixView';
import { SoarPlaybooks } from './components/SoarPlaybooks';
import { GanttProjectPlan } from './components/GanttProjectPlan';
import { SystemSpecsModal } from './components/SystemSpecsModal';
import { DownloadPage } from './components/DownloadPage';
import { ContactPage } from './components/ContactPage';
import { Shield, Award, Mail, X, Lock, CheckCircle2 } from 'lucide-react';
import { PROJECT_DETAILS, TEAM_MEMBERS } from './data/projectData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginSuccess(true);
    setTimeout(() => {
      setLoginSuccess(false);
      setLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    }, 1500);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'bg-[#08090c] text-slate-100 selection:bg-rose-600 selection:text-white' : 'bg-[#F8F9FB] text-slate-900 selection:bg-rose-500 selection:text-white'}`}>
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        {activeTab === 'overview' && <HomeOverview onNavigate={setActiveTab} />}
        {activeTab === 'about' && <AboutUs onNavigate={setActiveTab} />}
        {activeTab === 'dashboard' && <XdrDashboard />}
        {activeTab === 'mitre' && <MitreMatrixView />}
        {activeTab === 'soar' && <SoarPlaybooks />}
        {activeTab === 'gantt' && <GanttProjectPlan />}
        {activeTab === 'download' && <DownloadPage />}
        {activeTab === 'contact' && <ContactPage />}
        {activeTab === 'specs' && <SystemSpecsModal />}
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#08090c] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'} border-t py-12 text-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-sky-600 text-white flex items-center justify-center font-bold shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{PROJECT_DETAILS.title}</p>
              <p className="text-[11px] text-slate-400">{PROJECT_DETAILS.institute}</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
              Submitted by <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Jash Bharat Chothani (B007)</strong>, <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Shishir Jaimin Bhavsar (B030)</strong>, <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Ved Kantilal Waghela (B061)</strong>
            </p>
            <p className="text-slate-400">
              Guided by {PROJECT_DETAILS.guide} • Sponsored by <strong className="text-rose-500">{PROJECT_DETAILS.sponsor}</strong>
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-900 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Kavach SOC Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to access secure telemetry and MSDS library</p>
            </div>

            {loginSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-emerald-600">Login Successful!</h4>
                <p className="text-xs text-slate-500">Redirecting to secure SOC dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SOC Analyst Email</label>
                  <input
                    type="email"
                    required
                    placeholder="analyst@swastikchemical.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
                >
                  Authenticate & Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

