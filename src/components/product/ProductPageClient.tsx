'use client';

import { useState } from 'react';
import ProductGallery from './ProductGallery';
import ProductActions from './ProductActions';
import Link from 'next/link';
import Image from "next/image";

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-orange-600' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

interface ProductPageClientProps {
  product: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    discountLabel?: string | null;
    type: string;
    stock: number | null;
    images: string[];
    attributes?: { name: string; options: string[] }[];
    variations?: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> }[];
    brand?: { name: string; logo?: string | null } | null;
    categories?: { id: string; name: string }[];
    tags?: { name: string }[];
    reviews?: { rating: number }[];
    [key: string]: any;
  };
  enableBuyNow?: boolean;
  storeName?: string;
  translations?: {
    sku: string;
    categories: string;
    tags: string;
    sold: string;
    customer_reviews: string;
    uncategorized: string;
    brand: string;
  };
  shippingInfo?: string[];
  contactSlug?: string;
}

export default function ProductPageClient({ product, enableBuyNow = false, storeName = 'My Store', translations, shippingInfo, contactSlug = 'contact' }: ProductPageClientProps) {
  // L'image active de la galerie, pilotée par la variation sélectionnée
  const [variationImage, setVariationImage] = useState<string | null>(null);

  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length
    : 0;

  const t = translations;

  return (
    <>
      {/* Galerie — reçoit l'image de variation pour l'afficher en priorité */}
      <ProductGallery
        images={product.images}
        title={product.title}
        discountLabel={product.discountLabel}
        compareAtPrice={product.compareAtPrice}
        price={product.price}
        activeVariationImage={variationImage}
      />

      {/* Colonne droite : titre, marque, avis, actions, méta */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h1 className="text-3xl font-bold mb-4 leading-tight">{product.title}</h1>

        {/* Marque : logo seul si défini, nom seul sinon */}
        {product.brand && (
          <div className="flex items-center mb-4">
            {product.brand.logo ? (
              <Image width={800} height={800} src={product.brand.logo} alt={product.brand.name} className="h-10 object-contain rounded-sm" />
            ) : (
              <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{product.brand.name}</span>
            )}
          </div>
        )}

        {/* Avis & Vendus */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          {reviews.length > 0 && (
            <>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} filled={i <= Math.round(avgRating)} />)}
                </div>
                <span className="ml-1 text-gray-600">
                  {t?.customer_reviews ?? `${reviews.length} avis`}
                </span>
              </div>
              <span className="border-l border-gray-300 h-4"></span>
            </>
          )}
          <span>
            {t?.sold ?? 'Vendu'} <span className="font-semibold text-gray-900">24</span>
          </span>
        </div>

        {/* Actions — remonte l'image quand une variation est sélectionnée */}
        <ProductActions
          product={product as any}
          enableBuyNow={enableBuyNow}
          onVariationChange={(image: string | null) => setVariationImage(image)}
          shippingInfo={shippingInfo}
          contactSlug={contactSlug}
        />

        {/* Méta */}
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold text-gray-900">{t?.sku ?? 'SKU :'} </span>
            {product.id.split('-')[0].toUpperCase()}
          </p>
          <p>
            <span className="font-semibold text-gray-900">{t?.categories ?? 'Catégories :'} </span>
            {product.categories && product.categories.length > 0
              ? product.categories.map((c: any, index: number) => (
                  <span key={c.id}>
                    <Link href={`/product-category/${c.slug || c.id}`} className="hover:text-orange-600 hover:underline transition-colors">
                      {c.name}
                    </Link>
                    {index < product.categories!.length - 1 ? ', ' : ''}
                  </span>
                ))
              : (t?.uncategorized ?? 'Non catégorisé')}
          </p>
          {product.brand && !product.brand.logo && (
            <p><span className="font-semibold text-gray-900">{t?.brand ?? 'Marque :'} </span>{product.brand.name}</p>
          )}
          {product.tags && product.tags.length > 0 && (
            <p>
              <span className="font-semibold text-gray-900">{t?.tags ?? 'Tags :'} </span>
              {product.tags.map((tag: any, index: number) => (
                <span key={tag.id}>
                  <Link href={`/shop?tag=${tag.slug || tag.id}`} className="hover:text-orange-600 hover:underline transition-colors">
                    {tag.name}
                  </Link>
                  {index < product.tags!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
          {product.gtin && (
            <p>
              <span className="font-semibold text-gray-900">GTIN / EAN : </span>
              <span className="font-mono text-gray-600">{product.gtin}</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
