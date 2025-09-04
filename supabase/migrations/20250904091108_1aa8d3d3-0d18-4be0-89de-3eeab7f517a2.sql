-- Simplified migration since data will be wiped - no backward compatibility needed

-- Drop guest_user_id columns from both tables
ALTER TABLE reservations 
DROP COLUMN IF EXISTS guest_user_id;

ALTER TABLE combo_reservations 
DROP COLUMN IF EXISTS guest_user_id;

-- Make client_id required on both tables
ALTER TABLE reservations 
ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE combo_reservations 
ALTER COLUMN client_id SET NOT NULL;

-- Update RLS policies to use only client_id
DROP POLICY IF EXISTS "Allow all guest reservation operations" ON reservations;
DROP POLICY IF EXISTS "Users can view own combo reservations" ON combo_reservations;
DROP POLICY IF EXISTS "Allow combo reservation creation" ON combo_reservations;
DROP POLICY IF EXISTS "Users can update own combo reservations" ON combo_reservations;

-- Simplified RLS policies for reservations
CREATE POLICY "Users can manage own reservations" 
ON reservations FOR ALL 
USING (
  client_id = auth.uid() OR 
  employee_id = auth.uid() OR 
  get_user_role(auth.uid()) = 'admin'::user_role
) 
WITH CHECK (
  client_id = auth.uid() OR 
  get_user_role(auth.uid()) = 'admin'::user_role OR
  (is_guest_booking = true AND auth.uid() IS NULL)
);

-- Simplified RLS policies for combo_reservations  
CREATE POLICY "Users can view own combo reservations" 
ON combo_reservations FOR SELECT 
USING (
  client_id = auth.uid() OR 
  primary_employee_id = auth.uid() OR 
  get_user_role(auth.uid()) = 'admin'::user_role OR
  (is_guest_booking = true AND auth.uid() IS NULL)
);

CREATE POLICY "Allow combo reservation creation" 
ON combo_reservations FOR INSERT 
WITH CHECK (
  client_id = auth.uid() OR 
  get_user_role(auth.uid()) = 'admin'::user_role OR
  (is_guest_booking = true AND auth.uid() IS NULL)
);

CREATE POLICY "Users can update own combo reservations" 
ON combo_reservations FOR UPDATE 
USING (
  client_id = auth.uid() OR 
  primary_employee_id = auth.uid() OR 
  get_user_role(auth.uid()) = 'admin'::user_role
);