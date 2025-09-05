-- Make qr_code_token nullable so it can be omitted in insert operations
ALTER TABLE customer_loyalty_progress 
ALTER COLUMN qr_code_token DROP NOT NULL;