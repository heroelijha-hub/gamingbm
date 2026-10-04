'use client';

import React from 'react';
import Image from "next/image";

type MaintenanceViewProps = {
  title: string;
  message: string;
  image?: string;
  logoImage?: string;
};

export default function MaintenanceView({ title, message, image, logoImage }: MaintenanceViewProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Header simple avec le logo */}
      <header className="w-full bg-white border-b border-gray-200 py-6 px-8 flex justify-center">
        {logoImage ? (
          <Image width={800} height={800} src={logoImage} alt="Logo" className="h-20 sm:h-28 object-contain scale-150" />
        ) : (
          <span className="text-3xl font-extrabold tracking-tight text-gray-900">LOGO</span>
        )}
      </header>
      
      {/* Contenu principal */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-2xl shadow-xl text-center border border-gray-100">
          {image && (
            <Image width={800} height={800} src={image} 
              alt="Maintenance" 
              className="mx-auto h-48 md:h-64 object-contain mb-8 rounded-lg" />
          )}
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
            <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            {message}
          </p>
          
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Refresh page
            </button>
          </div>
        </div>
      </main>
      
      <footer className="w-full text-center py-6 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Top Kaminbrennstoffe. All rights reserved.
      </footer>
    </div>
  );
}
