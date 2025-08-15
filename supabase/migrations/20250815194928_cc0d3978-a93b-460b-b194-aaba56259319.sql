-- Create the missing function first
CREATE OR REPLACE FUNCTION public.generate_registration_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- 32 bytes -> 64 hex chars; robust and simple
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$function$;

-- Now add the dummy data for testing
INSERT INTO public.reservations (
  service_id, 
  appointment_date, 
  start_time, 
  end_time, 
  status,
  final_price_cents,
  notes,
  customer_name,
  customer_email,
  is_guest_booking
) VALUES 
  ((SELECT id FROM public.services WHERE name = 'Manicura Regular' LIMIT 1), '2024-07-15', '10:00', '10:45', 'completed', 2500, 'Cliente satisfecha', 'María González', 'maria.gonzalez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Limpieza Facial Premium' LIMIT 1), '2024-07-18', '14:00', '15:30', 'completed', 5500, 'Excelente tratamiento', 'Ana López', 'ana.lopez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Pestañas Naturales' LIMIT 1), '2024-08-05', '09:00', '11:00', 'completed', 4500, 'Resultado natural', 'Carmen Jiménez', 'carmen.jimenez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Corte Mujer & Blower' LIMIT 1), '2024-08-12', '15:30', '16:30', 'completed', 3800, 'Corte perfecto', 'Laura Morales', 'laura.morales@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Diseño de Cejas' LIMIT 1), '2024-09-03', '10:30', '11:00', 'completed', 2000, 'Diseño impecable', 'Gabriela Rojas', 'gabriela.rojas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Balayage' LIMIT 1), '2024-09-25', '10:00', '12:30', 'confirmed', 8500, 'Cita próxima', 'Elena Vargas', 'elena.vargas@email.com', true);