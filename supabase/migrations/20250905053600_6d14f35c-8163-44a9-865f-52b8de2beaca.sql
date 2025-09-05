-- Make qr_code_token optional with auto-generation
ALTER TABLE customer_loyalty_progress 
ALTER COLUMN qr_code_token SET DEFAULT generate_loyalty_qr_token();