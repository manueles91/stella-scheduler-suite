-- 1) Add variable pricing flag to services and final price to reservations
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS variable_price boolean NOT NULL DEFAULT false;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS final_price_cents integer;

-- 2) Validation trigger: when marking a reservation as completed, require final price if service is variable-price
CREATE OR REPLACE FUNCTION public.validate_final_price_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_variable boolean;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT variable_price INTO is_variable FROM public.services WHERE id = NEW.service_id;
    IF is_variable AND (NEW.final_price_cents IS NULL OR NEW.final_price_cents < 0) THEN
      RAISE EXCEPTION 'final_price_cents is required and must be >= 0 for variable price services when marking as completed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_final_price_on_complete ON public.reservations;
CREATE TRIGGER trg_validate_final_price_on_complete
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.validate_final_price_on_complete();