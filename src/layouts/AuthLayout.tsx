import React from 'react';
import { Building2, ShieldCheck, Hotel, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC<{
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#0F172A] text-slate-100 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Luxury ambient backdrop radial gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[160px] pointer-events-none" />

      {/* Ambient header bar */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#14243A] to-[#4656C8] text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/30">
            <Hotel className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-white">HotelOS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                Enterprise v2.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Next-Gen Hotel PMS &bull; ERP Platform</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium">Core API Connected</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Zero-Trust Secured</span>
          </div>
        </div>
      </header>

      {/* Main card center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-6">
            <div className="inline-flex p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">{subtitle}</p>}
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-[#14243A]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 ring-1 ring-white/5">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} HotelOS Platform.</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Enterprise Operations &amp; Property Management System</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Multi-Property Grid
          </span>
          <span>&bull;</span>
          <span>TLS 1.3 Strict</span>
          <span>&bull;</span>
          <span>Paperless PMS</span>
        </div>
      </footer>
    </div>
  );
};
