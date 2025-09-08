import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, DollarSign, Receipt, BarChart3, History } from "lucide-react";
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
import { CollapsibleFilter } from "./CollapsibleFilter";
import { CostCard } from "@/components/cards/CostCard";
import { formatCRC } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BookingCard } from "@/components/cards/BookingCard";
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

// Types
type CostType = 'fixed' | 'variable' | 'recurring' | 'one_time';
type FinanceTab = 'ingresos' | 'costos';
type ViewTab = 'graficos' | 'historico';

interface ReservationLite {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  client_id: string | null;
  customer_email: string | null;
  client_full_name: string | null;
  service_name: string;
  service_price_cents: number;
  category_name: string | null;
  booking_type?: 'service' | 'combo';
  combo_id?: string | null;
  combo_name?: string | null;
  employee_full_name?: string | null;
}

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

export const AdminFinanzas = () => {
  // State for tabs
  const [activeFinanceTab, setActiveFinanceTab] = useState<FinanceTab>('ingresos');
  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('graficos');

  // State for data
  const [reservations, setReservations] = useState<ReservationLite[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysWindow] = useState<number>(DAYS_WINDOW_DEFAULT);
  const isMobile = useIsMobile();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [costTypeFilter, setCostTypeFilter] = useState<string>("all");

  // State for cost management
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

  // Fetch data functions
  const fetchReservations = async () => {
    const startDate = subDays(new Date(), daysWindow + 60);
    const startStr = format(startDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("admin_reservations_view")
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        client_id,
        customer_email,
        client_full_name,
        service_name,
        service_price_cents,
        category_name,
        employee_full_name,
        booking_type,
        combo_id,
        combo_name
      `)
      .gte("appointment_date", startStr)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Error loading reservations for ingresos dashboard:", error);
      setReservations([]);
    } else {
      const transformedData = data?.map((reservation: any) => ({
        ...reservation,
        booking_type: reservation.booking_type === 'combo' ? 'combo' as const : 'service' as const
      })) || [];
      setReservations(transformedData);
    }
  };

  const fetchCosts = async () => {
    const startDate = subDays(new Date(), daysWindow + 60);
    const startStr = format(startDate, "yyyy-MM-dd");
    
    const { data, error } = await supabase.from('costs').select(`
        *,
        cost_categories (
          id,
          name,
          description
        )
      `).gte("date_incurred", startStr).order('date_incurred', {
      ascending: true
    });
    
    if (error) {
      console.error('Error fetching costs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los costos",
        variant: "destructive"
      });
    } else {
      setCosts(data || []);
    }
  };

  const fetchCostCategories = async () => {
    try {
      const { data, error } = await supabase.from('cost_categories').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      setCostCategories(data || []);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchReservations(),
      fetchCosts(),
      fetchCostCategories()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [daysWindow]);

  // Computed data for ingresos
  const timeframeStart = useMemo(() => subDays(new Date(), daysWindow - 1), [daysWindow]);
  const timeframeStartStr = useMemo(() => format(timeframeStart, "yyyy-MM-dd"), [timeframeStart]);
  const timeframeDays: string[] = useMemo(() => {
    const days: string[] = [];
    for (let i = daysWindow - 1; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return days;
  }, [daysWindow]);

  const completedInWindow = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status !== "completed" && r.status !== "confirmed") return false;
      return r.appointment_date >= timeframeStartStr;
    });
  }, [reservations, timeframeStartStr]);

  const recentCompletedOnly = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status !== "completed") return false;
      return r.appointment_date >= timeframeStartStr;
    });
  }, [reservations, timeframeStartStr]);

  // Filtered data for historico view
  const filteredReservations = useMemo(() => {
    let filtered = recentCompletedOnly;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(r => 
        r.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee_full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(r => r.category_name === categoryFilter);
    }

    return filtered;
  }, [recentCompletedOnly, searchTerm, statusFilter, categoryFilter]);

  // Computed data for costs
  const costsInWindow = useMemo(() => {
    return costs.filter((c) => {
      return c.date_incurred >= timeframeStartStr;
    });
  }, [costs, timeframeStartStr]);

  const filteredCosts = useMemo(() => {
    let filtered = costsInWindow;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Cost type filter
    if (costTypeFilter !== "all") {
      filtered = filtered.filter(c => c.cost_type === costTypeFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(c => c.cost_category_id === categoryFilter);
    }

    return filtered;
  }, [costsInWindow, searchTerm, costTypeFilter, categoryFilter]);

  // Helper functions
  const getCategoryLabel = (categoryId: string) => {
    const category = costCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const getTypeLabel = (type: string) => {
    return costTypes.find(t => t.value === type)?.label || type;
  };

  const renderCurrencyTick = (value: number) => formatCRC(value);

  // Clear filters when switching tabs
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setCostTypeFilter("all");
  };

  // Chart data for ingresos
  const dailyRevenueData = useMemo(() => {
    const centsByDay = new Map<string, number>();
    timeframeDays.forEach((d) => centsByDay.set(d, 0));

    for (const r of completedInWindow) {
      const key = r.appointment_date;
      const prev = centsByDay.get(key) || 0;
      centsByDay.set(key, prev + (r.service_price_cents || 0));
    }

    return timeframeDays.map((d) => ({
      date: format(parseISO(d), "dd/MM"),
      revenueCents: centsByDay.get(d) || 0,
    }));
  }, [completedInWindow, timeframeDays]);

  const retentionData = useMemo(() => {
    const earliestCompletedByCustomer = new Map<string, string>();
    const identifierFor = (r: ReservationLite) => r.client_id || r.customer_email || r.id;

    const allCompletedSorted = [...reservations]
      .filter((r) => r.status === "completed" || r.status === "confirmed")
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));

    for (const r of allCompletedSorted) {
      const id = identifierFor(r);
      if (!earliestCompletedByCustomer.has(id)) {
        earliestCompletedByCustomer.set(id, r.appointment_date);
      }
    }

    let returningCount = 0;
    let newCount = 0;

    for (const r of completedInWindow) {
      const id = identifierFor(r);
      const firstDate = earliestCompletedByCustomer.get(id);
      if (!firstDate) {
        newCount += 1;
        continue;
      }
      if (firstDate < r.appointment_date) {
        returningCount += 1;
      } else {
        newCount += 1;
      }
    }

    const total = Math.max(1, returningCount + newCount);

    return {
      chart: [
        { name: "Recurrentes", value: returningCount },
        { name: "Nuevos", value: newCount },
      ],
      percentReturning: Math.round((returningCount / total) * 100),
    };
  }, [reservations, completedInWindow]);

  const categoryShare = useMemo(() => {
    const centsByCategory = new Map<string, number>();

    for (const r of completedInWindow) {
      const catName = r.category_name || "Sin categoría";
      const prev = centsByCategory.get(catName) || 0;
      centsByCategory.set(catName, prev + (r.service_price_cents || 0));
    }

    const items = Array.from(centsByCategory.entries()).map(([name, cents]) => ({
      name,
      value: cents,
    }));

    items.sort((a, b) => b.value - a.value);
    const totalCents = items.reduce((s, i) => s + i.value, 0) || 1;

    return {
      chart: items,
      totalCents,
    };
  }, [completedInWindow]);

  // Chart data for costs
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

  const costCategoryShare = useMemo(() => {
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

  // Cost management functions
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
        const { error } = await supabase.from('costs').update(costData).eq('id', editingCost.id);
        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Costo actualizado correctamente"
        });
      } else {
        const insertData = {
          ...costData,
          created_by: profile.id,
          cost_category: 'other' as any
        };
        const { error } = await supabase.from('costs').insert([insertData]);
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
      const { error } = await supabase.from('costs').delete().eq('id', id);
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

  // Chart configurations
  const barMinWidth = useMemo(() => {
    const perBar = isMobile ? 28 : 20;
    const yAxisReserve = isMobile ? 80 : 100;
    return Math.max(640, timeframeDays.length * perBar + yAxisReserve);
  }, [timeframeDays.length, isMobile]);

  const dailyRevenueConfig = useMemo(
    () => ({
      revenueCents: {
        label: "Ingresos diarios",
        color: "hsl(221, 83%, 53%)",
      },
    }),
    []
  );

  const dailyCostConfig = useMemo(
    () => ({
      costCents: {
        label: "Costos diarios",
        color: "hsl(10, 87%, 55%)",
      },
    }),
    []
  );

  const retentionConfig = useMemo(
    () => ({
      Recurrentes: { label: "Recurrentes", color: "hsl(142, 71%, 45%)" },
      Nuevos: { label: "Nuevos", color: "hsl(27, 96%, 61%)" },
    }),
    []
  );

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

  const costCategoryConfig = useMemo(() => {
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
    costCategoryShare.chart.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [costCategoryShare.chart]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-serif font-bold">Finanzas</h2>
        <div className="text-center py-8">Cargando datos...</div>
      </div>
    );
  }

  const renderIngresosCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Ingresos diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div style={{ minWidth: barMinWidth }}>
              <ChartContainer config={dailyRevenueConfig} className="h-[280px] sm:h-[340px]">
                <BarChart data={dailyRevenueData}>
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
                  <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [formatCRC(Number(value)), "Ingresos"]} />
                  <Bar dataKey="revenueCents" fill="var(--color-revenueCents)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retención (clientes recurrentes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <ChartContainer config={retentionConfig} className="h-[240px] sm:h-[280px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie dataKey="value" data={retentionData.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                    {retentionData.chart.map((entry) => (
                      <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="text-center md:w-[160px]">
              <div className="text-4xl font-bold">{retentionData.percentReturning}%</div>
              <div className="text-sm text-muted-foreground">de reservas son de clientes recurrentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por categoría de servicio</CardTitle>
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
  );

  const renderCostosCharts = () => (
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
          {costCategoryShare.chart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin datos</div>
          ) : (
            <ChartContainer config={costCategoryConfig} className="h-[240px] sm:h-[280px]">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                  formatter={(value, name) => [formatCRC(Number(value)), String(name)]}
                />
                <Pie dataKey="value" data={costCategoryShare.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                  {costCategoryShare.chart.map((entry) => (
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
  );

  const renderIngresosHistorico = () => (
    <div className="space-y-4">
      {/* Filter Component */}
      <Card>
        <CardContent className="p-4">
          <CollapsibleFilter 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            placeholder="Buscar ingresos..."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Array.from(new Set(reservations.map(r => r.category_name).filter(Boolean))).map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }} className="w-full">
                Limpiar filtros
              </Button>
            </div>
          </CollapsibleFilter>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Recientes</CardTitle>
          {filteredReservations.length !== recentCompletedOnly.length && (
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-600">
                ({filteredReservations.length} de {recentCompletedOnly.length} resultados)
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {recentCompletedOnly.length === 0 
                  ? "No hay ingresos recientes completados"
                  : "No se encontraron resultados con los filtros aplicados"
                }
              </div>
            ) : (
              filteredReservations.slice(0, 10).map((reservation) => (
                <BookingCard
                  key={reservation.id}
                  id={reservation.id}
                  serviceName={reservation.service_name}
                  appointmentDate={reservation.appointment_date}
                  startTime={reservation.start_time}
                  status={reservation.status}
                  priceCents={reservation.service_price_cents}
                  clientName={reservation.client_full_name || reservation.customer_email || "Cliente invitado"}
                  clientEmail={reservation.customer_email}
                  employeeName={reservation.employee_full_name || undefined}
                  isCombo={reservation.booking_type === 'combo'}
                  comboName={reservation.combo_name}
                  comboId={reservation.combo_id}
                  variant="revenue"
                  showExpandable={true}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCostosHistorico = () => (
    <div className="space-y-4">
      {/* Filter Component */}
      <Card>
        <CardContent className="p-4">
          <CollapsibleFilter 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            placeholder="Buscar costos..."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {costTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {costCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setCostTypeFilter("all");
                setCategoryFilter("all");
              }} className="w-full">
                Limpiar filtros
              </Button>
            </div>
          </CollapsibleFilter>
        </CardContent>
      </Card>

      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Costos</h3>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)} className="px-3">
            Categorías
          </Button>
        </div>
      </div>

      {/* Category Manager Modal */}
      <Dialog open={showCategoryManager} onOpenChange={open => {
        setShowCategoryManager(open);
        if (!open) {
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
          {filteredCosts.length !== costsInWindow.length && (
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-600">
                ({filteredCosts.length} de {costsInWindow.length} resultados)
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCosts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {costsInWindow.length === 0 
                  ? "No hay costos registrados en el período seleccionado"
                  : "No se encontraron resultados con los filtros aplicados"
                }
              </div>
            ) : (
              filteredCosts.slice(0, 10).map((cost) => (
                <CostCard
                  key={cost.id}
                  id={cost.id}
                  name={cost.name}
                  description={cost.description}
                  amountCents={cost.amount_cents}
                  costCategoryId={cost.cost_category_id}
                  costType={cost.cost_type as CostType}
                  dateIncurred={cost.date_incurred}
                  isActive={cost.is_active}
                  recurringFrequency={cost.recurring_frequency}
                  categoryName={getCategoryLabel(cost.cost_category_id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Cost Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold">Finanzas</h2>
        <div className="text-sm text-muted-foreground">Últimos {daysWindow} días</div>
      </div>

      {/* First Tab Selector - Ingresos/Costos */}
      <div className="flex gap-1 px-1 py-0.5 bg-stone-100 rounded-lg w-full">
        <Button
          variant="ghost"
          onClick={() => {
            setActiveFinanceTab('ingresos');
            clearFilters();
          }}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all flex-1 ${
            activeFinanceTab === 'ingresos' 
              ? 'bg-white shadow-sm border border-stone-200 text-stone-800' 
              : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Ingresos
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setActiveFinanceTab('costos');
            clearFilters();
          }}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all flex-1 ${
            activeFinanceTab === 'costos' 
              ? 'bg-white shadow-sm border border-stone-200 text-stone-800' 
              : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Costos
        </Button>
      </div>

      {/* Second Tab Selector - Gráficos/Histórico */}
      <div className="flex gap-1 px-1 py-0.5 bg-stone-100 rounded-lg w-full">
        <Button
          variant="ghost"
          onClick={() => setActiveViewTab('graficos')}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all flex-1 ${
            activeViewTab === 'graficos' 
              ? 'bg-white shadow-sm border border-stone-200 text-stone-800' 
              : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Gráficos
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveViewTab('historico')}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all flex-1 ${
            activeViewTab === 'historico' 
              ? 'bg-white shadow-sm border border-stone-200 text-stone-800' 
              : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>

      {/* Content based on selected tabs */}
      {activeViewTab === 'graficos' && (
        <>
          {activeFinanceTab === 'ingresos' && renderIngresosCharts()}
          {activeFinanceTab === 'costos' && renderCostosCharts()}
        </>
      )}

      {activeViewTab === 'historico' && (
        <>
          {activeFinanceTab === 'ingresos' && renderIngresosHistorico()}
          {activeFinanceTab === 'costos' && renderCostosHistorico()}
        </>
      )}
    </div>
  );
};
