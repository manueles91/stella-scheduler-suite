import { useState, useMemo } from "react";
import { DollarSign, Receipt, BarChart3, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinances } from "@/hooks/useFinances";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  CostDialog, 
  CategoryManagerDialog, 
  RevenueCharts, 
  CostCharts, 
  RevenueHistory, 
  CostHistory 
} from "./finances";
import { 
  FinanceTab, 
  ViewTab, 
  CostFormData, 
  FinanceFilters, 
  FilterHandlers,
  ChartConfig
} from "@/types/finances";
import { Cost, CostType } from "@/types/finances";

export const AdminFinanzas = () => {
  // State for tabs
  const [activeFinanceTab, setActiveFinanceTab] = useState<FinanceTab>('ingresos');
  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('graficos');

  // State for cost management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // State for filters
  const [filters, setFilters] = useState<FinanceFilters>({
    searchTerm: "",
    statusFilter: "all",
    categoryFilter: "all",
    costTypeFilter: "all"
  });

  // Form state
  const [formData, setFormData] = useState<CostFormData>({
    name: '',
    description: '',
    amount: '',
    cost_type: '',
    cost_category_id: '',
    recurring_frequency: '',
    date_incurred: new Date().toISOString().split('T')[0]
  });

  const isMobile = useIsMobile();
  const {
    reservations,
    costs,
    costCategories,
    loading,
    daysWindow,
    completedInWindow,
    recentCompletedOnly,
    costsInWindow,
    dailyRevenueData,
    retentionData,
    categoryShareData,
    dailyCostData,
    costTypeData,
    costCategoryShareData,
    getTypeLabel,
    getCategoryLabel,
    createCost,
    updateCost,
    deleteCost,
    fetchCostCategories
  } = useFinances();

  // Filter handlers
  const filterHandlers: FilterHandlers = {
    onSearchChange: (value: string) => setFilters(prev => ({ ...prev, searchTerm: value })),
    onStatusFilterChange: (value: string) => setFilters(prev => ({ ...prev, statusFilter: value })),
    onCategoryFilterChange: (value: string) => setFilters(prev => ({ ...prev, categoryFilter: value })),
    onCostTypeFilterChange: (value: string) => setFilters(prev => ({ ...prev, costTypeFilter: value })),
    onClearFilters: () => setFilters({
      searchTerm: "",
      statusFilter: "all",
      categoryFilter: "all",
      costTypeFilter: "all"
    })
  };

  // Filtered data
  const filteredReservations = useMemo(() => {
    let filtered = recentCompletedOnly;

    if (filters.searchTerm.trim()) {
      filtered = filtered.filter(r => 
        r.service_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        r.client_full_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        r.customer_email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        r.employee_full_name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === filters.statusFilter);
    }

    if (filters.categoryFilter !== "all") {
      filtered = filtered.filter(r => r.category_name === filters.categoryFilter);
    }

    return filtered;
  }, [recentCompletedOnly, filters]);

  const filteredCosts = useMemo(() => {
    let filtered = costsInWindow;

    if (filters.searchTerm.trim()) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.costTypeFilter !== "all") {
      filtered = filtered.filter(c => c.cost_type === filters.costTypeFilter);
    }

    if (filters.categoryFilter !== "all") {
      filtered = filtered.filter(c => c.cost_category_id === filters.categoryFilter);
    }

    return filtered;
  }, [costsInWindow, filters]);

  // Chart configurations
  const barMinWidth = useMemo(() => {
    const perBar = isMobile ? 28 : 20;
    const yAxisReserve = isMobile ? 80 : 100;
    return Math.max(640, 30 * perBar + yAxisReserve); // 30 days default
  }, [isMobile]);

  const dailyRevenueConfig: ChartConfig = useMemo(
    () => ({
      revenueCents: {
        label: "Ingresos diarios",
        color: "hsl(221, 83%, 53%)",
      },
    }),
    []
  );

  const dailyCostConfig: ChartConfig = useMemo(
    () => ({
      costCents: {
        label: "Costos diarios",
        color: "hsl(10, 87%, 55%)",
      },
    }),
    []
  );

  const retentionConfig: ChartConfig = useMemo(
    () => ({
      Recurrentes: { label: "Recurrentes", color: "hsl(142, 71%, 45%)" },
      Nuevos: { label: "Nuevos", color: "hsl(27, 96%, 61%)" },
    }),
    []
  );

  const categoryConfig: ChartConfig = useMemo(() => {
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

    const cfg: ChartConfig = {};
    categoryShareData.chart.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [categoryShareData.chart]);

  const costTypeConfig: ChartConfig = useMemo(() => {
    const palette = [
      "hsl(10, 87%, 55%)",
      "hsl(27, 96%, 61%)",
      "hsl(340, 82%, 52%)",
      "hsl(291, 64%, 42%)",
    ];

    const cfg: ChartConfig = {};
    costTypeData.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [costTypeData]);

  const costCategoryConfig: ChartConfig = useMemo(() => {
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

    const cfg: ChartConfig = {};
    costCategoryShareData.chart.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [costCategoryShareData.chart]);

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

  const handleCostSubmit = async () => {
    if (!formData.name || !formData.amount || !formData.cost_type || !formData.cost_category_id) {
      return;
    }

    const success = editingCost 
      ? await updateCost(editingCost.id, formData)
      : await createCost(formData);

    if (success) {
      setIsDialogOpen(false);
      resetForm();
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
    await deleteCost(id);
  };

  const handleCategoryManagerClose = () => {
    setShowCategoryManager(false);
    fetchCostCategories();
  };

  // Clear filters when switching tabs
  const clearFilters = () => {
    filterHandlers.onClearFilters();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-serif font-bold">Finanzas</h2>
        <div className="text-center py-8">Cargando datos...</div>
      </div>
    );
  }

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
          {activeFinanceTab === 'ingresos' && (
            <RevenueCharts
              dailyRevenueData={dailyRevenueData}
              retentionData={retentionData}
              categoryShareData={categoryShareData}
              barMinWidth={barMinWidth}
              dailyRevenueConfig={dailyRevenueConfig}
              retentionConfig={retentionConfig}
              categoryConfig={categoryConfig}
            />
          )}
          {activeFinanceTab === 'costos' && (
            <CostCharts
              dailyCostData={dailyCostData}
              costTypeData={costTypeData}
              costCategoryShareData={costCategoryShareData}
              barMinWidth={barMinWidth}
              dailyCostConfig={dailyCostConfig}
              costTypeConfig={costTypeConfig}
              costCategoryConfig={costCategoryConfig}
            />
          )}
        </>
      )}

      {activeViewTab === 'historico' && (
        <>
          {activeFinanceTab === 'ingresos' && (
            <RevenueHistory
              filteredReservations={filteredReservations}
              recentCompletedOnly={recentCompletedOnly}
              reservations={reservations}
              filters={filters}
              filterHandlers={filterHandlers}
            />
          )}
          {activeFinanceTab === 'costos' && (
            <CostHistory
              filteredCosts={filteredCosts}
              costsInWindow={costsInWindow}
              costCategories={costCategories}
              filters={filters}
              filterHandlers={filterHandlers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCategoryManagerOpen={() => setShowCategoryManager(true)}
              getCategoryLabel={getCategoryLabel}
            />
          )}
        </>
      )}

      {/* Cost Dialog */}
      <CostDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCost={editingCost}
        formData={formData}
        onFormDataChange={setFormData}
        costCategories={costCategories}
        onSubmit={handleCostSubmit}
        onCancel={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={showCategoryManager}
        onOpenChange={handleCategoryManagerClose}
      />
    </div>
  );
};
