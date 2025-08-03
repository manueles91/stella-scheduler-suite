import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFilter } from "../CategoryFilter";
import { MemoizedServiceCard } from "../../optimized/MemoizedServiceCard";
import { BookableItem, Employee } from "@/types/booking";

interface ServiceSelectionStepProps {
  bookableItems: BookableItem[];
  categories: any[];
  employees: Employee[];
  selectedService: BookableItem | null;
  selectedEmployee: Employee | null;
  selectedCategory: string | null;
  showCategories: boolean;
  allowEmployeeSelection: boolean;
  onServiceSelect: (service: BookableItem) => void;
  onEmployeeSelect: (employee: Employee | null) => void;
  onCategorySelect: (category: string | null) => void;
  formatPrice: (cents: number) => string;
}

export const ServiceSelectionStep = ({
  bookableItems,
  categories,
  employees,
  selectedService,
  selectedEmployee,
  selectedCategory,
  showCategories,
  allowEmployeeSelection,
  onServiceSelect,
  onEmployeeSelect,
  onCategorySelect,
  formatPrice,
}: ServiceSelectionStepProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Elige tu servicio</CardTitle>
        <CardDescription>Selecciona el servicio o combo que deseas reservar</CardDescription>
      </CardHeader>
      <CardContent>
        {showCategories && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={onCategorySelect}
            className="mb-6"
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookableItems.map((service) => (
            <MemoizedServiceCard
              key={service.id}
              service={service}
              isSelected={selectedService?.id === service.id}
              onSelect={onServiceSelect}
              employees={employees}
              selectedEmployee={selectedEmployee}
              onEmployeeSelect={onEmployeeSelect}
              allowEmployeeSelection={allowEmployeeSelection}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};