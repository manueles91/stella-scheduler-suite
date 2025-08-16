-- Fix reservations table to support guest bookings with user tracking
-- Add guest_user_id to reservations table to link guest bookings to invited_users
ALTER TABLE public.reservations ADD COLUMN guest_user_id uuid REFERENCES public.invited_users(id);

-- Update invited_users table to better support guest users
ALTER TABLE public.invited_users 
  ADD COLUMN is_guest_user boolean DEFAULT false,
  ADD COLUMN last_booking_date timestamp with time zone;