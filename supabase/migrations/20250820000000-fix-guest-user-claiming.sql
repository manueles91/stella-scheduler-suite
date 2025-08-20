-- Fix guest user claiming process to unify with invited user claiming
-- This migration updates the claim_invited_profile function to handle both account_status types

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS before_insert_claim_invited_profile ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_claim_invited ON public.profiles;
DROP FUNCTION IF EXISTS public.claim_invited_profile();

-- Create the updated claiming function that handles both invited and guest users
CREATE OR REPLACE FUNCTION public.claim_invited_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invited_user_record public.invited_users%ROWTYPE;
  affected_rows integer;
BEGIN
  -- Check if there's an invited user (either 'invited' or 'guest') with this email
  SELECT * INTO invited_user_record
  FROM public.invited_users
  WHERE email = NEW.email 
    AND claimed_at IS NULL
    AND account_status IN ('invited', 'guest');
  
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
    
    -- If this was a guest user, also link all their past guest bookings to the new profile
    IF invited_user_record.account_status = 'guest' THEN
      -- Update all guest reservations to be linked to the new user
      UPDATE public.reservations
      SET client_id = NEW.id,
          is_guest_booking = false,
          guest_user_id = NULL
      WHERE customer_email = NEW.email 
        AND is_guest_booking = true
        AND client_id IS NULL;
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      
      -- Log the linking for debugging
      RAISE NOTICE 'Linked % guest reservations for user %', affected_rows, NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger to automatically claim invited/guest profiles when user signs up
CREATE TRIGGER before_insert_claim_invited_profile
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_invited_profile();

-- Add a comment to document the function's purpose
COMMENT ON FUNCTION public.claim_invited_profile() IS 
'Automatically claims invited or guest user profiles when someone signs up with a matching email. 
Links all past guest bookings to the new authenticated profile.';
