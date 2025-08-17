-- Add RLS policies to allow guest users to view booking-related data

-- Allow guests to view employee schedules (needed for time slot generation)
CREATE POLICY "Guests can view employee schedules for booking" 
ON public.employee_schedules 
FOR SELECT 
USING (is_available = true);

-- Allow guests to view blocked times (needed for time slot generation)  
CREATE POLICY "Guests can view blocked times for booking"
ON public.blocked_times
FOR SELECT
USING (true);

-- Allow guests to view public discounts (already has a similar policy but let's make it clearer)
DROP POLICY IF EXISTS "Authenticated users can view active public discounts" ON public.discounts;

CREATE POLICY "Anyone can view active public discounts"
ON public.discounts
FOR SELECT
USING ((is_active = true) AND (is_public = true) AND (start_date <= now()) AND (end_date >= now()));

-- Also allow guests to view any discount that's active (including non-public ones for combo calculations)
CREATE POLICY "Anyone can view active discounts for booking"
ON public.discounts  
FOR SELECT
USING ((is_active = true) AND (start_date <= now()) AND (end_date >= now()));