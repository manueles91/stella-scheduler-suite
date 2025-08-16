import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { generateCalendarUrl, formatTime12Hour } from "@/lib/utils";
import { Sparkles, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookableItem, TimeSlot, Employee } from "@/types/booking";

interface ConfirmationStepProps {
  selectedService: BookableItem | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  selectedEmployee: Employee | null;
  notes: string;
  formatPrice: (cents: number) => string;
  onNotesChange: (notes: string) => void;
}

export const ConfirmationStep = ({
  selectedService,
  selectedDate,
  selectedSlot,
  selectedEmployee,
  notes,
  formatPrice,
  onNotesChange,
}: ConfirmationStepProps) => {
  const createCalendarEvent = () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedSlot.start_time.split(':');
    startDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + selectedService.duration_minutes);

    const calendarUrl = generateCalendarUrl(
      `Cita: ${selectedService.name}`,
      startDateTime,
      endDateTime,
      `Servicio: ${selectedService.name}\nEstilista: ${selectedSlot.employee_name}${notes ? `\nNotas: ${notes}` : ''}`,
      'Salón de Belleza'
    );

    window.open(calendarUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirma tu reserva</CardTitle>
        <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedService && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {selectedService.type === 'combo' ? (
                  <Package className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedService.name}</h3>
                {selectedService.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedService.description}
                  </p>
                )}
                <div className="mt-2">
                  <Badge variant={selectedService.type === 'combo' ? 'secondary' : 'outline'}>
                    {selectedService.type === 'combo' ? 'Combo' : 'Servicio'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Duración:</span>{" "}
                {selectedService.duration_minutes} minutos
              </div>
              <div>
                <span className="font-medium">Precio:</span>{" "}
                <span className="font-bold text-primary">
                  {formatPrice(selectedService.final_price_cents)}
                </span>
                {selectedService.savings_cents > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    {formatPrice(selectedService.original_price_cents)}
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Fecha:</span>{" "}
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </div>
              <div>
                <span className="font-medium">Hora:</span>{" "}
                {selectedSlot && formatTime12Hour(selectedSlot.start_time)}
              </div>
            </div>

            {(selectedEmployee || selectedSlot) && (
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={selectedEmployee ? 
                      `https://eygyyswmlsqyvfdbmwfw.supabase.co/storage/v1/object/public/service-images/profiles/${selectedEmployee.id}` :
                      `https://eygyyswmlsqyvfdbmwfw.supabase.co/storage/v1/object/public/service-images/profiles/${selectedSlot?.employee_id}`
                    } 
                  />
                  <AvatarFallback className="text-xs">
                    {(selectedEmployee?.full_name || selectedSlot?.employee_name || '').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium text-sm">Estilista:</span>{" "}
                  {selectedEmployee?.full_name || selectedSlot?.employee_name}
                </div>
              </div>
            )}

            {selectedService.savings_cents > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    ¡Ahorro de {formatPrice(selectedService.savings_cents)}!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Comparte cualquier detalle especial sobre tu cita..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={createCalendarEvent}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Agregar a calendario
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};