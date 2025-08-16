import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookableItem, Employee, TimeSlot } from "@/types/booking";
import { Calendar, Clock, User, Mail, MessageSquare, Phone } from "lucide-react";

interface GuestCustomerInfoProps {
  selectedService: BookableItem | null;
  selectedEmployee: Employee | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes: string;
  onCustomerNameChange: (name: string) => void;
  onCustomerEmailChange: (email: string) => void;
  onCustomerPhoneChange?: (phone: string) => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export const GuestCustomerInfo = ({
  selectedService,
  selectedEmployee,
  selectedDate,
  selectedSlot,
  customerName,
  customerEmail,
  customerPhone,
  notes,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  onNotesChange,
  onBack,
  onConfirm,
  submitting
}: GuestCustomerInfoProps) => {
  const canConfirm = customerName.trim() && customerEmail.trim() && customerEmail.includes('@') && customerPhone?.trim();

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen de tu Cita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Servicio</Label>
              <p className="font-medium">{selectedService?.name}</p>
              <p className="text-sm text-muted-foreground">
                {Math.floor(selectedService?.duration_minutes || 0)} min • €{((selectedService?.final_price_cents || 0) / 100).toFixed(2)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Fecha y Hora</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{selectedDate?.toLocaleDateString('es-ES')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{selectedSlot?.start_time}</span>
              </div>
            </div>
            
            {selectedEmployee && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Profesional</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedEmployee.full_name}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
          <CardDescription>
            Necesitamos estos datos para confirmar tu cita y enviarte la confirmación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Nombre Completo *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => onCustomerEmailChange(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recibirás la confirmación y podrás registrarte para gestionar tus citas
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="customerPhone">Teléfono *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone || ''}
                onChange={(e) => onCustomerPhoneChange?.(e.target.value)}
                placeholder="+34 600 000 000"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Te contactaremos para confirmar tu cita si es necesario
            </p>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Alguna solicitud especial o información adicional..."
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="sm:w-auto"
        >
          Volver
        </Button>
        
        <Button
          onClick={onConfirm}
          disabled={!canConfirm || submitting}
          className="sm:flex-1"
        >
          {submitting ? "Confirmando..." : "Confirmar Cita"}
        </Button>
      </div>
      
      {!canConfirm && (customerName.trim() || customerEmail.trim()) && (
        <p className="text-sm text-amber-600 text-center">
          Por favor completa todos los campos obligatorios
        </p>
      )}
    </div>
  );
};