import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invitedUserSchema, InvitedUserData } from "@/lib/validation/userSchemas";
import { getErrorMessage } from "@/lib/utils/errorHandling";

export const useInvitedUsers = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Check in profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profileData) return true;

      // Check in invited_users table
      const { data: invitedData } = await supabase
        .from('invited_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .is('claimed_at', null)
        .maybeSingle();

      return !!invitedData;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };

  const createInvitedUser = async (userData: InvitedUserData): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Validate data
      const validatedData = invitedUserSchema.parse(userData);

      // Check if email already exists
      const emailExists = await checkEmailExists(validatedData.email);
      if (emailExists) {
        toast({
          title: "Error",
          description: "Ya existe un usuario con este email",
          variant: "destructive"
        });
        return false;
      }

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast({
          title: "Error",
          description: "No estás autenticado",
          variant: "destructive"
        });
        return false;
      }

      // Create invited user
      const { error } = await supabase
        .from('invited_users')
        .insert({
          email: validatedData.email,
          full_name: validatedData.full_name,
          phone: validatedData.phone || null,
          role: validatedData.role,
          account_status: 'invited',
          invited_by: currentUser.id
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario invitado creado correctamente. Podrán reclamar su cuenta al registrarse.",
        duration: 5000
      });

      return true;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createGuestCustomerForBooking = async (userData: { full_name: string; email: string; phone?: string }) => {
    try {
      // Validate basic data
      if (!userData.full_name.trim() || !userData.email.trim()) {
        throw new Error("Nombre y email son requeridos");
      }

      // Check if this email is already registered
      const emailExists = await checkEmailExists(userData.email);
      if (emailExists) {
        // Return existing user data if found
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          return {
            id: existingProfile.id,
            full_name: existingProfile.full_name,
            email: existingProfile.email,
            phone: existingProfile.phone,
            role: existingProfile.role,
            account_status: existingProfile.account_status,
            created_at: existingProfile.created_at,
            isExisting: true
          };
        }
      }

      // Create guest customer data for booking
      return {
        id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        full_name: userData.full_name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone?.trim() || undefined,
        role: 'client' as const,
        account_status: 'guest',
        created_at: new Date().toISOString(),
        isExisting: false
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    loading,
    createInvitedUser,
    createGuestCustomerForBooking,
    checkEmailExists
  };
};