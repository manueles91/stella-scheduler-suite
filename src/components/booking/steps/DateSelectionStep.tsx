import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { BookableItem, Employee } from "@/types/booking";
import { useDateAvailability } from "@/hooks/useDateAvailability";
import { useEffect, useState } from "react";

interface DateSelectionStepProps {
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  selectedEmployee?: Employee | null;
  onDateSelect: (date: Date | undefined) => void;
  onBack: () => void;
}

export const DateSelectionStep = ({
  selectedService,
  selectedDate,
  selectedEmployee,
  onDateSelect,
  onBack,
}: DateSelectionStepProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const { 
    loading, 
    preloadAvailabilityForMonth, 
    isDateUnavailable 
  } = useDateAvailability({ 
    selectedService, 
    selectedEmployee 
  });

  // Preload availability when component mounts or service changes
  useEffect(() => {
    if (selectedService) {
      const currentDate = selectedDate || new Date();
      preloadAvailabilityForMonth(currentDate.getFullYear(), currentDate.getMonth());
      setCurrentMonth(currentDate);
    }
  }, [selectedService, selectedEmployee, preloadAvailabilityForMonth]);

  // Handle month navigation in calendar
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    if (selectedService) {
      preloadAvailabilityForMonth(month.getFullYear(), month.getMonth());
    }
  };

  // Trigger availability fetch when currentMonth changes
  useEffect(() => {
    if (selectedService && currentMonth) {
      preloadAvailabilityForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    }
  }, [currentMonth, selectedService, preloadAvailabilityForMonth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona una fecha</CardTitle>
        <CardDescription>
          Elige la fecha para tu {selectedService?.type === 'combo' ? 'combo' : 'servicio'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          onMonthChange={handleMonthChange}
          disabled={(date) => {
            const today = startOfDay(new Date());
            const selectedDate = startOfDay(date);
            
            // Disable past dates and Sundays
            if (selectedDate < today || date.getDay() === 0) {
              return true;
            }
            
            // Disable dates with no available time slots
            return isDateUnavailable(date);
          }}
          className="rounded-md border"
          locale={es}
        />
        
        {loading && (
          <div className="text-center text-sm text-muted-foreground">
            Cargando disponibilidad...
          </div>
        )}
        
        <div className="flex justify-start pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};