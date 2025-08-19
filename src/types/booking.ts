export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  category_id?: string;
  image_url?: string;
  variable_price?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  combo_services: {
    service_id: string;
    quantity: number;
    services: Service;
  }[];
}

export interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_public: boolean;
  discount_code?: string;
  is_active: boolean;
  service_id: string;
}

export interface BookableItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  original_price_cents: number;
  final_price_cents: number;
  category_id?: string;
  image_url?: string;
  variable_price?: boolean;
  type: 'service' | 'combo';
  appliedDiscount?: Discount;
  savings_cents: number;
  combo_services?: {
    service_id: string;
    quantity: number;
    services: Service;
  }[];
}

export interface Employee {
  id: string;
  full_name: string;
  employee_services: {
    service_id: string;
  }[];
}

export interface TimeSlot {
  start_time: string;
  employee_id: string;
  employee_name: string;
  available: boolean;
}

export interface BookingStep {
  id: number;
  title: string;
  description: string;
}

export interface BookingState {
  currentStep: number;
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  selectedEmployee: Employee | null;
  notes: string;
  loading: boolean;
  submitting: boolean;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export interface BookingConfig {
  isGuest: boolean;
  showAuthStep: boolean;
  allowEmployeeSelection: boolean;
  showCategories: boolean;
  maxSteps: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'client' | 'employee' | 'admin';
  created_at?: string;
  image_url?: string;
} 