-- Task 1: Populate categories and services (handle existing data)
-- Update existing categories or insert new ones
INSERT INTO public.service_categories (name, description, display_order, is_active) VALUES
('Manicura y Pedicura', 'Servicios de belleza para manos y pies', 1, true),
('Cabello', 'Servicios de corte, peinado y tratamientos capilares', 2, true),
('Estética Facial', 'Tratamientos faciales y limpieza', 3, true),
('Estética Corporal', 'Masajes y tratamientos corporales', 4, true),
('Pestañas', 'Servicios de extensiones y tratamientos de pestañas', 5, true),
('Cejas', 'Diseño y tratamientos para cejas', 6, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Delete existing services to replace with new ones from image
DELETE FROM public.services;

-- Insert services for Manicura y Pedicura
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true
FROM (
  VALUES 
    ('Manicura Regular', 'Manicura básica con limado y esmaltado', 45, 2500),
    ('Manicura Spa', 'Manicura relajante con tratamiento hidratante', 60, 3500),
    ('Esmaltado en Gel', 'Esmaltado duradero en gel', 30, 2800),
    ('Manicura Luminary', 'Manicura con técnica luminary especializada', 50, 4000),
    ('Gel X Après', 'Extensiones de uñas con gel X', 90, 6000),
    ('Manicura Acrílico', 'Uñas acrílicas profesionales', 75, 5500),
    ('TechGel', 'Técnica TechGel para uñas duraderas', 60, 4500),
    ('Manicura Caballero', 'Manicura especializada para hombres', 40, 2200),
    ('Pedicura Regular', 'Pedicura básica con limado y esmaltado', 60, 3000),
    ('Pedicura Spa', 'Pedicura relajante con exfoliación', 75, 4000),
    ('Pedicura Caballero', 'Pedicura especializada para hombres', 55, 2800)
) AS v(service_name, service_description, duration, price)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Manicura y Pedicura';

-- Insert services for Cabello
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active, variable_price) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true,
  variable
FROM (
  VALUES 
    ('Corte Mujer & Blower', 'Corte y peinado profesional para mujer', 60, 3500, true),
    ('Corte Hombre & Perfilado de Barba', 'Corte masculino con arreglo de barba', 45, 2800, false),
    ('Peinado Básico & Elaborado', 'Peinados para eventos especiales', 90, 4500, true),
    ('Tinte', 'Coloración completa del cabello', 120, 6000, true),
    ('Baño de Color con Tratamiento', 'Tratamiento de color suave', 90, 4000, false),
    ('Balayage', 'Técnica de iluminación balayage', 150, 8500, true),
    ('Highlights', 'Mechas tradicionales', 120, 7000, true),
    ('Botox Capilar', 'Tratamiento reconstructivo capilar', 90, 5500, false),
    ('Tratamientos Capilares', 'Diversos tratamientos para el cabello', 60, 3500, true),
    ('Alisado Orgánico', 'Alisado natural sin químicos agresivos', 180, 12000, true),
    ('Bioplastia', 'Tratamiento de bioplastia capilar', 120, 8000, false),
    ('Spa Capilar', 'Tratamiento spa completo para el cabello', 90, 5000, false)
) AS v(service_name, service_description, duration, price, variable)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Cabello';

-- Insert services for Estética Facial
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true
FROM (
  VALUES 
    ('Limpieza Facial Básica Relajante', 'Limpieza facial suave y relajante', 60, 3000),
    ('Limpieza Facial Básica Hidratante', 'Limpieza con tratamiento hidratante', 60, 3200),
    ('Limpieza Facial Profunda', 'Limpieza profunda con extracción', 75, 4000),
    ('Limpieza Facial Profunda Hidratante', 'Limpieza profunda con hidratación', 75, 4200),
    ('Limpieza Facial Profunda Caballero', 'Limpieza facial especializada para hombres', 60, 3500),
    ('Limpieza Facial Premium', 'Tratamiento facial de lujo', 90, 5500),
    ('Limpieza Facial para Acné', 'Tratamiento especializado para piel con acné', 75, 4500)
) AS v(service_name, service_description, duration, price)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Estética Facial';

-- Insert services for Estética Corporal
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active, variable_price) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true,
  variable
