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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Clock, DollarSign, Upload, X, Image as ImageIcon, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
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
const DURATION_OPTIONS = [{
  value: 15,
  label: "15 minutos"
}, {
  value: 30,
  label: "30 minutos"
}, {
  value: 45,
  label: "45 minutos"
}, {
  value: 60,
  label: "1 hora"
}, {
  value: 90,
  label: "1.5 horas"
}, {
  value: 120,
  label: "2 horas"
}, {
  value: 150,
  label: "2.5 horas"
}, {
  value: 180,
  label: "3 horas"
}, {
  value: 240,
  label: "4 horas"
}];

// Increased file size limit to 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price_cents: 0,
    image_url: "",
    is_active: true,
    category_id: ""
  });
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchServices();
    fetchEmployees();
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: `Failed to load services: ${error.message}`,
          variant: "destructive"
        });
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
  const fetchEmployees = async () => {
    try {
      // Fetch both employees and admins
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, full_name, email, role').in('role', ['employee', 'admin']).order('full_name');
      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: `Failed to load staff: ${error.message}`,
          variant: "destructive"
        });
      } else {
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading staff",
        variant: "destructive"
      });
    }
  };
  const fetchServiceEmployees = async (serviceId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('employee_services').select('employee_id').eq('service_id', serviceId);
      if (error) {
        console.error('Error fetching service employees:', error);
        toast({
          title: "Error",
          description: `Failed to load service staff: ${error.message}`,
          variant: "destructive"
        });
      } else if (data) {
        setSelectedEmployees(data.map(item => item.employee_id));
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };
  const updateServiceEmployees = async (serviceId: string, employeeIds: string[]) => {
    try {
      // First, delete existing relationships
      const {
        error: deleteError
      } = await supabase.from('employee_services').delete().eq('service_id', serviceId);
      if (deleteError) {
        throw new Error(`Failed to update service staff: ${deleteError.message}`);
      }

      // Then, insert new relationships
      if (employeeIds.length > 0) {
        const employeeServices = employeeIds.map(employeeId => ({
          service_id: serviceId,
          employee_id: employeeId
        }));
        const {
          error: insertError
        } = await supabase.from('employee_services').insert(employeeServices);
        if (insertError) {
          throw new Error(`Failed to assign staff to service: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.error('Error updating service employees:', error);
      throw error;
    }
  };
  const validateImageFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). El tamaño máximo permitido es ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido (${file.type}). Solo se permiten archivos de imagen: JPG, PNG, WebP, GIF.`;
    }

    // Check if file is actually an image by trying to read it
    return null;
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageValidationError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageValidationError(validationError);
      setImageFile(null);
      setImagePreview(null);
      // Clear the input
      e.target.value = '';
      return;
    }
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setImageValidationError("Error al leer el archivo. Asegúrate de que sea una imagen válida.");
      setImageFile(null);
    };
    reader.readAsDataURL(file);
  };
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      setUploadProgress(0);

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      console.log('Starting image upload:', fileName);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase storage with retry logic
      let uploadAttempts = 0;
      let uploadResult;
      while (uploadAttempts < 3) {
        try {
          uploadResult = await supabase.storage.from('service-images').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          if (!uploadResult.error) {
            break;
          }
          uploadAttempts++;
          if (uploadAttempts < 3) {
            console.log(`Upload attempt ${uploadAttempts} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (networkError) {
          uploadAttempts++;
          console.error(`Upload attempt ${uploadAttempts} failed:`, networkError);
          if (uploadAttempts >= 3) {
            throw new Error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (uploadResult?.error) {
        console.error('Upload error:', uploadResult.error);

        // Provide specific error messages for common issues
        let errorMessage = `Error al subir la imagen: ${uploadResult.error.message}`;
        if (uploadResult.error.message.includes('bucket') && uploadResult.error.message.includes('not found')) {
          errorMessage = "El bucket de almacenamiento no existe. Contacta al administrador.";
        } else if (uploadResult.error.message.includes('row-level security') || uploadResult.error.message.includes('policy')) {
          errorMessage = "No tienes permisos para subir imágenes. Asegúrate de tener rol de administrador o empleado.";
        } else if (uploadResult.error.message.includes('file size')) {
          errorMessage = "La imagen es demasiado grande. Reduce el tamaño e intenta nuevamente.";
        }
        throw new Error(errorMessage);
      }
      if (!uploadResult?.data) {
        throw new Error('No se recibió respuesta del servidor al subir la imagen');
      }

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('service-images').getPublicUrl(fileName);
      if (!publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen');
      }
      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir la imagen';
      toast({
        title: "Error de subida",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre del servicio es requerido",
        variant: "destructive"
      });
      return;
    }
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error de validación",
        description: "Selecciona al menos un miembro del personal para este servicio",
        variant: "destructive"
      });
      return;
    }
    if (formData.price_cents <= 0) {
      toast({
        title: "Error de validación",
        description: "El precio debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }
    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (!uploadedUrl) {
          // Error already shown in uploadImage function
          return;
        }
        imageUrl = uploadedUrl;
      }
      const serviceData = {
        ...formData,
        image_url: imageUrl,
        price_cents: Math.round(formData.price_cents * 100) // Convert to cents
      };
      let serviceId: string;
      if (editingService) {
        const {
          error
        } = await supabase.from('services').update(serviceData).eq('id', editingService.id);
        if (error) {
          console.error('Service update error:', error);
          throw new Error(`Error al actualizar el servicio: ${error.message}`);
        }
        serviceId = editingService.id;
        toast({
          title: "Éxito",
          description: "Servicio actualizado correctamente"
        });
      } else {
        const {
          data,
          error
        } = await supabase.from('services').insert([serviceData]).select('id').single();
        if (error) {
          console.error('Service creation error:', error);
          throw new Error(`Error al crear el servicio: ${error.message}`);
        }
        if (!data) {
          throw new Error('No se recibió respuesta del servidor al crear el servicio');
        }
        serviceId = data.id;
        toast({
          title: "Éxito",
          description: "Servicio creado correctamente"
        });
      }

      // Update employee relationships
      await updateServiceEmployees(serviceId, selectedEmployees);
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Service save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el servicio';
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const handleEdit = async (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents / 100,
      // Convert from cents
      image_url: service.image_url || "",
      is_active: service.is_active,
      category_id: service.category_id || ""
    });
    setImagePreview(service.image_url || null);
    setImageFile(null);
    setImageValidationError(null);
    await fetchServiceEmployees(service.id);
    setDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return;
    try {
      const {
        error
      } = await supabase.from('services').delete().eq('id', id);
      if (error) {
        console.error('Service deletion error:', error);
        throw new Error(`Error al eliminar el servicio: ${error.message}`);
      }
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente"
      });
      fetchServices();
    } catch (error) {
      console.error('Service deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el servicio';
      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_minutes: 60,
      price_cents: 0,
      image_url: "",
      is_active: true,
      category_id: ""
    });
    setEditingService(null);
    setImageFile(null);
    setImagePreview(null);
    setImageValidationError(null);
    setSelectedEmployees([]);
    setUploadProgress(0);
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageValidationError(null);
    setFormData({
      ...formData,
      image_url: ""
    });
    // Clear the file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  const getDurationLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'employee':
        return 'Empleado';
      default:
        return role;
    }
  };
  if (loading) {
    return <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Gestión de Servicios</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando servicios...</span>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Servicios</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del servicio *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} placeholder="Ej: Corte de cabello" required />
                </div>

                <div>
                  <Label htmlFor="duration">Duración *</Label>
                  <Select value={formData.duration_minutes.toString()} onValueChange={value => setFormData({
                  ...formData,
                  duration_minutes: parseInt(value)
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(option => <SelectItem key={option.value} value={option.value.toString()}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Descripción del servicio..." rows={3} />
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category_id} onValueChange={value => setFormData({
                  ...formData,
                  category_id: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price_cents} onChange={e => setFormData({
                  ...formData,
                  price_cents: parseFloat(e.target.value) || 0
                })} placeholder="0.00" className="pl-10" required />
                </div>
              </div>

              {/* Enhanced Image Upload Section */}
              <div>
                <Label htmlFor="image">Imagen del servicio</Label>
                <div className="space-y-4">
                  {imageValidationError && <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{imageValidationError}</AlertDescription>
                    </Alert>}
                  
                  {imagePreview && <div className="relative">
                      <img src={imagePreview} alt="Vista previa" className="w-full h-48 object-cover rounded-lg border" />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage} disabled={uploadingImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>}
                  
                  {uploadingImage && <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Subiendo imagen...</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>}
                  
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('image')?.click()} className="w-full" disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {imagePreview ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Formatos soportados: JPG, PNG, WebP, GIF</p>
                    <p>Tamaño máximo: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                    <p>Recomendado: Imágenes de alta calidad, ratio 16:9 o cuadradas</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Employee Selection */}
              <div>
                <Label>Personal que puede realizar este servicio *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {employees.map(employee => <div key={employee.id} className="flex items-center space-x-2">
                      <Checkbox id={employee.id} checked={selectedEmployees.includes(employee.id)} onCheckedChange={checked => {
                    if (checked) {
                      setSelectedEmployees([...selectedEmployees, employee.id]);
                    } else {
                      setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                    }
                  }} />
                      <Label htmlFor={employee.id} className="text-sm font-normal cursor-pointer flex-1">
                        <div className="flex items-center justify-between">
                          <span>{employee.full_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getRoleLabel(employee.role)}
                          </Badge>
                        </div>
                      </Label>
                    </div>)}
                </div>
                {employees.length === 0 && <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No hay personal disponible. Asegúrate de crear empleados o administradores primero.
                    </AlertDescription>
                  </Alert>}
                {selectedEmployees.length === 0 && employees.length > 0 && <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Selecciona al menos un miembro del personal para este servicio.
                    </AlertDescription>
                  </Alert>}
                {selectedEmployees.length > 0 && <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      {selectedEmployees.length} miembro{selectedEmployees.length > 1 ? 's' : ''} del personal seleccionado{selectedEmployees.length > 1 ? 's' : ''}
                    </span>
                  </div>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" checked={formData.is_active} onCheckedChange={checked => setFormData({
                ...formData,
                is_active: checked
              })} />
                <Label htmlFor="active">Servicio activo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={uploadingImage}>
                  {uploadingImage ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </> : editingService ? "Actualizar Servicio" : "Crear Servicio"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={uploadingImage}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => <Card key={service.id} className={`${!service.is_active ? 'opacity-60' : ''}`}>
            {service.image_url && <div className="relative">
                <img src={service.image_url} alt={service.name} className="w-full h-48 object-cover rounded-t-lg" />
              </div>}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  {getDurationLabel(service.duration_minutes)}
                </div>
                <div className="font-semibold text-lg">
                  {formatPrice(service.price_cents)}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Badge variant={service.is_active ? "default" : "secondary"}>
                  {service.is_active ? "Activo" : "Inactivo"}
                </Badge>
                
              </div>
            </CardContent>
          </Card>)}
      </div>

      {services.length === 0 && <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No hay servicios creados aún.</p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer servicio para empezar.
              </p>
            </div>
          </CardContent>
        </Card>}
    </div>;
};