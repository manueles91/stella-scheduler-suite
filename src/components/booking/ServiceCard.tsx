import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, Sparkles, Package } from "lucide-react";
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
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={() => onSelect(service)}
    >
      {service.image_url && (
        <div className="relative h-48 w-full">
          <img 
            src={service.image_url} 
            alt={service.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-red-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                {actualDiscountPercentage}% OFF
              </Badge>
            </div>
          )}

          {/* Combo Badge - only show for actual combos with multiple services */}
          {isCombo && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-blue-500 text-white">
                <Package className="h-3 w-3 mr-1" />
                COMBO
              </Badge>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <h4 className="font-semibold text-lg text-white drop-shadow-lg">{service.name}</h4>
          </div>
        </div>
      )}

      {/* Discount Badge for cards without images */}
      {!service.image_url && hasDiscount && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-red-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            {actualDiscountPercentage}% OFF
          </Badge>
        </div>
      )}

      {/* Combo Badge for cards without images - only show for actual combos */}
      {!service.image_url && isCombo && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-blue-500 text-white">
            <Package className="h-3 w-3 mr-1" />
            COMBO
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        <div className="space-y-3">
          {!service.image_url && (
            <h4 className="font-semibold text-lg">{service.name}</h4>
          )}
          
          <p className="text-sm text-muted-foreground">{service.description}</p>
          
          {/* Combo Services List - only show for actual combos */}
          {isCombo && service.combo_services && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Incluye:</p>
              {service.combo_services.map((cs, index) => (
                <p key={index} className="ml-2">
                  • {cs.services.name} {cs.quantity > 1 && `(x${cs.quantity})`}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} min
            </Badge>
            
            <div className="text-right">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(service.original_price_cents)}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Ahorra {formatPrice(service.savings_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(service.final_price_cents)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {service.appliedDiscount?.discount_type === 'percentage' 
                        ? `${actualDiscountPercentage}%` 
                        : `${formatPrice(service.appliedDiscount?.discount_value || 0)}`} OFF
                    </span>
                  </div>
                </div>
              ) : (
                <span className="font-bold text-lg text-primary">
                  {formatPrice(service.final_price_cents)}
                </span>
              )}
            </div>
          </div>
          
          {allowEmployeeSelection && (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <Label>Estilista</Label>
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
                <SelectTrigger>
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
        </div>
      </CardContent>
    </Card>
  );
}; 