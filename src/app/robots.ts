import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/site';

const DEFAULT_DISALLOW_PATHS = [
  '/admin/', 
  '/account/', 
  '/checkout/', 
  '/api/', 
  '/categorie-produit/', 
  '/produit/',
  '/*?filter_cat=',
  '/*?column=',
  '/*?per_page=',
  '/*?rating_filter=',
  '/*?stock_status=',
  '/*?featured=',
  '/*?best_seller=',
  '/*?add-to-cart='
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL;

  // Read robots settings from the database
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['ROBOTS_DISALLOW_PATHS', 'ROBOTS_CRAWL_DELAY'],
      },
    },
  });

  const settingsMap = settings.reduce(
    (acc, s) => ({ ...acc, [s.key]: s.value }),
    {} as Record<string, string>
  );

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
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowPaths,
      ...(crawlDelay && !isNaN(crawlDelay) ? { crawlDelay } : {}),
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
