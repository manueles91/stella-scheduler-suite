import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EditableAppointment } from "./EditableAppointment";
import { EditableDiscount } from "./EditableDiscount";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_id: string;
  employee_id?: string;
  services?: {
    name: string;
    duration_minutes: number;
  };
  client_profile?: {
    full_name: string;
  };
  employee_profile?: {
    full_name: string;
  };
}

interface DashboardSummaryProps {
  effectiveProfile: any;
}

export const DashboardSummary = ({ effectiveProfile }: DashboardSummaryProps) => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    fetchActivePromotions();
  }, [effectiveProfile?.id, effectiveProfile?.role]);

  const fetchActivePromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          id,
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_public,
          services (
            name
          )
        `)
        .eq('is_active', true)
        .eq('is_public', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setActivePromotions(data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!effectiveProfile?.id) return;

    setLoading(true);
    try {
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
          services (
            name,
            duration_minutes
          ),
          client_profile:profiles!client_id (
            full_name
          ),
          employee_profile:profiles!employee_id (
            full_name
          )
        `);

      // Apply filters based on user role
      if (effectiveProfile.role === 'admin') {
        // Admins can see all appointments
      } else if (effectiveProfile.role === 'employee') {
        query = query.eq('employee_id', effectiveProfile.id);
      } else {
        // Client can only see their own appointments
        query = query.eq('client_id', effectiveProfile.id);
      }

      const { data: appointments, error } = await query.order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = appointments?.filter(appt => {
        const apptDate = new Date(appt.appointment_date);
        return apptDate >= today;
      }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()) || [];

      const past = appointments?.filter(appt => {
        const apptDate = new Date(appt.appointment_date);
        return apptDate < today;
      }).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()) || [];

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const canEditAppointment = (appt: Appointment) => {
    if (effectiveProfile?.role === 'admin') return true;
    if (effectiveProfile?.role === 'employee' && appt.employee_id === effectiveProfile.id) return true;
    if (effectiveProfile?.role === 'client' && appt.client_id === effectiveProfile.id) return true;
    return false;
  };

  const canEditDiscount = () => {
    return effectiveProfile?.role === 'admin';
  };

  const renderAppointment = (appt: Appointment) => (
    <div key={appt.id} className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div className="font-medium text-foreground">{appt.services?.name || 'Servicio'}</div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(appt.status)}>
            {getStatusText(appt.status)}
          </Badge>
          <EditableAppointment 
            appointment={appt} 
            onUpdate={fetchAppointments}
            canEdit={canEditAppointment(appt)}
          />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <div>{new Date(appt.appointment_date).toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        <div>{formatTime12Hour(appt.start_time)} - {formatTime12Hour(appt.end_time)}</div>
      </div>
      {effectiveProfile?.role === 'admin' && (
        <div className="text-xs text-muted-foreground">
          <div>Cliente: {appt.client_profile?.full_name}</div>
          {appt.employee_profile && <div>Empleado: {appt.employee_profile.full_name}</div>}
        </div>
      )}
      {effectiveProfile?.role === 'employee' && (
        <div className="text-xs text-muted-foreground">
          Cliente: {appt.client_profile?.full_name}
        </div>
      )}
      {effectiveProfile?.role === 'client' && appt.employee_profile && (
        <div className="text-xs text-muted-foreground">
          Empleado: {appt.employee_profile.full_name}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold">¡Bienvenido de nuevo, {effectiveProfile?.full_name}!</h2>
        <div className="text-center py-8">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold">¡Bienvenido de nuevo, {effectiveProfile?.full_name}!</h2>
      
      {/* Próximas Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay citas próximas</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 5).map(renderAppointment)}
              {upcomingAppointments.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Y {upcomingAppointments.length - 5} citas más...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promociones */}
      <Card>
        <CardHeader>
          <CardTitle>Promociones</CardTitle>
        </CardHeader>
        <CardContent>
          {activePromotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay promociones activas en este momento</p>
              <p className="text-sm mt-2">¡Mantente atento a futuras ofertas!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePromotions.map((promotion) => (
                <div key={promotion.id} className="border border-border rounded-lg p-3 space-y-2 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-foreground">{promotion.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {promotion.discount_type === 'percentage' 
                          ? `${promotion.discount_value}% OFF`
                          : `$${promotion.discount_value} OFF`
                        }
                      </Badge>
                      <EditableDiscount 
                        discount={promotion} 
                        onUpdate={fetchActivePromotions}
                        canEdit={canEditDiscount()}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Servicio: {promotion.services?.name}</div>
                    {promotion.description && <div className="mt-1">{promotion.description}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Válida hasta: {new Date(promotion.end_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Últimas Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay citas anteriores</p>
          ) : (
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map(renderAppointment)}
              {pastAppointments.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Y {pastAppointments.length - 5} citas más en el historial...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};