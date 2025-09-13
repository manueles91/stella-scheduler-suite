import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Combo } from '@/components/admin/quick-access/types';

export const useCombos = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      const nowISO = now.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('combos')
        .select(`
          *,
          combo_services (
            service_id,
            quantity,
            services (
              id,
              name,
              description,
              duration_minutes,
              price_cents,
              image_url,
              is_active,
              created_at
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', nowISO)
        .gte('end_date', nowISO)
        .order('name');
      
      if (error) throw error;
      setCombos(data || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      setError('Error al cargar combos');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    combos,
    loading,
    error,
    fetchCombos
  };
};
