'use client';
import Image from 'next/image';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/wishlist/WishlistDrawer'), { ssr: false });
import { searchProducts } from '@/actions/public';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), { ssr: false });
const MobileSearchOverlay = dynamic(() => import('@/components/layout/MobileSearchOverlay'), { ssr: false });
const NotificationBell = dynamic(() => import('@/components/layout/NotificationBell'), { ssr: false });
import { useTranslations } from 'next-intl';
import Price from '@/components/Price';
import { getUserRole } from '@/actions/auth';

type HeaderProps = {
  announcement?: string;
  logoImage?: string;
  headerLogoHeight?: string;
  mobileLogoHeight?: string;
  menuLinks?: Array<{ label: string, url: string }>;
  topBarLinks?: Array<{ label: string, icon: string, url: string }>;
  loginText?: string;
  myAccountText?: string;
  adminDashboardText?: string;
  topBarBgColor?: string;
  topBarTextColor?: string;
  categories?: Array<{ id: string, name: string, slug: string | null, parentId?: string | null }>;
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
  userRole?: 'ADMIN' | 'CUSTOMER' | null;
};

export default function Header({ 
  announcement = 'Welcome to My Store', 
  logoImage = '',
  headerLogoHeight = '80',
  mobileLogoHeight = '64',
  menuLinks = [],
  topBarLinks = [
    { label: 'Store Locator', icon: 'location', url: '/store-locator' },
    { label: 'Order Tracking', icon: 'truck', url: '/order-tracking' }
  ],
  loginText,
  myAccountText,
  adminDashboardText,
  topBarBgColor = '#ffffff',
  topBarTextColor = '#4b5563',
  categories = [],
  searchBorderColor = '#d1d5db',
  searchPlaceholder = 'Search products...',
  searchBtnText = 'Search',
  searchBtnBgColor = '#c2410c',
  searchBtnTextColor = '#111827',
  showNew = true,
  showHot = true,
  showSale = true,
  mobileAboutTitle = '',
  mobileAboutDesc = '',
  mobileMenuLinks = [],
  mobileContactAddress = '',
  mobileContactPhone = '',
  mobileContactEmail = '',
  mobileContactWebsite = '',
  mobileHeaderBorderColor = '#d1d5db',
  allCategoriesBgColor = '#111827',
  allCategoriesTextColor = '#ffffff',
  userRole = null,
}: HeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  
  const cartItems = cartStore.getTotalItems();
  const cartTotal = cartStore.getTotalPrice();
  const wishlistItems = wishlistStore.items.length;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const [actualUserRole, setActualUserRole] = useState<'ADMIN' | 'CUSTOMER' | null>(userRole);
  
  useEffect(() => {
    // Always check if we need to fetch userRole
    getUserRole().then(role => {
      setActualUserRole(role as 'ADMIN' | 'CUSTOMER' | null);
    });
  }, []);
  
  const t = useTranslations('Header');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Helper to render icons
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'location':
        return <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      case 'truck':
        return <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
      case 'phone':
        return <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
      case 'mail':
        return <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case 'star':
      default:
        return <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    }
  };

  // Bottom categories dropdown
  const [isBottomCategoryOpen, setIsBottomCategoryOpen] = useState(false);
  const bottomCategoryRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setIsCategoryDropdownOpen(false);
      }
      if (bottomCategoryRef.current && !bottomCategoryRef.current.contains(event.target as Node)) {
        setIsBottomCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Close mobile menu on resize to desktop
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        setShowSearchResults(true);
        try {
          const results = await searchProducts(searchQuery, selectedCategory, 5);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory !== 'all') {
      setShowSearchResults(false);
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Hydration mismatch preventer for cart/wishlist icons
  if (!mounted) {
    // Return early or provide a skeleton if needed. Here we just let it mount without numbers first.
  }

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .mobile-header-border {
            border-bottom-color: ${mobileHeaderBorderColor} !important;
          }
          .custom-logo-height {
            height: ${mobileLogoHeight}px !important;
          }
        }
        @media (min-width: 1024px) {
          .custom-logo-height {
            height: ${headerLogoHeight}px !important;
          }
        }
      `}</style>
      <header className="mobile-header-border w-full bg-white border-b border-gray-300 lg:border-gray-200 shadow-sm lg:shadow-none font-sans relative z-50">
      {/* Top Bar */}
      <div 
        className="hidden md:flex justify-between items-center px-4 py-2.5 text-xs border-b border-gray-200 max-w-7xl mx-auto w-full transition-colors text-gray-600"
        style={{ backgroundColor: topBarBgColor, color: topBarTextColor }}
      >
        <div className="flex items-center space-x-2">
          <span>{announcement || ''}</span>
        </div>
        <div className="flex items-center space-x-6 text-xs">
          {topBarLinks && topBarLinks.length > 0 && (
            <div className="hidden lg:flex items-center space-x-5">
              {topBarLinks.map((link, idx) => (
                <Link 
                  key={idx} 
                  href={link.url} 
                  className="flex items-center hover:opacity-75 transition font-medium"
                >
                  {renderIcon(link.icon)}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Bar: Logo, Search, User, Wishlist, Cart */}
      <div className="py-4 px-4 max-w-7xl mx-auto w-full flex flex-nowrap items-center justify-between gap-4 md:gap-8 lg:gap-10">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="flex items-center">
            {logoImage ? (
              <Image 
                src={logoImage} 
                alt="BM GAMING Logo" 
                width={260} 
                height={75} 
                className="object-contain custom-logo-height w-auto max-w-[220px] md:max-w-[280px]" 
                priority 
              />
            ) : (
              <span className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 flex items-center">
                <span className="text-[#f5be00] font-black mr-1">BM</span>GAMING
              </span>
            )}
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 w-full max-w-2xl flex-col relative" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center w-full rounded-md border border-gray-300 bg-white h-11 relative z-20 focus-within:border-gray-400 shadow-sm">
            <input 
              type="text" 
              placeholder={searchPlaceholder || t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.length > 1) setShowSearchResults(true); }}
              className="flex-1 px-4 h-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
            />
            
            <button 
              type="submit" 
              aria-label="Search"
              className="bg-[#fed700] hover:bg-[#eab308] text-gray-900 w-12 h-full flex items-center justify-center transition-colors rounded-r-md cursor-pointer flex-shrink-0"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md z-50 overflow-hidden">
              {isSearching && searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">{t('searching')}</div>
              ) : searchResults.length > 0 ? (
                <div>
                  <ul className="max-h-80 overflow-y-auto py-2">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <Link 
                          href={`/product/${product.slug}`} 
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center px-4 py-2.5 hover:bg-yellow-50 transition border-b border-gray-100 last:border-0"
                        >
                          <div className="w-10 h-10 flex-shrink-0 bg-gray-50 rounded overflow-hidden mr-3">
                            {product.images && product.images.length > 0 ? (
                              <Image width={100} height={100} src={product.images[0]} alt={product.title} className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{product.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Price amount={product.price} showTax={false} className="text-red-600 font-bold text-sm" />
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <Price amount={product.compareAtPrice} showTax={false} className="text-gray-400 line-through text-xs" />
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 bg-white">
                  {t('no_results')} &quot;<span className="font-semibold">{searchQuery}</span>&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Icons: User, Wishlist, Red Cart */}
        <div className="flex items-center flex-shrink-0 space-x-3 md:space-x-4">
          {/* User Account Icon */}
          <button 
            onClick={() => {
              if (actualUserRole) {
                router.push(actualUserRole === 'ADMIN' ? '/admin' : '/account');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-md border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 transition"
            title="Account"
            aria-label="Account"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* Wishlist Button */}
          <button 
            onClick={() => wishlistStore.setIsOpen(true)}
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-md border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 transition relative"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {mounted && wishlistItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#fed700] text-gray-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {wishlistItems}
              </span>
            )}
          </button>

          {/* Red Cart Box with Yellow Badge */}
          <div 
            onClick={() => cartStore.setIsOpen(true)}
            className="relative flex items-center bg-[#e01b1b] hover:bg-[#cb1515] text-white rounded-md px-4 py-2.5 cursor-pointer transition shadow-sm h-11 select-none"
          >
            {/* Yellow Counter Bubble */}
            <span className="absolute -top-2.5 left-5 bg-[#fed700] text-gray-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {mounted ? cartItems : 0}
            </span>

            {/* Trash/Bag icon */}
            <div className="mr-3 flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                viewBox="0 0 64 64" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Anses du panier en diagonale */}
                <path d="M18 10 L30 24" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M46 10 L34 24" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Rebord supérieur arrondi du panier */}
                <rect x="6" y="22" width="52" height="7" rx="3.5" fill="currentColor" />
                
                {/* Corps trapézoïdal du panier */}
                <path 
                  d="M10 29 L15 54 C15.4 56.2 17.3 58 19.5 58 L44.5 58 C46.7 58 48.6 56.2 49 54 L54 29 Z" 
                  fill="currentColor" 
                />
                
                {/* Les 5 fentes verticales blanches caractéristiques */}
                <rect x="18" y="34" width="3.5" height="18" rx="1.75" fill="#e01b1b" />
                <rect x="25" y="34" width="3.5" height="18" rx="1.75" fill="#e01b1b" />
                <rect x="32" y="34" width="3.5" height="18" rx="1.75" fill="#e01b1b" />
                <rect x="39" y="34" width="3.5" height="18" rx="1.75" fill="#e01b1b" />
                <rect x="46" y="34" width="3.5" height="18" rx="1.75" fill="#e01b1b" />
              </svg>
            </div>

            {/* Price & Caret */}
            <div className="flex items-center space-x-1 font-bold text-sm md:text-base">
              <span>{mounted ? <Price amount={cartTotal} showTax={false} /> : <Price amount={0} showTax={false} />}</span>
              <svg className="w-3.5 h-3.5 ml-1 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
            className="lg:hidden p-2 text-gray-700 hover:text-gray-900 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Yellow Navigation Bar (Bottom Bar) */}
      <div className="hidden lg:block bg-[#fed700] w-full shadow-inner">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between h-12">
          
          <nav className="flex items-center space-x-1 font-extrabold text-[13px] tracking-wide text-gray-900 uppercase">
            {menuLinks && menuLinks.length > 0 ? (
              menuLinks.map((link, idx) => (
                <div key={idx} className="relative group">
                  <Link 
                    href={link.url} 
                    className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black"
                  >
                    <span>{link.label}</span>
                  </Link>
                </div>
              ))
            ) : (
              <>
                <Link href="/" className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black">
                  <span>HOME</span>
                </Link>
                <div className="relative group" ref={bottomCategoryRef}>
                  <button 
                    onClick={() => setIsBottomCategoryOpen(!isBottomCategoryOpen)}
                    className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black uppercase cursor-pointer"
                  >
                    <span>CATALOG</span>
                  </button>
                  {isBottomCategoryOpen && (
                    <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 shadow-xl rounded-md z-40 py-2 normal-case font-normal">
                      {categories.map((cat) => (
                        <Link 
                          key={cat.id} 
                          href={`/product-category/${cat.slug || cat.id}`}
                          className={`block px-6 py-2 hover:bg-yellow-50 hover:text-gray-900 transition ${!cat.parentId ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                          onClick={() => setIsBottomCategoryOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/shop" className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black">
                  <span>FEATURED PRODUCTS</span>
                </Link>
                <Link href="/shop" className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black">
                  <span>PRODUCT PAGES</span>
                </Link>
                <Link href="/shop" className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black">
                  <span>PAGES</span>
                </Link>
                <Link href="/pages/faq" className="flex items-center px-4 py-3 hover:bg-black/5 rounded transition font-black">
                  <span>FAQ PAGE</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>



      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <CartDrawer 
        isOpen={cartStore.isOpen}
        onClose={() => cartStore.setIsOpen(false)}
      />

      <WishlistDrawer 
        isOpen={wishlistStore.isOpen}
        onClose={() => wishlistStore.setIsOpen(false)}
      />

      <MobileBottomNav 
        onSearchClick={() => setIsMobileSearchOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />

      <MobileSearchOverlay 
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        placeholder={searchPlaceholder}
      />

      <MobileSidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        logoImage={logoImage}
        logoHeight={mobileLogoHeight}
        aboutTitle={mobileAboutTitle}
        aboutDesc={mobileAboutDesc}
        menuLinks={mobileMenuLinks}
        contactAddress={mobileContactAddress}
        contactPhone={mobileContactPhone}
        contactEmail={mobileContactEmail}
        contactWebsite={mobileContactWebsite}
        categories={categories}
      />
    </header>
    </>
  );
}
