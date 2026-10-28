import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";
import CurrencyProvider from "@/components/CurrencyProvider";
import { defaultCurrencyOptions } from "@/lib/formatPrice";
import DeferredWidgets from "@/components/layout/DeferredWidgets";
import StoreLayout from "@/components/layout/StoreLayout";
import ThemeProvider from "@/components/layout/ThemeProvider";
import GoogleAnalytics from '@/components/layout/GoogleAnalytics';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { Toaster } from 'react-hot-toast';
import { getCachedSettings, getCachedCategoriesTree, getCachedProductCounts } from '@/lib/cache';
import { safeJsonLd } from '@/lib/security';
import { SITE_URL } from '@/lib/site';
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

export async function generateMetadata(): Promise<Metadata> {
  const settingsDb = await prisma.setting.findMany({
    where: { key: { in: ['FAVICON_IMAGE', 'HOME_META_TITLE', 'HOME_META_DESCRIPTION', 'HEADER_LOGO_IMAGE', 'GOOGLE_SITE_VERIFICATION'] } }
  });
  
  const settingsMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  const faviconUrl = settingsMap['FAVICON_IMAGE'];
  const title = settingsMap['HOME_META_TITLE'] || `${storeName} | E-commerce`;
  const description = settingsMap['HOME_META_DESCRIPTION'] || "Découvrez notre vaste sélection de produits de haute qualité sur notre boutique en ligne complète.";
  const ogImage = settingsMap['HEADER_LOGO_IMAGE'] || '/logo.jpg';

  const baseUrl = SITE_URL;

  return {
    metadataBase: new URL(baseUrl),
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: baseUrl,
      siteName: storeName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${storeName} preview`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
    },
    icons: faviconUrl ? {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl
    } : undefined,
    verification: settingsMap['GOOGLE_SITE_VERIFICATION'] ? {
      google: settingsMap['GOOGLE_SITE_VERIFICATION']
    } : undefined
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const locale = await getLocale();
  
  let userRole: 'ADMIN' | 'CUSTOMER' | null = null;
  
  const settingsMap = await getCachedSettings();
  
  const currencyOptions = {
    currencySymbol: settingsMap.currencySymbol || defaultCurrencyOptions.currencySymbol,
    currencyPosition: (settingsMap.currencyPosition as any) || defaultCurrencyOptions.currencyPosition,
    thousandSeparator: settingsMap.thousandSeparator !== undefined ? settingsMap.thousandSeparator : defaultCurrencyOptions.thousandSeparator,
    decimalSeparator: settingsMap.decimalSeparator || defaultCurrencyOptions.decimalSeparator,
    taxIncludedInPrice: settingsMap.TAX_INCLUDED_IN_PRICE === 'true',
    defaultVatRate: Number(settingsMap.DEFAULT_VAT_RATE) || 20,
  };
  const contactSlug = settingsMap.CONTACT_SLUG || 'contact';
  const defaultMenuLinks = [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    { label: 'Blog', url: '/blog' },
    { label: 'Contact Us', url: `/${contactSlug}` },
  ];

  let menuLinks = defaultMenuLinks;
  try {
    if (settingsMap.HEADER_MENU_LINKS) {
      menuLinks = JSON.parse(settingsMap.HEADER_MENU_LINKS);
    }
  } catch (e) {
    console.error("Erreur parsing HEADER_MENU_LINKS", e);
  }
  
  const defaultFooterColumns = [
    { title: 'Contact Us', links: [{ label: 'About Us', url: '#' }, { label: 'Contact Us', url: '#' }] },
    { title: 'Account', links: [{ label: 'Shop', url: '#' }, { label: 'Checkout', url: '#' }] }
  ];
  let footerColumns = defaultFooterColumns;
  try {
    if (settingsMap.FOOTER_COLUMNS) {
      footerColumns = JSON.parse(settingsMap.FOOTER_COLUMNS);
    }
  } catch (e) {}

  const defaultTopBarLinks = [
    { label: 'Store Locator', icon: 'location', url: '/store-locator' },
    { label: 'Order Tracking', icon: 'truck', url: '/order-tracking' },
  ];
  let topBarLinks = defaultTopBarLinks;
  try {
    if (settingsMap.TOP_BAR_LINKS) {
      topBarLinks = JSON.parse(settingsMap.TOP_BAR_LINKS);
    }
  } catch (e) {}

  const { newCount: newProductsCount, hotCount: hotProductsCount, saleCount: saleProductsCount } = await getCachedProductCounts();

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "My Store";

  const storeSettings = {
    announcement: settingsMap.HEADER_ANNOUNCEMENT || `Welcome to ${storeName}`,
    logoImage: settingsMap.HEADER_LOGO_IMAGE || '/logo.png',
    supportPhone: settingsMap.FOOTER_SUPPORT_PHONE ?? settingsMap.HEADER_SUPPORT_PHONE ?? '+08 9229 8228',
    supportEmail: settingsMap.FOOTER_SUPPORT_EMAIL ?? settingsMap.HEADER_SUPPORT_EMAIL ?? 'support@mystore.com',
    menuLinks: menuLinks,
    topBarLinks: topBarLinks,
    loginText: settingsMap.LOGIN_TEXT,
    myAccountText: settingsMap.MY_ACCOUNT_TEXT,
    adminDashboardText: settingsMap.ADMIN_DASHBOARD_TEXT,
    topBarBgColor: settingsMap.TOP_BAR_BG_COLOR || '#ffffff',
    topBarTextColor: settingsMap.TOP_BAR_TEXT_COLOR || '#4b5563',
    footerBgColor: settingsMap.FOOTER_BG_COLOR || '#0B162C',
    footerTextColor: settingsMap.FOOTER_TEXT_COLOR || '#d1d5db',
    footerAddress1: settingsMap.FOOTER_ADDRESS_1 ?? '2972 Westheimer Rd. Illinois 85486',
    footerAddress2: settingsMap.FOOTER_ADDRESS_2 ?? '17 Princess Road, London, Greater London NW1 8JR, UK',
    footerLocationsTitle: settingsMap.FOOTER_LOCATIONS_TITLE || 'Our Locations',
    footerNewsletterTitle: settingsMap.FOOTER_NEWSLETTER_TITLE || 'Newsletter',
    footerNewsletterText: settingsMap.FOOTER_NEWSLETTER_TEXT || 'Get 15% off your first purchase! Plus, be the first to know about sales new product launches and exclusive offers!',
    footerNewsletterPlaceholder: settingsMap.FOOTER_NEWSLETTER_PLACEHOLDER || 'Enter your email...',
    footerCallUsText: settingsMap.FOOTER_CALL_US_TEXT || 'Call Us Now',
    footerCopyright: settingsMap.FOOTER_COPYRIGHT || `© 2026 ${storeName}. All rights reserved.`,
    footerSocialFacebook: settingsMap.FOOTER_SOCIAL_FACEBOOK || '#',
    footerSocialTwitter: settingsMap.FOOTER_SOCIAL_TWITTER || '#',
    footerSocialInstagram: settingsMap.FOOTER_SOCIAL_INSTAGRAM || '#',
    footerSocialLinkedin: settingsMap.FOOTER_SOCIAL_LINKEDIN || '#',
    footerColumns: footerColumns,
    footerLogoImage: settingsMap.FOOTER_LOGO_IMAGE || '',
    footerDescription: settingsMap.FOOTER_DESCRIPTION || 'Unsere Verpflichtungen : Qualität : Produkte, die aufgrund ihrer Leistung und ihrer Übereinstimmung mit den Umweltstandards ausgewählt wurden. Ökologie : Nachhaltige und verantwortungsvolle Heizlösungen. Nähe : Ein Team, das auf Ihre Bedürfnisse hört und bereit ist, Sie bei Ihren Projekten zu beraten und zu begleiten. Service : Schnelle Lieferung und ein Kundenservice, der immer für Sie da ist.',
    footerShowAddress: settingsMap.FOOTER_SHOW_ADDRESS !== 'false',
    footerShowEmail: settingsMap.FOOTER_SHOW_EMAIL !== 'false',
    footerShowPhone: settingsMap.FOOTER_SHOW_PHONE !== 'false',
    footerPaymentAmex: settingsMap.FOOTER_PAYMENT_AMEX !== 'false',
    footerPaymentApplePay: settingsMap.FOOTER_PAYMENT_APPLE_PAY !== 'false',
    footerPaymentGooglePay: settingsMap.FOOTER_PAYMENT_GOOGLE_PAY !== 'false',
    footerPaymentMastercard: settingsMap.FOOTER_PAYMENT_MASTERCARD !== 'false',
    footerPaymentVisa: settingsMap.FOOTER_PAYMENT_VISA !== 'false',
    footerPaymentOpay: settingsMap.FOOTER_PAYMENT_OPAY !== 'false',
    categories: await getCachedCategoriesTree(),
    maintenanceMode: settingsMap.MAINTENANCE_MODE === 'true',
    maintenanceTitle: settingsMap.MAINTENANCE_TITLE || 'Under Maintenance',
    maintenanceMessage: settingsMap.MAINTENANCE_MESSAGE || 'We are currently updating our store. Come back very soon!',
    maintenanceImage: settingsMap.MAINTENANCE_IMAGE || '',
    searchBorderColor: settingsMap.SEARCH_BORDER_COLOR || '#d1d5db',
    searchPlaceholder: settingsMap.SEARCH_PLACEHOLDER || 'Search products...',
    searchBtnText: settingsMap.SEARCH_BTN_TEXT || 'Search',
    searchBtnBgColor: settingsMap.SEARCH_BTN_BG_COLOR || '#c2410c',
    searchBtnTextColor: settingsMap.SEARCH_BTN_TEXT_COLOR || '#111827',
    showNew: newProductsCount > 0,
    showHot: hotProductsCount >= 3,
    showSale: saleProductsCount > 0,
    mobileAboutTitle: settingsMap.MOBILE_ABOUT_TITLE || 'About Us',
    mobileAboutDesc: settingsMap.MOBILE_ABOUT_DESC || 'We are a store passionate about quality and excellence.',
    mobileMenuLinks: (() => {
      try {
        return settingsMap.MOBILE_MENU_LINKS ? JSON.parse(settingsMap.MOBILE_MENU_LINKS) : defaultMenuLinks;
      } catch {
        return defaultMenuLinks;
      }
    })(),
    mobileContactAddress: settingsMap.MOBILE_CONTACT_ADDRESS ?? '123 Main Street',
    mobileContactPhone: settingsMap.MOBILE_CONTACT_PHONE ?? '+1 234 567 89',
    mobileContactEmail: settingsMap.MOBILE_CONTACT_EMAIL ?? 'contact@mystore.com',
    mobileContactWebsite: settingsMap.MOBILE_CONTACT_WEBSITE ?? 'www.mystore.com',
    mobileHeaderBorderColor: settingsMap.MOBILE_HEADER_BORDER_COLOR || '#d1d5db',
    allCategoriesBgColor: settingsMap.ALL_CATEGORIES_BG_COLOR || '#111827', // text-gray-900 by default
    allCategoriesTextColor: settingsMap.ALL_CATEGORIES_TEXT_COLOR || '#ffffff', // text-white
    contactSlug: contactSlug,
  };

  const rawFont = settingsMap.GLOBAL_FONT_FAMILY || 'Inter';
  const globalFont = /^[A-Za-z0-9 \-]{1,50}$/.test(rawFont) ? rawFont : 'Inter';
  const fontUrl = `https://fonts.googleapis.com/css2?family=${globalFont.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${storeName} - Blog RSS`} href="/rss.xml" />
        {globalFont !== 'Inter' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={fontUrl} rel="stylesheet" />
            <style>{`
              :root {
                --font-inter: '${globalFont}', sans-serif;
              }
              body, .font-sans {
                font-family: '${globalFont}', sans-serif !important;
              }
            `}</style>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": storeName,
              "image": settingsMap.HEADER_LOGO_IMAGE || '/logo.jpg',
              "url": SITE_URL,
              "telephone": settingsMap.FOOTER_SUPPORT_PHONE ?? settingsMap.HEADER_SUPPORT_PHONE,
              "email": settingsMap.FOOTER_SUPPORT_EMAIL ?? settingsMap.HEADER_SUPPORT_EMAIL,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": settingsMap.FOOTER_ADDRESS_1 || '',
                "addressCountry": settingsMap.STORE_COUNTRY || "DE",
                "addressLocality": "Langenhagen"
              },
              "description": "Ihr zuverlässiger Partner für Kaminholz, Holzpellets und Holzbriketts."
            })
          }}
        />
        <ThemeProvider themeColor={settingsMap.THEME_COLOR || '#c2410c'} />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PostHogProvider>
            <CurrencyProvider options={currencyOptions}>
              <StoreLayout settings={storeSettings} userRole={userRole}>
                <Toaster position="bottom-right" />
                {children}
                <DeferredWidgets 
                  chatEnabled={settingsMap.CHAT_ENABLED !== 'false'} 
                  chatStoreName={settingsMap.CHAT_STORE_NAME || 'Support'} 
                  chatStoreIcon={settingsMap.CHAT_STORE_ICON || ''} 
                />
              </StoreLayout>
            </CurrencyProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={settingsMap.GOOGLE_ANALYTICS_ID} />
      </body>
    </html>
  );
}
