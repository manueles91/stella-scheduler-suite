-- Remove qr_code_token from customer_loyalty_progress table
-- This field is no longer needed since we're implementing automatic loyalty tracking

-- Drop the trigger that generates QR tokens
DROP TRIGGER IF EXISTS trg_generate_loyalty_qr_token ON public.customer_loyalty_progress;

-- Drop the function that generates QR tokens
DROP FUNCTION IF EXISTS public.generate_loyalty_qr_token();

-- Remove the qr_code_token column
ALTER TABLE public.customer_loyalty_progress 
DROP COLUMN IF EXISTS qr_code_token;
