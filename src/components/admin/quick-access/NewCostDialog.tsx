import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCostCategories } from "@/hooks/admin/useCostCategories";
import { CostData, QuickAccessDialogProps, costTypes } from "./types";

export const NewCostDialog = ({ effectiveProfile }: QuickAccessDialogProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [costData, setCostData] = useState<CostData>({
    name: "",
    description: "",
    amount: "",
    cost_type: "one_time",
    cost_category_id: "",
    date_incurred: format(new Date(), 'yyyy-MM-dd')
  });

  const { costCategories, fetchCostCategories } = useCostCategories();

  const handleOpenDialog = () => {
    fetchCostCategories();
    setShowDialog(true);
  };

  const createNewCost = async () => {
    if (!costData.name || !costData.amount || !costData.cost_type || !costData.cost_category_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('costs')
        .insert({
          name: costData.name,
          description: costData.description,
          amount_cents: Math.round(parseFloat(costData.amount) * 100),
          cost_type: costData.cost_type,
          cost_category: 'other' as const,
          cost_category_id: costData.cost_category_id,
          date_incurred: costData.date_incurred,
          created_by: effectiveProfile?.id || '',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Costo registrado exitosamente"
      });

      setShowDialog(false);
      setCostData({
        name: "",
        description: "",
        amount: "",
        cost_type: "one_time",
        cost_category_id: "",
        date_incurred: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating cost:', error);
      toast({
        title: "Error",
        description: "Error al registrar el costo",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-20 flex flex-col gap-2"
          onClick={handleOpenDialog}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-sm">Nuevo Costo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="cost-description">
        <DialogHeader>
          <DialogTitle>Nuevo Costo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="cost-description">
          <div>
            <Label>Nombre del Costo</Label>
            <Input
              value={costData.name}
              onChange={(e) => setCostData({...costData, name: e.target.value})}
              placeholder="Ej: Materiales, Electricidad..."
            />
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={costData.description}
              onChange={(e) => setCostData({...costData, description: e.target.value})}
              placeholder="Descripción del costo..."
            />
          </div>
          <div>
            <Label>Monto (₡)</Label>
            <Input
              type="number"
              step="0.01"
              value={costData.amount}
              onChange={(e) => setCostData({...costData, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Tipo de Costo</Label>
            <Select value={costData.cost_type} onValueChange={(value: any) => setCostData({...costData, cost_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {costTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={costData.cost_category_id} onValueChange={(value) => setCostData({...costData, cost_category_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {costCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha del Costo</Label>
            <Input
              type="date"
              value={costData.date_incurred}
              onChange={(e) => setCostData({...costData, date_incurred: e.target.value})}
            />
          </div>
          <Button onClick={createNewCost} className="w-full">
            Registrar Costo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
