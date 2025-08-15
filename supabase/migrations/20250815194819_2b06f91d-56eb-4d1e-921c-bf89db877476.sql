-- Task 3: Generate dummy data for testing (Simple approach)

-- Create cost categories if they don't exist
INSERT INTO public.cost_categories (name, description, is_active) VALUES
  ('Productos y Suministros', 'Costos de productos de belleza y suministros', true),
  ('Mantenimiento', 'Gastos de mantenimiento del salón', true),
  ('Marketing', 'Gastos de publicidad y marketing', true),
  ('Servicios Públicos', 'Electricidad, agua, internet', true),
  ('Alquiler', 'Costo del alquiler del local', true)
ON CONFLICT (name) DO NOTHING;

-- Generate some dummy reservations for testing
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
  -- September 2024 reservations (some completed, some confirmed)
  ((SELECT id FROM public.services WHERE name = 'Diseño de Cejas' LIMIT 1), '2024-09-03', '10:30', '11:00', 'completed', 2000, 'Diseño impecable', 'Gabriela Rojas', 'gabriela.rojas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Tinte' LIMIT 1), '2024-09-10', '14:00', '16:00', 'completed', 6500, 'Color espectacular', 'Mónica Herrera', 'monica.herrera@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Balayage' LIMIT 1), '2024-09-25', '10:00', '12:30', 'confirmed', 8500, 'Cita próxima', 'Elena Vargas', 'elena.vargas@email.com', true),
  ((SELECT id FROM public.services WHERE name = 'Masaje Relajante Cuerpo Completo' LIMIT 1), '2024-09-28', '15:00', '16:30', 'confirmed', 7200, 'Sesión completa de relajación', 'Isabella Mora', 'isabella.mora@email.com', true);

-- Generate variable costs for testing  
INSERT INTO public.costs (
  name,
  description,
  amount_cents,
  cost_type,
  cost_category,
  cost_category_id,
  date_incurred,
  created_by
) VALUES 
  ('Productos de Manicura', 'Compra de esmaltes y suministros para julio', 45000, 'variable', 'product', (SELECT id FROM public.cost_categories WHERE name = 'Productos y Suministros' LIMIT 1), '2024-07-05', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Cremas Faciales', 'Reposición de cremas para tratamientos faciales', 78000, 'variable', 'product', (SELECT id FROM public.cost_categories WHERE name = 'Productos y Suministros' LIMIT 1), '2024-07-15', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Tintes para Cabello', 'Compra de tintes profesionales', 120000, 'variable', 'product', (SELECT id FROM public.cost_categories WHERE name = 'Productos y Suministros' LIMIT 1), '2024-08-02', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Aceites para Masajes', 'Aceites aromáticos para masajes corporales', 35000, 'variable', 'product', (SELECT id FROM public.cost_categories WHERE name = 'Productos y Suministros' LIMIT 1), '2024-08-12', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Material de Pestañas', 'Extensiones y productos para pestañas', 95000, 'variable', 'product', (SELECT id FROM public.cost_categories WHERE name = 'Productos y Suministros' LIMIT 1), '2024-09-03', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));

-- Generate recurring costs for testing
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
) VALUES 
  ('Alquiler del Local', 'Pago mensual del alquiler - Julio', 350000, 'recurring', 'service', (SELECT id FROM public.cost_categories WHERE name = 'Alquiler' LIMIT 1), '2024-07-01', '2024-08-01', 30, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Internet y Telefonía', 'Servicios de comunicación - Julio', 45000, 'recurring', 'service', (SELECT id FROM public.cost_categories WHERE name = 'Servicios Públicos' LIMIT 1), '2024-07-05', '2024-08-05', 30, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Electricidad', 'Consumo eléctrico mensual - Agosto', 85000, 'recurring', 'service', (SELECT id FROM public.cost_categories WHERE name = 'Servicios Públicos' LIMIT 1), '2024-08-01', '2024-09-01', 30, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
  ('Mantenimiento Equipos', 'Mantenimiento mensual de equipos - Septiembre', 65000, 'recurring', 'service', (SELECT id FROM public.cost_categories WHERE name = 'Mantenimiento' LIMIT 1), '2024-09-01', '2024-10-01', 30, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));