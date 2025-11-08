-- Helper function for admin to update user availability
CREATE OR REPLACE FUNCTION public.update_user_availability(_user_id UUID, _is_available BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  UPDATE public.profiles
  SET is_available = _is_available
  WHERE user_id = _user_id;
END;
$$;