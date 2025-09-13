import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Filter, Settings, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { ComboCard } from "@/components/cards/ComboCard";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceDialog, DiscountDialog, ComboDialog, ServiceCategoryDialog } from "./services";

// Import interfaces from the original file for now
interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  category_id?: string;
  variable_price?: boolean;
  service_categories?: {
    id: string;
    name: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Discount {
  id: string;
  service_id: string;
  name?: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_public: boolean;
  discount_code: string | null;
  is_active: boolean;
  created_at: string;
  service?: {
    name: string;
  };
}

interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
  image_url?: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  combo_services: {
    service_id: string;
    quantity: number;
    services: {
      name: string;
      price_cents: number;
      duration_minutes: number;
    };
  }[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export const AdminServices = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isReadOnly = profile?.role !== 'admin';

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  
  // Editing states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchServices(),
      fetchEmployees(),
      fetchCategories(),
      fetchDiscounts(),
      fetchCombos()
    ]);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_categories (
            id,
            name
          )
        `)
        .order('name');
        
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['employee', 'admin'])
        .order('full_name');
        
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select(`
          *,
          services (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    }
  };

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase
        .from("combos")
        .select(`
          *,
          combo_services (
            service_id,
            quantity,
            services (
              name,
              price_cents,
              duration_minutes
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCombos(data || []);
    } catch (error) {
      console.error("Error fetching combos:", error);
    }
  };

  // Event handlers
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountDialogOpen(true);
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setComboDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      toast({
        title: "Servicio eliminado",
        description: "El servicio se eliminó correctamente"
      });
      
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive"
      });
    }
  };

  const filteredServices = services.filter(service => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "none") return !service.category_id;
    return service.category_id === categoryFilter;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="discounts">Descuentos y Combos</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Services Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
            {!isReadOnly && (
              <Button onClick={() => {
                setEditingService(null);
                setServiceDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 items-center">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Categorías
              </Button>
            )}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                description={service.description}
                duration={service.duration_minutes}
                originalPrice={service.price_cents}
                finalPrice={service.price_cents}
                savings={0}
                imageUrl={service.image_url}
                variant="admin"
                adminBadges={
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                }
                adminButtons={
                  !isReadOnly ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : undefined
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Tabs defaultValue="discounts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discounts">Descuentos</TabsTrigger>
              <TabsTrigger value="combos">Combos</TabsTrigger>
            </TabsList>

            <TabsContent value="discounts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Descuentos</h3>
                {!isReadOnly && (
                  <Button onClick={() => {
                    setEditingDiscount(null);
                    setDiscountDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Descuento
                  </Button>
                )}
              </div>
              
              {/* Discounts would be rendered here */}
              <p className="text-muted-foreground">Discounts display logic here...</p>
            </TabsContent>

            <TabsContent value="combos" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Combos</h3>
                {!isReadOnly && (
                  <Button onClick={() => {
                    setEditingCombo(null);
                    setComboDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Combo
                  </Button>
                )}
              </div>

              {/* Combos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map(combo => (
                  <ComboCard
                    key={combo.id}
                    id={combo.id}
                    name={combo.name}
                    description={combo.description}
                    originalPrice={combo.original_price_cents}
                    finalPrice={combo.total_price_cents}
                    savings={combo.original_price_cents - combo.total_price_cents}
                    imageUrl={combo.image_url}
                    comboServices={combo.combo_services.map(cs => ({
                      name: cs.services.name,
                      quantity: cs.quantity,
                      service_id: cs.service_id
                    }))}
                    variant="admin"
                    adminButtons={
                      !isReadOnly ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditCombo(combo)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        onServiceSaved={fetchServices}
        categories={categories}
        employees={employees}
        isReadOnly={isReadOnly}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        discount={editingDiscount}
        onDiscountSaved={fetchDiscounts}
        services={services}
        isReadOnly={isReadOnly}
      />

      <ComboDialog
        open={comboDialogOpen}
        onOpenChange={setComboDialogOpen}
        combo={editingCombo}
        onComboSaved={fetchCombos}
        services={services}
        employees={employees}
        isReadOnly={isReadOnly}
      />

      <ServiceCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCategoryUpdated={fetchCategories}
      />
    </div>
  );
};