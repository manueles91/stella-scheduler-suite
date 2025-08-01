import { ServiceCard as ServiceCardComponent } from "@/components/cards/ServiceCard";
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
  const hasDiscount = service.savings_cents > 0;

  const handleSelect = () => {
    onSelect(service);
  };

  const comboServices = service.combo_services?.map(cs => ({
    name: cs.services.name,
    quantity: cs.quantity,
    service_id: cs.service_id
  })) || [];

  // Convert Employee types
  const convertedEmployees = employees.map(emp => ({
    id: emp.id,
    full_name: emp.full_name,
    employee_services: emp.employee_services
  }));

  const convertedSelectedEmployee = selectedEmployee ? {
    id: selectedEmployee.id,
    full_name: selectedEmployee.full_name,
    employee_services: selectedEmployee.employee_services
  } : null;

  const cardProps = {
    id: service.id,
    name: service.name,
    description: service.description,
    originalPrice: service.original_price_cents,
    finalPrice: service.final_price_cents,
    savings: service.savings_cents,
    duration: service.duration_minutes,
    imageUrl: service.image_url,
    onSelect: handleSelect,
    employees: convertedEmployees,
    selectedEmployee: isSelected ? convertedSelectedEmployee : null,
    onEmployeeSelect,
    allowEmployeeSelection: allowEmployeeSelection && isSelected,
    variant: 'reservation' as const,
    showExpandable: true,
    className: `${isSelected ? 'border-primary ring-2 ring-primary shadow-lg' : ''}`,
    type: service.type,
    comboServices: service.type === 'combo' ? comboServices : undefined,
    discountType: hasDiscount ? service.appliedDiscount?.discount_type : undefined,
    discountValue: hasDiscount ? service.appliedDiscount?.discount_value : undefined
  };

  return <ServiceCardComponent {...cardProps} />;
};