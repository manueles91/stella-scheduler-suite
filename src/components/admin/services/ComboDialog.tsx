import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, X, AlertTriangle, Loader2 } from "lucide-react";
import { comboFormSchema } from "@/lib/validation/serviceSchemas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
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
  primary_employee_id?: string;
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

interface ComboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo?: Combo | null;
  onComboSaved: () => void;
  services: Service[];
  employees: Employee[];
  isReadOnly: boolean;
}

export const ComboDialog = ({ 
  open, 
  onOpenChange, 
  combo, 
  onComboSaved, 
  services, 
  employees, 
  isReadOnly 
}: ComboDialogProps) => {
  const { toast } = useToast();
  const [comboFormData, setComboFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    pricing_type: "percentage" as "percentage" | "fixed",
    discount_percentage: "20",
    fixed_price: "",
    primary_employee_id: "",
    services: [] as { service_id: string; quantity: number }[],
  });
  const [comboImagePreview, setComboImagePreview] = useState<string | null>(null);
  const [uploadingComboImage, setUploadingComboImage] = useState(false);
  const [comboImageValidationError, setComboImageValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (combo) {
      setComboFormData({
        name: combo.name,
        description: combo.description || "",
        start_date: combo.start_date.split('T')[0],
        end_date: combo.end_date.split('T')[0],
        is_active: combo.is_active,
        pricing_type: "percentage", // Default to percentage for editing
        discount_percentage: "20",
        fixed_price: (combo.total_price_cents / 100).toString(),
        primary_employee_id: combo.primary_employee_id || "",
        services: combo.combo_services.map(cs => ({
          service_id: cs.service_id,
          quantity: cs.quantity
        })),
      });
      setComboImagePreview(combo.image_url || null);
    } else {
      resetComboForm();
    }
  }, [combo, open]);

  const resetComboForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    setComboFormData({
      name: "",
      description: "",
      start_date: today,
      end_date: nextMonthStr,
      is_active: true,
      pricing_type: "percentage",
      discount_percentage: "20",
      fixed_price: "",
      primary_employee_id: "",
      services: [],
    });
    setComboImagePreview(null);
    setComboImageValidationError(null);
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

  const updateComboService = (index: number, field: string, value: any) => {
    const updatedServices = [...comboFormData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setComboFormData({ ...comboFormData, services: updatedServices });
  };

  const getComboTotalPrice = () => {
    return comboFormData.services.reduce((total, comboService) => {
      const service = services.find(s => s.id === comboService.service_id);
      return total + (service ? service.price_cents * comboService.quantity : 0);
    }, 0);
  };

  const validateComboImage = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `El archivo es muy grande (${Math.round(file.size / 1024 / 1024)}MB). El límite es 10MB.`;
    }
    return null;
  };

  const handleComboImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateComboImage(file);
    if (validationError) {
      setComboImageValidationError(validationError);
      return;
    }

    setComboImageValidationError(null);
    setUploadingComboImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `combo-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      setComboImagePreview(publicUrl);
      toast({
        title: "Imagen subida",
        description: "La imagen del combo se ha subido correctamente",
      });
    } catch (error) {
      console.error('Error uploading combo image:', error);
      setComboImageValidationError('Error al subir la imagen. Inténtalo de nuevo.');
      toast({
        title: "Error",
        description: "No se pudo subir la imagen del combo",
        variant: "destructive",
      });
    } finally {
      setUploadingComboImage(false);
    }
  };

  const removeComboImage = () => {
    setComboImagePreview(null);
    setComboImageValidationError(null);
  };

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (comboFormData.services.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un servicio al combo",
        variant: "destructive",
      });
      return;
    }

    try {
      const validationData = {
        ...comboFormData,
        services: comboFormData.services.map(s => ({ service_id: s.service_id, quantity: s.quantity }))
      };

      const validationResult = comboFormSchema.safeParse(validationData);
      if (!validationResult.success) {
        toast({
          title: "Error de validación",
          description: validationResult.error.issues[0]?.message || "Datos inválidos",
          variant: "destructive",
        });
        return;
      }

      const originalPriceCents = getComboTotalPrice();
      let totalPriceCents = originalPriceCents;

      if (comboFormData.pricing_type === "percentage") {
        const discountPercent = parseFloat(comboFormData.discount_percentage) / 100;
        totalPriceCents = Math.round(originalPriceCents * (1 - discountPercent));
      } else {
        totalPriceCents = Math.round(parseFloat(comboFormData.fixed_price) * 100);
      }

      const comboData = {
        name: comboFormData.name,
        description: comboFormData.description,
        start_date: new Date(comboFormData.start_date).toISOString(),
        end_date: new Date(comboFormData.end_date).toISOString(),
        is_active: comboFormData.is_active,
        primary_employee_id: comboFormData.primary_employee_id,
        original_price_cents: originalPriceCents,
        total_price_cents: totalPriceCents,
        image_url: comboImagePreview,
      };

      let comboId: string;

      if (combo) {
        // Update existing combo
        const { error } = await supabase
          .from('combos')
          .update(comboData)
          .eq('id', combo.id);

        if (error) throw error;
        comboId = combo.id;
      } else {
        // Create new combo
        const { data, error } = await supabase
          .from('combos')
          .insert([{ ...comboData, created_by: '' }])
          .select()
          .single();

        if (error) throw error;
        comboId = data.id;
      }

      // Update combo services
      await supabase
        .from('combo_services')
        .delete()
        .eq('combo_id', comboId);

      if (comboFormData.services.length > 0) {
        const comboServices = comboFormData.services.map(service => ({
          combo_id: comboId,
          service_id: service.service_id,
          quantity: service.quantity,
        }));

        const { error: servicesError } = await supabase
          .from('combo_services')
          .insert(comboServices);

        if (servicesError) throw servicesError;
      }

      toast({
        title: "Éxito",
        description: `Combo ${combo ? 'actualizado' : 'creado'} correctamente`,
      });

      onComboSaved();
      onOpenChange(false);
      resetComboForm();
    } catch (error) {
      console.error('Error saving combo:', error);
      toast({
        title: "Error",
        description: `No se pudo ${combo ? 'actualizar' : 'crear'} el combo`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {combo ? "Editar Combo" : "Crear Nuevo Combo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleComboSubmit} className="space-y-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="combo_name">Nombre del Combo *</Label>
              <Input
                id="combo_name"
                value={comboFormData.name}
                onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
                placeholder="Ej: Paquete Relajación Total"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="combo_active"
                checked={comboFormData.is_active}
                onCheckedChange={(checked) => setComboFormData({ ...comboFormData, is_active: checked })}
              />
              <Label htmlFor="combo_active">Activo</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="combo_description">Descripción</Label>
            <Textarea
              id="combo_description"
              value={comboFormData.description}
              onChange={(e) => setComboFormData({ ...comboFormData, description: e.target.value })}
              placeholder="Descripción del combo"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <Label htmlFor="combo-image">Imagen del Combo</Label>
            <div className="space-y-4">
              {comboImageValidationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{comboImageValidationError}</AlertDescription>
                </Alert>
              )}
              
              {comboImagePreview && (
                <div className="relative">
                  <img
                    src={comboImagePreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeComboImage}
                    disabled={uploadingComboImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {uploadingComboImage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Subiendo imagen...</span>
                  </div>
                </div>
              )}
              
              <Input
                id="combo-image"
                type="file"
                accept="image/*"
                onChange={handleComboImageChange}
                className="hidden"
                disabled={uploadingComboImage}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('combo-image')?.click()}
                className="w-full"
                disabled={uploadingComboImage}
              >
                {uploadingComboImage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {comboImagePreview ? "Cambiar imagen" : "Subir imagen"}
              </Button>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Formatos soportados: Todos los formatos de imagen</p>
                <p>Recomendado: Imágenes de alta calidad, ratio 16:9 o cuadradas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="combo_start_date">Fecha de Inicio *</Label>
              <Input
                id="combo_start_date"
                type="date"
                value={comboFormData.start_date}
                onChange={(e) => setComboFormData({ ...comboFormData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="combo_end_date">Fecha de Fin *</Label>
              <Input
                id="combo_end_date"
                type="date"
                value={comboFormData.end_date}
                onChange={(e) => setComboFormData({ ...comboFormData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Primary Employee Selection */}
          <div>
            <Label htmlFor="combo_primary_employee">Empleado Principal *</Label>
            <Select
              value={comboFormData.primary_employee_id}
              onValueChange={(value) => setComboFormData({ ...comboFormData, primary_employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado principal" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              El empleado principal será responsable de coordinar la ejecución del combo
            </p>
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
                        {services.map((service) => (
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
              <>
                <div className="space-y-4">
                  <Label>Tipo de Precio</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pricing_type">Método de Precio *</Label>
                      <Select
                        value={comboFormData.pricing_type}
                        onValueChange={(value: "percentage" | "fixed") => 
                          setComboFormData({ ...comboFormData, pricing_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Descuento por Porcentaje</SelectItem>
                          <SelectItem value="fixed">Precio Fijo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {comboFormData.pricing_type === "percentage" ? (
                        <>
                          <Label htmlFor="discount_percentage">Porcentaje de Descuento (%)</Label>
                          <Input
                            id="discount_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={comboFormData.discount_percentage}
                            onChange={(e) => setComboFormData({
                              ...comboFormData,
                              discount_percentage: e.target.value
                            })}
                            placeholder="20"
                          />
                        </>
                      ) : (
                        <>
                          <Label htmlFor="fixed_price">Precio Fijo (₡)</Label>
                          <Input
                            id="fixed_price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={comboFormData.fixed_price}
                            onChange={(e) => setComboFormData({
                              ...comboFormData,
                              fixed_price: e.target.value
                            })}
                            placeholder="150.00"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Card className="p-4 bg-muted">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precio Original:</span>
                      <span className="font-medium">₡{Math.round(getComboTotalPrice() / 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio Final:</span>
                      <span className="font-bold text-primary">
                        ₡{Math.round(
                          comboFormData.pricing_type === "percentage"
                            ? getComboTotalPrice() * (1 - parseFloat(comboFormData.discount_percentage || "0") / 100) / 100
                            : parseFloat(comboFormData.fixed_price || "0")
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Ahorro:</span>
                      <span className="font-bold">
                        ₡{Math.round(
                          comboFormData.pricing_type === "percentage"
                            ? getComboTotalPrice() * (parseFloat(comboFormData.discount_percentage || "0") / 100) / 100
                            : getComboTotalPrice() / 100 - parseFloat(comboFormData.fixed_price || "0")
                        )}
                      </span>
                    </div>
                    {comboFormData.pricing_type === "percentage" && (
                      <div className="flex justify-between text-blue-600">
                        <span>Descuento:</span>
                        <span className="font-bold">{parseFloat(comboFormData.discount_percentage || "0")}%</span>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {combo ? "Actualizar" : "Crear"} Combo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};