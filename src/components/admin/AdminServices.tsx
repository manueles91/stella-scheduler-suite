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
import { Plus, Pencil, Trash2, Clock, DollarSign, Upload, X, Image as ImageIcon, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface EmployeeService {
  employee_id: string;
  service_id: string;
  profiles: {
    full_name: string;
  };
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
  { value: 150, label: "2.5 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
];

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price_cents: 0,
    image_url: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchServices(), fetchEmployees(), fetchEmployeeServices()]);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } else {
      setServices(data || []);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'employee')
      .order('full_name');

    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };

  const fetchEmployeeServices = async () => {
    const { data, error } = await supabase
      .from('employee_services')
      .select(`
        employee_id,
        service_id,
        profiles(full_name)
      `);

    if (error) {
      console.error('Error fetching employee services:', error);
    } else {
      setEmployeeServices(data || []);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del servicio es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image_url;
      
      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const serviceData = {
        ...formData,
        image_url: imageUrl,
        price_cents: Math.round(formData.price_cents * 100), // Convert to cents
      };

      let serviceId: string;

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        serviceId = editingService.id;
        
        toast({
          title: "Éxito",
          description: "Servicio actualizado correctamente",
        });
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
          .single();

        if (error) throw error;
        serviceId = data.id;
        
        toast({
          title: "Éxito",
          description: "Servicio creado correctamente",
        });
      }

      // Update employee-service assignments
      await updateEmployeeServices(serviceId);

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el servicio",
        variant: "destructive",
      });
    }
  };

  const updateEmployeeServices = async (serviceId: string) => {
    try {
      // First, delete existing employee services for this service
      await supabase
        .from('employee_services')
        .delete()
        .eq('service_id', serviceId);

      // Then, insert new ones
      if (selectedEmployeeIds.length > 0) {
        const insertData = selectedEmployeeIds.map(employeeId => ({
          employee_id: employeeId,
          service_id: serviceId,
        }));

        const { error } = await supabase
          .from('employee_services')
          .insert(insertData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating employee services:', error);
      throw error;
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents / 100, // Convert from cents
      image_url: service.image_url || "",
      is_active: service.is_active,
    });
    setImagePreview(service.image_url || null);
    
    // Load current employee assignments for this service
    const currentEmployees = employeeServices
      .filter(es => es.service_id === service.id)
      .map(es => es.employee_id);
    setSelectedEmployeeIds(currentEmployees);
    
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el servicio",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      fetchData();
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
    });
    setEditingService(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedEmployeeIds([]);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getServiceEmployees = (serviceId: string) => {
    return employeeServices
      .filter(es => es.service_id === serviceId)
      .map(es => es.profiles.full_name);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: "" });
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

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Gestión de Servicios</h2>
        <div className="text-center py-8">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Gestión de Servicios</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del servicio *</Label>
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
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
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
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Simplified Image Upload Section */}
              <div>
                <Label htmlFor="image">Imagen del servicio</Label>
                <div className="space-y-4">
                  {(uploadingImage || imagePreview) && (
                    <div className="relative">
                      {uploadingImage ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="text-sm text-gray-500">Subiendo imagen...</span>
                          </div>
                        </div>
                      ) : imagePreview ? (
                        <>
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
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-input')?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 5MB
                  </p>
                </div>
              </div>

              {/* Personnel Selection */}
              <div>
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Personal capacitado para este servicio
                </Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay empleados disponibles</p>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="text-sm font-normal">
                          {employee.full_name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona los empleados que pueden realizar este servicio
                </p>
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
                  {uploadingImage ? "Subiendo..." : (editingService ? "Actualizar" : "Crear")} Servicio
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={uploadingImage}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className={`${!service.is_active ? 'opacity-60' : ''}`}>
            {service.image_url && (
              <div className="relative">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-muted-foreground">{service.description}</p>
              )}
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
              
              {/* Assigned Personnel */}
              <div>
                <div className="flex items-center gap-1 text-sm font-medium mb-1">
                  <Users className="h-3 w-3" />
                  Personal asignado:
                </div>
                <div className="flex flex-wrap gap-1">
                  {getServiceEmployees(service.id).length > 0 ? (
                    getServiceEmployees(service.id).map((employeeName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {employeeName}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin personal asignado</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Badge variant={service.is_active ? "default" : "secondary"}>
                  {service.is_active ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Creado: {new Date(service.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No hay servicios creados aún.</p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer servicio para empezar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};