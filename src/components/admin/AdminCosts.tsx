import { useEffect, useMemo, useState } from "react";
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
import { format, subDays, parseISO } from "date-fns";
import { AdminCostCategories } from "./AdminCostCategories";
import { formatCRC } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

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

const DAYS_WINDOW_DEFAULT = 30;

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
  const [daysWindow] = useState<number>(DAYS_WINDOW_DEFAULT);
  const { toast } = useToast();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  
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
  }, [daysWindow]);

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
      const startDate = subDays(new Date(), daysWindow + 60); // include lookback for context
      const startStr = format(startDate, "yyyy-MM-dd");
      
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
        `).gte("date_incurred", startStr).order('date_incurred', {
        ascending: true
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

  const timeframeStart = useMemo(() => subDays(new Date(), daysWindow - 1), [daysWindow]);
  const timeframeStartStr = useMemo(() => format(timeframeStart, "yyyy-MM-dd"), [timeframeStart]);
  const timeframeDays: string[] = useMemo(() => {
    const days: string[] = [];
    for (let i = daysWindow - 1; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return days;
  }, [daysWindow]);

  const costsInWindow = useMemo(() => {
    return costs.filter((c) => {
      return c.date_incurred >= timeframeStartStr;
    });
  }, [costs, timeframeStartStr]);

  const dailyCostData = useMemo(() => {
    const centsByDay = new Map<string, number>();
    timeframeDays.forEach((d) => centsByDay.set(d, 0));

    for (const c of costsInWindow) {
      const key = c.date_incurred;
      const prev = centsByDay.get(key) || 0;
      centsByDay.set(key, prev + c.amount_cents);
    }

    return timeframeDays.map((d) => ({
      date: format(parseISO(d), "dd/MM"),
      costCents: centsByDay.get(d) || 0,
    }));
  }, [costsInWindow, timeframeDays]);

  const barMinWidth = useMemo(() => {
    const perBar = isMobile ? 28 : 20;
    const yAxisReserve = isMobile ? 80 : 100;
    return Math.max(640, dailyCostData.length * perBar + yAxisReserve);
  }, [dailyCostData.length, isMobile]);

  const costTypeData = useMemo(() => {
    const centsByType = new Map<string, number>();
    
    for (const c of costsInWindow) {
      const typeLabel = getTypeLabel(c.cost_type);
      const prev = centsByType.get(typeLabel) || 0;
      centsByType.set(typeLabel, prev + c.amount_cents);
    }

    return Array.from(centsByType.entries()).map(([name, cents]) => ({
      name,
      value: cents,
    })).filter(item => item.value > 0);
  }, [costsInWindow]);

  const categoryShare = useMemo(() => {
    const centsByCategory = new Map<string, number>();

    for (const c of costsInWindow) {
      const catName = c.cost_categories?.name || "Sin categoría";
      const prev = centsByCategory.get(catName) || 0;
      centsByCategory.set(catName, prev + c.amount_cents);
    }

    const items = Array.from(centsByCategory.entries()).map(([name, cents]) => ({
      name,
      value: cents,
    })).filter(item => item.value > 0);

    items.sort((a, b) => b.value - a.value);

    return {
      chart: items,
      totalCents: items.reduce((s, i) => s + i.value, 0) || 1,
    };
  }, [costsInWindow]);

  const costTypeConfig = useMemo(() => {
    const palette = [
      "hsl(10, 87%, 55%)",
      "hsl(27, 96%, 61%)",
      "hsl(340, 82%, 52%)",
      "hsl(291, 64%, 42%)",
    ];

    const cfg: Record<string, { label: string; color: string }> = {};
    costTypeData.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [costTypeData]);

  const categoryConfig = useMemo(() => {
    const palette = [
      "hsl(221, 83%, 53%)",
      "hsl(142, 71%, 45%)",
      "hsl(27, 96%, 61%)",
      "hsl(291, 64%, 42%)",
      "hsl(199, 89%, 48%)",
      "hsl(340, 82%, 52%)",
      "hsl(10, 87%, 55%)",
      "hsl(50, 94%, 58%)",
      "hsl(170, 78%, 41%)",
    ];

    const cfg: Record<string, { label: string; color: string }> = {};
    categoryShare.chart.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [categoryShare.chart]);

  const dailyCostConfig = useMemo(
    () => ({
      costCents: {
        label: "Costos diarios",
        color: "hsl(10, 87%, 55%)",
      },
    }),
    []
  );

  const renderCurrencyTick = (value: number) => formatCRC(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-serif font-bold">Costos</h2>
        <div className="text-center py-8">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold">Costos</h2>
        <div className="text-sm text-muted-foreground">Últimos {daysWindow} días</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Costos diarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="-mx-4 sm:mx-0 overflow-x-auto">
              <div style={{ minWidth: barMinWidth }}>
                <ChartContainer config={dailyCostConfig} className="h-[280px] sm:h-[340px]">
                  <BarChart data={dailyCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      height={isMobile ? 50 : 30}
                      tick={{ fontSize: isMobile ? 12 : 11 }}
                      angle={isMobile ? -45 : 0}
                      dy={isMobile ? 10 : 0}
                    />
                    <YAxis
                      tickFormatter={renderCurrencyTick}
                      tickLine={false}
                      axisLine={false}
                      width={isMobile ? 64 : 80}
                      tick={{ fontSize: isMobile ? 12 : 11 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [formatCRC(Number(value)), "Costos"]} />
                    <Bar dataKey="costCents" fill="var(--color-costCents)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por tipo de costo</CardTitle>
          </CardHeader>
          <CardContent>
            {costTypeData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Sin datos</div>
            ) : (
              <ChartContainer config={costTypeConfig} className="h-[240px] sm:h-[280px]">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                    formatter={(value, name) => [formatCRC(Number(value)), String(name)]}
                  />
                  <Pie dataKey="value" data={costTypeData} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                    {costTypeData.map((entry) => (
                      <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryShare.chart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Sin datos</div>
            ) : (
              <ChartContainer config={categoryConfig} className="h-[240px] sm:h-[280px]">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                    formatter={(value, name) => [formatCRC(Number(value)), String(name)]}
                  />
                  <Pie dataKey="value" data={categoryShare.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                    {categoryShare.chart.map((entry) => (
                      <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Section */}
      <div className="space-y-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <h3 className="text-xl font-semibold">Gestión de costos</h3>
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
              Categorías
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

        {/* Costs List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de costos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costsInWindow.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No hay costos registrados en el período seleccionado
                </div>
              ) : (
                costsInWindow.slice(0, 10).map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{cost.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getCategoryLabel(cost.cost_category_id)} • {getTypeLabel(cost.cost_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(cost.date_incurred), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">{formatCRC(cost.amount_cents)}</div>
                        <Badge variant={cost.is_active ? "default" : "secondary"} className="text-xs">
                          {cost.is_active ? "Activo" : "Inactivo"}
                        </Badge>
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
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}