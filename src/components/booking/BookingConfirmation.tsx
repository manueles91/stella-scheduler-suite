import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface BookingConfirmationProps {
  selectedService: any;
  selectedEmployee: any;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  notes: string;
}

export const BookingConfirmation = ({
  selectedService,
  selectedEmployee,
  selectedDate,
  selectedTime,
  notes
}: BookingConfirmationProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">¡Cita confirmada!</h2>
          <p className="text-muted-foreground">
            Tu reserva ha sido confirmada exitosamente. Te hemos enviado un email con los detalles.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalles de tu cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-left">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedService?.description}</p>
                <Badge variant="secondary" className="mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedService?.duration_minutes} min
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">a las {selectedTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {selectedEmployee ? selectedEmployee.full_name : "Estilista asignado automáticamente"}
                </p>
                <p className="text-sm text-muted-foreground">Profesional especializado</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Stella Studio</p>
                <p className="text-sm text-muted-foreground">
                  Av. Central 123, San José<br />
                  Costa Rica, 10101
                </p>
              </div>
            </div>

            {notes && (
              <div className="pt-3 border-t">
                <p className="font-medium mb-1">Comentarios adicionales:</p>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold text-primary">
                  ₡{selectedService ? Math.round(selectedService.price_cents / 100) : 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Importante:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 text-left">
          <li>• Llega 10 minutos antes de tu cita</li>
          <li>• Si necesitas cancelar, hazlo con al menos 24 horas de anticipación</li>
          <li>• Trae una identificación válida</li>
          <li>• Para reprogramar, llama al +506 2222-3333</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">
          Ver mis citas
        </Button>
        <Button variant="outline" onClick={() => navigate('/')} className="w-full">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};