-- Migration to consolidate guest_user_id into client_id for better consistency

-- First, update existing reservations to move guest_user_id to client_id
UPDATE reservations 
SET client_id = guest_user_id 
WHERE guest_user_id IS NOT NULL AND client_id IS NULL;

-- Update existing combo_reservations to move guest_user_id to client_id  
UPDATE combo_reservations 
SET client_id = guest_user_id 
WHERE guest_user_id IS NOT NULL AND client_id IS NULL;

-- Now we can safely drop the guest_user_id columns since all data is consolidated
-- But first let's add a constraint to ensure client_id is always present
ALTER TABLE reservations 
ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE combo_reservations 
ALTER COLUMN client_id SET NOT NULL;

-- Drop the guest_user_id columns
ALTER TABLE reservations 
DROP COLUMN guest_user_id;

ALTER TABLE combo_reservations 
DROP COLUMN guest_user_id;