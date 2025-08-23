-- Create feedback table for admin bug reports and feature requests
CREATE TABLE public.admin_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  page_name TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'bug' CHECK (feedback_type IN ('bug', 'feature_request', 'improvement')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in_progress', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all feedback"
ON public.admin_feedback
FOR ALL
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create trigger for updating updated_at
CREATE TRIGGER update_admin_feedback_updated_at
BEFORE UPDATE ON public.admin_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();