import { supabase } from "@/integrations/supabase/client";
import { Service, Combo, Discount, Employee } from "@/types/booking";

export class ApiError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiService = {
  services: {
    async getAll(): Promise<Service[]> {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_categories (
            id,
            name,
            display_order
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new ApiError('Failed to fetch services', error);
      }

      return data || [];
    }
  },

  combos: {
    async getActive(): Promise<Combo[]> {
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
              image_url
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', nowISO)
        .gte('end_date', nowISO)
        .order('name');

      if (error) {
        throw new ApiError('Failed to fetch combos', error);
      }

      return data || [];
    }
  },

  discounts: {
    async getActive(): Promise<Discount[]> {
      const now = new Date();
      const nowISO = now.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', nowISO)
        .gte('end_date', nowISO)
        .order('created_at', { ascending: false });

      if (error) {
        throw new ApiError('Failed to fetch discounts', error);
      }

      return data || [];
    }
  },

  employees: {
    async getAll(): Promise<Employee[]> {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          employee_services (
            service_id
          )
        `)
        .in('role', ['employee', 'admin'])
        .order('full_name');

      if (error) {
        throw new ApiError('Failed to fetch employees', error);
      }

      return data || [];
    }
  },

  categories: {
    async getActive(): Promise<any[]> {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) {
        throw new ApiError('Failed to fetch categories', error);
      }

      return data || [];
    }
  },

  reservations: {
    async getByDate(date: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (error) {
        throw new ApiError('Failed to fetch reservations', error);
      }

      return data || [];
    }
  }
};