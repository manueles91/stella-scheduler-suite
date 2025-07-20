import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Percent, DollarSign, Calendar, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, X } from "lucide-react";
interface Discount {
  id: string;
  service_id: string;
  name: string;
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
interface Service {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
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
const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [comboLoading, setComboLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    service_id: "",
    name: "",
    description: "",
    discount_type: "percentage" as 'percentage' | 'flat',
    discount_value: "",
    start_date: "",
    end_date: "",
    is_public: true,
    discount_code: "",
    is_active: true
  });

  const [comboFormData, setComboFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    pricing_type: "percentage" as "percentage" | "fixed",
    discount_percentage: 20,
    fixed_price: 0,
    services: [] as { service_id: string; quantity: number }[]
  });
  useEffect(() => {
    fetchDiscounts();
    fetchCombos();
    fetchServices();
  }, []);
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
      toast({
        title: "Error",
        description: "No se pudieron cargar los descuentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchServices = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("services").select("id, name, price_cents, duration_minutes").eq("is_active", true).order("name");
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
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
      toast({
        title: "Error",
        description: "No se pudieron cargar los combos",
        variant: "destructive"
      });
    } finally {
      setComboLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_id || !formData.name || !formData.discount_value || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    if (!formData.is_public && !formData.discount_code) {
      toast({
        title: "Error",
        description: "Los descuentos privados requieren un código",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");
      const discountData = {
        service_id: formData.service_id,
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
        // Set to end of day
        is_public: formData.is_public,
        discount_code: formData.is_public ? null : formData.discount_code,
        is_active: formData.is_active,
        created_by: user.id
      };
      let error;
      if (editingDiscount) {
        const {
          error: updateError
        } = await supabase.from("discounts").update(discountData).eq("id", editingDiscount.id);
        error = updateError;
      } else {
        const {
          error: insertError
        } = await supabase.from("discounts").insert([discountData]);
        error = insertError;
      }
      if (error) throw error;
      toast({
        title: "Éxito",
        description: `Descuento ${editingDiscount ? "actualizado" : "creado"} correctamente`
      });
      fetchDiscounts();
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving discount:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el descuento",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      service_id: discount.service_id,
      name: discount.name,
      description: discount.description || "",
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      start_date: discount.start_date.split('T')[0],
      end_date: discount.end_date.split('T')[0],
      is_public: discount.is_public,
      discount_code: discount.discount_code || "",
      is_active: discount.is_active
    });
    setDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este descuento?")) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Éxito",
        description: "Descuento eliminado correctamente"
      });
      fetchDiscounts();
    } catch (error: any) {
      console.error("Error deleting discount:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el descuento",
        variant: "destructive"
      });
    }
  };
  const resetForm = () => {
    setFormData({
      service_id: "",
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      start_date: "",
      end_date: "",
      is_public: true,
      discount_code: "",
      is_active: true
    });
    setEditingDiscount(null);
  };

  const resetComboForm = () => {
    setComboFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      is_active: true,
      pricing_type: "percentage",
      discount_percentage: 20,
      fixed_price: 0,
      services: []
    });
    setEditingCombo(null);
  };

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comboFormData.name || !comboFormData.start_date || !comboFormData.end_date || comboFormData.services.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos y selecciona al menos un servicio",
        variant: "destructive"
      });
      return;
    }

    // Validate pricing fields
    if (comboFormData.pricing_type === "percentage") {
      if (comboFormData.discount_percentage < 0 || comboFormData.discount_percentage > 100) {
        toast({
          title: "Error",
          description: "El porcentaje de descuento debe estar entre 0% y 100%",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (comboFormData.fixed_price <= 0) {
        toast({
          title: "Error",
          description: "El precio fijo debe ser mayor que 0",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Calculate original and total prices
      const originalPrice = comboFormData.services.reduce((total, comboService) => {
        const service = services.find(s => s.id === comboService.service_id);
        return total + (service ? service.price_cents * comboService.quantity : 0);
      }, 0);

      // Calculate total price based on pricing type
      let totalPrice: number;
      if (comboFormData.pricing_type === "percentage") {
        const discountMultiplier = (100 - comboFormData.discount_percentage) / 100;
        totalPrice = Math.round(originalPrice * discountMultiplier);
      } else {
        totalPrice = comboFormData.fixed_price * 100; // Convert to cents
      }

      const comboData = {
        name: comboFormData.name,
        description: comboFormData.description,
        total_price_cents: totalPrice,
        original_price_cents: originalPrice,
        start_date: new Date(comboFormData.start_date).toISOString(),
        end_date: new Date(comboFormData.end_date + 'T23:59:59').toISOString(),
        is_active: comboFormData.is_active,
        created_by: user.id
      };

      let error;
      let comboId: string;

      if (editingCombo) {
        const { error: updateError } = await supabase
          .from("combos")
          .update(comboData)
          .eq("id", editingCombo.id);
        error = updateError;
        comboId = editingCombo.id;

        // Delete existing combo services
        if (!error) {
          await supabase
            .from("combo_services")
            .delete()
            .eq("combo_id", editingCombo.id);
        }
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("combos")
          .insert([comboData])
          .select()
          .single();
        error = insertError;
        comboId = insertData?.id;
      }

      if (error) throw error;

      // Insert combo services
      const comboServices = comboFormData.services.map(service => ({
        combo_id: comboId,
        service_id: service.service_id,
        quantity: service.quantity
      }));

      const { error: servicesError } = await supabase
        .from("combo_services")
        .insert(comboServices);

      if (servicesError) throw servicesError;

      toast({
        title: "Éxito",
        description: `Combo ${editingCombo ? "actualizado" : "creado"} correctamente`
      });

      fetchCombos();
      resetComboForm();
      setComboDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving combo:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el combo",
        variant: "destructive"
      });
    }
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    
    // Calculate discount percentage from existing prices
    const discountPercentage = combo.original_price_cents > 0 
      ? Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100)
      : 20;
    
    setComboFormData({
      name: combo.name,
      description: combo.description || "",
      start_date: combo.start_date.split('T')[0],
      end_date: combo.end_date.split('T')[0],
      is_active: combo.is_active,
      pricing_type: "percentage", // Default to percentage when editing
      discount_percentage: discountPercentage,
      fixed_price: Math.round(combo.total_price_cents / 100), // Convert from cents
      services: combo.combo_services.map(cs => ({
        service_id: cs.service_id,
        quantity: cs.quantity
      }))
    });
    setComboDialogOpen(true);
  };

  const handleDeleteCombo = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este combo?")) {
      return;
    }

    try {
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Combo eliminado correctamente"
      });
      fetchCombos();
    } catch (error: any) {
      console.error("Error deleting combo:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el combo",
        variant: "destructive"
      });
    }
  };

  const addServiceToCombo = () => {
    setComboFormData({
      ...comboFormData,
      services: [...comboFormData.services, { service_id: "", quantity: 1 }]
    });
  };

  const removeServiceFromCombo = (index: number) => {
    setComboFormData({
      ...comboFormData,
      services: comboFormData.services.filter((_, i) => i !== index)
    });
  };

  const updateComboService = (index: number, field: 'service_id' | 'quantity', value: string | number) => {
    const updatedServices = [...comboFormData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setComboFormData({
      ...comboFormData,
      services: updatedServices
    });
  };

  const getComboOriginalPrice = () => {
    return comboFormData.services.reduce((total, comboService) => {
      const service = services.find(s => s.id === comboService.service_id);
      return total + (service ? service.price_cents * comboService.quantity : 0);
    }, 0);
  };

  const getComboTotalPrice = () => {
    const originalPrice = getComboOriginalPrice();
    if (comboFormData.pricing_type === "percentage") {
      const discountMultiplier = (100 - comboFormData.discount_percentage) / 100;
      return Math.round(originalPrice * discountMultiplier);
    } else {
      return comboFormData.fixed_price * 100; // Convert to cents
    }
  };

  const formatDiscountValue = (value: number, type: string) => {
    return type === 'percentage' ? `${value}%` : `₡${Math.round(value)}`;
  };
  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return discount.is_active && start <= now && end >= now;
  };
  if (loading || comboLoading) {
    return <div className="flex justify-center items-center h-48">Cargando...</div>;
  }

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl">Promociones y Descuentos</h2>
      </div>

      <Tabs defaultValue="discounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Descuentos
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Combos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Gestión de Descuentos</h3>
        <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Descuento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? "Editar Descuento" : "Nuevo Descuento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_id">Servicio *</Label>
                  <Select value={formData.service_id} onValueChange={value => setFormData({
                  ...formData,
                  service_id: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Nombre del Descuento *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} placeholder="Ej: Descuento de Verano" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Descripción del descuento" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Tipo de Descuento *</Label>
                  <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'flat') => setFormData({
                  ...formData,
                  discount_type: value
                })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="flat">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Valor del Descuento * {formData.discount_type === 'percentage' ? '(%)' : '(₡)'}
                  </Label>
                  <Input id="discount_value" type="number" step="0.01" min="0" max={formData.discount_type === 'percentage' ? "100" : undefined} value={formData.discount_value} onChange={e => setFormData({
                  ...formData,
                  discount_value: e.target.value
                })} placeholder={formData.discount_type === 'percentage' ? "20" : "50"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio *</Label>
                  <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData({
                  ...formData,
                  start_date: e.target.value
                })} />
                </div>
                <div>
                  <Label htmlFor="end_date">Fecha de Fin *</Label>
                  <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData({
                  ...formData,
                  end_date: e.target.value
                })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_public" checked={formData.is_public} onCheckedChange={checked => setFormData({
                  ...formData,
                  is_public: checked
                })} />
                  <Label htmlFor="is_public">Descuento Público</Label>
                </div>

                {!formData.is_public && <div>
                    <Label htmlFor="discount_code">Código de Descuento *</Label>
                    <Input id="discount_code" value={formData.discount_code} onChange={e => setFormData({
                  ...formData,
                  discount_code: e.target.value.toUpperCase()
                })} placeholder="CODIGO20" />
                  </div>}

                <div className="flex items-center space-x-2">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({
                  ...formData,
                  is_active: checked
                })} />
                  <Label htmlFor="is_active">Activo</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDiscount ? "Actualizar" : "Crear"} Descuento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {discounts.length === 0 ? <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Percent className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No hay descuentos creados</p>
              <p className="text-sm text-muted-foreground">Crea tu primer descuento para comenzar</p>
            </CardContent>
          </Card> : discounts.map(discount => <Card key={discount.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{discount.name}</CardTitle>
                  <Badge variant={isDiscountActive(discount) ? "default" : "secondary"}>
                    {isDiscountActive(discount) ? "Activo" : "Inactivo"}
                  </Badge>
                  {!discount.is_public && <Badge variant="outline">
                      <Code className="mr-1 h-3 w-3" />
                      {discount.discount_code}
                    </Badge>}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(discount)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(discount.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Servicio</p>
                    <p>{discount.service?.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Descuento</p>
                    <p className="flex items-center">
                      {discount.discount_type === 'percentage' ? <Percent className="mr-1 h-4 w-4" /> : <DollarSign className="mr-1 h-4 w-4" />}
                      {formatDiscountValue(discount.discount_value, discount.discount_type)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Inicio</p>
                    <p className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {format(new Date(discount.start_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Fin</p>
                    <p className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {format(new Date(discount.end_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                {discount.description && <div className="mt-3">
                    <p className="text-sm text-muted-foreground">{discount.description}</p>
                  </div>}
              </CardContent>
            </Card>)}
          </div>
        </TabsContent>

        <TabsContent value="combos" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Gestión de Combos</h3>
            <Dialog open={comboDialogOpen} onOpenChange={(open) => {
              setComboDialogOpen(open);
              if (!open) resetComboForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Combo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCombo ? "Editar Combo" : "Nuevo Combo"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleComboSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combo_name">Nombre del Combo *</Label>
                      <Input 
                        id="combo_name" 
                        value={comboFormData.name}
                        onChange={(e) => setComboFormData({...comboFormData, name: e.target.value})}
                        placeholder="Ej: Paquete Relajación Total" 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="combo_active" 
                        checked={comboFormData.is_active}
                        onCheckedChange={(checked) => setComboFormData({...comboFormData, is_active: checked})}
                      />
                      <Label htmlFor="combo_active">Activo</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="combo_description">Descripción</Label>
                    <Textarea 
                      id="combo_description" 
                      value={comboFormData.description}
                      onChange={(e) => setComboFormData({...comboFormData, description: e.target.value})}
                      placeholder="Descripción del combo" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combo_start_date">Fecha de Inicio *</Label>
                      <Input 
                        id="combo_start_date" 
                        type="date" 
                        value={comboFormData.start_date}
                        onChange={(e) => setComboFormData({...comboFormData, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="combo_end_date">Fecha de Fin *</Label>
                      <Input 
                        id="combo_end_date" 
                        type="date" 
                        value={comboFormData.end_date}
                        onChange={(e) => setComboFormData({...comboFormData, end_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Tipo de Precio *</Label>
                      <Select 
                        value={comboFormData.pricing_type}
                        onValueChange={(value: "percentage" | "fixed") => setComboFormData({...comboFormData, pricing_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Descuento por Porcentaje</SelectItem>
                          <SelectItem value="fixed">Precio Fijo Total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {comboFormData.pricing_type === "percentage" ? (
                      <div>
                        <Label htmlFor="discount_percentage">Porcentaje de Descuento *</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id="discount_percentage" 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="1"
                            value={comboFormData.discount_percentage}
                            onChange={(e) => setComboFormData({...comboFormData, discount_percentage: parseFloat(e.target.value) || 0})}
                            placeholder="20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="fixed_price">Precio Total Fijo *</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">₡</span>
                          <Input 
                            id="fixed_price" 
                            type="number" 
                            min="0" 
                            step="1"
                            value={comboFormData.fixed_price}
                            onChange={(e) => setComboFormData({...comboFormData, fixed_price: parseFloat(e.target.value) || 0})}
                            placeholder="50000"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Servicios del Combo *</Label>
                      <Button type="button" onClick={addServiceToCombo} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Servicio
                      </Button>
                    </div>
                    
                    {comboFormData.services.map((comboService, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-5 gap-4 items-end">
                          <div className="col-span-3">
                            <Label>Servicio</Label>
                            <Select 
                              value={comboService.service_id}
                              onValueChange={(value) => updateComboService(index, 'service_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar servicio" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map(service => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.name} - ₡{Math.round(service.price_cents / 100)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Cantidad</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={comboService.quantity}
                              onChange={(e) => updateComboService(index, 'quantity', parseInt(e.target.value))}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeServiceFromCombo(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {comboFormData.services.length > 0 && (
                      <Card className="p-4 bg-muted">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Precio Original:</span>
                            <span className="font-medium">₡{Math.round(getComboOriginalPrice() / 100)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              {comboFormData.pricing_type === "percentage" 
                                ? `Precio con Descuento (${comboFormData.discount_percentage}%):` 
                                : "Precio Final:"
                              }
                            </span>
                            <span className="font-bold text-primary">₡{Math.round(getComboTotalPrice() / 100)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Ahorro:</span>
                            <span className="font-bold">₡{Math.round((getComboOriginalPrice() - getComboTotalPrice()) / 100)}</span>
                          </div>
                          {comboFormData.pricing_type === "percentage" && (
                            <div className="flex justify-between text-blue-600">
                              <span>Porcentaje de Descuento:</span>
                              <span className="font-bold">{comboFormData.discount_percentage}%</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setComboDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCombo ? "Actualizar" : "Crear"} Combo
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {combos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No hay combos creados</p>
                  <p className="text-sm text-muted-foreground">Crea tu primer combo para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              combos.map(combo => (
                <Card key={combo.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{combo.name}</CardTitle>
                      <Badge variant={combo.is_active ? "default" : "secondary"}>
                        {combo.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditCombo(combo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCombo(combo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Precio Original</p>
                          <p className="line-through text-muted-foreground">₡{Math.round(combo.original_price_cents / 100)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Precio Final</p>
                          <p className="font-bold text-primary">₡{Math.round(combo.total_price_cents / 100)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Ahorro</p>
                          <p className="font-bold text-green-600">₡{Math.round((combo.original_price_cents - combo.total_price_cents) / 100)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">% Descuento</p>
                          <p className="font-bold text-green-600">{Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100)}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">Servicios incluidos:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {combo.combo_services.map((cs, index) => (
                            <div key={index} className="flex justify-between items-center bg-muted p-2 rounded">
                              <span className="text-sm">{cs.services.name}</span>
                              <Badge variant="outline">x{cs.quantity}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {combo.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">{combo.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Válido desde</p>
                          <p className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {format(new Date(combo.start_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Válido hasta</p>
                          <p className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {format(new Date(combo.end_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};
export default AdminDiscounts;