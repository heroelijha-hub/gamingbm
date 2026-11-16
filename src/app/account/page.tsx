import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LogoutLink from '@/components/auth/LogoutLink';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon Compte',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const t = await getTranslations('Account');

  // Get username from user metadata if it exists, otherwise use email
  const username = user.user_metadata?.username || user.email?.split('@')[0] || "Customer";

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100 h-full">
      <p className="text-gray-700 mb-6">
        {t.rich('hello', {
          username: username,
          str: (chunks) => <strong>{chunks}</strong>
        })}
        <LogoutLink />
        )
      </p>

      <p className="text-gray-700 leading-relaxed">
        {t.rich('dashboard_desc', {
          orders_link: (chunks) => (
            <Link href="/account/orders" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
              {chunks}
            </Link>
          ),
          addresses_link: (chunks) => (
            <Link href="/account/addresses" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
              {chunks}
            </Link>
          ),
          details_link: (chunks) => (
            <Link href="/account/details" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
              {chunks}
            </Link>
          )
        })}
      </p>
    </div>
  );
}
