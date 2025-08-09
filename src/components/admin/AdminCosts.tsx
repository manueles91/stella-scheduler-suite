import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, DollarSign, Settings } from "lucide-react";
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
import { AdminCostCategories } from "./AdminCostCategories";
import { Progress } from "@/components/ui/progress";
import { formatCRC } from "@/lib/currency";
type CostType = 'fixed' | 'variable' | 'recurring' | 'one_time';
interface CostCategory {
  id: string;
  name: string;
  description?: string;
}
interface Cost {
  id: string;
  name: string;
  description?: string;
  amount_cents: number;
  cost_type: CostType;
  cost_category_id: string;
  cost_categories?: CostCategory;
  recurring_frequency?: number;
  is_active: boolean;
  date_incurred: string;
  next_due_date?: string;
  created_at: string;
}
const costTypes = [{
  value: 'fixed',
  label: 'Fijo'
}, {
  value: 'variable',
  label: 'Variable'
}, {
  value: 'recurring',
  label: 'Recurrente'
}, {
  value: 'one_time',
  label: 'Una vez'
}];

// Replace EUR formatter with CRC
const formatCurrency = (amountCents: number) => {
  return formatCRC(amountCents);
};

export function AdminCosts() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    cost_type: '' as CostType | '',
    cost_category_id: '',
    recurring_frequency: '',
    date_incurred: new Date().toISOString().split('T')[0]
  });
  useEffect(() => {
    fetchCosts();
    fetchCostCategories();
  }, []);
  const fetchCostCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('cost_categories').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      setCostCategories(data || []);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
    }
  };
  const fetchCosts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('costs').select(`
          *,
          cost_categories (
            id,
            name,
            description
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los costos",
        variant: "destructive"
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
      cost_category_id: '',
      recurring_frequency: '',
      date_incurred: new Date().toISOString().split('T')[0]
    });
    setEditingCost(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.cost_type || !formData.cost_category_id) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben estar completos",
        variant: "destructive"
      });
      return;
    }
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }
    try {
      const costData = {
        name: formData.name,
        description: formData.description || null,
        amount_cents: Math.round(parseFloat(formData.amount) * 100),
        cost_type: formData.cost_type as CostType,
        cost_category_id: formData.cost_category_id,
        recurring_frequency: formData.recurring_frequency ? parseInt(formData.recurring_frequency) : null,
        date_incurred: formData.date_incurred,
        next_due_date: formData.cost_type === 'recurring' && formData.recurring_frequency ? new Date(new Date(formData.date_incurred).getTime() + parseInt(formData.recurring_frequency) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
      };
      if (editingCost) {
        const {
          error
        } = await supabase.from('costs').update(costData).eq('id', editingCost.id);
        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Costo actualizado correctamente"
        });
      } else {
        const insertData = {
          ...costData,
          created_by: profile.id,
          cost_category: 'other' as any // Temporary workaround for legacy field
        };
        const {
          error
        } = await supabase.from('costs').insert([insertData]);
        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Costo creado correctamente"
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
        variant: "destructive"
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
      cost_category_id: cost.cost_category_id,
      recurring_frequency: cost.recurring_frequency?.toString() || '',
      date_incurred: cost.date_incurred
    });
    setIsDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este costo?')) return;
    try {
      const {
        error
      } = await supabase.from('costs').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Éxito",
        description: "Costo eliminado correctamente"
      });
      await fetchCosts();
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el costo",
        variant: "destructive"
      });
    }
  };
  const getCategoryLabel = (categoryId: string) => {
    const category = costCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };
  const getTypeLabel = (type: string) => {
    return costTypes.find(t => t.value === type)?.label || type;
  };

  // Derived metrics for decision-making and progress tracking
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const isInCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= startOfMonth && d <= endOfMonth;
  };

  const monthToDateSpentCents = costs
    .filter(c => isInCurrentMonth(c.date_incurred))
    .reduce((sum, c) => sum + c.amount_cents, 0);

  const totalMonthly = costs
    .filter(cost => cost.is_active && (cost.cost_type === 'recurring' || cost.cost_type === 'fixed'))
    .reduce((sum, cost) => {
      if (cost.cost_type === 'recurring' && cost.recurring_frequency) {
        return sum + cost.amount_cents * (30 / cost.recurring_frequency);
      }
      return sum + cost.amount_cents;
    }, 0);

  const progressPct = totalMonthly > 0 ? Math.min(100, Math.round((monthToDateSpentCents / totalMonthly) * 100)) : 0;

  const byType = costs.reduce(
    (acc, c) => {
      acc[c.cost_type] = (acc[c.cost_type] || 0) + c.amount_cents;
      return acc;
    },
    {} as Record<CostType, number>
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando costos...</div>;
  }
  return <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold">Costos</h1>
          
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Costo
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCost ? 'Editar Costo' : 'Nuevo Costo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
                  ...prev,
                  name: e.target.value
                }))} placeholder="Ej: Electricidad mes de enero" required />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))} placeholder="Descripción opcional del gasto" rows={2} />
                </div>

                <div>
                  <Label htmlFor="amount">Monto (₡) *</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))} placeholder="0.00" required />
                </div>

                <div>
                  <Label htmlFor="cost_category_id">Categoría *</Label>
                  <Select value={formData.cost_category_id} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  cost_category_id: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map(category => <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cost_type">Tipo *</Label>
                  <Select value={formData.cost_type} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  cost_type: value as CostType
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypes.map(type => <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {formData.cost_type === 'recurring' && <div>
                    <Label htmlFor="recurring_frequency">Frecuencia (días)</Label>
                    <Input id="recurring_frequency" type="number" value={formData.recurring_frequency} onChange={e => setFormData(prev => ({
                  ...prev,
                  recurring_frequency: e.target.value
                }))} placeholder="30 (mensual), 7 (semanal)" />
                  </div>}

                <div>
                  <Label htmlFor="date_incurred">Fecha *</Label>
                  <Input id="date_incurred" type="date" value={formData.date_incurred} onChange={e => setFormData(prev => ({
                  ...prev,
                  date_incurred: e.target.value
                }))} required />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCost ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)} className="px-3">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Manager Modal */}
      <Dialog open={showCategoryManager} onOpenChange={open => {
      setShowCategoryManager(open);
      if (!open) {
        // Refresh categories when modal is closed
        fetchCostCategories();
      }
    }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AdminCostCategories />
        </DialogContent>
      </Dialog>

      {/* Summary Cards - Mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto MTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(monthToDateSpentCents)}</div>
            <p className="text-xs text-muted-foreground">Mes en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Mensual Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalMonthly)}</div>
            <p className="text-xs text-muted-foreground">Fijo + Recurrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{costs.length}</div>
            <p className="text-xs text-muted-foreground">Costos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{costs.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">En seguimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{formatCurrency(monthToDateSpentCents)} / {formatCurrency(totalMonthly)}</span>
              <span className="text-muted-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-muted-foreground">
              <div>Fijo: <span className="font-medium text-foreground">{formatCurrency(byType['fixed' as CostType] || 0)}</span></div>
              <div>Recurrente: <span className="font-medium text-foreground">{formatCurrency(byType['recurring' as CostType] || 0)}</span></div>
              <div>Variable: <span className="font-medium text-foreground">{formatCurrency(byType['variable' as CostType] || 0)}</span></div>
              <div>Único: <span className="font-medium text-foreground">{formatCurrency(byType['one_time' as CostType] || 0)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs List - Mobile optimized */}
      <div className="space-y-4">
        {costs.map(cost => <Card key={cost.id}>
            <CardContent className="p-4">
              {/* Mobile Layout */}
              <div className="flex flex-col space-y-3">
                {/* Header with title and badges */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg break-words">{cost.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={cost.is_active ? "default" : "secondary"} className="text-xs">
                        {cost.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {cost.cost_categories?.name || getCategoryLabel(cost.cost_category_id)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(cost.cost_type)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-bold">
                        {formatCurrency(cost.amount_cents)}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cost)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cost.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {cost.description && <p className="text-muted-foreground text-sm break-words">
                    {cost.description}
                  </p>}
                
                {/* Date info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <span>Fecha: {format(new Date(cost.date_incurred), 'dd/MM/yyyy')}</span>
                  {cost.recurring_frequency && <span>Cada {cost.recurring_frequency} días</span>}
                  {cost.next_due_date && <span>Próximo: {format(new Date(cost.next_due_date), 'dd/MM/yyyy')}</span>}
                </div>
              </div>
            </CardContent>
          </Card>)}
        
        {costs.length === 0 && <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No hay costos registrados. ¡Crea el primero!
              </p>
            </CardContent>
          </Card>}
      </div>
    </div>;
}