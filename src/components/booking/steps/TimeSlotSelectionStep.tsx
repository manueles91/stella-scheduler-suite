import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export const TimeSlotSelectionStep = ({
  selectedService,
  selectedDate,
  selectedSlot,
  availableSlots,
  slotsLoading,
  onSlotSelect,
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
      <CardContent>
        <TimeSlotGrid
          slots={availableSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          loading={slotsLoading}
        />
      </CardContent>
    </Card>
  );
};