import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, Sparkles } from "lucide-react";
import { Appointment } from "@/types/appointment";
import { EditableAppointment } from "./EditableAppointment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate: () => void;
  canEdit: boolean;
  effectiveProfile: any;
  variant?: 'default' | 'compact';
}

export const AppointmentCard = ({ 
  appointment, 
  onUpdate, 
  canEdit, 
  effectiveProfile,
  variant = 'default'
}: AppointmentCardProps) => {
  const [status, setStatus] = useState(appointment.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'Confirmada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
      case 'Completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      case 'Confirmada':
      case 'Cancelada':
      case 'Completada':
        return status;
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', appointment.id);

      if (error) throw error;

      setStatus(newStatus);
      toast({
        title: "Estado actualizado",
        description: "El estado de la cita se ha actualizado correctamente",
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la cita",
        variant: "destructive",
      });
      // Revert the select value on error
      setStatus(appointment.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderServiceNames = () => {
    if (appointment.services && appointment.services.length > 0) {
      const serviceNames = appointment.services.map(s => s.name).join(', ');
      return (
        <div className="flex items-center gap-2">
          {appointment.isCombo && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              COMBO
            </Badge>
          )}
          <span>{serviceNames}</span>
        </div>
      );
    }
    return 'Servicio no especificado';
  };

  const renderClientInfo = () => {
    if (effectiveProfile?.role === 'admin' || effectiveProfile?.role === 'employee') {
      return (
        <div className="flex items-center gap-1 min-w-0">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate text-xs text-muted-foreground">
            {appointment.client_profile?.full_name || 'Cliente no especificado'}
          </span>
        </div>
      );
    }
    return null;
  };

  const renderEmployeeInfo = () => {
    if (effectiveProfile?.role === 'admin' && appointment.employee_profile) {
      return (
        <div className="flex items-center gap-1 min-w-0">
          <Sparkles className="h-3 w-3 flex-shrink-0" />
          <span className="truncate text-xs text-muted-foreground">
            {appointment.employee_profile.full_name}
          </span>
        </div>
      );
    }
    if (effectiveProfile?.role === 'client' && appointment.employee_profile) {
      return (
        <div className="flex items-center gap-1 min-w-0">
          <Sparkles className="h-3 w-3 flex-shrink-0" />
          <span className="truncate text-xs text-muted-foreground">
            {appointment.employee_profile.full_name}
          </span>
        </div>
      );
    }
    return null;
  };

  if (variant === 'compact') {
    return (
      <div className="border border-border rounded-lg p-3 bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-sm leading-tight mb-2">
              {renderServiceNames()}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>{formatTime12Hour(appointment.start_time)}</span>
              </div>
              <span className="text-xs">
                {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit ? (
              <Select 
                value={status} 
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={`${getStatusColor(status)} text-xs`} variant="secondary">
                {getStatusText(status)}
              </Badge>
            )}
            <EditableAppointment 
              appointment={appointment} 
              onUpdate={onUpdate} 
              canEdit={canEdit} 
            />
          </div>
        </div>
        
        {(renderClientInfo() || renderEmployeeInfo()) && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/30">
            {renderClientInfo()}
            {renderEmployeeInfo()}
          </div>
        )}
      </div>
    );
  }

  // Default variant - redesigned for better mobile experience
  return (
    <div className="border border-border rounded-lg p-4 bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-shadow">
      {/* Top row with service and main actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-base leading-tight mb-2">
            {renderServiceNames()}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>
                {formatTime12Hour(appointment.start_time)} - {formatTime12Hour(appointment.end_time)}
              </span>
            </div>
            <span className="text-xs">
              {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        </div>
        
        {/* Status and Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit ? (
            <Select 
              value={status} 
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={getStatusColor(status)} variant="secondary">
              {getStatusText(status)}
            </Badge>
          )}
          <EditableAppointment 
            appointment={appointment} 
            onUpdate={onUpdate} 
            canEdit={canEdit} 
          />
        </div>
      </div>
      
      {/* Client/Employee info - responsive layout */}
      {(renderClientInfo() || renderEmployeeInfo()) && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/30">
          {renderClientInfo()}
          {renderEmployeeInfo()}
        </div>
      )}
    </div>
  );
};
