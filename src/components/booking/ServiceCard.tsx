import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User } from "lucide-react";
import { Service, Employee } from "@/types/booking";

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (service: Service) => void;
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
  const availableEmployees = employees.filter(emp => 
    emp.employee_services.some(es => es.service_id === service.id)
  );

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
          <div className="absolute bottom-4 left-4 right-4">
            <h4 className="font-semibold text-lg text-white drop-shadow-lg">{service.name}</h4>
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="space-y-3">
          {!service.image_url && (
            <h4 className="font-semibold text-lg">{service.name}</h4>
          )}
          <p className="text-sm text-muted-foreground">{service.description}</p>
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} min
            </Badge>
            <span className="font-bold text-lg text-primary">{formatPrice(service.price_cents)}</span>
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