import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

type CostType = 'fixed' | 'variable' | 'recurring' | 'one_time';
type CostCategory = 'inventory' | 'utilities' | 'rent' | 'supplies' | 'equipment' | 'marketing' | 'maintenance' | 'other';

interface Cost {
  id: string;
  name: string;
  description?: string;
  amount_cents: number;
  cost_type: CostType;
  cost_category: CostCategory;
  recurring_frequency?: number;
  is_active: boolean;
  date_incurred: string;
  next_due_date?: string;
  created_at: string;
}

const costTypes = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'recurring', label: 'Recurrente' },
  { value: 'one_time', label: 'Una vez' },
];

const costCategories = [
  { value: 'inventory', label: 'Inventario' },
  { value: 'utilities', label: 'Servicios' },
  { value: 'rent', label: 'Alquiler' },
  { value: 'supplies', label: 'Suministros' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'other', label: 'Otros' },
];

const formatCurrency = (amountCents: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100);
};

export function AdminCosts() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    cost_type: '' as CostType | '',
    cost_category: '' as CostCategory | '',
    recurring_frequency: '',
    date_incurred: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los costos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      cost_type: '',
      cost_category: '',
      recurring_frequency: '',
      date_incurred: new Date().toISOString().split('T')[0],
    });
    setEditingCost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.cost_type || !formData.cost_category) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben estar completos",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    try {
      const costData = {
        name: formData.name,
        description: formData.description || null,
        amount_cents: Math.round(parseFloat(formData.amount) * 100),
        cost_type: formData.cost_type as CostType,
        cost_category: formData.cost_category as CostCategory,
        recurring_frequency: formData.recurring_frequency ? parseInt(formData.recurring_frequency) : null,
        date_incurred: formData.date_incurred,
        next_due_date: formData.cost_type === 'recurring' && formData.recurring_frequency
          ? new Date(new Date(formData.date_incurred).getTime() + parseInt(formData.recurring_frequency) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
        ...(editingCost ? {} : { created_by: profile.id }),
      };

      if (editingCost) {
        const { error } = await supabase
          .from('costs')
          .update(costData)
          .eq('id', editingCost.id);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Costo actualizado correctamente",
        });
      } else {
        const insertData = {
          ...costData,
          created_by: profile.id,
        };
        
        const { error } = await supabase
          .from('costs')
          .insert([insertData]);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Costo creado correctamente",
        });
      }

      await fetchCosts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving cost:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el costo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      amount: (cost.amount_cents / 100).toString(),
      cost_type: cost.cost_type,
      cost_category: cost.cost_category,
      recurring_frequency: cost.recurring_frequency?.toString() || '',
      date_incurred: cost.date_incurred,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este costo?')) return;

    try {
      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Costo eliminado correctamente",
      });
      
      await fetchCosts();
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el costo",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    return costCategories.find(c => c.value === category)?.label || category;
  };

  const getTypeLabel = (type: string) => {
    return costTypes.find(t => t.value === type)?.label || type;
  };

  const totalMonthly = costs
    .filter(cost => cost.is_active && (cost.cost_type === 'recurring' || cost.cost_type === 'fixed'))
    .reduce((sum, cost) => {
      if (cost.cost_type === 'recurring' && cost.recurring_frequency) {
        return sum + (cost.amount_cents * (30 / cost.recurring_frequency));
      }
      return sum + cost.amount_cents;
    }, 0);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando costos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Costos</h1>
          <p className="text-muted-foreground">
            Administra los gastos del salón: inventario, servicios, alquiler y más
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Costo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCost ? 'Editar Costo' : 'Nuevo Costo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Electricidad mes de enero"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional del gasto"
                />
              </div>

              <div>
                <Label htmlFor="amount">Monto (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cost_category">Categoría *</Label>
                <Select
                  value={formData.cost_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cost_category: value as CostCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cost_type">Tipo *</Label>
                <Select
                  value={formData.cost_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cost_type: value as CostType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.cost_type === 'recurring' && (
                <div>
                  <Label htmlFor="recurring_frequency">Frecuencia (días)</Label>
                  <Input
                    id="recurring_frequency"
                    type="number"
                    value={formData.recurring_frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurring_frequency: e.target.value }))}
                    placeholder="30 (mensual), 7 (semanal)"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="date_incurred">Fecha *</Label>
                <Input
                  id="date_incurred"
                  type="date"
                  value={formData.date_incurred}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_incurred: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCost ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthly)}</div>
            <p className="text-xs text-muted-foreground">
              Estimado para este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costs.length}</div>
            <p className="text-xs text-muted-foreground">
              Costos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Activos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costs.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              En seguimiento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Costs List */}
      <div className="grid gap-4">
        {costs.map((cost) => (
          <Card key={cost.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{cost.name}</h3>
                    <Badge variant={cost.is_active ? "default" : "secondary"}>
                      {cost.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">
                      {getCategoryLabel(cost.cost_category)}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(cost.cost_type)}
                    </Badge>
                  </div>
                  
                  {cost.description && (
                    <p className="text-muted-foreground text-sm mb-2">
                      {cost.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Fecha: {format(new Date(cost.date_incurred), 'dd/MM/yyyy')}</span>
                    {cost.recurring_frequency && (
                      <span>Cada {cost.recurring_frequency} días</span>
                    )}
                    {cost.next_due_date && (
                      <span>Próximo: {format(new Date(cost.next_due_date), 'dd/MM/yyyy')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(cost.amount_cents)}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cost)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cost.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {costs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No hay costos registrados. ¡Crea el primero!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}