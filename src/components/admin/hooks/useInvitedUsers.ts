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

      // Fetch the invite token to build a shareable link (defaults ensure it's created)
      const { data: inviteRow } = await supabase
        .from('invited_users')
        .select('invite_token')
        .eq('email', validatedData.email.toLowerCase())
        .order('invited_at', { ascending: false })
        .maybeSingle();

      const token = inviteRow?.invite_token;
      const link = token ? `${window.location.origin}/invite?token=${encodeURIComponent(token)}` : undefined;

      // Try to copy to clipboard for convenience
      if (link && navigator?.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(link); } catch {}
      }

      toast({
        title: "Éxito",
        description: link
          ? `Invitación creada. Enlace copiado: ${link}`
          : "Usuario invitado creado correctamente.",
        duration: 6000
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

        // Check if there's an existing invited user
        const { data: existingInvited } = await supabase
          .from('invited_users')
          .select('*')
          .eq('email', userData.email.toLowerCase())
          .is('claimed_at', null)
          .maybeSingle();

        if (existingInvited) {
          return {
            id: existingInvited.id,
            full_name: existingInvited.full_name,
            email: existingInvited.email,
            phone: existingInvited.phone,
            role: existingInvited.role,
            account_status: existingInvited.account_status,
            created_at: existingInvited.invited_at,
            isExisting: true
          };
        }
      }

      // Get current user (admin creating the appointment)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("No estás autenticado");
      }

      // Create a proper invited user record for admin-created appointments
      const { data: newInvitedUser, error: createError } = await supabase
        .from('invited_users')
        .insert({
          email: userData.email.toLowerCase().trim(),
          full_name: userData.full_name.trim(),
          phone: userData.phone?.trim() || null,
          role: 'client',
          account_status: 'invited',
          invited_by: currentUser.id,
          is_guest_user: false
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        id: newInvitedUser.id,
        full_name: newInvitedUser.full_name,
        email: newInvitedUser.email,
        phone: newInvitedUser.phone,
        role: newInvitedUser.role,
        account_status: newInvitedUser.account_status,
        created_at: newInvitedUser.invited_at,
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

  const regenerateInviteToken = async (invitedUserId: string): Promise<boolean> => {
    try {
      // Generate a new token by updating the invited user record
      const { data, error } = await supabase
        .from('invited_users')
        .update({
          invite_token: null // This will trigger the default function to generate a new token
        })
        .eq('id', invitedUserId)
        .select('invite_token, email')
        .single();

      if (error) throw error;

      if (data?.invite_token) {
        const link = `${window.location.origin}/invite?token=${encodeURIComponent(data.invite_token)}`;
        
        try {
          await navigator.clipboard.writeText(link);
          toast({
            title: "Nuevo enlace generado",
            description: "Se generó y copió un nuevo enlace de invitación.",
          });
        } catch {
          toast({
            title: "Nuevo enlace generado",
            description: `Enlace: ${link}`,
          });
        }
      }

      return true;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error",
        description: `No se pudo regenerar el enlace: ${errorMessage}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateInvitedUser = async (userId: string, userData: Partial<InvitedUserData>): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Validate data if provided
      if (userData.email || userData.full_name || userData.phone || userData.role) {
        const validatedData = invitedUserSchema.parse({
          email: userData.email || '',
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          role: userData.role || 'client'
        });
        
        // Use validated data for update
        userData = {
          email: validatedData.email,
          full_name: validatedData.full_name,
          phone: validatedData.phone,
          role: validatedData.role
        };
      }

      const { error } = await supabase
        .from('invited_users')
        .update(userData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario invitado actualizado correctamente"
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

  const deleteInvitedUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invited_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario invitado eliminado correctamente"
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
    }
  };

  return {
    loading,
    createInvitedUser,
    createGuestCustomerForBooking,
    checkEmailExists,
    regenerateInviteToken,
    updateInvitedUser,
    deleteInvitedUser
  };
};