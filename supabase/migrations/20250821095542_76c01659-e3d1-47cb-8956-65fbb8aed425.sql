-- Add primary_employee_id to combos table
ALTER TABLE combos 
ADD COLUMN primary_employee_id UUID REFERENCES profiles(id);

-- Update RLS policies for combos to include primary employee reference
-- (Existing policies will remain, this just adds the new column)