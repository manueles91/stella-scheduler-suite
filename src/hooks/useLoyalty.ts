import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LoyaltyRewardTier {
  id: string;
  visits_required: number;
  reward_title: string;
  reward_description?: string;
  discount_percentage: number;
  is_free_service: boolean;
  is_active: boolean;
  display_order: number;
}

export interface CustomerLoyaltyProgress {
  id: string;
  customer_id: string;
  total_visits: number;
  qr_code_token: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

export interface LoyaltyVisit {
  id: string;
  customer_id: string;
  added_by_admin_id: string;
  visit_date: string;
  notes?: string;
  customer: {
    full_name: string;
    email: string;
  };
  admin: {
    full_name: string;
  };
}

export interface LoyaltyProgramConfig {
  id: string;
  program_name: string;
  description?: string;
  is_active: boolean;
}

export const useLoyalty = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loyaltyProgress, setLoyaltyProgress] = useState<CustomerLoyaltyProgress | null>(null);
  const [rewardTiers, setRewardTiers] = useState<LoyaltyRewardTier[]>([]);
  const [programConfig, setProgramConfig] = useState<LoyaltyProgramConfig | null>(null);

  // Fetch reward tiers
  const fetchRewardTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_reward_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setRewardTiers(data || []);
    } catch (error) {
      console.error('Error fetching reward tiers:', error);
      toast.error('Error cargando niveles de recompensa');
    }
  };

  // Fetch program config
  const fetchProgramConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_program_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProgramConfig(data);
    } catch (error) {
      console.error('Error fetching program config:', error);
    }
  };

  // Fetch or create customer loyalty progress
  const fetchCustomerProgress = async (customerId?: string) => {
    if (!customerId && !user?.id) return;
    
    const targetCustomerId = customerId || user?.id;
    
    try {
      setLoading(true);
      
      // First try to get existing progress
      const { data: existingProgress, error: fetchError } = await supabase
        .from('customer_loyalty_progress')
        .select(`
          *,
          customer:profiles!customer_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('customer_id', targetCustomerId)
        .single();

      if (existingProgress && !fetchError) {
        setLoyaltyProgress(existingProgress);
        return existingProgress;
      }

        // If no progress exists and it's for current user, create it
        if (!customerId && user?.id) {
          const { data: newProgress, error: createError } = await supabase
            .from('customer_loyalty_progress')
            .insert({
              customer_id: user.id,
              total_visits: 0,
              qr_code_token: '' // Will be replaced by trigger
            })
            .select(`
              *,
              customer:profiles!customer_id (
                id,
                full_name,
                email,  
                phone
              )
            `)
            .single();

        if (createError) throw createError;
        setLoyaltyProgress(newProgress);
        return newProgress;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching customer progress:', error);
      toast.error('Error cargando progreso de lealtad');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add visit to customer
  const addVisitToCustomer = async (customerId: string, notes?: string) => {
    if (!user?.id) {
      toast.error('Debes estar autenticado');
      return false;
    }

    try {
      setLoading(true);

      // First find the customer progress
      const { data: customerProgress, error: findError } = await supabase
        .from('customer_loyalty_progress')
        .select('customer_id, total_visits')
        .eq('customer_id', customerId)
        .single();

      if (findError || !customerProgress) {
        toast.error('Cliente no encontrado en el programa de lealtad');
        return false;
      }

      // Add the visit
      const { error: visitError } = await supabase
        .from('loyalty_visits')
        .insert({
          customer_id: customerProgress.customer_id,
          added_by_admin_id: user.id,
          notes
        });

      if (visitError) throw visitError;

      // Update total visits count
      const { error: updateError } = await supabase
        .from('customer_loyalty_progress')
        .update({
          total_visits: customerProgress.total_visits + 1
        })
        .eq('customer_id', customerProgress.customer_id);

      if (updateError) throw updateError;

      toast.success('¡Visita agregada exitosamente!');
      return true;
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Error agregando visita');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Find customer by ID for verification
  const findCustomerByQR = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_loyalty_progress')
        .select(`
          *,
          customer:profiles!customer_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('customer_id', customerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      return null;
    }
  };

  // Get available rewards for customer's visit count
  const getAvailableRewards = (totalVisits: number) => {
    return rewardTiers.filter(tier => totalVisits >= tier.visits_required);
  };

  // Get next reward tier
  const getNextReward = (totalVisits: number) => {
    return rewardTiers.find(tier => totalVisits < tier.visits_required);
  };

  useEffect(() => {
    fetchRewardTiers();
    fetchProgramConfig();
    
    if (user?.id) {
      fetchCustomerProgress();
    }
  }, [user?.id]);

  return {
    loading,
    loyaltyProgress,
    rewardTiers,
    programConfig,
    fetchCustomerProgress,
    addVisitToCustomer,
    findCustomerByQR,
    getAvailableRewards,
    getNextReward,
    refetchProgress: () => fetchCustomerProgress()
  };
};