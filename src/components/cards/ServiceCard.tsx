import { useState } from "react";
import React from "react";
import { BaseCard } from "./BaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Sparkles, Package, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Pricing behavior
  variablePrice?: boolean;
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
  adminButtons,
  variablePrice = false,
}: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

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
      const percentage = getDiscountPercentage();
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

  // Duration display for expanded state
  const getDurationDisplay = () => {
    if (!duration) return null;
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1 text-gray-800 text-sm">
          <Clock className="h-3 w-3" />
          <span>{duration} min</span>
        </div>
      </div>
    );
  };

  const cardContent = (
    <div className="absolute bottom-4 right-4">
      {/* Only show price if not expanded to avoid redundancy */}
      {!isExpanded && (
        variablePrice && !isCombo ? (
          <Badge className="bg-white/80 text-gray-900 text-xs backdrop-blur-sm">Precio variable</Badge>
        ) : (
          hasDiscount ? (
            <div className="space-y-1">
              <div className={`text-white/80 line-through ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                {formatPrice(originalPrice)}
              </div>
              <div className={`font-bold text-white drop-shadow-md ${
                isMobile ? 'text-lg sm:text-2xl' : 'text-2xl'
              }`}>
                {formatPrice(finalPrice)}
              </div>
            </div>
          ) : (
            <div className={`font-bold text-white drop-shadow-md ${
              isMobile ? 'text-lg sm:text-2xl' : 'text-2xl'
            }`}>
              {formatPrice(finalPrice)}
            </div>
          )
        )
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {/* Row 1: Service name and admin buttons + collapse button */}
      <div className="flex justify-between items-start">
                 <h3 className={`font-serif font-bold text-white drop-shadow-md ${
           isMobile ? 'text-xl sm:text-3xl' : 'text-3xl'
         }`}>
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

      {/* Row 2: Duration and Badges */}
      <div className="flex justify-between items-center">
        {/* Duration on the left - only for non-combo cards */}
        {!isCombo && (
          <div className="flex justify-start">
            {getDurationDisplay()}
          </div>
        )}
        {/* Badges on the right */}
        <div className="flex gap-2 flex-wrap">
          {/* Show combo badge for combos */}
          {isCombo && (
            <Badge className="bg-blue-500 text-white text-xs">
              <Package className="h-2 w-2 mr-1" />
              COMBO
            </Badge>
          )}
          {/* Show discount percentage badge for combos */}
          {isCombo && hasDiscount && (
            <Badge className="bg-red-500 text-white text-xs">
              <Sparkles className="h-2 w-2 mr-1" />
              {getDiscountPercentage()}% OFF
            </Badge>
          )}
          {/* Show discount badge for non-combo items */}
          {!isCombo && getDiscountBadge()}
          {/* Show admin badges in expanded state - only for admins */}
          {adminBadges}
        </div>
      </div>

             {/* Row 3: Description and Price - Side by side (for non-combo cards) */}
       {!isCombo && (
         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
           {/* Description - Left side */}
           <div className="flex-1 min-w-0">
                           {description && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg">
                  <p className="text-xs sm:text-sm text-gray-900 leading-relaxed">{description}</p>
                </div>
              )}
           </div>
           {/* Price - Right side */}
            <div className="flex-shrink-0 flex justify-center">
             <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg inline-block">
               {/* Final price - or variable pricing label */}
               <div className="text-center">
                 {variablePrice ? (
                   <Badge className="bg-gray-900 text-white text-xs">Precio variable</Badge>
                 ) : (
                   <div className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900">
                     {formatPrice(finalPrice)}
                   </div>
                 )}
               </div>
               {!variablePrice && hasDiscount && (
                 <div className="text-center mt-1">
                   <span className="font-medium text-xs sm:text-sm text-green-700">
                     Ahorra {formatPrice(savings)}
                   </span>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Description for combo cards - positioned before Servicios Incluidos */}
       {isCombo && description && (
         <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg">
           <p className="text-xs sm:text-sm text-gray-900 leading-relaxed">{description}</p>
         </div>
       )}

       {/* Combo Services Display - Only for combo cards */}
       {isCombo && comboServices && comboServices.length > 0 && (
         <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-lg">
           <Label className={`text-gray-900 font-semibold ${
             isMobile ? 'text-sm' : 'text-sm'
           }`}>Servicios Incluidos</Label>
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



       {/* Price section for combo cards - positioned below Servicios Incluidos */}
       {isCombo && (
         <div className="flex justify-center">
           <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg inline-block">
             {/* Final price - responsive sizing */}
             <div className="text-center">
               <div className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900">
                 {formatPrice(finalPrice)}
               </div>
             </div>
             
             {/* Nominal savings - responsive sizing */}
             {hasDiscount && (
               <div className="text-center mt-1">
                 <span className="font-medium text-xs sm:text-sm text-green-700">
                   Ahorra {formatPrice(savings)}
                 </span>
               </div>
             )}
           </div>
         </div>
       )}

      {/* Employee Selection - Only for reservation variant */}
      {allowEmployeeSelection && variant === 'reservation' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-lg space-y-2">
          <Label className={`text-gray-900 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>Estilista</Label>
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
      
      {/* Row 4: CTA (bottom) - Only show for reservation and landing variants */}
      {(variant === 'reservation' || variant === 'landing') && onSelect && (
        <div className="flex justify-center pt-2">
          <Button 
            className={`bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg ${
              isMobile ? 'w-1/2 sm:w-16' : 'w-16'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {variant === 'reservation' ? 'Seleccionar' : 'Reservar'}
          </Button>
        </div>
      )}
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
      // Admin badges in collapsed state (replacing duration) - only admin-specific badges
      adminBadges={!isExpanded ? (
        <div className="flex gap-1 flex-wrap">
          {adminBadges}
        </div>
      ) : undefined}
             // Discount badge always visible (for everyone) in collapsed state
       discountBadge={!isExpanded ? (
         isCombo ? (
           <div className="flex gap-1 flex-wrap">
             <Badge className="bg-blue-500 text-white text-xs">
               <Package className="h-2 w-2 mr-1" />
               COMBO
             </Badge>
             {hasDiscount && (
               <Badge className="bg-red-500 text-white text-xs">
                 <Sparkles className="h-2 w-2 mr-1" />
                 {getDiscountPercentage()}% OFF
               </Badge>
             )}
           </div>
         ) : getDiscountBadge()
       ) : undefined}
      adminButtons={adminButtons}
    >
      {cardContent}
    </BaseCard>
  );
};