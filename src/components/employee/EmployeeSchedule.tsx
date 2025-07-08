import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const TIME_OPTIONS = [];
for (let hour = 6; hour <= 22; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    TIME_OPTIONS.push(timeString);
  }
}

export const EmployeeSchedule = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchSchedules();
    }
  }, [profile?.id]);

  const fetchSchedules = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('employee_id', profile.id)
      .order('day_of_week');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load schedules",
        variant: "destructive",
      });
    } else {
      // Ensure we have a schedule for each day
      const scheduleByDay = new Map(data?.map(s => [s.day_of_week, s]) || []);
      const fullSchedules = DAYS_OF_WEEK.map(day => 
        scheduleByDay.get(day.value) || {
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_available: false,
        }
      );
      setSchedules(fullSchedules);
    }
    setLoading(false);
  };

  const updateSchedule = async (dayIndex: number, field: keyof Schedule, value: any) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[dayIndex] = { ...updatedSchedules[dayIndex], [field]: value };
    setSchedules(updatedSchedules);

    const schedule = updatedSchedules[dayIndex];
    
    try {
      if (schedule.id) {
        // Update existing schedule
        const { error } = await supabase
          .from('employee_schedules')
          .update({
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_available: schedule.is_available,
          })
          .eq('id', schedule.id);

        if (error) throw error;
      } else if (schedule.is_available) {
        // Create new schedule only if marked as available
        const { data, error } = await supabase
          .from('employee_schedules')
          .insert({
            employee_id: profile?.id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_available: schedule.is_available,
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with the new ID
        updatedSchedules[dayIndex].id = data.id;
        setSchedules(updatedSchedules);
      }

      toast({
        title: "Éxito",
        description: "Horario actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el horario",
        variant: "destructive",
      });
      // Revert the change
      fetchSchedules();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Mi Horario</h2>
        <div className="text-center py-8">Cargando horario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-8 w-8" />
        <h2 className="text-3xl font-serif font-bold">Mi Horario de Trabajo</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Disponibilidad Semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((schedule, index) => (
            <div key={schedule.day_of_week} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={schedule.is_available}
                  onCheckedChange={(checked) => 
                    updateSchedule(index, 'is_available', checked)
                  }
                />
                <Label className="font-medium">
                  {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                </Label>
              </div>

              {schedule.is_available && (
                <>
                  <div>
                    <Label className="text-sm">Hora de inicio</Label>
                    <Select
                      value={schedule.start_time}
                      onValueChange={(value) => updateSchedule(index, 'start_time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Hora de fin</Label>
                    <Select
                      value={schedule.end_time}
                      onValueChange={(value) => updateSchedule(index, 'end_time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Duración: {calculateDuration(schedule.start_time, schedule.end_time)}
                  </div>
                </>
              )}

              {!schedule.is_available && (
                <div className="md:col-span-3 text-sm text-muted-foreground">
                  No disponible este día
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Días laborales:</h4>
              <p className="text-2xl font-bold text-primary">
                {schedules.filter(s => s.is_available).length}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Horas totales por semana:</h4>
              <p className="text-2xl font-bold text-primary">
                {calculateWeeklyHours(schedules)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const calculateDuration = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const diffMinutes = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

const calculateWeeklyHours = (schedules: Schedule[]) => {
  let totalMinutes = 0;
  
  schedules.forEach(schedule => {
    if (schedule.is_available) {
      const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      totalMinutes += endTotalMinutes - startTotalMinutes;
    }
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};