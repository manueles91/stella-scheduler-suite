import { z } from "zod";

// Appointment form validation schema
export const appointmentFormSchema = z.object({
  client_id: z.string().min(1, "Selecciona un cliente"),
  service_id: z.string().min(1, "Selecciona un servicio"),
  date: z.string().min(1, "La fecha es requerida"),
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  end_time: z.string().min(1, "La hora de fin es requerida"),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate that start_time is before end_time
  const startTime = data.start_time;
  const endTime = data.end_time;
  
  // Convert 12-hour format to 24-hour for comparison
  const convertTo24Hour = (time12: string) => {
    const [time, ampm] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    
    if (ampm === 'AM' && hour === 12) {
      hour = 0;
    } else if (ampm === 'PM' && hour !== 12) {
      hour += 12;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  const start24 = convertTo24Hour(startTime);
  const end24 = convertTo24Hour(endTime);
  
  return start24 < end24;
}, {
  message: "La hora de inicio debe ser anterior a la hora de fin",
  path: ["end_time"]
});

// Blocked time form validation schema
export const blockedTimeFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  end_time: z.string().min(1, "La hora de fin es requerida"),
  reason: z.string().min(1, "El motivo es requerido"),
  is_recurring: z.boolean().default(false),
}).refine((data) => {
  // Validate that start_time is before end_time
  const startTime = data.start_time;
  const endTime = data.end_time;
  
  // Convert 12-hour format to 24-hour for comparison
  const convertTo24Hour = (time12: string) => {
    const [time, ampm] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    
    if (ampm === 'AM' && hour === 12) {
      hour = 0;
    } else if (ampm === 'PM' && hour !== 12) {
      hour += 12;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  const start24 = convertTo24Hour(startTime);
  const end24 = convertTo24Hour(endTime);
  
  return start24 < end24;
}, {
  message: "La hora de inicio debe ser anterior a la hora de fin",
  path: ["end_time"]
});

// Type exports
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type BlockedTimeFormData = z.infer<typeof blockedTimeFormSchema>;
