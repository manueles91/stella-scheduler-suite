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
}
const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
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
  useEffect(() => {
    fetchDiscounts();
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
      } = await supabase.from("services").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
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
  const formatDiscountValue = (value: number, type: string) => {
    return type === 'percentage' ? `${value}%` : `$${value}`;
  };
  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return discount.is_active && start <= now && end >= now;
  };
  if (loading) {
    return <div className="flex justify-center items-center h-48">Cargando descuentos...</div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl">Descuentos</h2>
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
                    Valor del Descuento * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
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
    </div>;
};
export default AdminDiscounts;