import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/types/booking";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

export const TimeSlotGrid = ({ 
  slots, 
  selectedSlot, 
  onSlotSelect, 
  loading = false 
}: TimeSlotGridProps) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        Cargando horarios disponibles...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No hay horarios disponibles para esta fecha.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Prueba seleccionar otra fecha.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {slots.map((slot, index) => (
        <Button
          key={index}
          variant={
            selectedSlot?.start_time === slot.start_time && 
            selectedSlot?.employee_id === slot.employee_id
              ? "default" 
              : "outline"
          }
          onClick={() => onSlotSelect(slot)}
          className="p-3 h-auto flex flex-col"
        >
          <span className="font-medium">{slot.start_time}</span>
          <span className="text-xs text-muted-foreground">
            {slot.employee_name}
          </span>
        </Button>
      ))}
    </div>
  );
}; 