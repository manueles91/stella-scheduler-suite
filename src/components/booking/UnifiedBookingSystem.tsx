import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
    canGoNext,
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

      // Get employee schedules for this day of week
      const employeeIds = employeeServices.map(es => es.employee_id);
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
        .neq('status', 'Cancelada');

      // Get blocked times for this date
      const { data: blockedTimes } = await supabase
        .from('blocked_times')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('date', dateStr);

      const slots: TimeSlot[] = [];

      // Generate slots for each available employee
      employeeServices.forEach(empService => {
        const employee = empService.profiles;
        const employeeSchedule = schedules?.find(s => s.employee_id === employee.id);
        
        if (!employeeSchedule) return;

        // Convert schedule times to minutes for easier calculation
        const [startHour, startMinute] = employeeSchedule.start_time.split(':').map(Number);
        const [endHour, endMinute] = employeeSchedule.end_time.split(':').map(Number);
        const scheduleStart = startHour * 60 + startMinute;
        const scheduleEnd = endHour * 60 + endMinute;

        // Generate 30-minute time slots within schedule
        for (let timeInMinutes = scheduleStart; timeInMinutes < scheduleEnd; timeInMinutes += 30) {
          const hour = Math.floor(timeInMinutes / 60);
          const minute = timeInMinutes % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Check for conflicts with existing reservations
          const hasReservationConflict = reservations?.some(res => {
            if (res.employee_id !== employee.id) return false;
            const resStartTime = res.start_time;
            const resEndTime = res.end_time;
            return timeString >= resStartTime && timeString < resEndTime;
          });

          // Check for blocked times
          const hasBlockedConflict = blockedTimes?.some(blocked => {
            if (blocked.employee_id !== employee.id) return false;
            const blockedStartTime = blocked.start_time;
            const blockedEndTime = blocked.end_time;
            return timeString >= blockedStartTime && timeString < blockedEndTime;
          });

          if (!hasReservationConflict && !hasBlockedConflict) {
            slots.push({
              start_time: timeString,
              employee_id: employee.id,
              employee_name: employee.full_name,
              available: true
            });
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
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        updateState({ 
          selectedService: service,
          selectedDate: tomorrow,
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
            formatPrice={formatPrice}
          />
        );

      case 2:
        return (
          <DateSelectionStep
            selectedService={state.selectedService}
            selectedDate={state.selectedDate}
            onDateSelect={handleDateSelect}
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

  const handleNext = () => {
    if (state.currentStep === 4 && !config.isGuest) {
      // For authenticated users, book directly from confirmation step
      handleBooking();
    } else if (canGoNext()) {
      updateState({ currentStep: state.currentStep + 1 });
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

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
        {/* Navigation Buttons - Always show "Anterior" */}
        <Button
          variant="outline"
          onClick={state.currentStep === 1 ? handleGoBack : handlePrevious}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {/* Next/Confirm Button - Only show if not on guest step 4 (which has its own confirm button) */}
        {!(config.isGuest && state.currentStep === 4) && state.currentStep < config.maxSteps && (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || state.submitting}
            className="w-full sm:w-auto"
          >
            {state.currentStep === 4 && !config.isGuest ? (
              <>
                {state.submitting ? (
                  "Procesando..."
                ) : (
                  <>
                    Confirmar reserva
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};