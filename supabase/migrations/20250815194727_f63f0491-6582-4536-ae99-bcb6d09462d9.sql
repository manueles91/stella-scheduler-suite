-- Task 3: Generate dummy data for testing (Fixed version)

-- Create dummy employees
INSERT INTO public.profiles (id, email, full_name, phone, role, account_status)
VALUES 
  (gen_random_uuid(), 'sofia.rodriguez@salon.cr', 'Sofía Rodríguez', '+506 8888-1234', 'employee', 'active'),
  (gen_random_uuid(), 'carla.mendez@salon.cr', 'Carla Méndez', '+506 8888-5678', 'employee', 'active');

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

-- Create cost categories
INSERT INTO public.cost_categories (name, description, is_active) VALUES
  ('Productos y Suministros', 'Costos de productos de belleza y suministros', true),
  ('Mantenimiento', 'Gastos de mantenimiento del salón', true),
  ('Marketing', 'Gastos de publicidad y marketing', true),
  ('Servicios Públicos', 'Electricidad, agua, internet', true),
  ('Alquiler', 'Costo del alquiler del local', true)
ON CONFLICT (name) DO NOTHING;

-- Assign services to employees
INSERT INTO public.employee_services (employee_id, service_id)
SELECT 
  p.id, 
  s.id
FROM public.profiles p, public.services s
WHERE p.role = 'employee' 
  AND p.email IN ('sofia.rodriguez@salon.cr', 'carla.mendez@salon.cr')
  AND s.name IN (
    'Manicura Regular', 'Manicura Spa', 'Esmaltado en Gel', 'Pedicura Regular',
    'Limpieza Facial Básica Relajante', 'Limpieza Facial Premium', 
    'Pestañas Naturales', 'Diseño de Cejas', 'Masaje Relajante Espalda'
  );