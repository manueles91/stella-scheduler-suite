-- Create combo_reservations table
CREATE TABLE public.combo_reservations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id),
    guest_user_id UUID REFERENCES invited_users(id),
    combo_id UUID NOT NULL REFERENCES combos(id),
    primary_employee_id UUID NOT NULL REFERENCES profiles(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show', 'in_progress')),
    notes TEXT,
    final_price_cents INTEGER NOT NULL,
    original_price_cents INTEGER NOT NULL,
    savings_cents INTEGER NOT NULL DEFAULT 0,
    is_guest_booking BOOLEAN NOT NULL DEFAULT false,
    customer_email TEXT,
    customer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_customer CHECK (
        (client_id IS NOT NULL AND guest_user_id IS NULL AND NOT is_guest_booking) OR
        (client_id IS NULL AND guest_user_id IS NOT NULL AND is_guest_booking) OR
        (client_id IS NULL AND guest_user_id IS NULL AND is_guest_booking AND customer_email IS NOT NULL AND customer_name IS NOT NULL)
    )
);

-- Create combo_service_assignments table
CREATE TABLE public.combo_service_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    combo_reservation_id UUID NOT NULL REFERENCES combo_reservations(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_employee_id UUID REFERENCES profiles(id),
    estimated_start_time TIME,
    estimated_duration INTEGER NOT NULL,
    actual_start_time TIME,
    actual_end_time TIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.combo_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_service_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for combo_reservations
CREATE POLICY "Admins can manage all combo reservations" 
ON public.combo_reservations 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view own combo reservations" 
ON public.combo_reservations 
FOR SELECT 
USING (
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid()) OR
    (get_user_role(auth.uid()) = 'admin'::user_role) OR
    (is_guest_booking = true)
);

CREATE POLICY "Allow combo reservation creation" 
ON public.combo_reservations 
FOR INSERT 
WITH CHECK (
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    (get_user_role(auth.uid()) = 'admin'::user_role) OR
    (is_guest_booking = true)
);

CREATE POLICY "Users can update own combo reservations" 
ON public.combo_reservations 
FOR UPDATE 
USING (
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid()) OR
    (get_user_role(auth.uid()) = 'admin'::user_role)
);

-- RLS Policies for combo_service_assignments
CREATE POLICY "Admins can manage all combo service assignments" 
ON public.combo_service_assignments 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view combo service assignments" 
ON public.combo_service_assignments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM combo_reservations cr 
        WHERE cr.id = combo_service_assignments.combo_reservation_id 
        AND (
            (auth.uid() IS NOT NULL AND cr.client_id = auth.uid()) OR
            (auth.uid() IS NOT NULL AND cr.primary_employee_id = auth.uid()) OR
            (auth.uid() IS NOT NULL AND combo_service_assignments.assigned_employee_id = auth.uid()) OR
            (get_user_role(auth.uid()) = 'admin'::user_role) OR
            (cr.is_guest_booking = true)
        )
    )
);

CREATE POLICY "Allow combo service assignment updates" 
ON public.combo_service_assignments 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM combo_reservations cr 
        WHERE cr.id = combo_service_assignments.combo_reservation_id 
        AND (
            (auth.uid() IS NOT NULL AND cr.primary_employee_id = auth.uid()) OR
            (auth.uid() IS NOT NULL AND combo_service_assignments.assigned_employee_id = auth.uid()) OR
            (get_user_role(auth.uid()) = 'admin'::user_role)
        )
    )
);

-- Trigger to auto-create service assignments when combo reservation is created
CREATE OR REPLACE FUNCTION create_combo_service_assignments()
RETURNS TRIGGER AS $$
DECLARE
    combo_service RECORD;
BEGIN
    -- Create service assignments for each service in the combo
    FOR combo_service IN 
        SELECT cs.service_id, cs.quantity, s.duration_minutes
        FROM combo_services cs
        JOIN services s ON s.id = cs.service_id
        WHERE cs.combo_id = NEW.combo_id
    LOOP
        -- Create assignment for each quantity of the service
        FOR i IN 1..combo_service.quantity LOOP
            INSERT INTO combo_service_assignments (
                combo_reservation_id,
                service_id,
                assigned_employee_id,
                estimated_duration,
                estimated_start_time
            ) VALUES (
                NEW.id,
                combo_service.service_id,
                NEW.primary_employee_id, -- Auto-assign primary employee initially
                combo_service.duration_minutes,
                NEW.start_time -- Initial estimate, can be adjusted later
            );
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_combo_service_assignments
    AFTER INSERT ON combo_reservations
    FOR EACH ROW
    EXECUTE FUNCTION create_combo_service_assignments();

-- Function to update combo reservation end time based on service assignments
CREATE OR REPLACE FUNCTION update_combo_end_time()
RETURNS TRIGGER AS $$
DECLARE
    total_duration INTEGER;
BEGIN
    -- Calculate total duration of all service assignments
    SELECT COALESCE(SUM(estimated_duration), 0)
    INTO total_duration
    FROM combo_service_assignments
    WHERE combo_reservation_id = COALESCE(NEW.combo_reservation_id, OLD.combo_reservation_id);
    
    -- Update combo reservation end time
    UPDATE combo_reservations
    SET end_time = (start_time + (total_duration || ' minutes')::INTERVAL)::TIME,
        updated_at = now()
    WHERE id = COALESCE(NEW.combo_reservation_id, OLD.combo_reservation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for service assignment changes
CREATE TRIGGER trigger_update_combo_end_time
    AFTER INSERT OR UPDATE OR DELETE ON combo_service_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_combo_end_time();

-- Create indexes for better performance
CREATE INDEX idx_combo_reservations_appointment_date ON combo_reservations(appointment_date);
CREATE INDEX idx_combo_reservations_client_id ON combo_reservations(client_id);
CREATE INDEX idx_combo_reservations_primary_employee_id ON combo_reservations(primary_employee_id);
CREATE INDEX idx_combo_service_assignments_combo_reservation_id ON combo_service_assignments(combo_reservation_id);
CREATE INDEX idx_combo_service_assignments_assigned_employee_id ON combo_service_assignments(assigned_employee_id);