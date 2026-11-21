import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  AlertTriangle,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

interface SlideItem {
  id: string;
  image: string;
  title: string;
}

const CAROUSEL_SLIDES: SlideItem[] = [
  {
    id: 'atrium',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
    title: 'Luxury Reception & Atrium',
  },
  {
    id: 'suite',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
    title: 'The Presidential Sky Suite',
  },
  {
    id: 'resort',
    image:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85',
    title: 'Horizon Infinity & Dusk Terrace',
  },
  {
    id: 'dining',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=2000&q=85',
    title: 'Michelin Reserve & Fine Dining',
  },
];

// Carousel motion variants for seamless horizontal slide
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0.85,
  }),
};

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
  const [[slideIndex, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Preload carousel images on mount
  useEffect(() => {
    CAROUSEL_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Continuous smooth autoplay (7-second interval)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setSlide(([curr]) => [(curr + 1) % CAROUSEL_SLIDES.length, 1]);
    }, 7000);

    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused]);

  const paginate = (newDirection: number) => {
    setSlide(([curr]) => {
      const nextIndex = (curr + newDirection + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length;
      return [nextIndex, newDirection];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim()) {
      setError('Please provide your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
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
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setUsernameOrEmail('admin');
    setPassword('Admin@HotelOS2026!');
    setError(null);
  };

  const activeSlide = CAROUSEL_SLIDES[slideIndex];

  return (
    <div className="relative min-h-screen w-full flex bg-[#070b14] text-slate-100 overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* ========================================================================= */}
      {/* 1. LEFT CINEMATIC HOSPITALITY EXPERIENCE (~62% Desktop Width)              */}
      {/* ========================================================================= */}
      <div
        className="relative hidden lg:flex flex-[1.6] flex-col justify-between p-10 xl:p-14 2xl:p-16 overflow-hidden select-none bg-[#050811]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Continuous Horizontal Sliding Image Carousel */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 1.4 },
                opacity: { duration: 1.4 },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Cinematic Dark Gradient Overlays for High Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/70 via-transparent to-[#070b14]/90" />
        </div>

        {/* Top: One Brand Identity */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex items-center space-x-3"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/25 via-slate-900 to-amber-600/30 border border-amber-500/40 text-amber-300 shadow-xl shadow-amber-950/40 backdrop-blur-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif tracking-widest text-xl font-bold text-white drop-shadow">
              HOTEL OS
            </span>
          </div>
        </motion.div>

        {/* Bottom: One Short, Impactful Headline & Minimal Indicators */}
        <div className="relative z-10 space-y-4 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="space-y-2"
          >
            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-serif font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              Where Hospitality Meets Intelligence.
            </h1>
            <p className="text-sm text-slate-300 font-light tracking-wide">
              Enterprise PMS &amp; ERP Operations
            </p>
          </motion.div>

          {/* Minimal Slide Progress Indicator */}
          <div className="flex items-center space-x-2 pt-2">
            {CAROUSEL_SLIDES.map((slide, idx) => {
              const isActive = idx === slideIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setSlide([idx, idx > slideIndex ? 1 : -1])}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    isActive ? 'w-8 bg-amber-400' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={slide.title}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT COMPACT LUXURY LOGIN PANEL (~38% Desktop Width, Full on Mobile)   */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, x: 25 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        className="relative w-full lg:w-[420px] xl:w-[460px] 2xl:w-[500px] flex flex-col justify-between p-6 sm:p-10 xl:p-12 bg-[#080d19]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl z-20 overflow-y-auto"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-amber-500/[0.04] blur-3xl pointer-events-none" />

        {/* Top Spacer / Mobile Brand Bar */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base text-white tracking-wider">HOTEL OS</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="my-auto py-2">
          {/* Brand Mark + Welcome Heading */}
          <div className="mb-7">
            <div className="hidden lg:inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-600/10 border border-amber-500/30 text-amber-300 mb-4 shadow-lg shadow-amber-950/20">
              <Building2 className="w-5 h-5" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your enterprise credentials
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Notification */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1 font-medium">{error}</span>
              </motion.div>
            )}

            {/* Username/Email Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="space-y-1.5"
            >
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Username or Email
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="admin or user@hotelos.internal"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="w-full h-10.5 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
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
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10.5 pl-10 pr-10 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Remember Me */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex items-center justify-between pt-0.5"
            >
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950"
                />
                <span>Remember me</span>
              </label>

              {/* Discreet Demo Helper */}
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 inline-flex items-center gap-1 transition"
                title="Populate admin credentials"
              >
                <KeyRound className="w-3 h-3" />
                <span>Demo Admin</span>
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-1"
            >
              <button
                type="submit"
                disabled={isLoading}
                className="relative group w-full h-10.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/40 hover:shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </motion.div>
          </form>
        </div>

        {/* Footer: One Minimal Copyright */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} HotelOS Inc. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
