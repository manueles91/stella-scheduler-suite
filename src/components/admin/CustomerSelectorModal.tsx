import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, User, Mail, Phone, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['client', 'employee'])
        .eq('account_status', 'active')
        .order('full_name');

      if (error) throw error;
      setCustomers(data || []);
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

  const createNewCustomer = async () => {
    if (!newCustomer.full_name || !newCustomer.email) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive"
      });
      return;
    }

    // For now, we'll create a temporary customer object that can be used for guest bookings
    // In a real implementation, you'd want to create a proper user account
    const tempCustomer: Customer = {
      id: `temp-${Date.now()}`, // Temporary ID for guest bookings
      full_name: newCustomer.full_name,
      email: newCustomer.email,
      phone: newCustomer.phone || undefined,
      role: 'client',
      account_status: 'active',
      created_at: new Date().toISOString()
    };

    toast({
      title: "Información",
      description: "Se usará como cliente invitado para esta reserva",
    });

    onValueChange(tempCustomer);
    setOpen(false);
    setShowNewCustomer(false);
    setNewCustomer({ full_name: "", email: "", phone: "" });
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Teléfono (opcional)</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createNewCustomer} size="sm">
                Crear Cliente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewCustomer(false)}
                size="sm"
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