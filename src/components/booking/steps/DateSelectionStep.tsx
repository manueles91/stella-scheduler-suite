import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { BookableItem } from "@/types/booking";

interface DateSelectionStepProps {
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export const DateSelectionStep = ({
  selectedService,
  selectedDate,
  onDateSelect,
}: DateSelectionStepProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona una fecha</CardTitle>
        <CardDescription>
          Elige la fecha para tu {selectedService?.type === 'combo' ? 'combo' : 'servicio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={(date) => {
            const today = startOfDay(new Date());
            const selectedDate = startOfDay(date);
            return selectedDate < today || date.getDay() === 0; // Disable Sundays
          }}
          className="rounded-md border"
          locale={es}
        />
      </CardContent>
    </Card>
  );
};