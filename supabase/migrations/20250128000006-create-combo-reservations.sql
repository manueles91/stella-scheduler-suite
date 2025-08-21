-- Create combo reservations table for enhanced combo booking system
-- This allows single reservations for combos while tracking individual service assignments

-- Create combo_reservations table
CREATE TABLE public.combo_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_user_id UUID REFERENCES public.invited_users(id) ON DELETE CASCADE,
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  primary_employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL, -- Total combo duration
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show', 'in_progress')),
  notes TEXT,
  final_price_cents INTEGER,
  original_price_cents INTEGER,
  savings_cents INTEGER,
  is_guest_booking BOOLEAN DEFAULT false,
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create combo service assignments table for tracking individual service employees
CREATE TABLE public.combo_service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_reservation_id UUID NOT NULL REFERENCES public.combo_reservations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_start_time TIME, -- Estimated time within the combo block
  estimated_duration INTEGER, -- Duration in minutes
  actual_start_time TIME, -- Actual start time when service begins
  actual_end_time TIME, -- Actual end time when service completes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(combo_reservation_id, service_id)
);

-- Add indexes for performance
CREATE INDEX idx_combo_reservations_client_id ON public.combo_reservations(client_id);
CREATE INDEX idx_combo_reservations_guest_user_id ON public.combo_reservations(guest_user_id);
CREATE INDEX idx_combo_reservations_combo_id ON public.combo_reservations(combo_id);
CREATE INDEX idx_combo_reservations_primary_employee_id ON public.combo_reservations(primary_employee_id);
CREATE INDEX idx_combo_reservations_date_status ON public.combo_reservations(appointment_date, status);
CREATE INDEX idx_combo_service_assignments_reservation_id ON public.combo_service_assignments(combo_reservation_id);
CREATE INDEX idx_combo_service_assignments_service_id ON public.combo_service_assignments(service_id);
CREATE INDEX idx_combo_service_assignments_employee_id ON public.combo_service_assignments(assigned_employee_id);

-- Enable RLS on new tables
ALTER TABLE public.combo_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_service_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for combo_reservations
CREATE POLICY "Comprehensive combo reservation access policy" 
ON public.combo_reservations 
FOR SELECT 
USING (
  -- Admins can see all combo reservations
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employees can see their assigned combo reservations
  OR (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid())
  -- Clients can see their own combo reservations
  OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
  -- Guest users can see their specific combo reservation
  OR (is_guest_booking = true AND customer_email IS NOT NULL)
);

CREATE POLICY "Combo reservation creation policy" 
ON public.combo_reservations 
FOR INSERT 
WITH CHECK (
  -- Authenticated users can create combo reservations for themselves
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) 
  -- Guest users can create combo reservations
  OR (is_guest_booking = true AND customer_email IS NOT NULL)
  -- Admins can create combo reservations for any client
  OR (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

CREATE POLICY "Combo reservation update policy" 
ON public.combo_reservations 
FOR UPDATE 
USING (
  -- Admins can update any combo reservation
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employees can update their assigned combo reservations
  OR (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid())
  -- Clients can update their own combo reservations
  OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
);

-- RLS policies for combo_service_assignments
CREATE POLICY "Combo service assignment access policy" 
ON public.combo_service_assignments 
FOR SELECT 
USING (
  -- Admins can see all service assignments
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Employees can see their assigned services
  OR (auth.uid() IS NOT NULL AND assigned_employee_id = auth.uid())
  -- Primary employees can see all services in their combo reservations
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.combo_reservations cr 
    WHERE cr.id = combo_reservations.combo_reservation_id 
    AND cr.primary_employee_id = auth.uid()
  ))
);

CREATE POLICY "Combo service assignment creation policy" 
ON public.combo_service_assignments 
FOR INSERT 
WITH CHECK (
  -- Admins can create service assignments
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employees can create service assignments for their combo reservations
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.combo_reservations cr 
    WHERE cr.id = combo_reservations.combo_reservation_id 
    AND cr.primary_employee_id = auth.uid()
  ))
);

CREATE POLICY "Combo service assignment update policy" 
ON public.combo_service_assignments 
FOR UPDATE 
USING (
  -- Admins can update any service assignment
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Assigned employees can update their service assignments
  OR (auth.uid() IS NOT NULL AND assigned_employee_id = auth.uid())
  -- Primary employees can update service assignments in their combo reservations
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.combo_reservations cr 
    WHERE cr.id = combo_reservations.combo_reservation_id 
    AND cr.primary_employee_id = auth.uid()
  ))
);

-- Function to automatically create service assignments when a combo reservation is created
CREATE OR REPLACE FUNCTION create_combo_service_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert service assignments for each service in the combo
  INSERT INTO public.combo_service_assignments (
    combo_reservation_id,
    service_id,
    estimated_start_time,
    estimated_duration
  )
  SELECT 
    NEW.id,
    cs.service_id,
    -- Calculate estimated start time based on service order and duration
    (NEW.start_time::time + 
     (COALESCE(
       (SELECT SUM(s.duration_minutes * cs2.quantity) 
        FROM combo_services cs2 
        JOIN services s ON cs2.service_id = s.id 
        WHERE cs2.combo_id = NEW.combo_id 
        AND cs2.service_id < cs.service_id), 0
     ) * interval '1 minute'))::time,
    -- Get service duration
    (SELECT s.duration_minutes * cs.quantity 
     FROM services s 
     WHERE s.id = cs.service_id)
  FROM combo_services cs
  WHERE cs.combo_id = NEW.combo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create service assignments
CREATE TRIGGER trigger_create_combo_service_assignments
  AFTER INSERT ON public.combo_reservations
  FOR EACH ROW
  EXECUTE FUNCTION create_combo_service_assignments();

-- Function to update combo reservation end time when service assignments change
CREATE OR REPLACE FUNCTION update_combo_reservation_timing()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the combo reservation end time based on total duration
  UPDATE public.combo_reservations 
  SET 
    end_time = (
      start_time::time + 
      (SELECT COALESCE(SUM(estimated_duration), 0) * interval '1 minute'
       FROM public.combo_service_assignments 
       WHERE combo_reservation_id = NEW.combo_reservation_id
      )
    )::time,
    updated_at = NOW()
  WHERE id = NEW.combo_reservation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update combo reservation timing when service assignments change
CREATE TRIGGER trigger_update_combo_reservation_timing
  AFTER INSERT OR UPDATE ON public.combo_service_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_combo_reservation_timing();

-- Grant permissions
GRANT ALL ON public.combo_reservations TO authenticated;
GRANT ALL ON public.combo_service_assignments TO authenticated;
GRANT USAGE ON SEQUENCE public.combo_reservations_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.combo_service_assignments_id_seq TO authenticated;
