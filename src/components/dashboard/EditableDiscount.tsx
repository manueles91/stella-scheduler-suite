import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  services?: {
    name: string;
  };
}

interface Service {
  id: string;
  name: string;
}

interface EditableDiscountProps {
  discount: Discount;
  onUpdate: () => void;
  canEdit: boolean;
}

export const EditableDiscount = ({ discount, onUpdate, canEdit }: EditableDiscountProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    service_id: discount.service_id,
    name: discount.name,
    description: discount.description || "",
    discount_type: discount.discount_type,
    discount_value: discount.discount_value.toString(),
    start_date: discount.start_date.split('T')[0],
    end_date: discount.end_date.split('T')[0],
    is_public: discount.is_public,
    discount_code: discount.discount_code || "",
    is_active: discount.is_active,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_id || !formData.name || !formData.discount_value || 
        !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!formData.is_public && !formData.discount_code) {
      toast({
        title: "Error",
        description: "Los descuentos privados requieren un código",
        variant: "destructive",
      });
      return;
    }

    try {
      const discountData = {
        service_id: formData.service_id,
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
        is_public: formData.is_public,
        discount_code: formData.is_public ? null : formData.discount_code,
        is_active: formData.is_active,
      };

      const { error } = await supabase
        .from("discounts")
        .update(discountData)
        .eq("id", discount.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Descuento actualizado correctamente",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error updating discount:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el descuento",
        variant: "destructive",
      });
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 p-0"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Descuento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_id">Servicio *</Label>
              <Select value={formData.service_id} onValueChange={(value) => 
                setFormData({ ...formData, service_id: value })
              }>
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
              <Label htmlFor="name">Nombre del Descuento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Descuento de Verano"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del descuento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_type">Tipo de Descuento *</Label>
              <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'flat') => 
                setFormData({ ...formData, discount_type: value })
              }>
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
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                max={formData.discount_type === 'percentage' ? "100" : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.discount_type === 'percentage' ? "20" : "50"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha de Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Fecha de Fin *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="is_public">Descuento Público</Label>
            </div>

            {!formData.is_public && (
              <div>
                <Label htmlFor="discount_code">Código de Descuento *</Label>
                <Input
                  id="discount_code"
                  value={formData.discount_code}
                  onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                  placeholder="CODIGO20"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Activo</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Actualizar Descuento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};