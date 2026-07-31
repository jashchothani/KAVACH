import React from 'react';

export const KavachLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const dimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${dimensions} rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-0.5 shadow-lg shadow-rose-950/20 flex items-center justify-center overflow-hidden shrink-0 group`}>
        {/* Shield background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 to-sky-500/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Shield SVG Shape */}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
          {/* Outer Shield */}
          <path
            d="M50 5 L90 20 L90 50 C90 75 70 90 50 95 C30 90 10 75 10 50 L10 20 Z"
            fill="none"
            stroke="url(#shieldGrad)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Left Dark Side */}
          <path
            d="M50 8 L87 22 L87 48 C87 70 70 85 50 89 Z"
            fill="#0f172a"
            opacity="0.9"
          />
          {/* Right Crimson Side */}
          <path
            d="M50 8 L13 22 L13 48 C13 70 30 85 50 89 Z"
            fill="#be123c"
            opacity="0.85"
          />
          
          {/* Letter K */}
          <path
            d="M32 30 L32 70 M32 50 L55 30 M38 46 L58 70"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Flask icon at base */}
          <path
            d="M45 68 L55 68 L52 75 L48 75 Z"
            fill="#f43f5e"
          />
          
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-lg tracking-wider text-slate-900 bg-gradient-to-r from-slate-900 via-rose-950 to-sky-900 bg-clip-text text-transparent">
            KAVACH
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">
            XDR-SOAR
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">
          Swastik Chemical (India)
        </span>
      </div>
    </div>
  );
};
