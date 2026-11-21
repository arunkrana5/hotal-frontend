import React from 'react';
import { ShieldCheck, Building2, Sparkles, Award } from 'lucide-react';

export const AuthLayout: React.FC<{
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-black relative overflow-hidden font-sans">
      {/* Luxury ambient backdrop radial gradients & glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-500/[0.05] blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-amber-600/[0.03] blur-[180px] pointer-events-none" />

      {/* Top Luxury Brand Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 via-slate-900 to-amber-600/30 border border-amber-500/40 shadow-lg shadow-amber-950/40 text-amber-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold tracking-wider text-lg text-white">HOTEL OS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Luxury Edition
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Enterprise Hospitality Management System</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium">Core API Operational</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Zero-Trust Secured</span>
          </div>
        </div>
      </header>

      {/* Main card center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[460px]">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-600/10 border border-amber-500/30 text-amber-300 mb-3.5 shadow-xl shadow-amber-950/20">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white mb-2">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">{subtitle}</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090e1a]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 ring-1 ring-white/5">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} HotelOS Inc.</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Enterprise Operations &amp; Property Management System</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" /> Multi-Property Grid
          </span>
          <span>&bull;</span>
          <span>TLS 1.3 Strict</span>
          <span>&bull;</span>
          <span>Zero-Trust FIPS 140-2</span>
        </div>
      </footer>
    </div>
  );
};
