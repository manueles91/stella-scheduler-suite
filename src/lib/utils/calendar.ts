import { BookableItem, TimeSlot } from "@/types/booking";

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export const formatDateForCalendar = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: event.title,
    dates: `${formatDateForCalendar(event.startDate)}/${formatDateForCalendar(event.endDate)}`,
    details: event.description,
    location: event.location || '',
  });
  return `${baseUrl}&${params.toString()}`;
};

export const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const params = new URLSearchParams({
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    location: event.location || '',
  });
  return `${baseUrl}?${params.toString()}`;
};

export const generateICSFile = (event: CalendarEvent): string => {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salon//Event//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@salon.com`,
    `DTSTAMP:${formatDateForCalendar(new Date())}`,
    `DTSTART:${formatDateForCalendar(event.startDate)}`,
    `DTEND:${formatDateForCalendar(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  
  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};

export const createBookingCalendarEvent = (
  service: BookableItem,
  date: Date,
  timeSlot: TimeSlot,
  employeeName?: string
): CalendarEvent => {
  const startTime = timeSlot.start_time;
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const startDate = new Date(date);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(startDate.getMinutes() + service.duration_minutes);
  
  return {
    title: `Cita: ${service.name}`,
    description: [
      `Servicio: ${service.name}`,
      service.description,
      employeeName ? `Profesional: ${employeeName}` : '',
      `Duración: ${service.duration_minutes} minutos`,
      `Precio: €${(service.final_price_cents / 100).toFixed(2)}`,
    ].filter(Boolean).join('\n'),
    startDate,
    endDate,
    location: 'Stella Studio', // You might want to make this configurable
  };
};