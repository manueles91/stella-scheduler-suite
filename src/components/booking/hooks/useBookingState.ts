import { useState, useCallback } from "react";
import { BookingState, BookableItem, TimeSlot, Employee } from "@/types/booking";

interface UseBookingStateProps {
  selectedCustomer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

export const useBookingState = ({ selectedCustomer }: UseBookingStateProps = {}) => {
  const [state, setState] = useState<BookingState>({
    currentStep: 1,
    selectedService: null,
    selectedDate: undefined, // No default date - user must select
    selectedSlot: null,
    selectedEmployee: null,
    notes: "",
    loading: false,
    submitting: false,
    customerEmail: selectedCustomer?.email || "",
    customerName: selectedCustomer?.full_name || "",
    customerPhone: selectedCustomer?.phone || "",
  });

  const updateState = useCallback((updates: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleServiceSelect = useCallback((service: BookableItem) => {
    setState(prev => ({ 
      ...prev, 
      selectedService: service,
      selectedSlot: null,
      currentStep: 2 
    }));
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setState(prev => ({ 
      ...prev, 
      selectedDate: date,
      selectedSlot: null,
      currentStep: date ? 3 : prev.currentStep 
    }));
  }, []);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    setState(prev => ({ 
      ...prev, 
      selectedSlot: slot,
      currentStep: 4 
    }));
  }, []);

  const handleEmployeeSelect = useCallback((employee: Employee | null) => {
    setState(prev => ({ ...prev, selectedEmployee: employee }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setState(prev => ({ ...prev, notes }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      currentStep: 1,
      selectedService: null,
      selectedDate: undefined, // No default date - user must select
      selectedSlot: null,
      selectedEmployee: null,
      notes: "",
      loading: false,
      submitting: false,
      customerEmail: "",
      customerName: "",
      customerPhone: "",
    });
  }, []);

  return {
    state,
    updateState,
    handleServiceSelect,
    handleDateSelect,
    handleSlotSelect,
    handleEmployeeSelect,
    handleNotesChange,
    resetForm,
  };
};