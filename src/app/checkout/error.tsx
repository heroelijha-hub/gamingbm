'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CheckoutError] Caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bestellvorgang unterbrochen
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Ein unerwarteter Fehler ist aufgetreten. Ihre Daten wurden sicher aufbewahrt. Bitte versuchen Sie es erneut oder kehren Sie zum Warenkorb zurück.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors text-sm"
          >
            Erneut versuchen
          </button>
          <Link
            href="/cart"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors text-sm"
          >
            Zurück zum Warenkorb
          </Link>
        </div>
      </div>
    </div>
  );
}
