import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Shield, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isToday, startOfDay, endOfDay, isSameDay, parseISO, addDays, subDays, startOfWeek, addMinutes, differenceInMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmployeeSchedule } from "./EmployeeSchedule";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";
import { EditableAppointment } from "@/components/dashboard/EditableAppointment";
import { Appointment } from "@/types/appointment";

interface BlockedTime {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_recurring: boolean;
  created_at: string;
}

const TIME_SLOTS = [];
for (let hour = 6; hour <= 22; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    TIME_SLOTS.push(timeString);
  }
}

// Add calendar view constants
const HOUR_HEIGHT = 60; // pixels per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / 60; // pixels per minute

interface TimeTrackingProps {
  employeeId?: string;
}

export const TimeTracking = ({ employeeId }: TimeTrackingProps = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showBlockedTimes, setShowBlockedTimes] = useState(true);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [dialogType, setDialogType] = useState<'appointment' | 'block'>('block');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Add appointment form state
  const [appointmentForm, setAppointmentForm] = useState<{
    client_id: string;
    service_id: string;
    date: string;
    start_time: string;
    end_time: string;
    notes: string;
  }>({
    client_id: '',
    service_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    notes: ''
  });
  
  const [blockTimeForm, setBlockTimeForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    reason: '',
    is_recurring: false
  });

  const { profile } = useAuth();
  const { toast } = useToast();
  const effectiveEmployeeId = employeeId || profile?.id;

  // Update week days when selected date changes
  useEffect(() => {
    updateWeekDays();
  }, [selectedDate]);
  
  useEffect(() => {
    if (effectiveEmployeeId) {
      // Fetch services first, then appointments
      const loadData = async () => {
        await fetchServices();
        await fetchClients();
        await fetchEmployees();
        await fetchAppointments();
        await fetchBlockedTimes();
      };
      loadData();
    }
  }, [effectiveEmployeeId, selectedDate]);

  const updateWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    setWeekDays(days);
  };

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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'client')
        .order('full_name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const openTimeSlotPicker = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setShowTypePicker(true);
  };

  const openDialog = (type: 'appointment' | 'block', timeSlot?: string) => {
    setDialogType(type);
    setEditMode(false);
    setEditingAppointment(null);
    setEditingBlockedTime(null);
    setSelectedTimeSlot(timeSlot || '');
    
    if (type === 'appointment') {
      setAppointmentForm({
        client_id: '',
        service_id: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: timeSlot || '09:00',
        end_time: '10:00',
        notes: ''
      });
    } else {
      setBlockTimeForm({
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: timeSlot || '09:00',
        end_time: timeSlot ? format(addMinutes(parseISO(`2000-01-01T${timeSlot}`), 60), 'HH:mm') : '10:00',
        reason: '',
        is_recurring: false
      });
    }
    setShowTypePicker(false);
    setDialogOpen(true);
  };

  const openEditAppointment = (appointment: Appointment) => {
    setEditMode(true);
    setEditingAppointment(appointment);
    setDialogType('appointment');
    
    // Populate the form with appointment data
    setAppointmentForm({
      client_id: appointment.client_id || '',
      service_id: appointment.services?.[0]?.id || '',
      date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time || '',
      notes: appointment.notes || ''
    });
    
    setDialogOpen(true);
  };

  const openEditBlockedTime = (blockedTime: BlockedTime) => {
    setEditMode(true);
    setEditingBlockedTime(blockedTime);
    setDialogType('block');
    
    setBlockTimeForm({
      date: blockedTime.date,
      start_time: blockedTime.start_time,
      end_time: blockedTime.end_time,
      reason: blockedTime.reason,
      is_recurring: blockedTime.is_recurring
    });
    setDialogOpen(true);
  };

  const createAppointment = async () => {
    if (!effectiveEmployeeId || !appointmentForm.client_id || !appointmentForm.service_id) return;
    
    try {
      const selectedService = services.find(s => s.id === appointmentForm.service_id);
      if (!selectedService) return;
      
      const startTime = appointmentForm.start_time;
      const endTime = format(
        addMinutes(parseISO(`${appointmentForm.date}T${startTime}`), selectedService.duration_minutes), 
        'HH:mm'
      );
      
      const { error } = await supabase
        .from('reservations')
        .insert({
          client_id: appointmentForm.client_id,
          service_id: appointmentForm.service_id,
          employee_id: effectiveEmployeeId,
          appointment_date: appointmentForm.date,
          start_time: startTime,
          end_time: endTime,
          notes: appointmentForm.notes || null,
          status: 'confirmed'
        });
        
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cita creada correctamente"
      });
      
      setDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la cita",
        variant: "destructive"
      });
    }
  };

  const updateAppointment = async () => {
    if (!editingAppointment || !editingAppointment.client_id || !editingAppointment.services?.[0]?.id) return;
    
    try {
      const selectedService = services.find(s => s.id === editingAppointment.services?.[0]?.id);
      if (!selectedService) return;
      
      const startTime = editingAppointment.start_time;
      const endTime = format(
        addMinutes(parseISO(`${editingAppointment.appointment_date}T${startTime}`), selectedService.duration_minutes), 
        'HH:mm'
      );
      
      const { error } = await supabase
        .from('reservations')
        .update({
          client_id: editingAppointment.client_id,
          service_id: editingAppointment.services[0].id,
          employee_id: editingAppointment.employee_id || null,
          appointment_date: editingAppointment.appointment_date,
          start_time: startTime,
          end_time: endTime,
          status: editingAppointment.status,
          notes: editingAppointment.notes || null,
        })
        .eq('id', editingAppointment.id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente"
      });
      
      setDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la cita",
        variant: "destructive"
      });
    }
  };

  const calculateEventStyle = (startTime: string, endTime: string) => {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    const duration = differenceInMinutes(end, start);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const top = (startHour - 6) * HOUR_HEIGHT + startMinute * MINUTE_HEIGHT;
    const height = duration * MINUTE_HEIGHT;
    
    return {
      position: 'absolute' as const,
      top: `${top}px`,
      height: `${height}px`,
      left: '0px',
      right: '8px',
      zIndex: 10
    };
  };

  const renderTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(
        <div key={hour} className="relative border-b border-gray-200" style={{ height: `${HOUR_HEIGHT}px` }}>
          <div className="absolute left-0 top-0 w-16 h-full flex items-start justify-end pr-2 pt-1">
            <span className="text-xs text-gray-500 font-medium">
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </span>
          </div>
          <div className="ml-16 h-full bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200"></div>
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 hover:bg-blue-50" 
              onClick={() => openTimeSlotPicker(`${hour.toString().padStart(2, '0')}:00`)}
            ></div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-1/2 hover:bg-blue-50" 
              onClick={() => openTimeSlotPicker(`${hour.toString().padStart(2, '0')}:30`)}
            ></div>
          </div>
        </div>
      );
    }
    return slots;
  };

  const renderCalendarAppointments = () => {
    return appointments.map(appointment => (
      <div
        key={appointment.id}
        className={`${appointment.isCombo ? 'bg-purple-500' : 'bg-blue-500'} text-white rounded-lg p-2 shadow-sm cursor-pointer hover:opacity-90 transition-colors`}
        style={calculateEventStyle(appointment.start_time, appointment.end_time)}
        onClick={() => openEditAppointment(appointment)}
      >
        <div className="text-sm font-medium truncate flex items-center gap-1">
          {appointment.isCombo && (
            <span className="text-xs bg-white/20 px-1 rounded">COMBO</span>
          )}
          {appointment.client_profile?.full_name}
        </div>
        <div className="text-xs opacity-90 truncate">
          {appointment.isCombo ? `${appointment.comboName} (Combo)` : appointment.services?.[0]?.name}
        </div>
        {profile?.role === 'admin' && appointment.employee_profile?.full_name && (
          <div className="text-xs opacity-75 truncate">Con: {appointment.employee_profile.full_name}</div>
        )}
        <div className="text-xs opacity-75">{appointment.start_time} - {appointment.end_time}</div>
      </div>
    ));
  };

  const renderCalendarBlockedTimes = () => {
    return blockedTimes.map(blocked => (
      <div
        key={blocked.id}
        className="bg-red-500 text-white rounded-lg p-2 shadow-sm cursor-pointer hover:bg-red-600 transition-colors"
        style={calculateEventStyle(blocked.start_time, blocked.end_time)}
        onClick={() => openEditBlockedTime(blocked)}
      >
        <div className="text-sm font-medium truncate">Bloqueado</div>
        <div className="text-xs opacity-90 truncate">{blocked.reason}</div>
        <div className="text-xs opacity-75">{blocked.start_time} - {blocked.end_time}</div>
      </div>
    ));
  };

  const renderCalendarView = () => {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header with date navigation */}
        <div className="bg-white shadow-sm border-b px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent min-w-0 flex-1">
                    <h1 className="text-sm sm:text-lg font-semibold cursor-pointer hover:text-primary transition-colors truncate">
                      {(() => {
                        const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()];
                        const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedDate.getMonth()];
                        return `${dayName}, ${selectedDate.getDate()} ${monthName}, ${selectedDate.getFullYear()}`;
                      })()}
                      {isToday(selectedDate) && <Badge className="ml-2 hidden sm:inline-flex">Hoy</Badge>}
                    </h1>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => setSelectedDate(new Date())} variant="outline" size="sm" className="flex-shrink-0">
              Hoy
            </Button>
          </div>
        </div>

        {/* Week navigation */}
        <div className="bg-white border-b px-4 py-2">
          <div className="flex gap-1">
            {weekDays.map(day => (
              <Button
                key={day.toISOString()}
                variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDate(day)}
                className="flex-1 flex flex-col items-center py-2 h-auto"
              >
                <span className="text-xs font-medium">{format(day, 'EEE')}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar view */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="relative" style={{ height: `${17 * HOUR_HEIGHT}px` }}>
              {renderTimeSlots()}
              {renderCalendarAppointments()}
              {showBlockedTimes && renderCalendarBlockedTimes()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchAppointments = async () => {
    if (!effectiveEmployeeId) return;
    setLoading(true);
    
    try {
      // Query reservations directly to get service_id and proper data
      let query = supabase
        .from('reservations')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          client_id,
          employee_id,
          service_id,
          final_price_cents,
          customer_name,
          customer_email,
          services!inner(
            id,
            name,
            description,
            duration_minutes,
            price_cents
          ),
          client_profile:profiles!client_id(
            id,
            full_name,
            email
          ),
          employee_profile:profiles!employee_id(
            id,
            full_name,
            email
          )
        `);

      // Only filter by employee_id if the user is not an admin
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
      
      const formattedAppointments = data?.map(appointment => ({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        client_id: appointment.client_id,
        employee_id: appointment.employee_id,
        services: [{
          id: appointment.service_id,
          name: appointment.services?.name || 'Servicio',
          description: appointment.services?.description || '',
          duration_minutes: appointment.services?.duration_minutes || 0,
          price_cents: appointment.services?.price_cents || 0
        }],
        client_profile: {
          full_name: appointment.customer_name || appointment.client_profile?.full_name || 'Cliente'
        },
        employee_profile: appointment.employee_profile ? {
          full_name: appointment.employee_profile.full_name
        } : undefined,
        // Add combo information (not applicable for individual reservations)
        isCombo: false,
        comboId: null,
        comboName: null
      })) || [];
      
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

  const fetchBlockedTimes = async () => {
    if (!effectiveEmployeeId) return;
    
    try {
      // Build query - admins see all blocked times, employees see only their own
      let query = supabase
        .from('blocked_times')
        .select('*')
        .gte('date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(selectedDate), 'yyyy-MM-dd'));

      // If not admin, filter by employee_id
      if (profile?.role !== 'admin') {
        query = query.eq('employee_id', effectiveEmployeeId);
      }
      
      const { data, error } = await query.order('date').order('start_time');
      
      if (error) {
        console.error('Blocked times fetch error:', error);
        // If table doesn't exist or other error, just set empty array
        setBlockedTimes([]);
        return;
      }
      
      setBlockedTimes(data || []);
      console.log('Blocked times loaded successfully:', data?.length || 0, 'entries');
    } catch (error) {
      console.error('Error fetching blocked times:', error);
      setBlockedTimes([]);
    }
  };

  const createBlockedTime = async () => {
    if (!effectiveEmployeeId) return;

    // Validate times before saving
    if (blockTimeForm.start_time >= blockTimeForm.end_time) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_times')
        .insert({
          employee_id: effectiveEmployeeId,
          date: blockTimeForm.date,
          start_time: blockTimeForm.start_time,
          end_time: blockTimeForm.end_time,
          reason: blockTimeForm.reason || 'Tiempo bloqueado',
          is_recurring: blockTimeForm.is_recurring
        });
        
      if (error) {
        console.error('Error creating blocked time:', error);
        throw error;
      }
      
      toast({
        title: "Éxito",
        description: "Tiempo bloqueado correctamente"
      });
      
      setDialogOpen(false);
      fetchBlockedTimes();
      resetBlockTimeForm();
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
    }
  };

  const updateBlockedTime = async () => {
    if (!editingBlockedTime) return;

    // Validate times before saving
    if (blockTimeForm.start_time >= blockTimeForm.end_time) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_times')
        .update({
          date: blockTimeForm.date,
          start_time: blockTimeForm.start_time,
          end_time: blockTimeForm.end_time,
          reason: blockTimeForm.reason || 'Tiempo bloqueado',
          is_recurring: blockTimeForm.is_recurring
        })
        .eq('id', editingBlockedTime.id);
      
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Tiempo bloqueado actualizado correctamente"
      });
      
      setDialogOpen(false);
      fetchBlockedTimes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el tiempo bloqueado",
        variant: "destructive"
      });
    }
  };

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
      
      fetchBlockedTimes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desbloquear el tiempo",
        variant: "destructive"
      });
    }
  };

  const resetBlockTimeForm = () => {
    setBlockTimeForm({
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '10:00',
      reason: '',
      is_recurring: false
    });
  };

  const getSelectedDateAppointments = () => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.appointment_date), selectedDate)
    );
  };

  const getSelectedDateBlockedTimes = () => {
    return blockedTimes.filter(blocked => 
      isSameDay(parseISO(blocked.date), selectedDate)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      case 'no_show':
        return 'No asistió';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Agenda y Horarios</h2>
        <div className="text-center py-8">Cargando agenda...</div>
      </div>
    );
  }

  const selectedDateAppointments = getSelectedDateAppointments();
  const selectedDateBlockedTimes = getSelectedDateBlockedTimes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          <h2 className="text-3xl font-serif font-bold">Mi Agenda</h2>
        </div>
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <Clock className="h-4 w-4" />
              Mi Horario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mi Horario</DialogTitle>
            </DialogHeader>
            <EmployeeSchedule employeeId={effectiveEmployeeId} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Render only calendar view (daily view) */}
      {renderCalendarView()}

      {/* Dialog for calendar view */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'appointment' ? 
                (editMode ? 'Editar Cita' : 'Nueva Cita') : 
                (editMode ? 'Editar Tiempo Bloqueado' : 'Bloquear Tiempo')
              }
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'appointment' ? (
            <div className="space-y-4">
              {editMode && editingAppointment ? (
                <div className="space-y-4">
                  <div>
                    <Label>Cliente</Label>
                    <CustomerSelectorModal
                      value={clients.find(c => c.id === editingAppointment.client_id) || null}
                      onValueChange={(customer) => {
                        // Update the appointment data
                        setEditingAppointment({
                          ...editingAppointment,
                          client_id: customer?.id || '',
                          client_profile: customer ? { full_name: customer.full_name } : undefined
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label>Servicio</Label>
                    <Select 
                      value={editingAppointment.services?.[0]?.id || ''} 
                      onValueChange={value => {
                        const selectedService = services.find(s => s.id === value);
                        if (selectedService) {
                          setEditingAppointment({
                            ...editingAppointment,
                            services: [{
                              id: selectedService.id,
                              name: selectedService.name,
                              description: selectedService.description || '',
                              duration_minutes: selectedService.duration_minutes,
                              price_cents: selectedService.price_cents
                            }]
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration_minutes} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fecha</Label>
                    <Input 
                      type="date" 
                      value={editingAppointment.appointment_date} 
                      onChange={e => setEditingAppointment({
                        ...editingAppointment,
                        appointment_date: e.target.value
                      })} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Hora Inicio</Label>
                      <Select 
                        value={editingAppointment.start_time} 
                        onValueChange={value => setEditingAppointment({
                          ...editingAppointment,
                          start_time: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hora Fin</Label>
                      <Select 
                        value={editingAppointment.end_time} 
                        onValueChange={value => setEditingAppointment({
                          ...editingAppointment,
                          end_time: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Estilista</Label>
                    <Select 
                      value={editingAppointment.employee_id || 'unassigned'} 
                      onValueChange={value => setEditingAppointment({
                        ...editingAppointment,
                        employee_id: value === 'unassigned' ? undefined : value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estilista" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Sin estilista asignado</SelectItem>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Estado</Label>
                    <Select 
                      value={editingAppointment.status} 
                      onValueChange={value => setEditingAppointment({
                        ...editingAppointment,
                        status: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmada</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notas</Label>
                    <Textarea 
                      placeholder="Notas adicionales..." 
                      value={editingAppointment.notes || ''} 
                      onChange={e => setEditingAppointment({
                        ...editingAppointment,
                        notes: e.target.value
                      })} 
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => updateAppointment()} className="flex-1">
                      Actualizar Cita
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client">Cliente</Label>
                    <CustomerSelectorModal
                      value={clients.find(c => c.id === appointmentForm.client_id) || null}
                      onValueChange={(customer) => {
                        setAppointmentForm({
                          ...appointmentForm,
                          client_id: customer?.id || ''
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="service">Servicio</Label>
                    <Select 
                      value={appointmentForm.service_id} 
                      onValueChange={value => setAppointmentForm({
                        ...appointmentForm,
                        service_id: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration_minutes} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Fecha</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={appointmentForm.date} 
                      onChange={e => setAppointmentForm({
                        ...appointmentForm,
                        date: e.target.value
                      })} 
                    />
                  </div>

                  <div>
                    <Label htmlFor="start_time">Hora de inicio</Label>
                    <Select 
                      value={appointmentForm.start_time} 
                      onValueChange={value => setAppointmentForm({
                        ...appointmentForm,
                        start_time: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Notas adicionales..." 
                      value={appointmentForm.notes} 
                      onChange={e => setAppointmentForm({
                        ...appointmentForm,
                        notes: e.target.value
                      })} 
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createAppointment} className="flex-1">
                      Crear Cita
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="block_date">Fecha</Label>
                <Input 
                  id="block_date" 
                  type="date" 
                  value={blockTimeForm.date} 
                  onChange={e => setBlockTimeForm({
                    ...blockTimeForm,
                    date: e.target.value
                  })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="block_start">Hora de inicio</Label>
                  <Select 
                    value={blockTimeForm.start_time} 
                    onValueChange={value => setBlockTimeForm({
                      ...blockTimeForm,
                      start_time: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="block_end">Hora de fin</Label>
                  <Select 
                    value={blockTimeForm.end_time} 
                    onValueChange={value => setBlockTimeForm({
                      ...blockTimeForm,
                      end_time: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Ej: Reunión, descanso, formación..." 
                  value={blockTimeForm.reason} 
                  onChange={e => setBlockTimeForm({
                    ...blockTimeForm,
                    reason: e.target.value
                  })} 
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={editMode ? updateBlockedTime : createBlockedTime} className="flex-1">
                  {editMode ? 'Actualizar Tiempo Bloqueado' : 'Bloquear Tiempo'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Type Picker Dialog */}
      <Dialog open={showTypePicker} onOpenChange={setShowTypePicker}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Qué te gustaría hacer a las {selectedTimeSlot}?
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={() => openDialog('appointment', selectedTimeSlot)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Nueva Cita
              </Button>
              <Button 
                onClick={() => openDialog('block', selectedTimeSlot)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Bloquear Tiempo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
