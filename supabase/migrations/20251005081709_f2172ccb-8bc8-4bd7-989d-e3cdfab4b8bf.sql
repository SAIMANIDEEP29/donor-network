-- Create enums
CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE urgency_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE request_status AS ENUM ('open', 'accepted', 'fulfilled', 'cancelled');
CREATE TYPE acceptance_status AS ENUM ('accepted', 'contacted', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('request_created', 'request_accepted', 'donor_accepted');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  blood_group blood_group_type NOT NULL,
  willing_to_donate BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  last_donation_date TIMESTAMP WITH TIME ZONE,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blood_requests table
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hospital_name TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  illness_condition TEXT NOT NULL,
  urgency_level urgency_level NOT NULL DEFAULT 'medium',
  mobile_number TEXT NOT NULL,
  blood_group blood_group_type NOT NULL,
  status request_status NOT NULL DEFAULT 'open',
  allow_compatible_groups BOOLEAN DEFAULT false,
  compatible_requested_at TIMESTAMP WITH TIME ZONE,
  max_acceptors INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create request_acceptances table
CREATE TABLE public.request_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE NOT NULL,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status acceptance_status NOT NULL DEFAULT 'accepted',
  UNIQUE(request_id, donor_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles (limited data)"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for blood_requests
CREATE POLICY "Anyone can view blood requests"
  ON public.blood_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create requests"
  ON public.blood_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update own requests"
  ON public.blood_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- RLS Policies for request_acceptances
CREATE POLICY "Users can view acceptances for their requests or their acceptances"
  ON public.request_acceptances FOR SELECT
  USING (
    donor_id = auth.uid() OR
    request_id IN (SELECT id FROM public.blood_requests WHERE requester_id = auth.uid())
  );

CREATE POLICY "Donors can create acceptances"
  ON public.request_acceptances FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own acceptances"
  ON public.request_acceptances FOR UPDATE
  USING (auth.uid() = donor_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if donor is eligible
CREATE OR REPLACE FUNCTION is_donor_eligible(donor_profile public.profiles)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if willing to donate and available
  IF NOT donor_profile.willing_to_donate OR NOT donor_profile.is_available THEN
    RETURN false;
  END IF;
  
  -- Check cooldown period (90 days)
  IF donor_profile.last_donation_date IS NOT NULL AND 
     donor_profile.last_donation_date > (now() - INTERVAL '90 days') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get compatible blood groups
CREATE OR REPLACE FUNCTION get_compatible_blood_groups(requested_group blood_group_type)
RETURNS blood_group_type[] AS $$
BEGIN
  RETURN CASE requested_group
    WHEN 'O-' THEN ARRAY['O-']::blood_group_type[]
    WHEN 'O+' THEN ARRAY['O+', 'O-']::blood_group_type[]
    WHEN 'A-' THEN ARRAY['A-', 'O-']::blood_group_type[]
    WHEN 'A+' THEN ARRAY['A+', 'A-', 'O+', 'O-']::blood_group_type[]
    WHEN 'B-' THEN ARRAY['B-', 'O-']::blood_group_type[]
    WHEN 'B+' THEN ARRAY['B+', 'B-', 'O+', 'O-']::blood_group_type[]
    WHEN 'AB-' THEN ARRAY['AB-', 'A-', 'B-', 'O-']::blood_group_type[]
    WHEN 'AB+' THEN ARRAY['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']::blood_group_type[]
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, blood_group, willing_to_donate, city, district, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'blood_group')::blood_group_type, 'O+'::blood_group_type),
    COALESCE((NEW.raw_user_meta_data->>'willing_to_donate')::boolean, false),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();