-- Create cost_categories table to replace the enum
CREATE TABLE public.cost_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for cost category management
CREATE POLICY "Admins can manage cost categories" 
ON public.cost_categories 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Anyone can view active cost categories" 
ON public.cost_categories 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cost_categories_updated_at
BEFORE UPDATE ON public.cost_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default cost categories
INSERT INTO public.cost_categories (name, description, display_order) VALUES
('Inventario', 'Productos y materiales para servicios', 1),
('Servicios', 'Electricidad, agua, gas, internet', 2),
('Alquiler', 'Renta del local y espacios', 3),
('Suministros', 'Materiales de oficina y limpieza', 4),
('Equipamiento', 'Herramientas y mobiliario', 5),
('Marketing', 'Publicidad y promoción', 6),
('Mantenimiento', 'Reparaciones y mantenimiento', 7),
('Otros', 'Gastos diversos', 8);

-- Add a foreign key to costs table referencing cost_categories
ALTER TABLE public.costs 
ADD COLUMN cost_category_id UUID REFERENCES public.cost_categories(id);

-- Update existing costs to reference the new categories
UPDATE public.costs SET cost_category_id = (
  SELECT id FROM public.cost_categories 
  WHERE LOWER(public.cost_categories.name) = CASE 
    WHEN public.costs.cost_category = 'inventory' THEN 'inventario'
    WHEN public.costs.cost_category = 'utilities' THEN 'servicios'
    WHEN public.costs.cost_category = 'rent' THEN 'alquiler'
    WHEN public.costs.cost_category = 'supplies' THEN 'suministros'
    WHEN public.costs.cost_category = 'equipment' THEN 'equipamiento'
    WHEN public.costs.cost_category = 'marketing' THEN 'marketing'
    WHEN public.costs.cost_category = 'maintenance' THEN 'mantenimiento'
    ELSE 'otros'
  END
);

-- Make the new column not null after migration
ALTER TABLE public.costs ALTER COLUMN cost_category_id SET NOT NULL;

-- Drop the old enum column (we'll keep it for now to avoid breaking existing data)
-- ALTER TABLE public.costs DROP COLUMN cost_category;