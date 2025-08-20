import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { BookableItem } from "@/types/booking";

interface DateSelectionStepProps {
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onBack: () => void;
}

export const DateSelectionStep = ({
  selectedService,
  selectedDate,
  onDateSelect,
  onBack,
}: DateSelectionStepProps) => {
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
          disabled={(date) => {
            const today = startOfDay(new Date());
            const selectedDate = startOfDay(date);
            return selectedDate < today || date.getDay() === 0; // Disable Sundays
          }}
          className="rounded-md border"
          locale={es}
        />
        
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