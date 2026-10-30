'use client';

import React, { useState, useEffect } from 'react';

interface HeroBlockSliderProps {
  slide1: React.ReactNode;
  slide2: React.ReactNode;
  autoSlideInterval?: number;
}

export default function HeroBlockSlider({ slide1, slide2, autoSlideInterval = 5000 }: HeroBlockSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [slide1, slide2];

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === 0 ? 1 : 0));
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [autoSlideInterval, isPaused]);

  return (
    <div 
      className="relative w-full h-full min-h-[460px] rounded-lg overflow-hidden group/slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
              isCurrent 
                ? 'opacity-100 scale-100 pointer-events-auto z-10' 
                : 'opacity-0 scale-98 pointer-events-none z-0'
            }`}
          >
            {isCurrent && slide}
          </div>
        );
      })}

      {/* Dots navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentIndex(0);
          }}
          aria-label="Slide 1"
          className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            currentIndex === 0
              ? 'w-6 bg-[#fed700]'
              : 'w-2.5 bg-gray-400/80 hover:bg-gray-500'
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentIndex(1);
          }}
          aria-label="Slide 2"
          className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            currentIndex === 1
              ? 'w-6 bg-[#fed700]'
              : 'w-2.5 bg-gray-400/80 hover:bg-gray-500'
          }`}
        />
      </div>
    </div>
  );
}

