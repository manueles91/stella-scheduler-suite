import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function generateCalendarUrl(
  title: string, 
  startDateTime: Date, 
  endDateTime: Date, 
  description?: string, 
  location?: string
): string {
  const formatDate = (date: Date) => 
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startDateTime)}/${formatDate(endDateTime)}`,
    details: description || '',
    location: location || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
