-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('client', 'employee', 'admin');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee schedules table
CREATE TABLE public.employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee services junction table
CREATE TABLE public.employee_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, service_id)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time tracking table for employees
CREATE TABLE public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL,
  total_hours DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Services policies
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Employee schedules policies
CREATE POLICY "Employees can view own schedules" ON public.employee_schedules FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage all schedules" ON public.employee_schedules FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Employee services policies
CREATE POLICY "Anyone can view employee services" ON public.employee_services FOR SELECT USING (true);
CREATE POLICY "Admins can manage employee services" ON public.employee_services FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Reservations policies
CREATE POLICY "Clients can view own reservations" ON public.reservations FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Employees can view assigned reservations" ON public.reservations FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can view all reservations" ON public.reservations FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Clients can create reservations" ON public.reservations FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can update own reservations" ON public.reservations FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "Admins can manage all reservations" ON public.reservations FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Time logs policies
CREATE POLICY "Employees can view own time logs" ON public.time_logs FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Employees can create own time logs" ON public.time_logs FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can update own time logs" ON public.time_logs FOR UPDATE USING (employee_id = auth.uid());
CREATE POLICY "Admins can view all time logs" ON public.time_logs FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'client'
  );
  RETURN new;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample services
INSERT INTO public.services (name, description, duration_minutes, price_cents) VALUES
('Signature Facial', 'Our premium anti-aging facial treatment with luxury skincare products', 90, 15000),
('Hair Cut & Style', 'Professional haircut with wash, cut, and styling', 60, 8500),
('Hair Color', 'Full color service with consultation and styling', 180, 18000),
('Manicure', 'Classic manicure with nail shaping and polish', 45, 6500),
('Pedicure', 'Luxury pedicure with foot massage and polish', 60, 7500),
('Massage Therapy', 'Relaxing full-body massage therapy session', 90, 12000),
('Eyebrow Shaping', 'Professional eyebrow shaping and tinting', 30, 4500),
('Makeup Application', 'Professional makeup for special events', 45, 8000);

-- MOCK ADMIN USER (for testing, ensure a matching user exists in auth.users with this UUID)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Administrador', 'admin')
ON CONFLICT (id) DO NOTHING;
-- To fully enable login, create a user in auth.users with the same id and email.