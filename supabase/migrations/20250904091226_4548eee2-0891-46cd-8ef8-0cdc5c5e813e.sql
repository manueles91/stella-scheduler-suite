-- Delete all existing reservation data since starting fresh
DELETE FROM combo_service_assignments;
DELETE FROM combo_reservations;
DELETE FROM reservations;

-- Drop dependent views first
DROP VIEW IF EXISTS admin_reservations_view;
DROP VIEW IF EXISTS employee_calendar_view;

-- Now drop guest_user_id columns from both tables
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

-- Recreate admin_reservations_view without guest_user_id
CREATE VIEW admin_reservations_view AS
SELECT 
  r.id,
  r.client_id,
  r.service_id,
  r.employee_id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  r.final_price_cents,
  r.is_guest_booking,
  r.created_at,
  r.updated_at,
  s.name as service_name,
  s.price_cents as service_price_cents,
  s.duration_minutes as service_duration,
  s.category_id,
  sc.name as category_name,
  COALESCE(p.full_name, iu.full_name) as client_name,
  COALESCE(p.full_name, iu.full_name) as client_full_name,
  COALESCE(p.email, iu.email) as client_email,
  COALESCE(p.phone, iu.phone) as client_phone,
  ep.full_name as employee_full_name,
  'service' as booking_type,
  NULL::uuid as combo_id,
  NULL::text as combo_name
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN service_categories sc ON s.category_id = sc.id  
LEFT JOIN profiles p ON r.client_id = p.id AND r.is_guest_booking = false
LEFT JOIN invited_users iu ON r.client_id = iu.id AND r.is_guest_booking = true
LEFT JOIN profiles ep ON r.employee_id = ep.id

UNION ALL

SELECT 
  cr.id,
  cr.client_id,
  NULL as service_id,
  cr.primary_employee_id as employee_id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  cr.final_price_cents,
  cr.is_guest_booking,
  cr.created_at,
  cr.updated_at,
  NULL as service_name,
  cr.final_price_cents as service_price_cents,
  NULL as service_duration,
  NULL as category_id,
  NULL as category_name,
  COALESCE(p.full_name, iu.full_name) as client_name,
  COALESCE(p.full_name, iu.full_name) as client_full_name,
  COALESCE(p.email, iu.email) as client_email,
  COALESCE(p.phone, iu.phone) as client_phone,
  ep.full_name as employee_full_name,
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name
FROM combo_reservations cr
LEFT JOIN combos c ON cr.combo_id = c.id
LEFT JOIN profiles p ON cr.client_id = p.id AND cr.is_guest_booking = false
LEFT JOIN invited_users iu ON cr.client_id = iu.id AND cr.is_guest_booking = true
LEFT JOIN profiles ep ON cr.primary_employee_id = ep.id;

-- Recreate employee_calendar_view without guest_user_id
CREATE VIEW employee_calendar_view AS
SELECT 
  r.id,
  r.client_id,
  r.employee_id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  s.name as service_name,
  s.duration_minutes as service_duration,
  COALESCE(p.full_name, iu.full_name) as client_name,
  COALESCE(p.email, iu.email) as client_email,
  COALESCE(p.phone, iu.phone) as client_phone,
  'service' as booking_type,
  NULL::uuid as combo_id,
  NULL::text as combo_name
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN profiles p ON r.client_id = p.id AND r.is_guest_booking = false
LEFT JOIN invited_users iu ON r.client_id = iu.id AND r.is_guest_booking = true

UNION ALL

SELECT 
  cr.id,
  cr.client_id,
  cr.primary_employee_id as employee_id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  NULL as service_name,
  NULL as service_duration,
  COALESCE(p.full_name, iu.full_name) as client_name,
  COALESCE(p.email, iu.email) as client_email,
  COALESCE(p.phone, iu.phone) as client_phone,
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name
FROM combo_reservations cr
LEFT JOIN combos c ON cr.combo_id = c.id
LEFT JOIN profiles p ON cr.client_id = p.id AND cr.is_guest_booking = false
LEFT JOIN invited_users iu ON cr.client_id = iu.id AND cr.is_guest_booking = true;