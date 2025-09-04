-- Add created_by_admin column to combo_reservations table
ALTER TABLE public.combo_reservations 
ADD COLUMN created_by_admin uuid REFERENCES auth.users(id);