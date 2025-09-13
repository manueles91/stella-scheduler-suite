import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Percent, Tag, Calendar } from "lucide-react";
import { discountFormSchema } from "@/lib/validation/serviceSchemas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

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

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Discount | null;
  onDiscountSaved: () => void;
  services: Service[];
  isReadOnly: boolean;
}

export const DiscountDialog = ({ 
  open, 
  onOpenChange, 
  discount, 
  onDiscountSaved, 
  services, 
  isReadOnly 
}: DiscountDialogProps) => {
  const { toast } = useToast();
  const [discountFormData, setDiscountFormData] = useState({
    service_id: "",
    description: "",
    discount_type: "percentage" as "percentage" | "flat",
    discount_value: 0,
    start_date: "",
    end_date: "",
    is_public: false,
    discount_code: "",
    is_active: true,
  });

  useEffect(() => {
    if (discount) {
      setDiscountFormData({
        service_id: discount.service_id,
        description: discount.description || "",
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        start_date: discount.start_date.split('T')[0],
        end_date: discount.end_date.split('T')[0],
        is_public: discount.is_public,
        discount_code: discount.discount_code || "",
        is_active: discount.is_active,
      });
    } else {
      resetDiscountForm();
    }
  }, [discount, open]);

  const resetDiscountForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    setDiscountFormData({
      service_id: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      start_date: today,
      end_date: nextMonthStr,
      is_public: false,
      discount_code: "",
      is_active: true,
    });
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discountFormData.service_id) {
      toast({
        title: "Error",
        description: "Selecciona un servicio",
        variant: "destructive",
      });
      return;
    }

    try {
      const validationResult = discountFormSchema.safeParse(discountFormData);
      if (!validationResult.success) {
        toast({
          title: "Error de validación",
          description: validationResult.error.issues[0]?.message || "Datos inválidos",
          variant: "destructive",
        });
        return;
      }

      const discountData = {
        ...discountFormData,
        discount_code: discountFormData.discount_code || null,
        start_date: new Date(discountFormData.start_date).toISOString(),
        end_date: new Date(discountFormData.end_date).toISOString(),
      };

      if (discount) {
        // Update existing discount
        const { error } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', discount.id);

        if (error) throw error;
      } else {
        // Create new discount
        const { error } = await supabase
          .from('discounts')
          .insert([{ ...discountData, created_by: '', name: discountFormData.description || 'Descuento' }]);

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: `Descuento ${discount ? 'actualizado' : 'creado'} correctamente`,
      });

      onDiscountSaved();
      onOpenChange(false);
      resetDiscountForm();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast({
        title: "Error",
        description: `No se pudo ${discount ? 'actualizar' : 'crear'} el descuento`,
        variant: "destructive",
      });
    }
  };

  const calculateDiscountPreview = () => {
    const selectedService = services.find(s => s.id === discountFormData.service_id);
    if (!selectedService) return null;

    const originalPrice = selectedService.price_cents / 100;
    let discountAmount = 0;
    let finalPrice = originalPrice;

    if (discountFormData.discount_type === "percentage") {
      discountAmount = (originalPrice * discountFormData.discount_value) / 100;
      finalPrice = originalPrice - discountAmount;
    } else {
      discountAmount = discountFormData.discount_value;
      finalPrice = Math.max(0, originalPrice - discountAmount);
    }

    return {
      originalPrice,
      discountAmount,
      finalPrice,
      serviceName: selectedService.name
    };
  };

  const preview = calculateDiscountPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {discount ? "Editar Descuento" : "Crear Nuevo Descuento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleDiscountSubmit} className="space-y-6">
          <div>
            <Label htmlFor="discount_service">Servicio *</Label>
            <Select
              value={discountFormData.service_id}
              onValueChange={(value) => setDiscountFormData({ ...discountFormData, service_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ₡{Math.round(service.price_cents / 100)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="discount_description">Descripción</Label>
            <Textarea
              id="discount_description"
              value={discountFormData.description}
              onChange={(e) => setDiscountFormData({ ...discountFormData, description: e.target.value })}
              placeholder="Descripción del descuento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_type">Tipo de Descuento *</Label>
              <Select
                value={discountFormData.discount_type}
                onValueChange={(value: "percentage" | "flat") => 
                  setDiscountFormData({ ...discountFormData, discount_type: value, discount_value: 0 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Porcentaje
                    </div>
                  </SelectItem>
                  <SelectItem value="flat">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Monto Fijo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount_value">
                {discountFormData.discount_type === "percentage" ? "Porcentaje (%)" : "Monto (₡)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                max={discountFormData.discount_type === "percentage" ? "100" : undefined}
                step={discountFormData.discount_type === "percentage" ? "1" : "0.01"}
                value={discountFormData.discount_value}
                onChange={(e) => setDiscountFormData({
                  ...discountFormData,
                  discount_value: parseFloat(e.target.value) || 0
                })}
                placeholder={discountFormData.discount_type === "percentage" ? "20" : "5000"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_start_date">Fecha de Inicio *</Label>
              <Input
                id="discount_start_date"
                type="date"
                value={discountFormData.start_date}
                onChange={(e) => setDiscountFormData({ ...discountFormData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="discount_end_date">Fecha de Fin *</Label>
              <Input
                id="discount_end_date"
                type="date"
                value={discountFormData.end_date}
                onChange={(e) => setDiscountFormData({ ...discountFormData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_public">Descuento Público</Label>
              <p className="text-sm text-muted-foreground">
                Los descuentos públicos son visibles para todos los clientes
              </p>
            </div>
            <Switch
              id="is_public"
              checked={discountFormData.is_public}
              onCheckedChange={(checked) => setDiscountFormData({ ...discountFormData, is_public: checked })}
            />
          </div>

          {!discountFormData.is_public && (
            <div>
              <Label htmlFor="discount_code">Código de Descuento</Label>
              <Input
                id="discount_code"
                value={discountFormData.discount_code}
                onChange={(e) => setDiscountFormData({ ...discountFormData, discount_code: e.target.value })}
                placeholder="DESCUENTO20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Los clientes necesitarán este código para aplicar el descuento
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="discount_active"
              checked={discountFormData.is_active}
              onCheckedChange={(checked) => setDiscountFormData({ ...discountFormData, is_active: checked })}
            />
            <Label htmlFor="discount_active">Descuento activo</Label>
          </div>

          {/* Preview */}
          {preview && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Vista Previa del Descuento</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Servicio:</span>
                    <span className="font-medium">{preview.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio Original:</span>
                    <span>₡{Math.round(preview.originalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-₡{Math.round(preview.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-600 border-t pt-2">
                    <span>Precio Final:</span>
                    <span>₡{Math.round(preview.finalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {discount ? "Actualizar" : "Crear"} Descuento
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};