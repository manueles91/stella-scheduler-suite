-- Fix Security Definer View issue
-- The public_promotions view created in the previous migration has SECURITY DEFINER properties
-- which is a security risk as it executes with creator privileges rather than user privileges

-- Drop the problematic view
DROP VIEW IF EXISTS public.public_promotions;

-- Since we've now restricted discount access to authenticated users only,
-- we don't actually need a public view for promotional information anymore
-- The security fix we implemented requires authentication to see any discount details

-- If in the future we need a truly public promotional view, it should be created like this:
-- CREATE VIEW public.safe_promotions AS SELECT ... (without OWNER TO postgres)
-- But for now, the authentication requirement handles the security concern properly