import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, User, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO, isSameDay, isAfter, startOfDay } from "date-fns";
interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
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
const BOOKING_STEPS = [{
  id: 1,
  title: "Servicio",
  description: "Elige tu servicio"
}, {
  id: 2,
  title: "Fecha",
  description: "Selecciona una fecha"
}, {
  id: 3,
  title: "Hora",
  description: "Elige tu horario"
}, {
  id: 4,
  title: "Confirmación",
  description: "Revisa y confirma"
}];
export const EnhancedBookingSystem = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchServices();
    fetchEmployees();
  }, []);
  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate, selectedEmployee]);
  const fetchServices = async () => {
    const {
      data,
      error
    } = await supabase.from('services').select('*').eq('is_active', true).order('name');
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } else {
      setServices(data || []);
    }
  };
  const fetchEmployees = async () => {
    const {
      data,
      error
    } = await supabase.from('profiles').select(`
        id,
        full_name,
        employee_services(service_id)
      `).eq('role', 'employee').order('full_name');
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };
  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;
    setLoading(true);

    // Get employees who can perform this service
    const availableEmployees = selectedEmployee ? [selectedEmployee] : employees.filter(emp => emp.employee_services.some(es => es.service_id === selectedService.id));
    if (availableEmployees.length === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // Generate time slots (simplified - in real app would check schedules and existing bookings)
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    // Check existing reservations for this date
    const {
      data: existingReservations
    } = await supabase.from('reservations').select('start_time, end_time, employee_id').eq('appointment_date', selectedDateStr).in('employee_id', availableEmployees.map(emp => emp.id));
    for (const employee of availableEmployees) {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Check if this slot conflicts with existing reservations
          const hasConflict = existingReservations?.some(reservation => {
            if (reservation.employee_id !== employee.id) return false;
            const slotStart = parseISO(`${selectedDateStr}T${timeString}`);
            const slotEnd = addMinutes(slotStart, selectedService.duration_minutes);
            const reservationStart = parseISO(`${selectedDateStr}T${reservation.start_time}`);
            const reservationEnd = parseISO(`${selectedDateStr}T${reservation.end_time}`);
            return slotStart < reservationEnd && slotEnd > reservationStart;
          });

          // Only show slots that don't conflict and are in the future (if today)
          const slotDateTime = parseISO(`${selectedDateStr}T${timeString}`);
          const now = new Date();
          const isToday = isSameDay(selectedDate, now);
          const isFutureSlot = !isToday || isAfter(slotDateTime, now);
          if (!hasConflict && isFutureSlot) {
            slots.push({
              start_time: timeString,
              employee_id: employee.id,
              employee_name: employee.full_name,
              available: true
            });
          }
        }
      }
    }
    setAvailableSlots(slots);
    setLoading(false);
  };
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setSelectedEmployee(null);
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
  const handleBooking = async () => {
    if (!user || !selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    const startTime = selectedSlot.start_time;
    const endTime = format(addMinutes(parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}`), selectedService.duration_minutes), 'HH:mm');
    const {
      error
    } = await supabase.from('reservations').insert({
      client_id: user.id,
      employee_id: selectedSlot.employee_id,
      service_id: selectedService.id,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      notes: notes || null
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Reserva confirmada!",
        description: "Tu cita ha sido reservada exitosamente."
      });

      // Reset form
      setSelectedService(null);
      setSelectedDate(new Date());
      setSelectedSlot(null);
      setSelectedEmployee(null);
      setNotes("");
      setCurrentStep(1);
    }
    setSubmitting(false);
  };
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  const getAvailableEmployees = () => {
    if (!selectedService) return [];
    return employees.filter(emp => emp.employee_services.some(es => es.service_id === selectedService.id));
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
      default:
        return false;
    }
  };
  const progress = currentStep / BOOKING_STEPS.length * 100;
  return <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif font-bold">Reserva tu cita</h1>
        
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              {BOOKING_STEPS.map(step => <div key={step.id} className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>)}
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Selecciona tu servicio
            </CardTitle>
            <CardDescription>Elige entre nuestros tratamientos de lujo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(service => <Card key={service.id} className={`cursor-pointer transition-all hover:shadow-lg ${selectedService?.id === service.id ? 'ring-2 ring-primary shadow-lg' : ''}`} onClick={() => handleServiceSelect(service)}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </Badge>
                        <span className="font-bold text-lg text-primary">{formatPrice(service.price_cents)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </CardContent>
        </Card>}

      {currentStep === 2 && selectedService && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Selecciona la fecha</CardTitle>
              <CardDescription>Elige cuándo te gustaría tu cita</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={date => date < startOfDay(new Date()) || date.getDay() === 0} className="rounded-md border w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicio seleccionado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold">{selectedService.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedService.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <Badge variant="secondary">{selectedService.duration_minutes} min</Badge>
                  <span className="font-bold text-primary">{formatPrice(selectedService.price_cents)}</span>
                </div>
              </div>

              {/* Employee Selection */}
              <div className="space-y-3">
                <Label>Preferencia de especialista (opcional)</Label>
                <Select value={selectedEmployee?.id || "any"} onValueChange={value => {
              if (value === "any") {
                setSelectedEmployee(null);
              } else {
                const employee = employees.find(emp => emp.id === value);
                setSelectedEmployee(employee || null);
              }
            }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier especialista disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Cualquier especialista disponible</SelectItem>
                    {getAvailableEmployees().map(employee => <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {employee.full_name}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>}

      {currentStep === 3 && selectedService && selectedDate && <Card>
          <CardHeader>
            <CardTitle>Horarios disponibles</CardTitle>
            <CardDescription>
              {format(selectedDate, 'EEEE, d MMMM yyyy')}
              {selectedEmployee && ` - con ${selectedEmployee.full_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-center py-8">Cargando horarios disponibles...</div> : availableSlots.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground">No hay horarios disponibles para esta fecha.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Prueba seleccionar otra fecha o especialista.
                </p>
              </div> : <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot, index) => <Button key={index} variant={selectedSlot?.start_time === slot.start_time && selectedSlot?.employee_id === slot.employee_id ? "default" : "outline"} onClick={() => handleSlotSelect(slot)} className="flex flex-col p-3 h-auto">
                    <span className="font-medium">{slot.start_time}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {slot.employee_name}
                    </span>
                  </Button>)}
              </div>}
          </CardContent>
        </Card>}

      {currentStep === 4 && selectedService && selectedDate && selectedSlot && <Card>
          <CardHeader>
            <CardTitle>Confirmar reserva</CardTitle>
            <CardDescription>Revisa los detalles de tu cita</CardDescription>
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
                  <p>{format(selectedDate, 'EEEE, d MMMM yyyy')}</p>
                </div>
                <div>
                  <strong>Hora:</strong>
                  <p>{selectedSlot.start_time}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <strong>Especialista:</strong>
                  <p>{selectedSlot.employee_name}</p>
                </div>
                <div>
                  <strong>Duración:</strong>
                  <p>{selectedService.duration_minutes} minutos</p>
                </div>
                <div>
                  <strong>Precio:</strong>
                  <p className="text-lg font-bold text-primary">{formatPrice(selectedService.price_cents)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea id="notes" placeholder="¿Alguna petición o preferencia especial?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <Button onClick={handleBooking} disabled={submitting || !user} className="w-full" size="lg">
              {submitting ? "Confirmando..." : "Confirmar reserva"}
            </Button>
          </CardContent>
        </Card>}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < 4 && <Button onClick={() => setCurrentStep(Math.min(4, currentStep + 1))} disabled={!canGoNext()}>
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>}
      </div>
    </div>;
};