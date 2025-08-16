import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedBookingData } from "@/hooks/useOptimizedBookingData";
import { useBookingContext } from "@/contexts/BookingContext";
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
  
  const { 
    bookableItems, 
    categories, 
    employees, 
    loading, 
    fetchAvailableSlots, 
    formatPrice 
  } = useOptimizedBookingData();
  
  const { selectedCategory, setSelectedCategory } = useBookingContext();

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
  }, [state.selectedService, state.selectedDate, state.selectedEmployee, fetchAvailableSlots]);

  // Define steps based on config
  const getSteps = (): BookingStep[] => {
    if (config.isGuest) {
      return [
        { id: 1, title: "Servicio", description: "Elige tu servicio" },
        { id: 2, title: "Fecha", description: "Selecciona una fecha" },
        { id: 3, title: "Hora", description: "Elige tu horario" },
        { id: 4, title: "Confirmación", description: "Revisa y confirma" },
        { id: 5, title: "Información", description: "Datos de contacto" },
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
            allBookableItems={bookableItems}
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
        return (
          <ConfirmationStep
            selectedService={state.selectedService}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            selectedEmployee={state.selectedEmployee}
            notes={state.notes}
            formatPrice={formatPrice}
            onNotesChange={handleNotesChange}
          />
        );

      case 5:
        // For guest bookings, show customer info form
        if (config.isGuest) {
          return (
            <GuestCustomerInfo
              selectedService={state.selectedService}
              selectedDate={state.selectedDate}
              selectedSlot={state.selectedSlot}
              selectedEmployee={state.selectedEmployee}
              customerName={state.customerName}
              customerEmail={state.customerEmail}
              notes={state.notes}
              onCustomerNameChange={(name) => updateState({ customerName: name })}
              onCustomerEmailChange={(email) => updateState({ customerEmail: email })}
              onNotesChange={handleNotesChange}
              onBack={() => updateState({ currentStep: 4 })}
              onConfirm={handleGuestBooking}
              submitting={state.submitting}
            />
          );
        }
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
    if (state.currentStep === 4 && config.isGuest) {
      updateState({ currentStep: 5 });
    } else if (state.currentStep === 4) {
      handleBooking();
    } else if (state.currentStep === 5 && config.isGuest) {
      handleGuestBooking();
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
        {/* Navigation Buttons */}
        {state.currentStep === 1 ? (
          // Step 1: Show "Volver" button to go back to landing page
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        ) : (
          // Other steps: Show "Anterior" button to go to previous step
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
        )}

        {/* Next/Confirm Button */}
        {state.currentStep < config.maxSteps && (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || state.submitting}
            className="w-full sm:w-auto"
          >
            {state.currentStep === 4 ? (
              <>
                {state.submitting ? (
                  "Procesando..."
                ) : (
                  <>
                    {config.isGuest ? "Continuar" : "Confirmar reserva"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </>
            ) : state.currentStep === 5 && config.isGuest ? (
              // For guest step 5, show nothing since GuestCustomerInfo handles its own buttons
              null
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