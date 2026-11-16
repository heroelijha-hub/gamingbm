import { getSettings } from '@/actions/settings';
import CheckoutClient from './CheckoutClient';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commande & Paiement sécurisé',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  
  // Send to the client ONLY the necessary settings, for security reasons
  const paymentSettings = {
    ENABLE_STRIPE: settings.ENABLE_STRIPE !== undefined ? settings.ENABLE_STRIPE : 'true',
    ENABLE_PAYPAL: settings.ENABLE_PAYPAL !== undefined ? settings.ENABLE_PAYPAL : 'true',
    ENABLE_BANK_TRANSFER: settings.ENABLE_BANK_TRANSFER !== undefined ? settings.ENABLE_BANK_TRANSFER : 'true',
    BANK_TRANSFER_CHECKOUT_MESSAGE: settings.BANK_TRANSFER_CHECKOUT_MESSAGE || '',
  };

  const zones = await prisma.shippingZone.findMany({
    where: { isActive: true },
    include: { methods: { where: { isActive: true } } }
  });

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center">Laden...</div>}>
      <CheckoutClient settings={paymentSettings} zones={zones} />
    </Suspense>
  );
}
