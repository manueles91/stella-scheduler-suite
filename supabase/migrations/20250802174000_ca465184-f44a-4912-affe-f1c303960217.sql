-- Create invited_users table for admin-created users who haven't authenticated yet
CREATE TABLE public.invited_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  account_status TEXT NOT NULL DEFAULT 'invited',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage invited users"
ON public.invited_users
FOR ALL
USING (get_user_role(auth.uid()) = 'admin');

-- Create function to handle user claiming their invited profile
CREATE OR REPLACE FUNCTION public.claim_invited_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invited_user_record public.invited_users%ROWTYPE;
BEGIN
  -- Check if there's an invited user with this email
  SELECT * INTO invited_user_record
  FROM public.invited_users
  WHERE email = NEW.email AND claimed_at IS NULL;
  
  IF FOUND THEN
    -- Update the invited user as claimed
    UPDATE public.invited_users
    SET claimed_at = now(), claimed_by = NEW.id
    WHERE id = invited_user_record.id;
    
    -- Update the new profile with the invited user's data
    NEW.full_name = invited_user_record.full_name;
    NEW.phone = invited_user_record.phone;
    NEW.role = invited_user_record.role;
    NEW.account_status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically claim invited profiles when user signs up
CREATE TRIGGER on_profile_created_claim_invited
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_invited_profile();