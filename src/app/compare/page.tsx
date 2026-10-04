import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Compare Products',
  description: 'Compare products',
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-lg w-full">
        <div className="text-6xl mb-4">⚖️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compare Products</h1>
        <p className="text-gray-600 mb-8">
          The compare feature is coming soon. Please check back later.
        </p>
        <Link 
          href="/shop" 
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
}
