import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  landing_background_url: string | null;
  pwa_icon_url: string | null;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_hours: Record<string, string>;
  google_maps_link: string;
  testimonials: Array<{
    id: number;
    name: string;
    text: string;
    rating: number;
    service: string;
  }>;
  hero_title: string;
  hero_subtitle: string;
  updated_at?: string;
}

export const useSiteSettings = () => {
  const { data, isLoading, refetch } = useQuery<SiteSettings | null>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (!data || !data[0]) return null;
      
      const rawData = data[0];
      
      // Transform the raw data to match our interface
      return {
        id: rawData.id,
        logo_url: rawData.logo_url,
        landing_background_url: rawData.landing_background_url,
        pwa_icon_url: (rawData as any).pwa_icon_url || null,
        business_name: rawData.business_name || 'Salón de Belleza',
        business_address: rawData.business_address || 'Dirección del Salón',
        business_phone: rawData.business_phone || '+506 1234-5678',
        business_email: rawData.business_email || 'info@salon.com',
        business_hours: (rawData.business_hours as Record<string, string>) || {
          lunes: '9:00 AM - 6:00 PM',
          martes: '9:00 AM - 6:00 PM',
          miércoles: '9:00 AM - 6:00 PM',
          jueves: '9:00 AM - 6:00 PM',
          viernes: '9:00 AM - 6:00 PM',
          sábado: '9:00 AM - 4:00 PM',
          domingo: 'Cerrado'
        },
        google_maps_link: rawData.google_maps_link || 'https://maps.google.com',
        testimonials: (rawData.testimonials as Array<{
          id: number;
          name: string;
          text: string;
          rating: number;
          service: string;
        }>) || [],
        hero_title: rawData.hero_title || 'Bienvenida a tu Salón de Belleza',
        hero_subtitle: rawData.hero_subtitle || 'Descubre la experiencia de belleza más completa con nuestros tratamientos profesionales',
        updated_at: rawData.updated_at
      } as SiteSettings;
    },
  });

  return { settings: data, isLoading, refetch };
};
