-- Fix security vulnerability: Restrict discount access to authenticated users only
-- Remove policies that allow "anyone" (including unauthenticated users) to view discount data

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view active discounts with valid code" ON public.discounts;
DROP POLICY IF EXISTS "Anyone can view active public discounts" ON public.discounts;

-- Create new restricted policies that require authentication
CREATE POLICY "Authenticated users can view active public discounts" 
ON public.discounts 
FOR SELECT 
TO authenticated
USING ((is_active = true) AND (is_public = true) AND (start_date <= now()) AND (end_date >= now()));

CREATE POLICY "Authenticated users can view active discounts with valid code" 
ON public.discounts 
FOR SELECT 
TO authenticated
USING ((is_active = true) AND (start_date <= now()) AND (end_date >= now()));

-- Create a secure public view that only exposes safe promotional information
-- This allows public display of basic promo info without exposing pricing details
CREATE OR REPLACE VIEW public.public_promotions AS
SELECT 
  d.id,
  d.name,
  d.description,
  s.name as service_name,
  -- Only show that a discount exists, not the actual amount/percentage
  CASE 
    WHEN d.discount_type = 'percentage' THEN 'Descuento disponible'
    WHEN d.discount_type = 'flat' THEN 'Precio especial'
    ELSE 'Promoción activa'
  END as promotion_text,
  d.start_date,
  d.end_date
FROM public.discounts d
JOIN public.services s ON d.service_id = s.id
WHERE d.is_active = true 
  AND d.is_public = true 
  AND d.start_date <= now() 
  AND d.end_date >= now()
  AND s.is_active = true;

-- Allow public read access to the safe promotional view
GRANT SELECT ON public.public_promotions TO anon, authenticated;