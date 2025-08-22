import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(5, "Mínimo 5 minutos").max(24 * 60, "Máximo 1440 minutos"),
  price_cents: z.number().nonnegative(),
  category_id: z.string().optional(),
  variable_price: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const discountFormSchema = z.object({
  service_id: z.string().min(1, "Selecciona un servicio"),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "flat"]),
  discount_value: z.number().positive("Debe ser mayor a 0"),
  start_date: z.string().min(1, "Fecha de inicio requerida"),
  end_date: z.string().min(1, "Fecha de fin requerida"),
  is_public: z.boolean(),
  discount_code: z.string().optional(),
  is_active: z.boolean(),
});

export const comboFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  start_date: z.string().min(1, "Fecha de inicio requerida"),
  end_date: z.string().min(1, "Fecha de fin requerida"),
  is_active: z.boolean(),
  pricing_type: z.enum(["percentage", "fixed"]),
  discount_percentage: z.string().optional(),
  fixed_price: z.string().optional(),
  primary_employee_id: z.string().min(1, "El empleado principal es requerido"),
  services: z.array(z.object({ service_id: z.string(), quantity: z.number().int().positive() })).min(1, "Agrega al menos un servicio"),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;
export type DiscountFormData = z.infer<typeof discountFormSchema>;
export type ComboFormData = z.infer<typeof comboFormSchema>;


