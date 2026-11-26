import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getCachedSettings } from '@/lib/cache';

const DEFAULT_DISALLOW_PATHS = [
  '/admin/',
  '/admin',
  '/account/',
  '/account',
  '/checkout/',
  '/checkout',
  '/cart/',
  '/cart',
  '/wishlist/',
  '/wishlist',
  '/compare/',
  '/compare',
  '/order-tracking/',
  '/order-tracking',
  '/search',
  '/search/',
  '/api/',
  '/api',
  '/*?*q=',
  '/*?*sort=',
  '/*?*page=',
  '/*?*minPrice=',
  '/*?*maxPrice=',
  '/*?*rating=',
  '/*?*brand=',
  '/*?*view=',
  '/*?*category=',
  '/*?filter_cat=',
  '/*?column=',
  '/*?per_page=',
  '/*?rating_filter=',
  '/*?stock_status=',
  '/*?featured=',
  '/*?best_seller=',
  '/*?add-to-cart=',
  '/*?min_price=',
  '/*?max_price='
];

// Aggressive commercial scraper bots that exhaust Serverless Fluid CPU
const BLOCKED_SCRAPERS = [
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'MJ12bot',
  'PetalBot',
  'Bytespider',
  'DataForSeoBot',
  'BLEXBot'
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL;

  // Anti-CPU & Anti-Egress: Use cached settings (0 DB hit)
  const settingsMap = await getCachedSettings();

  // Parse disallow paths from DB or use defaults
  let disallowPaths: string[] = DEFAULT_DISALLOW_PATHS;
  if (settingsMap['ROBOTS_DISALLOW_PATHS']) {
    try {
      disallowPaths = JSON.parse(settingsMap['ROBOTS_DISALLOW_PATHS']);
    } catch {
      disallowPaths = DEFAULT_DISALLOW_PATHS;
    }
  }

  // Parse crawl delay (optional)
  const crawlDelay = settingsMap['ROBOTS_CRAWL_DELAY']
    ? parseInt(settingsMap['ROBOTS_CRAWL_DELAY'], 10)
    : undefined;

  return {
    rules: [
      {
        userAgent: BLOCKED_SCRAPERS,
        disallow: ['/']
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
        ...(crawlDelay && !isNaN(crawlDelay) ? { crawlDelay } : {})
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
