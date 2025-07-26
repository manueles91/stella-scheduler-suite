-- Add customer information and guest booking support to reservations
ALTER TABLE public.reservations 
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_name TEXT,
ADD COLUMN registration_token TEXT UNIQUE,
ADD COLUMN is_guest_booking BOOLEAN DEFAULT false,
ADD COLUMN created_by_admin UUID REFERENCES public.profiles(id);

-- Add account status to profiles for managing guest vs registered users
ALTER TABLE public.profiles 
ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('pending_registration', 'active', 'guest'));

-- Create index on registration_token for faster lookups
CREATE INDEX idx_reservations_registration_token ON public.reservations(registration_token);

-- Create index on customer_email for admin customer search
CREATE INDEX idx_reservations_customer_email ON public.reservations(customer_email);

-- Update RLS policies for guest bookings
CREATE POLICY "Anyone can create guest reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (is_guest_booking = true AND customer_email IS NOT NULL);

CREATE POLICY "Anyone can view guest reservations with registration token" 
ON public.reservations 
FOR SELECT 
USING (registration_token IS NOT NULL);

-- Function to generate secure registration tokens
CREATE OR REPLACE FUNCTION generate_registration_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set registration token for guest bookings
CREATE OR REPLACE FUNCTION set_guest_booking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_guest_booking = true AND NEW.registration_token IS NULL THEN
    NEW.registration_token = generate_registration_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate registration tokens
CREATE TRIGGER trigger_set_guest_booking_token
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_guest_booking_token();