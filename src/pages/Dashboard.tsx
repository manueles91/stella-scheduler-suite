import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookingSystem } from "@/components/BookingSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!profile?.id) return;
      setAppointmentsLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('id, appointment_date, start_time, end_time, status, service_id, services(name)')
        .eq('client_id', profile.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });
      if (!error) setAppointments(data || []);
      setAppointmentsLoading(false);
    };
    fetchAppointments();
  }, [profile?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">¡Bienvenido de nuevo, {profile?.full_name}!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas citas</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <p>Cargando...</p>
                  ) : appointments.length === 0 ? (
                    <p className="text-muted-foreground">No hay citas próximas</p>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map((appt) => (
                        <div key={appt.id} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <div className="font-medium">{appt.services?.name || 'Service'}</div>
                          <div className="text-sm text-muted-foreground">
                            {appt.appointment_date} {appt.start_time} - {appt.end_time}
                          </div>
                          <div className="text-xs">Estado: {appt.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Visitas totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground">Historial completo</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Servicio favorito</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">-</p>
                  <p className="text-muted-foreground">¡Reserva tu primer servicio!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 'bookings':
        return <BookingSystem />;
        
      case 'schedule':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Mi agenda</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Vista de agenda para empleados próximamente...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'time-tracking':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Control de tiempo</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Funcionalidad de control de tiempo próximamente...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-bookings':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Todas las reservas</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Gestión de reservas para administradores próximamente...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-services':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Gestionar servicios</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Gestión de servicios próximamente...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-staff':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Gestionar personal</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Gestión de personal próximamente...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;