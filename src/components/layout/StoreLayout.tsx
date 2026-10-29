'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CookieConsent from './CookieConsent';
import MaintenanceView from '@/components/maintenance/MaintenanceView';

type StoreLayoutProps = {
  children: React.ReactNode;
  settings: {
    announcement: string;
    logoImage: string;
    headerLogoHeight?: string;
    mobileLogoHeight?: string;
    supportPhone: string;
    supportEmail: string;
    menuLinks: Array<{ label: string, url: string }>;
    topBarLinks?: Array<{ label: string, icon: string, url: string }>;
    loginText?: string;
    myAccountText?: string;
    adminDashboardText?: string;
    footerBgColor: string;
    footerTextColor: string;
    footerHeadingColor?: string;
    footerAddress1: string;
    footerAddress2: string;
    footerLocationsTitle: string;
    footerNewsletterTitle: string;
    footerNewsletterText: string;
    footerNewsletterPlaceholder: string;
    footerCallUsText: string;
    footerCopyright: string;
    footerSocialFacebook: string;
    footerSocialTwitter: string;
    footerSocialInstagram: string;
    footerSocialLinkedin: string;
    footerColumns: Array<{ title: string, links: Array<{ label: string, url: string }> }>;
    categories?: Array<{ id: string, name: string, slug: string | null }>;
    footerLogoImage?: string;
    footerDescription?: string;
    footerShowAddress?: boolean;
    footerShowEmail?: boolean;
    footerShowPhone?: boolean;
    footerPaymentAmex?: boolean;
    footerPaymentApplePay?: boolean;
    footerPaymentGooglePay?: boolean;
    footerPaymentMastercard?: boolean;
    footerPaymentVisa?: boolean;
    footerPaymentOpay?: boolean;
    maintenanceMode?: boolean;
    maintenanceTitle?: string;
    maintenanceMessage?: string;
    maintenanceImage?: string;
    searchBorderColor?: string;
    searchPlaceholder?: string;
    searchBtnText?: string;
    searchBtnBgColor?: string;
    searchBtnTextColor?: string;
    showNew?: boolean;
    showHot?: boolean;
    showSale?: boolean;
    mobileAboutTitle?: string;
    mobileAboutDesc?: string;
    mobileMenuLinks?: Array<{ label: string, url: string }>;
    mobileContactAddress?: string;
    mobileContactPhone?: string;
    mobileContactEmail?: string;
    mobileContactWebsite?: string;
    mobileHeaderBorderColor?: string;
    allCategoriesBgColor?: string;
    allCategoriesTextColor?: string;
    contactSlug?: string;
  };
  userRole?: 'ADMIN' | 'CUSTOMER' | null;
};

export default function StoreLayout({ children, settings, userRole }: StoreLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const isPreview = pathname?.startsWith('/preview');

  if (isAdmin || isPreview) {
    return <>{children}</>;
  }

  if (settings.maintenanceMode) {
    return (
      <MaintenanceView 
        title={settings.maintenanceTitle || 'Site en maintenance'} 
        message={settings.maintenanceMessage || 'We are currently updating our store. Come back very soon!'} 
        image={settings.maintenanceImage} 
        logoImage={settings.logoImage} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        userRole={userRole}
        announcement={settings.announcement} 
        logoImage={settings.logoImage} 
        headerLogoHeight={settings.headerLogoHeight}
        mobileLogoHeight={settings.mobileLogoHeight}
        menuLinks={settings.menuLinks}
        topBarLinks={settings.topBarLinks}
        loginText={settings.loginText}
        myAccountText={settings.myAccountText}
        adminDashboardText={settings.adminDashboardText}
        categories={settings.categories}
        searchBorderColor={settings.searchBorderColor}
        searchPlaceholder={settings.searchPlaceholder}
        searchBtnText={settings.searchBtnText}
        searchBtnBgColor={settings.searchBtnBgColor}
        searchBtnTextColor={settings.searchBtnTextColor}
        showNew={settings.showNew}
        showHot={settings.showHot}
        showSale={settings.showSale}
        mobileAboutTitle={settings.mobileAboutTitle}
        mobileAboutDesc={settings.mobileAboutDesc}
        mobileMenuLinks={settings.mobileMenuLinks}
        mobileContactAddress={settings.mobileContactAddress}
        mobileContactPhone={settings.mobileContactPhone}
        mobileContactEmail={settings.mobileContactEmail}
        mobileContactWebsite={settings.mobileContactWebsite}
        mobileHeaderBorderColor={settings.mobileHeaderBorderColor}
        allCategoriesBgColor={settings.allCategoriesBgColor}
        allCategoriesTextColor={settings.allCategoriesTextColor}
      />
      <main className="flex-grow">
        {children}
      </main>
      <Footer 
        supportPhone={settings.supportPhone} 
        supportEmail={settings.supportEmail} 
        footerBgColor={settings.footerBgColor}
        footerTextColor={settings.footerTextColor}
        footerHeadingColor={settings.footerHeadingColor}
        footerAddress1={settings.footerAddress1}
        footerAddress2={settings.footerAddress2}
        footerLocationsTitle={settings.footerLocationsTitle}
        footerNewsletterTitle={settings.footerNewsletterTitle}
        footerNewsletterText={settings.footerNewsletterText}
        footerNewsletterPlaceholder={settings.footerNewsletterPlaceholder}
        footerCallUsText={settings.footerCallUsText}
        footerCopyright={settings.footerCopyright}
        footerSocialFacebook={settings.footerSocialFacebook}
        footerSocialTwitter={settings.footerSocialTwitter}
        footerSocialInstagram={settings.footerSocialInstagram}
        footerSocialLinkedin={settings.footerSocialLinkedin}
        footerColumns={settings.footerColumns}
        categories={settings.categories}
        footerLogoImage={settings.footerLogoImage}
        footerDescription={settings.footerDescription}
        footerShowAddress={settings.footerShowAddress}
        footerShowEmail={settings.footerShowEmail}
        footerShowPhone={settings.footerShowPhone}
        footerPaymentAmex={settings.footerPaymentAmex}
        footerPaymentApplePay={settings.footerPaymentApplePay}
        footerPaymentGooglePay={settings.footerPaymentGooglePay}
        footerPaymentMastercard={settings.footerPaymentMastercard}
        footerPaymentVisa={settings.footerPaymentVisa}
        footerPaymentOpay={settings.footerPaymentOpay}
        contactSlug={settings.contactSlug}
      />
      <CookieConsent />
    </div>
  );
}
