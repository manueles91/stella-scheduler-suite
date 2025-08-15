-- Task 3: Generate dummy data for testing

-- First, create some dummy employees/staff
INSERT INTO public.invited_users (email, full_name, phone, role, invited_by, claimed_at, claimed_by, account_status)
SELECT 
  email,
  full_name,
  phone,
  role::user_role,
  admin_id,
  now(),
  gen_random_uuid(),
  'active'
FROM (
  VALUES 
    ('sofia.rodriguez@salon.cr', 'Sofía Rodríguez', '+506 8888-1234', 'employee'),
    ('carla.mendez@salon.cr', 'Carla Méndez', '+506 8888-5678', 'employee')
) AS v(email, full_name, phone, role)
CROSS JOIN (SELECT id as admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1) admin;

-- Add the employees to profiles
INSERT INTO public.profiles (id, email, full_name, phone, role, account_status)
SELECT 
  gen_random_uuid(),
  email,
  full_name,
  phone,
  role::user_role,
  'active'
FROM (
  VALUES 
    ('sofia.rodriguez@salon.cr', 'Sofía Rodríguez', '+506 8888-1234', 'employee'),
    ('carla.mendez@salon.cr', 'Carla Méndez', '+506 8888-5678', 'employee')
) AS v(email, full_name, phone, role);

-- Assign services to employees
INSERT INTO public.employee_services (employee_id, service_id)
SELECT 
  p.id as employee_id,
  s.id as service_id
FROM public.profiles p
CROSS JOIN public.services s
WHERE p.role = 'employee'
  AND p.email IN ('sofia.rodriguez@salon.cr', 'carla.mendez@salon.cr')
  AND s.name IN (
    'Manicura Regular', 'Manicura Spa', 'Esmaltado en Gel', 'Pedicura Regular',
    'Limpieza Facial Básica Relajante', 'Limpieza Facial Premium', 
    'Pestañas Naturales', 'Diseño de Cejas', 'Masaje Relajante Espalda'
  );

-- Create dummy clients
INSERT INTO public.profiles (id, email, full_name, phone, role, account_status)
VALUES 
  (gen_random_uuid(), 'maria.gonzalez@email.com', 'María González', '+506 7777-1111', 'client', 'active'),
  (gen_random_uuid(), 'ana.lopez@email.com', 'Ana López', '+506 7777-2222', 'client', 'active'),
  (gen_random_uuid(), 'carmen.jimenez@email.com', 'Carmen Jiménez', '+506 7777-3333', 'client', 'active'),
  (gen_random_uuid(), 'laura.morales@email.com', 'Laura Morales', '+506 7777-4444', 'client', 'active'),
  (gen_random_uuid(), 'patricia.vargas@email.com', 'Patricia Vargas', '+506 7777-5555', 'client', 'active'),
  (gen_random_uuid(), 'valeria.castro@email.com', 'Valeria Castro', '+506 7777-6666', 'client', 'active'),
  (gen_random_uuid(), 'gabriela.rojas@email.com', 'Gabriela Rojas', '+506 7777-7777', 'client', 'active'),
  (gen_random_uuid(), 'monica.herrera@email.com', 'Mónica Herrera', '+506 7777-8888', 'client', 'active');

-- Generate reservations for Jul-Sep (2 per week = ~24 total)
INSERT INTO public.reservations (
  client_id, 
  employee_id, 
  service_id, 
  appointment_date, 
  start_time, 
  end_time, 
  status, 
  final_price_cents,
  notes
)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'client' ORDER BY random() LIMIT 1),
  (SELECT id FROM public.profiles WHERE role = 'employee' ORDER BY random() LIMIT 1),
  (SELECT id FROM public.services ORDER BY random() LIMIT 1),
  dates.appointment_date,
  times.start_time::time,
  (times.start_time::time + (duration_minutes::text || ' minutes')::interval)::time,
  CASE WHEN dates.appointment_date < current_date THEN 'completed' ELSE 'confirmed' END,
  CASE 
    WHEN variable_price THEN (price_cents + (random() * 2000)::integer)
    ELSE price_cents 
  END,
  'Cita generada automáticamente para pruebas'
