'use client';

interface CloudinaryLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom Cloudinary Loader with Strict Width Bucketing (Quantization)
 * 
 * Limite drastiquement les transformations Cloudinary en regroupant toutes les résolutions
 * en 4 paliers fixes (384, 640, 1080, 1600) pour maximiser le taux de cache CDN et
 * préserver les 25 crédits mensuels gratuits du compte partagé (gamingbm + lenaonline).
 */
export default function cloudinaryLoader({
  src,
  width,
}: CloudinaryLoaderParams): string {
  // 1. Regrouper la largeur demandée en 4 paliers fixes
  let targetWidth = 1600;
  if (width <= 384) {
    targetWidth = 384;
  } else if (width <= 640) {
    targetWidth = 640;
  } else if (width <= 1080) {
    targetWidth = 1080;
  } else {
    targetWidth = 1600;
  }

  // 2. Si ce n'est pas une image Cloudinary (ex: asset local ou Unsplash), retourner src directement
  if (!src || !src.includes('res.cloudinary.com')) {
    return src;
  }

  // 3. Paramètres de transformation : format auto (WebP/AVIF), qualité optimisée, limite et largeur fixe
  const transform = `f_auto,q_auto:good,c_limit,w_${targetWidth}`;
  const uploadMarker = '/image/upload/';
  const uploadIndex = src.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    return src;
  }

  const prefix = src.slice(0, uploadIndex + uploadMarker.length);
  let rest = src.slice(uploadIndex + uploadMarker.length);

  // Élimine toute ancienne transformation déjà présente avant la version ou le dossier
  const parts = rest.split('/');
  if (parts.length > 1 && /^(?:[a-z]{1,2}_[a-zA-Z0-9_:-]+,?)+$/.test(parts[0])) {
    rest = parts.slice(1).join('/');
  }

  return `${prefix}${transform}/${rest}`;
}
