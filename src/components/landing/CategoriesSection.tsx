import { useBookingData } from "@/hooks/useBookingData";
import { CategoryFilter } from "@/components/booking/CategoryFilter";
export const CategoriesSection = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory
  } = useBookingData();
  return <section className="py-8 sm:py-12 bg-background border-b border-border/20">
      <div className="container mx-auto px-4 sm:px-6">
        
        
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      </div>
    </section>;
};