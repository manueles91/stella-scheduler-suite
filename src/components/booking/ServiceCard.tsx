import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, User, Sparkles, Package, ChevronDown } from "lucide-react";
import { BookableItem, Employee } from "@/types/booking";

interface ServiceCardProps {
  service: BookableItem;
  isSelected: boolean;
  onSelect: (service: BookableItem) => void;
  employees: Employee[];
  selectedEmployee: Employee | null;
  onEmployeeSelect: (employee: Employee | null) => void;
  allowEmployeeSelection?: boolean;
  formatPrice: (cents: number) => string;
}

export const ServiceCard = ({
  service,
  isSelected,
  onSelect,
  employees,
  selectedEmployee,
  onEmployeeSelect,
  allowEmployeeSelection = true,
  formatPrice
}: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const availableEmployees = employees.filter(emp => {
    if (service.type === 'service') {
      return emp.employee_services.some(es => es.service_id === service.id);
    } else {
      // For combos, check if employee can perform all services in the combo
      return service.combo_services?.every(cs => 
        emp.employee_services.some(es => es.service_id === cs.service_id)
      ) || false;
    }
  });

  const hasDiscount = service.savings_cents > 0;
  const isCombo = service.type === 'combo' && service.combo_services && service.combo_services.length > 1;

  // Calculate actual discount percentage based on savings
  const calculateDiscountPercentage = () => {
    if (!hasDiscount || service.original_price_cents === 0) return 0;
    return Math.round((service.savings_cents / service.original_price_cents) * 100);
  };

  const actualDiscountPercentage = calculateDiscountPercentage();



  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card 
        className={`transition-all hover:shadow-lg overflow-hidden ${
          isSelected ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
      >
        {/* Compact header with image thumbnail or icon */}
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer p-4 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              {/* Small image thumbnail or icon */}
              <div className="relative flex-shrink-0">
                {service.image_url ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <img 
                      src={service.image_url} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Small badges for compact view */}
                    {hasDiscount && (
                      <div className="absolute -top-1 -right-1">
                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                          <Sparkles className="h-2 w-2 mr-0.5" />
                          {actualDiscountPercentage}%
                        </Badge>
                      </div>
                    )}
                    {isCombo && (
                      <div className="absolute -top-1 -left-1">
                        <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                          <Package className="h-2 w-2" />
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center relative">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                    {hasDiscount && (
                      <div className="absolute -top-1 -right-1">
                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                          {actualDiscountPercentage}%
                        </Badge>
                      </div>
                    )}
                    {isCombo && (
                      <div className="absolute -top-1 -left-1">
                        <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                          <Package className="h-2 w-2" />
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{service.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-2 w-2 mr-1" />
                        {service.duration_minutes}min
                      </Badge>
                      {isCombo && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          COMBO
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-right">
                      {hasDiscount ? (
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground line-through">
                            {formatPrice(service.original_price_cents)}
                          </div>
                          <div className="font-bold text-sm text-primary">
                            {formatPrice(service.final_price_cents)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold text-sm text-primary">
                          {formatPrice(service.final_price_cents)}
                        </div>
                      )}
                    </div>
                    
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expandable content */}
        <CollapsibleContent>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3 border-t pt-3">
              {/* Full image if available */}
              {service.image_url && (
                <div className="relative h-32 w-full rounded-lg overflow-hidden">
                  <img 
                    src={service.image_url} 
                    alt={service.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}
              
              {/* Description */}
              <p className="text-sm text-muted-foreground">{service.description}</p>
              
              {/* Combo Services List */}
              {isCombo && service.combo_services && (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                  <p className="font-medium text-foreground">Incluye:</p>
                  {service.combo_services.map((cs, index) => (
                    <p key={index} className="ml-2">
                      • {cs.services.name} {cs.quantity > 1 && `(x${cs.quantity})`}
                    </p>
                  ))}
                </div>
              )}

              {/* Detailed pricing */}
              {hasDiscount && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground line-through">
                      Precio original: {formatPrice(service.original_price_cents)}
                    </span>
                    <Badge className="bg-green-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {actualDiscountPercentage}% OFF
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(service.final_price_cents)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Ahorra {formatPrice(service.savings_cents)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Employee selection */}
              {allowEmployeeSelection && (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Label className="text-sm">Estilista</Label>
                  <Select 
                    value={isSelected ? selectedEmployee?.id || "any" : "any"} 
                    onValueChange={(value) => {
                      if (value === "any") {
                        onEmployeeSelect(null);
                      } else {
                        const employee = availableEmployees.find(emp => emp.id === value);
                        onEmployeeSelect(employee || null);
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

              {/* Select button */}
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(service);
                  }}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isSelected ? 'Seleccionado' : 'Seleccionar servicio'}
                </button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}; 