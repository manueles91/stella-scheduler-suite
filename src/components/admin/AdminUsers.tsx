import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Ban, 
  CheckCircle, 
  Plus, 
  Users, 
  UserCheck,
  Filter,
  MoreVertical,
  Trash2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollapsibleFilter } from "./CollapsibleFilter";
import { useInvitedUsers } from "./hooks/useInvitedUsers";
import { InvitedUserData } from "@/lib/validation/userSchemas";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'client' | 'employee' | 'admin';
  account_status: string;
  created_at: string;
  _count?: {
    reservations: number;
  };
}

interface Service {
  id: string;
  name: string;
}

interface EmployeeService {
  employee_id: string;
  service_id: string;
  services: {
    name: string;
  };
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "client" as "client" | "employee" | "admin"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { createInvitedUser, loading: creatingUser, checkEmailExists } = useInvitedUsers();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchServices(), fetchEmployeeServices()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      // Fetch authenticated users from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          reservations!reservations_client_id_fkey(count)
        `)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch invited users from invited_users
      const { data: invitedData, error: invitedError } = await supabase
        .from('invited_users')
        .select('*')
        .order('full_name');

      if (invitedError) throw invitedError;

      // Combine both datasets
      const allUsers = [
        ...(profilesData || []).map(user => ({
          ...user,
          _count: {
            reservations: user.reservations?.length || 0
          },
          user_type: 'authenticated' as const
        })),
        ...(invitedData || []).map(invited => ({
          ...invited,
          created_at: invited.invited_at,
          _count: {
            reservations: 0
          },
          user_type: 'invited' as const
        }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    }
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
  };

  const fetchEmployeeServices = async () => {
    const { data, error } = await supabase
      .from('employee_services')
      .select(`
        employee_id,
        service_id,
        services(name)
      `);
    
    if (error) {
      console.error('Error fetching employee services:', error);
    } else {
      setEmployeeServices(data || []);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.account_status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = "El nombre es requerido";
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = "El nombre debe tener al menos 2 caracteres";
    }
    
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Formato de email inválido";
    } else if (!editingUser) {
      // Only check for existing email when creating new users
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        errors.email = "Ya existe un usuario con este email";
      }
    }
    
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^(\+34|0034|34)?[6-9]\d{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
        errors.phone = "Formato de teléfono inválido (ej: +34 123 456 789)";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            email: formData.email.toLowerCase().trim(),
            full_name: formData.full_name.trim(),
            phone: formData.phone?.trim() || null,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente"
        });
      } else {
        // Create new invited user
        const success = await createInvitedUser({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role
        } as InvitedUserData);

        if (!success) {
          return;
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || "",
      role: user.role
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      role: "client"
    });
    setFormErrors({});
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Estado del usuario actualizado a ${newStatus === 'active' ? 'activo' : 'inactivo'}`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  const openServicesDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const currentServices = getEmployeeServices(employeeId);
    setSelectedServiceIds(currentServices.map(s => s.service_id));
    setServicesDialogOpen(true);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const saveEmployeeServices = async () => {
    try {
      // Remove existing services for this employee
      await supabase
        .from('employee_services')
        .delete()
        .eq('employee_id', selectedEmployeeId);

      // Add new services
      if (selectedServiceIds.length > 0) {
        const serviceData = selectedServiceIds.map(serviceId => ({
          employee_id: selectedEmployeeId,
          service_id: serviceId
        }));

        const { error } = await supabase
          .from('employee_services')
          .insert(serviceData);

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Servicios del empleado actualizados"
      });

      setServicesDialogOpen(false);
      fetchEmployeeServices();
    } catch (error) {
      console.error('Error saving employee services:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los servicios",
        variant: "destructive"
      });
    }
  };

  const getEmployeeServices = (employeeId: string) => {
    return employeeServices.filter(es => es.employee_id === employeeId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'employee': return 'Empleado';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">Gestión de Usuarios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra clientes, empleados y administradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Total: {filteredUsers.length} usuarios
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Usuario</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {Object.keys(formErrors).length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Por favor corrige los errores en el formulario
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value.toLowerCase()});
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="correo@ejemplo.com"
                    className={formErrors.email ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({...formData, full_name: e.target.value});
                      if (formErrors.full_name) {
                        setFormErrors(prev => ({ ...prev, full_name: "" }));
                      }
                    }}
                    placeholder="Nombre completo"
                    className={formErrors.full_name ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.full_name && (
                    <p className="text-sm text-destructive">{formErrors.full_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: "" }));
                      }
                    }}
                    placeholder="Ej: +34 123 456 789"
                    className={formErrors.phone ? "border-destructive" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-destructive">{formErrors.phone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={formData.role} onValueChange={(value: "client" | "employee" | "admin") => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={creatingUser}
                  >
                    {creatingUser ? 'Procesando...' : editingUser ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    disabled={creatingUser}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <CollapsibleFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Buscar usuario..."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          </CollapsibleFilter>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Rol</TableHead>
                  <TableHead className="hidden lg:table-cell">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Reservas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={getStatusBadgeColor(user.account_status)}>
                        {getStatusText(user.account_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {user._count?.reservations || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {user.role === 'employee' && (
                            <DropdownMenuItem onClick={() => openServicesDialog(user.id)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Servicios
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => updateUserStatus(
                              user.id, 
                              user.account_status === 'active' ? 'inactive' : 'active'
                            )}
                          >
                            {user.account_status === 'active' ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Services Dialog */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar Servicios del Empleado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servicios disponibles</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <Label htmlFor={service.id} className="text-sm">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveEmployeeServices} className="flex-1">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setServicesDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 