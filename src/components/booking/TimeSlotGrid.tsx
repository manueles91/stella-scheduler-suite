import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TimeSlot } from "@/types/booking";
import { formatTime12Hour } from "@/lib/utils";

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

  // Group slots by employee
  const groupedSlots = slots.reduce((groups, slot) => {
    const key = slot.employee_id;
    if (!groups[key]) {
      groups[key] = {
        employee_name: slot.employee_name,
        employee_id: slot.employee_id,
        slots: []
      };
    }
    groups[key].slots.push(slot);
    return groups;
  }, {} as Record<string, { employee_name: string; employee_id: string; slots: TimeSlot[] }>);

  return (
    <div className="space-y-6">
      {Object.values(groupedSlots).map((group) => (
        <div key={group.employee_id} className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://eygyyswmlsqyvfdbmwfw.supabase.co/storage/v1/object/public/service-images/profiles/${group.employee_id}`} />
              <AvatarFallback className="text-xs">
                {group.employee_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-medium text-lg">{group.employee_name}</h3>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {group.slots.map((slot, index) => (
              <Button
                key={index}
                variant={
                  selectedSlot?.start_time === slot.start_time && 
                  selectedSlot?.employee_id === slot.employee_id
                    ? "default" 
                    : "outline"
                }
                onClick={() => onSlotSelect(slot)}
                className="p-2 h-10 text-sm font-medium"
              >
                {formatTime12Hour(slot.start_time)}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 