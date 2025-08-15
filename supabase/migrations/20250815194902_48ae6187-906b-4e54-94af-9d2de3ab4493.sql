-- Task 3: Generate dummy data for testing (Final version)

-- Generate some dummy reservations for testing (guest bookings work without user constraints)
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
  -- July 2024 reservations
  ((SELECT id FROM public.services WHERE name = 'Manicura Regular' LIMIT 1), '2024-07-15', '10:00', '10:45', 'completed', 2500, 'Cliente satisfecha con el servicio', 'María González', 'maria.gonzalez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Limpieza Facial Premium' LIMIT 1), '2024-07-18', '14:00', '15:30', 'completed', 5500, 'Excelente tratamiento facial', 'Ana López', 'ana.lopez@email.com', true),
  -- August 2024 reservations
  ((SELECT id FROM public.services WHERE name = 'Pestañas Naturales' LIMIT 1), '2024-08-05', '09:00', '11:00', 'completed', 4500, 'Resultado muy natural', 'Carmen Jiménez', 'carmen.jimenez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Corte Mujer & Blower' LIMIT 1), '2024-08-12', '15:30', '16:30', 'completed', 3800, 'Corte y peinado perfecto', 'Laura Morales', 'laura.morales@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Manicura Spa' LIMIT 1), '2024-08-22', '11:00', '12:00', 'completed', 3500, 'Muy relajante', 'Patricia Vargas', 'patricia.vargas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Masaje Relajante Espalda' LIMIT 1), '2024-08-28', '16:00', '16:45', 'completed', 3500, 'Perfecto para el estrés', 'Valeria Castro', 'valeria.castro@email.com', true),
  -- September 2024 reservations
  ((SELECT id FROM public.services WHERE name = 'Diseño de Cejas' LIMIT 1), '2024-09-03', '10:30', '11:00', 'completed', 2000, 'Diseño impecable', 'Gabriela Rojas', 'gabriela.rojas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Tinte' LIMIT 1), '2024-09-10', '14:00', '16:00', 'completed', 6500, 'Color espectacular', 'Mónica Herrera', 'monica.herrera@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Balayage' LIMIT 1), '2024-09-25', '10:00', '12:30', 'confirmed', 8500, 'Cita próxima', 'Elena Vargas', 'elena.vargas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Masaje Relajante Cuerpo Completo' LIMIT 1), '2024-09-28', '15:00', '16:30', 'confirmed', 7200, 'Sesión completa de relajación', 'Isabella Mora', 'isabella.mora@email.com', true),
  -- Additional reservations for better testing
  ((SELECT id FROM public.services WHERE name = 'Esmaltado en Gel' LIMIT 1), '2024-07-22', '11:30', '12:00', 'completed', 2800, 'Duración perfecta', 'Sofía Ramírez', 'sofia.ramirez@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Laminado' LIMIT 1), '2024-08-15', '09:30', '10:15', 'completed', 3000, 'Cejas perfectas', 'Andrea Solano', 'andrea.solano@email.com', true);

-- Generate costs only if we have cost categories and admin users
INSERT INTO public.costs (
  name,
  description,
  amount_cents,
  cost_type,
  cost_category,
  cost_category_id,
  date_incurred,
  created_by
) 
SELECT 
  cost_name,
  cost_description,
  cost_amount,
  'variable'::cost_type,
  'product'::cost_category,
  cc.id,
  cost_date::date,
  admin.id
FROM (
  VALUES 
    ('Productos de Manicura', 'Compra de esmaltes y suministros para julio', 45000, '2024-07-05'),
    ('Cremas Faciales', 'Reposición de cremas para tratamientos faciales', 78000, '2024-07-15'),
    ('Tintes para Cabello', 'Compra de tintes profesionales', 120000, '2024-08-02'),
    ('Aceites para Masajes', 'Aceites aromáticos para masajes corporales', 35000, '2024-08-12'),
    ('Material de Pestañas', 'Extensiones y productos para pestañas', 95000, '2024-09-03')
) AS v(cost_name, cost_description, cost_amount, cost_date)
CROSS JOIN (SELECT id FROM public.cost_categories WHERE name ILIKE '%producto%' LIMIT 1) cc
CROSS JOIN (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) admin
WHERE EXISTS (SELECT 1 FROM public.cost_categories WHERE name ILIKE '%producto%')
  AND EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');

-- Generate recurring costs
INSERT INTO public.costs (
  name,
  description,
  amount_cents,
  cost_type,
  cost_category,
  cost_category_id,
  date_incurred,
  next_due_date,
  recurring_frequency,
  created_by
) 
SELECT 
  cost_name,
  cost_description,
  cost_amount,
  'recurring'::cost_type,
  'service'::cost_category,
  cc.id,
  cost_date::date,
  (cost_date::date + interval '1 month')::date,
  30,
  admin.id
FROM (
  VALUES 
    ('Alquiler del Local', 'Pago mensual del alquiler - Julio', 350000, '2024-07-01'),
    ('Internet y Telefonía', 'Servicios de comunicación - Julio', 45000, '2024-07-05'),
    ('Electricidad', 'Consumo eléctrico mensual - Agosto', 85000, '2024-08-01'),
    ('Mantenimiento Equipos', 'Mantenimiento mensual de equipos - Septiembre', 65000, '2024-09-01')
) AS v(cost_name, cost_description, cost_amount, cost_date)
CROSS JOIN (SELECT id FROM public.cost_categories LIMIT 1) cc
CROSS JOIN (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) admin
WHERE EXISTS (SELECT 1 FROM public.cost_categories)
  AND EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');