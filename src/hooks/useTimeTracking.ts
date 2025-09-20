import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppointmentFormData, BlockedTime, BlockedTimeFormData, Customer, Employee, Service } from "@/types/time-tracking";
import { Appointment } from "@/types/appointment";
import { convertTo24Hour, formatTimeForDatabase, calculateEndTime } from "@/lib/utils/timeTrackingUtils";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";

export const useTimeTracking = (employeeId?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile } = useAuth();
  const { toast } = useToast();
  const effectiveEmployeeId = employeeId || profile?.id;

  // Fetch services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch clients (both profiles and invited users)
  const fetchClients = async () => {
    try {
      const [profilesResult, invitedUsersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, account_status, created_at')
          .eq('role', 'client')
          .order('full_name'),
        supabase
          .from('invited_users')
          .select('id, full_name, email, phone, role, account_status, invited_at')
          .order('full_name')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (invitedUsersResult.error) throw invitedUsersResult.error;

      const allClients: Customer[] = [
        ...(profilesResult.data || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone || undefined,
          role: profile.role as 'client' | 'employee' | 'admin',
          account_status: profile.account_status,
          created_at: profile.created_at
        })),
        ...(invitedUsersResult.data || []).map(user => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone || undefined,
          role: user.role as 'client' | 'employee' | 'admin',
          account_status: user.account_status,
          created_at: user.invited_at
        }))
      ];
      
      setClients(allClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');
      if (error) throw error;
      const employeeData: Employee[] = (data || []).filter(profile => 
        profile.role === 'employee' || profile.role === 'admin'
      ) as Employee[];
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch appointments for a specific date
  const fetchAppointments = async (selectedDate: Date) => {
    if (!effectiveEmployeeId) return;
    setLoading(true);
    
    try {
      // Use admin_reservations_view to get both individual and combo reservations
      let query: any = supabase
        .from('admin_reservations_view')
        .select('*');

      if (profile?.role !== 'admin') {
        query = query.eq('employee_id', effectiveEmployeeId);
      }

      const { data, error } = await query
        .gte('appointment_date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfDay(selectedDate), 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .order('appointment_date')
        .order('start_time');

      if (error) throw error;
      
      const formattedAppointments = (data as any[])?.map((appointment: any) => {
        return {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          status: appointment.status,
          notes: appointment.notes,
          client_id: appointment.client_id,
          employee_id: appointment.employee_id,
          final_price_cents: appointment.final_price_cents,
          services: [{
            id: appointment.service_id || '',
            name: appointment.service_name || 'Servicio',
            description: '',
            duration_minutes: appointment.service_duration || 0,
            price_cents: appointment.service_price_cents || 0,
            variable_price: appointment.service_variable_price || false
          }],
          client_profile: {
            full_name: appointment.client_full_name || 'Cliente'
          },
          employee_profile: appointment.employee_full_name ? {
            full_name: appointment.employee_full_name
          } : undefined,
          isCombo: appointment.booking_type === 'combo',
          comboId: appointment.combo_id,
          comboName: appointment.combo_name
        };
      }) || [];
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch blocked times for a specific date
  const fetchBlockedTimes = async (selectedDate: Date) => {
    if (!effectiveEmployeeId) return;
    
    try {
      let query = supabase
        .from('blocked_times')
        .select('*')
        .gte('date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(selectedDate), 'yyyy-MM-dd'));

      if (profile?.role !== 'admin') {
        query = query.eq('employee_id', effectiveEmployeeId);
      }
      
      const { data, error } = await query.order('date').order('start_time');
      
      if (error) {
        console.error('Blocked times fetch error:', error);
        setBlockedTimes([]);
        return;
      }
      
      setBlockedTimes(data || []);
    } catch (error) {
      console.error('Error fetching blocked times:', error);
      setBlockedTimes([]);
    }
  };

  // Create appointment
  const createAppointment = async (appointmentForm: AppointmentFormData) => {
    if (!effectiveEmployeeId || !appointmentForm.client_id || !appointmentForm.service_id) return;
    
    try {
      const selectedService = services.find(s => s.id === appointmentForm.service_id);
      if (!selectedService) return;
      
      const startTime = convertTo24Hour(appointmentForm.start_time);
      const endTime = calculateEndTime(appointmentForm.start_time, selectedService.duration_minutes);
      
      const { error } = await supabase
        .from('reservations')
        .insert({
          client_id: appointmentForm.client_id,
          service_id: appointmentForm.service_id,
          employee_id: appointmentForm.employee_id || effectiveEmployeeId,
          appointment_date: appointmentForm.date,
          start_time: startTime,
          end_time: endTime,
          notes: appointmentForm.notes || null,
          status: 'confirmed',
          final_price_cents: appointmentForm.final_price_cents !== undefined ? appointmentForm.final_price_cents : 0
        });
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cita creada correctamente"
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la cita",
        variant: "destructive"
      });
      return false;
    }
  };

  // Update appointment
  const updateAppointment = async (appointment: Appointment, appointmentForm: AppointmentFormData) => {
    console.log('🔍 updateAppointment called with final_price_cents:', appointmentForm.final_price_cents);
    if (!appointmentForm.client_id || !appointmentForm.service_id) return;
    
    try {
      const startTime = formatTimeForDatabase(appointmentForm.start_time);
      const endTime = formatTimeForDatabase(appointmentForm.end_time);
      
      // Get client information for customer_email and customer_name
      const selectedClient = clients.find(c => c.id === appointmentForm.client_id);
      const customerEmail = selectedClient?.email || null;
      const customerName = selectedClient?.full_name || null;
      
      // Check if this is a combo reservation or individual reservation
      if (appointment.isCombo) {
        // Update combo reservation
        const finalPriceCents = appointmentForm.final_price_cents !== undefined ? appointmentForm.final_price_cents : 0;
        console.log('🔍 updateAppointment - Updating combo reservation with final_price_cents:', finalPriceCents);
        
        const { error } = await supabase
          .from('combo_reservations')
          .update({
            client_id: appointmentForm.client_id,
            primary_employee_id: appointmentForm.employee_id || null,
            appointment_date: appointmentForm.date,
            start_time: startTime,
            end_time: endTime,
            status: appointment.status, // Keep existing status
            notes: appointmentForm.notes || null,
            final_price_cents: finalPriceCents,
            customer_email: customerEmail,
            customer_name: customerName,
          })
          .eq('id', appointment.id);
        
        if (error) throw error;
      } else {
        // Update individual service reservation
        const finalPriceCents = appointmentForm.final_price_cents !== undefined ? appointmentForm.final_price_cents : 0;
        console.log('🔍 updateAppointment - Updating individual reservation with final_price_cents:', finalPriceCents);
        
        const { error } = await supabase
          .from('reservations')
          .update({
            client_id: appointmentForm.client_id,
            service_id: appointmentForm.service_id,
            employee_id: appointmentForm.employee_id || null,
            appointment_date: appointmentForm.date,
            start_time: startTime,
            end_time: endTime,
            status: appointment.status, // Keep existing status
            notes: appointmentForm.notes || null,
            final_price_cents: finalPriceCents,
            customer_email: customerEmail,
            customer_name: customerName,
          })
          .eq('id', appointment.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente"
      });
      
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la cita",
        variant: "destructive"
      });
      return false;
    }
  };

  // Create blocked time
  const createBlockedTime = async (blockedTimeForm: BlockedTimeFormData) => {
    if (!effectiveEmployeeId) return;

    const startTime24 = convertTo24Hour(blockedTimeForm.start_time);
    const endTime24 = convertTo24Hour(blockedTimeForm.end_time);
    
    if (startTime24 >= endTime24) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_times')
        .insert({
          employee_id: effectiveEmployeeId,
          date: blockedTimeForm.date,
          start_time: startTime24,
          end_time: endTime24,
          reason: blockedTimeForm.reason || 'Tiempo bloqueado',
          is_recurring: blockedTimeForm.is_recurring
        });
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Tiempo bloqueado correctamente"
      });
      
      return true;
    } catch (error: any) {
      console.error('Blocked time creation error:', error);
      let errorMessage = "Error al bloquear el tiempo";
      if (error.message?.includes('blocked_times')) {
        errorMessage = "Error en la base de datos. Contacte al administrador.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  // Update blocked time
  const updateBlockedTime = async (blockedTime: BlockedTime, blockedTimeForm: BlockedTimeFormData) => {
    const startTime24 = convertTo24Hour(blockedTimeForm.start_time);
    const endTime24 = convertTo24Hour(blockedTimeForm.end_time);
    
    if (startTime24 >= endTime24) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_times')
        .update({
          date: blockedTimeForm.date,
          start_time: startTime24,
          end_time: endTime24,
          reason: blockedTimeForm.reason || 'Tiempo bloqueado',
          is_recurring: blockedTimeForm.is_recurring
        })
        .eq('id', blockedTime.id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Tiempo bloqueado actualizado correctamente"
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el tiempo bloqueado",
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete blocked time
  const deleteBlockedTime = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Tiempo desbloqueado correctamente"
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desbloquear el tiempo",
        variant: "destructive"
      });
      return false;
    }
  };

  // Load all data
  const loadData = async (selectedDate: Date) => {
    await Promise.all([
      fetchServices(),
      fetchClients(),
      fetchEmployees(),
      fetchAppointments(selectedDate),
      fetchBlockedTimes(selectedDate)
    ]);
  };

  return {
    // State
    appointments,
    blockedTimes,
    services,
    clients,
    employees,
    loading,
    
    // Actions
    loadData,
    fetchAppointments,
    fetchBlockedTimes,
    createAppointment,
    updateAppointment,
    createBlockedTime,
    updateBlockedTime,
    deleteBlockedTime,
    
    // Utils
    effectiveEmployeeId
  };
};
