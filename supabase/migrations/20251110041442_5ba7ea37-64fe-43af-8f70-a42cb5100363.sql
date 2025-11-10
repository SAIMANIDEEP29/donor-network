-- Add blood_bank role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'blood_bank';

-- Create blood_banks table
CREATE TABLE IF NOT EXISTS public.blood_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  license_number TEXT,
  established_year INTEGER,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blood_inventory table
CREATE TABLE IF NOT EXISTS public.blood_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blood_bank_id UUID NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
  blood_group blood_group_type NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blood_bank_id, blood_group)
);

-- Enable RLS
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blood_banks
CREATE POLICY "Anyone can view verified blood banks"
  ON public.blood_banks
  FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Blood banks can view own details"
  ON public.blood_banks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Blood banks can update own details"
  ON public.blood_banks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create blood bank"
  ON public.blood_banks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all blood banks"
  ON public.blood_banks
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blood banks"
  ON public.blood_banks
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for blood_inventory
CREATE POLICY "Anyone can view blood inventory"
  ON public.blood_inventory
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blood_banks
      WHERE id = blood_inventory.blood_bank_id
      AND is_verified = true
    )
  );

CREATE POLICY "Blood banks can manage own inventory"
  ON public.blood_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.blood_banks
      WHERE id = blood_inventory.blood_bank_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blood_banks
      WHERE id = blood_inventory.blood_bank_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all inventory"
  ON public.blood_inventory
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger to update blood_banks updated_at
CREATE OR REPLACE FUNCTION update_blood_bank_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blood_banks_updated_at
  BEFORE UPDATE ON public.blood_banks
  FOR EACH ROW
  EXECUTE FUNCTION update_blood_bank_updated_at();

-- Trigger to update blood_inventory last_updated
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blood_inventory_timestamp
  BEFORE UPDATE ON public.blood_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_timestamp();

-- Function to notify blood banks of new requests
CREATE OR REPLACE FUNCTION notify_blood_banks_on_new_request()
RETURNS TRIGGER AS $$
DECLARE
  blood_bank_record RECORD;
BEGIN
  -- Notify all verified blood banks in the same district
  FOR blood_bank_record IN 
    SELECT user_id, name 
    FROM public.blood_banks 
    WHERE is_verified = true 
    AND is_active = true
    AND district = NEW.district
  LOOP
    INSERT INTO public.notifications (user_id, type, message, request_id)
    VALUES (
      blood_bank_record.user_id,
      'new_request',
      'New blood request for ' || NEW.blood_group || ' in ' || NEW.district,
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_blood_banks_trigger
  AFTER INSERT ON public.blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_blood_banks_on_new_request();