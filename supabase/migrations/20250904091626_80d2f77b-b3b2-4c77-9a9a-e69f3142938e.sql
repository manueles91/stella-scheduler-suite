-- Remove foreign key constraints that prevent guest users from being assigned to reservations
-- This allows client_id to reference either profiles.id OR invited_users.id

-- Drop the foreign key constraint on reservations.client_id
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_client_id_fkey;

-- Drop the foreign key constraint on combo_reservations.client_id if it exists
ALTER TABLE combo_reservations 
DROP CONSTRAINT IF EXISTS combo_reservations_client_id_fkey;

-- Add comments to clarify the new behavior
COMMENT ON COLUMN reservations.client_id IS 'References either profiles.id (for authenticated users) or invited_users.id (for guest users)';
COMMENT ON COLUMN combo_reservations.client_id IS 'References either profiles.id (for authenticated users) or invited_users.id (for guest users)';