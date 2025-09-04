import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMinutes, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingState, BookingConfig } from "@/types/booking";

interface UseBookingHandlersProps {
  user: any;
  config: BookingConfig;
  state: BookingState;
  updateState: (updates: Partial<BookingState>) => void;
  resetForm: () => void;
  selectedCustomer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

export const useBookingHandlers = ({
  user,
  config,
  state,
  updateState,
  resetForm,
  selectedCustomer,
}: UseBookingHandlersProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleProceedToAuth = useCallback(() => {
    if (!state.selectedService || !state.selectedDate || !state.selectedSlot) return;
    
    const bookingData = {
      service: state.selectedService,
      date: state.selectedDate.toISOString(),
      slot: state.selectedSlot,
      employee: state.selectedEmployee,
      notes: state.notes
    };
    
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    updateState({ currentStep: config.maxSteps });
  }, [state, config.maxSteps, updateState]);

  const handleFinalBooking = useCallback(async (pendingBooking?: any) => {
    if (!user || !pendingBooking) return;

    updateState({ submitting: true });

    const { service, date, slot, notes: bookingNotes } = pendingBooking;
    const bookingDate = typeof date === 'string' ? new Date(date) : date;
    const startTime = slot.start_time;
    const endTime = format(
      addMinutes(parseISO(`${format(bookingDate, 'yyyy-MM-dd')}T${startTime}`), service.duration_minutes), 
      'HH:mm'
    );

    try {
      if (service.type === 'combo') {
        // Handle combo booking - create single combo reservation
        const { data: comboReservation, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: user.id,
            combo_id: service.id,
            primary_employee_id: slot.employee_id,
            appointment_date: format(bookingDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: bookingNotes || null,
            customer_email: user.email,
            customer_name: user.full_name,
            final_price_cents: service.final_price_cents,
            original_price_cents: service.original_price_cents,
            savings_cents: service.savings_cents || 0,
            is_guest_booking: false
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });
      } else {
        // Handle individual service booking
        const { data, error } = await supabase
          .from('reservations')
          .insert({
            client_id: user.id,
            employee_id: slot.employee_id,
            service_id: service.id,
            appointment_date: format(bookingDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: bookingNotes || null,
            customer_email: user.email,
            customer_name: user.full_name,
            final_price_cents: service.final_price_cents
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu cita ha sido reservada exitosamente.",
        });
      }

      localStorage.removeItem('pendingBooking');
      navigate('/dashboard');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: "Error al crear la reserva. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [user, updateState, toast, navigate]);

  const handleBooking = useCallback(async () => {
    if (!user || !state.selectedService || !state.selectedDate || !state.selectedSlot) return;

    updateState({ submitting: true });

    const startTime = state.selectedSlot.start_time;
    const endTime = format(
      addMinutes(
        parseISO(`${format(state.selectedDate, 'yyyy-MM-dd')}T${startTime}`), 
        state.selectedService.duration_minutes
      ), 
      'HH:mm'
    );

    // Determine if this is an admin booking for another client
    const isAdminBooking = selectedCustomer && user.id !== selectedCustomer.id;
    const clientId = selectedCustomer?.id || user.id;

    try {
      if (state.selectedService.type === 'combo') {
        // Handle combo booking - create single combo reservation
        const { data: comboReservation, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: clientId,
            combo_id: state.selectedService.id,
            primary_employee_id: state.selectedSlot.employee_id,
            appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: state.notes || null,
            customer_email: selectedCustomer?.email || user.email,
            customer_name: selectedCustomer?.full_name || user.full_name,
            final_price_cents: state.selectedService.final_price_cents,
            original_price_cents: state.selectedService.original_price_cents,
            savings_cents: state.selectedService.savings_cents || 0,
            is_guest_booking: false
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });
      } else {
        // Handle individual service booking
        const { data, error } = await supabase
          .from('reservations')
          .insert({
            client_id: clientId,
            employee_id: state.selectedSlot.employee_id,
            service_id: state.selectedService.id,
            appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: state.notes || null,
            customer_email: selectedCustomer?.email || user.email,
            customer_name: selectedCustomer?.full_name || user.full_name,
            final_price_cents: state.selectedService.final_price_cents,
            created_by_admin: isAdminBooking ? user.id : null
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu cita ha sido reservada exitosamente.",
        });
      }

      resetForm();
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [user, state, selectedCustomer, updateState, resetForm, toast]);

  const handleGuestBooking = useCallback(async () => {
    if (!state.selectedService || !state.selectedDate || !state.selectedSlot || 
        !state.customerName.trim() || !state.customerEmail.trim()) return;

    updateState({ submitting: true });

    const startTime = state.selectedSlot.start_time;
    const endTime = format(
      addMinutes(
        parseISO(`${format(state.selectedDate, 'yyyy-MM-dd')}T${startTime}`), 
        state.selectedService.duration_minutes
      ), 
      'HH:mm'
    );

    try {
      // First, check if guest user exists or create new one
      let guestUserId;
      
      // Check for existing guest user by email
      const { data: existingGuest } = await supabase
        .from('invited_users')
        .select('id')
        .eq('email', state.customerEmail)
        .eq('is_guest_user', true)
        .maybeSingle();

      if (existingGuest) {
        guestUserId = existingGuest.id;
        
        // Update last booking date
        await supabase
          .from('invited_users')
          .update({ last_booking_date: new Date().toISOString() })
          .eq('id', guestUserId);
      } else {
        // Create new guest user
        const { data: newGuest, error: guestError } = await supabase
          .from('invited_users')
          .insert({
            email: state.customerEmail,
            full_name: state.customerName,
            phone: state.customerPhone || null,
            role: 'client',
            is_guest_user: true,
            last_booking_date: new Date().toISOString(),
            invited_by: null,
            account_status: 'guest'
          })
          .select('id')
          .single();

        if (guestError) throw guestError;
        guestUserId = newGuest.id;
      }

      if (state.selectedService.type === 'combo') {
        // Handle guest combo booking - create single combo reservation
        const { data: comboReservation, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: guestUserId,
            combo_id: state.selectedService.id,
            primary_employee_id: state.selectedSlot.employee_id,
            appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: state.notes || null,
            customer_email: state.customerEmail,
            customer_name: state.customerName,
            is_guest_booking: true,
            status: 'confirmed',
            final_price_cents: state.selectedService.final_price_cents,
            original_price_cents: state.selectedService.original_price_cents,
            savings_cents: state.selectedService.savings_cents || 0
          })
          .select()
          .single();

        if (error) throw error;
      } else {
        // Handle individual service booking
        const { error } = await supabase
          .from('reservations')
          .insert({
            service_id: state.selectedService.id,
            employee_id: state.selectedSlot.employee_id,
            client_id: guestUserId,
            appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: state.notes || null,
            customer_email: state.customerEmail,
            customer_name: state.customerName,
            is_guest_booking: true,
            status: 'confirmed',
            final_price_cents: state.selectedService.final_price_cents
          });

        if (error) throw error;
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            email: state.customerEmail,
            customerName: state.customerName,
            serviceName: state.selectedService.name,
            date: format(state.selectedDate, 'yyyy-MM-dd'),
            time: startTime,
          }
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      toast({
        title: "¡Reserva confirmada!",
        description: "Tu cita ha sido reservada exitosamente. Te hemos enviado un email de confirmación.",
      });

      resetForm();
      navigate('/');
    } catch (error) {
      console.error('Guest booking error:', error);
      toast({
        title: "Error",
        description: "Error al crear la reserva. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [state, updateState, resetForm, toast, navigate]);

  return {
    handleProceedToAuth,
    handleFinalBooking,
    handleBooking,
    handleGuestBooking,
  };
};