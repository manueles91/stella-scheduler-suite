-- Simple dummy data generation that bypasses triggers
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
  is_guest_booking,
  registration_token
) VALUES 
  ((SELECT id FROM public.services WHERE name = 'Manicura Regular' LIMIT 1), '2024-07-15', '10:00', '10:45', 'completed', 2500, 'Cliente satisfecha', 'María González', 'maria.gonzalez@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Limpieza Facial Premium' LIMIT 1), '2024-07-18', '14:00', '15:30', 'completed', 5500, 'Excelente tratamiento', 'Ana López', 'ana.lopez@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Pestañas Naturales' LIMIT 1), '2024-08-05', '09:00', '11:00', 'completed', 4500, 'Resultado natural', 'Carmen Jiménez', 'carmen.jimenez@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Corte Mujer & Blower' LIMIT 1), '2024-08-12', '15:30', '16:30', 'completed', 3800, 'Corte perfecto', 'Laura Morales', 'laura.morales@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Diseño de Cejas' LIMIT 1), '2024-09-03', '10:30', '11:00', 'completed', 2000, 'Diseño impecable', 'Gabriela Rojas', 'gabriela.rojas@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Balayage' LIMIT 1), '2024-09-25', '10:00', '12:30', 'confirmed', 8500, 'Cita próxima', 'Elena Vargas', 'elena.vargas@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Manicura Spa' LIMIT 1), '2024-08-22', '11:00', '12:00', 'completed', 3500, 'Muy relajante', 'Patricia Vargas', 'patricia.vargas@email.com', true, encode(gen_random_bytes(16), 'hex')),
  ((SELECT id FROM public.services WHERE name = 'Tinte' LIMIT 1), '2024-09-10', '14:00', '16:00', 'completed', 6500, 'Color espectacular', 'Mónica Herrera', 'monica.herrera@email.com', true, encode(gen_random_bytes(16), 'hex'));

-- Add some cost categories for testing
INSERT INTO public.cost_categories (name, description, is_active) 
SELECT name_val, desc_val, true 
FROM (VALUES 
  ('Productos', 'Costos de productos de belleza'),
  ('Alquiler', 'Costo del alquiler del local'),
  ('Servicios', 'Servicios públicos y comunicaciones')
) AS v(name_val, desc_val)
WHERE NOT EXISTS (SELECT 1 FROM public.cost_categories WHERE name = v.name_val);