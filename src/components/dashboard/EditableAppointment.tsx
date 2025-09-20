import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types/appointment";
import { AppointmentDialog } from "@/components/employee/time-tracking/AppointmentDialog";
import { AppointmentFormData, Customer, Employee } from "@/types/time-tracking";
import { formatTimeForSelect } from "@/lib/utils/timeTrackingUtils";
import { useAppointmentManagement } from "@/hooks/useAppointmentManagement";

interface EditableAppointmentProps {
  appointment: Appointment;
  onUpdate: () => void;
  canEdit: boolean;
}

export const EditableAppointment = ({ appointment, onUpdate, canEdit }: EditableAppointmentProps) => {
  const { updateAppointment } = useAppointmentManagement();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: appointment.client_id,
    service_id: appointment.services?.[0]?.id || '',
    date: appointment.appointment_date,
    start_time: formatTimeForSelect(appointment.start_time),
    end_time: formatTimeForSelect(appointment.end_time || ""),
    notes: appointment.notes || "",
    employee_id: appointment.employee_id || "",
    final_price_cents: appointment.final_price_cents || 0,
    isCombo: appointment.isCombo || false,
    status: appointment.status || 'confirmed'
  });
  const [clients, setClients] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchClients();
      fetchServices();
      fetchCombos();
    }
  }, [isOpen]);

  // Update form data when appointment changes
  useEffect(() => {
    setFormData({
      client_id: appointment.client_id,
      service_id: appointment.services?.[0]?.id || '',
      date: appointment.appointment_date,
      start_time: formatTimeForSelect(appointment.start_time),
      end_time: formatTimeForSelect(appointment.end_time || ""),
      notes: appointment.notes || "",
      employee_id: appointment.employee_id || "",
      final_price_cents: appointment.final_price_cents || 0,
      isCombo: appointment.isCombo || false,
      status: appointment.status || 'confirmed'
    });
  }, [appointment]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');

      if (!employeesError && employeesData) {
        const convertedEmployees = employeesData.map(emp => ({
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          role: emp.role as 'employee' | 'admin'
        }));
        setEmployees(convertedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      // Fetch from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, account_status, created_at')
         .in('role', ['client', 'employee', 'admin'])
         .order('full_name');

      // Fetch from invited_users table
      const { data: invitedData, error: invitedError } = await supabase
        .from('invited_users')
        .select('id, full_name, email, phone, role, account_status, invited_at')
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

  const fetchServices = async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!servicesError && servicesData) setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCombos = async () => {
    try {
      const { data: combosData, error: combosError } = await supabase
        .from('combos')
        .select(`
          *,
          combo_services(
            service_id,
            quantity,
            services(id, name, description, duration_minutes, price_cents, image_url)
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (!combosError && combosData) setCombos(combosData);
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
  };

  const handleSubmit = async () => {
    const success = await updateAppointment(appointment, formData, clients);
    if (success) {
      setIsOpen(false);
      onUpdate();
    }
  };

  const handleFormChange = (form: AppointmentFormData) => {
    setFormData(form);
  };

  const handleEditingAppointmentChange = (updatedAppointment: Appointment | null) => {
    // This is not used in edit mode, but required by the interface
  };

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 p-0"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      
      <AppointmentDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        editMode={true}
        editingAppointment={appointment}
        appointmentForm={formData}
        onAppointmentFormChange={handleFormChange}
        onEditingAppointmentChange={handleEditingAppointmentChange}
        services={services}
        clients={clients}
        employees={employees}
        combos={combos}
        onSubmit={handleSubmit}
        onCancel={() => setIsOpen(false)}
        showPriceField={true}
      />
    </>
  );
};