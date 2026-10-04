import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Tracking',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
