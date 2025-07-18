-- Create junction table for multiple services per appointment
CREATE TABLE public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_services
CREATE POLICY "Users can view appointment services" 
ON public.appointment_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r 
    WHERE r.id = appointment_id 
    AND (
      auth.uid() = r.client_id 
      OR auth.uid() = r.employee_id 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

CREATE POLICY "Users can create appointment services" 
ON public.appointment_services 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations r 
    WHERE r.id = appointment_id 
    AND (
      auth.uid() = r.client_id 
      OR auth.uid() = r.employee_id 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

CREATE POLICY "Users can update appointment services" 
ON public.appointment_services 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r 
    WHERE r.id = appointment_id 
    AND (
      auth.uid() = r.client_id 
      OR auth.uid() = r.employee_id 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

CREATE POLICY "Users can delete appointment services" 
ON public.appointment_services 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r 
    WHERE r.id = appointment_id 
    AND (
      auth.uid() = r.client_id 
      OR auth.uid() = r.employee_id 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- Add foreign key constraints
ALTER TABLE public.appointment_services 
ADD CONSTRAINT fk_appointment_services_appointment_id 
FOREIGN KEY (appointment_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

ALTER TABLE public.appointment_services 
ADD CONSTRAINT fk_appointment_services_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- Migrate existing data: create appointment_services entries for existing reservations
INSERT INTO public.appointment_services (appointment_id, service_id)
SELECT r.id, r.service_id 
FROM public.reservations r 
WHERE r.service_id IS NOT NULL;

-- Add index for better performance
CREATE INDEX idx_appointment_services_appointment_id ON public.appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service_id ON public.appointment_services(service_id);