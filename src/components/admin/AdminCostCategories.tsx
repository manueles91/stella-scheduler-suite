import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Save, X, GripVertical } from "lucide-react";
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

type CostCategory = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function SortableCostCategory({ category, onEdit, onDelete }: { 
  category: CostCategory; 
  onEdit: (category: CostCategory) => void;
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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: category.name,
    description: category.description || '',
    is_active: category.is_active
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('cost_categories')
        .update({
          name: editForm.name,
          description: editForm.description || null,
          is_active: editForm.is_active
        })
        .eq('id', category.id);

      if (error) throw error;
      
      onEdit({ ...category, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating cost category:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`name-${category.id}`}>Nombre</Label>
                      <Input
                        id={`name-${category.id}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.is_active}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Activa</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`desc-${category.id}`}>Descripción</Label>
                    <Textarea
                      id={`desc-${category.id}`}
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground break-words">
                      {category.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminCostCategories() {
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de costos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      setCategories(newOrder);

      // Update display_order for all affected categories
      try {
        const updates = newOrder.map((category, index) => ({
          id: category.id,
          display_order: index
        }));

        for (const update of updates) {
          await supabase
            .from('cost_categories')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
        }
      } catch (error) {
        console.error('Error updating display order:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el orden",
          variant: "destructive",
        });
        fetchCategories(); // Reload to get correct order
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cost_categories')
        .insert([{
          ...newCategory,
          description: newCategory.description || null,
          display_order: categories.length
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategory({ name: '', description: '', is_active: true });
      setShowAddForm(false);
      
      toast({
        title: "Éxito",
        description: "Categoría de costo creada correctamente",
      });
    } catch (error) {
      console.error('Error creating cost category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría de costo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (updatedCategory: CostCategory) => {
    setCategories(prev => 
      prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
    toast({
      title: "Éxito",
      description: "Categoría actualizada correctamente",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cost_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting cost category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Puede que esté siendo usada por algunos costos.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando categorías...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categorías de Costos</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías para organizar los gastos del salón
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar Nueva Categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">Nombre *</Label>
                <Input
                  id="new-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Productos de belleza"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCategory.is_active}
                  onCheckedChange={(checked) => setNewCategory(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Activa</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="new-description">Descripción</Label>
              <Textarea
                id="new-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la categoría (opcional)"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory}>Crear Categoría</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
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
        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {categories.map((category) => (
              <SortableCostCategory
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay categorías de costos. ¡Crea la primera!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}