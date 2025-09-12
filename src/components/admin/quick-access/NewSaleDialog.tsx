import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";
import { trackLoyaltyVisit } from "@/lib/loyaltyTracking";
import { useServices } from "@/hooks/admin/useServices";
import { useCombos } from "@/hooks/admin/useCombos";
import { useEmployees } from "@/hooks/admin/useEmployees";
import { SaleData, QuickAccessDialogProps, Customer } from "./types";

export const NewSaleDialog = ({ effectiveProfile }: QuickAccessDialogProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleData, setSaleData] = useState<SaleData>({
    serviceId: "",
    employeeId: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    chargedPrice: "",
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

  const createNewSale = async () => {
    if (!selectedCustomer || !saleData.serviceId || !saleData.date || !saleData.time || !saleData.chargedPrice) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      if (saleData.isCombo) {
        // Handle combo sale - create single combo reservation
        const selectedCombo = combos.find(c => c.id === saleData.serviceId);
        if (!selectedCombo) {
          toast({
            title: "Error",
            description: "Combo no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Use the combo's primary employee if no specific employee is selected
        const employeeId = saleData.employeeId || selectedCombo.primary_employee_id;
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
        const startTime = new Date(`2000-01-01T${saleData.time}`);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: selectedCustomer.id,
            combo_id: selectedCombo.id,
            primary_employee_id: employeeId,
            appointment_date: saleData.date,
            start_time: saleData.time,
            end_time: endTimeStr,
            notes: saleData.notes,
            status: 'completed',
            final_price_cents: Math.round(parseFloat(saleData.chargedPrice) * 100),
            original_price_cents: selectedCombo.original_price_cents,
            savings_cents: selectedCombo.original_price_cents - Math.round(parseFloat(saleData.chargedPrice) * 100),
            is_guest_booking: false,
            customer_email: selectedCustomer.email,
            customer_name: selectedCustomer.full_name,
            created_by_admin: effectiveProfile?.id
          })
          .select()
          .single();

        if (error) throw error;
      } else {
        // Handle individual service sale
        const selectedService = services.find(s => s.id === saleData.serviceId);
        if (!selectedService) {
          toast({
            title: "Error",
            description: "Servicio no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Calculate end time
        const startTime = new Date(`2000-01-01T${saleData.time}`);
        const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('reservations')
          .insert({
            client_id: selectedCustomer.id,
            service_id: saleData.serviceId,
            employee_id: saleData.employeeId || null,
            appointment_date: saleData.date,
            start_time: saleData.time,
            end_time: endTimeStr,
            notes: saleData.notes,
            status: 'completed',
            customer_email: selectedCustomer.email,
            customer_name: selectedCustomer.full_name,
            final_price_cents: Math.round(parseFloat(saleData.chargedPrice) * 100),
            created_by_admin: effectiveProfile?.id
          })
          .select()
          .single();

        if (error) throw error;
      }

      // Track loyalty visit for completed sale
      if (selectedCustomer.id) {
        const serviceName = saleData.isCombo 
          ? combos.find(c => c.id === saleData.serviceId)?.name || 'Combo'
          : services.find(s => s.id === saleData.serviceId)?.name || 'Servicio';
        
        await trackLoyaltyVisit(
          selectedCustomer.id, 
          effectiveProfile?.id, 
          `Venta registrada: ${serviceName}`
        );
      }

      toast({
        title: "Éxito",
        description: "Venta registrada exitosamente"
      });

      setShowDialog(false);
      setSelectedCustomer(null);
      setSaleData({
        serviceId: "",
        employeeId: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        chargedPrice: "",
        notes: "",
        isCombo: false
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "Error al registrar la venta",
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
          <DollarSign className="h-5 w-5" />
          <span className="text-sm">Registrar Venta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="sale-description">
        <DialogHeader>
          <DialogTitle>Registrar Venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="sale-description">
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
              value={saleData.isCombo ? "combo" : "service"} 
              onValueChange={(value) => setSaleData({
                ...saleData, 
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
            <Label>{saleData.isCombo ? "Combo" : "Servicio"}</Label>
            <Select value={saleData.serviceId} onValueChange={(value) => setSaleData({...saleData, serviceId: value})}>
              <SelectTrigger>
                <SelectValue placeholder={saleData.isCombo ? "Seleccionar combo" : "Seleccionar servicio"} />
              </SelectTrigger>
              <SelectContent>
                {saleData.isCombo ? (
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
            <Select value={saleData.employeeId || 'unassigned'} onValueChange={(value) => setSaleData({...saleData, employeeId: value === 'unassigned' ? '' : value})}>
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
            {saleData.isCombo && (
              <p className="text-sm text-muted-foreground mt-1">
                Si no seleccionas un empleado, se usará el empleado principal del combo
              </p>
            )}
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={saleData.date}
              onChange={(e) => setSaleData({...saleData, date: e.target.value})}
            />
          </div>
          <div>
            <Label>Hora</Label>
            <Input
              type="time"
              value={saleData.time}
              onChange={(e) => setSaleData({...saleData, time: e.target.value})}
            />
          </div>
          <div>
            <Label>Precio Cobrado (₡)</Label>
            <Input
              type="number"
              step="0.01"
              value={saleData.chargedPrice}
              onChange={(e) => setSaleData({...saleData, chargedPrice: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={saleData.notes}
              onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
              placeholder="Notas adicionales..."
            />
          </div>
          <Button onClick={createNewSale} className="w-full">
            Registrar Venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
