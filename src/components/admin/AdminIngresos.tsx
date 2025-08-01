import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Search, Filter, Plus, DollarSign, Calendar as CalendarDays, Eye } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerSelectorModal } from "./CustomerSelectorModal";

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
  customer_name?: string;
  customer_email?: string;
  profiles: {
    full_name: string;
    email: string;
  };
  services: {
    name: string;
    duration_minutes: number;
    price_cents: number;
    category_id?: string;
    service_categories?: {
      name: string;
    };
  };
  employee?: {
    full_name: string;
  };
}

interface Service {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

interface Employee {
  id: string;
  full_name: string;
}

export const AdminIngresos = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  
  // New appointment state
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState({
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
    notes: ""
  });

  // New service sale state  
  const [showNewSale, setShowNewSale] = useState(false);
  const [saleData, setSaleData] = useState({
    serviceId: "",
    employeeId: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
    fetchCategories();
    fetchServices();
    fetchEmployees();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price_cents, duration_minutes")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "employee")
        .order("full_name");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

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
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        profiles!reservations_client_id_fkey(full_name, email),
        services(name, duration_minutes, price_cents, category_id, service_categories(name)),
        employee:profiles!reservations_employee_id_fkey(full_name)
      `)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

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

  const updateReservationStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Estado actualizado correctamente"
      });
      fetchReservations();
    }
  };

  const createNewAppointment = async () => {
    if (!selectedCustomer || !appointmentData.serviceId || !appointmentData.date || !appointmentData.time) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const service = services.find(s => s.id === appointmentData.serviceId);
    if (!service) return;

    // Calculate end time
    const [hours, minutes] = appointmentData.time.split(':');
    const startTime = new Date();
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    // Check if this is a guest customer (temporary ID)
    const isGuestCustomer = selectedCustomer.id.startsWith('temp-');

    const { error } = await supabase
      .from('reservations')
      .insert({
        client_id: isGuestCustomer ? null : selectedCustomer.id,
        service_id: appointmentData.serviceId,
        employee_id: appointmentData.employeeId || null,
        appointment_date: appointmentData.date,
        start_time: appointmentData.time,
        end_time: format(endTime, 'HH:mm'),
        status: 'confirmed',
        notes: appointmentData.notes,
        customer_name: selectedCustomer.full_name,
        customer_email: selectedCustomer.email,
        is_guest_booking: isGuestCustomer
      });

    if (error) {
      toast({
        title: "Error",
        description: "Error al crear la cita",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Cita creada correctamente"
      });
      setShowNewAppointment(false);
      setSelectedCustomer(null);
      setAppointmentData({ serviceId: "", employeeId: "", date: "", time: "", notes: "" });
      fetchReservations();
    }
  };

  const createNewSale = async () => {
    if (!selectedCustomer || !saleData.serviceId) {
      toast({
        title: "Error",
        description: "Por favor selecciona cliente y servicio",
        variant: "destructive"
      });
      return;
    }

    const service = services.find(s => s.id === saleData.serviceId);
    if (!service) return;

    // Check if this is a guest customer (temporary ID)
    const isGuestCustomer = selectedCustomer.id.startsWith('temp-');

    const today = new Date();
    const { error } = await supabase
      .from('reservations')
      .insert({
        client_id: isGuestCustomer ? null : selectedCustomer.id,
        service_id: saleData.serviceId,
        employee_id: saleData.employeeId || null,
        appointment_date: format(today, 'yyyy-MM-dd'),
        start_time: format(today, 'HH:mm'),
        end_time: format(new Date(today.getTime() + service.duration_minutes * 60000), 'HH:mm'),
        status: 'completed',
        notes: saleData.notes,
        customer_name: selectedCustomer.full_name,
        customer_email: selectedCustomer.email,
        is_guest_booking: isGuestCustomer
      });

    if (error) {
      toast({
        title: "Error",
        description: "Error al registrar la venta",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Venta registrada correctamente"
      });
      setShowNewSale(false);
      setSelectedCustomer(null);
      setSaleData({ serviceId: "", employeeId: "", notes: "" });
      fetchReservations();
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "none" && !reservation.services.category_id) ||
      reservation.services.category_id === categoryFilter;
    const matchesDate = !dateFilter || reservation.appointment_date === format(dateFilter, 'yyyy-MM-dd');
    const matchesSearch = !searchTerm || 
      (reservation.profiles && (
        reservation.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      (reservation.customer_name && reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reservation.customer_email && reservation.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      reservation.services.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesDate && matchesSearch;
  });

  const upcomingReservations = filteredReservations.filter(r => 
    r.status === 'confirmed' && new Date(r.appointment_date) >= new Date()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'En pie';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'no_show':
        return 'No se presentó';
      default:
        return status;
    }
  };

  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100).toLocaleString()}`;
  };

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Ingresos</h2>
        <div className="text-center py-8">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-serif font-bold">Ingresos</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <CalendarDays className="h-4 w-4 mr-2" />
                Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Cita</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <CustomerSelectorModal
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  />
                </div>
                <div>
                  <Label>Servicio</Label>
                  <Select value={appointmentData.serviceId} onValueChange={(value) => 
                    setAppointmentData(prev => ({ ...prev, serviceId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatPrice(service.price_cents)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Empleado (opcional)</Label>
                  <Select value={appointmentData.employeeId} onValueChange={(value) => 
                    setAppointmentData(prev => ({ ...prev, employeeId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <Button onClick={createNewAppointment} className="w-full">
                  Crear Cita
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Venta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Venta de Servicio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <CustomerSelectorModal
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  />
                </div>
                <div>
                  <Label>Servicio</Label>
                  <Select value={saleData.serviceId} onValueChange={(value) => 
                    setSaleData(prev => ({ ...prev, serviceId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatPrice(service.price_cents)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Empleado que realizó el servicio (opcional)</Label>
                  <Select value={saleData.employeeId} onValueChange={(value) => 
                    setSaleData(prev => ({ ...prev, employeeId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <Button onClick={createNewSale} className="w-full">
                  Registrar Venta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Próximas Citas ({upcomingReservations.length})</TabsTrigger>
          <TabsTrigger value="all">Historial Completo ({filteredReservations.length})</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar cliente o servicio..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">En pie</SelectItem>
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

              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setDateFilter(undefined);
                  setSearchTerm("");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingReservations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No hay citas próximas.</p>
                </CardContent>
              </Card>
            ) : (
              upcomingReservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  onStatusUpdate={updateReservationStatus}
                  formatPrice={formatPrice}
                  formatTime12Hour={formatTime12Hour}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No se encontraron reservas con los filtros aplicados.</p>
                </CardContent>
              </Card>
            ) : (
              filteredReservations.map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  onStatusUpdate={updateReservationStatus}
                  formatPrice={formatPrice}
                  formatTime12Hour={formatTime12Hour}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ReservationCard = ({ 
  reservation, 
  onStatusUpdate, 
  formatPrice, 
  formatTime12Hour, 
  getStatusColor, 
  getStatusLabel 
}: {
  reservation: Reservation;
  onStatusUpdate: (id: string, status: string) => void;
  formatPrice: (cents: number) => string;
  formatTime12Hour: (time: string) => string;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) => {
  const customerName = reservation.profiles?.full_name || reservation.customer_name || 'Cliente';
  const customerEmail = reservation.profiles?.email || reservation.customer_email || '';

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{customerName}</h3>
            {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
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
              <strong>Precio:</strong> {formatPrice(reservation.services.price_cents)}
            </p>
            <p className="text-sm">
              <strong>Empleado:</strong> {reservation.employee?.full_name || 'Sin asignar'}
            </p>
            {reservation.notes && (
              <p className="text-sm">
                <strong>Notas:</strong> {reservation.notes}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Badge className={getStatusColor(reservation.status)}>
              {getStatusLabel(reservation.status)}
            </Badge>
            
            <div className="flex flex-col gap-2">
              <Select 
                value={reservation.status} 
                onValueChange={(value) => onStatusUpdate(reservation.id, value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">En pie</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">No se presentó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};