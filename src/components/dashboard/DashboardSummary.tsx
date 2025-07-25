import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EditableAppointment } from "./EditableAppointment";
import { EditableDiscount } from "./EditableDiscount";
import { StandardServiceCard } from "@/components/cards/StandardServiceCard";
import { Appointment } from "@/types/appointment";
interface DashboardSummaryProps {
  effectiveProfile: any;
}
export const DashboardSummary = ({
  effectiveProfile
}: DashboardSummaryProps) => {
  const { user } = useAuth();
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
      const { data, error } = await supabase
        .from('discounts')
        .select('*, services(id, name, description, duration_minutes, price_cents, image_url)')
        .eq('is_active', true)
        .eq('is_public', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
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
      let query = supabase.from('reservations').select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          client_id,
          employee_id,
          appointment_services (
            services (
              id,
              name,
              duration_minutes,
              price_cents
            )
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
      const {
        data: appointments,
        error
      } = await query.order('appointment_date', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedAppointments = appointments?.map(appt => ({
        ...appt,
        services: appt.appointment_services?.map(as => as.services).flat() || []
      })) || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = transformedAppointments?.filter(appt => {
        const apptDate = new Date(appt.appointment_date);
        return apptDate >= today;
      }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()) || [];
      const past = transformedAppointments?.filter(appt => {
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
    <div key={appt.id} className="border border-border rounded-lg p-4 bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-shadow">
      {/* Top row with service and status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-base leading-tight mb-1">
              {appt.services && appt.services.length > 0 
                ? appt.services.map(service => service.name).join(', ')
                : 'Servicio'
              }
            </div>
          </div>
        </div>
        
        <Badge className={getStatusColor(appt.status)} variant="secondary">
          {getStatusText(appt.status)}
        </Badge>
      </div>

      {/* Bottom row with time/date and edit button */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {/* Time */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>
              {formatTime12Hour(appt.start_time).replace(' ', '')} - {formatTime12Hour(appt.end_time).replace(' ', '')}
            </span>
          </div>
          
          {/* Date */}
          <div className="text-sm text-muted-foreground">
            {new Date(appt.appointment_date).toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </div>
        </div>
        
        {/* Edit button on the right */}
        <EditableAppointment appointment={appt} onUpdate={fetchAppointments} canEdit={canEditAppointment(appt)} />
      </div>
      
      {/* Client/Employee info - full width at bottom */}
      {(effectiveProfile?.role === 'admin' || effectiveProfile?.role === 'employee' || appt.employee_profile) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
          {effectiveProfile?.role === 'admin' && (
            <>
              <div className="flex items-center gap-1 min-w-0">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{appt.client_profile?.full_name}</span>
              </div>
              {appt.employee_profile && (
                <div className="flex items-center gap-1 min-w-0">
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{appt.employee_profile.full_name}</span>
                </div>
              )}
            </>
          )}
          {effectiveProfile?.role === 'employee' && (
            <div className="flex items-center gap-1 min-w-0">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{appt.client_profile?.full_name}</span>
            </div>
          )}
          {effectiveProfile?.role === 'client' && appt.employee_profile && (
            <div className="flex items-center gap-1 min-w-0">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{appt.employee_profile.full_name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
  if (loading) {
    return <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold">¡Bienvenido de nuevo, {effectiveProfile?.full_name}!</h2>
        <div className="text-center py-8">
          <p>Cargando...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      
      
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Promociones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(activePromotions.length > 0 || activeCombos.length > 0) ? (
            <div className="space-y-4">
              {/* Display Combos */}
              {activeCombos.map((combo) => (
                <StandardServiceCard
                  key={`combo-${combo.id}`}
                  id={combo.id}
                  name={combo.name}
                  description={combo.description}
                  originalPrice={combo.original_price_cents}
                  finalPrice={combo.total_price_cents}
                  savings={combo.original_price_cents - combo.total_price_cents}
                  duration={combo.combo_services?.reduce((total: number, cs: any) => 
                    total + cs.services.duration_minutes, 0) || 0}
                  imageUrl={combo.combo_services?.[0]?.services?.image_url}
                  type="combo"
                  comboServices={combo.combo_services?.map((cs: any) => ({
                    name: cs.services.name,
                    quantity: cs.quantity,
                    service_id: cs.service_id
                  })) || []}
                  variant="dashboard"
                  onSelect={() => navigate(`/book?service=${combo.id}&step=2`)}
                  showExpandable={false}
                />
              ))}
              
              {/* Display Individual Discounts */}
              {activePromotions.map((promo) => (
                <StandardServiceCard
                  key={`discount-${promo.id}`}
                  id={promo.services.id}
                  name={promo.services.name}
                  description={promo.services.description}
                  originalPrice={promo.services.price_cents}
                  finalPrice={promo.services.price_cents - (promo.discount_type === 'percentage' 
                    ? (promo.services.price_cents * promo.discount_value) / 100 
                    : promo.discount_value * 100)}
                  savings={promo.discount_type === 'percentage' 
                    ? (promo.services.price_cents * promo.discount_value) / 100 
                    : promo.discount_value * 100}
                  duration={promo.services.duration_minutes}
                  imageUrl={promo.services.image_url}
                  type="service"
                  discountType={promo.discount_type}
                  discountValue={promo.discount_value}
                  variant="dashboard"
                  onSelect={() => navigate(`/book?service=${promo.services.id}&step=2`)}
                  showExpandable={false}
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
    </div>;
};