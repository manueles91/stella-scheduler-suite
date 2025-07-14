import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EnhancedBookingSystem } from "@/components/EnhancedBookingSystem";
import { AdminReservations } from "@/components/admin/AdminReservations";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminStaff } from "@/components/admin/AdminStaff";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { TimeTracking } from "@/components/employee/TimeTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif">Cargando...</h2>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

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
        return <EnhancedBookingSystem />;
        
      case 'schedule':
        return <EmployeeSchedule />;
        
      case 'time-tracking':
        return <TimeTracking />;
        
      case 'admin-bookings':
        return <AdminReservations />;
        
      case 'admin-services':
        return <AdminServices />;
        
      case 'admin-staff':
        return <AdminStaff />;
        
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