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
  onSubmit,
  onCancel
}: AppointmentDialogProps) => {
  const handleFormChange = (field: keyof typeof appointmentForm, value: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
        </DialogHeader>
        
        {editMode && editingAppointment ? (
          <div className="space-y-4">
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
                  handleEditingAppointmentChange('client_id', customer?.id || '');
                  handleEditingAppointmentChange('client_profile', customer ? { full_name: customer.full_name } : undefined);
                }}
              />
            </div>

            <div>
              <Label>Servicio</Label>
              <Select 
                value={appointmentForm.service_id} 
                onValueChange={value => {
                  handleFormChange('service_id', value);
                  const selectedService = services.find(s => s.id === value);
                  if (selectedService) {
                    handleEditingAppointmentChange('services', [{
                      id: selectedService.id,
                      name: selectedService.name,
                      description: selectedService.description || 'Sin descripción',
                      duration_minutes: selectedService.duration_minutes,
                      price_cents: selectedService.price_cents
                    }]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha</Label>
              <Input 
                type="date" 
                value={appointmentForm.date} 
                onChange={e => {
                  handleFormChange('date', e.target.value);
                  handleEditingAppointmentChange('appointment_date', e.target.value);
                }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Hora Inicio</Label>
                <Select 
                  value={appointmentForm.start_time} 
                  onValueChange={value => {
                    handleFormChange('start_time', value);
                    handleEditingAppointmentChange('start_time', value);
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
              <div>
                <Label>Hora Fin</Label>
                <Select 
                  value={appointmentForm.end_time} 
                  onValueChange={value => {
                    handleFormChange('end_time', value);
                    handleEditingAppointmentChange('end_time', value);
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

            <div>
              <Label>Estilista</Label>
              <Select 
                value={editingAppointment.employee_id || 'unassigned'} 
                onValueChange={value => handleEditingAppointmentChange('employee_id', value === 'unassigned' ? undefined : value)}
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
            </div>

            <div>
              <Label>Estado</Label>
              <Select 
                value={editingAppointment.status} 
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

            <div>
              <Label>Notas</Label>
              <Textarea 
                placeholder="Notas adicionales..." 
                value={appointmentForm.notes} 
                onChange={e => {
                  handleFormChange('notes', e.target.value);
                  handleEditingAppointmentChange('notes', e.target.value);
                }} 
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={onSubmit} className="flex-1">
                Actualizar Cita
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <CustomerSelectorModal
                value={clients.find(c => c.id === appointmentForm.client_id) || null}
                onValueChange={(customer) => {
                  handleFormChange('client_id', customer?.id || '');
                }}
              />
            </div>

            <div>
              <Label htmlFor="service">Servicio</Label>
              <Select 
                value={appointmentForm.service_id} 
                onValueChange={value => handleFormChange('service_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input 
                id="date" 
                type="date" 
                value={appointmentForm.date} 
                onChange={e => handleFormChange('date', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="start_time">Hora de inicio</Label>
              <Select 
                value={appointmentForm.start_time} 
                onValueChange={value => handleFormChange('start_time', value)}
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
              <Label htmlFor="notes">Notas</Label>
              <Textarea 
                id="notes" 
                placeholder="Notas adicionales..." 
                value={appointmentForm.notes} 
                onChange={e => handleFormChange('notes', e.target.value)} 
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={onSubmit} className="flex-1">
                Crear Cita
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
