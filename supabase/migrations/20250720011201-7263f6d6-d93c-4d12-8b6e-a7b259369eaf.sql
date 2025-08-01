
-- Create combos table
CREATE TABLE public.combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_price_cents INTEGER NOT NULL,
  original_price_cents INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combo_services junction table
CREATE TABLE public.combo_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(combo_id, service_id)
);

-- Enable RLS on combos table
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for combos
CREATE POLICY "Admins can manage all combos" 
  ON public.combos 
  FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view active combos" 
  ON public.combos 
  FOR SELECT 
  USING (
    is_active = true 
    AND start_date <= now() 
    AND end_date >= now()
  );

-- Enable RLS on combo_services table
ALTER TABLE public.combo_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for combo_services
CREATE POLICY "Admins can manage combo services" 
  ON public.combo_services 
  FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view combo services for active combos" 
  ON public.combo_services 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.combos 
      WHERE combos.id = combo_services.combo_id 
      AND combos.is_active = true 
      AND combos.start_date <= now() 
      AND combos.end_date >= now()
    )
  );

-- Add trigger to update updated_at column for combos
CREATE TRIGGER update_combos_updated_at
  BEFORE UPDATE ON public.combos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
