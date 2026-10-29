"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import NewsletterFooterForm from './NewsletterFooterForm';

type FooterProps = {
  supportPhone?: string;
  supportEmail?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerAddress1?: string;
  footerAddress2?: string;
  footerLocationsTitle?: string;
  footerNewsletterTitle?: string;
  footerNewsletterText?: string;
  footerNewsletterPlaceholder?: string;
  footerCallUsText?: string;
  footerCopyright?: string;
  footerSocialFacebook?: string;
  footerSocialTwitter?: string;
  footerSocialInstagram?: string;
  footerSocialLinkedin?: string;
  footerColumns?: Array<{ title: string, links: Array<{ label: string, url: string }> }>;
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
  contactSlug?: string;
};

export default function Footer({ 
  supportPhone = '+08 9229 8228', 
  supportEmail = 'info@gamingbm.com',
  footerBgColor = '#278a54',
  footerTextColor = '#ffffff',
  footerHeadingColor = '#ffffff',
  footerAddress1 = '17 Rue des Marronniers, 31240 L\'Union, FRANCE',
  footerAddress2 = '',
  footerLocationsTitle = 'Our Locations',
  footerNewsletterTitle = 'Unser Newsletter',
  footerNewsletterText = 'Erhalten Sie 20€ Rabatt, wenn Sie sich für unseren Newsletter anmelden!',
  footerNewsletterPlaceholder = 'Geben Sie Ihre Email ein',
  footerCallUsText = 'Call Us Now',
  footerCopyright = '© 2026 My Store. All rights reserved.',
  footerSocialFacebook = '#',
  footerSocialTwitter = '#',
  footerSocialInstagram = '#',
  footerSocialLinkedin = '#',
  footerColumns = [],
  categories = [],
  footerLogoImage = '',
  footerDescription = 'Unsere Verpflichtungen : Qualität : Produkte, die aufgrund ihrer Leistung und ihrer Übereinstimmung mit den Umweltstandards ausgewählt wurden. Ökologie : Nachhaltige und verantwortungsvolle Heizlösungen. Nähe : Ein Team, das auf Ihre Bedürfnisse hört und bereit ist, Sie bei Ihren Projekten zu beraten und zu begleiten. Service : Schnelle Lieferung und ein Kundenservice, der immer für Sie da ist.',
  footerShowAddress = true,
  footerShowEmail = true,
  footerShowPhone = true,
  footerPaymentAmex = true,
  footerPaymentApplePay = true,
  footerPaymentGooglePay = true,
  footerPaymentMastercard = true,
  footerPaymentVisa = true,
  footerPaymentOpay = true,
  contactSlug = 'contact'
}: FooterProps) {
  const t = useTranslations('Footer');

  return (
    <footer 
      className="font-sans pt-16 pb-12 relative" 
      style={{ backgroundColor: footerBgColor, color: footerTextColor }}
    >
      <div className="max-w-[1400px] mx-auto px-6 w-full">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Column 1: Info */}
          <div className="lg:col-span-1">
            <div className="mb-6 flex items-center">
              {footerLogoImage ? (
                <Image src={footerLogoImage} alt="Footer Logo" width={200} height={48} className="max-h-12 w-auto object-contain" />
              ) : (
                <>
                  <span className="text-orange-600 font-bold text-xl mr-2">🔥 TOP KAMIN</span>
                  <span className="text-xs uppercase opacity-70 tracking-widest mt-1">BRENNSTOFFE</span>
                </>
              )}
            </div>
            
            <p className="text-sm mb-8 leading-relaxed opacity-90">
              {footerDescription}
            </p>
            
            <div className="space-y-4 text-sm opacity-90">
              {footerShowAddress && footerAddress1 && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p>{footerAddress1}</p>
                </div>
              )}
              {footerShowEmail && supportEmail && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <p>{supportEmail}</p>
                </div>
              )}
              {footerShowPhone && supportPhone && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <p>{supportPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Footer Columns from Admin (Replaces Col 2 & 3) */}
          {footerColumns && footerColumns.length > 0 ? (
            footerColumns.map((col, idx) => (
              <div key={idx} className="lg:col-span-1">
                <h3 className="font-bold text-lg mb-6" style={{ color: footerHeadingColor }}>{col.title}</h3>
                <ul className="space-y-4 text-sm opacity-90">
                  {col.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href={link.url} className="hover:text-yellow-400 transition">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              {/* Column 2: Rechtliche Links (Fallback) */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-lg mb-6" style={{ color: footerHeadingColor }}>Rechtliche Links</h3>
                <ul className="space-y-4 text-sm opacity-90">
                  <li><Link href="/pages/agb" className="hover:text-yellow-400 transition">AGB</Link></li>
                  <li><Link href="/pages/about" className="hover:text-yellow-400 transition">Über uns</Link></li>
                  <li><Link href="/pages/impressum" className="hover:text-yellow-400 transition">Impressum</Link></li>
                  <li><Link href="/pages/shipping" className="hover:text-yellow-400 transition">Versandrichtlinien</Link></li>
                  <li><Link href="/pages/payment" className="hover:text-yellow-400 transition">Zahlungpolitik</Link></li>
                  <li><Link href="/pages/returns" className="hover:text-yellow-400 transition">Rückgabe- und Rückerstattungsrichtlinie</Link></li>
                  <li><Link href={`/${contactSlug}`} className="hover:text-yellow-400 transition">Kontakt</Link></li>
                </ul>
              </div>

              {/* Column 3: Kunde (Fallback) */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-lg mb-6" style={{ color: footerHeadingColor }}>Kunde</h3>
                <ul className="space-y-4 text-sm opacity-90">
                  <li><Link href="/account" className="hover:text-yellow-400 transition">Mein konto</Link></li>
                  <li><Link href="/cart" className="hover:text-yellow-400 transition">Warenkorb</Link></li>
                  <li><Link href="/account/orders" className="hover:text-yellow-400 transition">Meine Bestellungen</Link></li>
                  <li><Link href="/checkout" className="hover:text-yellow-400 transition">Checkout</Link></li>
                  <li><Link href="/compare" className="hover:text-yellow-400 transition">Vergleiche</Link></li>
                  <li><Link href="/wishlist" className="hover:text-yellow-400 transition">Wunschliste</Link></li>
                </ul>
              </div>
              {/* Column 4: Alle Kategorien (Fallback) */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-lg mb-6" style={{ color: footerHeadingColor }}>Alle Kategorien</h3>
                <ul className="space-y-4 text-sm uppercase opacity-90 tracking-wide">
                  {categories && categories.length > 0 ? (
                    categories.slice(0, 10).map((cat) => (
                      <li key={cat.id}>
                        <Link href={`/category/${cat.slug}`} className="hover:text-yellow-400 transition">
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="#" className="hover:text-yellow-400 transition">BRENNSTOFFE</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">HOLZPELLETS</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">KAMINBRIKETTS</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">Holzbriketts</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">BRENNHOLZ</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">Kaminholz</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">KAMINE &amp; ÖFEN</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">KAMINBAUSATZ</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">PELLETKESSEL</Link></li>
                      <li><Link href="#" className="hover:text-yellow-400 transition">HOLZHERD / KÜCHENHERD</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Column 5: Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="font-bold text-lg mb-6" style={{ color: footerHeadingColor }}>{footerNewsletterTitle}</h3>
            <p className="text-sm mb-6 leading-relaxed opacity-90">
              {footerNewsletterText}
            </p>
            <NewsletterFooterForm placeholder={footerNewsletterPlaceholder} />
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm opacity-90 mb-4 md:mb-0">
            {footerCopyright}
          </div>
          <div className="flex items-center space-x-2">
            {footerPaymentAmex && (
              <div className="bg-white px-2 py-1 rounded text-blue-800 font-bold text-xs uppercase shadow-sm">Amex</div>
            )}
            {footerPaymentApplePay && (
              <div className="bg-white px-2 py-1 rounded text-black font-bold text-xs shadow-sm">Pay</div>
            )}
            {footerPaymentGooglePay && (
              <div className="bg-white px-2 py-1 rounded text-gray-700 font-bold text-xs shadow-sm">G Pay</div>
            )}
            {footerPaymentMastercard && (
              <div className="bg-white px-2 py-1 rounded text-red-600 font-bold text-xs shadow-sm">Master</div>
            )}
            {footerPaymentOpay && (
              <div className="bg-white px-2 py-1 rounded text-blue-600 font-bold text-xs shadow-sm">OPay</div>
            )}
            {footerPaymentVisa && (
              <div className="bg-white px-2 py-1 rounded text-blue-900 font-bold text-xs uppercase shadow-sm">Visa</div>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
