export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  category_id?: string;
  image_url?: string;
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
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  selectedEmployee: Employee | null;
  notes: string;
  loading: boolean;
  submitting: boolean;
}

export interface BookingConfig {
  isGuest: boolean;
  showAuthStep: boolean;
  allowEmployeeSelection: boolean;
  showCategories: boolean;
  maxSteps: number;
} 