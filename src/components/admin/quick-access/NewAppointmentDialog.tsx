import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";
import { useServices } from "@/hooks/admin/useServices";
import { useCombos } from "@/hooks/admin/useCombos";
import { useEmployees } from "@/hooks/admin/useEmployees";
import { AppointmentData, QuickAccessDialogProps, Customer } from "./types";

export const NewAppointmentDialog = ({ effectiveProfile }: QuickAccessDialogProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
    notes: "",
    isCombo: false
  });

  const { services, fetchServices } = useServices();
  const { combos, fetchCombos } = useCombos();
  const { employees, fetchEmployees } = useEmployees();

  const handleOpenDialog = () => {
    fetchServices();
    fetchCombos();
    fetchEmployees();
    setShowDialog(true);
  };

  const createNewAppointment = async () => {
    if (!selectedCustomer || !appointmentData.serviceId || !appointmentData.date || !appointmentData.time) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      if (appointmentData.isCombo) {
        // Handle combo appointment - create single combo reservation
        const selectedCombo = combos.find(c => c.id === appointmentData.serviceId);
        if (!selectedCombo) {
          toast({
            title: "Error",
            description: "Combo no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Use the combo's primary employee if no specific employee is selected
        const employeeId = appointmentData.employeeId || selectedCombo.primary_employee_id;
        if (!employeeId) {
          toast({
            title: "Error",
            description: "El combo debe tener un empleado principal asignado",
            variant: "destructive"
          });
          return;
        }

        // Calculate total duration for the combo
        const totalDuration = selectedCombo.combo_services.reduce((total, cs) => {
          const service = services.find(s => s.id === cs.service_id);
          return total + (service?.duration_minutes || 0) * cs.quantity;
        }, 0);

        // Calculate end time
        const startTime = new Date(`2000-01-01T${appointmentData.time}`);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: selectedCustomer.id,
            combo_id: selectedCombo.id,
            primary_employee_id: employeeId,
            appointment_date: appointmentData.date,
            start_time: appointmentData.time,
            end_time: endTimeStr,
            notes: appointmentData.notes,
            status: 'confirmed',
            final_price_cents: selectedCombo.total_price_cents,
            original_price_cents: selectedCombo.original_price_cents,
            savings_cents: selectedCombo.original_price_cents - selectedCombo.total_price_cents,
            is_guest_booking: false,
            customer_email: selectedCustomer.email,
            customer_name: selectedCustomer.full_name,
            created_by_admin: effectiveProfile?.id
          })
          .select()
          .single();

        if (error) throw error;
      } else {
        // Handle individual service appointment
        const selectedService = services.find(s => s.id === appointmentData.serviceId);
        if (!selectedService) {
          toast({
            title: "Error",
            description: "Servicio no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Calculate end time
        const startTime = new Date(`2000-01-01T${appointmentData.time}`);
        const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('reservations')
          .insert({
            client_id: selectedCustomer.id,
            service_id: appointmentData.serviceId,
            employee_id: appointmentData.employeeId || null,
            appointment_date: appointmentData.date,
            start_time: appointmentData.time,
            end_time: endTimeStr,
            notes: appointmentData.notes,
            status: 'confirmed',
            customer_email: selectedCustomer.email,
            customer_name: selectedCustomer.full_name,
            final_price_cents: selectedService.price_cents,
            created_by_admin: effectiveProfile?.id
          })
          .select()
          .single();

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Cita creada exitosamente"
      });

      setShowDialog(false);
      setSelectedCustomer(null);
      setAppointmentData({
        serviceId: "",
        employeeId: "",
        date: "",
        time: "",
        notes: "",
        isCombo: false
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Error al crear la cita",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-20 flex flex-col gap-2"
          onClick={handleOpenDialog}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-sm">Nueva Cita</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="appointment-description">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="appointment-description">
          <div>
            <Label>Cliente</Label>
            <CustomerSelectorModal
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            />
          </div>
          <div>
            <Label>Tipo de Servicio</Label>
            <Select 
              value={appointmentData.isCombo ? "combo" : "service"} 
              onValueChange={(value) => setAppointmentData({
                ...appointmentData, 
                isCombo: value === "combo",
                serviceId: ""
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Servicio Individual</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{appointmentData.isCombo ? "Combo" : "Servicio"}</Label>
            <Select value={appointmentData.serviceId} onValueChange={(value) => setAppointmentData({...appointmentData, serviceId: value})}>
              <SelectTrigger>
                <SelectValue placeholder={appointmentData.isCombo ? "Seleccionar combo" : "Seleccionar servicio"} />
              </SelectTrigger>
              <SelectContent>
                {appointmentData.isCombo ? (
                  combos.map((combo) => (
                    <SelectItem key={combo.id} value={combo.id}>
                      {combo.name} - ₡{Math.round(combo.total_price_cents / 100)}
                    </SelectItem>
                  ))
                ) : (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ₡{Math.round(service.price_cents / 100)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Empleado (opcional)</Label>
            <Select value={appointmentData.employeeId || 'unassigned'} onValueChange={(value) => setAppointmentData({...appointmentData, employeeId: value === 'unassigned' ? '' : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {appointmentData.isCombo && (
              <p className="text-sm text-muted-foreground mt-1">
                Si no seleccionas un empleado, se usará el empleado principal del combo
              </p>
            )}
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={appointmentData.date}
              onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
            />
          </div>
          <div>
            <Label>Hora</Label>
            <Input
              type="time"
              value={appointmentData.time}
              onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
            />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={appointmentData.notes}
              onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
              placeholder="Notas adicionales..."
            />
          </div>
          <Button onClick={createNewAppointment} className="w-full">
            Crear Cita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
