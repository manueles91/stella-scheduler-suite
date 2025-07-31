import { memo, useCallback } from "react";
import { ServiceCard } from "../booking/ServiceCard";
import { BookableItem, Employee } from "@/types/booking";

interface MemoizedServiceCardProps {
  service: BookableItem;
  isSelected: boolean;
  onSelect: (service: BookableItem) => void;
  employees: Employee[];
  selectedEmployee: Employee | null;
  onEmployeeSelect: (employee: Employee | null) => void;
  allowEmployeeSelection?: boolean;
  formatPrice: (cents: number) => string;
}

const MemoizedServiceCardComponent = ({
  service,
  isSelected,
  onSelect,
  employees,
  selectedEmployee,
  onEmployeeSelect,
  allowEmployeeSelection = true,
  formatPrice
}: MemoizedServiceCardProps) => {
  const handleSelect = useCallback(() => {
    onSelect(service);
  }, [onSelect, service]);

  const handleEmployeeSelect = useCallback((employee: Employee | null) => {
    onEmployeeSelect(employee);
  }, [onEmployeeSelect]);

  return (
    <ServiceCard
      service={service}
      isSelected={isSelected}
      onSelect={handleSelect}
      employees={employees}
      selectedEmployee={selectedEmployee}
      onEmployeeSelect={handleEmployeeSelect}
      allowEmployeeSelection={allowEmployeeSelection}
      formatPrice={formatPrice}
    />
  );
};

export const MemoizedServiceCard = memo(MemoizedServiceCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.service.id === nextProps.service.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedEmployee?.id === nextProps.selectedEmployee?.id &&
    prevProps.allowEmployeeSelection === nextProps.allowEmployeeSelection &&
    prevProps.employees.length === nextProps.employees.length
  );
});