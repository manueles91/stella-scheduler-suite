import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Filter, Settings, Package, Percent, Image } from "lucide-react";
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
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
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
    await Promise.all([fetchServices(), fetchEmployees(), fetchCategories(), fetchDiscounts(), fetchCombos()]);
  };
  const fetchServices = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('services').select(`
          *,
          service_categories (
            id,
            name
          )
        `).order('name');
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
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, full_name, email, role').in('role', ['employee', 'admin']).order('full_name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };
  const fetchCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("service_categories").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const fetchDiscounts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("discounts").select(`
          *,
          services (
            name
          )
        `).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    }
  };
  const fetchCombos = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("combos").select(`
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
        `).order("created_at", {
        ascending: false
      });
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
      const {
        error
      } = await supabase.from('services').delete().eq('id', serviceId);
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
  const handleDeleteDiscount = async (discountId: string) => {
    try {
      const {
        error
      } = await supabase.from('discounts').delete().eq('id', discountId);
      if (error) throw error;
      toast({
        title: "Descuento eliminado",
        description: "El descuento se eliminó correctamente"
      });
      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el descuento",
        variant: "destructive"
      });
    }
  };
  const handleDeleteCombo = async (comboId: string) => {
    try {
      const {
        error
      } = await supabase.from('combos').delete().eq('id', comboId);
      if (error) throw error;
      toast({
        title: "Combo eliminado",
        description: "El combo se eliminó correctamente"
      });
      fetchCombos();
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el combo",
        variant: "destructive"
      });
    }
  };

  // Helper functions
  const isDiscountActive = (discount: Discount) => {
    if (!discount.is_active) return false;
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return start <= now && end >= now;
  };
  const computeServiceDiscount = (service: Service) => {
    const now = new Date();
    const activeDiscounts = discounts.filter(d => {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);
      return d.service_id === service.id && d.is_active && start <= now && end >= now;
    });
    const computeSavings = (disc: Discount) => {
      if (disc.discount_type === 'percentage') {
        return Math.round(service.price_cents * (disc.discount_value / 100));
      }
      return Math.min(Math.round(disc.discount_value * 100), service.price_cents);
    };
    const bestDiscount = activeDiscounts.reduce((best: Discount | null, curr: Discount) => {
      const bestSave = best ? computeSavings(best) : 0;
      const currSave = computeSavings(curr);
      return currSave > bestSave ? curr : best;
    }, null);
    const savings = bestDiscount ? computeSavings(bestDiscount) : 0;
    const finalPrice = Math.max(0, service.price_cents - savings);
    return {
      bestDiscount,
      savings,
      finalPrice
    };
  };
  const filteredServices = services.filter(service => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "none") return !service.category_id;
    return service.category_id === categoryFilter;
  });
  return <div className="space-y-6">
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="discounts">Descuentos y Combos</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Services Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Servicios</h2>
            {!isReadOnly && <Button onClick={() => {
            setEditingService(null);
            setServiceDialogOpen(true);
          }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>}
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
                {categories.map(category => <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            {!isReadOnly && <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Categorías
              </Button>}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map(service => {
            const {
              bestDiscount,
              savings,
              finalPrice
            } = computeServiceDiscount(service);
            return <div key={service.id} className="relative group">
                  <ServiceCard id={service.id} name={service.name} description={service.description} originalPrice={service.price_cents} finalPrice={finalPrice} savings={savings} duration={service.duration_minutes} imageUrl={service.image_url} type="service" discountType={bestDiscount?.discount_type} discountValue={bestDiscount?.discount_value} variablePrice={service.variable_price ?? false} onSelect={() => handleEditService(service)} variant="admin" showExpandable={true} className="relative" adminBadges={<>
                        <Badge variant={service.is_active ? "default" : "secondary"} className={`text-xs font-medium shadow-lg ${service.is_active ? 'bg-green-600 text-white border border-green-500' : 'bg-gray-600 text-white border border-gray-500'}`}>
                          {service.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        {service.service_categories?.name && <Badge variant="outline" className="text-xs bg-white/80 text-gray-800 border-gray-300">
                            {service.service_categories.name}
                          </Badge>}
                      </>} adminButtons={!isReadOnly ? <>
                          <Button variant="secondary" size="sm" onClick={e => {
                  e.stopPropagation();
                  handleEditService(service);
                }} className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200">
                            <Pencil className="h-3 w-3 text-gray-700" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={e => {
                  e.stopPropagation();
                  handleDeleteService(service.id);
                }} className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500">
                            <Trash2 className="h-3 w-3 text-white" />
                          </Button>
                        </> : undefined} />
                </div>;
          })}
          </div>

          {/* Empty States */}
          {filteredServices.length === 0 && services.length > 0 && <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No hay servicios en esta categoría.</p>
                  <p className="text-sm text-muted-foreground">
                    Cambia el filtro para ver otros servicios o crea un nuevo servicio.
                  </p>
                </div>
              </CardContent>
            </Card>}

          {services.length === 0 && <Card>
              <CardContent className="p-8 text-center">
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground mt-4">No hay servicios creados</p>
                  <p className="text-sm text-muted-foreground">Crea tu primer servicio para comenzar</p>
                </div>
              </CardContent>
            </Card>}
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
                {!isReadOnly && <Button onClick={() => {
                setEditingDiscount(null);
                setDiscountDialogOpen(true);
              }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Descuento
                  </Button>}
              </div>
              
              <div className="grid gap-4">
                {discounts.length === 0 ? <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Percent className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No hay descuentos creados</p>
                      <p className="text-sm text-muted-foreground">Crea tu primer descuento para comenzar</p>
                    </CardContent>
                  </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discounts.map(discount => {
                  const associatedService = services.find(s => s.id === discount.service_id);
                  if (!associatedService) return null;
                  return <div key={discount.id} className="relative group">
                          <ServiceCard id={associatedService.id} name={associatedService.name} description={associatedService.description} originalPrice={associatedService.price_cents} finalPrice={discount.discount_type === 'percentage' ? Math.round(associatedService.price_cents * (1 - discount.discount_value / 100)) : Math.round(associatedService.price_cents - discount.discount_value * 100)} savings={discount.discount_type === 'percentage' ? Math.round(associatedService.price_cents * (discount.discount_value / 100)) : discount.discount_value * 100} duration={associatedService.duration_minutes} imageUrl={associatedService.image_url} type="discount" discountType={discount.discount_type} discountValue={discount.discount_value} variablePrice={associatedService.variable_price ?? false} onSelect={() => handleEditDiscount(discount)} variant="admin" showExpandable={true} className="relative" adminBadges={<>
                                <Badge variant={isDiscountActive(discount) ? "default" : "secondary"} className={`text-xs font-medium shadow-lg ${isDiscountActive(discount) ? 'bg-green-600 text-white border border-green-500' : 'bg-gray-600 text-white border border-gray-500'}`}>
                                  {isDiscountActive(discount) ? "Activo" : "Inactivo"}
                                </Badge>
                              </>} adminButtons={!isReadOnly ? <>
                                  <Button variant="secondary" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleEditDiscount(discount);
                      }} className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200">
                                    <Pencil className="h-3 w-3 text-gray-700" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleDeleteDiscount(discount.id);
                      }} className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500">
                                    <Trash2 className="h-3 w-3 text-white" />
                                  </Button>
                                </> : undefined} />
                        </div>;
                })}
                  </div>}
              </div>
            </TabsContent>

            <TabsContent value="combos" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Combos</h3>
                {!isReadOnly && <Button onClick={() => {
                setEditingCombo(null);
                setComboDialogOpen(true);
              }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Combo
                  </Button>}
              </div>

              {/* Combos Grid */}
              <div className="grid gap-4">
                {combos.length === 0 ? <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No hay combos creados</p>
                      <p className="text-sm text-muted-foreground">Crea tu primer combo para comenzar</p>
                    </CardContent>
                  </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combos.map(combo => {
                  const comboServices = combo.combo_services.map(cs => ({
                    name: cs.services.name,
                    quantity: cs.quantity,
                    service_id: cs.service_id
                  }));
                  const discountPercentage = Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100);
                  return <div key={combo.id} className="relative group">
                          <ComboCard id={combo.id} name={combo.name} description={combo.description} originalPrice={combo.original_price_cents} finalPrice={combo.total_price_cents} savings={combo.original_price_cents - combo.total_price_cents} imageUrl={combo.image_url} comboServices={comboServices} onSelect={() => handleEditCombo(combo)} variant="admin" showExpandable={true} className="relative" adminBadges={<>
                                <Badge variant={combo.is_active ? "default" : "secondary"} className={`text-xs font-medium shadow-lg ${combo.is_active ? 'bg-green-600 text-white border border-green-500' : 'bg-gray-600 text-white border border-gray-500'}`}>
                                  {combo.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs font-medium shadow-lg bg-red-500 text-white border border-red-400">
                                  {discountPercentage}% OFF
                                </Badge>
                              </>} adminButtons={!isReadOnly ? <>
                                  <Button variant="secondary" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleEditCombo(combo);
                      }} className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200">
                                    <Pencil className="h-3 w-3 text-gray-700" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleDeleteCombo(combo.id);
                      }} className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500">
                                    <Trash2 className="h-3 w-3 text-white" />
                                  </Button>
                                </> : undefined} />
                        </div>;
                })}
                  </div>}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServiceDialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen} service={editingService} onServiceSaved={fetchServices} categories={categories} employees={employees} isReadOnly={isReadOnly} />

      <DiscountDialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen} discount={editingDiscount} onDiscountSaved={fetchDiscounts} services={services} isReadOnly={isReadOnly} />

      <ComboDialog open={comboDialogOpen} onOpenChange={setComboDialogOpen} combo={editingCombo} onComboSaved={fetchCombos} services={services} employees={employees} isReadOnly={isReadOnly} />

      <ServiceCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} onCategoryUpdated={fetchCategories} />
    </div>;
};