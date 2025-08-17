-- Fix RLS policy for invited_users to allow guest booking creation
-- Add policy to allow unauthenticated users to create guest user entries for bookings

CREATE POLICY "Anyone can create guest user entries for bookings"
ON public.invited_users
FOR INSERT
WITH CHECK (is_guest_user = true);