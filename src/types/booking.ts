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

export interface ComboServiceAssignment {
  id: string;
  combo_reservation_id: string;
  service_id: string;
  assigned_employee_id?: string;
  estimated_start_time?: string;
  estimated_duration: number;
  actual_start_time?: string;
  actual_end_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Related data
  service?: Service;
  assigned_employee?: Employee;
}

export interface ComboReservation {
  id: string;
  client_id?: string;
  guest_user_id?: string;
  combo_id: string;
  primary_employee_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'in_progress';
  notes?: string;
  final_price_cents?: number;
  original_price_cents?: number;
  savings_cents?: number;
  is_guest_booking: boolean;
  customer_email?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  // Related data
  combo?: Combo;
  primary_employee?: Employee;
  client?: any;
  service_assignments?: ComboServiceAssignment[];
} 