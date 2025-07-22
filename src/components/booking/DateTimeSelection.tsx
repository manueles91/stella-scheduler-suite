import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  time: string;
  employee_id?: string;
  employee_name?: string;
  available: boolean;
}

interface DateTimeSelectionProps {
  selectedService: any;
  selectedEmployee: any;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string, employeeId?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DateTimeSelection = ({
  selectedService,
  selectedEmployee,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onNext,
  onBack
}: DateTimeSelectionProps) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService, selectedEmployee]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      
      // Get employee schedules for this day
      let scheduleQuery = supabase
        .from('employee_schedules')
        .select(`
          employee_id,
          start_time,
          end_time,
          profiles (
            id,
            full_name
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (selectedEmployee) {
        scheduleQuery = scheduleQuery.eq('employee_id', selectedEmployee.id);
      }

      const { data: schedules, error: scheduleError } = await scheduleQuery;

      if (scheduleError) {
        console.error('Error fetching schedules:', scheduleError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los horarios",
          variant: "destructive",
        });
        return;
      }

      // Get existing reservations for this date
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('start_time, end_time, employee_id')
        .eq('appointment_date', dateStr)
        .eq('status', 'confirmed');

      if (reservationError) {
        console.error('Error fetching reservations:', reservationError);
      }

      // Get blocked times for this date
      const { data: blockedTimes, error: blockedError } = await supabase
        .from('blocked_times')
        .select('start_time, end_time, employee_id')
        .eq('date', dateStr);

      if (blockedError) {
        console.error('Error fetching blocked times:', blockedError);
      }

      // Generate available time slots
      const slots = generateTimeSlots(
        schedules || [],
        reservations || [],
        blockedTimes || [],
        selectedService.duration_minutes
      );

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cargar disponibilidad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (schedules: any[], reservations: any[], blockedTimes: any[], serviceDuration: number) => {
    const slots: TimeSlot[] = [];
    
    schedules.forEach(schedule => {
      const startTime = schedule.start_time;
      const endTime = schedule.end_time;
      const employeeId = schedule.employee_id;
      const employeeName = schedule.profiles?.full_name;

      // Convert times to minutes for easier calculation
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      // Generate 30-minute slots
      for (let minutes = startMinutes; minutes < endMinutes - serviceDuration; minutes += 30) {
        const slotTime = minutesToTime(minutes);
        const slotEndMinutes = minutes + serviceDuration;

        // Check if this slot conflicts with existing reservations
        const hasConflict = reservations.some(reservation => {
          if (reservation.employee_id !== employeeId) return false;
          
          const resStart = timeToMinutes(reservation.start_time);
          const resEnd = timeToMinutes(reservation.end_time);
          
          return (minutes < resEnd && slotEndMinutes > resStart);
        });

        // Check if this slot conflicts with blocked times
        const isBlocked = blockedTimes.some(blocked => {
          if (blocked.employee_id !== employeeId) return false;
          
          const blockStart = timeToMinutes(blocked.start_time);
          const blockEnd = timeToMinutes(blocked.end_time);
          
          return (minutes < blockEnd && slotEndMinutes > blockStart);
        });

        slots.push({
          time: slotTime,
          employee_id: employeeId,
          employee_name: employeeName,
          available: !hasConflict && !isBlocked
        });
      }
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30); // Allow booking up to 30 days in advance

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecciona fecha y hora</h2>
        <p className="text-muted-foreground">Elige cuándo quieres tu cita</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              disabled={(date) => isBefore(date, today) || date > maxDate}
              locale={es}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-center py-8">
                Selecciona una fecha para ver los horarios disponibles
              </p>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Cargando horarios...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay horarios disponibles para esta fecha
              </p>
            ) : (
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {availableSlots
                  .filter(slot => slot.available)
                  .map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className="justify-between h-auto p-3"
                      onClick={() => onTimeSelect(slot.time, slot.employee_id)}
                    >
                      <span>{slot.time}</span>
                      {slot.employee_name && (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          {slot.employee_name}
                        </Badge>
                      )}
                    </Button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onNext} disabled={!selectedDate || !selectedTime}>
          Continuar
        </Button>
      </div>
    </div>
  );
};