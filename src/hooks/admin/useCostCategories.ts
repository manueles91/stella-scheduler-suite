import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CostCategory } from '@/components/admin/quick-access/types';

export const useCostCategories = () => {
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCostCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('cost_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      setCostCategories(data || []);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
      setError('Error al cargar categorías de costos');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    costCategories,
    loading,
    error,
    fetchCostCategories
  };
};
