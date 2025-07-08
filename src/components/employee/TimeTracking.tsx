import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Play, Square, Timer } from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TimeLog {
  id: string;
  clock_in: string;
  clock_out?: string;
  date: string;
  total_hours?: number;
  created_at: string;
}

export const TimeTracking = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWorking, setIsWorking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchTimeLogs();
      checkActiveSession();
    }
  }, [profile?.id, selectedDate]);

  const fetchTimeLogs = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', profile.id)
      .gte('date', format(startOfDay(selectedDate), 'yyyy-MM-dd'))
      .lte('date', format(endOfDay(selectedDate), 'yyyy-MM-dd'))
      .order('clock_in', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load time logs",
        variant: "destructive",
      });
    } else {
      setTimeLogs(data || []);
    }
    setLoading(false);
  };

  const checkActiveSession = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', profile.id)
      .is('clock_out', null)
      .single();

    if (!error && data) {
      setIsWorking(true);
      setCurrentSession(data);
    } else {
      setIsWorking(false);
      setCurrentSession(null);
    }
  };

  const clockIn = async () => {
    if (!profile?.id) return;

    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          employee_id: profile.id,
          clock_in: now.toISOString(),
          date: format(now, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) throw error;

      setIsWorking(true);
      setCurrentSession(data);
      
      toast({
        title: "Entrada registrada",
        description: `Inicio de jornada: ${format(now, 'HH:mm')}`,
      });

      fetchTimeLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al registrar entrada",
        variant: "destructive",
      });
    }
  };

  const clockOut = async () => {
    if (!currentSession || !profile?.id) return;

    try {
      const now = new Date();
      const clockInTime = new Date(currentSession.clock_in);
      const diffMs = now.getTime() - clockInTime.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);

      const { error } = await supabase
        .from('time_logs')
        .update({
          clock_out: now.toISOString(),
          total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      setIsWorking(false);
      setCurrentSession(null);
      
      toast({
        title: "Salida registrada",
        description: `Fin de jornada: ${format(now, 'HH:mm')} (${formatDuration(totalHours)})`,
      });

      fetchTimeLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al registrar salida",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  const getTodayStats = () => {
    const todayLogs = timeLogs.filter(log => 
      format(new Date(log.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );
    
    const totalHours = todayLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const sessions = todayLogs.length;
    
    return { totalHours, sessions };
  };

  const getSelectedDateStats = () => {
    const selectedLogs = timeLogs.filter(log => 
      format(new Date(log.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
    
    const totalHours = selectedLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    
    return { totalHours, sessions: selectedLogs.length, logs: selectedLogs };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Control de Tiempo</h2>
        <div className="text-center py-8">Cargando registros...</div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  const selectedStats = getSelectedDateStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Timer className="h-8 w-8" />
        <h2 className="text-3xl font-serif font-bold">Control de Tiempo</h2>
      </div>

      {/* Current Status */}
      {isToday(selectedDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estado Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {isWorking ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Trabajando
                    </Badge>
                    {currentSession && (
                      <span className="text-sm text-muted-foreground">
                        Desde: {format(new Date(currentSession.clock_in), 'HH:mm')}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary">No trabajando</Badge>
                )}
              </div>
              
              <div className="space-x-2">
                {!isWorking ? (
                  <Button onClick={clockIn} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Jornada
                  </Button>
                ) : (
                  <Button onClick={clockOut} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Finalizar Jornada
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Horas hoy:</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(todayStats.totalHours)}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Sesiones hoy:</h4>
                <p className="text-2xl font-bold text-primary">
                  {todayStats.sessions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Seleccionar Fecha</CardTitle>
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

        {/* Daily Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Resumen del {format(selectedDate, 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Total de horas</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(selectedStats.totalHours)}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Sesiones</h4>
                <p className="text-2xl font-bold text-primary">
                  {selectedStats.sessions}
                </p>
              </div>
            </div>

            {/* Time Logs */}
            <div className="space-y-2">
              <h4 className="font-medium">Registros del día:</h4>
              {selectedStats.logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay registros para esta fecha.</p>
              ) : (
                selectedStats.logs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <strong>Entrada:</strong> {format(new Date(log.clock_in), 'HH:mm')}
                      </div>
                      <div>
                        <strong>Salida:</strong> {log.clock_out ? format(new Date(log.clock_out), 'HH:mm') : 'Activa'}
                      </div>
                    </div>
                    <div className="text-right">
                      {log.total_hours ? (
                        <Badge variant="secondary">
                          {formatDuration(log.total_hours)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">En curso</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};