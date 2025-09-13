// Shared types and interfaces for AdminQuickAccess dialogs

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  category_id?: string;
  variable_price?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  primary_employee_id?: string;
  combo_services: {
    service_id: string;
    quantity: number;
    services: Service;
  }[];
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'client' | 'employee' | 'admin';
  account_status: string;
}

export interface CostCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'client' | 'employee' | 'admin';
  account_status: string;
  created_at: string;
}

export interface AppointmentData {
  serviceId: string;
  employeeId: string;
  date: string;
  time: string;
  notes: string;
  isCombo: boolean;
}

export interface SaleData {
  serviceId: string;
  employeeId: string;
  date: string;
  time: string;
  chargedPrice: string;
  notes: string;
  isCombo: boolean;
}

export interface CostData {
  name: string;
  description: string;
  amount: string;
  cost_type: 'fixed' | 'variable' | 'recurring' | 'one_time';
  cost_category_id: string;
  date_incurred: string;
}

export interface UserData {
  email: string;
  full_name: string;
  phone: string;
  role: 'client' | 'employee' | 'admin';
}

export interface QuickAccessDialogProps {
  effectiveProfile: any;
}

export const costTypes = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'recurring', label: 'Recurrente' },
  { value: 'one_time', label: 'Una vez' }
] as const;
