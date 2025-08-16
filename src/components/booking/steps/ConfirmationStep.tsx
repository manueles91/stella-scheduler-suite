import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarAddButton } from "@/components/ui/calendar-add-button";
import { createBookingCalendarEvent } from "@/lib/utils/calendar";
import { formatTime12Hour } from "@/lib/utils";
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
  onConfirm?: () => void;
  isSubmitting?: boolean;
}

export const ConfirmationStep = ({
  selectedService,
  selectedDate,
  selectedSlot,
  selectedEmployee,
  notes,
  formatPrice,
  onNotesChange,
  onConfirm,
  isSubmitting = false,
}: ConfirmationStepProps) => {
  // Create calendar event for the booking
  const calendarEvent = selectedService && selectedDate && selectedSlot 
    ? createBookingCalendarEvent(
        selectedService,
        selectedDate,
        selectedSlot,
        selectedEmployee?.full_name || selectedSlot.employee_name
      )
    : null;

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

        {/* Enhanced Stylist Card */}
        {(selectedEmployee || selectedSlot) && (
          <Card className="border-muted">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage 
                    src={selectedEmployee ? 
                      `https://eygyyswmlsqyvfdbmwfw.supabase.co/storage/v1/object/public/service-images/profiles/${selectedEmployee.id}` :
                      `https://eygyyswmlsqyvfdbmwfw.supabase.co/storage/v1/object/public/service-images/profiles/${selectedSlot?.employee_id}`
                    } 
                  />
                  <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                    {(selectedEmployee?.full_name || selectedSlot?.employee_name || '').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">Tu Estilista</h4>
                  <p className="text-primary font-medium">
                    {selectedEmployee?.full_name || selectedSlot?.employee_name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Profesional certificado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {calendarEvent && (
          <div className="flex justify-center">
            <CalendarAddButton event={calendarEvent} />
          </div>
        )}

        {onConfirm && (
          <div className="flex justify-center pt-4">
            <Button 
              onClick={onConfirm}
              disabled={isSubmitting}
              size="lg"
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Procesando...
                </>
              ) : (
                "Confirmar reserva"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};