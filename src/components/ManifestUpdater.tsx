import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const ManifestUpdater = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.pwa_icon_url) {
      // Update manifest with custom icon
      const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (link) {
        // Create a new manifest object with the custom icon
        const manifest = {
          name: settings.business_name || "Stella Studio",
          short_name: settings.business_name || "Stella Studio", 
          description: `Sistema de reservas para ${settings.business_name || "Stella Studio"} - Salón de belleza y spa`,
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#8b5a2b",
          orientation: "portrait",
          categories: ["lifestyle", "beauty", "health"],
          lang: "es",
          icons: [
            {
              src: settings.pwa_icon_url,
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: settings.pwa_icon_url,
              sizes: "512x512", 
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        };

        // Create a blob URL for the dynamic manifest
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        
        // Update the manifest link
        link.href = manifestUrl;
      }
    }
  }, [settings]);

  return null;
};