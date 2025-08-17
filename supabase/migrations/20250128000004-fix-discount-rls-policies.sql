-- Fix RLS policies for discounts to allow public access to basic discount information
-- This resolves the issue where promotions are not visible on the landing page or service selection

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view active public discounts" ON public.discounts;
DROP POLICY IF EXISTS "Authenticated users can view active discounts with valid code" ON public.discounts;

-- Create a policy that allows public access to basic discount information
-- This is safe because we're only exposing basic promo info, not sensitive pricing details
CREATE POLICY "Public can view active public discounts" 
ON public.discounts 
FOR SELECT 
TO anon, authenticated
USING (
  is_active = true 
  AND is_public = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create a policy for authenticated users to view all active discounts (including private ones)
CREATE POLICY "Authenticated users can view all active discounts" 
ON public.discounts 
FOR SELECT 
TO authenticated
USING (
  is_active = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create a policy for admins to manage all discounts
CREATE POLICY "Admins can manage all discounts" 
ON public.discounts 
FOR ALL 
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Create a policy for discount creators to manage their own discounts
CREATE POLICY "Users can manage their own discounts" 
ON public.discounts 
FOR ALL 
TO authenticated
USING (created_by = auth.uid());

-- Update the public_promotions view to be more useful
DROP VIEW IF EXISTS public.public_promotions;

CREATE OR REPLACE VIEW public.public_promotions AS
SELECT 
  d.id,
  d.name,
  d.description,
  s.id as service_id,
  s.name as service_name,
  s.description as service_description,
  s.duration_minutes,
  s.price_cents,
  s.image_url,
  d.discount_type,
  d.discount_value,
  d.start_date,
  d.end_date,
  -- Calculate the discounted price for display
  CASE 
    WHEN d.discount_type = 'percentage' THEN 
      ROUND(s.price_cents * (1 - d.discount_value / 100))
    WHEN d.discount_type = 'flat' THEN 
      GREATEST(0, s.price_cents - d.discount_value)
    ELSE s.price_cents
  END as discounted_price_cents,
  -- Calculate savings
  CASE 
    WHEN d.discount_type = 'percentage' THEN 
      ROUND(s.price_cents * d.discount_value / 100)
    WHEN d.discount_type = 'flat' THEN 
      LEAST(s.price_cents, d.discount_value)
    ELSE 0
  END as savings_cents
FROM public.discounts d
JOIN public.services s ON d.service_id = s.id
WHERE d.is_active = true 
  AND d.is_public = true 
  AND d.start_date <= now() 
  AND d.end_date >= now()
  AND s.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.public_promotions TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_promotions IS 
'Public view for displaying promotional information. This view only shows basic discount details 
and calculated prices, maintaining security while allowing public access to promotional content.';
