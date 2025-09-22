import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, parseISO } from "date-fns";
import { 
  ReservationLite, 
  Cost, 
  CostCategory, 
  CostFormData, 
  CostType,
  DailyRevenueData,
  DailyCostData,
  RetentionData,
  CategoryShareData,
  CostTypeData
} from "@/types/finances";

const DAYS_WINDOW_DEFAULT = 30;

export const useFinances = () => {
  const [reservations, setReservations] = useState<ReservationLite[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysWindow] = useState<number>(DAYS_WINDOW_DEFAULT);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fetch reservations
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
        final_price_cents,
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

  // Fetch costs
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

  // Fetch cost categories
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

  // Load all data
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

  // Computed data for costs
  const costsInWindow = useMemo(() => {
    return costs.filter((c) => {
      return c.date_incurred >= timeframeStartStr;
    });
  }, [costs, timeframeStartStr]);

  // Chart data for ingresos
  const dailyRevenueData = useMemo((): DailyRevenueData[] => {
    const centsByDay = new Map<string, number>();
    timeframeDays.forEach((d) => centsByDay.set(d, 0));

    // Only include completed bookings for revenue calculation
    const completedOnly = reservations.filter((r) => {
      if (r.status !== "completed") return false;
      return r.appointment_date >= timeframeStartStr;
    });

    for (const r of completedOnly) {
      const key = r.appointment_date;
      const prev = centsByDay.get(key) || 0;
      centsByDay.set(key, prev + (r.final_price_cents !== null ? r.final_price_cents : r.service_price_cents || 0));
    }

    return timeframeDays.map((d) => ({
      date: format(parseISO(d), "dd/MM"),
      revenueCents: centsByDay.get(d) || 0,
    }));
  }, [reservations, timeframeDays, timeframeStartStr]);

  const retentionData = useMemo((): RetentionData => {
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

  const categoryShareData = useMemo((): CategoryShareData => {
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

  // Helper functions (moved before useMemo that uses them)
  const getTypeLabel = (type: string) => {
    const costTypes = [
      { value: 'fixed', label: 'Fijo' },
      { value: 'variable', label: 'Variable' },
      { value: 'recurring', label: 'Recurrente' },
      { value: 'one_time', label: 'Una vez' }
    ];
    return costTypes.find(t => t.value === type)?.label || type;
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = costCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  // Chart data for costs
  const dailyCostData = useMemo((): DailyCostData[] => {
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

  const costTypeData = useMemo((): CostTypeData[] => {
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

  const costCategoryShareData = useMemo((): CategoryShareData => {
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
  const createCost = async (formData: CostFormData) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return false;
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
        next_due_date: formData.cost_type === 'recurring' && formData.recurring_frequency ? new Date(new Date(formData.date_incurred).getTime() + parseInt(formData.recurring_frequency) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        created_by: profile.id,
        cost_category: 'other' as any
      };

      const { error } = await supabase.from('costs').insert([costData]);
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Costo creado correctamente"
      });
      
      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error saving cost:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el costo",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateCost = async (costId: string, formData: CostFormData) => {
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

      const { error } = await supabase.from('costs').update(costData).eq('id', costId);
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Costo actualizado correctamente"
      });
      
      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error updating cost:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el costo",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCost = async (id: string) => {
    try {
      const { error } = await supabase.from('costs').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Costo eliminado correctamente"
      });
      
      await fetchCosts();
      return true;
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el costo",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    // State
    reservations,
    costs,
    costCategories,
    loading,
    daysWindow,
    
    // Computed data
    completedInWindow,
    recentCompletedOnly,
    costsInWindow,
    dailyRevenueData,
    retentionData,
    categoryShareData,
    dailyCostData,
    costTypeData,
    costCategoryShareData,
    
    // Helper functions
    getTypeLabel,
    getCategoryLabel,
    
    // Actions
    fetchAllData,
    createCost,
    updateCost,
    deleteCost,
    fetchCostCategories
  };
};
