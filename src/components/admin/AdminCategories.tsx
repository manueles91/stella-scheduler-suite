import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Save, X, GripVertical, Upload, Image } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

function SortableCategory({ category, onEdit, onDelete }: { 
  category: ServiceCategory; 
  onEdit: (category: ServiceCategory) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div {...attributes} {...listeners} className="cursor-move">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {category.image_url && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{category.name}</h3>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
    is_active: true,
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `categories/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const saveData = { ...formData, image_url: imageUrl };

      if (editingCategory) {
        const { error } = await supabase
          .from("service_categories")
          .update(saveData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        });
      } else {
        const { error } = await supabase
          .from("service_categories")
          .insert([saveData]);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Categoría creada correctamente",
        });
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // Update display_order in database
      try {
        const updates = newCategories.map((category, index) => ({
          id: category.id,
          display_order: index + 1,
        }));

        for (const update of updates) {
          await supabase
            .from("service_categories")
            .update({ display_order: update.display_order })
            .eq("id", update.id);
        }

        toast({
          title: "Éxito",
          description: "Orden actualizado correctamente",
        });
      } catch (error) {
        console.error("Error updating order:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el orden",
          variant: "destructive",
        });
        fetchCategories(); // Refresh to get correct order
      }
    }
  };

  const startEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      display_order: category.display_order,
      is_active: category.is_active,
      image_url: category.image_url || "",
    });
    setImagePreview(category.image_url || "");
    setImageFile(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      display_order: categories.length + 1,
      is_active: true,
      image_url: "",
    });
    setImagePreview("");
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setFormData({
      name: "",
      description: "",
      display_order: 0,
      is_active: true,
      image_url: "",
    });
    setImagePreview("");
    setImageFile(null);
  };

  if (loading) {
    return <div>Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={startCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {(isCreating || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría"
              />
            </div>
            <div>
              <Label htmlFor="display_order">Orden de visualización</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="image">Imagen de la categoría</Label>
              <div className="space-y-4">
                {(imagePreview || formData.image_url) && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={imagePreview || formData.image_url} 
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview || formData.image_url ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Activa</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={categories} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}