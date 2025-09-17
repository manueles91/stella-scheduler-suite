import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock, User, Sparkles, Calendar, DollarSign, Package, ListTree, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BaseBookingCard } from "./BaseBookingCard";
import { EditableAppointment } from "@/components/dashboard/EditableAppointment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatCRC } from "@/lib/currency";
import { trackLoyaltyVisit } from "@/lib/loyaltyTracking";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export interface BookingCardProps {
  id: string;
  serviceName: string;
  serviceId?: string; // Add service ID field
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: string;
  priceCents?: number;
  finalPriceCents?: number; // Add final_price_cents field
  categoryName?: string;
  clientName?: string;
  clientEmail?: string;
  clientId?: string;
  employeeName?: string;
  employeeId?: string;
  notes?: string;
  
  // Combo-related fields
  isCombo?: boolean;
  comboName?: string;
  comboId?: string;
  comboServices?: { name: string; quantity: number }[];
  
  // Booking type
  bookingType?: 'service' | 'combo';
  
  // Interaction props
  onUpdate?: () => void;
  canEdit?: boolean;
  canUpdateStatus?: boolean; // Separate prop for status updates
  effectiveProfile?: any;
  
  // Display options
  variant?: 'upcoming' | 'past' | 'revenue';
  showExpandable?: boolean;
  className?: string;
}

