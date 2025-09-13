import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TIME_SLOTS, TIME_SLOTS_12H } from "@/lib/utils/timeTrackingUtils";
import { BlockedTimeDialogProps } from "@/types/time-tracking";

export const BlockedTimeDialog = ({
  open,
  onOpenChange,
  editMode,
  editingBlockedTime,
  blockedTimeForm,
  onBlockedTimeFormChange,
  onSubmit,
  onCancel
}: BlockedTimeDialogProps) => {
  const handleFormChange = (field: keyof typeof blockedTimeForm, value: string | boolean) => {
    onBlockedTimeFormChange({
      ...blockedTimeForm,
      [field]: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Editar Tiempo Bloqueado' : 'Bloquear Tiempo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="block_date">Fecha</Label>
            <Input 
              id="block_date" 
              type="date" 
              value={blockedTimeForm.date} 
              onChange={e => handleFormChange('date', e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="block_start">Hora de inicio</Label>
              <Select 
                value={blockedTimeForm.start_time} 
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
              <Label htmlFor="block_end">Hora de fin</Label>
              <Select 
                value={blockedTimeForm.end_time} 
                onValueChange={value => handleFormChange('end_time', value)}
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
            <Label htmlFor="reason">Motivo</Label>
            <Textarea 
              id="reason" 
              placeholder="Ej: Reunión, descanso, formación..." 
              value={blockedTimeForm.reason} 
              onChange={e => handleFormChange('reason', e.target.value)} 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_recurring"
              checked={blockedTimeForm.is_recurring}
              onCheckedChange={(checked) => handleFormChange('is_recurring', checked as boolean)}
            />
            <Label htmlFor="is_recurring">Tiempo recurrente</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              {editMode ? 'Actualizar Tiempo Bloqueado' : 'Bloquear Tiempo'}
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
