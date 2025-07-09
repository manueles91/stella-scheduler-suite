-- Create blocked_times table for time blocking functionality
CREATE TABLE public.blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can view own blocked times" ON public.blocked_times FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Employees can create own blocked times" ON public.blocked_times FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can update own blocked times" ON public.blocked_times FOR UPDATE USING (employee_id = auth.uid());
CREATE POLICY "Employees can delete own blocked times" ON public.blocked_times FOR DELETE USING (employee_id = auth.uid());
CREATE POLICY "Admins can manage all blocked times" ON public.blocked_times FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_blocked_times_updated_at BEFORE UPDATE ON public.blocked_times FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_blocked_times_employee_date ON public.blocked_times(employee_id, date);
CREATE INDEX idx_blocked_times_date_time ON public.blocked_times(date, start_time, end_time);