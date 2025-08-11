import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface Reservation {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_id: string;
  employee_id?: string;
  service_id: string;
  final_price_cents?: number;
  profiles: {
    full_name: string;
    email: string;
  };
  services: {
    name: string;
    duration_minutes: number;
    price_cents: number;
    variable_price?: boolean;
    category_id?: string;
    service_categories?: {
      name: string;
    };
  };
  employee?: {
    full_name: string;
  };
}
export const AdminReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
const { toast } = useToast();
  const [finalPrices, setFinalPrices] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchReservations();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const fetchReservations = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('reservations').select(`
        *,
        profiles!reservations_client_id_fkey(full_name, email),
        services(name, duration_minutes, price_cents, category_id, variable_price, service_categories(name)),
        employee:profiles!reservations_employee_id_fkey(full_name)
      `).order('appointment_date', {
      ascending: false
    }).order('start_time', {
      ascending: false
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive"
      });
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };
  const updateReservationStatus = async (res: Reservation, status: string) => {
    if (status === 'completed' && res.services.variable_price && !finalPrices[res.id] && !res.final_price_cents) {
      toast({
        title: "Precio requerido",
        description: "Ingrese el precio final antes de completar.",
        variant: "destructive"
      });
      return;
    }

    const payload: any = { status };
    if (status === 'completed' && res.services.variable_price) {
      const value = finalPrices[res.id];
      const cents = res.final_price_cents ?? Math.round((parseFloat(value || '0') || 0) * 100);
      payload.final_price_cents = cents;
    }

    const { error } = await supabase.from('reservations').update(payload).eq('id', res.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Reserva actualizada"
      });
      fetchReservations();
    }
  };
  const completeReservationWithPrice = async (res: Reservation) => {
    const value = finalPrices[res.id];
    const cents = Math.round((parseFloat(value || '0') || 0) * 100);
    if (!(cents >= 0)) {
      toast({ title: "Precio inválido", description: "Ingrese un precio válido", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'completed', final_price_cents: cents })
      .eq('id', res.id);
    if (error) {
      toast({ title: "Error", description: error.message || 'No se pudo completar', variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: 'Reserva completada' });
      fetchReservations();
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "none" && !reservation.services.category_id) ||
      reservation.services.category_id === categoryFilter;
    const matchesDate = !dateFilter || reservation.appointment_date === format(dateFilter, 'yyyy-MM-dd');
    const matchesSearch = !searchTerm || reservation.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || reservation.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) || reservation.services.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesDate && matchesSearch;
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100)}`;
  };
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  if (loading) {
    return <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Gestión de Reservas</h2>
        <div className="text-center py-8">Cargando reservas...</div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Citas</h2>
        <div className="text-sm text-muted-foreground">
          Total: {filteredReservations.length} reservas
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar cliente o servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="no_show">No se presentó</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={() => {
            setStatusFilter("all");
            setCategoryFilter("all");
            setDateFilter(undefined);
            setSearchTerm("");
          }}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No se encontraron reservas con los filtros aplicados.</p>
            </CardContent>
          </Card> : filteredReservations.map(reservation => <Card key={reservation.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{reservation.profiles.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{reservation.profiles.email}</p>
                    <p className="text-sm font-medium">{reservation.services.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Fecha:</strong> {format(new Date(reservation.appointment_date), 'PPP')}
                    </p>
                    <p className="text-sm">
                      <strong>Hora:</strong> {formatTime12Hour(reservation.start_time)} - {formatTime12Hour(reservation.end_time)}
                    </p>
                    <p className="text-sm">
                      <strong>Duración:</strong> {reservation.services.duration_minutes} min
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Precio:</strong>{' '}
                      {reservation.services.variable_price ? (
                        reservation.final_price_cents != null
                          ? `${formatPrice(reservation.final_price_cents)} (final)`
                          : 'Precio variable'
                      ) : (
                        formatPrice(reservation.services.price_cents)
                      )}
                    </p>
                    <p className="text-sm">
                      <strong>Empleado:</strong> {reservation.employee?.full_name || 'Sin asignar'}
                    </p>
                    {reservation.notes && <p className="text-sm">
                        <strong>Notas:</strong> {reservation.notes}
                      </p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                    
                    <div className="flex flex-col gap-2">
                      <Select value={reservation.status} onValueChange={value => updateReservationStatus(reservation, value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="no_show">No se presentó</SelectItem>
                        </SelectContent>
                      </Select>

                      {reservation.services.variable_price && (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Precio final"
                            type="number"
                            step="0.01"
                            min="0"
                            value={finalPrices[reservation.id] ?? (reservation.final_price_cents != null ? (reservation.final_price_cents / 100).toFixed(2) : '')}
                            onChange={(e) => setFinalPrices(prev => ({ ...prev, [reservation.id]: e.target.value }))}
                          />
                          <Button size="sm" onClick={() => completeReservationWithPrice(reservation)}>
                            Completar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
      </div>
    </div>;
};