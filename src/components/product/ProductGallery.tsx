'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  title: string;
  discountLabel?: string | null;
  compareAtPrice?: number | null;
  price?: number;
  activeVariationImage?: string | null;
};

export default function ProductGallery({ images, title, discountLabel, compareAtPrice, price, activeVariationImage }: ProductGalleryProps) {
  const hasImages = images && images.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Quand une variation avec sa propre image est sélectionnée, revenir sur l'index 0
  // pour ne pas être «bloqué» sur une miniature non liée
  useEffect(() => {
    if (activeVariationImage) {
      setSelectedIndex(0);
    }
  }, [activeVariationImage]);

  // L'image principale : si une variation a sa propre image, on la priorise
  const mainImage = activeVariationImage || (hasImages ? images[selectedIndex] : null);

  return (
    <div className="w-full lg:w-1/2 flex gap-4 lg:self-start lg:sticky lg:top-8">
      {/* Thumbnails (Vertical) */}
      <div className="flex flex-col gap-3 w-20">
        <button 
          onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
          disabled={!hasImages || selectedIndex === 0}
          className="w-full py-1 border border-[#ff4500] rounded text-[#ff4500] hover:bg-[#ff4500]/10 flex justify-center disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        
        {hasImages ? (
          images.slice(0, 5).map((img, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedIndex(idx)}
              className={`border-2 rounded overflow-hidden cursor-pointer h-20 w-20 flex-shrink-0 transition-colors ${idx === selectedIndex ? 'border-[#ff4500]' : 'border-transparent hover:border-[#ff4500]/50'}`}
            >
              <Image width={800} height={800} src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
            </div>
          ))
        ) : (
          <div className="border-2 border-[#ff4500] rounded h-20 w-20 bg-gray-100 flex items-center justify-center text-2xl">🛍️</div>
        )}
        
        <button 
          onClick={() => setSelectedIndex(Math.min((images?.length || 1) - 1, selectedIndex + 1))}
          disabled={!hasImages || selectedIndex >= Math.min(4, images.length - 1)}
          className="w-full py-1 border border-[#ff4500] rounded text-[#ff4500] hover:bg-[#ff4500]/10 flex justify-center mt-auto disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 border border-gray-200 rounded-lg relative overflow-hidden flex items-center justify-center bg-white min-h-[400px]">
        {discountLabel && compareAtPrice && price && compareAtPrice > price && (
          <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
            {discountLabel}
          </span>
        )}
        {mainImage ? (
          <Image width={800} height={800} src={mainImage} alt={title} className="w-full h-full object-contain p-4 transition-opacity duration-300" />
        ) : (
          <div className="text-9xl text-gray-300">🛍️</div>
        )}
      </div>
    </div>
  );
}
