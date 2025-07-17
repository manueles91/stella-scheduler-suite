-- Add foreign key constraint from discounts to services
ALTER TABLE public.discounts 
ADD CONSTRAINT fk_discounts_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;