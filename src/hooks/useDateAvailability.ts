import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BookableItem, Employee } from '@/types/booking';

interface UseDateAvailabilityProps {
  selectedService: BookableItem | null;
  selectedEmployee?: Employee | null;
}

export const useDateAvailability = ({ selectedService, selectedEmployee }: UseDateAvailabilityProps) => {
  const [loading, setLoading] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());

  const checkDateAvailability = useCallback(async (date: Date): Promise<boolean> => {
    if (!selectedService) return false;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    
    // Skip Sundays (day 0)
    if (dayOfWeek === 0) return false;

    try {
      // Get employees who can perform this service/combo
      let availableEmployees: { id: string; full_name: string }[] = [];
      
      if (selectedService.type === 'combo') {
        // For combos, get employees who can perform all services in the combo
        const { data: comboEmployees } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            profiles!inner(id, full_name)
          `)
          .in('service_id', selectedService.combo_services?.map(cs => cs.service_id) || []);

        if (comboEmployees && comboEmployees.length > 0) {
          // Group by employee_id and check if they have all required services
          const employeeServiceCounts = comboEmployees.reduce((acc: Record<string, number>, es) => {
            acc[es.employee_id] = (acc[es.employee_id] || 0) + 1;
            return acc;
          }, {});

          const requiredServiceCount = selectedService.combo_services?.length || 0;
          availableEmployees = comboEmployees
            .filter(es => employeeServiceCounts[es.employee_id] === requiredServiceCount)
            .map(es => ({
              id: es.employee_id,
              full_name: es.profiles?.full_name || ''
            }));
        }
      } else {
        // For individual services
        const { data: employeeServices } = await supabase
          .from('employee_services')
          .select(`
            employee_id,
            profiles!inner(id, full_name)
          `)
          .eq('service_id', selectedService.id);

        if (employeeServices && employeeServices.length > 0) {
          availableEmployees = employeeServices.map(es => ({
            id: es.employee_id,
            full_name: es.profiles?.full_name || ''
          }));
        }
      }

      // Filter by selected employee if specified
      if (selectedEmployee) {
        availableEmployees = availableEmployees.filter(emp => emp.id === selectedEmployee.id);
      }

      // If no employees available, date is not available
      if (availableEmployees.length === 0) {
        return false;
      }

      // Get employee schedules for this day of week
      const employeeIds = availableEmployees.map(emp => emp.id);
      const { data: schedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      // If no schedules available, date is not available
      if (!schedules || schedules.length === 0) {
        return false;
      }

      // Get existing reservations for this date
      const { data: reservations } = await supabase
        .from('reservations')
        .select('start_time, end_time, employee_id')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Get existing combo reservations for this date
      const { data: comboReservations } = await supabase
        .from('combo_reservations')
        .select('start_time, end_time, primary_employee_id')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Get blocked times for this date
      const { data: blockedTimes } = await supabase
        .from('blocked_times')
        .select('*')
        .in('employee_id', employeeIds)
        .eq('date', dateStr);

      // Check if there are any available time slots
      for (const schedule of schedules) {
        const scheduleStart = schedule.start_time;
        const scheduleEnd = schedule.end_time;
        const serviceDuration = selectedService.duration_minutes;

        // Convert time strings to minutes for easier calculation
        const timeToMinutes = (timeString: string) => {
          const [hours, minutes] = timeString.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const minutesToTime = (minutes: number) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const scheduleStartMinutes = timeToMinutes(scheduleStart);
        const scheduleEndMinutes = timeToMinutes(scheduleEnd);

        // Generate time slots for this employee
        for (let time = scheduleStartMinutes; time + serviceDuration <= scheduleEndMinutes; time += 30) {
          const slotStart = minutesToTime(time);
          const slotEnd = minutesToTime(time + serviceDuration);

          // Check if this slot conflicts with existing reservations
          const hasConflict = [
            ...(reservations || []),
            ...(comboReservations || []).map(cr => ({
              start_time: cr.start_time,
              end_time: cr.end_time,
              employee_id: cr.primary_employee_id
            }))
          ].some(reservation => {
            if (reservation.employee_id !== schedule.employee_id) return false;
            
            const resStart = timeToMinutes(reservation.start_time);
            const resEnd = timeToMinutes(reservation.end_time);
            
            return (time < resEnd && time + serviceDuration > resStart);
          });

          // Check if this slot conflicts with blocked times
          const hasBlockedTime = (blockedTimes || []).some(blocked => {
            if (blocked.employee_id !== schedule.employee_id) return false;
            
            const blockedStart = timeToMinutes(blocked.start_time);
            const blockedEnd = timeToMinutes(blocked.end_time);
            
            return (time < blockedEnd && time + serviceDuration > blockedStart);
          });

          // If no conflicts, this date has available slots
          if (!hasConflict && !hasBlockedTime) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  }, [selectedService, selectedEmployee]);

  const preloadAvailabilityForMonth = useCallback(async (year: number, month: number) => {
    if (!selectedService) return;

    setLoading(true);
    const unavailable = new Set<string>();

    try {
      // Get all dates in the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const promises = [];
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateCopy = new Date(date);
        promises.push(
          checkDateAvailability(dateCopy).then(available => {
            if (!available) {
              unavailable.add(format(dateCopy, 'yyyy-MM-dd'));
            }
          })
        );
      }

      await Promise.all(promises);
      setUnavailableDates(unavailable);
    } catch (error) {
      console.error('Error preloading availability:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedService, checkDateAvailability]);

  const isDateUnavailable = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return unavailableDates.has(dateStr);
  }, [unavailableDates]);

  return {
    loading,
    checkDateAvailability,
    preloadAvailabilityForMonth,
    isDateUnavailable,
    unavailableDates
  };
};
