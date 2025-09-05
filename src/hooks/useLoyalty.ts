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
              total_visits: 0
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

  // Add visit to customer (automated when booking is completed)
  const addVisitToCustomer = async (customerId: string, notes?: string, adminId?: string) => {
    try {
      // First find or create the customer progress
      const { data: customerProgress, error: findError } = await supabase
        .from('customer_loyalty_progress')
        .select('customer_id, total_visits')
        .eq('customer_id', customerId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding customer progress:', findError);
        return false;
      }

      // If no progress exists, create it
      let progress = customerProgress;
      if (!progress) {
        const { data: newProgress, error: createError } = await supabase
          .from('customer_loyalty_progress')
          .insert({
            customer_id: customerId,
            total_visits: 0
          })
          .select('customer_id, total_visits')
          .single();

        if (createError) {
          console.error('Error creating customer progress:', createError);
          return false;
        }
        progress = newProgress;
      }

      // Add the visit
      const { error: visitError } = await supabase
        .from('loyalty_visits')
        .insert({
          customer_id: progress.customer_id,
          added_by_admin_id: adminId || user?.id || null,
          notes: notes || 'Visita automática por reserva completada'
        });

      if (visitError) {
        console.error('Error adding visit:', visitError);
        return false;
      }

      // Update total visits count
      const { error: updateError } = await supabase
        .from('customer_loyalty_progress')
        .update({
          total_visits: progress.total_visits + 1
        })
        .eq('customer_id', progress.customer_id);

      if (updateError) {
        console.error('Error updating visit count:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding visit:', error);
      return false;
    }
  };

  // Find customer by ID for verification
  const findCustomerById = async (customerId: string) => {
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
    findCustomerById,
    getAvailableRewards,
    getNextReward,
    refetchProgress: () => fetchCustomerProgress()
  };
};