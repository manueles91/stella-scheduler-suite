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
}

export const useBookingHandlers = ({
  user,
  config,
  state,
  updateState,
  resetForm,
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
        // Handle combo booking
        const reservations = service.combo_services?.map((cs: any) => ({
          client_id: user.id,
          employee_id: slot.employee_id,
          service_id: cs.service_id,
          appointment_date: format(bookingDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          notes: bookingNotes || null,
          original_price_cents: service.original_price_cents,
          final_price_cents: service.final_price_cents,
          savings_cents: service.savings_cents
        })) || [];

        const { error } = await supabase
          .from('reservations')
          .insert(reservations);

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });
      } else {
        // Handle single service booking
        const { error } = await supabase
          .from('reservations')
          .insert({
            client_id: user.id,
            employee_id: slot.employee_id,
            service_id: service.id,
            appointment_date: format(bookingDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: bookingNotes || null,
            applied_discount_id: service.appliedDiscount?.id,
            original_price_cents: service.original_price_cents,
            final_price_cents: service.final_price_cents,
            savings_cents: service.savings_cents
          });

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

    try {
      if (state.selectedService.type === 'combo') {
        // Handle combo booking
        const reservations = state.selectedService.combo_services?.map((cs: any) => ({
          client_id: user.id,
          employee_id: state.selectedEmployee?.id ? state.selectedSlot.employee_id : null,
          service_id: cs.service_id,
          appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          notes: state.notes || null,
          original_price_cents: state.selectedService.original_price_cents,
          final_price_cents: state.selectedService.final_price_cents,
          savings_cents: state.selectedService.savings_cents
        })) || [];

        const { error } = await supabase
          .from('reservations')
          .insert(reservations);

        if (error) throw error;

        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });
      } else {
        // Handle single service booking
        const { error } = await supabase
          .from('reservations')
          .insert({
            client_id: user.id,
            employee_id: state.selectedEmployee?.id ? state.selectedSlot.employee_id : null,
            service_id: state.selectedService.id,
            appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: state.notes || null,
            applied_discount_id: state.selectedService.appliedDiscount?.id,
            original_price_cents: state.selectedService.original_price_cents,
            final_price_cents: state.selectedService.final_price_cents,
            savings_cents: state.selectedService.savings_cents
          });

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
  }, [user, state, updateState, resetForm, toast]);

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
      const { error } = await supabase
        .from('reservations')
        .insert({
          client_id: null,
          employee_id: state.selectedSlot.employee_id,
          service_id: state.selectedService.id,
          appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          notes: state.notes || null,
          customer_email: state.customerEmail,
          customer_name: state.customerName,
          is_guest_booking: true,
          status: 'confirmed'
        });

      if (error) throw error;

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