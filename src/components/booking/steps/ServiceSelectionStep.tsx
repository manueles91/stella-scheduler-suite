import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CategoryFilter } from "../CategoryFilter";
import { MemoizedServiceCard } from "../../optimized/MemoizedServiceCard";
import { BookableItem, Employee } from "@/types/booking";

interface ServiceSelectionStepProps {
  allBookableItems: BookableItem[];
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
  onBack: () => void;
  formatPrice: (cents: number) => string;
}

export const ServiceSelectionStep = ({
  allBookableItems,
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
  onBack,
  formatPrice
}: ServiceSelectionStepProps) => {
  // Filter items based on selected category
  const filteredItems = selectedCategory ? allBookableItems.filter(item => {
    // Handle "promociones" category - show items with discounts or combos
    if (selectedCategory === 'promociones') {
      return item.type === 'combo' || (item.type === 'service' && item.appliedDiscount);
    }
    
    // Handle regular category filtering
    if (item.type === 'service') {
      return item.category_id === selectedCategory;
    } else if (item.type === 'combo' && item.combo_services) {
      return item.combo_services.some(cs => {
        const service = allBookableItems.find(s => s.id === cs.service_id);
        return service && service.category_id === selectedCategory;
      });
    }
    return false;
  }) : allBookableItems;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Elige tu servicio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showCategories && <CategoryFilter categories={categories} selectedCategory={selectedCategory} onCategorySelect={onCategorySelect} className="w-full" />}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(service => (
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
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay servicios disponibles en esta categoría
          </div>
        )}
        
        <div className="flex justify-start pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};