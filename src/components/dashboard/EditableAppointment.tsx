import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  services?: {
    name: string;
    duration_minutes: number;
  };
  client_profile?: {
    full_name: string;
  };
  employee_profile?: {
    full_name: string;
  };
}

interface EditableAppointmentProps {
  appointment: Appointment;
  onUpdate: () => void;
  canEdit: boolean;
}

export const EditableAppointment = ({ appointment, onUpdate, canEdit }: EditableAppointmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date(appointment.appointment_date),
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    notes: appointment.notes || "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          appointment_date: format(formData.appointment_date, 'yyyy-MM-dd'),
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null,
        })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la cita",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 p-0"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.appointment_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.appointment_date}
                  onSelect={(date) => date && setFormData({ ...formData, appointment_date: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start_time">Hora Inicio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Hora Fin</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Actualizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};