import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";
import { TIME_SLOTS, TIME_SLOTS_12H } from "@/lib/utils/timeTrackingUtils";
import { AppointmentDialogProps } from "@/types/time-tracking";
import { Appointment } from "@/types/appointment";
import { format } from "date-fns";

export const AppointmentDialog = ({
  open,
  onOpenChange,
  editMode,
  editingAppointment,
  appointmentForm,
  onAppointmentFormChange,
  onEditingAppointmentChange,
  services,
  clients,
  employees,
  combos = [],
  onSubmit,
  onCancel,
  effectiveProfile,
  showPriceField = false
}: AppointmentDialogProps) => {
  const handleFormChange = (field: keyof typeof appointmentForm, value: string | number | boolean) => {
    onAppointmentFormChange({
      ...appointmentForm,
      [field]: value
    });
  };

  const handleEditingAppointmentChange = (field: keyof Appointment, value: any) => {
    if (editingAppointment) {
      onEditingAppointmentChange({
        ...editingAppointment,
        [field]: value
      });
    }
  };

  const getSelectedService = () => {
    if (appointmentForm.isCombo) {
      return combos.find(c => c.id === appointmentForm.service_id);
    }
    return services.find(s => s.id === appointmentForm.service_id);
  };

  const getServicePrice = () => {
    const selectedService = getSelectedService();
    if (!selectedService) return 0;
    
    if (appointmentForm.isCombo) {
      return selectedService.total_price_cents || 0;
    }
    return selectedService.price_cents || 0;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toTimeString().slice(0, 5);
  };

  const handleServiceChange = (serviceId: string) => {
    handleFormChange('service_id', serviceId);
    
    const selectedService = getSelectedService();
    if (selectedService) {
      let duration = 0;
      let price = 0;
      
      if (appointmentForm.isCombo) {
        duration = selectedService.combo_services?.reduce((total: number, cs: any) => {
          const service = services.find(s => s.id === cs.service_id);
          return total + (service?.duration_minutes || 0) * cs.quantity;
        }, 0) || 0;
        price = selectedService.total_price_cents || 0;
      } else {
        duration = selectedService.duration_minutes || 0;
        price = selectedService.price_cents || 0;
      }

      // Auto-calculate end time if start time is set
      if (appointmentForm.start_time) {
        const endTime = calculateEndTime(appointmentForm.start_time, duration);
        handleFormChange('end_time', endTime);
      }

      // Set default price if not already set
      if (!appointmentForm.final_price_cents) {
        handleFormChange('final_price_cents', price);
      }

      // Update editing appointment if in edit mode
      if (editMode && editingAppointment) {
        handleEditingAppointmentChange('services', [{
          id: selectedService.id,
          name: selectedService.name,
          description: selectedService.description || 'Sin descripción',
          duration_minutes: duration,
          price_cents: price
        }]);
      }
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    handleFormChange('start_time', startTime);
    
    const selectedService = getSelectedService();
    if (selectedService && startTime) {
      let duration = 0;
      
      if (appointmentForm.isCombo) {
        duration = selectedService.combo_services?.reduce((total: number, cs: any) => {
          const service = services.find(s => s.id === cs.service_id);
          return total + (service?.duration_minutes || 0) * cs.quantity;
        }, 0) || 0;
      } else {
        duration = selectedService.duration_minutes || 0;
      }

      const endTime = calculateEndTime(startTime, duration);
      handleFormChange('end_time', endTime);
    }
  };

  const renderServiceTypeSelector = () => (
    <div>
      <Label>Tipo de Servicio</Label>
      <Select 
        value={appointmentForm.isCombo ? "combo" : "service"} 
        onValueChange={(value) => {
          const isCombo = value === "combo";
          handleFormChange('isCombo', isCombo);
          handleFormChange('service_id', '');
          handleFormChange('final_price_cents', 0);
        }}
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
  );

  const renderServiceSelector = () => (
    <div>
      <Label>{appointmentForm.isCombo ? "Combo" : "Servicio"}</Label>
      <Select 
        value={appointmentForm.service_id} 
        onValueChange={handleServiceChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={appointmentForm.isCombo ? "Seleccionar combo" : "Seleccionar servicio"} />
        </SelectTrigger>
        <SelectContent>
          {appointmentForm.isCombo ? (
            combos.map((combo) => (
              <SelectItem key={combo.id} value={combo.id}>
                {combo.name} - ₡{Math.round((combo.total_price_cents || 0) / 100)}
              </SelectItem>
            ))
          ) : (
            services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - ₡{Math.round((service.price_cents || 0) / 100)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );

  const renderPriceField = () => {
    if (!showPriceField) return null;

    const selectedService = getSelectedService();
    const defaultPrice = selectedService ? getServicePrice() : 0;

    return (
      <div>
        <Label>Precio Cobrado (₡)</Label>
        <Input
          type="number"
          step="1"
          value={appointmentForm.final_price_cents !== null && appointmentForm.final_price_cents !== undefined ? Math.round(appointmentForm.final_price_cents / 100) : ''}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
            handleFormChange('final_price_cents', value * 100);
          }}
          placeholder={defaultPrice ? Math.round(defaultPrice / 100).toString() : "0"}
        />
        {selectedService && (
          <p className="text-sm text-muted-foreground mt-1">
            Precio sugerido: ₡{Math.round(defaultPrice / 100)}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Selection */}
          <div>
            <Label>Cliente</Label>
            <CustomerSelectorModal
              value={clients.find(c => c.id === appointmentForm.client_id) || 
                (editingAppointment?.client_profile ? {
                  id: appointmentForm.client_id,
                  full_name: editingAppointment.client_profile.full_name,
                  email: '',
                  role: 'client',
                  account_status: 'active',
                  created_at: new Date().toISOString()
                } : null)}
              onValueChange={(customer) => {
                handleFormChange('client_id', customer?.id || '');
                if (editMode) {
                  handleEditingAppointmentChange('client_id', customer?.id || '');
                  handleEditingAppointmentChange('client_profile', customer ? { full_name: customer.full_name } : undefined);
                }
              }}
            />
          </div>

          {/* Service Type Selection - Only show if not in edit mode or if we have combos */}
          {(!editMode || combos.length > 0) && renderServiceTypeSelector()}

          {/* Service/Combo Selection */}
          {renderServiceSelector()}

          {/* Date */}
          <div>
            <Label>Fecha</Label>
            <Input 
              type="date" 
              value={appointmentForm.date} 
              onChange={e => {
                handleFormChange('date', e.target.value);
                if (editMode) {
                  handleEditingAppointmentChange('appointment_date', e.target.value);
                }
              }} 
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Hora Inicio</Label>
              <Select 
                value={appointmentForm.start_time} 
                onValueChange={handleStartTimeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time, index) => (
                    <SelectItem key={time} value={TIME_SLOTS_12H[index]}>{TIME_SLOTS_12H[index]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hora Fin</Label>
              <Select 
                value={appointmentForm.end_time} 
                onValueChange={value => {
                  handleFormChange('end_time', value);
                  if (editMode) {
                    handleEditingAppointmentChange('end_time', value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time, index) => (
                    <SelectItem key={time} value={TIME_SLOTS_12H[index]}>{TIME_SLOTS_12H[index]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Employee Selection - Only in edit mode or if we have employees */}
          {(editMode || employees.length > 0) && (
            <div>
              <Label>Estilista</Label>
              <Select 
                value={editMode ? (editingAppointment?.employee_id || 'unassigned') : (appointmentForm.employee_id || 'unassigned')} 
                onValueChange={value => {
                  const employeeId = value === 'unassigned' ? undefined : value;
                  if (editMode) {
                    handleEditingAppointmentChange('employee_id', employeeId);
                  } else {
                    handleFormChange('employee_id', employeeId || '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estilista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin estilista asignado</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointmentForm.isCombo && (
                <p className="text-sm text-muted-foreground mt-1">
                  Si no seleccionas un empleado, se usará el empleado principal del combo
                </p>
              )}
            </div>
          )}

          {/* Status - Only in edit mode */}
          {editMode && (
            <div>
              <Label>Estado</Label>
              <Select 
                value={editingAppointment?.status || 'pending'} 
                onValueChange={value => handleEditingAppointmentChange('status', value)}
              >
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
          )}

          {/* Price Field */}
          {renderPriceField()}

          {/* Notes */}
          <div>
            <Label>Notas</Label>
            <Textarea 
              placeholder="Notas adicionales..." 
              value={appointmentForm.notes} 
              onChange={e => {
                handleFormChange('notes', e.target.value);
                if (editMode) {
                  handleEditingAppointmentChange('notes', e.target.value);
                }
              }} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              {editMode ? 'Actualizar Cita' : 'Crear Cita'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};