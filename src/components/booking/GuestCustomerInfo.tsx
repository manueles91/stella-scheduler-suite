import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CalendarAddButton } from "@/components/ui/calendar-add-button";
import { createBookingCalendarEvent } from "@/lib/utils/calendar";
import { BookableItem, Employee, TimeSlot } from "@/types/booking";
import { Calendar, Clock, User, Mail, MessageSquare, Phone, Sparkles, Package, ArrowLeft, LogIn } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatTime12Hour } from "@/lib/utils";

interface GuestCustomerInfoProps {
  selectedService: BookableItem | null;
  selectedEmployee: Employee | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes: string;
  formatPrice: (cents: number) => string;
  onCustomerNameChange: (name: string) => void;
  onCustomerEmailChange: (email: string) => void;
  onCustomerPhoneChange?: (phone: string) => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  onSignInAndBook?: () => void;
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
  formatPrice,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  onNotesChange,
  onBack,
  onConfirm,
  onSignInAndBook,
  submitting
}: GuestCustomerInfoProps) => {
  const canConfirm = customerName.trim() && customerEmail.trim() && customerEmail.includes('@') && customerPhone?.trim();

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
    <div className="space-y-6">
      {/* Enhanced Booking Summary - matching ConfirmationStep design */}
      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle>Confirma tu reserva</CardTitle>
            <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    {selectedService.variable_price ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        Precio variable
                      </Badge>
                    ) : (
                      formatPrice(selectedService.final_price_cents)
                    )}
                  </span>
                  {!selectedService.variable_price && selectedService.savings_cents > 0 && (
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

            {/* Calendar Add Button */}
            {calendarEvent && (
              <div className="flex justify-center">
                <CalendarAddButton event={calendarEvent} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sign In Option */}
      {onSignInAndBook && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                  ¿Ya tienes cuenta?
                </h3>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Inicia sesión para confirmar tu reserva automáticamente y gestionar tus citas
              </p>
              <Button
                onClick={onSignInAndBook}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/40"
                disabled={submitting}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar sesión y confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <div className="flex items-center gap-4 mb-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">o continúa como invitado</span>
          <Separator className="flex-1" />
        </div>
      </div>

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
                placeholder="88887777 o +506 88887777"
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
          onClick={onConfirm}
          disabled={!canConfirm || submitting}
          className="sm:flex-1"
        >
          {submitting ? "Confirmando..." : "Confirmar Cita"}
        </Button>
        
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
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