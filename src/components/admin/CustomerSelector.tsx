import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Phone, Plus } from "lucide-react";
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

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void;
}

export const CustomerSelector = ({ onSelect }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch from both profiles and invited_users tables
      const [profilesResponse, invitedUsersResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .in('role', ['client', 'employee'])
          .eq('account_status', 'active')
          .order('full_name'),
        supabase
          .from('invited_users')
          .select('*')
          .eq('is_guest_user', true)
          .order('full_name')
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (invitedUsersResponse.error) throw invitedUsersResponse.error;

      // Combine both datasets
      const allCustomers = [
        ...(profilesResponse.data || []),
        ...(invitedUsersResponse.data || []).map(user => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role || 'client',
          account_status: user.account_status,
          created_at: user.invited_at
        }))
      ];

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

  const getAccountStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'guest':
        return 'Invitado';
      case 'invited':
        return 'Pendiente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Cargando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredCustomers.length} resultado(s) encontrado(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{customer.full_name}</h3>
                        <Badge className={getRoleBadgeColor(customer.role)} variant="secondary">
                          {getRoleText(customer.role)}
                        </Badge>
                        {customer.account_status === 'guest' && (
                          <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                            {getAccountStatusText(customer.account_status)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground">
                        Cliente desde: {new Date(customer.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => onSelect(customer)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Seleccionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};