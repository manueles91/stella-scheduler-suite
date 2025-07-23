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
import { ArrowLeft, ArrowRight, UserPlus, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useBookingData } from "@/hooks/useBookingData";
import { BookingProgress } from "./BookingProgress";
import { ServiceCard } from "./ServiceCard";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { 
  Service, 
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { 
    services, 
    categories, 
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
    if (services.length > 0) {
      const serviceId = searchParams.get('service');
      const step = searchParams.get('step');
      const estilista = searchParams.get('estilista');
      
      if (serviceId) {
        const service = services.find(s => s.id === serviceId);
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
  }, [services, searchParams, config.maxSteps]);

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

  const handleServiceSelect = (service: Service) => {
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

    const { error } = await supabase
      .from('reservations')
      .insert({
        client_id: user.id,
        employee_id: slot.employee_id,
        service_id: service.id,
        appointment_date: format(bookingDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        notes: bookingNotes || null
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

    const { error } = await supabase
      .from('reservations')
      .insert({
        client_id: user.id,
        employee_id: state.selectedEmployee?.id ? state.selectedSlot.employee_id : null,
        service_id: state.selectedService.id,
        appointment_date: format(state.selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        notes: state.notes || null
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
              <CardDescription>Selecciona el servicio que deseas reservar</CardDescription>
              {config.showCategories && (
                <div className="mt-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecciona una fecha</CardTitle>
                <CardDescription>Elige el día para tu cita</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={state.selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => 
                    date < startOfDay(new Date()) || 
                    date.getDay() === 0
                  }
                  initialFocus
                  locale={es}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {state.selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del servicio</CardTitle>
                  <CardDescription>Detalles de tu selección</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    {state.selectedService.image_url && (
                      <img 
                        src={state.selectedService.image_url} 
                        alt={state.selectedService.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{state.selectedService.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {state.selectedService.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="secondary">{state.selectedService.duration_minutes} min</Badge>
                        <span className="font-bold text-primary">
                          {formatPrice(state.selectedService.price_cents)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {state.selectedEmployee && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {state.selectedEmployee.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Estilista preferido</p>
                          <p className="text-sm text-muted-foreground">
                            {state.selectedEmployee.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Horarios disponibles</CardTitle>
              <CardDescription>
                {state.selectedDate ? format(state.selectedDate, 'EEEE, d MMMM yyyy', { locale: es }) : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeSlotGrid
                slots={availableSlots}
                selectedSlot={state.selectedSlot}
                onSlotSelect={handleSlotSelect}
                loading={slotsLoading}
              />
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Confirmar reserva</CardTitle>
              <CardDescription>Revisa los detalles de tu cita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted rounded-lg">
                <div className="space-y-4">
                  <div>
                    <strong>Servicio:</strong>
                    <p>{state.selectedService?.name}</p>
                  </div>
                  <div>
                    <strong>Fecha:</strong>
                    <p>{state.selectedDate ? format(state.selectedDate, 'EEEE, d MMMM yyyy', { locale: es }) : ''}</p>
                  </div>
                  <div>
                    <strong>Hora:</strong>
                    <p>{state.selectedSlot?.start_time}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <strong>Estilista:</strong>
                    <p>{state.selectedEmployee ? state.selectedSlot?.employee_name : 'Cualquier estilista'}</p>
                  </div>
                  <div>
                    <strong>Duración:</strong>
                    <p>{state.selectedService?.duration_minutes} minutos</p>
                  </div>
                  <div>
                    <strong>Precio:</strong>
                    <p className="text-lg font-bold text-primary">
                      {state.selectedService ? formatPrice(state.selectedService.price_cents) : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="¿Alguna petición o preferencia especial?"
                  value={state.notes}
                  onChange={(e) => setState(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {config.isGuest ? (
                <Button onClick={handleProceedToAuth} className="w-full" size="lg">
                  Continuar al registro/inicio de sesión
                </Button>
              ) : (
                <Button 
                  onClick={handleBooking} 
                  disabled={state.submitting || !user} 
                  className="w-full" 
                  size="lg"
                >
                  {state.submitting ? "Confirmando..." : "Confirmar reserva"}
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Casi listo!
              </CardTitle>
              <CardDescription>
                Para completar tu reserva, necesitas una cuenta en Stella Studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-lg font-medium">¡Autenticado exitosamente!</p>
                  <p className="text-muted-foreground">Completando tu reserva...</p>
                  <Button onClick={handleFinalBooking} disabled={state.submitting} size="lg">
                    {state.submitting ? "Confirmando..." : "Confirmar reserva"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="font-medium">
                      Tu cita está casi lista. Solo necesitas iniciar sesión o crear una cuenta.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tus selecciones se guardarán y completaremos la reserva automáticamente.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Resumen de tu reserva:</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Servicio:</strong> {state.selectedService?.name || pendingBooking?.service?.name}</p>
                      <p><strong>Fecha:</strong> {state.selectedDate ? format(state.selectedDate, 'EEEE, d MMMM yyyy', { locale: es }) : pendingBooking?.date && format(new Date(pendingBooking.date), 'EEEE, d MMMM yyyy', { locale: es })}</p>
                      <p><strong>Hora:</strong> {state.selectedSlot?.start_time || pendingBooking?.slot?.start_time}</p>
                      <p><strong>Estilista:</strong> {state.selectedSlot?.employee_name || pendingBooking?.slot?.employee_name}</p>
                      <p><strong>Precio:</strong> {state.selectedService ? formatPrice(state.selectedService.price_cents) : pendingBooking?.service && formatPrice(pendingBooking.service.price_cents)}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => navigate('/auth')} 
                    size="lg" 
                    className="w-full"
                  >
                    Iniciar sesión / Registrarse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {config.isGuest && (
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          )}
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif font-bold">Reserva tu cita</h1>
            {config.isGuest && (
              <p className="text-muted-foreground">
                Complete todos los pasos para reservar su cita. Solo necesita iniciar sesión al final.
              </p>
            )}

          </div>
        </div>

        {/* Progress Bar */}
        <BookingProgress steps={steps} currentStep={state.currentStep} />

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }))}
            disabled={state.currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {state.currentStep < config.maxSteps && (
            <Button
              onClick={() => setState(prev => ({ ...prev, currentStep: Math.min(config.maxSteps, prev.currentStep + 1) }))}
              disabled={!canGoNext()}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 