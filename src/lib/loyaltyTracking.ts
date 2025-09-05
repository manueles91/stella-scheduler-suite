import { supabase } from '@/integrations/supabase/client';

// Global callback for refreshing loyalty progress
let refreshLoyaltyProgress: (() => void) | null = null;

export const setRefreshLoyaltyProgress = (callback: () => void) => {
  refreshLoyaltyProgress = callback;
};

/**
 * Automatically track a loyalty visit when a booking is completed
 * This function should be called whenever a reservation or combo reservation status changes to 'completed'
 */
export const trackLoyaltyVisit = async (
  customerId: string, 
  adminId?: string, 
  notes?: string
): Promise<boolean> => {
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
        added_by_admin_id: adminId || null,
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

    // Refresh loyalty progress in UI
    if (refreshLoyaltyProgress) {
      refreshLoyaltyProgress();
    }

    return true;
  } catch (error) {
    console.error('Error tracking loyalty visit:', error);
    return false;
  }
};

/**
 * Track loyalty visit for guest users (invited_users)
 */
export const trackGuestLoyaltyVisit = async (
  guestUserId: string,
  customerEmail: string,
  customerName: string,
  adminId?: string,
  notes?: string
): Promise<boolean> => {
  try {
    // For guest users, we'll use their email as a unique identifier
    // First check if they already have loyalty progress
    const { data: existingProgress, error: findError } = await supabase
      .from('customer_loyalty_progress')
      .select('customer_id, total_visits')
      .eq('customer_id', guestUserId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding guest loyalty progress:', findError);
      return false;
    }

    // If no progress exists, create it
    let progress = existingProgress;
    if (!progress) {
      const { data: newProgress, error: createError } = await supabase
        .from('customer_loyalty_progress')
        .insert({
          customer_id: guestUserId,
          total_visits: 0
        })
        .select('customer_id, total_visits')
        .single();

      if (createError) {
        console.error('Error creating guest loyalty progress:', createError);
        return false;
      }
      progress = newProgress;
    }

    // Add the visit
    const { error: visitError } = await supabase
      .from('loyalty_visits')
      .insert({
        customer_id: progress.customer_id,
        added_by_admin_id: adminId || null,
        notes: notes || `Visita automática por reserva completada - ${customerName} (${customerEmail})`
      });

    if (visitError) {
      console.error('Error adding guest visit:', visitError);
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
      console.error('Error updating guest visit count:', updateError);
      return false;
    }

    // Refresh loyalty progress in UI
    if (refreshLoyaltyProgress) {
      refreshLoyaltyProgress();
    }

    return true;
  } catch (error) {
    console.error('Error tracking guest loyalty visit:', error);
    return false;
  }
};
