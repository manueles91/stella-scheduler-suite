export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_id: string;
  employee_id?: string;
  services?: Service[];
  client_profile?: {
    full_name: string;
  };
  employee_profile?: {
    full_name: string;
  };
}

export interface Profile {
  id: string;
  full_name: string;
  role: string;
}