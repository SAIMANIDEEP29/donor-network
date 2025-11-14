-- Add DELETE policies for admin operations

-- Allow admins to delete blood requests
CREATE POLICY "Admins can delete blood requests"
ON public.blood_requests
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete blood banks
CREATE POLICY "Admins can delete blood banks"
ON public.blood_banks
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;