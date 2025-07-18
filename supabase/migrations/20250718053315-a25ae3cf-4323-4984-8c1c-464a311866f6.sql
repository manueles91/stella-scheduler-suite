-- Create service categories table
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for service categories
CREATE POLICY "Anyone can view active categories" 
ON public.service_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.service_categories 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add category_id to services table
ALTER TABLE public.services 
ADD COLUMN category_id UUID REFERENCES public.service_categories(id);

-- Insert default categories
INSERT INTO public.service_categories (name, display_order) VALUES
('Manicura', 1),
('Pedicura', 2),
('Pestañas', 3),
('Cejas', 4),
('Faciales', 5),
('Masajes', 6),
('Relajantes', 7),
('Tratamientos', 8);

-- Create trigger for automatic timestamp updates on categories
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();