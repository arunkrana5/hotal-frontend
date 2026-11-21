import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Award,
  Globe2,
  AlertTriangle,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

interface LuxuryScene {
  id: string;
  title: string;
  headline: string;
  description: string;
  category: string;
  metric: string;
  metricLabel: string;
  image: string;
}

const LUXURY_SCENES: LuxuryScene[] = [
  {
    id: 'atrium',
    title: 'Grand Atrium & Reception',
    headline: 'Hospitality, Elevated.',
    description:
      'Where architectural 5-star elegance meets intelligent enterprise property operations.',
    category: 'ARCHITECTURAL EXCELLENCE',
    metric: '99.99%',
    metricLabel: 'Enterprise Uptime SLA',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 'suite',
    title: 'The Presidential Sky Suite',
    headline: 'Unrivaled Guest Journeys.',
    description:
      'Hyper-personalized VIP suite automation, instant room turnarounds, and zero-latency concierge.',
    category: 'PREMIER SUITES',
    metric: '48+',
    metricLabel: 'Luxury Properties Live',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 'resort',
    title: 'Horizon Infinity & Dusk Terrace',
    headline: 'Resort Operations, Synchronized.',
    description:
      'Unified cabana management, poolside POS billing, and real-time amenity orchestration.',
    category: 'RESORT LIVING',
    metric: '5-Star',
    metricLabel: 'Global Luxury Standard',
    image:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 'dining',
    title: 'Michelin Reserve & Wine Vault',
    headline: 'Culinary & Beverage Precision.',
    description:
      'Live table orchestration, digital sommelier cellar records, and automated inventory sync.',
    category: 'HAUTE CUISINE',
    metric: '100%',
    metricLabel: 'Zero-Trust Financial Isolation',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 'spa',
    title: 'The Lotus Spa Sanctuary',
    headline: 'Holistic Wellness Management.',
    description:
      'Seamless therapist scheduling, bespoke treatment billing, and luxury hydrotherapy tracking.',
    category: 'WELLNESS & SPA',
    metric: '0-Lag',
    metricLabel: 'Real-Time Sync Grid',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85',
  },
];

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carousel states
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % LUXURY_SCENES.length);
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentSceneIndex]);

  const handleNextScene = () => {
    setCurrentSceneIndex((prev) => (prev + 1) % LUXURY_SCENES.length);
  };

  const handlePrevScene = () => {
    setCurrentSceneIndex((prev) => (prev - 1 + LUXURY_SCENES.length) % LUXURY_SCENES.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim()) {
      setError('Please provide your operator username or enterprise email.');
      return;
    }
    if (!password) {
      setError('Please provide your secret security passphrase.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(usernameOrEmail, password, rememberMe);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
        if (res.message.toLowerCase().includes('locked')) {
          navigate('/account-locked', { state: { message: res.message } });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during enterprise authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setUsernameOrEmail('admin');
    setPassword('Admin@HotelOS2026!');
    setError(null);
  };

  const currentScene = LUXURY_SCENES[currentSceneIndex];

  return (
    <div className="relative min-h-screen w-full flex bg-[#070b14] text-slate-100 overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* ========================================================================= */}
      {/* 1. LEFT CINEMATIC HOSPITALITY EXPERIENCE (60–65% Width Desktop)            */}
      {/* ========================================================================= */}
      <div
        className="relative hidden lg:flex flex-1 flex-col justify-between p-8 xl:p-12 2xl:p-16 overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Animated Background Carousel Images with Ken Burns Zoom & Crossfade */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={currentScene.image}
                alt={currentScene.title}
                className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.05]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Cinematic Multi-Layer Gradient Overlays for Supreme Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/50 to-transparent opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/75 via-transparent to-[#070b14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60" />
        </div>

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Gold-accented Brand Crest */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 via-slate-900 to-amber-600/30 border border-amber-500/40 shadow-xl shadow-amber-950/40 backdrop-blur-md">
              <Building2 className="w-5 h-5 text-amber-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-serif tracking-wider text-xl font-bold text-white drop-shadow-sm">
                  HOTEL OS
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  Luxury Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Unified Hospitality ERP &amp; Property Management Suite
              </p>
            </div>
          </div>

          {/* Core Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md text-xs text-slate-300 shadow-soft-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide">Global Cluster Operational</span>
          </div>
        </div>

        {/* Center / Lower Content: Scene Typography & Metric Badges */}
        <div className="relative z-10 space-y-6 max-w-2xl">
          {/* Animated Category & Headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{currentScene.category}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300 font-normal">{currentScene.title}</span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-serif font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                {currentScene.headline}
              </h2>

              <p className="text-sm xl:text-base text-slate-300/90 leading-relaxed max-w-xl font-normal drop-shadow">
                {currentScene.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Floating Metric Badges Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md transition-all hover:border-amber-500/40">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span>5-Star Global</span>
              </div>
              <div className="text-[11px] text-slate-400">Forbes Luxury Benchmark</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md transition-all hover:border-amber-500/40">
              <div className="flex items-center gap-1.5 text-white font-mono text-sm font-bold mb-1">
                <Globe2 className="w-4 h-4 text-indigo-400" />
                <span>48+ Properties</span>
              </div>
              <div className="text-[11px] text-slate-400">Active Multi-Property Grid</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md transition-all hover:border-amber-500/40">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>99.99% Uptime</span>
              </div>
              <div className="text-[11px] text-slate-400">Continuous Operations SLA</div>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Navigation & Progress Indicators */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
          {/* Scene indicators */}
          <div className="flex items-center space-x-2">
            {LUXURY_SCENES.map((scene, idx) => {
              const isActive = idx === currentSceneIndex;
              return (
                <button
                  key={scene.id}
                  onClick={() => setCurrentSceneIndex(idx)}
                  className={`group relative h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-10 bg-gradient-to-r from-amber-400 to-amber-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={scene.title}
                >
                  <span className="sr-only">{scene.title}</span>
                </button>
              );
            })}
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrevScene}
              className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Previous Scene"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextScene}
              className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Next Scene"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT LUXURY LOGIN CONSOLE (35–40% Width Desktop, Full on Mobile)      */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[460px] xl:w-[500px] 2xl:w-[540px] flex flex-col justify-between p-6 sm:p-10 xl:p-12 bg-[#090e1a]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl z-20 overflow-y-auto">
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-80 h-80 rounded-full bg-indigo-500/[0.04] blur-3xl pointer-events-none" />

        {/* Mobile Header (Visible on smaller viewports) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-slate-900 border border-amber-500/40 text-amber-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-white">HOTEL OS</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 ml-2">Luxury</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="my-auto py-4">
          {/* Header & Crest */}
          <div className="mb-7">
            <div className="hidden lg:inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-600/10 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-950/20">
              <Fingerprint className="w-6 h-6 text-amber-300" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Executive Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              Enter your enterprise operator credentials to access your luxury hospitality management console.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs flex items-start gap-2.5 backdrop-blur-md"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{error}</span>
              </motion.div>
            )}

            {/* Username or Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Username or Enterprise Email</span>
                <span className="text-[10px] text-slate-500 font-normal">Required</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. admin or gm@grandluxuryresort.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Secret Passphrase
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-11 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950"
                />
                <span className="font-medium text-slate-300">Remember session for 30 days</span>
              </label>
            </div>

            {/* Luxury Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative group w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:via-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/50 hover:shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all flex items-center justify-center space-x-2 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform" />

              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Sign In to HotelOS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>

            {/* Demo Quick Fill & First Login Option */}
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400">
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition font-medium text-[11px]"
                title="Populate test administrator credentials"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Fill Admin Demo Creds</span>
              </button>

              <Link
                to="/first-login"
                className="text-slate-400 hover:text-slate-200 transition-colors text-[11px] hover:underline"
              >
                First time employee onboarding?
              </Link>
            </div>
          </form>
        </div>

        {/* Security & Regulatory Footer */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>TLS 1.3 256-Bit</span>
            </span>
            <span>&bull;</span>
            <span>Zero-Trust FIPS 140-2</span>
            <span>&bull;</span>
            <span>PCI-DSS Level 1</span>
          </div>

          <p className="text-center text-[10px] text-slate-600 leading-normal">
            &copy; {new Date().getFullYear()} HotelOS Inc. All rights reserved. Enterprise Hospitality Operating System.
          </p>
        </div>
      </div>
    </div>
  );
};
