import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { trackLoyaltyVisit } from "@/lib/loyaltyTracking";
import { Appointment } from "@/types/appointment";
import { AppointmentFormData, Customer, Employee } from "@/types/time-tracking";

export const useAppointmentManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const updateAppointment = async (
    appointment: Appointment, 
    formData: AppointmentFormData,
    clients: Customer[]
  ): Promise<boolean> => {
    const selectedClient = clients.find(c => c.id === formData.client_id);
    
    // Determine actual client id (allow ids not present in local list and temp placeholder)
    const actualClientId = formData.client_id === 'temp-client-id'
      ? appointment.client_id
      : (selectedClient?.id || formData.client_id);

    if (!actualClientId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Get client information for customer_email and customer_name
      const customerEmail = selectedClient?.email || null;
      const customerName = selectedClient?.full_name || null;
      
      // Determine if this is a combo or individual service
      const isCombo = formData.isCombo || appointment.isCombo;
      
      if (isCombo) {
        // Update combo reservation
        const { error } = await supabase
          .from('combo_reservations')
          .update({
            appointment_date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            status: formData.status || appointment.status, // Use form status or fallback to existing status
            notes: formData.notes || null,
            client_id: actualClientId,
            primary_employee_id: formData.employee_id || null,
            final_price_cents: formData.final_price_cents || 0,
            customer_email: customerEmail,
            customer_name: customerName,
          })
          .eq('id', appointment.id);

        if (error) throw error;
      } else {
        // Update individual service reservation
        const { error } = await supabase
          .from('reservations')
          .update({
            appointment_date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            status: formData.status || appointment.status, // Use form status or fallback to existing status
            notes: formData.notes || null,
            client_id: actualClientId,
            employee_id: formData.employee_id || null,
            final_price_cents: formData.final_price_cents || 0,
            customer_email: customerEmail,
            customer_name: customerName,
          })
          .eq('id', appointment.id);

        if (error) throw error;
      }

      // Track loyalty visit if status is completed
      const finalStatus = formData.status || appointment.status;
      if (finalStatus === 'completed' && actualClientId) {
        const serviceName = appointment.services?.[0]?.name || 'Servicio';
        await trackLoyaltyVisit(
          actualClientId, 
          profile?.id, // Pass the current user's ID (admin or employee)
          `Cita completada: ${serviceName}`
        );
      }

      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la cita",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    updateAppointment
  };
};
