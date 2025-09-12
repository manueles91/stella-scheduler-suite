import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/components/admin/quick-access/types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');
        
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
