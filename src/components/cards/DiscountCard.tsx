import { useState } from "react";
import { BaseCard } from "./BaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, Tag, Calendar } from "lucide-react";

export interface DiscountCardProps {
  id: string;
  name: string;
  description?: string;
  serviceId: string;
  serviceName?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  discountCode?: string;
  
  // Interaction
  onSelect?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'admin';
  showExpandable?: boolean;
  className?: string;
}

export const DiscountCard = ({
  id,
  name,
  description,
  serviceId,
  serviceName,
  discountType,
  discountValue,
  startDate,
  endDate,
  isPublic,
  discountCode,
  onSelect,
  onEdit,
  canEdit = false,
  variant = 'landing',
  showExpandable = true,
  className = ""
}: DiscountCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDiscountText = () => {
    if (discountType === 'percentage') {
      return `${discountValue}%`;
    } else {
      return `₡${Math.round(discountValue / 100)}`;
    }
  };

  const cardContent = (
    <div className="flex justify-between items-end">
      <div className="flex flex-col gap-1">
        <Badge className="bg-red-500 text-white text-xs">
          <Sparkles className="h-2 w-2 mr-1" />
          {getDiscountText()} OFF
        </Badge>
        {!isPublic && discountCode && (
          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
            <Tag className="h-2 w-2 mr-1" />
            CÓDIGO
          </Badge>
        )}
      </div>
      
      <div className="text-right">
        <div className="font-bold text-lg text-white drop-shadow-md">
          {getDiscountText()}
        </div>
        <div className="text-xs text-white/80">
          de descuento
        </div>
      </div>
    </div>
  );

  const expandedContent = (
    <>
      {/* Service Info */}
      {serviceName && (
        <div className="bg-muted/30 p-3 rounded-lg">
          <p className="text-sm font-medium text-foreground">Aplica a:</p>
          <p className="text-sm text-muted-foreground">{serviceName}</p>
        </div>
      )}
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Discount Details */}
      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Descuento:</span>
          <Badge className="bg-red-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            {getDiscountText()} OFF
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Tipo: {discountType === 'percentage' ? 'Porcentaje' : 'Monto fijo'}</p>
          <p>Visibilidad: {isPublic ? 'Público' : 'Código requerido'}</p>
          {discountCode && (
            <p>Código: <span className="font-mono bg-muted px-1 rounded">{discountCode}</span></p>
          )}
        </div>
      </div>

      {/* Validity Period */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-foreground">Período de validez</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Desde: {formatDate(startDate)}</p>
          <p>Hasta: {formatDate(endDate)}</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {onSelect && (
          <Button 
            className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {variant === 'admin' ? 'Ver' : 'Aplicar descuento'}
          </Button>
        )}
        {canEdit && onEdit && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Editar
          </Button>
        )}
      </div>
    </>
  );

  return (
    <BaseCard
      id={id}
      name={name}
      description={description}
      className={className}
      showExpandable={showExpandable}
      isExpanded={isExpanded}
      onExpandChange={setIsExpanded}
      onSelect={onSelect}
      expandedContent={expandedContent}
    >
      {cardContent}
    </BaseCard>
  );
};