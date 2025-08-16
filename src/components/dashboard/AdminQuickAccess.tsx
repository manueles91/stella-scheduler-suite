import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, DollarSign, UserPlus, Receipt, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";

interface AdminQuickAccessProps {
  effectiveProfile: any;
}

export const AdminQuickAccess = ({ effectiveProfile }: AdminQuickAccessProps) => {
  const { toast } = useToast();
  
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
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // New service sale state
  const [showNewSale, setShowNewSale] = useState(false);
  const [saleData, setSaleData] = useState({
    serviceId: "",
    employeeId: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    chargedPrice: "",
    notes: ""
  });

  // New cost state
  const [showNewCost, setShowNewCost] = useState(false);
  const [costData, setCostData] = useState({
    name: "",
    description: "",
    amount: "",
    cost_type: "one_time" as "fixed" | "variable" | "recurring" | "one_time",
    cost_category_id: "",
    date_incurred: format(new Date(), 'yyyy-MM-dd')
  });
  const [costCategories, setCostCategories] = useState<any[]>([]);

  // New user state
  const [showNewUser, setShowNewUser] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "client" as "client" | "employee" | "admin"
  });

  const costTypes = [
    { value: 'fixed', label: 'Fijo' },
    { value: 'variable', label: 'Variable' },
    { value: 'recurring', label: 'Recurrente' },
    { value: 'one_time', label: 'Una vez' }
  ];

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchCostCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCostCategories(data || []);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
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

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          client_id: selectedCustomer.id,
          service_id: appointmentData.serviceId,
          employee_id: appointmentData.employeeId || null,
          appointment_date: appointmentData.date,
          start_time: appointmentData.time,
          end_time: appointmentData.time, // Add required end_time
          notes: appointmentData.notes,
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cita creada exitosamente"
      });

      setShowNewAppointment(false);
      setSelectedCustomer(null);
      setAppointmentData({
        serviceId: "",
        employeeId: "",
        date: "",
        time: "",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Error al crear la cita",
        variant: "destructive"
      });
    }
  };

  const createNewSale = async () => {
    if (!saleData.serviceId || !saleData.date || !saleData.time || !saleData.chargedPrice) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          service_id: saleData.serviceId,
          employee_id: saleData.employeeId || null,
          appointment_date: saleData.date,
          start_time: saleData.time,
          end_time: saleData.time, // Add required end_time
          notes: saleData.notes,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Venta registrada exitosamente"
      });

      setShowNewSale(false);
      setSaleData({
        serviceId: "",
        employeeId: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        chargedPrice: "",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "Error al registrar la venta",
        variant: "destructive"
      });
    }
  };

  const createNewCost = async () => {
    if (!costData.name || !costData.amount || !costData.cost_type || !costData.cost_category_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('costs')
        .insert({
          name: costData.name,
          description: costData.description,
          amount_cents: Math.round(parseFloat(costData.amount) * 100),
          cost_type: costData.cost_type,
          cost_category: 'other' as const, // Add required cost_category
          cost_category_id: costData.cost_category_id,
          date_incurred: costData.date_incurred,
          created_by: selectedCustomer?.id || '', // Add required created_by
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Costo registrado exitosamente"
      });

      setShowNewCost(false);
      setCostData({
        name: "",
        description: "",
        amount: "",
        cost_type: "one_time",
        cost_category_id: "",
        date_incurred: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating cost:', error);
      toast({
        title: "Error",
        description: "Error al registrar el costo",
        variant: "destructive"
      });
    }
  };

  const createNewUser = async () => {
    if (!userData.email || !userData.full_name) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        toast({
          title: "Error",
          description: "El email ya está registrado",
          variant: "destructive"
        });
        return;
      }

      // Create new user profile
      const userId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId, // Add required id field
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone || null,
          role: userData.role,
          account_status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente"
      });

      setShowNewUser(false);
      setUserData({
        email: "",
        full_name: "",
        phone: "",
        role: "client"
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Error al crear el usuario",
        variant: "destructive"
      });
    }
  };

  // Only show for admins
  if (effectiveProfile?.role !== 'admin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Acceso Rápido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Nueva Cita */}
          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  fetchServices();
                  fetchEmployees();
                }}
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="text-sm">Nueva Cita</span>
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
                  <Select value={appointmentData.serviceId} onValueChange={(value) => setAppointmentData({...appointmentData, serviceId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Empleado (opcional)</Label>
                  <Select value={appointmentData.employeeId} onValueChange={(value) => setAppointmentData({...appointmentData, employeeId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
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
                    onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <Button onClick={createNewAppointment} className="w-full">
                  Crear Cita
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Registrar Venta */}
          <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  fetchServices();
                  fetchEmployees();
                }}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Registrar Venta</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Venta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Servicio</Label>
                  <Select value={saleData.serviceId} onValueChange={(value) => setSaleData({...saleData, serviceId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Empleado (opcional)</Label>
                  <Select value={saleData.employeeId} onValueChange={(value) => setSaleData({...saleData, employeeId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
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
                    value={saleData.date}
                    onChange={(e) => setSaleData({...saleData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={saleData.time}
                    onChange={(e) => setSaleData({...saleData, time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Precio Cobrado (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={saleData.chargedPrice}
                    onChange={(e) => setSaleData({...saleData, chargedPrice: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <Button onClick={createNewSale} className="w-full">
                  Registrar Venta
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Nuevo Costo */}
          <Dialog open={showNewCost} onOpenChange={setShowNewCost}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  fetchCostCategories();
                }}
              >
                <Receipt className="h-5 w-5" />
                <span className="text-sm">Nuevo Costo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Costo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre del Costo</Label>
                  <Input
                    value={costData.name}
                    onChange={(e) => setCostData({...costData, name: e.target.value})}
                    placeholder="Ej: Materiales, Electricidad..."
                  />
                </div>
                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={costData.description}
                    onChange={(e) => setCostData({...costData, description: e.target.value})}
                    placeholder="Descripción del costo..."
                  />
                </div>
                <div>
                  <Label>Monto (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={costData.amount}
                    onChange={(e) => setCostData({...costData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Tipo de Costo</Label>
                  <Select value={costData.cost_type} onValueChange={(value: any) => setCostData({...costData, cost_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={costData.cost_category_id} onValueChange={(value) => setCostData({...costData, cost_category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha del Costo</Label>
                  <Input
                    type="date"
                    value={costData.date_incurred}
                    onChange={(e) => setCostData({...costData, date_incurred: e.target.value})}
                  />
                </div>
                <Button onClick={createNewCost} className="w-full">
                  Registrar Costo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Nuevo Usuario */}
          <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
              >
                <UserPlus className="h-5 w-5" />
                <span className="text-sm">Nuevo Usuario</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Nombre Completo</Label>
                  <Input
                    value={userData.full_name}
                    onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                    placeholder="Nombre y apellidos"
                  />
                </div>
                <div>
                  <Label>Teléfono (opcional)</Label>
                  <Input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <Label>Rol</Label>
                  <Select value={userData.role} onValueChange={(value: any) => setUserData({...userData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createNewUser} className="w-full">
                  Crear Usuario
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}; 