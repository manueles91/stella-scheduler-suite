import { format, addMinutes, parseISO, differenceInMinutes } from "date-fns";

// Re-export format from date-fns for convenience
export { format };

// Time slot configuration
export const HOUR_HEIGHT = 60; // pixels per hour
export const MINUTE_HEIGHT = HOUR_HEIGHT / 60; // pixels per minute

// Generate time slots from 6 AM to 10 PM in 30-minute intervals
export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

// Convert 24-hour format to 12-hour format for display
export const convertTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
};

// Convert 12-hour format back to 24-hour format for database storage
export const convertTo24Hour = (time12: string): string => {
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

// Create 12-hour format time slots for display
export const TIME_SLOTS_12H = TIME_SLOTS.map(time => convertTo12Hour(time));

// Calculate event style for calendar positioning
export const calculateEventStyle = (startTime: string, endTime: string) => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  const duration = differenceInMinutes(end, start);
  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const top = (startHour - 6) * HOUR_HEIGHT + startMinute * MINUTE_HEIGHT;
  const height = duration * MINUTE_HEIGHT;
  
  return {
    position: 'absolute' as const,
    top: `${top}px`,
    height: `${height}px`,
    left: '0px',
    right: '8px',
    zIndex: 10
  };
};

// Get status color for appointments
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'no_show':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status text for appointments
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    case 'completed':
      return 'Completada';
    case 'no_show':
      return 'No asistió';
    default:
      return status;
  }
};

// Format time for database storage (add seconds)
export const formatTimeForDatabase = (timeString: string): string => {
  if (!timeString) return '';
  const time24 = convertTo24Hour(timeString);
  return `${time24}:00`;
};

// Format time for form display (remove seconds)
export const formatTimeForSelect = (timeString: string): string => {
  if (!timeString) return '';
  const time24 = timeString.substring(0, 5); // Remove seconds part
  return convertTo12Hour(time24);
};

// Validate time range
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  const start24 = convertTo24Hour(startTime);
  const end24 = convertTo24Hour(endTime);
  return start24 < end24;
};

// Calculate end time based on start time and duration
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const start24 = convertTo24Hour(startTime);
  const endTime = format(
    addMinutes(parseISO(`2000-01-01T${start24}`), durationMinutes), 
    'HH:mm'
  );
  return convertTo12Hour(endTime);
};
