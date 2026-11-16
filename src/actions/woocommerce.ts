'use server';

import prisma from '@/lib/prisma';
import { slugify, unescapeHtml } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { getTranslations } from 'next-intl/server';
import { fetchRemoteImage } from '@/lib/safeFetch';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper to upload an image from a URL to Cloudinary
 */
async function uploadImageFromUrlToCloudinary(imageUrl: string): Promise<string | null> {
  try {
    // SECURITY: image URLs come from a third-party store -> SSRF-safe download
    // (http(s) only, no private/metadata IPs, validated redirects, size cap, timeout).
    const { buffer } = await fetchRemoteImage(imageUrl);

    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'gamingbm/woocommerce-import' },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error(`Error downloading/uploading image ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Generates a unique slug
 */
async function generateUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Test WooCommerce API connection
 */
export type WcProductImportItemResult = {
  id: number;
  name: string;
  status: 'SUCCESS' | 'ALREADY_EXISTS' | 'FAILED';
  error?: string;
  image?: string | null;
  price?: string | number;
};

export interface ProcessWcProductsResult {
  importedCount: number;
  alreadyExistsCount: number;
  failedCount: number;
  items: WcProductImportItemResult[];
}

export async function testWooCommerceConnection(url: string, consumerKey: string, consumerSecret: string) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/system_status`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { success: false, message: `Connexion refusée : ${response.status} ${response.statusText}` };
    }

    return { success: true, message: 'Connexion réussie à l\'API WooCommerce !' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Impossible de joindre le serveur WooCommerce.' };
  }
}

/**
 * Fetch remote categories list with product count
 */
