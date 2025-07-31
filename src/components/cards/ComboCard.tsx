import { useState } from "react";
import { BaseCard } from "./BaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Package, Sparkles } from "lucide-react";
import { Employee } from "./ServiceCard";

export interface ComboService {
  name: string;
  quantity?: number;
  service_id?: string;
}

export interface ComboCardProps {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  duration?: number;
  imageUrl?: string;
  
  // Combo specific
  comboServices: ComboService[];
  
  // Interaction
  onSelect?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  
  // Employee selection
  employees?: Employee[];
  selectedEmployee?: Employee | null;
  onEmployeeSelect?: (employee: Employee | null) => void;
  allowEmployeeSelection?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'reservation' | 'admin';
  showExpandable?: boolean;
  className?: string;
}

export const ComboCard = ({
  id,
  name,
  description,
  originalPrice,
  finalPrice,
  savings,
  duration,
  imageUrl,
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
}: ComboCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (priceInCents: number) => {
    return `₡${Math.round(priceInCents / 100)}`;
  };

  const getDiscountPercentage = () => {
    if (originalPrice === 0) return 0;
    return Math.round((savings / originalPrice) * 100);
  };

  // Filter available employees who can perform all services in the combo
  const availableEmployees = employees.filter(emp => 
    comboServices.every(cs => 
      emp.employee_services.some(es => es.service_id === cs.service_id)
    )
  );

  const cardContent = (
    <div className="flex justify-between items-end">
      <div className="flex flex-col gap-1">
        <Badge className="bg-blue-500 text-white text-xs">
          <Package className="h-2 w-2 mr-1" />
          COMBO
        </Badge>
      </div>
      
      <div className="text-right">
        <div className="space-y-0.5">
          <div className="text-xs text-white/80 line-through">
            {formatPrice(originalPrice)}
          </div>
          <div className="font-bold text-lg text-white drop-shadow-md">
            {formatPrice(finalPrice)}
          </div>
        </div>
      </div>
    </div>
  );

  const expandedContent = (
    <>
      {/* Duration badge */}
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
      {comboServices.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
          <p className="font-medium text-foreground">Incluye:</p>
          {comboServices.map((service, index) => (
            <p key={index} className="ml-2">
              • {service.name} {service.quantity && service.quantity > 1 && `(x${service.quantity})`}
            </p>
          ))}
        </div>
      )}

      {/* Combo Savings */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground line-through">
            Precio individual: {formatPrice(originalPrice)}
          </span>
          <Badge className="bg-blue-500 text-white">
            <Package className="h-3 w-3 mr-1" />
            {getDiscountPercentage()}% OFF
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-primary">
            {formatPrice(finalPrice)}
          </span>
          <span className="text-sm font-medium text-blue-600">
            Ahorra {formatPrice(savings)}
          </span>
        </div>
      </div>

      {/* Employee Selection */}
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
    </>
  );

  return (
    <BaseCard
      id={id}
      name={name}
      description={description}
      imageUrl={imageUrl}
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