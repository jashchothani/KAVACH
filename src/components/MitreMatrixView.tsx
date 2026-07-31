import React, { useState } from 'react';
import { MITRE_MATRIX } from '../data/projectData';
import { Shield, Search, Filter, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const MitreMatrixView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredMatrix = MITRE_MATRIX.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.threatType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.mitreId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.detectionRule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            Adversary Behaviour Alignment
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Threat Detection & Mitigation Matrix (MITRE ATT&CK)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every detection rule in Kavach is explicitly mapped to a MITRE ATT&CK technique for explainability and audit traceability across endpoint, network, and human layers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Endpoint', 'Network', 'Human Layer'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search threats (e.g. T1059, PowerShell, Vishing)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Threat Type</th>
                <th className="py-4 px-6">MITRE ID</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Detection Rule</th>
                <th className="py-4 px-6">Automated SOAR Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{item.threatType}</td>
                  <td className="py-4 px-6 font-mono text-sky-600 font-semibold">
                    <span className="px-2 py-1 rounded bg-sky-50 border border-sky-100">
                      {item.mitreId}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.category === 'Endpoint' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      item.category === 'Network' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 max-w-xs leading-relaxed">{item.detectionRule}</td>
                  <td className="py-4 px-6 text-emerald-800 font-medium max-w-xs leading-relaxed bg-emerald-50/40">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item.automatedMitigation}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
