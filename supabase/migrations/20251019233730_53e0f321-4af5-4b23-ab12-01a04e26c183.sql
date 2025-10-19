-- Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;

-- Add the updated check constraint with 'inactive' included
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_account_status_check 
CHECK (account_status IN ('pending_registration', 'active', 'guest', 'inactive'));