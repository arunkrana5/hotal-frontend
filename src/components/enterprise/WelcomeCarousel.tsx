import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

export interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

interface WelcomeCarouselProps {
  slides: BannerSlide[];
  autoPlayInterval?: number; // default 6000ms
  className?: string;
}

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({
  slides,
  autoPlayInterval = 6500,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay management
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleNext, isPaused, slides.length, autoPlayInterval]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Touch Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      role="region"
      aria-label="Hotel Operations Highlights & Announcements"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        'relative rounded-2xl overflow-hidden border border-brand-border dark:border-brand-darkBorder shadow-soft-sm group select-none focus:outline-none focus:ring-1 focus:ring-brand-primary',
        className
      )}
    >
      {/* Background Image Container */}
      <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden bg-slate-900">
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out scale-105 group-hover:scale-100"
          loading="lazy"
        />

        {/* Sophisticated Luxury Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Slide Content */}
        <div className="absolute inset-0 p-5 sm:p-6 md:p-8 flex flex-col justify-between max-w-2xl z-10">
          {/* Top Tag */}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-primary/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-soft-xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{currentSlide.badge || 'Executive Announcement'}</span>
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5 my-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
              {currentSlide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 font-medium line-clamp-2 max-w-xl leading-relaxed">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* CTA Link and Controls */}
          <div className="flex items-center space-x-3 pt-2">
            {currentSlide.ctaText && currentSlide.ctaLink && (
              <button
                type="button"
                onClick={() => navigate(currentSlide.ctaLink!)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-navy-950 hover:bg-slate-100 font-bold text-xs shadow-soft-xs transition-all flex items-center space-x-1.5 group/btn"
              >
                <span>{currentSlide.ctaText}</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-900 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
              title={isPaused ? 'Resume Carousel' : 'Pause Carousel'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (visible on hover) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous announcement slide"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next announcement slide"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Pagination Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center space-x-1.5 z-20">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'w-6 bg-white shadow-soft-xs'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