export async function fetchWooCommerceCategoriesList(url: string, consumerKey: string, consumerSecret: string) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products/categories`;

  try {
    let allCategories: Array<{ id: number; name: string; count: number; slug: string }> = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const response = await fetch(`${apiUrl}?per_page=100&page=${page}&hide_empty=false`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
      }

      const cats = await response.json();
      if (!Array.isArray(cats) || cats.length === 0) {
        hasMore = false;
      } else {
        cats.forEach((c: any) => {
          allCategories.push({
            id: c.id,
            name: unescapeHtml(c.name),
            count: c.count || 0,
            slug: c.slug
          });
        });
        page++;
      }
    }

    return { success: true, categories: allCategories };
  } catch (error: any) {
    console.error('Error fetching categories list:', error);
    return { success: false, message: error.message || 'Erreur lors de la récupération des catégories.' };
  }
}

/**
 * Fetch remote products list for individual selection (supports search & pagination)
 */
export async function fetchWooCommerceProductsList(
  url: string, 
  consumerKey: string, 
  consumerSecret: string, 
  search: string = '', 
  page: number = 1, 
  categoryFilter?: number
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  let apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=20&page=${page}`;
  
  if (search) {
    apiUrl += `&search=${encodeURIComponent(search)}`;
  }
  if (categoryFilter) {
    apiUrl += `&category=${categoryFilter}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const total = parseInt(response.headers.get('x-wp-total') || '0', 10);
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);

    const prods = await response.json();
    if (!Array.isArray(prods)) {
      return { success: true, products: [], total: 0, totalPages: 0 };
    }

    // Check which ones are already in local DB (comparing both decoded and raw titles)
    const rawTitles = prods.map(p => p.name);
    const decodedTitles = prods.map(p => unescapeHtml(p.name));
    const allTitlesToCheck = Array.from(new Set([...rawTitles, ...decodedTitles]));

    const existing = await prisma.product.findMany({
      where: { title: { in: allTitlesToCheck } },
      select: { title: true }
    });
    const existingTitles = new Set(existing.map(e => e.title));

    const products = prods.map((p: any) => {
      const decodedName = unescapeHtml(p.name);
      return {
        id: p.id,
        name: decodedName,
        price: p.price || p.regular_price || '0',
        image: (p.images && p.images[0]?.src) ? p.images[0].src : null,
        categories: (p.categories || []).map((c: any) => unescapeHtml(c.name)),
        alreadyImported: existingTitles.has(decodedName) || existingTitles.has(p.name)
      };
    });

    return { success: true, products, total, totalPages };
  } catch (error: any) {
    console.error('Error fetching products list:', error);
    return { success: false, message: error.message || 'Erreur lors de la récupération des produits.' };
  }
}

/**
 * Import categories from WooCommerce to create/update local category tree.
 * If categoryIds is provided, only those categories (and their parent hierarchy) are imported.
 */
export async function importWooCommerceCategories(
  url: string, 
  consumerKey: string, 
  consumerSecret: string,
  categoryIds?: number[]
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products/categories`;

  try {
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      const response = await fetch(`${apiUrl}?per_page=100&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce (Catégories): ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text().catch(() => 'Impossible de lire le corps de la réponse');
        console.error(`WooCommerce API HTML response: ${text.substring(0, 500)}...`);
        const t = await getTranslations('AdminCategories');
        throw new Error(t('woo_import_cat_html_error') + ` (Content-Type: ${contentType})`);
      }

      const cats = await response.json();
      if (cats.length === 0) {
        hasMore = false;
      } else {
        allCategories = [...allCategories, ...cats];
        page++;
      }
    }

    if (allCategories.length === 0) return { success: true, count: 0 };

    // If specific categoryIds were requested, filter down to only those categories and their ancestor hierarchy
    let categoriesToImport = allCategories;
    if (categoryIds && categoryIds.length > 0) {
      const selectedIdSet = new Set<number>(categoryIds);
      const catById = new Map<number, any>(allCategories.map(c => [c.id, c]));
      const neededIds = new Set<number>();

      // Traverse each selected category and include all its parents
      for (const id of categoryIds) {
        let curr = catById.get(id);
        while (curr) {
          neededIds.add(curr.id);
          if (curr.parent && curr.parent > 0) {
            curr = catById.get(curr.parent);
          } else {
            break;
          }
        }
      }

      categoriesToImport = allCategories.filter(c => neededIds.has(c.id));
    }

    if (categoriesToImport.length === 0) return { success: true, count: 0 };

    // 1st Pass: Create all filtered categories to get their UUIDs
    const wcIdToUuidMap: Record<number, string> = {};

    for (const wcCat of categoriesToImport) {
      let category = await prisma.category.findUnique({
        where: { name: unescapeHtml(wcCat.name) }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: unescapeHtml(wcCat.name),
            slug: wcCat.slug || slugify(unescapeHtml(wcCat.name)),
          }
        });
      }
      wcIdToUuidMap[wcCat.id] = category.id;
    }

    // 2nd Pass: Link parents
    for (const wcCat of categoriesToImport) {
      if (wcCat.parent && wcCat.parent > 0) {
        const parentUuid = wcIdToUuidMap[wcCat.parent];
        const childUuid = wcIdToUuidMap[wcCat.id];

        if (parentUuid && childUuid) {
          await prisma.category.update({
            where: { id: childUuid },
            data: { parentId: parentUuid }
          });
        }
      }
    }

    revalidatePath('/admin/categories');
    return { success: true, count: categoriesToImport.length };

  } catch (error: any) {
    console.error('Error importing categories from WooCommerce:', error);
    return { success: false, message: error.message || 'Une erreur est survenue lors de l\'importation des catégories.' };
  }
}

/**
 * Gets the total number of products to import (optionally filtered by categories)
 */
export async function countWooCommerceProducts(
  url: string, 
  consumerKey: string, 
  consumerSecret: string,
  categoryIds?: number[]
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  let apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=1`;

  if (categoryIds && categoryIds.length > 0) {
    apiUrl += `&category=${categoryIds.join(',')}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const totalStr = response.headers.get('x-wp-total');
    if (!totalStr) {
      return { success: false, message: "Impossible de déterminer le nombre total de produits (header x-wp-total manquant)." };
    }

    const total = parseInt(totalStr, 10);
    return { success: true, total };
  } catch (error: any) {
    console.error('Error counting WooCommerce products:', error);
    return { success: false, message: error.message || 'Une erreur inattendue est survenue.' };
  }
}

/**
 * Helper to process and import an array of WooCommerce product objects into Prisma
 */
async function processAndSaveWcProducts(
  products: any[], 
  apiUrl: string, 
  consumerKey: string, 
  consumerSecret: string,
  allowedCategoryIds?: number[]
): Promise<ProcessWcProductsResult> {
  let importedCount = 0;
  let alreadyExistsCount = 0;
  let failedCount = 0;
  const items: WcProductImportItemResult[] = [];

  const allowedSet = (allowedCategoryIds && allowedCategoryIds.length > 0) ? new Set(allowedCategoryIds) : null;

  for (const wcProduct of products) {
    const decodedTitle = unescapeHtml(wcProduct.name || '');
    const rawTitle = wcProduct.name || '';
    const imgUrl = (wcProduct.images && wcProduct.images[0]?.src) ? wcProduct.images[0].src : null;
    const priceVal = wcProduct.price || wcProduct.regular_price || '0';

    try {
      // 1. Check if product with same title or slug already exists on destination site
      const baseSlug = wcProduct.slug || slugify(decodedTitle);
      const existingProduct = await prisma.product.findFirst({
        where: { 
          OR: [
            { title: decodedTitle },
            { title: rawTitle },
            { slug: baseSlug }
          ]
        },
        select: { id: true, title: true }
      });

      if (existingProduct) {
        items.push({
          id: wcProduct.id,
          name: decodedTitle,
          status: 'ALREADY_EXISTS',
          image: imgUrl,
          price: priceVal
        });
        alreadyExistsCount++;
        continue; // Skip creating duplicate product
      }

      // 2. Process Categories
      const categoryIds: string[] = [];
      if (wcProduct.categories && Array.isArray(wcProduct.categories)) {
        for (const wcCat of wcProduct.categories) {
          if (allowedSet && !allowedSet.has(wcCat.id)) {
            continue;
          }

          let category = await prisma.category.findUnique({
            where: { name: unescapeHtml(wcCat.name) }
          });
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: unescapeHtml(wcCat.name),
                slug: wcCat.slug || slugify(unescapeHtml(wcCat.name)),
              }
            });
          }
          categoryIds.push(category.id);
        }
      }

      // 3. Process Brands
      let brandId: string | null = null;
      let brandName: string | null = null;
      let brandSlug: string | null = null;

      if (wcProduct.brands && Array.isArray(wcProduct.brands) && wcProduct.brands.length > 0) {
        brandName = wcProduct.brands[0].name;
        brandSlug = wcProduct.brands[0].slug;
      } else if (wcProduct.attributes && Array.isArray(wcProduct.attributes)) {
        const brandAttr = wcProduct.attributes.find((a: any) => 
          a.name.toLowerCase() === 'brand' || 
          a.name.toLowerCase() === 'marque' || 
          a.name.toLowerCase() === 'brands' || 
          a.name.toLowerCase() === 'marques'
        );
        if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
          brandName = brandAttr.options[0];
          brandSlug = brandName ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
        }
      }

      if (brandName && brandSlug) {
        let brand = await prisma.brand.findUnique({
          where: { name: unescapeHtml(brandName) }
        });
        if (!brand) {
          brand = await prisma.brand.create({
            data: {
              name: unescapeHtml(brandName),
              slug: brandSlug,
            }
          });
        }
        brandId = brand.id;
      }

      // 4. Process Images
      const cloudinaryImageUrls: string[] = [];
      if (wcProduct.images && Array.isArray(wcProduct.images)) {
        const uploadPromises = wcProduct.images.map(async (wcImg: any) => {
          if (!wcImg.src) return null;
          try {
            const secureUrl = await uploadImageFromUrlToCloudinary(wcImg.src);
            if (secureUrl) {
              await prisma.media.upsert({
                where: { url: secureUrl },
                update: {
                  title: wcImg.name || wcImg.title || null,
                  altText: wcImg.alt || null,
                },
                create: {
                  url: secureUrl,
                  title: wcImg.name || wcImg.title || null,
                  altText: wcImg.alt || null,
                }
              });
              return secureUrl;
            }
          } catch (uploadErr) {
            console.warn(`[WooCommerce Import] Image upload failed for ${wcImg.src}:`, uploadErr);
          }
          return null;
        });

        const results = await Promise.all(uploadPromises);
        results.forEach((url) => {
          if (url) cloudinaryImageUrls.push(url as string);
        });
      }

      const uniqueSlug = await generateUniqueSlug(baseSlug);
      const price = parseFloat(wcProduct.price || wcProduct.regular_price || '0');
      const compareAtPrice = parseFloat(wcProduct.regular_price || '0');

      let stock: number | null = null;
      if (wcProduct.manage_stock && wcProduct.stock_quantity !== null) {
        stock = parseInt(wcProduct.stock_quantity, 10);
      }

      // 5. Tags
      const tags: string[] = [];
      if (wcProduct.tags && Array.isArray(wcProduct.tags)) {
        wcProduct.tags.forEach((t: any) => {
          if (t && t.name) tags.push(t.name);
        });
      }

      // 6. Attributes
      let parsedAttributes: any[] = [];
      if (wcProduct.attributes && Array.isArray(wcProduct.attributes)) {
        parsedAttributes = wcProduct.attributes
          .filter((attr: any) => attr.variation)
          .map((attr: any) => ({
            name: attr.name,
            options: attr.options
          }));
      }

      // 7. Variations
      let parsedVariations: any[] = [];
      if (wcProduct.type === 'variable') {
        try {
          const varResponse = await fetch(`${apiUrl}/${wcProduct.id}/variations`, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });
          if (varResponse.ok) {
            const wcVariations = await varResponse.json();
            if (Array.isArray(wcVariations)) {
              parsedVariations = await Promise.all(wcVariations.map(async (wcVar: any) => {
                const attrMap: Record<string, string> = {};
                if (wcVar.attributes && Array.isArray(wcVar.attributes)) {
                  wcVar.attributes.forEach((a: any) => {
                    attrMap[a.name] = a.option;
                  });
                }

                let varImage = undefined;
                if (wcVar.image && wcVar.image.src) {
                  try {
                    const secureUrl = await uploadImageFromUrlToCloudinary(wcVar.image.src);
                    if (secureUrl) {
                      varImage = secureUrl;
                      await prisma.media.upsert({
                        where: { url: secureUrl },
                        update: {
                          title: wcVar.image.name || wcVar.image.title || null,
                          altText: wcVar.image.alt || null,
                        },
                        create: {
                          url: secureUrl,
                          title: wcVar.image.name || wcVar.image.title || null,
                          altText: wcVar.image.alt || null,
                        }
                      });
                    }
                  } catch (e) {
                    console.warn(`[WooCommerce Import] Variation image upload failed for var ${wcVar.id}:`, e);
                  }
                }

                return {
                  id: String(wcVar.id),
                  attributes: attrMap,
                  price: parseFloat(wcVar.price || wcVar.regular_price || '0'),
                  stock: (wcVar.manage_stock && wcVar.stock_quantity !== null) ? parseInt(wcVar.stock_quantity, 10) : null,
                  image: varImage
                };
              }));
            }
          }
        } catch (err) {
          console.error(`Failed to fetch variations for product ${wcProduct.id}`, err);
        }
      }

      // 8. Create Product in Prisma
      const createdProduct = await prisma.product.create({
        data: {
          title: decodedTitle,
          slug: uniqueSlug,
          description: wcProduct.description || '',
          shortDescription: wcProduct.short_description || '',
          price: price,
          compareAtPrice: (compareAtPrice > price) ? compareAtPrice : null,
          images: cloudinaryImageUrls,
          stock: stock,
          type: wcProduct.type === 'variable' ? 'VARIABLE' : 'SIMPLE',
          tags: {
            connectOrCreate: tags.map((t: string) => ({
              where: { name: t },
              create: { name: t, slug: slugify(t) }
            }))
          },
          brandId: brandId,
          attributes: parsedAttributes.length > 0 ? parsedAttributes : undefined,
          variations: parsedVariations.length > 0 ? parsedVariations : undefined,
          categories: {
            connect: categoryIds.map(id => ({ id }))
          }
        }
      });

      // 9. Import reviews
      try {
        const reviewsResponse = await fetch(`${apiUrl}/reviews?product=${wcProduct.id}`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });

        if (reviewsResponse.ok) {
          const wcReviews = await reviewsResponse.json();
          if (Array.isArray(wcReviews) && wcReviews.length > 0) {
            const reviewsToInsert = wcReviews
              .filter(r => r.status === 'approved')
              .map(r => ({
                productId: createdProduct.id,
                reviewerName: r.reviewer || null,
                reviewerEmail: r.reviewer_email || null,
                rating: r.rating || 5,
                comment: r.review ? r.review.replace(/(<([^>]+)>)/gi, "") : '',
                isApproved: true,
                createdAt: new Date(r.date_created)
              }));
            
            if (reviewsToInsert.length > 0) {
              await prisma.review.createMany({
                data: reviewsToInsert
              });
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch reviews for product ${wcProduct.id}`, err);
      }

      items.push({
        id: wcProduct.id,
        name: decodedTitle,
        status: 'SUCCESS',
        image: cloudinaryImageUrls[0] || imgUrl,
        price: price
      });
      importedCount++;

    } catch (productError: any) {
      console.error(`Error importing product ${wcProduct.id} (${decodedTitle}):`, productError);
      items.push({
        id: wcProduct.id,
        name: decodedTitle,
        status: 'FAILED',
        error: productError?.message || 'Erreur inattendue lors de l\'enregistrement',
        image: imgUrl,
        price: priceVal
      });
      failedCount++;
    }
  }

  return {
    importedCount,
    alreadyExistsCount,
    failedCount,
    items
  };
}

