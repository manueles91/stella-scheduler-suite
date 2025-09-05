-- Fix employee schedules constraints and policies
-- Remove existing constraints that may be problematic
ALTER TABLE employee_schedules DROP CONSTRAINT IF EXISTS employee_schedules_day_of_week_check;
ALTER TABLE employee_schedules DROP CONSTRAINT IF EXISTS employee_schedules_time_check;

-- Add proper constraints
ALTER TABLE employee_schedules 
ADD CONSTRAINT employee_schedules_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Add constraint to ensure end_time is after start_time using a trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION validate_employee_schedule_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_schedule_times_trigger ON employee_schedules;

-- Create trigger for time validation
CREATE TRIGGER validate_schedule_times_trigger
  BEFORE INSERT OR UPDATE ON employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION validate_employee_schedule_times();

-- Ensure unique constraint for employee schedule per day
ALTER TABLE employee_schedules DROP CONSTRAINT IF EXISTS employee_schedules_unique_day;
ALTER TABLE employee_schedules 
ADD CONSTRAINT employee_schedules_unique_day 
UNIQUE (employee_id, day_of_week);