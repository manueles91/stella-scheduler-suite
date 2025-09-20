import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/admin/useServices";
import { useCombos } from "@/hooks/admin/useCombos";
import { useEmployees } from "@/hooks/admin/useEmployees";
import { AppointmentDialog } from "@/components/employee/time-tracking/AppointmentDialog";
import { AppointmentFormData, Customer, Employee } from "@/types/time-tracking";
import { QuickAccessDialogProps } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const NewAppointmentDialog = ({ effectiveProfile }: QuickAccessDialogProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>({
    client_id: "",
    service_id: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: "",
    end_time: "",
    notes: "",
    final_price_cents: 0,
    isCombo: false
  });

  const { services, fetchServices } = useServices();
  const { combos, fetchCombos } = useCombos();
  const { employees: adminEmployees, fetchEmployees } = useEmployees();
  const [clients, setClients] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const handleOpenDialog = () => {
    fetchServices();
    fetchCombos();
    fetchEmployees();
    fetchClients();
    fetchEmployeesForDialog();
    setShowDialog(true);
  };

  const fetchEmployeesForDialog = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');

      if (!error && data) {
        const convertedEmployees = data.map(emp => ({
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          role: emp.role as 'employee' | 'admin'
        }));
        setEmployees(convertedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchClients = async () => {
    try {
      // Fetch from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, account_status, created_at')
        .in('role', ['client', 'employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');

      // Fetch from invited_users table
      const { data: invitedData, error: invitedError } = await supabase
        .from('invited_users')
        .select('id, full_name, email, phone, role, account_status, invited_at')
        .eq('account_status', 'active')
        .order('full_name');

      const allClients = [
        ...(profilesData || []).map(p => ({
          ...p,
          created_at: p.created_at || new Date().toISOString()
        })),
        ...(invitedData || []).map(i => ({
          ...i,
          created_at: i.invited_at
        }))
      ];

      setClients(allClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const createNewAppointment = async () => {
    if (!appointmentForm.client_id || !appointmentForm.service_id || !appointmentForm.date || !appointmentForm.start_time) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const customer = clients.find(c => c.id === appointmentForm.client_id);
    if (!customer) {
      toast({
        title: "Error",
        description: "Cliente no encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      if (appointmentForm.isCombo) {
        // Handle combo appointment - create single combo reservation
        const selectedCombo = combos.find(c => c.id === appointmentForm.service_id);
        if (!selectedCombo) {
          toast({
            title: "Error",
            description: "Combo no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Use the combo's primary employee if no specific employee is selected
        const employeeId = appointmentForm.employee_id || selectedCombo.primary_employee_id;
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
        const startTime = new Date(`2000-01-01T${appointmentForm.start_time}`);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: customer.id,
            combo_id: selectedCombo.id,
            primary_employee_id: employeeId,
            appointment_date: appointmentForm.date,
            start_time: appointmentForm.start_time,
            end_time: endTimeStr,
            notes: appointmentForm.notes,
            status: 'confirmed',
            final_price_cents: appointmentForm.final_price_cents || (selectedCombo.variable_price ? 0 : selectedCombo.total_price_cents),
            original_price_cents: selectedCombo.original_price_cents,
            savings_cents: selectedCombo.original_price_cents - (appointmentForm.final_price_cents || selectedCombo.total_price_cents),
            is_guest_booking: false,
            customer_email: customer.email,
            customer_name: customer.full_name,
            created_by_admin: effectiveProfile?.id
          })
          .select()
          .single();

        if (error) throw error;
      } else {
        // Handle individual service appointment
        const selectedService = services.find(s => s.id === appointmentForm.service_id);
        if (!selectedService) {
          toast({
            title: "Error",
            description: "Servicio no encontrado",
            variant: "destructive"
          });
          return;
        }

        // Calculate end time
        const startTime = new Date(`2000-01-01T${appointmentForm.start_time}`);
        const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('reservations')
          .insert({
            client_id: customer.id,
            service_id: appointmentForm.service_id,
            employee_id: appointmentForm.employee_id || null,
            appointment_date: appointmentForm.date,
            start_time: appointmentForm.start_time,
            end_time: endTimeStr,
            notes: appointmentForm.notes,
            status: 'confirmed',
            customer_email: customer.email,
            customer_name: customer.full_name,
            final_price_cents: appointmentForm.final_price_cents || (selectedService.variable_price ? 0 : selectedService.price_cents),
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
      setAppointmentForm({
        client_id: "",
        service_id: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: "",
        end_time: "",
        notes: "",
        final_price_cents: 0,
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

  const handleFormChange = (form: AppointmentFormData) => {
    setAppointmentForm(form);
  };

  return (
    <>
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
      </Dialog>

      <AppointmentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editMode={false}
        editingAppointment={null}
        appointmentForm={appointmentForm}
        onAppointmentFormChange={handleFormChange}
        onEditingAppointmentChange={() => {}}
        services={services}
        clients={clients}
        employees={employees}
        combos={combos}
        onSubmit={createNewAppointment}
        onCancel={() => setShowDialog(false)}
        effectiveProfile={effectiveProfile}
        showPriceField={true}
      />
    </>
  );
};