export async function importWooCommerceProductsBatch(
  url: string, 
  consumerKey: string, 
  consumerSecret: string, 
  page: number = 1, 
  perPage: number = 5,
  categoryIds?: number[]
) {
  await requireAdmin();

  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;

  try {
    let queryUrl = `${apiUrl}?per_page=${perPage}&page=${page}`;
    if (categoryIds && categoryIds.length > 0) {
      queryUrl += `&category=${categoryIds.join(',')}`;
    }

    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text().catch(() => 'Impossible de lire le corps de la réponse');
      console.error(`WooCommerce API HTML response (products): ${text.substring(0, 200)}...`);
      const t = await getTranslations('AdminProducts');
      throw new Error(t('woo_import_prod_html_error') + ` (Content-Type: ${contentType})`);
    }

    let products;
    try {
      products = await response.json();
    } catch (err) {
      const t = await getTranslations('AdminProducts');
      throw new Error(t('woo_import_parse_error'));
    }
    
    if (!Array.isArray(products) || products.length === 0) {
      return { success: true, count: 0, successCount: 0, alreadyExistsCount: 0, failedCount: 0, results: [] };
    }

    const batchResult = await processAndSaveWcProducts(products, apiUrl, consumerKey, consumerSecret, categoryIds);

    revalidatePath('/admin/products');
    revalidatePath('/');
    
    const { updateTag } = await import('next/cache');
    updateTag('products');
    updateTag('categories');

    return { 
      success: true, 
      count: batchResult.importedCount,
      successCount: batchResult.importedCount,
      alreadyExistsCount: batchResult.alreadyExistsCount,
      failedCount: batchResult.failedCount,
      results: batchResult.items
    };

  } catch (error: any) {
    console.error('Error importing batch from WooCommerce:', error);
    return { success: false, message: error.message || 'Une erreur inattendue est survenue.' };
  }
}

