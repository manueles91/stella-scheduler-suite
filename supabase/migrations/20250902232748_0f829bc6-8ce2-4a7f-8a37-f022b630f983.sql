-- Create loyalty program configuration table
CREATE TABLE public.loyalty_program_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT NOT NULL DEFAULT 'Programa de Lealtad',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create loyalty reward tiers table
CREATE TABLE public.loyalty_reward_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visits_required INTEGER NOT NULL,
  reward_title TEXT NOT NULL,
  reward_description TEXT,
  discount_percentage INTEGER DEFAULT 0,
  is_free_service BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer loyalty progress table
CREATE TABLE public.customer_loyalty_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_visits INTEGER NOT NULL DEFAULT 0,
  qr_code_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Create loyalty visits log table  
CREATE TABLE public.loyalty_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_by_admin_id UUID NOT NULL REFERENCES public.profiles(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty rewards redemptions table
CREATE TABLE public.loyalty_reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_tier_id UUID NOT NULL REFERENCES public.loyalty_reward_tiers(id),
  visits_used INTEGER NOT NULL,
  redeemed_by_admin_id UUID NOT NULL REFERENCES public.profiles(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_program_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty_program_config
CREATE POLICY "Admins can manage loyalty program config" 
ON public.loyalty_program_config 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Anyone can view active loyalty program config" 
ON public.loyalty_program_config 
FOR SELECT 
USING (is_active = true);

-- Create policies for loyalty_reward_tiers
CREATE POLICY "Admins can manage reward tiers" 
ON public.loyalty_reward_tiers 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Anyone can view active reward tiers" 
ON public.loyalty_reward_tiers 
FOR SELECT 
USING (is_active = true);

-- Create policies for customer_loyalty_progress
CREATE POLICY "Admins can manage all loyalty progress" 
ON public.customer_loyalty_progress 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view own loyalty progress" 
ON public.customer_loyalty_progress 
FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can create own loyalty progress" 
ON public.customer_loyalty_progress 
FOR INSERT 
WITH CHECK (customer_id = auth.uid());

-- Create policies for loyalty_visits
CREATE POLICY "Admins can manage all loyalty visits" 
ON public.loyalty_visits 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view own loyalty visits" 
ON public.loyalty_visits 
FOR SELECT 
USING (customer_id = auth.uid());

-- Create policies for loyalty_reward_redemptions
CREATE POLICY "Admins can manage all reward redemptions" 
ON public.loyalty_reward_redemptions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view own reward redemptions" 
ON public.loyalty_reward_redemptions 
FOR SELECT 
USING (customer_id = auth.uid());

-- Create function to generate QR token
CREATE OR REPLACE FUNCTION public.generate_loyalty_qr_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate QR token
CREATE OR REPLACE FUNCTION public.set_loyalty_qr_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code_token IS NULL THEN
    NEW.qr_code_token = public.generate_loyalty_qr_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_loyalty_qr_token_trigger
  BEFORE INSERT ON public.customer_loyalty_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_loyalty_qr_token();

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_loyalty_program_config_updated_at
BEFORE UPDATE ON public.loyalty_program_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_reward_tiers_updated_at
BEFORE UPDATE ON public.loyalty_reward_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_progress_updated_at
BEFORE UPDATE ON public.customer_loyalty_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default loyalty program config
INSERT INTO public.loyalty_program_config (program_name, description) 
VALUES ('Programa de Lealtad', 'Acumula visitas y obtén recompensas increíbles');

-- Insert default reward tiers
INSERT INTO public.loyalty_reward_tiers (visits_required, reward_title, reward_description, discount_percentage, display_order) 
VALUES 
(5, '5% de Descuento', 'Obtén 5% de descuento en tu próximo servicio', 5, 1),
(10, '10% de Descuento', 'Obtén 10% de descuento en tu próximo servicio', 10, 2),
(15, 'Servicio Gratis', 'Un servicio completamente gratis de tu elección', 0, 3);

UPDATE public.loyalty_reward_tiers SET is_free_service = true WHERE visits_required = 15;