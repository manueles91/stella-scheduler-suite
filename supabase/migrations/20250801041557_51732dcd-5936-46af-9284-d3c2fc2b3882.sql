-- Fix employee schedules constraints and policies
-- Add constraint to ensure start_time < end_time
ALTER TABLE employee_schedules 
ADD CONSTRAINT check_time_order 
CHECK (start_time < end_time);

-- Add unique constraint to prevent duplicate schedules for same employee/day
ALTER TABLE employee_schedules 
ADD CONSTRAINT unique_employee_day_schedule 
UNIQUE (employee_id, day_of_week);

-- Fix RLS policies for employee_schedules
DROP POLICY IF EXISTS "Employees can delete own schedules" ON employee_schedules;

CREATE POLICY "Employees can delete own schedules" 
ON employee_schedules 
FOR DELETE 
USING (employee_id = auth.uid());

-- Add constraint to blocked_times to ensure start_time < end_time
ALTER TABLE blocked_times 
ADD CONSTRAINT check_blocked_time_order 
CHECK (start_time < end_time);

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_day 
ON employee_schedules(employee_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_blocked_times_employee_date 
ON blocked_times(employee_id, date);

-- Add trigger to automatically update updated_at in blocked_times
CREATE TRIGGER update_blocked_times_updated_at
BEFORE UPDATE ON blocked_times
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();