/**
 * Import specific product IDs directly
 */
export async function importWooCommerceSelectedProducts(
  url: string, 
  consumerKey: string, 
  consumerSecret: string, 
  productIds: number[]
) {
  await requireAdmin();

  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0, successCount: 0, alreadyExistsCount: 0, failedCount: 0, results: [] };
  }

  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;

  try {
    let totalImported = 0;
    let totalAlreadyExists = 0;
    let totalFailed = 0;
    const allResults: WcProductImportItemResult[] = [];

    // Chunk requests by 5 to respect Cloudinary & network timeout limits
    const chunkSize = 5;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const slice = productIds.slice(i, i + chunkSize);
      const queryUrl = `${apiUrl}?include=${slice.join(',')}&per_page=${chunkSize}`;

      const response = await fetch(queryUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      if (Array.isArray(products) && products.length > 0) {
        const batchResult = await processAndSaveWcProducts(products, apiUrl, consumerKey, consumerSecret);
        totalImported += batchResult.importedCount;
        totalAlreadyExists += batchResult.alreadyExistsCount;
        totalFailed += batchResult.failedCount;
        allResults.push(...batchResult.items);
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/');

    const { updateTag } = await import('next/cache');
    updateTag('products');
    updateTag('categories');

    return { 
      success: true, 
      count: totalImported,
      successCount: totalImported,
      alreadyExistsCount: totalAlreadyExists,
      failedCount: totalFailed,
      results: allResults
    };
  } catch (error: any) {
    console.error('Error importing specific products:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des produits sélectionnés.' };
  }
}
