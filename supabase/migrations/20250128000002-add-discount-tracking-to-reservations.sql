-- Add discount tracking to reservations table
ALTER TABLE public.reservations 
ADD COLUMN applied_discount_id UUID REFERENCES public.discounts(id),
ADD COLUMN original_price_cents INTEGER,
ADD COLUMN final_price_cents INTEGER,
ADD COLUMN savings_cents INTEGER;

-- Add index for discount lookups
CREATE INDEX idx_reservations_discount_id ON public.reservations(applied_discount_id);

-- Update existing reservations to have original_price_cents and final_price_cents
-- based on the service price
UPDATE public.reservations 
SET 
  original_price_cents = services.price_cents,
  final_price_cents = services.price_cents,
  savings_cents = 0
FROM public.services 
WHERE reservations.service_id = services.id 
AND reservations.original_price_cents IS NULL;

-- Create a function to calculate combo duration
CREATE OR REPLACE FUNCTION calculate_combo_duration(combo_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_duration INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(s.duration_minutes * cs.quantity), 0)
  INTO total_duration
  FROM combo_services cs
  JOIN services s ON cs.service_id = s.id
  WHERE cs.combo_id = $1;
  
  RETURN total_duration;
END;
$$ LANGUAGE plpgsql;

-- Add a computed column for combo duration (this will be used in the application layer)
-- Note: PostgreSQL doesn't support computed columns directly, so we'll handle this in the application 