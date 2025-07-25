import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, UserPlus, CheckCircle, Sparkles, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useBookingData } from "@/hooks/useBookingData";
import { BookingProgress } from "./BookingProgress";
import { ServiceCard } from "./ServiceCard";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { CategoryFilter } from "./CategoryFilter";
import { 
  BookableItem, 
  Employee, 
  TimeSlot, 
  BookingStep, 
  BookingState, 
  BookingConfig 
} from "@/types/booking";

interface UnifiedBookingSystemProps {
  config: BookingConfig;
}

export const UnifiedBookingSystem = ({ config }: UnifiedBookingSystemProps) => {
  const [state, setState] = useState<BookingState>({
    currentStep: 1,
    selectedService: null,
    selectedDate: new Date(),
    selectedSlot: null,
    selectedEmployee: null,
    notes: "",
    loading: false,
    submitting: false,
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { 
    bookableItems, 
    categories, 
    selectedCategory,
    setSelectedCategory,
    employees, 
    loading, 
    fetchAvailableSlots, 
    formatPrice 
  } = useBookingData();

  // Define steps based on config
  const getSteps = (): BookingStep[] => {
    const baseSteps = [
      { id: 1, title: "Servicio", description: "Elige tu servicio" },
      { id: 2, title: "Fecha", description: "Selecciona una fecha" },
      { id: 3, title: "Hora", description: "Elige tu horario" },
      { id: 4, title: "Confirmación", description: "Revisa y confirma" },
    ];

    if (config.showAuthStep) {
      baseSteps.push({ id: 5, title: "Autenticación", description: "Inicia sesión o regístrate" });
    }

    return baseSteps.slice(0, config.maxSteps);
  };

  const steps = getSteps();

  // Handle URL parameters for pre-selecting service and step
  useEffect(() => {
    if (bookableItems.length > 0) {
      const serviceId = searchParams.get('service');
      const step = searchParams.get('step');
      const estilista = searchParams.get('estilista');
      const discountId = searchParams.get('discount');
      
      if (serviceId) {
        const service = bookableItems.find(s => s.id === serviceId);
        if (service) {
          setState(prev => ({ ...prev, selectedService: service }));
          
          if (estilista === 'cualquier') {
            setState(prev => ({ ...prev, selectedEmployee: null }));
          }
          
          const targetStep = step ? parseInt(step) : 2;
          if (targetStep >= 1 && targetStep <= config.maxSteps) {
            setState(prev => ({ ...prev, currentStep: targetStep }));
          }
        }
      }
    }
  }, [bookableItems, searchParams, config.maxSteps]);

  // Fetch available slots when service/date/employee changes
  useEffect(() => {
    if (state.selectedService && state.selectedDate) {
      setSlotsLoading(true);
      const loadSlots = async () => {
        try {
          const slots = await fetchAvailableSlots(
            state.selectedService,
            state.selectedDate,
            state.selectedEmployee
          );
          setAvailableSlots(slots);
        } finally {
          setSlotsLoading(false);
        }
      };
      loadSlots();
    } else {
      setAvailableSlots([]);
      setSlotsLoading(false);
    }
  }, [state.selectedService, state.selectedDate, state.selectedEmployee, fetchAvailableSlots]);

  // Handle pending booking for guest flow
  useEffect(() => {
    if (config.isGuest) {
      const savedBooking = localStorage.getItem('pendingBooking');
      if (savedBooking) {
        const bookingData = JSON.parse(savedBooking);
        setPendingBooking(bookingData);
        
        if (user) {
          handleFinalBooking();
        } else {
          setState(prev => ({ ...prev, currentStep: config.maxSteps }));
        }
      }
    }
  }, [config.isGuest, config.maxSteps, user]);

  // Complete pending booking when user gets authenticated
  useEffect(() => {
    if (user && pendingBooking && config.isGuest) {
      handleFinalBooking();
    }
  }, [user, pendingBooking, config.isGuest]);

  const handleServiceSelect = (service: BookableItem) => {
    setState(prev => ({ 
      ...prev, 
      selectedService: service,
      selectedSlot: null,
      currentStep: 2 
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setState(prev => ({ 
      ...prev, 
      selectedDate: date,
      selectedSlot: null,
      currentStep: date ? 3 : prev.currentStep 
    }));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setState(prev => ({ 
      ...prev, 
      selectedSlot: slot,
      currentStep: 4 
    }));
  };

  const handleEmployeeSelect = (employee: Employee | null) => {
    setState(prev => ({ ...prev, selectedEmployee: employee }));
  };

  const handleProceedToAuth = () => {
    if (!state.selectedService || !state.selectedDate || !state.selectedSlot) return;
    
    const bookingData = {
      service: state.selectedService,
      date: state.selectedDate.toISOString(),
      slot: state.selectedSlot,
      employee: state.selectedEmployee,
      notes: state.notes
    };
    
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    setPendingBooking(bookingData);
    setState(prev => ({ ...prev, currentStep: config.maxSteps }));
  };

  const handleFinalBooking = async () => {
    if (!user || !pendingBooking) return;

    setState(prev => ({ ...prev, submitting: true }));

    const { service, date, slot, notes: bookingNotes } = pendingBooking;
    const bookingDate = typeof date === 'string' ? new Date(date) : date;
    const startTime = slot.start_time;
    const endTime = format(
      addMinutes(parseISO(`${format(bookingDate, 'yyyy-MM-dd')}T${startTime}`), service.duration_minutes), 
      'HH:mm'
    );

    // Handle combo booking
    if (service.type === 'combo') {
      // Create multiple reservations for combo services
      const reservations = service.combo_services?.map(cs => ({
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

      if (error) {
        toast({
          title: "Error",
          description: "Error al crear la reserva del combo. Por favor intenta de nuevo.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, submitting: false }));
      } else {
        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });

        localStorage.removeItem('pendingBooking');
        setPendingBooking(null);
        navigate('/dashboard');
      }
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

      if (error) {
        toast({
          title: "Error",
          description: "Error al crear la reserva. Por favor intenta de nuevo.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, submitting: false }));
      } else {
        toast({
          title: "¡Reserva confirmada!",
          description: "Tu cita ha sido reservada exitosamente.",
        });

        localStorage.removeItem('pendingBooking');
        setPendingBooking(null);
        navigate('/dashboard');
      }
    }
  };

  const handleBooking = async () => {
    if (!user || !state.selectedService || !state.selectedDate || !state.selectedSlot) return;

    setState(prev => ({ ...prev, submitting: true }));

    const startTime = state.selectedSlot.start_time;
    const endTime = format(
      addMinutes(
        parseISO(`${format(state.selectedDate, 'yyyy-MM-dd')}T${startTime}`), 
        state.selectedService.duration_minutes
      ), 
      'HH:mm'
    );

    // Handle combo booking
    if (state.selectedService.type === 'combo') {
      const reservations = state.selectedService.combo_services?.map(cs => ({
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

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create combo booking",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Reserva confirmada!",
          description: "Tu combo ha sido reservado exitosamente.",
        });

        // Reset form
        setState({
          currentStep: 1,
          selectedService: null,
          selectedDate: new Date(),
          selectedSlot: null,
          selectedEmployee: null,
          notes: "",
          loading: false,
          submitting: false,
        });
      }
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

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create booking",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Reserva confirmada!",
          description: "Tu cita ha sido reservada exitosamente.",
        });

        // Reset form
        setState({
          currentStep: 1,
          selectedService: null,
          selectedDate: new Date(),
          selectedSlot: null,
          selectedEmployee: null,
          notes: "",
          loading: false,
          submitting: false,
        });
      }
    }

    setState(prev => ({ ...prev, submitting: false }));
  };

  const canGoNext = () => {
    switch (state.currentStep) {
      case 1:
        return !!state.selectedService;
      case 2:
        return !!state.selectedDate;
      case 3:
        return !!state.selectedSlot;
      case 4:
        return true;
      case 5:
        return !!user;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Elige tu servicio</CardTitle>
              <CardDescription>Selecciona el servicio o combo que deseas reservar</CardDescription>
            </CardHeader>
            <CardContent>
              {config.showCategories && (
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  className="mb-6"
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookableItems.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={state.selectedService?.id === service.id}
                      onSelect={handleServiceSelect}
                      employees={employees}
                      selectedEmployee={state.selectedEmployee}
                      onEmployeeSelect={handleEmployeeSelect}
                      allowEmployeeSelection={config.allowEmployeeSelection}
                      formatPrice={formatPrice}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Selecciona una fecha</CardTitle>
              <CardDescription>
                Elige la fecha para tu {state.selectedService?.type === 'combo' ? 'combo' : 'servicio'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={state.selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = startOfDay(new Date());
                  const selectedDate = startOfDay(date);
                  return selectedDate < today || date.getDay() === 0; // Disable Sundays
                }}
                className="rounded-md border"
                locale={es}
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Elige tu horario</CardTitle>
              <CardDescription>
                Horarios disponibles para {format(state.selectedDate!, 'EEEE, d MMMM', { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeSlotGrid
                slots={availableSlots}
                loading={slotsLoading}
                selectedSlot={state.selectedSlot}
                onSlotSelect={handleSlotSelect}
              />
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Confirma tu reserva</CardTitle>
              <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {state.selectedService && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {state.selectedService.image_url && (
                        <img
                          src={state.selectedService.image_url}
                          alt={state.selectedService.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{state.selectedService.name}</h3>
                        <p className="text-sm text-muted-foreground">{state.selectedService.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {state.selectedService.duration_minutes} min
                          </Badge>
                          {state.selectedService.type === 'combo' && state.selectedService.combo_services && state.selectedService.combo_services.length > 1 && (
                            <Badge className="bg-blue-500 text-white">
                              <Package className="h-3 w-3 mr-1" />
                              COMBO
                            </Badge>
                          )}
                          {state.selectedService.savings_cents > 0 && (
                            <Badge className="bg-red-500 text-white">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {state.selectedService.appliedDiscount?.discount_type === 'percentage' 
                                ? `${Math.round((state.selectedService.savings_cents / state.selectedService.original_price_cents) * 100)}%` 
                                : `${formatPrice(state.selectedService.appliedDiscount?.discount_value || 0)}`} OFF
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {state.selectedService.savings_cents > 0 ? (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(state.selectedService.original_price_cents)}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {formatPrice(state.selectedService.final_price_cents)}
                          </div>
                          <div className="text-xs text-green-600">
                            Ahorras {formatPrice(state.selectedService.savings_cents)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(state.selectedService.final_price_cents)}
                        </div>
                      )}
                    </div>
                  </div>

                  {state.selectedService.type === 'combo' && state.selectedService.combo_services && state.selectedService.combo_services.length > 1 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Servicios incluidos:</h4>
                      <div className="space-y-2">
                        {state.selectedService.combo_services.map((cs, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">
                              • {cs.services.name} {cs.quantity > 1 && `(x${cs.quantity})`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {cs.services.duration_minutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Fecha y hora</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(state.selectedDate!, 'EEEE, d MMMM yyyy', { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {state.selectedSlot?.start_time} - {format(
                          addMinutes(
                            parseISO(`${format(state.selectedDate!, 'yyyy-MM-dd')}T${state.selectedSlot?.start_time}`),
                            state.selectedService.duration_minutes
                          ),
                          'HH:mm'
                        )}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Estilista</h4>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {state.selectedSlot?.employee_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{state.selectedSlot?.employee_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Agrega cualquier nota especial o requerimiento..."
                      value={state.notes}
                      onChange={(e) => setState(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Autenticación requerida</CardTitle>
              <CardDescription>
                Necesitas iniciar sesión para completar tu reserva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Para completar tu reserva, necesitas tener una cuenta. 
                  Puedes iniciar sesión o crear una cuenta nueva.
                </p>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  Ir a autenticación
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (state.currentStep === 4 && config.isGuest) {
      handleProceedToAuth();
    } else if (state.currentStep === 4) {
      handleBooking();
    } else if (canGoNext()) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <BookingProgress steps={steps} currentStep={state.currentStep} />
      
      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {state.currentStep < config.maxSteps && (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || state.submitting}
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