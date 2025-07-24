import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StandardServiceCard } from "@/components/cards/StandardServiceCard";
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

  const handleSelect = () => {
    onSelect(service);
  };

  const comboServices = service.combo_services?.map(cs => ({
    name: cs.services.name,
    quantity: cs.quantity
  })) || [];

  return (
    <div className={`${isSelected ? 'ring-2 ring-primary shadow-lg' : ''} rounded-lg overflow-hidden`}>
      <StandardServiceCard
        id={service.id}
        name={service.name}
        description={service.description}
        originalPrice={service.original_price_cents}
        finalPrice={service.final_price_cents}
        savings={service.savings_cents}
        duration={service.duration_minutes}
        imageUrl={service.image_url}
        type={service.type}
        discountType={hasDiscount ? service.appliedDiscount?.discount_type : undefined}
        discountValue={hasDiscount ? service.appliedDiscount?.discount_value : undefined}
        comboServices={comboServices}
        onSelect={handleSelect}
        variant="reservation"
        showExpandable={true}
        className={`${isSelected ? 'border-primary' : ''}`}
      />
      
      {/* Employee selection - separate from card for better UX */}
      {allowEmployeeSelection && (
        <div className="p-4 bg-card border-t space-y-2">
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
    </div>
  );
};