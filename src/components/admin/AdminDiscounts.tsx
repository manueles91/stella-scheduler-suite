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
import { Plus, Pencil, Trash2, Percent, DollarSign, Calendar, Code, Upload, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { ComboCard } from "@/components/cards/ComboCard";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Discount {
  id: string;
  service_id: string;
  name?: string; // Made optional since we're not using it
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
  description?: string;
  price_cents: number;
  duration_minutes: number;
  image_url?: string;
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
    services: [] as {
      service_id: string;
      quantity: number;
    }[],
    pricing_type: "percentage" as "percentage" | "fixed",
    discount_percentage: "20",
    fixed_price: ""
  });
  
  // Image upload state for combos
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [comboImagePreview, setComboImagePreview] = useState<string | null>(null);
  const [uploadingComboImage, setUploadingComboImage] = useState(false);
  const [comboImageValidationError, setComboImageValidationError] = useState<string | null>(null);
  
  // No file size or type restrictions - same as AdminCategories
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (effectively no limit)
  const ALLOWED_FILE_TYPES = ['image/*']; // Accept all image types
  
  useEffect(() => {
    fetchDiscounts();
    fetchCombos();
    fetchServices();
  }, []);
  
  // Image validation function for combos
  const validateComboImageFile = (file: File): string | null => {
    // No validation - accept all files like AdminCategories
    return null;
  };
  
  // Image change handler for combos
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
      // Clear the input
      e.target.value = '';
      return;
    }
    setComboImageFile(file);

    // Create preview with better error handling
    const reader = new FileReader();
    
    // Add timeout for slow file reading
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
      // Only show error after a brief delay to avoid race conditions
      setTimeout(() => {
        setComboImageValidationError("Error al leer el archivo. Asegúrate de que sea una imagen válida.");
        setComboImageFile(null);
        setComboImagePreview(null);
      }, 100);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Upload image function for combos
  const uploadComboImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingComboImage(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `combo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      console.log('Starting combo image upload:', fileName);

      try {
        // Upload to Supabase storage
        const uploadResult = await supabase.storage.from('service-images').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

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
        
        console.log('Combo image uploaded successfully:', publicUrl);
        return publicUrl;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('Combo image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir la imagen';
      return null;
    } finally {
      setUploadingComboImage(false);
    }
  };
  
  // Remove combo image function
  const removeComboImage = () => {
    setComboImageFile(null);
    setComboImagePreview(null);
    setComboImageValidationError(null);
    // Clear the file input
    const fileInput = document.getElementById('combo-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
  const fetchServices = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("services").select("id, name, description, price_cents, duration_minutes, image_url").eq("is_active", true).order("name");
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_id || !formData.discount_value || !formData.start_date || !formData.end_date) {
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
        name: services.find(s => s.id === formData.service_id)?.name || "Descuento", // Default name based on service
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

      // Handle image upload
      let imageUrl = editingCombo?.image_url || "";
      if (comboImageFile) {
        const uploadedUrl = await uploadComboImage(comboImageFile);
        if (!uploadedUrl) {
          // Show option to save without image
          const continueWithoutImage = confirm(
            "La subida de la imagen falló. ¿Deseas guardar el combo sin imagen?"
          );
          if (!continueWithoutImage) {
            return;
          }
          // Keep existing image URL or set to empty
          imageUrl = editingCombo?.image_url || "";
        } else {
          imageUrl = uploadedUrl;
        }
      }

      // Calculate original and total prices
      const originalPrice = comboFormData.services.reduce((total, comboService) => {
        const service = services.find(s => s.id === comboService.service_id);
        return total + (service ? service.price_cents * comboService.quantity : 0);
      }, 0);

      // Calculate total price based on pricing type
      let totalPrice: number;
      if (comboFormData.pricing_type === "percentage") {
        const discountPercent = parseFloat(comboFormData.discount_percentage) / 100;
        totalPrice = Math.round(originalPrice * (1 - discountPercent));
      } else {
        totalPrice = Math.round(parseFloat(comboFormData.fixed_price) * 100); // Convert to cents
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

        // Delete existing combo services
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

      // Insert combo services
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

    // Calculate pricing type based on existing data
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
      // Default to percentage for existing combos
      discount_percentage: discountPercent.toString(),
      fixed_price: (totalPrice / 100).toString()
    });
    
    // Set image preview for editing
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
            <h3 className="font-semibold text-lg">Descuentos</h3>
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
              <div className="grid grid-cols-1 gap-4">
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
          </Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discounts.map(discount => {
                // Find the associated service to get its details
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
                      onSelect={() => handleEdit(discount)}
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
                              handleEdit(discount);
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
                              handleDelete(discount.id);
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

                  {/* Combo Image Upload Section */}
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
                        <p>Formatos soportados: Todos los formatos de imagen</p>
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

                    {/* Pricing Type Selection */}
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
    </div>;
};
export default AdminDiscounts;