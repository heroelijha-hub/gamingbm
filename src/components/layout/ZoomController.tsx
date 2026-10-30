'use client';

import { useEffect } from 'react';

export default function ZoomController() {
  useEffect(() => {
    // Fonction qui ajuste le zoom CSS selon le zoom navigateur
    const adjustZoom = () => {
      // Détection du zoom navigateur :
      // window.outerWidth / window.innerWidth donne le ratio de zoom navigateur dans la plupart des navigateurs modernes
      let browserZoom = 1;
      if (window.outerWidth && window.innerWidth) {
        browserZoom = window.outerWidth / window.innerWidth;
      }

      // Tolérance pour les arrondis (ex: 0.98 à 1.02 est considéré comme ~100%)
      const isOver100 = browserZoom > 1.05;
      const isUnder90 = browserZoom < 0.88;

      const root = document.documentElement;

      if (isOver100 || isUnder90) {
        // L'utilisateur zoome activement (> 100% ou < 90%) :
        // On respecte son zoom sans forcer le 90%
        root.style.removeProperty('zoom');
      } else {
        // Zoom par défaut / standard (~100%) :
        // On applique le zoom global du site à 90% (0.9)
        root.style.zoom = '0.9';
      }
    };

    adjustZoom();

    window.addEventListener('resize', adjustZoom);

    // Écoute également les changements de devicePixelRatio
    let mql: MediaQueryList | null = null;
    const handleDpiChange = () => {
      adjustZoom();
      setupDpiListener();
    };

    const setupDpiListener = () => {
      if (mql) {
        mql.removeEventListener('change', handleDpiChange);
      }
      mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mql.addEventListener('change', handleDpiChange);
    };

    setupDpiListener();

    return () => {
      window.removeEventListener('resize', adjustZoom);
      if (mql) {
        mql.removeEventListener('change', handleDpiChange);
      }
    };
  }, []);

  return null;
}

