import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday, startOfWeek, addDays, subDays, isSameDay } from "date-fns";
import { CalendarViewProps } from "@/types/time-tracking";
import { Appointment } from "@/types/appointment";
import { BlockedTime } from "@/types/time-tracking";
import { HOUR_HEIGHT, MINUTE_HEIGHT, convertTo12Hour, calculateEventStyle } from "@/lib/utils/timeTrackingUtils";

export const CalendarView = ({
  selectedDate,
  onDateChange,
  appointments,
  blockedTimes,
  showBlockedTimes,
  onTimeSlotClick,
  onAppointmentClick,
  onBlockedTimeClick,
  onNavigateDate,
  onTodayClick
}: CalendarViewProps) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  // Update week days when selected date changes
  React.useEffect(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    setWeekDays(days);
  }, [selectedDate]);

  const renderTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(
        <div key={hour} className="relative border-b border-gray-200" style={{ height: `${HOUR_HEIGHT}px` }}>
          <div className="absolute left-0 top-0 w-16 h-full flex items-start justify-end pr-2 pt-1">
            <span className="text-xs text-gray-500 font-medium">
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </span>
          </div>
          <div className="ml-16 h-full bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200"></div>
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 hover:bg-blue-50" 
              onClick={() => onTimeSlotClick(`${hour.toString().padStart(2, '0')}:00`)}
            ></div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-1/2 hover:bg-blue-50" 
              onClick={() => onTimeSlotClick(`${hour.toString().padStart(2, '0')}:30`)}
            ></div>
          </div>
        </div>
      );
    }
    return slots;
  };

  const renderCalendarAppointments = () => {
    return appointments.map(appointment => (
      <div
        key={appointment.id}
        className={`${appointment.isCombo ? 'bg-purple-500' : 'bg-blue-500'} text-white rounded-lg p-2 shadow-sm cursor-pointer hover:opacity-90 transition-colors`}
        style={calculateEventStyle(appointment.start_time, appointment.end_time)}
        onClick={() => onAppointmentClick(appointment)}
      >
        <div className="text-sm font-medium truncate flex items-center gap-1">
          {appointment.isCombo && (
            <span className="text-xs bg-white/20 px-1 rounded">COMBO</span>
          )}
          {appointment.client_profile?.full_name}
        </div>
        <div className="text-xs opacity-90 truncate">
          {appointment.isCombo ? `${appointment.comboName} (Combo)` : appointment.services?.[0]?.name}
        </div>
        <div className="text-xs opacity-75">{convertTo12Hour(appointment.start_time)} - {convertTo12Hour(appointment.end_time)}</div>
      </div>
    ));
  };

  const renderCalendarBlockedTimes = () => {
    return blockedTimes.map(blocked => (
      <div
        key={blocked.id}
        className="bg-red-500 text-white rounded-lg p-2 shadow-sm cursor-pointer hover:bg-red-600 transition-colors"
        style={calculateEventStyle(blocked.start_time, blocked.end_time)}
        onClick={() => onBlockedTimeClick(blocked)}
      >
        <div className="text-sm font-medium truncate">Bloqueado</div>
        <div className="text-xs opacity-90 truncate">{blocked.reason}</div>
        <div className="text-xs opacity-75">{convertTo12Hour(blocked.start_time)} - {convertTo12Hour(blocked.end_time)}</div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with date navigation */}
      <div className="bg-white shadow-sm border-b px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="outline" size="sm" onClick={() => onNavigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg font-semibold cursor-pointer hover:text-primary transition-colors truncate">
                    {(() => {
                      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()];
                      const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedDate.getMonth()];
                      return `${dayName}, ${selectedDate.getDate()} ${monthName}, ${selectedDate.getFullYear()}`;
                    })()}
                    {isToday(selectedDate) && <Badge className="ml-2 hidden sm:inline-flex">Hoy</Badge>}
                  </h1>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onDateChange(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={onTodayClick} variant="outline" size="sm" className="flex-shrink-0">
            Hoy
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex gap-1">
          {weekDays.map(day => (
            <Button
              key={day.toISOString()}
              variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
              size="sm"
              onClick={() => onDateChange(day)}
              className="flex-1 flex flex-col items-center py-2 h-auto"
            >
              <span className="text-xs font-medium">{format(day, 'EEE')}</span>
              <span className="text-lg font-bold">{format(day, 'd')}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar view */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="relative" style={{ height: `${17 * HOUR_HEIGHT}px` }}>
            {renderTimeSlots()}
            {renderCalendarAppointments()}
            {showBlockedTimes && renderCalendarBlockedTimes()}
          </div>
        </div>
      </div>
    </div>
  );
};
