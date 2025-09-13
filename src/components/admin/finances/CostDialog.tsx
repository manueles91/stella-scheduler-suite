import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CostDialogProps, CostType } from "@/types/finances";

const costTypes = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'recurring', label: 'Recurrente' },
  { value: 'one_time', label: 'Una vez' }
];

export const CostDialog = ({
  open,
  onOpenChange,
  editingCost,
  formData,
  onFormDataChange,
  costCategories,
  onSubmit,
  onCancel
}: CostDialogProps) => {
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Editar Costo' : 'Nuevo Costo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => handleFormChange('name', e.target.value)} 
              placeholder="Ej: Electricidad mes de enero" 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => handleFormChange('description', e.target.value)} 
              placeholder="Descripción opcional del gasto" 
              rows={2} 
            />
          </div>

          <div>
            <Label htmlFor="amount">Monto (₡) *</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              value={formData.amount} 
              onChange={e => handleFormChange('amount', e.target.value)} 
              placeholder="0.00" 
              required 
            />
          </div>

          <div>
            <Label htmlFor="cost_category_id">Categoría *</Label>
            <Select 
              value={formData.cost_category_id} 
              onValueChange={value => handleFormChange('cost_category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {costCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cost_type">Tipo *</Label>
            <Select 
              value={formData.cost_type} 
              onValueChange={value => handleFormChange('cost_type', value as CostType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {costTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.cost_type === 'recurring' && (
            <div>
              <Label htmlFor="recurring_frequency">Frecuencia (días)</Label>
              <Input 
                id="recurring_frequency" 
                type="number" 
                value={formData.recurring_frequency} 
                onChange={e => handleFormChange('recurring_frequency', e.target.value)} 
                placeholder="30 (mensual), 7 (semanal)" 
              />
            </div>
          )}

          <div>
            <Label htmlFor="date_incurred">Fecha *</Label>
            <Input 
              id="date_incurred" 
              type="date" 
              value={formData.date_incurred} 
              onChange={e => handleFormChange('date_incurred', e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="flex-1">
              {editingCost ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
