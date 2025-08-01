-- Drop existing trigger if it exists before recreating
DROP TRIGGER IF EXISTS update_blocked_times_updated_at ON blocked_times;

-- Create the trigger to automatically update updated_at in blocked_times
CREATE TRIGGER update_blocked_times_updated_at
BEFORE UPDATE ON blocked_times
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();