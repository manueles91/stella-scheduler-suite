import { useBookingData } from "@/hooks/useBookingData";
import { CategoryFilter } from "@/components/booking/CategoryFilter";

export const CategoriesSection = () => {
  const { categories, selectedCategory, setSelectedCategory } = useBookingData();

  return (
    <section className="py-8 sm:py-12 bg-background border-b border-border/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
            Explora Nuestros Servicios
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Selecciona una categoría para descubrir nuestros tratamientos especializados
          </p>
        </div>
        
        <CategoryFilter 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategorySelect={setSelectedCategory}
        />
      </div>
    </section>
  );
};