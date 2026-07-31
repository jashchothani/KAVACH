import React, { useState } from 'react';
import { KavachLogo } from './KavachLogo';
import { Shield, Activity, Database, Workflow, Calendar, FileText, Download, Mail, Info, Menu, X, ArrowRight, Sun, Moon, LogIn } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, darkMode, setDarkMode, onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Home', icon: FileText },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'dashboard', label: 'Get Started (XDR)', icon: Activity },
    { id: 'mitre', label: 'MITRE Matrix', icon: Shield },
    { id: 'soar', label: 'SOAR Playbooks', icon: Workflow },
    { id: 'gantt', label: 'Gantt Plan', icon: Calendar },
    { id: 'download', label: 'Download', icon: Download },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'specs', label: 'System Specs', icon: Database },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200/80 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => handleNavClick('overview')}>
            <KavachLogo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className={`hidden xl:flex items-center gap-1 p-1.5 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-100/80 border-slate-200/60'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-rose-900 text-white shadow-sm'
                      : darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-200' : 'text-rose-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenLogin}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
            >
              <LogIn className="w-3.5 h-3.5 text-rose-500" />
              <span>Log In</span>
            </button>

            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu & Theme Buttons */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className={`xl:hidden border-b px-4 py-4 space-y-2 animate-fade-in shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button
            onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}
          >
            <LogIn className="w-4 h-4 text-rose-500" />
            <span>Log In</span>
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : darkMode ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

