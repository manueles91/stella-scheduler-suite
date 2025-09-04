import { Service, Profile } from './booking';

export interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_id?: string;
  guest_user_id?: string;
  employee_id?: string;
  services?: Service[];
  client_profile?: {
    full_name: string;
  };
  employee_profile?: {
    full_name: string;
  };
  // Combo-related fields
  isCombo?: boolean;
  comboId?: string | null;
  comboName?: string | null;
}