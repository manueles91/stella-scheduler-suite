import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CustomerInfoProps {
  selectedService: any;
  selectedEmployee: any;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CustomerInfo = ({
  selectedService,
  selectedEmployee,
  selectedDate,
  selectedTime,
  notes,
  onNotesChange,
  onNext,
  onBack
}: CustomerInfoProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Confirma tu reserva</h2>
        <p className="text-muted-foreground">Revisa los detalles y agrega comentarios si deseas</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de tu cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedService?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedService?.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedEmployee ? selectedEmployee.full_name : "Cualquier estilista"}
                  </p>
                  <p className="text-sm text-muted-foreground">Profesional asignado</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Badge variant="secondary">
                    {selectedService?.duration_minutes} minutos
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Duración del servicio</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold text-primary">
                ₡{selectedService ? Math.round(selectedService.price_cents / 100) : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comentarios adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">¿Algo especial que debamos saber?</Label>
            <Textarea
              id="notes"
              placeholder="Escribe aquí cualquier comentario o solicitud especial..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Opcional: alergias, preferencias de productos, ocasión especial, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onNext} size="lg">
          Continuar al registro
        </Button>
      </div>
    </div>
  );
};