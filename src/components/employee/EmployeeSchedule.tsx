import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Schedule, DAYS_OF_WEEK } from "./schedule/scheduleTypes";
import { ScheduleItem } from "./schedule/ScheduleItem";
import { ScheduleSummary } from "./schedule/ScheduleSummary";

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
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', profile.id)
        .order('day_of_week');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Ensure we have a schedule for each day
      const scheduleByDay = new Map(data?.map(s => [s.day_of_week, s]) || []);
      const fullSchedules = DAYS_OF_WEEK.map(day => {
        const existingSchedule = scheduleByDay.get(day.value);
        if (existingSchedule) {
          // Normalize time format by removing seconds
          return {
            ...existingSchedule,
            start_time: existingSchedule.start_time.substring(0, 5),
            end_time: existingSchedule.end_time.substring(0, 5),
          };
        }
        return {
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_available: false,
        };
      });
      
      setSchedules(fullSchedules);
      console.log('Schedules loaded successfully:', fullSchedules);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Error al cargar los horarios. Verifique su conexión.",
        variant: "destructive",
      });
      
      // Set default schedules if fetch fails
      const defaultSchedules = DAYS_OF_WEEK.map(day => ({
        day_of_week: day.value,
        start_time: "09:00",
        end_time: "17:00",
        is_available: false,
      }));
      setSchedules(defaultSchedules);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (dayIndex: number, field: keyof Schedule, value: any) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[dayIndex] = { ...updatedSchedules[dayIndex], [field]: value };
    setSchedules(updatedSchedules);

    const schedule = updatedSchedules[dayIndex];
    
    // Validate times before saving
    if (field === 'start_time' || field === 'end_time') {
      if (schedule.start_time >= schedule.end_time) {
        toast({
          title: "Error",
          description: "La hora de inicio debe ser anterior a la hora de fin",
          variant: "destructive",
        });
        // Revert the change
        fetchSchedules();
        return;
      }
    }
    
    try {
      if (schedule.id) {
        // Existing schedule - handle both availability toggle and time updates
        if (!schedule.is_available) {
          // User turned off availability - delete the schedule
          const { error } = await supabase
            .from('employee_schedules')
            .delete()
            .eq('id', schedule.id);

          if (error) throw error;
          
          // Update local state to remove ID
          updatedSchedules[dayIndex].id = undefined;
          setSchedules(updatedSchedules);
        } else {
          // Update existing schedule with new times/availability
          const { error } = await supabase
            .from('employee_schedules')
            .update({
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_available: schedule.is_available,
            })
            .eq('id', schedule.id);

          if (error) throw error;
        }
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
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      
      // Handle specific database errors
      let errorMessage = "Error al actualizar el horario";
      if (error.message?.includes('check_time_order')) {
        errorMessage = "La hora de inicio debe ser anterior a la hora de fin";
      } else if (error.message?.includes('unique_employee_day_schedule')) {
        errorMessage = "Ya existe un horario para este día";
      } else if (error.message?.includes('validate_schedule_times')) {
        errorMessage = error.message || "Horario inválido";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Revert the change by refetching from database
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
            <ScheduleItem
              key={schedule.day_of_week}
              schedule={schedule}
              index={index}
              onUpdate={updateSchedule}
            />
          ))}
        </CardContent>
      </Card>

      <ScheduleSummary schedules={schedules} />
    </div>
  );
};