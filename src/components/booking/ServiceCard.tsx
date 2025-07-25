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
  const hasDiscount = service.savings_cents > 0;

  const handleSelect = () => {
    onSelect(service);
  };

  const comboServices = service.combo_services?.map(cs => ({
    name: cs.services.name,
    quantity: cs.quantity,
    service_id: cs.service_id
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
        employees={employees}
        selectedEmployee={isSelected ? selectedEmployee : null}
        onEmployeeSelect={onEmployeeSelect}
        allowEmployeeSelection={allowEmployeeSelection && isSelected}
        onSelect={handleSelect}
        variant="reservation"
        showExpandable={true}
        className={`${isSelected ? 'border-primary' : ''}`}
      />
    </div>
  );
};