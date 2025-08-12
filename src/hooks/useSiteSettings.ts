import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  landing_background_url: string | null;
  updated_at?: string;
}

export const useSiteSettings = () => {
  const { data, isLoading, refetch } = useQuery<SiteSettings | null>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, logo_url, landing_background_url, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return (data && data[0]) || null;
    },
  });

  return { settings: data, isLoading, refetch };
};
