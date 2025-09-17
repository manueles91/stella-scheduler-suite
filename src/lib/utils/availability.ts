import { supabase } from "@/integrations/supabase/client";
import { parseISO, differenceInMinutes } from "date-fns";

const toMinutes = (time: string) => {
  // Ensure HH:mm (strip seconds if present)
  const [h, m] = time.slice(0,5).split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (startA: string, endA: string, startB: string, endB: string) => {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
};

export const checkEmployeeAvailability = async (
  date: string,
  startTime: string,
  endTime: string,
  employeeId: string
): Promise<{ available: boolean; reason?: string }> => {
  if (!employeeId) return { available: true };

  // Normalize to HH:mm
  const normStart = startTime.slice(0,5);
  const normEnd = endTime.slice(0,5);

  // Fetch reservations, combos, and blocked times for that employee/date
  const [resvRes, comboRes, blockedRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("start_time,end_time,status")
      .eq("appointment_date", date)
      .eq("employee_id", employeeId)
      .neq("status", "cancelled"),
    supabase
      .from("combo_reservations")
      .select("start_time,end_time,status")
      .eq("appointment_date", date)
      .eq("primary_employee_id", employeeId)
      .neq("status", "cancelled"),
    supabase
      .from("blocked_times")
      .select("start_time,end_time")
      .eq("date", date)
      .eq("employee_id", employeeId),
  ]);

  const existing: { start_time: string; end_time: string }[] = [];
  if (resvRes.data) existing.push(...resvRes.data);
  if (comboRes.data) existing.push(...comboRes.data);
  if (blockedRes.data) existing.push(...blockedRes.data);

  const conflict = existing.find(e => overlaps(normStart, normEnd, e.start_time, e.end_time));
  if (conflict) {
    return { available: false, reason: "Conflicto: el empleado ya tiene un evento en ese horario." };
  }
  return { available: true };
};
