import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, Sparkles, Package, ChevronDown } from "lucide-react";

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
  canEdit?: boolean;
  
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
  canEdit = false,
  employees = [],
  selectedEmployee,
  onEmployeeSelect,
  allowEmployeeSelection = false,
  variant = 'landing',
  showExpandable = true,
  className = ""
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
  const isCombo = type === 'combo' || (comboServices && comboServices.length > 1);

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

  const getDiscountBadge = () => {
    if (isCombo) {
      return (
        <Badge className="bg-blue-500 text-white text-xs">
          <Package className="h-2 w-2 mr-1" />
          COMBO
        </Badge>
      );
    }
    
    if (hasDiscount) {
      const percentage = getDiscountPercentage();
      return (
        <Badge className="bg-red-500 text-white text-xs">
          <Sparkles className="h-2 w-2 mr-1" />
          {discountType === 'percentage' && discountValue 
            ? `${discountValue}%` 
            : `${percentage}%`
          } OFF
        </Badge>
      );
    }

    return null;
  };

  const CardWrapper = showExpandable ? Collapsible : 'div';
  const cardProps = showExpandable ? { 
    open: isExpanded, 
    onOpenChange: setIsExpanded 
  } : {};

  const cardContent = (
    <Card 
      className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isExpanded ? 'h-auto' : 'h-32'
      } ${className}`}
      onClick={!showExpandable ? onSelect : undefined}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/20" />
      </div>

      {/* Collapsed Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
        {/* Top Row - Service Name */}
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg font-bold leading-tight text-white drop-shadow-md">
            {name}
          </h3>
          {showExpandable && (
            <CollapsibleTrigger asChild>
              <div className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          )}
        </div>

        {/* Bottom Row - Price and Discount Badge */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            {getDiscountBadge()}
          </div>
          
          <div className="text-right">
            {hasDiscount ? (
              <div className="space-y-0.5">
                <div className="text-xs text-white/80 line-through">
                  {formatPrice(originalPrice)}
                </div>
                <div className="font-bold text-lg text-white drop-shadow-md">
                  {formatPrice(finalPrice)}
                </div>
              </div>
            ) : (
              <div className="font-bold text-lg text-white drop-shadow-md">
                {formatPrice(finalPrice)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {showExpandable && (
        <CollapsibleContent>
          <div className="relative z-10 bg-background/95 backdrop-blur-sm border-t p-4 space-y-4">
            {/* Duration badge - only in expanded view */}
            {duration && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-2 w-2 mr-1" />
                  {duration} min
                </Badge>
              </div>
            )}
            
            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            
            {/* Combo Services List */}
            {isCombo && comboServices && comboServices.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                <p className="font-medium text-foreground">Incluye:</p>
                {comboServices.map((service, index) => (
                  <p key={index} className="ml-2">
                    • {service.name} {service.quantity && service.quantity > 1 && `(x${service.quantity})`}
                  </p>
                ))}
              </div>
            )}

            {/* Detailed pricing for discounts */}
            {hasDiscount && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground line-through">
                    Precio original: {formatPrice(originalPrice)}
                  </span>
                  <Badge className="bg-green-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {employee.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {employee.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
                  {variant === 'admin' ? 'Ver' : variant === 'reservation' ? 'Seleccionar' : 'Reservar'}
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
          </div>
        </CollapsibleContent>
      )}
    </Card>
  );

  return showExpandable ? (
    <CardWrapper {...cardProps}>
      {cardContent}
    </CardWrapper>
  ) : (
    cardContent
  );
};