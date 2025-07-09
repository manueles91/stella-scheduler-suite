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
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { format, isToday, startOfDay, endOfDay, isSameDay, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

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

export const TimeTracking = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showBlockedTimes, setShowBlockedTimes] = useState(true);
  
  const [blockTimeForm, setBlockTimeForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    reason: '',
    is_recurring: false,
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchAppointments();
      fetchBlockedTimes();
    }
  }, [profile?.id, selectedDate]);

  const fetchAppointments = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          profiles!reservations_client_id_fkey(full_name),
          services(name)
        `)
        .eq('employee_id', profile.id)
        .gte('appointment_date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfDay(selectedDate), 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (error) throw error;

      const formattedAppointments = data?.map(appointment => ({
        id: appointment.id,
        client_name: appointment.profiles?.full_name || 'Cliente',
        service_name: appointment.services?.name || 'Servicio',
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar las citas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedTimes = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .eq('employee_id', profile.id)
        .gte('date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(selectedDate), 'yyyy-MM-dd'))
        .order('date')
        .order('start_time');

      if (error) {
        console.log('Blocked times table not found, will create when needed');
        setBlockedTimes([]);
        return;
      }

      setBlockedTimes(data || []);
    } catch (error) {
      console.log('Error fetching blocked times:', error);
      setBlockedTimes([]);
    }
  };

  const createBlockedTime = async () => {
    if (!profile?.id) return;
    
    try {
      const { error } = await supabase
        .from('blocked_times')
        .insert({
          employee_id: profile.id,
          date: blockTimeForm.date,
          start_time: blockTimeForm.start_time,
          end_time: blockTimeForm.end_time,
          reason: blockTimeForm.reason,
          is_recurring: blockTimeForm.is_recurring,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tiempo bloqueado correctamente",
      });

      setDialogOpen(false);
      resetBlockTimeForm();
      fetchBlockedTimes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al bloquear el tiempo",
        variant: "destructive",
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
        description: "Tiempo desbloqueado correctamente",
      });

      fetchBlockedTimes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desbloquear el tiempo",
        variant: "destructive",
      });
    }
  };

  const resetBlockTimeForm = () => {
    setBlockTimeForm({
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '10:00',
      reason: '',
      is_recurring: false,
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
          <h2 className="text-3xl font-serif font-bold">Agenda y Horarios</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBlockedTimes(!showBlockedTimes)}
          >
            {showBlockedTimes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBlockedTimes ? 'Ocultar' : 'Mostrar'} bloqueados
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetBlockTimeForm}>
                <Plus className="h-4 w-4 mr-2" />
                Bloquear Tiempo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloquear Tiempo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={blockTimeForm.date}
                    onChange={(e) => setBlockTimeForm({ ...blockTimeForm, date: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Hora de inicio</Label>
                    <Select
                      value={blockTimeForm.start_time}
                      onValueChange={(value) => setBlockTimeForm({ ...blockTimeForm, start_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Hora de fin</Label>
                    <Select
                      value={blockTimeForm.end_time}
                      onValueChange={(value) => setBlockTimeForm({ ...blockTimeForm, end_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
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
                    onChange={(e) => setBlockTimeForm({ ...blockTimeForm, reason: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createBlockedTime} className="flex-1">
                    Bloquear Tiempo
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Agenda del {format(selectedDate, 'dd/MM/yyyy')}
              {isToday(selectedDate) && <Badge className="ml-2">Hoy</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Appointments */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Citas programadas ({selectedDateAppointments.length})
              </h4>
              
              {selectedDateAppointments.length === 0 ? (
                <p className="text-muted-foreground text-sm bg-gray-50 p-4 rounded-lg">
                  No hay citas programadas para esta fecha.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{appointment.client_name}</h5>
                          <Badge variant="secondary">{appointment.service_name}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.start_time} - {appointment.end_time}
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocked Times */}
            {showBlockedTimes && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tiempo bloqueado ({selectedDateBlockedTimes.length})
                </h4>
                
                {selectedDateBlockedTimes.length === 0 ? (
                  <p className="text-muted-foreground text-sm bg-gray-50 p-4 rounded-lg">
                    No hay tiempo bloqueado para esta fecha.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateBlockedTimes.map((blocked) => (
                      <div key={blocked.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-red-700">Tiempo bloqueado</h5>
                            {blocked.is_recurring && (
                              <Badge variant="outline" className="text-xs">Recurrente</Badge>
                            )}
                          </div>
                          <div className="text-sm text-red-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {blocked.start_time} - {blocked.end_time}
                          </div>
                          {blocked.reason && (
                            <p className="text-sm text-red-600 mt-1">{blocked.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBlockedTime(blocked.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-medium text-sm">Citas de hoy</h4>
              <p className="text-2xl font-bold text-primary">
                {isToday(selectedDate) ? selectedDateAppointments.length : 0}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-medium text-sm">Tiempo bloqueado</h4>
              <p className="text-2xl font-bold text-red-600">
                {selectedDateBlockedTimes.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};