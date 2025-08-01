-- Create enum for cost types
CREATE TYPE cost_type AS ENUM ('fixed', 'variable', 'recurring', 'one_time');

-- Create enum for cost categories
CREATE TYPE cost_category AS ENUM ('inventory', 'utilities', 'rent', 'supplies', 'equipment', 'marketing', 'maintenance', 'other');

-- Create costs table
CREATE TABLE public.costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL,
  cost_type cost_type NOT NULL,
  cost_category cost_category NOT NULL,
  recurring_frequency INTEGER, -- days between recurrence (e.g., 30 for monthly, 7 for weekly)
  is_active BOOLEAN NOT NULL DEFAULT true,
  date_incurred DATE NOT NULL,
  next_due_date DATE, -- for recurring costs
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

-- Create policies for cost management
CREATE POLICY "Admins can manage all costs" 
ON public.costs 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_costs_updated_at
BEFORE UPDATE ON public.costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_costs_date_incurred ON public.costs(date_incurred);
CREATE INDEX idx_costs_category ON public.costs(cost_category);
CREATE INDEX idx_costs_type ON public.costs(cost_type);
CREATE INDEX idx_costs_active ON public.costs(is_active);