export const BookingCard = ({
  id,
  serviceName,
  serviceId,
  appointmentDate,
  startTime,
  endTime,
  status,
  priceCents,
  finalPriceCents,
  categoryName,
  clientName,
  clientEmail,
  clientId,
  employeeName,
  employeeId,
  notes,
  isCombo,
  comboName,
  comboId,
  comboServices,
  bookingType,
  onUpdate,
  canEdit = false,
  canUpdateStatus = false,
  effectiveProfile,
  variant = 'upcoming',
  showExpandable = true,
  className = ""
}: BookingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(isCombo || false); // Auto-expand combo bookings
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [fetchedComboServices, setFetchedComboServices] = useState<{ name: string; quantity: number }[] | null>(null);
  const { toast } = useToast();

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Fetch combo services if needed
  useEffect(() => {
    const fetchComboServices = async () => {
      if (!isCombo || !comboId || comboServices?.length) return;
      try {
        const { data, error } = await supabase
          .from('combo_services')
          .select('quantity, services(name)')
          .eq('combo_id', comboId);
        if (!error && Array.isArray(data)) {
          const items = data.map((row: any) => ({
            name: row?.services?.name || 'Servicio',
            quantity: row?.quantity || 1
          }));
          setFetchedComboServices(items);
        }
      } catch (e) {
        console.error('Error fetching combo services:', e);
      }
    };
    fetchComboServices();
  }, [isCombo, comboId, comboServices]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'confirmada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
      case 'completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      case 'confirmada':
      case 'cancelada':
      case 'completada':
        return status;
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      // Determine which table to update based on booking type
      const tableName = isCombo ? 'combo_reservations' : 'reservations';
      
      let updateData: any = { status: newStatus };
      
      // For variable price services being marked as completed, ensure final_price_cents is set
      if (newStatus === 'completed' && !finalPriceCents) {
        // Check if this is a variable price service by querying the service
        if (serviceId || (!isCombo && serviceName)) {
          try {
            const { data: serviceData } = await supabase
              .from('services')
              .select('variable_price, price_cents')
              .eq('id', serviceId)
              .single();
              
            if (serviceData?.variable_price) {
              // For variable price services, use the service's referential price as final if not already provided
              const resolvedFinal = priceCents ?? serviceData?.price_cents;
              if (resolvedFinal != null) {
                updateData.final_price_cents = resolvedFinal;
              }
            }
          } catch (serviceError) {
            console.warn('Could not check service variable_price:', serviceError);
          }
        }
      }
      
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Track loyalty visit if status is completed
      if (newStatus === 'completed' && clientId) {
        await trackLoyaltyVisit(clientId, undefined, `${isCombo ? 'Combo' : 'Reserva'} completada: ${serviceName}`);
      }

      setCurrentStatus(newStatus);
      toast({
        title: "Estado actualizado",
        description: "El estado de la cita se ha actualizado correctamente",
      });
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la cita",
        variant: "destructive",
      });
      // Revert the select value on error
      setCurrentStatus(status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteBooking = async () => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado correctamente",
      });
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la cita",
        variant: "destructive",
      });
    }
  };

  const renderServiceInfo = () => {
    return (
      <div className="flex items-center gap-1 min-w-0">
        {isCombo && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 flex-shrink-0">
            COMBO
          </Badge>
        )}
        <span className="font-medium truncate flex-1 text-sm">{serviceName}</span>
        {categoryName && (
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {categoryName}
          </Badge>
        )}
      </div>
    );
  };

  const renderTimeInfo = () => {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate text-xs">
          {formatTime12Hour(startTime)}
        </span>
      </div>
    );
  };

  const renderDateInfo = () => {
    const date = parseISO(appointmentDate);
    const isToday = new Date().toDateString() === date.toDateString();
    
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
        <Calendar className="h-3 w-3 flex-shrink-0" />
        <span className="truncate text-xs">
          {isToday ? 'Hoy' : format(date, 'EEE, dd MMM', { locale: es })}
        </span>
      </div>
    );
  };

  const renderClientInfo = () => {
    if (!clientName && !clientEmail) return null;
    // Keep client text only (no icon), smaller emphasis in expanded view
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate text-sm text-muted-foreground">
          {clientName || clientEmail || 'Cliente no especificado'}
        </span>
      </div>
    );
  };

  const renderEmployeeInfo = () => {
    if (!employeeName) return null;
    // Show employee avatar (placeholder initials) and name
    const initials = employeeName.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-6 w-6">
          <AvatarImage alt={employeeName} />
          <AvatarFallback>{initials || 'E'}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm text-muted-foreground">
          {employeeName}
        </span>
      </div>
    );
  };

  const renderPriceInfo = () => {
    // Use final price if available (for completed bookings), otherwise use base price
    const displayPrice = finalPriceCents || priceCents;
    if (!displayPrice) return null;
    
    return (
      <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
        <span>{formatCRC(displayPrice)}</span>
      </div>
    );
  };

  const renderStatusBadge = () => {
    return (
      <Badge className={`${getStatusColor(currentStatus)} text-xs`} variant="secondary">
        {getStatusText(currentStatus)}
      </Badge>
    );
  };

  const renderStatusInline = () => {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-medium text-muted-foreground">Estado</span>
        {canUpdateStatus ? (
          <Select 
            value={currentStatus} 
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
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
          <Badge className={`${getStatusColor(currentStatus)} text-xs`} variant="secondary">
            {getStatusText(currentStatus)}
          </Badge>
        )}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <EditableAppointment 
              appointment={{
                id,
                appointment_date: appointmentDate,
                start_time: startTime,
                end_time: endTime || '',
                status: currentStatus,
                notes,
                client_id: clientId || 'temp-client-id',
                employee_id: employeeId,
                final_price_cents: finalPriceCents,
                services: [{ id: serviceId || 'temp-id', name: serviceName, description: '', duration_minutes: 0, price_cents: priceCents || 0 }],
                client_profile: { full_name: clientName || '' },
                employee_profile: employeeName ? { full_name: employeeName } : undefined,
                isCombo,
                comboId,
                comboName
              }}
              onUpdate={onUpdate || (() => {})}
              canEdit={canEdit}
            />
          )}
          {effectiveProfile?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente la cita "{serviceName}" del {format(parseISO(appointmentDate), 'dd/MM/yyyy', { locale: es })}. 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteBooking}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    );
  };

  // Collapsed state content - Simplified with only essential info
  const collapsedContent = (
    <div className="flex flex-col gap-1">
      {/* First row: title on left, status on right */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 pr-2">{renderServiceInfo()}</div>
        <div className="flex-shrink-0">{renderStatusBadge()}</div>
      </div>
      {/* Second row: time + date compact */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {renderTimeInfo()}
        {renderDateInfo()}
        {variant === 'revenue' && (finalPriceCents || priceCents) ? (
          <div className="ml-auto flex items-center gap-1 text-green-700 font-semibold">
            <span>{formatCRC(finalPriceCents || priceCents)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  // Expanded state content - Only additional details, no redundancy
  const expandedContent = (
    <div className="space-y-4">
      {/* Inline status + edit controls */}
      <div className="flex items-center justify-between">
        {renderStatusInline()}
      </div>

      {/* Combo services details */}
      {isCombo && (comboServices?.length || fetchedComboServices?.length) && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm text-muted-foreground">Servicios incluidos</h5>
          <div className="border rounded-md p-2 bg-muted/30">
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
              <ListTree className="h-3 w-3" />
              <span>Detalles del combo</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              {(comboServices || fetchedComboServices || []).map((s, idx) => (
                <li key={idx} className="text-xs">
                  {s.quantity > 1 ? `${s.quantity} x ${s.name}` : s.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {categoryName && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm text-muted-foreground">Categoría</h5>
          <Badge variant="outline">{categoryName}</Badge>
        </div>
      )}

      {/* Client and employee details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderClientInfo() && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Cliente</h5>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{clientName || clientEmail || 'Cliente no especificado'}</span>
            </div>
          </div>
        )}
        
        {renderEmployeeInfo() && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Estilista</h5>
            <div className="flex items-center gap-2">
              <span>{employeeName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Price information for revenue variant */}
      {variant === 'revenue' && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm text-muted-foreground">Precio</h5>
          {renderPriceInfo()}
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm text-muted-foreground">Notas</h5>
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{notes}</p>
        </div>
      )}

      {/* Status controls are rendered inline at the top via renderStatusInline() */}
    </div>
  );

  return (
    <BaseBookingCard
      id={id}
      className={className}
      showExpandable={showExpandable}
      isExpanded={isExpanded}
      onExpandChange={setIsExpanded}
      expandedContent={expandedContent}
    >
      {collapsedContent}
    </BaseBookingCard>
  );
};
