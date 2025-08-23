import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { Appointment } from "@/types/appointment";
import { AdminQuickAccess } from "./AdminQuickAccess";
import { BookingCard } from "@/components/cards/BookingCard";

interface DashboardSummaryProps {
  effectiveProfile: any;
}

export const DashboardSummary = ({
  effectiveProfile
}: DashboardSummaryProps) => {
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [activeCombos, setActiveCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    fetchActivePromotions();
    fetchActiveCombos();
  }, [effectiveProfile?.id, effectiveProfile?.role]);

  const fetchActivePromotions = async () => {
    try {
      const nowISO = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('discounts')
        .select('*, services(id, name, description, duration_minutes, price_cents, image_url)')
        .eq('is_active', true)
        .eq('is_public', true) // Only fetch public discounts
        .lte('start_date', nowISO)
        .gte('end_date', nowISO)
        .limit(3);
      if (error) {
        console.error('Error fetching active promotions:', error);
        return;
      }
      setActivePromotions(data || []);
    } catch (error) {
      console.error('Error fetching active promotions:', error);
    }
  };

  const fetchActiveCombos = async () => {
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
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .limit(3);
      if (error) {
        console.error('Error fetching active combos:', error);
        return;
      }
      setActiveCombos(data || []);
    } catch (error) {
      console.error('Error fetching active combos:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!effectiveProfile?.id) return;
    setLoading(true);
    try {
      // Use the admin_reservations_view for better performance and reliable service names
      let query = supabase.from('admin_reservations_view').select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          client_id,
          employee_id,
          service_name,
          service_price_cents,
          service_duration,
          category_name,
          client_full_name,
          employee_full_name,
          booking_type,
          combo_id,
          combo_name
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
      
      const { data: appointments, error } = await query.order('appointment_date', {
        ascending: false
      });
      
      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Transform the data to match our interface - Now with correct service names
      const transformedAppointments = appointments?.map((appt: any) => ({
        id: appt.id,
        appointment_date: appt.appointment_date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        status: appt.status,
        notes: appt.notes,
        client_id: appt.client_id,
        employee_id: appt.employee_id,
        services: [{
          id: 'temp-id',
          name: appt.service_name || 'Servicio no especificado',
          description: '',
          duration_minutes: appt.service_duration || 0,
          price_cents: appt.service_price_cents || 0
        }],
        client_profile: {
          full_name: appt.client_full_name || 'Cliente no especificado'
        },
        employee_profile: appt.employee_full_name ? {
          full_name: appt.employee_full_name
        } : undefined,
        // Handle combo data from view
        isCombo: appt.booking_type === 'combo',
        comboId: appt.combo_id,
        comboName: appt.combo_name
      })) || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = transformedAppointments
        ?.filter(appt => {
          const apptDate = new Date(appt.appointment_date);
          // Only show pending or confirmed in upcoming
          const status = (appt.status || '').toLowerCase();
          const isUpcomingDate = apptDate >= today;
          const isUpcomingStatus = status === 'pending' || status === 'confirmed';
          return isUpcomingDate && isUpcomingStatus;
        })
        .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()) || [];

      const past = transformedAppointments
        ?.filter(appt => {
          const apptDate = new Date(appt.appointment_date);
          // Only show completed or cancelled in past
          const status = (appt.status || '').toLowerCase();
          const isPastDate = apptDate < today;
          const isPastStatus = status === 'completed' || status === 'cancelled';
          return isPastDate && isPastStatus;
        })
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()) || [];
      
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Quick Access - Only for admins */}
      <AdminQuickAccess effectiveProfile={effectiveProfile} />
      
      {/* Próximas Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No hay citas próximas</p>
              {effectiveProfile?.role === 'client' && (
                <Button onClick={() => window.location.href = '#bookings'} className="bg-primary hover:bg-primary/90">
                  Reservar una cita
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <BookingCard
                  key={appointment.id}
                  id={appointment.id}
                  serviceName={appointment.services?.[0]?.name || 'Servicio no especificado'}
                  appointmentDate={appointment.appointment_date}
                  startTime={appointment.start_time}
                  endTime={appointment.end_time}
                  status={appointment.status}
                  notes={appointment.notes}
                  clientName={appointment.client_profile?.full_name}
                  employeeName={appointment.employee_profile?.full_name}
                  isCombo={appointment.isCombo}
                  comboName={appointment.comboName}
                  comboId={appointment.comboId}
                  onUpdate={fetchAppointments}
                  canEdit={canEditAppointment(appointment)}
                  effectiveProfile={effectiveProfile}
                  variant="upcoming"
                />
              ))}
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Promociones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePromotions.length > 0 || activeCombos.length > 0 ? (
            <div className="space-y-4">
              {/* Display Combos */}
              {activeCombos.map(combo => (
                <ServiceCard 
                  key={`combo-${combo.id}`} 
                  id={combo.id} 
                  name={combo.name} 
                  description={combo.description} 
                  originalPrice={combo.original_price_cents} 
                  finalPrice={combo.total_price_cents} 
                  savings={combo.original_price_cents - combo.total_price_cents} 
                  duration={combo.combo_services?.reduce((total: number, cs: any) => total + cs.services.duration_minutes, 0) || 0} 
                  imageUrl={combo.combo_services?.[0]?.services?.image_url} 
                  type="combo" 
                  comboServices={combo.combo_services?.map((cs: any) => ({
                    name: cs.services.name,
                    quantity: cs.quantity,
                    service_id: cs.service_id
                  })) || []} 
                  variant="dashboard" 
                  onSelect={() => navigate(`/book?service=${combo.id}`)} 
                  showExpandable={true} 
                />
              ))}
              
              {/* Display Individual Discounts */}
              {activePromotions.map(promo => (
                <ServiceCard 
                  key={`discount-${promo.id}`} 
                  id={promo.services.id} 
                  name={promo.services.name} 
                  description={promo.services.description} 
                  originalPrice={promo.services.price_cents} 
                  finalPrice={promo.services.price_cents - (promo.discount_type === 'percentage' ? promo.services.price_cents * promo.discount_value / 100 : promo.discount_value * 100)} 
                  savings={promo.discount_type === 'percentage' ? promo.services.price_cents * promo.discount_value / 100 : promo.discount_value * 100} 
                  duration={promo.services.duration_minutes} 
                  imageUrl={promo.services.image_url} 
                  type="service" 
                  discountType={promo.discount_type} 
                  discountValue={promo.discount_value} 
                  variant="dashboard" 
                  onSelect={() => navigate(`/book?service=${promo.services.id}`)} 
                  showExpandable={true} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <p>No hay promociones activas en este momento</p>
              <p className="text-sm mt-2">¡Mantente atento a futuras ofertas!</p>
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
            <div className="space-y-4">
              {pastAppointments.slice(0, 5).map((appointment) => (
                <BookingCard
                  key={appointment.id}
                  id={appointment.id}
                  serviceName={appointment.services?.[0]?.name || 'Servicio no especificado'}
                  appointmentDate={appointment.appointment_date}
                  startTime={appointment.start_time}
                  endTime={appointment.end_time}
                  status={appointment.status}
                  notes={appointment.notes}
                  clientName={appointment.client_profile?.full_name}
                  employeeName={appointment.employee_profile?.full_name}
                  isCombo={appointment.isCombo}
                  comboName={appointment.comboName}
                  comboId={appointment.comboId}
                  onUpdate={fetchAppointments}
                  canEdit={canEditAppointment(appointment)}
                  effectiveProfile={effectiveProfile}
                  variant="past"
                />
              ))}
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