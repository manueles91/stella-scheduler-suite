import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryManagerDialogProps } from "@/types/finances";
import { AdminCostCategories } from "../AdminCostCategories";

export const CategoryManagerDialog = ({
  open,
  onOpenChange
}: CategoryManagerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías de Costos</DialogTitle>
        </DialogHeader>
        <AdminCostCategories />
      </DialogContent>
    </Dialog>
  );
};
