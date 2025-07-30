import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Clock, Package, Percent, DollarSign, Pencil, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  employee_services: {
    service_id: string;
  }[];
}

interface StandardServiceCardProps {
  // Core data
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  duration?: number;
  imageUrl?: string;
  
  // Type and discount info
  type: 'service' | 'combo' | 'discount';
  discountType?: 'percentage' | 'flat' | 'combo';
  discountValue?: number;
  
  // Combo specific
  comboServices?: Array<{
    name: string;
    quantity?: number;
    service_id?: string;
  }>;
  
  // Interaction
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  
  // Admin specific
  isActive?: boolean;
  category?: string;
  
  // Employee selection (for reservation flow)
  employees?: Employee[];
  selectedEmployee?: Employee | null;
  onEmployeeSelect?: (employee: Employee | null) => void;
  allowEmployeeSelection?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'reservation' | 'admin';
  showExpandable?: boolean;
  className?: string;
}

export const StandardServiceCard = ({
  id,
  name,
  description,
  originalPrice,
  finalPrice,
  savings,
  duration,
  imageUrl,
  type,
  discountType,
  discountValue,
  comboServices = [],
  onSelect,
  onEdit,
  onDelete,
  canEdit = false,
  isActive = true,
  category,
  employees = [],
  selectedEmployee,
  onEmployeeSelect,
  allowEmployeeSelection = false,
  variant = 'landing',
  showExpandable = false,
  className = ''
}: StandardServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (priceInCents: number) => {
    return `₡${Math.round(priceInCents / 100)}`;
  };

  const getDiscountPercentage = () => {
    if (originalPrice === 0) return 0;
    return Math.round((savings / originalPrice) * 100);
  };

  const hasDiscount = savings > 0;
  const hasCombo = type === 'combo' && comboServices.length > 1;

  // Filter available employees for this service/combo
  const availableEmployees = employees.filter(emp => {
    if (type === 'service') {
      return emp.employee_services.some(es => es.service_id === id);
    } else if (type === 'combo' && comboServices) {
      // For combos, check if employee can perform all services in the combo
      return comboServices.every(cs => 
        emp.employee_services.some(es => es.service_id === cs.service_id)
      );
    }
    return true;
  });

  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
      {imageUrl && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-card-foreground">{name}</h3>
          {variant === 'admin' && (onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {variant === 'reservation' && canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 flex-wrap">
            {duration && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {duration} min
              </Badge>
            )}
            {hasCombo && (
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                Combo
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <Percent className="h-3 w-3" />
                {getDiscountPercentage()}% OFF
              </Badge>
            )}
            {variant === 'admin' && isActive !== undefined && (
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Activo" : "Inactivo"}
              </Badge>
            )}
            {variant === 'admin' && category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
          <div className="text-right">
            {originalPrice !== finalPrice && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </div>
            )}
            <div className="font-bold text-lg text-primary">
              {formatPrice(finalPrice)}
            </div>
          </div>
        </div>

        {/* Combo Services List */}
        {hasCombo && showExpandable && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <span className="mr-2">Ver servicios incluidos</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                <p className="font-medium text-foreground">Incluye:</p>
                {comboServices.map((service, index) => (
                  <p key={index} className="ml-2">
                    • {service.name} {service.quantity && service.quantity > 1 && `(x${service.quantity})`}
                  </p>
                ))}
              </div>
              
              {/* Detailed pricing for combos with discounts */}
              {hasDiscount && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground line-through">
                      Precio original: {formatPrice(originalPrice)}
                    </span>
                    <Badge className="bg-green-500 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      {getDiscountPercentage()}% OFF
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Ahorra {formatPrice(savings)}
                    </span>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Employee Selection - only for reservation variant */}
        {allowEmployeeSelection && variant === 'reservation' && (
          <div className="space-y-2">
            <Label className="text-sm">Estilista</Label>
            <Select 
              value={selectedEmployee?.id || "any"} 
              onValueChange={(value) => {
                if (value === "any") {
                  onEmployeeSelect?.(null);
                } else {
                  const employee = availableEmployees.find(emp => emp.id === value);
                  onEmployeeSelect?.(employee || null);
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Cualquier estilista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquier estilista</SelectItem>
                {availableEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Action Button */}
        {onSelect && variant !== 'admin' && (
          <Button 
            className="w-full"
            onClick={onSelect}
          >
            {variant === 'reservation' ? 'Seleccionar' : 'Reservar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};