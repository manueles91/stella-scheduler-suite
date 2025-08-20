import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TimeSlotGrid } from "../TimeSlotGrid";
import { TimeSlot, BookableItem } from "@/types/booking";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TimeSlotSelectionStepProps {
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  availableSlots: TimeSlot[];
  slotsLoading: boolean;
  onSlotSelect: (slot: TimeSlot) => void;
  onBack: () => void;
}

export const TimeSlotSelectionStep = ({
  selectedService,
  selectedDate,
  selectedSlot,
  availableSlots,
  slotsLoading,
  onSlotSelect,
  onBack,
}: TimeSlotSelectionStepProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Elige tu horario</CardTitle>
        <CardDescription>
          Horarios disponibles para {selectedService?.name} el{" "}
          {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TimeSlotGrid
          slots={availableSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          loading={slotsLoading}
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