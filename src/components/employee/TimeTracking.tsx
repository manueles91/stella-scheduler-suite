import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeSchedule } from "./EmployeeSchedule";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  AppointmentDialog, 
  BlockedTimeDialog, 
  TypePickerDialog, 
  CalendarView 
} from "./time-tracking";
import { 
  TimeTrackingProps, 
  AppointmentFormData, 
  BlockedTimeFormData, 
  DialogType,
  BlockedTime
} from "@/types/time-tracking";
import { Appointment } from "@/types/appointment";
import { format, convertTo12Hour, formatTimeForSelect } from "@/lib/utils/timeTrackingUtils";

export const TimeTracking = ({ employeeId }: TimeTrackingProps = {}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showBlockedTimes, setShowBlockedTimes] = useState(true);
  const [dialogType, setDialogType] = useState<DialogType>('block');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Form states
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>({
    client_id: '',
    service_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '9:00 AM',
    end_time: '10:00 AM',
    notes: '',
    final_price_cents: 0,
    isCombo: false
  });
  
  const [blockedTimeForm, setBlockedTimeForm] = useState<BlockedTimeFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '9:00 AM',
    end_time: '10:00 AM',
    reason: '',
    is_recurring: false
  });

  const { profile } = useAuth();
  const {
    appointments,
    blockedTimes,
    services,
    clients,
    employees,
    loading,
    loadData,
    createAppointment,
    updateAppointment,
    createBlockedTime,
    updateBlockedTime,
    effectiveEmployeeId
  } = useTimeTracking(employeeId);

  // Add combos state and fetching
  const [combos, setCombos] = useState<any[]>([]);

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select(`
          *,
          combo_services(
            service_id,
            quantity,
            services(id, name, description, duration_minutes, price_cents, image_url)
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (!error && data) setCombos(data);
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
  };

  // Fetch combos when component mounts
  useEffect(() => {
    fetchCombos();
  }, []);

  // Load data when component mounts or date changes
  useEffect(() => {
    if (effectiveEmployeeId) {
      loadData(selectedDate);
    }
  }, [effectiveEmployeeId, selectedDate]);

  const openTimeSlotPicker = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setShowTypePicker(true);
  };

  const openDialog = (type: DialogType, timeSlot?: string) => {
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
        start_time: timeSlot ? convertTo12Hour(timeSlot) : '9:00 AM',
        end_time: '10:00 AM',
        notes: '',
        final_price_cents: 0,
        isCombo: false,
        employee_id: ''
      });
    } else {
      setBlockedTimeForm({
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: timeSlot ? convertTo12Hour(timeSlot) : '9:00 AM',
        end_time: '10:00 AM',
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
    
    const formData = {
      client_id: appointment.client_id || '',
      service_id: appointment.services?.[0]?.id || '',
      date: appointment.appointment_date,
      start_time: formatTimeForSelect(appointment.start_time),
      end_time: formatTimeForSelect(appointment.end_time || ''),
      notes: appointment.notes || '',
      final_price_cents: appointment.final_price_cents || 0,
      isCombo: appointment.isCombo || false,
      employee_id: appointment.employee_id || ''
    };
    
    
    setAppointmentForm(formData);
    setDialogOpen(true);
  };

  const openEditBlockedTime = (blockedTime: BlockedTime) => {
    setEditMode(true);
    setEditingBlockedTime(blockedTime);
    setDialogType('block');
    
    setBlockedTimeForm({
      date: blockedTime.date,
      start_time: convertTo12Hour(blockedTime.start_time),
      end_time: convertTo12Hour(blockedTime.end_time),
      reason: blockedTime.reason,
      is_recurring: blockedTime.is_recurring
    });
    setDialogOpen(true);
  };

  const handleAppointmentSubmit = async () => {
    if (editMode && editingAppointment) {
      const success = await updateAppointment(editingAppointment, appointmentForm);
      if (success) {
        setDialogOpen(false);
        loadData(selectedDate);
      }
    } else {
      const success = await createAppointment(appointmentForm);
      if (success) {
        setDialogOpen(false);
        loadData(selectedDate);
      }
    }
  };

  const handleBlockedTimeSubmit = async () => {
    if (editMode && editingBlockedTime) {
      const success = await updateBlockedTime(editingBlockedTime, blockedTimeForm);
      if (success) {
        setDialogOpen(false);
        loadData(selectedDate);
      }
    } else {
      const success = await createBlockedTime(blockedTimeForm);
      if (success) {
        setDialogOpen(false);
        loadData(selectedDate);
      }
    }
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setEditMode(false);
    setEditingAppointment(null);
    setEditingBlockedTime(null);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Agenda y Horarios</h2>
        <div className="text-center py-8">Cargando agenda...</div>
      </div>
    );
  }

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

      {/* Calendar View */}
      <CalendarView
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        appointments={appointments}
        blockedTimes={blockedTimes}
        showBlockedTimes={showBlockedTimes}
        onTimeSlotClick={openTimeSlotPicker}
        onAppointmentClick={openEditAppointment}
        onBlockedTimeClick={openEditBlockedTime}
        onNavigateDate={navigateDate}
        onTodayClick={handleTodayClick}
      />

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={dialogOpen && dialogType === 'appointment'}
        onOpenChange={setDialogOpen}
        editMode={editMode}
        editingAppointment={editingAppointment}
        appointmentForm={appointmentForm}
        onAppointmentFormChange={setAppointmentForm}
        onEditingAppointmentChange={setEditingAppointment}
        services={services}
        clients={clients}
        employees={employees}
        combos={combos}
        onSubmit={handleAppointmentSubmit}
        onCancel={handleDialogCancel}
        effectiveProfile={profile}
        showPriceField={true}
      />

      {/* Blocked Time Dialog */}
      <BlockedTimeDialog
        open={dialogOpen && dialogType === 'block'}
        onOpenChange={setDialogOpen}
        editMode={editMode}
        editingBlockedTime={editingBlockedTime}
        blockedTimeForm={blockedTimeForm}
        onBlockedTimeFormChange={setBlockedTimeForm}
        onSubmit={handleBlockedTimeSubmit}
        onCancel={handleDialogCancel}
      />

      {/* Type Picker Dialog */}
      <TypePickerDialog
        open={showTypePicker}
        onOpenChange={setShowTypePicker}
        selectedTimeSlot={selectedTimeSlot}
        onAppointmentClick={() => openDialog('appointment', selectedTimeSlot)}
        onBlockTimeClick={() => openDialog('block', selectedTimeSlot)}
      />
    </div>
  );
};