FROM (
  SELECT 
    date_trunc('day', generate_series(
      '2024-07-01'::date, 
      '2024-09-30'::date, 
      '3 days'::interval
    )) + interval '1 day' * floor(random() * 6) as appointment_date
  LIMIT 30
) dates
CROSS JOIN (
  VALUES 
    ('09:00:00'), ('10:30:00'), ('14:00:00'), ('15:30:00')
) times(start_time)
CROSS JOIN (
  SELECT s.id, s.duration_minutes, s.price_cents, s.variable_price
  FROM public.services s
  ORDER BY random()
  LIMIT 1
) service_info
LIMIT 30;

-- Generate cost categories if they don't exist
INSERT INTO public.cost_categories (name, description, is_active)
VALUES 
  ('Productos y Suministros', 'Costos de productos de belleza y suministros', true),
  ('Mantenimiento', 'Gastos de mantenimiento del salón', true),
  ('Marketing', 'Gastos de publicidad y marketing', true),
  ('Servicios Públicos', 'Electricidad, agua, internet', true),
  ('Alquiler', 'Costo del alquiler del local', true),
  ('Seguros', 'Seguros del negocio', true),
  ('Capacitación', 'Cursos y capacitación del personal', true)
ON CONFLICT (name) DO NOTHING;

-- Generate variable costs (5 per month for Jul-Sep = 15 total)
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
  description,
  amount,
  'variable'::cost_type,
  'product'::cost_category,
  cc.id,
  cost_dates.cost_date,
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
FROM (
  VALUES 
    ('Productos de Manicura', 'Compra de esmaltes y suministros', 45000, '2024-07-05'),
    ('Cremas Faciales', 'Reposición de cremas para tratamientos', 78000, '2024-07-15'),
    ('Equipos de Limpieza', 'Productos de limpieza del salón', 25000, '2024-07-25'),
    ('Tintes para Cabello', 'Compra de tintes profesionales', 120000, '2024-08-02'),
    ('Aceites para Masajes', 'Aceites aromáticos para masajes', 35000, '2024-08-12'),
    ('Extensiones de Pestañas', 'Material para extensiones', 95000, '2024-08-22'),
    ('Herramientas de Cejas', 'Pinzas y herramientas especializadas', 18000, '2024-09-03'),
    ('Productos Capilares', 'Champús y acondicionadores', 67000, '2024-09-13'),
    ('Material de Pedicura', 'Limas y productos para pedicura', 32000, '2024-09-23'),
    ('Toallas y Textiles', 'Reposición de toallas del salón', 28000, '2024-07-08'),
    ('Desinfectantes', 'Productos de desinfección', 15000, '2024-08-05'),
    ('Papel y Suministros', 'Material de oficina y recepción', 12000, '2024-09-10'),
    ('Bolsas y Empaques', 'Material para empacar productos', 8000, '2024-07-20'),
    ('Guantes Desechables', 'Guantes para tratamientos', 22000, '2024-08-28'),
    ('Algodón y Gasas', 'Suministros para tratamientos', 19000, '2024-09-18')
) AS v(cost_name, description, amount, cost_date)
CROSS JOIN public.cost_categories cc
WHERE cc.name = 'Productos y Suministros'
CROSS JOIN (
  SELECT v.cost_date::date as cost_date
) cost_dates;

-- Generate recurrent costs (2 per month for Jul-Sep = 6 total)  
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
  description,
  amount,
  'recurring'::cost_type,
  'service'::cost_category,
  cc.id,
  cost_dates.cost_date,
  cost_dates.cost_date + interval '1 month',
  30, -- every 30 days
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
FROM (
  VALUES 
    ('Alquiler del Local', 'Pago mensual del alquiler', 350000, '2024-07-01'),
    ('Internet y Telefonía', 'Servicios de comunicación', 45000, '2024-07-01'),
    ('Electricidad', 'Consumo eléctrico mensual', 85000, '2024-08-01'),
    ('Agua', 'Consumo de agua mensual', 25000, '2024-08-01'),
    ('Seguro del Negocio', 'Prima mensual del seguro', 65000, '2024-09-01'),
    ('Software de Gestión', 'Licencia de software mensual', 28000, '2024-09-01')
) AS v(cost_name, description, amount, cost_date)
CROSS JOIN public.cost_categories cc
WHERE cc.name = 'Alquiler'
CROSS JOIN (
  SELECT v.cost_date::date as cost_date
) cost_dates;