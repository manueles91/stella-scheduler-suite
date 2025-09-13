import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { TypePickerDialogProps } from "@/types/time-tracking";

export const TypePickerDialog = ({
  open,
  onOpenChange,
  selectedTimeSlot,
  onAppointmentClick,
  onBlockTimeClick
}: TypePickerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Acción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ¿Qué te gustaría hacer a las {selectedTimeSlot}?
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={onAppointmentClick}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Nueva Cita
            </Button>
            <Button 
              onClick={onBlockTimeClick}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Bloquear Tiempo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
