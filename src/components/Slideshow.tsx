import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SLIDES = [
  {
    id: 1,
    url: '/src/assets/images/slide_mpls_1_2026_1783871138970.jpg',
    title: 'Masa Pengenalan Lingkungan Sekolah yang Ramah',
    subtitle: 'Membentuk Karakter Unggul & Berakhlak Mulia',
    badge: 'MPLS Ramah 2026',
    accentColor: '#D4AF37'
  },
  {
    id: 2,
    url: '/src/assets/images/slide_mpls_2_1783870650293.jpg',
    title: 'Disiplin, Berprestasi, Bebas Bullying & Narkoba',
    subtitle: 'Menciptakan Sekolah yang Aman, Nyaman, dan Inklusif',
    badge: 'Karakter Positif',
    accentColor: '#E5A93B'
  },
  {
    id: 3,
    url: '/src/assets/images/slide_mpls_3_1783870666127.jpg',
    title: 'Ayo Kembali ke Sekolah dengan Semangat Baru!',
    subtitle: 'Tahun Ajaran Baru 2026/2027 - Raih Cita-Cita Bersama',
    badge: 'Tahun Ajaran Baru',
    accentColor: '#F7B600'
  }
];

export function Slideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    stopTimer();
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [currentIndex, isPlaying]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div 
      id="mpls-slideshow-container"
      className="relative overflow-hidden rounded-3xl border border-[#D6D6C2] bg-[#0C2B64] shadow-lg group aspect-[16/7] md:aspect-[16/6] w-full"
    >
      {/* Background slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Main Image */}
          <img
            src={SLIDES[currentIndex].url}
            alt={SLIDES[currentIndex].title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90 transition-all duration-700"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#051126]/90 via-[#0C2B64]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#051126]/85 via-transparent to-[#051126]/40" />

          {/* Floating Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white flex flex-col justify-end h-full z-10 pointer-events-none">
            <div className="max-w-2xl space-y-2 md:space-y-3 pointer-events-auto">
              <motion.span 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase border"
                style={{ 
                  borderColor: `${SLIDES[currentIndex].accentColor}50`, 
                  color: SLIDES[currentIndex].accentColor,
                  backgroundColor: `${SLIDES[currentIndex].accentColor}12`
                }}
              >
                {SLIDES[currentIndex].badge}
              </motion.span>
              
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-serif font-black tracking-tight leading-tight"
              >
                {SLIDES[currentIndex].title}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs md:text-sm text-[#E5E5D8] font-medium max-w-xl line-clamp-2 md:line-clamp-none"
              >
                {SLIDES[currentIndex].subtitle}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        id="prev-slide-btn"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[#0C2B64]/80 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-xs cursor-pointer z-20 border border-white/10 hover:scale-105"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        id="next-slide-btn"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[#0C2B64]/80 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-xs cursor-pointer z-20 border border-white/10 hover:scale-105"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Controls Bar */}
      <div className="absolute bottom-4 right-6 flex items-center gap-3 z-20 bg-black/35 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-xs">
        {/* Play/Pause Button */}
        <button
          id="toggle-slide-play"
          onClick={togglePlay}
          className="text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Play className="w-3 h-3 md:w-3.5 md:h-3.5" />}
        </button>

        <div className="w-[1px] h-3 bg-white/20" />

        {/* Dots */}
        <div className="flex gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              id={`slide-dot-${idx}`}
              onClick={() => handleDotClick(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
