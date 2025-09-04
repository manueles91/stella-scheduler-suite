-- Fix guest booking issues by updating database views and RLS policies

-- First, update the admin_reservations_view to properly handle guest users
DROP VIEW IF EXISTS admin_reservations_view;

CREATE VIEW admin_reservations_view AS
SELECT 
    r.id,
    r.appointment_date,
    r.start_time,
    r.end_time,
    r.status,
    r.notes,
    r.created_at,
    r.updated_at,
    r.is_guest_booking,
    r.client_id,
    r.employee_id,
    r.service_id,
    r.guest_user_id,
    r.final_price_cents,
    r.customer_email as client_email,
    r.customer_name as client_name,
    
    -- Get client information from profiles or invited_users (for guest users)
    COALESCE(
        p.full_name, 
        iu.full_name, 
        r.customer_name
    ) as client_full_name,
    
    COALESCE(
        p.phone, 
        iu.phone
    ) as client_phone,
    
    -- Employee information
    emp.full_name as employee_full_name,
    
    -- Service information
    s.name as service_name,
    s.price_cents as service_price_cents,
    s.duration_minutes as service_duration,
    
    -- Category information
    sc.id as category_id,
    sc.name as category_name,
    
    'service' as booking_type,
    NULL::uuid as combo_id,
    NULL::text as combo_name

FROM reservations r
LEFT JOIN profiles p ON r.client_id = p.id
LEFT JOIN invited_users iu ON r.guest_user_id = iu.id
LEFT JOIN profiles emp ON r.employee_id = emp.id
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN service_categories sc ON s.category_id = sc.id

UNION ALL

SELECT 
    cr.id,
    cr.appointment_date,
    cr.start_time,
    cr.end_time,
    cr.status,
    cr.notes,
    cr.created_at,
    cr.updated_at,
    cr.is_guest_booking,
    cr.client_id,
    cr.primary_employee_id as employee_id,
    NULL::uuid as service_id,
    cr.guest_user_id,
    cr.final_price_cents,
    cr.customer_email as client_email,
    cr.customer_name as client_name,
    
    -- Get client information from profiles or invited_users (for guest users)
    COALESCE(
        p.full_name, 
        iu.full_name, 
        cr.customer_name
    ) as client_full_name,
    
    COALESCE(
        p.phone, 
        iu.phone
    ) as client_phone,
    
    -- Employee information
    emp.full_name as employee_full_name,
    
    -- Combo information as service information
    c.name as service_name,
    c.total_price_cents as service_price_cents,
    -- Calculate total duration from combo services
    (
        SELECT SUM(cs.quantity * s.duration_minutes)
        FROM combo_services cs
        JOIN services s ON cs.service_id = s.id
        WHERE cs.combo_id = cr.combo_id
    ) as service_duration,
    
    -- Category information - NULL for combos as they span multiple categories
    NULL::uuid as category_id,
    NULL::text as category_name,
    
    'combo' as booking_type,
    cr.combo_id,
    c.name as combo_name

FROM combo_reservations cr
LEFT JOIN profiles p ON cr.client_id = p.id
LEFT JOIN invited_users iu ON cr.guest_user_id = iu.id
LEFT JOIN profiles emp ON cr.primary_employee_id = emp.id
LEFT JOIN combos c ON cr.combo_id = c.id;

-- Update the employee_calendar_view to properly handle guest users
DROP VIEW IF EXISTS employee_calendar_view;

CREATE VIEW employee_calendar_view AS
SELECT 
    r.id,
    r.appointment_date,
    r.start_time,
    r.end_time,
    r.status,
    r.notes,
    r.employee_id,
    r.client_id,
    
    -- Get client information from profiles or invited_users (for guest users)
    COALESCE(
        p.full_name, 
        iu.full_name, 
        r.customer_name
    ) as client_name,
    
    COALESCE(
        p.email, 
        iu.email, 
        r.customer_email
    ) as client_email,
    
    COALESCE(
        p.phone, 
        iu.phone
    ) as client_phone,
    
    -- Service information
    s.name as service_name,
    s.duration_minutes as service_duration,
    
    'service' as booking_type,
    NULL::uuid as combo_id,
    NULL::text as combo_name

FROM reservations r
LEFT JOIN profiles p ON r.client_id = p.id
LEFT JOIN invited_users iu ON r.guest_user_id = iu.id
LEFT JOIN services s ON r.service_id = s.id

UNION ALL

SELECT 
    cr.id,
    cr.appointment_date,
    cr.start_time,
    cr.end_time,
    cr.status,
    cr.notes,
    cr.primary_employee_id as employee_id,
    cr.client_id,
    
    -- Get client information from profiles or invited_users (for guest users)
    COALESCE(
        p.full_name, 
        iu.full_name, 
        cr.customer_name
    ) as client_name,
    
    COALESCE(
        p.email, 
        iu.email, 
        cr.customer_email
    ) as client_email,
    
    COALESCE(
        p.phone, 
        iu.phone
    ) as client_phone,
    
    -- Combo information
    c.name as service_name,
    -- Calculate total duration from combo services
    (
        SELECT SUM(cs.quantity * s.duration_minutes)
        FROM combo_services cs
        JOIN services s ON cs.service_id = s.id
        WHERE cs.combo_id = cr.combo_id
    ) as service_duration,
    
    'combo' as booking_type,
    cr.combo_id,
    c.name as combo_name

FROM combo_reservations cr
LEFT JOIN profiles p ON cr.client_id = p.id
LEFT JOIN invited_users iu ON cr.guest_user_id = iu.id
LEFT JOIN combos c ON cr.combo_id = c.id;