import { useState } from "react";
import React from "react";
import { BaseCard } from "./BaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Sparkles, Package, ChevronDown } from "lucide-react";

export interface Employee {
  id: string;
  full_name: string;
  employee_services: {
    service_id: string;
  }[];
}

export interface ServiceCardProps {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  duration?: number;
  imageUrl?: string;
  
  // Type and discount info
  type?: 'service' | 'combo' | 'discount';
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
  
  // Employee selection
  employees?: Employee[];
  selectedEmployee?: Employee | null;
  onEmployeeSelect?: (employee: Employee | null) => void;
  allowEmployeeSelection?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'reservation' | 'admin';
  showExpandable?: boolean;
  className?: string;
  
  // Admin-specific badges and buttons
  adminBadges?: React.ReactNode;
  adminButtons?: React.ReactNode;
}

export const ServiceCard = ({
  id,
  name,
  description,
  originalPrice,
  finalPrice,
  savings,
  duration,
  imageUrl,
  type = 'service',
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
  className = "",
  adminBadges,
  adminButtons
}: ServiceCardProps) => {
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

  // Filter available employees for this service
  const availableEmployees = employees.filter(emp => 
    emp.employee_services.some(es => es.service_id === id)
  );

  const getDiscountBadge = () => {
    if (isCombo) {
      return (
        <Badge className="bg-blue-500 text-white text-xs">
          <Package className="h-2 w-2 mr-1" />
          COMBO
        </Badge>
      );
    }
    
    if (!hasDiscount) return null;
    
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
  };

  const cardContent = (
    <div className="absolute bottom-4 right-4">
      {/* Only show price if not expanded to avoid redundancy */}
      {!isExpanded && (
        hasDiscount ? (
          <div className="space-y-1">
            <div className="text-sm text-white/80 line-through">
              {formatPrice(originalPrice)}
            </div>
            <div className="font-bold text-2xl text-white drop-shadow-md">
              {formatPrice(finalPrice)}
            </div>
          </div>
        ) : (
          <div className="font-bold text-2xl text-white drop-shadow-md">
            {formatPrice(finalPrice)}
          </div>
        )
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {/* Row 1: Service name and admin buttons + collapse button */}
      <div className="flex justify-between items-start">
        <h3 className="font-serif text-2xl font-bold text-white drop-shadow-md">
          {name}
        </h3>
        {/* Admin buttons + collapse button positioned together */}
        <div className="flex gap-1 items-center">
          {adminButtons}
          {/* Collapse button positioned to the right of admin buttons */}
          <button 
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/20 backdrop-blur-sm border border-white/30"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          >
            <ChevronDown className="h-4 w-4 text-white rotate-180" />
          </button>
        </div>
      </div>

      {/* Row 2: Badges (left) + Duration (right) */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* Show discount badge in expanded state */}
          {variant === 'admin' && getDiscountBadge()}
          {/* Show admin badges in expanded state */}
          {adminBadges}
        </div>
        {duration && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-2 w-2 mr-1" />
              {duration} min
            </Badge>
          </div>
        )}
      </div>

      {/* Row 3: Description (left) + Price only (right) */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {description && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <p className="text-sm text-gray-800">{description}</p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg min-w-[200px]">
            {/* Final price only - most prominent */}
            <div className="text-center mb-3">
              <div className="font-bold text-2xl text-primary">
                {formatPrice(finalPrice)}
              </div>
            </div>
            
            {/* Nominal savings only */}
            {hasDiscount && (
              <div className="text-center">
                <span className="text-sm font-medium text-green-600">
                  Ahorra {formatPrice(savings)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Combo Services Display - Only for combo cards */}
      {isCombo && comboServices && comboServices.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <Label className="text-sm text-gray-800 font-semibold">Servicios Incluidos</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {comboServices.map((service, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {service.name}
                {service.quantity && service.quantity > 1 && ` x${service.quantity}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Employee Selection - Only for reservation variant */}
      {allowEmployeeSelection && variant === 'reservation' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg space-y-2">
          <Label className="text-sm text-gray-800">Estilista</Label>
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
      
      {/* Row 4: CTA (bottom) - smaller horizontally */}
      <div className="flex justify-center pt-2">
        {onSelect && (
          <Button 
            className="w-32 bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg"
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
            className="w-24 shadow-lg bg-white/90 backdrop-blur-sm"
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
      adminBadges={!isExpanded ? adminBadges : undefined} // Only show admin badges in collapsed state
      discountBadge={!isExpanded && variant === 'admin' ? getDiscountBadge() : undefined} // Show discount badge in collapsed state
      adminButtons={adminButtons}
    >
      {cardContent}
    </BaseCard>
  );
};