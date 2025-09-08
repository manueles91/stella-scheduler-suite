import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, User, Mail, Phone, Plus, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInvitedUsers } from "./hooks/useInvitedUsers";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  account_status: string;
  created_at: string;
}

interface CustomerSelectorModalProps {
  value?: Customer | null;
  onValueChange: (customer: Customer | null) => void;
  trigger?: React.ReactNode;
}

export const CustomerSelectorModal = ({ 
  value, 
  onValueChange, 
  trigger 
}: CustomerSelectorModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    email: "",
    phone: ""
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { createGuestCustomerForBooking, loading: creatingGuest } = useInvitedUsers();

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // First, let's test if we can access the invited_users table at all
      const { data: testData, error: testError } = await supabase
        .from('invited_users')
        .select('id, full_name, email, role, account_status')
        .limit(5);

      console.log('Test query result:', testData);
      if (testError) console.log('Test query error:', testError);

      // Fetch both authenticated users and invited users who haven't been claimed
      const [profilesResponse, invitedResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .in('role', ['client', 'employee', 'admin'])
          .eq('account_status', 'active')
          .order('full_name'),
        supabase
          .from('invited_users')
          .select('*')
          .in('role', ['client', 'employee'])
          // Include both 'invited' (admin-created) and 'guest' (landing page) users
          .in('account_status', ['invited', 'guest'])
          .is('claimed_at', null)
          .order('full_name')
      ]);

      // Debug logging to see what we're getting
      console.log('Profiles response:', profilesResponse);
      console.log('Invited users response:', invitedResponse);

      if (profilesResponse.error) throw profilesResponse.error;
      if (invitedResponse.error) throw invitedResponse.error;

      // Combine both datasets
      const allCustomers = [
        ...(profilesResponse.data || []),
        ...(invitedResponse.data || []).map(invited => ({
          ...invited,
          created_at: invited.invited_at
        }))
      ];

      console.log('Combined customers:', allCustomers);
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
    setFilteredCustomers(filtered);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newCustomer.full_name.trim()) {
      errors.full_name = "El nombre es requerido";
    } else if (newCustomer.full_name.trim().length < 2) {
      errors.full_name = "El nombre debe tener al menos 2 caracteres";
    }
    
    if (!newCustomer.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = "Formato de email inválido";
    }
    
    if (newCustomer.phone && newCustomer.phone.trim()) {
      const phoneRegex = /^(\+506|00506|506)?[2-9]\d{7}$/;
      if (!phoneRegex.test(newCustomer.phone.replace(/\s+/g, ""))) {
        errors.phone = "Formato de teléfono inválido (ej: 88887777 o +506 88887777)";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createNewCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    const guestCustomer = await createGuestCustomerForBooking(newCustomer);
    if (!guestCustomer) {
      return;
    }

    if (guestCustomer.isExisting) {
      toast({
        title: "Cliente encontrado",
        description: "Se encontró un cliente existente con este email",
        duration: 4000
      });
    } else {
      toast({
        title: "Cliente creado",
        description: "Se creó un cliente invitado para esta reserva",
        duration: 4000
      });
    }

    onValueChange(guestCustomer);
    setOpen(false);
    setShowNewCustomer(false);
    setNewCustomer({ full_name: "", email: "", phone: "" });
    setValidationErrors({});
  };

  const selectCustomer = (customer: Customer) => {
    onValueChange(customer);
    setOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'client':
        return 'Cliente';
      case 'employee':
        return 'Empleado';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            {value ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{value.full_name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Seleccionar cliente</span>
              </div>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* New Customer Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowNewCustomer(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Nuevo Cliente
          </Button>

          {/* Results count */}
          {searchTerm && (
            <p className="text-sm text-muted-foreground">
              {filteredCustomers.length} resultado(s) encontrado(s)
            </p>
          )}

          {/* Customer List */}
          <div className="flex-1 overflow-auto space-y-2 max-h-60">
            {loading ? (
              <div className="text-center py-4">
                <p>Cargando clientes...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.full_name}</span>
                        <Badge className={getRoleBadgeColor(customer.role)} variant="secondary">
                          {getRoleText(customer.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {value?.id === customer.id && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Customer Form */}
        {showNewCustomer && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Crear Nuevo Cliente</h4>
            
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Por favor corrige los errores en el formulario
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  value={newCustomer.full_name}
                  onChange={(e) => {
                    setNewCustomer(prev => ({ ...prev, full_name: e.target.value }));
                    if (validationErrors.full_name) {
                      setValidationErrors(prev => ({ ...prev, full_name: "" }));
                    }
                  }}
                  placeholder="Nombre completo"
                  className={validationErrors.full_name ? "border-destructive" : ""}
                />
                {validationErrors.full_name && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.full_name}</p>
                )}
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => {
                    setNewCustomer(prev => ({ ...prev, email: e.target.value.toLowerCase() }));
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: "" }));
                    }
                  }}
                  placeholder="correo@ejemplo.com"
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label>Teléfono (opcional)</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => {
                    setNewCustomer(prev => ({ ...prev, phone: e.target.value }));
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: "" }));
                    }
                  }}
                  placeholder="Ej: 88887777 o +506 88887777"
                  className={validationErrors.phone ? "border-destructive" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={createNewCustomer} 
                size="sm"
                disabled={creatingGuest}
              >
                {creatingGuest ? "Creando..." : "Crear Cliente"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewCustomer(false);
                  setValidationErrors({});
                  setNewCustomer({ full_name: "", email: "", phone: "" });
                }}
                size="sm"
                disabled={creatingGuest}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};