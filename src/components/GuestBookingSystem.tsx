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
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO, isSameDay, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  category_id?: string;
  image_url?: string;
}

interface Employee {
  id: string;
  full_name: string;
  employee_services: {
    service_id: string;
  }[];
}

interface TimeSlot {
  start_time: string;
  employee_id: string;
  employee_name: string;
  available: boolean;
}

const BOOKING_STEPS = [
  {
    id: 1,
    title: "Servicio",
    description: "Elige tu servicio"
  },
  {
    id: 2,
    title: "Fecha",
    description: "Selecciona una fecha"
  },
  {
    id: 3,
    title: "Hora",
    description: "Elige tu horario"
  },
  {
    id: 4,
    title: "Detalles",
    description: "Información adicional"
  },
  {
    id: 5,
    title: "Autenticación",
    description: "Inicia sesión o regístrate"
  }
];

export const GuestBookingSystem = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Store booking data for after authentication
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchServices();
    fetchEmployees();
    fetchCategories();
  }, []);

  // Handle URL parameters for pre-selecting service and step
  useEffect(() => {
    if (services.length > 0) {
      const serviceId = searchParams.get('service');
      const step = searchParams.get('step');
      const estilista = searchParams.get('estilista');
      
      if (serviceId) {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          
          // Auto-select "cualquier estilista" if specified
          if (estilista === 'cualquier') {
            setSelectedEmployee(null); // null means "any stylist"
          }
          
          // Skip to specified step (default to step 2 for date selection)
          const targetStep = step ? parseInt(step) : 2;
          if (targetStep >= 1 && targetStep <= 5) {
            setCurrentStep(targetStep);
          }
        }
      }
    }
  }, [services, searchParams]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate, selectedEmployee]);

  // Check for pending booking in localStorage on mount
  useEffect(() => {
    const savedBooking = localStorage.getItem('pendingBooking');
    if (savedBooking) {
      const bookingData = JSON.parse(savedBooking);
      setPendingBooking(bookingData);
      
      // If user is already authenticated, complete the booking
      if (user) {
        handleFinalBooking();
      } else {
        // Show the authentication step
        setCurrentStep(5);
      }
    }
  }, []);

  // If user gets authenticated and we have pending booking, complete it
  useEffect(() => {
    if (user && pendingBooking) {
      handleFinalBooking();
    }
  }, [user, pendingBooking]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      return;
    }

    setServices(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        employee_services (
          service_id
        )
      `)
      .eq('role', 'employee');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
      return;
    }

    setEmployees(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;

    setLoading(true);
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeek = selectedDate.getDay();
    
    // Skip Sundays (day 0)
    if (dayOfWeek === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // Get employees who can perform this service
    const availableEmployees = selectedEmployee 
      ? [selectedEmployee] 
      : employees.filter(emp => emp.employee_services.some(es => es.service_id === selectedService.id));
    
    if (availableEmployees.length === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // Get existing reservations for this date
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled');

    if (reservationError) {
      console.error('Error fetching reservations:', reservationError);
      setLoading(false);
      return;
    }

    // Generate time slots using fixed business hours
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18;  // 6 PM
    const serviceDuration = selectedService.duration_minutes;
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    for (const employee of availableEmployees) {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotDateTime = parseISO(`${dateStr}T${timeString}`);
          const slotEndTime = addMinutes(slotDateTime, serviceDuration);
          
          // Only show slots that are in the future (if today)
          const isFutureSlot = !isToday || isAfter(slotDateTime, now);
          
          // Check if slot conflicts with existing reservations
          const hasConflict = reservations?.some((reservation) => {
            if (reservation.employee_id !== employee.id) return false;
            const resStart = parseISO(`${dateStr}T${reservation.start_time}`);
            const resEnd = parseISO(`${dateStr}T${reservation.end_time}`);
            return slotDateTime < resEnd && slotEndTime > resStart;
          });
          
          if (isFutureSlot && !hasConflict) {
            slots.push({
              start_time: timeString,
              employee_id: employee.id,
              employee_name: employee.full_name,
              available: true,
            });
          }
        }
      }
    }

    // Sort slots by time
    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    setAvailableSlots(slots);
    setLoading(false);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setCurrentStep(2);
  };



  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setCurrentStep(3);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep(4);
  };

  const handleProceedToAuth = () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    
    // Store booking data in localStorage to persist across navigation
    const bookingData = {
      service: selectedService,
      date: selectedDate.toISOString(),
      slot: selectedSlot,
      employee: selectedEmployee,
      notes: notes
    };
    
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    setPendingBooking(bookingData);
    setCurrentStep(5);
  };

  const handleFinalBooking = async () => {
    if (!user || !pendingBooking) return;

    setSubmitting(true);

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
      setSubmitting(false);
    } else {
      toast({
        title: "¡Reserva confirmada!",
        description: "Tu cita ha sido reservada exitosamente.",
      });

      // Clear saved booking data and reset form
      localStorage.removeItem('pendingBooking');
      setPendingBooking(null);
      navigate('/dashboard');
    }
  };

  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100)}`;
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedDate;
      case 3:
        return !!selectedSlot;
      case 4:
        return true;
      case 5:
        return !!user;
      default:
        return false;
    }
  };

  const progress = (currentStep / BOOKING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif font-bold">Reserva tu cita</h1>
            <p className="text-muted-foreground">
              Complete todos los pasos para reservar su cita. Solo necesita iniciar sesión al final.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                {BOOKING_STEPS.map((step) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep >= step.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Elige tu servicio</CardTitle>
              <CardDescription>Selecciona el servicio que deseas reservar</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedService?.id === service.id
                        ? 'ring-2 ring-primary border-primary'
                        : ''
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    {service.image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {service.duration_minutes} min
                        </Badge>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(service.price_cents)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {service.description || "Servicio profesional disponible"}
                      </p>
                      
                      {/* Employee Selection within each service card */}
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Label>Estilista</Label>
                        <Select 
                          value={selectedService?.id === service.id ? selectedEmployee?.id || "any" : "any"} 
                          onValueChange={(value) => {
                            setSelectedService(service);
                            if (value === "any") {
                              setSelectedEmployee(null);
                            } else {
                              const employee = employees.find(emp => 
                                emp.id === value && 
                                emp.employee_services.some(es => es.service_id === service.id)
                              );
                              setSelectedEmployee(employee || null);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Cualquier estilista" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Cualquier estilista</SelectItem>
                            {employees
                              .filter(emp => emp.employee_services.some(es => es.service_id === service.id))
                              .map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-xs">
                                        {employee.full_name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    {employee.full_name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && selectedService && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecciona una fecha</CardTitle>
                <CardDescription>Elige el día para tu cita</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => 
                    date < startOfDay(new Date()) || 
                    date.getDay() === 0 // Disable Sundays
                  }
                  initialFocus
                  locale={es}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen del servicio</CardTitle>
                <CardDescription>Detalles de tu selección</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {selectedService.image_url && (
                    <img 
                      src={selectedService.image_url} 
                      alt={selectedService.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedService.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">{selectedService.duration_minutes} min</Badge>
                      <span className="font-bold text-primary">
                        {formatPrice(selectedService.price_cents)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedEmployee && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {selectedEmployee.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Estilista preferido</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEmployee.full_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && selectedService && selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>Horarios disponibles</CardTitle>
              <CardDescription>
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando horarios disponibles...</div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay horarios disponibles para esta fecha.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Prueba seleccionar otra fecha.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedSlot?.start_time === slot.start_time && 
                        selectedSlot?.employee_id === slot.employee_id
                          ? "default" 
                          : "outline"
                      }
                      onClick={() => handleSlotSelect(slot)}
                      className="p-3 h-auto flex flex-col"
                    >
                      <span className="font-medium">{slot.start_time}</span>
                      <span className="text-xs text-muted-foreground">
                        {slot.employee_name}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && selectedService && selectedDate && selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles adicionales</CardTitle>
              <CardDescription>Información opcional para tu cita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted rounded-lg">
                <div className="space-y-4">
                  <div>
                    <strong>Servicio:</strong>
                    <p>{selectedService.name}</p>
                  </div>
                  <div>
                    <strong>Fecha:</strong>
                    <p>{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}</p>
                  </div>
                  <div>
                    <strong>Hora:</strong>
                    <p>{selectedSlot.start_time}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <strong>Estilista:</strong>
                    <p>{selectedSlot.employee_name}</p>
                  </div>
                  <div>
                    <strong>Duración:</strong>
                    <p>{selectedService.duration_minutes} minutos</p>
                  </div>
                  <div>
                    <strong>Precio:</strong>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(selectedService.price_cents)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="¿Alguna petición o preferencia especial?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleProceedToAuth} className="w-full" size="lg">
                Continuar al registro/inicio de sesión
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
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
                  <Button onClick={handleFinalBooking} disabled={submitting} size="lg">
                    {submitting ? "Confirmando..." : "Confirmar reserva"}
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
                      <p><strong>Servicio:</strong> {selectedService?.name || pendingBooking?.service?.name}</p>
                      <p><strong>Fecha:</strong> {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es }) : pendingBooking?.date && format(new Date(pendingBooking.date), 'EEEE, d MMMM yyyy', { locale: es })}</p>
                      <p><strong>Hora:</strong> {selectedSlot?.start_time || pendingBooking?.slot?.start_time}</p>
                      <p><strong>Estilista:</strong> {selectedSlot?.employee_name || pendingBooking?.slot?.employee_name}</p>
                      <p><strong>Precio:</strong> {selectedService ? formatPrice(selectedService.price_cents) : pendingBooking?.service && formatPrice(pendingBooking.service.price_cents)}</p>
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
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < 4 && (
            <Button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
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
