-- Fix employee schedules table constraints and ensure data integrity
-- This migration addresses issues with time tracking availability

-- Add constraint to ensure start_time is before end_time
ALTER TABLE public.employee_schedules 
ADD CONSTRAINT check_time_order 
CHECK (start_time < end_time);

-- Add constraint to prevent duplicate schedules for same employee and day
ALTER TABLE public.employee_schedules 
ADD CONSTRAINT unique_employee_day_schedule 
UNIQUE (employee_id, day_of_week);

-- Add missing updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_schedules' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.employee_schedules 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_employee_schedules_updated_at 
        BEFORE UPDATE ON public.employee_schedules 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_day 
ON public.employee_schedules(employee_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_employee_schedules_availability 
ON public.employee_schedules(is_available) WHERE is_available = true;

-- Drop existing policies if they exist and recreate them properly
DROP POLICY IF EXISTS "Employees can create own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Employees can update own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Employees can delete own schedules" ON public.employee_schedules;

-- Create comprehensive RLS policies
CREATE POLICY "Employees can create own schedules" 
ON public.employee_schedules 
FOR INSERT 
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own schedules" 
ON public.employee_schedules 
FOR UPDATE 
TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can delete own schedules" 
ON public.employee_schedules 
FOR DELETE 
TO authenticated
USING (employee_id = auth.uid());

-- Create function to validate schedule times
CREATE OR REPLACE FUNCTION validate_schedule_times()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure start_time is before end_time
    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'Start time must be before end time';
    END IF;
    
    -- Ensure reasonable working hours (6 AM to 11 PM)
    IF NEW.start_time < '06:00'::time OR NEW.end_time > '23:00'::time THEN
        RAISE EXCEPTION 'Working hours must be between 6:00 AM and 11:00 PM';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate schedule times
DROP TRIGGER IF EXISTS validate_schedule_times_trigger ON public.employee_schedules;
CREATE TRIGGER validate_schedule_times_trigger
    BEFORE INSERT OR UPDATE ON public.employee_schedules
    FOR EACH ROW
    EXECUTE FUNCTION validate_schedule_times();

-- Clean up any existing invalid data (optional - uncomment if needed)
-- DELETE FROM public.employee_schedules WHERE start_time >= end_time;