FROM (
  VALUES 
    ('Masaje Relajante Espalda', 'Masaje relajante enfocado en la espalda', 45, 3500, false),
    ('Masaje Piernas Cansadas', 'Masaje terapéutico para piernas', 45, 3500, false),
    ('Masaje Relajante Cuerpo Completo', 'Masaje relajante de cuerpo entero', 90, 6500, true),
    ('Masaje Descontracturante', 'Masaje terapéutico descontracturante', 60, 4500, false),
    ('Masaje Piedras Calientes', 'Terapia con piedras calientes', 75, 5500, false),
    ('Masaje Drenaje Linfático', 'Masaje para drenaje linfático', 60, 4800, false),
    ('Exfoliación Corporal', 'Exfoliación completa del cuerpo', 60, 4000, false)
) AS v(service_name, service_description, duration, price, variable)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Estética Corporal';

-- Insert services for Pestañas
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true
FROM (
  VALUES 
    ('Pestañas Naturales', 'Extensiones de pestañas con look natural', 120, 4500),
    ('Pestañas Glamour', 'Extensiones glamorosas y voluminosas', 150, 5500),
    ('Pestañas Voluminosas', 'Técnica de volumen ruso', 180, 6500),
    ('Volumen Ruso', 'Técnica avanzada de volumen ruso', 180, 7000),
    ('Lifting y Tintura', 'Lifting de pestañas con tintura', 75, 3500)
) AS v(service_name, service_description, duration, price)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Pestañas';

-- Insert services for Cejas
INSERT INTO public.services (name, description, duration_minutes, price_cents, category_id, is_active) 
SELECT 
  service_name,
  service_description,
  duration,
  price,
  sc.id,
  true
FROM (
  VALUES 
    ('Diseño de Cejas', 'Diseño y perfilado profesional de cejas', 30, 2000),
    ('Laminado', 'Laminado de cejas para mayor volumen', 45, 3000),
    ('Henna', 'Tintura con henna natural', 40, 2500),
    ('Tratamiento Nutritivo para Cejas', 'Tratamiento para fortalecer las cejas', 30, 2200)
) AS v(service_name, service_description, duration, price)
CROSS JOIN public.service_categories sc
WHERE sc.name = 'Cejas';

-- Task 2: Extend site_settings table for editable landing page content
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'Salón de Belleza',
ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT 'Dirección del Salón',
ADD COLUMN IF NOT EXISTS business_phone TEXT DEFAULT '+506 1234-5678',
ADD COLUMN IF NOT EXISTS business_email TEXT DEFAULT 'info@salon.com',
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"lunes": "9:00 AM - 6:00 PM", "martes": "9:00 AM - 6:00 PM", "miércoles": "9:00 AM - 6:00 PM", "jueves": "9:00 AM - 6:00 PM", "viernes": "9:00 AM - 6:00 PM", "sábado": "9:00 AM - 4:00 PM", "domingo": "Cerrado"}',
ADD COLUMN IF NOT EXISTS google_maps_link TEXT DEFAULT 'https://maps.google.com',
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Bienvenida a tu Salón de Belleza',
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Descubre la experiencia de belleza más completa con nuestros tratamientos profesionales';

-- Insert default site settings if none exist
INSERT INTO public.site_settings (business_name, business_address, business_phone, business_email, business_hours, google_maps_link, testimonials, hero_title, hero_subtitle, logo_url, landing_background_url)
SELECT 
  'Salón de Belleza Esperanza',
  'San José, Costa Rica, 100 metros norte de la iglesia',
  '+506 2222-3333',
  'info@salonbelleza.cr',
  '{"lunes": "9:00 AM - 6:00 PM", "martes": "9:00 AM - 6:00 PM", "miércoles": "9:00 AM - 6:00 PM", "jueves": "9:00 AM - 6:00 PM", "viernes": "9:00 AM - 6:00 PM", "sábado": "9:00 AM - 4:00 PM", "domingo": "Cerrado"}',
  'https://www.google.com/maps/place/San+José,+Costa+Rica',
  '[
    {
      "id": 1,
      "name": "María Fernández",
      "text": "Increíble servicio! Las chicas son súper profesionales y el salón tiene un ambiente muy acogedor. Mi manicura quedó perfecta.",
      "rating": 5,
      "service": "Manicura en Gel"
    },
    {
      "id": 2,
      "name": "Ana Sofía Morales", 
      "text": "Llevo años viniendo aquí y siempre quedo satisfecha. Los tratamientos faciales son excelentes y me hacen sentir renovada.",
      "rating": 5,
      "service": "Limpieza Facial Premium"
    },
    {
      "id": 3,
      "name": "Carmen Jiménez",
      "text": "El mejor lugar para relajarse! Los masajes son increíbles y el personal es muy atento. Totalmente recomendado.",
      "rating": 5,
      "service": "Masaje Relajante"
    }
  ]',
  'Descubre tu Belleza Natural',
  'Tratamientos profesionales de belleza en un ambiente relajante y acogedor',
  null,
  null
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);