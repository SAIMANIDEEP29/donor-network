-- Create blood group type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE blood_group_type AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
    'A1+', 'A1-', 'A1B+', 'A1B-', 'A2+', 'A2-', 'A2B+', 'A2B-',
    'Bombay'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;