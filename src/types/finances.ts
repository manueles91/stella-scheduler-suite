// Finance-related type definitions

export type CostType = 'fixed' | 'variable' | 'recurring' | 'one_time';
export type FinanceTab = 'ingresos' | 'costos';
export type ViewTab = 'graficos' | 'historico';

export interface ReservationLite {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  client_id: string | null;
  customer_email: string | null;
  client_full_name: string | null;
  service_name: string;
  service_price_cents: number;
  final_price_cents: number | null;
  service_variable_price?: boolean;
  category_name: string | null;
  booking_type?: 'service' | 'combo';
  combo_id?: string | null;
  combo_name?: string | null;
  employee_full_name?: string | null;
}

export interface CostCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Cost {
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

export interface CostFormData {
  name: string;
  description: string;
  amount: string;
  cost_type: CostType | '';
  cost_category_id: string;
  recurring_frequency: string;
  date_incurred: string;
}

// Chart data interfaces
export interface DailyRevenueData {
  date: string;
  revenueCents: number;
}

export interface DailyCostData {
  date: string;
  costCents: number;
}

export interface RetentionData {
  chart: Array<{ name: string; value: number }>;
  percentReturning: number;
}

export interface CategoryShareData {
  chart: Array<{ name: string; value: number }>;
  totalCents: number;
}

export interface CostTypeData {
  name: string;
  value: number;
}

// Component prop interfaces
export interface CostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost: Cost | null;
  formData: CostFormData;
  onFormDataChange: (data: CostFormData) => void;
  costCategories: CostCategory[];
  onSubmit: () => void;
  onCancel: () => void;
}

export interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Chart configuration interfaces
export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

// Filter interfaces
export interface FinanceFilters {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  costTypeFilter: string;
}

export interface FilterHandlers {
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onCostTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}
