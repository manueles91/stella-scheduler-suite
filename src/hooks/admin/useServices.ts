import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/components/admin/quick-access/types';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices
  };
};
