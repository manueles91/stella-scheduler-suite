import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO, isSameDay } from "date-fns";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
}

interface TimeSlot {
  start_time: string;
  employee_id?: string;
  employee_name?: string;
}

export const BookingSystem = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

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
    } else {
      setServices(data || []);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;

    // For demo purposes, generate some available time slots
    // In a real app, this would check employee schedules and existing bookings
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          start_time: timeString,
          employee_name: "Available Staff"
        });
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!user || !selectedService || !selectedDate || !selectedSlot) return;

    setLoading(true);

    const startTime = selectedSlot.start_time;
    const endTime = format(
      addMinutes(
        parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}`),
        selectedService.duration_minutes
      ),
      'HH:mm'
    );

    const { error } = await supabase
      .from('reservations')
      .insert({
        client_id: user.id,
        service_id: selectedService.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your appointment has been booked!",
      });
      
      // Reset form
      setSelectedService(null);
      setSelectedSlot(null);
      setNotes("");
    }

    setLoading(false);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif font-bold">Reserva tu cita</h1>
        <p className="text-lg text-muted-foreground">Elige tu servicio y horario preferido</p>
      </div>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona un servicio</CardTitle>
          <CardDescription>Elige entre nuestros tratamientos de lujo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover:shadow-luxury ${
                  selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedService(service)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{service.duration_minutes} min</Badge>
                      <span className="font-bold text-primary">{formatPrice(service.price_cents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedService && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Selecciona la fecha</CardTitle>
              <CardDescription>Elige la fecha de tu cita</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates and Sundays
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Horarios disponibles</CardTitle>
              <CardDescription>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate && (
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedSlot?.start_time === slot.start_time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSlot(slot)}
                      className="text-xs"
                    >
                      {slot.start_time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedService && selectedDate && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de la reserva</CardTitle>
            <CardDescription>Revisa los detalles de tu cita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <strong>Service:</strong> {selectedService.name}
              </div>
              <div>
                <strong>Date:</strong> {format(selectedDate, 'MMM d, yyyy')}
              </div>
              <div>
                <strong>Time:</strong> {selectedSlot.start_time}
              </div>
              <div>
                <strong>Duration:</strong> {selectedService.duration_minutes} minutes
              </div>
              <div>
                <strong>Price:</strong> {formatPrice(selectedService.price_cents)}
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

            <Button 
              onClick={handleBooking} 
              disabled={loading || !user}
              className="w-full"
              size="lg"
            >
              {loading ? "Reservando..." : "Confirmar reserva"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};