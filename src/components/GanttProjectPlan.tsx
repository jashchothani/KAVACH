import React, { useState } from 'react';
import { GANTT_WEEKS, GANTT_ACTIVITIES, DEVELOPMENT_MODULES } from '../data/projectData';
import { Calendar, Layers, CheckCircle2, Clock } from 'lucide-react';

export const GanttProjectPlan: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gantt' | 'modules'>('gantt');

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & Toggle */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            Project Execution Schedule (2026–2027)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Project Planning (Gantt Chart) & Development Modules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            11-week real-world project calendar from 13 July 2026 through to deployment on 27 September 2026, tracked against Swastik Chemical (India)'s environment.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('gantt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gantt' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gantt Chart (11 Weeks)
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'modules' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Development Modules (1-8)
          </button>
        </div>
      </div>

      {activeTab === 'gantt' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-base font-bold text-slate-900">11-Week Live Project Calendar</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="w-3.5 h-3.5 rounded bg-sky-600 inline-block"></span>
              <span>Shaded cell = Active development week for that activity</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4 w-72">Activities / Weeks</th>
                  {GANTT_WEEKS.map((w) => (
                    <th key={w.weekNum} className="py-3.5 px-2 text-center border-l border-slate-200">
                      <div>W{w.weekNum}</div>
                      <div className="text-[9px] font-normal text-slate-400">{w.dates}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {GANTT_ACTIVITIES.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{act.name}</td>
                    {GANTT_WEEKS.map((w) => {
                      const isActive = act.activeWeeks.includes(w.weekNum);
                      return (
                        <td key={w.weekNum} className="py-3 px-2 text-center border-l border-slate-100">
                          {isActive ? (
                            <div className="w-full h-7 rounded-lg bg-sky-600 shadow-xs flex items-center justify-center text-white font-bold text-[10px]">
                              ■
                            </div>
                          ) : (
                            <div className="w-full h-7 rounded-lg bg-slate-50/50"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEVELOPMENT_MODULES.map((mod) => (
            <div key={mod.number} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-sky-600 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100">
                  Module {mod.number} • {mod.duration}
                </span>
                <span className="text-xs font-semibold text-slate-500">{mod.dates}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{mod.description}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Deliverables:</p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {mod.keyTasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
