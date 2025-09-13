import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, X, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { serviceFormSchema } from "@/lib/validation/serviceSchemas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onServiceSaved: () => void;
  categories: Category[];
  employees: Employee[];
  isReadOnly: boolean;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 75, label: "1 hora 15 minutos" },
  { value: 90, label: "1 hora 30 minutos" },
  { value: 105, label: "1 hora 45 minutos" },
  { value: 120, label: "2 horas" },
  { value: 135, label: "2 horas 15 minutos" },
  { value: 150, label: "2 horas 30 minutos" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 300, label: "5 horas" },
  { value: 360, label: "6 horas" },
];

export const ServiceDialog = ({ 
  open, 
  onOpenChange, 
  service, 
  onServiceSaved, 
  categories, 
  employees, 
  isReadOnly 
}: ServiceDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price_cents: 0,
    category_id: "",
    variable_price: false,
    is_active: true,
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
        category_id: service.category_id || "",
        variable_price: service.variable_price || false,
        is_active: service.is_active,
      });
      setImagePreview(service.image_url || null);
      
      // Fetch current employee assignments
      fetchServiceEmployees(service.id);
    } else {
      resetForm();
    }
  }, [service, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_minutes: 60,
      price_cents: 0,
      category_id: "",
      variable_price: false,
      is_active: true,
    });
    setSelectedEmployees([]);
    setImagePreview(null);
    setImageValidationError(null);
    setUploadProgress(0);
  };

  const fetchServiceEmployees = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_services')
        .select('employee_id')
        .eq('service_id', serviceId);

      if (error) throw error;
      setSelectedEmployees(data?.map(es => es.employee_id) || []);
    } catch (error) {
      console.error('Error fetching service employees:', error);
    }
  };

  const validateImage = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `El archivo es muy grande (${Math.round(file.size / 1024 / 1024)}MB). El límite es 10MB.`;
    }
    return null;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setImageValidationError(validationError);
      return;
    }

    setImageValidationError(null);
    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `service-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      setImagePreview(publicUrl);
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageValidationError('Error al subir la imagen. Inténtalo de nuevo.');
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageValidationError(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un miembro del personal",
        variant: "destructive",
      });
      return;
    }

    try {
      const validationResult = serviceFormSchema.safeParse({
        ...formData,
        price_cents: formData.variable_price ? 0 : formData.price_cents,
      });

      if (!validationResult.success) {
        toast({
          title: "Error de validación",
          description: validationResult.error.issues[0]?.message || "Datos inválidos",
          variant: "destructive",
        });
        return;
      }

      const serviceData = {
        ...formData,
        image_url: imagePreview,
        category_id: formData.category_id === "none" ? null : formData.category_id,
      };

      let serviceId: string;

      if (service) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);

        if (error) throw error;
        serviceId = service.id;
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
          .single();

        if (error) throw error;
        serviceId = data.id;
      }

      // Update employee assignments
      await supabase
        .from('employee_services')
        .delete()
        .eq('service_id', serviceId);

      if (selectedEmployees.length > 0) {
        const employeeServices = selectedEmployees.map(employeeId => ({
          service_id: serviceId,
          employee_id: employeeId,
        }));

        const { error: employeeError } = await supabase
          .from('employee_services')
          .insert(employeeServices);

        if (employeeError) throw employeeError;
      }

      toast({
        title: "Éxito",
        description: `Servicio ${service ? 'actualizado' : 'creado'} correctamente`,
      });

      onServiceSaved();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: `No se pudo ${service ? 'actualizar' : 'crear'} el servicio`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Editar Servicio" : "Crear Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Corte de cabello"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración *</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div className="flex items-center gap-2">
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del servicio..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="variable_price">Precio variable</Label>
              <Switch
                id="variable_price"
                checked={formData.variable_price}
                onCheckedChange={(checked) => setFormData({ ...formData, variable_price: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Si está activado, el precio final se definirá al completar la cita.
            </p>
          </div>

          <div>
            <Label htmlFor="price">
              Precio {formData.variable_price ? "(referencial opcional)" : "*"}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                ₡
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_cents / 100}
                onChange={(e) => setFormData({
                  ...formData,
                  price_cents: (parseFloat(e.target.value) || 0) * 100
                })}
                placeholder="0.00"
                className="pl-10"
                required={!formData.variable_price}
                disabled={formData.variable_price}
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <Label htmlFor="image">Imagen del servicio</Label>
            <div className="space-y-4">
              {imageValidationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{imageValidationError}</AlertDescription>
                </Alert>
              )}
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    disabled={uploadingImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {uploadingImage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Subiendo imagen...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image')?.click()}
                className="w-full"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {imagePreview ? "Cambiar imagen" : "Subir imagen"}
              </Button>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Formatos soportados: Todos los formatos de imagen</p>
                <p>Recomendado: Imágenes de alta calidad, ratio 16:9 o cuadradas</p>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <Label>Personal que puede realizar este servicio *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={employee.id}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmployees([...selectedEmployees, employee.id]);
                      } else {
                        setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                      }
                    }}
                  />
                  <Label htmlFor={employee.id} className="text-sm font-normal cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <span>{employee.full_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleLabel(employee.role)}
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            {employees.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hay personal disponible. Asegúrate de crear empleados o administradores primero.
                </AlertDescription>
              </Alert>
            )}
            {selectedEmployees.length === 0 && employees.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Selecciona al menos un miembro del personal para este servicio.
                </AlertDescription>
              </Alert>
            )}
            {selectedEmployees.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">
                  {selectedEmployees.length} miembro{selectedEmployees.length > 1 ? 's' : ''} del personal seleccionado{selectedEmployees.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="active">Servicio activo</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={uploadingImage}>
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                service ? "Actualizar Servicio" : "Crear Servicio"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploadingImage}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};