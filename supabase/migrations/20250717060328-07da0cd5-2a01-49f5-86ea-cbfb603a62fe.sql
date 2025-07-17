-- Create enum for discount types
CREATE TYPE public.discount_type AS ENUM ('percentage', 'flat');

-- Create discounts table
CREATE TABLE public.discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type public.discount_type NOT NULL,
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  discount_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE public.discounts 
  ADD CONSTRAINT check_percentage_value 
  CHECK (discount_type != 'percentage' OR discount_value <= 100);

ALTER TABLE public.discounts 
  ADD CONSTRAINT check_discount_code 
  CHECK (is_public = true OR discount_code IS NOT NULL);

ALTER TABLE public.discounts 
  ADD CONSTRAINT unique_discount_code 
  UNIQUE (discount_code);

-- Create indexes
CREATE INDEX idx_discounts_service_id ON public.discounts(service_id);
CREATE INDEX idx_discounts_active ON public.discounts(is_active);
CREATE INDEX idx_discounts_dates ON public.discounts(start_date, end_date);
CREATE INDEX idx_discounts_code ON public.discounts(discount_code) WHERE discount_code IS NOT NULL;

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all discounts" 
ON public.discounts 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view active public discounts" 
ON public.discounts 
FOR SELECT 
USING (
  is_active = true 
  AND is_public = true 
  AND start_date <= now() 
  AND end_date >= now()
);

CREATE POLICY "Anyone can view active discounts with valid code" 
ON public.discounts 
FOR SELECT 
USING (
  is_active = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();