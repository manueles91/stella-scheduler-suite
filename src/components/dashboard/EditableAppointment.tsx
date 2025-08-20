import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/appointment";
import { Profile } from "@/types/booking";
import { CustomerSelectorModal } from "@/components/admin/CustomerSelectorModal";

interface EditableAppointmentProps {
  appointment: Appointment;
  onUpdate: () => void;
  canEdit: boolean;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  account_status: string;
  created_at: string;
}

export const EditableAppointment = ({ appointment, onUpdate, canEdit }: EditableAppointmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date(appointment.appointment_date),
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    notes: appointment.notes || "",
    client_id: appointment.client_id,
    employee_id: appointment.employee_id || "unassigned",
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      // Fetch and set the selected customer based on the appointment's client_id
      if (appointment.client_id) {
        fetchCustomerData(appointment.client_id);
      }
    }
  }, [isOpen, appointment.client_id]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');

      if (!employeesError && employeesData) setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async (clientId: string) => {
    try {
      // First try to find in profiles table (including admins and employees)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, account_status, created_at')
        .eq('id', clientId)
        .in('role', ['client', 'employee', 'admin'])
        .single();

      if (profileData && !profileError) {
        setSelectedCustomer({
          id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          account_status: profileData.account_status || 'active',
          created_at: profileData.created_at || new Date().toISOString()
        });
        return;
      }

      // If not found in profiles, try invited_users table
      const { data: invitedData, error: invitedError } = await supabase
        .from('invited_users')
        .select('id, full_name, email, phone, role, account_status, invited_at')
        .eq('id', clientId)
        .single();

      if (invitedData && !invitedError) {
        setSelectedCustomer({
          id: invitedData.id,
          full_name: invitedData.full_name,
          email: invitedData.email,
          phone: invitedData.phone,
          role: invitedData.role,
          account_status: invitedData.account_status,
          created_at: invitedData.invited_at
        });
        return;
      }

      // If customer not found in either table, create a fallback object
      setSelectedCustomer({
        id: clientId,
        full_name: appointment.client_profile?.full_name || "Cliente no encontrado",
        email: "",
        role: "client",
        account_status: "unknown",
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Set fallback customer data
      setSelectedCustomer({
        id: clientId,
        full_name: appointment.client_profile?.full_name || "Cliente no encontrado",
        email: "",
        role: "client",
        account_status: "unknown",
        created_at: new Date().toISOString()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          appointment_date: format(formData.appointment_date, 'yyyy-MM-dd'),
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null,
          client_id: selectedCustomer.id,
          employee_id: formData.employee_id === "unassigned" ? null : formData.employee_id || null,
        })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la cita",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 p-0"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.appointment_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.appointment_date}
                  onSelect={(date) => date && setFormData({ ...formData, appointment_date: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start_time">Hora Inicio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Hora Fin</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Cliente</Label>
            <CustomerSelectorModal
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            />
          </div>

          <div>
            <Label>Estilista</Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estilista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin estilista asignado</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Actualizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};