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
import { Plus, Pencil, Trash2, Clock, DollarSign, Image, Tag, Users, Calendar, Upload, X, AlertTriangle, CheckCircle, Loader2, Filter, Settings, Percent, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { ComboCard } from "@/components/cards/ComboCard";
import { useToast } from "@/hooks/use-toast";
import { AdminCategories } from "./AdminCategories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

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
  // Services state
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Discounts and Combos state
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [comboLoading, setComboLoading] = useState(true);
  const [dialogOpenDiscount, setDialogOpenDiscount] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  
  // Image upload state for combos
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [comboImagePreview, setComboImagePreview] = useState<string | null>(null);
  const [uploadingComboImage, setUploadingComboImage] = useState(false);
  const [comboImageValidationError, setComboImageValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price_cents: 0,
    image_url: "",
    is_active: true,
    category_id: "none",
    variable_price: false,
  });

  // Discount form data
  const [discountFormData, setDiscountFormData] = useState({
    service_id: "",
    description: "",
    discount_type: "percentage" as 'percentage' | 'flat',
    discount_value: "",
    start_date: "",
    end_date: "",
    is_public: true,
    discount_code: "",
    is_active: true
  });

  // Combo form data
  const [comboFormData, setComboFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    services: [] as {
      service_id: string;
      quantity: number;
    }[],
    pricing_type: "percentage" as "percentage" | "fixed",
    discount_percentage: "20",
    fixed_price: ""
  });

  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchServices();
    fetchEmployees();
    fetchCategories();
    fetchDiscounts();
    fetchCombos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredServices = services.filter(service => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "none") return !service.category_id;
    return service.category_id === categoryFilter;
  });

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
      toast({
        title: "Error",
        description: "No se pudieron cargar los combos",
        variant: "destructive"
      });
    } finally {
      setComboLoading(false);
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

    // Create preview with better error handling
    const reader = new FileReader();
    
    // Add timeout for slow file reading
    const timeoutId = setTimeout(() => {
      if (reader.readyState !== FileReader.DONE) {
        reader.abort();
        setImageValidationError("Tiempo de espera agotado. Intenta con una imagen más pequeña.");
        setImageFile(null);
        setImagePreview(null);
      }
    }, 5000);
    
    reader.onloadend = () => {
      clearTimeout(timeoutId);
      if (reader.result && reader.error === null) {
        setImagePreview(reader.result as string);
        setImageValidationError(null);
      }
    };
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      // Only show error after a brief delay to avoid race conditions
      setTimeout(() => {
        setImageValidationError("Error al leer el archivo. Asegúrate de que sea una imagen válida.");
        setImageFile(null);
        setImagePreview(null);
      }, 100);
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
      }, 300);

      try {
        // Upload to Supabase storage with simplified retry logic
        const uploadResult = await supabase.storage.from('service-images').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadResult.error) {
          console.error('Upload error:', uploadResult.error);
          throw new Error(`Error al subir la imagen: ${uploadResult.error.message}`);
        }

        if (!uploadResult.data) {
          throw new Error('No se recibió respuesta del servidor al subir la imagen');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage.from('service-images').getPublicUrl(fileName);
        
        if (!publicUrl) {
          throw new Error('No se pudo obtener la URL pública de la imagen');
        }
        
        console.log('Image uploaded successfully:', publicUrl);
        return publicUrl;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir la imagen';
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
    if (!formData.variable_price && formData.price_cents <= 0) {
      toast({
        title: "Error de validación",
        description: "El precio debe ser mayor a 0 o activa 'Precio variable'",
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
          // Show option to save without image
          const continueWithoutImage = confirm(
            "La subida de la imagen falló. ¿Deseas guardar el servicio sin imagen?"
          );
          if (!continueWithoutImage) {
            return;
          }
          // Keep existing image URL or set to empty
          imageUrl = editingService?.image_url || "";
        } else {
          imageUrl = uploadedUrl;
        }
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
      category_id: service.category_id || "none",
      variable_price: service.variable_price ?? false,
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
      category_id: "none",
      variable_price: false,
    });
    setEditingService(null);
    setImageFile(null);
    setImagePreview(null);
    setImageValidationError(null);
    setSelectedEmployees([]);
    setUploadProgress(0);
  };

  // Discount handling functions
  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountFormData.service_id || !discountFormData.discount_value || !discountFormData.start_date || !discountFormData.end_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    if (!discountFormData.is_public && !discountFormData.discount_code) {
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
        service_id: discountFormData.service_id,
        name: services.find(s => s.id === discountFormData.service_id)?.name || "Descuento",
        description: discountFormData.description,
        discount_type: discountFormData.discount_type,
        discount_value: parseFloat(discountFormData.discount_value),
        start_date: new Date(discountFormData.start_date).toISOString(),
        end_date: new Date(discountFormData.end_date + 'T23:59:59').toISOString(),
        is_public: discountFormData.is_public,
        discount_code: discountFormData.is_public ? null : discountFormData.discount_code,
        is_active: discountFormData.is_active,
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
      resetDiscountForm();
      setDialogOpenDiscount(false);
    } catch (error: any) {
      console.error("Error saving discount:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el descuento",
        variant: "destructive"
      });
    }
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountFormData({
      service_id: discount.service_id,
      description: discount.description || "",
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      start_date: discount.start_date.split('T')[0],
      end_date: discount.end_date.split('T')[0],
      is_public: discount.is_public,
      discount_code: discount.discount_code || "",
      is_active: discount.is_active
    });
    setDialogOpenDiscount(true);
  };

  const handleDeleteDiscount = async (id: string) => {
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

  const resetDiscountForm = () => {
    setDiscountFormData({
      service_id: "",
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

  // Combo handling functions
  const validateComboImageFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). El tamaño máximo permitido es ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido (${file.type}). Solo se permiten archivos de imagen: JPG, PNG, WebP, GIF.`;
    }
    return null;
  };

  const handleComboImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setComboImageValidationError(null);
    if (!file) {
      setComboImageFile(null);
      setComboImagePreview(null);
      return;
    }
    const validationError = validateComboImageFile(file);
    if (validationError) {
      setComboImageValidationError(validationError);
      setComboImageFile(null);
      setComboImagePreview(null);
      e.target.value = '';
      return;
    }
    setComboImageFile(file);

    const reader = new FileReader();
    const timeoutId = setTimeout(() => {
      if (reader.readyState !== FileReader.DONE) {
        reader.abort();
        setComboImageValidationError("Tiempo de espera agotado. Intenta con una imagen más pequeña.");
        setComboImageFile(null);
        setComboImagePreview(null);
      }
    }, 5000);
    
    reader.onloadend = () => {
      clearTimeout(timeoutId);
      if (reader.result && reader.error === null) {
        setComboImagePreview(reader.result as string);
        setComboImageValidationError(null);
      }
    };
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setComboImageValidationError("Error al leer el archivo. Asegúrate de que sea una imagen válida.");
        setComboImageFile(null);
        setComboImagePreview(null);
      }, 100);
    };
    
    reader.readAsDataURL(file);
  };

  const uploadComboImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingComboImage(true);
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `combo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const uploadResult = await supabase.storage.from('service-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadResult.error) {
        throw new Error(`Error al subir la imagen: ${uploadResult.error.message}`);
      }

      if (!uploadResult.data) {
        throw new Error('No se recibió respuesta del servidor al subir la imagen');
      }

      const { data: { publicUrl } } = supabase.storage.from('service-images').getPublicUrl(fileName);
      
      if (!publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen');
      }
      
      return publicUrl;
    } catch (error) {
      console.error('Combo image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir la imagen';
      return null;
    } finally {
      setUploadingComboImage(false);
    }
  };

  const removeComboImage = () => {
    setComboImageFile(null);
    setComboImagePreview(null);
    setComboImageValidationError(null);
    const fileInput = document.getElementById('combo-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      let imageUrl = editingCombo?.image_url || "";
      if (comboImageFile) {
        const uploadedUrl = await uploadComboImage(comboImageFile);
        if (!uploadedUrl) {
          const continueWithoutImage = confirm(
            "La subida de la imagen falló. ¿Deseas guardar el combo sin imagen?"
          );
          if (!continueWithoutImage) {
            return;
          }
          imageUrl = editingCombo?.image_url || "";
        } else {
          imageUrl = uploadedUrl;
        }
      }

      const originalPrice = comboFormData.services.reduce((total, comboService) => {
        const service = services.find(s => s.id === comboService.service_id);
        return total + (service ? service.price_cents * comboService.quantity : 0);
      }, 0);

      let totalPrice: number;
      if (comboFormData.pricing_type === "percentage") {
        const discountPercent = parseFloat(comboFormData.discount_percentage) / 100;
        totalPrice = Math.round(originalPrice * (1 - discountPercent));
      } else {
        totalPrice = Math.round(parseFloat(comboFormData.fixed_price) * 100);
      }

      const comboData = {
        name: comboFormData.name,
        description: comboFormData.description,
        image_url: imageUrl,
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
        const {
          error: updateError
        } = await supabase.from("combos").update(comboData).eq("id", editingCombo.id);
        error = updateError;
        comboId = editingCombo.id;

        if (!error) {
          await supabase.from("combo_services").delete().eq("combo_id", editingCombo.id);
        }
      } else {
        const {
          data: insertData,
          error: insertError
        } = await supabase.from("combos").insert([comboData]).select().single();
        error = insertError;
        comboId = insertData?.id;
      }
      if (error) throw error;

      const comboServices = comboFormData.services.map(service => ({
        combo_id: comboId,
        service_id: service.service_id,
        quantity: service.quantity
      }));
      const {
        error: servicesError
      } = await supabase.from("combo_services").insert(comboServices);
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
    const originalPrice = combo.original_price_cents;
    const totalPrice = combo.total_price_cents;
    const discountPercent = Math.round((originalPrice - totalPrice) / originalPrice * 100);
    setComboFormData({
      name: combo.name,
      description: combo.description || "",
      start_date: combo.start_date.split('T')[0],
      end_date: combo.end_date.split('T')[0],
      is_active: combo.is_active,
      services: combo.combo_services.map(cs => ({
        service_id: cs.service_id,
        quantity: cs.quantity
      })),
      pricing_type: "percentage",
      discount_percentage: discountPercent.toString(),
      fixed_price: (totalPrice / 100).toString()
    });
    
    setComboImagePreview(combo.image_url || null);
    setComboImageFile(null);
    setComboImageValidationError(null);
    
    setComboDialogOpen(true);
  };

  const handleDeleteCombo = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este combo?")) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from("combos").delete().eq("id", id);
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
      services: [...comboFormData.services, {
        service_id: "",
        quantity: 1
      }]
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
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    };
    setComboFormData({
      ...comboFormData,
      services: updatedServices
    });
  };

  const getComboTotalPrice = () => {
    return comboFormData.services.reduce((total, comboService) => {
      const service = services.find(s => s.id === comboService.service_id);
      return total + (service ? service.price_cents * comboService.quantity : 0);
    }, 0);
  };

  const resetComboForm = () => {
    setComboFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      is_active: true,
      services: [],
      pricing_type: "percentage",
      discount_percentage: "20",
      fixed_price: ""
    });
    setEditingCombo(null);
    setComboImageFile(null);
    setComboImagePreview(null);
    setComboImageValidationError(null);
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
    return `₡${Math.round(cents / 100)}`;
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
  if (loading || comboLoading) {
    return <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Servicios</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando...</span>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Descuentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
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
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map(category => (
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
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      variable_price: checked
                    })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Si está activado, el precio final se definirá al completar la cita.
                </p>
              </div>

              <div>
                <Label htmlFor="price">Precio {formData.variable_price ? "(referencial opcional)" : "*"}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_cents}
                    onChange={e => setFormData({
                      ...formData,
                      price_cents: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0.00"
                    className="pl-10"
                    required={!formData.variable_price}
                    disabled={formData.variable_price}
                  />
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

      {/* Category Filter Row */}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategoryManager(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>


      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredServices.map(service => {
          // Find best active discount for this service
          const now = new Date();
          const activeForService = discounts.filter(d => {
            const start = new Date(d.start_date);
            const end = new Date(d.end_date);
            return d.service_id === service.id && d.is_active && start <= now && end >= now;
          });

          const computeSavings = (disc: any) => {
            if (!disc) return 0;
            if (disc.discount_type === 'percentage') {
              return Math.round(service.price_cents * (disc.discount_value / 100));
            }
            return Math.min(Math.round(disc.discount_value), service.price_cents);
          };

          const bestDiscount = activeForService.reduce((best: any, curr: any) => {
            const bestSave = computeSavings(best);
            const currSave = computeSavings(curr);
            return currSave > bestSave ? curr : best;
          }, null as any);

          const savings = computeSavings(bestDiscount);
          const finalPrice = Math.max(0, service.price_cents - savings);

          return (
            <div key={service.id} className="relative group">
              <ServiceCard
                id={service.id}
                name={service.name}
                description={service.description}
                originalPrice={service.price_cents}
                finalPrice={finalPrice}
                savings={savings}
                duration={service.duration_minutes}
                imageUrl={service.image_url}
                type="service"
                discountType={bestDiscount?.discount_type}
                discountValue={bestDiscount?.discount_value}
                variablePrice={service.variable_price ?? false}
                onSelect={() => handleEdit(service)}
                variant="admin"
                showExpandable={true}
                className="relative"
                adminBadges={
                  <>
                    <Badge 
                      variant={service.is_active ? "default" : "secondary"} 
                      className={`text-xs font-medium shadow-lg ${
                        service.is_active 
                          ? 'bg-green-600 text-white border border-green-500' 
                          : 'bg-gray-600 text-white border border-gray-500'
                      }`}
                    >
                      {service.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {service.service_categories?.name && (
                      <Badge variant="outline" className="text-xs bg-white/80 text-gray-800 border-gray-300">
                        {service.service_categories.name}
                      </Badge>
                    )}
                  </>
                }
                adminButtons={
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(service);
                      }}
                      className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200"
                    >
                      <Pencil className="h-3 w-3 text-gray-700" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service.id);
                      }}
                      className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </Button>
                  </>
                }
              />
            </div>
          );
        })}
      </div>

      {/* Category Manager Modal */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AdminCategories />
        </DialogContent>
      </Dialog>

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
                <h3 className="font-semibold text-lg">Descuentos</h3>
                <Dialog open={dialogOpenDiscount} onOpenChange={open => {
                  setDialogOpenDiscount(open);
                  if (!open) resetDiscountForm();
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
                    <form onSubmit={handleDiscountSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="service_id">Servicio *</Label>
                          <Select value={discountFormData.service_id} onValueChange={value => setDiscountFormData({
                            ...discountFormData,
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
                      </div>

                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" value={discountFormData.description} onChange={e => setDiscountFormData({
                          ...discountFormData,
                          description: e.target.value
                        })} placeholder="Descripción del descuento" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="discount_type">Tipo de Descuento *</Label>
                          <Select value={discountFormData.discount_type} onValueChange={(value: 'percentage' | 'flat') => setDiscountFormData({
                            ...discountFormData,
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
                            Valor del Descuento * {discountFormData.discount_type === 'percentage' ? '(%)' : '(₡)'}
                          </Label>
                          <Input id="discount_value" type="number" step="0.01" min="0" max={discountFormData.discount_type === 'percentage' ? "100" : undefined} value={discountFormData.discount_value} onChange={e => setDiscountFormData({
                            ...discountFormData,
                            discount_value: e.target.value
                          })} placeholder={discountFormData.discount_type === 'percentage' ? "20" : "50"} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">Fecha de Inicio *</Label>
                          <Input id="start_date" type="date" value={discountFormData.start_date} onChange={e => setDiscountFormData({
                            ...discountFormData,
                            start_date: e.target.value
                          })} />
                        </div>
                        <div>
                          <Label htmlFor="end_date">Fecha de Fin *</Label>
                          <Input id="end_date" type="date" value={discountFormData.end_date} onChange={e => setDiscountFormData({
                            ...discountFormData,
                            end_date: e.target.value
                          })} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="is_public" checked={discountFormData.is_public} onCheckedChange={checked => setDiscountFormData({
                            ...discountFormData,
                            is_public: checked
                          })} />
                          <Label htmlFor="is_public">Descuento Público</Label>
                        </div>

                        {!discountFormData.is_public && <div>
                          <Label htmlFor="discount_code">Código de Descuento *</Label>
                          <Input id="discount_code" value={discountFormData.discount_code} onChange={e => setDiscountFormData({
                            ...discountFormData,
                            discount_code: e.target.value.toUpperCase()
                          })} placeholder="CODIGO20" />
                        </div>}

                        <div className="flex items-center space-x-2">
                          <Switch id="is_active" checked={discountFormData.is_active} onCheckedChange={checked => setDiscountFormData({
                            ...discountFormData,
                            is_active: checked
                          })} />
                          <Label htmlFor="is_active">Activo</Label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpenDiscount(false)}>
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
                </Card> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discounts.map(discount => {
                      const associatedService = services.find(s => s.id === discount.service_id);
                      
                      if (!associatedService) return null;
                      
                      return (
                        <div key={discount.id} className="relative group">
                          <ServiceCard
                            id={associatedService.id}
                            name={associatedService.name}
                            description={associatedService.description}
                            originalPrice={associatedService.price_cents}
                            finalPrice={discount.discount_type === 'percentage'
                              ? Math.round(associatedService.price_cents * (1 - discount.discount_value / 100))
                              : Math.round(associatedService.price_cents - discount.discount_value)
                            }
                            savings={discount.discount_type === 'percentage'
                              ? Math.round(associatedService.price_cents * (discount.discount_value / 100))
                              : discount.discount_value
                            }
                            duration={associatedService.duration_minutes}
                            imageUrl={associatedService.image_url}
                            type="discount"
                            discountType={discount.discount_type}
                            discountValue={discount.discount_value}
                            variablePrice={associatedService.variable_price ?? false}
                            onSelect={() => handleEditDiscount(discount)}
                            variant="admin"
                            showExpandable={true}
                            className="relative"
                            adminBadges={
                              <>
                                <Badge 
                                  variant={isDiscountActive(discount) ? "default" : "secondary"} 
                                  className={`text-xs font-medium shadow-lg ${
                                    isDiscountActive(discount) 
                                      ? 'bg-green-600 text-white border border-green-500' 
                                      : 'bg-gray-600 text-white border border-gray-500'
                                  }`}
                                >
                                  {isDiscountActive(discount) ? "Activo" : "Inactivo"}
                                </Badge>
                              </>
                            }
                            adminButtons={
                              <>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDiscount(discount);
                                  }}
                                  className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200"
                                >
                                  <Pencil className="h-3 w-3 text-gray-700" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDiscount(discount.id);
                                  }}
                                  className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500"
                                >
                                  <Trash2 className="h-3 w-3 text-white" />
                                </Button>
                              </>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="combos" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Combos</h3>
                <Dialog open={comboDialogOpen} onOpenChange={open => {
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
                          <Input id="combo_name" value={comboFormData.name} onChange={e => setComboFormData({
                            ...comboFormData,
                            name: e.target.value
                          })} placeholder="Ej: Paquete Relajación Total" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="combo_active" checked={comboFormData.is_active} onCheckedChange={checked => setComboFormData({
                            ...comboFormData,
                            is_active: checked
                          })} />
                          <Label htmlFor="combo_active">Activo</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="combo_description">Descripción</Label>
                        <Textarea id="combo_description" value={comboFormData.description} onChange={e => setComboFormData({
                          ...comboFormData,
                          description: e.target.value
                        })} placeholder="Descripción del combo" />
                      </div>

                      <div>
                        <Label htmlFor="combo-image">Imagen del Combo</Label>
                        <div className="space-y-4">
                          {comboImageValidationError && <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{comboImageValidationError}</AlertDescription>
                          </Alert>}
                          
                          {comboImagePreview && <div className="relative">
                            <img src={comboImagePreview} alt="Vista previa" className="w-full h-48 object-cover rounded-lg border" />
                            <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeComboImage} disabled={uploadingComboImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>}
                          
                          {uploadingComboImage && <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Subiendo imagen...</span>
                            </div>
                          </div>}
                          
                          <Input id="combo-image" type="file" accept="image/*" onChange={handleComboImageChange} className="hidden" disabled={uploadingComboImage} />
                          <Button type="button" variant="outline" onClick={() => document.getElementById('combo-image')?.click()} className="w-full" disabled={uploadingComboImage}>
                            {uploadingComboImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                            {comboImagePreview ? "Cambiar imagen" : "Subir imagen"}
                          </Button>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Formatos soportados: JPG, PNG, WebP, GIF</p>
                            <p>Tamaño máximo: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                            <p>Recomendado: Imágenes de alta calidad, ratio 16:9 o cuadradas</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="combo_start_date">Fecha de Inicio *</Label>
                          <Input id="combo_start_date" type="date" value={comboFormData.start_date} onChange={e => setComboFormData({
                            ...comboFormData,
                            start_date: e.target.value
                          })} />
                        </div>
                        <div>
                          <Label htmlFor="combo_end_date">Fecha de Fin *</Label>
                          <Input id="combo_end_date" type="date" value={comboFormData.end_date} onChange={e => setComboFormData({
                            ...comboFormData,
                            end_date: e.target.value
                          })} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Servicios del Combo *</Label>
                          <Button type="button" onClick={addServiceToCombo} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Servicio
                          </Button>
                        </div>
                        
                        {comboFormData.services.map((comboService, index) => <Card key={index} className="p-4">
                          <div className="grid grid-cols-5 gap-4 items-end">
                            <div className="col-span-3">
                              <Label>Servicio</Label>
                              <Select value={comboService.service_id} onValueChange={value => updateComboService(index, 'service_id', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map(service => <SelectItem key={service.id} value={service.id}>
                                    {service.name} - ₡{Math.round(service.price_cents / 100)}
                                  </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Cantidad</Label>
                              <Input type="number" min="1" value={comboService.quantity} onChange={e => updateComboService(index, 'quantity', parseInt(e.target.value))} />
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => removeServiceFromCombo(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>)}

                        {comboFormData.services.length > 0 && <>
                          <div className="space-y-4">
                            <Label>Tipo de Precio</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="pricing_type">Método de Precio *</Label>
                                <Select value={comboFormData.pricing_type} onValueChange={(value: "percentage" | "fixed") => setComboFormData({
                                  ...comboFormData,
                                  pricing_type: value
                                })}>
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
                                {comboFormData.pricing_type === "percentage" ? <>
                                  <Label htmlFor="discount_percentage">Porcentaje de Descuento (%)</Label>
                                  <Input id="discount_percentage" type="number" min="0" max="100" step="1" value={comboFormData.discount_percentage} onChange={e => setComboFormData({
                                    ...comboFormData,
                                    discount_percentage: e.target.value
                                  })} placeholder="20" />
                                </> : <>
                                  <Label htmlFor="fixed_price">Precio Fijo (₡)</Label>
                                  <Input id="fixed_price" type="number" min="0" step="0.01" value={comboFormData.fixed_price} onChange={e => setComboFormData({
                                    ...comboFormData,
                                    fixed_price: e.target.value
                                  })} placeholder="150.00" />
                                </>}
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
                                  ₡{Math.round(comboFormData.pricing_type === "percentage" ? getComboTotalPrice() * (1 - parseFloat(comboFormData.discount_percentage || "0") / 100) / 100 : parseFloat(comboFormData.fixed_price || "0"))}
                                </span>
                              </div>
                              <div className="flex justify-between text-green-600">
                                <span>Ahorro:</span>
                                <span className="font-bold">
                                  ₡{Math.round(comboFormData.pricing_type === "percentage" ? getComboTotalPrice() * (parseFloat(comboFormData.discount_percentage || "0") / 100) / 100 : getComboTotalPrice() / 100 - parseFloat(comboFormData.fixed_price || "0"))}
                                </span>
                              </div>
                              {comboFormData.pricing_type === "percentage" && <div className="flex justify-between text-blue-600">
                                <span>Descuento:</span>
                                <span className="font-bold">{parseFloat(comboFormData.discount_percentage || "0")}%</span>
                              </div>}
                            </div>
                          </Card>
                        </>}
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
                {combos.length === 0 ? <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No hay combos creados</p>
                    <p className="text-sm text-muted-foreground">Crea tu primer combo para comenzar</p>
                  </CardContent>
                </Card> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combos.map(combo => {
                      const comboServices = combo.combo_services.map(cs => ({
                        name: cs.services.name,
                        quantity: cs.quantity,
                        service_id: cs.service_id
                      }));

                      const discountPercentage = Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100);

                      return (
                        <div key={combo.id} className="relative group">
                          <ComboCard
                            id={combo.id}
                            name={combo.name}
                            description={combo.description}
                            originalPrice={combo.original_price_cents}
                            finalPrice={combo.total_price_cents}
                            savings={combo.original_price_cents - combo.total_price_cents}
                            imageUrl={combo.image_url}
                            comboServices={comboServices}
                            onSelect={() => handleEditCombo(combo)}
                            variant="admin"
                            showExpandable={true}
                            className="relative"
                            adminBadges={
                              <>
                                <Badge 
                                  variant={combo.is_active ? "default" : "secondary"} 
                                  className={`text-xs font-medium shadow-lg ${
                                    combo.is_active 
                                      ? 'bg-green-600 text-white border border-green-500' 
                                      : 'bg-gray-600 text-white border border-gray-500'
                                  }`}
                                >
                                  {combo.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs font-medium shadow-lg bg-red-500 text-white border border-red-400"
                                >
                                  {discountPercentage}% OFF
                                </Badge>
                              </>
                            }
                            adminButtons={
                              <>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCombo(combo);
                                  }}
                                  className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 border border-gray-200"
                                >
                                  <Pencil className="h-3 w-3 text-gray-700" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCombo(combo.id);
                                  }}
                                  className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg border border-red-500"
                                >
                                  <Trash2 className="h-3 w-3 text-white" />
                                </Button>
                              </>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>;
};