"use client";

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered successfully with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('PWA Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, []);

  return null;
}
