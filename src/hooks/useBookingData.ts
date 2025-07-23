import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Service, Employee, TimeSlot } from "@/types/booking";
import { format, addMinutes, parseISO, isSameDay, isAfter } from "date-fns";

export const useBookingData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchEmployees();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          display_order
        )
      `)
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
      .eq('role', 'employee')
      .order('full_name');

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAvailableSlots = useCallback(async (
    selectedService: Service | null,
    selectedDate: Date | undefined,
    selectedEmployee: Employee | null
  ): Promise<TimeSlot[]> => {
    if (!selectedService || !selectedDate) return [];

    setLoading(true);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      
      // Skip Sundays (day 0)
      if (dayOfWeek === 0) {
        return [];
      }

      // Get employees who can perform this service
      let availableEmployees = selectedEmployee 
        ? [selectedEmployee] 
        : employees.filter(emp => emp.employee_services.some(es => es.service_id === selectedService.id));
      
      // Fallback: if no employees are assigned to this service, use all employees
      if (availableEmployees.length === 0 && employees.length > 0) {
        availableEmployees = employees;
      }
      
      // If still no employees, create a dummy employee for demo purposes
      if (availableEmployees.length === 0) {
        const demoEmployee: Employee = {
          id: 'demo-employee',
          full_name: 'Estilista Disponible',
          employee_services: [{ service_id: selectedService.id }]
        };
        availableEmployees = [demoEmployee];
      }

      // Get existing reservations for this date
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (reservationError) {
        console.error('Error fetching reservations:', reservationError);
        return [];
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
      return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    } finally {
      setLoading(false);
    }
  }, [employees]);

  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100)}`;
  };

  return {
    services,
    categories,
    employees,
    loading,
    fetchAvailableSlots,
    formatPrice,
  };
}; 