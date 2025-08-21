import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ComboReservation, ComboServiceAssignment, Employee } from "@/types/booking";

interface ComboServiceAssignmentModalProps {
  comboReservation: ComboReservation;
  onUpdate?: () => void;
}

export const ComboServiceAssignmentModal = ({ 
  comboReservation, 
  onUpdate 
}: ComboServiceAssignmentModalProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceAssignments, setServiceAssignments] = useState<ComboServiceAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && comboReservation) {
      fetchServiceAssignments();
      fetchEmployees();
    }
  }, [isOpen, comboReservation]);

  const fetchServiceAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('combo_service_assignments')
        .select(`
          *,
          service:services(*),
          assigned_employee:profiles(id, full_name)
        `)
        .eq('combo_reservation_id', comboReservation.id)
        .order('estimated_start_time');

      if (error) throw error;
      setServiceAssignments(data || []);
    } catch (error) {
      console.error('Error fetching service assignments:', error);
      toast({
        title: "Error",
        description: "Error al cargar las asignaciones de servicios",
        variant: "destructive"
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          employee_services(service_id)
        `)
        .in('role', ['employee', 'admin'])
        .eq('account_status', 'active')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeAssignment = async (assignmentId: string, employeeId: string | null) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('combo_service_assignments')
        .update({ 
          assigned_employee_id: employeeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      setServiceAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, assigned_employee_id: employeeId }
            : assignment
        )
      );

      toast({
        title: "Éxito",
        description: "Empleado asignado correctamente"
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error assigning employee:', error);
      toast({
        title: "Error",
        description: "Error al asignar empleado",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableEmployees = (serviceId: string) => {
    return employees.filter(emp => 
      emp.employee_services.some(es => es.service_id === serviceId)
    );
  };

  const formatTime = (time: string) => {
    if (!time) return '--';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'cancelled': return 'Cancelado';
      default: return 'Pendiente';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Asignar Empleados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignación de Empleados - Combo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Combo Reservation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Combo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Fecha:</span>
                  <span>{new Date(comboReservation.appointment_date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Horario:</span>
                  <span>{formatTime(comboReservation.start_time)} - {formatTime(comboReservation.end_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Empleado Principal:</span>
                  <span>{comboReservation.primary_employee?.full_name || 'No asignado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getStatusLabel(comboReservation.status)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignación de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceAssignments.map((assignment) => {
                  const availableEmployees = getAvailableEmployees(assignment.service_id);
                  const currentEmployee = employees.find(emp => emp.id === assignment.assigned_employee_id);
                  
                  return (
                    <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.service?.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Duración: {assignment.estimated_duration} min</span>
                              <span>Inicio estimado: {formatTime(assignment.estimated_start_time || '')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium">Empleado Asignado:</Label>
                        <Select
                          value={assignment.assigned_employee_id || ''}
                          onValueChange={(value) => handleEmployeeAssignment(assignment.id, value || null)}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Seleccionar empleado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin asignar</SelectItem>
                            {availableEmployees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {assignment.assigned_employee_id && (
                        <div className="text-sm text-muted-foreground">
                          Empleado actual: {currentEmployee?.full_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
