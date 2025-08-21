import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookableItems } from "@/hooks/useBookableItems";
import { useBookingContext } from "@/contexts/BookingContext";
import { useServices } from "@/hooks/useServices";
import { useEmployees } from "@/hooks/useEmployees";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { BookingProgress } from "./BookingProgress";
import { 
  BookableItem, 
  Employee, 
  TimeSlot, 
  BookingStep, 
  BookingConfig 
} from "@/types/booking";

// Import step components
import { ServiceSelectionStep } from "./steps/ServiceSelectionStep";
import { DateSelectionStep } from "./steps/DateSelectionStep";
import { TimeSlotSelectionStep } from "./steps/TimeSlotSelectionStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { AuthenticationStep } from "./steps/AuthenticationStep";
import { GuestCustomerInfo } from "./GuestCustomerInfo";

// Import hooks
import { useBookingState } from "./hooks/useBookingState";
import { useBookingHandlers } from "./hooks/useBookingHandlers";

interface UnifiedBookingSystemProps {
  config: BookingConfig;
  selectedCustomer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

export const UnifiedBookingSystem = ({ config, selectedCustomer }: UnifiedBookingSystemProps) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedCategory, setSelectedCategory } = useBookingContext();
  
  // Use custom hooks for state management
  const {
    state,
    updateState,
    handleServiceSelect,
    handleDateSelect,
    handleSlotSelect,
    handleEmployeeSelect,
    handleNotesChange,
    resetForm,
  } = useBookingState({ selectedCustomer });

  const {
    handleProceedToAuth,
    handleFinalBooking,
    handleBooking,
    handleGuestBooking,
  } = useBookingHandlers({
    user,
    config,
    state,
    updateState,
    resetForm,
  });
  
  // Fetch data using individual hooks
  const { data: categories = [] } = useCategories();
  const { data: employees = [] } = useEmployees();
  const { 
    data: filteredBookableItems = [], 
    allItems: allBookableItems = [],
    isLoading: loading
  } = useBookableItems(selectedCategory);

  // Format price helper
  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100)}`;
  };

  // Fetch available slots helper
  const fetchAvailableSlots = async (
    service: BookableItem,
    date: Date,
    selectedEmployee?: Employee | null
  ): Promise<TimeSlot[]> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      
      // Get all employees who can perform this service
      let availableEmployees;
      if (service.type === 'combo') {
        // For combos, get employees who can perform ALL services in the combo
        const { data: employeeServices } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            profiles!inner(id, full_name, role)
          `)
          .in('service_id', service.combo_services?.map(cs => cs.service_id) || []);

        if (!employeeServices || employeeServices.length === 0) {
          return [];
        }

        // Group by employee and check if they can perform all services
        const employeeServiceCount = employeeServices.reduce((acc, es) => {
          acc[es.employee_id] = (acc[es.employee_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const requiredServiceCount = service.combo_services?.length || 0;
        const eligibleEmployeeIds = Object.entries(employeeServiceCount)
          .filter(([_, count]) => count === requiredServiceCount)
          .map(([id, _]) => id);

        if (eligibleEmployeeIds.length === 0) {
          return [];
        }

        availableEmployees = eligibleEmployeeIds.map(id => ({
          id,
          full_name: employeeServices.find(es => es.employee_id === id)?.profiles?.full_name || ''
        }));
      } else {
        // For individual services
        const { data: employeeServices } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            profiles!inner(id, full_name, role)
          `)
          .eq('service_id', service.id);

        if (!employeeServices || employeeServices.length === 0) {
          return [];
        }

        availableEmployees = employeeServices.map(es => ({
          id: es.employee_id,
          full_name: es.profiles?.full_name || ''
        }));
      }

      // Filter by selected employee if specified
      if (selectedEmployee) {
        availableEmployees = availableEmployees.filter(emp => emp.id === selectedEmployee.id);
      }

      // Get employee schedules for this day of week
      const employeeIds = availableEmployees.map(emp => emp.id);
      const { data: schedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      // Get existing reservations for this date
      const { data: reservations } = await supabase
        .from('reservations')
        .select('start_time, end_time, employee_id')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Get existing combo reservations for this date
      const { data: comboReservations } = await supabase
        .from('combo_reservations')
        .select('start_time, end_time, primary_employee_id')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Get blocked times for this date
      const { data: blockedTimes } = await supabase
        .from('blocked_times')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('date', dateStr);

      const slots: TimeSlot[] = [];

      // Generate slots for each available employee
      schedules?.forEach(schedule => {
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const endHour = parseInt(schedule.end_time.split(':')[0]);
        const serviceDuration = service.duration_minutes;

        // Generate 30-minute slots
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotStartMinutes = hour * 60 + minute;
            const slotEndMinutes = slotStartMinutes + serviceDuration;

            // Check if this slot conflicts with existing reservations
            const hasReservationConflict = reservations?.some(reservation => {
              if (reservation.employee_id !== schedule.employee_id) return false;
              
              const resStart = parseInt(reservation.start_time.split(':')[0]) * 60 + parseInt(reservation.start_time.split(':')[1]);
              const resEnd = parseInt(reservation.end_time.split(':')[0]) * 60 + parseInt(reservation.end_time.split(':')[1]);
              
              return (slotStartMinutes < resEnd && slotEndMinutes > resStart);
            }) || false;

            // Check if this slot conflicts with existing combo reservations
            const hasComboConflict = comboReservations?.some(comboRes => {
              if (comboRes.primary_employee_id !== schedule.employee_id) return false;
              
              const comboStart = parseInt(comboRes.start_time.split(':')[0]) * 60 + parseInt(comboRes.start_time.split(':')[1]);
              const comboEnd = parseInt(comboRes.end_time.split(':')[0]) * 60 + parseInt(comboRes.end_time.split(':')[1]);
              
              return (slotStartMinutes < comboEnd && slotEndMinutes > comboStart);
            }) || false;

            // Check if this slot conflicts with blocked times
            const isBlocked = blockedTimes?.some(blocked => {
              if (blocked.employee_id !== schedule.employee_id) return false;
              
              const blockStart = parseInt(blocked.start_time.split(':')[0]) * 60 + parseInt(blocked.start_time.split(':')[1]);
              const blockEnd = parseInt(blocked.end_time.split(':')[0]) * 60 + parseInt(blocked.end_time.split(':')[1]);
              
              return (slotStartMinutes < blockEnd && slotEndMinutes > blockStart);
            }) || false;

            // Check if slot extends beyond schedule
            const extendsBeyondSchedule = slotEndMinutes > endHour * 60;

            if (!hasReservationConflict && !hasComboConflict && !isBlocked && !extendsBeyondSchedule) {
              slots.push({
                start_time: slotStart,
                employee_id: schedule.employee_id,
                employee_name: availableEmployees.find(emp => emp.id === schedule.employee_id)?.full_name || '',
                available: true
              });
            }
          }
        }
      });

      return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  // Handle URL parameters for pre-selected service and step
  useEffect(() => {
    const serviceId = searchParams.get('service');
    
    if (serviceId && !state.selectedService) {
      // First try to find the service in all bookable items
      const service = allBookableItems.find(item => item.id === serviceId);
      
      if (service) {
        // Set the category based on the pre-selected service
        if (service.type === 'service' && service.category_id) {
          setSelectedCategory(service.category_id);
        } else if (service.type === 'combo') {
          // For combos, set category to 'promociones' since they're promotional items
          setSelectedCategory('promociones');
        }
        
        // Set the selected service and go directly to step 2 (date selection)
        // No default date - user must select their preferred date
        updateState({ 
          selectedService: service,
          selectedDate: undefined, // No default date
          currentStep: 2 
        });
      }
    }
  }, [searchParams, allBookableItems, state.selectedService, updateState, setSelectedCategory]);

  // Fetch available slots when service, date, or employee changes
  useEffect(() => {
    const loadSlots = async () => {
      if (state.selectedService && state.selectedDate) {
        setSlotsLoading(true);
        try {
          const slots = await fetchAvailableSlots(
            state.selectedService, 
            state.selectedDate, 
            state.selectedEmployee
          );
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error loading available slots:', error);
          setAvailableSlots([]);
        } finally {
          setSlotsLoading(false);
        }
      } else {
        setAvailableSlots([]);
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [state.selectedService?.id, state.selectedDate?.toISOString(), state.selectedEmployee?.id]);

  // Define steps based on config
  const getSteps = (): BookingStep[] => {
    if (config.isGuest) {
      return [
        { id: 1, title: "Servicio", description: "Elige tu servicio" },
        { id: 2, title: "Fecha", description: "Selecciona una fecha" },
        { id: 3, title: "Hora", description: "Elige tu horario" },
        { id: 4, title: "Información", description: "Confirma y reserva" },
      ];
    }

    const baseSteps = [
      { id: 1, title: "Servicio", description: "Elige tu servicio" },
      { id: 2, title: "Fecha", description: "Selecciona una fecha" },
      { id: 3, title: "Hora", description: "Elige tu horario" },
      { id: 4, title: "Confirmación", description: "Revisa y confirma" },
    ];

    if (config.showAuthStep) {
      baseSteps.push({ id: 5, title: "Autenticación", description: "Inicia sesión o regístrate" });
    }

    return baseSteps;
  };

  const steps = getSteps();

  // Handle going back to landing page
  const handleGoBack = () => {
    navigate('/');
  };

  // Handle going to previous step
  const handlePrevious = () => {
    if (state.currentStep > 1) {
      updateState({ currentStep: state.currentStep - 1 });
    }
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <ServiceSelectionStep
            allBookableItems={filteredBookableItems}
            categories={categories}
            employees={employees}
            selectedService={state.selectedService}
            selectedEmployee={state.selectedEmployee}
            selectedCategory={selectedCategory}
            showCategories={config.showCategories}
            allowEmployeeSelection={config.allowEmployeeSelection}
            onServiceSelect={handleServiceSelect}
            onEmployeeSelect={handleEmployeeSelect}
            onCategorySelect={setSelectedCategory}
            onBack={handleGoBack}
            formatPrice={formatPrice}
          />
        );

      case 2:
        return (
          <DateSelectionStep
            selectedService={state.selectedService}
            selectedDate={state.selectedDate}
            onDateSelect={handleDateSelect}
            onBack={() => updateState({ currentStep: 1 })}
          />
        );

      case 3:
        return (
          <TimeSlotSelectionStep
            selectedService={state.selectedService}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            availableSlots={availableSlots}
            slotsLoading={slotsLoading}
            onSlotSelect={handleSlotSelect}
            onBack={() => updateState({ currentStep: 2 })}
          />
        );

      case 4:
        // For guest bookings, show customer info form directly
        if (config.isGuest) {
          return (
            <GuestCustomerInfo
              selectedService={state.selectedService}
              selectedDate={state.selectedDate}
              selectedSlot={state.selectedSlot}
              selectedEmployee={state.selectedEmployee}
              customerName={state.customerName}
              customerEmail={state.customerEmail}
              customerPhone={state.customerPhone}
              notes={state.notes}
              formatPrice={formatPrice}
              onCustomerNameChange={(name) => updateState({ customerName: name })}
              onCustomerEmailChange={(email) => updateState({ customerEmail: email })}
              onCustomerPhoneChange={(phone) => updateState({ customerPhone: phone })}
              onNotesChange={handleNotesChange}
              onBack={() => updateState({ currentStep: 3 })}
              onConfirm={handleGuestBooking}
              submitting={state.submitting}
            />
          );
        }
        // For authenticated users, show confirmation step
        return (
          <ConfirmationStep
            selectedService={state.selectedService}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            selectedEmployee={state.selectedEmployee}
            notes={state.notes}
            formatPrice={formatPrice}
            onNotesChange={handleNotesChange}
            onBack={() => updateState({ currentStep: 3 })}
            onConfirm={handleBooking}
            isSubmitting={state.submitting}
          />
        );

      case 5:
        return (
          <AuthenticationStep
            isGuest={config.isGuest}
            user={user}
            customerEmail={state.customerEmail}
            customerName={state.customerName}
            onCustomerEmailChange={(email) => updateState({ customerEmail: email })}
            onCustomerNameChange={(name) => updateState({ customerName: name })}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <BookingProgress steps={steps} currentStep={state.currentStep} />
      
      {renderStepContent()}
    </div>
  );
};