import { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export interface AppError {
  message: string;
  type: 'validation' | 'database' | 'network' | 'unknown';
  details?: any;
}

export function handleSupabaseError(error: PostgrestError): AppError {
  console.error('Supabase error:', error);
  
  // Handle specific Supabase error codes
  switch (error.code) {
    case '23505': // unique_violation
      if (error.message.includes('email')) {
        return {
          message: "Ya existe un usuario con este email",
          type: 'database',
          details: error
        };
      }
      return {
        message: "Ya existe un registro con estos datos",
        type: 'database',
        details: error
      };
    
    case '23503': // foreign_key_violation
      return {
        message: "Error de referencia en los datos",
        type: 'database',
        details: error
      };
    
    case '42501': // insufficient_privilege
      return {
        message: "No tienes permisos para realizar esta acción",
        type: 'database',
        details: error
      };
    
    case 'PGRST116': // no rows found
      return {
        message: "No se encontró el registro solicitado",
        type: 'database',
        details: error
      };
    
    default:
      return {
        message: error.message || "Error en la base de datos",
        type: 'database',
        details: error
      };
  }
}

export function handleValidationError(error: ZodError): AppError {
  const firstError = error.issues[0];
  return {
    message: firstError?.message || "Error de validación",
    type: 'validation',
    details: error.issues
  };
}

export function handleGenericError(error: unknown): AppError {
  console.error('Unknown error:', error);
  
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown',
      details: error
    };
  }
  
  return {
    message: "Ha ocurrido un error inesperado",
    type: 'unknown',
    details: error
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return handleValidationError(error).message;
  }
  
  if (error && typeof error === 'object' && 'code' in error) {
    return handleSupabaseError(error as PostgrestError).message;
  }
  
  return handleGenericError(error).message;
}