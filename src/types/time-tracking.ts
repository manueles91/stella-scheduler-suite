import { Appointment } from './appointment';
import { Service, Profile } from './booking';

// Re-export types for convenience
export type { Appointment, Service };

// Customer interface that matches both profiles and invited_users
export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'client' | 'employee' | 'admin';
  account_status: string;
  created_at: string;
}

// BlockedTime interface matching database schema
export interface BlockedTime {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_recurring: boolean;
  created_at: string;
  updated_at?: string;
}

// Employee interface for time tracking
export interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'admin';
}

// Form data interfaces
export interface AppointmentFormData {
  client_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
  final_price_cents?: number;
  isCombo?: boolean;
  employee_id?: string;
  status?: string;
}

export interface BlockedTimeFormData {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_recurring: boolean;
}

// Dialog types
export type DialogType = 'appointment' | 'block';

// Time slot configuration
export interface TimeSlotConfig {
  hour: number;
  minute: number;
  timeString: string;
  timeString12h: string;
}

// Calendar event style calculation
export interface EventStyle {
  position: 'absolute';
  top: string;
  height: string;
  left: string;
  right: string;
  zIndex: number;
}

// Component props interfaces
export interface TimeTrackingProps {
  employeeId?: string;
}

export interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  editingAppointment: Appointment | null;
  appointmentForm: AppointmentFormData;
  onAppointmentFormChange: (form: AppointmentFormData) => void;
  onEditingAppointmentChange: (appointment: Appointment | null) => void;
  services: Service[];
  clients: Customer[];
  employees: Employee[];
  combos?: any[]; // Add combos support
  onSubmit: () => void;
  onCancel: () => void;
  // Optional props for different contexts
  effectiveProfile?: any;
  showPriceField?: boolean; // Whether to show the price field
}

export interface BlockedTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  editingBlockedTime: BlockedTime | null;
  blockedTimeForm: BlockedTimeFormData;
  onBlockedTimeFormChange: (form: BlockedTimeFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface TypePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTimeSlot: string;
  onAppointmentClick: () => void;
  onBlockTimeClick: () => void;
}

export interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  showBlockedTimes: boolean;
  onTimeSlotClick: (timeSlot: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onBlockedTimeClick: (blockedTime: BlockedTime) => void;
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onTodayClick: () => void;
}

// Utility function types
export type TimeConverter = (time24: string) => string;
export type EventStyleCalculator = (startTime: string, endTime: string) => EventStyle;
export type StatusColorGetter = (status: string) => string;
export type StatusTextGetter = (status: string) => string;
