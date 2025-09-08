import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BaseBookingCard } from "./BaseBookingCard";
import { Receipt, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { formatCRC } from "@/lib/currency";

export interface CostCardProps {
  id: string;
  name: string;
  description?: string;
  amountCents: number;
  costCategoryId: string;
  costType: 'fixed' | 'variable' | 'recurring' | 'one_time';
  dateIncurred: string;
  isActive: boolean;
  recurringFrequency?: number;
  categoryName?: string;
  onEdit?: (cost: any) => void;
  onDelete?: (costId: string) => void;
  className?: string;
}

export const CostCard = ({
  id,
  name,
  description,
  amountCents,
  costCategoryId,
  costType,
  dateIncurred,
  isActive,
  recurringFrequency,
  categoryName,
  onEdit,
  onDelete,
  className = ""
}: CostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'one_time': return 'Una vez';
      case 'recurring': return 'Recurrente';
      case 'fixed': return 'Fijo';
      case 'variable': return 'Variable';
      default: return type;
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    return categoryName || 'Sin categoría';
  };

  const renderBasicInfo = () => {
    return (
      <div className="flex flex-col gap-1">
        {/* First row: name on left, category on right */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 pr-2">
            <div className="font-medium text-lg truncate">{name}</div>
          </div>
          <div className="flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(costCategoryId)}
            </Badge>
          </div>
        </div>
        {/* Second row: date compact */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{format(new Date(dateIncurred), 'dd/MM/yyyy')}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-green-700 font-semibold">
            <span>{formatCRC(amountCents)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedContent = () => {
    return (
      <div className="space-y-4">
        {/* Category and Type details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Categoría</h5>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span>{getCategoryLabel(costCategoryId)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Tipo</h5>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{getTypeLabel(costType)}</span>
            </div>
          </div>
        </div>

        {/* Date and Amount details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Fecha</h5>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(dateIncurred), 'dd/MM/yyyy')}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Monto</h5>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-green-600">{formatCRC(amountCents)}</span>
            </div>
          </div>
        </div>

        {/* Recurring frequency if applicable */}
        {costType === 'recurring' && recurringFrequency && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Frecuencia</h5>
            <div className="text-sm">
              Cada {recurringFrequency} días
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">Descripción</h5>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{description}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit({ id, name, description, amountCents, costCategoryId, costType, dateIncurred, isActive, recurringFrequency });
              }}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseBookingCard
      id={id}
      className={className}
      showExpandable={true}
      isExpanded={isExpanded}
      onExpandChange={setIsExpanded}
      expandedContent={renderExpandedContent()}
    >
      {renderBasicInfo()}
    </BaseBookingCard>
  );
};
