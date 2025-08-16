import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

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
  const slotsByEmployee = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = slot.employee_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const employeeEntries = Object.entries(slotsByEmployee).sort((a, b) => {
    const nameA = a[1][0]?.employee_name || "";
    const nameB = b[1][0]?.employee_name || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-6">
      {employeeEntries.map(([employeeId, employeeSlots]) => {
        const employeeName = employeeSlots[0]?.employee_name || "";
        const avatarUrl = employeeSlots[0]?.employee_avatar_url || "";
        const initials = employeeName.split(' ').map(n => n[0]).join('');
        return (
          <div key={employeeId} className="space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={employeeName} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{employeeName}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {employeeSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start_time === slot.start_time && selectedSlot?.employee_id === slot.employee_id;
                return (
                  <Button
                    key={`${slot.employee_id}-${slot.start_time}-${index}`}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSlotSelect(slot)}
                    className="h-8 px-2 rounded-md text-sm"
                  >
                    {formatTime12Hour(slot.start_time)}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 