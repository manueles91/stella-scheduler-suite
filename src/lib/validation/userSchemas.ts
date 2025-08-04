import { z } from "zod";

export const invitedUserSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, "El nombre solo puede contener letras y espacios"),
  
  email: z.string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .toLowerCase(),
  
  phone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone || phone.trim() === "") return true;
      // Spanish phone number validation (basic)
      const phoneRegex = /^(\+34|0034|34)?[6-9]\d{8}$/;
      return phoneRegex.test(phone.replace(/\s+/g, ""));
    }, "Formato de teléfono inválido"),
  
  role: z.enum(["client", "employee", "admin"])
});

export const guestCustomerSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  
  email: z.string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .toLowerCase(),
  
  phone: z.string().optional()
});

export type InvitedUserData = z.infer<typeof invitedUserSchema>;
export type GuestCustomerData = z.infer<typeof guestCustomerSchema>;